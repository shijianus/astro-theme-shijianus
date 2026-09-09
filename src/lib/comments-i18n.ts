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

  // Geo badge
  geoRegionPrefix: string;
  geoRealIpPrefix: string;
  geoAdminPrivilege: string;
}

export const COMMENTS_I18N: Record<LocaleVariant, CommentTranslations> = {
  'zh-CN': {
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
    normalToggleBoostTitle: '切换为 16 字快速火箭 Boost 回复',
    boostPlaceholder: (author) => `🚀 发表 16 字以内的 Boost 快速回复 @${author}...`,
    normalPlaceholder: (author) => `回复 @${author}...`,

    toolbarBold: '加粗 (Ctrl+B)',
    toolbarItalic: '斜体 (Ctrl+I)',
    toolbarHeading: '标题字号',
    toolbarQuote: '块引用',
    toolbarCode: '代码块 / 单行代码 (Ctrl+Shift+C)',
    toolbarList: '列表清单',
    toolbarDirection: '切换文本排版书写方向 (LTR / RTL)',
    toolbarDirectionToast: (dir) => `已切换排版方向为：${dir.toUpperCase()}`,
    toolbarEmoji: '插入表情',
    toolbarEmojiTitle: '常用表情 (点击插入)',
    toolbarImage: '插入图片 (支持本地上传、剪贴板粘贴与拖拽上传至 Telegram 图床)',
    toolbarImageAria: '插入图片',
    toolbarOptions: '高级选项：插入表格、目录、图表与各类交互组件',
    toolbarOptionsAria: '更多高级格式与插入选项',
    toolbarOptionsTitle: '高级选项与交互工具',

    optQuoteLabel: '引用贴文 (博文内容)',
    optQuoteDesc: '引用当前博文选中文段或核心论述',
    optTableLabel: '插入表格',
    optTableDesc: '可视化行列配置，生成规范数据表格',
    optTocLabel: '插入目录',
    optTocDesc: '自动生成当前评论的层级锚点导览',
    optDetailsLabel: '折叠详情',
    optDetailsDesc: '插入可展开/折叠的内容展示块',
    optSpoilerLabel: '防剧透条',
    optSpoilerDesc: '悬浮鼠标或点击才透出的隐藏文本',
    optMathLabel: '数学公式',
    optMathDesc: 'LaTeX 数学公式与方程排版支持',
    optScrollLabel: '横向滚动区块',
    optScrollDesc: '容纳超宽表格、宽图或长行文本',
    optCalloutLabel: '高亮提示框',
    optCalloutDesc: '包含 Note、Tip、Warning 等 5 种通知样式的警示框',
    optMermaidLabel: 'Mermaid 图表',
    optMermaidDesc: '支持流程图、时序图、甘特图等多种图表',
    optChartLabel: 'Chart 图表生成器',
    optChartDesc: '可视化配置折线图、柱状图、饼图数据',
    optGraphvizLabel: 'Graphviz 拓扑图',
    optGraphvizDesc: '通过 DOT 语言绘制网络与系统拓扑',
    optDatetimeLabel: '时间与倒计时',
    optDatetimeDesc: '插入格式化时间戳或动态倒计时组件',
    optTemplateLabel: '评论模板库',
    optTemplateDesc: '预设多种高频讨论、Bug 报告与反馈格式',
    optFootnoteLabel: '添加脚注标注',
    optFootnoteDesc: '在文末生成引文来源与注解索引',
    optPollLabel: '插入投票组件',
    optPollDesc: '发起单选或多选读者意见调研',

    modalInsert: '插入',
    modalConfirm: '确定',
    modalCancel: '取消',
    modalClose: '关闭',
    modalTableTitle: '插入数据表格',
    modalTocTitle: '插入评论目录导览',
    modalDetailsTitle: '插入折叠详情块',
    modalSpoilerTitle: '插入防剧透遮罩文本',
    modalMathTitle: '插入 LaTeX 数学公式',
    modalScrollTitle: '插入横向滚动区块',
    modalCalloutTitle: '插入高亮警示提示框',
    modalMermaidTitle: '插入 Mermaid 架构图',
    modalChartTitle: '插入可视化 Chart 图表',
    modalGraphvizTitle: '插入 Graphviz 拓扑图',
    modalDatetimeTitle: '插入动态时间与倒计时',
    modalTemplateTitle: '应用评论讨论模板',
    modalFootnoteTitle: '添加脚注与引文索引',
    modalPollTitle: '创建读者交互式投票',
    modalImageTitle: '插入图片与图床配置',

    geoRegionPrefix: '来源地区: ',
    geoRealIpPrefix: ' (真实IP: ',
    geoAdminPrivilege: '博主管理特权：查看真实IP',
  },

  'zh-Hant': {
    publicComments: '公開評論',
    sortNew: '⏱️ 最新',
    sortHot: '🔥 最熱',
    loadingComments: '正在載入評論...',
    pinnedBadge: '置頂',
    bloggerBadge: '博主',
    visitorBadge: '訪客',

    likeAria: '點讚或長按互動',
    likeTitleEmpty: '點讚 (長按可選擇更多表情)',
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

    viewReplies: (count) => `查看 ${count} 條回覆`,
    collapseReplies: (count) => `收起 ${count} 條回覆`,

    mainPlaceholder: (postTitle) => `圍繞《${postTitle}》發表公開評論... (支援 Markdown 排版、圖片快捷貼上與拖拽上傳)`,
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
    normalToggleBoostTitle: '切換為 16 字快速火箭 Boost 回覆',
    boostPlaceholder: (author) => `🚀 發表 16 字以內的 Boost 快速回覆 @${author}...`,
    normalPlaceholder: (author) => `回覆 @${author}...`,

    toolbarBold: '粗體 (Ctrl+B)',
    toolbarItalic: '斜體 (Ctrl+I)',
    toolbarHeading: '標題字級',
    toolbarQuote: '引用區塊',
    toolbarCode: '程式碼區塊 / 行內代碼 (Ctrl+Shift+C)',
    toolbarList: '列表清單',
    toolbarDirection: '切換文本排版書寫方向 (LTR / RTL)',
    toolbarDirectionToast: (dir) => `已切換排版方向為：${dir.toUpperCase()}`,
    toolbarEmoji: '插入表情',
    toolbarEmojiTitle: '常用表情 (點擊插入)',
    toolbarImage: '插入圖片 (支援本地上傳、剪貼簿貼上與拖拽上傳至 Telegram 圖床)',
    toolbarImageAria: '插入圖片',
    toolbarOptions: '進階選項：插入表格、目錄、圖表與各類互動元件',
    toolbarOptionsAria: '更多進階格式與插入選項',
    toolbarOptionsTitle: '進階選項與互動工具',

    optQuoteLabel: '引用貼文 (博文內容)',
    optQuoteDesc: '引用當前博文選中文段或核心論述',
    optTableLabel: '插入表格',
    optTableDesc: '可視化行列配置，生成規範數據表格',
    optTocLabel: '插入目錄',
    optTocDesc: '自動生成當前評論的層級錨點導覽',
    optDetailsLabel: '摺疊詳情',
    optDetailsDesc: '插入可展開/摺疊的內容展示區塊',
    optSpoilerLabel: '防爆雷條',
    optSpoilerDesc: '懸浮滑鼠或點擊才透出的隱藏文字',
    optMathLabel: '數學公式',
    optMathDesc: 'LaTeX 數學公式與方程式排版支援',
    optScrollLabel: '橫向滾動區塊',
    optScrollDesc: '容納超寬表格、寬圖或長行文字',
    optCalloutLabel: '高亮提示框',
    optCalloutDesc: '包含 Note、Tip、Warning 等 5 種通知樣式的提示框',
    optMermaidLabel: 'Mermaid 圖表',
    optMermaidDesc: '支援流程圖、時序圖、甘特圖等多種圖表',
    optChartLabel: 'Chart 圖表產生器',
    optChartDesc: '可視化配置折線圖、柱狀圖、圓餅圖數據',
    optGraphvizLabel: 'Graphviz 拓撲圖',
    optGraphvizDesc: '透過 DOT 語言繪製網路與系統拓撲',
    optDatetimeLabel: '時間與倒數計時',
    optDatetimeDesc: '插入格式化時間戳記或動態倒數元件',
    optTemplateLabel: '評論範本庫',
    optTemplateDesc: '預設多種高頻討論、Bug 回報與反饋格式',
    optFootnoteLabel: '添加註腳標註',
    optFootnoteDesc: '在文末生成引文來源與註解索引',
    optPollLabel: '插入投票元件',
    optPollDesc: '發起單選或多選讀者意見調研',

    modalInsert: '插入',
    modalConfirm: '確定',
    modalCancel: '取消',
    modalClose: '關閉',
    modalTableTitle: '插入數據表格',
    modalTocTitle: '插入評論目錄導覽',
    modalDetailsTitle: '插入摺疊詳情區塊',
    modalSpoilerTitle: '插入防爆雷遮罩文字',
    modalMathTitle: '插入 LaTeX 數學公式',
    modalScrollTitle: '插入橫向滾動區塊',
    modalCalloutTitle: '插入高亮警示提示框',
    modalMermaidTitle: '插入 Mermaid 架構圖',
    modalChartTitle: '插入可視化 Chart 圖表',
    modalGraphvizTitle: '插入 Graphviz 拓撲圖',
    modalDatetimeTitle: '插入動態時間與倒數',
    modalTemplateTitle: '套用評論討論範本',
    modalFootnoteTitle: '添加註腳與引文索引',
    modalPollTitle: '建立讀者互動式投票',
    modalImageTitle: '插入圖片與圖床配置',

    geoRegionPrefix: '來源地區: ',
    geoRealIpPrefix: ' (真實IP: ',
    geoAdminPrivilege: '博主管理特權：查看真實IP',
  },

  'en': {
    publicComments: 'Public Comments',
    sortNew: '⏱️ Latest',
    sortHot: '🔥 Hot',
    loadingComments: 'Loading comments...',
    pinnedBadge: 'Pinned',
    bloggerBadge: 'Author',
    visitorBadge: 'Guest',

    likeAria: 'Like or long press to react',
    likeTitleEmpty: 'Like (long press for more reactions)',
    likeTitleWithCount: (entriesStr) => `Reactions: ${entriesStr} (long press to switch emoji)`,
    reactionPickerTitle: 'Choose reaction:',
    replyCommentAria: 'Reply to this comment',
    replyCommentTitle: 'Reply to this comment',
    replyToUserAria: (author) => `Reply to @${author}`,
    replyToUserTitle: (author) => `Reply to @${author}`,
    boostActionAria: 'Send Rocket Boost quick reply (≤16 chars)',
    boostActionTitle: 'Send Rocket Boost quick reply (≤16 chars)',
    quoteActionAria: 'Quote this comment',
    quoteActionTitle: 'Quote this comment',
    editActionAria: 'Edit this comment',
    editActionTitle: 'Edit this comment',
    deleteActionAria: 'Delete this comment',
    deleteActionTitle: 'Delete this comment',
    expandText: '...Read full text',
    collapseText: 'Collapse',

    viewReplies: (count) => `View ${count} ${count === 1 ? 'reply' : 'replies'}`,
    collapseReplies: (count) => `Collapse ${count} ${count === 1 ? 'reply' : 'replies'}`,

    mainPlaceholder: (postTitle) => `Join the discussion on "${postTitle}"... (Supports Markdown, paste & drag-and-drop images)`,
    previewBadge: 'Rendered Preview',
    previewEmpty: 'No content to preview. Type Markdown text in "Edit" mode.',
    cancelBtn: 'Cancel',
    sendBtn: 'Send',
    sendingBtn: 'Sending...',
    replyBtn: 'Reply',

    boostModeBadge: 'Rocket Boost Mode (≤16 chars)',
    boostToggleNormal: 'Switch to regular reply',
    boostToggleNormalTitle: 'Switch back to standard 500-char reply',
    normalReplyTo: (author) => `Reply @${author}`,
    normalToggleBoost: 'Switch to Boost (≤16 chars)',
    normalToggleBoostTitle: 'Switch to 16-char fast Rocket Boost reply',
    boostPlaceholder: (author) => `🚀 Send Boost quick reply to @${author} (≤16 chars)...`,
    normalPlaceholder: (author) => `Reply to @${author}...`,

    toolbarBold: 'Bold (Ctrl+B)',
    toolbarItalic: 'Italic (Ctrl+I)',
    toolbarHeading: 'Heading Size',
    toolbarQuote: 'Blockquote',
    toolbarCode: 'Code Block / Inline Code (Ctrl+Shift+C)',
    toolbarList: 'Bullet List',
    toolbarDirection: 'Toggle Text Direction (LTR / RTL)',
    toolbarDirectionToast: (dir) => `Layout direction switched to: ${dir.toUpperCase()}`,
    toolbarEmoji: 'Insert Emoji',
    toolbarEmojiTitle: 'Common Emojis (Click to insert)',
    toolbarImage: 'Insert Image (Supports upload, paste and drag-and-drop)',
    toolbarImageAria: 'Insert Image',
    toolbarOptions: 'Advanced Options: Tables, TOC, Diagrams & Interactive Widgets',
    toolbarOptionsAria: 'More formatting and insertion options',
    toolbarOptionsTitle: 'Advanced Options & Widgets',

    optQuoteLabel: 'Quote Post Content',
    optQuoteDesc: 'Quote selected text or key insights from the article',
    optTableLabel: 'Insert Table',
    optTableDesc: 'Visually configure rows & columns for data tables',
    optTocLabel: 'Insert TOC',
    optTocDesc: 'Generate anchor navigation for long comments',
    optDetailsLabel: 'Collapsible Details',
    optDetailsDesc: 'Insert an expandable/collapsible spoiler section',
    optSpoilerLabel: 'Spoiler Mask',
    optSpoilerDesc: 'Hidden text revealed only on hover or click',
    optMathLabel: 'Math Formula',
    optMathDesc: 'LaTeX mathematical formulas and equations',
    optScrollLabel: 'Horizontal Scroll Box',
    optScrollDesc: 'Container for extra-wide tables, code or long text',
    optCalloutLabel: 'Callout Alert Box',
    optCalloutDesc: 'Alert banners with Note, Tip, Warning and other styles',
    optMermaidLabel: 'Mermaid Diagram',
    optMermaidDesc: 'Render flowcharts, sequence diagrams, and timelines',
    optChartLabel: 'Chart Generator',
    optChartDesc: 'Visual bar, line, and pie chart configurations',
    optGraphvizLabel: 'Graphviz Topology',
    optGraphvizDesc: 'Draw network and dependency graphs via DOT syntax',
    optDatetimeLabel: 'Date & Countdown',
    optDatetimeDesc: 'Insert formatted timestamps or live countdown badges',
    optTemplateLabel: 'Comment Templates',
    optTemplateDesc: 'Quick templates for discussions, bug reports and feedback',
    optFootnoteLabel: 'Add Footnote',
    optFootnoteDesc: 'Create citations and reference notes at the bottom',
    optPollLabel: 'Interactive Poll',
    optPollDesc: 'Launch a single or multiple-choice reader poll',

    modalInsert: 'Insert',
    modalConfirm: 'Confirm',
    modalCancel: 'Cancel',
    modalClose: 'Close',
    modalTableTitle: 'Insert Markdown Table',
    modalTocTitle: 'Insert Comment TOC Navigation',
    modalDetailsTitle: 'Insert Collapsible Section',
    modalSpoilerTitle: 'Insert Spoiler Mask',
    modalMathTitle: 'Insert LaTeX Math Formula',
    modalScrollTitle: 'Insert Horizontal Scroll Container',
    modalCalloutTitle: 'Insert Callout Alert Box',
    modalMermaidTitle: 'Insert Mermaid Architecture Diagram',
    modalChartTitle: 'Insert Data Chart',
    modalGraphvizTitle: 'Insert Graphviz Diagram',
    modalDatetimeTitle: 'Insert Timestamp & Countdown',
    modalTemplateTitle: 'Apply Comment Template',
    modalFootnoteTitle: 'Add Footnote & Citation',
    modalPollTitle: 'Create Interactive Poll',
    modalImageTitle: 'Insert Image & Media',

    geoRegionPrefix: 'Region: ',
    geoRealIpPrefix: ' (Real IP: ',
    geoAdminPrivilege: 'Admin privilege: view real IP',
  },

  'fr': {
    publicComments: 'Commentaires publics',
    sortNew: '⏱️ Récents',
    sortHot: '🔥 Populaires',
    loadingComments: 'Chargement des commentaires...',
    pinnedBadge: 'Épinglé',
    bloggerBadge: 'Auteur',
    visitorBadge: 'Visiteur',

    likeAria: 'Aimer ou appui long pour réagir',
    likeTitleEmpty: 'Aimer (appui long pour plus de réactions)',
    likeTitleWithCount: (entriesStr) => `Réactions: ${entriesStr} (appui long pour changer)`,
    reactionPickerTitle: 'Choisir une réaction :',
    replyCommentAria: 'Répondre à ce commentaire',
    replyCommentTitle: 'Répondre à ce commentaire',
    replyToUserAria: (author) => `Répondre à @${author}`,
    replyToUserTitle: (author) => `Répondre à @${author}`,
    boostActionAria: 'Envoyer une réponse rapide Boost (≤16 car.)',
    boostActionTitle: 'Envoyer une réponse rapide Boost (≤16 car.)',
    quoteActionAria: 'Citer ce commentaire',
    quoteActionTitle: 'Citer ce commentaire',
    editActionAria: 'Modifier ce commentaire',
    editActionTitle: 'Modifier ce commentaire',
    deleteActionAria: 'Supprimer ce commentaire',
    deleteActionTitle: 'Supprimer ce commentaire',
    expandText: '...Lire la suite',
    collapseText: 'Réduire',

    viewReplies: (count) => `Afficher ${count} ${count === 1 ? 'réponse' : 'réponses'}`,
    collapseReplies: (count) => `Masquer ${count} ${count === 1 ? 'réponse' : 'réponses'}`,

    mainPlaceholder: (postTitle) => `Participez à la discussion sur « ${postTitle} »... (Supporte Markdown, copier-coller et glisser-déposer d'images)`,
    previewBadge: 'Aperçu du rendu',
    previewEmpty: 'Aucun contenu à prévisualiser. Saisissez du texte Markdown en mode « Édition ».',
    cancelBtn: 'Annuler',
    sendBtn: 'Envoyer',
    sendingBtn: 'Envoi en cours...',
    replyBtn: 'Répondre',

    boostModeBadge: 'Mode Boost Rapide (≤16 car.)',
    boostToggleNormal: 'Passer en réponse normale',
    boostToggleNormalTitle: 'Revenir à la réponse classique de 500 caractères',
    normalReplyTo: (author) => `Répondre à @${author}`,
    normalToggleBoost: 'Passer en Boost (≤16 car.)',
    normalToggleBoostTitle: 'Passer à la réponse ultra-rapide Boost de 16 caractères',
    boostPlaceholder: (author) => `🚀 Réponse rapide Boost à @${author} (≤16 car.)...`,
    normalPlaceholder: (author) => `Répondre à @${author}...`,

    toolbarBold: 'Gras (Ctrl+B)',
    toolbarItalic: 'Italique (Ctrl+I)',
    toolbarHeading: 'Taille de titre',
    toolbarQuote: 'Citation en bloc',
    toolbarCode: 'Bloc de code / En ligne (Ctrl+Shift+C)',
    toolbarList: 'Liste à puces',
    toolbarDirection: 'Changer le sens d’écriture (LTR / RTL)',
    toolbarDirectionToast: (dir) => `Sens d'écriture basculé en : ${dir.toUpperCase()}`,
    toolbarEmoji: 'Insérer un emoji',
    toolbarEmojiTitle: 'Emojis courants (Cliquer pour insérer)',
    toolbarImage: 'Insérer une image (Glisser-déposer et copier-coller supportés)',
    toolbarImageAria: 'Insérer une image',
    toolbarOptions: 'Options avancées : Tableaux, Sommaire, Graphiques & Widgets',
    toolbarOptionsAria: 'Plus d’options avancées et d’insertion',
    toolbarOptionsTitle: 'Options avancées et widgets interactifs',

    optQuoteLabel: 'Citer le contenu de l’article',
    optQuoteDesc: 'Citer le texte sélectionné ou les arguments clés',
    optTableLabel: 'Insérer un tableau',
    optTableDesc: 'Configurer visuellement les lignes et colonnes de données',
    optTocLabel: 'Insérer un sommaire',
    optTocDesc: 'Générer un guide d’ancres pour longs commentaires',
    optDetailsLabel: 'Détails déroulants',
    optDetailsDesc: 'Insérer un bloc pliable et dépliable',
    optSpoilerLabel: 'Masque anti-spoil',
    optSpoilerDesc: 'Texte masqué révélé uniquement au survol ou au clic',
    optMathLabel: 'Formule mathématique',
    optMathDesc: 'Support LaTeX pour équations et formules mathématiques',
    optScrollLabel: 'Boîte à défilement horizontal',
    optScrollDesc: 'Conteneur pour tableaux très larges ou longs codes',
    optCalloutLabel: 'Boîte d’alerte stylisée',
    optCalloutDesc: 'Bannières d’alerte : Note, Conseil, Attention, etc.',
    optMermaidLabel: 'Diagramme Mermaid',
    optMermaidDesc: 'Créer organigrammes, diagrammes de séquence et plannings',
    optChartLabel: 'Générateur de graphiques',
    optChartDesc: 'Graphiques interactifs en barres, lignes et secteurs',
    optGraphvizLabel: 'Topologie Graphviz',
    optGraphvizDesc: 'Visualiser des topologies réseau via le langage DOT',
    optDatetimeLabel: 'Date et compte à rebours',
    optDatetimeDesc: 'Insérer une date formatée ou un compte à rebours dynamique',
    optTemplateLabel: 'Modèles de commentaires',
    optTemplateDesc: 'Formats types pour discussions, bugs et retours',
    optFootnoteLabel: 'Ajouter une note de bas de page',
    optFootnoteDesc: 'Créer citations et renvois bibliographiques',
    optPollLabel: 'Sondage interactif',
    optPollDesc: 'Lancer une enquête d’opinion auprès des lecteurs',

    modalInsert: 'Insérer',
    modalConfirm: 'Confirmer',
    modalCancel: 'Annuler',
    modalClose: 'Fermer',
    modalTableTitle: 'Insérer un tableau Markdown',
    modalTocTitle: 'Insérer un sommaire interactif',
    modalDetailsTitle: 'Insérer une section déroulante',
    modalSpoilerTitle: 'Insérer un texte anti-spoil',
    modalMathTitle: 'Insérer une formule LaTeX',
    modalScrollTitle: 'Insérer un conteneur à défilement horizontal',
    modalCalloutTitle: 'Insérer une boîte d’alerte',
    modalMermaidTitle: 'Insérer un diagramme Mermaid',
    modalChartTitle: 'Insérer un graphique de données',
    modalGraphvizTitle: 'Insérer un graphe Graphviz',
    modalDatetimeTitle: 'Insérer horodatage et décompte',
    modalTemplateTitle: 'Appliquer un modèle de commentaire',
    modalFootnoteTitle: 'Ajouter une note et citation',
    modalPollTitle: 'Créer un sondage interactif',
    modalImageTitle: 'Insérer une image',

    geoRegionPrefix: 'Région : ',
    geoRealIpPrefix: ' (IP réelle : ',
    geoAdminPrivilege: 'Privilège admin : voir l’IP réelle',
  },

  'es': {
    publicComments: 'Comentarios públicos',
    sortNew: '⏱️ Más recientes',
    sortHot: '🔥 Populares',
    loadingComments: 'Cargando comentarios...',
    pinnedBadge: 'Fijado',
    bloggerBadge: 'Autor',
    visitorBadge: 'Visitante',

    likeAria: 'Me gusta o mantener pulsado para reaccionar',
    likeTitleEmpty: 'Me gusta (mantén pulsado para más reacciones)',
    likeTitleWithCount: (entriesStr) => `Reacciones: ${entriesStr} (mantén pulsado para cambiar)`,
    reactionPickerTitle: 'Elige una reacción:',
    replyCommentAria: 'Responder a este comentario',
    replyCommentTitle: 'Responder a este comentario',
    replyToUserAria: (author) => `Responder a @${author}`,
    replyToUserTitle: (author) => `Responder a @${author}`,
    boostActionAria: 'Enviar respuesta rápida Boost (≤16 car.)',
    boostActionTitle: 'Enviar respuesta rápida Boost (≤16 car.)',
    quoteActionAria: 'Citar este comentario',
    quoteActionTitle: 'Citar este comentario',
    editActionAria: 'Editar este comentario',
    editActionTitle: 'Editar este comentario',
    deleteActionAria: 'Eliminar este comentario',
    deleteActionTitle: 'Eliminar este comentario',
    expandText: '...Leer completo',
    collapseText: 'Plegar',

    viewReplies: (count) => `Ver ${count} ${count === 1 ? 'respuesta' : 'respuestas'}`,
    collapseReplies: (count) => `Ocultar ${count} ${count === 1 ? 'respuesta' : 'respuestas'}`,

    mainPlaceholder: (postTitle) => `Únete a la conversación sobre «${postTitle}»... (Soporta Markdown, pegar y arrastrar imágenes)`,
    previewBadge: 'Vista previa renderizada',
    previewEmpty: 'No hay contenido para previsualizar. Escribe texto Markdown en modo "Editar".',
    cancelBtn: 'Cancelar',
    sendBtn: 'Enviar',
    sendingBtn: 'Enviando...',
    replyBtn: 'Responder',

    boostModeBadge: 'Modo Boost Rápido (≤16 car.)',
    boostToggleNormal: 'Cambiar a respuesta normal',
    boostToggleNormalTitle: 'Volver a respuesta estándar de 500 caracteres',
    normalReplyTo: (author) => `Responder a @${author}`,
    normalToggleBoost: 'Cambiar a Boost (≤16 car.)',
    normalToggleBoostTitle: 'Cambiar a respuesta exprés de 16 caracteres',
    boostPlaceholder: (author) => `🚀 Respuesta rápida Boost a @${author} (≤16 car.)...`,
    normalPlaceholder: (author) => `Responder a @${author}...`,

    toolbarBold: 'Negrita (Ctrl+B)',
    toolbarItalic: 'Cursiva (Ctrl+I)',
    toolbarHeading: 'Tamaño de encabezado',
    toolbarQuote: 'Cita en bloque',
    toolbarCode: 'Bloque de código / En línea (Ctrl+Shift+C)',
    toolbarList: 'Lista con viñetas',
    toolbarDirection: 'Cambiar dirección de escritura (LTR / RTL)',
    toolbarDirectionToast: (dir) => `Dirección cambiada a: ${dir.toUpperCase()}`,
    toolbarEmoji: 'Insertar emoji',
    toolbarEmojiTitle: 'Emojis frecuentes (Clic para insertar)',
    toolbarImage: 'Insertar imagen (Arrastra, pega o sube archivos)',
    toolbarImageAria: 'Insertar imagen',
    toolbarOptions: 'Opciones avanzadas: Tablas, Índice, Gráficos y Widgets',
    toolbarOptionsAria: 'Más opciones avanzadas de formato',
    toolbarOptionsTitle: 'Opciones avanzadas y herramientas interactivas',

    optQuoteLabel: 'Citar contenido del artículo',
    optQuoteDesc: 'Citar fragmentos seleccionados o reflexiones clave',
    optTableLabel: 'Insertar tabla',
    optTableDesc: 'Configuración visual de filas y columnas de datos',
    optTocLabel: 'Insertar índice',
    optTocDesc: 'Generar navegación por anclajes para comentarios extensos',
    optDetailsLabel: 'Detalles desplegables',
    optDetailsDesc: 'Insertar bloque plegable y expandible',
    optSpoilerLabel: 'Texto anti-spoiler',
    optSpoilerDesc: 'Texto oculto revelado al pasar el ratón o hacer clic',
    optMathLabel: 'Fórmula matemática',
    optMathDesc: 'Soporte LaTeX para fórmulas y ecuaciones',
    optScrollLabel: 'Bloque de scroll horizontal',
    optScrollDesc: 'Contenedor para tablas muy anchas o códigos extensos',
    optCalloutLabel: 'Cuadro de alerta destacado',
    optCalloutDesc: 'Banners de aviso: Nota, Consejo, Advertencia, etc.',
    optMermaidLabel: 'Diagrama Mermaid',
    optMermaidDesc: 'Crear diagramas de flujo, secuencia y cronogramas',
    optChartLabel: 'Generador de gráficos',
    optChartDesc: 'Configuración interactiva de barras, líneas y sectores',
    optGraphvizLabel: 'Topología Graphviz',
    optGraphvizDesc: 'Graficar redes y dependencias mediante lenguaje DOT',
    optDatetimeLabel: 'Fecha y cuenta regresiva',
    optDatetimeDesc: 'Insertar fecha formateada o contador dinámico',
    optTemplateLabel: 'Plantillas de comentarios',
    optTemplateDesc: 'Formatos predefinidos para debate, bugs y sugerencias',
    optFootnoteLabel: 'Añadir nota al pie',
    optFootnoteDesc: 'Crear citas y referencias al final del texto',
    optPollLabel: 'Encuesta interactiva',
    optPollDesc: 'Iniciar sondeo de opción simple o múltiple',

    modalInsert: 'Insertar',
    modalConfirm: 'Confirmar',
    modalCancel: 'Cancelar',
    modalClose: 'Cerrar',
    modalTableTitle: 'Insertar tabla Markdown',
    modalTocTitle: 'Insertar índice de navegación',
    modalDetailsTitle: 'Insertar bloque desplegable',
    modalSpoilerTitle: 'Insertar texto anti-spoiler',
    modalMathTitle: 'Insertar fórmula LaTeX',
    modalScrollTitle: 'Insertar contenedor de scroll horizontal',
    modalCalloutTitle: 'Insertar cuadro de aviso',
    modalMermaidTitle: 'Insertar diagrama Mermaid',
    modalChartTitle: 'Insertar gráfico interactivo',
    modalGraphvizTitle: 'Insertar topología Graphviz',
    modalDatetimeTitle: 'Insertar fecha o temporizador',
    modalTemplateTitle: 'Aplicar plantilla de comentario',
    modalFootnoteTitle: 'Añadir nota al pie y referencia',
    modalPollTitle: 'Crear encuesta interactiva',
    modalImageTitle: 'Insertar imagen',

    geoRegionPrefix: 'Región: ',
    geoRealIpPrefix: ' (IP real: ',
    geoAdminPrivilege: 'Privilegio de admin: ver IP real',
  },

  'de': {
    publicComments: 'Öffentliche Kommentare',
    sortNew: '⏱️ Neueste',
    sortHot: '🔥 Beliebteste',
    loadingComments: 'Kommentare werden geladen...',
    pinnedBadge: 'Angeheftet',
    bloggerBadge: 'Autor',
    visitorBadge: 'Gast',

    likeAria: 'Gefällt mir oder lange drücken zum Reagieren',
    likeTitleEmpty: 'Gefällt mir (lange drücken für mehr Reaktionen)',
    likeTitleWithCount: (entriesStr) => `Reaktionen: ${entriesStr} (lange drücken zum Wechseln)`,
    reactionPickerTitle: 'Reaktion wählen:',
    replyCommentAria: 'Auf diesen Kommentar antworten',
    replyCommentTitle: 'Auf diesen Kommentar antworten',
    replyToUserAria: (author) => `Antworten an @${author}`,
    replyToUserTitle: (author) => `Antworten an @${author}`,
    boostActionAria: 'Schnelle Boost-Antwort senden (≤16 Zeichen)',
    boostActionTitle: 'Schnelle Boost-Antwort senden (≤16 Zeichen)',
    quoteActionAria: 'Diesen Kommentar zitieren',
    quoteActionTitle: 'Diesen Kommentar zitieren',
    editActionAria: 'Diesen Kommentar bearbeiten',
    editActionTitle: 'Diesen Kommentar bearbeiten',
    deleteActionAria: 'Diesen Kommentar löschen',
    deleteActionTitle: 'Diesen Kommentar löschen',
    expandText: '...Vollständig lesen',
    collapseText: 'Einklappen',

    viewReplies: (count) => `${count} ${count === 1 ? 'Antwort' : 'Antworten'} anzeigen`,
    collapseReplies: (count) => `${count} ${count === 1 ? 'Antwort' : 'Antworten'} einklappen`,

    mainPlaceholder: (postTitle) => `Diskutieren Sie über „${postTitle}“... (Unterstützt Markdown, Einfügen und Drag-and-Drop von Bildern)`,
    previewBadge: 'Gerenderte Vorschau',
    previewEmpty: 'Kein Inhalt zur Vorschau vorhanden. Geben Sie Markdown-Text im Modus „Bearbeiten“ ein.',
    cancelBtn: 'Abbrechen',
    sendBtn: 'Senden',
    sendingBtn: 'Wird gesendet...',
    replyBtn: 'Antworten',

    boostModeBadge: 'Raketen-Boost-Modus (≤16 Zeichen)',
    boostToggleNormal: 'Zu normaler Antwort wechseln',
    boostToggleNormalTitle: 'Zurück zur normalen 500-Zeichen-Antwort',
    normalReplyTo: (author) => `Antworten an @${author}`,
    normalToggleBoost: 'Zu Boost wechseln (≤16 Zeichen)',
    normalToggleBoostTitle: 'Zu schneller 16-Zeichen-Boost-Antwort wechseln',
    boostPlaceholder: (author) => `🚀 Schnelle Boost-Antwort an @${author} (≤16 Zeichen)...`,
    normalPlaceholder: (author) => `Antworten an @${author}...`,

    toolbarBold: 'Fett (Ctrl+B)',
    toolbarItalic: 'Kursiv (Ctrl+I)',
    toolbarHeading: 'Überschriften-Größe',
    toolbarQuote: 'Blockzitat',
    toolbarCode: 'Codeblock / Inline-Code (Ctrl+Shift+C)',
    toolbarList: 'Aufzählungsliste',
    toolbarDirection: 'Schreibrichtung umschalten (LTR / RTL)',
    toolbarDirectionToast: (dir) => `Schreibrichtung geändert zu: ${dir.toUpperCase()}`,
    toolbarEmoji: 'Emoji einfügen',
    toolbarEmojiTitle: 'Häufige Emojis (Zum Einfügen klicken)',
    toolbarImage: 'Bild einfügen (Drag & Drop und Einfügen unterstützt)',
    toolbarImageAria: 'Bild einfügen',
    toolbarOptions: 'Erweiterte Optionen: Tabellen, Inhaltsverzeichnis, Diagramme & Widgets',
    toolbarOptionsAria: 'Weitere Formatierungs- und Einfügeoptionen',
    toolbarOptionsTitle: 'Erweiterte Optionen & interaktive Werkzeuge',

    optQuoteLabel: 'Artikeltext zitieren',
    optQuoteDesc: 'Ausgewählten Text oder Kernaussagen des Artikels zitieren',
    optTableLabel: 'Tabelle einfügen',
    optTableDesc: 'Zeilen und Spalten visuell für Datentabellen konfigurieren',
    optTocLabel: 'Inhaltsverzeichnis einfügen',
    optTocDesc: 'Sprungmarken-Navigation für lange Kommentare erzeugen',
    optDetailsLabel: 'Ausklappbare Details',
    optDetailsDesc: 'Einen ein- und ausklappbaren Block einfügen',
    optSpoilerLabel: 'Spoiler-Schutz',
    optSpoilerDesc: 'Verborgener Text, der bei Hover oder Klick sichtbar wird',
    optMathLabel: 'Mathematische Formel',
    optMathDesc: 'LaTeX-Unterstützung für Formeln und Gleichungen',
    optScrollLabel: 'Horizontale Scrollbox',
    optScrollDesc: 'Container für überbreite Tabellen oder langen Code',
    optCalloutLabel: 'Hinweisbox',
    optCalloutDesc: 'Hinweis-Banner mit Notiz, Tipp, Warnung und mehr',
    optMermaidLabel: 'Mermaid-Diagramm',
    optMermaidDesc: 'Flussdiagramme, Sequenzdiagramme und Zeitpläne erstellen',
    optChartLabel: 'Diagramm-Generator',
    optChartDesc: 'Visuelle Balken-, Linien- und Tortendiagramme erstellen',
    optGraphvizLabel: 'Graphviz-Topologie',
    optGraphvizDesc: 'Netzwerk- und Systemgraphen via DOT-Syntax darstellen',
    optDatetimeLabel: 'Zeit & Countdown',
    optDatetimeDesc: 'Formatierten Zeitstempel oder Live-Countdown einfügen',
    optTemplateLabel: 'Kommentarvorlagen',
    optTemplateDesc: 'Vorlagen für Diskussionen, Fehlerberichte und Feedback',
    optFootnoteLabel: 'Fußnote hinzufügen',
    optFootnoteDesc: 'Zitate und Quellenverweise am Ende des Kommentars erzeugen',
    optPollLabel: 'Interaktive Umfrage',
    optPollDesc: 'Single- oder Multiple-Choice-Umfrage unter Lesern starten',

    modalInsert: 'Einfügen',
    modalConfirm: 'Bestätigen',
    modalCancel: 'Abbrechen',
    modalClose: 'Schließen',
    modalTableTitle: 'Markdown-Tabelle einfügen',
    modalTocTitle: 'Kommentar-Inhaltsverzeichnis einfügen',
    modalDetailsTitle: 'Ausklappbaren Bereich einfügen',
    modalSpoilerTitle: 'Spoiler-Schutztext einfügen',
    modalMathTitle: 'LaTeX-Formel einfügen',
    modalScrollTitle: 'Horizontalen Scroll-Container einfügen',
    modalCalloutTitle: 'Hinweisbox einfügen',
    modalMermaidTitle: 'Mermaid-Architekturdiagramm einfügen',
    modalChartTitle: 'Datendiagramm einfügen',
    modalGraphvizTitle: 'Graphviz-Diagramm einfügen',
    modalDatetimeTitle: 'Zeitstempel und Countdown einfügen',
    modalTemplateTitle: 'Kommentarvorlage anwenden',
    modalFootnoteTitle: 'Fußnote und Zitat hinzufügen',
    modalPollTitle: 'Interaktive Umfrage erstellen',
    modalImageTitle: 'Bild und Medien einfügen',

    geoRegionPrefix: 'Region: ',
    geoRealIpPrefix: ' (Echte IP: ',
    geoAdminPrivilege: 'Admin-Berechtigung: Echte IP anzeigen',
  },
};

export function getCommentTranslations(locale: LocaleVariant = 'zh-CN'): CommentTranslations {
  return COMMENTS_I18N[locale] || COMMENTS_I18N['zh-CN'];
}
