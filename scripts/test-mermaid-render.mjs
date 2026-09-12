import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function screenshotMermaid() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  const testHtml = `<!DOCTYPE html>
  <html>
  <head>
  <style>
    body {
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 40px;
      display: flex;
      justify-content: center;
    }
    .article-wrap {
      width: 880px;
      background: #fff;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    .mermaid-diagram-wrap {
      padding: 24px;
      background: #ffffff;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 12px;
      display: flex;
      justify-content: center;
    }
    .mermaid-diagram-wrap svg {
      width: 100% !important;
      max-width: 100% !important;
      height: auto;
    }
    .mermaid-diagram-wrap .nodeLabel {
      text-align: left !important;
      font-size: 13.5px !important;
      line-height: 1.5 !important;
    }
    .mermaid-diagram-wrap .edgeLabel {
      font-size: 12.5px !important;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
  </head>
  <body>
    <div class="article-wrap">
      <h2>EpoCanvas 社区读者信任阶梯全景图</h2>
      <div class="mermaid-diagram-wrap" id="wrap"></div>
    </div>
    <script>
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
          nodeSpacing: 25,
          rankSpacing: 35
        }
      });
      const code = \`flowchart TD
      classDef lv0 fill:#f8fafc,stroke:#94a3b8,stroke-width:2px;
      classDef lv1 fill:#eff6ff,stroke:#3b82f6,stroke-width:2px;
      classDef lv2 fill:#f0fdf4,stroke:#22c55e,stroke-width:2px;
      classDef lv3 fill:#fefce8,stroke:#eab308,stroke-width:2px;
      classDef lv4 fill:#faf5ff,stroke:#a855f7,stroke-width:2px;
      classDef spec fill:#fff1f2,stroke:#f43f5e,stroke-width:2px;

      LV0["<b>🐣 LV.0 新手起步阶梯（TL Cap 0 ~ 2）</b><br/>• 🐣 新兴用户 (TL Cap 0 · 初访起步，浏览公开博文)<br/>• 📘 初始用户 (TL Cap 2 · 累计阅读 >= 1 篇博文)"]:::lv0

      LV1["<b>🥉 LV.1 进阶贡献阶梯（TL Cap 8 ~ 20 封顶）</b><br/>• 🥉 基本用户 (TL Cap 8 · 首发真实评论，解锁 Boost 极速打气与表情互动)<br/>• 🏅 贡献者 (TL Cap 15 · 累计阅读 >= 30m 且 发表评论 >= 10 次)<br/>• 💡 思辨学者 (TL Cap 20 封顶 · 累计阅读 >= 120m 且 评论 >= 20 次 且 获赞 >= 10 个)"]:::lv1

      LV2["<b>🎖️ LV.2 活跃极客阶梯（TL Cap 35 ~ 50 封顶）</b><br/>• 🎖️ 活跃用户 (TL Cap 35 · 活跃 >= 20d 且 阅读 >= 300m 且 评论 >= 30 次 且 获赞 >= 20 次)<br/>• 🌲 常青极客 (TL Cap 50 封顶 · 活跃 >= 45d 且 阅读 >= 480m 且 评论 >= 60 次 且 获赞 >= 40 次)"]:::lv2

      LV3["<b>⭐ LV.3 先驱宗师阶梯（TL Cap 70 ~ 90 · 读者常规巅峰）</b><br/>• ⭐ 先驱 (TL Cap 70 · 活跃 >= 90d 且 阅读 >= 720m 且 评论 >= 100 次 且 获赞 >= 60 次)<br/>• 🎂 年度用户 (TL Cap 80 · 必须先解锁先驱 + 活跃 >= 180d 且 阅读 >= 1440m 且 评论 >= 150 次)<br/>• 📜 墨海宗师 (TL Cap 90 常规巅峰 · 必须先解锁年度用户 + 活跃 >= 300d 且 获赞 >= 100 个)"]:::lv3

      SPEC["<b>💎 6 大绝版荣誉称号（独立加成 · 权威突破 TL 100+！）</b><br/>• 🚀 领跑者 (+3~+5)  • 💎 铁杆粉丝 (+4~+6)  • 🌱 种子用户 (+5~+8)<br/>• 🔥 破晓布道者 (+4~+7)  • 🛠️ 架构见证人 (+5~+8)  • 📜 创世墨客 (+6~+10)"]:::spec

      LV4["<b>👑 LV.4 治理与主创体系（特邀任命 / 唯一所有者）</b><br/>• 🛡️ 社区管理员 (TL 91 ~ 99 · 站长特邀委任理事 · 标准圆形头像)<br/>• 👑 站长 (Webmaster · TL 100 恒定绝对满级 · 微圆角金冠方头像 · 全站绝对穿透特权)"]:::lv4

      LV0 ==>|首次发表真实评论| LV1
      LV1 ==>|四维指标综合跃迁 (活跃20d+阅读300m+评论30+赞20)| LV2
      LV2 ==>|长期研读深度共鸣 (活跃90d+阅读720m+评论100+赞60)| LV3
      LV3 -. 卓越限定贡献加成突破至 100+ .-> SPEC
      LV3 -. 站长特邀委任理事 .-> LV4
  \`;
      mermaid.render('graphDiv', code).then(res => {
        document.getElementById('wrap').innerHTML = res.svg;
      });
    </script>
  </body></html>`;

  await page.setContent(testHtml);
  await page.waitForTimeout(2000);

  const wrap = await page.$('#wrap');
  const box = await wrap.boundingBox();
  console.log(`Box: W=${box.width}px, H=${box.height}px`);

  const screenshotPath = path.resolve('scripts/audit_screenshots/test_mermaid_tier_success.png');
  await wrap.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  await browser.close();
}

screenshotMermaid();
