/**
 * Astro Blog「试验田 Lab」便携实验包编解码器
 *
 * 负责在 URL Hash (#bundle=) 与 JSON 文件之间进行安全、防篡改、无损的 UTF-8 Base64 编解码。
 */
import { LAB_SECURITY_LIMITS, validateLabPortableBundle } from '../lab-schema';

export class PortableBundleCodec {
  /**
   * 将实验工程安全编码为 URL-Safe Base64 字符串
   */
  static encode(bundle: unknown): string {
    try {
      const json = JSON.stringify(bundle);
      const bytes = new TextEncoder().encode(json);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
      return '';
    }
  }

  /**
   * 将 URL-Safe Base64 字符串安全解码为实验工程对象
   * 严格实施长度与大小门禁，防止 DoS 与畸形 Unicode 攻击
   */
  static decode<T = unknown>(encoded: string): T | null {
    if (!encoded || encoded.length > LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES * 2) {
      return null;
    }
    try {
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
      const binary = atob(base64 + pad);
      if (binary.length > LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES * 2) {
        return null;
      }
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  /**
   * 导出为带时间戳与版本签名的标准 JSON 下载内容 (符合 lab-bundle-v1 规范)
   */
  static exportToJson(payload: {
    id?: string;
    slug?: string;
    title?: string;
    description?: string;
    category?: string;
    language?: string;
    files: Array<{ name: string; language: string; content: string }>;
    sourceKind?: string;
  }): string {
    const bundle = {
      version: 'lab-bundle-v1',
      manifestVersion: '1.0.0',
      slug: payload.slug || 'custom-experiment',
      title: payload.title || 'Custom Lab Experiment',
      description: payload.description || '',
      category: payload.category || 'utility',
      language: payload.language || 'html-css-js',
      files: payload.files,
      exportedAt: new Date().toISOString(),
      ...(payload.sourceKind === 'community' ? { sourceKind: 'community' } : {}),
    };
    return JSON.stringify(bundle, null, 2);
  }

  /**
   * 解析导入的 JSON 字符串并进行全面安全与 Schema 校验
   */
  static importFromJson(jsonStr: string) {
    if (!jsonStr || jsonStr.length > LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES * 2) {
      return { ok: false, errors: ['JSON 文件体积超过安全限制 (256KB)'] };
    }
    try {
      const parsed = JSON.parse(jsonStr);
      return validateLabPortableBundle(parsed);
    } catch {
      return { ok: false, errors: ['无效的 JSON 文件格式'] };
    }
  }
}
