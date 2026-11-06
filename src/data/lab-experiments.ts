/**
 * Astro Blog「试验田 Lab」官方预设实验注册表
 *
 * 严格遵循原则：
 * 1. 100% 保留原有 4 个核心实验（天体星轨模拟器、3D 纸飞机与气动尾流、Web Audio 触觉声效矩阵、多币种实时汇率换算器）。
 * 2. 为每个实验补全完整的独立可运行源码文件 (`index.html`, `style.css`, `script.js` / `script.ts`)、技术原理、参数说明与版本元数据。
 * 3. 新增「算法逐步执行与调用栈追踪器」与「Verlet 质点物理约束仿真 (TypeScript)」，形成完整的 6 大官方旗舰实验矩阵。
 */

import type { LabExperiment } from '../lib/lab-schema';

export const OFFICIAL_LAB_EXPERIMENTS: LabExperiment[] = [
  {
    id: 'exp-01-star-trails',
    slug: 'star-trails-simulator',
    title: '天体星轨模拟器 (Star Trails Simulator)',
    subtitle: 'Canvas 极坐标长曝光天球旋转物理引擎',
    description:
      '基于 HTML5 Canvas 2D 极坐标投影与帧间半透明混合残影（Alpha Trail Accumulation），模拟不同地球纬度下北天极恒星周日视运动长曝光摄影效果。',
    icon: '🌌',
    author: {
      name: 'shijianus',
      role: 'owner',
      url: 'https://blog.epocanvas.com/about/',
    },
    tags: ['Canvas', '物理仿真', '天体力学', '极坐标', '60FPS'],
    category: 'physics',
    runtime: 'browser-sandbox',
    language: 'html-css-js',
    featured: true,
    version: '1.2.0',
    sourceLicense: 'MIT',
    visibility: 'public',
    moderationStatus: 'approved',
    createdAt: '2026-05-10',
    updatedAt: '2026-11-06',
    defaultParams: [
      {
        id: 'latitude',
        label: '地平纬度 (Latitude)',
        type: 'range',
        defaultValue: 39,
        min: 0,
        max: 90,
        step: 1,
        unit: '° N',
      },
      {
        id: 'speed',
        label: '旋转角速度 (Speed)',
        type: 'range',
        defaultValue: 15,
        min: 1,
        max: 50,
        step: 1,
        unit: 'x0.1',
      },
      {
        id: 'bloom',
        label: '镜头光晕 (Bloom)',
        type: 'boolean',
        defaultValue: true,
      },
    ],
    previewConfig: {
      mode: 'hybrid',
      autoRun: true,
      height: 360,
      timeoutMs: 5000,
      maxConsoleEntries: 200,
      externalResources: [],
    },
    principles: {
      summary:
        '通过将恒星固定在以北天极为原点的极坐标系 (r, θ) 中，每一渲染帧对全屏叠加透明度为 0.15 的深空底色，使历史轨迹按指数衰减保留，无需维护高内存开销的历史顶点队列即可实现平滑星轨。',
      keyPoints: [
        '极坐标椭圆投影：x = cx + r·cos(θ + ωt)，y = cy + 0.6·r·sin(θ + ωt)，模拟地平线仰角透视压缩。',
        '地平纬度映射：观测点纬度 φ 决定北天极在画布垂直方向的高度 cy = H · (1 - 0.7 · φ / 90°)。',
        '帧缓冲残影衰减：使用 rgba(10, 15, 29, 0.15) 覆盖上一帧，实现 O(N) 复杂度恒定内存开销的长曝光尾迹。',
      ],
      complexity: {
        time: 'O(N)/frame (N = 120 恒星粒子)',
        space: 'O(N) 固定粒子数组',
      },
    },
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<div class="star-lab-shell">
  <canvas id="star-canvas" width="560" height="240"></canvas>
  <div class="star-toolbar">
    <label>地平纬度: <strong id="lat-out">39° N</strong>
      <input id="lat-range" type="range" min="0" max="90" value="39" />
    </label>
    <label>角速度: <strong id="spd-out">1.5x</strong>
      <input id="spd-range" type="range" min="1" max="50" value="15" />
    </label>
    <div class="star-btns">
      <button id="btn-clear" type="button">重置清屏</button>
      <button id="btn-bloom" type="button" class="active">光晕: 开启</button>
    </div>
  </div>
</div>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `.star-lab-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
#star-canvas {
  width: 100%;
  height: 240px;
  background: #0a0f1d;
  border-radius: 8px;
  display: block;
}
.star-toolbar {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background: var(--lab-card);
  border: 1px solid var(--lab-border);
  border-radius: 8px;
  font-size: 12px;
}
.star-toolbar label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.star-btns {
  display: flex;
  gap: 8px;
}
.star-btns button {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--lab-border);
  background: transparent;
  color: var(--lab-fg);
  cursor: pointer;
  font-weight: 600;
}
.star-btns button.active {
  background: #425aef;
  color: #fff;
  border-color: #425aef;
}`,
      },
      {
        name: 'script.js',
        language: 'javascript',
        content: `const canvas = document.getElementById('star-canvas');
const ctx = canvas.getContext('2d');
const latRange = document.getElementById('lat-range');
const spdRange = document.getElementById('spd-range');
const latOut = document.getElementById('lat-out');
const spdOut = document.getElementById('spd-out');
const btnClear = document.getElementById('btn-clear');
const btnBloom = document.getElementById('btn-bloom');

let angle = 0;
let bloom = true;
const stars = Array.from({ length: 120 }, (_, i) => ({
  radius: Math.random() * 190 + 10,
  theta: Math.random() * Math.PI * 2,
  size: Math.random() * 1.5 + 0.5,
  color: i % 5 === 0 ? '#60a5fa' : i % 8 === 0 ? '#fde047' : '#ffffff'
}));

console.log('[StarTrails] 已初始化 120 颗恒星极坐标粒子，当前北天极仰角 39° N');

function render() {
  requestAnimationFrame(render);
  const speed = Number(spdRange.value) * 0.0005;
  angle += speed;

  ctx.fillStyle = 'rgba(10, 15, 29, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height * (1 - (Number(latRange.value) / 90) * 0.7);

  for (const s of stars) {
    const cur = s.theta + angle;
    const x = cx + Math.cos(cur) * s.radius;
    const y = cy + Math.sin(cur) * (s.radius * 0.6);
    ctx.beginPath();
    ctx.arc(x, y, s.size, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.shadowBlur = bloom ? 6 : 0;
    ctx.shadowColor = s.color;
    ctx.fill();
  }
}
render();

latRange.addEventListener('input', () => {
  latOut.textContent = latRange.value + '° N';
  console.log('[StarTrails] 调整观测纬度:', latRange.value + '° N');
});
spdRange.addEventListener('input', () => {
  spdOut.textContent = (Number(spdRange.value) / 10).toFixed(1) + 'x';
});
btnClear.addEventListener('click', () => {
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  console.info('[StarTrails] 画布长曝光残影已清零');
});
btnBloom.addEventListener('click', () => {
  bloom = !bloom;
  btnBloom.textContent = bloom ? '光晕: 开启' : '光晕: 关闭';
  btnBloom.classList.toggle('active', bloom);
});`,
      },
    ],
  },
  {
    id: 'exp-02-aerodynamic-contrail',
    slug: 'aerodynamic-contrail',
    title: '3D 纸飞机与气动尾流 (Aerodynamic Contrail)',
    subtitle: 'CSS 3D Transform 空间投射与粒子喷射仿真',
    description:
      '利用 CSS 3D 透视矩阵（Perspective & Preserve-3D）结合欧拉俯仰角（Pitch）与滚转角（Roll）实时变换，配合喷气加速横滚动画模拟纸飞机空间姿态。',
    icon: '✈️',
    author: {
      name: 'shijianus',
      role: 'owner',
      url: 'https://blog.epocanvas.com/about/',
    },
    tags: ['CSS 3D', '空间矩阵', '欧拉角', '硬件加速'],
    category: 'physics',
    runtime: 'browser-sandbox',
    language: 'html-css-js',
    featured: true,
    version: '1.1.0',
    sourceLicense: 'MIT',
    visibility: 'public',
    moderationStatus: 'approved',
    createdAt: '2026-05-12',
    updatedAt: '2026-11-06',
    defaultParams: [
      {
        id: 'pitch',
        label: '俯仰角 (Pitch)',
        type: 'range',
        defaultValue: 15,
        min: -45,
        max: 45,
        step: 1,
        unit: '°',
      },
      {
        id: 'roll',
        label: '滚转角 (Roll)',
        type: 'range',
        defaultValue: -10,
        min: -60,
        max: 60,
        step: 1,
        unit: '°',
      },
    ],
    previewConfig: {
      mode: 'hybrid',
      autoRun: true,
      height: 350,
      timeoutMs: 5000,
      maxConsoleEntries: 200,
      externalResources: [],
    },
    principles: {
      summary:
        '通过父容器构建 perspective: 800px 视锥体，将俯仰角（绕 X 轴旋转 rotateX）与滚转角（绕 Z 轴旋转 rotateZ）合成为 GPU 合成层矩阵变换，避免重排（Reflow）开销。',
      keyPoints: [
        'CSS 3D 视锥投影：perspective: 800px 与 transform-style: preserve-3d 构建局部三维笛卡尔坐标系。',
        '姿态合成：transform: rotateX(pitch) rotateZ(roll) 实时映射飞行器姿态。',
        '720° 横滚机动（Barrel Roll）：通过三次贝塞尔缓动曲线 cubic-bezier(0.4, 0, 0.2, 1) 执行双周绕 Y 轴机动。',
      ],
      complexity: {
        time: 'O(1) GPU 矩阵合成',
        space: 'O(1) DOM 节点',
      },
    },
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<div class="plane-stage">
  <div id="plane-box" class="plane-box">
    <svg viewBox="0 0 24 24" fill="none" class="plane-icon">
      <path d="M21.5 2.5L2 9.5l8.5 3 3 8.5 8-18.5z" fill="#425aef" />
      <path d="M10.5 12.5L21.5 2.5" stroke="#ffffff" stroke-width="1.5" />
    </svg>
  </div>
</div>
<div class="plane-controls">
  <label>俯仰角 (Pitch): <strong id="pitch-out">15°</strong>
    <input id="pitch-in" type="range" min="-45" max="45" value="15" />
  </label>
  <label>滚转角 (Roll): <strong id="roll-out">-10°</strong>
    <input id="roll-in" type="range" min="-60" max="60" value="-10" />
  </label>
  <button id="btn-turbo" type="button">🚀 喷气加速横滚</button>
</div>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `.plane-stage {
  height: 210px;
  border-radius: 8px;
  border: 1px solid var(--lab-border);
  background: radial-gradient(circle, rgba(66, 90, 239, 0.14) 0%, transparent 75%);
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 800px;
  margin-bottom: 12px;
}
.plane-box {
  width: 84px;
  height: 84px;
  transform: rotateX(15deg) rotateZ(-10deg);
  transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
  filter: drop-shadow(0 12px 16px rgba(66, 90, 239, 0.35));
}
.plane-icon {
  width: 100%;
  height: 100%;
}
.plane-box.barrel-roll {
  animation: roll720 1.1s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes roll720 {
  0% { transform: rotateY(0deg) scale(1); }
  50% { transform: rotateY(360deg) scale(1.28); }
  100% { transform: rotateY(720deg) scale(1); }
}
.plane-controls {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background: var(--lab-card);
  border: 1px solid var(--lab-border);
  border-radius: 8px;
  font-size: 12px;
}
.plane-controls label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
#btn-turbo {
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid #425aef;
  background: #425aef;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}`,
      },
      {
        name: 'script.js',
        language: 'javascript',
        content: `const plane = document.getElementById('plane-box');
const pitchIn = document.getElementById('pitch-in');
const rollIn = document.getElementById('roll-in');
const pitchOut = document.getElementById('pitch-out');
const rollOut = document.getElementById('roll-out');
const btnTurbo = document.getElementById('btn-turbo');

function syncAttitude() {
  const pitch = Number(pitchIn.value);
  const roll = Number(rollIn.value);
  pitchOut.textContent = pitch + '°';
  rollOut.textContent = roll + '°';
  plane.style.transform = \`rotateX(\${pitch}deg) rotateZ(\${roll}deg)\`;
  console.log(\`[Aerodynamic] 姿态矩阵已更新: Pitch=\${pitch}°, Roll=\${roll}°\`);
}

pitchIn.addEventListener('input', syncAttitude);
rollIn.addEventListener('input', syncAttitude);
btnTurbo.addEventListener('click', () => {
  console.info('[Aerodynamic] 触发 720° 桶滚加速机动 (Barrel Roll)');
  plane.classList.add('barrel-roll');
  setTimeout(() => plane.classList.remove('barrel-roll'), 1150);
});

console.log('[Aerodynamic] 3D 姿态仿真已就绪 (Pitch=15°, Roll=-10°)');`,
      },
    ],
  },
  {
    id: 'exp-03-web-audio-haptics',
    slug: 'web-audio-haptics',
    title: 'Web Audio 触觉声效矩阵 (Audio Haptics)',
    subtitle: '振荡器实时调频合成交互音效，0 外部音频文件',
    description:
      '完全脱离外部 MP3/WAV 采样文件，直接通过浏览器 Web Audio API 的 OscillatorNode 与 GainNode 指数包络调制，在 10ms 内实时数学合成 6 种微交互触觉音效。',
    icon: '🎛️',
    author: {
      name: 'shijianus',
      role: 'owner',
      url: 'https://blog.epocanvas.com/about/',
    },
    tags: ['Web Audio', '数字信号处理', '音频合成', '零外部依赖'],
    category: 'audio',
    runtime: 'browser-sandbox',
    language: 'html-css-js',
    featured: true,
    version: '1.1.0',
    sourceLicense: 'MIT',
    visibility: 'public',
    moderationStatus: 'approved',
    createdAt: '2026-05-14',
    updatedAt: '2026-11-06',
    previewConfig: {
      mode: 'hybrid',
      autoRun: true,
      height: 340,
      timeoutMs: 5000,
      maxConsoleEntries: 200,
      externalResources: [],
    },
    principles: {
      summary:
        '使用 AudioContext 构建时域与频域信号图：OscillatorNode 负责产生正弦波（sine）、三角波（triangle）、锯齿波（sawtooth）和方波（square），GainNode 通过 exponentialRampToValueAtTime 施加 ADSR 衰减包络。',
      keyPoints: [
        '零网络延迟：0 字节音频静态资源请求，所有声波在内存中按采样率实时计算。',
        '频率扫频调制（Frequency Sweep）：如 Laser Pulse 在 200ms 内从 1400Hz 指数下扫至 100Hz。',
        '和弦叠加（Polyphonic Chord）：同时调度 C5 (523.25Hz)、E5 (659.25Hz)、G5 (783.99Hz)、C6 (1046.5Hz) 四路正弦振荡器合成大三和弦。',
      ],
      complexity: {
        time: 'O(1) 音频线程原生 DSP 合成',
        space: 'O(1) 瞬态节点自动回收',
      },
    },
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<div class="pad-matrix">
  <button class="synth-pad" data-tone="cyber">✨ <strong>Cyber Chime</strong><small>880Hz 正弦琶音</small></button>
  <button class="synth-pad" data-tone="laser">🔫 <strong>Laser Pulse</strong><small>1400→100Hz 指数下扫</small></button>
  <button class="synth-pad" data-tone="click">⌨️ <strong>Mechanical Clack</strong><small>600Hz 三角波瞬态</small></button>
  <button class="synth-pad" data-tone="shutter">📸 <strong>Camera Shutter</strong><small>双脉冲锯齿快门</small></button>
  <button class="synth-pad" data-tone="chord">🔮 <strong>Success Chord</strong><small>C5-E5-G5-C6 共振</small></button>
  <button class="synth-pad" data-tone="jump">👾 <strong>8-Bit Jump</strong><small>150→600Hz 方波阶跃</small></button>
</div>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `.pad-matrix {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.synth-pad {
  padding: 16px 10px;
  border-radius: 8px;
  border: 1px solid var(--lab-border);
  background: var(--lab-card);
  color: var(--lab-fg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.synth-pad:hover {
  border-color: #425aef;
  transform: translateY(-2px);
}
.synth-pad:active {
  transform: scale(0.96);
}
.synth-pad small {
  font-size: 11px;
  color: var(--lab-muted);
}`,
      },
      {
        name: 'script.js',
        language: 'javascript',
        content: `let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function triggerSynth(type) {
  const ctx = getCtx();
  const t = ctx.currentTime;
  console.log('[WebAudio] 触发合成器音色:', type, 'at', t.toFixed(3) + 's');

  if (type === 'cyber') {
    [880, 1108, 1318, 1760].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0.1, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.35);
    });
  } else if (type === 'laser') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  } else if (type === 'click') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  } else if (type === 'shutter') {
    [400, 250].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.12, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.07);
    });
  } else if (type === 'chord') {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  } else if (type === 'jump') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.15);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

document.querySelectorAll('.synth-pad').forEach((btn) => {
  btn.addEventListener('click', () => triggerSynth(btn.dataset.tone));
});
console.log('[WebAudio] 6 路合成器打击垫已绑定，点击任意按钮可实时合成波形');`,
      },
    ],
  },
  {
    id: 'exp-04-fx-converter',
    slug: 'fx-currency-converter',
    title: '多币种实时汇率换算器 (FX Converter)',
    subtitle: 'Stripe 国际收银台多币种自适应转换基准算法',
    description:
      '复现博客国际赞赏收银台的 USD 锚定交叉汇率换算与零小数位货币（Zero-Decimal Currencies，如 JPY）精度舍入规则。',
    icon: '💱',
    author: {
      name: 'shijianus',
      role: 'owner',
      url: 'https://blog.epocanvas.com/about/',
    },
    tags: ['汇率算法', '金融精度', 'Stripe', '工程实用'],
    category: 'utility',
    runtime: 'browser-sandbox',
    language: 'html-css-js',
    featured: true,
    version: '1.1.0',
    sourceLicense: 'MIT',
    visibility: 'public',
    moderationStatus: 'approved',
    createdAt: '2026-05-18',
    updatedAt: '2026-11-06',
    previewConfig: {
      mode: 'hybrid',
      autoRun: true,
      height: 340,
      timeoutMs: 5000,
      maxConsoleEntries: 200,
      externalResources: [],
    },
    principles: {
      summary:
        '通过以 USD = 1.0 为中间结算基准货币（Pivot Currency），将任意源货币金额先归一化为 USD 基准值，再映射至目标货币并按各币种 ISO-4217 小数位规范执行四舍五入。',
      keyPoints: [
        'USD 中间价归一化：amountInUSD = inputAmount / rate[sourceCurrency]，避免维护 N×N 汇率矩阵。',
        '零小数位币种（Zero-Decimal Currency）适配：日元（JPY）采用整数 Math.round 结算，而 CNY/USD/EUR 保留 2 位小数。',
        '输入边界防御：对非数值与负数输入自动兜底为 0，确保计算输出稳定。',
      ],
      complexity: {
        time: 'O(1) 常数级交叉换算',
        space: 'O(K) 币种字典表',
      },
    },
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<div class="fx-panel">
  <div class="fx-inputs">
    <label>输入基准金额
      <input id="fx-amount" type="number" value="10" min="1" max="10000" />
    </label>
    <label>原币种
      <select id="fx-from">
        <option value="USD">USD · 美元</option>
        <option value="CNY">CNY · 人民币</option>
        <option value="EUR">EUR · 欧元</option>
        <option value="JPY">JPY · 日元</option>
        <option value="GBP">GBP · 英镑</option>
        <option value="TWD">TWD · 新台币</option>
        <option value="HKD">HKD · 港币</option>
      </select>
    </label>
  </div>
  <div class="fx-grid">
    <div class="fx-card"><span>CNY (人民币)</span><strong id="out-cny">¥ 72.50</strong></div>
    <div class="fx-card"><span>USD (美元)</span><strong id="out-usd">$ 10.00</strong></div>
    <div class="fx-card"><span>EUR (欧元)</span><strong id="out-eur">€ 9.20</strong></div>
    <div class="fx-card"><span>JPY (日元 · 零小数)</span><strong id="out-jpy">¥ 1520</strong></div>
  </div>
</div>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `.fx-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.fx-inputs {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}
.fx-inputs label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}
.fx-inputs input, .fx-inputs select {
  height: 38px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--lab-border);
  background: var(--lab-card);
  color: var(--lab-fg);
}
.fx-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.fx-card {
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(66, 90, 239, 0.06);
  border: 1px solid rgba(66, 90, 239, 0.18);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fx-card span {
  font-size: 11px;
  color: var(--lab-muted);
}
.fx-card strong {
  font-size: 18px;
  color: #425aef;
  font-family: monospace;
}`,
      },
      {
        name: 'script.js',
        language: 'javascript',
        content: `const rates = { USD: 1, CNY: 7.25, EUR: 0.92, JPY: 152.0, GBP: 0.77, TWD: 32.1, HKD: 7.78 };
const amountEl = document.getElementById('fx-amount');
const fromEl = document.getElementById('fx-from');

function updateFX() {
  const val = Math.max(0, parseFloat(amountEl.value) || 0);
  const from = fromEl.value;
  const usdBase = val / (rates[from] || 1);

  document.getElementById('out-cny').textContent = '¥ ' + (usdBase * rates.CNY).toFixed(2);
  document.getElementById('out-usd').textContent = '$ ' + usdBase.toFixed(2);
  document.getElementById('out-eur').textContent = '€ ' + (usdBase * rates.EUR).toFixed(2);
  document.getElementById('out-jpy').textContent = '¥ ' + Math.round(usdBase * rates.JPY);

  console.log(\`[FXConverter] \${val} \${from} => USD基准 \$\${usdBase.toFixed(4)}\`);
}

amountEl.addEventListener('input', updateFX);
fromEl.addEventListener('change', updateFX);
updateFX();`,
      },
    ],
  },
  {
    id: 'exp-05-algorithm-tracer',
    slug: 'algorithm-execution-tracer',
    title: '算法逐步执行与调用栈追踪器 (Algorithm Step Visualizer)',
    subtitle: '可视化展示代码当前执行行、变量变化、条件分支、数组状态与递归调用栈',
    description:
      '不仅展示算法输出，还将排序、二分查找与递归分治的每一步执行过程拆解为可回放的时间线：支持单步前进/后退、断点暂停、倍速重播与调用栈帧监视。',
    icon: '🧭',
    author: {
      name: 'shijianus',
      role: 'owner',
      url: 'https://blog.epocanvas.com/about/',
    },
    tags: ['执行可视化', '调用栈', '冒泡排序', '二分查找', '递归分治'],
    category: 'algorithm',
    runtime: 'execution-tracer',
    language: 'javascript',
    featured: true,
    version: '1.0.0',
    sourceLicense: 'MIT',
    visibility: 'public',
    moderationStatus: 'approved',
    createdAt: '2026-11-06',
    updatedAt: '2026-11-06',
    previewConfig: {
      mode: 'sandbox-iframe',
      autoRun: true,
      height: 360,
      timeoutMs: 5000,
      maxConsoleEntries: 200,
      externalResources: [],
    },
    visualizationConfig: {
      enabled: true,
      presetAlgorithmId: 'bubble-sort',
      defaultInput: '38, 14, 29, 7, 42, 19, 11',
      description:
        '使用确定性有界状态追踪引擎（Bounded State Tracer），在不调用主站 eval 的前提下生成每一步行号、条件判定、变量快照与调用栈帧。',
    },
    principles: {
      summary:
        '将程序执行拆解为「受限追踪引擎 (Trace Generator)」与「声明式时间线渲染器 (Timeline Visualizer)」两层：追踪引擎采集每一步的源码行号、局部变量表、条件表达式布尔结果、数组索引状态及调用栈深度，前端通过不可变快照数组实现 O(1) 任意步进回放。',
      keyPoints: [
        '执行与渲染解耦：追踪器产出标准化的 TraceStep[] 快照序列，支持随时上一步（Step Back）、下一步（Step Forward）及任意时间轴拖拽跳转。',
        '三合一经典算法模型：内置冒泡排序（含提前终止优化）、二分查找（折半指针收敛）与递归快速排序（动态调用栈压栈/出栈演化）。',
        '零 eval 安全边界：追踪器受 MAX_TRACE_STEPS = 600 严格步数上限保护，同时在代码工坊中提供完整可修改的沙盒版算法源码。',
      ],
      complexity: {
        time: 'O(S) 生成追踪序列 (S <= 600 steps)，单步回放跳转 O(1)',
        space: 'O(S × N) 不可变状态时间线快照',
      },
    },
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<div class="algo-sandbox-demo">
  <div class="algo-header">
    <strong>冒泡排序与步骤日志 (沙盒实时运行版)</strong>
    <button id="btn-run-sort" type="button">重新生成随机数组并排序</button>
  </div>
  <div id="bars-stage" class="bars-stage"></div>
  <div id="step-summary" class="step-summary">点击按钮或在下方 Console 查看每一步比较与交换日志</div>
</div>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `.algo-sandbox-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.algo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.algo-header button {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #425aef;
  background: #425aef;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}
.bars-stage {
  height: 180px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 16px;
  border-radius: 8px;
  background: var(--lab-card);
  border: 1px solid var(--lab-border);
}
.bar-item {
  flex: 1;
  background: #425aef;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding-top: 4px;
  transition: height 0.25s ease, background 0.2s ease;
}
.bar-item.sorted {
  background: #10b981;
}
.step-summary {
  font-size: 12px;
  color: var(--lab-muted);
  font-family: monospace;
}`,
      },
      {
        name: 'script.js',
        language: 'javascript',
        content: `const stage = document.getElementById('bars-stage');
const summary = document.getElementById('step-summary');
const btn = document.getElementById('btn-run-sort');

function bubbleSortWithTrace(input) {
  const arr = [...input];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  console.log('[Trace Start] 初始数组:', JSON.stringify(arr));

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      comparisons++;
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
        swapped = true;
        swaps++;
        console.log(\`  [Step] 交换 index \${j} 与 \${j + 1}: \${arr[j + 1]} ⇄ \${arr[j]} -> \${JSON.stringify(arr)}\`);
      }
    }
    if (!swapped) {
      console.info(\`[Early Exit] 第 \${i + 1} 轮无交换，提前完成！\`);
      break;
    }
  }
  console.log(\`[Trace Complete] 结果: \${JSON.stringify(arr)} | 比较 \${comparisons} 次 | 交换 \${swaps} 次\`);
  return { arr, comparisons, swaps };
}

function renderBars(arr, sorted = false) {
  const max = Math.max(...arr, 1);
  stage.innerHTML = arr.map((val) => {
    const h = Math.max(24, Math.round((val / max) * 145));
    return \`<div class="bar-item \${sorted ? 'sorted' : ''}" style="height:\${h}px">\${val}</div>\`;
  }).join('');
}

function runDemo(sample) {
  const res = bubbleSortWithTrace(sample);
  renderBars(res.arr, true);
  summary.textContent = \`排序完成：[\${res.arr.join(', ')}] · 共比较 \${res.comparisons} 次，交换 \${res.swaps} 次\`;
}

runDemo([38, 14, 29, 7, 42, 19, 11]);
btn.addEventListener('click', () => {
  const rand = Array.from({ length: 7 }, () => Math.floor(Math.random() * 45) + 5);
  runDemo(rand);
});`,
      },
    ],
  },
  {
    id: 'exp-06-verlet-rope-ts',
    slug: 'verlet-rope-physics',
    title: 'Verlet 积分悬链线质点物理仿真 (TypeScript)',
    subtitle: '基于 TypeScript 编写的零依赖质点-弹簧约束求解器',
    description:
      '演示 Lab 第一阶段对 TypeScript 源码的浏览器端安全类型擦除与隔离执行能力：模拟重力场与鼠标交互牵引下的悬链线绳索动力学。',
    icon: '🧶',
    author: {
      name: 'shijianus',
      role: 'owner',
      url: 'https://blog.epocanvas.com/about/',
    },
    tags: ['TypeScript', 'Verlet积分', '物理引擎', '约束求解'],
    category: 'visual',
    runtime: 'browser-sandbox',
    language: 'typescript',
    featured: false,
    version: '1.0.0',
    sourceLicense: 'MIT',
    visibility: 'public',
    moderationStatus: 'approved',
    createdAt: '2026-11-06',
    updatedAt: '2026-11-06',
    previewConfig: {
      mode: 'sandbox-iframe',
      autoRun: true,
      height: 360,
      timeoutMs: 5000,
      maxConsoleEntries: 200,
      externalResources: [],
    },
    principles: {
      summary:
        '采用位置显式 Verlet 积分（x_next = x + (x - x_prev) * friction + a * dt²）代替传统欧拉积分，并配合每帧多次雅可比距离约束松弛迭代（Constraint Relaxation），在无需矩阵求逆的情况下实现高稳定性的柔体绳索仿真。',
      keyPoints: [
        'Verlet 隐式速度推导：直接通过当前位置与上一帧位置之差表达动量，能量守恒稳定性显著优于一阶欧拉法。',
        '迭代距离约束求解：每帧执行 5 次相邻质点间距修正，确保绳索在剧烈拉扯下不会无限拉伸发散。',
        'TypeScript 安全擦除执行：源码包含 interface Point 与类型标注，经轻量擦除器转为纯净 JS 后送入 Opaque Origin 沙盒运行。',
      ],
      complexity: {
        time: 'O(K × N)/frame (K=5 约束迭代, N=18 质点)',
        space: 'O(N) 质点向量表',
      },
    },
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<div class="verlet-wrap">
  <canvas id="rope-canvas" width="540" height="220"></canvas>
  <div class="verlet-bar">
    <span>提示：在画布上移动鼠标或点击脉冲，观察 Verlet 悬链线张力传递</span>
    <button id="btn-impulse" type="button">⚡ 施加横向物理脉冲</button>
  </div>
</div>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `.verlet-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
#rope-canvas {
  width: 100%;
  height: 220px;
  background: #0f172a;
  border-radius: 8px;
  cursor: crosshair;
}
.verlet-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--lab-muted);
}
#btn-impulse {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #425aef;
  background: #425aef;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}`,
      },
      {
        name: 'script.ts',
        language: 'typescript',
        content: `interface RopeNode {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  pinned: boolean;
}

const canvas = document.getElementById('rope-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const btnImpulse = document.getElementById('btn-impulse') as HTMLButtonElement;

const NODE_COUNT: number = 18;
const SEGMENT_LEN: number = 10;
const GRAVITY: number = 0.42;
const FRICTION: number = 0.985;

const nodes: RopeNode[] = Array.from({ length: NODE_COUNT }, (_, i: number) => ({
  x: 180 + i * SEGMENT_LEN,
  y: 36,
  oldX: 180 + i * SEGMENT_LEN,
  oldY: 36,
  pinned: i === 0
}));

function stepPhysics(): void {
  for (const p of nodes) {
    if (p.pinned) continue;
    const vx: number = (p.x - p.oldX) * FRICTION;
    const vy: number = (p.y - p.oldY) * FRICTION;
    p.oldX = p.x;
    p.oldY = p.y;
    p.x += vx;
    p.y += vy + GRAVITY;
  }

  for (let iter = 0; iter < 5; iter++) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const dx: number = b.x - a.x;
      const dy: number = b.y - a.y;
      const dist: number = Math.hypot(dx, dy) || 0.0001;
      const diff: number = (SEGMENT_LEN - dist) / dist;
      if (!a.pinned) {
        a.x -= dx * diff * 0.5;
        a.y -= dy * diff * 0.5;
      }
      if (!b.pinned) {
        b.x += dx * diff * 0.5;
        b.y += dy * diff * 0.5;
      }
    }
  }
}

function draw(): void {
  requestAnimationFrame(draw);
  stepPhysics();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  for (let i = 1; i < nodes.length; i++) {
    ctx.lineTo(nodes[i].x, nodes[i].y);
  }
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 3;
  ctx.stroke();

  for (let i = 0; i < nodes.length; i++) {
    ctx.beginPath();
    ctx.arc(nodes[i].x, nodes[i].y, i === 0 || i === nodes.length - 1 ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#f59e0b' : i === nodes.length - 1 ? '#34d399' : '#e2e8f0';
    ctx.fill();
  }
}

canvas.addEventListener('mousemove', (e: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  nodes[0].x = (e.clientX - rect.left) * scaleX;
});

btnImpulse.addEventListener('click', () => {
  const tail = nodes[nodes.length - 1];
  tail.oldX -= 32;
  console.log('[VerletPhysics] 已对末端质点施加横向冲量 Δvx = +32');
});

console.log('[VerletPhysics] TypeScript 物理仿真已启动，共', NODE_COUNT, '个约束质点');
draw();`,
      },
    ],
  },
];

export function getExperimentBySlug(slug: string): LabExperiment | undefined {
  return OFFICIAL_LAB_EXPERIMENTS.find((item) => item.slug === slug);
}
