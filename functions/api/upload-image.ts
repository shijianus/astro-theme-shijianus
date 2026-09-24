import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse } from '../_lib/http.ts';
import { enforceRateLimit, envLimit } from '../_lib/rate-limit.ts';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
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
    const rate = await enforceRateLimit({
      namespace: 'image-upload',
      request,
      env,
      limit: envLimit(env, 'IMAGE_UPLOAD_PER_MINUTE', 15),
      windowSeconds: 60,
    });
    if (!rate.allowed) {
      return jsonResponse(request, env, { ok: false, error: '上传过于频繁，请稍后再试', resetAt: rate.resetAt }, { status: 429 });
    }

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

    // Validate MIME type against strict whitelist (strictly disallow image/svg+xml)
    const mime = imageFile.type.toLowerCase().trim();
    if (mime.includes('svg') || (imageFile.name && imageFile.name.toLowerCase().endsWith('.svg'))) {
      return jsonResponse(
        request,
        env,
        { ok: false, error: '安全策略限制：暂不支持上传 SVG 矢量图格式，仅允许上传主流位图 (PNG, JPG, WebP, GIF, AVIF)' },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(mime)) {
      return jsonResponse(
        request,
        env,
        { ok: false, error: `不支持的文件格式: ${mime || '未知'}，仅允许上传主流图片格式 (PNG, JPG, GIF, WebP, AVIF)` },
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

    // Verify magic bytes to prevent polyglot / executable script injection
    const buffer = await imageFile.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let isValidImage = false;

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      isValidImage = true;
    }
    // PNG: 89 50 4E 47
    else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      isValidImage = true;
    }
    // GIF: GIF87a or GIF89a (47 49 46 38)
    else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      isValidImage = true;
    }
    // WebP: RIFF....WEBP (0..3 'RIFF' and 8..11 'WEBP')
    else if (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      isValidImage = true;
    }
    // AVIF: ISO Media File Format (bytes 4..7 'ftyp' with major or compatible brand containing 'avif' or 'avis')
    else if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      const ftypBrand = String.fromCharCode(...bytes.slice(8, 16));
      if (ftypBrand.includes('avif') || ftypBrand.includes('avis')) {
        isValidImage = true;
      }
    }

    if (!isValidImage) {
      return jsonResponse(
        request,
        env,
        { ok: false, error: '文件头魔数校验失败：上传内容不是合法的图片二进制文件，已被安全拦截' },
        { status: 400 }
      );
    }

    // Relay to Telegram-backed Image Host (img.epocanvas.com)
    const imageHostUrl = (env.IMAGE_HOST_URL || 'https://img.epocanvas.com').replace(/\/+$/, '');
    const isDev = Boolean(env.IS_DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'));
    const imageHostToken = env.IMAGE_HOST_TOKEN;
    if (!imageHostToken) {
      if (isDev) {
        return jsonResponse(request, env, {
          ok: true,
          code: 200,
          url: 'https://img.epocanvas.com/file/dev-mock-image.png',
          id: 'dev_mock_file',
          name: imageFile.name,
          size: imageFile.size,
          type: mime,
        });
      }
      return jsonResponse(
        request,
        env,
        { ok: false, error: '图床服务未配置授权凭证 (IMAGE_HOST_TOKEN)' },
        { status: 503 }
      );
    }

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
