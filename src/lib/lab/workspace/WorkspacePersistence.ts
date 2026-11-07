/**
 * Astro Blog「试验田 Lab」Workspace 本地持久化管理器 (WorkspacePersistence)
 *
 * 负责本地草稿安全存储、版本恢复与便携实验包导入导出编解码。
 */
import type { LabProject } from '../types.ts';
import { PortableBundleCodec } from '../PortableBundleCodec.ts';
import { computeBundleContentDigest, validateLabPortableBundle } from '../../lab-schema.ts';
import type { LabCodeSourceKind } from '../../lab-sandbox-protocol.ts';

const STORAGE_PREFIX = 'shijianus:lab:draft:';

export class WorkspacePersistence {
  /**
   * 保存工程草稿到本地存储
   */
  static saveDraft(slug: string, project: LabProject): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const key = `${STORAGE_PREFIX}${slug}`;
      const payload = {
        updatedAt: Date.now(),
        project: {
          id: project.id,
          slug: project.slug,
          title: project.title,
          files: project.files,
          runtime: project.runtime,
          language: project.language,
        },
      };
      window.localStorage.setItem(key, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn('[WorkspacePersistence] Failed to save draft:', err);
      return false;
    }
  }

  /**
   * 加载指定 slug 的本地草稿
   */
  static loadDraft(slug: string): LabProject | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const key = `${STORAGE_PREFIX}${slug}`;
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.project?.files && Array.isArray(parsed.project.files)) {
        return parsed.project as LabProject;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 清除指定 slug 的本地草稿
   */
  static clearDraft(slug: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${slug}`);
    } catch {}
  }

  /**
   * 编码便携实验包 (URL-Safe Base64)
   */
  static exportBundle(project: LabProject, sourceKind?: LabCodeSourceKind): string {
    const cleanFiles = project.files.map((f) => ({
      name: f.name,
      language: f.language,
      content: f.content,
    }));
    return PortableBundleCodec.encode({
      version: 'lab-bundle-v2',
      schemaVersion: 'lab-bundle-v2',
      slug: project.slug,
      title: project.title,
      files: cleanFiles,
      contentDigest: computeBundleContentDigest(cleanFiles as any),
      exportedAt: new Date().toISOString(),
      ...(sourceKind === 'community' ? { sourceKind: 'community' } : {}),
    });
  }

  /**
   * 导出为标准 JSON 格式文件文本
   */
  static exportJson(project: LabProject, sourceKind?: LabCodeSourceKind): string {
    return PortableBundleCodec.exportToJson({
      slug: project.slug,
      title: project.title,
      files: project.files.map((f) => ({
        name: f.name,
        language: f.language,
        content: f.content,
      })),
      sourceKind,
    });
  }

  /**
   * 导入 JSON 实验包
   */
  static importFromJson(jsonStr: string) {
    return PortableBundleCodec.importFromJson(jsonStr);
  }

  /**
   * 解码 URL Hash 或 Base64 实验包 (包含 Schema 校验与显式 v1->v2 迁移)
   */
  static decodeBundle(encoded: string): { ok: boolean; data?: any; errors?: string[] } {
    try {
      const decoded = PortableBundleCodec.decode<any>(encoded);
      if (!decoded) {
        return { ok: false, errors: ['便携包数据解析失败或格式损坏'] };
      }
      return validateLabPortableBundle(decoded);
    } catch (err: any) {
      return { ok: false, errors: [err?.message || '解码失败'] };
    }
  }
}
