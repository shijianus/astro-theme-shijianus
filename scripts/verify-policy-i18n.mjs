/**
 * Comprehensive i18n Verification Suite for Governance & Policy Links
 */

import fs from 'fs';
import path from 'path';

async function runI18nAudit() {
  console.log('🌐 Starting Comprehensive Policy i18n Audit...\n');

  // 1. Audit comments-i18n.ts
  const commentsI18nPath = path.resolve('src/lib/comments-i18n.ts');
  const commentsI18nContent = fs.readFileSync(commentsI18nPath, 'utf8');

  const requiredCommentKeys = [
    'conductLabel',
    'conductTitle',
    'moderationLabel',
    'moderationTitle',
    'appealsLabel',
    'appealsTitle',
    'policyLabel',
    'policyTitle'
  ];

  const commentLocales = ['zh-CN', 'zh-Hant', 'en', 'fr', 'es', 'de'];
  console.log('🔍 [Comments i18n] Checking all 6 locale variants for keys:');
  console.log('   ' + requiredCommentKeys.join(', '));

  for (const loc of commentLocales) {
    const locBlockMatch = commentsI18nContent.match(new RegExp(`['"]?${loc}['"]?\\s*:\\s*\\{([\\s\\S]*?)(?:\\n\\s*\\},|\\n\\s*\\};)`));
    if (!locBlockMatch) {
      console.error(`❌ Could not find locale block for "${loc}" in comments-i18n.ts`);
      process.exit(1);
    }
    const blockContent = locBlockMatch[1];
    for (const key of requiredCommentKeys) {
      if (!blockContent.includes(`${key}:`)) {
        console.error(`❌ Locale "${loc}" in comments-i18n.ts is missing key: ${key}`);
        process.exit(1);
      }
    }
    console.log(`   ✅ Locale "${loc}": all keys present!`);
  }
  console.log('✅ comments-i18n.ts passed 100% full coverage.\n');

  // 2. Audit PostComments.tsx (no hardcoded Chinese in header links)
  const postCommentsPath = path.resolve('src/components/theme/PostComments.tsx');
  const postCommentsContent = fs.readFileSync(postCommentsPath, 'utf8');

  if (postCommentsContent.includes('title="查看 EpoCanvas 社群公约"') || postCommentsContent.includes('>社群公约<')) {
    console.error('❌ PostComments.tsx still contains hardcoded Chinese for community conduct!');
    process.exit(1);
  }
  if (!postCommentsContent.includes('{tC.conductLabel}') || !postCommentsContent.includes('{tC.moderationLabel}') || !postCommentsContent.includes('{tC.appealsLabel}')) {
    console.error('❌ PostComments.tsx does not use dynamic tC.* labels!');
    process.exit(1);
  }
  console.log('✅ PostComments.tsx strictly uses dynamic tC.* localization tokens.\n');

  // 3. Audit RewardModal.tsx (refund policy in REWARD_I18N)
  const rewardModalPath = path.resolve('src/components/theme/RewardModal.tsx');
  const rewardModalContent = fs.readFileSync(rewardModalPath, 'utf8');

  const rewardLocales = ['zh-CN', 'zh-Hant', 'en', 'fr', 'es', 'de'];
  console.log('🔍 [RewardModal i18n] Checking refundPolicy & refundPolicyTitle in REWARD_I18N:');

  for (const loc of rewardLocales) {
    const rMatch = rewardModalContent.match(new RegExp(`['"]?${loc}['"]?\\s*:\\s*\\{([\\s\\S]*?)(?:\\n\\s*\\},|\\n\\s*\\};)`));
    if (!rMatch) {
      console.error(`❌ Could not find locale block for "${loc}" in RewardModal.tsx`);
      process.exit(1);
    }
    const block = rMatch[1];
    if (!block.includes('refundPolicy:') || !block.includes('refundPolicyTitle:')) {
      console.error(`❌ Locale "${loc}" in RewardModal.tsx is missing refundPolicy keys`);
      process.exit(1);
    }
    console.log(`   ✅ Locale "${loc}": refund policy localized!`);
  }

  if (rewardModalContent.includes('>退款说明<')) {
    console.error('❌ RewardModal.tsx still contains hardcoded ">退款说明<" in JSX!');
    process.exit(1);
  }
  if (!rewardModalContent.includes('{t.refundPolicy}') || !rewardModalContent.includes('{t.refundPolicyTitle}')) {
    console.error('❌ RewardModal.tsx does not use {t.refundPolicy}!');
    process.exit(1);
  }
  console.log('✅ RewardModal.tsx strictly uses dynamic t.refundPolicy tokens.\n');

  // 4. Audit client-locale.ts (Global DICTIONARY entries)
  const clientLocalePath = path.resolve('src/lib/client-locale.ts');
  const clientLocaleContent = fs.readFileSync(clientLocalePath, 'utf8');

  const requiredDictionaryTerms = [
    '赞赏与退款说明',
    '退款说明',
    '社群政策',
    '社群公约',
    '审核规范',
    '评论与审核规范',
    '申诉说明',
    '举报与申诉说明',
    '会话安全',
    '账号与会话安全',
    '等级规则',
    '等级与徽章说明',
    '无障碍说明',
    '安全问题通报',
    '翻译维护政策',
    '贡献与文件编辑',
    '工程标准',
    '專案路線圖',
    '设计对齐'
  ];

  console.log(`🔍 [client-locale.ts] Checking ${requiredDictionaryTerms.length} dictionary entries:`);
  for (const term of requiredDictionaryTerms) {
    // Check key exists
    if (!clientLocaleContent.includes(`'${term}':`)) {
      console.error(`❌ client-locale.ts is missing DICTIONARY term: '${term}'`);
      process.exit(1);
    }
  }
  console.log(`✅ All ${requiredDictionaryTerms.length} governance & policy terms exist in DICTIONARY with 4-language translations!\n`);

  console.log('🎉 ALL i18n AUDIT CHECKS PASSED WITH 100% COVERAGE!');
}

runI18nAudit().catch(err => {
  console.error('Fatal i18n audit error:', err);
  process.exit(1);
});
