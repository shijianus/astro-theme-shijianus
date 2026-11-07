/**
 * Astro Blog「试验田 Lab」便携实验包编解码器 (PortableBundleCodec)
 *
 * 架构与安全声明：
 * 1. Base64URL 纯属 URL 数据传输与序列化编码机制，绝非密码学防篡改凭据或数字签名；
 * 2. 严格采用 lab-bundle-v2 规范与显式 Schema 迁移保障向前兼容；
 * 3. 严格限制最大传输字节，并在编码前/解码后实施双向校验；
 * 4. URL 字符限制：若 Base64URL 长度超过 2048 字符，拒绝生成 URL 分享，阻断 URL 截断并引导用户使用标准 JSON 离线文件；
 * 5. 采用确定性内容摘要 (Content Integrity Digest) 检测意外损坏，严禁宣称为数字身份凭据；
 * 6. 对未知未来版本或畸形数据实施严格失败关闭 (Fail-Closed)。
 */
import {
  LAB_SECURITY_LIMITS,
  validateLabPortableBundle,
  computeBundleContentDigest,
  type LabPortableBundle,
} from '../lab-schema.ts';

export const MAX_URL_SHARE_LENGTH = 2048;

export class PortableBundleCodec {
  /**
   * 将实验工程安全编码为 URL-Safe Base64 字符串 (无密码学防篡改保证，仅作编码传输)
   */
  static encode(bundle: unknown): string {
    try {
      const json = JSON.stringify(bundle);
      const bytes = new TextEncoder().encode(json);

      // 编码前体积校验
      if (bytes.length > LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES) {
        return '';
      }

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
   * 安全 URL 分享编码：检查最终 URL 长度是否超过 2048 字符上限
   * 超限时不生成 URL，提示回退为 JSON 文件下载，杜绝意外截断
   */
  static encodeForUrl(bundle: unknown): {
    ok: boolean;
    bundleString?: string;
    oversized?: boolean;
    reason?: string;
  } {
    const encoded = this.encode(bundle);
    if (!encoded) {
      return {
        ok: false,
        reason: '工程内容编码失败或体积超出安全上限 (128KB)。',
      };
    }

    if (encoded.length > MAX_URL_SHARE_LENGTH) {
      return {
        ok: false,
        oversized: true,
        reason: `工程内容序列化长度 (${encoded.length} 字符) 超出浏览器 URL 安全上限 (${MAX_URL_SHARE_LENGTH} 字符)，请使用「导出 JSON」进行离线分享。`,
      };
    }

    return {
      ok: true,
      bundleString: encoded,
    };
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
      const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  /**
   * 导出为带内容校验摘要的标准 JSON 下载内容 (符合 lab-bundle-v2 规范)
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
    const digest = computeBundleContentDigest(payload.files as any);
    const bundle: LabPortableBundle = {
      version: 'lab-bundle-v2',
      schemaVersion: 'lab-bundle-v2',
      slug: payload.slug || 'custom-experiment',
      title: payload.title || 'Custom Lab Experiment',
      description: payload.description || '',
      category: (payload.category as any) || 'utility',
      language: (payload.language as any) || 'html-css-js',
      files: payload.files as any,
      contentDigest: digest,
      exportedAt: new Date().toISOString(),
      ...(payload.sourceKind === 'community' ? { sourceKind: 'community' } : {}),
    };
    return JSON.stringify(bundle, null, 2);
  }

  /**
   * 解析导入的 JSON 字符串并进行全面安全与 Schema 校验 (支持 v1 -> v2 显式迁移)
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
