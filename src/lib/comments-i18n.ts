import type { LocaleVariant } from './user-persona.ts';

export interface CommentTranslations {
  // Title & Sort
  publicComments: string;
  sortNew: string;
  sortHot: string;
  loadingComments: string;
  pinnedBadge: string;
  bloggerBadge: string;
  visitorBadge: string;

  // Actions group
  likeAria: string;
  likeTitleEmpty: string;
  likeTitleWithCount: (entriesStr: string) => string;
  reactionPickerTitle: string;
  replyCommentAria: string;
  replyCommentTitle: string;
  replyToUserAria: (author: string) => string;
  replyToUserTitle: (author: string) => string;
  boostActionAria: string;
  boostActionTitle: string;
  quoteActionAria: string;
  quoteActionTitle: string;
  editActionAria: string;
  editActionTitle: string;
  deleteActionAria: string;
  deleteActionTitle: string;
  expandText: string;
  collapseText: string;

  // Accordion
  viewReplies: (count: number) => string;
  collapseReplies: (count: number) => string;

  // Main input & Preview
  mainPlaceholder: (postTitle: string) => string;
  previewBadge: string;
  previewEmpty: string;
  cancelBtn: string;
  sendBtn: string;
  sendingBtn: string;
  replyBtn: string;

  // Nested reply box
  boostModeBadge: string;
  boostToggleNormal: string;
  boostToggleNormalTitle: string;
  normalReplyTo: (author: string) => string;
  normalToggleBoost: string;
  normalToggleBoostTitle: string;
  boostPlaceholder: (author: string) => string;
  normalPlaceholder: (author: string) => string;

  // Toolbar
  toolbarBold: string;
  toolbarItalic: string;
  toolbarHeading: string;
  toolbarQuote: string;
  toolbarCode: string;
  toolbarList: string;
  toolbarDirection: string;
  toolbarDirectionToast: (dir: string) => string;
  toolbarEmoji: string;
  toolbarEmojiTitle: string;
  toolbarImage: string;
  toolbarImageAria: string;
  toolbarOptions: string;
  toolbarOptionsAria: string;
  toolbarOptionsTitle: string;
  toolbarBoldPlaceholder: string;
  toolbarItalicPlaceholder: string;
  toolbarHeadingPlaceholder: string;
  toolbarQuotePlaceholder: string;
  toolbarListPlaceholder: string;

  // 15 Dropdown options (label & description)
  optQuoteLabel: string;
  optQuoteDesc: string;
  optTableLabel: string;
  optTableDesc: string;
  optTocLabel: string;
  optTocDesc: string;
  optDetailsLabel: string;
  optDetailsDesc: string;
  optSpoilerLabel: string;
  optSpoilerDesc: string;
  optMathLabel: string;
  optMathDesc: string;
  optScrollLabel: string;
  optScrollDesc: string;
  optCalloutLabel: string;
  optCalloutDesc: string;
  optMermaidLabel: string;
  optMermaidDesc: string;
  optChartLabel: string;
  optChartDesc: string;
  optGraphvizLabel: string;
  optGraphvizDesc: string;
  optDatetimeLabel: string;
  optDatetimeDesc: string;
  optTemplateLabel: string;
  optTemplateDesc: string;
  optFootnoteLabel: string;
  optFootnoteDesc: string;
  optPollLabel: string;
  optPollDesc: string;
  optImageLabel: string;
  optImageDesc: string;

  // Modal common & titles
  modalInsert: string;
  modalConfirm: string;
  modalCancel: string;
  modalClose: string;
  modalTableTitle: string;
  modalTocTitle: string;
  modalDetailsTitle: string;
  modalSpoilerTitle: string;
  modalMathTitle: string;
  modalScrollTitle: string;
  modalCalloutTitle: string;
  modalMermaidTitle: string;
  modalChartTitle: string;
  modalGraphvizTitle: string;
  modalDatetimeTitle: string;
  modalTemplateTitle: string;
  modalFootnoteTitle: string;
  modalPollTitle: string;
  modalImageTitle: string;
  modalConfirmDelete: string;
  modalAddOption: string;
  modalDeleteOption: string;
  modalPollTypeRegular: string;
  modalPollTypeMultiple: string;
  modalOptionPlaceholder: (index: number) => string;
  modalColumnPlaceholder: (index: number) => string;
  modalColumnDefaultTitle: (index: number) => string;
  modalTableDataSample: (row: number, col: number) => string;

  // 1. Poll Modal
  pollRuleTitle: string;
  pollRuleText: string;
  pollQuestionLabel: string;
  pollQuestionPlaceholder: string;
  pollOptionsLabel: string;
  pollMechanismLabel: string;
  pollDefaultOpt1: string;
  pollDefaultOpt2: string;
  pollTopicPrefix: string;

  // 2. Table Modal
  tableRuleTitle: string;
  tableRuleText: string;
  tableRowsLabel: string;
  tableColsLabel: string;
  tableCustomHeadersLabel: string;
  tablePreviewLabel: string;

  // 3. TOC Modal
  tocRuleTitle: string;
  tocRuleText: string;
  tocSkeletonLabel: string;
  tocIncludeHeadersCheckbox: string;
  tocPreviewLabel: string;
  tocSampleText: string;

  // 4. Mermaid Modal
  mermaidRuleTitle: string;
  mermaidRuleText: string;
  mermaidTypeLabel: string;
  mermaidTypeFlowchart: string;
  mermaidTypeSequence: string;
  mermaidTypeGantt: string;
  mermaidTypeClass: string;
  mermaidTypePie: string;
  mermaidTypeState: string;
  mermaidCodeLabel: string;
  mermaidCodePlaceholder: string;

  // 5. Chart Modal
  chartRuleTitle: string;
  chartRuleText: string;
  chartPresetLabel: string;
  chartTypeBar: string;
  chartTypeLine: string;
  chartTypePie: string;
  chartConfigLabel: string;
  chartConfigPlaceholder: string;

  // 6. Graphviz Modal
  graphvizRuleTitle: string;
  graphvizRuleText: string;
  graphvizCategoryLabel: string;
  graphvizDigraph: string;
  graphvizGraph: string;
  graphvizCodeLabel: string;
  graphvizCodePlaceholder: string;

  // 7. Details Modal
  detailsRuleTitle: string;
  detailsRuleText: string;
  detailsSummaryLabel: string;
  detailsSummaryPlaceholder: string;
  detailsContentLabel: string;
  detailsContentPlaceholder: string;
  detailsDefaultSummary: string;
  detailsDefaultContent: string;

  // 8. Spoiler Modal
  spoilerRuleTitle: string;
  spoilerRuleText: string;
  spoilerTextLabel: string;
  spoilerTextPlaceholder: string;
  spoilerDefaultText: string;

  // 9. Math Modal
  mathRuleTitle: string;
  mathRuleText: string;
  mathFormulaLabel: string;
  mathFormulaPlaceholder: string;
  mathQuickTemplatesLabel: string;
  mathFraction: string;
  mathSqrt: string;
  mathSum: string;
  mathIntegral: string;
  mathLimit: string;
  mathMatrix: string;

  // 10. Scroll Modal
  scrollRuleTitle: string;
  scrollRuleText: string;
  scrollMaxHeightLabel: string;
  scrollContentLabel: string;
  scrollContentPlaceholder: string;
  scrollDefaultContent: string;

  // 11. Datetime Modal
  datetimeRuleTitle: string;
  datetimeRuleText: string;
  datetimeQuickLabel: string;
  datetimeFull: string;
  datetimeDate: string;
  datetimeValueLabel: string;
  datetimeValuePlaceholder: string;

  // 12. Template Modal
  templateRuleTitle: string;
  templateRuleText: string;
  templateScenarioLabel: string;
  templateTech: string;
  templateBug: string;
  templateOpinion: string;
  templatePreviewLabel: string;
  templateTechSample: string;
  templateBugSample: string;
  templateOpinionSample: string;

  // 13. Footnote Modal
  footnoteRuleTitle: string;
  footnoteRuleText: string;
  footnoteIdLabel: string;
  footnoteIdPlaceholder: string;
  footnoteContentLabel: string;
  footnoteContentPlaceholder: string;
  footnoteDefaultContent: string;

  // 14. Callout Modal
  calloutRuleTitle: string;
  calloutRuleText: string;
  calloutStyleLabel: string;
  calloutTitleLabel: string;
  calloutTitlePlaceholder: string;
  calloutContentLabel: string;
  calloutContentPlaceholder: string;
  calloutDefaultContent: string;

  // 15. Image Upload & Host Modal
  imageRuleTitle: string;
  imageRuleText: string;
  imageTabUpload: string;
  imageTabGuide: string;
  imageTabUrl: string;
  imagePreviewAlt: string;
  imageStatusUploaded: string;
  imageReselectBtn: string;
  imageRemoveBtn: string;
  imageLoadingTitle: string;
  imageLoadingDesc: string;
  imageDropzonePrimary: string;
  imageDropzoneOrDrag: string;
  imageDropzoneHint: string;
  imageAltLabel: string;
  imageAltPlaceholder: string;
  imageGuide1Badge: string;
  imageGuide1Title: string;
  imageGuide1Desc: string;
  imageGuide1Result: string;
  imageGuide2Badge: string;
  imageGuide2Title: string;
  imageGuide2Desc: string;
  imageGuide3Badge: string;
  imageGuide3Title: string;
  imageGuide3Desc: string;
  imageGuide3Sample: string;
  imageUrlLabel: string;
  imageUrlPlaceholder: string;
  imageUrlAltPlaceholder: string;
  imageExternalPreviewLabel: string;
  imageExternalPreviewAlt: string;
  imageDefaultAlt: string;
  uploadErrorType: string;
  uploadErrorSize: string;
  uploadErrorFailed: string;
  uploadErrorNetwork: string;

  // Quotes & Article Reference
  quoteFromArticle: (articleTitle: string) => string;
  quoteEmptyPlaceholder: string;
  toastQuoteSelection: string;
  toastQuoteTip: string;

  // All Toasts
  toastUploadingImage: string;
  toastUploadFailed: (err: string) => string;
  toastUploadSuccess: string;
  toastClipboardDetected: string;
  toastClipboardSuccess: string;
  toastDragUploading: (name: string) => string;
  toastDragSuccess: (name: string) => string;
  toastUploadError: (err: string) => string;
  toastInsertedPoll: string;
  toastInsertedTable: string;
  toastInsertedDetails: string;
  toastInsertedSpoiler: string;
  toastInsertedMath: string;
  toastInsertedScroll: string;
  toastInsertedCallout: string;
  toastInsertedToc: string;
  toastInsertedMermaid: string;
  toastInsertedChart: string;
  toastInsertedGraphviz: string;
  toastInsertedDatetime: string;
  toastInsertedTemplate: string;
  toastInsertedFootnote: string;
  toastImageMissing: string;
  toastInsertedImage: string;
  toastQuotedSelection: string;
  toastCommentEmpty: string;
  toastCommentLimit: (limit: number) => string;
  toastCommentSuccess: string;
  toastCommentFailed: (err: string) => string;
  toastCommentNetworkError: string;
  toastBoostLimit: (limit: number) => string;
  toastReplyBoostSuccess: string;
  toastReplySuccess: string;
  toastReplyFailed: (err: string) => string;
  toastReplyNetworkError: string;
  toastEditEmpty: string;
  toastEditSuccess: string;
  toastEditFailed: (err: string) => string;
  toastEditNetworkError: string;
  toastDeleteSuccess: string;
  toastDeleteFailed: (err: string) => string;
  toastDeleteNetworkError: string;
  toastVisitorLikeForbidden: string;
  toastLikeFailed: (err: string) => string;
  toastLikeNetworkError: string;

  // Geo badge & Identity & Tabs
  geoRegionPrefix: string;
  geoRealIpPrefix: string;
  geoAdminPrivilege: string;
  headingComments: string;
  policyLabel: string;
  policyTitle: string;
  loginAsGuest: string;
  loginDrawerTitle: string;
  tabEdit: string;
  tabPreview: string;
  avatarGuestTitle: string;
  avatarUserTitle: (name: string, role: string) => string;
  quoteBannerPrefix: (author: string) => string;
  toolbarAria: string;
  toolbarLangTitle: string;
  toolbarLangAria: string;
  toolbarLangMenuTitle: string;
  toolbarLangItemDesc: (code: string) => string;
  toastLangInserted: (label: string) => string;
  editedBadge: string;
  saveBtn: string;
  savingBtn: string;
  emptyComments: string;
}

