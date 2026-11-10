import { jsonResponse, optionsResponse, safeReadJson } from '../_lib/http.ts';
import type { AppEnv } from '../_lib/types.ts';
import { BUILD_TIME_LAB_SANDBOX_ORIGIN } from '../generated/lab-env.ts';

interface LabExperimentSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: 'physics' | 'audio' | 'algorithm' | 'visual' | 'utility';
  language: string;
  runtime: string;
  version: string;
  tags: string[];
  updatedAt: string;
}

const OFFICIAL_EXPERIMENTS_META: LabExperimentSummary[] = [
  {
    id: 'exp-01-star-trails',
    slug: 'star-trails-simulator',
    title: '天体星轨模拟器 (Star Trails Simulator)',
    subtitle: 'Canvas 极坐标长曝光天球旋转物理引擎',
    category: 'physics',
    language: 'html-css-js',
    runtime: 'browser-dom',
    version: '1.2.0',
    tags: ['Canvas', '物理仿真', '天体力学', '极坐标', '60FPS'],
    updatedAt: '2026-11-10',
  },
  {
    id: 'exp-02-aerodynamic-contrail',
    slug: 'aerodynamic-contrail',
    title: '3D 纸飞机与气动尾流 (Aerodynamic Contrail)',
    subtitle: 'CSS 3D Transform 空间投射与粒子喷射仿真',
    category: 'physics',
    language: 'html-css-js',
    runtime: 'browser-dom',
    version: '1.1.0',
    tags: ['CSS 3D', '空间矩阵', '欧拉角', '硬件加速'],
    updatedAt: '2026-11-10',
  },
  {
    id: 'exp-03-web-audio-haptics',
    slug: 'web-audio-haptics',
    title: 'Web Audio 触觉声效矩阵 (Audio Haptics)',
    subtitle: '振荡器实时调频合成交互音效，0 外部音频文件',
    category: 'audio',
    language: 'html-css-js',
    runtime: 'browser-dom',
    version: '1.1.0',
    tags: ['Web Audio', '数字信号处理', '音频合成', '零外部依赖'],
    updatedAt: '2026-11-10',
  },
  {
    id: 'exp-04-fx-currency-converter',
    slug: 'fx-currency-converter',
    title: '多币种实时汇率换算器 (FX Converter)',
    subtitle: 'Stripe 国际收银台多币种自适应转换基准算法',
    category: 'utility',
    language: 'html-css-js',
    runtime: 'browser-dom',
    version: '1.2.0',
    tags: ['汇率算法', '金融精度', 'Stripe', '工程实用'],
    updatedAt: '2026-11-10',
  },
  {
    id: 'exp-05-algorithm-execution-tracer',
    slug: 'algorithm-execution-tracer',
    title: '算法逐步执行与调用栈追踪器 (Algorithm Step Visualizer)',
    subtitle: '源码逐行高亮、变量监视、条件分支成立判定与递归调用栈时间线',
    category: 'algorithm',
    language: 'javascript',
    runtime: 'curated-trace',
    version: '1.1.0',
    tags: ['执行可视化', '调用栈', '冒泡排序', '二分查找', '递归分治'],
    updatedAt: '2026-11-10',
  },
  {
    id: 'exp-06-verlet-rope-ts',
    slug: 'verlet-rope-physics',
    title: 'Verlet 积分悬链线质点物理仿真 (TypeScript)',
    subtitle: '基于 TypeScript 编写的零依赖质点-弹簧距离约束求解器',
    category: 'visual',
    language: 'typescript',
    runtime: 'browser-dom',
    version: '1.1.0',
    tags: ['TypeScript', 'Verlet积分', '物理引擎', '约束求解'],
    updatedAt: '2026-11-10',
  },
  {
    id: 'exp-07-svg-morph',
    slug: 'interactive-svg-morph',
    title: 'SVG 动态流体滤镜与有机变幻 (Organic SVG Fluid & Gooey Morph)',
    subtitle: '原生 SVG <filter> 矩阵与贝塞尔流体质感',
    category: 'visual',
    language: 'html-css-js',
    runtime: 'browser-dom',
    version: '1.2.0',
    tags: ['SVG Filter', 'feColorMatrix', '流体动力学', '矢量变形', '60FPS'],
    updatedAt: '2026-11-10',
  },
  {
    id: 'exp-08-svg-fractal',
    slug: 'svg-generative-fractal',
    title: 'SVG 参数化几何动力齿轮与多重极光分形 (Kinetic SVG Mandala & Fractal Gears)',
    subtitle: 'SVG 极坐标矢量数学、动态渐变与机械动力学',
    category: 'visual',
    language: 'html-css-js',
    runtime: 'browser-dom',
    version: '1.2.0',
    tags: ['SVG Path', '参数化几何', '分形几何', '数学美学', '矢量导出'],
    updatedAt: '2026-11-10',
  },
];

const LAB_QUOTAS = {
  maxFiles: 6,
  maxSingleFileBytes: 64 * 1024,
  maxTotalSourceBytes: 128 * 1024,
  syncLoopBudgetMs: 2200,
  defaultExecutionTimeoutMs: 5000,
  maxConsoleEntries: 200,
};

const ALLOWED_EXTENSIONS = ['.html', '.css', '.js', '.ts', '.json'];

