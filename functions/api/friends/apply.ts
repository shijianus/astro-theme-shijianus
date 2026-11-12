import type { AppEnv } from '../../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../../_lib/http';
import { sendFormTelegramNotification, type FormSubmissionPayload } from '../../_lib/form-notify';

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

  const payload = await safeReadJson<FormSubmissionPayload>(request);
  if (!payload) {
    return jsonResponse(request, env, { ok: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate required fields
  const name = String(payload.name || '').trim();
  const url = String(payload.url || '').trim();
  const avatar = String(payload.avatar || '').trim();
  const desc = String(payload.desc || '').trim();

  if (!name || !url) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: '缺少必填字段：站点名称 (name) 与站点链接 (url) 不能为空' },
      { status: 400 }
    );
  }

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';
  const geoCountry = request.headers.get('cf-ipcountry') || 'GLOBAL';

  // Normalize payload
  const submission: FormSubmissionPayload = {
    formId: payload.formId || 'friend-link-apply',
    title: payload.title || '友邻互链申请',
    name,
    url,
    avatar: avatar || 'https://blog.epocanvas.com/media/brands/default-brand.svg',
    desc: desc || '（暂无简介）',
    category: payload.category || '核心友邻 · 技术先锋',
    contact: payload.contact?.trim() || '',
    source: payload.source || 'friends_modal',
  };

  // 1. If D1 is available, record to DB
  if (env.DB) {
    try {
      const submissionId = `apply_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await env.DB.prepare(
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
    } catch (dbErr) {
      // Table might not exist yet, continue gracefully
      console.warn('[FriendsApply] D1 insert skipped or failed:', dbErr);
    }
  }

  // 2. Dispatch Telegram notification
  const tgResult = await sendFormTelegramNotification(env, submission, clientIp, geoCountry);

  return jsonResponse(request, env, {
    ok: true,
    message: '互链申请已成功提交，通知已送达站长 Telegram！',
    notified: tgResult.ok,
    timestamp: Date.now(),
  });
}
