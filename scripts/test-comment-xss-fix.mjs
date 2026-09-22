import { renderCommentMarkdown } from '../src/lib/comment-markdown.ts';

const testCases = [
  {
    name: 'Heading with malicious img tag',
    input: '# <img src=x onerror=alert(1)> Title',
    mustNotContain: ['<img ', '<img/'],
    mustContain: ['<h2', '&lt;img'],
  },
  {
    name: 'Blockquote with malicious SVG tag',
    input: '> <svg onload=alert(document.domain)>',
    mustNotContain: ['<svg ', '<svg/'],
    mustContain: ['<blockquote', '&lt;svg'],
  },
  {
    name: 'Raw script tag',
    input: '<script>alert("xss")</script>',
    mustNotContain: ['<script>', '<script '],
    mustContain: ['&lt;script&gt;'],
  },
  {
    name: 'Bold with malicious img',
    input: '**<img src=x onerror=alert(2)>**',
    mustNotContain: ['<img ', '<img/'],
    mustContain: ['<strong>', '&lt;img'],
  },
  {
    name: 'Javascript protocol in link',
    input: '[Click me](javascript:alert(1))',
    mustNotContain: ['href="javascript:', 'href=\'javascript:'],
  },
  {
    name: 'Inline code with malicious tag',
    input: '`<script>alert(3)</script>`',
    mustNotContain: ['<script>', '<script '],
    mustContain: ['<code', '&lt;script&gt;'],
  },
  {
    name: 'Spoiler with malicious tag',
    input: '[spoiler]<img src=x onerror=alert(4)>[/spoiler]',
    mustNotContain: ['<img ', '<img/'],
    mustContain: ['<span class="tk-spoiler"', '&lt;img'],
  },
  {
    name: 'Legitimate markdown features',
    input: '### Safe Heading\n\nThis is **bold** and *italic* and `code` with [Link](https://example.com)\n\n> a quote.',
    mustContain: ['<h4', 'Safe Heading', '<strong>bold</strong>', '<em>italic</em>', '<code class="tk-inline-code">code</code>', '<a class="tk-md-link"', 'https://example.com', '<blockquote'],
  },
];

let failed = 0;
for (const tc of testCases) {
  const result = renderCommentMarkdown(tc.input);
  let ok = true;
  const errors = [];

  if (tc.mustNotContain) {
    for (const bad of tc.mustNotContain) {
      if (result.includes(bad)) {
        ok = false;
        errors.push(`Should NOT contain unescaped tag "${bad}"`);
      }
    }
  }

  if (tc.mustContain) {
    for (const good of tc.mustContain) {
      if (!result.includes(good)) {
        ok = false;
        errors.push(`Should contain "${good}"`);
      }
    }
  }

  if (ok) {
    console.log(`[PASS] ${tc.name}`);
  } else {
    failed++;
    console.error(`[FAIL] ${tc.name}:`);
    for (const err of errors) console.error(`   - ${err}`);
    console.error(`   Input:  ${tc.input}`);
    console.error(`   Output: ${result}`);
  }
}

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll XSS defense test cases passed cleanly!');
}