async function computeSha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  const url = new URL(request.url);
  const envRecord = (env ?? {}) as Record<string, unknown>;
  const rawSandboxOrigin =
    (typeof envRecord.PUBLIC_LAB_SANDBOX_ORIGIN === 'string' &&
    envRecord.PUBLIC_LAB_SANDBOX_ORIGIN.trim()
      ? envRecord.PUBLIC_LAB_SANDBOX_ORIGIN.trim()
      : BUILD_TIME_LAB_SANDBOX_ORIGIN) || '';

  if (request.method === 'GET') {
    const slugFilter = (url.searchParams.get('slug') || '').trim();
    const categoryFilter = (url.searchParams.get('category') || '').trim();

    let filtered = OFFICIAL_EXPERIMENTS_META;
    if (slugFilter) {
      filtered = filtered.filter((item) => item.slug === slugFilter);
    }
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    return jsonResponse(
      request,
      env,
      {
        success: true,
        platform: {
          name: 'shijianus Lab Platform',
          version: '2.8.0',
          protocolVersion: 'LAB_SANDBOX_PROTOCOL_V1',
          bundleSpec: 'lab-bundle-v2',
          runtimes: ['browser-dom', 'quickjs', 'curated-trace'],
          editors: ['lite', 'livecodes'],
          security: {
            isolationModes: ['cross-origin', 'opaque-srcdoc'],
            configuredSandboxOrigin: rawSandboxOrigin || null,
            cspDirectives: {
              defaultSrc: "'none'",
              connectSrc: "'none'",
              workerSrc: "'none'",
              objectSrc: "'none'",
            },
            quotas: LAB_QUOTAS,
          },
        },
        experiments: filtered,
        stats: {
          totalOfficialExperiments: OFFICIAL_EXPERIMENTS_META.length,
          returnedCount: filtered.length,
          timestampUtc: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=120',
        },
      }
    );
  }

  if (request.method === 'POST') {
    const body = await safeReadJson<{
      action?: string;
      title?: string;
      slug?: string;
      files?: Array<{ name?: string; language?: string; content?: string }>;
    }>(request);

    if (!body || typeof body !== 'object') {
      return jsonResponse(
        request,
        env,
        {
          success: false,
          valid: false,
          errors: ['请求体格式无效，必须为合法 JSON 对象。'],
        },
        { status: 400 }
      );
    }

    const action = body.action || 'validate-bundle';
    if (action === 'ping') {
      return jsonResponse(request, env, {
        success: true,
        status: 'healthy',
        timestampUtc: new Date().toISOString(),
      });
    }

    const files = Array.isArray(body.files) ? body.files : [];
    const errors: string[] = [];

    if (files.length === 0) {
      errors.push('实验工程包至少需要包含 1 个源码文件。');
    }
    if (files.length > LAB_QUOTAS.maxFiles) {
      errors.push(`源码文件数量 (${files.length}) 超过上限 (${LAB_QUOTAS.maxFiles})。`);
    }

    let totalBytes = 0;
    const seenNames = new Set<string>();

    for (const file of files) {
      const name = typeof file?.name === 'string' ? file.name.trim() : '';
      const content = typeof file?.content === 'string' ? file.content : '';
      if (!name) {
        errors.push('存在未命名源码文件。');
        continue;
      }
      const lower = name.toLowerCase();
      if (seenNames.has(lower)) {
        errors.push(`存在重复文件名: ${name}`);
      }
      seenNames.add(lower);

      const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
      if (!hasAllowedExt) {
        errors.push(`文件 "${name}" 后缀不在允许白名单内 (${ALLOWED_EXTENSIONS.join(', ')})。`);
      }

      const fileBytes = new TextEncoder().encode(content).byteLength;
      if (fileBytes > LAB_QUOTAS.maxSingleFileBytes) {
        errors.push(
          `文件 "${name}" 体积 (${fileBytes} B) 超过单文件限制 (${LAB_QUOTAS.maxSingleFileBytes} B)。`
        );
      }
      totalBytes += fileBytes;
    }

    if (totalBytes > LAB_QUOTAS.maxTotalSourceBytes) {
      errors.push(
        `工程总字节数 (${totalBytes} B) 超过配额上限 (${LAB_QUOTAS.maxTotalSourceBytes} B)。`
      );
    }

    if (errors.length > 0) {
      return jsonResponse(
        request,
        env,
        {
          success: false,
          valid: false,
          errors,
        },
        { status: 422 }
      );
    }

    const canonicalPayload = JSON.stringify(
      files.map((f) => ({
        name: String(f.name || '').trim(),
        language: String(f.language || 'javascript'),
        content: String(f.content || ''),
      }))
    );
    const sha256 = await computeSha256Hex(canonicalPayload);

    return jsonResponse(request, env, {
      success: true,
      valid: true,
      digest: `sha256-${sha256}`,
      summary: {
        fileCount: files.length,
        totalBytes,
        recommendedRuntime: files.some((f) => String(f.name || '').endsWith('.html'))
          ? 'browser-dom'
          : 'quickjs',
        verifiedAtUtc: new Date().toISOString(),
      },
    });
  }

  return jsonResponse(
    request,
    env,
    {
      success: false,
      error: `Method ${request.method} Not Allowed`,
    },
    { status: 405 }
  );
};
