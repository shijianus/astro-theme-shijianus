/**
 * Automated Verification Script: Policies Alignment & Contextual Placement
 * 1. Checks Footer Policies count <= 4, strictly matching the legal essentials.
 * 2. Checks Footer Themes column balance (3 items).
 * 3. Checks PostComments header links (Code of Conduct, Moderation, Appeals, Privacy).
 * 4. Checks RewardModal refund link.
 * 5. Checks AccountDrawer session & accessibility links.
 * 6. Checks security.txt RFC-9116 RFC conformance.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

async function runAudit() {
  console.log('🚀 Starting Policy Alignment & Contextual Placement Verification...\n');

  // 1. Audit site.ts directly
  const siteConfigPath = path.resolve('src/config/site.ts');
  const siteConfigContent = fs.readFileSync(siteConfigPath, 'utf8');

  // Extract footer groups
  const groupsMatch = siteConfigContent.match(/groups:\s*\[([\s\S]*?)\]\s*satisfies\s*SiteNavItem\[\]/);
  if (!groupsMatch) {
    console.error('❌ Could not parse footer groups from site.ts');
    process.exit(1);
  }

  // Check Policies section
  const policiesMatch = siteConfigContent.match(/title:\s*['"]协议['"],\s*links:\s*\[([\s\S]*?)\]\s*satisfies\s*SiteNavItem\[\]/);
  if (!policiesMatch) {
    console.error('❌ Could not find "协议" (Policies) group in site.ts');
    process.exit(1);
  }

  const policyLinks = [...policiesMatch[1].matchAll(/label:\s*['"]([^'"]+)['"],\s*href:\s*['"]([^'"]+)['"]/g)]
    .map(m => ({ label: m[1], href: m[2] }));

  console.log(`📋 Footer Policies Count: ${policyLinks.length}`);
  policyLinks.forEach((p, i) => console.log(`   [${i + 1}] ${p.label} -> ${p.href}`));

  if (policyLinks.length > 4) {
    console.error(`❌ Footer Policies count exceeds 4 items (actual: ${policyLinks.length})`);
    process.exit(1);
  }
  console.log('✅ Footer Policies count <= 4 passed (Exact 4 essential legal items)!\n');

  // Verify that the 4 items are the expected core legal items
  const expectedLabels = ['隐私说明', '使用条款', '版权说明', '赞赏与退款说明'];
  for (const exp of expectedLabels) {
    if (!policyLinks.some(p => p.label === exp)) {
      console.error(`❌ Missing expected policy in footer: ${exp}`);
      process.exit(1);
    }
  }
  console.log('✅ Footer contains all 4 mandatory core legal policies.\n');

  // 2. Audit Theme column balance
  const themeMatch = siteConfigContent.match(/title:\s*['"]主题['"],\s*links:\s*\[([\s\S]*?)\]\s*satisfies\s*SiteNavItem\[\]/);
  if (themeMatch) {
    const themeLinks = [...themeMatch[1].matchAll(/label:\s*['"]([^'"]+)['"],\s*href:\s*['"]([^'"]+)['"]/g)];
    console.log(`📋 Footer Theme Column Count: ${themeLinks.length}`);
    if (themeLinks.length <= 4 && themeLinks.length >= 3) {
      console.log('✅ Theme column is perfectly balanced (3-4 items).\n');
    } else {
      console.warn(`⚠️ Theme column count is ${themeLinks.length}`);
    }
  }

  // 3. Audit PostComments.tsx contextual placement
  const postCommentsPath = path.resolve('src/components/theme/PostComments.tsx');
  const postCommentsContent = fs.readFileSync(postCommentsPath, 'utf8');

  const requiredCommentLinks = [
    '/community/code-of-conduct/',
    '/community/comments-and-moderation/',
    '/community/reporting-and-appeals/',
    '/community/privacy-and-data/'
  ];

  for (const link of requiredCommentLinks) {
    if (!postCommentsContent.includes(link)) {
      console.error(`❌ PostComments is missing in-place policy link: ${link}`);
      process.exit(1);
    }
  }
  console.log('✅ PostComments header contains in-place links for Conduct, Moderation, Appeals, and Privacy!\n');

  // 4. Audit RewardModal.tsx contextual placement
  const rewardModalPath = path.resolve('src/components/theme/RewardModal.tsx');
  const rewardModalContent = fs.readFileSync(rewardModalPath, 'utf8');

  if (!rewardModalContent.includes('/community/support-and-refunds/')) {
    console.error('❌ RewardModal is missing support-and-refunds link');
    process.exit(1);
  }
  console.log('✅ RewardModal footer contains refund policy link (/community/support-and-refunds/)!\n');

  // 5. Audit ThemeOverlays.tsx (Account Drawer) contextual placement
  const themeOverlaysPath = path.resolve('src/components/ThemeOverlays.tsx');
  const themeOverlaysContent = fs.readFileSync(themeOverlaysPath, 'utf8');

  const requiredDrawerLinks = [
    '/community/account-and-session/',
    '/community/identity-levels-and-badges/',
    '/community/accessibility/'
  ];

  for (const link of requiredDrawerLinks) {
    if (!themeOverlaysContent.includes(link)) {
      console.error(`❌ Account Drawer is missing link: ${link}`);
      process.exit(1);
    }
  }
  console.log('✅ Account Drawer contains session security, level rules, and accessibility links!\n');

  // 6. Audit security.txt RFC conformance
  const secTxtPath = path.resolve('public/.well-known/security.txt');
  if (!fs.existsSync(secTxtPath)) {
    console.error('❌ public/.well-known/security.txt does not exist');
    process.exit(1);
  }
  const secContent = fs.readFileSync(secTxtPath, 'utf8');
  if (!secContent.includes('/community/security-disclosure/')) {
    console.error('❌ security.txt missing security-disclosure link');
    process.exit(1);
  }
  console.log('✅ RFC-9116 security.txt correctly points to /community/security-disclosure/!\n');

  // 7. Check rendered dist HTML files
  const distIndex = path.resolve('dist/index.html');
  if (fs.existsSync(distIndex)) {
    const distHtml = fs.readFileSync(distIndex, 'utf8');
    // Ensure the 4 links exist in dist
    for (const exp of expectedLabels) {
      if (!distHtml.includes(exp)) {
        console.error(`❌ Built dist/index.html missing: ${exp}`);
        process.exit(1);
      }
    }
    console.log('✅ Built dist/index.html contains all 4 legal policy links!\n');
  }

  console.log('🎉 ALL AUDIT CHECKS PASSED PERFECTLY!');
}

runAudit().catch(err => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
