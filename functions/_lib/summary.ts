export type SummaryLevel = 'low' | 'medium' | 'high';

export function getSummaryLevel(raw?: string | null): SummaryLevel {
  const val = (raw || '').toLowerCase().trim();
  if (val === 'high') return 'high';
  if (val === 'medium') return 'medium';
  return 'low'; // 默认低档位，省 token 且可随时切回
}

export function normalizeSummaryLocale(lang?: string | null): string {
  if (!lang) return 'zh-CN';
  const clean = lang.toLowerCase().trim();
  if (clean.startsWith('zh-hant') || clean.startsWith('zh-tw') || clean.startsWith('zh-hk')) return 'zh-Hant';
  if (clean.startsWith('zh')) return 'zh-CN';
  if (clean.startsWith('en')) return 'en';
  if (clean.startsWith('fr')) return 'fr';
  if (clean.startsWith('es')) return 'es';
  if (clean.startsWith('de')) return 'de';
  if (clean.startsWith('ja')) return 'ja';
  return 'zh-CN';
}

export function normalizeArticleText(value: string, level: SummaryLevel = 'low'): string {
  const cleaned = (value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[ \t]+\./g, '.')
    .trim();

  // 档位化正文裁剪策略：
  // 1. 低档位 (low): 仅保留前 3,500 字符，控制 token 消耗，适合快速轻量摘要；
  // 2. 中档位 (medium): 保留前 15,000 字符，涵盖大部分文章的主要章节与架构细节；
  // 3. 高档位 (high): 将整篇正体全部同步发给 AI 作为完整知识库与上下文（支持 120,000+ 字符全文无损直传）。
  if (level === 'high') {
    return cleaned.slice(0, 120000);
  }
  if (level === 'medium') {
    return cleaned.slice(0, 15000);
  }
  return cleaned.slice(0, 3500);
}

export function getSystemInstructionByLevel(
  level: SummaryLevel = 'low',
  customInstruction?: string | null,
  rawLang?: string | null,
): string {
  if (customInstruction?.trim()) {
    return customInstruction.trim();
  }

  const lang = normalizeSummaryLocale(rawLang);

  if (lang === 'en') {
    if (level === 'high') {
      return [
        'You are a principal systems architect and tech curator powered by Chronral. Your mission is to analyze the author\'s complete long-form technical article as an authoritative contextual knowledge base, synthesizing its architectural evolution, engineering trade-offs, core design decisions, and craft philosophy.',
        'You possess a global engineering vision and deep technical insight, discerning underlying essence beyond surface prose.',
        'Adopt an objective, insightful, and craft-oriented tone. Strictly no polite greetings, no meta-chatter, and no Markdown headings, bullet points, or numbered lists. Output a single cohesive, information-dense plain text paragraph in natural, professional English.',
      ].join('\n');
    }
    if (level === 'medium') {
      return [
        'You are a technical architecture analyst powered by Chronral. Analyze this post from an engineering and systems architecture perspective, articulating technical rationale, trade-offs, and implementation outcomes.',
        'Strictly no greetings, no Markdown headings or lists. Output a single cohesive, information-dense plain text paragraph in clear, professional English.',
      ].join('\n');
    }
    return 'You are a concise technical summary assistant powered by Chronral. Extract key takeaways and engineering conclusions rapidly. Strictly no greetings, no Markdown lists or headings. Output a compact, information-dense plain text paragraph in clear English.';
  }

  if (lang === 'zh-Hant') {
    if (level === 'high') {
      return [
        '你是由 Chronral 知識庫驅動的資深技術架構師與全景內容領航專家。你的使命是將作者的整篇長文作為權威上下文知識庫，融會貫通其底層設計邏輯、技術架構演進、核心工程決策與極客思考。',
        '你具備開闊的全局技術視野與敏銳的工程洞察力，能夠跳脫出表面文字，直擊技術本質。',
        '請以冷靜、深邃、富有極客工匠精神的口吻進行總結，嚴禁寒暄客套，嚴禁空洞總結，嚴禁使用 Markdown 標題、編號或列表，輸出整段連貫精悍、高資訊密度的繁體中文純文字。',
      ].join('\n');
    }
    if (level === 'medium') {
      return [
        '你是由 Chronral 驅動的技術部落格架構剖析專家。請從工程實踐與系統架構視角出發，洞悉文章的技術邏輯鏈條、選型背景與實現取捨。',
        '語言緊湊專業，條理清晰，嚴禁寒暄與客套，嚴禁 Markdown 標題或列表，輸出結構連貫、高資訊密度的繁體中文純文字。',
      ].join('\n');
    }
    return '你是由 Chronral 驅動的技術部落格輕量摘要助手。請保持冷靜、嚴謹、客觀、緊湊，快速提取文章核心要點與技術結論。嚴禁寒暄與客套，嚴禁 Markdown 列表，輸出一段極簡緊湊的繁體中文純文字。';
  }

  if (lang === 'fr') {
    if (level === 'high') {
      return [
        'Vous êtes un architecte logiciel principal propulsé par Chronral. Votre mission est d\'analyser l\'intégralité de l\'article technique comme base de connaissances faisant autorité, en synthétisant la logique de conception, l\'évolution architecturale et les compromis d\'ingénierie.',
        'Adoptez un ton perspicace et rigoureux. Aucun préambule ni formule de politesse. Aucun titre ni liste Markdown. Rédigez un paragraphe unique, fluide et dense en français.',
      ].join('\n');
    }
    if (level === 'medium') {
      return 'Vous êtes un analyste en architecture logicielle propulsé par Chronral. Analysez cet article sous l\'angle de l\'ingénierie et des compromis techniques. Pas de salutations, pas de listes Markdown. Rédigez un paragraphe dense et fluide en français.';
    }
    return 'Vous êtes un assistant de synthèse technique propulsé par Chronral. Extrayez les points essentiels et conclusions techniques. Aucun préambule, pas de puces Markdown. Rédigez un paragraphe concis en français.';
  }

  if (lang === 'es') {
    if (level === 'high') {
      return [
        'Eres un arquitecto de software principal impulsado por Chronral. Tu misión es analizar el artículo técnico completo como base de conocimiento fidedigna, sintetizando la evolución arquitectónica, decisiones clave y compensaciones de ingeniería.',
        'Mantén un tono técnico y perspicaz. Sin saludos ni relleno. Sin encabezados ni listas Markdown. Genera un único párrafo fluido y de alta densidad en español.',
      ].join('\n');
    }
    if (level === 'medium') {
      return 'Eres un analista de arquitectura técnica impulsado por Chronral. Analiza este artículo desde la perspectiva de la práctica de ingeniería y arquitectura de sistemas. Sin saludos, sin listas Markdown. Genera un párrafo conciso y fluido en español.';
    }
    return 'Eres un asistente de resumen técnico impulsado por Chronral. Extrae los puntos clave y conclusiones técnicas. Sin saludos ni viñetas Markdown. Genera un párrafo breve y claro en español.';
  }

  if (lang === 'de') {
    if (level === 'high') {
      return [
        'Sie sind ein leitender Systemarchitekt, angetrieben von Chronral. Ihre Mission ist es, den gesamten Fachartikel als maßgebliche Wissensbasis zu analysieren und die Architekturentwicklung, Kernentscheidungen und ingenieurmäßige Abwägungen zusammenzufassen.',
        'Sachlicher, präziser Ton. Keine Höflichkeitsfloskeln, keine Markdown-Überschriften oder Aufzählungen. Geben Sie einen einzelnen, kohärenten Absatz mit hoher Informationsdichte auf Deutsch aus.',
      ].join('\n');
    }
    if (level === 'medium') {
      return 'Sie sind ein technischer Architekturanalyst, angetrieben von Chronral. Analysieren Sie den Beitrag aus der Perspektive von Softwarearchitektur und Engineering. Keine Begrüßung, keine Markdown-Listen. Geben Sie einen dichten Absatz auf Deutsch aus.';
    }
    return 'Sie sind ein technischer Zusammenfassungs-Assistent, angetrieben von Chronral. Extrahieren Sie die Kernaussagen und technischen Ergebnisse. Keine Floskeln, keine Markdown-Listen. Geben Sie einen prägnanten Absatz auf Deutsch aus.';
  }

  // 默认 zh-CN
  if (level === 'high') {
    return [
      '你是由 Chronral 知识库驱动的资深技术架构师与全景内容领航专家。你的使命是将博主的整篇长文作为权威上下文知识库，融会贯通其底层设计逻辑、技术架构演进、核心工程决策与极客思考。',
      '你具备开阔的全局技术视野与敏锐的工程洞察力，能够跳脱出表面文字，直击技术本质。',
      '请以冷静、深邃、富有极客工匠精神的口吻进行总结，严禁寒暄客套，严禁空洞的八股文总结，严禁使用 Markdown 标题、编号或列表，输出一整段连贯精悍、高信息密度的纯文本。',
    ].join('\n');
  }

  if (level === 'medium') {
    return [
      '你是由 Chronral 驱动的技术博客架构剖析专家。请从工程实践与系统架构视角出发，洞悉文章的技术逻辑链条、选型背景与实现取舍。',
      '语言紧凑专业，条理清晰，严禁寒暄与客套，严禁 Markdown 标题或列表，输出结构连贯、高信息密度的纯文本。',
    ].join('\n');
  }

  return '你是由 Chronral 驱动的技术博客轻量摘要助手。请保持冷静、严谨、客观、紧凑，快速提取文章核心要点与技术结论。严禁寒暄与客套，严禁 Markdown 列表，输出一段极简紧凑的纯文本。';
}