export const COMMENTS_I18N: Record<LocaleVariant, CommentTranslations> = {

  'zh-CN': {
    headingComments: '评论',
    policyLabel: '隐私政策',
    policyTitle: '阅读站点使用协议与隐私政策',
    loginAsGuest: '访客身份 (点击登录)',
    loginDrawerTitle: '前往账号中心登录或设置个性化资料',
    tabEdit: '编辑',
    tabPreview: '预览',
    avatarGuestTitle: '访客身份 (点击登录账号/设置专属头像)',
    avatarUserTitle: (name, role) => `当前身份: ${name} (${role === 'admin' ? '博主' : '读者'})`,
    quoteBannerPrefix: (author) => `🔗 引用 @${author} 的评论：`,
    toolbarAria: 'Markdown 编辑工具栏',
    toolbarLangTitle: '贴文语言：选择并插入指定语种区块',
    toolbarLangAria: '贴文语言选择',
    toolbarLangMenuTitle: '选择贴文语言',
    toolbarLangItemDesc: (code) => `设置该区块为 ${code} 语种`,
    toastLangInserted: (label) => `已插入 ${label} 语言区块`,
    optImageLabel: '插入图片 / Telegram 图床',
    optImageDesc: '本地上传、Ctrl+V 粘贴与拖拽上传托管',
    editedBadge: '已编辑',
    saveBtn: '保存',
    savingBtn: '保存中...',
    emptyComments: '还没有公开评论，留下第一条反馈后，评论会直接出现在下方的公开评论流中。',
    publicComments: '公开评论',
    sortNew: '⏱️ 最新',
    sortHot: '🔥 最热',
    loadingComments: '正在加载评论...',
    pinnedBadge: '置顶',
    bloggerBadge: '博主',
    visitorBadge: '访客',

    likeAria: '点赞或长按互动',
    likeTitleEmpty: '点赞 (长按可选择更多表情)',
    likeTitleWithCount: (entriesStr) => `互动详情: ${entriesStr} (长按可切换表情)`,
    reactionPickerTitle: '选择表达表情：',
    replyCommentAria: '回复此评论',
    replyCommentTitle: '回复此评论',
    replyToUserAria: (author) => `回复 @${author}`,
    replyToUserTitle: (author) => `回复 @${author}`,
    boostActionAria: '发送 16 字以内的火箭 Boost 快速回复',
    boostActionTitle: '发送 16 字以内的火箭 Boost 快速回复',
    quoteActionAria: '引用此条内容发表评论',
    quoteActionTitle: '引用此条内容发表评论',
    editActionAria: '编辑此条评论',
    editActionTitle: '编辑此条评论',
    deleteActionAria: '删除此条评论',
    deleteActionTitle: '删除此条评论',
    expandText: '...展开全文',
    collapseText: '收起',

    viewReplies: (count) => `查看 ${count} 条回复`,
    collapseReplies: (count) => `收起 ${count} 条回复`,

    mainPlaceholder: (postTitle) => `围绕《${postTitle}》发表公开评论... (支持 Markdown 排版、图片快捷粘贴与拖拽上传)`,
    previewBadge: '最终渲染预览',
    previewEmpty: '暂无评论内容可预览，请在“编辑”模式下输入 Markdown 文本。',
    cancelBtn: '取消',
    sendBtn: '发送',
    sendingBtn: '发送中...',
    replyBtn: '回复',

    boostModeBadge: '火箭 Boost 回复模式 (≤16字)',
    boostToggleNormal: '切换为普通回复',
    boostToggleNormalTitle: '切换回普通 500 字回复',
    normalReplyTo: (author) => `回复 @${author}`,
    normalToggleBoost: '切换为 Boost (≤16字)',
    normalToggleBoostTitle: '切换为火箭 Boost 模式 (≤16字)',
    boostPlaceholder: (author) => `对 @${author} 进行 16 字以内的火箭快速表态...`,
    normalPlaceholder: (author) => `回复 @${author}... (支持 Markdown 排版与图片粘贴)`,

    toolbarBold: '粗体 (Ctrl+B)',
    toolbarItalic: '斜体 (Ctrl+I)',
    toolbarHeading: '标题 (H3)',
    toolbarQuote: '引用 (Ctrl+Q)',
    toolbarCode: '代码块 (Ctrl+K)',
    toolbarList: '无序列表 (Ctrl+L)',
    toolbarDirection: '切换书写方向 (LTR / RTL)',
    toolbarDirectionToast: (dir) => `已切换书写方向为：${dir.toUpperCase()}`,
    toolbarEmoji: '插入常用表情',
    toolbarEmojiTitle: '快捷表情选择',
    toolbarImage: '插入图片 / Telegram 图床',
    toolbarImageAria: '打开图片插入与上传窗口',
    toolbarOptions: '插入高级排版组件',
    toolbarOptionsAria: '打开高级组件与排版菜单',
    toolbarOptionsTitle: '高级 Markdown 拓展',
    toolbarBoldPlaceholder: '粗体文字',
    toolbarItalicPlaceholder: '斜体文字',
    toolbarHeadingPlaceholder: '标题内容',
    toolbarQuotePlaceholder: '引用文本内容',
    toolbarListPlaceholder: '列表项清单',

    optQuoteLabel: '引用博文',
    optQuoteDesc: '引用当前文章选中文段或核心观点',
    optTableLabel: '插入表格',
    optTableDesc: '可视化配置多行多列表格并自动生成 Markdown 网格',
    optTocLabel: '插入目录',
    optTocDesc: '自动提取评论中的标题结构并生成跳转目录',
    optDetailsLabel: '折叠区块',
    optDetailsDesc: '插入原生 HTML5 details 可折叠摘要区块',
    optSpoilerLabel: '模糊剧透',
    optSpoilerDesc: '插入悬浮展示的防剧透高斯模糊文字',
    optMathLabel: '数学公式',
    optMathDesc: '基于 KaTeX 的标准行内与块级数学公式',
    optScrollLabel: '滚动容器',
    optScrollDesc: '创建定高可内部滚动的长文本/日志容器',
    optCalloutLabel: '高光卡片',
    optCalloutDesc: '高光提示信息块 (Note / Tip / Warning / Danger)',
    optMermaidLabel: 'Mermaid 拓扑图',
    optMermaidDesc: '绘制流程图、时序图、甘特图等矢量结构图',
    optChartLabel: 'Build Chart 数据图表',
    optChartDesc: '基于标准 JSON 数据渲染柱状图、折线图与饼图',
    optGraphvizLabel: 'Graphviz 关系图',
    optGraphvizDesc: '通过 DOT 描述语言绘制状态机与拓扑链路',
    optDatetimeLabel: '日期时间',
    optDatetimeDesc: '插入标准格式化时间戳并提供实时倒计时',
    optTemplateLabel: '论述范本',
    optTemplateDesc: '快速应用深度技术研讨、异常排查与观点交流模板',
    optFootnoteLabel: '添加脚注',
    optFootnoteDesc: '为长篇评论论据添加文末参考引文与出处标记',
    optPollLabel: '互动投票',
    optPollDesc: '发起单选或多选读者互动调研投票',

    modalInsert: '插入',
    modalConfirm: '确认插入',
    modalCancel: '取消',
    modalClose: '关闭窗口',
    modalTableTitle: '插入 Markdown 数据表格',
    modalTocTitle: '插入评论树形目录 [TOC]',
    modalDetailsTitle: '插入折叠隐藏区块 (Details)',
    modalSpoilerTitle: '插入模糊防剧透内容 (Spoiler)',
    modalMathTitle: '插入 LaTeX 数学公式',
    modalScrollTitle: '插入定高滚动容器',
    modalCalloutTitle: '插入高光包装卡片 (Callout)',
    modalMermaidTitle: '插入 Mermaid 矢量结构图',
    modalChartTitle: '插入 Build Chart 数据图表',
    modalGraphvizTitle: '插入 Graphviz DOT 拓扑图',
    modalDatetimeTitle: '插入格式化日期时间标记',
    modalTemplateTitle: '应用结构化论述范本',
    modalFootnoteTitle: '添加参考脚注出处',
    modalPollTitle: '发起读者互动投票',
    modalImageTitle: '插入图片 / Telegram 图床',
    modalConfirmDelete: '确定要删除这条内容吗？',
    modalAddOption: '添加选项',
    modalDeleteOption: '删除此项',
    modalPollTypeRegular: '单选投票 (Regular)',
    modalPollTypeMultiple: '多选投票 (Multiple)',
    modalOptionPlaceholder: (i) => `选项 ${i}`,
    modalColumnPlaceholder: (i) => `第 ${i} 列标题`,
    modalColumnDefaultTitle: (i) => `标题 ${i}`,
    modalTableDataSample: (r, c) => `数据 ${r}-${c}`,

    // 1. Poll
    pollRuleTitle: '互动投票机制与发布规则',
    pollRuleText: '采用标准 [poll type=...] 语法。支持单选或多选机制，发布后系统将渲染交互式投票选项。',
    pollQuestionLabel: '投票主题 / 问题：',
    pollQuestionPlaceholder: '输入投票主题，例如：你如何看待这一技术方案？',
    pollOptionsLabel: '投票选项：',
    pollMechanismLabel: '投票机制：',
    pollDefaultOpt1: '非常认同',
    pollDefaultOpt2: '有待探讨',
    pollTopicPrefix: '投票主题：',

    // 2. Table
    tableRuleTitle: 'GFM 管道表格发布规则',
    tableRuleText: '采用标准 GitHub 表格语法（| 表头 | 与 | --- |）。在下方设定行列数及标题后，系统将自动生成规范网格，插入后可直接在编辑器中修改各单元格数据。',
    tableRowsLabel: '数据行数 (Rows)：',
    tableColsLabel: '数据列数 (Cols)：',
    tableCustomHeadersLabel: '自定义各列标题：',
    tablePreviewLabel: '生成的表格结构实时预览：',

    // 3. TOC
    tocRuleTitle: '目录导航自动提取机制与发布规则',
    tocRuleText: '采用标准 [TOC] 语法标签。评论系统在渲染时，将自动抓取该条评论正文中的所有 Markdown 标题（# 一级、## 二级、### 三级）并构建为具备平滑锚点跳转的树形导航。',
    tocSkeletonLabel: '结构骨架选项：',
    tocIncludeHeadersCheckbox: '附带示例小节分段标题（推荐勾选，一键生成规范章节结构）',
    tocPreviewLabel: '将插入的代码预览：',
    tocSampleText: `[TOC]\n\n### 一、 背景与架构目标\n在此输入第一小节的核心论点...\n\n### 二、 核心技术实现细节\n在此输入第二小节的详细分析...\n\n### 三、 总结建议与展望\n在此输入总结结论...`,

    // 4. Mermaid
    mermaidRuleTitle: 'Mermaid 图表矢量渲染与发布规则',
    mermaidRuleText: '使用 ```mermaid ... ``` 代码块包裹。系统在前端自动将其编译为高质量矢量 SVG 拓扑图。可点击下方按钮切换预设类型并按需修改代码。',
    mermaidTypeLabel: '选择图表类型模版：',
    mermaidTypeFlowchart: '流程图 (Flowchart)',
    mermaidTypeSequence: '时序图 (Sequence)',
    mermaidTypeGantt: '甘特图 (Gantt)',
    mermaidTypeClass: '类图 (Class)',
    mermaidTypePie: '饼图 (Pie)',
    mermaidTypeState: '状态图 (State)',
    mermaidCodeLabel: '图表代码编辑 (可直接调整节点与文字)：',
    mermaidCodePlaceholder: '输入符合 Mermaid 语法的图表代码...',

    // 5. Chart
    chartRuleTitle: 'Build Chart 数据图表发布规则',
    chartRuleText: '使用 ```chart ... ``` 代码块包裹标准 JSON 配置。支持 bar（柱状图）、line（折线图）与 pie（饼图）。',
    chartPresetLabel: '图表样式预设：',
    chartTypeBar: '柱状图 (Bar)',
    chartTypeLine: '折线图 (Line)',
    chartTypePie: '饼图 (Pie)',
    chartConfigLabel: 'JSON 图表配置：',
    chartConfigPlaceholder: '输入标准 JSON 图表数据...',

    // 6. Graphviz
    graphvizRuleTitle: 'Graphviz 拓扑图发布规则',
    graphvizRuleText: '采用 ```graphviz ... ``` 代码块，基于 DOT 描述语言。适合展示微服务架构关系、调用链路与状态转移。',
    graphvizCategoryLabel: '拓扑图类别：',
    graphvizDigraph: '有向图 (Digraph - 带箭头)',
    graphvizGraph: '无向图 (Graph - 关联群)',
    graphvizCodeLabel: 'DOT 语法代码：',
    graphvizCodePlaceholder: '输入 DOT 拓扑语法代码...',

    // 7. Details
    detailsRuleTitle: '折叠隐藏区块发布规则',
    detailsRuleText: '采用原生 HTML5 <details> 与 <summary> 标签。用于收拢大段报错日志、长排查步骤或补充资料，保持评论流清爽。',
    detailsSummaryLabel: '折叠摘要 (标题)：',
    detailsSummaryPlaceholder: '例如：点击展开详细报错日志 / 排查细节',
    detailsContentLabel: '折叠展开内容：',
    detailsContentPlaceholder: '在此处输入默认被隐藏的详细文本、数据或排查日志...',
    detailsDefaultSummary: '点击展开详细内容',
    detailsDefaultContent: '在此输入折叠区块详细内容...',

    // 8. Spoiler
    spoilerRuleTitle: '模糊化剧透发布规则',
    spoilerRuleText: '采用 [spoiler]内容[/spoiler] 语法。内容在评论区中默认以高斯模糊显示，读者将光标悬停在其上方即可清晰查看，避免非预期剧透。',
    spoilerTextLabel: '剧透打码文本：',
    spoilerTextPlaceholder: '输入需要打码模糊的内容，鼠标悬浮时才会清晰可见...',
    spoilerDefaultText: '剧透内容',

    // 9. Math
    mathRuleTitle: 'LaTeX 数学公式发布规则',
    mathRuleText: '采用 KaTeX 标准 $$ 公式 $$ 块级语法。系统在前端自动渲染为高品质数学公式，支持微积分、分式、矩阵与求和等学术符号。',
    mathFormulaLabel: 'LaTeX 数学表达式：',
    mathFormulaPlaceholder: '例如：\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    mathQuickTemplatesLabel: '快捷常用模板：',
    mathFraction: '分式 a/b',
    mathSqrt: '平方根 √x',
    mathSum: '求和 ∑',
    mathIntegral: '定积分 ∫',
    mathLimit: '极限 lim',
    mathMatrix: '矩阵',

    // 10. Scroll
    scrollRuleTitle: '滚动容器发布规则',
    scrollRuleText: '采用定高与内置滚动条（overflow-y: auto）限制超长文本的高度，防止几十行代码或日志拉长整个评论流。',
    scrollMaxHeightLabel: '最大容器高度 (像素)：',
    scrollContentLabel: '长文本 / 日志内容：',
    scrollContentPlaceholder: '输入将在定高容器中带滚动条展示的超长文本...',
    scrollDefaultContent: '在此输入定高滚动的长篇日志、排查记录或大量文本...',

    // 11. Datetime
    datetimeRuleTitle: '日期时间标记发布规则',
    datetimeRuleText: '采用 [date=YYYY-MM-DD HH:mm:ss] 标签。用于在评论中标注关键排期、问题出现时间或更新节点，系统将自动高亮显示。',
    datetimeQuickLabel: '快捷时间选择：',
    datetimeFull: '当前完整时间 (精确到秒)',
    datetimeDate: '当前日期 (YYYY-MM-DD)',
    datetimeValueLabel: '时间值内容：',
    datetimeValuePlaceholder: '例如：2026-09-05 12:00:00',

    // 12. Template
    templateRuleTitle: '结构化论述范本发布规则',
    templateRuleText: '严谨的结构化评论能极大提高交流质量。选择适合当前话题的结构框架，一键插入并填入您的分析见解。',
    templateScenarioLabel: '选择范本场景：',
    templateTech: '💡 深度技术研讨 (观点/分析/建议)',
    templateBug: '⚠️ 异常/缺陷排查 (现象/环境/日志)',
    templateOpinion: '🤝 观点探讨交流 (认同/视角/请教)',
    templatePreviewLabel: '范本结构骨架预览：',
    templateTechSample: `### 💡 核心观点与设计方案\n在此简明扼要概括您的核心技术方案或核心论点...\n\n### 🔍 依据与量化分析\n1. **优势分析**：分析方案带来的性能提升或体验改善。\n2. **潜在风险**：针对边界异常或高并发下的应对策略。\n\n### 🎯 改进与落地建议\n- [ ] 建议步骤一：...\n- [ ] 建议步骤二：...\n`,
    templateBugSample: `### ⚠️ 异常现象描述\n在此详细描述出现的非预期现象或错误提示...\n\n### 🖥️ 运行环境与复现步骤\n- **环境信息**：操作系统 / 浏览器版本\n- **复现步骤**：\n  1. 访问对应页面...\n  2. 点击某个交互按钮...\n  3. 观察控制台/页面显示...\n\n### 🪵 报错日志与初步排查\n\`\`\`bash\n在此粘贴相关报错堆栈或网络请求抓包\n\`\`\`\n\n### 💡 期望的正确行为\n说明理论上应该展现的正确效果或预期返回结果。\n`,
    templateOpinionSample: `### 🤝 认同之处\n非常赞同博文中关于这一视角的论述，特别是在...方面很有启发。\n\n### 🤔 补充视角与延伸思考\n从另一个角度来看，或许可以补充考虑以下几点：\n1. ...\n2. ...\n\n### 💬 交流请教\n对于...的实现细节，博主是否有进一步的实践经验分享？\n`,

    // 13. Footnote
    footnoteRuleTitle: '参考脚注联动发布规则',
    footnoteRuleText: '采用 Markdown 标准脚注语法。将在正文光标位置插入引用标记 [^标号]，并在评论文末自动生成对应该标号的 [^标号]: 详细注释内容。',
    footnoteIdLabel: '脚注标识 (标号)：',
    footnoteIdPlaceholder: '例如：1 或 ref',
    footnoteContentLabel: '脚注详细注释与出处内容：',
    footnoteContentPlaceholder: '输入该脚注引用的文献出处、文档链接或补充说明...',
    footnoteDefaultContent: '在此输入脚注参考说明与文献出处',

    // 14. Callout
    calloutRuleTitle: '高光包装卡片发布规则',
    calloutRuleText: '采用 ::: note/tip/warning/danger 标题 语法。评论区将渲染为带有对应语义主题色、左侧重点边框和图标的高光提示卡片。',
    calloutStyleLabel: '包装卡片风格：',
    calloutTitleLabel: '卡片标题：',
    calloutTitlePlaceholder: '输入卡片高光标题...',
    calloutContentLabel: '卡片主体内容：',
    calloutContentPlaceholder: '输入卡片主体说明内容...',
    calloutDefaultContent: '在此输入高光卡片内容...',

    // 15. Image
    imageRuleTitle: '官方 Telegram 图床托管与图片插入规则',
    imageRuleText: '上传的文件将自动转存至官方 Telegram 永久图床 (img.epocanvas.com)，支持最大 10MB 的主流图片格式。在评论输入框中支持直接使用键盘 Ctrl+V / Cmd+V 快速粘贴截图，或直接拖拽图片入框。',
    imageTabUpload: '本地上传',
    imageTabGuide: '📋 粘贴与拖拽指南',
    imageTabUrl: '🔗 外部图片链接',
    imagePreviewAlt: '上传预览',
    imageStatusUploaded: '已成功转存至 Telegram CDN',
    imageReselectBtn: '重新选择',
    imageRemoveBtn: '清除',
    imageLoadingTitle: '正在持久化至 Telegram 图床通道...',
    imageLoadingDesc: '传输并解析中，请稍候',
    imageDropzonePrimary: '点击选择图片',
    imageDropzoneOrDrag: ' 或将图片拖放至此处',
    imageDropzoneHint: '支持 JPG, PNG, GIF, WebP, SVG, AVIF (单个文件最高 10MB)',
    imageAltLabel: '图片说明 / Alt (选填)：',
    imageAltPlaceholder: '例如: 界面排查截图、架构拓扑流程',
    imageGuide1Badge: '方法 1',
    imageGuide1Title: '剪贴板直接粘贴 (快捷方便)',
    imageGuide1Desc: '使用截图工具 (如 Windows Win + Shift + S 或 Mac Cmd + Shift + 4) 截图后，在评论区任意输入框内直接按 Ctrl + V (Mac 为 Cmd + V)。',
    imageGuide1Result: '自动上传并就地插入 Markdown 链接',
    imageGuide2Badge: '方法 2',
    imageGuide2Title: '直接拖拽入框 (直观高效)',
    imageGuide2Desc: '从您的文件管理器、桌面或浏览器其他标签页，直接将图片文件拖放至下方评论输入区域，系统将自动识别并上传至 Telegram。',
    imageGuide3Badge: '方法 3',
    imageGuide3Title: '标准 Markdown 语法插入',
    imageGuide3Desc: '如果您已有外部 CDN 或图片直链，可随时书写标准格式：',
    imageGuide3Sample: '![图片说明](https://...)',
    imageUrlLabel: '图片直链 URL (必须为有效链接)：',
    imageUrlPlaceholder: 'https://img.epocanvas.com/file/... 或 https://...',
    imageUrlAltPlaceholder: '输入简要图片描述...',
    imageExternalPreviewLabel: '外部预览：',
    imageExternalPreviewAlt: '预览',
    imageDefaultAlt: '图片',
    uploadErrorType: '仅支持上传图片文件 (JPG, PNG, GIF, WebP, SVG, AVIF)',
    uploadErrorSize: '图片体积超过 10MB 上限',
    uploadErrorFailed: '图片上传失败',
    uploadErrorNetwork: '图片上传异常',

    // Quotes
    quoteFromArticle: (articleTitle) => `引用自《${articleTitle}》`,
    quoteEmptyPlaceholder: '探讨文章核心逻辑与论点...',
    toastQuoteSelection: '已引用页面选中文段',
    toastQuoteTip: '💡 提示：在正文中框选文本后点击右键菜单『引用至评论区』可精准引用！',

    // All Toasts
    toastUploadingImage: '正在将图片上传至 Telegram 图床...',
    toastUploadFailed: (err) => `上传失败: ${err || '未知错误'}`,
    toastUploadSuccess: '图片上传成功并已持久化至 Telegram！',
    toastClipboardDetected: '检测到剪贴板图片，正在自动上传至 Telegram 图床...',
    toastClipboardSuccess: '剪贴板图片已成功上传并插入！',
    toastDragUploading: (name) => `正在上传拖拽图片 ${name} 至 Telegram 图床...`,
    toastDragSuccess: (name) => `拖拽图片 ${name} 上传成功！`,
    toastUploadError: (err) => `图片上传异常: ${err || '网络超时'}`,
    toastInsertedPoll: '已成功插入互动投票组件',
    toastInsertedTable: '已成功插入数据表格',
    toastInsertedDetails: '已成功插入折叠区块',
    toastInsertedSpoiler: '已成功插入剧透隐藏内容',
    toastInsertedMath: '已成功插入 LaTeX 公式',
    toastInsertedScroll: '已成功插入滚动内容容器',
    toastInsertedCallout: '已成功套用高光卡片格式',
    toastInsertedToc: '已成功插入文章目录标记',
    toastInsertedMermaid: '已成功插入 Mermaid 图表',
    toastInsertedChart: '已成功插入 Build Chart',
    toastInsertedGraphviz: '已成功插入 Graphviz 拓扑',
    toastInsertedDatetime: '已成功插入日期时间标记',
    toastInsertedTemplate: '已成功插入论述范本',
    toastInsertedFootnote: '已成功插入参考脚注',
    toastImageMissing: '请先选择并上传图片，或输入图片外部链接',
    toastInsertedImage: '已成功插入图片',
    toastQuotedSelection: '已将博文选中文段引用至评论区',
    toastCommentEmpty: '请填写评论内容',
    toastCommentLimit: (limit) => `评论内容不能超过 ${limit} 字`,
    toastCommentSuccess: '评论已成功发布！',
    toastCommentFailed: (err) => `提交失败: ${err || '请重试'}`,
    toastCommentNetworkError: '提交异常，请稍后重试',
    toastBoostLimit: (limit) => `🚀 Boost 回复不能超过 ${limit} 个字`,
    toastReplyBoostSuccess: '🚀 Boost 回复已成功发表！',
    toastReplySuccess: '回复已成功发表！',
    toastReplyFailed: (err) => `回复失败: ${err || '请重试'}`,
    toastReplyNetworkError: '回复异常，请重试',
    toastEditEmpty: '修改内容不能为空',
    toastEditSuccess: '评论修改成功！',
    toastEditFailed: (err) => `修改失败: ${err || '请重试'}`,
    toastEditNetworkError: '修改请求异常',
    toastDeleteSuccess: '内容已删除',
    toastDeleteFailed: (err) => `删除失败: ${err || '请重试'}`,
    toastDeleteNetworkError: '删除请求异常',
    toastVisitorLikeForbidden: '⚠️ 访客无点赞权限，仅注册/登录用户可点赞或进行表情互动',
    toastLikeFailed: (err) => `点赞失败: ${err || '请重试'}`,
    toastLikeNetworkError: '点赞异常，请稍后重试',

    geoRegionPrefix: '地区: ',
    geoRealIpPrefix: ' (真实IP: ',
    geoAdminPrivilege: '博主权限：显示真实IP归属地',
  },

  'zh-Hant': {
    headingComments: '評論',
    policyLabel: '隱私政策',
    policyTitle: '閱讀站點使用協議與隱私政策',
    loginAsGuest: '訪客身分 (點擊登入)',
    loginDrawerTitle: '前往帳號中心登入或設定個性化資料',
    tabEdit: '編輯',
    tabPreview: '預覽',
    avatarGuestTitle: '訪客身分 (點擊登入帳號/設定專屬頭像)',
    avatarUserTitle: (name, role) => `目前身分: ${name} (${role === 'admin' ? '博主' : '讀者'})`,
    quoteBannerPrefix: (author) => `🔗 引用 @${author} 的評論：`,
    toolbarAria: 'Markdown 編輯工具列',
    toolbarLangTitle: '貼文語言：選擇並插入指定語種區塊',
    toolbarLangAria: '貼文語言選擇',
    toolbarLangMenuTitle: '選擇貼文語言',
    toolbarLangItemDesc: (code) => `設定該區塊為 ${code} 語種`,
    toastLangInserted: (label) => `已插入 ${label} 語言區塊`,
    optImageLabel: '插入圖片 / Telegram 圖床',
    optImageDesc: '本機上傳、Ctrl+V 貼上與拖曳上傳代管',
    editedBadge: '已編輯',
    saveBtn: '儲存',
    savingBtn: '儲存中...',
    emptyComments: '還沒有公開評論，留下第一條反饋後，評論會直接出現在下方的公開評論流中。',
    publicComments: '公開評論',
    sortNew: '⏱️ 最新',
    sortHot: '🔥 最熱',
    loadingComments: '正在載入評論...',
    pinnedBadge: '置頂',
    bloggerBadge: '博主',
    visitorBadge: '訪客',

    likeAria: '按讚或長按互動',
    likeTitleEmpty: '按讚 (長按可選擇更多表情)',
    likeTitleWithCount: (entriesStr) => `互動詳情: ${entriesStr} (長按可切換表情)`,
    reactionPickerTitle: '選擇表達表情：',
    replyCommentAria: '回覆此評論',
    replyCommentTitle: '回覆此評論',
    replyToUserAria: (author) => `回覆 @${author}`,
    replyToUserTitle: (author) => `回覆 @${author}`,
    boostActionAria: '發送 16 字以內的火箭 Boost 快速回覆',
    boostActionTitle: '發送 16 字以內的火箭 Boost 快速回覆',
    quoteActionAria: '引用此條內容發表評論',
    quoteActionTitle: '引用此條內容發表評論',
    editActionAria: '編輯此條評論',
    editActionTitle: '編輯此條評論',
    deleteActionAria: '刪除此條評論',
    deleteActionTitle: '刪除此條評論',
    expandText: '...展開全文',
    collapseText: '收起',

    viewReplies: (count) => `查看 ${count} 則回覆`,
    collapseReplies: (count) => `收起 ${count} 則回覆`,

    mainPlaceholder: (postTitle) => `圍繞《${postTitle}》發表公開評論... (支援 Markdown 排版、圖片快捷貼上與拖曳上傳)`,
    previewBadge: '最終渲染預覽',
    previewEmpty: '暫無評論內容可預覽，請在「編輯」模式下輸入 Markdown 文字。',
    cancelBtn: '取消',
    sendBtn: '發送',
    sendingBtn: '發送中...',
    replyBtn: '回覆',

    boostModeBadge: '火箭 Boost 回覆模式 (≤16字)',
    boostToggleNormal: '切換為普通回覆',
    boostToggleNormalTitle: '切換回普通 500 字回覆',
    normalReplyTo: (author) => `回覆 @${author}`,
    normalToggleBoost: '切換為 Boost (≤16字)',
    normalToggleBoostTitle: '切換為火箭 Boost 模式 (≤16字)',
    boostPlaceholder: (author) => `對 @${author} 進行 16 字以內的火箭快速表態...`,
    normalPlaceholder: (author) => `回覆 @${author}... (支援 Markdown 排版與圖片貼上)`,

    toolbarBold: '粗體 (Ctrl+B)',
    toolbarItalic: '斜體 (Ctrl+I)',
    toolbarHeading: '標題 (H3)',
    toolbarQuote: '引用 (Ctrl+Q)',
    toolbarCode: '程式碼區塊 (Ctrl+K)',
    toolbarList: '無序清單 (Ctrl+L)',
    toolbarDirection: '切換書寫方向 (LTR / RTL)',
    toolbarDirectionToast: (dir) => `已切換書寫方向為：${dir.toUpperCase()}`,
    toolbarEmoji: '插入常用表情',
    toolbarEmojiTitle: '快捷表情選擇',
    toolbarImage: '插入圖片 / Telegram 圖床',
    toolbarImageAria: '開啟圖片插入與上傳視窗',
    toolbarOptions: '插入進階排版組件',
    toolbarOptionsAria: '開啟進階組件與排版選單',
    toolbarOptionsTitle: '進階 Markdown 拓展',
    toolbarBoldPlaceholder: '粗體文字',
    toolbarItalicPlaceholder: '斜體文字',
    toolbarHeadingPlaceholder: '標題內容',
    toolbarQuotePlaceholder: '引用文字內容',
    toolbarListPlaceholder: '清單項目',

    optQuoteLabel: '引用博文',
    optQuoteDesc: '引用當前文章選中文段或核心觀點',
    optTableLabel: '插入表格',
    optTableDesc: '視覺化設定多行多列表格並自動產生 Markdown 網格',
    optTocLabel: '插入目錄',
    optTocDesc: '自動提取評論中的標題結構並產生跳轉目錄',
    optDetailsLabel: '折疊區塊',
    optDetailsDesc: '插入原生 HTML5 details 可折疊摘要區塊',
    optSpoilerLabel: '模糊防劇透',
    optSpoilerDesc: '插入滑鼠懸浮展示的防劇透高斯模糊文字',
    optMathLabel: '數學公式',
    optMathDesc: '基於 KaTeX 的標準行內與區塊級數學公式',
    optScrollLabel: '捲動容器',
    optScrollDesc: '建立定高可內部捲動的長文本/日誌容器',
    optCalloutLabel: '高光卡片',
    optCalloutDesc: '高光提示資訊塊 (Note / Tip / Warning / Danger)',
    optMermaidLabel: 'Mermaid 拓撲圖',
    optMermaidDesc: '繪製流程圖、時序圖、甘特圖等向量結構圖',
    optChartLabel: 'Build Chart 數據圖表',
    optChartDesc: '基於標準 JSON 數據渲染柱狀圖、折線圖與圓餅圖',
    optGraphvizLabel: 'Graphviz 關係圖',
    optGraphvizDesc: '透過 DOT 描述語言繪製狀態機與拓撲鏈路',
    optDatetimeLabel: '日期時間',
    optDatetimeDesc: '插入標準格式化時間戳並提供即時倒數',
    optTemplateLabel: '論述範本',
    optTemplateDesc: '快速套用深度技術研討、異常排查與觀點交流範本',
    optFootnoteLabel: '新增註腳',
    optFootnoteDesc: '為長篇評論論據新增文末參考引文與出處標記',
    optPollLabel: '互動投票',
    optPollDesc: '發起單選或多選讀者互動調研投票',

    modalInsert: '插入',
    modalConfirm: '確認插入',
    modalCancel: '取消',
    modalClose: '關閉視窗',
    modalTableTitle: '插入 Markdown 數據表格',
    modalTocTitle: '插入評論樹形目錄 [TOC]',
    modalDetailsTitle: '插入折疊隱藏區塊 (Details)',
    modalSpoilerTitle: '插入模糊防劇透內容 (Spoiler)',
    modalMathTitle: '插入 LaTeX 數學公式',
    modalScrollTitle: '插入定高捲動容器',
    modalCalloutTitle: '插入高光包裝卡片 (Callout)',
    modalMermaidTitle: '插入 Mermaid 向量結構圖',
    modalChartTitle: '插入 Build Chart 數據圖表',
    modalGraphvizTitle: '插入 Graphviz DOT 拓撲圖',
    modalDatetimeTitle: '插入格式化日期時間標記',
    modalTemplateTitle: '套用結構化論述範本',
    modalFootnoteTitle: '新增參考註腳出處',
    modalPollTitle: '發起讀者互動投票',
    modalImageTitle: '插入圖片 / Telegram 圖床',
    modalConfirmDelete: '確定要刪除這條內容嗎？',
    modalAddOption: '新增選項',
    modalDeleteOption: '刪除此項',
    modalPollTypeRegular: '單選投票 (Regular)',
    modalPollTypeMultiple: '多選投票 (Multiple)',
    modalOptionPlaceholder: (i) => `選項 ${i}`,
    modalColumnPlaceholder: (i) => `第 ${i} 欄標題`,
    modalColumnDefaultTitle: (i) => `標題 ${i}`,
    modalTableDataSample: (r, c) => `資料 ${r}-${c}`,

    // 1. Poll
    pollRuleTitle: '互動投票機制與發布規則',
    pollRuleText: '採用標準 [poll type=...] 語法。支援單選或多選機制，發布後系統將渲染互動式投票選項。',
    pollQuestionLabel: '投票主題 / 問題：',
    pollQuestionPlaceholder: '輸入投票主題，例如：你如何看待這一技術方案？',
    pollOptionsLabel: '投票選項：',
    pollMechanismLabel: '投票機制：',
    pollDefaultOpt1: '非常認同',
    pollDefaultOpt2: '有待探討',
    pollTopicPrefix: '投票主題：',

    // 2. Table
    tableRuleTitle: 'GFM 管道表格發布規則',
    tableRuleText: '採用標準 GitHub 表格語法（| 表頭 | 與 | --- |）。在下方設定行列數及標題後，系統將自動產生規範網格，插入後可直接在編輯器中修改各儲存格資料。',
    tableRowsLabel: '資料列數 (Rows)：',
    tableColsLabel: '資料欄數 (Cols)：',
    tableCustomHeadersLabel: '自訂各欄標題：',
    tablePreviewLabel: '生成的表格結構即時預覽：',

    // 3. TOC
    tocRuleTitle: '目錄導航自動提取機制與發布規則',
    tocRuleText: '採用標準 [TOC] 語法標籤。評論系統在渲染時，將自動抓取該條評論正文中的所有 Markdown 標題（# 一級、## 二級、### 三級）並構建為具備平滑錨點跳轉的樹形導航。',
    tocSkeletonLabel: '結構骨架選項：',
    tocIncludeHeadersCheckbox: '附帶範例小節分段標題（推薦勾選，一鍵生成規範章節結構）',
    tocPreviewLabel: '將插入的程式碼預覽：',
    tocSampleText: `[TOC]\n\n### 一、 背景與架構目標\n在此輸入第一小節的核心論點...\n\n### 二、 核心技術實現細節\n在此輸入第二小節的詳細分析...\n\n### 三、 總結建議與展望\n在此輸入總結結論...`,

    // 4. Mermaid
    mermaidRuleTitle: 'Mermaid 圖表向量渲染與發布規則',
    mermaidRuleText: '使用 ```mermaid ... ``` 程式碼區塊包裹。系統在前端自動將其編譯為高品質向量 SVG 拓撲圖。可點擊下方按鈕切換預設類型並按需修改程式碼。',
    mermaidTypeLabel: '選擇圖表類型範本：',
    mermaidTypeFlowchart: '流程圖 (Flowchart)',
    mermaidTypeSequence: '時序圖 (Sequence)',
    mermaidTypeGantt: '甘特圖 (Gantt)',
    mermaidTypeClass: '類別圖 (Class)',
    mermaidTypePie: '圓餅圖 (Pie)',
    mermaidTypeState: '狀態圖 (State)',
    mermaidCodeLabel: '圖表程式碼編輯 (可直接調整節點與文字)：',
    mermaidCodePlaceholder: '輸入符合 Mermaid 語法的圖表程式碼...',

    // 5. Chart
    chartRuleTitle: 'Build Chart 數據圖表發布規則',
    chartRuleText: '使用 ```chart ... ``` 程式碼區塊包裹標準 JSON 配置。支援 bar（長條圖）、line（折線圖）與 pie（圓餅圖）。',
    chartPresetLabel: '圖表樣式預設：',
    chartTypeBar: '長條圖 (Bar)',
    chartTypeLine: '折線圖 (Line)',
    chartTypePie: '圓餅圖 (Pie)',
    chartConfigLabel: 'JSON 圖表配置：',
    chartConfigPlaceholder: '輸入標準 JSON 圖表數據...',

    // 6. Graphviz
    graphvizRuleTitle: 'Graphviz 拓撲圖發布規則',
    graphvizRuleText: '採用 ```graphviz ... ``` 程式碼區塊，基於 DOT 描述語言。適合展示微服務架構關係、呼叫鏈路與狀態轉移。',
    graphvizCategoryLabel: '拓撲圖類別：',
    graphvizDigraph: '有向圖 (Digraph - 帶箭頭)',
    graphvizGraph: '無向圖 (Graph - 關聯群)',
    graphvizCodeLabel: 'DOT 語法程式碼：',
    graphvizCodePlaceholder: '輸入 DOT 拓撲語法程式碼...',

    // 7. Details
    detailsRuleTitle: '折疊隱藏區塊發布規則',
    detailsRuleText: '採用原生 HTML5 <details> 與 <summary> 標籤。用於收攏大段報錯日誌、長排查步驟或補充資料，保持評論流清爽。',
    detailsSummaryLabel: '折疊摘要 (標題)：',
    detailsSummaryPlaceholder: '例如：點擊展開詳細報錯日誌 / 排查細節',
    detailsContentLabel: '折疊展開內容：',
    detailsContentPlaceholder: '在此處輸入預設被隱藏的詳細文本、數據或排查日誌...',
    detailsDefaultSummary: '點擊展開詳細內容',
    detailsDefaultContent: '在此輸入折疊區塊詳細內容...',

    // 8. Spoiler
    spoilerRuleTitle: '模糊防劇透發布規則',
    spoilerRuleText: '採用 [spoiler]內容[/spoiler] 語法。內容在評論區中預設以高斯模糊顯示，讀者將游標懸停在其上方即可清晰查看，避免非預期劇透。',
    spoilerTextLabel: '防劇透打碼文本：',
    spoilerTextPlaceholder: '輸入需要打碼模糊的內容，滑鼠懸浮時才會清晰可見...',
    spoilerDefaultText: '劇透內容',

    // 9. Math
    mathRuleTitle: 'LaTeX 數學公式發布規則',
    mathRuleText: '採用 KaTeX 標準 $$ 公式 $$ 區塊級語法。系統在前端自動渲染為高品質數學公式，支援微積分、分數、矩陣與求和等學術符號。',
    mathFormulaLabel: 'LaTeX 數學表達式：',
    mathFormulaPlaceholder: '例如：\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    mathQuickTemplatesLabel: '快捷常用範本：',
    mathFraction: '分式 a/b',
    mathSqrt: '平方根 √x',
    mathSum: '求和 ∑',
    mathIntegral: '定積分 ∫',
    mathLimit: '極限 lim',
    mathMatrix: '矩陣',

    // 10. Scroll
    scrollRuleTitle: '捲動容器發布規則',
    scrollRuleText: '採用定高與內建捲動條（overflow-y: auto）限制超長文字的高度，防止幾十行程式碼或日誌拉長整個評論流。',
    scrollMaxHeightLabel: '最大容器高度 (像素)：',
    scrollContentLabel: '長文本 / 日誌內容：',
    scrollContentPlaceholder: '輸入將在定高容器中帶捲動條展示的超長文字...',
    scrollDefaultContent: '在此輸入定高捲動的長篇日誌、排查紀錄或大量文字...',

    // 11. Datetime
    datetimeRuleTitle: '日期時間標記發布規則',
    datetimeRuleText: '採用 [date=YYYY-MM-DD HH:mm:ss] 標籤。用於在評論中標註關鍵排期、問題出現時間或更新節點，系統將自動高亮顯示。',
    datetimeQuickLabel: '快捷時間選擇：',
    datetimeFull: '當前完整時間 (精確到秒)',
    datetimeDate: '當前日期 (YYYY-MM-DD)',
    datetimeValueLabel: '時間值內容：',
    datetimeValuePlaceholder: '例如：2026-09-05 12:00:00',

    // 12. Template
    templateRuleTitle: '結構化論述範本發布規則',
    templateRuleText: '嚴謹的結構化評論能極大提高交流品質。選擇適合當前話題的結構框架，一鍵插入並填入您的分析見解。',
    templateScenarioLabel: '選擇範本場景：',
    templateTech: '💡 深度技術研討 (觀點/分析/建議)',
    templateBug: '⚠️ 異常/缺陷排查 (現象/環境/日誌)',
    templateOpinion: '🤝 觀點探討交流 (認同/視角/請教)',
    templatePreviewLabel: '範本結構骨架預覽：',
    templateTechSample: `### 💡 核心觀點與設計方案\n在此簡要概括您的核心技術方案或核心論點...\n\n### 🔍 依據與量化分析\n1. **優勢分析**：分析方案帶來的效能提升或體驗改善。\n2. **潛在風險**：應對邊界異常或高併發下的策略。\n\n### 🎯 改進與落地建議\n- [ ] 建議步驟一：...\n- [ ] 建議步驟二：...\n`,
    templateBugSample: `### ⚠️ 異常現象描述\n在此詳細描述出現的非預期現象或錯誤提示...\n\n### 🖥️ 執行環境與重現步驟\n- **環境資訊**：作業系統 / 瀏覽器版本\n- **重現步驟**：\n  1. 造訪對應頁面...\n  2. 點擊某個互動按鈕...\n  3. 觀察主控台/頁面顯示...\n\n### 🪵 報錯日誌與初步排查\n\`\`\`bash\n在此貼上相關報錯堆疊或網路請求抓包\n\`\`\`\n\n### 💡 期望的正確行為\n說明理論上應該展現的正確效果或預期返回結果。\n`,
    templateOpinionSample: `### 🤝 認同之處\n非常贊同博文中關於這一視角的論述，特別是在...方面很有啟發。\n\n### 🤔 補充視角與延伸思考\n從另一個角度來看，或許可以補充考慮以下幾點：\n1. ...\n2. ...\n\n### 💬 交流請教\n對於...的實作細節，博主是否有進一步的經驗分享？\n`,

    // 13. Footnote
    footnoteRuleTitle: '參考註腳聯動發布規則',
    footnoteRuleText: '採用 Markdown 標準註腳語法。將在正文游標位置插入引用標記 [^標號]，並在評論文末自動產生對應該標號的 [^標號]: 詳細註釋內容。',
    footnoteIdLabel: '註腳標識 (標號)：',
    footnoteIdPlaceholder: '例如：1 或 ref',
    footnoteContentLabel: '註腳詳細註釋與出處內容：',
    footnoteContentPlaceholder: '輸入該註腳引用的文獻出處、文件連結或補充說明...',
    footnoteDefaultContent: '在此輸入註腳參考說明與文獻出處',

    // 14. Callout
    calloutRuleTitle: '高光包裝卡片發布規則',
    calloutRuleText: '採用 ::: note/tip/warning/danger 標題 語法。評論區將渲染為帶有對應語義主題色、左側重點邊框和圖示的高光提示卡片。',
    calloutStyleLabel: '包裝卡片風格：',
    calloutTitleLabel: '卡片標題：',
    calloutTitlePlaceholder: '輸入卡片高光標題...',
    calloutContentLabel: '卡片主體內容：',
    calloutContentPlaceholder: '輸入卡片主體說明內容...',
    calloutDefaultContent: '在此輸入高光卡片內容...',

    // 15. Image
    imageRuleTitle: '官方 Telegram 圖床託管與圖片插入規則',
    imageRuleText: '上傳的檔案將自動轉存至官方 Telegram 永久圖床 (img.epocanvas.com)，支援最大 10MB 的主流圖片格式。在評論輸入框中支援直接使用鍵盤 Ctrl+V / Cmd+V 快速貼上螢幕截圖，或直接拖曳圖片入框。',
    imageTabUpload: '本機上傳',
    imageTabGuide: '📋 貼上與拖曳指南',
    imageTabUrl: '🔗 外部圖片連結',
    imagePreviewAlt: '上傳預覽',
    imageStatusUploaded: '已成功轉存至 Telegram CDN',
    imageReselectBtn: '重新選擇',
    imageRemoveBtn: '清除',
    imageLoadingTitle: '正在持久化至 Telegram 圖床通道...',
    imageLoadingDesc: '傳輸並解析中，請稍候',
    imageDropzonePrimary: '點擊選擇圖片',
    imageDropzoneOrDrag: ' 或將圖片拖放至此處',
    imageDropzoneHint: '支援 JPG, PNG, GIF, WebP, SVG, AVIF (單個檔案最高 10MB)',
    imageAltLabel: '圖片說明 / Alt (選填)：',
    imageAltPlaceholder: '例如: 介面排查螢幕截圖、架構拓撲流程',
    imageGuide1Badge: '方法 1',
    imageGuide1Title: '剪貼簿直接貼上 (快捷方便)',
    imageGuide1Desc: '使用截圖工具 (如 Windows Win + Shift + S 或 Mac Cmd + Shift + 4) 截圖後，在評論區任意輸入框內直接按 Ctrl + V (Mac 為 Cmd + V)。',
    imageGuide1Result: '自動上傳並就地插入 Markdown 連結',
    imageGuide2Badge: '方法 2',
    imageGuide2Title: '直接拖曳入框 (直觀高效)',
    imageGuide2Desc: '從您的檔案管理器、桌面或瀏覽器其他標籤頁，直接將圖片檔案拖放至下方評論輸入區域，系統將自動識別並上傳至 Telegram。',
    imageGuide3Badge: '方法 3',
    imageGuide3Title: '標準 Markdown 語法插入',
    imageGuide3Desc: '如果您已有外部 CDN 或圖片直鏈，可隨時書寫標準格式：',
    imageGuide3Sample: '![圖片說明](https://...)',
    imageUrlLabel: '圖片直鏈 URL (必須為有效連結)：',
    imageUrlPlaceholder: 'https://img.epocanvas.com/file/... 或 https://...',
    imageUrlAltPlaceholder: '輸入簡要圖片描述...',
    imageExternalPreviewLabel: '外部預覽：',
    imageExternalPreviewAlt: '預覽',
    imageDefaultAlt: '圖片',
    uploadErrorType: '僅支援上傳圖片檔案 (JPG, PNG, GIF, WebP, SVG, AVIF)',
    uploadErrorSize: '圖片體積超過 10MB 上限',
    uploadErrorFailed: '圖片上傳失敗',
    uploadErrorNetwork: '圖片上傳異常',

    // Quotes
    quoteFromArticle: (articleTitle) => `引用自《${articleTitle}》`,
    quoteEmptyPlaceholder: '探討文章核心邏輯與論點...',
    toastQuoteSelection: '已引用頁面選中文段',
    toastQuoteTip: '💡 提示：在正文中選取文字後點擊右鍵選單『引用至評論區』可精準引用！',

    // All Toasts
    toastUploadingImage: '正在將圖片上傳至 Telegram 圖床...',
    toastUploadFailed: (err) => `上傳失敗: ${err || '未知錯誤'}`,
    toastUploadSuccess: '圖片上傳成功並已持久化至 Telegram！',
    toastClipboardDetected: '檢測到剪貼簿圖片，正在自動上傳至 Telegram 圖床...',
    toastClipboardSuccess: '剪貼簿圖片已成功上傳並插入！',
    toastDragUploading: (name) => `正在上傳拖曳圖片 ${name} 至 Telegram 圖床...`,
    toastDragSuccess: (name) => `拖曳圖片 ${name} 上傳成功！`,
    toastUploadError: (err) => `圖片上傳異常: ${err || '網路逾時'}`,
    toastInsertedPoll: '已成功插入互動投票組件',
    toastInsertedTable: '已成功插入數據表格',
    toastInsertedDetails: '已成功插入折疊區塊',
    toastInsertedSpoiler: '已成功插入防劇透隱藏內容',
    toastInsertedMath: '已成功插入 LaTeX 公式',
    toastInsertedScroll: '已成功插入捲動內容容器',
    toastInsertedCallout: '已成功套用高光卡片格式',
    toastInsertedToc: '已成功插入文章目錄標記',
    toastInsertedMermaid: '已成功插入 Mermaid 圖表',
    toastInsertedChart: '已成功插入 Build Chart',
    toastInsertedGraphviz: '已成功插入 Graphviz 拓撲',
    toastInsertedDatetime: '已成功插入日期時間標記',
    toastInsertedTemplate: '已成功插入論述範本',
    toastInsertedFootnote: '已成功插入參考註腳',
    toastImageMissing: '請先選擇並上傳圖片，或輸入圖片外部連結',
    toastInsertedImage: '已成功插入圖片',
    toastQuotedSelection: '已將博文選中文段引用至評論區',
    toastCommentEmpty: '請填寫評論內容',
    toastCommentLimit: (limit) => `評論內容不能超過 ${limit} 字`,
    toastCommentSuccess: '評論已成功發布！',
    toastCommentFailed: (err) => `提交失敗: ${err || '請重試'}`,
    toastCommentNetworkError: '提交異常，請稍後重試',
    toastBoostLimit: (limit) => `🚀 Boost 回覆不能超過 ${limit} 個字`,
    toastReplyBoostSuccess: '🚀 Boost 回覆已成功發表！',
    toastReplySuccess: '回覆已成功發表！',
    toastReplyFailed: (err) => `回覆失敗: ${err || '請重試'}`,
    toastReplyNetworkError: '回覆異常，請重試',
    toastEditEmpty: '修改內容不能為空',
    toastEditSuccess: '評論修改成功！',
    toastEditFailed: (err) => `修改失敗: ${err || '請重試'}`,
    toastEditNetworkError: '修改請求異常',
    toastDeleteSuccess: '內容已刪除',
    toastDeleteFailed: (err) => `刪除失敗: ${err || '請重試'}`,
    toastDeleteNetworkError: '刪除請求異常',
    toastVisitorLikeForbidden: '⚠️ 訪客無按讚權限，僅註冊/登入用戶可按讚或進行表情互動',
    toastLikeFailed: (err) => `按讚失敗: ${err || '請重試'}`,
    toastLikeNetworkError: '按讚異常，請稍後重試',

    geoRegionPrefix: '地區: ',
    geoRealIpPrefix: ' (真實IP: ',
    geoAdminPrivilege: '博主權限：顯示真實IP歸屬地',
  },

  en: {
    headingComments: 'Comments',
    policyLabel: 'Privacy Policy',
    policyTitle: 'Read Terms of Service and Privacy Policy',
    loginAsGuest: 'Guest (Sign in)',
    loginDrawerTitle: 'Go to Reader Hub to log in or customize your profile',
    tabEdit: 'Edit',
    tabPreview: 'Preview',
    avatarGuestTitle: 'Guest identity (Click to log in / set avatar)',
    avatarUserTitle: (name, role) => `Current identity: ${name} (${role === 'admin' ? 'Author' : 'Reader'})`,
    quoteBannerPrefix: (author) => `🔗 Quoting @${author}'s comment:`,
    toolbarAria: 'Markdown editor toolbar',
    toolbarLangTitle: 'Post Language: Select and insert language block',
    toolbarLangAria: 'Select post language',
    toolbarLangMenuTitle: 'Select Post Language',
    toolbarLangItemDesc: (code) => `Set this block language to ${code}`,
    toastLangInserted: (label) => `Inserted ${label} language block`,
    optImageLabel: 'Insert Image / Telegram Hosting',
    optImageDesc: 'Upload local files, paste screenshots (Ctrl+V), or drag & drop',
    editedBadge: 'Edited',
    saveBtn: 'Save',
    savingBtn: 'Saving...',
    emptyComments: 'No public comments yet. Be the first to start the conversation!',
    publicComments: 'Public Comments',
    sortNew: '⏱️ Latest',
    sortHot: '🔥 Popular',
    loadingComments: 'Loading comments...',
    pinnedBadge: 'Pinned',
    bloggerBadge: 'Author',
    visitorBadge: 'Guest',

    likeAria: 'Like or long-press for reactions',
    likeTitleEmpty: 'Like (long-press for emoji reactions)',
    likeTitleWithCount: (entriesStr) => `Reactions: ${entriesStr} (long-press to change emoji)`,
    reactionPickerTitle: 'Choose a reaction:',
    replyCommentAria: 'Reply to this comment',
    replyCommentTitle: 'Reply to this comment',
    replyToUserAria: (author) => `Reply to @${author}`,
    replyToUserTitle: (author) => `Reply to @${author}`,
    boostActionAria: 'Send a quick Boost reply (max 16 chars)',
    boostActionTitle: 'Send a quick Boost reply (max 16 chars)',
    quoteActionAria: 'Quote this comment',
    quoteActionTitle: 'Quote this comment',
    editActionAria: 'Edit this comment',
    editActionTitle: 'Edit this comment',
    deleteActionAria: 'Delete this comment',
    deleteActionTitle: 'Delete this comment',
    expandText: '...Show more',
    collapseText: 'Show less',

    viewReplies: (count) => `View ${count} ${count === 1 ? 'reply' : 'replies'}`,
    collapseReplies: (count) => `Hide ${count} ${count === 1 ? 'reply' : 'replies'}`,

    mainPlaceholder: (postTitle) => `Share your thoughts on "${postTitle}"... (Supports Markdown, image paste & drag upload)`,
    previewBadge: 'Live Markdown Preview',
    previewEmpty: 'No comment text to preview. Type Markdown content in the "Edit" tab.',
    cancelBtn: 'Cancel',
    sendBtn: 'Send',
    sendingBtn: 'Sending...',
    replyBtn: 'Reply',

    boostModeBadge: 'Rocket Boost Mode (≤16 chars)',
    boostToggleNormal: 'Switch to Standard Reply',
    boostToggleNormalTitle: 'Switch to standard 500-char reply',
    normalReplyTo: (author) => `Reply to @${author}`,
    normalToggleBoost: '⚡ Boost (≤16)',
    normalToggleBoostTitle: 'Switch to Rocket Boost mode (≤16 chars)',
    boostPlaceholder: (author) => `Quick shoutout to @${author} (max 16 chars)...`,
    normalPlaceholder: (author) => `Reply to @${author}... (Supports Markdown & images)`,

    toolbarBold: 'Bold (Ctrl+B)',
    toolbarItalic: 'Italic (Ctrl+I)',
    toolbarHeading: 'Heading (H3)',
    toolbarQuote: 'Quote (Ctrl+Q)',
    toolbarCode: 'Code Block (Ctrl+K)',
    toolbarList: 'Bulleted List (Ctrl+L)',
    toolbarDirection: 'Toggle Text Direction (LTR / RTL)',
    toolbarDirectionToast: (dir) => `Text direction switched to: ${dir.toUpperCase()}`,
    toolbarEmoji: 'Insert Emoji',
    toolbarEmojiTitle: 'Quick Emoji Picker',
    toolbarImage: 'Insert Image / Telegram Hosting',
    toolbarImageAria: 'Open image upload and insertion modal',
    toolbarOptions: 'Insert Advanced Markdown Components',
    toolbarOptionsAria: 'Open advanced components menu',
    toolbarOptionsTitle: 'Advanced Markdown Components',
    toolbarBoldPlaceholder: 'bold text',
    toolbarItalicPlaceholder: 'italic text',
    toolbarHeadingPlaceholder: 'Heading text',
    toolbarQuotePlaceholder: 'Quote text here',
    toolbarListPlaceholder: 'List item',

    optQuoteLabel: 'Quote Article Text',
    optQuoteDesc: 'Quote selected passages or key thesis from the article',
    optTableLabel: 'Insert Table',
    optTableDesc: 'Visually configure rows and columns to generate clean Markdown tables',
    optTocLabel: 'Insert Table of Contents',
    optTocDesc: 'Generate an automatic anchor navigation tree for long comments',
    optDetailsLabel: 'Collapsible Details',
    optDetailsDesc: 'Insert native HTML5 collapsible summary block',
    optSpoilerLabel: 'Spoiler Protection',
    optSpoilerDesc: 'Insert blurred text that reveals on hover to prevent spoilers',
    optMathLabel: 'Math Formula',
    optMathDesc: 'KaTeX-supported inline and block mathematical equations',
    optScrollLabel: 'Scrollable Box',
    optScrollDesc: 'Container with fixed height and scrollbar for lengthy logs or code',
    optCalloutLabel: 'Callout Card',
    optCalloutDesc: 'Highlight banner for Note, Tip, Warning, or Danger notes',
    optMermaidLabel: 'Mermaid Diagram',
    optMermaidDesc: 'Render vector flowcharts, sequence diagrams, and timelines',
    optChartLabel: 'Build Chart Visualizer',
    optChartDesc: 'Render interactive bar, line, and pie charts from standard JSON',
    optGraphvizLabel: 'Graphviz Topology',
    optGraphvizDesc: 'Draw network state machines and architecture using DOT syntax',
    optDatetimeLabel: 'Date & Time Tag',
    optDatetimeDesc: 'Insert formatted timestamp with live relative countdown',
    optTemplateLabel: 'Discussion Templates',
    optTemplateDesc: 'Quickly apply technical research, bug report, or opinion frameworks',
    optFootnoteLabel: 'Add Footnote Citation',
    optFootnoteDesc: 'Create numbered references and bibliography at the comment end',
    optPollLabel: 'Interactive Poll',
    optPollDesc: 'Create single or multiple-choice surveys among readers',

    modalInsert: 'Insert',
    modalConfirm: 'Confirm Insert',
    modalCancel: 'Cancel',
    modalClose: 'Close Dialog',
    modalTableTitle: 'Insert Markdown Data Table',
    modalTocTitle: 'Insert Comment Table of Contents [TOC]',
    modalDetailsTitle: 'Insert Collapsible Details Block',
    modalSpoilerTitle: 'Insert Spoiler Protection (Spoiler)',
    modalMathTitle: 'Insert LaTeX Math Formula',
    modalScrollTitle: 'Insert Scrollable Container',
    modalCalloutTitle: 'Insert Highlight Callout Card',
    modalMermaidTitle: 'Insert Mermaid Vector Diagram',
    modalChartTitle: 'Insert Build Chart Data Visualization',
    modalGraphvizTitle: 'Insert Graphviz DOT Topology',
    modalDatetimeTitle: 'Insert Formatted Datetime Tag',
    modalTemplateTitle: 'Apply Structured Discussion Template',
    modalFootnoteTitle: 'Add Footnote Citation',
    modalPollTitle: 'Create Interactive Reader Poll',
    modalImageTitle: 'Insert Image / Telegram Hosting',
    modalConfirmDelete: 'Are you sure you want to delete this comment?',
    modalAddOption: 'Add Option',
    modalDeleteOption: 'Delete Option',
    modalPollTypeRegular: 'Single Choice',
    modalPollTypeMultiple: 'Multiple Choice',
    modalOptionPlaceholder: (i) => `Option ${i}`,
    modalColumnPlaceholder: (i) => `Column ${i} Header`,
    modalColumnDefaultTitle: (i) => `Header ${i}`,
    modalTableDataSample: (r, c) => `Data ${r}-${c}`,

    // 1. Poll
    pollRuleTitle: 'Interactive Poll Rules & Syntax',
    pollRuleText: 'Uses standard [poll type=...] syntax. Supports single or multiple selection; renders as interactive voting cards upon publication.',
    pollQuestionLabel: 'Poll Topic / Question:',
    pollQuestionPlaceholder: 'Enter poll topic, e.g.: What do you think of this architecture?',
    pollOptionsLabel: 'Poll Options:',
    pollMechanismLabel: 'Voting Mechanism:',
    pollDefaultOpt1: 'Strongly Agree',
    pollDefaultOpt2: 'Open to Discussion',
    pollTopicPrefix: 'Poll Topic: ',

    // 2. Table
    tableRuleTitle: 'GFM Pipe Table Rules & Syntax',
    tableRuleText: 'Uses standard GitHub pipe table syntax (| Header | and | --- |). Set rows, columns and headers below to generate clean grid markdown.',
    tableRowsLabel: 'Number of Rows:',
    tableColsLabel: 'Number of Columns:',
    tableCustomHeadersLabel: 'Customize Column Headers:',
    tablePreviewLabel: 'Generated Table Live Preview:',

    // 3. TOC
    tocRuleTitle: 'Automatic TOC Extraction Rules',
    tocRuleText: 'Uses standard [TOC] tag. The comment system automatically parses headings (# H1, ## H2, ### H3) and builds smooth anchor navigation.',
    tocSkeletonLabel: 'Structure Options:',
    tocIncludeHeadersCheckbox: 'Include sample section headings (recommended to quickly create organized chapters)',
    tocPreviewLabel: 'Code Preview to Insert:',
    tocSampleText: `[TOC]\n\n### 1. Background & Architectural Goals\nEnter core arguments here...\n\n### 2. Implementation Details\nEnter detailed technical analysis here...\n\n### 3. Conclusion & Next Steps\nEnter final recommendations...`,

    // 4. Mermaid
    mermaidRuleTitle: 'Mermaid Vector Diagram Rules',
    mermaidRuleText: 'Wrap in ```mermaid ... ``` code blocks. Renders as clean vector SVG charts. Click buttons below to load presets and customize.',
    mermaidTypeLabel: 'Select Diagram Preset:',
    mermaidTypeFlowchart: 'Flowchart',
    mermaidTypeSequence: 'Sequence Diagram',
    mermaidTypeGantt: 'Gantt Chart',
    mermaidTypeClass: 'Class Diagram',
    mermaidTypePie: 'Pie Chart',
    mermaidTypeState: 'State Diagram',
    mermaidCodeLabel: 'Edit Diagram Code (adjust nodes & labels):',
    mermaidCodePlaceholder: 'Enter valid Mermaid diagram code...',

    // 5. Chart
    chartRuleTitle: 'Build Chart Data Visualization Rules',
    chartRuleText: 'Wrap standard JSON configuration in ```chart ... ``` blocks. Supports bar, line, and pie charts.',
    chartPresetLabel: 'Chart Preset Style:',
    chartTypeBar: 'Bar Chart',
    chartTypeLine: 'Line Chart',
    chartTypePie: 'Pie Chart',
    chartConfigLabel: 'JSON Chart Configuration:',
    chartConfigPlaceholder: 'Enter standard JSON chart data...',

    // 6. Graphviz
    graphvizRuleTitle: 'Graphviz DOT Topology Rules',
    graphvizRuleText: 'Uses ```graphviz ... ``` code blocks with DOT description language. Ideal for microservice relationships and state graphs.',
    graphvizCategoryLabel: 'Topology Category:',
    graphvizDigraph: 'Directed Graph (Digraph - with arrows)',
    graphvizGraph: 'Undirected Graph (Graph - cluster)',
    graphvizCodeLabel: 'DOT Syntax Code:',
    graphvizCodePlaceholder: 'Enter DOT topology code...',

    // 7. Details
    detailsRuleTitle: 'Collapsible Details Block Rules',
    detailsRuleText: 'Uses native HTML5 <details> and <summary> tags to collapse long error stacks, logs, or references cleanly.',
    detailsSummaryLabel: 'Summary (Heading):',
    detailsSummaryPlaceholder: 'e.g.: Click to expand detailed error logs / steps',
    detailsContentLabel: 'Collapsed Content Body:',
    detailsContentPlaceholder: 'Enter hidden text, logs, or diagnostic details here...',
    detailsDefaultSummary: 'Click to expand details',
    detailsDefaultContent: 'Enter collapsible details here...',

    // 8. Spoiler
    spoilerRuleTitle: 'Spoiler Blur Rules',
    spoilerRuleText: 'Uses [spoiler]content[/spoiler] syntax. Text is blurred by default and reveals smoothly on hover.',
    spoilerTextLabel: 'Spoiler Text to Blur:',
    spoilerTextPlaceholder: 'Enter spoiler text that will be blurred until hovered...',
    spoilerDefaultText: 'Spoiler content',

    // 9. Math
    mathRuleTitle: 'LaTeX Mathematical Formula Rules',
    mathRuleText: 'Uses KaTeX standard $$ formula $$ block syntax. Supports calculus, fractions, matrices, and summations.',
    mathFormulaLabel: 'LaTeX Math Expression:',
    mathFormulaPlaceholder: 'e.g.: \\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    mathQuickTemplatesLabel: 'Quick Formula Templates:',
    mathFraction: 'Fraction a/b',
    mathSqrt: 'Square Root √x',
    mathSum: 'Summation ∑',
    mathIntegral: 'Integral ∫',
    mathLimit: 'Limit lim',
    mathMatrix: 'Matrix',

    // 10. Scroll
    scrollRuleTitle: 'Scrollable Container Rules',
    scrollRuleText: 'Restricts max height with internal scrollbars (overflow-y: auto) to keep long logs or code from cluttering the thread.',
    scrollMaxHeightLabel: 'Max Container Height (px):',
    scrollContentLabel: 'Long Text / Log Content:',
    scrollContentPlaceholder: 'Enter long text or logs that will scroll inside the fixed-height container...',
    scrollDefaultContent: 'Enter long logs, diagnostic records or text to scroll inside the fixed box...',

    // 11. Datetime
    datetimeRuleTitle: 'Datetime Tag Rules',
    datetimeRuleText: 'Uses [date=YYYY-MM-DD HH:mm:ss] tags to highlight milestones, release times, or incident timestamps.',
    datetimeQuickLabel: 'Quick Time Presets:',
    datetimeFull: 'Current Full Datetime (to seconds)',
    datetimeDate: 'Current Date (YYYY-MM-DD)',
    datetimeValueLabel: 'Datetime Value:',
    datetimeValuePlaceholder: 'e.g.: 2026-09-05 12:00:00',

    // 12. Template
    templateRuleTitle: 'Structured Discussion Template Rules',
    templateRuleText: 'Structured comments elevate communication quality. Choose a framework, insert it with one click, and fill in your insights.',
    templateScenarioLabel: 'Select Scenario Template:',
    templateTech: '💡 Technical In-Depth (View / Analysis / Steps)',
    templateBug: '⚠️ Bug / Issue Report (Symptoms / Env / Logs)',
    templateOpinion: '🤝 Discussion & Perspectives (Agreement / Q&A)',
    templatePreviewLabel: 'Template Skeleton Preview:',
    templateTechSample: `### 💡 Core Perspective & Design\nSummarize technical proposal or key thesis here...\n\n### 🔍 Rationale & Quantitative Analysis\n1. Advantages: evaluate performance or UX gains.\n2. Potential Risks: address edge cases or concurrency.\n\n### 🎯 Actionable Recommendations\n- [ ] Action item 1: ...\n- [ ] Action item 2: ...\n`,
    templateBugSample: `### ⚠️ Issue Description\nDescribe the unexpected behavior or error here...\n\n### 🖥️ Environment & Reproduction Steps\n- Environment: OS / Browser version\n- Steps to reproduce: ...\n\n### 🪵 Stack Trace & Initial Diagnosis\n\`\`\`bash\nPaste error logs here\n\`\`\`\n\n### 💡 Expected Behavior\nDescribe the intended correct behavior.\n`,
    templateOpinionSample: `### 🤝 Points of Agreement\nStrongly agree with the perspective presented on...\n\n### 🤔 Additional Perspectives\nFrom another angle, we might also consider:\n1. ...\n2. ...\n\n### 💬 Open Questions\nRegarding the detail of..., would you share further insights?\n`,

    // 13. Footnote
    footnoteRuleTitle: 'Footnote Citation Rules',
    footnoteRuleText: 'Uses standard Markdown footnote syntax [^id]. Inserts reference marker and creates matching footnote definition at the end.',
    footnoteIdLabel: 'Footnote Identifier (Label):',
    footnoteIdPlaceholder: 'e.g.: 1 or ref',
    footnoteContentLabel: 'Footnote Citation / Explanation:',
    footnoteContentPlaceholder: 'Enter citation sources, documentation links, or references...',
    footnoteDefaultContent: 'Enter footnote citations and reference sources here',

    // 14. Callout
    calloutRuleTitle: 'Highlight Callout Card Rules',
    calloutRuleText: 'Uses ::: note/tip/warning/danger Title syntax. Renders semantic callout cards with thematic borders and icons.',
    calloutStyleLabel: 'Callout Semantic Style:',
    calloutTitleLabel: 'Card Title:',
    calloutTitlePlaceholder: 'Enter highlight title...',
    calloutContentLabel: 'Card Body Content:',
    calloutContentPlaceholder: 'Enter callout body content...',
    calloutDefaultContent: 'Enter callout description content here...',

    // 15. Image
    imageRuleTitle: 'Official Telegram Image Hosting & Rules',
    imageRuleText: 'Uploaded images are permanently stored on official Telegram CDN (img.epocanvas.com), supporting up to 10MB. You can paste via Ctrl+V / Cmd+V or drag & drop directly into the box.',
    imageTabUpload: 'Local Upload',
    imageTabGuide: '📋 Paste & Drag',
    imageTabUrl: '🔗 External URL',
    imagePreviewAlt: 'Upload Preview',
    imageStatusUploaded: 'Successfully saved to Telegram CDN',
    imageReselectBtn: 'Reselect',
    imageRemoveBtn: 'Clear',
    imageLoadingTitle: 'Uploading to Telegram CDN channel...',
    imageLoadingDesc: 'Transferring and processing, please wait',
    imageDropzonePrimary: 'Click to select image',
    imageDropzoneOrDrag: ' or drag and drop files here',
    imageDropzoneHint: 'Supports JPG, PNG, GIF, WebP, SVG, AVIF (max 10MB per file)',
    imageAltLabel: 'Image Description / Alt (Optional):',
    imageAltPlaceholder: 'e.g.: UI diagnostic screenshot, architecture diagram',
    imageGuide1Badge: 'Method 1',
    imageGuide1Title: 'Direct Clipboard Paste (Quick & Easy)',
    imageGuide1Desc: 'After taking a screenshot (e.g. Win + Shift + S or Mac Cmd + Shift + 4), press Ctrl + V (Mac: Cmd + V) inside any comment input box.',
    imageGuide1Result: 'Auto uploads and inserts Markdown image link in place',
    imageGuide2Badge: 'Method 2',
    imageGuide2Title: 'Direct Drag & Drop (Intuitive & Fast)',
    imageGuide2Desc: 'Drag any image file from your explorer, desktop, or other tabs into the comment input box. It will upload automatically.',
    imageGuide3Badge: 'Method 3',
    imageGuide3Title: 'Standard Markdown Image Syntax',
    imageGuide3Desc: 'If you already have an external image URL, write standard Markdown:',
    imageGuide3Sample: '![Image alt](https://...)',
    imageUrlLabel: 'Direct Image URL (must be valid link):',
    imageUrlPlaceholder: 'https://img.epocanvas.com/file/... or https://...',
    imageUrlAltPlaceholder: 'Enter brief image description...',
    imageExternalPreviewLabel: 'External Preview:',
    imageExternalPreviewAlt: 'Preview',
    imageDefaultAlt: 'Image',
    uploadErrorType: 'Only image files are supported (JPG, PNG, GIF, WebP, SVG, AVIF)',
    uploadErrorSize: 'Image size exceeds 10MB maximum limit',
    uploadErrorFailed: 'Image upload failed',
    uploadErrorNetwork: 'Image upload error',

    // Quotes
    quoteFromArticle: (articleTitle) => `Quoting from "${articleTitle}"`,
    quoteEmptyPlaceholder: 'Discuss core logic and arguments of the article...',
    toastQuoteSelection: 'Quoted selected article passage',
    toastQuoteTip: '💡 Tip: Select text in article and right-click "Quote to Comments" for instant citation!',

    // All Toasts
    toastUploadingImage: 'Uploading image to Telegram hosting...',
    toastUploadFailed: (err) => `Upload failed: ${err || 'Unknown error'}`,
    toastUploadSuccess: 'Image uploaded and stored on Telegram successfully!',
    toastClipboardDetected: 'Clipboard image detected, uploading to Telegram hosting...',
    toastClipboardSuccess: 'Clipboard image uploaded and inserted successfully!',
    toastDragUploading: (name) => `Uploading dragged image ${name} to Telegram...`,
    toastDragSuccess: (name) => `Dragged image ${name} uploaded successfully!`,
    toastUploadError: (err) => `Image upload error: ${err || 'Network timeout'}`,
    toastInsertedPoll: 'Interactive poll component inserted successfully',
    toastInsertedTable: 'Data table inserted successfully',
    toastInsertedDetails: 'Collapsible details block inserted successfully',
    toastInsertedSpoiler: 'Spoiler blur content inserted successfully',
    toastInsertedMath: 'LaTeX math formula inserted successfully',
    toastInsertedScroll: 'Scrollable container inserted successfully',
    toastInsertedCallout: 'Highlight callout card format applied successfully',
    toastInsertedToc: 'TOC navigation tag inserted successfully',
    toastInsertedMermaid: 'Mermaid diagram inserted successfully',
    toastInsertedChart: 'Build Chart inserted successfully',
    toastInsertedGraphviz: 'Graphviz topology inserted successfully',
    toastInsertedDatetime: 'Datetime tag inserted successfully',
    toastInsertedTemplate: 'Structured discussion template inserted successfully',
    toastInsertedFootnote: 'Footnote reference inserted successfully',
    toastImageMissing: 'Please select and upload an image, or enter an external image URL',
    toastInsertedImage: 'Image inserted successfully',
    toastQuotedSelection: 'Selected article text quoted to comments',
    toastCommentEmpty: 'Please enter comment content',
    toastCommentLimit: (limit) => `Comment cannot exceed ${limit} characters`,
    toastCommentSuccess: 'Comment published successfully!',
    toastCommentFailed: (err) => `Submission failed: ${err || 'Please try again'}`,
    toastCommentNetworkError: 'Submission error, please try again later',
    toastBoostLimit: (limit) => `🚀 Boost reply cannot exceed ${limit} characters`,
    toastReplyBoostSuccess: '🚀 Boost reply posted successfully!',
    toastReplySuccess: 'Reply posted successfully!',
    toastReplyFailed: (err) => `Reply failed: ${err || 'Please try again'}`,
    toastReplyNetworkError: 'Reply error, please try again',
    toastEditEmpty: 'Edited content cannot be empty',
    toastEditSuccess: 'Comment updated successfully!',
    toastEditFailed: (err) => `Update failed: ${err || 'Please try again'}`,
    toastEditNetworkError: 'Update request failed',
    toastDeleteSuccess: 'Comment deleted successfully',
    toastDeleteFailed: (err) => `Deletion failed: ${err || 'Please try again'}`,
    toastDeleteNetworkError: 'Deletion request failed',
    toastVisitorLikeForbidden: '⚠️ Guests cannot react. Please log in or register to like or use reactions.',
    toastLikeFailed: (err) => `Reaction failed: ${err || 'Please try again'}`,
    toastLikeNetworkError: 'Reaction error, please try again later',

    geoRegionPrefix: 'Region: ',
    geoRealIpPrefix: ' (Real IP: ',
    geoAdminPrivilege: 'Author Privilege: Show real IP origin',
  },

  fr: {
    headingComments: 'Commentaires',
    policyLabel: 'Politique de confidentialité',
    policyTitle: 'Consulter les conditions d’utilisation et la politique de confidentialité',
    loginAsGuest: 'Invité (Connexion)',
    loginDrawerTitle: 'Accéder à l’espace lecteur pour vous connecter ou personnaliser votre profil',
    tabEdit: 'Éditer',
    tabPreview: 'Aperçu',
    avatarGuestTitle: 'Identité invité (Cliquer pour vous connecter / définir un avatar)',
    avatarUserTitle: (name, role) => `Identité actuelle : ${name} (${role === 'admin' ? 'Auteur' : 'Lecteur'})`,
    quoteBannerPrefix: (author) => `🔗 Citation du commentaire de @${author} :`,
    toolbarAria: 'Barre d’outils Markdown',
    toolbarLangTitle: 'Langue de la publication : Insérer un bloc de langue',
    toolbarLangAria: 'Sélectionner la langue de publication',
    toolbarLangMenuTitle: 'Sélectionner la langue du message',
    toolbarLangItemDesc: (code) => `Définir ce bloc en langue ${code}`,
    toastLangInserted: (label) => `Bloc de langue ${label} inséré`,
    optImageLabel: 'Insérer une image / Hébergement Telegram',
    optImageDesc: 'Téléverser des fichiers locaux, coller (Ctrl+V) ou glisser-déposer',
    editedBadge: 'Modifié',
    saveBtn: 'Enregistrer',
    savingBtn: 'Enregistrement...',
    emptyComments: 'Aucun commentaire public pour le moment. Soyez le premier à réagir !',
    publicComments: 'Commentaires publics',
    sortNew: '⏱️ Récents',
    sortHot: '🔥 Populaires',
    loadingComments: 'Chargement des commentaires...',
    pinnedBadge: 'Épinglé',
    bloggerBadge: 'Auteur',
    visitorBadge: 'Invité',

    likeAria: 'Aimer ou appuyer longuement pour réagir',
    likeTitleEmpty: 'Aimer (appui long pour plus de réactions)',
    likeTitleWithCount: (entriesStr) => `Réactions : ${entriesStr} (appui long pour modifier)`,
    reactionPickerTitle: 'Choisir une réaction :',
    replyCommentAria: 'Répondre à ce commentaire',
    replyCommentTitle: 'Répondre à ce commentaire',
    replyToUserAria: (author) => `Répondre à @${author}`,
    replyToUserTitle: (author) => `Répondre à @${author}`,
    boostActionAria: 'Envoyer une réponse rapide Boost (max 16 car.)',
    boostActionTitle: 'Envoyer une réponse rapide Boost (max 16 car.)',
    quoteActionAria: 'Citer ce commentaire',
    quoteActionTitle: 'Citer ce commentaire',
    editActionAria: 'Modifier ce commentaire',
    editActionTitle: 'Modifier ce commentaire',
    deleteActionAria: 'Supprimer ce commentaire',
    deleteActionTitle: 'Supprimer ce commentaire',
    expandText: '...Afficher plus',
    collapseText: 'Réduire',

    viewReplies: (count) => `Afficher ${count} ${count === 1 ? 'réponse' : 'réponses'}`,
    collapseReplies: (count) => `Masquer ${count} ${count === 1 ? 'réponse' : 'réponses'}`,

    mainPlaceholder: (postTitle) => `Partagez vos réflexions sur « ${postTitle} »... (Supporte Markdown, collage et glisser-déposer d'images)`,
    previewBadge: 'Aperçu en direct Markdown',
    previewEmpty: 'Aucun contenu à prévisualiser. Saisissez du texte Markdown dans l’onglet « Éditer ».',
    cancelBtn: 'Annuler',
    sendBtn: 'Envoyer',
    sendingBtn: 'Envoi...',
    replyBtn: 'Répondre',

    boostModeBadge: 'Mode Rocket Boost (≤16 car.)',
    boostToggleNormal: 'Passer à la réponse normale',
    boostToggleNormalTitle: 'Revenir à une réponse normale de 500 car.',
    normalReplyTo: (author) => `Répondre à @${author}`,
    normalToggleBoost: '⚡ Boost (≤16)',
    normalToggleBoostTitle: 'Passer en mode Rocket Boost (≤16 car.)',
    boostPlaceholder: (author) => `Réaction rapide à @${author} (max 16 car.)...`,
    normalPlaceholder: (author) => `Répondre à @${author}... (Supporte Markdown et images)`,

    toolbarBold: 'Gras (Ctrl+B)',
    toolbarItalic: 'Italique (Ctrl+I)',
    toolbarHeading: 'Titre (H3)',
    toolbarQuote: 'Citation (Ctrl+Q)',
    toolbarCode: 'Bloc de code (Ctrl+K)',
    toolbarList: 'Liste à puces (Ctrl+L)',
    toolbarDirection: 'Changer le sens d’écriture (LTR / RTL)',
    toolbarDirectionToast: (dir) => `Sens d’écriture modifié en : ${dir.toUpperCase()}`,
    toolbarEmoji: 'Insérer un emoji',
    toolbarEmojiTitle: 'Sélecteur rapide d’émojis',
    toolbarImage: 'Insérer une image / Hébergement Telegram',
    toolbarImageAria: 'Ouvrir la fenêtre d’insertion d’image',
    toolbarOptions: 'Insérer des composants Markdown avancés',
    toolbarOptionsAria: 'Ouvrir le menu des composants avancés',
    toolbarOptionsTitle: 'Composants Markdown avancés',
    toolbarBoldPlaceholder: 'texte en gras',
    toolbarItalicPlaceholder: 'texte en italique',
    toolbarHeadingPlaceholder: 'Titre de section',
    toolbarQuotePlaceholder: 'Texte de citation ici',
    toolbarListPlaceholder: 'Élément de liste',

    optQuoteLabel: 'Citer l’article',
    optQuoteDesc: 'Citer des passages sélectionnés ou des thèses de l’article',
    optTableLabel: 'Insérer un tableau',
    optTableDesc: 'Configurer visuellement les lignes et colonnes pour générer un tableau Markdown',
    optTocLabel: 'Insérer un sommaire',
    optTocDesc: 'Générer une navigation automatique par ancres pour les longs commentaires',
    optDetailsLabel: 'Bloc déroulant',
    optDetailsDesc: 'Insérer un bloc HTML5 déroulant et repliable',
    optSpoilerLabel: 'Protection spoiler',
    optSpoilerDesc: 'Insérer un texte flouté qui se révèle au survol',
    optMathLabel: 'Formule mathématique',
    optMathDesc: 'Équations mathématiques en ligne et en bloc via KaTeX',
    optScrollLabel: 'Boîte de défilement',
    optScrollDesc: 'Conteneur à hauteur fixe pour longs journaux ou codes',
    optCalloutLabel: 'Bloc d’avertissement',
    optCalloutDesc: 'Bannière mise en valeur pour Remarque, Astuce, Avertissement ou Danger',
    optMermaidLabel: 'Diagramme Mermaid',
    optMermaidDesc: 'Générer des diagrammes vectoriels de flux, séquence et jalons',
    optChartLabel: 'Visualiseur de données',
    optChartDesc: 'Générer des graphiques en barres, lignes et camemberts via JSON',
    optGraphvizLabel: 'Topologie Graphviz',
    optGraphvizDesc: 'Représenter des graphes et architectures réseau avec la syntaxe DOT',
    optDatetimeLabel: 'Horodatage & Date',
    optDatetimeDesc: 'Insérer une date formatée avec compte à rebours dynamique',
    optTemplateLabel: 'Modèles de discussion',
    optTemplateDesc: 'Appliquer rapidement des canevas de débat technique, rapport d’erreur ou avis',
    optFootnoteLabel: 'Ajouter une note de bas de page',
    optFootnoteDesc: 'Créer des références numérotées et bibliographiques en fin de commentaire',
    optPollLabel: 'Sondage interactif',
    optPollDesc: 'Lancer un sondage à choix unique ou multiple auprès des lecteurs',

    modalInsert: 'Insérer',
    modalConfirm: 'Confirmer l’insertion',
    modalCancel: 'Annuler',
    modalClose: 'Fermer la boîte de dialogue',
    modalTableTitle: 'Insérer un tableau Markdown',
    modalTocTitle: 'Insérer un sommaire [TOC]',
    modalDetailsTitle: 'Insérer un bloc déroulant (Details)',
    modalSpoilerTitle: 'Insérer un texte masqué (Spoiler)',
    modalMathTitle: 'Insérer une formule LaTeX',
    modalScrollTitle: 'Insérer un conteneur avec défilement',
    modalCalloutTitle: 'Insérer une boîte d’avertissement (Callout)',
    modalMermaidTitle: 'Insérer un diagramme Mermaid',
    modalChartTitle: 'Insérer un graphique Build Chart',
    modalGraphvizTitle: 'Insérer une topologie Graphviz DOT',
    modalDatetimeTitle: 'Insérer une balise date et heure',
    modalTemplateTitle: 'Appliquer un modèle de discussion',
    modalFootnoteTitle: 'Ajouter une note de bas de page',
    modalPollTitle: 'Créer un sondage interactif',
    modalImageTitle: 'Insérer une image / Hébergement Telegram',
    modalConfirmDelete: 'Voulez-vous vraiment supprimer ce commentaire ?',
    modalAddOption: 'Ajouter une option',
    modalDeleteOption: 'Supprimer l’option',
    modalPollTypeRegular: 'Choix unique',
    modalPollTypeMultiple: 'Choix multiple',
    modalOptionPlaceholder: (i) => `Option ${i}`,
    modalColumnPlaceholder: (i) => `En-tête colonne ${i}`,
    modalColumnDefaultTitle: (i) => `Titre ${i}`,
    modalTableDataSample: (r, c) => `Donnée ${r}-${c}`,

    // 1. Poll
    pollRuleTitle: 'Règles et syntaxe du sondage interactif',
    pollRuleText: 'Utilise la syntaxe standard [poll type=...]. Prend en charge le choix unique ou multiple avec rendu interactif.',
    pollQuestionLabel: 'Question / Sujet du sondage :',
    pollQuestionPlaceholder: 'Entrez le sujet du sondage, ex. : Que pensez-vous de cette solution ?',
    pollOptionsLabel: 'Options du sondage :',
    pollMechanismLabel: 'Mécanisme de vote :',
    pollDefaultOpt1: 'Tout à fait d’accord',
    pollDefaultOpt2: 'À discuter',
    pollTopicPrefix: 'Sujet du sondage : ',

    // 2. Table
    tableRuleTitle: 'Syntaxe de tableau Markdown GFM',
    tableRuleText: 'Utilise la syntaxe de tableau GitHub standard (| En-tête | et | --- |). Définissez les lignes et colonnes pour générer le tableau.',
    tableRowsLabel: 'Nombre de lignes :',
    tableColsLabel: 'Nombre de colonnes :',
    tableCustomHeadersLabel: 'Personnaliser les en-têtes :',
    tablePreviewLabel: 'Aperçu en direct du tableau :',

    // 3. TOC
    tocRuleTitle: 'Extraction automatique du sommaire',
    tocRuleText: 'Utilise la balise standard [TOC]. Le système extrait automatiquement les titres (# H1, ## H2, ### H3) pour créer une navigation d’ancrage.',
    tocSkeletonLabel: 'Options de structure :',
    tocIncludeHeadersCheckbox: 'Inclure des exemples d’en-têtes de section (recommandé pour structurer rapidement)',
    tocPreviewLabel: 'Aperçu du code à insérer :',
    tocSampleText: `[TOC]\n\n### 1. Contexte et objectifs\nEntrez les arguments principaux ici...\n\n### 2. Détails techniques\nEntrez l’analyse détaillée ici...\n\n### 3. Conclusion et perspectives\nEntrez les recommandations finales...`,

    // 4. Mermaid
    mermaidRuleTitle: 'Règles des diagrammes vectoriels Mermaid',
    mermaidRuleText: 'Entourez de blocs ```mermaid ... ```. Rendu vectoriel SVG net. Cliquez ci-dessous pour changer de modèle.',
    mermaidTypeLabel: 'Choisir un modèle de diagramme :',
    mermaidTypeFlowchart: 'Diagramme de flux',
    mermaidTypeSequence: 'Diagramme de séquence',
    mermaidTypeGantt: 'Diagramme de Gantt',
    mermaidTypeClass: 'Diagramme de classes',
    mermaidTypePie: 'Camembert',
    mermaidTypeState: 'Diagramme d’états',
    mermaidCodeLabel: 'Modifier le code du diagramme (nœuds et textes) :',
    mermaidCodePlaceholder: 'Entrez le code Mermaid valide...',

    // 5. Chart
    chartRuleTitle: 'Règles de visualisation de données Build Chart',
    chartRuleText: 'Entourez la configuration JSON de ```chart ... ```. Prend en charge les diagrammes à barres, courbes et secteurs.',
    chartPresetLabel: 'Modèle de graphique :',
    chartTypeBar: 'Graphique à barres',
    chartTypeLine: 'Graphique linéaire',
    chartTypePie: 'Camembert',
    chartConfigLabel: 'Configuration JSON du graphique :',
    chartConfigPlaceholder: 'Entrez les données JSON standard...',

    // 6. Graphviz
    graphvizRuleTitle: 'Règles de topologie Graphviz DOT',
    graphvizRuleText: 'Utilise les blocs ```graphviz ... ``` en langage DOT. Idéal pour l’architecture microservices et transitions d’état.',
    graphvizCategoryLabel: 'Catégorie de topologie :',
    graphvizDigraph: 'Graphe orienté (Digraph - avec flèches)',
    graphvizGraph: 'Graphe non orienté (Graph - grappe)',
    graphvizCodeLabel: 'Code de syntaxe DOT :',
    graphvizCodePlaceholder: 'Entrez le code de topologie DOT...',

    // 7. Details
    detailsRuleTitle: 'Règles du bloc déroulant (Details)',
    detailsRuleText: 'Utilise les balises HTML5 <details> et <summary> pour masquer les longs journaux ou démarches d’analyse.',
    detailsSummaryLabel: 'Résumé (Titre) :',
    detailsSummaryPlaceholder: 'Ex. : Cliquer pour voir les journaux d’erreur complets',
    detailsContentLabel: 'Contenu masqué :',
    detailsContentPlaceholder: 'Entrez le texte masqué par défaut, données ou journaux...',
    detailsDefaultSummary: 'Cliquer pour afficher les détails',
    detailsDefaultContent: 'Entrez les détails déroulants ici...',

    // 8. Spoiler
    spoilerRuleTitle: 'Règles de masquage de spoiler',
    spoilerRuleText: 'Utilise la syntaxe [spoiler]contenu[/spoiler]. Le texte est flouté et se révèle au survol.',
    spoilerTextLabel: 'Texte du spoiler à flouter :',
    spoilerTextPlaceholder: 'Entrez le texte qui sera masqué jusqu’au survol...',
    spoilerDefaultText: 'Contenu spoiler',

    // 9. Math
    mathRuleTitle: 'Règles de formules mathématiques LaTeX',
    mathRuleText: 'Utilise la syntaxe KaTeX $$ formule $$. Prend en charge le calcul, fractions, matrices et sommes.',
    mathFormulaLabel: 'Expression mathématique LaTeX :',
    mathFormulaPlaceholder: 'Ex. : \\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    mathQuickTemplatesLabel: 'Modèles de formules rapides :',
    mathFraction: 'Fraction a/b',
    mathSqrt: 'Racine carrée √x',
    mathSum: 'Somme ∑',
    mathIntegral: 'Intégrale ∫',
    mathLimit: 'Limite lim',
    mathMatrix: 'Matrice',

    // 10. Scroll
    scrollRuleTitle: 'Règles du conteneur avec défilement',
    scrollRuleText: 'Limite la hauteur maximale avec barre de défilement pour éviter d’allonger le fil de discussion.',
    scrollMaxHeightLabel: 'Hauteur maximale du conteneur (px) :',
    scrollContentLabel: 'Texte long / Journaux :',
    scrollContentPlaceholder: 'Entrez le texte long qui défilera dans le conteneur...',
    scrollDefaultContent: 'Entrez ici les longs journaux ou textes à défilement...',

    // 11. Datetime
    datetimeRuleTitle: 'Règles de balise Date et Heure',
    datetimeRuleText: 'Utilise la balise [date=YYYY-MM-DD HH:mm:ss] pour mettre en valeur les jalons et dates clés.',
    datetimeQuickLabel: 'Sélection rapide de date :',
    datetimeFull: 'Date et heure complètes actuelles',
    datetimeDate: 'Date actuelle (AAAA-MM-JJ)',
    datetimeValueLabel: 'Valeur de date / heure :',
    datetimeValuePlaceholder: 'Ex. : 2026-09-05 12:00:00',

    // 12. Template
    templateRuleTitle: 'Règles des modèles de discussion structurée',
    templateRuleText: 'Des commentaires bien structurés améliorent la discussion. Choisissez un modèle et insérez vos analyses.',
    templateScenarioLabel: 'Choisir un scénario :',
    templateTech: '💡 Analyse technique approfondie',
    templateBug: '⚠️ Rapport d’anomalie / bogue',
    templateOpinion: '🤝 Échange d’idées et perspectives',
    templatePreviewLabel: 'Aperçu du modèle :',
    templateTechSample: `### 💡 Point de vue et architecture\nRésumez votre proposition technique ici...\n\n### 🔍 Analyse et justification\n1. **Avantages** : gains de performance ou d'expérience.\n2. **Risques potentiels** : cas limites ou forte charge.\n\n### 🎯 Recommandations concrètes\n- [ ] Étape 1 : ...\n- [ ] Étape 2 : ...\n`,
    templateBugSample: `### ⚠️ Description de l'anomalie\nDécrivez le comportement inattendu ici...\n\n### 🖥️ Environnement et reproduction\n- **Environnement** : OS / Navigateur\n- **Étapes pour reproduire** :\n  1. Visiter la page...\n  2. Cliquer sur le bouton...\n  3. Observer l'affichage...\n\n### 🪵 Journaux d'erreur\n\`\`\`bash\nCollez la trace d'erreur ici\n\`\`\`\n\n### 💡 Comportement attendu\nDécrivez le résultat souhaité.\n`,
    templateOpinionSample: `### 🤝 Points d'accord\nTout à fait d'accord avec les points soulevés sur...\n\n### 🤔 Perspectives complémentaires\nSous un autre angle, nous pourrions envisager :\n1. ...\n2. ...\n\n### 💬 Question ouverte\nConcernant les détails de..., auriez-vous des retours d'expérience ?\n`,

    // 13. Footnote
    footnoteRuleTitle: 'Règles de notes de bas de page',
    footnoteRuleText: 'Utilise la syntaxe standard [^id]. Insère le repère et ajoute la définition à la fin du commentaire.',
    footnoteIdLabel: 'Identifiant de note :',
    footnoteIdPlaceholder: 'Ex. : 1 ou ref',
    footnoteContentLabel: 'Explication / Source de la note :',
    footnoteContentPlaceholder: 'Entrez les sources citées, liens de documentation ou références...',
    footnoteDefaultContent: 'Entrez les références et sources de la note ici',

    // 14. Callout
    calloutRuleTitle: 'Règles des blocs d’avertissement (Callouts)',
    calloutRuleText: 'Syntaxe ::: note/tip/warning/danger Titre. Affiche des bannières colorées avec icônes et bordures adaptées.',
    calloutStyleLabel: 'Style du bloc :',
    calloutTitleLabel: 'Titre de la carte :',
    calloutTitlePlaceholder: 'Entrez le titre mis en valeur...',
    calloutContentLabel: 'Contenu du bloc :',
    calloutContentPlaceholder: 'Entrez les détails de la note...',
    calloutDefaultContent: 'Entrez la description de la note ici...',

    // 15. Image
    imageRuleTitle: 'Hébergement d’images Telegram officiel et règles',
    imageRuleText: 'Les images sont stockées en permanence sur le CDN Telegram officiel (img.epocanvas.com), jusqu’à 10 Mo. Collez avec Ctrl+V / Cmd+V ou glissez-déposez dans le champ.',
    imageTabUpload: 'Téléverser',
    imageTabGuide: '📋 Copier & Glisser',
    imageTabUrl: '🔗 Lien externe',
    imagePreviewAlt: 'Aperçu du téléversement',
    imageStatusUploaded: 'Enregistré avec succès sur Telegram CDN',
    imageReselectBtn: 'Choisir à nouveau',
    imageRemoveBtn: 'Effacer',
    imageLoadingTitle: 'Téléversement vers le canal CDN Telegram...',
    imageLoadingDesc: 'Transfert et traitement en cours, veuillez patienter',
    imageDropzonePrimary: 'Cliquez pour choisir une image',
    imageDropzoneOrDrag: ' ou glissez-déposez ici',
    imageDropzoneHint: 'Prend en charge JPG, PNG, GIF, WebP, SVG, AVIF (max 10 Mo)',
    imageAltLabel: 'Description de l’image / Alt (Facultatif) :',
    imageAltPlaceholder: 'Ex. : Capture d’écran du diagnostic, topologie d’architecture',
    imageGuide1Badge: 'Méthode 1',
    imageGuide1Title: 'Coller directement depuis le presse-papiers',
    imageGuide1Desc: 'Après une capture d’écran (Win + Maj + S ou Cmd + Maj + 4), faites Ctrl + V (Cmd + V sur Mac) dans le champ de commentaire.',
    imageGuide1Result: 'Téléversement automatique et insertion du lien Markdown',
    imageGuide2Badge: 'Méthode 2',
    imageGuide2Title: 'Glisser-déposer direct dans le champ',
    imageGuide2Desc: 'Glissez une image depuis votre explorateur ou bureau vers la zone de commentaire pour la téléverser automatiquement.',
    imageGuide3Badge: 'Méthode 3',
    imageGuide3Title: 'Syntaxe d’image Markdown standard',
    imageGuide3Desc: 'Si vous disposez déjà d’un lien d’image externe, utilisez le format standard :',
    imageGuide3Sample: '![Description](https://...)',
    imageUrlLabel: 'URL directe de l’image (lien valide requis) :',
    imageUrlPlaceholder: 'https://img.epocanvas.com/file/... ou https://...',
    imageUrlAltPlaceholder: 'Entrez une brève description de l’image...',
    imageExternalPreviewLabel: 'Aperçu externe :',
    imageExternalPreviewAlt: 'Aperçu',
    imageDefaultAlt: 'Image',
    uploadErrorType: 'Seuls les fichiers d’images sont supportés (JPG, PNG, GIF, WebP, SVG, AVIF)',
    uploadErrorSize: 'L’image dépasse la limite maximale de 10 Mo',
    uploadErrorFailed: 'Échec du téléversement de l’image',
    uploadErrorNetwork: 'Erreur réseau lors du téléversement',

    // Quotes
    quoteFromArticle: (articleTitle) => `Citation de « ${articleTitle} »`,
    quoteEmptyPlaceholder: 'Discuter des arguments principaux de l’article...',
    toastQuoteSelection: 'Passage sélectionné de l’article cité',
    toastQuoteTip: '💡 Astuce : Sélectionnez un passage et faites un clic droit « Citer dans les commentaires » !',

    // All Toasts
    toastUploadingImage: 'Téléversement de l’image vers Telegram...',
    toastUploadFailed: (err) => `Échec du téléversement : ${err || 'Erreur inconnue'}`,
    toastUploadSuccess: 'Image téléversée et enregistrée sur Telegram !',
    toastClipboardDetected: 'Image du presse-papiers détectée, téléversement vers Telegram...',
    toastClipboardSuccess: 'Image du presse-papiers téléversée et insérée !',
    toastDragUploading: (name) => `Téléversement de l’image glissée ${name} vers Telegram...`,
    toastDragSuccess: (name) => `Image glissée ${name} téléversée avec succès !`,
    toastUploadError: (err) => `Erreur lors du téléversement : ${err || 'Délai d’attente dépassé'}`,
    toastInsertedPoll: 'Composant de sondage interactif inséré avec succès',
    toastInsertedTable: 'Tableau de données inséré avec succès',
    toastInsertedDetails: 'Bloc déroulant inséré avec succès',
    toastInsertedSpoiler: 'Contenu spoiler masqué inséré avec succès',
    toastInsertedMath: 'Formule mathématique LaTeX insérée avec succès',
    toastInsertedScroll: 'Conteneur avec défilement inséré avec succès',
    toastInsertedCallout: 'Bloc d’avertissement inséré avec succès',
    toastInsertedToc: 'Balise de sommaire insérée avec succès',
    toastInsertedMermaid: 'Diagramme Mermaid inséré avec succès',
    toastInsertedChart: 'Graphique Build Chart inséré avec succès',
    toastInsertedGraphviz: 'Topologie Graphviz insérée avec succès',
    toastInsertedDatetime: 'Balise date et heure insérée avec succès',
    toastInsertedTemplate: 'Modèle de discussion structuré inséré avec succès',
    toastInsertedFootnote: 'Note de bas de page insérée avec succès',
    toastImageMissing: 'Veuillez téléverser une image ou entrer une URL d’image externe',
    toastInsertedImage: 'Image insérée avec succès',
    toastQuotedSelection: 'Texte sélectionné cité dans les commentaires',
    toastCommentEmpty: 'Veuillez entrer le contenu du commentaire',
    toastCommentLimit: (limit) => `Le commentaire ne peut pas dépasser ${limit} caractères`,
    toastCommentSuccess: 'Commentaire publié avec succès !',
    toastCommentFailed: (err) => `Échec de l’envoi : ${err || 'Veuillez réessayer'}`,
    toastCommentNetworkError: 'Erreur d’envoi, veuillez réessayer plus tard',
    toastBoostLimit: (limit) => `🚀 La réponse Boost ne doit pas dépasser ${limit} caractères`,
    toastReplyBoostSuccess: '🚀 Réponse Boost publiée avec succès !',
    toastReplySuccess: 'Réponse publiée avec succès !',
    toastReplyFailed: (err) => `Échec de la réponse : ${err || 'Veuillez réessayer'}`,
    toastReplyNetworkError: 'Erreur de réponse, veuillez réessayer',
    toastEditEmpty: 'Le contenu modifié ne peut pas être vide',
    toastEditSuccess: 'Commentaire modifié avec succès !',
    toastEditFailed: (err) => `Échec de la modification : ${err || 'Veuillez réessayer'}`,
    toastEditNetworkError: 'Erreur lors de la requête de modification',
    toastDeleteSuccess: 'Commentaire supprimé',
    toastDeleteFailed: (err) => `Échec de la suppression : ${err || 'Veuillez réessayer'}`,
    toastDeleteNetworkError: 'Erreur lors de la requête de suppression',
    toastVisitorLikeForbidden: '⚠️ Les invités ne peuvent pas réagir. Connectez-vous pour aimer ou ajouter des réactions.',
    toastLikeFailed: (err) => `Échec de la réaction : ${err || 'Veuillez réessayer'}`,
    toastLikeNetworkError: 'Erreur de réaction, veuillez réessayer plus tard',

    geoRegionPrefix: 'Région : ',
    geoRealIpPrefix: ' (IP réelle : ',
    geoAdminPrivilege: 'Privilège auteur : Afficher l’IP réelle',
  },

  es: {
    headingComments: 'Comentarios',
    policyLabel: 'Política de privacidad',
    policyTitle: 'Leer términos de servicio y política de privacidad',
    loginAsGuest: 'Visitante (Acceso)',
    loginDrawerTitle: 'Ir al Centro de Lectores para identificarse o editar su perfil',
    tabEdit: 'Editar',
    tabPreview: 'Vista previa',
    avatarGuestTitle: 'Identidad de visitante (Clic para identificarse / elegir avatar)',
    avatarUserTitle: (name, role) => `Identidad actual: ${name} (${role === 'admin' ? 'Autor' : 'Lector'})`,
    quoteBannerPrefix: (author) => `🔗 Citando el comentario de @${author}:`,
    toolbarAria: 'Barra de herramientas Markdown',
    toolbarLangTitle: 'Idioma del mensaje: Seleccionar e insertar bloque de idioma',
    toolbarLangAria: 'Seleccionar idioma del mensaje',
    toolbarLangMenuTitle: 'Seleccionar idioma del mensaje',
    toolbarLangItemDesc: (code) => `Establecer este bloque en idioma ${code}`,
    toastLangInserted: (label) => `Bloque de idioma ${label} insertado`,
    optImageLabel: 'Insertar imagen / Alojamiento Telegram',
    optImageDesc: 'Subir archivos locales, pegar (Ctrl+V) o arrastrar y soltar',
    editedBadge: 'Editado',
    saveBtn: 'Guardar',
    savingBtn: 'Guardando...',
    emptyComments: 'Aún no hay comentarios públicos. ¡Sé el primero en participar!',
    publicComments: 'Comentarios públicos',
    sortNew: '⏱️ Recientes',
    sortHot: '🔥 Populares',
    loadingComments: 'Cargando comentarios...',
    pinnedBadge: 'Fijado',
    bloggerBadge: 'Autor',
    visitorBadge: 'Visitante',

    likeAria: 'Dar me gusta o mantener presionado para reaccionar',
    likeTitleEmpty: 'Me gusta (mantén presionado para ver más reacciones)',
    likeTitleWithCount: (entriesStr) => `Reacciones: ${entriesStr} (mantén presionado para cambiar)`,
    reactionPickerTitle: 'Elige una reacción:',
    replyCommentAria: 'Responder a este comentario',
    replyCommentTitle: 'Responder a este comentario',
    replyToUserAria: (author) => `Responder a @${author}`,
    replyToUserTitle: (author) => `Responder a @${author}`,
    boostActionAria: 'Enviar una respuesta rápida Boost (máx. 16 car.)',
    boostActionTitle: 'Enviar una respuesta rápida Boost (máx. 16 car.)',
    quoteActionAria: 'Citar este comentario',
    quoteActionTitle: 'Citar este comentario',
    editActionAria: 'Editar este comentario',
    editActionTitle: 'Editar este comentario',
    deleteActionAria: 'Eliminar este comentario',
    deleteActionTitle: 'Eliminar este comentario',
    expandText: '...Mostrar más',
    collapseText: 'Mostrar menos',

    viewReplies: (count) => `Ver ${count} ${count === 1 ? 'respuesta' : 'respuestas'}`,
    collapseReplies: (count) => `Ocultar ${count} ${count === 1 ? 'respuesta' : 'respuestas'}`,

    mainPlaceholder: (postTitle) => `Comparte tus impresiones sobre "${postTitle}"... (Soporta Markdown, pegar y arrastrar imágenes)`,
    previewBadge: 'Vista previa en directo',
    previewEmpty: 'No hay contenido para previsualizar. Escribe texto Markdown en la pestaña "Editar".',
    cancelBtn: 'Cancelar',
    sendBtn: 'Enviar',
    sendingBtn: 'Enviando...',
    replyBtn: 'Responder',

    boostModeBadge: 'Modo Rocket Boost (≤16 car.)',
    boostToggleNormal: 'Cambiar a respuesta normal',
    boostToggleNormalTitle: 'Volver a respuesta normal de 500 car.',
    normalReplyTo: (author) => `Responder a @${author}`,
    normalToggleBoost: '⚡ Boost (≤16)',
    normalToggleBoostTitle: 'Cambiar a modo Rocket Boost (≤16 car.)',
    boostPlaceholder: (author) => `Respuesta rápida para @${author} (máx. 16 car.)...`,
    normalPlaceholder: (author) => `Responder a @${author}... (Soporta Markdown e imágenes)`,

    toolbarBold: 'Negrita (Ctrl+B)',
    toolbarItalic: 'Cursiva (Ctrl+I)',
    toolbarHeading: 'Encabezado (H3)',
    toolbarQuote: 'Cita (Ctrl+Q)',
    toolbarCode: 'Bloque de código (Ctrl+K)',
    toolbarList: 'Lista con viñetas (Ctrl+L)',
    toolbarDirection: 'Cambiar dirección de escritura (LTR / RTL)',
    toolbarDirectionToast: (dir) => `Dirección de texto cambiada a: ${dir.toUpperCase()}`,
    toolbarEmoji: 'Insertar emoji',
    toolbarEmojiTitle: 'Selector rápido de emojis',
    toolbarImage: 'Insertar imagen / Alojamiento Telegram',
    toolbarImageAria: 'Abrir ventana de inserción de imagen',
    toolbarOptions: 'Insertar componentes Markdown avanzados',
    toolbarOptionsAria: 'Abrir menú de componentes avanzados',
    toolbarOptionsTitle: 'Componentes Markdown avanzados',
    toolbarBoldPlaceholder: 'texto en negrita',
    toolbarItalicPlaceholder: 'texto en cursiva',
    toolbarHeadingPlaceholder: 'Título de sección',
    toolbarQuotePlaceholder: 'Texto de la cita',
    toolbarListPlaceholder: 'Elemento de lista',

    optQuoteLabel: 'Citar artículo',
    optQuoteDesc: 'Citar fragmentos seleccionados o tesis clave del artículo',
    optTableLabel: 'Insertar tabla',
    optTableDesc: 'Configurar visualmente filas y columnas para generar tablas Markdown',
    optTocLabel: 'Insertar índice',
    optTocDesc: 'Generar navegación por anclas automática para comentarios largos',
    optDetailsLabel: 'Bloque desplegable',
    optDetailsDesc: 'Insertar bloque desplegable y plegable HTML5 nativo',
    optSpoilerLabel: 'Protección de spoiler',
    optSpoilerDesc: 'Insertar texto difuminado que se revela al pasar el cursor',
    optMathLabel: 'Fórmula matemática',
    optMathDesc: 'Ecuaciones matemáticas en línea y en bloque con KaTeX',
    optScrollLabel: 'Caja con desplazamiento',
    optScrollDesc: 'Contenedor con altura fija para registros extensos o código',
    optCalloutLabel: 'Tarjeta destacada',
    optCalloutDesc: 'Banner destacado para Notas, Consejos, Advertencias o Peligro',
    optMermaidLabel: 'Diagrama Mermaid',
    optMermaidDesc: 'Renderizar diagramas de flujo, secuencias y cronogramas vectoriales',
    optChartLabel: 'Visualizador de datos',
    optChartDesc: 'Renderizar gráficos interactivos de barras, líneas y sectores desde JSON',
    optGraphvizLabel: 'Topología Graphviz',
    optGraphvizDesc: 'Dibujar máquinas de estado y redes con sintaxis DOT',
    optDatetimeLabel: 'Fecha y hora',
    optDatetimeDesc: 'Insertar marca de tiempo formateada con cuenta regresiva dinámica',
    optTemplateLabel: 'Plantillas de debate',
    optTemplateDesc: 'Aplicar rápidamente esquemas de análisis técnico, errores u opiniones',
    optFootnoteLabel: 'Añadir nota al pie',
    optFootnoteDesc: 'Crear referencias numeradas y bibliografía al final del comentario',
    optPollLabel: 'Encuesta interactiva',
    optPollDesc: 'Iniciar una encuesta de opción única o múltiple entre lectores',

    modalInsert: 'Insertar',
    modalConfirm: 'Confirmar inserción',
    modalCancel: 'Cancelar',
    modalClose: 'Cerrar diálogo',
    modalTableTitle: 'Insertar tabla Markdown',
    modalTocTitle: 'Insertar índice [TOC]',
    modalDetailsTitle: 'Insertar bloque desplegable (Details)',
    modalSpoilerTitle: 'Insertar texto difuminado (Spoiler)',
    modalMathTitle: 'Insertar fórmula LaTeX',
    modalScrollTitle: 'Insertar contenedor con desplazamiento',
    modalCalloutTitle: 'Insertar tarjeta destacada (Callout)',
    modalMermaidTitle: 'Insertar diagrama Mermaid',
    modalChartTitle: 'Insertar gráfico Build Chart',
    modalGraphvizTitle: 'Insertar topología Graphviz DOT',
    modalDatetimeTitle: 'Insertar marca de fecha y hora',
    modalTemplateTitle: 'Aplicar plantilla de debate',
    modalFootnoteTitle: 'Añadir nota al pie',
    modalPollTitle: 'Crear encuesta interactiva',
    modalImageTitle: 'Insertar imagen / Alojamiento Telegram',
    modalConfirmDelete: '¿Estás seguro de que deseas eliminar este comentario?',
    modalAddOption: 'Añadir opción',
    modalDeleteOption: 'Eliminar opción',
    modalPollTypeRegular: 'Opción única',
    modalPollTypeMultiple: 'Opción múltiple',
    modalOptionPlaceholder: (i) => `Opción ${i}`,
    modalColumnPlaceholder: (i) => `Encabezado col. ${i}`,
    modalColumnDefaultTitle: (i) => `Título ${i}`,
    modalTableDataSample: (r, c) => `Dato ${r}-${c}`,

    // 1. Poll
    pollRuleTitle: 'Reglas y sintaxis de encuestas interactivas',
    pollRuleText: 'Usa la sintaxis estándar [poll type=...]. Admite selección única o múltiple y se renderiza interactivamente.',
    pollQuestionLabel: 'Tema o pregunta de la encuesta:',
    pollQuestionPlaceholder: 'Introduce el tema, ej.: ¿Qué opinas de esta solución técnica?',
    pollOptionsLabel: 'Opciones de la encuesta:',
    pollMechanismLabel: 'Mecanismo de votación:',
    pollDefaultOpt1: 'Totalmente de acuerdo',
    pollDefaultOpt2: 'Abierto a debate',
    pollTopicPrefix: 'Tema de la encuesta: ',

    // 2. Table
    tableRuleTitle: 'Sintaxis de tabla Markdown GFM',
    tableRuleText: 'Utiliza la sintaxis estándar de tablas de GitHub (| Encabezado | y | --- |). Configura filas y columnas para generar la tabla.',
    tableRowsLabel: 'Número de filas:',
    tableColsLabel: 'Número de columnas:',
    tableCustomHeadersLabel: 'Personalizar encabezados:',
    tablePreviewLabel: 'Vista previa en tiempo real de la tabla:',

    // 3. TOC
    tocRuleTitle: 'Extracción automática del índice de contenidos',
    tocRuleText: 'Utiliza la etiqueta estándar [TOC]. El sistema extrae encabezados (# H1, ## H2, ### H3) y crea navegación por anclas.',
    tocSkeletonLabel: 'Opciones de estructura:',
    tocIncludeHeadersCheckbox: 'Incluir encabezados de sección de ejemplo (recomendado para organizar)',
    tocPreviewLabel: 'Vista previa del código a insertar:',
    tocSampleText: `[TOC]\n\n### 1. Contexto y objetivos\nIntroduce los puntos principales aquí...\n\n### 2. Detalles de implementación\nIntroduce el análisis detallado aquí...\n\n### 3. Conclusiones y recomendaciones\nIntroduce las conclusiones finales...`,

    // 4. Mermaid
    mermaidRuleTitle: 'Reglas de diagramas vectoriales Mermaid',
    mermaidRuleText: 'Envuelve en bloques ```mermaid ... ```. Se renderiza como SVG vectorial. Haz clic abajo para cargar plantillas.',
    mermaidTypeLabel: 'Seleccionar tipo de diagrama:',
    mermaidTypeFlowchart: 'Diagrama de flujo',
    mermaidTypeSequence: 'Diagrama de secuencia',
    mermaidTypeGantt: 'Diagrama de Gantt',
    mermaidTypeClass: 'Diagrama de clases',
    mermaidTypePie: 'Gráfico circular',
    mermaidTypeState: 'Diagrama de estados',
    mermaidCodeLabel: 'Editar código del diagrama (nodos y etiquetas):',
    mermaidCodePlaceholder: 'Introduce código Mermaid válido...',

    // 5. Chart
    chartRuleTitle: 'Reglas de visualización de datos Build Chart',
    chartRuleText: 'Envuelve la configuración JSON en ```chart ... ```. Admite gráficos de barras, líneas y sectores.',
    chartPresetLabel: 'Estilo predefinido de gráfico:',
    chartTypeBar: 'Gráfico de barras',
    chartTypeLine: 'Gráfico de líneas',
    chartTypePie: 'Gráfico circular',
    chartConfigLabel: 'Configuración JSON del gráfico:',
    chartConfigPlaceholder: 'Introduce datos JSON estándar...',

    // 6. Graphviz
    graphvizRuleTitle: 'Reglas de topología Graphviz DOT',
    graphvizRuleText: 'Usa bloques ```graphviz ... ``` en lenguaje DOT. Ideal para relaciones entre microservicios y grafos de estado.',
    graphvizCategoryLabel: 'Categoría de topología:',
    graphvizDigraph: 'Grafo dirigido (Digraph - con flechas)',
    graphvizGraph: 'Grafo no dirigido (Graph - grupos)',
    graphvizCodeLabel: 'Código de sintaxis DOT:',
    graphvizCodePlaceholder: 'Introduce código de topología DOT...',

    // 7. Details
    detailsRuleTitle: 'Reglas del bloque desplegable (Details)',
    detailsRuleText: 'Usa etiquetas HTML5 <details> y <summary> para plegar registros extensos o pasos de resolución.',
    detailsSummaryLabel: 'Resumen (Título):',
    detailsSummaryPlaceholder: 'Ej.: Clic para expandir registros detallados de error',
    detailsContentLabel: 'Contenido desplegable:',
    detailsContentPlaceholder: 'Introduce aquí el texto oculto, datos o registros...',
    detailsDefaultSummary: 'Clic para ver detalles',
    detailsDefaultContent: 'Introduce aquí el contenido desplegable...',

    // 8. Spoiler
    spoilerRuleTitle: 'Reglas de protección de spoilers',
    spoilerRuleText: 'Usa la sintaxis [spoiler]contenido[/spoiler]. El texto aparece difuminado y se revela al pasar el cursor.',
    spoilerTextLabel: 'Texto a difuminar (spoiler):',
    spoilerTextPlaceholder: 'Introduce el texto que estará oculto hasta pasar el ratón...',
    spoilerDefaultText: 'Contenido de spoiler',

    // 9. Math
    mathRuleTitle: 'Reglas de fórmulas matemáticas LaTeX',
    mathRuleText: 'Usa la sintaxis de bloque KaTeX $$ fórmula $$. Admite cálculo, fracciones, matrices y sumatorias.',
    mathFormulaLabel: 'Expresión matemática LaTeX:',
    mathFormulaPlaceholder: 'Ej.: \\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    mathQuickTemplatesLabel: 'Plantillas rápidas de fórmulas:',
    mathFraction: 'Fracción a/b',
    mathSqrt: 'Raíz cuadrada √x',
    mathSum: 'Sumatoria ∑',
    mathIntegral: 'Integral ∫',
    mathLimit: 'Límite lim',
    mathMatrix: 'Matriz',

    // 10. Scroll
    scrollRuleTitle: 'Reglas del contenedor con desplazamiento',
    scrollRuleText: 'Restringe la altura con barras de desplazamiento para evitar que registros extensos ocupen demasiado espacio.',
    scrollMaxHeightLabel: 'Altura máxima del contenedor (px):',
    scrollContentLabel: 'Texto largo / Registros:',
    scrollContentPlaceholder: 'Introduce el texto extenso que se desplazará dentro del contenedor...',
    scrollDefaultContent: 'Introduce aquí registros o textos largos que se desplazarán en la caja fija...',

    // 11. Datetime
    datetimeRuleTitle: 'Reglas de marcas de fecha y hora',
    datetimeRuleText: 'Usa la etiqueta [date=YYYY-MM-DD HH:mm:ss] para resaltar fechas clave, versiones o incidencias.',
    datetimeQuickLabel: 'Selección rápida de hora:',
    datetimeFull: 'Fecha y hora actual completa',
    datetimeDate: 'Fecha actual (AAAA-MM-DD)',
    datetimeValueLabel: 'Valor de fecha y hora:',
    datetimeValuePlaceholder: 'Ej.: 2026-09-05 12:00:00',

    // 12. Template
    templateRuleTitle: 'Reglas de plantillas de discusión estructurada',
    templateRuleText: 'Los comentarios estructurados mejoran el debate. Elige una plantilla e introduce tus análisis.',
    templateScenarioLabel: 'Seleccionar escenario:',
    templateTech: '💡 Debate técnico en profundidad',
    templateBug: '⚠️ Reporte de error / incidencia',
    templateOpinion: '🤝 Intercambio de opiniones',
    templatePreviewLabel: 'Vista previa de la plantilla:',
    templateTechSample: `### 💡 Propuesta de diseño y tesis\nResume aquí tu propuesta técnica...\n\n### 🔍 Justificación y análisis\n1. **Ventajas**: mejoras de rendimiento o experiencia.\n2. **Riesgos**: casos extremos o concurrencia.\n\n### 🎯 Recomendaciones prácticas\n- [ ] Paso 1: ...\n- [ ] Paso 2: ...\n`,
    templateBugSample: `### ⚠️ Descripción de la incidencia\nDescribe el comportamiento inesperado aquí...\n\n### 🖥️ Entorno y pasos de reproducción\n- **Entorno**: SO / Versión del navegador\n- **Pasos de reproducción**:\n  1. Visitar la página...\n  2. Clic en el botón...\n  3. Observar la pantalla...\n\n### 🪵 Registros de error\n\`\`\`bash\nPega aquí la traza de error\n\`\`\`\n\n### 💡 Comportamiento esperado\nDescribe el resultado esperado.\n`,
    templateOpinionSample: `### 🤝 Puntos de acuerdo\nMuy de acuerdo con lo expuesto sobre...\n\n### 🤔 Perspectivas adicionales\nDesde otra perspectiva, también convendría considerar:\n1. ...\n2. ...\n\n### 💬 Pregunta abierta\nRespecto a los detalles de..., ¿podrías compartir más experiencia?\n`,

    // 13. Footnote
    footnoteRuleTitle: 'Reglas de notas al pie y citas',
    footnoteRuleText: 'Utiliza la sintaxis estándar [^id]. Inserta la marca y añade la definición al final del comentario.',
    footnoteIdLabel: 'Identificador de la nota:',
    footnoteIdPlaceholder: 'Ej.: 1 o ref',
    footnoteContentLabel: 'Contenido / Fuente de la nota:',
    footnoteContentPlaceholder: 'Introduce referencias bibliográficas, enlaces o notas...',
    footnoteDefaultContent: 'Introduce las referencias y fuentes de la cita aquí',

    // 14. Callout
    calloutRuleTitle: 'Reglas de tarjetas destacadas (Callouts)',
    calloutRuleText: 'Sintaxis ::: note/tip/warning/danger Título. Renderiza tarjetas con colores temáticos e iconos.',
    calloutStyleLabel: 'Estilo de la tarjeta:',
    calloutTitleLabel: 'Título de la tarjeta:',
    calloutTitlePlaceholder: 'Introduce el título destacado...',
    calloutContentLabel: 'Contenido principal:',
    calloutContentPlaceholder: 'Introduce el contenido de la tarjeta...',
    calloutDefaultContent: 'Introduce aquí la descripción de la tarjeta destacada...',

    // 15. Image
    imageRuleTitle: 'Alojamiento de imágenes en Telegram oficial y reglas',
    imageRuleText: 'Las imágenes se guardan permanentemente en el CDN oficial de Telegram (img.epocanvas.com), hasta 10 MB. Pega con Ctrl+V / Cmd+V o arrastra directamente.',
    imageTabUpload: 'Subir imagen',
    imageTabGuide: '📋 Pegar y arrastrar',
    imageTabUrl: '🔗 Enlace URL',
    imagePreviewAlt: 'Vista previa de subida',
    imageStatusUploaded: 'Guardado con éxito en Telegram CDN',
    imageReselectBtn: 'Seleccionar de nuevo',
    imageRemoveBtn: 'Limpiar',
    imageLoadingTitle: 'Subiendo al canal CDN de Telegram...',
    imageLoadingDesc: 'Transfiriendo y procesando, por favor espera',
    imageDropzonePrimary: 'Haz clic para seleccionar imagen',
    imageDropzoneOrDrag: ' o arrastra y suelta aquí',
    imageDropzoneHint: 'Admite JPG, PNG, GIF, WebP, SVG, AVIF (máx. 10 MB por archivo)',
    imageAltLabel: 'Descripción de la imagen / Alt (Opcional):',
    imageAltPlaceholder: 'Ej.: Captura de diagnóstico de interfaz, diagrama de arquitectura',
    imageGuide1Badge: 'Método 1',
    imageGuide1Title: 'Pegar directamente del portapapeles',
    imageGuide1Desc: 'Tras capturar la pantalla (Win + Shift + S o Cmd + Shift + 4), pulsa Ctrl + V (Cmd + V en Mac) en cualquier casilla de comentarios.',
    imageGuide1Result: 'Sube automáticamente e inserta el enlace Markdown',
    imageGuide2Badge: 'Método 2',
    imageGuide2Title: 'Arrastrar y soltar directamente',
    imageGuide2Desc: 'Arrastra un archivo de imagen desde tu explorador o escritorio hacia el cuadro de comentarios para subirlo automáticamente.',
    imageGuide3Badge: 'Método 3',
    imageGuide3Title: 'Sintaxis estándar de imagen en Markdown',
    imageGuide3Desc: 'Si ya tienes un enlace directo de imagen, escribe el formato estándar:',
    imageGuide3Sample: '![Descripción](https://...)',
    imageUrlLabel: 'URL directa de la imagen (debe ser válida):',
    imageUrlPlaceholder: 'https://img.epocanvas.com/file/... o https://...',
    imageUrlAltPlaceholder: 'Introduce una breve descripción de la imagen...',
    imageExternalPreviewLabel: 'Vista previa externa:',
    imageExternalPreviewAlt: 'Vista previa',
    imageDefaultAlt: 'Imagen',
    uploadErrorType: 'Solo se admiten archivos de imagen (JPG, PNG, GIF, WebP, SVG, AVIF)',
    uploadErrorSize: 'La imagen supera el límite de 10 MB',
    uploadErrorFailed: 'Error al subir la imagen',
    uploadErrorNetwork: 'Error de red al subir la imagen',

    // Quotes
    quoteFromArticle: (articleTitle) => `Citando de "${articleTitle}"`,
    quoteEmptyPlaceholder: 'Debatir los argumentos principales del artículo...',
    toastQuoteSelection: 'Texto seleccionado del artículo citado',
    toastQuoteTip: '💡 Consejo: ¡Selecciona un pasaje y haz clic derecho "Citar en comentarios"!',

    // All Toasts
    toastUploadingImage: 'Subiendo imagen al alojamiento de Telegram...',
    toastUploadFailed: (err) => `Error de subida: ${err || 'Error desconocido'}`,
    toastUploadSuccess: '¡Imagen subida y guardada en Telegram con éxito!',
    toastClipboardDetected: 'Imagen del portapapeles detectada, subiendo a Telegram...',
    toastClipboardSuccess: '¡Imagen del portapapeles subida e insertada con éxito!',
    toastDragUploading: (name) => `Subiendo imagen arrastrada ${name} a Telegram...`,
    toastDragSuccess: (name) => `¡Imagen arrastrada ${name} subida con éxito!`,
    toastUploadError: (err) => `Excepción al subir imagen: ${err || 'Tiempo de espera agotado'}`,
    toastInsertedPoll: 'Componente de encuesta interactiva insertado con éxito',
    toastInsertedTable: 'Tabla de datos insertada con éxito',
    toastInsertedDetails: 'Bloque desplegable insertado con éxito',
    toastInsertedSpoiler: 'Contenido spoiler difuminado insertado con éxito',
    toastInsertedMath: 'Fórmula matemática LaTeX insertada con éxito',
    toastInsertedScroll: 'Contenedor con desplazamiento insertado con éxito',
    toastInsertedCallout: 'Tarjeta destacada insertada con éxito',
    toastInsertedToc: 'Etiqueta de índice insertada con éxito',
    toastInsertedMermaid: 'Diagrama Mermaid insertado con éxito',
    toastInsertedChart: 'Gráfico Build Chart insertado con éxito',
    toastInsertedGraphviz: 'Topología Graphviz insertada con éxito',
    toastInsertedDatetime: 'Marca de fecha y hora insertada con éxito',
    toastInsertedTemplate: 'Plantilla de debate estructurada insertada con éxito',
    toastInsertedFootnote: 'Nota al pie insertada con éxito',
    toastImageMissing: 'Por favor selecciona y sube una imagen, o introduce una URL externa',
    toastInsertedImage: 'Imagen insertada con éxito',
    toastQuotedSelection: 'Texto seleccionado citado en los comentarios',
    toastCommentEmpty: 'Por favor introduce el contenido del comentario',
    toastCommentLimit: (limit) => `El comentario no puede superar los ${limit} caracteres`,
    toastCommentSuccess: '¡Comentario publicado con éxito!',
    toastCommentFailed: (err) => `Error al enviar: ${err || 'Inténtalo de nuevo'}`,
    toastCommentNetworkError: 'Error de conexión, inténtalo más tarde',
    toastBoostLimit: (limit) => `🚀 La respuesta Boost no puede superar los ${limit} caracteres`,
    toastReplyBoostSuccess: '🚀 ¡Respuesta Boost publicada con éxito!',
    toastReplySuccess: '¡Respuesta publicada con éxito!',
    toastReplyFailed: (err) => `Error al responder: ${err || 'Inténtalo de nuevo'}`,
    toastReplyNetworkError: 'Error al responder, inténtalo de nuevo',
    toastEditEmpty: 'El contenido editado no puede estar vacío',
    toastEditSuccess: '¡Comentario modificado con éxito!',
    toastEditFailed: (err) => `Error al modificar: ${err || 'Inténtalo de nuevo'}`,
    toastEditNetworkError: 'Error en la solicitud de modificación',
    toastDeleteSuccess: 'Comentario eliminado',
    toastDeleteFailed: (err) => `Error al eliminar: ${err || 'Inténtalo de nuevo'}`,
    toastDeleteNetworkError: 'Error en la solicitud de eliminación',
    toastVisitorLikeForbidden: '⚠️ Los visitantes no pueden reaccionar. Inicia sesión para dar me gusta o reaccionar.',
    toastLikeFailed: (err) => `Error al reaccionar: ${err || 'Inténtalo de nuevo'}`,
    toastLikeNetworkError: 'Error de reacción, inténtalo más tarde',

    geoRegionPrefix: 'Región: ',
    geoRealIpPrefix: ' (IP real: ',
    geoAdminPrivilege: 'Privilegio de autor: Mostrar IP real',
  },

  de: {
    headingComments: 'Kommentare',
    policyLabel: 'Datenschutzrichtlinie',
    policyTitle: 'Nutzungsbedingungen und Datenschutzrichtlinie lesen',
    loginAsGuest: 'Gast (Anmelden)',
    loginDrawerTitle: 'Zum Reader Hub gehen, um sich anzumelden oder das Profil anzupassen',
    tabEdit: 'Bearbeiten',
    tabPreview: 'Vorschau',
    avatarGuestTitle: 'Gast-Identität (Klicken zum Anmelden / Avatar festlegen)',
    avatarUserTitle: (name, role) => `Aktuelle Identität: ${name} (${role === 'admin' ? 'Autor' : 'Leser'})`,
    quoteBannerPrefix: (author) => `🔗 Zitat des Kommentars von @${author}:`,
    toolbarAria: 'Markdown-Editor-Symbolleiste',
    toolbarLangTitle: 'Beitragssprache: Sprachblock auswählen und einfügen',
    toolbarLangAria: 'Beitragssprache auswählen',
    toolbarLangMenuTitle: 'Beitragssprache auswählen',
    toolbarLangItemDesc: (code) => `Diesen Block auf Sprache ${code} festlegen`,
    toastLangInserted: (label) => `Sprachblock für ${label} eingefügt`,
    optImageLabel: 'Bild einfügen / Telegram Hosting',
    optImageDesc: 'Lokale Dateien hochladen, Screenshots einfügen (Strg+V) oder Drag & Drop',
    editedBadge: 'Bearbeitet',
    saveBtn: 'Speichern',
    savingBtn: 'Wird gespeichert...',
    emptyComments: 'Noch keine öffentlichen Kommentare vorhanden. Schreiben Sie den ersten Beitrag!',
    publicComments: 'Öffentliche Kommentare',
    sortNew: '⏱️ Neueste',
    sortHot: '🔥 Beliebteste',
    loadingComments: 'Kommentare werden geladen...',
    pinnedBadge: 'Angeheftet',
    bloggerBadge: 'Autor',
    visitorBadge: 'Gast',

    likeAria: 'Liken oder gedrückt halten für Reaktionen',
    likeTitleEmpty: 'Gefällt mir (gedrückt halten für mehr Reaktionen)',
    likeTitleWithCount: (entriesStr) => `Reaktionen: ${entriesStr} (gedrückt halten zum Ändern)`,
    reactionPickerTitle: 'Reaktion auswählen:',
    replyCommentAria: 'Auf diesen Kommentar antworten',
    replyCommentTitle: 'Auf diesen Kommentar antworten',
    replyToUserAria: (author) => `Antworten an @${author}`,
    replyToUserTitle: (author) => `Antworten an @${author}`,
    boostActionAria: 'Schnelle Boost-Antwort senden (max. 16 Zeichen)',
    boostActionTitle: 'Schnelle Boost-Antwort senden (max. 16 Zeichen)',
    quoteActionAria: 'Diesen Kommentar zitieren',
    quoteActionTitle: 'Diesen Kommentar zitieren',
    editActionAria: 'Diesen Kommentar bearbeiten',
    editActionTitle: 'Diesen Kommentar bearbeiten',
    deleteActionAria: 'Diesen Kommentar löschen',
    deleteActionTitle: 'Diesen Kommentar löschen',
    expandText: '...Mehr anzeigen',
    collapseText: 'Weniger anzeigen',

    viewReplies: (count) => `${count} ${count === 1 ? 'Antwort' : 'Antworten'} anzeigen`,
    collapseReplies: (count) => `${count} ${count === 1 ? 'Antwort' : 'Antworten'} ausblenden`,

    mainPlaceholder: (postTitle) => `Teilen Sie Ihre Gedanken zu „${postTitle}“ mit... (Unterstützt Markdown, Bildeinfügen und Drag & Drop)`,
    previewBadge: 'Live-Markdown-Vorschau',
    previewEmpty: 'Keine Vorschau verfügbar. Bitte geben Sie Text im Reiter „Bearbeiten“ ein.',
    cancelBtn: 'Abbrechen',
    sendBtn: 'Senden',
    sendingBtn: 'Wird gesendet...',
    replyBtn: 'Antworten',

    boostModeBadge: 'Rocket-Boost-Modus (≤16 Zeichen)',
    boostToggleNormal: 'Zu normaler Antwort wechseln',
    boostToggleNormalTitle: 'Zur regulären 500-Zeichen-Antwort zurückkehren',
    normalReplyTo: (author) => `Antworten an @${author}`,
    normalToggleBoost: '⚡ Boost (≤16)',
    normalToggleBoostTitle: 'In den Rocket-Boost-Modus wechseln (≤16 Zeichen)',
    boostPlaceholder: (author) => `Schnelle Reaktion an @${author} (max. 16 Zeichen)...`,
    normalPlaceholder: (author) => `Antworten an @${author}... (Unterstützt Markdown & Bilder)`,

    toolbarBold: 'Fett (Strg+B)',
    toolbarItalic: 'Kursiv (Strg+I)',
    toolbarHeading: 'Überschrift (H3)',
    toolbarQuote: 'Zitat (Strg+Q)',
    toolbarCode: 'Codeblock (Strg+K)',
    toolbarList: 'Aufzählung (Strg+L)',
    toolbarDirection: 'Schreibrichtung wechseln (LTR / RTL)',
    toolbarDirectionToast: (dir) => `Schreibrichtung geändert zu: ${dir.toUpperCase()}`,
    toolbarEmoji: 'Emoji einfügen',
    toolbarEmojiTitle: 'Schnellauswahl für Emojis',
    toolbarImage: 'Bild einfügen / Telegram Hosting',
    toolbarImageAria: 'Fenster zum Hochladen und Einfügen von Bildern öffnen',
    toolbarOptions: 'Erweiterte Markdown-Komponenten einfügen',
    toolbarOptionsAria: 'Menü für erweiterte Komponenten öffnen',
    toolbarOptionsTitle: 'Erweiterte Markdown-Komponenten',
    toolbarBoldPlaceholder: 'fetter Text',
    toolbarItalicPlaceholder: 'kursiver Text',
    toolbarHeadingPlaceholder: 'Überschriftentext',
    toolbarQuotePlaceholder: 'Zitattext hier',
    toolbarListPlaceholder: 'Listeneintrag',

    optQuoteLabel: 'Artikeltext zitieren',
    optQuoteDesc: 'Ausgewählten Text oder Kernaussagen des Artikels zitieren',
    optTableLabel: 'Tabelle einfügen',
    optTableDesc: 'Zeilen und Spalten visuell konfigurieren und Markdown-Tabelle erzeugen',
    optTocLabel: 'Inhaltsverzeichnis einfügen',
    optTocDesc: 'Automatische Ankernavigation für lange Kommentare erzeugen',
    optDetailsLabel: 'Ausklappbare Details',
    optDetailsDesc: 'Einen ein- und ausklappbaren HTML5-Bereich einfügen',
    optSpoilerLabel: 'Spoiler-Schutz',
    optSpoilerDesc: 'Verborgener Text, der bei Mausberührung sichtbar wird',
    optMathLabel: 'Mathematische Formel',
    optMathDesc: 'Inline- und Blockformeln mit KaTeX-Unterstützung',
    optScrollLabel: 'Scrollbare Box',
    optScrollDesc: 'Container mit fester Höhe für lange Protokolle oder Codeblöcke',
    optCalloutLabel: 'Hinweisbox',
    optCalloutDesc: 'Hervorgehobenes Banner für Notizen, Tipps, Warnungen oder Gefahr',
    optMermaidLabel: 'Mermaid-Diagramm',
    optMermaidDesc: 'Vektorielle Flussdiagramme, Sequenzdiagramme und Ablaufpläne erzeugen',
    optChartLabel: 'Diagramm-Generator',
    optChartDesc: 'Visuelle Balken-, Linien- und Tortendiagramme aus JSON erstellen',
    optGraphvizLabel: 'Graphviz-Topologie',
    optGraphvizDesc: 'Netzwerk- und Systemgraphen mittels DOT-Syntax darstellen',
    optDatetimeLabel: 'Zeit & Countdown',
    optDatetimeDesc: 'Formatierten Zeitstempel mit dynamischem Countdown einfügen',
    optTemplateLabel: 'Diskussionsvorlagen',
    optTemplateDesc: 'Vorlagen für technische Analysen, Fehlerberichte und Feedback nutzen',
    optFootnoteLabel: 'Fußnote hinzufügen',
    optFootnoteDesc: 'Nummerierte Quellenverweise und Anmerkungen am Textende erstellen',
    optPollLabel: 'Interaktive Umfrage',
    optPollDesc: 'Single- oder Multiple-Choice-Umfrage unter Lesern starten',

    modalInsert: 'Einfügen',
    modalConfirm: 'Einfügen bestätigen',
    modalCancel: 'Abbrechen',
    modalClose: 'Schließen',
    modalTableTitle: 'Markdown-Datentabelle einfügen',
    modalTocTitle: 'Kommentar-Inhaltsverzeichnis einfügen [TOC]',
    modalDetailsTitle: 'Ausklappbaren Bereich einfügen (Details)',
    modalSpoilerTitle: 'Spoiler-Schutztext einfügen (Spoiler)',
    modalMathTitle: 'LaTeX-Formel einfügen',
    modalScrollTitle: 'Scrollbaren Container einfügen',
    modalCalloutTitle: 'Hinweisbox einfügen (Callout)',
    modalMermaidTitle: 'Mermaid-Vektordiagramm einfügen',
    modalChartTitle: 'Build Chart-Datendiagramm einfügen',
    modalGraphvizTitle: 'Graphviz DOT-Topologie einfügen',
    modalDatetimeTitle: 'Zeitstempel-Markierung einfügen',
    modalTemplateTitle: 'Strukturierte Diskussionsvorlage anwenden',
    modalFootnoteTitle: 'Fußnoten-Quellenangabe hinzufügen',
    modalPollTitle: 'Interaktive Leserumfrage erstellen',
    modalImageTitle: 'Bild einfügen / Telegram Hosting',
    modalConfirmDelete: 'Möchten Sie diesen Kommentar wirklich löschen?',
    modalAddOption: 'Option hinzufügen',
    modalDeleteOption: 'Option löschen',
    modalPollTypeRegular: 'Einzelauswahl',
    modalPollTypeMultiple: 'Mehrfachauswahl',
    modalOptionPlaceholder: (i) => `Option ${i}`,
    modalColumnPlaceholder: (i) => `Spalte ${i} Kopfzeile`,
    modalColumnDefaultTitle: (i) => `Titel ${i}`,
    modalTableDataSample: (r, c) => `Daten ${r}-${c}`,

    // 1. Poll
    pollRuleTitle: 'Regeln und Syntax für interaktive Umfragen',
    pollRuleText: 'Nutzt standardmäßige [poll type=...]-Syntax. Unterstützt Einzel- oder Mehrfachauswahl und wird interaktiv gerendert.',
    pollQuestionLabel: 'Umfrage-Thema / Frage:',
    pollQuestionPlaceholder: 'Umfrage-Thema eingeben, z.B.: Wie bewerten Sie diese Architektur?',
    pollOptionsLabel: 'Umfrageoptionen:',
    pollMechanismLabel: 'Abstimmungsmechanismus:',
    pollDefaultOpt1: 'Voll und ganz zustimmen',
    pollDefaultOpt2: 'Offen zur Diskussion',
    pollTopicPrefix: 'Umfrage-Thema: ',

    // 2. Table
    tableRuleTitle: 'GFM Markdown-Tabellensyntax',
    tableRuleText: 'Verwendet standardmäßige GitHub-Tabellensyntax (| Kopfzeile | und | --- |). Legen Sie Zeilen und Spalten fest, um die Tabelle zu erzeugen.',
    tableRowsLabel: 'Zeilenanzahl:',
    tableColsLabel: 'Spaltenanzahl:',
    tableCustomHeadersLabel: 'Spaltenüberschriften anpassen:',
    tablePreviewLabel: 'Live-Vorschau der generierten Tabelle:',

    // 3. TOC
    tocRuleTitle: 'Automatische Inhaltsverzeichnis-Extraktion',
    tocRuleText: 'Verwendet den [TOC]-Tag. Das System extrahiert Überschriften (# H1, ## H2, ### H3) für eine reibungslose Ankernavigation.',
    tocSkeletonLabel: 'Struktur-Optionen:',
    tocIncludeHeadersCheckbox: 'Beispiel-Abschnittsüberschriften einfügen (empfohlen für saubere Gliederung)',
    tocPreviewLabel: 'Vorschau des einzufügenden Codes:',
    tocSampleText: `[TOC]\n\n### 1. Hintergrund & Zielsetzung\nHier Kernargumente eingeben...\n\n### 2. Technische Umsetzung\nHier detaillierte Analyse eingeben...\n\n### 3. Fazit und Ausblick\nHier Empfehlungen eingeben...`,

    // 4. Mermaid
    mermaidRuleTitle: 'Regeln für Mermaid-Vektordiagramme',
    mermaidRuleText: 'In ```mermaid ... ```-Codeblöcke einfassen. Wird als SVG-Grafik gerendert. Wählen Sie Vorlagen aus.',
    mermaidTypeLabel: 'Diagrammtyp auswählen:',
    mermaidTypeFlowchart: 'Flussdiagramm',
    mermaidTypeSequence: 'Sequenzdiagramm',
    mermaidTypeGantt: 'Gantt-Diagramm',
    mermaidTypeClass: 'Klassendiagramm',
    mermaidTypePie: 'Kreisdiagramm',
    mermaidTypeState: 'Zustandsdiagramm',
    mermaidCodeLabel: 'Diagrammcode bearbeiten (Knoten & Texte anpassen):',
    mermaidCodePlaceholder: 'Gültigen Mermaid-Code eingeben...',

    // 5. Chart
    chartRuleTitle: 'Regeln für Build Chart-Datenvisualisierung',
    chartRuleText: 'Standard-JSON-Konfiguration in ```chart ... ``` einfassen. Unterstützt Balken-, Linien- und Kreisdiagramme.',
    chartPresetLabel: 'Diagrammstil-Vorlage:',
    chartTypeBar: 'Balkendiagramm',
    chartTypeLine: 'Liniendiagramm',
    chartTypePie: 'Kreisdiagramm',
    chartConfigLabel: 'JSON-Diagrammkonfiguration:',
    chartConfigPlaceholder: 'Standard-JSON-Diagrammdaten eingeben...',

    // 6. Graphviz
    graphvizRuleTitle: 'Regeln für Graphviz DOT-Topologie',
    graphvizRuleText: 'Verwendet ```graphviz ... ```-Codeblöcke mit DOT-Syntax. Ideal für Microservice-Architekturen und Zustandsübergänge.',
    graphvizCategoryLabel: 'Topologie-Kategorie:',
    graphvizDigraph: 'Gerichteter Graph (Digraph - mit Pfeilen)',
    graphvizGraph: 'Ungerichteter Graph (Graph - Cluster)',
    graphvizCodeLabel: 'DOT-Syntax-Code:',
    graphvizCodePlaceholder: 'DOT-Topologiecode eingeben...',

    // 7. Details
    detailsRuleTitle: 'Regeln für ausklappbare Bereiche',
    detailsRuleText: 'Verwendet native HTML5-Tags <details> und <summary>, um lange Protokolle oder Schritte kompakt zu halten.',
    detailsSummaryLabel: 'Zusammenfassung (Titel):',
    detailsSummaryPlaceholder: 'z.B.: Klicken für vollständige Fehlerprotokolle',
    detailsContentLabel: 'Ausklappbarer Inhalt:',
    detailsContentPlaceholder: 'Hier verborgene Texte, Daten oder Protokolle eingeben...',
    detailsDefaultSummary: 'Klicken, um Details anzuzeigen',
    detailsDefaultContent: 'Ausklappbaren Inhalt hier eingeben...',

    // 8. Spoiler
    spoilerRuleTitle: 'Regeln für Spoiler-Unschärfe',
    spoilerRuleText: 'Nutzt die [spoiler]Inhalt[/spoiler]-Syntax. Text ist standardmäßig unscharf und wird beim Hovern sichtbar.',
    spoilerTextLabel: 'Zu verbergender Spoiler-Text:',
    spoilerTextPlaceholder: 'Text eingeben, der bis zum Drüberfahren unkenntlich bleibt...',
    spoilerDefaultText: 'Spoiler-Inhalt',

    // 9. Math
    mathRuleTitle: 'Regeln für mathematische LaTeX-Formeln',
    mathRuleText: 'Verwendet KaTeX-Syntax $$ Formel $$. Unterstützt Integralrechnung, Brüche, Matrizen und Summen.',
    mathFormulaLabel: 'Mathematischer LaTeX-Ausdruck:',
    mathFormulaPlaceholder: 'z.B.: \\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
    mathQuickTemplatesLabel: 'Schnellvorlagen für Formeln:',
    mathFraction: 'Bruch a/b',
    mathSqrt: 'Quadratwurzel √x',
    mathSum: 'Summe ∑',
    mathIntegral: 'Integral ∫',
    mathLimit: 'Grenzwert lim',
    mathMatrix: 'Matrix',

    // 10. Scroll
    scrollRuleTitle: 'Regeln für scrollbare Container',
    scrollRuleText: 'Begrenzt die Höhe mit internem Scrollbalken, um lange Logs übersichtlich darzustellen.',
    scrollMaxHeightLabel: 'Maximale Containerhöhe (px):',
    scrollContentLabel: 'Langer Text / Protokollinhalt:',
    scrollContentPlaceholder: 'Geben Sie langen Text ein, der innerhalb des Containers gescrollt werden kann...',
    scrollDefaultContent: 'Lange Protokolle oder Diagnosetexte hier eingeben...',

    // 11. Datetime
    datetimeRuleTitle: 'Regeln für Datums- und Zeitstempel',
    datetimeRuleText: 'Verwendet [date=YYYY-MM-DD HH:mm:ss]-Tags zur Hervorhebung wichtiger Meilensteine oder Zeitpunkte.',
    datetimeQuickLabel: 'Schnellauswahl für Zeit:',
    datetimeFull: 'Aktueller voller Zeitstempel (sekundengenau)',
    datetimeDate: 'Aktuelles Datum (JJJJ-MM-TT)',
    datetimeValueLabel: 'Zeitstempel-Wert:',
    datetimeValuePlaceholder: 'z.B.: 2026-09-05 12:00:00',

    // 12. Template
    templateRuleTitle: 'Regeln für strukturierte Diskussionsvorlagen',
    templateRuleText: 'Strukturierte Kommentare fördern sachliche Diskussionen. Wählen Sie eine Vorlage für Ihre Analyse.',
    templateScenarioLabel: 'Szenario auswählen:',
    templateTech: '💡 Technische Tiefenanalyse',
    templateBug: '⚠️ Fehlerbericht & Diagnose',
    templateOpinion: '🤝 Meinungsaustausch & Diskussion',
    templatePreviewLabel: 'Vorlagen-Vorschau:',
    templateTechSample: `### 💡 Kernansatz & Architekturentwurf\nHier technischen Vorschlag zusammenfassen...\n\n### 🔍 Begründung & Analyse\n1. **Vorteile**: Performance- oder UX-Gewinne.\n2. **Risiken**: Grenzfälle oder Hochlast.\n\n### 🎯 Handlungsempfehlungen\n- [ ] Schritt 1: ...\n- [ ] Schritt 2: ...\n`,
    templateBugSample: `### ⚠️ Fehlerbeschreibung\nBeschreiben Sie das unerwartete Verhalten hier...\n\n### 🖥️ Umgebung & Reproduktionsschritte\n- **Umgebung**: Betriebssystem / Browser\n- **Schritte zur Reproduktion**:\n  1. Seite aufrufen...\n  2. Schaltfläche anklicken...\n  3. Bildschirmanzeige beobachten...\n\n### 🪵 Stacktrace & Diagnose\n\`\`\`bash\nFehlerprotokolle hier einfügen\n\`\`\`\n\n### 💡 Erwartetes Verhalten\nBeschreiben Sie das gewünschte Verhalten.\n`,
    templateOpinionSample: `### 🤝 Übereinstimmende Punkte\nVollste Zustimmung bezüglich der Ausführungen zu...\n\n### 🤔 Ergänzende Perspektiven\nAus einem anderen Blickwinkel könnte man ergänzen:\n1. ...\n2. ...\n\n### 💬 Offene Fragen\nBezüglich..., gibt es dazu weitere Erfahrungswerte?\n`,

    // 13. Footnote
    footnoteRuleTitle: 'Regeln für Fußnoten und Zitate',
    footnoteRuleText: 'Nutzt standardmäßige Fußnotensyntax [^id]. Platziert die Markierung und generiert den Eintrag am Textende.',
    footnoteIdLabel: 'Fußnoten-Kennung (Label):',
    footnoteIdPlaceholder: 'z.B.: 1 oder ref',
    footnoteContentLabel: 'Quellenangabe / Erläuterung:',
    footnoteContentPlaceholder: 'Quellenangaben, Dokumentationslinks oder Erläuterungen eingeben...',
    footnoteDefaultContent: 'Quellenangaben und Literaturhinweise hier eingeben',

    // 14. Callout
    calloutRuleTitle: 'Regeln für formatierte Hinweisboxen (Callouts)',
    calloutRuleText: 'Syntax ::: note/tip/warning/danger Titel. Rendert Hinweisboxen mit passenden Symbolen und Akzentfarben.',
    calloutStyleLabel: 'Hinweisbox-Stil:',
    calloutTitleLabel: 'Kartentitel:',
    calloutTitlePlaceholder: 'Hervorgehobenen Titel eingeben...',
    calloutContentLabel: 'Hauptinhalt der Box:',
    calloutContentPlaceholder: 'Inhalt der Hinweisbox eingeben...',
    calloutDefaultContent: 'Beschreibung der Hinweisbox hier eingeben...',

    // 15. Image
    imageRuleTitle: 'Offizielles Telegram-Bilderhosting & Regeln',
    imageRuleText: 'Bilder werden dauerhaft auf dem offiziellen Telegram CDN (img.epocanvas.com) gespeichert (bis 10 MB). Nutzen Sie Strg+V / Cmd+V oder Drag & Drop direkt im Feld.',
    imageTabUpload: 'Lokaler Upload',
    imageTabGuide: '📋 Einfügen & Drag-Drop',
    imageTabUrl: '🔗 Externe Bild-URL',
    imagePreviewAlt: 'Upload-Vorschau',
    imageStatusUploaded: 'Erfolgreich im Telegram CDN gespeichert',
    imageReselectBtn: 'Neu auswählen',
    imageRemoveBtn: 'Löschen',
    imageLoadingTitle: 'Wird auf Telegram CDN hochgeladen...',
    imageLoadingDesc: 'Übertragung und Verarbeitung läuft, bitte warten',
    imageDropzonePrimary: 'Klicken, um Bild auszuwählen',
    imageDropzoneOrDrag: ' oder Bild hierher ziehen',
    imageDropzoneHint: 'Unterstützt JPG, PNG, GIF, WebP, SVG, AVIF (max. 10 MB pro Datei)',
    imageAltLabel: 'Bildbeschreibung / Alt (Optional):',
    imageAltPlaceholder: 'z.B.: UI-Diagnose-Screenshot, Architekturtopologie',
    imageGuide1Badge: 'Methode 1',
    imageGuide1Title: 'Direkt aus der Zwischenablage einfügen',
    imageGuide1Desc: 'Nach einem Screenshot (Win + Umschalt + S oder Cmd + Umschalt + 4) drücken Sie im Eingabefeld Strg + V (Mac: Cmd + V).',
    imageGuide1Result: 'Lädt automatisch hoch und fügt den Markdown-Bildlink ein',
    imageGuide2Badge: 'Methode 2',
    imageGuide2Title: 'Direktes Drag & Drop in das Feld',
    imageGuide2Desc: 'Ziehen Sie eine Bilddatei vom Explorer oder Desktop in das Kommentarfeld für automatischen Upload.',
    imageGuide3Badge: 'Methode 3',
    imageGuide3Title: 'Standard-Markdown-Bildsyntax',
    imageGuide3Desc: 'Wenn Sie bereits eine Bild-URL besitzen, nutzen Sie das Standardformat:',
    imageGuide3Sample: '![Beschreibung](https://...)',
    imageUrlLabel: 'Direkte Bild-URL (muss gültig sein):',
    imageUrlPlaceholder: 'https://img.epocanvas.com/file/... oder https://...',
    imageUrlAltPlaceholder: 'Kurze Bildbeschreibung eingeben...',
    imageExternalPreviewLabel: 'Externe Vorschau:',
    imageExternalPreviewAlt: 'Vorschau',
    imageDefaultAlt: 'Bild',
    uploadErrorType: 'Nur Bilddateien werden unterstützt (JPG, PNG, GIF, WebP, SVG, AVIF)',
    uploadErrorSize: 'Die Bilddatei überschreitet das Maximum von 10 MB',
    uploadErrorFailed: 'Bild-Upload fehlgeschlagen',
    uploadErrorNetwork: 'Netzwerkfehler beim Hochladen des Bildes',

    // Quotes
    quoteFromArticle: (articleTitle) => `Zitat aus „${articleTitle}“`,
    quoteEmptyPlaceholder: 'Kernargumente des Artikels diskutieren...',
    toastQuoteSelection: 'Ausgewählter Artikeltext zitiert',
    toastQuoteTip: '💡 Tipp: Markieren Sie Text im Artikel und wählen Sie per Rechtsklick „Im Kommentar zitieren“!',

    // All Toasts
    toastUploadingImage: 'Bild wird auf Telegram gehostet...',
    toastUploadFailed: (err) => `Upload fehlgeschlagen: ${err || 'Unbekannter Fehler'}`,
    toastUploadSuccess: 'Bild erfolgreich auf Telegram gespeichert!',
    toastClipboardDetected: 'Zwischenablagen-Bild erkannt, automatischer Upload zu Telegram...',
    toastClipboardSuccess: 'Zwischenablagen-Bild erfolgreich hochgeladen und eingefügt!',
    toastDragUploading: (name) => `Gezogenes Bild ${name} wird zu Telegram hochgeladen...`,
    toastDragSuccess: (name) => `Gezogenes Bild ${name} erfolgreich hochgeladen!`,
    toastUploadError: (err) => `Bild-Upload-Fehler: ${err || 'Zeitüberschreitung'}`,
    toastInsertedPoll: 'Interaktive Umfrage erfolgreich eingefügt',
    toastInsertedTable: 'Datentabelle erfolgreich eingefügt',
    toastInsertedDetails: 'Ausklappbarer Bereich erfolgreich eingefügt',
    toastInsertedSpoiler: 'Spoiler-Schutztext erfolgreich eingefügt',
    toastInsertedMath: 'LaTeX-Formel erfolgreich eingefügt',
    toastInsertedScroll: 'Scrollbarer Container erfolgreich eingefügt',
    toastInsertedCallout: 'Formatierte Hinweisbox erfolgreich eingefügt',
    toastInsertedToc: 'Inhaltsverzeichnis-Markierung erfolgreich eingefügt',
    toastInsertedMermaid: 'Mermaid-Diagramm erfolgreich eingefügt',
    toastInsertedChart: 'Build Chart-Diagramm erfolgreich eingefügt',
    toastInsertedGraphviz: 'Graphviz-Topologie erfolgreich eingefügt',
    toastInsertedDatetime: 'Datums- und Zeitstempel erfolgreich eingefügt',
    toastInsertedTemplate: 'Diskussionsvorlage erfolgreich eingefügt',
    toastInsertedFootnote: 'Fußnote erfolgreich eingefügt',
    toastImageMissing: 'Bitte Bild hochladen oder eine externe Bild-URL eingeben',
    toastInsertedImage: 'Bild erfolgreich eingefügt',
    toastQuotedSelection: 'Ausgewählter Artikeltext im Kommentar zitiert',
    toastCommentEmpty: 'Bitte Kommentarinhalt eingeben',
    toastCommentLimit: (limit) => `Kommentar darf ${limit} Zeichen nicht überschreiten`,
    toastCommentSuccess: 'Kommentar erfolgreich veröffentlicht!',
    toastCommentFailed: (err) => `Übermittlung fehlgeschlagen: ${err || 'Bitte erneut versuchen'}`,
    toastCommentNetworkError: 'Verbindungsfehler, bitte später erneut versuchen',
    toastBoostLimit: (limit) => `🚀 Boost-Antwort darf ${limit} Zeichen nicht überschreiten`,
    toastReplyBoostSuccess: '🚀 Boost-Antwort erfolgreich gesendet!',
    toastReplySuccess: 'Antwort erfolgreich gesendet!',
    toastReplyFailed: (err) => `Antwort fehlgeschlagen: ${err || 'Bitte erneut versuchen'}`,
    toastReplyNetworkError: 'Antwortfehler, bitte erneut versuchen',
    toastEditEmpty: 'Geänderter Inhalt darf nicht leer sein',
    toastEditSuccess: 'Kommentar erfolgreich aktualisiert!',
    toastEditFailed: (err) => `Aktualisierung fehlgeschlagen: ${err || 'Bitte erneut versuchen'}`,
    toastEditNetworkError: 'Fehler bei der Aktualisierungsanfrage',
    toastDeleteSuccess: 'Kommentar gelöscht',
    toastDeleteFailed: (err) => `Löschen fehlgeschlagen: ${err || 'Bitte erneut versuchen'}`,
    toastDeleteNetworkError: 'Fehler bei der Löschanfrage',
    toastVisitorLikeForbidden: '⚠️ Gäste können nicht reagieren. Bitte anmelden, um zu liken oder Reaktionen zu nutzen.',
    toastLikeFailed: (err) => `Reaktion fehlgeschlagen: ${err || 'Bitte erneut versuchen'}`,
    toastLikeNetworkError: 'Reaktionsfehler, bitte später erneut versuchen',

    geoRegionPrefix: 'Region: ',
    geoRealIpPrefix: ' (Echte IP: ',
    geoAdminPrivilege: 'Admin-Berechtigung: Echte IP anzeigen',
  },
};

export function getCommentTranslations(locale: LocaleVariant = 'zh-CN'): CommentTranslations {
  return COMMENTS_I18N[locale] || COMMENTS_I18N['zh-CN'];
}
