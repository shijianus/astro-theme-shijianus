import type { AppEnv } from '../../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../../_lib/http.ts';
import { enforceRateLimit, envLimit } from '../../_lib/rate-limit.ts';
import { sendFormTelegramNotification, type FormSubmissionPayload } from '../../_lib/form-notify.ts';
import {
  validateFriendApplicationInput,
  type ApplyApiResponseShape,
} from '../../../src/lib/friend-apply.ts';

export async function onRequest(context: {
  request: Request;
  env: AppEnv;
  waitUntil?: (promise: Promise<unknown>) => void;
}): Promise<Response> {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  // Abuse protection: rate limit submissions per IP
  const rateLimit = await enforceRateLimit({
    namespace: 'friends-apply',
    request,
    env,
    limit: envLimit(env, 'FRIENDS_APPLY_LIMIT' as keyof AppEnv, 6),
    windowSeconds: 600,
    scope: 'ip',
  });

  if (!rateLimit.allowed) {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        accepted: false,
        persisted: false,
        notified: false,
        reviewStatus: 'not_recorded',
        error: '提交过于频繁，请稍后再试（每 10 分钟最多提交 6 次）。',
      } satisfies ApplyApiResponseShape,
      { status: 429 }
    );
  }

  const rawPayload = await safeReadJson<FormSubmissionPayload & { siteInput?: string }>(request);
  if (!rawPayload || typeof rawPayload !== 'object') {
    return jsonResponse(request, env, { ok: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const validation = validateFriendApplicationInput(
    {
      name: rawPayload.name,
      url: rawPayload.url,
      siteInput: rawPayload.siteInput || rawPayload.markdown_link,
      avatar: rawPayload.avatar,
      desc: rawPayload.desc,
      category: rawPayload.category,
      contact: rawPayload.contact,
      formId: rawPayload.formId,
      title: rawPayload.title,
      source: rawPayload.source,
    },
    {
      requireAvatar: true,
      requireDesc: true,
      allowRelativeAvatar: false,
    }
  );

  if (!validation.ok || !validation.data) {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        accepted: false,
        persisted: false,
        notified: false,
        reviewStatus: 'not_recorded',
        error: validation.error || '提交内容未通过安全与字段校验',
        fieldErrors: validation.fieldErrors,
      } satisfies ApplyApiResponseShape,
      { status: 400 }
    );
  }

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';
  const geoCountry = request.headers.get('cf-ipcountry') || 'GLOBAL';

  const submission: FormSubmissionPayload = {
    ...validation.data,
  };

  const submissionId = `apply_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 1. Database persistence check (never claim persisted unless D1 run actually succeeds)
  let persisted = false;
  let storageStatus: 'saved' | 'unavailable' | 'failed' = env.DB ? 'failed' : 'unavailable';

  if (env.DB) {
    try {
      const dbResult = await env.DB.prepare(
        `INSERT INTO form_submissions (id, form_id, data, ip, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          submissionId,
          submission.formId,
          JSON.stringify(submission),
          clientIp,
          'pending',
          Math.floor(Date.now() / 1000)
        )
        .run();

      if (dbResult && dbResult.success !== false) {
        persisted = true;
        storageStatus = 'saved';
      } else {
        storageStatus = 'failed';
      }
    } catch (dbErr) {
      storageStatus = 'failed';
      console.warn('[FriendsApply] D1 insert failed:', dbErr instanceof Error ? dbErr.message : 'unknown error');
    }
  }

  // 2. Dispatch Telegram notification (never claim notified unless Telegram returns ok: true)
  let notified = false;
  let notifyStatus: 'sent' | 'unconfigured' | 'failed' = 'failed';

  const hasTgCreds = Boolean(
    (env.TELEGRAM_BOT_TOKEN || (typeof process !== 'undefined' ? process.env?.TELEGRAM_BOT_TOKEN : '')) &&
    (env.TELEGRAM_CHAT_ID || (typeof process !== 'undefined' ? process.env?.TELEGRAM_CHAT_ID : ''))
  );

  if (!hasTgCreds) {
    notifyStatus = 'unconfigured';
  } else {
    const tgResult = await sendFormTelegramNotification(env, submission, clientIp, geoCountry);
    notified = Boolean(tgResult.ok);
    notifyStatus = notified ? 'sent' : 'failed';
  }

  // 3. Truthful failure if NEITHER persistence NOR notification succeeded
  if (!persisted && !notified) {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        accepted: true,
        degraded: true,
        persisted: false,
        notified: false,
        storageStatus,
        notifyStatus,
        reviewStatus: 'not_recorded',
        submissionId,
        error:
          storageStatus === 'failed'
            ? '服务端数据库写入失败，且站长即时通知未能送达。本次申请未被记录，请稍后重试或通过邮件联系。'
            : '当前运行环境未完成数据库持久化且通知通道未送达，本次申请未能保存，请稍后重试或通过邮件联系。',
      } satisfies ApplyApiResponseShape,
      { status: 503 }
    );
  }

  // 4. Truthful success / degraded partial-success response
  const degraded = !persisted || !notified;
  let message = '申请已写入服务端数据库（D1）并已发送通知，等待站长人工审核（尚未正式收录）。';
  if (persisted && !notified) {
    message = '申请已保存至服务端数据库（D1），但即时通知未送达；已进入人工审核队列。';
  } else if (!persisted && notified) {
    message = '站长即时通知已发送（Telegram），但当前环境未能写入数据库（D1），建议保留填写信息备份。';
  }

  return jsonResponse(
    request,
    env,
    {
      ok: true,
      accepted: true,
      degraded,
      persisted,
      notified,
      storageStatus,
      notifyStatus,
      reviewStatus: 'pending_review',
      status: 'pending_review',
      submissionId,
      message,
    } satisfies ApplyApiResponseShape,
    { status: 200 }
  );
}
