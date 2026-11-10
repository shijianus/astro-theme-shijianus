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
        content: `let angle = 0;
let bloom = true;
const stars = Array.from({ length: 120 }, (_, i) => ({
  radius: Math.random() * 190 + 10,
  theta: Math.random() * Math.PI * 2,
  size: Math.random() * 1.5 + 0.5,
  color: i % 5 === 0 ? '#60a5fa' : i % 8 === 0 ? '#fde047' : '#ffffff'
}));

console.log('[StarTrails] 已初始化 120 颗恒星极坐标粒子，当前北天极仰角 39° N');

if (typeof document === 'undefined') {
  const cx = 280;
  const cy = 240 * (1 - (39 / 90) * 0.7);
  for (let frame = 0; frame < 60; frame++) {
    angle += 15 * 0.0005;
  }
  const sample = stars[0];
  const sx = (cx + Math.cos(sample.theta + angle) * sample.radius).toFixed(2);
  const sy = (cy + Math.sin(sample.theta + angle) * (sample.radius * 0.6)).toFixed(2);
  console.log(\`[StarTrails][QuickJS WASM] 60 帧天球极坐标投影计算完成 | 极点 cy=\${cy.toFixed(1)} | 采样星轨终点=(\${sx}, \${sy})\`);
} else {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');
  const latRange = document.getElementById('lat-range');
  const spdRange = document.getElementById('spd-range');
  const latOut = document.getElementById('lat-out');
  const spdOut = document.getElementById('spd-out');
  const btnClear = document.getElementById('btn-clear');
  const btnBloom = document.getElementById('btn-bloom');

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
  });
}`,
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
        content: `console.log('[Aerodynamic] 3D 姿态仿真已就绪 (Pitch=15°, Roll=-10°)');

if (typeof document === 'undefined') {
  const pitchRad = (15 * Math.PI) / 180;
  const rollRad = (-10 * Math.PI) / 180;
  const liftCoeff = (Math.cos(pitchRad) * Math.cos(rollRad)).toFixed(4);
  console.log(\`[Aerodynamic][QuickJS WASM] 欧拉旋转矩阵计算完成: cos(Pitch)·cos(Roll)=\${liftCoeff}\`);
} else {
  const plane = document.getElementById('plane-box');
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
}`,
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
        content: `if (typeof document === 'undefined') {
  const chordFreqs = [523.25, 659.25, 783.99, 1046.5];
  const sampleRate = 44100;
  let energy = 0;
  for (let n = 0; n < 128; n++) {
    const t = n / sampleRate;
    const sample = chordFreqs.reduce((acc, f) => acc + Math.sin(2 * Math.PI * f * t) * 0.08, 0);
    energy += sample * sample;
  }
  const rms = Math.sqrt(energy / 128).toFixed(4);
  console.log(\`[WebAudio][QuickJS WASM] 6 路合成器 DSP 时域波形包络计算完成 | C5-E5-G5-C6 128点采样 RMS=\${rms}\`);
} else {
  let audioCtx = null;
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
  console.log('[WebAudio] 6 路合成器打击垫已绑定，点击任意按钮可实时合成波形');
}`,
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

