import fs from 'fs';
import path from 'path';

const dir = 'src/content/posts';

// Scenario 1: Polyglot Matrix (10 languages)
const polyglotLangs = [
  { code: 'zh-Hant', title: '多語言全矩陣極限審計測試 (繁體中文)', desc: '繁體中文審計測試版本。', s1: '第一節：審計目標', s2: '第二節：交互驗證' },
  { code: 'ja', title: '多言語マトリックス監査検証 (日本語)', desc: '日本語版のテスト記事です。', s1: '第1節：監査対象', s2: '第2節：対話的検証' },
  { code: 'ko', title: '다국어 매트릭스 감사 검증 (한국어)', desc: '한국어 테스트 기사입니다.', s1: '섹션 1: 감사 대상', s2: '섹션 2: 상호작용 검증' },
  { code: 'fr', title: 'Vérification de la matrice polyglotte (Français)', desc: 'Version française du test audit polyglotte.', s1: 'Section 1 : Cible audit', s2: 'Section 2 : Validation interactive' },
  { code: 'de', title: 'Polyglotte Matrix-Prüfung (Deutsch)', desc: 'Deutsche Version für den mehrsprachigen Audittest.', s1: 'Abschnitt 1: Auditziel', s2: 'Abschnitt 2: Interaktive Validierung' },
  { code: 'es', title: 'Verificación de matriz políglota (Español)', desc: 'Versión en español para la prueba de auditoría.', s1: 'Sección 1: Objetivo de auditoría', s2: 'Sección 2: Validación interactiva' },
  { code: 'ru', title: 'Проверка полиглотической матрицы (Русский)', desc: 'Русская версия для аудита многоязычия.', s1: 'Раздел 1: Цель аудита', s2: 'Раздел 2: Интерактивная проверка' },
  { code: 'it', title: 'Verifica matrice multilingue (Italiano)', desc: 'Versione italiana per il test di audit.', s1: 'Sezione 1: Obiettivo audit', s2: 'Sezione 2: Validazione interattiva' }
];

for (const l of polyglotLangs) {
  const content = [
    '---',
    `title: "${l.title}"`,
    `description: "${l.desc}"`,
    'pubDate: 2026-09-21',
    'author: "shijianus"',
    'category: "Audit Test"',
    'tags: ["i18n", "audit", "polyglot"]',
    `lang: "${l.code}"`,
    'i18nKey: "test-audit-polyglot-matrix"',
    '---',
    '',
    `# ${l.title}`,
    '',
    `## ${l.s1}`,
    `Verify that .article-translation-variant with data-lang=${l.code} is rendered.`,
    '',
    `## ${l.s2}`,
    `Interactive switching confirmation for ${l.code}.`,
    ''
  ].join('\n');

  fs.writeFileSync(path.join(dir, `test-audit-polyglot-matrix-${l.code}.md`), content, 'utf-8');
}

// Scenario 2: Monolingual single post (isolated, zero translations)
const monoContent = [
  '---',
  'title: "单语言独立文章隔离审计测试"',
  'description: "用于核验在没有任何翻译变体时，单个 article-translation-variant 的行为。"',
  'pubDate: 2026-09-21',
  'author: "shijianus"',
  'category: "审计测试"',
  'tags: ["i18n", "audit", "monolingual"]',
  'lang: "zh-CN"',
  '---',
  '',
  '# 单语言独立文章隔离审计测试',
  '',
  '## 第一节：单文章变体存在性',
  '即使没有多语言翻译，系统也应将正文包装进单个 .article-translation-variant[data-lang="zh-CN"] 中，确保样式与排版一致。',
  '',
  '## 第二节：语言切换栏静默',
  '单语言文章不应呈现任何多语言切换按钮，避免无效交互。',
  ''
].join('\n');
fs.writeFileSync(path.join(dir, 'test-audit-monolingual-single.md'), monoContent, 'utf-8');

// Scenario 3: Dot notation suffix with mixed casing (test-audit-dot-casing.en.md & test-audit-dot-casing.ZH-CN.md)
const dotEnContent = [
  '---',
  'title: "Dot Notation Casing Test (English)"',
  'description: "Testing dot-separated filename with uppercase lang code."',
  'pubDate: 2026-09-21',
  'author: "shijianus"',
  'category: "Audit Test"',
  'tags: ["i18n", "audit", "dot-notation"]',
  'lang: "EN"',
  'i18nKey: "test-audit-dot-casing"',
  '---',
  '',
  '# Dot Notation Casing Test',
  '',
  '## Section 1: Casing Normalization',
  'Frontmatter has uppercase EN, filename has dot suffix .en.md.',
  ''
].join('\n');
fs.writeFileSync(path.join(dir, 'test-audit-dot-casing.en.md'), dotEnContent, 'utf-8');

const dotZhContent = [
  '---',
  'title: "点号命名与混合大小写测试 (中文版)"',
  'description: "测试文件名带点号以及 frontmatter 大写语言标签。"',
  'pubDate: 2026-09-21',
  'author: "shijianus"',
  'category: "审计测试"',
  'tags: ["i18n", "audit", "dot-notation"]',
  'lang: "ZH-CN"',
  'i18nKey: "test-audit-dot-casing"',
  '---',
  '',
  '# 点号命名与混合大小写测试',
  '',
  '## 第一节：点号规范化',
  '验证点号分隔文件名和混合大小写是否被规范化为 zh-CN 变体。',
  ''
].join('\n');
fs.writeFileSync(path.join(dir, 'test-audit-dot-casing.zh-CN.md'), dotZhContent, 'utf-8');

console.log('Successfully generated all audit test posts.');
