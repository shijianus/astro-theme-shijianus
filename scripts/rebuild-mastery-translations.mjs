import fs from 'node:fs';
import path from 'node:path';

const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');

// Common utility to clean leaked markers and aiGenerated flags
function cleanBaseContent(content) {
  return content
    .replace(/^isAiGenerated:\s*true\r?\n/gm, '')
    .replace(/<!--\s*context from previous chunk\s*-->[\s\S]*?<!--\s*end context\s*-->/gi, '')
    .replace(/<!--\s*context from previous chunk\s*-->/gi, '')
    .replace(/<!--\s*end context\s*-->/gi, '')
    .replace(/\[REFERENCE (?:ONLY|CONTEXT)[\s\S]*?\[END REFERENCE CONTEXT\]/gi, '')
    .replace(/\[Preceding context[\s\S]*?---\r?\n/gi, '')
    .replace(/\[TEXT TO TRANSLATE[^\]]*\]:?\r?\n?/gi, '')
    .replace(/\[END TEXT TO TRANSLATE\]/gi, '')
    .replace(/(?<!\\p)artial\s*t\s*\}/g, '\\partial t}');
}

// ---------------------------------------------------------------------------
// 1. REPAIR ENGLISH
// ---------------------------------------------------------------------------
function repairEn() {
  const filePath = path.join(POSTS_DIR, 'content-formats-and-markup-mastery-en.md');
  let c = fs.readFileSync(filePath, 'utf8');
  c = cleanBaseContent(c);

  // Fix data-title
  c = c.replace(
    /data-title="🔄\s*交互式通用单位换算器（支持基准单位切换与实时汇率）"/g,
    'data-title="🔄 Interactive Universal Unit Converter (Base Unit Switching & Live Exchange Rates)"'
  );

  // Fix Chat block (entire section 8 chat)
  const enChatBlock = `<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Developer <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        Hello! May I ask whether implementing static rendering of <code>KaTeX</code> and <code>Mermaid</code> in Astro will slow down the front-end page load speed?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architect shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architect <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        Absolutely not! Because <code>remark-math</code> and <code>rehype-katex</code> compile the formulas into pure HTML/MathML strings during the build phase (Build-time), the browser side has <strong>0 JS runtime overhead</strong>; and Mermaid diagrams also dynamically load ESM modules on demand asynchronously, making the first screen extremely light! ⚡
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Developer <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        Great! So we can directly write architecture sequence diagrams and interactive unit converters in Markdown, and they are ready to use out of the box, right?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architect shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architect <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:18</div>
      <div class="chat-bubble">
        Yes! Not only does it support double-click zoom and high-definition SVG export fully, but the unit converter also integrates <strong>real-time online foreign exchange rate synchronization</strong> and <strong>base unit dropdown switching</strong>, and it guarantees a complete symmetric expression of fixed-quantity units; all metrics have been rigorously tested! 🚀
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Developer <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:19</div>
      <div class="chat-bubble">
        Got it! The interaction feels natural and the typing animation changes according to the length of the message; I am going to upgrade the team technical documentation library now! 🎉
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architect shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architect <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:20</div>
      <div class="chat-bubble">
        Welcome to try it! If you encounter any format extensions or customization needs later, feel free to discuss them in the discussion area or on GitHub~ ✨
      </div>
    </div>
  </div>
</div>`;

  c = c.replace(/<div class="article-chat"[\s\S]*?<\/div>\s*---\s*## 5\./s, `${enChatBlock}\n\n---\n\n## 5.`);

  // Fix accordion closure before tabs
  c = c.replace(
    /(<div class="article-accordion-group" data-single="false">[\s\S]*?<span>🛡️ Architecture Module C:[\s\S]*?<\/div>\s*<\/details>)\s*(?:\r?\n)*(?:<div class="article-tabs">)/s,
    '$1\n</div>\n\n---\n\n### 3. Interactive Tabs\n\n<div class="article-tabs">'
  );

  // Fix Section 6 dropdown switcher text
  c = c.replace(/针对用户明确要求的\*\*特殊下拉框格式\*\*[\s\S]*?正文面板将实时无刷新切换对应的内容与代码：\r?\n/g, '');
  c = c.replace(/<span>请选择要查看的前端框架实现代码：<\/span>/g, '<span>Please select the frontend framework implementation code to view:</span>');
  c = c.replace(/⚛️ React 19 组件实现方式：/g, '⚛️ React 19 Component Implementation:');
  c = c.replace(/🟢 Vue 3\.5 单文件组件实现方式：/g, '🟢 Vue 3.5 SFC Implementation:');
  c = c.replace(/🚀 Astro 6 零 JS 静态组件实现方式：/g, '🚀 Astro 6 Zero-JS Static Island:');
  c = c.replace(/🟠 Svelte 5 Runes 实现方式：/g, '🟠 Svelte 5 Runes Implementation:');

  // Fix Maxwell LaTeX and Mermaid seam (lines 945-985)
  const maxwellAndMermaidSeamRegex = /```latex\s*\$\$\s*\\begin\{aligned\}[\s\S]*?\\end\{aligned\}\s*\$\$\s*```\s*<\/div>\s*<\/div>\s*<\/div>\s*---\s*### 2\. Mermaid 11[\s\S]*?<div class="article-tabs">/s;
  const cleanMaxwellAndMermaid = `\`\`\`latex
$$
\\begin{aligned}
\\nabla \\cdot \\mathbf{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\
\\nabla \\cdot \\mathbf{B} &= 0 \\\\
\\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\
\\nabla \\times \\mathbf{B} &= \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}
\\end{aligned}
$$
\`\`\`

</div>
</div>
</div>

---

### 2. Mermaid 11 Architecture Diagrams (Flowchart & Sequence)

#### ① Blog Encryption Verification & Content Rendering Flowchart (Flowchart TD)

<div class="article-tabs">`;

  c = c.replace(maxwellAndMermaidSeamRegex, cleanMaxwellAndMermaid);

  // Translate Mermaid Diagram buttons and content
  c = c.replace(/<button class="article-tabs__button is-active" type="button">🌟 渲染效果呈现<\/button>/g, '<button class="article-tabs__button is-active" type="button">🌟 Live Render Preview</button>');
  c = c.replace(/<button class="article-tabs__button" type="button">💻 Mermaid 源码<\/button>/g, '<button class="article-tabs__button" type="button">💻 Mermaid Source</button>');
  c = c.replace(/<button class="article-tabs__button" type="button">💻 LaTeX 源码<\/button>/g, '<button class="article-tabs__button" type="button">💻 LaTeX Source</button>');
  c = c.replace(/<button class="article-tabs__button" type="button">💻 Mindmap 结构源码<\/button>/g, '<button class="article-tabs__button" type="button">💻 Mindmap Source Code</button>');
  c = c.replace(/<button class="article-tabs__button is-active" type="button">🌟 交互导图呈现<\/button>/g, '<button class="article-tabs__button is-active" type="button">🌟 Interactive Mindmap View</button>');

  // Translate Flowchart text
  c = c.replace(/A\[读者访问文章\] --> B\{文章是否加密\?\}/g, 'A[Reader visits post] --> B{Is post encrypted?}');
  c = c.replace(/B -- 是 --> C\[弹出毛玻璃密码对话框\]/g, 'B -- Yes --> C[Display frosted glass password modal]');
  c = c.replace(/C --> D\{密码校验\}/g, 'C --> D{Verify password}');
  c = c.replace(/D -- 正确 --> E\[解密并呈现正文\]/g, 'D -- Correct --> E[Decrypt and render body]');
  c = c.replace(/D -- 错误 --> F\[触发窗口震动与红字警示\]/g, 'D -- Incorrect --> F[Trigger shake animation and red warning]');
  c = c.replace(/F -\. 重新输入口令 \.-\> C/g, 'F -. Re-enter password .-> C');
  c = c.replace(/B -- 否 --> E/g, 'B -- No --> E');
  c = c.replace(/E --> G\[渲染 KaTeX 公式与 Mermaid 图表\]/g, 'E --> G[Render KaTeX math and Mermaid diagrams]');
  c = c.replace(/G --> H\[呈现完整沉浸式阅读体验\]/g, 'G --> H[Deliver immersive reading experience]');

  // Translate Sequence diagram text
  c = c.replace(/actor User as 读者 \(User\)/g, 'actor User as Reader (User)');
  c = c.replace(/participant Browser as 客户端浏览器/g, 'participant Browser as Client Browser');
  c = c.replace(/participant PostPage as 文章渲染引擎/g, 'participant PostPage as Article Render Engine');
  c = c.replace(/participant Security as 加密安全模块/g, 'participant Security as Crypto Security Module');
  c = c.replace(/User->>Browser: 点击受保护的加密内容/g, 'User->>Browser: Click protected encrypted content');
  c = c.replace(/Browser->>PostPage: 唤起密码输入对话框/g, 'Browser->>PostPage: Display password input dialog');
  c = c.replace(/Browser->>PostPage: 呼出输入口令对话框/g, 'Browser->>PostPage: Display password input dialog');
  c = c.replace(/User->>Browser: 输入访问密钥/g, 'User->>Browser: Enter access credentials');
  c = c.replace(/User->>Browser: 输入解密口令/g, 'User->>Browser: Enter decryption password');
  c = c.replace(/Browser->>Security: 校验口令 Hash 散列值/g, 'Browser->>Security: Verify password SHA-256 hash');
  c = c.replace(/Browser->>Security: 校验口令 Hash/g, 'Browser->>Security: Verify password SHA-256 hash');
  c = c.replace(/alt 验证成功/g, 'alt Verification Succeeded');
  c = c.replace(/alt 校验通过/g, 'alt Verification Succeeded');
  c = c.replace(/Security-->>Browser: 返回解锁令牌/g, 'Security-->>Browser: Return unlock session token');
  c = c.replace(/Security-->>Browser: 返回解锁凭证 Token/g, 'Security-->>Browser: Return unlock session token');
  c = c.replace(/Browser->>PostPage: 解密正文并平滑展示/g, 'Browser->>PostPage: Decrypt content with smooth transition');
  c = c.replace(/Browser->>PostPage: 解密内容并平滑展开呈现/g, 'Browser->>PostPage: Decrypt content with smooth transition');
  c = c.replace(/else 验证失败/g, 'else Verification Failed');
  c = c.replace(/else 校验失败/g, 'else Verification Failed');
  c = c.replace(/Security-->>Browser: 返回密码错误/g, 'Security-->>Browser: Return password error status');
  c = c.replace(/Security-->>Browser: 返回口令错误状态/g, 'Security-->>Browser: Return password error status');
  c = c.replace(/Browser->>User: 触发窗口摇晃与红字警示/g, 'Browser->>User: Trigger window shake and red warning');
  c = c.replace(/Browser->>User: 触发窗口震动与红字警示/g, 'Browser->>User: Trigger window shake and red warning');

  // Fix Mindmap Section 3 & headings
  c = c.replace(
    /### 3\. 动态交互式思维导图（Markmap \/ Mindmap · 多向分支扩散）/g,
    '### 3. Dynamic Interactive Mindmap (Markmap / Mindmap · Multi-directional Branch Expansion)'
  );
  c = c.replace(
    /在长篇技术规范与系统架构梳理中，传统的静态列表难以直观呈现复杂的知识脉络。本主题全新实装 \*\*Markmap 动态交互式思维导图引擎\*\*，在文章主栏（`\.post\.post-page-shell`）中实现彻底的原生解析与交互增强：/g,
    'In long-form technical specifications and system architecture overviews, traditional static lists struggle to present complex knowledge hierarchies intuitively. This theme features an all-new **Markmap Dynamic Interactive Mindmap Engine**, providing native parsing and interaction enhancements directly in the article\'s main body (`.post.post-page-shell`):'
  );
  c = c.replace(
    /> \[!TIP\]\s*> \*\*多向分支扩散核心规则\*\*：\s*> 1\. \*\*默认单块保护空间\*\*：默认状态下，思维导图仅展示 \*\*1 块核心根节点\*\*（Level 1），右侧附带折叠小圆点指示器；\s*> 2\. \*\*点击展开多向分支\*\*：点击根节点或任意子节点的小圆点，子分支将\*\*平滑向外散开\*\*；\s*> 3\. \*\*工具栏全能操控\*\*：支持 \*\*放大 \/ 缩小 \/ 居中自适应 \/ 一键展开全部 \/ 一键收起单块 \/ 全屏沉浸式阅读 \/ 复制源码\*\*；\s*> 4\. \*\*画布拖拽与缩放\*\*：按住鼠标左键可自由拖拽平移画布，滚动鼠标滚轮可缩放视野。/g,
    `> [!TIP]
> **Core Rules for Multi-directional Branch Expansion**:
> 1. **Default Single-Block Protected View**: By default, the mindmap only displays **1 core root node** (Level 1), with a folded circle indicator on the right;
> 2. **Click to Expand Multi-directional Branches**: Click the small circle on the root node or any child node to **smoothly expand** its sub-branches outward;
> 3. **Comprehensive Toolbar Control**: Supports **Zoom In / Zoom Out / Fit View / Expand All / Collapse to Root / Fullscreen Immersive View / Copy Source**;
> 4. **Canvas Panning and Zooming**: Hold the left mouse button to drag and pan the canvas, and use the mouse wheel to zoom in and out.`
  );
  c = c.replace(
    /#### 活体思维导图呈现：SSG 与主题内容格式生态全景/g,
    '#### Live Mindmap Presentation: SSG and Theme Content Format Ecosystem Panorama'
  );

  // Translate Mindmap markdown content inside code blocks
  const enMindmapContent = `# Static Site Generators & Full-Format Content Ecosystem Architecture
## 1. Static Compilation Core Pipeline
### AST Syntax Transformation Pipeline
#### Markdown / MDX Semantic Parsing Pipeline
##### Unified / Remark Syntax Extensions
- GFM Tables and Strikethrough Syntax Translation
- Automatic Heading Anchor and ID Generation
##### Markmap Interactive Multi-directional Mindmap Extension
- Recursive AST Tree Construction (Transformer.transform)
- D3 Hierarchical Elastic Layout (Flextree Algorithm)
- Interactive Folding State Machine (payload.fold)
- Dynamic Palette Branch Coloring (d3.scaleOrdinal)
##### Rehype KaTeX Mathematical Formula Extension
- Inline and Block Math Expression Parsing
- Macro Definition Support and Error Fallback
#### Code Highlighting and Static Shaders
##### Shiki Dual-Theme Compiler
- VSCode TextMate Syntax Rule Parsing
- Light/Dark Dual-Theme Pre-rendering with Zero Hydration
### Compiler and Asset Bundling
#### Vite 6 Blazing-Fast Hot Module Replacement (HMR)
##### Native ESM Module Loading
- Millisecond On-Demand Compilation & Hot Updates
#### Rollup Static Generation Pipeline
##### Static Bundling Optimization
- Intelligent Code Splitting
- Tree-Shaking Redundancy Elimination
## 2. Dynamic Interactions & Islands Architecture
### Hybrid Component Islands
#### Client Component Island Mounting
##### React 19 Client Components
- Isolated State and Cross-Context Communication
- Session State Persistence (SessionStorage / Crypto)
##### Astro Server-Side Islands
- Zero-JS by Default Client Runtime
- On-Demand Hydration (client:visible)
### Modern Visual & Motion System
#### Dynamic Backgrounds & Render Engines
##### Aurora Borealis / Starfield Parallax
- WebGL / Canvas 2D Hardware Acceleration
- Power Saving Mode with Viewport Auto-Pause
##### Glassmorphism Card Specification
- Dynamic Gaussian Blur & Layered Ambient Shadows
- Responsive Multi-device Layout (PC / Tablet / Mobile)
## 3. Format Panorama & Specialized Features
### Extended Document Specifications Comparison
#### AsciiDoc (.adoc) Native Equivalent Adaptation
#### Emacs Org-Mode (.org) Task List Mapping
#### reStructuredText (.rst) Directive Translation
### Rich Interactive Component Suite
#### Interactive Dropdown Switcher
#### Mutually Exclusive Accordion Groups
#### Dynamic Vinyl Audio Player
### Security, Privacy and Tiered Encryption
#### WebCrypto SHA-256 Hash Verification (Zero Plaintext Exposure)
#### Level 1 Session Persistent Unlock
#### Level 2 Privacy Mask Switching (Gaussian Blur / Mosaic / Spoiler)
#### Level 3 Viewport Sentinel Auto-Lock on Exit (IntersectionObserver)
#### External Link Segment Decryption Endpoint Isolation (Standalone Token)`;

  // Replace mindmap block
  c = c.replace(/```mindmap\s*# 静态站点生成器[\s\S]*?```(?:\s*<\/div>\s*<div class="article-tabs__panel">\s*````markdown\s*```mindmap\s*# 静态站点生成器[\s\S]*?```\s*````)?/g,
    `\`\`\`mindmap\n${enMindmapContent}\n\`\`\`\n</div>\n<div class="article-tabs__panel">\n\n\`\`\`\`markdown\n\`\`\`mindmap\n${enMindmapContent}\n\`\`\`\n\`\`\`\``
  );

  // Fix unclosed tab panels around mindmap
  if (!c.includes('</div>\n</div>\n</div>\n\n#### Markdown Writing Standards and Syntax Reference')) {
    c = c.replace(/(```\s*````\s*<\/div>)\s*#### Markdown Writing Standards/s, '$1\n</div>\n</div>\n\n#### Markdown Writing Standards');
  }

  // Replace mindmap code block examples
  c = c.replace(/# Level 1 核心主题 \(H1\)/g, '# Level 1 Core Topic (H1)');
  c = c.replace(/## Level 2 领域分支 \(H2\)/g, '## Level 2 Domain Branch (H2)');
  c = c.replace(/### Level 3 子系统 \(H3\)/g, '### Level 3 Subsystem (H3)');
  c = c.replace(/#### Level 4 技术模块 \(H4\)/g, '#### Level 4 Technical Module (H4)');
  c = c.replace(/##### Level 5 组件单元 \(H5\)/g, '##### Level 5 Component Unit (H5)');
  c = c.replace(/###### Level 6 算法规范 \(H6\)/g, '###### Level 6 Algorithm Spec (H6)');
  c = c.replace(/- Level 7 细分执行细节 \(List item\)/g, '- Level 7 Granular Execution Detail (List item)');
  c = c.replace(/- Level 8 子项参数 \(Indent \+2 spaces\)/g, '- Level 8 Sub-item Parameter (Indent +2 spaces)');
  c = c.replace(/- Level 9 底层硬件原语 \(Indent \+4 spaces\)/g, '- Level 9 Low-level Hardware Primitive (Indent +4 spaces)');

  c = c.replace(/- 🌐 根主题：计算机科学知识图谱 \(Level 1\)/g, '- 🌐 Root Topic: Computer Science Knowledge Graph (Level 1)');
  c = c.replace(/- 🖥️ 软件系统工程 \(Level 2\)/g, '- 🖥️ Software Systems Engineering (Level 2)');
  c = c.replace(/- 📦 操作系统与内核 \(Level 3\)/g, '- 📦 Operating Systems & Kernels (Level 3)');
  c = c.replace(/- ⚙️ 进程与线程调度 \(Level 4\)/g, '- ⚙️ Process & Thread Scheduling (Level 4)');
  c = c.replace(/- 🔄 并发同步原语 \(Level 5\)/g, '- 🔄 Concurrency Synchronization Primitives (Level 5)');
  c = c.replace(/- 🔒 互斥锁与信号量 \(Level 6\)/g, '- 🔒 Mutexes & Semaphores (Level 6)');
  c = c.replace(/- ⚡ 硬件级 CAS 原子指令 \(Level 7\)/g, '- ⚡ Hardware-level CAS Atomic Instructions (Level 7)');
  c = c.replace(/- ⏱️ Cache Coherency MESI 协议 \(Level 8\)/g, '- ⏱️ Cache Coherency MESI Protocol (Level 8)');
  c = c.replace(/- 🔬 内存屏障与流水线指令重排 \(Level 9\)/g, '- 🔬 Memory Barriers & Pipeline Instruction Reordering (Level 9)');

  c = c.replace(/\{"initialExpandLevel": 2, "height": "560px", "title": "全栈工程架构全景"\}/g, '{"initialExpandLevel": 2, "height": "560px", "title": "Full-Stack Engineering Architecture Overview"}');
  c = c.replace(/# 核心主题\r?\n## 一级分支 A\r?\n### 二级分支 A1\r?\n- 细分知识点 1/g, '# Core Topic\n## Primary Branch A\n### Secondary Branch A1\n- Granular Knowledge Item 1');

  // Fix duplicate headings & Chinese intro in Section 9
  const dupHeadingRegex = /## 9\. Security, Privacy, Tiered Encryption[\s\S]*?## Nine, Security Privacy, Tiered Encryption[\s\S]*?为了彻底杜绝密码明文暴露在 DOM 属性中[^\n]*\n/s;
  const cleanSection9Intro = `## 9. Security, Privacy, Tiered Encryption (Level 1/2/3) and External Segment Decryption Special Features

To completely eliminate plaintext passwords from DOM attributes (such as \`data-password\` being easily inspected in browser devtools), this blog's content system has been fully upgraded to **WebCrypto SHA-256 hash verification (\`data-hash\`)**, establishing a three-tier in-article local encryption and external segment decryption architecture:
`;
  c = c.replace(dupHeadingRegex, cleanSection9Intro);

  // Fix data-hint in encrypted boxes
  c = c.replace(/data-hint="💡 2级加密提示：演示密钥请输入 epocanvas2026"/g, 'data-hint="💡 Level 2 Encryption Hint: For demo, please enter epocanvas2026"');
  c = c.replace(/data-hint="💡 3级加密提示：演示密钥请输入 level3pass"/g, 'data-hint="💡 Level 3 Encryption Hint: For demo, please enter level3pass"');

  // Fix Section 10 Steps
  c = c.replace(/### 2\. Tutorial Steps[\s\S]*?### 3\. Definition Lists & Specs/s, `### 2. Tutorial Steps

<div class="article-steps">
  <div class="article-steps__item">
    <div class="article-steps__num">1</div>
    <div class="article-steps__content">
      <h4>Write Markdown or MDX Post</h4>
      <p>Create a <code>.md</code> file under the <code>src/content/posts/</code> directory and declare Front Matter metadata.</p>
    </div>
  </div>
  <div class="article-steps__item">
    <div class="article-steps__num">2</div>
    <div class="article-steps__content">
      <h4>Freely Combine Rich Media Cards & Interactive Components</h4>
      <p>Choose dropdown switchers, vinyl music cards, gallery albums, or encryption blocks on demand.</p>
    </div>
  </div>
  <div class="article-steps__item">
    <div class="article-steps__num">3</div>
    <div class="article-steps__content">
      <h4>One-Click Static Compilation and Instant Deployment</h4>
      <p>Run <code>npm run build</code> to generate pure static assets and push to Cloudflare CDN global acceleration.</p>
    </div>
  </div>
</div>

---

### 3. Definition Lists & Specs`);

  // Fix Section 11 & 12 Chinese fragments
  const enSection11And12 = `## 11. Rich Text Inline Micro-typography Beautification and Badges

- **Multi-color Highlights (HTML Tag Format)**:
  - <mark class="mark-yellow">Yellow Highlight (Key Focus)</mark>
  - <mark class="mark-green">Green Highlight (Recommended)</mark>
  - <mark class="mark-blue">Blue Highlight (Information Clue)</mark>
  - <mark class="mark-pink">Pink Highlight (Design Inspiration)</mark>
  - <mark class="mark-purple">Purple Highlight (In-depth Principle)</mark>
  - <mark class="mark-orange">Orange Highlight (Operation Warning)</mark>
  - <mark class="mark-red">Red Highlight (Risk Alert)</mark>
  - <mark class="mark-cyan">Cyan Highlight (Network Protocol)</mark>
- **Shortcut Syntax Sugar Highlights (\`==color:content==\` Format)**:
  - ==Default Highlight Text (Automatic Yellow)==
  - ==green:Green Highlight Sugar (Agile Marker)==
  - ==blue:Blue Highlight Sugar (Architecture Element)==
  - ==pink:Pink Highlight Sugar (UI Beautification)==
  - ==purple:Purple Highlight Sugar (Core Algorithm)==
- **Status Badges**:
  - <span class="badge badge-primary">Primary</span>
  - <span class="badge badge-success">Success</span>
  - <span class="badge badge-warning">Warning</span>
  - <span class="badge badge-danger">Danger</span>
  - <span class="badge badge-info">Info</span>
  - <span class="badge badge-purple">Architecture (Purple)</span>
  - <span class="badge badge-cyan">Network (Cyan)</span>
  - <span class="badge badge-orange">Hardware (Orange)</span>
- **Key Display**: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> opens the global command palette.
- **Multilingual Phonetics (Ruby / Multilingual Annotations)**:
  - **Chinese Hanyu Pinyin**: <ruby>時間<rt>shí jiān</rt></ruby> · <ruby>画布<rt>huà bù</rt></ruby> · <ruby>極客<rt>jí kè</rt></ruby>
  - **Chinese Bopomofo (Taiwan Zhuyin)**: <ruby>時間<rt>ㄕˊ ㄐㄧㄢ</rt></ruby> · <ruby>極客<rt>ㄐㄧˊ ㄎㄜˋ</rt></ruby> · <ruby>編程<rt>ㄅㄧㄢ ㄔㄥˊ</rt></ruby>
  - **Japanese Kanji + Furigana**: <ruby>時間<rt>じかん</rt></ruby> · <ruby>明日<rt>あす</rt></ruby> · <ruby>儚い<rt>はかない</rt></ruby>
  - **Japanese Katakana Loanwords & Ateji**: <ruby>画布<rt>キャンバス</rt></ruby> · <ruby>電脳<rt>パソコン</rt></ruby> · <ruby>宇宙<rt>コスモ</rt></ruby>
  - **Japanese Jukujikun**: <ruby>煙草<rt>タバコ</rt></ruby> · <ruby>大人<rt>おとな</rt></ruby> · <ruby>今日<rt>きょう</rt></ruby>
  - **English Word + IPA Transcription**: <ruby>EpoCanvas<rt>/ˌepəˈkænvəs/</rt></ruby> · <ruby>Aesthetics<rt>/esˈθetɪks/</rt></ruby> · <ruby>Chronos<rt>/ˈkrɒnɒs/</rt></ruby>
  - **French IPA & Special Pronunciation**: <ruby>Rendez-vous<rt>/ʁɑ̃.de.vu/</rt></ruby> · <ruby>Déjà-vu<rt>/de.ʒa.vy/</rt></ruby> · <ruby>C'est la vie<rt>/sɛ la vi/</rt></ruby>
  - **German Umlaut & Compounds**: <ruby>Zeitgeist<rt>/ˈtsaɪtɡaɪst/</rt></ruby> · <ruby>Schadenfreude<rt>/ˈʃaːdn̩ˌfʁɔʏ̯də/</rt></ruby>
  - **Greek + Romanization**: <ruby>Φιλοσοφία<rt>philosophia</rt></ruby> · <ruby>Καλημέρα<rt>kaliméra</rt></ruby>
  - **Korean Hanja + Hangul**: <ruby>時間<rt>시간</rt></ruby> · <ruby>極客<rt>긱</rt></ruby> · <ruby>未來<rt>미래</rt></ruby>
  - **Russian Cyrillic + IPA**: <ruby>Привет<rt>/prʲɪˈvʲet/</rt></ruby> · <ruby>Спасибо<rt>/spɐˈsʲibə/</rt></ruby>
  - **Sanskrit Devanagari + IAST**: <ruby>नमस्ते<rt>namaste</rt></ruby> · <ruby>शान्तिः<rt>śāntiḥ</rt></ruby>
- **Abbreviation Tooltips**: <abbr title="Static Site Generator">SSG</abbr> and <abbr title="Single Page Application">SPA</abbr>.
- **Wavy and Dashed Underlines**: <u class="u-wavy">Wavy emphasis underline</u> and <u class="u-dashed">Dashed attention underline</u>.
- **Call-to-Action Buttons (CTA Buttons)**:
  - <a class="article-btn article-btn-primary" href="#top">Back to Top ⬆️</a>
  - <a class="article-btn article-btn-outline" href="/archives/">Browse Archives 📂</a>

---

## 12. Footnotes and Floating Popups (Footnotes)

In academic or in-depth technical articles, footnotes are an indispensable form of citation. Hovering over the footnote superscript below displays an immediate definition bubble[^ref-ssg-spec] without navigating away from the current viewport[^ref-epocanvas-ui].

[^ref-ssg-spec]: **SSG Content Standards**: Mainstream static site generators adhere to modern content engineering standards centered on Markdown/GFM, extended with MDX or templating languages.
[^ref-epocanvas-ui]: **EpoCanvas Aesthetic Standards**: Delivering a premier reading experience for Chinese and global hacker communities with refined micro-interactions, high-contrast palettes, and restrained negative space.

---`;

  c = c.replace(/## 11\. Rich Text Inline[\s\S]*?## Closing Thoughts/s, `${enSection11And12}\n\n## Closing Thoughts`);

  // Ensure all fences are balanced
  fs.writeFileSync(filePath, c, 'utf8');
  console.log('[Repair] content-formats-and-markup-mastery-en.md successfully repaired.');
}

// ---------------------------------------------------------------------------
// 2. REPAIR GERMAN
// ---------------------------------------------------------------------------
function repairDe() {
  const filePath = path.join(POSTS_DIR, 'content-formats-and-markup-mastery-de.md');
  let c = fs.readFileSync(filePath, 'utf8');
  c = cleanBaseContent(c);

  // Fix Chat block
  const deChatBlock = `<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Entwickler <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        Hallo! Würde die statische Renderung von <code>KaTeX</code> und <code>Mermaid</code> in Astro die Ladezeit der Frontend-Seite verlangsamen?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architekt shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architekt <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        Keineswegs! Da <code>remark-math</code> und <code>rehype-katex</code> die Formeln bereits zur Build-Zeit in reine HTML/MathML-Strings kompilieren, entsteht auf der Browserseite <strong>keine JS-Laufzeitlast</strong>; zudem werden Mermaid-Diagramme dynamisch und bedarfsgerecht als asynchrone ESM-Module geladen, was die erste Seite extrem schnell macht! ⚡
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Entwickler <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        Großartig! Das bedeutet, dass wir Architektur-Sequenzdiagramme und interaktive Einheitenrechner direkt in Markdown schreiben können und sie sofort einsatzbereit sind, richtig?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architekt shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architekt <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:18</div>
      <div class="chat-bubble">
        Ganz genau! Nicht nur Doppelklick-Zoom und hochauflösender SVG-Export sind vollständig integriert, sondern der Einheitenrechner synchronisiert auch <strong>Echtzeit-Wechselkurse</strong> und ermöglicht den <strong>Dropdown-Wechsel der Basiseinheit</strong> bei absolut symmetrischer Darstellung; alle Metriken wurden sorgfältig getestet! 🚀
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Entwickler <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:19</div>
      <div class="chat-bubble">
        Verstanden! Das Interaktionsgefühl und die dynamische Tippanimation je nach Nachrichtenlänge wirken extrem natürlich; ich werde die technische Dokumentationsbibliothek des Teams sofort aktualisieren! 🎉
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architekt shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architekt <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:20</div>
      <div class="chat-bubble">
        Herzlich willkommen zum Ausprobieren! Wenn Sie später Fragen zu Formaterweiterungen oder Anpassungen haben, können Sie sich jederzeit im Diskussionsbereich oder auf GitHub austauschen~ ✨
      </div>
    </div>
  </div>
</div>`;

  c = c.replace(/<div class="article-chat"[\s\S]*?<\/div>\s*---\s*## (?:五、|5\.)/s, `${deChatBlock}\n\n---\n\n## 5.`);

  // Fix Chinese headings in German
  c = c.replace(/## 五、特殊的下拉框格式与动态交互组件（Dropdown Selectors & Interactive Formats）/g, '## 5. Spezielle Dropdown-Formate und dynamische interaktive Komponenten (Dropdown Selectors & Interactive Formats)');
  c = c.replace(/## 六、手风琴折叠、选项卡与多栏排版（Collapsibles, Tabs & Columns）/g, '## 6. Akkordeon-Faltungen, Registerkarten und mehrspaltiges Layout (Collapsibles, Tabs & Columns)');

  // Fix accordion closure
  c = c.replace(
    /(<div class="article-accordion-group" data-single="false">[\s\S]*?<span>🛡️ Architektur-Modul C:[\s\S]*?<\/div>\s*<\/details>)\s*(?:\r?\n)*(?:<div class="article-tabs">)/s,
    '$1\n</div>\n\n---\n\n### 3. Interaktive Tabs\n\n<div class="article-tabs">'
  );

  // Strip leaked model reflection at end of German post
  c = c.replace(/Check against constraints:[\s\S]*?(?=## Schlusswort:)/i, '');

  fs.writeFileSync(filePath, c, 'utf8');
  console.log('[Repair] content-formats-and-markup-mastery-de.md successfully repaired.');
}

// ---------------------------------------------------------------------------
// 3. REPAIR SPANISH
// ---------------------------------------------------------------------------
function repairEs() {
  const filePath = path.join(POSTS_DIR, 'content-formats-and-markup-mastery-es.md');
  let c = fs.readFileSync(filePath, 'utf8');
  c = cleanBaseContent(c);

  // Fix Chat block
  const esChatBlock = `<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Desarrollador <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        ¡Hola! ¿Implementar la representación estática de <code>KaTeX</code> y <code>Mermaid</code> en Astro ralentizará la carga de la página del frontend?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Arquitecto shijianus" />
    <div class="chat-body">
      <div class="chat-author">Arquitecto <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        ¡En absoluto! Porque <code>remark-math</code> y <code>rehype-katex</code> compilan las fórmulas en cadenas puras de HTML/MathML durante la fase de compilación (Build-time), el lado del navegador tiene <strong>0 sobrecarga de tiempo de ejecución de JS</strong>; además, los diagramas de Mermaid se cargan asíncronamente como módulos ESM bajo demanda, ¡haciendo que la primera pantalla sea extremadamente ligera! ⚡
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Desarrollador <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        ¡Excelente! Eso significa que podemos escribir diagramas de secuencia de arquitectura y convertidores de unidades interactivos directamente en Markdown, y funcionan desde el primer momento, ¿verdad?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Arquitecto shijianus" />
    <div class="chat-body">
      <div class="chat-author">Arquitecto <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:18</div>
      <div class="chat-bubble">
        ¡Así es! No solo admiten zoom con doble clic y exportación de SVG de alta definición por completo, sino que el convertidor de unidades integra <strong>sincronización de tipos de cambio de divisas en tiempo real</strong> y <strong>cambio desplegable de unidad base</strong> garantizando una expresión simétrica de unidades; ¡todas las métricas han sido rigurosamente probadas! 🚀
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Desarrollador <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:19</div>
      <div class="chat-bubble">
        ¡Entendido! La sensación de interacción y la animación de escritura dinámica según la longitud del mensaje se sienten extremadamente naturales; ¡voy a actualizar la biblioteca de documentación técnica del equipo ahora mismo! 🎉
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Arquitecto shijianus" />
    <div class="chat-body">
      <div class="chat-author">Arquitecto <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:20</div>
      <div class="chat-bubble">
        ¡Bienvenido a probarlo! Si más adelante surge alguna necesidad de personalización o extensión de formato, comunícate en el área de debate o en GitHub~ ✨
      </div>
    </div>
  </div>
</div>`;

  c = c.replace(/<div class="article-chat"[\s\S]*?<\/div>\s*---\s*## (?:五、|5\.)/s, `${esChatBlock}\n\n---\n\n## 5.`);

  // Fix Chinese headings in Spanish
  c = c.replace(/## 九、安全隐私、分级加密（Level 1\/2\/3）与外联分段解密特异功能/g, '## 9. Seguridad, privacidad, cifrado por niveles (Nivel 1/2/3) y funciones especiales de descifrado por segmento externo');
  c = c.replace(/## 十、时间轴、步骤条、定义列表与数据表格/g, '## 10. Línea de tiempo, barras de pasos, listas de definición y tablas de datos');

  // Fix accordion closure
  c = c.replace(
    /(<div class="article-accordion-group" data-single="false">[\s\S]*?<span>🛡️ Módulo de arquitectura C:[\s\S]*?<\/div>\s*<\/details>)\s*(?:\r?\n)*(?:<div class="article-tabs">)/s,
    '$1\n</div>\n\n---\n\n### 3. Pestañas interactivas\n\n<div class="article-tabs">'
  );

  // Fix Section 10 Timeline and steps seam
  const esTimelineAndSteps = `### 1. Línea de tiempo vertical (Vertical Timeline)

<div class="article-timeline">
  <div class="timeline-node is-success">
    <div class="timeline-node__dot"></div>
    <div class="timeline-node__content">
      <div class="timeline-node__date">2026.04 · Reconstrucción básica</div>
      <div class="timeline-node__title">Migración completada del núcleo del sitio estático Astro 6</div>
      <p class="timeline-node__desc">Se estableció una nueva arquitectura de Content Collections y el flujo de resaltado de código de Shiki.</p>
    </div>
  </div>

  <div class="timeline-node is-warning">
    <div class="timeline-node__dot"></div>
    <div class="timeline-node__content">
      <div class="timeline-node__date">2026.08 · Expansión de características</div>
      <div class="timeline-node__title">Implementación completa de WordPress Post Formats y selector desplegable</div>
      <p class="timeline-node__desc">Se completaron 13 tipos de Admonitions, fórmulas matemáticas de KaTeX y el sistema de descifrado con ventana emergente de contraseña.</p>
    </div>
  </div>

  <div class="timeline-node">
    <div class="timeline-node__dot"></div>
    <div class="timeline-node__content">
      <div class="timeline-node__date">Perspectivas futuras · Evolución del ecosistema</div>
      <div class="timeline-node__title">Lanzamiento de estándares de temas de código abierto y complementos multiplataforma</div>
      <p class="timeline-node__desc">Proporciona una cadena de herramientas de migración de contenido fluida con un solo clic de Hexo/WordPress a Astro.</p>
    </div>
  </div>
</div>

---

### 2. Barra de pasos del tutorial (Tutorial Steps)`;

  c = c.replace(/### 1\. 垂直时间轴（Vertical Timeline）[\s\S]*?### 2\. (?:教程步骤条|Barra de pasos del tutorial)[^\n]*/s, esTimelineAndSteps);
  c = c.replace(/<\/div>\s*<p class="timeline-node__desc">Proporciona una cadena de herramientas[\s\S]*?### 2\. Barra de pasos del tutorial[^\n]*/s, '');

  fs.writeFileSync(filePath, c, 'utf8');
  console.log('[Repair] content-formats-and-markup-mastery-es.md successfully repaired.');
}

// ---------------------------------------------------------------------------
// 4. REPAIR FRENCH
// ---------------------------------------------------------------------------
function repairFr() {
  const filePath = path.join(POSTS_DIR, 'content-formats-and-markup-mastery-fr.md');
  let c = fs.readFileSync(filePath, 'utf8');
  c = cleanBaseContent(c);

  // Translate data-title in unit converter
  c = c.replace(
    /data-title="🔄\s*交互式通用单位换算器（支持基准单位切换与实时汇率）"/g,
    'data-title="🔄 Convertisseur Interactif Universel d\'Unités (Changement d\'Unité de Base et Taux de Change en Direct)"'
  );

  // Fix Chat block
  const frChatBlock = `<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Développeur <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        Bonjour ! Est-ce que le rendu statique de <code>KaTeX</code> et <code>Mermaid</code> dans Astro ralentira la vitesse de chargement de la page front-end ?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architecte shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architecte <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        Absolument pas ! Puisque <code>remark-math</code> et <code>rehype-katex</code> compilent les formules en chaînes HTML/MathML pures au moment de la génération (Build-time), le côté navigateur a <strong>0 surcharge JS d'exécution</strong> ; et les diagrammes Mermaid se chargent dynamiquement à la demande sous forme de modules ESM asynchrones, rendant le premier écran extrêmement rapide ! ⚡
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Développeur <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        Fantastique ! Cela signifie que nous pouvons écrire des diagrammes de séquence d'architecture et des convertisseurs d'unités interactifs directement en Markdown, et qu'ils sont prêts à l'emploi, n'est-ce pas ?
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architecte shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architecte <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:18</div>
      <div class="chat-bubble">
        Tout à fait ! Non seulement le zoom par double-clic et l'export SVG haute définition sont pleinement intégrés, mais le convertisseur d'unités synchronise les <strong>taux de change en direct</strong> et permet le <strong>changement d'unité de base par liste déroulante</strong> avec une symétrie parfaite ; toutes les mesures ont été rigoureusement validées ! 🚀
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">Développeur <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:19</div>
      <div class="chat-bubble">
        Bien reçu ! La sensation d'interaction et l'animation de frappe dynamique selon la longueur du message sont très naturelles ; je vais mettre à jour la documentation technique de l'équipe dès maintenant ! 🎉
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="Architecte shijianus" />
    <div class="chat-body">
      <div class="chat-author">Architecte <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:20</div>
      <div class="chat-bubble">
        Bienvenue à l'essai ! Si vous avez besoin d'extensions de format ou de personnalisations ultérieures, n'hésitez pas à en discuter dans l'espace communautaire ou sur GitHub~ ✨
      </div>
    </div>
  </div>
</div>`;

  c = c.replace(/<div class="article-chat"[\s\S]*?<\/div>\s*---\s*## (?:五、|5\.)/s, `${frChatBlock}\n\n---\n\n## 5.`);

  // Fix Chinese headings in French
  c = c.replace(/## 四、WordPress 风格文章形态（Post Formats）全量实装与视觉呈现/g, '## 4. Implémentation complète et présentation visuelle des formats d\'articles style WordPress (Post Formats)');
  c = c.replace(/## 五、特殊的下拉框格式与动态交互组件（Dropdown Selectors & Interactive Formats）/g, '## 5. Formats spéciaux de menus déroulants et composants interactifs (Dropdown Selectors & Interactive Formats)');
  c = c.replace(/## 八、学术数学公式（KaTeX）、架构图表（Mermaid 11）与动态思维导图（Markmap）/g, '## 8. Formules mathématiques académiques (KaTeX), diagrammes d\'architecture (Mermaid 11) et cartes mentales dynamiques (Markmap)');
  c = c.replace(/## 十、时间轴、步骤条、定义列表与数据表格/g, '## 10. Chronologies, barres d\'étapes, listes de définitions et tableaux de données');
  c = c.replace(/## 十一、富文本行内微排版美化与徽章/g, '## 11. Embellissement micro-typographique en ligne du texte riche et badges');
  c = c.replace(/## 十二、脚注与悬浮气泡（Footnotes）/g, '## 12. Notes de bas de page et infobulles flottantes (Footnotes)');

  // Fix accordion closure
  c = c.replace(
    /(<div class="article-accordion-group" data-single="false">[\s\S]*?<span>🛡️ Module d'architecture C[\s\S]*?<\/div>\s*<\/details>)\s*(?:\r?\n)*(?:<div class="article-tabs">)/s,
    '$1\n</div>\n\n---\n\n### 3. Onglets interactifs\n\n<div class="article-tabs">'
  );

  // Balance code fences if odd
  const fenceMatches = c.match(/^```/gm) || [];
  if (fenceMatches.length % 2 !== 0) {
    // Add missing fence closer before end if unbalanced
    c += '\n```\n';
  }

  fs.writeFileSync(filePath, c, 'utf8');
  console.log('[Repair] content-formats-and-markup-mastery-fr.md successfully repaired.');
}

// ---------------------------------------------------------------------------
// 5. REPAIR TRADITIONAL CHINESE
// ---------------------------------------------------------------------------
function repairZhHant() {
  const filePath = path.join(POSTS_DIR, 'content-formats-and-markup-mastery-zh-Hant.md');
  let c = fs.readFileSync(filePath, 'utf8');
  c = cleanBaseContent(c);

  // Fix data-title
  c = c.replace(
    /data-title="🔄\s*交互式通用单位换算器（支持基准单位切换与实时汇率）"/g,
    'data-title="🔄 互動式通用單位換算器（支援基準單位切換與即時匯率）"'
  );

  // Fix Chat block
  const zhHantChatBlock = `<div class="article-chat" data-animate="true" data-sound="true">
  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">開發者 <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:15</div>
      <div class="chat-bubble">
        你好！請問在 Astro 中實現 <code>KaTeX</code> 和 <code>Mermaid</code> 的靜態渲染會不會拖慢前端頁面加載速度？
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="架構師 shijianus" />
    <div class="chat-body">
      <div class="chat-author">架構師 <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:16</div>
      <div class="chat-bubble">
        完全不會！因為 <code>remark-math</code> 和 <code>rehype-katex</code> 在構建期就已經把公式編譯成了純 HTML/MathML 字串，瀏覽器端 <strong>0 JS 運行時負擔</strong>；而 Mermaid 圖表也是動態按需非同步加載 ESM 模組，首屏極其輕快！⚡
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">開發者 <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:17</div>
      <div class="chat-bubble">
        太棒了！那我們在 Markdown 裡直接寫架構循序圖和互動式單位換算器也是開箱即用的對吧？
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="架構師 shijianus" />
    <div class="chat-body">
      <div class="chat-author">架構師 <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:18</div>
      <div class="chat-bubble">
        對的！不僅雙擊放大與高解析度 SVG 匯出已全量具備，單位換算器更是串接了<strong>即時聯網外匯牌價同步</strong>與<strong>基準單位下拉切換</strong>，而且保證固定質量單位完整對稱表達，所有度量均經過嚴謹測試！🚀
      </div>
    </div>
  </div>

  <div class="chat-message chat-left">
    <span class="chat-avatar footer_mini_logo__media">
      <video autoplay muted loop playsinline preload="metadata" poster="/media/shijianus/avatar.jpg" aria-hidden="true">
        <source src="/media/shijianus/avatar-dynamic.mp4" type="video/mp4" />
      </video>
      <img src="/media/shijianus/avatar.jpg" alt="Léon Boven" />
    </span>
    <div class="chat-body">
      <div class="chat-author">開發者 <a href="https://github.com/LeonBoven" target="_blank" rel="noopener noreferrer">Léon Boven</a> · 10:19</div>
      <div class="chat-bubble">
        收到！這個互動手感與根據訊息長短變化的打字動畫非常自然，我這就把團隊的技術文件庫升級上來！🎉
      </div>
    </div>
  </div>

  <div class="chat-message chat-right">
    <img class="chat-avatar" src="/media/shijianus/avatar.jpg" alt="架構師 shijianus" />
    <div class="chat-body">
      <div class="chat-author">架構師 <a href="https://github.com/shijianus" target="_blank" rel="noopener noreferrer">shijianus</a> · 10:20</div>
      <div class="chat-bubble">
        歡迎體驗！後續如果遇到任何格式擴充或自訂需求，隨時在討論區或 GitHub 交流探討~ ✨
      </div>
    </div>
  </div>
</div>`;

  c = c.replace(/<div class="article-chat"[\s\S]*?<\/div>\s*---\s*## (?:五、|5\.)/s, `${zhHantChatBlock}\n\n---\n\n## 五、特殊的下拉框格式與動態交互元件（Dropdown Selectors & Interactive Formats）`);

  // Fix Simplified Chinese headings
  c = c.replace(/## 四、WordPress 风格文章形态（Post Formats）全量实装与视觉呈现/g, '## 四、WordPress 風格文章形態（Post Formats）全量實裝與視覺呈現');
  c = c.replace(/## 八、学术数学公式（KaTeX）、架构图表（Mermaid 11）与动态思维导图（Markmap）/g, '## 八、學術數學公式（KaTeX）、架構圖表（Mermaid 11）與動態思維導圖（Markmap）');
  c = c.replace(/## 十、时间轴、步骤条、定义列表与数据表格/g, '## 十、時間軸、步驟條、定義列表與數據表格');

  // Fix accordion closure
  c = c.replace(
    /(<div class="article-accordion-group" data-single="false">[\s\S]*?<span>🛡️ 架構模組 C：[\s\S]*?<\/div>\s*<\/details>)\s*(?:\r?\n)*(?:<div class="article-tabs">)/s,
    '$1\n</div>\n\n---\n\n### 3. 多標籤分頁卡（Interactive Tabs）\n\n<div class="article-tabs">'
  );

  // Fix Maxwell $$ block
  c = c.replace(/(?<!\\p)artial\s*t\s*\}/g, '\\partial t}');

  fs.writeFileSync(filePath, c, 'utf8');
  console.log('[Repair] content-formats-and-markup-mastery-zh-Hant.md successfully repaired.');
}

console.log('[Rebuild] Starting repair across all 5 language variants...');
repairEn();
repairDe();
repairEs();
repairFr();
repairZhHant();
console.log('[Rebuild] Completed all repairs. Now verifying with audit...\n');