if (typeof document === 'undefined') {
  const usdBase = 10;
  console.log(\`[FXConverter] 10 USD => USD基准 $\${usdBase.toFixed(4)} | CNY ¥\${(usdBase * rates.CNY).toFixed(2)} | EUR €\${(usdBase * rates.EUR).toFixed(2)} | JPY ¥\${Math.round(usdBase * rates.JPY)}\`);
} else {
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
  updateFX();
}`,
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
        content: `function bubbleSortWithTrace(input) {
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

if (typeof document === 'undefined') {
  bubbleSortWithTrace([38, 14, 29, 7, 42, 19, 11]);
} else {
  const stage = document.getElementById('bars-stage');
  const summary = document.getElementById('step-summary');
  const btn = document.getElementById('btn-run-sort');

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
  });
}`,
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

console.log('[VerletPhysics] TypeScript 物理仿真已启动，共', NODE_COUNT, '个约束质点');

if (typeof document === 'undefined') {
  for (let step = 0; step < 30; step++) {
    stepPhysics();
  }
  const tail = nodes[nodes.length - 1];
  console.log(\`[VerletPhysics][QuickJS WASM] 30 帧约束松弛求解完成 | 末端质点坐标=(\${tail.x.toFixed(2)}, \${tail.y.toFixed(2)})\`);
} else {
  const canvas = document.getElementById('rope-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const btnImpulse = document.getElementById('btn-impulse') as HTMLButtonElement;

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

  draw();
}`,
      },
    ],
  },
  {
    id: 'exp-07-svg-morph',
    slug: 'interactive-svg-morph',
    title: 'SVG 动态流体滤镜与有机变幻 (Organic SVG Fluid & Gooey Morph)',
    subtitle: '原生 SVG <filter> 矩阵与贝塞尔流体质感',
    description:
      '基于原生 SVG <filter> 滤镜管线（feGaussianBlur 模糊扩散 + feColorMatrix 颜色通道阈值阶跃），在零三方库纯矢量 DOM 中实现水银液体融合、弹簧拖拽粘连与贝塞尔有机形态动力学。',
    icon: '🫧',
    author: {
      name: 'shijianus',
      role: 'owner',
      url: 'https://blog.epocanvas.com/about/',
    },
    tags: ['SVG Filter', 'feColorMatrix', '流体动力学', '矢量变形', '60FPS'],
    category: 'visual',
    runtime: 'browser-sandbox',
    language: 'html-css-js',
    featured: true,
    version: '1.2.0',
    sourceLicense: 'MIT',
    visibility: 'public',
    moderationStatus: 'approved',
    createdAt: '2026-11-10',
    updatedAt: '2026-11-10',
    defaultParams: [
      {
        id: 'tension',
        label: '表面张力阈值 (Tension)',
        type: 'range',
        defaultValue: 28,
        min: 15,
        max: 45,
        step: 1,
      },
      {
        id: 'blur',
        label: '高斯模糊半径 (Blur Radius)',
        type: 'range',
        defaultValue: 15,
        min: 8,
        max: 28,
        step: 1,
        unit: 'px',
      },
    ],
    previewConfig: {
      mode: 'hybrid',
      autoRun: true,
      height: 380,
      timeoutMs: 5000,
      maxConsoleEntries: 200,
      externalResources: [],
    },
    principles: {
      summary:
        '通过 SVG 滤镜图元的级联管道（feGaussianBlur -> feColorMatrix -> feBlend），对两层重叠的半透明矢量图形执行 Alpha 通道非线性锐化二值化放大，使临近的矢量圆在数学阈值处产生如水银融合般的粘性液桥效应。',
      keyPoints: [
        '高斯模糊扩展：feGaussianBlur 将离散矢量边界扩展为平滑连续的渐变 Alpha 分布场。',
        'Alpha 矩阵二值化锐化：feColorMatrix 设置 values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10"，将 Alpha 分布放大 28 倍并扣减基准偏移 -10，使模糊场边缘急剧阶跃为清晰硬边缘。',
        '弹簧阻尼动力学：在 JavaScript 中使用胡克定律 F = -k·Δx - c·v 驱动交互质点与中心质核，呈现真实的流体拉伸与回弹动效。',
      ],
      complexity: {
        time: 'O(N)/frame (N = 6 矢量质核)',
        space: 'O(1) 纯矢量 DOM',
      },
    },
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<div class="morph-lab-shell">
  <div class="svg-stage">
    <svg id="morph-svg" viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#425aef" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="50%" stop-color="#425aef" />
          <stop offset="100%" stop-color="#a855f7" />
        </linearGradient>
        <!-- 原生 SVG 流体粘性滤镜 (Gooey Filter) -->
        <filter id="goo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" id="filter-blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10" result="goo" id="filter-matrix" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>

      <rect width="800" height="520" fill="#030712" />
      <circle cx="400" cy="260" r="320" fill="url(#bg-glow)" />

      <!-- 动态流体融合组 -->
      <g id="goo-group" filter="url(#goo)">
        <circle id="orb-center" cx="400" cy="260" r="64" fill="url(#active-grad)" />
        <circle id="orb-drag" cx="400" cy="260" r="48" fill="url(#active-grad)" />
        <circle id="orb-sat-1" cx="300" cy="220" r="34" fill="url(#active-grad)" />
        <circle id="orb-sat-2" cx="500" cy="220" r="30" fill="url(#active-grad)" />
        <circle id="orb-sat-3" cx="360" cy="360" r="28" fill="url(#active-grad)" />
        <circle id="orb-sat-4" cx="450" cy="350" r="26" fill="url(#active-grad)" />
      </g>

      <!-- 交互光标环 -->
      <circle id="cursor-ring" cx="400" cy="260" r="18" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6" />
    </svg>
  </div>

  <div class="morph-toolbar">
    <div class="tool-group">
      <label>表面张力阈值 (Tension): <strong id="val-tension">28</strong>
        <input id="slider-tension" type="range" min="16" max="42" value="28" />
      </label>
      <label>高斯模糊阶数 (Blur): <strong id="val-blur">15px</strong>
        <input id="slider-blur" type="range" min="8" max="26" value="15" />
      </label>
    </div>
    <div class="tool-actions">
      <button id="btn-theme-cyber" type="button" class="btn is-active">赛博霓虹</button>
      <button id="btn-theme-sunset" type="button" class="btn">落日熔金</button>
      <button id="btn-theme-emerald" type="button" class="btn">翡翠矩阵</button>
      <button id="btn-pulse" type="button" class="btn is-accent">⚡ 能量脉冲</button>
      <button id="btn-reset" type="button" class="btn">重置平衡态</button>
    </div>
  </div>
</div>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #020617;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.morph-lab-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #020617;
}
.svg-stage {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: grab;
  touch-action: none;
}
.svg-stage:active {
  cursor: grabbing;
}
svg {
  width: 100%;
  height: 100%;
  max-height: 100%;
  display: block;
}
.morph-toolbar {
  padding: 12px 18px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  z-index: 10;
}
.tool-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.tool-group label {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tool-group label strong {
  color: #38bdf8;
  font-family: monospace;
}
input[type="range"] {
  accent-color: #425aef;
  width: 110px;
  cursor: pointer;
}
.tool-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn:hover {
  background: rgba(66, 90, 239, 0.25);
  border-color: #425aef;
  color: #ffffff;
}
.btn.is-active {
  background: #425aef;
  border-color: #425aef;
  color: #ffffff;
}
.btn.is-accent {
  background: rgba(245, 158, 11, 0.2);
  border-color: #f59e0b;
  color: #fbbf24;
}`,
      },
      {
        name: 'script.js',
        language: 'javascript',
        content: `// SVG 流体滤镜与弹簧动力学引擎
const svg = document.getElementById('morph-svg');
const orbCenter = document.getElementById('orb-center');
const orbDrag = document.getElementById('orb-drag');
const cursorRing = document.getElementById('cursor-ring');
const filterBlur = document.getElementById('filter-blur');
const filterMatrix = document.getElementById('filter-matrix');
const activeGrad = document.getElementById('active-grad');

const sliderTension = document.getElementById('slider-tension');
const sliderBlur = document.getElementById('slider-blur');
const valTension = document.getElementById('val-tension');
const valBlur = document.getElementById('val-blur');

const satellites = [
  { el: document.getElementById('orb-sat-1'), cx: 300, cy: 220, baseAngle: 0, r: 120, speed: 0.02, size: 34 },
  { el: document.getElementById('orb-sat-2'), cx: 500, cy: 220, baseAngle: Math.PI * 0.7, r: 140, speed: -0.015, size: 30 },
  { el: document.getElementById('orb-sat-3'), cx: 360, cy: 360, baseAngle: Math.PI * 1.3, r: 110, speed: 0.025, size: 28 },
  { el: document.getElementById('orb-sat-4'), cx: 450, cy: 350, baseAngle: Math.PI * 1.8, r: 130, speed: -0.018, size: 26 },
];

let mouse = { x: 400, y: 260, targetX: 400, targetY: 260, isDown: false };
let center = { x: 400, y: 260 };
let dragOrb = { x: 400, y: 260, vx: 0, vy: 0 };
let tick = 0;

function updateFilter() {
  const tension = parseInt(sliderTension.value, 10);
  const blur = parseInt(sliderBlur.value, 10);
  valTension.textContent = tension;
  valBlur.textContent = blur + 'px';
  filterBlur.setAttribute('stdDeviation', blur);
  filterMatrix.setAttribute('values', \`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 \${tension} -\${Math.floor(tension * 0.36)}\`);
}

sliderTension.addEventListener('input', updateFilter);
sliderBlur.addEventListener('input', updateFilter);

function getSvgCoords(e) {
  const rect = svg.getBoundingClientRect();
  const scaleX = 800 / rect.width;
  const scaleY = 520 / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

svg.addEventListener('pointerdown', (e) => {
  mouse.isDown = true;
  const p = getSvgCoords(e);
  mouse.targetX = p.x;
  mouse.targetY = p.y;
  cursorRing.setAttribute('opacity', '1');
});

window.addEventListener('pointermove', (e) => {
  const p = getSvgCoords(e);
  mouse.targetX = p.x;
  mouse.targetY = p.y;
});

window.addEventListener('pointerup', () => {
  mouse.isDown = false;
  mouse.targetX = 400;
  mouse.targetY = 260;
  cursorRing.setAttribute('opacity', '0.4');
});

// 动画与物理主循环
function loop() {
  requestAnimationFrame(loop);
  tick++;

  // 弹簧追踪与阻尼
  const k = mouse.isDown ? 0.14 : 0.06;
  const damping = 0.84;
  const ax = (mouse.targetX - dragOrb.x) * k;
  const ay = (mouse.targetY - dragOrb.y) * k;
  dragOrb.vx = (dragOrb.vx + ax) * damping;
  dragOrb.vy = (dragOrb.vy + ay) * damping;
  dragOrb.x += dragOrb.vx;
  dragOrb.y += dragOrb.vy;

  orbDrag.setAttribute('cx', dragOrb.x.toFixed(1));
  orbDrag.setAttribute('cy', dragOrb.y.toFixed(1));

  cursorRing.setAttribute('cx', mouse.targetX.toFixed(1));
  cursorRing.setAttribute('cy', mouse.targetY.toFixed(1));

  // 中心质核轻微呼吸动效
  const breath = Math.sin(tick * 0.04) * 4;
  orbCenter.setAttribute('r', (64 + breath).toFixed(1));

  // 环绕卫星运动
  satellites.forEach((sat) => {
    const angle = sat.baseAngle + tick * sat.speed;
    const sx = center.x + Math.cos(angle) * sat.r;
    const sy = center.y + Math.sin(angle) * (sat.r * 0.7);
    sat.el.setAttribute('cx', sx.toFixed(1));
    sat.el.setAttribute('cy', sy.toFixed(1));
  });
}
loop();

// 主题切换
const themes = {
  cyber: ['#38bdf8', '#425aef', '#a855f7'],
  sunset: ['#f59e0b', '#ef4444', '#831843'],
  emerald: ['#34d399', '#059669', '#064e3b']
};

function setGradTheme(colors, activeBtnId) {
  const stops = activeGrad.querySelectorAll('stop');
  stops[0].setAttribute('stop-color', colors[0]);
  stops[1].setAttribute('stop-color', colors[1]);
  stops[2].setAttribute('stop-color', colors[2]);
  ['btn-theme-cyber', 'btn-theme-sunset', 'btn-theme-emerald'].forEach(id => {
    document.getElementById(id).classList.toggle('is-active', id === activeBtnId);
  });
}

document.getElementById('btn-theme-cyber').addEventListener('click', () => setGradTheme(themes.cyber, 'btn-theme-cyber'));
document.getElementById('btn-theme-sunset').addEventListener('click', () => setGradTheme(themes.sunset, 'btn-theme-sunset'));
document.getElementById('btn-theme-emerald').addEventListener('click', () => setGradTheme(themes.emerald, 'btn-theme-emerald'));

document.getElementById('btn-pulse').addEventListener('click', () => {
  dragOrb.vx += (Math.random() - 0.5) * 80;
  dragOrb.vy += (Math.random() - 0.5) * 80;
  console.log('[SVGMorph] 激发矢量流体能量冲击脉冲');
});

document.getElementById('btn-reset').addEventListener('click', () => {
  dragOrb.x = 400; dragOrb.y = 260;
  dragOrb.vx = 0; dragOrb.vy = 0;
  mouse.targetX = 400; mouse.targetY = 260;
  sliderTension.value = 28;
  sliderBlur.value = 15;
  updateFilter();
  setGradTheme(themes.cyber, 'btn-theme-cyber');
});
console.log('[SVGMorph] 原生 SVG 流体滤镜沙盒就绪');`,
      },
    ],
  },
  {
    id: 'exp-08-svg-fractal',
    slug: 'svg-generative-fractal',
    title: 'SVG 参数化几何动力齿轮与多重极光分形 (Kinetic SVG Mandala & Fractal Gears)',
    subtitle: 'SVG 极坐标矢量数学、动态渐变与机械动力学',
    description:
      '使用纯 SVG <defs>、<linearGradient> 动态相位旋转与三角函数参数化路径生成算法，构建多重嵌套齿轮联动与极光曼陀罗几何分形，支持实时微调与一键导出纯净标准 SVG 矢量文件。',
    icon: '⚙️',
    author: {
      name: 'shijianus',
      role: 'owner',
      url: 'https://blog.epocanvas.com/about/',
    },
    tags: ['SVG Path', '参数化几何', '分形几何', '数学美学', '矢量导出'],
    category: 'visual',
    runtime: 'browser-sandbox',
    language: 'html-css-js',
    featured: true,
    version: '1.2.0',
    sourceLicense: 'MIT',
    visibility: 'public',
    moderationStatus: 'approved',
    createdAt: '2026-11-10',
    updatedAt: '2026-11-10',
    defaultParams: [
      {
        id: 'symmetry',
        label: '对称阶数 (Symmetry N)',
        type: 'range',
        defaultValue: 8,
        min: 4,
        max: 16,
        step: 1,
      },
      {
        id: 'teeth',
        label: '动力齿数 (Teeth Count)',
        type: 'range',
        defaultValue: 24,
        min: 12,
        max: 48,
        step: 2,
      },
    ],
    previewConfig: {
      mode: 'hybrid',
      autoRun: true,
      height: 380,
      timeoutMs: 5000,
      maxConsoleEntries: 200,
      externalResources: [],
    },
    principles: {
      summary:
        '基于极坐标外摆线与内摆线数学方程，在 JavaScript 中动态计算由贝塞尔曲率构建的连续闭合 SVG 路径（d="M... C... Z"）。结合齿轮啮合传动比逆向角速度驱动，实现高精度的矢量几何分形运动。',
      keyPoints: [
        '外摆线路径构造：x = (R+r)cos(θ) - d·cos((R+r)θ/r)，y = (R+r)sin(θ) - d·sin((R+r)θ/r)，在 SVG 坐标系中生成对称性曼陀罗花瓣。',
        '正逆角速度同步：中心大齿轮与外围从动齿轮的角速度严格成齿数反比 ω1·Z1 = -ω2·Z2，保障物理级齿隙严密契合。',
        '零失真矢量导出：生成的路径完全由标称浮点坐标与原生 SVG 标签描述，放大任意倍率均保持绝对锐利边缘，支持一键下载标准 .svg 文件。',
      ],
      complexity: {
        time: 'O(Symmetry · Points) 极坐标求值',
        space: 'O(1) 矢量描述结构',
      },
    },
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<div class="fractal-lab-shell">
  <div class="svg-stage">
    <svg id="fractal-svg" viewBox="-400 -280 800 560" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="aurora-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
          <stop offset="60%" stop-color="#425aef" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="aurora-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="35%" stop-color="#818cf8" />
          <stop offset="70%" stop-color="#c084fc" />
          <stop offset="100%" stop-color="#f472b6" />
        </linearGradient>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde047" />
          <stop offset="50%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#38bdf8" flood-opacity="0.5" />
        </filter>
      </defs>

      <!-- 背景与星空透镜 -->
      <rect x="-400" y="-280" width="800" height="560" fill="#030712" />
      <circle cx="0" cy="0" r="280" fill="url(#aurora-sun)" />

      <!-- 外层曼陀罗分形花环 -->
      <g id="mandala-outer" filter="url(#neon-glow)"></g>

      <!-- 中层动力齿轮咬合组 -->
      <g id="gear-cluster"></g>

      <!-- 核心神圣几何星芒 -->
      <g id="sacred-core"></g>
    </svg>
  </div>

  <div class="fractal-toolbar">
    <div class="tool-group">
      <label>分形对称阶数 (Symmetry): <strong id="val-symmetry">8</strong>
        <input id="slider-symmetry" type="range" min="4" max="16" value="8" />
      </label>
      <label>动力齿数 (Teeth): <strong id="val-teeth">24</strong>
        <input id="slider-teeth" type="range" min="12" max="44" step="2" value="24" />
      </label>
      <label>旋转角速度 (Speed): <strong id="val-speed">1.0x</strong>
        <input id="slider-speed" type="range" min="2" max="30" value="10" />
      </label>
    </div>
    <div class="tool-actions">
      <button id="btn-theme-aurora" type="button" class="btn is-active">极光流光</button>
      <button id="btn-theme-gold" type="button" class="btn">赛博金箔</button>
      <button id="btn-copy-svg" type="button" class="btn is-accent">📋 复制纯 SVG 代码</button>
      <button id="btn-download-svg" type="button" class="btn">📥 导出 .svg 文件</button>
    </div>
  </div>
</div>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #020617;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fractal-lab-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #020617;
}
.svg-stage {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
svg {
  width: 100%;
  height: 100%;
  display: block;
}
.fractal-toolbar {
  padding: 12px 18px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  z-index: 10;
}
.tool-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.tool-group label {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tool-group label strong {
  color: #38bdf8;
  font-family: monospace;
}
input[type="range"] {
  accent-color: #425aef;
  width: 100px;
  cursor: pointer;
}
.tool-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn:hover {
  background: rgba(66, 90, 239, 0.25);
  border-color: #425aef;
  color: #ffffff;
}
.btn.is-active {
  background: #425aef;
  border-color: #425aef;
  color: #ffffff;
}
.btn.is-accent {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #34d399;
}`,
      },
      {
        name: 'script.js',
        language: 'javascript',
        content: `// 参数化 SVG 分形曼陀罗与齿轮几何动力学引擎
const mandalaOuter = document.getElementById('mandala-outer');
const gearCluster = document.getElementById('gear-cluster');
const sacredCore = document.getElementById('sacred-core');
const sliderSymmetry = document.getElementById('slider-symmetry');
const sliderTeeth = document.getElementById('slider-teeth');
const sliderSpeed = document.getElementById('slider-speed');
const valSymmetry = document.getElementById('val-symmetry');
const valTeeth = document.getElementById('val-teeth');
const valSpeed = document.getElementById('val-speed');

let currentGrad = 'url(#aurora-grad)';
let angle = 0;

// 生成参数化齿轮 SVG 路径
function createGearPath(cx, cy, rOuter, rInner, teeth) {
  const points = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.25;
    const a2 = a0 + step * 0.5;
    const a3 = a0 + step * 0.75;

    points.push(\`\${cx + Math.cos(a0) * rInner},\${cy + Math.sin(a0) * rInner}\`);
    points.push(\`\${cx + Math.cos(a1) * rOuter},\${cy + Math.sin(a1) * rOuter}\`);
    points.push(\`\${cx + Math.cos(a2) * rOuter},\${cy + Math.sin(a2) * rOuter}\`);
    points.push(\`\${cx + Math.cos(a3) * rInner},\${cy + Math.sin(a3) * rInner}\`);
  }
  return \`M \${points.join(' L ')} Z\`;
}

// 生成外摆线曼陀罗花瓣路径
function createMandalaPetals(symmetry) {
  const paths = [];
  const step = (Math.PI * 2) / symmetry;
  for (let i = 0; i < symmetry; i++) {
    const a = i * step;
    const x0 = Math.cos(a) * 60;
    const y0 = Math.sin(a) * 60;
    const xTip = Math.cos(a) * 220;
    const yTip = Math.sin(a) * 220;
    const cx1 = Math.cos(a - 0.3) * 160;
    const cy1 = Math.sin(a - 0.3) * 160;
    const cx2 = Math.cos(a + 0.3) * 160;
    const cy2 = Math.sin(a + 0.3) * 160;

    paths.push(\`<path d="M \${x0.toFixed(1)} \${y0.toFixed(1)} C \${cx1.toFixed(1)} \${cy1.toFixed(1)}, \${cx2.toFixed(1)} \${cy2.toFixed(1)}, \${xTip.toFixed(1)} \${yTip.toFixed(1)} S \${cx1.toFixed(1)} \${cy1.toFixed(1)}, \${x0.toFixed(1)} \${y0.toFixed(1)}" fill="none" stroke="\${currentGrad}" stroke-width="1.8" opacity="0.85" />\`);
  }
  return paths.join('');
}

// 重新构建几何结构
function buildGeometry() {
  const symmetry = parseInt(sliderSymmetry.value, 10);
  const teeth = parseInt(sliderTeeth.value, 10);
  valSymmetry.textContent = symmetry;
  valTeeth.textContent = teeth;

  // 1. 曼陀罗外环
  mandalaOuter.innerHTML = createMandalaPetals(symmetry);

  // 2. 齿轮集群：中心主齿轮 + 4 个卫星咬合齿轮
  const centerGearD = createGearPath(0, 0, 90, 76, teeth);
  const satTeeth = Math.floor(teeth / 2);
  const satDist = 145;

  let satHtml = '';
  for (let k = 0; k < 4; k++) {
    const theta = (k * Math.PI) / 2;
    const sx = Math.cos(theta) * satDist;
    const sy = Math.sin(theta) * satDist;
    const satD = createGearPath(sx, sy, 45, 36, satTeeth);
    satHtml += \`<path class="sat-gear sat-\${k}" d="\${satD}" fill="none" stroke="\${currentGrad}" stroke-width="1.5" opacity="0.9" />\`;
  }

  gearCluster.innerHTML = \`
    <path id="center-gear" d="\${centerGearD}" fill="none" stroke="\${currentGrad}" stroke-width="2" />
    <circle cx="0" cy="0" r="32" fill="none" stroke="\${currentGrad}" stroke-width="1.2" stroke-dasharray="3 3" />
    \${satHtml}
  \`;

  // 3. 核心几何星芒
  const starPoints = [];
  for (let j = 0; j < symmetry * 2; j++) {
    const ang = (j * Math.PI) / symmetry;
    const rad = j % 2 === 0 ? 50 : 22;
    starPoints.push(\`\${(Math.cos(ang) * rad).toFixed(1)},\${(Math.sin(ang) * rad).toFixed(1)}\`);
  }
  sacredCore.innerHTML = \`
    <polygon points="\${starPoints.join(' ')}" fill="\${currentGrad}" opacity="0.35" />
    <polygon points="\${starPoints.join(' ')}" fill="none" stroke="\${currentGrad}" stroke-width="1.5" />
    <circle cx="0" cy="0" r="6" fill="#ffffff" />
  \`;
}

sliderSymmetry.addEventListener('input', buildGeometry);
sliderTeeth.addEventListener('input', buildGeometry);
sliderSpeed.addEventListener('input', () => {
  valSpeed.textContent = (sliderSpeed.value / 10).toFixed(1) + 'x';
});

// 动画主循环
function render() {
  requestAnimationFrame(render);
  const spd = (sliderSpeed.value / 10) * 0.015;
  angle += spd;

  mandalaOuter.setAttribute('transform', \`rotate(\${(angle * 30).toFixed(2)})\`);
  const cGear = document.getElementById('center-gear');
  if (cGear) cGear.setAttribute('transform', \`rotate(\${(angle * 45).toFixed(2)})\`);

  for (let k = 0; k < 4; k++) {
    const sat = document.querySelector(\`.sat-\${k}\`);
    if (sat) {
      const theta = (k * Math.PI) / 2;
      const sx = Math.cos(theta) * 145;
      const sy = Math.sin(theta) * 145;
      sat.setAttribute('transform', \`rotate(\${(-angle * 90).toFixed(2)}, \${sx.toFixed(1)}, \${sy.toFixed(1)})\`);
    }
  }

  sacredCore.setAttribute('transform', \`rotate(\${(-angle * 60).toFixed(2)})\`);
}

buildGeometry();
render();

// 主题切换
document.getElementById('btn-theme-aurora').addEventListener('click', () => {
  currentGrad = 'url(#aurora-grad)';
  document.getElementById('btn-theme-aurora').classList.add('is-active');
  document.getElementById('btn-theme-gold').classList.remove('is-active');
  buildGeometry();
});

document.getElementById('btn-theme-gold').addEventListener('click', () => {
  currentGrad = 'url(#gold-grad)';
  document.getElementById('btn-theme-gold').classList.add('is-active');
  document.getElementById('btn-theme-aurora').classList.remove('is-active');
  buildGeometry();
});

// 复制纯 SVG 代码
document.getElementById('btn-copy-svg').addEventListener('click', () => {
  const svgEl = document.getElementById('fractal-svg');
  const clone = svgEl.cloneNode(true);
  const svgCode = '<?xml version="1.0" encoding="UTF-8"?>\\n' + clone.outerHTML;
  navigator.clipboard.writeText(svgCode).then(() => {
    alert('✅ 纯标准 SVG 代码已成功复制至剪贴板！可直接粘贴至 Figma、Illustrator 或网页项目中。');
  }).catch(() => {
    console.log(svgCode);
    alert('已在 Console 打印完整 SVG 代码。');
  });
});

// 导出下载 .svg 文件
document.getElementById('btn-download-svg').addEventListener('click', () => {
  const svgEl = document.getElementById('fractal-svg');
  const svgCode = '<?xml version="1.0" encoding="UTF-8"?>\\n' + svgEl.outerHTML;
  const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kinetic-svg-mandala.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
console.log('[SVGFractal] 参数化 SVG 分形动力学引擎就绪');`,
      },
    ],
  },
];

export function getExperimentBySlug(slug: string): LabExperiment | undefined {
  return OFFICIAL_LAB_EXPERIMENTS.find((item) => item.slug === slug);
}
