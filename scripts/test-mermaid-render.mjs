import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const htmlTemplate = (mermaidCode) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      padding: 30px 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0;
    }
    .article-container {
      width: 960px;
      max-width: 98vw;
      background: #fff;
      padding: 32px 28px;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }
    .mermaid-diagram-wrap {
      position: relative;
      margin: 1.5rem 0;
      padding: 1.8rem 1.4rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 14px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      overflow-x: auto;
    }
    .mermaid-diagram-wrap svg {
      display: block;
      width: 100%;
      height: auto;
    }
    .mermaid-diagram-wrap .nodeLabel {
      font-size: 15px !important;
      font-weight: 600 !important;
      line-height: 1.4 !important;
    }
    .mermaid-diagram-wrap .cluster-label {
      font-size: 16px !important;
      font-weight: 700 !important;
    }
    .mermaid-diagram-wrap .edgeLabel {
      font-size: 13px !important;
    }
  </style>
</head>
<body>
  <div class="article-container">
    <h2>EpoCanvas 读者社区信任阶梯全景图 (双列宽幅自适应优化)</h2>
    <div class="mermaid-diagram-wrap">
      <pre class="mermaid">
${mermaidCode}
      </pre>
    </div>
  </div>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      themeVariables: {
        fontSize: '15px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 40,
        rankSpacing: 45
      }
    });
  </script>
</body>
</html>`;

async function testRender() {
  const code = `flowchart TD
    %% 左列：基础与进阶贡献
    subgraph COL_LEFT["🌱 阶段一：新手启程与进阶贡献 (LV.0 ~ LV.1)"]
        TL0["🐣 新兴用户 · <b>TL Cap 0</b>"] -->|读文| TL2["📘 初始用户 · <b>TL Cap 2</b>"]
        TL2 ==>|首次发表评论| TL8["🥉 基本用户 · <b>TL Cap 8</b>"]
        TL8 -->|读30m + 评10| TL15["🏅 贡献者 · <b>TL Cap 15</b>"]
        TL15 -->|读120m + 评20 + 赞10| TL20["💡 思辨学者 · <b>TL Cap 20 (LV.1 封顶)</b>"]
    end

    %% 右列：活跃极客与先驱宗师
    subgraph COL_RIGHT["⭐ 阶段二：活跃极客与先驱宗师 (LV.2 ~ LV.3)"]
        TL35["🎖️ 活跃用户 · <b>TL Cap 35</b>"] -->|活45d + 读480m + 评60 + 赞40| TL50["🌲 常青极客 · <b>TL Cap 50 (LV.2 封顶)</b>"]
        TL50 ==>|长期共鸣奉献| TL70["⭐ 先驱 · <b>TL Cap 70</b>"]
        TL70 -->|活180d + 读1440m + 评150| TL80["🎂 年度用户 · <b>TL Cap 80</b>"]
        TL80 -->|活300d + 读2160m + 赞100| TL90["📜 墨海宗师 · <b>TL Cap 90 (常规巅峰)</b>"]
    end

    %% 底层：治理特权与绝版加成
    subgraph COL_BOTTOM["👑 阶段三：治理主创体系与 6 大绝版荣誉（可突破 100+）"]
        ADMIN["🛡️ 社区管理员 (TL 91~99 · 圆形头像)"]
        OWNER["👑 站长 (TL 100 满级 · 微圆角方冠 · 全穿透)"]
        SPEC["💎 6 大绝版荣誉称号 (领跑者/铁粉/种子/破晓/架构/创世)<br/><b>独立加成 · 权威直达 TL 100+！</b>"]
    end

    %% 跨阶段跃迁
    TL20 ==>|多维活跃跨阶跃迁| TL35
    TL90 -. 特邀委任理事 .-> ADMIN
    TL90 -. 密钥唯一所有者 .-> OWNER
    TL90 -. 卓越限定贡献突破 .-> SPEC
`;

  const html = htmlTemplate(code);
  const tmpHtml = path.resolve('scripts/test_mermaid.html');
  fs.writeFileSync(tmpHtml, html, 'utf-8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`file://${tmpHtml}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const wrap = await page.$('.mermaid-diagram-wrap');
  const box = await wrap.boundingBox();
  console.log(`Test wrap box: W=${box.width}px, H=${box.height}px`);

  const screenshotPath = path.resolve('scripts/audit_screenshots/test_mermaid_2col.png');
  await wrap.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot to ${screenshotPath}`);

  await browser.close();
}

testRender();
