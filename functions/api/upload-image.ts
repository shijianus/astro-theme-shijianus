import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse } from '../_lib/http.ts';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]);

export async function onRequest(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: `Method ${request.method} not allowed` }, { status: 405 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return jsonResponse(request, env, { ok: false, error: '请求类型必须为 multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return jsonResponse(request, env, { ok: false, error: '未检测到上传的图片文件 (缺少 file 字段)' }, { status: 400 });
    }

    const imageFile = file as File;

    // Validate MIME type
    const mime = imageFile.type.toLowerCase().trim();
    if (!mime.startsWith('image/') && !ALLOWED_IMAGE_TYPES.has(mime)) {
      return jsonResponse(
        request,
        env,
        { ok: false, error: `不支持的文件格式: ${mime || '未知'}，仅允许上传主流图片格式 (PNG, JPG, GIF, WebP, SVG, AVIF)` },
        { status: 400 }
      );
    }

    // Validate size limit
    if (imageFile.size > MAX_FILE_SIZE) {
      return jsonResponse(
        request,
        env,
        { ok: false, error: `图片文件体积 ${(imageFile.size / 1024 / 1024).toFixed(1)}MB 超过上限 (最大 10MB)` },
        { status: 400 }
      );
    }

    // Relay to Telegram-backed Image Host (img.epocanvas.com)
    const imageHostUrl = (env.IMAGE_HOST_URL || 'https://img.epocanvas.com').replace(/\/+$/, '');
    const imageHostToken = env.IMAGE_HOST_TOKEN || 'epocanvas_secret_2026_image_key';

    const forwardForm = new FormData();
    forwardForm.append('file', imageFile, imageFile.name || 'image.png');

    const upstreamRes = await fetch(`${imageHostUrl}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${imageHostToken}`,
      },
      body: forwardForm,
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      return jsonResponse(
        request,
        env,
        { ok: false, error: `图床转发失败 (${upstreamRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    const uploadResult = await upstreamRes.json() as any;
    if (uploadResult.code !== 200 || !uploadResult.data?.url) {
      return jsonResponse(
        request,
        env,
        { ok: false, error: uploadResult.msg || '图床返回数据格式异常' },
        { status: 500 }
      );
    }

    return jsonResponse(request, env, {
      ok: true,
      code: 200,
      url: uploadResult.data.url,
      id: uploadResult.data.id,
      name: uploadResult.data.name || imageFile.name,
      size: uploadResult.data.size || imageFile.size,
      type: uploadResult.data.type || imageFile.type,
      message: '图片上传成功并已持久化至 Telegram 存储',
    });
  } catch (err: any) {
    console.error('[Upload API] Error processing image upload:', err);
    return jsonResponse(
      request,
      env,
      { ok: false, error: err?.message || '图片上传处理失败' },
      { status: 500 }
    );
  }
}
