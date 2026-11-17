import type { AppEnv } from '../../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../../_lib/http.ts';
import { enforceRateLimit, envLimit } from '../../_lib/rate-limit.ts';
import { sendFormTelegramNotification, type FormSubmissionPayload } from '../../_lib/form-notify.ts';
import {
  sanitizeGeneralFormPayload,
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

  const rateLimit = await enforceRateLimit({
    namespace: 'forms-submit',
    request,
    env,
    limit: envLimit(env, 'FORMS_SUBMIT_LIMIT' as keyof AppEnv, 8),
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
        error: '提交过于频繁，请稍后再试。',
      } satisfies ApplyApiResponseShape,
      { status: 429 }
    );
  }

  const rawPayload = await safeReadJson<Record<string, unknown>>(request);
  if (!rawPayload || typeof rawPayload !== 'object') {
    return jsonResponse(request, env, { ok: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const validation = sanitizeGeneralFormPayload(rawPayload);
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
        error: validation.error || '表单内容未通过安全校验',
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

  const clean = validation.data;
  const submission: FormSubmissionPayload = {
    formId: clean.formId,
    title: clean.title,
    name: clean.name,
    url: clean.url,
    avatar: clean.avatar,
    desc: clean.desc,
    category: clean.category,
    contact: clean.contact,
    source: clean.source,
    fields: clean.fields,
  };

  const submissionId = `form_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 1. Record to D1 if available
  let persisted = false;
  let storageStatus: 'saved' | 'unavailable' | 'failed' = env.DB ? 'failed' : 'unavailable';

  if (env.DB) {
    try {
      const dbResult = await env.DB.prepare(
        `INSERT INTO form_submissions (id, form_id, data, ip, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          submissionId,
          clean.formId,
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
      console.warn('[FormSubmit] D1 insert failed:', dbErr instanceof Error ? dbErr.message : 'unknown error');
    }
  }

  // 2. Dispatch Telegram notification
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
        error: '服务端未能保存表单数据，且通知通道未能送达。请稍后重试。',
      } satisfies ApplyApiResponseShape,
      { status: 503 }
    );
  }

  const degraded = !persisted || !notified;
  let message = '表单已保存至服务端数据库（D1）并已推送通知，等待管理员查看。';
  if (persisted && !notified) {
    message = '表单已保存至服务端数据库（D1），但即时通知未送达。';
  } else if (!persisted && notified) {
    message = '通知已发送给管理员，但当前环境未能写入数据库（D1）。';
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
