/**
 * Astro Blog「试验田 Lab」代码来源审计与分级降级策略评估器
 */
import type { LabFile, LabAuthor } from '../lab-schema';
import {
  type LabCodeSourceKind,
  type SandboxDegradationDecision,
  resolveExperimentSourceKind,
  evaluateSandboxDegradationPolicy,
} from '../lab-sandbox-protocol';
import { getExperimentBySlug } from '../../data/lab-experiments';

export class ExecutionPolicy {
  /**
   * 判定代码的信任来源分类
   */
  static resolveSourceKind(author?: Pick<LabAuthor, 'role'> | null): LabCodeSourceKind {
    return resolveExperimentSourceKind(author);
  }

  /**
   * 评估沙盒执行隔离决策与失败关闭（Fail-Closed）策略
   */
  static evaluateDegradation(
    sourceKind: LabCodeSourceKind,
    crossSiteAvailable: boolean
  ): SandboxDegradationDecision {
    return evaluateSandboxDegradationPolicy(sourceKind, crossSiteAvailable);
  }

  /**
   * 严格核验当前文件数组是否 100% 匹配官方预设（未经任何编辑篡改）
   * 只要有任意 1 个字符被改动，立即降级为不可信导入代码，受 Fail-Closed 约束
   */
  static isUnmodifiedOfficialPreset(slug: unknown, candidateFiles: LabFile[]): boolean {
    if (typeof slug !== 'string' || !slug) return false;
    const official = getExperimentBySlug(slug);
    if (!official || this.resolveSourceKind(official.author) !== 'official') {
      return false;
    }
    if (official.files.length !== candidateFiles.length) {
      return false;
    }
    for (let i = 0; i < official.files.length; i++) {
      const orig = official.files[i];
      const cand = candidateFiles[i];
      if (
        !cand ||
        orig.name !== cand.name ||
        orig.language !== cand.language ||
        orig.content !== cand.content
      ) {
        return false;
      }
    }
    return true;
  }
}
