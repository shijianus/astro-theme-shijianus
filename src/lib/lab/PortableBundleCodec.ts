/**
 * Astro Blog「试验田 Lab」便携实验包编解码器
 *
 * 负责在 URL Hash (#bundle=) 与 JSON 文件之间进行安全、防篡改、无损的 UTF-8 Base64 编解码。
 */
import { LAB_SECURITY_LIMITS } from '../lab-schema';
import type { LabProject } from './types';

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
   * 导出为带时间戳与版本签名的标准 JSON 下载内容
   */
  static exportToJson(project: LabProject): string {
    const payload = {
      manifestVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      project,
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * 解析导入的 JSON 字符串并验证基础结构
   */
  static importFromJson(jsonStr: string): LabProject | null {
    if (!jsonStr || jsonStr.length > LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES * 2) {
      return null;
    }
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        if (parsed.project && Array.isArray(parsed.project.files)) {
          return parsed.project as LabProject;
        }
        if (Array.isArray(parsed.files)) {
          return parsed as LabProject;
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}
