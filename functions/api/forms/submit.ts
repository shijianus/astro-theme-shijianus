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

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';
  const geoCountry = request.headers.get('cf-ipcountry') || 'GLOBAL';

  // Normalize
  const formId = payload.formId || 'custom-form';
  const title = payload.title || '自定义表单提交';
  const submission: FormSubmissionPayload = {
    ...payload,
    formId,
    title,
    source: payload.source || 'markdown_embedded_form',
  };

  // 1. Record to D1 if available
  if (env.DB) {
    try {
      const submissionId = `form_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await env.DB.prepare(
        `INSERT INTO form_submissions (id, form_id, data, ip, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          submissionId,
          formId,
          JSON.stringify(submission),
          clientIp,
          'pending',
          Math.floor(Date.now() / 1000)
        )
        .run();
    } catch (dbErr) {
      console.warn('[FormSubmit] D1 insert skipped or failed:', dbErr);
    }
  }

  // 2. Dispatch Telegram notification
  const tgResult = await sendFormTelegramNotification(env, submission, clientIp, geoCountry);

  return jsonResponse(request, env, {
    ok: true,
    message: '表单提交成功！已实时推送到站长 Telegram。',
    notified: tgResult.ok,
    timestamp: Date.now(),
  });
}
