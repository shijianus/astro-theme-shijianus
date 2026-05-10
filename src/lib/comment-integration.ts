import type { SiteConfig } from '../config/site';

type CommentsConfig = SiteConfig['integrations']['comments'];

export function hasConfiguredCommentDatabase(integration: CommentsConfig) {
  if (integration.provider === 'local') return true;
  if (integration.provider === 'cloudflare') return Boolean(integration.cloudflare.apiBase.trim());
  if (integration.provider === 'giscus') {
    return Boolean(
      integration.giscus.repo.trim() &&
      integration.giscus.repoId.trim() &&
      integration.giscus.category.trim() &&
      integration.giscus.categoryId.trim(),
    );
  }
  if (integration.provider === 'waline') return Boolean(integration.waline.serverURL.trim());
  if (integration.provider === 'twikoo') return Boolean(integration.twikoo.envId.trim());
  return false;
}

export function isRemoteDatabaseConfigured(integration: CommentsConfig) {
  if (integration.provider === 'cloudflare') return Boolean(integration.cloudflare.apiBase.trim());
  if (integration.provider === 'giscus') {
    return Boolean(
      integration.giscus.repo.trim() &&
      integration.giscus.repoId.trim() &&
      integration.giscus.category.trim() &&
      integration.giscus.categoryId.trim(),
    );
  }
  if (integration.provider === 'waline') return Boolean(integration.waline.serverURL.trim());
  if (integration.provider === 'twikoo') return Boolean(integration.twikoo.envId.trim());
  return false;
}

export function isCommentsIntegrationEnabled(integration: CommentsConfig) {
  return hasConfiguredCommentDatabase(integration);
}

export function getCommentsProviderLabel(integration: CommentsConfig) {
  if (integration.provider === 'local') return '本地评论存储';
  if (integration.provider === 'cloudflare') return 'Cloudflare Comments';
  if (integration.provider === 'giscus') return 'Giscus';
  if (integration.provider === 'waline') return 'Waline';
  if (integration.provider === 'twikoo') return 'Twikoo';
  return '未连接评论数据库';
}
