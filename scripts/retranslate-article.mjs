import fs from 'node:fs';
import path from 'node:path';
import {
  translateArticleAuto,
  resolveArticleI18nConfig,
} from '../src/lib/server-article-i18n.ts';

const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');
const targetSlug = process.argv[2] || 'badges-guide';
const specificLocale = process.argv[3] || null;

async function run() {
  const sourcePath = path.join(POSTS_DIR, `${targetSlug}.md`);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  const sourceRaw = fs.readFileSync(sourcePath, 'utf8');
  const config = resolveArticleI18nConfig();
  const locales = specificLocale ? [specificLocale] : ['en', 'es', 'de', 'fr', 'zh-Hant'];

  console.log(`[Retranslate] Starting translation for "${targetSlug}" across locales:`, locales);
  console.log(`[Retranslate] Source length: ${sourceRaw.length} chars`);

  for (const locale of locales) {
    console.log(`\n======================================================`);
    console.log(`Translating "${targetSlug}" -> ${locale}...`);
    console.log(`======================================================`);

    const result = await translateArticleAuto({
      sourceMarkdown: sourceRaw,
      sourceLocale: 'zh-CN',
      targetLocale: locale,
      i18nKey: targetSlug,
      slug: targetSlug,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      groqApiKey: config.groqApiKey,
      groqModel: config.groqModel,
      scheme: 'primary', // Force format-in-format-out chunked pipeline
      enableOcr: false,
    });

    if (result.ok && result.translatedMarkdown) {
      // Validate Chinese count
      let zhCount = 0;
      if (locale !== 'zh-CN' && locale !== 'zh-Hant') {
        const clean = result.translatedMarkdown
          .replace(/```[\s\S]*?```/g, '')
          .replace(/<pre[\s\S]*?<\/pre>/g, '');
        const zh = clean.match(/[\u4e00-\u9fa5]/g) || [];
        zhCount = zh.length;
      }

      console.log(`✅ Success for ${locale}! Provider: ${result.provider}, Model: ${result.model}`);
      console.log(`   Translated size: ${result.translatedMarkdown.length} bytes`);
      console.log(`   Residual Chinese characters: ${zhCount}`);

      const targetPath = path.join(POSTS_DIR, `${targetSlug}-${locale}.md`);
      fs.writeFileSync(targetPath, result.translatedMarkdown, 'utf8');
      console.log(`   Saved to: ${targetPath}`);
    } else {
      console.error(`❌ Failed for ${locale}:`, result.error);
    }
  }
}

run().catch((err) => {
  console.error('Fatal translation error:', err);
  process.exit(1);
});
