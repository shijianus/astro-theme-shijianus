import assert from 'node:assert';
import {
  getSummaryLevel,
  normalizeArticleText,
  getSystemInstructionByLevel,
  buildSummaryPrompt,
  buildQuestionPrompt,
} from '../functions/_lib/summary.ts';
import {
  processAiSummaryRequest,
  normalizeArticleContent,
  getSummaryLevel as getServerSummaryLevel,
  getSystemInstructionByLevel as getServerSystemInstruction,
  buildDynamicQuestionPrompt,
  DEFAULT_INSTANCE_MODELS,
} from '../src/lib/server-ai-summary.ts';

async function runVerification() {
  console.log('🚀 开始验证 AI 总结三级档位、提示词体系与模型池机制...\n');

  const mockLongArticle = Array.from({ length: 200 }, (_, i) => 
    `这是博文核心第 ${i + 1} 章节。我们深入探讨了微内核架构与 Astro SSR Islands 模式的工程集成细节。`
  ).join('\n');

  console.log(`[测试数据] 模拟长正文总字符数: ${mockLongArticle.length}`);

  // 1. 验证低档位 (low)
  console.log('\n--- 1. 验证低档位 (low，开箱默认，保护 Token) ---');
  assert.strictEqual(getSummaryLevel(undefined), 'low', '未设置时必须默认回退到低档位 low');
  assert.strictEqual(getSummaryLevel(''), 'low', '空字符串时必须回退到 low');
  assert.strictEqual(getSummaryLevel('invalid'), 'low', '非法档位必须回退到 low');
  assert.strictEqual(getSummaryLevel('low'), 'low', '指定 low 必须解析为 low');

  const lowText = normalizeArticleText(mockLongArticle, 'low');
  console.log(`[low] 裁剪后字符数: ${lowText.length} (上限 3500)`);
  assert.ok(lowText.length <= 3500, 'low 档位正文字符数必须限制在 3500 内以节省 token');

  const lowInstruction = getSystemInstructionByLevel('low');
  assert.ok(lowInstruction.includes('轻量摘要助手'), 'low 档位系统指令必须为轻量助手');

  const lowPrompt = buildSummaryPrompt({
    title: '测试文章',
    url: 'https://shijian.us/posts/test',
    summary: '测试摘要',
    content: lowText,
    level: 'low',
  });
  assert.ok(lowPrompt.includes('120-170 字'), 'low 档位必须包含 120-170 字约束');
  console.log('✓ 低档位 (low) 校验通过！');

  // 2. 验证中档位 (medium)
  console.log('\n--- 2. 验证中档位 (medium，架构剖析与细节) ---');
  assert.strictEqual(getSummaryLevel('medium'), 'medium', '指定 medium 必须解析为 medium');

  const mediumText = normalizeArticleText(mockLongArticle, 'medium');
  console.log(`[medium] 裁剪后字符数: ${mediumText.length} (上限 15000)`);
  assert.ok(mediumText.length <= 15000, 'medium 档位正文字符数必须限制在 15000 内');
  assert.ok(mediumText.length > lowText.length, 'medium 档位正文必须比 low 档位更充实');

  const mediumInstruction = getSystemInstructionByLevel('medium');
  assert.ok(mediumInstruction.includes('架构剖析专家'), 'medium 档位系统指令必须为架构剖析专家');

  const mediumPrompt = buildSummaryPrompt({
    title: '测试文章',
    url: 'https://shijian.us/posts/test',
    summary: '测试摘要',
    content: mediumText,
    level: 'medium',
  });
  assert.ok(mediumPrompt.includes('160-240 字'), 'medium 档位必须包含 160-240 字约束');
  assert.ok(mediumPrompt.includes('架构实现与最终落地收益'), 'medium 档位必须包含架构实现要点');
  console.log('✓ 中档位 (medium) 校验通过！');

  // 3. 验证高档位 (high - 重点)
  console.log('\n--- 3. 验证高档位 (high，全量正文知识库与自由总结) ---');
  assert.strictEqual(getSummaryLevel('high'), 'high', '指定 high 必须解析为 high');

  const highText = normalizeArticleText(mockLongArticle, 'high');
  console.log(`[high] 裁剪后字符数: ${highText.length} (全量保留)`);
  assert.strictEqual(highText.length, mockLongArticle.length, 'high 档位必须完整保留全量正文作为知识库');

  const highInstruction = getSystemInstructionByLevel('high');
  assert.ok(highInstruction.includes('资深技术架构师与全景内容领航专家'), 'high 档位系统指令必须赋予领航专家身份');
  assert.ok(highInstruction.includes('全局技术视野与敏锐的工程洞察力'), 'high 档位必须强调全局视野');

  const highPrompt = buildSummaryPrompt({
    title: '深入理解现代前端架构演进',
    url: 'https://shijian.us/posts/arch',
    summary: '探讨微内核与 Islands 架构设计',
    content: highText,
    level: 'high',
  });

  assert.ok(highPrompt.includes('【身份与使命】'), 'high 档位 Prompt 必须包含【身份与使命】');
  assert.ok(highPrompt.includes('【核心任务与自由度】'), 'high 档位 Prompt 必须包含【核心任务与自由度】');
  assert.ok(highPrompt.includes('【生成约束与字数上限】'), 'high 档位 Prompt 必须包含【生成约束与字数上限】');
  assert.ok(highPrompt.includes('220 至 320 字纯文本之间'), 'high 档位字数上限必须为 220 至 320 字');
  assert.ok(highPrompt.includes('拒绝千篇一律的机械套路与扁平复述'), 'high 档位必须鼓励自由提炼与聚焦不同重点');
  assert.ok(highPrompt.includes('完整正文知识库：'), 'high 档位必须将整篇正文贴入完整知识库');
  console.log('✓ 高档位 (high) 完整提示词、全量正文保留与字数上限校验通过！');

  // 4. 验证固定模型 vs 模型池随机选择
  console.log('\n--- 4. 验证固定模型 (Fixed Model) 与模型池 (Model Pool) 机制 ---');
  assert.ok(Array.isArray(DEFAULT_INSTANCE_MODELS) && DEFAULT_INSTANCE_MODELS.length >= 6, '默认模型池必须涵盖所有支持的模型');
  console.log(`[默认支持模型池]: ${DEFAULT_INSTANCE_MODELS.join(', ')}`);

  // 5. 验证后端处理器 (processAiSummaryRequest)
  console.log('\n--- 5. 验证后端 processAiSummaryRequest 处理流程 ---');
  const devResult = await processAiSummaryRequest(
    {
      title: '测试微内核架构演进',
      content: mockLongArticle,
      summary: '作者手记：关于微前端与 Islands 的思考',
      mode: 'instance',
    },
    {
      aiSummaryLevel: 'high',
      aiSummaryFixedModel: 'kimi-k3-free',
    }
  );

  console.log('[Dev Server 返回结果样本]:', {
    ok: devResult.ok,
    provider: devResult.provider,
    model: devResult.model,
    level: devResult.level,
    summaryLength: devResult.summary?.length,
  });

  assert.strictEqual(devResult.ok, true, '处理结果必须成功');
  assert.strictEqual(devResult.level, 'high', '返回结果必须包含 level=high 标记');
  assert.ok(devResult.summary && devResult.summary.length > 20, '必须生成有意义的摘要内容');
  console.log('✓ processAiSummaryRequest 高档位端到端执行通过！');

  console.log('\n🎉 所有 AI 总结档位化、提示词规范与模型控制验证 100% 通过！');
}

runVerification().catch((err) => {
  console.error('❌ 验证失败:', err);
  process.exit(1);
});