export const SUMMARY_SYSTEM_INSTRUCTION = getSystemInstructionByLevel('low');

export function buildSummaryPrompt(input: {
  title: string;
  url: string;
  summary: string;
  content: string;
  level?: SummaryLevel;
  lang?: string;
  customUserPrompt?: string | null;
}) {
  const level = input.level || 'low';
  const lang = normalizeSummaryLocale(input.lang);

  if (input.customUserPrompt?.trim()) {
    return input.customUserPrompt
      .replace(/\$\{title\}/g, input.title)
      .replace(/\$\{url\}/g, input.url)
      .replace(/\$\{summary\}/g, input.summary || '无')
      .replace(/\$\{content\}/g, input.content)
      .replace(/\$\{lang\}/g, lang);
  }

  if (lang === 'en') {
    if (level === 'high') {
      return [
        '【Role & Mission】',
        'You are a senior systems architect and technical curator. Use the entire article provided below as an authoritative knowledge base and complete context to deliver an in-depth architectural summary for readers.',
        '',
        '【Core Objectives & Creative Liberty】',
        '1. Panoramic Reading: Comprehend the author\'s background motivation, design philosophy, technical trajectory, and critical engineering trade-offs.',
        '2. Architectural Distillation: Avoid robotic regurgitation. Uncover the most compelling highlights—such as distinct architectural trade-offs, elegant code implementation, systems performance optimization, or deep technology stack integration.',
        '3. Engineering Inspiration: Articulate the profound practical insights and paradigm-shifting value for engineers, architects, and technical explorers.',
        '',
        '【Generation Constraints & Language Requirement】',
        '- Output Language: STRICTLY write in natural, idiomatic, professional English. Do NOT output Chinese or any other language.',
        '- Word Limit: Strictly between 130 and 190 words of cohesive plain text.',
        '- Expression: Natural, reflective, and insight-dense. Strictly NO conversational greetings, NO cliché openers like "This article discusses", and NO Markdown lists (-, *, 1. 2.), headings, or bold markup. Output a single cohesive paragraph.',
        '- Accuracy: Strictly grounded in the provided content; do not invent unmentioned concepts or metrics.',
        '',
        '【Input Knowledge Base】',
        `Article Title: ${input.title}`,
        `Article URL: ${input.url}`,
        `Author Note: ${input.summary || 'None'}`,
        'Full Article Knowledge Base:',
        input.content,
      ].join('\n');
    }

    if (level === 'medium') {
      return [
        'Please generate a structured, in-depth architectural summary in English for this technical blog post.',
        'Requirements:',
        '1. Output Language: Strictly write in English.',
        '2. Word Limit: Strictly 100-150 words of plain text.',
        '3. Systematically articulate the core problem background, rationale behind technical choices, architectural implementation, and tangible outcomes.',
        '4. Maintain a professional, cohesive, and concise tone. Strictly no greetings, no Markdown headings or lists.',
        '',
        `Title: ${input.title}`,
        `URL: ${input.url}`,
        `Author Note: ${input.summary || 'None'}`,
        `Core Content:\n${input.content}`,
      ].join('\n');
    }

    return [
      'Please generate a concise core technical summary in English for this blog post.',
      'Requirements:',
      '1. Output Language: Strictly write in English.',
      '2. Word Limit: Strictly 80-120 words of plain text.',
      '3. High information density, concise prose, no greetings, no Markdown lists.',
      '4. Highlight the primary technical solution and the intended audience.',
      '',
      `Title: ${input.title}`,
      `URL: ${input.url}`,
      `Author Note: ${input.summary || 'None'}`,
      `Content Snippet:\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'zh-Hant') {
    if (level === 'high') {
      return [
        '【身份與使命】',
        '你是資深技術架構師與全景知識領航專家。請以整篇博文為核心知識庫與完整上下文，為讀者進行深度全景總結。',
        '',
        '【核心任務與自由度】',
        '1. 全景通讀：基於下方提供的完整文章正文，通盤理解整篇作品的背景動機、核心設計思想、技術演進脈絡與關鍵工程取捨。',
        '2. 自由提煉與聚焦：拒絕千篇一律的機械套路與扁平複述。請發揮架構師的全局審視能力，自由提煉最打動人或最硬核的精髓。',
        '3. 啟迪讀者：點明文章對工程師、架構師或技術探索者的深層實踐啟示與範式轉變價值。',
        '',
        '【生成約束與輸出語言要求】',
        '- 輸出語言：必須嚴格使用繁體中文（正體中文）輸出，嚴禁使用簡體中文或英文。',
        '- 字數上限：嚴格控制在 220 至 320 字純文字之間（資訊充沛飽滿，篇幅恰到好處）。',
        '- 表達規範：語言自然連貫、極富思考質感，一氣呵成；嚴禁寒暄；嚴禁使用任何 Markdown 列表（如 -、*、1. 2.）、加粗或分段標籤，輸出為單一完整段落的純文字。',
        '- 真實準確：完全基於提供的正文知識庫，不捏造任何未提及的概念與數據。',
        '',
        '【輸入知識庫】',
        `文章標題：${input.title}`,
        `文章連結：${input.url}`,
        `作者手記：${input.summary || '暫無作者手記'}`,
        '完整正文知識庫：',
        input.content,
      ].join('\n');
    }

    if (level === 'medium') {
      return [
        '請從工程架構與技術實踐視角，為這篇部落格文章生成結構化繁體中文深度摘要。',
        '要求：',
        '1. 輸出語言：必須嚴格使用繁體中文輸出。',
        '2. 輸出 160-240 字純文字。',
        '3. 深入梳理文章的痛點背景、關鍵技術方案選型依據、核心架構實現與最終落地收益。',
        '4. 語言專業凝練，條理自然順暢，嚴禁編造，輸出純文字，不要 Markdown 標題或列表。',
        '',
        `標題：${input.title}`,
        `連結：${input.url}`,
        `作者自述：${input.summary || '無'}`,
        `正文核心內容：\n${input.content}`,
      ].join('\n');
    }

    return [
      '請為這篇部落格文章生成極簡繁體中文核心摘要。',
      '要求：',
      '1. 輸出語言：必須嚴格使用繁體中文輸出。',
      '2. 輸出 120-170 字純文字。',
      '3. 保持資訊密度高，語言精煉，不要寒暄。',
      '4. 優先說明文章核心技術方案與適合什麼讀者，不要 Markdown 列表。',
      '',
      `標題：${input.title}`,
      `連結：${input.url}`,
      `作者自述：${input.summary || '無'}`,
      `正文片段：\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'fr') {
    return [
      '【Rôle & Mission】',
      'Vous êtes un architecte logiciel principal propulsé par Chronral. Utilisez l\'intégralité de l\'article ci-dessous pour délivrer un résumé architectural approfondi en français.',
      '',
      '【Exigences & Langue】',
      '- Langue obligatoire : Rédigez STRICTEMENT en français naturel et professionnel.',
      `- Longueur : ${level === 'high' ? '140 à 200 mots' : level === 'medium' ? '110 à 160 mots' : '80 à 130 mots'} de texte brut continu.`,
      '- Style : Analytique, dense et fluide. Pas de politesse, pas de listes ni titres Markdown. Un paragraphe unique.',
      '',
      `Titre : ${input.title}`,
      `URL : ${input.url}`,
      `Note : ${input.summary || 'Aucune'}`,
      `Contenu :\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'es') {
    return [
      '【Rol y Misión】',
      'Eres un arquitecto de software principal impulsado por Chronral. Utiliza el artículo completo para generar un resumen arquitectónico estructurado en español.',
      '',
      '【Requisitos e Idioma】',
      '- Idioma obligatorio: Redacta ESTRICTAMENTE en español natural, técnico y fluido.',
      `- Longitud: ${level === 'high' ? '140 a 200 palabras' : level === 'medium' ? '110 a 160 palabras' : '80 a 130 palabras'} de texto continuo.`,
      '- Tono: Objetivo y analítico. Sin saludos, sin listas Markdown ni encabezados. Un único párrafo.',
      '',
      `Título: ${input.title}`,
      `URL: ${input.url}`,
      `Nota: ${input.summary || 'Ninguna'}`,
      `Contenido:\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'de') {
    return [
      '【Rolle & Mission】',
      'Sie sind ein leitender Systemarchitekt, angetrieben von Chronral. Fassen Sie den gesamten Artikel als maßgebliche Wissensbasis auf Deutsch zusammen.',
      '',
      '【Vorgaben & Sprache】',
      '- Ausgabesprache: Verfassen Sie die Zusammenfassung STRIKT auf Deutsch.',
      `- Länge: ${level === 'high' ? '120 bis 180 Wörter' : level === 'medium' ? '90 bis 140 Wörter' : '70 bis 110 Wörter'} Fließtext.`,
      '- Keine Höflichkeitsfloskeln, keine Markdown-Listen oder Überschriften. Ein einziger kohärenter Absatz.',
      '',
      `Titel: ${input.title}`,
      `URL: ${input.url}`,
      `Autorennotiz: ${input.summary || 'Keine'}`,
      `Artikelinhalt:\n${input.content}`,
    ].join('\n');
  }

  // 默认 zh-CN
  if (level === 'high') {
    return [
      '【身份与使命】',
      '你是资深技术架构师与全景知识领航专家。请以整篇博文为核心知识库与完整上下文，为读者进行深度全景总结。',
      '',
      '【核心任务与自由度】',
      '1. 全景通读：基于下方提供的完整文章正文，通盘理解整篇作品的背景动机、核心设计思想、技术演进脉络与关键工程取舍。',
      '2. 自由提炼与聚焦：拒绝千篇一律的机械套路与扁平复述。请发挥架构师的全局审视能力，自由提炼最打动人或最硬核的精髓——每次总结可自主聚焦不同的核心亮点（例如独特的架构权衡、优雅的编码实现、系统级性能优化、前沿技术栈的深度整合，或是作者对工程美学的独到见解）。',
      '3. 启迪读者：点明文章对工程师、架构师或技术探索者的深层实践启示与范式转变价值。',
      '',
      '【生成约束与字数上限】',
      '- 字数上限：严格控制在 220 至 320 字纯文本之间（信息充沛饱满，篇幅恰到好处）。',
      '- 表达规范：语言自然连贯、极富思考质感，一气呵成；严禁出现“本文主要讲述了”、“首先其次最后”等刻板八股用语；严禁寒暄；严禁使用任何 Markdown 列表（如 -、*、1. 2.）、加粗或分段标签，输出为单一完整段落的纯文本。',
      '- 真实准确：完全基于提供的正文知识库，不捏造任何未提及的概念与数据。',
      '',
      '【输入知识库】',
      `文章标题：${input.title}`,
      `文章链接：${input.url}`,
      `作者手记：${input.summary || '暂无作者手记'}`,
      '完整正文知识库：',
      input.content,
    ].join('\n');
  }

  if (level === 'medium') {
    return [
      '请从工程架构与技术实践视角，为这篇博客文章生成结构化中文深度摘要。',
      '要求：',
      '1. 输出 160-240 字纯文本。',
      '2. 深入梳理文章的痛点背景、关键技术方案选型依据、核心架构实现与最终落地收益。',
      '3. 语言专业凝练，条理自然顺畅，兼具技术深度与可读性。',
      '4. 严格基于文章提供的内容，严禁编造，输出纯文本，不要 Markdown 标题或列表。',
      '',
      `标题：${input.title}`,
      `链接：${input.url}`,
      `作者自述：${input.summary || '无'}`,
      `正文核心内容：\n${input.content}`,
    ].join('\n');
  }

  // 低档位 (low): 保持既有轻量逻辑
  return [
    '请为这篇博客文章生成极简中文核心摘要。',
    '要求：',
    '1. 输出 120-170 字纯文本。',
    '2. 保持信息密度高，语言精炼，不要寒暄。',
    '3. 优先说明文章核心技术方案与适合什么读者。',
    '4. 不要编造正文里没有的信息。',
    '5. 输出纯文本，不要 Markdown 列表。',
    '',
    `标题：${input.title}`,
    `链接：${input.url}`,
    `作者自述：${input.summary || '无'}`,
    `正文片段：\n${input.content}`,
  ].join('\n');
}

export function buildQuestionPrompt(input: {
  title: string;
  url: string;
  summary: string;
  content: string;
  questionType: string;
  level?: SummaryLevel;
  lang?: string;
  related?: Array<{ title: string; href: string }>;
}) {
  const level = input.level || 'low';
  const lang = normalizeSummaryLocale(input.lang);
  const formatRelated = (items: Array<{ title: string; href: string }>, targetLang: string) => {
    if (!items || items.length === 0) return '';
    if (targetLang === 'en') return items.map((r, i) => `${i + 1}. "${r.title}"`).join(', ');
    if (targetLang === 'de') return items.map((r, i) => `${i + 1}. „${r.title}“`).join(', ');
    if (targetLang === 'es') return items.map((r, i) => `${i + 1}. «${r.title}»`).join(', ');
    if (targetLang === 'fr') return items.map((r, i) => `${i + 1}. « ${r.title} »`).join(', ');
    return items.map((r, i) => `${i + 1}. 《${r.title}》`).join('、');
  };
  const relatedListStr = formatRelated(input.related || [], lang);

  if (lang === 'en') {
    const typeMapEn: Record<string, string> = {
      point:
        level === 'high'
          ? `From a principal systems architect's perspective, analyze the entire knowledge base of "${input.title}" and extract the 2-3 most critical architectural arguments and technical decisions, elucidating their rationale and trade-offs.`
          : `Accurately extract the 2-3 most essential technical arguments and architectural conclusions from "${input.title}".`,
      audience:
        level === 'high'
          ? `Analyze the target engineering persona (e.g. frontend architects, full-stack builders) and explain how this article reshapes their technical perspective or resolves critical engineering bottlenecks.`
          : `Analyze who will benefit most from reading "${input.title}" and what concrete engineering challenges it solves.`,
      quick:
        `Provide a rapid 30-second overview in exactly three cohesive sentences: 1. Core background & pain point; 2. Technical implementation & design; 3. Outcomes & lasting takeaways.`,
      insight:
        level === 'high'
          ? `Extract the core practical takeaways, pitfalls to avoid, and architectural insights for technical leaders in real-world systems evolution.`
          : `Summarize the most valuable practical takeaways, architectural lessons, or engineering guidelines from "${input.title}".`,
      intro:
        'Generate a comprehensive, craft-focused author profile for Shijianus: a generalist software builder, student, and long-term writer dedicated to content-first, structure-first, and craft-driven personal systems.',
      related_reason:
        `In connection with "${input.title}", explain why the following recommended articles (${relatedListStr || 'related technical topics'}) provide valuable follow-up exploration and complementary value.`,
    };

    const instruction = typeMapEn[input.questionType] || `Please summarize and extract insights for "${input.title}".`;
    const wordLimit = level === 'high' ? '110-180 words' : level === 'medium' ? '90-140 words' : '80-120 words';

    return [
      instruction,
      'Requirements:',
      '- Output Language: STRICTLY write in natural, professional English.',
      `- Length: ${wordLimit} of cohesive plain text.`,
      '- Objective, high-density, no greetings, no Markdown lists or headings.',
      '- Strictly grounded in the provided context.',
      '',
      `Title: ${input.title}`,
      `URL: ${input.url}`,
      `Author Note: ${input.summary || 'None'}`,
      `Knowledge Base:\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'de') {
    const typeMapDe: Record<string, string> = {
      point:
        level === 'high'
          ? `Analysieren Sie als leitender Systemarchitekt die gesamte Wissensbasis von "${input.title}" und extrahieren Sie die 2-3 wichtigsten Architekturargumente und technischen Entscheidungen sowie deren Begründung und Abwägungen.`
          : `Extrahieren Sie präzise die 2-3 wichtigsten technischen Argumente und Architekturschlüsse aus "${input.title}".`,
      audience:
        level === 'high'
          ? `Analysieren Sie das Zielpublikum aus Entwicklern und Architekten und erläutern Sie, wie dieser Beitrag deren technische Perspektive schärft oder zentrale Herausforderungen löst.`
          : `Analysieren Sie, für wen "${input.title}" am wertvollsten ist und welche konkreten technischen Herausforderungen gelöst werden.`,
      quick:
        `Geben Sie einen schnellen 30-Sekunden-Überblick in genau drei kohärenten Sätzen: 1. Ausgangssituation & Problemstellung; 2. Technische Umsetzung & Design; 3. Ergebnisse & dauerhafter Mehrwert.`,
      insight:
        level === 'high'
          ? `Extrahieren Sie zentrale Praxiserkenntnisse, typische Fallstricke und architektonische Leitlinien für Führungskräfte in der Softwareentwicklung.`
          : `Fassen Sie die wertvollsten praktischen Erkenntnisse, Architekturlektionen oder Empfehlungen aus "${input.title}" zusammen.`,
      intro:
        'Erstellen Sie ein präzises, handwerklich orientiertes Autorenprofil für Shijianus: Allround-Softwareentwickler, Student und langfristiger Autor, der sich für inhaltsorientierte, strukturierte und nachhaltige persönliche Softwaresysteme engagiert.',
      related_reason:
        `Erläutern Sie im Zusammenhang mit "${input.title}", warum die folgenden empfohlenen Artikel (${relatedListStr || 'verwandte technische Themen'}) eine wertvolle weiterführende Lektüre darstellen.`,
    };

    const instruction = typeMapDe[input.questionType] || `Bitte fassen Sie "${input.title}" zusammen und destillieren Sie Kernpunkte heraus.`;
    const wordLimit = level === 'high' ? '110-180 Wörter' : level === 'medium' ? '90-140 Wörter' : '80-120 Wörter';

    return [
      instruction,
      'Vorgaben:',
      '- Ausgabesprache: STRENG auf natürlichem, professionellem Deutsch.',
      `- Umfang: ${wordLimit} zusammenhängender Fließtext.`,
      '- Sachlich, hohe Informationsdichte, keine Begrüßung, keine Markdown-Listen oder Überschriften.',
      '- Strikt auf der bereitgestellten Wissensbasis basierend.',
      '',
      `Titel: ${input.title}`,
      `URL: ${input.url}`,
      `Autorennotiz: ${input.summary || 'Keine'}`,
      `Wissensbasis:\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'es') {
    const typeMapEs: Record<string, string> = {
      point:
        level === 'high'
          ? `Desde la perspectiva de un arquitecto de sistemas principal, analiza la base de conocimiento completa de "${input.title}" y extrae los 2-3 argumentos arquitectónicos y decisiones técnicas más cruciales, explicando sus motivos y compensaciones.`
          : `Extrae con precisión los 2-3 argumentos técnicos y conclusiones arquitectónicas esenciales de "${input.title}".`,
      audience:
        level === 'high'
          ? `Analiza el perfil de ingeniería destinatario (p. ej., arquitectos frontend, desarrolladores full-stack) y explica cómo este artículo transforma su perspectiva técnica o resuelve cuellos de botella clave.`
          : `Analiza quién se beneficiará más de leer "${input.title}" y qué desafíos de ingeniería concretos resuelve.`,
      quick:
        `Ofrece una visión general rápida de 30 segundos en exactamente tres oraciones coherentes: 1. Problema de fondo y contexto; 2. Implementación técnica y diseño; 3. Resultados y aprendizajes duraderos.`,
      insight:
        level === 'high'
          ? `Extrae los aprendizajes prácticos fundamentales, errores comunes a evitar y perspectivas arquitectónicas para líderes técnicos en sistemas reales.`
          : `Resume las lecciones prácticas, reflexiones arquitectónicas o pautas de ingeniería más valiosas de "${input.title}".`,
      intro:
        'Genera un perfil de autor integral y orientado al oficio para Shijianus: creador de software generalista, estudiante y escritor constante enfocado en sistemas personales estructurados y de alta calidad.',
      related_reason:
        `En conexión con "${input.title}", explica por qué los siguientes artículos recomendados (${relatedListStr || 'temas técnicos relacionados'}) ofrecen un valor complementario significativo.`,
    };

    const instruction = typeMapEs[input.questionType] || `Por favor resume y extrae perspectivas clave para "${input.title}".`;
    const wordLimit = level === 'high' ? '110-180 palabras' : level === 'medium' ? '90-140 palabras' : '80-120 palabras';

    return [
      instruction,
      'Requisitos:',
      '- Idioma de salida: ESTRICTAMENTE en español natural y profesional.',
      `- Extensión: ${wordLimit} de texto continuo.`,
      '- Objetivo, alta densidad de información, sin saludos, sin listas Markdown ni encabezados.',
      '- Estrictamente basado en el contexto proporcionado.',
      '',
      `Título: ${input.title}`,
      `URL: ${input.url}`,
      `Nota del autor: ${input.summary || 'Ninguna'}`,
      `Base de conocimiento:\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'fr') {
    const typeMapFr: Record<string, string> = {
      point:
        level === 'high'
          ? `Du point de vue d'un architecte système principal, analysez l'ensemble de la base de connaissances de "${input.title}" et dégagez les 2-3 arguments architecturaux et décisions techniques les plus critiques en explicitant leurs compromis.`
          : `Extrayez avec précision les 2-3 arguments techniques et conclusions d'architecture essentiels de "${input.title}".`,
      audience:
        level === 'high'
          ? `Analysez le profil technique cible et expliquez en quoi cet article fait évoluer leurs perspectives ou résout des blocages d'ingénierie majeurs.`
          : `Analysez à qui s'adresse "${input.title}" et quels défis concrets d'ingénierie cet article résout.`,
      quick:
        `Fournissez une vue d'ensemble rapide en 30 secondes en exactement trois phrases fluides : 1. Contexte & problématique ; 2. Mise en œuvre technique & conception ; 3. Résultats & enseignements durables.`,
      insight:
        level === 'high'
          ? `Dégagez les retours d'expérience concrets majeurs, les pièges à éviter et les perspectives d'architecture pour les concepteurs de systèmes réels.`
          : `Résumez les enseignements pratiques et réflexions d'ingénierie les plus précieux de "${input.title}".`,
      intro:
        `Rédigez un profil d'auteur soigné pour Shijianus : concepteur logiciel généraliste, étudiant et auteur régulier dédié à des systèmes pérennes, structurés et axés sur le contenu.`,
      related_reason:
        `En lien avec "${input.title}", expliquez pourquoi les articles recommandés suivants (${relatedListStr || 'sujets techniques connexes'}) apportent une valeur d'approfondissement complémentaire.`,
    };

    const instruction = typeMapFr[input.questionType] || `Veuillez synthétiser et extraire les points essentiels de "${input.title}".`;
    const wordLimit = level === 'high' ? '110-180 mots' : level === 'medium' ? '90-140 mots' : '80-120 mots';

    return [
      instruction,
      'Exigences :',
      '- Langue de sortie : STRICTEMENT en français naturel et professionnel.',
      `- Longueur : ${wordLimit} de texte fluide.`,
      '- Objectif, haute densité d\'information, pas de salutations, pas de listes Markdown ni de titres.',
      '- Strictement fondé sur le contexte fourni.',
      '',
      `Titre : ${input.title}`,
      `URL : ${input.url}`,
      `Note de l'auteur : ${input.summary || 'Aucune'}`,
      `Base de connaissances :\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'zh-Hant') {
    const typeMapHant: Record<string, string> = {
      point:
        level === 'high'
          ? '請以資深架構師視角，縱觀全文知識庫，深度提煉本文最硬核的 2-3 個核心架構論點與技術決斷，闡明其立論依據與取捨。'
          : '請準確提煉出本文最核心的 2-3 個論點與關鍵技術結論，用一段連貫通順的話進行總結。',
      audience:
        level === 'high'
          ? '請深度剖析本文針對的工程師與架構師受眾畫像，闡述閱讀本文能如何重構讀者的技術認知、解決關鍵工程難點或拓寬認知邊界。'
          : '請分析這篇文章適合哪些背景的讀者，以及能幫助他們解決什麼具體問題。',
      quick:
        '請用最精煉的 3 句話進行 30 秒極速概覽（背景痛點、核心方案、最終收益），讓讀者在最短時間內掌握關鍵價值。',
      insight:
        level === 'high'
          ? '請基於全文知識庫深度提煉技術人在真實系統設計、架構演進與長期主義構建中的核心避坑經驗與工程認知升級啟示。'
          : '請總結閱讀本文後能獲得的最關鍵實踐啟示、架構思考或避坑建議。',
      intro:
        '請為部落客 Shijianus（時鑑）生成一份詳盡、立體且富有極客工匠精神的作者介紹，涵蓋其通才型軟體構建者、學生與長期寫作者的定位，強調「內容優先、結構優先、體驗潔癖」與系統級構建哲學。',
      related_reason:
        `請結合本文核心主題，深度剖析為什麼推薦以下延伸閱讀文章（${relatedListStr || '相關技術主題'}），說明其技術脈絡遞進與互補價值。`,
    };

    const instruction = typeMapHant[input.questionType] || '請針對這篇部落格文章進行提煉與總結。';
    const wordLimit = level === 'high' ? '150-240 字' : level === 'medium' ? '130-200 字' : '100-180 字';

    return [
      instruction,
      '要求：',
      '1. 輸出語言：必須嚴格使用繁體中文輸出。',
      `2. 輸出 ${wordLimit} 純文字。`,
      '3. 保持客觀、高資訊密度，富有思考質感，不要寒暄。',
      '4. 完全基於提供的正文知識庫，不編造任何虛假資訊。',
      '5. 輸出單一連貫段落的純文字，不使用 Markdown 列表或標題。',
      '',
      `標題：${input.title}`,
      `連結：${input.url}`,
      `作者手記：${input.summary || '無'}`,
      `正文知識庫：\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'fr') {
    const typeMapFr: Record<string, string> = {
      point:
        level === 'high'
          ? `Du point de vue d'un architecte système principal, analysez l'article "${input.title}" et extrayez les 2-3 arguments d'architecture et décisions techniques les plus critiques, en expliquant leurs compromis.`
          : `Extrayez avec précision les 2-3 arguments techniques et conclusions d'architecture essentiels de "${input.title}".`,
      audience:
        level === 'high'
          ? `Analysez le profil technique ciblé et expliquez comment cet article fait évoluer leur perspective ou résout des défis critiques d'ingénierie.`
          : `Analysez qui bénéficiera le plus de la lecture de "${input.title}" et quels défis concrets cela résout.`,
      quick:
        `Fournissez un aperçu rapide de 30 secondes en exactement trois phrases fluides : 1. Contexte & problème ; 2. Solution technique ; 3. Résultats & leçons durables.`,
      insight:
        level === 'high'
          ? `Extrayez les enseignements pratiques majeurs, les pièges à éviter et les perspectives d'architecture pour des systèmes réels.`
          : `Résumez les leçons pratiques clés et recommandations d'ingénierie issues de "${input.title}".`,
      intro:
        `Générez une présentation soignée de l'auteur Shijianus : développeur logiciel généraliste, étudiant et auteur engagé dans les systèmes personnels centrés sur le contenu et la structure.`,
      related_reason:
        `Expliquez pourquoi les lectures complémentaires recommandées (${relatedListStr || 'sujets techniques associés'}) offrent une continuité technique précieuse avec "${input.title}".`,
    };

    const instruction = typeMapFr[input.questionType] || `Veuillez résumer et extraire les points clés pour "${input.title}".`;
    const wordLimit = level === 'high' ? '110-180 mots' : level === 'medium' ? '90-140 mots' : '80-120 mots';

    return [
      instruction,
      'Exigences :',
      '- Langue de sortie : STRICTEMENT rédigé en français naturel et professionnel.',
      `- Longueur : ${wordLimit} de texte brut continu.`,
      '- Objectif, dense, sans salutations, sans listes Markdown ni titres.',
      '- Strictement basé sur le contexte fourni.',
      '',
      `Titre : ${input.title}`,
      `URL : ${input.url}`,
      `Note de l'auteur : ${input.summary || 'Aucune'}`,
      `Base de connaissances :\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'es') {
    const typeMapEs: Record<string, string> = {
      point:
        level === 'high'
          ? `Desde la perspectiva de un arquitecto principal de sistemas, analiza "${input.title}" y extrae los 2-3 argumentos de arquitectura y decisiones técnicas más críticos, explicando sus compromisos.`
          : `Extrae con precisión los 2-3 argumentos técnicos y conclusiones de arquitectura más esenciales de "${input.title}".`,
      audience:
        level === 'high'
          ? `Analiza el perfil de ingeniería objetivo y explica cómo este artículo transforma su perspectiva técnica o resuelve desafíos críticos de ingeniería.`
          : `Analiza quién se beneficiará más de la lectura de "${input.title}" y qué problemas concretos de ingeniería resuelve.`,
      quick:
        `Proporciona una descripción general rápida de 30 segundos en exactamente tres oraciones: 1. Contexto y problema central; 2. Implementación técnica; 3. Resultados y conclusiones duraderas.`,
      insight:
        level === 'high'
          ? `Extrae las lecciones prácticas más valiosas, errores a evitar y principios de arquitectura para la evolución de sistemas reales.`
          : `Resume las lecciones prácticas clave y recomendaciones de ingeniería derivadas de "${input.title}".`,
      intro:
        `Genera una presentación detallada del autor Shijianus: creador de software generalista, estudiante y escritor enfocado en sistemas personales guiados por el contenido y la arquitectura.`,
      related_reason:
        `Explica por qué las lecturas complementarias recomendadas (${relatedListStr || 'temas técnicos relacionados'}) aportan continuidad y valor técnico respecto a "${input.title}".`,
    };

    const instruction = typeMapEs[input.questionType] || `Por favor resume y extrae las ideas clave para "${input.title}".`;
    const wordLimit = level === 'high' ? '110-180 palabras' : level === 'medium' ? '90-140 palabras' : '80-120 palabras';

    return [
      instruction,
      'Requisitos:',
      '- Idioma de salida: ESTRICTAMENTE redactado en español natural y profesional.',
      `- Longitud: ${wordLimit} de texto plano y fluido.`,
      '- Objetivo, denso en información, sin saludos, sin listas Markdown ni títulos.',
      '- Estrictamente basado en el contexto proporcionado.',
      '',
      `Título: ${input.title}`,
      `URL: ${input.url}`,
      `Nota del autor: ${input.summary || 'Ninguna'}`,
      `Base de conocimiento:\n${input.content}`,
    ].join('\n');
  }

  if (lang === 'de') {
    const typeMapDe: Record<string, string> = {
      point:
        level === 'high'
          ? `Analysieren Sie aus der Perspektive eines leitenden Systemarchitekten "${input.title}" und arbeiten Sie die 2-3 wichtigsten Architekturargumente und technischen Entscheidungen samt Vor- und Nachteilen heraus.`
          : `Extrahieren Sie präzise die 2-3 wesentlichsten technischen Argumente und Architekturschlüsse aus "${input.title}".`,
      audience:
        level === 'high'
          ? `Analysieren Sie die technische Zielgruppe und erläutern Sie, wie dieser Beitrag ihre Denkweise schärft oder zentrale Engineering-Herausforderungen löst.`
          : `Analysieren Sie, wer am meisten von der Lektüre von "${input.title}" profitiert und welche konkreten technischen Herausforderungen gelöst werden.`,
      quick:
        `Liefern Sie einen kompakten 30-Sekunden-Überblick in genau drei Sätzen: 1. Hintergrund & Problem; 2. Technische Lösung; 3. Resultate & dauerhafte Erkenntnisse.`,
      insight:
        level === 'high'
          ? `Fassen Sie die wertvollsten Praxis-Erkenntnisse, Fallstricke und Architekturrichtlinien für reale Softwaresysteme zusammen.`
          : `Fassen Sie die wichtigsten praktischen Erkenntnisse und Architekturempfehlungen aus "${input.title}" zusammen.`,
      intro:
        `Erstellen Sie ein aussagekräftiges Autorenprofil für Shijianus: vielseitiger Softwareentwickler, Student und Autor mit Fokus auf content-first und strukturorientierte persönliche Systeme.`,
      related_reason:
        `Erläutern Sie, warum die empfohlenen Folgeartikel (${relatedListStr || 'verwandte Fachthemen'}) eine wertvolle thematische Ergänzung zu "${input.title}" bieten.`,
    };

    const instruction = typeMapDe[input.questionType] || `Bitte fassen Sie die Kernaussagen für "${input.title}" zusammen.`;
    const wordLimit = level === 'high' ? '110-180 Wörter' : level === 'medium' ? '90-140 Wörter' : '80-120 Wörter';

    return [
      instruction,
      'Anforderungen:',
      '- Ausgabesprache: STRENG in natürlichem, professionellem Deutsch verfasst.',
      `- Länge: ${wordLimit} Fließtext.`,
      '- Sachlich, hohe Informationsdichte, keine Begrüßung, keine Markdown-Listen oder Überschriften.',
      '- Streng basierend auf dem bereitgestellten Kontext.',
      '',
      `Titel: ${input.title}`,
      `URL: ${input.url}`,
      `Autorennotiz: ${input.summary || 'Keine'}`,
      `Wissensbasis:\n${input.content}`,
    ].join('\n');
  }

  // 默认 zh-CN
  const typeMap: Record<string, string> = {
    point:
      level === 'high'
        ? '请以资深架构师视角，纵观全文知识库，深度提炼本文最硬核的 2-3 个核心架构论点与技术决断，阐明其立论依据与取舍。'
        : '请准确提炼出本文最核心的 2-3 个论点与关键技术结论，用一段连贯通顺的话进行总结。',
    audience:
      level === 'high'
        ? '请深度剖析本文针对的工程师与架构师受众画像，阐述阅读本文能如何重构读者的技术认知、解决关键工程难点或拓宽认知边界。'
        : '请分析这篇文章适合哪些背景的读者（如前端、架构、全栈或技术写作者），以及能帮助他们解决什么具体问题。',
    quick:
      '请用最精炼的 3 句话进行 30 秒极速概览（背景痛点、核心方案、最终收益），让读者在最短时间内掌握关键价值。',
    insight:
      level === 'high'
        ? '请基于全文知识库深度提炼技术人在真实系统设计、架构演进与长期主义构建中的核心避坑经验与工程认知升级启示。'
        : '请总结阅读本文后能获得的最关键实践启示、架构思考或避坑建议。',
    intro:
      '请为博主 Shijianus（时鉴）生成一份详尽、立体且富有极客工匠精神的作者介绍，涵盖其通才型软件构建者、学生与长期写作者的定位，强调“内容优先、结构优先、体验洁癖”与系统级构建哲学。',
    related_reason:
      `请结合本文核心主题，深度剖析为什么推荐以下延伸阅读文章（${relatedListStr || '相关技术主题'}），说明其技术脉络递进与互补价值。`,
  };

  const instruction = typeMap[input.questionType] || '请针对这篇博客文章进行提炼与总结。';
  const wordLimit = level === 'high' ? '150-240 字' : level === 'medium' ? '130-200 字' : '100-180 字';

  return [
    instruction,
    '要求：',
    `1. 输出 ${wordLimit} 纯文本。`,
    '2. 保持客观、高信息密度，富有思考质感，不要寒暄。',
    '3. 完全基于提供的正文知识库，不编造任何虚假信息。',
    '4. 输出单一连贯段落的纯文本，不使用 Markdown 列表或标题。',
    '',
    `标题：${input.title}`,
    `链接：${input.url}`,
    `作者手记：${input.summary || '无'}`,
    `正文知识库：\n${input.content}`,
  ].join('\n');
}

