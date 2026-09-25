import {
  type SupportedLocale,
  type LocaleVariant,
  SUPPORTED_LOCALES,
  LOCALE_VARIANT_KEY,
  MANUAL_LOCALE_KEY,
  ensureUserPersona,
  normaliseLocale,
  updateCandidatePairWithManualChoice,
} from './user-persona.ts';
import { aboutI18nDictionary } from '../config/about';

export type { SupportedLocale, LocaleVariant };
export { SUPPORTED_LOCALES, LOCALE_VARIANT_KEY, MANUAL_LOCALE_KEY };

export interface LocaleMetadata {
  code: LocaleVariant;
  nativeName: string;
  englishName: string;
  badge: string;
  flag: string;
}

export const LOCALE_METADATA: Record<LocaleVariant, LocaleMetadata> = {
  'zh-CN': { code: 'zh-CN', nativeName: '简体中文', englishName: 'Simplified Chinese', badge: '简', flag: '🇨🇳' },
  'zh-Hant': { code: 'zh-Hant', nativeName: '繁體中文', englishName: 'Traditional Chinese', badge: '繁', flag: '🇭🇰' },
  en: { code: 'en', nativeName: 'English', englishName: 'English', badge: 'EN', flag: '🇺🇸' },
  fr: { code: 'fr', nativeName: 'Français', englishName: 'French', badge: 'FR', flag: '🇫🇷' },
  es: { code: 'es', nativeName: 'Español', englishName: 'Spanish', badge: 'ES', flag: '🇪🇸' },
  de: { code: 'de', nativeName: 'Deutsch', englishName: 'German', badge: 'DE', flag: '🇩🇪' },
};

/**
 * High-performance Structured UI Translations for React Components (Drawer, Cards, Buttons)
 */
export const I18N_STRINGS: Record<SupportedLocale, Record<string, string>> = {
  'zh-CN': {
    // Extended System & Support i18n
    'support.heroBadge': '赞赏与致谢',
    'support.heroTitle': '请喝一杯咖啡 · 赞赏支持',
    'support.heroDesc': '致谢每一位慷慨支持的读者与同行，真实资金去向透明挂钩，未动用部分严谨显示“-”。',
    'support.pillStripe': 'Stripe 国际收银台',
    'support.pillCn': '微信 / 支付宝',
    'support.pillPaypal': 'PayPal 跨国支付',
    'support.pillCrypto': 'Web3 加密货币',
    'support.stripeTitle': 'Stripe 国际收银台',
    'support.stripeSubtitle': '自选金额与寄语',
    'support.localCurrency': '本地货币',
    'support.globalCurrency': '统一结算货币',
    'support.recommendedTiers': '推荐支持档位',
    'support.pppNotice': '⚡ 已随本地购买力（PPP）汇率自适应',
    'support.gradientNotice': '自适应常用赞赏梯度',
    'support.customAmountLabel': '自定义赞助金额',
    'support.supporterName': '称呼 / 昵称 (公开致谢)',
    'support.namePlaceholder': '您在公开致谢名册上的名字...',
    'support.supporterMessage': '祝福寄语 (可选)',
    'support.messagePlaceholder': '写下一句给作者的鼓励...',
    'support.optional': '可选',
    'support.checkoutBtn': '前往安全结账',
    'support.stripeFootnote': '由 Stripe 提供银行级 256 位端到端加密与欺诈防御',
    'support.channelsTitle': '本地与跨国支付通道',
    'support.tabCn': '国内主流通道',
    'support.tabHk': '香港 & 跨国',
    'support.tabPaypal': 'PayPal',
    'support.tabCrypto': '加密货币 Web3',
    'support.rosterBadge': '公开致谢名册',
    'support.table.purpose': '资金去向挂钩',
    'support.faqTitle': '常见疑问解答',
    'support.title': '赞助支持与方案',
    'support.tier0.title': '便捷速溶咖啡条',
    'support.tier0.desc': '便捷速溶小纸杯与咖啡条 · 轻盈便捷的每日第一口咖啡',
    'support.tier1.title': '经典外带咖啡纸杯',
    'support.tier1.desc': '经典商品外带纸杯 · 工位与街角随行现磨美式',
    'support.tier2.title': '精致精品咖啡杯',
    'support.tier2.desc': '骨瓷与手工陶瓷咖啡杯 · 堂食手冲与卡布奇诺时光',
    'support.tier3.title': '专业手冲分享壶',
    'support.tier3.desc': '经典细口手冲壶与滤杯 · 极客式萃取与风味沉浸',
    'support.tier4.title': '庄园级特选手冲豆',
    'support.tier4.desc': '瑰夏与日晒埃塞俄比亚单品豆 · 探索杯中极致风味',
    'support.tier5.title': '双人咖啡席深度研习',
    'support.tier5.desc': '慢调冲煮与技术研讨 · 面对面数字花园长期共建',
    'support.customAmount': '自定义赞助金额',
    'support.table.sponsor': '赞赏者',
    'support.table.amount': '金额',
    'support.table.message': '祝福寄语',
    'support.table.date': '时间',
    'support.table.channel': '支付通道',
    'support.search.placeholder': '搜索赞助者昵称或寄语...',
    'support.toast.copy': '地址已复制到剪贴板！',
    'support.qr.save': '点击或长按可保存赞赏码',
    'support.stripe.btn': '国际信用卡 · 快捷支付 (Stripe)',
    'support.records.title': '赞赏记录一览',
    'support.records.subtitle': '感谢每一位读者的支持与慷慨寄语',
    'support.records.empty': '暂无相关赞赏记录',
    'support.coffee.tierPrefix': '档位',
    'shortcut.title': '快捷键提示',
    'shortcut.search': '唤起搜索面板',
    'shortcut.console': '打开控制台',
    'shortcut.theme': '深浅模式切换',
    'shortcut.music': '播放器切换',
    'shortcut.random': '随机前往文章',
    'shortcut.home': '返回首页',
    'console.status.totalWords': '本站总字数',
    'console.status.totalWordsTooltip': '基于全站 Markdown 节点物理扫描精算的实时总字数',
    'console.status.uptime': '安全运行天数',
    'console.status.uptimeTooltip': '自 2024-01-01 以来稳定运行的物理时长记录',
    'console.status.latestPost': '最后推送',
    'console.status.latestPostTooltip': '系统实时检索的全站最新内容或特性的精确时间戳。',
    'console.status.protocol': '版本协议',
    'console.status.protocolTooltip': 'shijianus-blog 核心引擎版本及开发协议',
    'console.status.activityLevel': '活跃等级',
    'console.status.activityLevelTooltip': '基于近30天内发布文章数量计算的实时活跃等级',
    'console.status.density': '内容密度',
    'console.status.densityTooltip': '基于全站平均单篇字数计算的系统信息密度评级',
    'console.status.readingTime': '全站阅读',
    'console.status.readingTimeTooltip': '涵盖所有公开内容的平均总阅读时长',
    'console.status.architecture': '系统架构',
    'console.status.architectureTooltip': '基于 Astro 核心引擎与 Edge Functions 的现代响应式架构',
    'console.status.buildEngine': '构建引擎',
    'console.status.buildEngineTooltip': '基于现代化的 Vite 构建工具及 Astro 框架的极速静态生成与混合渲染，支持高度优化的分块策略。',
    'console.status.styling': '样式底层',
    'console.status.stylingTooltip': '采用原子级 CSS 框架实现的高性能、响应式且易于扩展的视觉体系，具备极高的运行时性能优势。',
    'console.status.deployNodes': '部署节点',
    'console.status.deployNodesTooltip': '依托全球分布式边缘计算节点（Vercel 或 Cloudflare）实现的全时段低延迟分发与无服务器函数响应。',
    'console.status.latency': '运行反馈',
    'console.status.latencyTooltip': '极致优化的边缘预渲染与资源调度，确保首屏加载与交互响应均低于感知阈值。',
    'toast.maxTitles': '最多可同时佩戴 4 个称号，请先点击已佩戴称号取消后再添加。',
    'toast.updateTitles': '更新了名片佩戴称号',
    'toast.updateStatus': '更新了用户状态',
    'toast.themeDark': '已切换为深色模式',
    'toast.themeLight': '已切换为浅色模式',
    'toast.fillNickname': '请先填写昵称。',
    'toast.profileUpdated': '账号资料已更新。',
    'toast.profileCreated': '账号已创建。',
    'toast.loggedOut': '当前账号已退出，评论将恢复只读。',
    'toast.epomailVerifying': '正在验证 Epomail 凭据并同步账号...',
    'toast.epomailSuccess': 'Epomail 授权登录成功！欢迎，',
    'toast.epomailError': 'Epomail 授权凭据交换失败，请重试',
    'toast.epomailWindow': '请在弹出的 Epomail 窗口中完成授权...',
    'toast.epomailRequireEmail': '请填写 Epomail 账号或邮箱',
    'post.copyright.author': '本文作者',
    'post.copyright.link': '本文链接',
    'post.copyright.license': '版权声明',
    'post.copyright.licenseDesc': '本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明原作者与出处。',
    'post.outdate.prefix': '本文发布于',
    'post.outdate.suffix': '天前，部分内容可能已发生演化，请注意甄别。',
    'post.nav.prev': '上一篇',
    'post.nav.next': '下一篇',
    'post.related.title': '推荐阅读',
    'nav.mobileCloseAria': '关闭移动端导航菜单',
    'nav.mobileNavAria': '移动端导航',
    'nav.submenuAria': '子页面',

    // Drawer header & Hero
    'drawer.eyebrow': 'READER HUB · 读者中心',
    'drawer.title': '账号中心',
    'drawer.close': '关闭账号面板',
    'hero.avatarTitle': '点击更换头像 (支持选择本地图片上传)',
    'hero.avatarChange': '更换',
    'hero.guestFriend': '访客朋友',
    'hero.badge.guest': '访客模式',
    'hero.badge.local': '本地读者',
    'hero.badge.epomail': '⚡ Epomail 认证',
    'hero.badge.admin': '管理员',
    'hero.boundIdentity': '已绑定评论身份',
    'hero.emptyBio': '点击设置个人简介、时区与位置',
    'hero.signout': '退出登录',
    'hero.quickLogin': '快速登录',
    'hero.localHint': '当前处于本地身份模式，可使用本地免密登录或接入 Epomail。',
    'hero.guestHint': '当前处于访客模式，填写昵称即可发表评论。',

    // Drawer navigation tabs
    'tab.auth': '个人资料',
    'tab.notifications': '站内提醒',
    'tab.settings': '偏好与架构',

    // Tab 1: Profile & Auth Cards
    'profile.card.title': '账户资料设置',
    'profile.field.name': '公开昵称 (Username)',
    'profile.field.namePlaceholder': '公开显示的昵称（留空显示为访客）',
    'profile.field.website': '个人主页 / 网站 (Website)',
    'profile.field.websitePlaceholder': 'https://example.com',
    'profile.field.bio': '个人简介 (Bio)',
    'profile.field.bioPlaceholder': '一句话介绍自己（留空默认为无）',
    'profile.field.timezone': '所在时区 (Timezone)',
    'profile.field.timezonePlaceholder': '自动获取或选择',
    'profile.field.detectTz': '检测',
    'profile.field.detectTzTitle': '重新检测本机当前时区',
    'profile.field.location': '所在位置 (Location)',
    'profile.field.locationPlaceholder': '自动获取或自定义',
    'profile.field.detectLoc': '定位',
    'profile.field.detectLocTitle': '重新获取网络地理位置',
    'profile.btn.save': '保存资料修改',
    'profile.avatar.title': '头像管理',
    'profile.avatar.upload': '上传新头像',
    'profile.avatar.reset': '↺ 恢复 Epomail 默认头像',
    'epomail.card.title': 'EpoCanvas Mail 统一身份认证',
    'epomail.card.desc': '接入博主自建权威 Epomail 邮件系统，实现全站统一登录、评论认证与专属头像同步。',
    'epomail.benefit.pwdless': '一键免密授权',
    'epomail.benefit.avatar': '云端头像漫游',
    'epomail.benefit.instant': '回复即刻送达',
    'epomail.btn.login': '使用 Epomail 一键授权登录',
    'epomail.direct.toggle': '站长或开发者直接授权通道',
    'epomail.direct.email': 'Epomail 邮箱',
    'epomail.direct.password': '账户密码',
    'epomail.direct.passwordPlaceholder': '输入登录密码',
    'epomail.direct.totp': '动态验证码 (选填)',
    'epomail.direct.totpPlaceholder': '如已开启双重认证请输入 6 位 TOTP',
    'epomail.scope.title': '该授权将允许：',
    'epomail.scope.profile': '获取公开资料（姓名与头像）',
    'epomail.scope.email': '验证邮箱并绑定为博客评论作者',
    'epomail.scope.notify': '接收博文评论 @ 与回复站内提醒',
    'epomail.direct.verifying': '正在验证授权...',
    'epomail.direct.submit': '验证并接续授予权限',
    'local.auth.title': '本地免密读者登录',
    'local.auth.desc': '无需密码，仅凭昵称与邮箱即可在本地浏览器快速登记身份。',
    'local.btn.login': '登记本地身份',

    // Tab 2: Notifications Cards
    'notify.partition.broadcast': '全站广播通告',
    'notify.partition.personal': '个人互动与足迹',
    'notify.broadcast.title': '全站广播与最新动态',
    'notify.broadcast.readMore': '阅读详情',
    'notify.broadcast.empty': '暂无全站广播动态',
    'notify.mentions.title': '收到的互动提醒',
    'notify.mentions.emptyTitle': '暂时没有新的个人互动提醒',
    'notify.mentions.emptyDescLogged': '当其他读者在文章评论区回复你、为你点赞或发送 Boost 时，这里将实时呈现。',
    'notify.mentions.emptyDescGuest': '设置昵称或登录后，当有人与你互动时将在此处即刻通知。',
    'notify.comments.title': '我的评论足迹',
    'notify.comments.refresh': '刷新',
    'notify.comments.refreshTitle': '从数据库刷新最新记录',
    'notify.comments.postPrefix': '文章：',
    'notify.comments.defaultPost': '博文评论',
    'notify.comments.loading': '正在从数据库获取评论足迹...',
    'notify.comments.emptyDesc': '数据库中暂无您的评论记录，前往任意文章底部发表评论即可自动记录足迹。',

    // Tab 3: Settings Cards (account-card)
    'settings.lang.title': '界面语言 (Language)',
    'settings.notify.title': '站内通知接收偏好',
    'settings.notify.broadcast.title': '全站广播与新博文发布通告',
    'settings.notify.broadcast.desc': '开启后将在通知中心置顶呈现博主广播公告与最新文章发布动态。',
    'settings.notify.personal.title': '个人评论回复与点赞提醒',
    'settings.notify.personal.desc': '当其他读者回复您的发言或给您的留言点赞时接收站内提醒。',
    'settings.comments.title': '评论区互动与显示偏好',
    'settings.comments.sort.title': '评论区默认排序方式',
    'settings.comments.sort.desc': '选择进入博文时评论列表的默认优先排序模式。',
    'settings.comments.sort.new': '⏱️ 最新',
    'settings.comments.sort.new_label': '最新',
    'settings.comments.sort.hot': '🔥 最热',
    'settings.comments.sort.hot_label': '最热',
    'settings.comments.location.title': '前台展示国家/地区属地徽章',
    'settings.comments.location.desc': '开启后评论公开展示国家/地区徽章（如 🇨🇳 中国·北京）；关闭后前台完全隐匿。',
    'settings.comments.collapse.title': '默认折叠嵌套回复',
    'settings.comments.collapse.desc': '折叠多级嵌套回复（YouTube 手风琴风格），保持评论列表清爽。',
    'settings.a11y.title': '交互反馈与无障碍',
    'settings.a11y.haptic.title': '点击音效与触觉反馈',
    'settings.a11y.haptic.desc': '针对移动设备与支持震动的浏览器提供温和的触觉响应。',
    'settings.a11y.scroll.title': '平滑滚动过渡',
    'settings.a11y.scroll.desc': '锚点与目录跳转采用平滑动画。',
    'settings.a11y.contrast.title': '界面高对比度呈现',
    'settings.a11y.contrast.desc': '加强文字与边框对比度以提升阅读可达性。',
    'settings.compliance.note': '特别说明：前台隐匿仅针对普通访客隐藏属地徽章。出于社区反垃圾、网络安全与评论风控管理合规需要，系统后台仍会如实记录发件连接 IP，仅站长与管理员后台可见，绝不对公众展示。',

    // Drawer Head Badge & Level System
    'drawer.headBadge.guest': '访客模式 · LV.0 初始浏览',
    'level.title': '社区等级与信任制度',
    'level.trustLevel': '信任等级',
    'level.readingTime': '阅读时长',
    'level.activeDays': '活跃天数',
    'level.commentsCount': '发表讨论',
    'level.reactionsCount': '互动获赞',
    'level.nextLevel': '下一等级',
    'level.webmasterBadge': '站长专属方形头像',

    // General common
    'common.close': '关闭',
    'common.save': '保存',
    'common.saved': '已保存',
    'common.loading': '加载中...',
    // Search Dialog
    'search.title': '站内搜索',
    'search.index': '内容索引',
    'search.close': '关闭搜索面板',
    'search.placeholder': '搜索标题、摘要或分类',
    'search.empty': '没有找到匹配内容',
    // Console Dialog & Notice
    'console.title': '快捷控制台',
    'console.close': '关闭控制台',
    'console.personal': '个人中心',
    'console.status': '运行状态',
    'console.overview': '站点概览',
    'console.eyebrow': '控制台',
    'console.notice.title': '控制台提示',
    'console.notice.close': '关闭控制台提示',
    'console.notice.unavailable': '控制台暂不可用',
    'console.stat.posts': '文章',
    'console.stat.categories': '分类',
    'console.stat.tags': '标签',
    'console.stat.reading': '阅读',
    'console.activity.title': '更新记录',
    'console.activity.tips': '活跃度',
    'console.activity.empty': '当日无推送记录',
    'console.activity.hint': '点击方块查看记录',
    'console.btn.search': '搜索内容',
    'console.btn.bg': '背景切换',
    'console.btn.notifications': '查看通知',
    'console.btn.random': '随便逛逛',
    'console.btn.top': '回到顶部',
    // Right Click Menu
    'menu.title': '右键菜单',
    'menu.back': '后退',
    'menu.forward': '前进',
    'menu.refresh': '刷新',
    'menu.top': '顶部',
    'menu.quote': '引用至评论区',
    'menu.copyText': '复制选中文本',
    'menu.copyUrl': '复制地址',
    'menu.search': '站内搜索',
    'menu.lightMode': '浅色模式',
    'menu.darkMode': '深色模式',
    'common.dismiss': '知道了',
  },
  'zh-Hant': {
    // Extended System & Support i18n
    'support.heroBadge': '贊賞與致謝',
    'support.heroTitle': '請喝一杯咖啡 · 贊賞支持',
    'support.heroDesc': '致謝每一位慷慨支持的讀者與同行，真實資金去向透明掛鉤，未動用部分嚴謹顯示“-”。',
    'support.pillStripe': 'Stripe 國際收銀台',
    'support.pillCn': '微信 / 支付寶',
    'support.pillPaypal': 'PayPal 跨國支付',
    'support.pillCrypto': 'Web3 加密貨幣',
    'support.stripeTitle': 'Stripe 國際收銀台',
    'support.stripeSubtitle': '自選金額與寄語',
    'support.localCurrency': '本地貨幣',
    'support.globalCurrency': '統一結算貨幣',
    'support.recommendedTiers': '推薦支持檔位',
    'support.pppNotice': '⚡ 已隨本地購買力（PPP）匯率自適應',
    'support.gradientNotice': '自適應常用贊賞梯度',
    'support.customAmountLabel': '自定義贊助金額',
    'support.supporterName': '稱呼 / 暱稱 (公開致謝)',
    'support.namePlaceholder': '您在公開致謝名冊上的名字...',
    'support.supporterMessage': '祝福寄語 (可選)',
    'support.messagePlaceholder': '寫下一句給作者的鼓勵...',
    'support.optional': '可選',
    'support.checkoutBtn': '前往安全結賬',
    'support.stripeFootnote': '由 Stripe 提供銀行級 256 位端到端加密與欺詐防禦',
    'support.channelsTitle': '本地與跨國支付通道',
    'support.tabCn': '國內主流通道',
    'support.tabHk': '香港 & 跨國',
    'support.tabPaypal': 'PayPal',
    'support.tabCrypto': '加密貨幣 Web3',
    'support.rosterBadge': '公開致謝名冊',
    'support.table.purpose': '資金去向掛鉤',
    'support.faqTitle': '常見疑問解答',
    'support.title': '贊助支持與方案',
    'support.tier0.title': '便捷速溶咖啡條',
    'support.tier0.desc': '便捷速溶小紙杯與咖啡條 · 輕盈便捷的每日第一口咖啡',
    'support.tier1.title': '經典外帶咖啡紙杯',
    'support.tier1.desc': '經典商品外帶紙杯 · 工位與街角隨行現磨美式',
    'support.tier2.title': '精緻精品咖啡杯',
    'support.tier2.desc': '骨瓷與手工陶瓷咖啡杯 · 堂食手沖與卡布奇諾時光',
    'support.tier3.title': '專業手沖分享壺',
    'support.tier3.desc': '經典細口手沖壺與濾杯 · 極客式萃取與風味沉浸',
    'support.tier4.title': '莊園級特選手沖豆',
    'support.tier4.desc': '瑰夏與日曬埃塞俄比亞單品豆 · 探索杯中極致風味',
    'support.tier5.title': '雙人咖啡席深度研習',
    'support.tier5.desc': '慢調沖煮與技術研討 · 面對面數字花園長期共建',
    'support.customAmount': '自定義贊助金額',
    'support.table.sponsor': '贊賞者',
    'support.table.amount': '金額',
    'support.table.message': '祝福寄語',
    'support.table.date': '時間',
    'support.table.channel': '支付通道',
    'support.search.placeholder': '搜尋贊助者暱稱或寄語...',
    'support.toast.copy': '地址已複製到剪貼板！',
    'support.qr.save': '點擊或長按可保存贊賞碼',
    'support.stripe.btn': '國際信用卡 · 快捷支付 (Stripe)',
    'support.records.title': '贊賞記錄一覽',
    'support.records.subtitle': '感謝每一位讀者的支持與慷慨寄語',
    'support.records.empty': '暫無相關贊賞記錄',
    'support.coffee.tierPrefix': '檔位',
    'shortcut.title': '快捷鍵提示',
    'shortcut.search': '喚起搜尋面板',
    'shortcut.console': '打開控制台',
    'shortcut.theme': '深淺模式切換',
    'shortcut.music': '播放器切換',
    'shortcut.random': '隨機前往文章',
    'shortcut.home': '返回首頁',
    'console.status.totalWords': '本站總字數',
    'console.status.totalWordsTooltip': '基於全站 Markdown 節點物理掃描精算的實時總字數',
    'console.status.uptime': '安全運行天数',
    'console.status.uptimeTooltip': '自 2024-01-01 以來穩定運行的物理時長記錄',
    'console.status.latestPost': '最後推送',
    'console.status.latestPostTooltip': '系統實時檢索的全站最新內容或特性的精確時間戳。',
    'console.status.protocol': '版本協議',
    'console.status.protocolTooltip': 'shijianus-blog 核心引擎版本及開發協議',
    'console.status.activityLevel': '活躍等級',
    'console.status.activityLevelTooltip': '基於近30天內發布文章數量計算的實時活躍等級',
    'console.status.density': '內容密度',
    'console.status.densityTooltip': '基於全站平均單篇字數計算的系統信息密度評級',
    'console.status.readingTime': '全站閱讀',
    'console.status.readingTimeTooltip': '涵蓋所有公開內容的平均總閱讀時長',
    'console.status.architecture': '系統架構',
    'console.status.architectureTooltip': '基於 Astro 核心引擎與 Edge Functions 的現代響應式架構',
    'console.status.buildEngine': '構建引擎',
    'console.status.buildEngineTooltip': '基於現代化的 Vite 構建工具及 Astro 框架的極速靜態生成與混合渲染，支持高度優化的分塊策略。',
    'console.status.styling': '樣式底層',
    'console.status.stylingTooltip': '採用原子級 CSS 框架實現的高性能、響應式且易於擴展的視覺體系，具備極高的運行時性能優勢。',
    'console.status.deployNodes': '部署節點',
    'console.status.deployNodesTooltip': '依託全球分佈式邊緣計算節點（Vercel 或 Cloudflare）實現的全時段低延遲分發與無服務器函數響應。',
    'console.status.latency': '運行反饋',
    'console.status.latencyTooltip': '極致優化的邊緣預渲染與資源調度，確保首屏加載與交互響應均低於感知閾值。',
    'toast.maxTitles': '最多可同時佩戴 4 個稱號，請先點擊已佩戴稱號取消後再添加。',
    'toast.updateTitles': '更新了名片佩戴稱號',
    'toast.updateStatus': '更新了用戶狀態',
    'toast.themeDark': '已切換為深色模式',
    'toast.themeLight': '已切換為淺色模式',
    'toast.fillNickname': '請先填寫暱稱。',
    'toast.profileUpdated': '帳號資料已更新。',
    'toast.profileCreated': '帳號已創建。',
    'toast.loggedOut': '當前帳號已退出，評論將恢復只讀。',
    'toast.epomailVerifying': '正在驗證 Epomail 憑據並同步帳號...',
    'toast.epomailSuccess': 'Epomail 授權登入成功！歡迎，',
    'toast.epomailError': 'Epomail 授權憑據交換失敗，請重試',
    'toast.epomailWindow': '請在彈出的 Epomail 視窗中完成授權...',
    'toast.epomailRequireEmail': '請填寫 Epomail 帳號或郵箱',
    'post.copyright.author': '本文作者',
    'post.copyright.link': '本文連結',
    'post.copyright.license': '版權聲明',
    'post.copyright.licenseDesc': '本文採用 CC BY-NC-SA 4.0 許可協議，轉載請註明原作者與出處。',
    'post.outdate.prefix': '本文發布於',
    'post.outdate.suffix': '天前，部分內容可能已發生演化，請注意甄別。',
    'post.nav.prev': '上一篇',
    'post.nav.next': '下一篇',
    'post.related.title': '推薦閱讀',
    'nav.mobileCloseAria': '關閉移動端導航菜單',
    'nav.mobileNavAria': '移動端導航',
    'nav.submenuAria': '子頁面',

    'drawer.eyebrow': 'READER HUB · 讀者中心',
    'drawer.title': '帳號中心',
    'drawer.close': '關閉帳號面板',
    'hero.avatarTitle': '點擊更換頭像 (支援選擇本機圖片上傳)',
    'hero.avatarChange': '更換',
    'hero.guestFriend': '訪客朋友',
    'hero.badge.guest': '訪客模式',
    'hero.badge.local': '本地讀者',
    'hero.badge.epomail': '⚡ Epomail 認證',
    'hero.badge.admin': '管理員',
    'hero.boundIdentity': '已綁定評論身分',
    'hero.emptyBio': '點擊設定個人簡介、時區與位置',
    'hero.signout': '登出帳號',
    'hero.quickLogin': '快速登入',
    'hero.localHint': '當前處於本地身分模式，可使用本地免密登入或接入 Epomail。',
    'hero.guestHint': '當前處於訪客模式，填寫暱稱即可發表評論。',
    'tab.auth': '個人資料',
    'tab.notifications': '站內提醒',
    'tab.settings': '偏好與架構',
    'profile.card.title': '帳戶資料設定',
    'profile.field.name': '公開暱稱 (Username)',
    'profile.field.namePlaceholder': '公開顯示的暱稱（留空顯示為訪客）',
    'profile.field.website': '個人主頁 / 網站 (Website)',
    'profile.field.websitePlaceholder': 'https://example.com',
    'profile.field.bio': '個人簡介 (Bio)',
    'profile.field.bioPlaceholder': '一句話介紹自己（留空默認為無）',
    'profile.field.timezone': '所在時區 (Timezone)',
    'profile.field.timezonePlaceholder': '自動獲取或選擇',
    'profile.field.detectTz': '檢測',
    'profile.field.detectTzTitle': '重新檢測本機當前時區',
    'profile.field.location': '所在位置 (Location)',
    'profile.field.locationPlaceholder': '自動獲取或自訂',
    'profile.field.detectLoc': '定位',
    'profile.field.detectLocTitle': '重新獲取網路地理位置',
    'profile.btn.save': '儲存資料修改',
    'profile.avatar.title': '頭像管理',
    'profile.avatar.upload': '上傳新頭像',
    'profile.avatar.reset': '↺ 恢復 Epomail 預設頭像',
    'epomail.card.title': 'EpoCanvas Mail 統一身分認證',
    'epomail.card.desc': '接入站長自建權威 Epomail 郵件系統，實現全站統一登入、評論認證與專屬頭像同步。',
    'epomail.benefit.pwdless': '一鍵免密授權',
    'epomail.benefit.avatar': '雲端頭像漫遊',
    'epomail.benefit.instant': '回覆即刻送達',
    'epomail.btn.login': '使用 Epomail 一鍵授權登入',
    'epomail.direct.toggle': '站長或開發者直接授權通道',
    'epomail.direct.email': 'Epomail 電子郵件',
    'epomail.direct.password': '帳戶密碼',
    'epomail.direct.passwordPlaceholder': '輸入登入密碼',
    'epomail.direct.totp': '動態驗證碼 (選填)',
    'epomail.direct.totpPlaceholder': '如已開啟雙重認證請輸入 6 位 TOTP',
    'epomail.scope.title': '該授權將允許：',
    'epomail.scope.profile': '獲取公開資料（姓名與頭像）',
    'epomail.scope.email': '驗證信箱並綁定為部落格評論作者',
    'epomail.scope.notify': '接收文章評論 @ 與回覆站內提醒',
    'epomail.direct.verifying': '正在驗證授權...',
    'epomail.direct.submit': '驗證並接續授予權限',
    'local.auth.title': '本地免密讀者登入',
    'local.auth.desc': '無需密碼，僅憑暱稱與電子郵件即可在本地瀏覽器快速登記身分。',
    'local.btn.login': '登記本地身分',
    'notify.partition.broadcast': '全站廣播通告',
    'notify.partition.personal': '個人互動與足跡',
    'notify.broadcast.title': '全站廣播與最新動態',
    'notify.broadcast.readMore': '閱讀詳情',
    'notify.broadcast.empty': '暫無全站廣播動態',
    'notify.mentions.title': '收到的互動提醒',
    'notify.mentions.emptyTitle': '暫時沒有新的個人互動提醒',
    'notify.mentions.emptyDescLogged': '當其他讀者在文章評論區回覆你、為你按讚或發送 Boost 時，這裡將即時呈現。',
    'notify.mentions.emptyDescGuest': '設定暱稱或登入後，當有人與你互動時將在此處即刻通知。',
    'notify.comments.title': '我的評論足跡',
    'notify.comments.refresh': '重新整理',
    'notify.comments.refreshTitle': '從資料庫重新整理最新記錄',
    'notify.comments.postPrefix': '文章：',
    'notify.comments.defaultPost': '文章評論',
    'notify.comments.loading': '正在從資料庫獲取評論足跡...',
    'notify.comments.emptyDesc': '資料庫中暫無您的評論記錄，前往任意文章底部發表評論即可自動記錄足跡。',
    'settings.lang.title': '介面語言 (Language)',
    'settings.notify.title': '站內通知接收偏好',
    'settings.notify.broadcast.title': '全站廣播與新文章發布通告',
    'settings.notify.broadcast.desc': '開啟後將在通知中心置頂呈現站長廣播公告與最新文章發布動態。',
    'settings.notify.personal.title': '個人評論回覆與按讚提醒',
    'settings.notify.personal.desc': '當其他讀者回覆您的發言或給您的留言按讚時接收站內提醒。',
    'settings.comments.title': '評論區互動與顯示偏好',
    'settings.comments.sort.title': '評論區預設排序方式',
    'settings.comments.sort.desc': '選擇進入文章時評論列表的預設優先排序模式。',
    'settings.comments.sort.new': '⏱️ 最新',
    'settings.comments.sort.new_label': '最新',
    'settings.comments.sort.hot': '🔥 最熱',
    'settings.comments.sort.hot_label': '最熱',
    'settings.comments.location.title': '前台展示國家/地區屬地徽章',
    'settings.comments.location.desc': '開啟後評論公開展示國家/地區徽章（如 🇭🇰 中國香港）；關閉後前台完全隱匿。',
    'settings.comments.collapse.title': '預設折疊嵌套回覆',
    'settings.comments.collapse.desc': '折疊多級嵌套回覆（YouTube 手風琴風格），保持評論列表清爽。',
    'settings.a11y.title': '互動回饋與無障礙',
    'settings.a11y.haptic.title': '點擊音效與觸覺回饋',
    'settings.a11y.haptic.desc': '針對行動裝置與支援震動的瀏覽器提供溫和的觸覺回應。',
    'settings.a11y.scroll.title': '平滑滾動過渡',
    'settings.a11y.scroll.desc': '錨點與目錄跳轉採用平滑動畫。',
    'settings.a11y.contrast.title': '介面高對比度呈現',
    'settings.a11y.contrast.desc': '加強文字與邊框對比度以提升閱讀可達性。',
    'settings.compliance.note': '特別說明：前台隱匿僅針對普通訪客隱藏屬地徽章。出於社群反垃圾、網路安全與評論風控管理合規需要，系統後台仍會如實記錄連線 IP，僅站長與管理員後台可見，絕不對公眾展示。',

    // Drawer Head Badge & Level System
    'drawer.headBadge.guest': '訪客模式 · LV.0 初始瀏覽',
    'level.title': '社區等級與信任制度',
    'level.trustLevel': '信任等級',
    'level.readingTime': '閱讀時長',
    'level.activeDays': '活躍天數',
    'level.commentsCount': '發表討論',
    'level.reactionsCount': '互動獲讚',
    'level.nextLevel': '下一等級',
    'level.webmasterBadge': '站長專屬方形頭像',
    'common.close': '關閉',
    'common.save': '儲存',
    'common.saved': '已儲存',
    'common.loading': '載入中...',
    // Search Dialog
    'search.title': '站內搜尋',
    'search.index': '內容索引',
    'search.close': '關閉搜尋面板',
    'search.placeholder': '搜尋標題、摘要或分類',
    'search.empty': '沒有找到匹配內容',
    // Console Dialog & Notice
    'console.title': '快捷控制台',
    'console.close': '關閉控制台',
    'console.personal': '個人中心',
    'console.status': '運行狀態',
    'console.overview': '站點概覽',
    'console.eyebrow': '控制台',
    'console.notice.title': '控制台提示',
    'console.notice.close': '關閉控制台提示',
    'console.notice.unavailable': '控制台暫不可用',
    'console.stat.posts': '文章',
    'console.stat.categories': '分類',
    'console.stat.tags': '標籤',
    'console.stat.reading': '閱讀',
    'console.activity.title': '更新記錄',
    'console.activity.tips': '活躍度',
    'console.activity.empty': '當日無推送記錄',
    'console.activity.hint': '點擊方塊查看記錄',
    'console.btn.search': '搜尋內容',
    'console.btn.bg': '背景切換',
    'console.btn.notifications': '查看通知',
    'console.btn.random': '隨便逛逛',
    'console.btn.top': '回到頂部',
    // Right Click Menu
    'menu.title': '右鍵選單',
    'menu.back': '後退',
    'menu.forward': '前進',
    'menu.refresh': '重新整理',
    'menu.top': '頂部',
    'menu.quote': '引用至評論區',
    'menu.copyText': '複製選中文本',
    'menu.copyUrl': '複製地址',
    'menu.search': '站內搜尋',
    'menu.lightMode': '淺色模式',
    'menu.darkMode': '深色模式',
    'common.dismiss': '知道了',
  },
  'en': {
    // Extended System & Support i18n
    'support.heroBadge': 'Sponsorship & Gratitude',
    'support.heroTitle': 'Buy Me a Coffee · Support',
    'support.heroDesc': 'Heartfelt gratitude to every generous reader and patron. Real fund allocation is transparently tracked; unspent funds are strictly shown as "-".',
    'support.pillStripe': 'Stripe International Checkout',
    'support.pillCn': 'WeChat / Alipay',
    'support.pillPaypal': 'PayPal Global',
    'support.pillCrypto': 'Web3 Crypto',
    'support.stripeTitle': 'Stripe International Checkout',
    'support.stripeSubtitle': 'Choose Amount & Blessing',
    'support.localCurrency': 'Local Currency',
    'support.globalCurrency': 'Unified Global Currency',
    'support.recommendedTiers': 'Recommended Tiers',
    'support.pppNotice': '⚡ Adjusted for Local Purchasing Power (PPP)',
    'support.gradientNotice': 'Adaptive Popular Tip Tiers',
    'support.customAmountLabel': 'Custom Sponsor Amount',
    'support.supporterName': 'Name / Nickname (Public Ledger)',
    'support.namePlaceholder': 'Your name on the public gratitude roster...',
    'support.supporterMessage': 'Blessing Message (Optional)',
    'support.messagePlaceholder': 'Leave an encouraging word for the author...',
    'support.optional': 'Optional',
    'support.checkoutBtn': 'Proceed to Secure Checkout',
    'support.stripeFootnote': 'Bank-grade 256-bit encryption & fraud protection powered by Stripe',
    'support.channelsTitle': 'Local & Global Payment Channels',
    'support.tabCn': 'Domestic Channels',
    'support.tabHk': 'HK & Global',
    'support.tabPaypal': 'PayPal',
    'support.tabCrypto': 'Crypto Web3',
    'support.rosterBadge': 'Public Gratitude Ledger',
    'support.table.purpose': 'Fund Allocation',
    'support.faqTitle': 'Frequently Asked Questions',
    'support.title': 'Sponsorship & Support Plans',
    'support.tier0.title': 'Instant Coffee Packet',
    'support.tier0.desc': 'Quick packet & paper cup · Lightweight first cup of morning energy',
    'support.tier1.title': 'Classic Takeaway Cup',
    'support.tier1.desc': 'Classic takeaway cup · Freshly brewed Americano on the go',
    'support.tier2.title': 'Artisan Ceramic Mug',
    'support.tier2.desc': 'Artisan ceramic mug · Cozy pour-over and cappuccino moments',
    'support.tier3.title': 'Professional Pour-Over Set',
    'support.tier3.desc': 'Classic gooseneck kettle & dripper · Geek extraction & deep aromas',
    'support.tier4.title': 'Single-Origin Specialty Beans',
    'support.tier4.desc': 'Geisha & Ethiopian heirloom beans · Exploring ultimate cup profiles',
    'support.tier5.title': 'Coffee Table Deep Exchange',
    'support.tier5.desc': 'Slow brewing & technical dialogue · Long-term digital garden co-creation',
    'support.customAmount': 'Custom Sponsor Amount',
    'support.table.sponsor': 'Sponsor',
    'support.table.amount': 'Amount',
    'support.table.message': 'Message / Blessing',
    'support.table.date': 'Date',
    'support.table.channel': 'Payment Channel',
    'support.search.placeholder': 'Search sponsor name or message...',
    'support.toast.copy': 'Address copied to clipboard!',
    'support.qr.save': 'Click or long press to save QR code',
    'support.stripe.btn': 'Credit Cards · Apple / Google Pay (Stripe)',
    'support.records.title': 'Sponsorship Wall & History',
    'support.records.subtitle': 'Thank you to every reader for your generous support and blessings',
    'support.records.empty': 'No sponsorship records found',
    'support.coffee.tierPrefix': 'Tier',
    'shortcut.title': 'Keyboard Shortcuts',
    'shortcut.search': 'Open Search Panel',
    'shortcut.console': 'Open Console',
    'shortcut.theme': 'Toggle Light/Dark Theme',
    'shortcut.music': 'Toggle Music Player',
    'shortcut.random': 'Visit Random Post',
    'shortcut.home': 'Back to Home',
    'console.status.totalWords': 'Total Word Count',
    'console.status.totalWordsTooltip': 'Real-time physically scanned word count across all markdown posts',
    'console.status.uptime': 'Safe Uptime Days',
    'console.status.uptimeTooltip': 'Continuous uptime record since 2024-01-01',
    'console.status.latestPost': 'Latest Update',
    'console.status.latestPostTooltip': 'Exact timestamp of the most recent post or feature update',
    'console.status.protocol': 'Engine Protocol',
    'console.status.protocolTooltip': 'shijianus-blog core engine version & protocol',
    'console.status.activityLevel': 'Activity Rating',
    'console.status.activityLevelTooltip': 'Real-time activity grade based on post output over the past 30 days',
    'console.status.density': 'Content Density',
    'console.status.densityTooltip': 'Information density rating based on average post length',
    'console.status.readingTime': 'Total Read Time',
    'console.status.readingTimeTooltip': 'Average total reading duration across all public posts',
    'console.status.architecture': 'Architecture',
    'console.status.architectureTooltip': 'Modern responsive architecture based on Astro & Edge Functions',
    'console.status.buildEngine': 'Build Engine',
    'console.status.buildEngineTooltip': 'Ultra-fast static generation and hybrid rendering powered by modern Vite and Astro, with optimized chunking.',
    'console.status.styling': 'Styling Layer',
    'console.status.stylingTooltip': 'High-performance responsive design system implemented with utility-first CSS framework for peak runtime efficiency.',
    'console.status.deployNodes': 'Edge Nodes',
    'console.status.deployNodesTooltip': 'Global low-latency edge network powered by Vercel and Cloudflare with serverless edge execution.',
    'console.status.latency': 'Response Latency',
    'console.status.latencyTooltip': 'Sub-perceptual initial load and interaction feedback via pre-rendered edge compute and resource scheduling.',
    'toast.maxTitles': 'Maximum 4 titles can be equipped simultaneously. Please deselect one first.',
    'toast.updateTitles': 'Updated equipped badge titles',
    'toast.updateStatus': 'Updated user status',
    'toast.themeDark': 'Switched to Dark Mode',
    'toast.themeLight': 'Switched to Light Mode',
    'toast.fillNickname': 'Please enter a nickname first.',
    'toast.profileUpdated': 'Profile updated successfully.',
    'toast.profileCreated': 'Account created successfully.',
    'toast.loggedOut': 'Logged out. Comments are now read-only.',
    'toast.epomailVerifying': 'Verifying Epomail credentials and syncing profile...',
    'toast.epomailSuccess': 'Epomail authorization successful! Welcome, ',
    'toast.epomailError': 'Failed to exchange Epomail credentials. Please try again.',
    'toast.epomailWindow': 'Please complete authorization in the popup window...',
    'toast.epomailRequireEmail': 'Please enter your Epomail username or email address',
    'post.copyright.author': 'Author',
    'post.copyright.link': 'Article Link',
    'post.copyright.license': 'Copyright',
    'post.copyright.licenseDesc': 'Licensed under CC BY-NC-SA 4.0. Please credit the original author and source.',
    'post.outdate.prefix': 'This post was published',
    'post.outdate.suffix': 'days ago. Some details may have evolved over time.',
    'post.nav.prev': 'Previous',
    'post.nav.next': 'Next',
    'post.related.title': 'Recommended Reading',
    'nav.mobileCloseAria': 'Close mobile navigation menu',
    'nav.mobileNavAria': 'Mobile navigation',
    'nav.submenuAria': 'Subpage',

    'drawer.eyebrow': 'READER HUB · Reader Center',
    'drawer.title': 'Account Center',
    'drawer.close': 'Close Account Panel',
    'hero.avatarTitle': 'Click to change avatar (supports local image upload)',
    'hero.avatarChange': 'Change',
    'hero.guestFriend': 'Guest Visitor',
    'hero.badge.guest': 'Visitor Mode',
    'hero.badge.local': 'Local Reader',
    'hero.badge.epomail': '⚡ Epomail Verified',
    'hero.badge.admin': 'Administrator',
    'hero.boundIdentity': 'Comment identity linked',
    'hero.emptyBio': 'Click to set bio, timezone and location',
    'hero.signout': 'Sign Out',
    'hero.quickLogin': 'Quick Login',
    'hero.localHint': 'Currently in local reader mode. You can sign in with Epomail anytime.',
    'hero.guestHint': 'Currently in visitor mode. Enter a name to post comments.',
    'tab.auth': 'Profile',
    'tab.notifications': 'Notices',
    'tab.settings': 'Preferences',
    'profile.card.title': 'Profile Settings',
    'profile.field.name': 'Username',
    'profile.field.namePlaceholder': 'Public username (leave blank for visitor)',
    'profile.field.website': 'Personal Website',
    'profile.field.websitePlaceholder': 'https://example.com',
    'profile.field.bio': 'Bio',
    'profile.field.bioPlaceholder': 'A short bio about yourself',
    'profile.field.timezone': 'Timezone',
    'profile.field.timezonePlaceholder': 'Auto detect or select',
    'profile.field.detectTz': 'Detect',
    'profile.field.detectTzTitle': 'Detect local timezone',
    'profile.field.location': 'Location',
    'profile.field.locationPlaceholder': 'Auto detect or custom',
    'profile.field.detectLoc': 'Locate',
    'profile.field.detectLocTitle': 'Re-detect network geo location',
    'profile.btn.save': 'Save Changes',
    'profile.avatar.title': 'Avatar Settings',
    'profile.avatar.upload': 'Upload New Avatar',
    'profile.avatar.reset': '↺ Restore Epomail Avatar',
    'epomail.card.title': 'EpoCanvas Mail Authentication',
    'epomail.card.desc': 'Connect to official Epomail server for unified login, verified badges, and synced avatar.',
    'epomail.benefit.pwdless': '1-Click Passwordless',
    'epomail.benefit.avatar': 'Cloud Avatar Sync',
    'epomail.benefit.instant': 'Instant Reply Alerts',
    'epomail.btn.login': 'Sign in with Epomail',
    'epomail.direct.toggle': 'Webmaster / Developer Direct Auth',
    'epomail.direct.email': 'Epomail Email',
    'epomail.direct.password': 'Password',
    'epomail.direct.passwordPlaceholder': 'Enter password',
    'epomail.direct.totp': 'TOTP Code (Optional)',
    'epomail.direct.totpPlaceholder': 'Enter 6-digit TOTP if 2FA enabled',
    'epomail.scope.title': 'This authorization will allow:',
    'epomail.scope.profile': 'Access public profile (name & avatar)',
    'epomail.scope.email': 'Verify email and bind as comment author',
    'epomail.scope.notify': 'Receive post comment @ and reply alerts',
    'epomail.direct.verifying': 'Verifying authorization...',
    'epomail.direct.submit': 'Verify & Grant Permissions',
    'local.auth.title': 'Local Reader Registration',
    'local.auth.desc': 'Passwordless registration using nickname and email stored in browser.',
    'local.btn.login': 'Register Locally',
    'notify.partition.broadcast': 'Site Broadcasts',
    'notify.partition.personal': 'Interactions & Footprint',
    'notify.broadcast.title': 'Site Broadcasts & Updates',
    'notify.broadcast.readMore': 'Read Details',
    'notify.broadcast.empty': 'No broadcasts available',
    'notify.mentions.title': 'Interaction Alerts',
    'notify.mentions.emptyTitle': 'No new interaction alerts',
    'notify.mentions.emptyDescLogged': 'Replies, likes, and boosts from other readers will appear here in real time.',
    'notify.mentions.emptyDescGuest': 'Set a nickname or sign in to receive alerts when others interact with you.',
    'notify.comments.title': 'Comment History',
    'notify.comments.refresh': 'Refresh',
    'notify.comments.refreshTitle': 'Refresh records from database',
    'notify.comments.postPrefix': 'Post: ',
    'notify.comments.defaultPost': 'Post comment',
    'notify.comments.loading': 'Loading comment records from database...',
    'notify.comments.emptyDesc': 'No comment records found. Post a comment at the bottom of any article to track your activity.',
    'settings.lang.title': 'Interface Language',
    'settings.notify.title': 'Notification Preferences',
    'settings.notify.broadcast.title': 'Site broadcasts and new post alerts',
    'settings.notify.broadcast.desc': 'Show pinned broadcasts and new article announcements in notification center.',
    'settings.notify.personal.title': 'Comment replies and reaction alerts',
    'settings.notify.personal.desc': 'Receive notifications when someone replies to your comment or reacts to it.',
    'settings.comments.title': 'Comment Preferences',
    'settings.comments.sort.title': 'Default comment sort order',
    'settings.comments.sort.desc': 'Choose default ordering for post comment threads.',
    'settings.comments.sort.new': '⏱️ Latest',
    'settings.comments.sort.new_label': 'Latest',
    'settings.comments.sort.hot': '🔥 Popular',
    'settings.comments.sort.hot_label': 'Popular',
    'settings.comments.location.title': 'Display location flag badges',
    'settings.comments.location.desc': 'Display country/region flag on comments; hide completely when off.',
    'settings.comments.collapse.title': 'Collapse nested replies by default',
    'settings.comments.collapse.desc': 'Collapse threaded replies (YouTube accordion style) to keep threads tidy.',
    'settings.a11y.title': 'Accessibility & Feedback',
    'settings.a11y.haptic.title': 'Sound and haptic feedback',
    'settings.a11y.haptic.desc': 'Provide gentle haptic feedback on supported mobile browsers.',
    'settings.a11y.scroll.title': 'Smooth scrolling transition',
    'settings.a11y.scroll.desc': 'Smooth scroll animation when navigating sections and anchors.',
    'settings.a11y.contrast.title': 'High contrast interface',
    'settings.a11y.contrast.desc': 'Enhance typography and border contrast for clearer readability.',
    'settings.compliance.note': 'Note: Location hiding only masks badges publicly. For anti-spam, security and compliance, connection IP is recorded in admin logs only and never shown publicly.',

    // Drawer Head Badge & Level System
    'drawer.headBadge.guest': 'Guest Mode · LV.0 Browsing',
    'level.title': 'Community Level & Trust System',
    'level.trustLevel': 'Trust Level',
    'level.readingTime': 'Reading Time',
    'level.activeDays': 'Active Days',
    'level.commentsCount': 'Comments',
    'level.reactionsCount': 'Reactions',
    'level.nextLevel': 'Next Level',
    'level.webmasterBadge': 'Webmaster Square Avatar',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.saved': 'Saved',
    'common.loading': 'Loading...',
    // Search Dialog
    'search.title': 'Site Search',
    'search.index': 'Content Index',
    'search.close': 'Close Search Panel',
    'search.placeholder': 'Search titles, abstracts or categories',
    'search.empty': 'No matching content found',
    // Console Dialog & Notice
    'console.title': 'Quick Console',
    'console.close': 'Close Console',
    'console.personal': 'Personal Hub',
    'console.status': 'System Status',
    'console.overview': 'Site Overview',
    'console.eyebrow': 'Console',
    'console.notice.title': 'Console Notice',
    'console.notice.close': 'Close Console Notice',
    'console.notice.unavailable': 'Console Currently Unavailable',
    'console.stat.posts': 'Posts',
    'console.stat.categories': 'Categories',
    'console.stat.tags': 'Tags',
    'console.stat.reading': 'Read',
    'console.activity.title': 'Activity Log',
    'console.activity.tips': 'Activity',
    'console.activity.empty': 'No contributions on this date',
    'console.activity.hint': 'Click a cell to view history',
    'console.btn.search': 'Search Content',
    'console.btn.bg': 'Toggle Background',
    'console.btn.notifications': 'View Notifications',
    'console.btn.random': 'Feeling Lucky',
    'console.btn.top': 'Back to Top',
    // Right Click Menu
    'menu.title': 'Context Menu',
    'menu.back': 'Back',
    'menu.forward': 'Forward',
    'menu.refresh': 'Refresh',
    'menu.top': 'Top',
    'menu.quote': 'Quote in comments',
    'menu.copyText': 'Copy selected text',
    'menu.copyUrl': 'Copy URL',
    'menu.search': 'Site Search',
    'menu.lightMode': 'Light Mode',
    'menu.darkMode': 'Dark Mode',
    'common.dismiss': 'Dismiss',
  },
  'fr': {
    // Extended System & Support i18n
    'support.heroBadge': 'Parrainage & Remerciements',
    'support.heroTitle': 'Offrez-moi un Café · Soutien',
    'support.heroDesc': 'Remerciements chaleureux à chaque lecteur et donateur. L affectation des fonds est transparente.',
    'support.pillStripe': 'Paiement International Stripe',
    'support.pillCn': 'WeChat / Alipay',
    'support.pillPaypal': 'PayPal Mondial',
    'support.pillCrypto': 'Crypto Web3',
    'support.stripeTitle': 'Caisse Internationale Stripe',
    'support.stripeSubtitle': 'Choisissez le Montant & Message',
    'support.localCurrency': 'Devise Locale',
    'support.globalCurrency': 'Devise Globale Unifiée',
    'support.recommendedTiers': 'Paliers Recommandés',
    'support.pppNotice': '⚡ Ajusté selon la Parité de Pouvoir d Achat (PPA)',
    'support.gradientNotice': 'Paliers de pourboire adaptés',
    'support.customAmountLabel': 'Montant Personnalisé',
    'support.supporterName': 'Nom / Pseudo (Registre Public)',
    'support.namePlaceholder': 'Votre nom dans le registre public...',
    'support.supporterMessage': 'Message d encouragement (Optionnel)',
    'support.messagePlaceholder': 'Laissez un mot d encouragement à l auteur...',
    'support.optional': 'Optionnel',
    'support.checkoutBtn': 'Accéder au Paiement Sécurisé',
    'support.stripeFootnote': 'Chiffrement bancaire 256 bits et protection antifraude propulsés par Stripe',
    'support.channelsTitle': 'Canaux de Paiement Locaux & Mondiaux',
    'support.tabCn': 'Canaux Nationaux',
    'support.tabHk': 'Hong Kong & Monde',
    'support.tabPaypal': 'PayPal',
    'support.tabCrypto': 'Crypto Web3',
    'support.rosterBadge': 'Registre Public des Donateurs',
    'support.table.purpose': 'Affectation des Fonds',
    'support.faqTitle': 'Foire Aux Questions',
    'support.title': 'Formules de Parrainage & Soutien',
    'support.tier0.title': 'Sachet de Café Soluble',
    'support.tier0.desc': 'Gobelet carton & sachet · Première gorgée légère d énergie matinale',
    'support.tier1.title': 'Gobelet à Emporter Classique',
    'support.tier1.desc': 'Gobelet à emporter classique · Americano fraîchement moulu sur le pouce',
    'support.tier2.title': 'Tasse en Porcelaine Artisanale',
    'support.tier2.desc': 'Tasse en céramique artisanale · Moments doux de café filtre et cappuccino',
    'support.tier3.title': 'Verseuse Manuelle Professionnelle',
    'support.tier3.desc': 'Bouilloire col de cygne & filtre · Extraction geek et arômes intenses',
    'support.tier4.title': 'Grains Purs de Terroir',
    'support.tier4.desc': 'Grains Geisha & Éthiopie séchés au soleil · Exploration de saveurs pures',
    'support.tier5.title': 'Atelier Dégustation Café en Duo',
    'support.tier5.desc': 'Infusion lente & échanges techniques · Co-création durable du jardin digital',
    'support.customAmount': 'Montant de Don Personnalisé',
    'support.table.sponsor': 'Donateur',
    'support.table.amount': 'Montant',
    'support.table.message': 'Message / Vœu',
    'support.table.date': 'Date',
    'support.table.channel': 'Moyen de Paiement',
    'support.search.placeholder': 'Rechercher un pseudo ou un message...',
    'support.toast.copy': 'Adresse copiée dans le presse-papier !',
    'support.qr.save': 'Cliquez ou appuyez longuement pour enregistrer le QR Code',
    'support.stripe.btn': 'Cartes Bancaires · Apple / Google Pay (Stripe)',
    'support.records.title': 'Historique & Tableau des Dons',
    'support.records.subtitle': 'Merci chaleureusement à chaque lecteur pour votre générosité',
    'support.records.empty': 'Aucun don enregistré pour l instant',
    'support.coffee.tierPrefix': 'Niveau',
    'shortcut.title': 'Raccourcis Clavier',
    'shortcut.search': 'Ouvrir la Recherche',
    'shortcut.console': 'Ouvrir le Tableau de Bord',
    'shortcut.theme': 'Changer le Thème Clair/Sombre',
    'shortcut.music': 'Basculer la Musique',
    'shortcut.random': 'Article Aléatoire',
    'shortcut.home': 'Retour à l Accueil',
    'console.status.totalWords': 'Nombre Total de Mots',
    'console.status.totalWordsTooltip': 'Calcul en temps réel sur l ensemble des fichiers Markdown du blog',
    'console.status.uptime': 'Jours de Fonctionnement Stable',
    'console.status.uptimeTooltip': 'Durée de fonctionnement ininterrompu depuis le 01/01/2024',
    'console.status.latestPost': 'Dernière Mise à Jour',
    'console.status.latestPostTooltip': 'Horodatage exact du contenu le plus récent',
    'console.status.protocol': 'Protocole du Moteur',
    'console.status.protocolTooltip': 'Version du moteur shijianus-blog et protocole',
    'console.status.activityLevel': 'Niveau d Activité',
    'console.status.activityLevelTooltip': 'Note d activité calculée sur les publications des 30 derniers jours',
    'console.status.density': 'Densité de Contenu',
    'console.status.densityTooltip': 'Densité d information basée sur la longueur moyenne des articles',
    'console.status.readingTime': 'Temps de Lecture Total',
    'console.status.readingTimeTooltip': 'Durée moyenne totale de lecture de tous les articles publics',
    'console.status.architecture': 'Architecture Système',
    'console.status.architectureTooltip': 'Architecture moderne et réactive basée sur Astro & Edge Functions',
    'console.status.buildEngine': 'Moteur de Build',
    'console.status.buildEngineTooltip': 'Génération statique ultra-rapide et rendu hybride basés sur Vite et Astro avec découpage optimisé.',
    'console.status.styling': 'Fondation Style',
    'console.status.stylingTooltip': 'Système visuel réactif et performant via un framework CSS utilitaire garantissant une vitesse d exécution optimale.',
    'console.status.deployNodes': 'Nœuds Edge',
    'console.status.deployNodesTooltip': 'Réseau mondial à faible latence sur Vercel et Cloudflare avec exécution de fonctions serverless.',
    'console.status.latency': 'Temps de Réponse',
    'console.status.latencyTooltip': 'Chargement initial instantané et retour interactif sous le seuil de perception grâce aux calculs en bordure.',
    'toast.maxTitles': '4 titres maximum à la fois. Veuillez en désélectionner un d abord.',
    'toast.updateTitles': 'Titres de profil mis à jour',
    'toast.updateStatus': 'Statut utilisateur mis à jour',
    'toast.themeDark': 'Passage en mode sombre',
    'toast.themeLight': 'Passage en mode clair',
    'toast.fillNickname': 'Veuillez d abord renseigner un pseudo.',
    'toast.profileUpdated': 'Profil mis à jour avec succès.',
    'toast.profileCreated': 'Compte créé avec succès.',
    'toast.loggedOut': 'Déconnecté. Les commentaires sont en lecture seule.',
    'toast.epomailVerifying': 'Vérification des identifiants Epomail...',
    'toast.epomailSuccess': 'Connexion Epomail réussie ! Bienvenue, ',
    'toast.epomailError': 'Échec de l échange Epomail. Veuillez réessayer.',
    'toast.epomailWindow': 'Veuillez finaliser l autorisation dans la fenêtre pop-up...',
    'toast.epomailRequireEmail': 'Veuillez saisir votre adresse ou identifiant Epomail',
    'post.copyright.author': 'Auteur',
    'post.copyright.link': 'Lien de l Article',
    'post.copyright.license': 'Mentions Légales',
    'post.copyright.licenseDesc': 'Publié sous licence CC BY-NC-SA 4.0. Merci de citer l auteur et la source.',
    'post.outdate.prefix': 'Cet article a été publié il y a',
    'post.outdate.suffix': 'jours. Certains détails techniques peuvent avoir évolué.',
    'post.nav.prev': 'Article Précédent',
    'post.nav.next': 'Article Suivant',
    'post.related.title': 'Articles Recommandés',
    'nav.mobileCloseAria': 'Fermer le menu mobile',
    'nav.mobileNavAria': 'Navigation mobile',
    'nav.submenuAria': 'Sous-page',

    'drawer.eyebrow': 'ESPACE LECTEUR · Centre de lecture',
    'drawer.title': 'Centre de Compte',
    'drawer.close': 'Fermer le panneau de compte',
    'hero.avatarTitle': 'Cliquer pour changer d avatar (supporte téléversement local)',
    'hero.avatarChange': 'Changer',
    'hero.guestFriend': 'Visiteur invité',
    'hero.badge.guest': 'Mode Invité',
    'hero.badge.local': 'Lecteur Local',
    'hero.badge.epomail': '⚡ Vérifié Epomail',
    'hero.badge.admin': 'Administrateur',
    'hero.boundIdentity': 'Identité de commentaire liée',
    'hero.emptyBio': 'Cliquez pour définir bio, fuseau et lieu',
    'hero.signout': 'Déconnexion',
    'hero.quickLogin': 'Connexion Rapide',
    'hero.localHint': 'Mode lecteur local. Vous pouvez vous connecter avec Epomail.',
    'hero.guestHint': 'Actuellement en mode visiteur. Entrez un nom pour commenter.',
    'tab.auth': 'Profil',
    'tab.notifications': 'Alertes',
    'tab.settings': 'Préférences',
    'profile.card.title': 'Paramètres du profil',
    'profile.field.name': 'Nom public (Username)',
    'profile.field.namePlaceholder': 'Nom affiché publiquement',
    'profile.field.website': 'Site Web',
    'profile.field.websitePlaceholder': 'https://example.com',
    'profile.field.bio': 'Biographie',
    'profile.field.bioPlaceholder': 'Courte présentation',
    'profile.field.timezone': 'Fuseau horaire',
    'profile.field.timezonePlaceholder': 'Détection auto ou sélection',
    'profile.field.detectTz': 'Détecter',
    'profile.field.detectTzTitle': 'Détecter le fuseau local',
    'profile.field.location': 'Emplacement',
    'profile.field.locationPlaceholder': 'Détection auto ou personnalisé',
    'profile.field.detectLoc': 'Localiser',
    'profile.field.detectLocTitle': 'Actualiser la géolocalisation',
    'profile.btn.save': 'Enregistrer',
    'profile.avatar.title': 'Gestion de l avatar',
    'profile.avatar.upload': 'Téléverser un avatar',
    'profile.avatar.reset': '↺ Rétablir l avatar Epomail',
    'epomail.card.title': 'Authentification EpoCanvas Mail',
    'epomail.card.desc': 'Connexion sécurisée via le serveur Epomail pour synchroniser profil et commentaires.',
    'epomail.benefit.pwdless': 'Auth 1-clic sans mot de passe',
    'epomail.benefit.avatar': 'Synchronisation avatar',
    'epomail.benefit.instant': 'Alertes instantanées',
    'epomail.btn.login': 'Connexion avec Epomail',
    'epomail.direct.toggle': 'Accès direct webmaster / développeur',
    'epomail.direct.email': 'E-mail Epomail',
    'epomail.direct.password': 'Mot de passe',
    'epomail.direct.passwordPlaceholder': 'Entrez le mot de passe',
    'epomail.direct.totp': 'Code TOTP (Optionnel)',
    'epomail.direct.totpPlaceholder': 'Entrez TOTP à 6 chiffres si 2FA activée',
    'epomail.scope.title': 'Cette autorisation permettra :',
    'epomail.scope.profile': 'Accès au profil public (nom et avatar)',
    'epomail.scope.email': 'Vérifier l e-mail comme auteur de commentaire',
    'epomail.scope.notify': 'Recevoir notifications de réponses et mentions @',
    'epomail.direct.verifying': 'Vérification en cours...',
    'epomail.direct.submit': 'Vérifier et accorder les accès',
    'local.auth.title': 'Lecteur local sans mot de passe',
    'local.auth.desc': 'Enregistrement rapide avec pseudo et e-mail dans le navigateur.',
    'local.btn.login': 'Enregistrer localement',
    'notify.partition.broadcast': 'Annonces globales',
    'notify.partition.personal': 'Interactions & Activité',
    'notify.broadcast.title': 'Annonces & Mises à jour',
    'notify.broadcast.readMore': 'Lire détails',
    'notify.broadcast.empty': 'Aucune annonce disponible',
    'notify.mentions.title': 'Alertes d interaction',
    'notify.mentions.emptyTitle': 'Aucune nouvelle notification',
    'notify.mentions.emptyDescLogged': 'Les réponses, mentions j aime et boosts apparaîtront ici en direct.',
    'notify.mentions.emptyDescGuest': 'Définissez un pseudo ou connectez-vous pour être averti lors d interactions.',
    'notify.comments.title': 'Mes commentaires',
    'notify.comments.refresh': 'Actualiser',
    'notify.comments.refreshTitle': 'Actualiser depuis la base de données',
    'notify.comments.postPrefix': 'Article : ',
    'notify.comments.defaultPost': 'Commentaire d article',
    'notify.comments.loading': 'Chargement des commentaires depuis la base de données...',
    'notify.comments.emptyDesc': 'Aucun commentaire enregistré. Publiez un commentaire sous un article pour enregistrer votre activité.',
    'settings.lang.title': 'Langue de l interface',
    'settings.notify.title': 'Préférences de notification',
    'settings.notify.broadcast.title': 'Annonces du site et nouveaux articles',
    'settings.notify.broadcast.desc': 'Afficher les avis du blogueur et nouveaux articles dans les notifications.',
    'settings.notify.personal.title': 'Réponses aux commentaires et réactions',
    'settings.notify.personal.desc': 'Recevoir des alertes lors de réponses ou de mentions.',
    'settings.comments.title': 'Préférences des commentaires',
    'settings.comments.sort.title': 'Tri par défaut des commentaires',
    'settings.comments.sort.desc': 'Mode de tri prioritaire lors de l accès aux articles.',
    'settings.comments.sort.new': '⏱️ Récents',
    'settings.comments.sort.new_label': 'Récents',
    'settings.comments.sort.hot': '🔥 Populaires',
    'settings.comments.sort.hot_label': 'Populaires',
    'settings.comments.location.title': 'Afficher le drapeau de pays/région',
    'settings.comments.location.desc': 'Afficher le drapeau géographique sur vos commentaires.',
    'settings.comments.collapse.title': 'Replier les réponses par défaut',
    'settings.comments.collapse.desc': 'Replier les sous-réponses (style accordéon YouTube) pour plus de clarté.',
    'settings.a11y.title': 'Accessibilité & Retour tactile',
    'settings.a11y.haptic.title': 'Sons et retour haptique',
    'settings.a11y.haptic.desc': 'Retour tactile léger sur navigateurs mobiles compatibles.',
    'settings.a11y.scroll.title': 'Défilement fluide',
    'settings.a11y.scroll.desc': 'Transition animée et fluide lors des sauts de section.',
    'settings.a11y.contrast.title': 'Interface à contraste élevé',
    'settings.a11y.contrast.desc': 'Renforcer le contraste du texte et des bordures.',
    'settings.compliance.note': 'Remarque : Le masquage ne s applique qu en public. Pour des raisons anti-spam et de sécurité, l IP de connexion est enregistrée pour les administrateurs uniquement.',

    // Drawer Head Badge & Level System
    'drawer.headBadge.guest': 'Mode Invité · LV.0 Initial',
    'level.title': 'Niveaux & Confiance',
    'level.trustLevel': 'Niveau de confiance',
    'level.readingTime': 'Temps de lecture',
    'level.activeDays': 'Jours actifs',
    'level.commentsCount': 'Commentaires',
    'level.reactionsCount': 'Réactions',
    'level.nextLevel': 'Niveau suivant',
    'level.webmasterBadge': 'Avatar carré du Webmestre',
    'common.close': 'Fermer',
    'common.save': 'Enregistrer',
    'common.saved': 'Enregistré',
    'common.loading': 'Chargement...',
    // Search Dialog
    'search.title': 'Recherche du site',
    'search.index': 'Index du contenu',
    'search.close': 'Fermer la recherche',
    'search.placeholder': 'Rechercher titres, résumés ou catégories',
    'search.empty': 'Aucun contenu correspondant trouvé',
    // Console Dialog & Notice
    'console.title': 'Console Rapide',
    'console.close': 'Fermer la console',
    'console.personal': 'Espace personnel',
    'console.status': 'État du système',
    'console.overview': 'Aperçu du site',
    'console.eyebrow': 'Console',
    'console.notice.title': 'Notice de la console',
    'console.notice.close': 'Fermer la notice de la console',
    'console.notice.unavailable': 'Console actuellement indisponible',
    'console.stat.posts': 'Articles',
    'console.stat.categories': 'Catégories',
    'console.stat.tags': 'Étiquettes',
    'console.stat.reading': 'Lecture',
    'console.activity.title': 'Historique des mises à jour',
    'console.activity.tips': 'Activité',
    'console.activity.empty': 'Aucune contribution à cette date',
    'console.activity.hint': 'Cliquez sur une case pour voir l\'historique',
    'console.btn.search': 'Rechercher',
    'console.btn.bg': 'Changer l\'arrière-plan',
    'console.btn.notifications': 'Voir les notifications',
    'console.btn.random': 'Au hasard',
    'console.btn.top': 'Retour en haut',
    // Right Click Menu
    'menu.title': 'Menu contextuel',
    'menu.back': 'Retour',
    'menu.forward': 'Avancer',
    'menu.refresh': 'Actualiser',
    'menu.top': 'Haut',
    'menu.quote': 'Citer dans les commentaires',
    'menu.copyText': 'Copier le texte sélectionné',
    'menu.copyUrl': 'Copier l\'adresse',
    'menu.search': 'Recherche du site',
    'menu.lightMode': 'Mode clair',
    'menu.darkMode': 'Mode sombre',
    'common.dismiss': 'Compris',
  },
  'es': {
    // Extended System & Support i18n
    'support.heroBadge': 'Patrocinio y Agradecimientos',
    'support.heroTitle': 'Invítame a un Café · Apoyo',
    'support.heroDesc': 'Agradecimiento sincero a cada lector y colaborador. La asignación de fondos es transparente.',
    'support.pillStripe': 'Caja Internacional Stripe',
    'support.pillCn': 'WeChat / Alipay',
    'support.pillPaypal': 'PayPal Global',
    'support.pillCrypto': 'Criptomonedas Web3',
    'support.stripeTitle': 'Caja Internacional Stripe',
    'support.stripeSubtitle': 'Elige Monto y Mensaje',
    'support.localCurrency': 'Moneda Local',
    'support.globalCurrency': 'Moneda Global Unificada',
    'support.recommendedTiers': 'Niveles Recomendados',
    'support.pppNotice': '⚡ Ajustado por Paridad de Poder Adquisitivo (PPA)',
    'support.gradientNotice': 'Gradientes de apoyo populares',
    'support.customAmountLabel': 'Monto Personalizado',
    'support.supporterName': 'Nombre / Alias (Registro Público)',
    'support.namePlaceholder': 'Tu nombre en el registro público...',
    'support.supporterMessage': 'Mensaje de apoyo (Opcional)',
    'support.messagePlaceholder': 'Deja unas palabras de aliento al autor...',
    'support.optional': 'Opcional',
    'support.checkoutBtn': 'Proceder al Pago Seguro',
    'support.stripeFootnote': 'Cifrado de grado bancario de 256 bits y prevención de fraude con Stripe',
    'support.channelsTitle': 'Canales de Pago Locales e Internacionales',
    'support.tabCn': 'Canaux Nacionales',
    'support.tabHk': 'Hong Kong y Global',
    'support.tabPaypal': 'PayPal',
    'support.tabCrypto': 'Cripto Web3',
    'support.rosterBadge': 'Registro Público de Agradecimiento',
    'support.table.purpose': 'Destino de Fondos',
    'support.faqTitle': 'Preguntas Frecuentes',
    'support.title': 'Planes de Patrocinio y Apoyo',
    'support.tier0.title': 'Sobre de Café Soluble',
    'support.tier0.desc': 'Vaso de papel y sobre · Primer sorbo ligero de energía matutina',
    'support.tier1.title': 'Vaso Clásico para Llevar',
    'support.tier1.desc': 'Vaso clásico para llevar · Café americano recién molido al paso',
    'support.tier2.title': 'Taza de Cerámica Artesanal',
    'support.tier2.desc': 'Taza de porcelana artesanal · Momentos acogedores de café filtro y capuchino',
    'support.tier3.title': 'Jarra de Filtrado Profesional',
    'support.tier3.desc': 'Hervidor de cuello de cisne y gotero · Extracción geek y aromas profundos',
    'support.tier4.title': 'Café de Especialidad de Origen Único',
    'support.tier4.desc': 'Granos Geisha y Etiopía secados al sol · Explorando sabores supremos',
    'support.tier5.title': 'Taller de Café y Diálogo Profundo',
    'support.tier5.desc': 'Extracción pausada y debate técnico · Co-creación del jardín digital',
    'support.customAmount': 'Monto de Donación Personalizado',
    'support.table.sponsor': 'Patrocinador',
    'support.table.amount': 'Monto',
    'support.table.message': 'Mensaje / Dedicatoria',
    'support.table.date': 'Fecha',
    'support.table.channel': 'Canal de Pago',
    'support.search.placeholder': 'Buscar nombre o mensaje de patrocinador...',
    'support.toast.copy': '¡Dirección copiada al portapapeles!',
    'support.qr.save': 'Haz clic o mantén presionado para guardar el código QR',
    'support.stripe.btn': 'Tarjetas · Apple / Google Pay (Stripe)',
    'support.records.title': 'Historial de Patrocinios',
    'support.records.subtitle': 'Muchas gracias a cada lector por su generoso apoyo y palabras',
    'support.records.empty': 'No se encontraron registros de patrocinio',
    'support.coffee.tierPrefix': 'Nivel',
    'shortcut.title': 'Atajos de Teclado',
    'shortcut.search': 'Abrir Búsqueda',
    'shortcut.console': 'Abrir Consola de Control',
    'shortcut.theme': 'Alternar Tema Claro/Oscuro',
    'shortcut.music': 'Reproductor de Música',
    'shortcut.random': 'Artículo Aleatorio',
    'shortcut.home': 'Volver al Inicio',
    'console.status.totalWords': 'Total de Palabras',
    'console.status.totalWordsTooltip': 'Recuento de palabras escaneado en tiempo real en todos los artículos Markdown',
    'console.status.uptime': 'Días de Funcionamiento Continuo',
    'console.status.uptimeTooltip': 'Registro de operatividad continua desde el 01/01/2024',
    'console.status.latestPost': 'Última Actualización',
    'console.status.latestPostTooltip': 'Marca de tiempo exacta del contenido o función más reciente',
    'console.status.protocol': 'Protocolo del Motor',
    'console.status.protocolTooltip': 'Versión y protocolo del motor central shijianus-blog',
    'console.status.activityLevel': 'Nivel de Actividad',
    'console.status.activityLevelTooltip': 'Calificación calculada en base a las publicaciones de los últimos 30 días',
    'console.status.density': 'Densidad de Contenido',
    'console.status.densityTooltip': 'Densidad de información basada en la longitud media de los artículos',
    'console.status.readingTime': 'Tiempo de Lectura Total',
    'console.status.readingTimeTooltip': 'Promedio de lectura de todos los contenidos públicos',
    'console.status.architecture': 'Arquitectura del Sistema',
    'console.status.architectureTooltip': 'Arquitectura moderna y reactiva basada en Astro y Edge Functions',
    'console.status.buildEngine': 'Motor de Build',
    'console.status.buildEngineTooltip': 'Generación estática ultrarrápida y renderizado híbrido impulsados por Vite y Astro con empaquetado optimizado.',
    'console.status.styling': 'Capa de Estilos',
    'console.status.stylingTooltip': 'Sistema de diseño receptivo de alto rendimiento implementado con un framework CSS atómico.',
    'console.status.deployNodes': 'Nodos Edge',
    'console.status.deployNodesTooltip': 'Red perimetral global de baja latencia con Vercel y Cloudflare con funciones sin servidor.',
    'console.status.latency': 'Latencia Activa',
    'console.status.latencyTooltip': 'Carga inicial e interacción instantáneas por debajo del umbral de percepción gracias al cómputo edge.',
    'toast.maxTitles': 'Máximo 4 títulos permitidos a la vez. Deselecciona uno primero.',
    'toast.updateTitles': 'Títulos de insignia actualizados',
    'toast.updateStatus': 'Estado de usuario actualizado',
    'toast.themeDark': 'Cambiado a Modo Oscuro',
    'toast.themeLight': 'Cambiado a Modo Claro',
    'toast.fillNickname': 'Por favor ingresa un nombre o alias primero.',
    'toast.profileUpdated': 'Perfil actualizado con éxito.',
    'toast.profileCreated': 'Cuenta creada con éxito.',
    'toast.loggedOut': 'Sesión cerrada. Los comentarios son solo de lectura.',
    'toast.epomailVerifying': 'Verificando credenciales Epomail...',
    'toast.epomailSuccess': '¡Inicio de sesión Epomail exitoso! Bienvenido, ',
    'toast.epomailError': 'Error al canjear credenciales Epomail. Inténtalo de nuevo.',
    'toast.epomailWindow': 'Por favor completa la autorización en la ventana emergente...',
    'toast.epomailRequireEmail': 'Por favor introduce tu cuenta o correo de Epomail',
    'post.copyright.author': 'Autor',
    'post.copyright.link': 'Enlace del Artículo',
    'post.copyright.license': 'Aviso de Derechos',
    'post.copyright.licenseDesc': 'Publicado bajo licencia CC BY-NC-SA 4.0. Se requiere atribuir la autoría y origen.',
    'post.outdate.prefix': 'Este artículo se publicó hace',
    'post.outdate.suffix': 'días. Algunos detalles técnicos pueden haber evolucionado.',
    'post.nav.prev': 'Artículo Anterior',
    'post.nav.next': 'Artículo Siguiente',
    'post.related.title': 'Lecturas Recomendadas',
    'nav.mobileCloseAria': 'Cerrar menú móvil',
    'nav.mobileNavAria': 'Navegación móvil',
    'nav.submenuAria': 'Subpágina',

    'drawer.eyebrow': 'CENTRO DE LECTORES · Espacio de lectura',
    'drawer.title': 'Centro de Cuenta',
    'drawer.close': 'Cerrar panel de cuenta',
    'hero.avatarTitle': 'Haga clic para cambiar avatar (soporta subida local)',
    'hero.avatarChange': 'Cambiar',
    'hero.guestFriend': 'Visitante invitado',
    'hero.badge.guest': 'Modo Invitado',
    'hero.badge.local': 'Lector Local',
    'hero.badge.epomail': '⚡ Epomail Verificado',
    'hero.badge.admin': 'Administrador',
    'hero.boundIdentity': 'Identidad de comentarios vinculada',
    'hero.emptyBio': 'Haga clic para configurar bio, zona y ubicación',
    'hero.signout': 'Cerrar sesión',
    'hero.quickLogin': 'Acceso Rápido',
    'hero.localHint': 'Modo lector local. Puede iniciar sesión con Epomail en cualquier momento.',
    'hero.guestHint': 'Modo invitado. Ingrese un nombre para comentar.',
    'tab.auth': 'Perfil',
    'tab.notifications': 'Avisos',
    'tab.settings': 'Preferencias',
    'profile.card.title': 'Ajustes del Perfil',
    'profile.field.name': 'Nombre de usuario',
    'profile.field.namePlaceholder': 'Nombre visible públicamente',
    'profile.field.website': 'Sitio Web Personal',
    'profile.field.websitePlaceholder': 'https://example.com',
    'profile.field.bio': 'Biografía',
    'profile.field.bioPlaceholder': 'Breve presentación personal',
    'profile.field.timezone': 'Zona horaria',
    'profile.field.timezonePlaceholder': 'Autodetectar o seleccionar',
    'profile.field.detectTz': 'Detectar',
    'profile.field.detectTzTitle': 'Detectar zona horaria local',
    'profile.field.location': 'Ubicación',
    'profile.field.locationPlaceholder': 'Autodetectar o personalizado',
    'profile.field.detectLoc': 'Localizar',
    'profile.field.detectLocTitle': 'Actualizar geolocalización de red',
    'profile.btn.save': 'Guardar Cambios',
    'profile.avatar.title': 'Gestión de Avatar',
    'profile.avatar.upload': 'Subir nuevo avatar',
    'profile.avatar.reset': '↺ Restaurar avatar de Epomail',
    'epomail.card.title': 'Autenticación EpoCanvas Mail',
    'epomail.card.desc': 'Conéctese al servidor oficial de Epomail para inicio de sesión unificado y avatar sincronizado.',
    'epomail.benefit.pwdless': 'Autenticación en 1 clic',
    'epomail.benefit.avatar': 'Sincronización de avatar',
    'epomail.benefit.instant': 'Alertas instantáneas',
    'epomail.btn.login': 'Iniciar sesión con Epomail',
    'epomail.direct.toggle': 'Acceso directo webmaster / desarrollador',
    'epomail.direct.email': 'Correo Epomail',
    'epomail.direct.password': 'Contraseña',
    'epomail.direct.passwordPlaceholder': 'Ingrese la contraseña',
    'epomail.direct.totp': 'Código TOTP (Opcional)',
    'epomail.direct.totpPlaceholder': 'Ingrese TOTP de 6 dígitos si 2FA activo',
    'epomail.scope.title': 'Esta autorización permitirá:',
    'epomail.scope.profile': 'Acceder al perfil público (nombre y avatar)',
    'epomail.scope.email': 'Verificar correo como autor de comentario',
    'epomail.scope.notify': 'Recibir alertas de menciones @ y respuestas',
    'epomail.direct.verifying': 'Verificando autorización...',
    'epomail.direct.submit': 'Verificar y conceder permisos',
    'local.auth.title': 'Registro de lector local',
    'local.auth.desc': 'Registro sin contraseña usando alias y correo en su navegador.',
    'local.btn.login': 'Registrarse Localmente',
    'notify.partition.broadcast': 'Avisos globales',
    'notify.partition.personal': 'Interacciones y Actividad',
    'notify.broadcast.title': 'Avisos del Sitio & Actualizaciones',
    'notify.broadcast.readMore': 'Ver detalles',
    'notify.broadcast.empty': 'No hay avisos disponibles',
    'notify.mentions.title': 'Alertas de interacción',
    'notify.mentions.emptyTitle': 'No hay nuevas alertas de interacción',
    'notify.mentions.emptyDescLogged': 'Las respuestas, me gusta y boosts aparecerán aquí en tiempo real.',
    'notify.mentions.emptyDescGuest': 'Configure un alias o inicie sesión para recibir alertas cuando interactúen con usted.',
    'notify.comments.title': 'Mis comentarios',
    'notify.comments.refresh': 'Actualizar',
    'notify.comments.refreshTitle': 'Actualizar desde base de datos',
    'notify.comments.postPrefix': 'Artículo: ',
    'notify.comments.defaultPost': 'Comentario de post',
    'notify.comments.loading': 'Cargando historial de comentarios desde la base de datos...',
    'notify.comments.emptyDesc': 'No hay registros de comentarios. Publique un comentario en cualquier artículo para guardar su actividad.',
    'settings.lang.title': 'Idioma de la interfaz',
    'settings.notify.title': 'Preferencias de notificaciones',
    'settings.notify.broadcast.title': 'Difusión y nuevas publicaciones',
    'settings.notify.broadcast.desc': 'Mostrar anuncios del sitio y nuevos artículos destacados.',
    'settings.notify.personal.title': 'Respuestas a comentarios y me gusta',
    'settings.notify.personal.desc': 'Recibir alertas cuando alguien responda o reaccione a tus comentarios.',
    'settings.comments.title': 'Preferencias de comentarios',
    'settings.comments.sort.title': 'Orden predeterminado de comentarios',
    'settings.comments.sort.desc': 'Seleccione el criterio prioritario para la lista de comentarios.',
    'settings.comments.sort.new': '⏱️ Más recientes',
    'settings.comments.sort.new_label': 'Recientes',
    'settings.comments.sort.hot': '🔥 Más populares',
    'settings.comments.sort.hot_label': 'Populares',
    'settings.comments.location.title': 'Mostrar bandera de país/región',
    'settings.comments.location.desc': 'Mostrar bandera de ubicación geográfica en comentarios.',
    'settings.comments.collapse.title': 'Plegar respuestas anidadas',
    'settings.comments.collapse.desc': 'Plegar respuestas múltiples (estilo acordeón de YouTube) para mayor claridad.',
    'settings.a11y.title': 'Accesibilidad y Respuesta háptica',
    'settings.a11y.haptic.title': 'Sonido y respuesta háptica',
    'settings.a11y.haptic.desc': 'Vibración suave en navegadores móviles compatibles.',
    'settings.a11y.scroll.title': 'Desplazamiento suave',
    'settings.a11y.scroll.desc': 'Transición animada y fluida al saltar entre secciones.',
    'settings.a11y.contrast.title': 'Alto contraste de interfaz',
    'settings.a11y.contrast.desc': 'Aumentar contraste tipográfico y bordes para mejor lectura.',
    'settings.compliance.note': 'Nota: La ocultación solo aplica públicamente. Por seguridad y prevención de spam, la IP se registra solo en el panel de administración y nunca se publica.',

    // Drawer Head Badge & Level System
    'drawer.headBadge.guest': 'Modo Invitado · LV.0 Inicial',
    'level.title': 'Niveles y Confianza',
    'level.trustLevel': 'Nivel de confianza',
    'level.readingTime': 'Tiempo de lectura',
    'level.activeDays': 'Días activos',
    'level.commentsCount': 'Comentarios',
    'level.reactionsCount': 'Reacciones',
    'level.nextLevel': 'Siguiente nivel',
    'level.webmasterBadge': 'Avatar cuadrado del Webmaster',
    'common.close': 'Cerrar',
    'common.save': 'Guardar',
    'common.saved': 'Guardado',
    'common.loading': 'Cargando...',
    // Search Dialog
    'search.title': 'Búsqueda del sitio',
    'search.index': 'Índice de contenido',
    'search.close': 'Cerrar panel de búsqueda',
    'search.placeholder': 'Buscar títulos, resúmenes o categorías',
    'search.empty': 'No se encontraron coincidencias',
    // Console Dialog & Notice
    'console.title': 'Consola Rápida',
    'console.close': 'Cerrar consola',
    'console.personal': 'Centro personal',
    'console.status': 'Estado del sistema',
    'console.overview': 'Resumen del sitio',
    'console.eyebrow': 'Consola',
    'console.notice.title': 'Aviso de consola',
    'console.notice.close': 'Cerrar aviso de consola',
    'console.notice.unavailable': 'Consola no disponible actualmente',
    'console.stat.posts': 'Artículos',
    'console.stat.categories': 'Categorías',
    'console.stat.tags': 'Etiquetas',
    'console.stat.reading': 'Lectura',
    'console.activity.title': 'Registro de actualizaciones',
    'console.activity.tips': 'Actividad',
    'console.activity.empty': 'Sin contribuciones en esta fecha',
    'console.activity.hint': 'Haz clic en una casilla para ver el historial',
    'console.btn.search': 'Buscar contenido',
    'console.btn.bg': 'Cambiar fondo',
    'console.btn.notifications': 'Ver notificaciones',
    'console.btn.random': 'Paseo aleatorio',
    'console.btn.top': 'Volver arriba',
    // Right Click Menu
    'menu.title': 'Menú contextual',
    'menu.back': 'Atrás',
    'menu.forward': 'Adelante',
    'menu.refresh': 'Actualizar',
    'menu.top': 'Arriba',
    'menu.quote': 'Citar en comentarios',
    'menu.copyText': 'Copiar texto seleccionado',
    'menu.copyUrl': 'Copiar dirección',
    'menu.search': 'Búsqueda del sitio',
    'menu.lightMode': 'Modo claro',
    'menu.darkMode': 'Modo oscuro',
    'common.dismiss': 'Entendido',
  },
  'de': {
    // Extended System & Support i18n
    'support.heroBadge': 'Sponsoring & Danksagung',
    'support.heroTitle': 'Spendier mir einen Kaffee · Unterstützung',
    'support.heroDesc': 'Herzlicher Dank an jeden großzügigen Leser und Unterstützer. Die Mittelverwendung wird transparent erfasst.',
    'support.pillStripe': 'Stripe Internationale Kasse',
    'support.pillCn': 'WeChat / Alipay',
    'support.pillPaypal': 'PayPal Global',
    'support.pillCrypto': 'Web3 Krypto',
    'support.stripeTitle': 'Stripe Internationale Kasse',
    'support.stripeSubtitle': 'Betrag & Nachricht wählen',
    'support.localCurrency': 'Lokale Währung',
    'support.globalCurrency': 'Einheitliche Globale Währung',
    'support.recommendedTiers': 'Empfohlene Stufen',
    'support.pppNotice': '⚡ Angepasst an die lokale Kaufkraftparität (KKP)',
    'support.gradientNotice': 'Adaptive Trinkgeld-Stufen',
    'support.customAmountLabel': 'Benutzerdefinierter Betrag',
    'support.supporterName': 'Name / Nickname (Öffentliche Liste)',
    'support.namePlaceholder': 'Ihr Name auf der öffentlichen Danksagungsliste...',
    'support.supporterMessage': 'Persönliche Nachricht (Optional)',
    'support.messagePlaceholder': 'Hinterlassen Sie eine ermutigende Nachricht an den Autor...',
    'support.optional': 'Optional',
    'support.checkoutBtn': 'Zur sicheren Kasse',
    'support.stripeFootnote': 'Bankübliche 256-Bit-Verschlüsselung und Betrugsschutz mit Stripe',
    'support.channelsTitle': 'Lokale & Internationale Zahlungskanäle',
    'support.tabCn': 'Inländische Kanäle',
    'support.tabHk': 'Hongkong & Global',
    'support.tabPaypal': 'PayPal',
    'support.tabCrypto': 'Web3 Krypto',
    'support.rosterBadge': 'Öffentliches Danksagungsregister',
    'support.table.purpose': 'Mittelverwendung',
    'support.faqTitle': 'Häufig gestellte Fragen',
    'support.title': 'Unterstützungs- & Sponsoringpläne',
    'support.tier0.title': 'Instant-Kaffee-Stick',
    'support.tier0.desc': 'Schneller Papierbecher & Stick · Leichter erster Schluck morgendlicher Energie',
    'support.tier1.title': 'Klassischer To-Go-Becher',
    'support.tier1.desc': 'Klassischer To-Go-Pappbecher · Frisch gebrühter Americano für unterwegs',
    'support.tier2.title': 'Feine Keramiktasse',
    'support.tier2.desc': 'Handgefertigte Porzellantasse · Gemütliche Filterkaffee- und Cappuccino-Momente',
    'support.tier3.title': 'Professionelle Handfilter-Kanne',
    'support.tier3.desc': 'Klassischer Schwanenhalskessel & Filter · Geek-Extraktion und tiefe Aromen',
    'support.tier4.title': 'Single-Origin Spezialitätenbohnen',
    'support.tier4.desc': 'Geisha & sonnengetrocknete äthiopische Bohnen · Erforschung feinster Nuancen',
    'support.tier5.title': 'Kaffee-Tisch & Vertiefungsgespräch',
    'support.tier5.desc': 'Langsames Aufbrühen & Fachaustausch · Gemeinsamer digitaler Garten',
    'support.customAmount': 'Benutzerdefinierter Spendenbetrag',
    'support.table.sponsor': 'Förderer',
    'support.table.amount': 'Betrag',
    'support.table.message': 'Grußnachricht',
    'support.table.date': 'Datum',
    'support.table.channel': 'Zahlungsweg',
    'support.search.placeholder': 'Förderer-Name oder Nachricht suchen...',
    'support.toast.copy': 'Adresse in die Zwischenablage kopiert!',
    'support.qr.save': 'Klicken oder gedrückt halten, um QR-Code zu speichern',
    'support.stripe.btn': 'Kreditkarten · Apple / Google Pay (Stripe)',
    'support.records.title': 'Sponsorenwand & Protokoll',
    'support.records.subtitle': 'Herzlichen Dank an jeden Leser für die großzügige Unterstützung',
    'support.records.empty': 'Keine Förderprotokolle gefunden',
    'support.coffee.tierPrefix': 'Stufe',
    'shortcut.title': 'Tastaturkürzel',
    'shortcut.search': 'Suchleiste öffnen',
    'shortcut.console': 'Konsole öffnen',
    'shortcut.theme': 'Hell-/Dunkel-Modus wechseln',
    'shortcut.music': 'Musikplayer umschalten',
    'shortcut.random': 'Zufälligen Beitrag lesen',
    'shortcut.home': 'Zurück zur Startseite',
    'console.status.totalWords': 'Gesamtwortzahl',
    'console.status.totalWordsTooltip': 'Echtzeit-gescannte Wortzahl aller Markdown-Beiträge des Blogs',
    'console.status.uptime': 'Tage im sicheren Betrieb',
    'console.status.uptimeTooltip': 'Kontinuierliche Betriebszeit seit dem 01.01.2024',
    'console.status.latestPost': 'Letzte Aktualisierung',
    'console.status.latestPostTooltip': 'Genauer Zeitstempel des neuesten Beitrags oder Features',
    'console.status.protocol': 'Engine-Protokoll',
    'console.status.protocolTooltip': 'shijianus-blog Kern-Engine-Version & Protokoll',
    'console.status.activityLevel': 'Aktivitätsstufe',
    'console.status.activityLevelTooltip': 'Aktivitätsbewertung basierend auf den Beiträgen der letzten 30 Tage',
    'console.status.density': 'Inhaltsdichte',
    'console.status.densityTooltip': 'Informationsdichte basierend auf der durchschnittlichen Beitragsdauer',
    'console.status.readingTime': 'Gesamte Lesezeit',
    'console.status.readingTimeTooltip': 'Durchschnittliche Gesamtlesezeit aller öffentlichen Inhalte',
    'console.status.architecture': 'Systemarchitektur',
    'console.status.architectureTooltip': 'Moderne reaktive Architektur basierend auf Astro & Edge Functions',
    'console.status.buildEngine': 'Build-Engine',
    'console.status.buildEngineTooltip': 'Blitzschnelle statische Generierung und hybrides Rendering mit modernem Vite und Astro.',
    'console.status.styling': 'Design-Ebene',
    'console.status.stylingTooltip': 'Hochperformantes responsives Designsystem basierend auf atomarem CSS für maximale Laufzeiteffizienz.',
    'console.status.deployNodes': 'Edge-Knoten',
    'console.status.deployNodesTooltip': 'Globales Edge-Netzwerk mit minimaler Latenz via Vercel und Cloudflare mit Serverless-Funktionen.',
    'console.status.latency': 'Reaktionszeit',
    'console.status.latencyTooltip': 'Unmerkliche Lade- und Reaktionszeiten durch optimiertes Pre-Rendering und Edge-Ressourcenplanung.',
    'toast.maxTitles': 'Maximal 4 Titel gleichzeitig. Bitte wählen Sie zuerst einen ab.',
    'toast.updateTitles': 'Abzeichentitel aktualisiert',
    'toast.updateStatus': 'Benutzerstatus aktualisiert',
    'toast.themeDark': 'Auf Dunkelmodus gewechselt',
    'toast.themeLight': 'Auf Hellmodus gewechselt',
    'toast.fillNickname': 'Bitte geben Sie zuerst einen Benutzernamen ein.',
    'toast.profileUpdated': 'Profil erfolgreich aktualisiert.',
    'toast.profileCreated': 'Konto erfolgreich erstellt.',
    'toast.loggedOut': 'Abgemeldet. Kommentare sind nun schreibgeschützt.',
    'toast.epomailVerifying': 'Epomail-Anmeldedaten werden überprüft...',
    'toast.epomailSuccess': 'Epomail-Autorisierung erfolgreich! Willkommen, ',
    'toast.epomailError': 'Epomail-Autorisierungsfehler. Bitte erneut versuchen.',
    'toast.epomailWindow': 'Bitte schließen Sie die Autorisierung im Popup-Fenster ab...',
    'toast.epomailRequireEmail': 'Bitte Epomail-Konto oder E-Mail eingeben',
    'post.copyright.author': 'Autor',
    'post.copyright.link': 'Beitragslink',
    'post.copyright.license': 'Urheberrecht',
    'post.copyright.licenseDesc': 'Lizenziert unter CC BY-NC-SA 4.0. Bitte nennen Sie den Autor und die Quelle.',
    'post.outdate.prefix': 'Dieser Beitrag wurde vor',
    'post.outdate.suffix': 'Tagen veröffentlicht. Manche Inhalte können sich weiterentwickelt haben.',
    'post.nav.prev': 'Vorheriger',
    'post.nav.next': 'Nächster',
    'post.related.title': 'Empfohlene Beiträge',
    'nav.mobileCloseAria': 'Mobiles Menü schließen',
    'nav.mobileNavAria': 'Mobile Navigation',
    'nav.submenuAria': 'Unterseite',

    'drawer.eyebrow': 'LESER-ZENTRALE · Lesebereich',
    'drawer.title': 'Konto-Zentrale',
    'drawer.close': 'Kontoverwaltung schließen',
    'hero.avatarTitle': 'Klicken, um Avatar zu ändern (unterstützt Bild-Upload)',
    'hero.avatarChange': 'Ändern',
    'hero.guestFriend': 'Gastleser',
    'hero.badge.guest': 'Gastmodus',
    'hero.badge.local': 'Lokaler Leser',
    'hero.badge.epomail': '⚡ Epomail Verifiziert',
    'hero.badge.admin': 'Administrator',
    'hero.boundIdentity': 'Kommentar-Identität verknüpft',
    'hero.emptyBio': 'Klicken für Biografie, Zeitzone und Ort',
    'hero.signout': 'Abmelden',
    'hero.quickLogin': 'Schnellanmeldung',
    'hero.localHint': 'Lokaler Lesermodus. Sie können sich jederzeit mit Epomail anmelden.',
    'hero.guestHint': 'Gastmodus. Geben Sie einen Namen ein, um zu kommentieren.',
    'tab.auth': 'Profil',
    'tab.notifications': 'Hinweise',
    'tab.settings': 'Einstellungen',
    'profile.card.title': 'Profileinstellungen',
    'profile.field.name': 'Benutzername',
    'profile.field.namePlaceholder': 'Öffentlich sichtbarer Name',
    'profile.field.website': 'Persönliche Website',
    'profile.field.websitePlaceholder': 'https://example.com',
    'profile.field.bio': 'Biografie',
    'profile.field.bioPlaceholder': 'Kurze Vorstellung',
    'profile.field.timezone': 'Zeitzone',
    'profile.field.timezonePlaceholder': 'Automatisch erkennen oder wählen',
    'profile.field.detectTz': 'Erkennen',
    'profile.field.detectTzTitle': 'Lokale Zeitzone erkennen',
    'profile.field.location': 'Standort',
    'profile.field.locationPlaceholder': 'Automatisch erkennen oder benutzerdefiniert',
    'profile.field.detectLoc': 'Lokalisieren',
    'profile.field.detectLocTitle': 'Netzwerk-Standort neu ermitteln',
    'profile.btn.save': 'Änderungen speichern',
    'profile.avatar.title': 'Avatar-Verwaltung',
    'profile.avatar.upload': 'Neuen Avatar hochladen',
    'profile.avatar.reset': '↺ Epomail-Avatar wiederherstellen',
    'epomail.card.title': 'EpoCanvas Mail Authentifizierung',
    'epomail.card.desc': 'Verbindung zum offiziellen Epomail-Server für einheitlichen Login und synchronisierten Avatar.',
    'epomail.benefit.pwdless': '1-Klick passwortlose Auth',
    'epomail.benefit.avatar': 'Cloud-Avatar Synchronisierung',
    'epomail.benefit.instant': 'Sofortige Antwort-Hinweise',
    'epomail.btn.login': 'Mit Epomail anmelden',
    'epomail.direct.toggle': 'Webmaster / Entwickler Direktzugang',
    'epomail.direct.email': 'Epomail E-Mail',
    'epomail.direct.password': 'Passwort',
    'epomail.direct.passwordPlaceholder': 'Passwort eingeben',
    'epomail.direct.totp': 'TOTP-Code (Optional)',
    'epomail.direct.totpPlaceholder': '6-stelligen TOTP eingeben wenn 2FA aktiv',
    'epomail.scope.title': 'Diese Autorisierung erlaubt:',
    'epomail.scope.profile': 'Zugriff auf öffentliches Profil (Name & Avatar)',
    'epomail.scope.email': 'E-Mail als Kommentar-Autor verifizieren',
    'epomail.scope.notify': 'Benachrichtigungen über @ Erwähnungen & Antworten',
    'epomail.direct.verifying': 'Autorisierung wird geprüft...',
    'epomail.direct.submit': 'Bestätigen und Berechtigungen erteilen',
    'local.auth.title': 'Lokale Leser-Registrierung',
    'local.auth.desc': 'Passwortlose Registrierung mit Name und E-Mail im Browser.',
    'local.btn.login': 'Lokal registrieren',
    'notify.partition.broadcast': 'Website-Mitteilungen',
    'notify.partition.personal': 'Interaktionen & Verlauf',
    'notify.broadcast.title': 'Website-Mitteilungen & Neuigkeiten',
    'notify.broadcast.readMore': 'Details lesen',
    'notify.broadcast.empty': 'Keine Mitteilungen vorhanden',
    'notify.mentions.title': 'Interaktions-Hinweise',
    'notify.mentions.emptyTitle': 'Keine neuen Interaktions-Hinweise',
    'notify.mentions.emptyDescLogged': 'Antworten, Likes und Boosts von anderen Lesern erscheinen hier in Echtzeit.',
    'notify.mentions.emptyDescGuest': 'Geben Sie einen Namen ein oder melden Sie sich an, um Hinweise zu erhalten.',
    'notify.comments.title': 'Meine Kommentare',
    'notify.comments.refresh': 'Aktualisieren',
    'notify.comments.refreshTitle': 'Aus Datenbank aktualisieren',
    'notify.comments.postPrefix': 'Beitrag: ',
    'notify.comments.defaultPost': 'Beitrags-Kommentar',
    'notify.comments.loading': 'Kommentarverlauf aus Datenbank wird geladen...',
    'notify.comments.emptyDesc': 'Keine Kommentare vorhanden. Schreiben Sie einen Kommentar unter einem Artikel, um ihn zu erfassen.',
    'settings.lang.title': 'Oberflächensprache',
    'settings.notify.title': 'Benachrichtigungseinstellungen',
    'settings.notify.broadcast.title': 'Website-Mitteilungen und neue Beiträge',
    'settings.notify.broadcast.desc': 'Ankündigungen und neue Artikel in der Mitteilungszentrale anzeigen.',
    'settings.notify.personal.title': 'Kommentar-Antworten und Reaktionen',
    'settings.notify.personal.desc': 'Benachrichtigungen erhalten, wenn jemand auf Ihre Kommentare antwortet.',
    'settings.comments.title': 'Kommentareinstellungen',
    'settings.comments.sort.title': 'Standard-Kommentarsortierung',
    'settings.comments.sort.desc': 'Bevorzugte Reihenfolge für Kommentare festlegen.',
    'settings.comments.sort.new': '⏱️ Neueste',
    'settings.comments.sort.new_label': 'Neueste',
    'settings.comments.sort.hot': '🔥 Beliebteste',
    'settings.comments.sort.hot_label': 'Beliebteste',
    'settings.comments.location.title': 'Länder-/Regionsflagge anzeigen',
    'settings.comments.location.desc': 'Standortflagge bei öffentlichen Kommentaren einblenden.',
    'settings.comments.collapse.title': 'Verschachtelte Antworten einklappen',
    'settings.comments.collapse.desc': 'Mehrstufige Antworten (YouTube-Akkordeon-Stil) standardmäßig einklappen.',
    'settings.a11y.title': 'Barrierefreiheit & Feedback',
    'settings.a11y.haptic.title': 'Sound und haptisches Feedback',
    'settings.a11y.haptic.desc': 'Sanfte Vibration auf kompatiblen Mobilgeräten.',
    'settings.a11y.scroll.title': 'Sanftes Scrollen',
    'settings.a11y.scroll.desc': 'Flüssige Übergänge beim Navigieren zu Abschnitten und Ankern.',
    'settings.a11y.contrast.title': 'Hoher Oberflächenkontrast',
    'settings.a11y.contrast.desc': 'Typografie- und Rahmenkontrast für verbesserte Lesbarkeit verstärken.',
    'settings.compliance.note': 'Hinweis: Die Verbergung betrifft nur die öffentliche Ansicht. Aus Sicherheits- und Antispam-Gründen wird die Verbindungs-IP nur intern protokolliert.',

    // Drawer Head Badge & Level System
    'drawer.headBadge.guest': 'Gastmodus · LV.0 Initial',
    'level.title': 'Community-Level & Vertrauen',
    'level.trustLevel': 'Vertrauensstufe',
    'level.readingTime': 'Lesezeit',
    'level.activeDays': 'Aktive Tage',
    'level.commentsCount': 'Kommentare',
    'level.reactionsCount': 'Reaktionen',
    'level.nextLevel': 'Nächstes Level',
    'level.webmasterBadge': 'Quadratischer Webmaster-Avatar',
    'common.close': 'Schließen',
    'common.save': 'Speichern',
    'common.saved': 'Gespeichert',
    'common.loading': 'Laden...',
    // Search Dialog
    'search.title': 'Websitesuche',
    'search.index': 'Inhaltsindex',
    'search.close': 'Suche schließen',
    'search.placeholder': 'Titel, Zusammenfassungen oder Kategorien durchsuchen',
    'search.empty': 'Keine passenden Inhalte gefunden',
    // Console Dialog & Notice
    'console.title': 'Schnellkonsole',
    'console.close': 'Konsole schließen',
    'console.personal': 'Persönlicher Bereich',
    'console.status': 'Betriebsstatus',
    'console.overview': 'Website-Übersicht',
    'console.eyebrow': 'Konsole',
    'console.notice.title': 'Konsolenhinweis',
    'console.notice.close': 'Konsolenhinweis schließen',
    'console.notice.unavailable': 'Konsole derzeit nicht verfügbar',
    'console.stat.posts': 'Beiträge',
    'console.stat.categories': 'Kategorien',
    'console.stat.tags': 'Schlagwörter',
    'console.stat.reading': 'Lesen',
    'console.activity.title': 'Aktualisierungsprotokoll',
    'console.activity.tips': 'Aktivität',
    'console.activity.empty': 'Keine Beiträge an diesem Tag',
    'console.activity.hint': 'Auf ein Kästchen klicken, um den Verlauf anzuzeigen',
    'console.btn.search': 'Inhalt durchsuchen',
    'console.btn.bg': 'Hintergrund wechseln',
    'console.btn.notifications': 'Benachrichtigungen ansehen',
    'console.btn.random': 'Auf gut Glück',
    'console.btn.top': 'Nach oben',
    // Right Click Menu
    'menu.title': 'Kontextmenü',
    'menu.back': 'Zurück',
    'menu.forward': 'Vorwärts',
    'menu.refresh': 'Aktualisieren',
    'menu.top': 'Oben',
    'menu.quote': 'In Kommentaren zitieren',
    'menu.copyText': 'Markierten Text kopieren',
    'menu.copyUrl': 'URL kopieren',
    'menu.search': 'Websitesuche',
    'menu.lightMode': 'Heller Modus',
    'menu.darkMode': 'Dunkler Modus',
    'common.dismiss': 'Verstanden',
  },
};

export function getI18nText(key: string, locale: LocaleVariant, fallback?: string): string {
  const table = I18N_STRINGS[locale] || I18N_STRINGS['zh-CN'];
  if (table && table[key] !== undefined) return table[key];
  if ((locale === 'zh-CN' || locale === 'zh-Hant') && fallback !== undefined) {
    return fallback;
  }
  return I18N_STRINGS['en']?.[key] ?? I18N_STRINGS['zh-CN']?.[key] ?? fallback ?? key;
}

const zhPattern = /[\u3400-\u9fff]/;
const originalTextNodeMap = new WeakMap<Text, string>();
const originalAttributeMap = new WeakMap<Element, Map<string, string>>();
let zhToTraditional: ((value: string) => string) | null = null;
let zhToSimplified: ((value: string) => string) | null = null;
let chineseConverterPromise: Promise<void> | null = null;

export type TranslationDict = Record<'en' | 'fr' | 'es' | 'de', string>;

/**
 * Multilingual dictionaries covering navigation, actions, controls, widgets, comments, and profile drawers.
 */
export const MULTILINGUAL_DICTIONARY: Record<string, TranslationDict> = {
  // Dedicated About Page Configuration Dictionary (covers 100% of about page text in en/fr/es/de)
  ...aboutI18nDictionary,

  // Navigation & Core Pages
  '首页': { en: 'Home', fr: 'Accueil', es: 'Inicio', de: 'Startseite' },
  '归档': { en: 'Archives', fr: 'Archives', es: 'Archivos', de: 'Archiv' },
  '分类': { en: 'Categories', fr: 'Catégories', es: 'Categorías', de: 'Kategorien' },
  '标签': { en: 'Tags', fr: 'Étiquettes', es: 'Etiquetas', de: 'Schlagwörter' },
  '关于': { en: 'About', fr: 'À propos', es: 'Acerca de', de: 'Über' },
  '更多': { en: 'More', fr: 'Plus', es: 'Más', de: 'Mehr' },
  '公告': { en: 'Notice', fr: 'Annonces', es: 'Avisos', de: 'Ankündigung' },
  '实验室': { en: 'Lab', fr: 'Laboratoire', es: 'Laboratorio', de: 'Labor' },
  '友链与社群': { en: 'Community', fr: 'Communauté', es: 'Comunidad', de: 'Community' },
  '友链与社群入口': { en: 'Community entry', fr: 'Entrée communauté', es: 'Entrada comunidad', de: 'Community-Zugang' },
  '站点状态': { en: 'Status', fr: 'Statut', es: 'Estado', de: 'Status' },
  '主题路线': { en: 'Roadmap', fr: 'Feuille de route', es: 'Hoja de ruta', de: 'Roadmap' },
  '交换建议': { en: 'Exchange guide', fr: 'Guide déchange', es: 'Guía de intercambio', de: 'Austausch-Leitfaden' },
  '适合互链的站点': { en: 'Sites for link exchange', fr: 'Sites recommandés', es: 'Sitios para intercambio', de: 'Websites für Linktausch' },
  '联系路径': { en: 'Contact', fr: 'Contact', es: 'Contacto', de: 'Kontakt' },
  '优先通过 TG 联系': { en: 'Prefer Telegram', fr: 'Contact via TG', es: 'Preferir Telegram', de: 'Bevorzugt via Telegram' },
  '当前状态': { en: 'Current status', fr: 'Statut actuel', es: 'Estado actual', de: 'Aktueller Status' },
  '现在已经是正式入口': { en: 'Official entry', fr: 'Entrée officielle', es: 'Entrada oficial', de: 'Offizieller Zugang' },
  '偏好': { en: 'Preferences', fr: 'Préférences', es: 'Preferencias', de: 'Einstellungen' },
  '上一页': { en: 'Prev', fr: 'Précédent', es: 'Anterior', de: 'Zurück' },
  '下一页': { en: 'Next', fr: 'Suivant', es: 'Siguiente', de: 'Weiter' },
  '上一篇': { en: 'Prev Post', fr: 'Article précédent', es: 'Artículo anterior', de: 'Vorheriger Beitrag' },
  '下一篇': { en: 'Next Post', fr: 'Article suivant', es: 'Artículo siguiente', de: 'Nächster Beitrag' },
  '上页': { en: 'Prev', fr: 'Préc', es: 'Ant', de: 'Zurück' },
  '下页': { en: 'Next', fr: 'Suiv', es: 'Sig', de: 'Weiter' },
  '文章分页': { en: 'Pagination', fr: 'Pagination', es: 'Paginación', de: 'Seitennummerierung' },
  '返回首页': { en: 'Back to Home', fr: 'Retour à l\'accueil', es: 'Volver al inicio', de: 'Zur Startseite' },
  '查看归档': { en: 'View Archives', fr: 'Voir les archives', es: 'Ver archivos', de: 'Archiv ansehen' },
  '这条路还没有被记录下来': { en: 'This path has not been charted yet', fr: 'Ce chemin n\'a pas encore été exploré', es: 'Este camino aún no ha sido trazado', de: 'Dieser Pfad wurde noch nicht erfasst' },
  '返回首页继续浏览，或者直接从最近更新进入现有文章，不把读者留在死路里。': { en: 'Return home to keep browsing, or jump straight to recent posts to avoid dead ends.', fr: 'Retournez à l\'accueil ou explorez les publications récentes pour continuer.', es: 'Vuelve al inicio o explora publicaciones recientes para continuar.', de: 'Zurück zur Startseite oder zu den neuesten Beiträgen wechseln.' },

  // Background modes
  '切换背景：晨光背景': { en: 'Background: Daybreak', fr: 'Arrière-plan: Aurore', es: 'Fondo: Amanecer', de: 'Hintergrund: Morgengrauen' },
  '切换背景：网格背景': { en: 'Background: Grid', fr: 'Arrière-plan: Grille', es: 'Fondo: Cuadrícula', de: 'Hintergrund: Gitter' },
  '切换背景：星空背景': { en: 'Background: Starfield', fr: 'Arrière-plan: Étoiles', es: 'Fondo: Cielo estrellado', de: 'Hintergrund: Sternenhimmel' },
  '切换背景：星云背景': { en: 'Background: Nebula', fr: 'Arrière-plan: Nébuleuse', es: 'Fondo: Nebulosa', de: 'Hintergrund: Nebel' },
  '切换背景：极光背景': { en: 'Background: Aurora', fr: 'Arrière-plan: Aurore boréale', es: 'Fondo: Aurora', de: 'Hintergrund: Polarlicht' },
  '切换背景：纯净背景': { en: 'Background: Clean', fr: 'Arrière-plan: Épuré', es: 'Fondo: Limpio', de: 'Hintergrund: Schlicht' },
  '切换明暗模式': { en: 'Toggle theme', fr: 'Changer de thème', es: 'Cambiar tema', de: 'Farbschema umschalten' },
  '切换背景': { en: 'Change background', fr: 'Changer fond', es: 'Cambiar fondo', de: 'Hintergrund ändern' },

  // Rightside controls & Top Dock
  '回到顶部': { en: 'Back to top', fr: 'Haut de page', es: 'Volver arriba', de: 'Nach oben' },
  '控制台': { en: 'Console', fr: 'Console', es: 'Consola', de: 'Konsole' },
  '中控台': { en: 'Console', fr: 'Tableau de bord', es: 'Consola', de: 'Konsole' },
  '个人中心': { en: 'User Center', fr: 'Espace Utilisateur', es: 'Perfil', de: 'Benutzerkonto' },
  '通知中心': { en: 'Notifications', fr: 'Notifications', es: 'Notificaciones', de: 'Mitteilungen' },
  '切换主题': { en: 'Toggle Theme', fr: 'Changer le thème', es: 'Cambiar tema', de: 'Design wechseln' },
  '随机文章': { en: 'Random Post', fr: 'Article aléatoire', es: 'Artículo aleatorio', de: 'Zufälliger Beitrag' },
  '账号中心': { en: 'Account', fr: 'Compte', es: 'Cuenta', de: 'Konto' },
  '账号面板': { en: 'Account panel', fr: 'Panneau de compte', es: 'Panel de cuenta', de: 'Kontoverwaltung' },
  '归档时间线': { en: 'Archive timeline', fr: 'Chronologie', es: 'Línea de tiempo', de: 'Zeitleiste' },
  '站内搜索': { en: 'Search', fr: 'Recherche', es: 'Buscar', de: 'Suche' },
  '关闭搜索面板': { en: 'Close search', fr: 'Fermer recherche', es: 'Cerrar búsqueda', de: 'Suche schließen' },
  '关闭控制台': { en: 'Close console', fr: 'Fermer console', es: 'Cerrar consola', de: 'Konsole schließen' },
  '关闭控制台提示': { en: 'Close console notice', fr: 'Fermer avis', es: 'Cerrar aviso', de: 'Hinweis schließen' },
  '关闭账号面板': { en: 'Close account panel', fr: 'Fermer compte', es: 'Cerrar cuenta', de: 'Konto schließen' },
  '关闭面板': { en: 'Close panel', fr: 'Fermer panneau', es: 'Cerrar panel', de: 'Fenster schließen' },
  '阅读模式': { en: 'Reading mode', fr: 'Mode lecture', es: 'Modo lectura', de: 'Lesemodus' },
  '退出阅读模式': { en: 'Exit reading mode', fr: 'Quitter mode lecture', es: 'Salir del modo lectura', de: 'Lesemodus beenden' },
  '展开侧栏': { en: 'Expand sidebar', fr: 'Déplier barre latérale', es: 'Expandir lateral', de: 'Seitenleiste ausklappen' },
  '收起侧栏': { en: 'Collapse sidebar', fr: 'Replier barre latérale', es: 'Plegar lateral', de: 'Seitenleiste einklappen' },
  '展开设置': { en: 'Expand dock', fr: 'Ouvrir réglages', es: 'Abrir ajustes', de: 'Einstellungen öffnen' },
  '收起设置': { en: 'Collapse dock', fr: 'Fermer réglages', es: 'Cerrar ajustes', de: 'Einstellungen schließen' },
  '隐藏选单': { en: 'Hide dock', fr: 'Masquer menu', es: 'Ocultar menú', de: 'Menü ausblenden' },
  '直达评论': { en: 'Jump to comments', fr: 'Aller aux commentaires', es: 'Ir a comentarios', de: 'Zu den Kommentaren' },
  '切换语言': { en: 'Switch language', fr: 'Changer de langue', es: 'Cambiar idioma', de: 'Sprache wechseln' },

  // Console webinfo & metrics
  '构建引擎': { en: 'Build Engine', fr: 'Moteur de Build', es: 'Motor de Build', de: 'Build-Engine' },
  '样式底层': { en: 'Styling Layer', fr: 'Fondation Style', es: 'Capa de Estilos', de: 'Design-Ebene' },
  '部署节点': { en: 'Edge Nodes', fr: 'Nœuds Edge', es: 'Nodos Edge', de: 'Edge-Knoten' },
  '运行反馈': { en: 'Response Latency', fr: 'Temps de Réponse', es: 'Latencia Activa', de: 'Reaktionszeit' },
  '本站总字数': { en: 'Total Words', fr: 'Nombre Total de Mots', es: 'Total de Palabras', de: 'Gesamtwortzahl' },
  '安全运行天数': { en: 'Safe Uptime Days', fr: 'Jours de Fonctionnement Stable', es: 'Días de Funcionamiento Continuo', de: 'Tage im sicheren Betrieb' },
  '最后推送': { en: 'Latest Update', fr: 'Dernière Mise à Jour', es: 'Última Actualización', de: 'Letzte Aktualisierung' },
  '版本协议': { en: 'Engine Protocol', fr: 'Protocole du Moteur', es: 'Protocolo del Motor', de: 'Engine-Protokoll' },
  '活跃等级': { en: 'Activity Rating', fr: 'Niveau d Activité', es: 'Nivel de Actividad', de: 'Aktivitätsstufe' },
  '内容密度': { en: 'Content Density', fr: 'Densité de Contenu', es: 'Densidad de Contenido', de: 'Inhaltsdichte' },
  '全站阅读': { en: 'Total Read Time', fr: 'Temps de Lecture Total', es: 'Tiempo de Lectura Total', de: 'Gesamte Lesezeit' },
  '系统架构': { en: 'System Architecture', fr: 'Architecture Système', es: 'Arquitectura del Sistema', de: 'Systemarchitektur' },

  // Table of contents & Post details
  '文章目录': { en: 'CONTENTS', fr: 'SOMMAIRE', es: 'ÍNDICE', de: 'INHALT' },
  '当前定位': { en: 'Current section', fr: 'Section actuelle', es: 'Sección actual', de: 'Aktueller Abschnitt' },
  '全部': { en: 'All', fr: 'Tout', es: 'Todos', de: 'Alle' },
  '最新发布': { en: 'Latest posts', fr: 'Derniers articles', es: 'Últimas publicaciones', de: 'Neueste Beiträge' },
  '最近文章': { en: 'Recent posts', fr: 'Articles récents', es: 'Publicaciones recientes', de: 'Letzte Beiträge' },
  '相关推荐': { en: 'Related posts', fr: 'Articles similaires', es: 'Artículos recomendados', de: 'Ähnliche Beiträge' },
  '下一篇推荐': { en: 'Recommended Next', fr: 'Article suivant recommandé', es: 'Siguiente recomendado', de: 'Nächste Empfehlung' },
  '站点信息': { en: 'Site info', fr: 'Infos du site', es: 'Información del sitio', de: 'Website-Info' },
  '分类总数': { en: 'Categories', fr: 'Catégories', es: 'Categorías', de: 'Kategorien' },
  '标签总数': { en: 'Tags', fr: 'Étiquettes', es: 'Etiquetas', de: 'Schlagwörter' },
  '文章总数': { en: 'Posts', fr: 'Articles', es: 'Artículos', de: 'Beiträge' },
  '阅读总量': { en: 'Views', fr: 'Vues', es: 'Vistas', de: 'Aufrufe' },
  '阅读时长': { en: 'Reading time', fr: 'Temps de lecture', es: 'Tiempo de lectura', de: 'Lesezeit' },
  '字数统计': { en: 'Word count', fr: 'Nombre de mots', es: 'Recuento de palabras', de: 'Wortanzahl' },
  '最近更新': { en: 'Latest update', fr: 'Mise à jour', es: 'Última actualización', de: 'Letzte Aktualisierung' },
  '当前阶段': { en: 'Current phase', fr: 'Phase actuelle', es: 'Fase actual', de: 'Aktuelle Phase' },
  '目录定位': { en: 'TOC jump', fr: 'Navigation', es: 'Saltar a índice', de: 'Zum Inhaltsverzeichnis' },
  '评论入口': { en: 'Comments', fr: 'Commentaires', es: 'Comentarios', de: 'Kommentare' },
  '分享卡片': { en: 'Share', fr: 'Partager', es: 'Compartir', de: 'Teilen' },
  '打开二维码': { en: 'Open QR', fr: 'Ouvrir QR', es: 'Abrir QR', de: 'QR-Code öffnen' },
  '查看二维码': { en: 'View QR', fr: 'Voir le QR', es: 'Ver QR', de: 'QR-Code ansehen' },
  '分享这篇文章': { en: 'Share this post', fr: 'Partager cet article', es: 'Compartir este artículo', de: 'Diesen Beitrag teilen' },
  '扫码分享': { en: 'QR share', fr: 'Partage QR', es: 'Compartir vía QR', de: 'Per QR teilen' },
  '复制链接': { en: 'Copy link', fr: 'Copier le lien', es: 'Copiar enlace', de: 'Link kopieren' },
  '原创': { en: 'Original', fr: 'Original', es: 'Original', de: 'Original' },
  '转载': { en: 'Reprint', fr: 'Rediffusion', es: 'Reimpresión', de: 'Nachdruck' },
  '阅读全文': { en: 'Read more', fr: 'Lire la suite', es: 'Leer más', de: 'Weiterlesen' },

  // Comments
  '评论': { en: 'Comments', fr: 'Commentaires', es: 'Comentarios', de: 'Kommentare' },
  '公开评论': { en: 'Public comments', fr: 'Commentaires publics', es: 'Comentarios públicos', de: 'Öffentliche Kommentare' },
  '还没有公开评论': { en: 'No public comments yet', fr: 'Aucun commentaire public pour le moment', es: 'Aún no hay comentarios públicos', de: 'Noch keine öffentlichen Kommentare' },
  '回复': { en: 'Reply', fr: 'Répondre', es: 'Responder', de: 'Antworten' },
  '取消回复': { en: 'Cancel reply', fr: 'Annuler', es: 'Cancelar respuesta', de: 'Antwort abbrechen' },
  '引用回复': { en: 'Quote', fr: 'Citer', es: 'Citar', de: 'Zitieren' },
  '发送评论': { en: 'Submit comment', fr: 'Publier le commentaire', es: 'Enviar comentario', de: 'Kommentar absenden' },
  '发送': { en: 'Send', fr: 'Envoyer', es: 'Enviar', de: 'Senden' },
  '最新': { en: 'Latest', fr: 'Récents', es: 'Más recientes', de: 'Neueste' },
  '最热': { en: 'Hot', fr: 'Populaires', es: 'Más populares', de: 'Beliebteste' },
  '站长': { en: 'Author', fr: 'Auteur', es: 'Autor', de: 'Autor' },
  '博主': { en: 'Blogger', fr: 'Blogueur', es: 'Blogger', de: 'Blogger' },
  '访客': { en: 'Visitor', fr: 'Visiteur', es: 'Visitante', de: 'Besucher' },
  '输入评论内容...': { en: 'Write a comment...', fr: 'Écrire un commentaire...', es: 'Escribe un comentario...', de: 'Schreibe einen Kommentar...' },
  '匿名评论': { en: 'Anonymous', fr: 'Anonyme', es: 'Anónimo', de: 'Anonym' },
  '插入图片': { en: 'Insert image', fr: 'Insérer image', es: 'Insertar imagen', de: 'Bild einfügen' },
  '切换互动模式': { en: 'Switch mode', fr: 'Changer mode', es: 'Cambiar modo', de: 'Modus umschalten' },
  '展开全文': { en: 'Read full text', fr: 'Lire la suite', es: 'Leer todo', de: 'Vollständig lesen' },
  '收起': { en: 'Collapse', fr: 'Réduire', es: 'Plegar', de: 'Einklappen' },

  // Account & Drawer Cards (Full Multilingual Coverage)
  '账户资料设置': { en: 'Profile Settings', fr: 'Paramètres du profil', es: 'Ajustes de perfil', de: 'Profileinstellungen' },
  'EpoCanvas Mail 统一身份认证': { en: 'EpoCanvas Mail Authentication', fr: 'Authentification EpoCanvas Mail', es: 'Autenticación EpoCanvas Mail', de: 'EpoCanvas Mail Authentifizierung' },
  '全站广播与最新动态': { en: 'Site Broadcasts & Updates', fr: 'Diffusions et actualités', es: 'Avisos del sitio y novedades', de: 'Website-Mitteilungen & Neuigkeiten' },
  '收到的互动提醒': { en: 'Interaction Alerts', fr: 'Alertes d interaction', es: 'Alertas de interacción', de: 'Interaktions-Hinweise' },
  '我的评论足迹': { en: 'Comment History', fr: 'Historique des commentaires', es: 'Historial de comentarios', de: 'Meine Kommentare' },
  '界面语言 (Language)': { en: 'Interface Language', fr: 'Langue de l interface', es: 'Idioma de la interfaz', de: 'Oberflächensprache' },
  '站内通知接收偏好': { en: 'Notification Preferences', fr: 'Préférences de notification', es: 'Preferencias de notificación', de: 'Benachrichtigungseinstellungen' },
  '评论区互动与显示偏好': { en: 'Comment Preferences', fr: 'Préférences des commentaires', es: 'Preferencias de comentarios', de: 'Kommentareinstellungen' },
  '交互反馈与无障碍': { en: 'Accessibility & Feedback', fr: 'Accessibilité & Retour tactile', es: 'Accesibilidad y Respuesta háptica', de: 'Barrierefreiheit & Feedback' },
  '登录 / 注册': { en: 'Sign in / Register', fr: 'Connexion / Inscription', es: 'Iniciar sesión / Registro', de: 'Anmelden / Registrieren' },
  '更新资料': { en: 'Edit profile', fr: 'Modifier le profil', es: 'Editar perfil', de: 'Profil bearbeiten' },
  '昵称': { en: 'Name', fr: 'Nom', es: 'Nombre', de: 'Name' },
  '邮箱': { en: 'Email', fr: 'E-mail', es: 'Correo electrónico', de: 'E-Mail' },
  '个人站点': { en: 'Website', fr: 'Site web', es: 'Sitio web', de: 'Website' },
  '头像链接': { en: 'Avatar URL', fr: 'URL de l avatar', es: 'URL del avatar', de: 'Avatar-URL' },
  '退出': { en: 'Sign out', fr: 'Déconnexion', es: 'Cerrar sesión', de: 'Abmelden' },
  '创建账号': { en: 'Create profile', fr: 'Créer un profil', es: 'Crear perfil', de: 'Profil erstellen' },
  '保存更新': { en: 'Save updates', fr: 'Enregistrer', es: 'Guardar cambios', de: 'Speichern' },
  '保存': { en: 'Save', fr: 'Enregistrer', es: 'Guardar', de: 'Speichern' },
  '语言': { en: 'Language', fr: 'Langue', es: 'Idioma', de: 'Sprache' },
  '界面语言': { en: 'Interface language', fr: 'Langue de l interface', es: 'Idioma de la interfaz', de: 'Oberflächensprache' },
  '简体': { en: 'Simplified', fr: 'Simplifié', es: 'Simplificado', de: 'Vereinfacht' },
  '繁體': { en: 'Traditional', fr: 'Traditionnel', es: 'Tradicional', de: 'Traditionell' },
  '简体中文': { en: 'Simplified Chinese', fr: 'Chinois simplifié', es: 'Chino simplificado', de: 'Vereinfachtes Chinesisch' },
  '繁體中文': { en: 'Traditional Chinese', fr: 'Chinois traditionnel', es: 'Chino tradicional', de: 'Traditionelles Chinesisch' },
  '全站广播与新博文发布通告': { en: 'Site broadcast & new posts', fr: 'Diffusions et nouveaux articles', es: 'Difusión y nuevas publicaciones', de: 'Website-Mitteilungen & neue Beiträge' },
  '提醒': { en: 'Notifications', fr: 'Notifications', es: 'Notificaciones', de: 'Benachrichtigungen' },
  '@ 与回复': { en: '@ mentions', fr: '@ mentions et réponses', es: '@ menciones y respuestas', de: '@ Erwähnungen & Antworten' },
  '提示': { en: 'Notice', fr: 'Avis', es: 'Aviso', de: 'Hinweis' },
  '打赏作者': { en: 'Support author', fr: 'Soutenir l auteur', es: 'Apoyar al autor', de: 'Autor unterstützen' },
  'Telegram 频道': { en: 'Telegram channel', fr: 'Canal Telegram', es: 'Canal de Telegram', de: 'Telegram-Kanal' },
  '海外读者交流入口': { en: 'Overseas reader entrance', fr: 'Accès lecteurs étrangers', es: 'Entrada lectores externos', de: 'Internationaler Leserzugang' },
  '中国大陆': { en: 'Mainland China', fr: 'Chine continentale', es: 'China continental', de: 'Festlandchina' },
  '中国香港': { en: 'Hong Kong', fr: 'Hong Kong', es: 'Hong Kong', de: 'Hongkong' },
  '英国': { en: 'United Kingdom', fr: 'Royaume-Uni', es: 'Reino Unido', de: 'Vereinigtes Königreich' },
  '隐私说明': { en: 'Privacy policy', fr: 'Politique de confidentialité', es: 'Política de privacidad', de: 'Datenschutz' },
  '版权说明': { en: 'Copyright policy', fr: 'Droits d auteur', es: 'Derechos de autor', de: 'Urheberrecht' },
  '使用条款': { en: 'Terms of service', fr: 'Conditions d utilisation', es: 'Términos de servicio', de: 'Nutzungsbedingungen' },
  '友链': { en: 'Friends', fr: 'Amis', es: 'Amigos', de: 'Freunde' },
  '服务': { en: 'Services', fr: 'Services', es: 'Servicios', de: 'Dienste' },
  '主题': { en: 'Theme', fr: 'Thème', es: 'Tema', de: 'Theme' },
  '导航': { en: 'Navigation', fr: 'Navigation', es: 'Navegación', de: 'Navigation' },
  '协议': { en: 'Policies', fr: 'Politiques', es: 'Políticas', de: 'Richtlinien' },
  '最新文章': { en: 'Latest posts', fr: 'Articles récents', es: 'Publicaciones recientes', de: 'Neueste Beiträge' },
  '博客分类': { en: 'Blog categories', fr: 'Catégories du blog', es: 'Categorías del blog', de: 'Blog-Kategorien' },
  '本次重构': { en: 'This rebuild', fr: 'Cette refonte', es: 'Esta reconstrucción', de: 'Diese Neugestaltung' },
  '继续阅读': { en: 'Read more', fr: 'Lire la suite', es: 'Leer más', de: 'Weiterlesen' },
  '验证后阅读': { en: 'Unlock to read', fr: 'Débloquer pour lire', es: 'Desbloquear para leer', de: 'Freischalten zum Lesen' },
  '分类详情': { en: 'Category detail', fr: 'Détail de la catégorie', es: 'Detalle de categoría', de: 'Kategorie-Details' },
  '标签详情': { en: 'Tag detail', fr: 'Détail de l étiquette', es: 'Detalle de etiqueta', de: 'Schlagwort-Details' },
  '分类索引': { en: 'Category index', fr: 'Index des catégories', es: 'Índice de categorías', de: 'Kategorie-Index' },
  '标签索引': { en: 'Tag index', fr: 'Index des étiquettes', es: 'Índice de etiquetas', de: 'Schlagwort-Index' },
  '该分类下的文章': { en: 'Posts in this category', fr: 'Articles de cette catégorie', es: 'Artículos en esta categoría', de: 'Beiträge in dieser Kategorie' },
  '该标签下的文章': { en: 'Posts with this tag', fr: 'Articles avec cette étiquette', es: 'Artículos con esta etiqueta', de: 'Beiträge mit diesem Schlagwort' },

  // Recommendation & Post End
  '顺着这条线继续读': { en: 'Keep Reading Along This Line', fr: 'Continuer sur cette lancée', es: 'Continúa por esta línea', de: 'Weiter auf diesem Pfad' },
  '再向前一步': { en: 'Take A Step Further', fr: 'Un pas de plus', es: 'Un paso más adelante', de: 'Einen Schritt weiter' },
  '接着读': { en: 'Next Article', fr: 'Lire la suite', es: 'Siguiente lectura', de: 'Nächster Beitrag' },
  '收起这条推荐': { en: 'Dismiss recommendation', fr: 'Masquer la recommandation', es: 'Ocultar recomendación', de: 'Empfehlung schließen' },
  '接着读下一篇文章': { en: 'Read next post', fr: 'Lire l article suivant', es: 'Leer siguiente entrada', de: 'Nächsten Artikel lesen' },
  '篇延伸阅读': { en: 'related posts', fr: 'lectures recommandées', es: 'lecturas recomendadas', de: 'empfohlene Beiträge' },

  // AI Summary Panel
  'Chronral 摘要': { en: 'Chronral Summary', fr: 'Résumé Chronral', es: 'Resumen Chronral', de: 'Chronral Zusammenfassung' },
  '重新生成 / 刷新摘要': { en: 'Regenerate / Refresh summary', fr: 'Régénérer / Actualiser le résumé', es: 'Regenerar / Actualizar resumen', de: 'Zusammenfassung neu generieren' },
  '重新生成 / 刷新摘要 (Refresh Summary)': { en: 'Regenerate / Refresh summary', fr: 'Régénérer / Actualiser le résumé', es: 'Regenerar / Actualizar resumen', de: 'Zusammenfassung neu generieren' },
  '切换摘要引擎 (LLMGPT / InstanceAI / PrimerAI)': { en: 'Switch AI engine (LLMGPT / InstanceAI / PrimerAI)', fr: 'Changer de moteur IA (LLMGPT / InstanceAI / PrimerAI)', es: 'Cambiar motor de IA (LLMGPT / InstanceAI / PrimerAI)', de: 'KI-Engine wechseln (LLMGPT / InstanceAI / PrimerAI)' },
  '切换摘要引擎': { en: 'Switch AI engine', fr: 'Changer de moteur IA', es: 'Cambiar motor de IA', de: 'KI-Engine wechseln' },
  '当前摘要模式 (Current AI Mode)': { en: 'Current AI mode', fr: 'Mode IA actuel', es: 'Modo IA actual', de: 'Aktueller KI-Modus' },
  '当前摘要模式': { en: 'Current AI mode', fr: 'Mode IA actuel', es: 'Modo IA actual', de: 'Aktueller KI-Modus' },
  '正在通过 Chronral 智能提炼文章核心信息...': { en: 'Extracting key insights via Chronral AI...', fr: 'Extraction des informations clés via l IA Chronral...', es: 'Extrayendo ideas clave a través de IA Chronral...', de: 'Kerneinblicke werden mit Chronral KI extrahiert...' },
  '💡 核心论点': { en: '💡 Key Points', fr: '💡 Points Clés', es: '💡 Puntos Clave', de: '💡 Kernaussagen' },
  '🎯 适用读者': { en: '🎯 Target Audience', fr: '🎯 Public Cible', es: '🎯 Para Quién', de: '🎯 Zielgruppe' },
  '⏱️ 30秒速读': { en: '⏱️ 30s Overview', fr: '⏱️ En 30s', es: '⏱️ En 30s', de: '⏱️ 30s Überblick' },
  '🧠 实践启示': { en: '🧠 Key Takeaways', fr: '🧠 Enseignements', es: '🧠 Aprendizajes', de: '🧠 Praxiseinblicke' },
  '👤 关于作者': { en: '👤 About Author', fr: '👤 À propos de l auteur', es: '👤 Sobre el autor', de: '👤 Über den Autor' },
  '📚 推荐相关': { en: '📚 Related Reads', fr: '📚 Lectures Similaires', es: '📚 Lecturas Similares', de: '📚 Ähnliche Beiträge' },
  '🔝 回到顶部': { en: '🔝 Back to Top', fr: '🔝 Haut de Page', es: '🔝 Volver Arriba', de: '🔝 Nach Oben' },
  '提炼核心论点与关键技术方案': { en: 'Extract core arguments and technical solutions', fr: 'Extraire arguments et solutions techniques', es: 'Extraer argumentos clave y soluciones', de: 'Kerneinblicke und Lösungen herausarbeiten' },
  '分析目标受众与解决的问题': { en: 'Analyze audience and solved problems', fr: 'Analyser le public cible et les solutions', es: 'Analizar audiencia objetivo y problemas resueltos', de: 'Zielgruppe und Nutzen analysieren' },
  '30秒极速三句话概览': { en: '3-sentence quick summary in 30 seconds', fr: 'Aperçu en 3 phrases en 30 secondes', es: 'Resumen rápido de 3 frases en 30s', de: '3-Satz-Kurzüberblick in 30 Sekunden' },
  '实践启示与工程思考': { en: 'Practical insights and architectural thoughts', fr: 'Perspectives pratiques et réflexions d ingénierie', es: 'Perspectivas prácticas e ingeniería', de: 'Praktische Erkenntnisse und Architekturüberlegungen' },
  '深入了解博主与站点理念': { en: 'Learn more about author and blog philosophy', fr: 'En savoir plus sur l auteur et le blog', es: 'Conoce más sobre el autor y el blog', de: 'Mehr über den Autor und die Website erfahren' },
  'AI 分析推荐理由并展开延伸阅读': { en: 'AI recommendations and extended reading', fr: 'Recommandations IA et lectures complémentaires', es: 'Recomendaciones de IA y lecturas sugeridas', de: 'KI-Empfehlungen und weiterführende Lektüre' },
  '平滑回到文章顶部': { en: 'Smooth scroll to top', fr: 'Défilement fluide vers le haut', es: 'Desplazamiento suave arriba', de: 'Sanft nach oben scrollen' },

  // Author Card & Profile
  '以技术沉淀记忆，用设计表达温度': {
    en: 'Precipitating memory with technology, expressing warmth through design',
    fr: 'Précipiter la mémoire par la technologie, exprimer la chaleur par le design',
    es: 'Precipitando la memoria con tecnología, expresando calidez con diseño',
    de: 'Erinnerung durch Technologie bewahren, Wärme durch Design ausdrücken'
  },
  '全栈开发者 / 架构设计师': {
    en: 'Full-Stack Developer / Architect',
    fr: 'Développeur Full-Stack / Architecte',
    es: 'Desarrollador Full-Stack / Arquitecto',
    de: 'Full-Stack-Entwickler / Architekt'
  },
  '✨ 欢迎探索 💡': { en: '✨ Welcome & Explore 💡', fr: '✨ Bienvenue & Explorer 💡', es: '✨ Bienvenido & Explorar 💡', de: '✨ Willkommen & Entdecken 💡' },
  '💡 技术干货 ✖️ 避坑指南': { en: '💡 Tech Insights ✖️ Pitfall Guides', fr: '💡 Retours d expérience ✖️ Bonnes pratiques', es: '💡 Claves técnicas ✖️ Guías prácticas', de: '💡 Technische Einblicke ✖️ Praxisleitfäden' },
  '🚀 拓展数字边境 🛡️': { en: '🚀 Expanding Digital Frontiers 🛡️', fr: '🚀 Repousser les frontières numériques 🛡️', es: '🚀 Expandiendo fronteras digitales 🛡️', de: '🚀 Digitale Grenzen erweitern 🛡️' },
  '🧬 跨界折腾记录 🐧': { en: '🧬 Cross-Domain Tinkering Logs 🐧', fr: '🧬 Carnet d expérimentations 🐧', es: '🧬 Registros de experimentación 🐧', de: '🧬 Interdisziplinäre Notizen 🐧' },
  '☕ 愿对你有启发': { en: '☕ Hope it inspires you', fr: '☕ En espérant que cela vous inspire', es: '☕ Espero que te inspire', de: '☕ Hoffentlich inspiriert es dich' },

  // Sidebar & Web Info
  '文章分类': { en: 'Categories', fr: 'Catégories', es: 'Categorías', de: 'Kategorien' },
  '热门标签': { en: 'Popular Tags', fr: 'Étiquettes populaires', es: 'Etiquetas populares', de: 'Beliebte Schlagwörter' },
  '精选分类': { en: 'Featured Categories', fr: 'Catégories en vedette', es: 'Categorías destacadas', de: 'Empfohlene Kategorien' },
  '正常运行': { en: 'Operational', fr: 'Opérationnel', es: 'Operativo', de: 'Betriebsbereit' },
  '查看全部标签': { en: 'View all tags', fr: 'Voir toutes les étiquettes', es: 'Ver todas las etiquetas', de: 'Alle Schlagwörter anzeigen' },
  '查看全部分类': { en: 'View all categories', fr: 'Voir toutes les catégories', es: 'Ver todas las categorías', de: 'Alle Kategorien anzeigen' },
  '核心架构版本与协议规范': { en: 'Core architecture version and protocol specification', fr: 'Version de l architecture centrale et spécifications', es: 'Versión de arquitectura central y especificaciones', de: 'Kernarchitektur-Version und Protokollspezifikation' },
  '基于 Astro 核心引擎与 Edge Functions': { en: 'Built on Astro core engine & Edge Functions', fr: 'Basé sur le moteur Astro et les fonctions Edge', es: 'Basado en el motor central de Astro y Edge Functions', de: 'Basiert auf Astro Core Engine und Edge Functions' },
  '站点资讯': { en: 'Site Info', fr: 'Infos du site', es: 'Información del sitio', de: 'Website-Info' },
  '网站资讯': { en: 'Site Info', fr: 'Infos du site', es: 'Información del sitio', de: 'Website-Info' },
  '文章总数 :': { en: 'Total Posts :', fr: 'Total des articles :', es: 'Artículos totales :', de: 'Beiträge gesamt :' },
  '建站天数 :': { en: 'Days Online :', fr: 'Jours en ligne :', es: 'Días en línea :', de: 'Tage online :' },
  '全站字数 :': { en: 'Total Words :', fr: 'Nombre de mots :', es: 'Palabras totales :', de: 'Wörter gesamt :' },
  '文章总数:': { en: 'Total Posts:', fr: 'Total des articles:', es: 'Artículos totales:', de: 'Beiträge gesamt:' },
  '建站天数:': { en: 'Days Online:', fr: 'Jours en ligne:', es: 'Días en línea:', de: 'Tage online:' },
  '全站字数:': { en: 'Total Words:', fr: 'Nombre de mots:', es: 'Palabras totales:', de: 'Wörter gesamt:' },
  '全站字数': { en: 'Total Words', fr: 'Nombre de mots', es: 'Palabras totales', de: 'Wörter gesamt' },
  '建站天数': { en: 'Days Online', fr: 'Jours en ligne', es: 'Días en línea', de: 'Tage online' },
  '运行时间': { en: 'Uptime', fr: 'Temps de fonctionnement', es: 'Tiempo activo', de: 'Betriebszeit' },
  '最后更新': { en: 'Last Updated', fr: 'Dernière mise à jour', es: 'Última actualización', de: 'Zuletzt aktualisiert' },
  '本站访客数': { en: 'Total Visitors', fr: 'Visiteurs uniques', es: 'Visitantes uniques', de: 'Besucher gesamt' },
  '访问总量': { en: 'Total Views', fr: 'Vues totales', es: 'Visitas totales', de: 'Aufrufe gesamt' },
  '持续更新': { en: 'Continuous updates', fr: 'Mises à jour continues', es: 'Actualizaciones continuas', de: 'Laufende Aktualisierungen' },
  '切换目录层级 (全部 / 1级 / 2级 / 3级)': { en: 'Toggle TOC levels (All / L1 / L2 / L3)', fr: 'Changer le niveau du sommaire (Tous / N1 / N2 / N3)', es: 'Alternar niveles de índice (Todos / N1 / N2 / N3)', de: 'Inhaltsverzeichnisebenen umschalten (Alle / E1 / E2 / E3)' },
  '切换目录层级': { en: 'Toggle TOC levels', fr: 'Changer de niveau', es: 'Alternar niveles', de: 'Ebenen umschalten' },
  '文章分页导航': { en: 'Post pagination', fr: 'Pagination des articles', es: 'Paginación de artículos', de: 'Beitragsseitennavigation' },
  '页码列表': { en: 'Page list', fr: 'Liste des pages', es: 'Lista de páginas', de: 'Seitenliste' },
  '前往第': { en: 'Go to page', fr: 'Aller à la page', es: 'Ir a la página', de: 'Gehe zu Seite' },
  '语言版本': { en: 'Language', fr: 'Version linguistique', es: 'Versión de idioma', de: 'Sprachversion' },
  '語言版本': { en: 'Language', fr: 'Version linguistique', es: 'Versión de idioma', de: 'Sprachversion' },
  '当前语言': { en: 'Current language', fr: 'Langue actuelle', es: 'Idioma actual', de: 'Aktuelle Sprache' },
  '原創': { en: 'Original', fr: 'Original', es: 'Original', de: 'Original' },
  '接著讀': { en: 'Next', fr: 'Suivant', es: 'Siguiente', de: 'Weiter' },
  '接著讀下一篇文章': { en: 'Continue to next post', fr: 'Continuer vers l article suivant', es: 'Continuar al siguiente artículo', de: 'Weiter zum nächsten Beitrag' },
  '收起這條推薦': { en: 'Dismiss recommendation', fr: 'Masquer cette recommandation', es: 'Ocultar esta recomendación', de: 'Empfehlung ausblenden' },
  '继续探索更多相关记录': { en: 'Explore more related posts', fr: 'Explorer d autres articles associés', es: 'Explorar más artículos relacionados', de: 'Weitere verwandte Beiträge entdecken' },
  '繼續探索更多相關記錄': { en: 'Explore more related posts', fr: 'Explorer d autres articles associés', es: 'Explorar más articles liés', de: 'Weitere verwandte Beiträge entdecken' },
  '相關推薦': { en: 'Related Posts', fr: 'Articles connexes', es: 'Artículos relacionados', de: 'Verwandte Beiträge' },
  '知识共享署名': { en: 'Creative Commons Attribution', fr: 'Attribution Creative Commons', es: 'Atribución de Creative Commons', de: 'Creative Commons Namensnennung' },
  '非商业性使用': { en: 'NonCommercial', fr: 'NonCommercial', es: 'NoComercial', de: 'NichtKommerziell' },
  '相同方式共享': { en: 'ShareAlike', fr: 'Partage dans les Mêmes Conditions', es: 'CompartirIgual', de: 'Weitergabe unter gleichen Bedingungen' },
  '国际许可协议': { en: 'International License', fr: 'Licence Internationale', es: 'Licencia Internacional', de: 'Internationale Lizenz' },
  '直達評論': { en: 'Jump to comments', fr: 'Aller aux commentaires', es: 'Ir a comentarios', de: 'Zu den Kommentaren springen' },
  '点击切换为': { en: 'Click to switch to', fr: 'Cliquer pour passer en', es: 'Clic para cambiar a', de: 'Klicken zum Wechseln zu' },
  '點擊切換為': { en: 'Click to switch to', fr: 'Cliquer pour passer en', es: 'Clic para cambiar a', de: 'Klicken zum Wechseln zu' },
  '目录层级': { en: 'TOC Level', fr: 'Niveau du sommaire', es: 'Nivel del índice', de: 'Inhaltsverzeichnisebene' },
  '目錄層級': { en: 'TOC Level', fr: 'Niveau du sommaire', es: 'Nivel del índice', de: 'Inhaltsverzeichnisebene' },
  '展開側欄': { en: 'Expand sidebar', fr: 'Développer la barre latérale', es: 'Expandir barra lateral', de: 'Seitenleiste ausklappen' },
  '閱讀模式': { en: 'Reading mode', fr: 'Mode lecture', es: 'Modo lectura', de: 'Lesemodus' },
  '关闭目录': { en: 'Close table of contents', fr: 'Fermer le sommaire', es: 'Cerrar índice', de: 'Inhaltsverzeichnis schließen' },
  '查看歸檔': { en: 'View Archives', fr: 'Voir les archives', es: 'Ver archivos', de: 'Archive anzeigen' },
  '返回首页继续浏览': { en: 'Return to Home', fr: 'Retour à l accueil', es: 'Volver al inicio', de: 'Zurück zur Startseite' },
  '返回首頁繼續瀏覽': { en: 'Return to Home', fr: 'Retour à l accueil', es: 'Volver al inicio', de: 'Zurück zur Startseite' },
  '這條路還沒有被記錄下來': { en: 'This path has not been recorded yet', fr: 'Ce chemin n a pas encore été répertorié', es: 'Esta ruta aún no ha sido registrada', de: 'Dieser Pfad wurde noch nicht erfasst' },
  '不把读者留在死路里': { en: 'Never leave readers at a dead end', fr: 'Ne jamais laisser le lecteur dans une impasse', es: 'Nunca dejar a los lectores en un callejón sin salida', de: 'Leser niemals in einer Sackgasse zurücklassen' },
  '不把讀者留在死路裏': { en: 'Never leave readers at a dead end', fr: 'Ne jamais laisser le lecteur dans une impasse', es: 'Nunca dejar a los lectores en un callejón sin salida', de: 'Leser niemals in einer Sackgasse zurücklassen' },
  '或者直接从最近更新进入现有文章': { en: 'Or explore articles from recent updates', fr: 'Ou découvrez des articles parmi les mises à jour récentes', es: 'O explore artículos a partir de las actualizaciones recientes', de: 'Oder erkunden Sie Beiträge aus den letzten Aktualisierungen' },
  '或者直接從最近更新進入現有文章': { en: 'Or explore articles from recent updates', fr: 'Ou découvrez des articles parmi les mises à jour récentes', es: 'O explore artículos a partir de las actualizaciones recientes', de: 'Oder erkunden Sie Beiträge aus den letzten Aktualisierungen' },
  '未知地区': { en: 'Unknown Region', fr: 'Région inconnue', es: 'Región desconocida', de: 'Unbekannte Region' },
  '关闭弹窗': { en: 'Close dialog', fr: 'Fermer la boîte de dialogue', es: 'Cerrar diálogo', de: 'Dialog schließen' },
  '打赏二维码': { en: 'Sponsorship QR Code', fr: 'QR Code de don', es: 'Código QR de patrocinio', de: 'Spenden-QR-Code' },
  '使用提醒': { en: 'Notice', fr: 'Avis', es: 'Aviso', de: 'Hinweis' },
  '英国及国际': { en: 'UK & International', fr: 'Royaume-Uni & International', es: 'Reino Unido e Internacional', de: 'Großbritannien & International' },
  '澳门': { en: 'Macau', fr: 'Macao', es: 'Macao', de: 'Macau' },
  '已切换到': { en: 'Switched to', fr: 'Passé à', es: 'Cambiado a', de: 'Gewechselt zu' },
  '实用装备': { en: 'Gear & Tech Setup', fr: 'Équipement & Outils', es: 'Equipo y herramientas', de: 'Ausrüstung & Setup' },
  '轻量敏捷': { en: 'Lightweight & Agile', fr: 'Léger & Agile', es: 'Ligero y ágil', de: 'Leicht & Agil' },
  '数据主权': { en: 'Data Sovereignty', fr: 'Souveraineté des données', es: 'Soberanía de datos', de: 'Datensouveränität' },
  '文章总量': { en: 'Total Posts', fr: 'Total des articles', es: 'Artículos totales', de: 'Beiträge gesamt' },
  '持续构建中': { en: 'Under Continuous Construction', fr: 'En construction continue', es: 'En construcción continua', de: 'Im stetigen Aufbau' },
  '日常学习与开发伙伴': { en: 'Daily Learning & Dev Companions', fr: 'Compagnons d apprentissage et de dév au quotidien', es: 'Compañeros diarios de aprendizaje y desarrollo', de: 'Tägliche Lern- und Entwicklungsbegleiter' },
  '用高性价比的平价设备': { en: 'Cost-effective accessible hardware', fr: 'Matériel accessible et performant', es: 'Hardware económico y eficiente', de: 'Kosteneffiziente Hardware' },
  '用好基础开源与免费工具': { en: 'Leveraging open-source and free tools', fr: 'Exploiter les outils libres et gratuits', es: 'Aprovechar herramientas libres y de código abierto', de: 'Basis-Open-Source und freie Tools optimal nutzen' },
  '为你我保留一处专注慢思考': { en: 'Preserving a space for focused deep thought', fr: 'Préserver un espace propice à la réflexion posée', es: 'Preservando un espacio para el pensamiento profundo', de: 'Einen Raum für fokussiertes Nachdenken bewahren' },

  // Placeholder, Roadmap, Lab & Friends Pages
  '当前页面已预留完成，后续内容可以直接在这个路由上继续扩展。': { en: 'This page route has been reserved, and future content will expand directly here.', fr: 'Cet itinéraire est réservé et le contenu futur sera développé directement ici.', es: 'Esta ruta de página está reservada y el contenido futuro se ampliará directamente aquí.', de: 'Diese Seite ist reserviert und künftige Inhalte werden direkt hier erweitert.' },
  '专题 / 路线': { en: 'Special / Roadmap', fr: 'Dossier / Feuille de route', es: 'Especial / Hoja de ruta', de: 'Themen / Roadmap' },
  '这里预留给专题整理、系列文章索引和模板升级路线。当前先占住这个入口，后续再把结构化内容逐步填进来。': { en: 'Reserved for topics, article index, and theme upgrade roadmap. Structured content will be added gradually.', fr: 'Réservé aux dossiers thématiques, index d articles et feuille de route des mises à jour. Le contenu structuré sera complété progressivement.', es: 'Reservado para temas, índice de artículos y hoja de ruta de actualización. El contenido estructurado se irá completando progresivamente.', de: 'Reserviert für Themensammlungen, Beitragsindex und Theme-Roadmap. Strukturierte Inhalte werden schrittweise ergänzt.' },
  '路线图整理中': { en: 'Roadmap in progress', fr: 'Feuille de route en cours', es: 'Hoja de ruta en preparación', de: 'Roadmap in Vorbereitung' },
  '专题路由保留后，归档不必承担所有聚合功能，可以专注时间线。': { en: 'With dedicated topic routes, the archives can focus purely on the chronological timeline.', fr: 'Avec des routes thématiques dédiées, les archives peuvent se concentrer sur la chronologie.', es: 'Con rutas temáticas dedicadas, los archivos pueden centrarse en la línea de tiempo.', de: 'Mit dedizierten Themenrouten können sich die Archive ganz auf die Zeitleiste konzentrieren.' },
  '这一页未来适合展示系列文章、构建路线和按主题的阅读顺序。': { en: 'This page is designed to showcase article series, build roadmaps, and reading orders by theme.', fr: 'Cette page est conçue pour présenter des séries d articles, des feuilles de route et des parcours de lecture thématiques.', es: 'Cette page está diseñada para mostrar series de artículos, rutas de compilación y órdenes de lectura por tema.', de: 'Diese Seite wird Artikelserien, Build-Roadmaps und thematische Lesereihenfolgen präsentieren.' },
  '现在已经可以从导航二级页直接到达，不需要等内容完全写完再加入口。': { en: 'Accessible directly from the secondary navigation, without waiting for content to be fully completed.', fr: 'Accessible directement depuis le menu secondaire, sans attendre la finalisation complète du contenu.', es: 'Accesible directamente desde la navegación secundaria, sin tener que esperar a que el contenido esté completo.', de: 'Direkt über die Unternavigation erreichbar, ohne auf die vollständige Fertigstellung warten zu müssen.' },
  '实验 / 模块': { en: 'Experiments / Modules', fr: 'Expériences / Modules', es: 'Experimentos / Módulos', de: 'Experimente / Module' },
  '这里会放进尚未正式并入主站导航的试验模块，例如新的页面编排、交互手势、文章小工具和视觉原型。': { en: 'Experimental modules not yet merged into main navigation will live here: new layouts, gestures, widgets, and prototypes.', fr: 'Les modules expérimentaux non encore intégrés à la navigation principale seront hébergés ici : mises en page, gestes, widgets et prototypes.', es: 'Aquí se colocarán módulos experimentales aún no integrados en la navegación principal: diseños, gestos, widgets y prototipos.', de: 'Hier werden experimentelle Module untergebracht: neue Layouts, Interaktionsgesten, Beitrags-Widgets und Prototypen.' },
  '实验模块整理中': { en: 'Experimental modules in progress', fr: 'Modules expérimentaux en cours', es: 'Módulos experimentales en preparación', de: 'Experimentelle Module in Vorbereitung' },
  '优先放不影响主阅读流的功能实验，再决定是否升级成正式页面。': { en: 'Priority is given to functional experiments that do not disrupt the reading flow, before upgrading to official pages.', fr: 'La priorité est donnée aux expérimentations qui ne perturbent pas la lecture principale avant toute intégration définitive.', es: 'Se da prioridad a experimentos funcionales que no interrumpan la lectura antes de pasarlos a páginas oficiales.', de: 'Funktionale Experimente ohne Beeinträchtigung des Leseflusses haben Vorrang vor der Freigabe als offizielle Seiten.' },
  '占位页已经预留好路径和风格，后续只需要补内容，不必重新搭导航。': { en: 'Placeholder pages already have routes and styles established; future work only involves adding content.', fr: 'Ces pages ont déjà leurs chemins et styles établis ; il suffit d y ajouter du contenu sans reconstruire la navigation.', es: 'Las páginas de reserva ya tienen rutas y estilos listos; solo queda añadir contenido sin reconstruir la navegación.', de: 'Platzhalterseiten haben bereits Pfade und Stile definiert; künftig müssen nur Inhalte nachgetragen werden.' },
  '这里的页面语义和入口关系已经统一进整站主题体系，后续只需要继续填内容。': { en: 'Page semantics and navigation hierarchy are unified into the theme architecture, ready for content.', fr: 'La sémantique et la hiérarchie de navigation sont déjà unifiées dans l architecture du thème.', es: 'La semántica y la jerarquía de navegación ya están unificadas en la arquitectura del tema.', de: 'Seitensemantik und Navigationshierarchie sind bereits in das Theme-System integriert.' },
  '友链 / 社群': { en: 'Links / Community', fr: 'Liens / Communauté', es: 'Enlaces / Comunidad', de: 'Links / Community' },
  '这里不再保留空白占位，而是直接把互链说明、社群二维码和后续交流路径放成可用页面。如果你希望接收更新通知、参与小范围测试，或讨论互链合作，可以优先从这里进入。': { en: 'No blank placeholders: friend link guidelines, community QR codes, and contact channels are available directly here for updates, testing, and link exchanges.', fr: 'Aucun espace réservé vide : directives d échange de liens, QR codes et canaux de contact sont disponibles ici pour les mises à jour et partenariats.', es: 'Sin marcadores de posición vacíos: las pautas de intercambio de enlaces, códigos QR y canales de contacto están listos aquí para actualizaciones y colaboraciones.', de: 'Keine leeren Platzhalter: Richtlinien für Linktausch, Community-QR-Codes und Kontaktkanäle stehen hier für Updates und Kooperationen bereit.' },
  '加入 Telegram': { en: 'Join Telegram', fr: 'Rejoindre Telegram', es: 'Unirse a Telegram', de: 'Telegram beitreten' },
  '查看站点说明': { en: 'View Site Documentation', fr: 'Voir la documentation du site', es: 'Ver documentation du site', de: 'Website-Dokumentation ansehen' },
  '内容持续维护，能稳定访问，不是短期测试页。': { en: 'Continuously maintained content with reliable uptime, not a short-term test page.', fr: 'Contenu maintenu régulièrement, accès stable, et non une page de test éphémère.', es: 'Contenido mantenido activamente con acceso estable, no una página temporal de prueba.', de: 'Regelmäßig gepflegte Inhalte mit stabiler Erreichbarkeit, keine kurzfristige Testseite.' },
  '有明确作者信息、归档结构和基本页面说明。': { en: 'Clear author information, archive structure, and essential page documentation.', fr: 'Informations d auteur claires, structure d archives et documentation de base.', es: 'Información clara del autor, estructura de archivo y documentation esencial de la página.', de: 'Klare Autorenangaben, Archivstruktur und grundlegende Seitendokumentation.' },
  '风格可以不同，但至少要保证阅读体验和基础可访问性。': { en: 'Styles can vary, but good reading experience and fundamental accessibility must be guaranteed.', fr: 'Les styles peuvent varier, mais le confort de lecture et l accessibilité de base doivent être assurés.', es: 'Los estilos pueden variar, pero debe garantizarse una buena experiencia de lectura y accesibilidad básica.', de: 'Stile können variieren, aber Lesbarkeit und grundlegende Barrierefreiheit müssen gewährleistet sein.' },
  '海外读者和合作站点优先通过 TG 频道或群组联系，后续更新、测试通知和互链整理都会先在这里同步。': { en: 'International readers and partner sites are encouraged to connect via TG channel or group for updates, tests, and link syncs.', fr: 'Les lecteurs internationaux et sites partenaires sont invités à nous contacter via TG pour les annonces et tests.', es: 'Se recomienda a los lectores internacionales y sitios asociados comunicarse por TG para novedades y pruebas.', de: 'Internationale Leser und Partnerseiten kontaktieren uns am besten über Telegram für Updates und Tests.' },
  '如果你只想留言，也可以直接在任意文章评论区附上站点地址和简介。': { en: 'If you simply wish to leave a message, you can also leave your site URL and bio in any post comments section.', fr: 'Si vous souhaitez simplement laisser un message, vous pouvez mentionner l URL de votre site en commentaire d un article.', es: 'Si solo deseas dejar un mensaje, también puedes incluir la URL de tu sitio y una breve descripción en los comentarios.', de: 'Wenn Sie nur eine Nachricht hinterlassen möchten, können Sie Ihre Website-URL auch in den Kommentaren posten.' },
  '这个页面已经从占位态切到正式可扩展页面，后续只需要继续补充互链清单、申请格式和推荐站点，不需要再拆结构。': { en: 'This page has transitioned from a placeholder into an extensible official entry, ready for links and guidelines.', fr: 'Cette page est passée d un simple état d attente à un portail officiel évolutif, prêt à accueillir la liste des partenaires.', es: 'Esta página ha pasado de ser un marcador de posición a un portal oficial ampliable, listo para listas de enlaces y pautas.', de: 'Diese Seite ist vom Platzhalterstatus zu einer erweiterbaren offiziellen Seite übergegangen.' },

  // Unit suffixes (standalone — used as separate text nodes in count groups, e.g. category cards)
  '篇': { en: 'posts', fr: 'articles', es: 'posts', de: 'Beiträge' },
  '最近更新于': { en: 'Last updated', fr: 'Dernière mise à jour', es: 'Última actualización', de: 'Zuletzt aktualisiert' },

  // Post Hero Meta Labels
  '发表于': { en: 'Published on', fr: 'Publié le', es: 'Publicado el', de: 'Veröffentlicht am' },
  '更新于': { en: 'Updated on', fr: 'Mis à jour le', es: 'Actualizado el', de: 'Aktualisiert am' },
  '字数': { en: 'Word count', fr: 'Nombre de mots', es: 'Palabras', de: 'Wörter' },
  '时长': { en: 'Reading time', fr: 'Durée de lecture', es: 'Tiempo de lectura', de: 'Lesezeit' },
  '阅读': { en: 'Reading', fr: 'Lecture', es: 'Lectura', de: 'Lesedauer' },
  '浏览': { en: 'Views', fr: 'Vues', es: 'Vistas', de: 'Aufrufe' },
  '停留': { en: 'Dwell time', fr: 'Temps passé', es: 'Permanencia', de: 'Verweildauer' },
  '受限': { en: 'Restricted', fr: 'Accès restreint', es: 'Restringido', de: 'Eingeschränkt' },

  // Copyright, Sharing & Rewards
  '手机扫码阅读': { en: 'Scan QR to read on mobile', fr: 'Scanner pour lire sur mobile', es: 'Escanear QR para leer en móvil', de: 'QR scannen für Mobilansicht' },
  '使用手机扫码（点击复制二维码）': { en: 'Scan with mobile (Click to copy QR)', fr: 'Scanner avec mobile (Cliquer pour copier le QR)', es: 'Escanear con móvil (Clic para copiar QR)', de: 'Mit Handy scannen (Klicken zum Kopieren)' },
  '复制文章链接': { en: 'Copy post link', fr: 'Copier le lien', es: 'Copiar enlace', de: 'Link kopieren' },
  '文章原创标识': { en: 'Original post badge', fr: 'Badge d originalité', es: 'Insignia de original', de: 'Original-Beitrags-Kennzeichnung' },
  '分享到 QQ': { en: 'Share to QQ', fr: 'Partager sur QQ', es: 'Compartir en QQ', de: 'Auf QQ teilen' },
  '分享到 QQ 空间': { en: 'Share to Qzone', fr: 'Partager sur Qzone', es: 'Compartir en Qzone', de: 'Auf Qzone teilen' },
  '分享到哔哩哔哩': { en: 'Share to Bilibili', fr: 'Partager sur Bilibili', es: 'Compartir en Bilibili', de: 'Auf Bilibili teilen' },
  '分享到新浪微博': { en: 'Share to Weibo', fr: 'Partager sur Weibo', es: 'Compartir en Weibo', de: 'Auf Weibo teilen' },
  '文章二维码': { en: 'Post QR Code', fr: 'QR Code de l article', es: 'Código QR del artículo', de: 'Beitrags-QR-Code' },
  '点击直接将二维码图片复制到剪贴板': { en: 'Click to copy QR image to clipboard', fr: 'Cliquer pour copier l image QR', es: 'Clic para copiar imagen QR', de: 'Klicken, um QR-Bild zu kopieren' },
  '已复制到剪贴板': { en: 'Copied to clipboard', fr: 'Copié dans le presse-papier', es: 'Copiado al portapapeles', de: 'In die Zwischenablage kopiert' },
  '链接已复制': { en: 'Link copied', fr: 'Lien copié', es: 'Enlace copiado', de: 'Link kopiert' },
  '赞赏支持': { en: 'Support & Sponsor', fr: 'Soutien & Don', es: 'Patrocinio & Apoyo', de: 'Unterstützung & Spende' },
  '赞赏支持作者': { en: 'Sponsor the author', fr: 'Soutenir l auteur', es: 'Apoyar al autor', de: 'Autor unterstützen' },
  'Stripe 国际收银台': { en: 'Stripe International Checkout', fr: 'Caisse internationale Stripe', es: 'Pasarela internacional Stripe', de: 'Stripe International Kasse' },
  '推荐': { en: 'Recommended', fr: 'Recommandé', es: 'Recomendado', de: 'Empfohlen' },
  '信用卡 · Apple Pay · Google Pay · Link': { en: 'Credit Card · Apple Pay · Google Pay · Link', fr: 'Carte bancaire · Apple Pay · Google Pay · Link', es: 'Tarjeta de crédito · Apple Pay · Google Pay · Link', de: 'Kreditkarte · Apple Pay · Google Pay · Link' },
  '赞赏支持扩展栏': { en: 'Sponsor Extension Panel', fr: 'Panneau de soutien', es: 'Panel de apoyo', de: 'Unterstützer-Bereich' },
  '手机访问': { en: 'Mobile Access', fr: 'Accès mobile', es: 'Acceso móvil', de: 'Mobilzugriff' },

  // Comments System
  '正在加载评论...': { en: 'Loading comments...', fr: 'Chargement des commentaires...', es: 'Cargando comentarios...', de: 'Kommentare werden geladen...' },
  '⏱️ 最新': { en: '⏱️ Latest', fr: '⏱️ Récents', es: '⏱️ Más recientes', de: '⏱️ Neueste' },
  '🔥 最热': { en: '🔥 Hottest', fr: '🔥 Populaires', es: '🔥 Más populares', de: '🔥 Beliebteste' },
  '✏️ 编辑': { en: '✏️ Edit', fr: '✏️ Éditer', es: '✏️ Editar', de: '✏️ Bearbeiten' },
  '👁️ 预览': { en: '👁️ Preview', fr: '👁️ Aperçu', es: '👁️ Vista previa', de: '👁️ Vorschau' },
  '取消': { en: 'Cancel', fr: 'Annuler', es: 'Cancelar', de: 'Abbrechen' },
  '发送中...': { en: 'Sending...', fr: 'Envoi en cours...', es: 'Enviando...', de: 'Wird gesendet...' },
  '回复此评论': { en: 'Reply to this comment', fr: 'Répondre à ce commentaire', es: 'Responder a este comentario', de: 'Auf diesen Kommentar antworten' },
  '引用此条内容发表评论': { en: 'Quote this comment', fr: 'Citer ce commentaire', es: 'Citar este comentario', de: 'Diesen Kommentar zitieren' },
  '编辑此条评论': { en: 'Edit this comment', fr: 'Modifier ce commentaire', es: 'Editar este commentaire', de: 'Diesen Kommentar bearbeiten' },
  '删除此条评论': { en: 'Delete this comment', fr: 'Supprimer ce commentaire', es: 'Eliminar este commentaire', de: 'Diesen Kommentar löschen' },
  '切换为普通回复': { en: 'Switch to standard reply', fr: 'Passer en réponse standard', es: 'Cambiar a respuesta estándar', de: 'Zu normaler Antwort wechseln' },
  '切换为 Boost (≤16字)': { en: 'Switch to Boost (≤16 chars)', fr: 'Passer en Boost (≤16 car.)', es: 'Cambiar a Boost (≤16 car.)', de: 'Zu Boost wechseln (≤16 Z.)' },
  '火箭 Boost 回复模式 (≤16字)': { en: 'Rocket Boost Reply (≤16 chars)', fr: 'Mode Réponse Boost (≤16 car.)', es: 'Modo Respuesta Boost (≤16 car.)', de: 'Rocket-Boost-Modus (≤16 Z.)' },

  // Footer & Philosophy
  '把博客当成长期维护的软件来做。': {
    en: 'Building the blog as long-term maintained software.',
    fr: 'Concevoir le blog comme un logiciel maintenu sur le long terme.',
    es: 'Construir el blog como software mantenido a largo plazo.',
    de: 'Den Blog als langfristig gewartete Software entwickeln.'
  },
  '保持高密度信息、明确反馈和稳定排版，把博客做成真正可生长的内容系统。': {
    en: 'Maintaining high information density, clear feedback, and stable layout into a truly evolving content system.',
    fr: 'Maintenir une haute densité d information, des retours clairs et une mise en page stable dans un système évolutif.',
    es: 'Mantener alta densidad de información, retroalimentación clara y maquetación estable en un sistema en constante evolución.',
    de: 'Hohe Informationsdichte, klares Feedback und stabiles Layout zu einem zukunftsfähigen Inhaltssystem verbinden.'
  },
  '运行状态': { en: 'Operational Status', fr: 'État du système', es: 'Estado del sistema', de: 'Betriebsstatus' },
  '持续维护中': { en: 'Under Active Maintenance', fr: 'En maintenance active', es: 'En mantenimiento activo', de: 'Wird aktiv gepflegt' },
  '设计对齐': { en: 'Design Alignment', fr: 'Alignement du design', es: 'Alineación de diseño', de: 'Design-Ausrichtung' },
  '重构进度': { en: 'Refactor Progress', fr: 'Progression de la refonte', es: 'Progreso de refactorización', de: 'Refaktorierungsfortschritt' },
  '内容系统': { en: 'Content System', fr: 'Système de contenu', es: 'Sistema de contenido', de: 'Inhaltssystem' },
  '系统设计': { en: 'Systems', fr: 'Systèmes', es: 'Sistemas', de: 'Systeme' },
  '前端工程': { en: 'Frontend', fr: 'Frontend', es: 'Frontend', de: 'Frontend' },
  '学习笔记': { en: 'Notes', fr: 'Notes', es: 'Notas', de: 'Notizen' },
  '产品观察': { en: 'Product Insights', fr: 'Perspectives produit', es: 'Perspectivas del producto', de: 'Produkt-Einblicke' },
  '示例': { en: 'Examples', fr: 'Exemples', es: 'Ejemplos', de: 'Beispiele' },
  '范例': { en: 'Example', fr: 'Exemple', es: 'Ejemplo', de: 'Beispiel' },

  // Callout and Alert Titles
  '注意': { en: 'Note', fr: 'Note', es: 'Nota', de: 'Hinweis' },
  '重点': { en: 'Important', fr: 'Important', es: 'Importante', de: 'Wichtig' },
  '警告': { en: 'Warning', fr: 'Avertissement', es: 'Advertencia', de: 'Warnung' },
  '危险': { en: 'Caution', fr: 'Attention', es: 'Precaución', de: 'Vorsicht' },
  '致命': { en: 'Danger', fr: 'Danger', es: 'Peligro', de: 'Gefahr' },
  '成功': { en: 'Success', fr: 'Succès', es: 'Éxito', de: 'Erfolg' },
  '疑问': { en: 'Question', fr: 'Question', es: 'Pregunta', de: 'Frage' },
  '引用': { en: 'Quote', fr: 'Citation', es: 'Cita', de: 'Zitat' },
  '信息': { en: 'Info', fr: 'Info', es: 'Info', de: 'Info' },
  '待办': { en: 'Todo', fr: 'À faire', es: 'Por hacer', de: 'Zu erledigen' },
  '缺陷': { en: 'Bug', fr: 'Bogue', es: 'Error', de: 'Fehler' },

  // Taxonomy Tags
  '访问控制': { en: 'Access Control', fr: 'Contrôle d accès', es: 'Control de acceso', de: 'Zugriffskontrolle' },
  '安全': { en: 'Security', fr: 'Sécurité', es: 'Seguridad', de: 'Sicherheit' },
  '服务端渲染': { en: 'SSR', fr: 'SSR', es: 'SSR', de: 'SSR' },
  '主题重构': { en: 'Theme Refactor', fr: 'Refonte du thème', es: 'Refactorización del tema', de: 'Theme-Refactoring' },
  '主题格式': { en: 'Theme Formats', fr: 'Formats du thème', es: 'Formatos del tema', de: 'Theme-Formate' },
  '排版规范': { en: 'Typography Specs', fr: 'Normes typographiques', es: 'Normas tipográficas', de: 'Typografische Richtlinien' },
  '思维导图': { en: 'Mindmap', fr: 'Carte mentale', es: 'Mapa mental', de: 'Mindmap' },
  '媒体适配': { en: 'Media Adaptation', fr: 'Adaptation média', es: 'Adaptación de medios', de: 'Medienanpassung' },
  '安知鱼': { en: 'Anzhiyu', fr: 'Anzhiyu', es: 'Anzhiyu', de: 'Anzhiyu' },

  // Taxonomy Summaries & Stats
  '把长期主题拆成稳定入口，方便从具体兴趣点快速进入文章流。': {
    en: 'Organize long-term themes into stable entry points for focused exploration.',
    fr: 'Organisez les thèmes récurrents pour explorer les articles par centre d intérêt.',
    es: 'Organiza temas recurrentes para explorar artículos según tus intereses.',
    de: 'Laufende Themen in Einstiegspunkte bündeln für zielgerichtetes Lesen.'
  },
  '用更细的关键词把相邻主题串起来，减少信息孤岛。': {
    en: 'Connect related topics with precise keywords to avoid information silos.',
    fr: 'Reliez les thèmes connexes avec des mots-clés précis.',
    es: 'Conecta temas relacionados mediante palabras clave precisas.',
    de: 'Verwandte Themen mit präzisen Schlagwörtern vernetzen.'
  },
  '把所有文章按年份连续展开，保留明确时间顺序、封面信息和最短阅读路径。': {
    en: 'Display all articles chronologically by year with covers and clear reading paths.',
    fr: 'Affichez tous les articles par année avec couvertures et lecture directe.',
    es: 'Muestra todos los artículos por año con portadas y lectura directa.',
    de: 'Alle Artikel chronologisch nach Jahr mit Titelbildern anzeigen.'
  },
  '年份': { en: 'Years', fr: 'Années', es: 'Años', de: 'Jahre' },
  '最近归档': { en: 'Latest archive', fr: 'Archive récente', es: 'Archivo reciente', de: 'Letztes Archiv' },

  '关于本站': { en: 'About Site', fr: 'À propos du site', es: 'Acerca del sitio', de: 'Über die Website' },
  '前往友链': { en: 'Visit Friends', fr: 'Voir les amis', es: 'Visitar amigos', de: 'Zu den Freunden' },
  '文章总览': { en: 'Archive Overview', fr: 'Vue d ensemble', es: 'Visión general', de: 'Gesamtübersicht' },

  // Navigation & Submenus
  '文章': { en: 'Articles', fr: 'Articles', es: 'Artículos', de: 'Artikel' },
  '全部文章': { en: 'All Posts', fr: 'Tous les articles', es: 'Todos los artículos', de: 'Alle Beiträge' },
  '时间线总览': { en: 'Timeline Overview', fr: 'Chronologie globale', es: 'Visión general', de: 'Zeitleisten-Übersicht' },
  '按主题浏览文章': { en: 'Browse by topic', fr: 'Parcourir par thème', es: 'Explorar por tema', de: 'Nach Themen durchsuchen' },
  '标签聚合': { en: 'Tag Aggregation', fr: 'Agrégation des tags', es: 'Agrupación de etiquetas', de: 'Schlagwort-Übersicht' },
  '关键词索引': { en: 'Keyword Index', fr: 'Index des mots-clés', es: 'Índice de palabras clave', de: 'Stichwort-Index' },
  '友邻': { en: 'Friends', fr: 'Amis', es: 'Amigos', de: 'Freunde' },
  '友人帐': { en: 'Friend List', fr: 'Liste d amis', es: 'Lista de amigos', de: 'Freundesliste' },
  '互链、社群与交流入口': { en: 'Exchange & Community entry', fr: 'Échange & Entrée communauté', es: 'Intercambio y comunidad', de: 'Austausch & Community-Zugang' },
  '留言板': { en: 'Guestbook', fr: 'Livre d or', es: 'Libro de visitas', de: 'Gästebuch' },
  '朋友圈': { en: 'Moments', fr: 'Moments', es: 'Momentos', de: 'Momente' },
  '工坊': { en: 'Workshop', fr: 'Atelier', es: 'Taller', de: 'Werkstatt' },
  '实验田': { en: 'Experimental Lab', fr: 'Labo expérimental', es: 'Laboratorio experimental', de: 'Experimentierfeld' },
  '留声机': { en: 'Gramophone', fr: 'Gramophone', es: 'Gramófono', de: 'Grammophon' },
  '放映室': { en: 'Cinema', fr: 'Salle de projection', es: 'Sala de cine', de: 'Kinosaal' },
  '音乐播放器': { en: 'Music Player', fr: 'Lecteur audio', es: 'Reproductor de musique', de: 'Musikplayer' },
  '视频播放器': { en: 'Video Player', fr: 'Lecteur vidéo', es: 'Reproductor de video', de: 'Videoplayer' },
  '关于作者': { en: 'About Author', fr: 'À propos de l auteur', es: 'Sobre el autor', de: 'Über den Autor' },
  '作者与站点说明': { en: 'Author & site info', fr: 'Auteur et infos du site', es: 'Autor e información', de: 'Autor- & Website-Infos' },
  '查看当前重构进度': { en: 'View refactor progress', fr: 'Voir la progression', es: 'Ver progreso', de: 'Fortschritt anzeigen' },
  '尚在整理中的专题入口': { en: 'Topics in preparation', fr: 'Sujets en cours', es: 'Temas en preparación', de: 'Themen in Vorbereitung' },
  '进入归档': { en: 'Enter Archives', fr: 'Accéder aux archives', es: 'Ir al archivo', de: 'Zum Archiv' },
  '随便逛逛': { en: 'Random Post', fr: 'Article au hasard', es: 'Artículo aleatorio', de: 'Zufälliger Beitrag' },
  '打开当前推荐文章': { en: 'Open recommended post', fr: 'Ouvrir l article recommandé', es: 'Abrir artículo recomendado', de: 'Empfohlenen Beitrag öffnen' },
  '点击快速进入当前推荐文章': { en: 'Click to open recommendation', fr: 'Cliquer pour ouvrir la recommandation', es: 'Clic para abrir recomendación', de: 'Klicken für Empfehlung' },
  '更多推荐': { en: 'More Recommendations', fr: 'Plus de recommandations', es: 'Más recomendaciones', de: 'Weitere Empfehlungen' },
  '推荐卡组会在这里继续展开': { en: 'More recommendations expand here', fr: 'Les recommandations se déplient ici', es: 'Las recomendaciones se expanden aquí', de: 'Weitere Empfehlungen klappen hier aus' },
  '创意工坊': { en: 'Creative Workshop', fr: 'Atelier créatif', es: 'Taller creativo', de: 'Kreativwerkstatt' },
  '开始阅读': { en: 'Start Reading', fr: 'Commencer la lecture', es: 'Comenzar a leer', de: 'Jetzt lesen' },
  '关于主题': { en: 'About Theme', fr: 'À propos du thème', es: 'Acerca del tema', de: 'Über das Theme' },
  '向右查看更多分类': { en: 'Scroll right for more categories', fr: 'Faites défiler vers la droite', es: 'Desplaza para ver más', de: 'Nach rechts scrollen für mehr' },

  // Profile Widget & Bio
  '深耕系统重构与网络工程领域的真实折腾记录。拒绝宏大叙事，致力于提炼底层的硬核逻辑与避坑指南。持续构筑外脑知识库，期冀这些极客向的碎片随笔，能提供些许实战参考。': {
    en: 'Hands-on records in system refactoring and network engineering. Focusing on core low-level logic and practical pitfall guides. Building an external second brain, hoping these geeky essays offer practical value.',
    fr: 'Carnet d expérimentations en refonte système et ingénierie réseau. Centré sur la logique bas niveau et les retours d expérience. Bâtir un second cerveau pour offrir des références concrètes.',
    es: 'Registros reales de experimentación en refactorización de sistemas e ingeniería de redes. Enfocado en la lógica central y guías prácticas. Construyendo un segundo cerebro digital útil.',
    de: 'Praxisnahe Aufzeichnungen zu System-Refactoring und Netzwerktechnik. Fokus auf Kernlogik und Vermeidung von Fallstricken. Ein digitales Second Brain für handfeste Praxisreferenzen.'
  },
  '作者链接': { en: 'Author Links', fr: 'Liens de l auteur', es: 'Enlaces del autor', de: 'Autorenlinks' },

  // Post Navigation
  '阅读导航': { en: 'Post Navigation', fr: 'Navigation des articles', es: 'Navegación de entradas', de: 'Beitragsnavigation' },
  '上一篇 / 下一篇': { en: 'Previous / Next Post', fr: 'Article précédent / suivant', es: 'Artículo anterior / siguiente', de: 'Vorheriger / Nächster Beitrag' },
  '较新文章': { en: 'Newer post', fr: 'Article plus récent', es: 'Artículo más reciente', de: 'Neuerer Beitrag' },
  '较早文章': { en: 'Older post', fr: 'Article plus ancien', es: 'Artículo más antiguo', de: 'Älterer Beitrag' },

  // Post Copyright & Share
  '除特别声明外，本博客所有文章均采用 ': { en: 'Except where otherwise noted, all posts are licensed under ', fr: 'Sauf mention contraire, tous les articles sont sous licence ', es: 'Salvo indicación contraria, todos los artículos están bajo licencia ', de: 'Sofern nicht anders angegeben, stehen alle Beiträge unter der Lizenz ' },
  '除特别声明外，本博客所有文章均采用': { en: 'Except where otherwise noted, all posts are licensed under ', fr: 'Sauf mention contraire, tous les articles sont sous licence ', es: 'Salvo indicación contraria, todos los artículos están bajo licencia ', de: 'Sofern nicht anders angegeben, stehen alle Beiträge unter der Lizenz ' },
  ' 许可协议。转载请注明来自 ': { en: '. Attribution required, please link back to ', fr: '. Attribution requise, veuillez créditer ', es: '. Se requiere atribución, mencione como fuente a ', de: '. Namensnennung erforderlich, bitte verlinken auf ' },
  '许可协议。转载请注明来自': { en: '. Attribution required, please link back to ', fr: '. Attribution requise, veuillez créditer ', es: '. Se requiere atribución, mencione como fuente a ', de: '. Namensnennung erforderlich, bitte verlinken auf ' },
  '分享到 WhatsApp': { en: 'Share to WhatsApp', fr: 'Partager sur WhatsApp', es: 'Compartir en WhatsApp', de: 'Auf WhatsApp teilen' },
  '分享到 LINE': { en: 'Share to LINE', fr: 'Partager sur LINE', es: 'Compartir en LINE', de: 'Auf LINE teilen' },
  '分享到 Threads': { en: 'Share to Threads', fr: 'Partager sur Threads', es: 'Compartir en Threads', de: 'Auf Threads teilen' },
  '分享到 X': { en: 'Share to X', fr: 'Partager sur X', es: 'Compartir en X', de: 'Auf X teilen' },
  '分享到 Facebook': { en: 'Share to Facebook', fr: 'Partager sur Facebook', es: 'Compartir en Facebook', de: 'Auf Facebook teilen' },
  '分享到 LinkedIn': { en: 'Share to LinkedIn', fr: 'Partager sur LinkedIn', es: 'Compartir en LinkedIn', de: 'Auf LinkedIn teilen' },
  '分享到 Reddit': { en: 'Share to Reddit', fr: 'Partager sur Reddit', es: 'Compartir en Reddit', de: 'Auf Reddit teilen' },
  '分享到 Snapchat': { en: 'Share to Snapchat', fr: 'Partager sur Snapchat', es: 'Compartir en Snapchat', de: 'Auf Snapchat teilen' },
  '通过邮件分享': { en: 'Share via Email', fr: 'Partager par e-mail', es: 'Compartir por correo', de: 'Per E-Mail teilen' },
  '已唤起系统分享': { en: 'System share opened', fr: 'Partage système ouvert', es: 'Compartir del sistema abierto', de: 'System-Freigabe geöffnet' },
  '当前环境不支持系统分享，已复制链接': { en: 'System share unavailable, link copied', fr: 'Partage système non supporté, lien copié', es: 'Compartir no disponible, enlace copiado', de: 'Systemfreigabe nicht verfügbar, Link kopiert' },

  // Reward Extension
  '点击跳转 ↗': { en: 'Open ↗', fr: 'Ouvrir ↗', es: 'Abrir ↗', de: 'Öffnen ↗' },
  '点击复制地址': { en: 'Copy address', fr: 'Copier l adresse', es: 'Copiar dirección', de: 'Adresse kopieren' },
  '点击复制 USDT 钱包地址': { en: 'Copy USDT address', fr: 'Copier l adresse USDT', es: 'Copiar dirección USDT', de: 'USDT-Adresse kopieren' },
  '已复制 USDT (Arbitrum) 钱包地址': { en: 'USDT (Arbitrum) address copied', fr: 'Adresse USDT (Arbitrum) copiée', es: 'Dirección USDT (Arbitrum) copiada', de: 'USDT-Adresse (Arbitrum) kopiert' },
  '选择地区优选通道': { en: 'Select preferred channel', fr: 'Sélectionner le canal préféré', es: 'Seleccionar canal preferido', de: 'Bevorzugten Kanal wählen' },
  '恢复自动 IP 识别': { en: 'Reset to auto IP detection', fr: 'Rétablir détection IP auto', es: 'Restablecer detección IP auto', de: 'Auf automatische IP zurücksetzen' },
  '微信扫一扫': { en: 'Scan with WeChat', fr: 'Scanner avec WeChat', es: 'Escanear con WeChat', de: 'Mit WeChat scannen' },
  '支付宝扫一扫': { en: 'Scan with Alipay', fr: 'Scanner avec Alipay', es: 'Escanear con Alipay', de: 'Mit Alipay scannen' },
  '如果内容对你有帮助，欢迎请作者喝杯咖啡 ☕️': { en: 'If this helped, feel free to buy me a coffee ☕️', fr: 'Si le contenu vous a été utile, offrez-moi un café ☕️', es: 'Si el contenido te ayudó, invítame un café ☕️', de: 'Wenn der Inhalt geholfen hat, lade mich auf einen Kaffee ein ☕️' },
  '手机端可长按或截图保存二维码扫码支持 ☕️': { en: 'Long press or screenshot QR to sponsor on mobile ☕️', fr: 'Appui long ou capture d écran pour scanner sur mobile ☕️', es: 'Mantén presionado o captura pantalla para escanear ☕️', de: 'Lange drücken oder Screenshot für Mobilzahlung ☕️' },

  // Comments
  '刚刚': { en: 'Just now', fr: 'À l instant', es: 'Ahora mismo', de: 'Gerade eben' },
  '已编辑': { en: 'Edited', fr: 'Modifié', es: 'Editado', de: 'Bearbeitet' },
  '点赞': { en: 'Like', fr: 'J aime', es: 'Me gusta', de: 'Gefällt mir' },
  '置顶': { en: 'Pinned', fr: 'Épinglé', es: 'Fijado', de: 'Angeheftet' },
  '暂无评论，快来抢沙发吧！': { en: 'No comments yet. Be the first to share your thoughts!', fr: 'Aucun commentaire. Soyez le premier à réagir !', es: 'Aún no hay comentarios. ¡Sé el primero en opinar!', de: 'Noch keine Kommentare. Sei der Erste!' },
  '暂无公开评论': { en: 'No public comments yet', fr: 'Aucun commentaire public pour le moment', es: 'Aún no hay comentarios públicos', de: 'Noch keine öffentlichen Kommentare' },
  '畅所欲言，发表你的见解...': { en: 'Share your thoughts, join the discussion...', fr: 'Partagez vos réflexions, participez à la discussion...', es: 'Comparte tu opinión, únete a la conversación...', de: 'Teile deine Gedanken, nimm an der Diskussion teil...' },
  '写下你的打气祝福（不超过16字）...': { en: 'Write your cheer note (max 16 chars)...', fr: 'Écrivez un mot d encouragement (max 16 car.)...', es: 'Escribe un mensaje de ánimo (máx. 16 car.)...', de: 'Schreibe eine Aufmunterung (max. 16 Zeichen)...' },

  // Sidebar & Web Info
  '站点运行': { en: 'Site Uptime', fr: 'Temps en ligne', es: 'Tiempo activo', de: 'Betriebszeit' },
  '内容仍在持续整理': { en: 'Content continuously organized', fr: 'Contenu continuellement organisé', es: 'Contenido en constante organización', de: 'Inhalte werden laufend gepflegt' },
  '优先修正阅读与侧栏体验': { en: 'Refining reading & sidebar UX', fr: 'Optimisation de la lecture et barre latérale', es: 'Refinando lectura y barra lateral', de: 'Lesefluss & Seitenleisten-UX optimieren' },
  '文章数目': { en: 'Articles', fr: 'Articles', es: 'Artículos', de: 'Artikelanzahl' },
  '已运行时间': { en: 'Uptime', fr: 'Temps en ligne', es: 'Tiempo activo', de: 'Betriebszeit' },
  '本站总访问量': { en: 'Total Views', fr: 'Vues totales', es: 'Visitas totales', de: 'Aufrufe gesamt' },
  '最后更新时间': { en: 'Last Updated', fr: 'Dernière mise à jour', es: 'Última actualización', de: 'Zuletzt aktualisiert' },
  '加入 chronoral 社群': { en: 'Join chronoral community', fr: 'Rejoindre chronoral', es: 'Unirse a chronoral', de: 'chronoral Community beitreten' },
  '海外更新、测试通知和小范围交流入口。': { en: 'Overseas updates, testing notices, and discussions.', fr: 'Mises à jour, annonces et discussions.', es: 'Actualizaciones, avisos y discusiones.', de: 'Updates, Testankündigungen und Diskussionen.' },
  '加入': { en: 'Join', fr: 'Rejoindre', es: 'Unirse', de: 'Beitreten' },
  '扫码加入': { en: 'Scan QR to join', fr: 'Scanner pour rejoindre', es: 'Escanear para unirse', de: 'QR scannen zum Beitreten' },
  '立即加入': { en: 'Join Now', fr: 'Rejoindre', es: 'Unirse', de: 'Beitreten' },
  '立即加入 →': { en: 'Join Now →', fr: 'Rejoindre →', es: 'Unirse →', de: 'Beitreten →' },
  '无缝安全交流': { en: 'Seamless & Secure Chat', fr: 'Échange sécurisé', es: 'Chat seguro y fluido', de: 'Sicherer Austausch' },
  '快人一步获取最新文章与动态。': { en: 'Get latest posts & updates first.', fr: 'Soyez informé des nouveautés en avant-première.', es: 'Recibe novedades y artículos primero.', de: 'Neueste Beiträge zuerst erhalten.' },
  '不错过精彩内容': { en: 'Never miss great content', fr: 'Ne manquez aucun article', es: 'No te pierdas nada', de: 'Keine Inhalte verpassen' },
  '开放社群。加入我们，结识千万同好畅所欲言。': { en: 'Open community. Join us to connect with enthusiasts.', fr: 'Communauté ouverte. Rejoignez-nous.', es: 'Comunidad abierta. Únete y conecta.', de: 'Offene Community. Tausche dich aus.' },
  '探索更多可能': { en: 'Explore more possibilities', fr: 'Explorez plus de possibilités', es: 'Explora más posibilidades', de: 'Mehr Möglichkeiten entdecken' },
  '快捷简单安全。即刻加入，随时保持密切联系。': { en: 'Fast, simple & secure. Stay connected anytime.', fr: 'Rapide, simple et sécurisé.', es: 'Rápido, simple y seguro.', de: 'Schnell, einfach und sicher.' },
  '开启即时通讯': { en: 'Start instant messaging', fr: 'Démarrer la messagerie', es: 'Iniciar mensajería', de: 'Direktnachrichten starten' },
  '扫一扫关注': { en: 'Scan to follow', fr: 'Scanner pour suivre', es: 'Escanear para seguir', de: 'Scannen zum Folgen' },
  '扫码关注主页': { en: 'Scan to follow page', fr: 'Scanner pour suivre la page', es: 'Escanear para seguir la página', de: 'Scannen für Seitenzugriff' },
  '扫码添加联系': { en: 'Scan to add contact', fr: 'Scanner pour ajouter', es: 'Escanear para agregar', de: 'Scannen zum Kontaktieren' },
  '悬停翻面查看二维码，点击直接跳转 Telegram。': { en: 'Hover to flip for QR, click to open Telegram.', fr: 'Survolez pour le QR, cliquez pour ouvrir Telegram.', es: 'Pase el ratón para ver QR, clic para Telegram.', de: 'Hover für QR-Code, Klick öffnet Telegram.' },
  '界面状态': { en: 'Interface Status', fr: 'État de l interface', es: 'Estado de la interfaz', de: 'Oberflächenstatus' },
  '继续打磨真实可用的阅读与交互手感': { en: 'Refining authentic reading feel & tactile ergonomics', fr: 'Perfectionnement du confort de lecture et d ergonomie', es: 'Refinando el tacto de lectura y ergonomía', de: 'Lesefluss & Haptik weiter verfeinern' },
  '目录固定': { en: 'Sticky TOC', fr: 'Sommaire fixe', es: 'Índice fijo', de: 'Fixiertes Inhaltsverzeichnis' },
  '首页分页': { en: 'Home Pagination', fr: 'Pagination accueil', es: 'Paginación de inicio', de: 'Startseiten-Pagination' },
  '动态头像': { en: 'Dynamic Avatar', fr: 'Avatar dynamique', es: 'Avatar dinámico', de: 'Dynamischer Avatar' },
  '查看更多': { en: 'View More', fr: 'Voir plus', es: 'Ver más', de: 'Mehr anzeigen' },

  // Footer & Runtime
  '目前正在同步打磨首页、文章页、页脚、按钮反馈与交互动效。': {
    en: 'Currently polishing homepage, articles, footer, button feedback, and motion effects.',
    fr: 'Peaufinage de l accueil, des articles, du pied de page et des animations.',
    es: 'Actualmente puliendo inicio, artículos, pie de página y animaciones.',
    de: 'Startseite, Artikel, Footer und Animationen werden derzeit verfeinert.'
  },
  // Activities, Dock, Toasts & Dialogs
  '赞赏': { en: 'Sponsor', fr: 'Soutenir', es: 'Apoyar', de: 'Spenden' },
  '已选': { en: 'Selected', fr: 'Sélectionné', es: 'Seleccionado', de: 'Ausgewählt' },
  '已回到页面顶部': { en: 'Back to top', fr: 'Haut de page', es: 'Volver arriba', de: 'Nach oben gescrollt' },
  '已切换为深色模式': { en: 'Switched to dark mode', fr: 'Mode sombre activé', es: 'Modo oscuro activado', de: 'Dunkelmodus aktiviert' },
  '已切换为浅色模式': { en: 'Switched to light mode', fr: 'Mode clair activé', es: 'Modo claro activado', de: 'Hellmodus aktiviert' },
  '已收起侧栏': { en: 'Sidebar collapsed', fr: 'Barre latérale masquée', es: 'Barra lateral oculta', de: 'Seitenleiste eingeklappt' },
  '已展开侧栏': { en: 'Sidebar expanded', fr: 'Barre latérale affichée', es: 'Barra lateral expandida', de: 'Seitenleiste ausgeklappt' },
  '已开启阅读模式': { en: 'Reading mode enabled', fr: 'Mode lecture activé', es: 'Modo lectura activado', de: 'Lesemodus aktiviert' },
  '已退出阅读模式': { en: 'Reading mode exited', fr: 'Mode lecture désactivé', es: 'Modo lectura desactivado', de: 'Lesemodus beendet' },
  '已打开文章目录抽屉': { en: 'TOC drawer opened', fr: 'Sommaire ouvert', es: 'Índice abierto', de: 'Inhaltsverzeichnis geöffnet' },
  '已定位至评论区': { en: 'Navigated to comments', fr: 'Navigué vers les commentaires', es: 'Navegado a comentarios', de: 'Zu Kommentaren gesprungen' },
  '当前页面暂无评论区': { en: 'No comment section on this page', fr: 'Aucun commentaire sur cette page', es: 'Sin comentarios en esta página', de: 'Keine Kommentare auf dieser Seite' },
  '已展开快捷工具栏': { en: 'Quick toolbar expanded', fr: 'Barre d\'outils affichée', es: 'Barra rápida desplegada', de: 'Schnellleiste ausgeklappt' },
  '已收起快捷工具栏': { en: 'Quick toolbar collapsed', fr: 'Barre d\'outils masquée', es: 'Barra rápida plegada', de: 'Schnellleiste eingeklappt' },
  '已收起快捷菜单（鼠标移至屏幕右侧可重新唤出）': { en: 'Quick dock hidden (hover right screen edge to restore)', fr: 'Menu masqué (survoler le bord droit pour réafficher)', es: 'Menú oculto (pasa el cursor por el borde derecho para mostrar)', de: 'Schnellmenü ausgeblendet (rechten Bildschirmrand berühren zum Einblenden)' },
  '已复制当前内容到剪贴板': { en: 'Copied to clipboard', fr: 'Copié dans le presse-papiers', es: 'Copiado al portapapeles', de: 'In die Zwischenablage kopiert' },
  '已将选中文本引用至评论区': { en: 'Quoted selection to comment box', fr: 'Sélection citée dans les commentaires', es: 'Texto citado en el área de comentarios', de: 'Auswahl in den Kommentarbereich zitiert' },
  '已复制选中文本': { en: 'Selected text copied', fr: 'Texte sélectionné copié', es: 'Texto seleccionado copiado', de: 'Markierter Text kopiert' },
  '已复制当前地址': { en: 'Current URL copied', fr: 'Adresse copiée', es: 'Dirección copiada', de: 'URL kopiert' },
  '已打开站内搜索': { en: 'Search opened', fr: 'Recherche ouverte', es: 'Búsqueda abierta', de: 'Suche geöffnet' },
  '已切换页面背景': { en: 'Page background switched', fr: 'Arrière-plan changé', es: 'Fondo de página cambiado', de: 'Seitenhintergrund gewechselt' },
  '当前为统一纯色背景': { en: 'Currently using unified solid background', fr: 'Arrière-plan monochrome unifié actuel', es: 'Fondo de color sólido unificado actual', de: 'Aktuell einheitlicher Volltonhintergrund' },
  '冬日雪境': { en: 'Winter Snowscape', fr: 'Paysage enneigé', es: 'Paisaje invernal', de: 'Winterliche Schneelandschaft' },
  '已打开通知中心': { en: 'Notification center opened', fr: 'Centre de notifications ouvert', es: 'Centro de notificaciones abierto', de: 'Benachrichtigungszentrum geöffnet' },
  '已复制代码块': { en: 'Code copied', fr: 'Code copié', es: 'Código copiado', de: 'Code kopiert' },
  '代码复制失败': { en: 'Failed to copy code', fr: 'Échec de la copie du code', es: 'Error al copiar el código', de: 'Fehler beim Kopieren des Codes' },
  '复制失败，请手动复制': { en: 'Copy failed, please copy manually', fr: 'Échec de la copie, veuillez copier manuellement', es: 'Error al copiar, copie manualmente', de: 'Kopieren fehlgeschlagen, bitte manuell kopieren' },
  '已恢复自动 IP 地区识别': { en: 'Restored automatic IP region detection', fr: 'Détection automatique de région rétablie', es: 'Detección automática de región restaurada', de: 'Automatische Regionserkennung wiederhergestellt' },
  '知道了': { en: 'Dismiss', fr: 'Compris', es: 'Entendido', de: 'Verstanden' },
  '控制台提示': { en: 'Console Notice', fr: 'Notice de la console', es: 'Aviso de consola', de: 'Konsolenhinweis' },
  '控制台暂不可用': { en: 'Console Currently Unavailable', fr: 'Console actuellement indisponible', es: 'Consola no disponible actualmente', de: 'Konsole derzeit nicht verfügbar' },
  '快捷控制台': { en: 'Quick Console', fr: 'Console Rapide', es: 'Consola Rápida', de: 'Schnellkonsole' },
  '搜索内容': { en: 'Search Content', fr: 'Rechercher', es: 'Buscar contenido', de: 'Inhalt durchsuchen' },
  '背景切换': { en: 'Toggle Background', fr: 'Changer l\'arrière-plan', es: 'Cambiar fondo', de: 'Hintergrund wechseln' },
  '查看通知': { en: 'View Notifications', fr: 'Voir les notifications', es: 'Ver notificaciones', de: 'Benachrichtigungen ansehen' },
  '内容索引': { en: 'Content Index', fr: 'Index du contenu', es: 'Índice de contenido', de: 'Inhaltsindex' },
  '搜索标题、摘要或分类': { en: 'Search titles, abstracts or categories', fr: 'Rechercher titres, résumés ou catégories', es: 'Buscar títulos, resúmenes o categorías', de: 'Titel, Zusammenfassungen oder Kategorien durchsuchen' },
  '没有找到匹配内容': { en: 'No matching content found', fr: 'Aucun contenu correspondant trouvé', es: 'No se encontraron coincidencias', de: 'Keine passenden Inhalte gefunden' },
  '右键菜单': { en: 'Context Menu', fr: 'Menu contextuel', es: 'Menú contextual', de: 'Kontextmenü' },
  '后退': { en: 'Back', fr: 'Retour', es: 'Atrás', de: 'Zurück' },
  '前进': { en: 'Forward', fr: 'Avancer', es: 'Adelante', de: 'Vorwärts' },
  '刷新': { en: 'Refresh', fr: 'Actualiser', es: 'Actualizar', de: 'Aktualisieren' },
  '顶部': { en: 'Top', fr: 'Haut', es: 'Arriba', de: 'Oben' },
  '引用至评论区': { en: 'Quote in comments', fr: 'Citer dans les commentaires', es: 'Citar en comentarios', de: 'In Kommentaren zitieren' },
  '复制选中文本': { en: 'Copy selected text', fr: 'Copier le texte sélectionné', es: 'Copiar texto seleccionado', de: 'Markierten Text kopieren' },
  '复制地址': { en: 'Copy URL', fr: 'Copier l\'adresse', es: 'Copiar dirección', de: 'URL kopieren' },
  '浅色模式': { en: 'Light Mode', fr: 'Mode clair', es: 'Modo claro', de: 'Heller Modus' },
  '深色模式': { en: 'Dark Mode', fr: 'Mode sombre', es: 'Modo oscuro', de: 'Dunkler Modus' },
  '赞赏记录': { en: 'Donation Log', fr: 'Historique des dons', es: 'Registro de donaciones', de: 'Spendenprotokoll' },
  '已更新账号资料': { en: 'Profile updated', fr: 'Profil mis à jour', es: 'Perfil actualizado', de: 'Profil aktualisiert' },
  '已创建评论账号': { en: 'Account created', fr: 'Compte créé', es: 'Cuenta creada', de: 'Konto erstellt' },
  '已退出当前账号': { en: 'Logged out of account', fr: 'Déconnecté du compte', es: 'Sesión cerrada', de: 'Vom Konto abgemeldet' },
  '已退出账号': { en: 'Logged out', fr: 'Déconnecté', es: 'Sesión cerrada', de: 'Abgemeldet' },
  '已上传并更新头像': { en: 'Avatar uploaded and updated', fr: 'Avatar téléversé et mis à jour', es: 'Avatar subido y actualizado', de: 'Avatar hochgeladen und aktualisiert' },
  '恢复默认 Epomail 官方头像': { en: 'Restored default Epomail official avatar', fr: 'Avatar officiel Epomail par défaut restauré', es: 'Avatar oficial predeterminado de Epomail restaurado', de: 'Offizieller Standard-Epomail-Avatar wiederhergestellt' },
  '更新个人资料': { en: 'Update profile', fr: 'Mettre à jour le profil', es: 'Actualizar perfil', de: 'Profil aktualisieren' },
  '更新本地个人资料': { en: 'Update local profile', fr: 'Mettre à jour le profil local', es: 'Actualizar perfil local', de: 'Lokales Profil aktualisieren' },
  '当前页面暂时没有这个入口': { en: 'Entry not available on this page', fr: 'Entrée non disponible sur cette page', es: 'Entrada no disponible en esta página', de: 'Zugang auf dieser Seite nicht verfügbar' },
  '请先填写昵称。': { en: 'Please enter a username first.', fr: 'Veuillez d\'abord saisir un pseudo.', es: 'Por favor ingrese un apodo primero.', de: 'Bitte geben Sie zuerst einen Benutzernamen ein.' },
  '账号资料已更新。': { en: 'Profile data updated.', fr: 'Données du profil mises à jour.', es: 'Datos de la cuenta actualizados.', de: 'Profildaten aktualisiert.' },
  '账号已创建。': { en: 'Account created.', fr: 'Compte créé.', es: 'Cuenta creada.', de: 'Konto erstellt.' },
  '当前账号已退出，评论将恢复只读。': { en: 'Account logged out, comments are now read-only.', fr: 'Compte déconnecté, les commentaires sont en lecture seule.', es: 'Cuenta desconectada, comentarios en modo lectura.', de: 'Konto abgemeldet, Kommentare schreibgeschützt.' },
  '请在弹出的 Epomail 窗口中完成授权...': { en: 'Please complete authorization in the Epomail popup...', fr: 'Veuillez terminer l\'autorisation dans la fenêtre Epomail...', es: 'Por favor complete la autorización en la ventana de Epomail...', de: 'Bitte schließen Sie die Autorisierung im Epomail-Popup ab...' },
  '请填写 Epomail 账号或邮箱': { en: 'Please enter Epomail account or email', fr: 'Veuillez saisir votre compte Epomail ou e-mail', es: 'Ingrese su cuenta de Epomail o correo', de: 'Bitte Epomail-Konto oder E-Mail eingeben' },
  '仅支持上传图片格式文件 (PNG, JPG, WebP, GIF, SVG)': { en: 'Only image files (PNG, JPG, WebP, GIF, SVG) are supported', fr: 'Seuls les fichiers image (PNG, JPG, WebP, GIF, SVG) sont pris en charge', es: 'Solo se admiten archivos de imagen (PNG, JPG, WebP, GIF, SVG)', de: 'Nur Bilddateien (PNG, JPG, WebP, GIF, SVG) werden unterstützt' },
  '头像文件不能超过 10MB': { en: 'Avatar file cannot exceed 10MB', fr: 'Le fichier avatar ne doit pas dépasser 10 Mo', es: 'El archivo de avatar no puede exceder 10 MB', de: 'Avatardatei darf 10 MB nicht überschreiten' },
  '正在上传新头像至 Telegram 图床...': { en: 'Uploading new avatar to Telegram image host...', fr: 'Téléversement du nouvel avatar vers l\'hébergeur Telegram...', es: 'Subiendo nuevo avatar al host de Telegram...', de: 'Lade neuen Avatar zu Telegram hoch...' },
  '头像上传失败': { en: 'Failed to upload avatar', fr: 'Échec du téléversement de l\'avatar', es: 'Error al subir avatar', de: 'Avatar-Upload fehlgeschlagen' },
  '新头像已上传至 Telegram 图床并应用！': { en: 'New avatar uploaded to Telegram and applied!', fr: 'Nouvel avatar téléversé sur Telegram et appliqué !', es: '¡Nuevo avatar subido a Telegram y aplicado!', de: 'Neuer Avatar zu Telegram hochgeladen und angewendet!' },
  '头像上传异常': { en: 'Avatar upload exception', fr: 'Exception lors du téléversement de l\'avatar', es: 'Excepción al subir avatar', de: 'Avatar-Upload-Ausnahme' },
  '恢复头像失败': { en: 'Failed to restore avatar', fr: 'Échec de la restauration de l\'avatar', es: 'Error al restaurar avatar', de: 'Avatar-Wiederherstellung fehlgeschlagen' },
  '个人资料已成功保存！': { en: 'Profile saved successfully!', fr: 'Profil enregistré avec succès !', es: '¡Perfil guardado con éxito!', de: 'Profil erfolgreich gespeichert!' },
  '保存资料失败': { en: 'Failed to save profile', fr: 'Échec de l\'enregistrement du profil', es: 'Error al guardar el perfil', de: 'Profil konnte nicht gespeichert werden' },
  '个人资料与本地身份已保存！': { en: 'Profile and local identity saved!', fr: 'Profil et identité locale enregistrés !', es: '¡Perfil e identidad local guardados!', de: 'Profil und lokale Identität gespeichert!' },
  '保存资料异常': { en: 'Profile save exception', fr: 'Exception lors de l\'enregistrement du profil', es: 'Excepción al guardar el perfil', de: 'Fehler beim Speichern des Profils' },
  '已退出登录并清除身份凭证': { en: 'Logged out and credentials cleared', fr: 'Déconnecté et identifiants effacés', es: 'Sesión cerrada y credenciales eliminadas', de: 'Abgemeldet und Anmeldedaten gelöscht' },
  '正在验证 Epomail 凭据并同步账号...': { en: 'Verifying Epomail credentials and syncing account...', fr: 'Vérification des identifiants Epomail et synchronisation...', es: 'Verificando credenciales de Epomail y sincronizando cuenta...', de: 'Überprüfe Epomail-Anmeldedaten und synchronisiere Konto...' },
  'Epomail 授权凭据交换失败，请重试': { en: 'Epomail credential exchange failed, please retry', fr: 'Échec de l\'échange des identifiants Epomail, veuillez réessayer', es: 'Error de intercambio de credenciales de Epomail, reintente', de: 'Austausch der Epomail-Anmeldedaten fehlgeschlagen, bitte erneut versuchen' },
  'Epomail 授权验证失败，请重试': { en: 'Epomail authorization failed, please retry', fr: 'Échec de l\'autorisation Epomail, veuillez réessayer', es: 'Error de autorización de Epomail, reintente', de: 'Epomail-Autorisierung fehlgeschlagen, bitte erneut versuchen' },
  '安全提醒': { en: 'Security Notice', fr: 'Avis de sécurité', es: 'Aviso de seguridad', de: 'Sicherheitshinweis' },
  '当前环境不展示加密钱包': { en: 'Crypto wallet hidden in current environment', fr: 'Portefeuille crypto masqué dans l\'environnement actuel', es: 'Billetera cripto oculta en el entorno actual', de: 'Krypto-Wallet in der aktuellen Umgebung ausgeblendet' },
  '检测到当前网络或设备画像处于中国大陆环境，已关闭 USDT 钱包展示。': { en: 'Mainland China environment detected, USDT wallet display is disabled.', fr: 'Environnement de Chine continentale détecté, l\'affichage du portefeuille USDT est désactivé.', es: 'Entorno de China continental detectado, visualización de billetera USDT desactivada.', de: 'Festlandchina-Umgebung erkannt, Anzeige der USDT-Wallet ist deaktiviert.' },
  '继续查看': { en: 'Continue', fr: 'Continuer', es: 'Continuar', de: 'Weiter' },
  '暂不显示': { en: 'Dismiss', fr: 'Ignorer', es: 'Ignorar', de: 'Verwerfen' },
  '展开更多方式': { en: 'More options', fr: 'Plus d\'options', es: 'Más opciones', de: 'Weitere Optionen' },
  '收起附加方式': { en: 'Fewer options', fr: 'Moins d\'options', es: 'Menos opciones', de: 'Weniger Optionen' },
  '当前仅开放中国大陆、中国香港与英国三个打赏区。': { en: 'Donations currently supported in Mainland China, Hong Kong, and the UK.', fr: 'Dons actuellement disponibles pour la Chine continentale, Hong Kong et le Royaume-Uni.', es: 'Donaciones disponibles actualmente para China continental, Hong Kong y el Reino Unido.', de: 'Spenden derzeit für Festlandchina, Hongkong und Großbritannien verfügbar.' },
  '🌐 外联加密文章': { en: '🌐 External Encrypted Article', fr: '🌐 Article crypté externe', es: '🌐 Artículo cifrado externo', de: '🌐 Extern verschlüsselter Artikel' },
  '端点隔离存储': { en: 'Isolated Storage', fr: 'Stockage isolé', es: 'Almacenamiento aislado', de: 'Isolierte Speicherung' },
  '验证访问凭证': { en: 'Verify Access Credentials', fr: 'Vérifier les identifiants d\'accès', es: 'Verificar credenciales de acceso', de: 'Zugangsdaten überprüfen' },
  '这是一篇加密文章，请输入访问密码继续阅读完整内容。': { en: 'This is an encrypted article. Please enter the password to continue reading.', fr: 'Ceci est un article crypté. Veuillez entrer le mot de passe pour continuer la lecture.', es: 'Este es un artículo cifrado. Ingrese la contraseña para continuar leyendo.', de: 'Dies ist ein verschlüsselter Artikel. Bitte Passwort eingeben, um fortzufahren.' },
  '输入访问密钥 / 密码': { en: 'Enter access key / password', fr: 'Entrez la clé d\'accès / mot de passe', es: 'Ingrese clave de acceso / contraseña', de: 'Zugangsschlüssel / Passwort eingeben' },
  '凭证校验失败，请重新输入': { en: 'Credential verification failed, please try again', fr: 'Échec de la vérification, veuillez réessayer', es: 'Verificación fallida, intente de nuevo', de: 'Überprüfung fehlgeschlagen, bitte erneut eingeben' },
  '取消，返回原文': { en: 'Cancel, return to original', fr: 'Annuler, retourner à l\'original', es: 'Cancelar, volver al original', de: 'Abbrechen, zurück zum Original' },
  '🔓 验证并解密': { en: '🔓 Verify & Decrypt', fr: '🔓 Vérifier et décrypter', es: '🔓 Verificar y descifrar', de: '🔓 Überprüfen & Entschlüsseln' },
  '取消后将自动跳转至未加密版本': { en: 'Will redirect to unencrypted version upon cancellation', fr: 'Sera redirigé vers la version non cryptée après annulation', es: 'Redirigirá a la versión sin cifrar al cancelar', de: 'Wird bei Abbruch zur unverschlüsselten Version weitergeleitet' },
  '移动端文章目录': { en: 'Mobile TOC', fr: 'Sommaire mobile', es: 'Índice móvil', de: 'Mobiles Inhaltsverzeichnis' },
  '全部层级': { en: 'All Levels', fr: 'Tous les niveaux', es: 'Todos los niveles', de: 'Alle Ebenen' },
  '仅展示 1 级大纲': { en: 'Level 1 Outline Only', fr: 'Niveau 1 uniquement', es: 'Solo nivel 1', de: 'Nur Ebene 1' },
  '展示至 2 级标题': { en: 'Up to Level 2 Headings', fr: 'Jusqu\'au niveau 2', es: 'Hasta nivel 2', de: 'Bis zu Ebene 2' },
  '展示至 3 级标题': { en: 'Up to Level 3 Headings', fr: 'Jusqu\'au niveau 3', es: 'Hasta nivel 3', de: 'Bis zu Ebene 3' },
  '切换地区': { en: 'Change region', fr: 'Changer de région', es: 'Cambiar región', de: 'Region wechseln' },
  '自动识别': { en: 'Auto detected', fr: 'Détection auto', es: 'Auto detectado', de: 'Automatisch erkannt' },
  '恢复自动识别': { en: 'Restore auto detection', fr: 'Rétablir détection auto', es: 'Restaurar auto detección', de: 'Automatische Erkennung wiederherstellen' },
  '数据是系统的脉络，客观映射着每一次渲染与交互的物理回响。': { en: 'Data is the pulse of the system, objectively mirroring every render and interaction.', fr: 'Les données sont le pouls du système, reflétant chaque rendu et interaction.', es: 'Los datos son el pulso del sistema, reflejando cada renderizado e interacción.', de: 'Daten sind der Puls des Systems und spiegeln jedes Rendern und jede Interaktion wider.' },
  '始于极简，构筑坚实；内容为核，长期演进。': { en: 'Born of minimalism, built to last; content at core, evolving steadily.', fr: 'Né du minimalisme, conçu pour durer ; le contenu au cœur, en évolution continue.', es: 'Nacido del minimalismo, construido para durar; contenido en el centro, evolución continua.', de: 'Aus Minimalismus geboren, für die Ewigkeit gebaut; Inhalt im Kern, stetige Weiterentwicklung.' },

  // Navigation & Submenus
  '请喝咖啡': { en: 'Buy Me a Coffee', fr: 'Offrir un café', es: 'Invítame a un café', de: 'Kaffee spendieren' },
  '界面与功能的试验场': { en: 'UI and feature lab', fr: 'Lab d\'interfaces et fonctionnalités', es: 'Laboratorio de interfaz y funciones', de: 'Labor für Benutzeroberflächen' },
  '赞赏与支援名录': { en: 'Sponsors & appreciation roster', fr: 'Mécénat et liste de soutien', es: 'Patrocinio y lista de apoyo', de: 'Förderer- und Unterstützerliste' },
  '切换菜单': { en: 'Toggle Menu', fr: 'Basculer le menu', es: 'Alternar menú', de: 'Menü umschalten' },
  '主导航': { en: 'Main navigation', fr: 'Navigation principale', es: 'Navegación principal', de: 'Hauptnavigation' },

  // Console & Discovery
  '热门话题': { en: 'Hot Topics', fr: 'Sujets populaires', es: 'Temas populares', de: 'Beliebte Themen' },
  '内容发现': { en: 'Discovery', fr: 'Découverte', es: 'Descubrimiento', de: 'Entdeckung' },
  '随机播放 / 点歌': { en: 'Shuffle / Search', fr: 'Aléatoire / Rechercher', es: 'Aleatorio / Buscar', de: 'Zufall / Suchen' },
  '点歌 / 随机 / 后台播放': { en: 'Search / Shuffle / Background', fr: 'Recherche / Aléatoire / Fond', es: 'Buscar / Aleatorio / Fondo', de: 'Suchen / Zufall / Hintergrund' },
  '关闭背景音乐面板': { en: 'Close background music panel', fr: 'Fermer le lecteur musical', es: 'Cerrar panel de música', de: 'Musik-Panel schließen' },
  '打开背景音乐面板': { en: 'Open background music panel', fr: 'Ouvrir le lecteur musical', es: 'Abrir panel de música', de: 'Musik-Panel öffnen' },
  '关闭音乐面板': { en: 'Close music panel', fr: 'Fermer le panneau musical', es: 'Cerrar panel de música', de: 'Musikbereich schließen' },
  '切换曲库': { en: 'Switch library', fr: 'Changer de bibliothèque', es: 'Cambiar biblioteca', de: 'Bibliothek wechseln' },

  // Badges, Cards & Pagination
  '荐': { en: 'Top', fr: 'Top', es: 'Top', de: 'Top' },
  '文': { en: 'Post', fr: 'Article', es: 'Post', de: 'Beitrag' },
  '最新动态': { en: 'Latest News', fr: 'Actualités', es: 'Novedades', de: 'Aktuelles' },
  '未读': { en: 'Unread', fr: 'Non lu', es: 'No leído', de: 'Ungelesen' },
  '第': { en: 'Page', fr: 'Page', es: 'Pág.', de: 'Seite' },
  '快速跳转页码': { en: 'Jump to page', fr: 'Aller à la page', es: 'Ir a la página', de: 'Zur Seite' },
  '输入目标页码': { en: 'Enter target page', fr: 'Entrer le numéro de page', es: 'Ingresar página objetivo', de: 'Zielseite eingeben' },
  '前往': { en: 'Go', fr: 'Aller', es: 'Ir', de: 'Los' },
  '已是第一页': { en: 'First page', fr: 'Première page', es: 'Primera página', de: 'Erste Seite' },
  '已是最后一页': { en: 'Last page', fr: 'Dernière page', es: 'Última page', de: 'Letzte Seite' },

  // Categories & Descriptions
  '架构判断与演进记录': { en: 'Architecture decisions & evolution', fr: 'Décisions d\'architecture et évolution', es: 'Decisiones de arquitectura y evolución', de: 'Architektur-Entscheidungen und Evolution' },
  '界面、组件和体验实现': { en: 'UI, components & UX delivery', fr: 'Interface, composants et ergonomie', es: 'Interfaz, componentes y experiencia', de: 'Benutzeroberfläche, Komponenten & UX' },
  '课程、实验与思考': { en: 'Courses, experiments & reflections', fr: 'Cours, expériences et réflexions', es: 'Kurse, Experimente und Reflexionen', de: 'Kurse, Experimente und Reflexionen' },
  '等级阶梯与徽章': { en: 'Levels, tiers & achievements', fr: 'Niveaux, paliers et badges', es: 'Niveles, rangos e insignias', de: 'Stufen, Ränge und Abzeichen' },
  '规范、指引与说明': { en: 'Guidelines, specs & manuals', fr: 'Directives, spécifications et guides', es: 'Pautas, especificaciones y guías', de: 'Richtlinien, Spezifikationen und Anleitungen' },
  '读者社区': { en: 'Community', fr: 'Communauté', es: 'Comunidad', de: 'Community' },
  '社区指南': { en: 'Community Guide', fr: 'Guide communautaire', es: 'Guía comunitaria', de: 'Community-Leitfaden' },
  '徽章系统': { en: 'Badge System', fr: 'Système de badges', es: 'Sistema de insignias', de: 'Abzeichensystem' },
  '等级阶梯': { en: 'Trust Levels', fr: 'Niveaux de confiance', es: 'Niveles de confianza', de: 'Vertrauensstufen' },

  // User Status & Badges
  '写代码中': { en: 'Coding', fr: 'En train de coder', es: 'Programando', de: 'Beim Programmieren' },
  '忙碌中': { en: 'Busy', fr: 'Occupé', es: 'Ocupado', de: 'Beschäftigt' },
  '深度专注': { en: 'Deep Focus', fr: 'Concentration profonde', es: 'Enfoque profundo', de: 'Tief fokussiert' },
  '摸鱼小憩': { en: 'Taking a Break', fr: 'Petite pause', es: 'Tomando un descanso', de: 'Kleine Pause' },
  '构思想法': { en: 'Brainstorming', fr: 'En réflexion', es: 'Ideando', de: 'Ideen sammeln' },
  '听歌沉浸': { en: 'Immersed in Music', fr: 'Immergé dans la musique', es: 'Inmerso en música', de: 'In Musik versunken' },
  '暂离休息': { en: 'Away / Resting', fr: 'Absent / Repos', es: 'Ausente / Descanso', de: 'Abwesend / Pause' },
  '点击选择状态 Emoji 表情': { en: 'Click to select status emoji', fr: 'Cliquer pour choisir un emoji de statut', es: 'Haga clic para elegir emoji de estado', de: 'Klicken, um Status-Emoji zu wählen' },
  '选择状态 Emoji 表情': { en: 'Select status emoji', fr: 'Choisir un emoji de statut', es: 'Elegir emoji de estado', de: 'Status-Emoji wählen' },
  '输入自定义状态说明（如：忙碌中）': { en: 'Enter custom status (e.g. Busy)', fr: 'Entrez un statut personnalisé (ex. Occupé)', es: 'Ingrese estado personalizado (ej. Ocupado)', de: 'Benutzerdefinierten Status eingeben (z.B. Beschäftigt)' },
  '自定义状态说明': { en: 'Custom status description', fr: 'Description du statut personnalisé', es: 'Descripción del estado personalizado', de: 'Benutzerdefinierte Statusbeschreibung' },
  '清除当前状态': { en: 'Clear current status', fr: 'Effacer le statut actuel', es: 'Borrar estado actual', de: 'Aktuellen Status löschen' },
  '选择状态 Emoji': { en: 'Select Status Emoji', fr: 'Choisir un emoji de statut', es: 'Seleccionar emoji de estado', de: 'Status-Emoji auswählen' },
  '我的当前状态': { en: 'My Current Status', fr: 'Mon statut actuel', es: 'Mi estado actual', de: 'Mein aktueller Status' },
  '已解锁称号与名片佩戴': { en: 'Unlocked Badges & Profile Flares', fr: 'Badges débloqués et insignes', es: 'Insignias desbloqueadas y distintivos', de: 'Freigeschaltete Abzeichen & Profil-Flares' },
  '已佩戴': { en: 'Equipped', fr: 'Équipé', es: 'Equipado', de: 'Ausgerüstet' },
  '展示已获得的专属称号。按需选择最多 4 个称号佩戴展示于评论名片中：': { en: 'Displays unlocked badges. Select up to 4 badges to display on your comment card:', fr: 'Affiche les badges débloqués. Choisissez jusqu\'à 4 badges à afficher sur votre carte de commentaire :', es: 'Muestra las insignias desbloqueadas. Elija hasta 4 insignias para mostrar en su tarjeta de comentarios:', de: 'Zeigt freigeschaltete Abzeichen. Wähle bis zu 4 Abzeichen für deine Kommentarkarte:' },
  '点击更换头像': { en: 'Click to change avatar', fr: 'Cliquer pour changer d\'avatar', es: 'Haga clic para cambiar avatar', de: 'Klicken, um Avatar zu ändern' },
  'Epomail 认证身份': { en: 'Epomail Verified Identity', fr: 'Identité vérifiée Epomail', es: 'Identidad verificada de Epomail', de: 'Epomail-verifizierte Identität' },
  '所在位置': { en: 'Location', fr: 'Emplacement', es: 'Ubicación', de: 'Standort' },
  '当前时区': { en: 'Current Timezone', fr: 'Fuseau horaire actuel', es: 'Zona horaria actual', de: 'Aktuelle Zeitzone' },

  // Home Hero, Announcements & Showcase
  'EpoCanvas 纯净背景音乐': { en: 'EpoCanvas Pure Background Music', fr: 'Musique de fond pure EpoCanvas', es: 'Música de fondo pura EpoCanvas', de: 'EpoCanvas Reine Hintergrundmusik' },
  '这一步不再停留在“有内容的默认壳子”，而是把头图、导航、卡片、侧栏、按钮反馈、开场过渡和页面层次一起重新做完整。': { en: 'Beyond a basic populated shell, this step rebuilds hero, nav, cards, sidebar, interactions, and hierarchy into a cohesive experience.', fr: 'Au-delà d\'une coquille standard, cette étape reconstruit héros, navigation, cartes, barre latérale et interactions.', es: 'Más allá de una plantilla básica, este paso reconstruye hero, navegación, tarjetas, barra lateral e interacciones.', de: 'Über ein Standard-Template hinaus baut dieser Schritt Hero, Navigation, Karten, Sidebar und Interaktionen neu auf.' },
  '内容优先': { en: 'Content First', fr: 'Le contenu d\'abord', es: 'El contenido primero', de: 'Inhalt an erster Stelle' },
  '界面有序。': { en: 'Structured Interface.', fr: 'Interface structurée.', es: 'Interfaz estructurada.', de: 'Strukturierte Oberfläche.' },
  '内容、结构与交互一起重做': { en: 'Content, Structure & Interaction Reimagined', fr: 'Contenu, structure et interaction repensés', es: 'Contenido, estructura e interacción rediseñados', de: 'Inhalt, Struktur und Interaktion neu gedacht' },
  '从零构建': { en: 'Built from Scratch', fr: 'Construit de zéro', es: 'Construido desde cero', de: 'Von Grund auf gebaut' },
  '测试验证': { en: 'Testing & Verification', fr: 'Tests & Vérification', es: 'Pruebas y Verificación', de: 'Tests & Verifikation' },
  '容错': { en: 'Fault Tolerance', fr: 'Tolérance aux pannes', es: 'Tolerancia a fallos', de: 'Fehlertoleranz' },
  '测试': { en: 'Testing', fr: 'Tests', es: 'Pruebas', de: 'Tests' },
  '先把真正的主题感和交互密度做出来': { en: 'Crafting true theme atmosphere and interaction density', fr: 'Façonner une véritable atmosphère de thème et une densité d\'interaction', es: 'Creando una verdadera atmósfera de tema y densidad interactiva', de: 'Echte Theme-Atmosphäre und Interaktionsdichte schaffen' },
  '在高信息密度里保留阅读秩序': { en: 'Preserving reading order within high information density', fr: 'Préserver l\'ordre de lecture dans une haute densité d\'information', es: 'Preservando el orden de lectura en alta densidad informativa', de: 'Leseordnung bei hoher Informationsdichte bewahren' },
  '用更稳定的首页结构、交互节奏和作者表达，把数据、组件和配置收束成一套更适合长期维护的 Astro 体系。': { en: 'Unifying data, components, and configuration into a sustainable Astro system with refined layout and rhythm.', fr: 'Unifier données, composants et configuration en un système Astro durable au rythme soigné.', es: 'Unificando datos, componentes y configuración en un sistema Astro sostenible con ritmo refinado.', de: 'Daten, Komponenten und Konfiguration zu einem nachhaltigen Astro-System mit feinem Rhythmus vereinen.' },
  '这里会继续同步当前重构进度，优先把首页、侧栏、文章页和基础交互动效做成完整、稳定、可长期维护的版本。': { en: 'Refactor updates will be shared here, prioritizing home, sidebar, post layout, and interactions for long-term maintainability.', fr: 'Les progrès de refonte seront partagés ici, en priorisant l\'accueil, la barre latérale, la mise en page et les interactions.', es: 'Las actualizaciones se compartirán aquí, priorizando inicio, barra lateral, diseño de artículos e interacciones.', de: 'Refaktorierungsfortschritte werden hier geteilt, mit Fokus auf Startseite, Sidebar, Artikel-Layout und Interaktionen.' },
  '可选': { en: 'Optional', fr: 'Optionnel', es: 'Opcional', de: 'Optional' },
  '这一轮优先收口侧栏系统、目录固定、首页分页、控制台按钮和页脚头像，再继续处理页面级细节。': { en: 'This iteration closes out sidebar system, fixed TOC, homepage pagination, console buttons, and footer details.', fr: 'Cette itération finalise la barre latérale, la table des matières fixe, la pagination, les boutons de console et le pied de page.', es: 'Esta iteración completa la barra lateral, tabla de contenidos fija, paginación, botones de consola y pie de página.', de: 'Diese Iteration schließt Sidebar, fixes Inhaltsverzeichnis, Paginierung, Konsolenknöpfe und Footer ab.' },

  // Music Pocket Player
  '点击展开音乐播放器': { en: 'Click to expand music player', fr: 'Cliquer pour ouvrir le lecteur', es: 'Haga clic para expandir reproductor', de: 'Klicken, um Musikplayer zu öffnen' },
  '展开音乐点歌台': { en: 'Open music jukebox', fr: 'Ouvrir la boîte à musique', es: 'Abrir máquina de música', de: 'Musikbox öffnen' },
  '收起音乐播放器': { en: 'Collapse music player', fr: 'Réduire le lecteur de musique', es: 'Plegar reproductor de música', de: 'Musikplayer einklappen' },
  '展开随身音乐台': { en: 'Expand Music Player', fr: 'Développer le lecteur', es: 'Expandir reproductor', de: 'Musikplayer ausklappen' },
  '收起音乐面板': { en: 'Collapse Music Panel', fr: 'Réduire le lecteur', es: 'Plegar panel de música', de: 'Musikpanel einklappen' },
  '收起面板 (保持后台播放)': { en: 'Collapse Panel (Keep Playing)', fr: 'Réduire (lecture en cours)', es: 'Plegar (seguir reproduciendo)', de: 'Panel minimieren (Wiedergabe fortsetzen)' },
  '收起面板': { en: 'Collapse Panel', fr: 'Réduire le panneau', es: 'Plegar panel', de: 'Panel einklappen' },
  '按住可自由拖拽，点击展开音乐随身听': { en: 'Hold to drag, click to expand music player', fr: 'Maintenir pour glisser, cliquer pour ouvrir', es: 'Mantén para arrastrar, clic para abrir', de: 'Halten zum Ziehen, Klicken zum Öffnen' },
  '随身音乐': { en: 'Pocket Music', fr: 'Musique nomade', es: 'Música de bolsillo', de: 'Pocket-Musik' },
  '点击展开随身听 (可自由拖拽)': { en: 'Click to expand player (Draggable)', fr: 'Cliquer pour ouvrir le lecteur (déplaçable)', es: 'Clic para abrir el reproductor (arrastrable)', de: 'Klicken zum Öffnen des Players (verschiebbar)' },
  '正在播放': { en: 'Now Playing', fr: 'En cours de lecture', es: 'Reproduciendo', de: 'Aktuelle Wiedergabe' },
  '点歌台': { en: 'Jukebox', fr: 'Juke-box', es: 'Petición', de: 'Musikbox' },
  '待播': { en: 'Queue', fr: 'File d\'attente', es: 'En cola', de: 'Warteschlange' },
  '待播队列': { en: 'Queue', fr: 'File d\'attente', es: 'Cola de reproducción', de: 'Warteschlange' },
  '当前播放队列': { en: 'Current Queue', fr: 'File actuelle', es: 'Cola actual', de: 'Aktuelle Warteschlange' },
  '播放列表': { en: 'Playlist', fr: 'Liste de lecture', es: 'Lista de reproducción', de: 'Wiedergabeliste' },
  '发现': { en: 'Discover', fr: 'Découvrir', es: 'Descubrir', de: 'Entdecken' },
  '发现与搜索音乐': { en: 'Discover & Search', fr: 'Découvrir et rechercher', es: 'Descubrir y buscar', de: 'Entdecken & Suchen' },
  '歌词': { en: 'Lyrics', fr: 'Paroles', es: 'Letras', de: 'Songtexte' },
  '完整滚动歌词': { en: 'Full Scrolling Lyrics', fr: 'Paroles défilantes complètes', es: 'Letras completas', de: 'Vollständige Songtexte' },
  '滚动歌词': { en: 'Lyrics', fr: 'Paroles', es: 'Letras', de: 'Songtexte' },
  '点击展开完整滚动歌词': { en: 'Click to view full lyrics', fr: 'Cliquer pour afficher les paroles complètes', es: 'Clic para ver letras completas', de: 'Klicken für vollständige Songtexte' },
  '关闭播放器面板': { en: 'Close player panel', fr: 'Fermer le panneau du lecteur', es: 'Cerrar panel de reproducción', de: 'Player-Panel schließen' },
  '暂无正在播放的歌曲': { en: 'No track currently playing', fr: 'Aucun morceau en cours', es: 'Ninguna pista reproduciéndose', de: 'Kein Titel wird abgespielt' },
  '暂无播放曲目': { en: 'No track playing', fr: 'Aucune piste en cours', es: 'Ninguna pista en reproducción', de: 'Kein Titel wird abgespielt' },
  '静心享受纯粹旋律': { en: 'Enjoy the pure melody', fr: 'Profitez de la mélodie pure', es: 'Disfruta de la melodía pura', de: 'Genieße die reine Melodie' },
  '点击下方“随机曲库”或在点歌台点播': { en: 'Click "Random Discovery" below or request a song in Jukebox', fr: 'Cliquez sur « Découverte aléatoire » ci-dessous ou demandez une chanson', es: 'Haga clic en "Descubrimiento aleatorio" o solicite una canción', de: 'Klicke unten auf „Zufallsauswahl“ oder suche einen Titel in der Musikbox' },
  '暂无滚动歌词': { en: 'No scrolling lyrics available', fr: 'Aucune parole disponible', es: 'No hay letras disponibles', de: 'Keine scrollenden Songtexte verfügbar' },
  '暂无可用歌词': { en: 'No lyrics available', fr: 'Aucune parole disponible', es: 'No hay letras disponibles', de: 'Keine Songtexte verfügbar' },
  '正在同步歌词...': { en: 'Syncing lyrics...', fr: 'Synchronisation des paroles...', es: 'Sincronizando letras...', de: 'Songtexte werden synchronisiert...' },
  '当前曲目暂时没有可用歌词。': { en: 'No lyrics available for current track.', fr: 'Aucune parole disponible pour ce morceau.', es: 'No hay letras disponibles para esta pista.', de: 'Keine Songtexte für diesen Titel verfügbar.' },
  '上一首': { en: 'Previous Track', fr: 'Piste précédente', es: 'Pista anterior', de: 'Vorheriger Titel' },
  '下一首': { en: 'Next Track', fr: 'Piste suivante', es: 'Pista siguiente', de: 'Nächster Titel' },
  '暂停': { en: 'Pause', fr: 'Pause', es: 'Pausa', de: 'Pause' },
  '播放': { en: 'Play', fr: 'Lecture', es: 'Reproducir', de: 'Abspielen' },
  '静音': { en: 'Mute', fr: 'Muet', es: 'Silenciar', de: 'Stummschalten' },
  '取消静音': { en: 'Unmute', fr: 'Activer le son', es: 'Reactivar sonido', de: 'Ton aktivieren' },
  '恢复声音': { en: 'Unmute', fr: 'Activer le son', es: 'Reactivar sonido', de: 'Ton aktivieren' },
  '音量调节': { en: 'Volume control', fr: 'Réglage du volume', es: 'Control de volumen', de: 'Lautstärkeregelung' },
  '音量开关': { en: 'Mute / Unmute', fr: 'Activer / couper le son', es: 'Silenciar / Activar sonido', de: 'Ton an / aus' },
  '音频进度条': { en: 'Audio progress bar', fr: 'Barre de progression audio', es: 'Barra de progreso de audio', de: 'Audio-Fortschrittsbalken' },
  '播放进度': { en: 'Progress', fr: 'Progression', es: 'Progreso', de: 'Fortschritt' },
  '切换播放模式': { en: 'Toggle Play Mode', fr: 'Changer de mode', es: 'Cambiar modo', de: 'Wiedergabemodus wechseln' },
  '桌面歌词': { en: 'Desktop Lyrics', fr: 'Paroles de bureau', es: 'Letras de escritorio', de: 'Desktop-Songtexte' },
  '屏幕桌面歌词': { en: 'Desktop Floating Lyrics', fr: 'Paroles flottantes de bureau', es: 'Letras flotantes de escritorio', de: 'Desktop-Songtexte' },
  '开启屏幕桌面歌词': { en: 'Enable Desktop Lyrics', fr: 'Activer les paroles de bureau', es: 'Activar letras de escritorio', de: 'Desktop-Songtexte aktivieren' },
  '关闭屏幕桌面歌词': { en: 'Disable Desktop Lyrics', fr: 'Désactiver les paroles de bureau', es: 'Desactivar letras de escritorio', de: 'Desktop-Songtexte deaktivieren' },
  '关闭悬浮歌词': { en: 'Hide floating lyrics', fr: 'Masquer les paroles flottantes', es: 'Ocultar letras flotantes', de: 'Schwebende Songtexte ausblenden' },
  '开启悬浮歌词': { en: 'Show floating lyrics', fr: 'Afficher les paroles flottantes', es: 'Mostrar letras flotantes', de: 'Schwebende Songtexte anzeigen' },
  '睡眠定时': { en: 'Sleep Timer', fr: 'Minuteur de sommeil', es: 'Temporizador de apagado', de: 'Sleeptimer' },
  '定时休眠已关闭': { en: 'Sleep timer disabled', fr: 'Minuteur désactivé', es: 'Temporizador desactivado', de: 'Sleeptimer deaktiviert' },
  '15分钟后自动暂停': { en: 'Pause in 15 mins', fr: 'Pause dans 15 min', es: 'Pausar en 15 min', de: 'Pause in 15 Min.' },
  '30分钟后自动暂停': { en: 'Pause in 30 mins', fr: 'Pause dans 30 min', es: 'Pausar en 30 min', de: 'Pause in 30 Min.' },
  '60分钟后自动暂停': { en: 'Pause in 60 mins', fr: 'Pause dans 60 min', es: 'Pausar en 60 min', de: 'Pause in 60 Min.' },
  '当前曲目播完后暂停': { en: 'Pause after current track', fr: 'Pause après ce morceau', es: 'Pausar tras pista actual', de: 'Pause nach aktuellem Titel' },
  '播放倍速': { en: 'Playback Speed', fr: 'Vitesse de lecture', es: 'Velocidad de reproducción', de: 'Wiedergabegeschwindigkeit' },
  '倍速': { en: 'Speed', fr: 'Vitesse', es: 'Velocidad', de: 'Geschwindigkeit' },
  '收藏': { en: 'Favorite', fr: 'Favori', es: 'Favorito', de: 'Favorit' },
  '喜欢本曲': { en: 'Like Track', fr: 'Aimer le morceau', es: 'Me gusta esta pista', de: 'Titel liken' },
  '已添加到我喜欢': { en: 'Added to favorites', fr: 'Ajouté aux favoris', es: 'Añadido a favoritos', de: 'Zu Favoriten hinzugefügt' },
  '已取消收藏': { en: 'Removed from favorites', fr: 'Retiré des favoris', es: 'Eliminado de favoritos', de: 'Aus Favoriten entfernt' },
  '分享音乐': { en: 'Share Music', fr: 'Partager la musique', es: 'Compartir música', de: 'Musik teilen' },
  '已复制歌曲分享信息': { en: 'Track info copied to clipboard', fr: 'Infos du morceau copiées', es: 'Información de pista copiada', de: 'Titelinformationen kopiert' },
  '检索音乐、歌手...': { en: 'Search music, artist...', fr: 'Rechercher musique, artiste...', es: 'Buscar música, artista...', de: 'Musik, Künstler suchen...' },
  '检索': { en: 'Search', fr: 'Rechercher', es: 'Buscar', de: 'Suchen' },
  '点播歌曲、歌手或专辑...': { en: 'Search song, artist, or album...', fr: 'Rechercher titre, artiste ou album...', es: 'Buscar canción, artista o álbum...', de: 'Titel, Künstler oder Album suchen...' },
  '热门推荐：': { en: 'Trending:', fr: 'Tendances :', es: 'Tendencias:', de: 'Beliebt:' },
  '随机推荐': { en: 'Random Picks', fr: 'Recommandations aléatoires', es: 'Recomendaciones aleatorias', de: 'Zufällige Empfehlungen' },
  '随机探索': { en: 'Random Explore', fr: 'Exploration aléatoire', es: 'Exploración aleatoria', de: 'Zufallserkundung' },
  '清空': { en: 'Clear', fr: 'Effacer', es: 'Limpiar', de: 'Leeren' },
  '清空队列': { en: 'Clear Queue', fr: 'Vider la file', es: 'Vaciar cola', de: 'Warteschlange leeren' },
  '队列已清空': { en: 'Queue cleared', fr: 'File vidée', es: 'Cola vaciada', de: 'Warteschlange geleert' },
  '移出播放队列': { en: 'Remove from queue', fr: 'Retirer de la file', es: 'Eliminar de la cola', de: 'Aus Warteschlange entfernen' },
  '已从待播移除': { en: 'Removed from queue', fr: 'Retiré de la file', es: 'Eliminado de la cola', de: 'Aus Warteschlange entfernt' },
  '当前播放队列为空': { en: 'Playback queue is empty', fr: 'La file d\'attente est vide', es: 'La cola de reproducción está vacía', de: 'Wiedergabeschlange ist leer' },
  '播放队列为空，请前往发现页搜索或点击随机探索': { en: 'Queue is empty. Search tracks or explore random songs.', fr: 'File vide. Recherchez des pistes ou découvrez au hasard.', es: 'Cola vacía. Busca pistas o explora canciones al azar.', de: 'Warteschlange leer. Titel suchen oder Zufallsauswahl starten.' },
  '前往发现新歌': { en: 'Discover New Tracks', fr: 'Découvrir de nouveaux morceaux', es: 'Descubrir nuevas pistas', de: 'Neue Titel entdecken' },
  '🔍 正在检索全网高质音源...': { en: '🔍 Searching high quality audio sources...', fr: '🔍 Recherche de sources audio de haute qualité...', es: '🔍 Buscando fuentes de audio de alta calidad...', de: '🔍 Suche hochwertige Audioquellen...' },
  '立即点播': { en: 'Play now', fr: 'Écouter maintenant', es: 'Reproducir ahora', de: 'Jetzt abspielen' },
  '加入待播列表': { en: 'Add to queue', fr: 'Ajouter à la file', es: 'Añadir a la cola', de: 'Zur Warteschlange hinzufügen' },
  '加待播': { en: 'Add Queue', fr: '+ File', es: '+ Cola', de: '+ Schlange' },
  '一键导入随机推荐曲目': { en: 'Import random recommended tracks', fr: 'Importer des morceaux recommandés au hasard', es: 'Importar pistas recomendadas al azar', de: 'Zufällig empfohlene Titel importieren' },
  '列表循环': { en: 'Loop Queue', fr: 'Boucle de liste', es: 'Repetir lista', de: 'Wiedergabeliste wiederholen' },
  '单曲循环': { en: 'Loop Single', fr: 'Répéter le morceau', es: 'Repetir pista', de: 'Titel wiederholen' },
  '随机播放': { en: 'Shuffle Play', fr: 'Lecture aléatoire', es: 'Reproducción aleatoria', de: 'Zufallswiedergabe' },
  '点歌 / 随机曲库': { en: 'Jukebox / Random Library', fr: 'Juke-box / Bibliothèque aléatoire', es: 'Petición / Biblioteca aleatoria', de: 'Musikbox / Zufallsbibliothek' },
  '待播序列清单': { en: 'Playback Queue', fr: 'File d\'attente de lecture', es: 'Lista de reproducción', de: 'Wiedergabewarteschlange' },
  '当前': { en: 'Current', fr: 'Actuel', es: 'Actual', de: 'Aktuell' },
  '单曲': { en: 'Single', fr: 'Single', es: 'Sencillo', de: 'Single' },

  // Support Dashboard
  '☕ 咖啡档位随心选': { en: '☕ Flexible Coffee Tiers', fr: '☕ Paliers café flexibles', es: '☕ Niveles de café flexibles', de: '☕ Flexible Kaffeestufen' },
  '💳 国际收银台 (Apple / Google Pay)': { en: '💳 Global Checkout (Apple / Google Pay)', fr: '💳 Caisse mondiale (Apple / Google Pay)', es: '💳 Caja global (Apple / Google Pay)', de: '💳 Globale Kasse (Apple / Google Pay)' },
  '🍵 微信 & 支付宝扫码直达': { en: '🍵 WeChat & Alipay QR Fast Pay', fr: '🍵 QR WeChat & Alipay direct', es: '🍵 QR WeChat y Alipay directo', de: '🍵 Direkte WeChat & Alipay QR-Zahlung' },
  '⚡ 多币种自适应结算': { en: '⚡ Multi-Currency Adaptive Settlement', fr: '⚡ Règlement multi-devises adaptatif', es: '⚡ Liquidación multimoneda adaptativa', de: '⚡ Adaptive Multi-Währungs-Abrechnung' },
  '🛡️ Stripe 端到端金融级加密': { en: '🛡️ Stripe End-to-End Banking Encryption', fr: '🛡️ Cryptage bancaire de bout en bout Stripe', es: '🛡️ Cifrado bancario de extremo a extremo de Stripe', de: '🛡️ Stripe End-to-End Bankenverschlüsselung' },
  '📜 公开透明支援名录': { en: '📜 Transparent Public Supporter Roster', fr: '📜 Registre public et transparent des soutiens', es: '📜 Registro público y transparente de apoyo', de: '📜 Transparentes öffentliches Fördererverzeichnis' },
  '微信 / 支付宝 / PayPal / Web3': { en: 'WeChat / Alipay / PayPal / Web3', fr: 'WeChat / Alipay / PayPal / Web3', es: 'WeChat / Alipay / PayPal / Web3', de: 'WeChat / Alipay / PayPal / Web3' },
  '微信支付': { en: 'WeChat Pay', fr: 'WeChat Pay', es: 'WeChat Pay', de: 'WeChat Pay' },
  '微信扫一扫赞赏': { en: 'Scan with WeChat to support', fr: 'Scanner avec WeChat pour soutenir', es: 'Escanear con WeChat para apoyar', de: 'Mit WeChat scannen und unterstützen' },
  '微信支付赞赏码': { en: 'WeChat Pay QR Code', fr: 'Code QR WeChat Pay', es: 'Código QR de WeChat Pay', de: 'WeChat Pay QR-Code' },
  '支付宝': { en: 'Alipay', fr: 'Alipay', es: 'Alipay', de: 'Alipay' },
  '支付宝扫一扫赞赏': { en: 'Scan with Alipay to support', fr: 'Scanner avec Alipay pour soutenir', es: 'Escanear con Alipay para apoyar', de: 'Mit Alipay scannen und unterstützen' },
  '支付宝赞赏码': { en: 'Alipay QR Code', fr: 'Code QR Alipay', es: 'Código QR de Alipay', de: 'Alipay QR-Code' },
  'Alipay HK 赞赏码': { en: 'Alipay HK QR Code', fr: 'Code QR Alipay HK', es: 'Código QR Alipay HK', de: 'Alipay HK QR-Code' },
  'WeChat Pay HK 赞赏码': { en: 'WeChat Pay HK QR Code', fr: 'Code QR WeChat Pay HK', es: 'Código QR WeChat Pay HK', de: 'WeChat Pay HK QR-Code' },
  '查看大图': { en: 'View full size', fr: 'Agrandir', es: 'Ver en tamaño completo', de: 'Vollbild anzeigen' },
  '港币 HKD 扫码': { en: 'Scan for HKD', fr: 'Scanner pour HKD', es: 'Escanear para HKD', de: 'Für HKD scannen' },
  'WeChat HK 扫码': { en: 'Scan with WeChat HK', fr: 'Scanner avec WeChat HK', es: 'Escanear con WeChat HK', de: 'Mit WeChat HK scannen' },
  '推荐使用同币种 PayPal 转账赞赏以减少手续费': { en: 'Prefer same-currency PayPal transfers to minimize fees', fr: 'Privilégiez les virements PayPal dans la même devise pour limiter les frais', es: 'Prefiera transferencias de PayPal en la misma moneda para minimizar tarifas', de: 'Gleichwährungsüberweisungen per PayPal empfohlen, um Gebühren zu minimieren' },
  'PayPal HK 码': { en: 'PayPal HK QR', fr: 'QR PayPal HK', es: 'QR PayPal HK', de: 'PayPal HK QR' },
  'PayPal UK 码': { en: 'PayPal UK QR', fr: 'QR PayPal UK', es: 'QR PayPal UK', de: 'PayPal UK QR' },
  '以太坊 Layer 2 极低矿工费通道': { en: 'Ethereum Layer 2 Ultra-Low Gas Channel', fr: 'Canal Ethereum Layer 2 à très faibles frais', es: 'Canal de Ethereum Capa 2 de tarifas ultra bajas', de: 'Ethereum Layer 2 Kanal mit extrem niedrigen Gebühren' },
  '收款钱包地址 (EVM Compatible)：': { en: 'Receiving Wallet Address (EVM Compatible):', fr: 'Adresse de réception (compatible EVM) :', es: 'Dirección de billetera de recepción (compatible con EVM):', de: 'Empfangsadresse (EVM-kompatibel):' },
  '已复制到剪贴板！': { en: 'Copied to clipboard!', fr: 'Copié dans le presse-papiers !', es: '¡Copiado al portapapeles!', de: 'In die Zwischenablage kopiert!' },
  '复制 USDT Arbitrum 钱包地址': { en: 'Copy USDT Arbitrum Wallet Address', fr: 'Copier l\'adresse USDT Arbitrum', es: 'Copiar dirección de billetera USDT Arbitrum', de: 'USDT Arbitrum Wallet-Adresse kopieren' },
  '💡 转账提示：': { en: '💡 Transfer Note:', fr: '💡 Note de transfert :', es: '💡 Nota de transferencia:', de: '💡 Überweisungshinweis:' },
  '仅支持 Arbitrum One 网络的 USDT (ERC-20) 资产，链上确认极速且 Gas 极低（约 $0.01）。': { en: 'Supports only USDT (ERC-20) on Arbitrum One network. Instant confirmation and low gas (~$0.01).', fr: 'Prend en charge uniquement l\'USDT (ERC-20) sur Arbitrum One. Confirmation rapide et frais minimes (~0,01 $).', es: 'Solo admite USDT (ERC-20) en la red Arbitrum One. Confirmación rápida y gas bajo (~$0.01).', de: 'Unterstützt nur USDT (ERC-20) im Arbitrum One Netzwerk. Schnelle Bestätigung und minimale Gebühren (~0,01 $).' },
  '扫码赞赏可在转账附言中备注称呼与寄语，博主核对账单后将手动录入名册；误操作支持原路退款，资金去向与变动均如实公示。': { en: 'You can include your name and message in the transfer memo. Accidental payments can be refunded upon request. All fund allocations are transparently updated.', fr: 'Vous pouvez inclure votre nom et un message dans le libellé. Les paiements accidentels peuvent être remboursés sur demande. Toutes les affectations sont publiées en toute transparence.', es: 'Puede incluir su nombre y mensaje en la nota de transferencia. Los pagos accidentales se pueden reembolsar a pedido. Todas las asignaciones se publican de forma transparente.', de: 'Sie können Ihren Namen und eine Nachricht in den Überweisungszweck eintragen. Versehentliche Zahlungen können auf Anfrage erstattet werden. Alle Mittelverwendungen werden transparent offengelegt.' },
  '累计支持人次': { en: 'Total Supporters', fr: 'Soutiens cumulés', es: 'Apoyos acumulados', de: 'Unterstützer insgesamt' },
  '位': { en: '', fr: '', es: '', de: '' },
  '期待第一位支持者 ✨': { en: 'Awaiting the first supporter ✨', fr: 'En attente du premier soutien ✨', es: 'Esperando al primer colaborador ✨', de: 'Warten auf den ersten Unterstützer ✨' },
  '咖啡档位支持': { en: 'Coffee Tiers Backed', fr: 'Cafés offerts', es: 'Cafés patrocinados', de: 'Gespendete Kaffees' },
  '杯 ☕': { en: 'cups ☕', fr: 'tasses ☕', es: 'tazas ☕', de: 'Tassen ☕' },
  '暂无咖啡记录': { en: 'No coffee records yet', fr: 'Aucun enregistrement de café', es: 'Sin registros de café todavía', de: 'Noch keine Kaffeeeinträge' },
  '等值咖啡换算累计': { en: 'Equivalent coffee tally', fr: 'Équivalent café cumulé', es: 'Equivalente en café acumulado', de: 'Kaffeeäquivalent insgesamt' },
  '汇聚币种': { en: 'Currencies Received', fr: 'Devises reçues', es: 'Monedas recibidas', de: 'Erhaltene Währungen' },
  '种': { en: 'types', fr: 'types', es: 'tipos', de: 'Arten' },
  '支持 14 款法币': { en: '14 fiat currencies supported', fr: '14 devises fiduciaires supportées', es: '14 monedas fiduciarias admitidas', de: '14 Fiat-Währungen unterstützt' },
  '真实跨币种结算': { en: 'Multi-currency settlement', fr: 'Règlement multi-devises réel', es: 'Liquidación multimoneda real', de: 'Echte Multiwährungsabrechnung' },
  '最新支持': { en: 'Latest Supporter', fr: 'Dernier soutien', es: 'Último apoyo', de: 'Neuester Unterstützer' },
  '虚位以待': { en: 'Open Spot', fr: 'Place libre', es: 'Plaza libre', de: 'Freier Platz' },
  '暂无公开致谢记录': { en: 'No public records yet', fr: 'Aucun enregistrement public pour l\'instant', es: 'Aún no hay registros públicos', de: 'Noch keine öffentlichen Einträge' },
  '所有通过 Stripe 国际收银台、微信、支付宝等完成的赞赏均在此实时公开展示。欢迎通过上方收银台成为第一位支持者 ✨': { en: 'All contributions via Stripe, WeChat, Alipay, etc. are shown here in real-time. Feel free to use the checkout above to become the first supporter ✨', fr: 'Tous les dons via Stripe, WeChat, Alipay, etc. sont affichés ici en temps réel. Devenez le premier soutien grâce à la caisse ci-dessus ✨', es: 'Todas las contribuciones a través de Stripe, WeChat, Alipay, etc. se muestran aquí en tiempo real. Le invitamos a convertirse en el primer colaborador ✨', de: 'Alle Beiträge über Stripe, WeChat, Alipay usw. werden hier in Echtzeit angezeigt. Werden Sie über die obige Kasse der erste Unterstützer ✨' },
  '关于资金流向、多币种换算、退款机制与隐私安全的坦诚说明': { en: 'Honest explanations on fund allocation, multi-currency conversion, refunds, and privacy', fr: 'Explications transparentes sur l\'utilisation des fonds, la conversion multi-devises, les remboursements et la confidentialité', es: 'Explicaciones sinceras sobre el flujo de fondos, conversión multimoneda, reembolsos y privacidad', de: 'Ehrliche Erläuterungen zu Mittelverwendung, Währungsumrechnung, Erstattungen und Datenschutz' },
  '赞赏支持者': { en: 'Supporter', fr: 'Soutien', es: 'Colaborador', de: 'Unterstützer' },
  '支持金额': { en: 'Amount', fr: 'Montant', es: 'Monto', de: 'Betrag' },
  '祝福与寄语': { en: 'Wishes & Message', fr: 'Vœux & Message', es: 'Deseos y mensaje', de: 'Wünsche & Nachricht' },
  '支付渠道': { en: 'Payment Channel', fr: 'Canal de paiement', es: 'Canal de pago', de: 'Zahlungskanal' },
  '资金去向 / 消费公示': { en: 'Fund Allocation / Transparency', fr: 'Affectation des fonds / Transparence', es: 'Destino de los fondos / Transparencia', de: 'Mittelverwendung / Transparenz' },
  '默默送上心意 ❤️': { en: 'Warm support sent silently ❤️', fr: 'Soutien envoyé en toute discrétion ❤️', es: 'Apoyo enviado en silencio ❤️', de: 'Stille Unterstützung gesendet ❤️' },
  '未搜索到相关支持者记录': { en: 'No matching supporter records found', fr: 'Aucun enregistrement trouvé', es: 'No se encontraron registros de colaboradores', de: 'Keine passenden Förderer-Einträge gefunden' },
  '请尝试更换关键词搜索': { en: 'Please try searching with different keywords', fr: 'Veuillez essayer d\'autres mots-clés', es: 'Intente buscar con otras palabras clave', de: 'Bitte versuchen Sie es mit anderen Suchbegriffen' },
  '快速跳转至页码': { en: 'Jump to page', fr: 'Aller à la page', es: 'Ir a la página', de: 'Zur Seite springen' },
  '跳转': { en: 'Go', fr: 'Aller', es: 'Ir', de: 'Los' },
  '请使用相应 App 扫描上方二维码完成赞赏': { en: 'Please use the corresponding app to scan the QR code', fr: 'Veuillez utiliser l\'application correspondante pour scanner le code QR', es: 'Utilice la aplicación correspondiente para escanear el código QR', de: 'Bitte scannen Sie den QR-Code mit der entsprechenden App' },

  // Placeholder Pages
  '运行 / 状态': { en: 'Runtime / Status', fr: 'Système / Statut', es: 'Sistema / Estado', de: 'System / Status' },
  '这个页面预留给运行状态、重构里程碑、页面完成度和后续路线图，让读者能直接看到当前站点还在做什么。': { en: 'This page is reserved for runtime metrics, milestones, completeness, and roadmaps to show ongoing work.', fr: 'Cette page est réservée aux métriques d\'exécution, jalons, avancement et feuille de route.', es: 'Esta página está reservada para métricas de ejecución, hitos, progreso y hoja de ruta.', de: 'Diese Seite ist für Laufzeitmetriken, Meilensteine, Fertigstellungsgrad und Roadmap reserviert.' },
  '状态面板待接入': { en: 'Status panel pending integration', fr: 'Panneau de statut en attente', es: 'Panel de estado pendiente de integración', de: 'Status-Panel noch nicht angebunden' },
  '之后可以直接接入运行时间、构建状态、评论数据库与访问统计。': { en: 'Uptime, build status, comment database, and visitor stats will be directly connected here.', fr: 'La disponibilité, l\'état des builds, la base de commentaires et les statistiques seront connectés ici.', es: 'El tiempo de actividad, estado de compilación, base de comentarios y estadísticas se conectarán aquí.', de: 'Betriebszeit, Build-Status, Kommentardatenbank und Besucherstatistiken werden hier angebunden.' },
  '现在先把路径、布局和导航层级固定下来，避免以后再拆菜单。': { en: 'Paths, layout, and nav hierarchy are locked in advance to avoid refactoring menus later.', fr: 'Les chemins, la mise en page et la hiérarchie sont fixés à l\'avance pour préserver la structure des menus.', es: 'Las rutas, diseño y jerarquía de navegación quedan fijados con anticipación para evitar refactorizaciones.', de: 'Pfade, Layout und Navigationshierarchie werden vorab fixiert, um spätere Menüänderungen zu vermeiden.' },
  '占位页借用 404 的建设中语义，但本身已经是正式可访问页面。': { en: 'The placeholder borrows "under construction" aesthetics while being a formal accessible route.', fr: 'La page d\'attente emprunte l\'esthétique « en construction » tout en étant une route officielle.', es: 'La página de marcador adopta la estética de «en construcción» siendo ya una ruta oficial.', de: 'Die Platzhalterseite nutzt das „Im Bau“-Thema, ist aber bereits eine offizielle Route.' },

  // Encrypted Modal
  '验证安全访问凭证': { en: 'Verify Security Credentials', fr: 'Vérifier les informations de sécurité', es: 'Verificar credenciales de seguridad', de: 'Sicherheitsnachweis überprüfen' },
  '该部分为受保护加密内容，请输入密码进行校验。': { en: 'This section is protected and encrypted. Please enter your passcode to verify.', fr: 'Cette section est protégée et chiffrée. Veuillez saisir votre mot de passe.', es: 'Esta sección está protegida y cifrada. Ingrese su contraseña para verificar.', de: 'Dieser Bereich ist geschützt und verschlüsselt. Bitte Passwort zur Überprüfung eingeben.' },
  '验证并解密': { en: 'Verify & Decrypt', fr: 'Vérifier et déchiffrer', es: 'Verificar y descifrar', de: 'Überprüfen und entschlüsseln' },

  // Author Bio
  '00后在读大学生 · Web 全栈初探者 · 数字花园建造者': { en: 'Gen-Z Undergrad · Web Full-Stack Explorer · Digital Garden Builder', fr: 'Étudiant Gen-Z · Explorateur Web Full-Stack · Bâtisseur de jardin numérique', es: 'Estudiante universitario Gen-Z · Explorador Web Full-Stack · Constructor de jardín digital', de: 'Gen-Z Student · Web-Full-Stack-Entdecker · Erbauer digitaler Gärten' },
  '主题重构启动记录': { en: 'Theme Refactoring Genesis', fr: 'Genèse de la refonte du thème', es: 'Génesis de la refactorización del tema', de: 'Start der Theme-Neugestaltung' },
};

export interface PatternRule {
  pattern: RegExp;
  replace: Record<SupportedLocale, (match: RegExpMatchArray) => string>;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_ES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];
const MONTHS_DE = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];

export const DYNAMIC_PATTERNS: PatternRule[] = [
  {
    pattern: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
    replace: {
      'zh-CN': (m) => `${m[1]}年${m[2]}月${m[3]}日`,
      'zh-Hant': (m) => `${m[1]}年${m[2]}月${m[3]}日`,
      en: (m) => `${MONTHS_EN[parseInt(m[2], 10) - 1] || m[2]} ${m[3]}, ${m[1]}`,
      fr: (m) => `${m[3]} ${MONTHS_FR[parseInt(m[2], 10) - 1] || m[2]} ${m[1]}`,
      es: (m) => `${m[3]} de ${MONTHS_ES[parseInt(m[2], 10) - 1] || m[2]} de ${m[1]}`,
      de: (m) => `${m[3]}. ${MONTHS_DE[parseInt(m[2], 10) - 1] || m[2]} ${m[1]}`,
    },
  },
  {
    pattern: /^(\d{4})年(\d{1,2})月$/,
    replace: {
      'zh-CN': (m) => `${m[1]}年${m[2]}月`,
      'zh-Hant': (m) => `${m[1]}年${m[2]}月`,
      en: (m) => `${MONTHS_EN[parseInt(m[2], 10) - 1] || m[2]} ${m[1]}`,
      fr: (m) => `${MONTHS_FR[parseInt(m[2], 10) - 1] || m[2]} ${m[1]}`,
      es: (m) => `${MONTHS_ES[parseInt(m[2], 10) - 1] || m[2]} de ${m[1]}`,
      de: (m) => `${MONTHS_DE[parseInt(m[2], 10) - 1] || m[2]} ${m[1]}`,
    },
  },
  {
    pattern: /^(\d+)\s*天$/,
    replace: {
      'zh-CN': (m) => `${m[1]} 天`,
      'zh-Hant': (m) => `${m[1]} 天`,
      en: (m) => `${m[1]} days`,
      fr: (m) => `${m[1]} jours`,
      es: (m) => `${m[1]} días`,
      de: (m) => `${m[1]} Tage`,
    },
  },
  {
    pattern: /^\/\s*(\d+)\s*页$/,
    replace: {
      'zh-CN': (m) => `/ ${m[1]} 页`,
      'zh-Hant': (m) => `/ ${m[1]} 頁`,
      en: (m) => `/ ${m[1]} pages`,
      fr: (m) => `/ ${m[1]} pages`,
      es: (m) => `/ ${m[1]} páginas`,
      de: (m) => `/ ${m[1]} Seiten`,
    },
  },
  {
    pattern: /^共\s*(\d+)\s*篇$/,
    replace: {
      'zh-CN': (m) => `共 ${m[1]} 篇`,
      'zh-Hant': (m) => `共 ${m[1]} 篇`,
      en: (m) => `${m[1]} posts total`,
      fr: (m) => `${m[1]} articles au total`,
      es: (m) => `${m[1]} publicaciones en total`,
      de: (m) => `${m[1]} Beiträge insgesamt`,
    },
  },
  {
    pattern: /^已切换背景：(.*)$/i,
    replace: {
      'zh-CN': (m) => `已切换背景：${m[1]}`,
      'zh-Hant': (m) => `已切換背景：${m[1]}`,
      en: (m) => `Background: ${m[1]}`,
      fr: (m) => `Arrière-plan : ${m[1]}`,
      es: (m) => `Fondo: ${m[1]}`,
      de: (m) => `Hintergrund: ${m[1]}`,
    },
  },
  {
    pattern: /^已切换语言：(.*)$/i,
    replace: {
      'zh-CN': (m) => `已切换语言：${m[1]}`,
      'zh-Hant': (m) => `已切換語言：${m[1]}`,
      en: (m) => `Language: ${m[1]}`,
      fr: (m) => `Langue : ${m[1]}`,
      es: (m) => `Idioma: ${m[1]}`,
      de: (m) => `Sprache: ${m[1]}`,
    },
  },
  {
    pattern: /^已切换目录深度：(.*)$/i,
    replace: {
      'zh-CN': (m) => `已切换目录深度：${m[1]}`,
      'zh-Hant': (m) => `已切換目錄深度：${m[1]}`,
      en: (m) => `TOC depth: ${m[1]}`,
      fr: (m) => `Profondeur TdM : ${m[1]}`,
      es: (m) => `Nivel del índice: ${m[1]}`,
      de: (m) => `Gliederungsebene: ${m[1]}`,
    },
  },
  {
    pattern: /^已切换为(.*)界面$/i,
    replace: {
      'zh-CN': (m) => `已切换为${m[1]}界面`,
      'zh-Hant': (m) => `已切換為${m[1]}介面`,
      en: (m) => `Switched to ${m[1]}`,
      fr: (m) => `Interface en ${m[1]}`,
      es: (m) => `Interfaz en ${m[1]}`,
      de: (m) => `Zu ${m[1]} gewechselt`,
    },
  },
  {
    pattern: /^已切换至\s*(.*)$/i,
    replace: {
      'zh-CN': (m) => `已切换至 ${m[1]}`,
      'zh-Hant': (m) => `已切換至 ${m[1]}`,
      en: (m) => `Switched to ${m[1]}`,
      fr: (m) => `Passé à ${m[1]}`,
      es: (m) => `Cambiado a ${m[1]}`,
      de: (m) => `Gewechselt zu ${m[1]}`,
    },
  },
  {
    pattern: /^正在打开\s*(.*)$/i,
    replace: {
      'zh-CN': (m) => `正在打开 ${m[1]}`,
      'zh-Hant': (m) => `正在開啟 ${m[1]}`,
      en: (m) => `Opening ${m[1]}`,
      fr: (m) => `Ouverture de ${m[1]}`,
      es: (m) => `Abriendo ${m[1]}`,
      de: (m) => `Öffne ${m[1]}`,
    },
  },
  {
    pattern: /^Epomail 授权登录:\s*(.*)$/i,
    replace: {
      'zh-CN': (m) => `Epomail 授权登录: ${m[1]}`,
      'zh-Hant': (m) => `Epomail 授權登入: ${m[1]}`,
      en: (m) => `Epomail login: ${m[1]}`,
      fr: (m) => `Connexion Epomail : ${m[1]}`,
      es: (m) => `Inicio Epomail: ${m[1]}`,
      de: (m) => `Epomail-Anmeldung: ${m[1]}`,
    },
  },
  {
    pattern: /^Epomail 登录:\s*(.*)$/i,
    replace: {
      'zh-CN': (m) => `Epomail 登录: ${m[1]}`,
      'zh-Hant': (m) => `Epomail 登入: ${m[1]}`,
      en: (m) => `Epomail login: ${m[1]}`,
      fr: (m) => `Connexion Epomail : ${m[1]}`,
      es: (m) => `Inicio Epomail: ${m[1]}`,
      de: (m) => `Epomail-Anmeldung: ${m[1]}`,
    },
  },
  {
    pattern: /^Epomail 授权登录成功！欢迎，(.*)$/i,
    replace: {
      'zh-CN': (m) => `Epomail 授权登录成功！欢迎，${m[1]}`,
      'zh-Hant': (m) => `Epomail 授權登入成功！歡迎，${m[1]}`,
      en: (m) => `Epomail authorized! Welcome, ${m[1]}`,
      fr: (m) => `Epomail autorisé ! Bienvenue, ${m[1]}`,
      es: (m) => `¡Epomail autorizado! Bienvenido, ${m[1]}`,
      de: (m) => `Epomail autorisiert! Willkommen, ${m[1]}`,
    },
  },
  {
    pattern: /^Epomail 授权成功 \(APP 外接方案\)！欢迎，(.*)$/i,
    replace: {
      'zh-CN': (m) => `Epomail 授权成功 (APP 外接方案)！欢迎，${m[1]}`,
      'zh-Hant': (m) => `Epomail 授權成功 (APP 外接方案)！歡迎，${m[1]}`,
      en: (m) => `Epomail authorized (External APP)! Welcome, ${m[1]}`,
      fr: (m) => `Epomail autorisé (Solution APP externe) ! Bienvenue, ${m[1]}`,
      es: (m) => `¡Epomail autorizado (APP externa)! Bienvenido, ${m[1]}`,
      de: (m) => `Epomail autorisiert (Externe APP)! Willkommen, ${m[1]}`,
    },
  },
  {
    pattern: /^(.*)已复制到剪贴板！$/i,
    replace: {
      'zh-CN': (m) => `${m[1]}已复制到剪贴板！`,
      'zh-Hant': (m) => `${m[1]}已複製到剪貼簿！`,
      en: (m) => `${m[1]} copied to clipboard!`,
      fr: (m) => `${m[1]} copié dans le presse-papiers !`,
      es: (m) => `¡${m[1]} copiado al portapapeles!`,
      de: (m) => `${m[1]} in die Zwischenablage kopiert!`,
    },
  },
  {
    pattern: /^(.*)对应链接已复制！$/i,
    replace: {
      'zh-CN': (m) => `${m[1]}对应链接已复制！`,
      'zh-Hant': (m) => `${m[1]}對應連結已複製！`,
      en: (m) => `Link for ${m[1]} copied!`,
      fr: (m) => `Lien pour ${m[1]} copié !`,
      es: (m) => `¡Enlace de ${m[1]} copiado!`,
      de: (m) => `Link für ${m[1]} kopiert!`,
    },
  },
  {
    pattern: /^(\d+(?:\.\d+)?k?)\s*(?:节|sessions?|sections?)$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 节`,
      'zh-Hant': (m) => `${m[1]} 節`,
      en: (m) => `${m[1]} sections`,
      fr: (m) => `${m[1]} sections`,
      es: (m) => `${m[1]} secciones`,
      de: (m) => `${m[1]} Abschnitte`,
    },
  },
  {
    pattern: /^(\d+)\s*篇$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 篇`,
      'zh-Hant': (m) => `${m[1]} 篇`,
      en: (m) => `${m[1]} posts`,
      fr: (m) => `${m[1]} articles`,
      es: (m) => `${m[1]} publicaciones`,
      de: (m) => `${m[1]} Beiträge`,
    },
  },
  {
    pattern: /^([\d,]+(?:\.\d+)?k?)\s*字$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 字`,
      'zh-Hant': (m) => `${m[1]} 字`,
      en: (m) => `${m[1]} words`,
      fr: (m) => `${m[1]} mots`,
      es: (m) => `${m[1]} palabras`,
      de: (m) => `${m[1]} Wörter`,
    },
  },
  {
    pattern: /^(\d+)\s*分钟$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 分钟`,
      'zh-Hant': (m) => `${m[1]} 分鐘`,
      en: (m) => `${m[1]} min`,
      fr: (m) => `${m[1]} min`,
      es: (m) => `${m[1]} min`,
      de: (m) => `${m[1]} Min.`,
    },
  },
  {
    pattern: /^(\d+)\s*次$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 次`,
      'zh-Hant': (m) => `${m[1]} 次`,
      en: (m) => `${m[1]} views`,
      fr: (m) => `${m[1]} vues`,
      es: (m) => `${m[1]} vistas`,
      de: (m) => `${m[1]} Aufrufe`,
    },
  },
  {
    pattern: /^(\d+)\s*篇延伸阅读$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 篇延伸阅读`,
      'zh-Hant': (m) => `${m[1]} 篇延伸閱讀`,
      en: (m) => `${m[1]} related posts`,
      fr: (m) => `${m[1]} lectures recommandées`,
      es: (m) => `${m[1]} lecturas recomendadas`,
      de: (m) => `${m[1]} empfohlene Beiträge`,
    },
  },
  {
    pattern: /^查看\s*(\d+)\s*条回复$/i,
    replace: {
      'zh-CN': (m) => `查看 ${m[1]} 条回复`,
      'zh-Hant': (m) => `查看 ${m[1]} 條回覆`,
      en: (m) => `View ${m[1]} replies`,
      fr: (m) => `Voir ${m[1]} réponses`,
      es: (m) => `Ver ${m[1]} respuestas`,
      de: (m) => `${m[1]} Antworten anzeigen`,
    },
  },
  {
    pattern: /^收起\s*(\d+)\s*条回复$/i,
    replace: {
      'zh-CN': (m) => `收起 ${m[1]} 条回复`,
      'zh-Hant': (m) => `收起 ${m[1]} 條回覆`,
      en: (m) => `Collapse ${m[1]} replies`,
      fr: (m) => `Masquer ${m[1]} réponses`,
      es: (m) => `Ocultar ${m[1]} respuestas`,
      de: (m) => `${m[1]} Antworten einklappen`,
    },
  },
  {
    pattern: /^([\d,]+)\s*天$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 天`,
      'zh-Hant': (m) => `${m[1]} 天`,
      en: (m) => `${m[1]} days`,
      fr: (m) => `${m[1]} jours`,
      es: (m) => `${m[1]} días`,
      de: (m) => `${m[1]} Tage`,
    },
  },
  {
    pattern: /^博客已萌萌哒运行了\s*(\d+)\s*天\s*(\d+)\s*小时\s*(\d+)\s*分\s*(\d+)\s*秒$/i,
    replace: {
      'zh-CN': (m) => `博客已萌萌哒运行了 ${m[1]} 天 ${m[2]} 小时 ${m[3]} 分 ${m[4]} 秒`,
      'zh-Hant': (m) => `部落格已萌萌噠運行了 ${m[1]} 天 ${m[2]} 小時 ${m[3]} 分 ${m[4]} 秒`,
      en: (m) => `Blog running for ${m[1]}d ${m[2]}h ${m[3]}m ${m[4]}s`,
      fr: (m) => `Blog actif depuis ${m[1]}j ${m[2]}h ${m[3]}m ${m[4]}s`,
      es: (m) => `Blog activo durante ${m[1]}d ${m[2]}h ${m[3]}m ${m[4]}s`,
      de: (m) => `Blog aktiv seit ${m[1]}T ${m[2]}Std ${m[3]}Min ${m[4]}Sek`,
    },
  },
  {
    pattern: /^(\d+)\s*个跳转入口$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 个跳转入口`,
      'zh-Hant': (m) => `${m[1]} 個跳轉入口`,
      en: (m) => `${m[1]} navigation links`,
      fr: (m) => `${m[1]} liens de navigation`,
      es: (m) => `${m[1]} enlaces de navegación`,
      de: (m) => `${m[1]} Navigationslinks`,
    },
  },
  {
    pattern: /^(\d+)\s*分钟前$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 分钟前`,
      'zh-Hant': (m) => `${m[1]} 分鐘前`,
      en: (m) => `${m[1]}m ago`,
      fr: (m) => `il y a ${m[1]} min`,
      es: (m) => `hace ${m[1]} min`,
      de: (m) => `vor ${m[1]} Min.`,
    },
  },
  {
    pattern: /^(\d+)\s*小时前$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 小时前`,
      'zh-Hant': (m) => `${m[1]} 小時前`,
      en: (m) => `${m[1]}h ago`,
      fr: (m) => `il y a ${m[1]} h`,
      es: (m) => `hace ${m[1]} h`,
      de: (m) => `vor ${m[1]} Std.`,
    },
  },
  {
    pattern: /^(\d+)\s*天前$/i,
    replace: {
      'zh-CN': (m) => `${m[1]} 天前`,
      'zh-Hant': (m) => `${m[1]} 天前`,
      en: (m) => `${m[1]}d ago`,
      fr: (m) => `il y a ${m[1]} j`,
      es: (m) => `hace ${m[1]} d`,
      de: (m) => `vor ${m[1]} T.`,
    },
  },
  {
    pattern: /^始于\s*(.+)$/i,
    replace: {
      'zh-CN': (m) => `始于 ${m[1]}`,
      'zh-Hant': (m) => `始於 ${m[1]}`,
      en: (m) => `Since ${m[1]}`,
      fr: (m) => `Depuis ${m[1]}`,
      es: (m) => `Desde ${m[1]}`,
      de: (m) => `Seit ${m[1]}`,
    },
  },
  {
    pattern: /^起始于\s*(.+)$/i,
    replace: {
      'zh-CN': (m) => `起始于 ${m[1]}`,
      'zh-Hant': (m) => `起始於 ${m[1]}`,
      en: (m) => `Started ${m[1]}`,
      fr: (m) => `Débuté le ${m[1]}`,
      es: (m) => `Iniciado el ${m[1]}`,
      de: (m) => `Gegründet am ${m[1]}`,
    },
  },
  {
    // Matches " 最近更新于 2024/12/20。" (categories page last-updated phrase)
    pattern: /^\s*最近更新于\s+(.+?)。?\s*$/i,
    replace: {
      'zh-CN': (m) => ` 最近更新于 ${m[1]}。`,
      'zh-Hant': (m) => ` 最近更新於 ${m[1]}。`,
      en: (m) => ` Last updated ${m[1]}.`,
      fr: (m) => ` Dernière mise à jour ${m[1]}.`,
      es: (m) => ` Última actualización ${m[1]}.`,
      de: (m) => ` Zuletzt aktualisiert ${m[1]}.`,
    },
  },
];

// Pre-indexed fast maps for O(1) instantaneous lookups
const zhToEnMap = new Map<string, string>();
const zhToFrMap = new Map<string, string>();
const zhToEsMap = new Map<string, string>();
const zhToDeMap = new Map<string, string>();

const allForeignToZhMap = new Map<string, string>();

for (const [zh, trans] of Object.entries(MULTILINGUAL_DICTIONARY)) {
  zhToEnMap.set(zh, trans.en);
  zhToFrMap.set(zh, trans.fr);
  zhToEsMap.set(zh, trans.es);
  zhToDeMap.set(zh, trans.de);

  if (trans.en) allForeignToZhMap.set(trans.en, zh);
  if (trans.fr) allForeignToZhMap.set(trans.fr, zh);
  if (trans.es) allForeignToZhMap.set(trans.es, zh);
  if (trans.de) allForeignToZhMap.set(trans.de, zh);
}

// Legacy synonyms for reverse lookup
const LEGACY_SYNONYMS: Record<string, string> = {
  'Frontend Engineering': '前端工程',
  'Ingénierie Frontend': '前端工程',
  'Ingeniería Frontend': '前端工程',
  'Frontend-Engineering': '前端工程',
  'System Design': '系统设计',
  'Architecture système': '系统设计',
  'Diseño de sistemas': '系统设计',
  'Systemdesign': '系统设计',
  'Study Notes': '学习笔记',
  'Notes d étude': '学习笔记',
  'Notas de estudio': '学习笔记',
  'Lernnotizen': '学习笔记',
  'Product Insights': '产品观察',
  'Regard produit': '产品观察',
  'Análisis de producto': '产品观察',
  'Produktbeobachtungen': '产品观察',
  'Table of contents': '文章目录',
  'CONTENTS': '文章目录',
  'SOMMAIRE': '文章目录',
  'ÍNDICE': '文章目录',
  'INHALT': '文章目录',
  'Sommaire': '文章目录',
  'Inhaltsverzeichnis': '文章目录',
  'Examples': '示例',
  'Exemples': '示例',
  'Ejemplos': '示例',
  'Beispiele': '示例',
  'Example': '示例',
  'Exemple': '示例',
  'Ejemplo': '示例',
  'Beispiel': '示例',
};
for (const [foreign, zh] of Object.entries(LEGACY_SYNONYMS)) {
  allForeignToZhMap.set(foreign, zh);
}

const translatableAttributes = ['title', 'placeholder', 'aria-label', 'aria-description', 'alt', 'data-tooltip', 'data-shijianus-tooltip'] as const;
const skipTags = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'KBD', 'SAMP', 'SVG', 'PATH']);
const skipSelector = '.ignore-opencc,[data-no-translate="true"],.theme-account-overlay,.theme-account-drawer,#theme-overlays,#local-search,#console,#article-container,.article-body,.post-content';

type TranslateMutationOptions = {
  refreshBase?: boolean;
  attributes?: readonly string[];
};

declare global {
  interface Window {
    __SHIJIANUS_LOCALE_RUNTIME__?: {
      initialized: boolean;
      translating: boolean;
      observer: MutationObserver | null;
      currentVariant: LocaleVariant;
      scheduled: number | null;
      preparing: boolean;
      applyLocaleVariant?: (
        variant: LocaleVariant,
        options?: { persist?: boolean; translate?: boolean; manual?: boolean },
      ) => LocaleVariant;
    };
  }
}

function getRuntimeState() {
  if (typeof window === 'undefined') {
    return {
      initialized: false,
      translating: false,
      observer: null,
      currentVariant: 'zh-CN' as LocaleVariant,
      scheduled: null as number | null,
      preparing: false,
      applyLocaleVariant: undefined,
    };
  }

  window.__SHIJIANUS_LOCALE_RUNTIME__ ??= {
    initialized: false,
    translating: false,
    observer: null,
    currentVariant: 'zh-CN',
    scheduled: null,
    preparing: false,
    applyLocaleVariant,
  };

  window.__SHIJIANUS_LOCALE_RUNTIME__.applyLocaleVariant ??= applyLocaleVariant;

  return window.__SHIJIANUS_LOCALE_RUNTIME__;
}

export function normaliseLocaleVariant(value: string | null | undefined): LocaleVariant {
  return normaliseLocale(value);
}
export const normalizeLocaleVariant = normaliseLocaleVariant;

export function readStoredLocaleVariant(): LocaleVariant {
  if (typeof window === 'undefined') return 'zh-CN';

  try {
    const docVariant = typeof document !== 'undefined' ? document.documentElement.dataset.localeVariant : null;
    if (docVariant) {
      return normaliseLocaleVariant(docVariant);
    }

    const storedVariant = window.localStorage.getItem(LOCALE_VARIANT_KEY);
    if (storedVariant) {
      return normaliseLocaleVariant(storedVariant);
    }

    const persona = ensureUserPersona();
    return persona.primaryLocale;
  } catch {
    return 'zh-CN';
  }
}

function shouldObserveLocaleMutations(variant: LocaleVariant) {
  return variant !== 'zh-CN';
}

async function ensureChineseConverters() {
  if (zhToTraditional && zhToSimplified) return;
  if (!chineseConverterPromise) {
    chineseConverterPromise = import('opencc-js').then(({ Converter }) => {
      zhToTraditional = Converter({ from: 'cn', to: 'tw' });
      zhToSimplified = Converter({ from: 'tw', to: 'cn' });
    });
  }
  await chineseConverterPromise;
}

export function isIgnoredSubtree(el: Element): boolean {
  if (skipTags.has(el.tagName)) return true;
  if (el.tagName.toLowerCase() === 'astro-island') return true;
  if (typeof el.closest === 'function') {
    if (
      el.closest(
        'astro-island, #article-container, #theme-overlays, #keyboard-tips, #local-search, #console, #rightside, #post-comment, #nav-right, .support-dashboard, .theme-account-overlay, .theme-account-drawer, .ignore-opencc, .article-body, .post-content, [data-no-translate]'
      )
    ) {
      return true;
    }
  } else {
    if (
      el.id === 'article-container' ||
      el.id === 'theme-overlays' ||
      el.id === 'keyboard-tips' ||
      el.id === 'local-search' ||
      el.id === 'console' ||
      el.id === 'rightside' ||
      el.id === 'post-comment' ||
      el.id === 'nav-right'
    ) return true;
    if (el.classList) {
      if (
        el.classList.contains('article-body') ||
        el.classList.contains('post-content') ||
        el.classList.contains('support-dashboard') ||
        el.classList.contains('theme-account-overlay') ||
        el.classList.contains('theme-account-drawer') ||
        el.classList.contains('ignore-opencc')
      ) {
        return true;
      }
    }
    if (el.hasAttribute('data-no-translate')) return true;
  }
  return false;
}

const DYNAMIC_PATTERN_QUICK_TEST = /\d|查看|收起|始于|起始于|博客|节|篇|字|分钟|次|天|切换|正在|欢迎|复制|Epomail|年|月|日|页/;

/**
 * Text translation router based on variant (O(1) exact mapping + dynamic pattern rules)
 */
export function convertText(value: string, variant: LocaleVariant): string {
  if (!value) return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  // 1. Resolve canonical source Chinese key (handles foreign-to-foreign transitions seamlessly)
  const normalized = trimmed.replace(/\s+/g, ' ');
  const sourceZh = allForeignToZhMap.get(trimmed) || allForeignToZhMap.get(normalized) || trimmed;
  const lookupKey = (zhToEnMap.has(sourceZh) || allForeignToZhMap.has(sourceZh)) ? sourceZh : (zhToEnMap.has(normalized) ? normalized : sourceZh);

  // 2. Target is Simplified Chinese (pure restoration to Chinese)
  if (variant === 'zh-CN') {
    if (sourceZh !== trimmed) {
      return value.replace(trimmed, sourceZh);
    }
    if (DYNAMIC_PATTERN_QUICK_TEST.test(trimmed)) {
      for (const rule of DYNAMIC_PATTERNS) {
        const match = trimmed.match(rule.pattern);
        if (match) {
          return value.replace(trimmed, rule.replace['zh-CN'](match));
        }
      }
    }
    return value;
  }

  // 3. Fast exact dictionary translation for foreign targets (en, fr, es, de)
  if (variant === 'en') {
    const trans = zhToEnMap.get(lookupKey);
    if (trans !== undefined) return value.replace(trimmed, trans);
  } else if (variant === 'fr') {
    const trans = zhToFrMap.get(lookupKey) ?? zhToEnMap.get(lookupKey);
    if (trans !== undefined) return value.replace(trimmed, trans);
  } else if (variant === 'es') {
    const trans = zhToEsMap.get(lookupKey) ?? zhToEnMap.get(lookupKey);
    if (trans !== undefined) return value.replace(trimmed, trans);
  } else if (variant === 'de') {
    const trans = zhToDeMap.get(lookupKey) ?? zhToEnMap.get(lookupKey);
    if (trans !== undefined) return value.replace(trimmed, trans);
  }

  // 4. Target is Traditional Chinese
  if (variant === 'zh-Hant') {
    if (zhPattern.test(sourceZh)) {
      const converted = zhToTraditional ? zhToTraditional(sourceZh) : sourceZh;
      return value.replace(trimmed, converted);
    }
    if (zhPattern.test(value)) {
      return zhToTraditional ? zhToTraditional(value) : value;
    }
  }

  // 5. Dynamic pattern replacement (only tested if string contains numbers/counters)
  if (DYNAMIC_PATTERN_QUICK_TEST.test(sourceZh)) {
    for (const rule of DYNAMIC_PATTERNS) {
      const match = sourceZh.match(rule.pattern);
      if (match) {
        const replacer = rule.replace[variant] ?? rule.replace['en'];
        if (replacer) {
          return value.replace(trimmed, replacer(match));
        }
      }
    }
  }

  return value;
}

if (typeof window !== 'undefined') {
  (window as any).__shijianusConvertText = convertText;
  if (window.__SHIJIANUS_LOCALE_RUNTIME__) {
    (window.__SHIJIANUS_LOCALE_RUNTIME__ as any).convertText = convertText;
  }
}

function rememberOriginalTextValue(node: Text, currentValue: string, refreshBase = false): string {
  const state = getRuntimeState();
  if (originalTextNodeMap.has(node)) {
    // Only allow updating base if we are currently in zh-CN
    if (refreshBase && state.currentVariant === 'zh-CN') {
      originalTextNodeMap.set(node, currentValue);
    }
    return originalTextNodeMap.get(node)!;
  }

  // First time seeing this node:
  // If we are currently NOT in zh-CN, it might already be in translated state
  const trimmed = currentValue.trim();
  const reverseZh = allForeignToZhMap.get(trimmed);
  if (reverseZh) {
    const restored = currentValue.replace(trimmed, reverseZh);
    originalTextNodeMap.set(node, restored);
    return restored;
  }

  originalTextNodeMap.set(node, currentValue);
  return currentValue;
}

function setOriginalAttributeValue(element: Element, attribute: string, currentValue: string): string {
  let store = originalAttributeMap.get(element);
  if (!store) {
    store = new Map();
    originalAttributeMap.set(element, store);
  }
  store.set(attribute, currentValue);
  return currentValue;
}

function getOriginalAttributeValue(element: Element, attribute: string, currentValue: string): string {
  let store = originalAttributeMap.get(element);
  if (!store) {
    store = new Map();
    originalAttributeMap.set(element, store);
  }
  const existing = store.get(attribute);
  if (existing) return existing;
  store.set(attribute, currentValue);
  return currentValue;
}

function shouldSkipElement(element: Element): boolean {
  return isIgnoredSubtree(element);
}

function translateAttributes(element: Element, variant: LocaleVariant, options: TranslateMutationOptions = {}) {
  if (isIgnoredSubtree(element) || !element.hasAttributes()) return;

  const attributes = options.attributes ?? translatableAttributes;

  for (const attribute of attributes) {
    if (!element.hasAttribute(attribute)) continue;
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const base = options.refreshBase
      ? setOriginalAttributeValue(element, attribute, current)
      : getOriginalAttributeValue(element, attribute, current);

    if (variant === 'zh-CN') {
      const original = getOriginalAttributeValue(element, attribute, base);
      if (original !== current) element.setAttribute(attribute, original);
      continue;
    }

    const next = convertText(base, variant);
    if (next !== current) element.setAttribute(attribute, next);
  }
}

function translateTextNode(node: Text, variant: LocaleVariant, options: TranslateMutationOptions = {}) {
  const parent = node.parentElement;
  if (parent && isIgnoredSubtree(parent)) return;

  // If node has original stored value, proceed even if current nodeValue is empty string
  if (!node.nodeValue && !originalTextNodeMap.has(node)) return;

  const base = rememberOriginalTextValue(node, node.nodeValue || '', options.refreshBase);

  if (variant === 'zh-CN') {
    const original = originalTextNodeMap.get(node) ?? base;
    if (original !== node.nodeValue) node.nodeValue = original;
    return;
  }

  const next = convertText(base, variant);
  if (next !== node.nodeValue) node.nodeValue = next;
}

function translateTree(root: Element | DocumentFragment, variant: LocaleVariant, options: TranslateMutationOptions = {}) {
  const state = getRuntimeState();
  if (state.translating) return;
  state.translating = true;

  // Temporarily pause observer to prevent mutation storm
  const prevObserver = state.observer;
  if (prevObserver) {
    prevObserver.disconnect();
  }

  try {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode(node: Node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (isIgnoredSubtree(el)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
          if (node.nodeType === Node.TEXT_NODE) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      }
    );
    let current: Node | null = root;

    if (current instanceof Element && !isIgnoredSubtree(current)) {
      translateAttributes(current, variant, options);
    }

    while ((current = walker.nextNode())) {
      if (current instanceof Element) {
        translateAttributes(current, variant, options);
        continue;
      }
      if (current instanceof Text) {
        translateTextNode(current, variant, options);
      }
    }
  } finally {
    state.translating = false;
    syncLocaleObserver();
  }
}

function disconnectLocaleObserver() {
  const state = getRuntimeState();
  state.observer?.disconnect();
  state.observer = null;
}

function handleLocaleMutations(mutations: MutationRecord[]) {
  const state = getRuntimeState();
  if (state.translating || state.currentVariant === 'zh-CN') return;

  for (const mutation of mutations) {
    if (mutation.type === 'characterData' && mutation.target instanceof Text) {
      if (mutation.target.parentElement && isIgnoredSubtree(mutation.target.parentElement)) continue;
      translateTextNode(mutation.target, state.currentVariant, { refreshBase: false });
      continue;
    }

    if (mutation.type === 'attributes' && mutation.target instanceof Element && mutation.attributeName) {
      if (isIgnoredSubtree(mutation.target)) continue;
      translateAttributes(mutation.target, state.currentVariant, {
        refreshBase: false,
        attributes: [mutation.attributeName],
      });
      continue;
    }

    if (mutation.type !== 'childList') continue;

    mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) {
        if (isIgnoredSubtree(node)) return;
        translateTree(node, state.currentVariant, { refreshBase: false });
        return;
      }
      if (node instanceof Text) {
        if (node.parentElement && isIgnoredSubtree(node.parentElement)) return;
        translateTextNode(node, state.currentVariant, { refreshBase: false });
      }
    });
  }
}

function syncLocaleObserver() {
  if (typeof window === 'undefined' || !document.body) return;

  const state = getRuntimeState();
  if (!shouldObserveLocaleMutations(state.currentVariant)) {
    disconnectLocaleObserver();
    return;
  }

  if (!state.observer) {
    state.observer = new MutationObserver(handleLocaleMutations);
  } else {
    state.observer.disconnect();
  }

  state.observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...translatableAttributes],
  });
}

function queueLocaleTranslation(variant: LocaleVariant, force = false) {
  if (typeof window === 'undefined' || !document.body) return;

  const state = getRuntimeState();
  if (!force && variant === 'zh-CN') return;
  if (state.scheduled || state.preparing) return;

  const queueFrame = () => {
    if (state.scheduled || !document.body) return;

    state.scheduled = window.requestAnimationFrame(() => {
      state.scheduled = null;
      if (!document.body || state.translating || getRuntimeState().currentVariant !== variant) return;
      translateTree(document.body, variant);
    });
  };

  if (variant === 'zh-Hant' && !zhToTraditional) {
    state.preparing = true;
    void ensureChineseConverters()
      .then(() => {
        state.preparing = false;
        if (getRuntimeState().currentVariant !== variant) return;
        queueFrame();
      })
      .catch(() => {
        state.preparing = false;
      });
    return;
  }

  queueFrame();
}

/**
 * Applies a specific locale variant with zero lag.
 */
export function applyLocaleVariant(
  variant: LocaleVariant,
  options: {
    persist?: boolean;
    translate?: boolean;
    manual?: boolean;
  } = {},
): LocaleVariant {
  if (typeof document === 'undefined') return variant;

  const state = getRuntimeState();
  const nextVariant = normaliseLocaleVariant(variant);
  const persist = options.persist ?? true;
  const shouldTranslate = options.translate ?? true;
  const manual = options.manual ?? false;

  state.currentVariant = nextVariant;
  document.documentElement.dataset.localeVariant = nextVariant;
  document.documentElement.lang = nextVariant;
  syncLocaleObserver();

  if (persist) {
    try {
      window.localStorage.setItem(LOCALE_VARIANT_KEY, nextVariant);
      if (manual) {
        window.localStorage.setItem(MANUAL_LOCALE_KEY, nextVariant);
        updateCandidatePairWithManualChoice(nextVariant);
      }
    } catch {}
  }

  window.dispatchEvent(new CustomEvent<LocaleVariant>('shijianus:localechange', { detail: nextVariant }));

  if (shouldTranslate && document.body) {
    queueLocaleTranslation(nextVariant, true);
  }

  return nextVariant;
}

/**
 * Minimal 2-Language cycle toggle for the #translate button.
 * Swaps exclusively between the 2 inferred or customized candidate pair languages.
 */
export function toggleLocaleVariant(current?: LocaleVariant): LocaleVariant {
  const docVariant = typeof document !== 'undefined' ? (document.documentElement.dataset.localeVariant as LocaleVariant) : null;
  const activeVariant = current || docVariant || readStoredLocaleVariant();
  const persona = ensureUserPersona();
  const [first, second] = persona.candidatePair;

  const nextVariant = normaliseLocaleVariant(activeVariant) === first ? second : first;
  return applyLocaleVariant(nextVariant, { persist: true, translate: true, manual: false });
}

export function getLocaleBadge(variant: LocaleVariant): string {
  return LOCALE_METADATA[variant]?.badge || 'EN';
}

export function initLocaleRuntime() {
  if (typeof window === 'undefined') return;

  const state = getRuntimeState();
  if (state.initialized) return;

  state.initialized = true;
  state.currentVariant = readStoredLocaleVariant();
  (window as any).__shijianus_convertText = (text: string) => convertText(text, state.currentVariant);
  (window as any).__shijianus_getLocale = () => state.currentVariant;
  (window as any).__shijianus_t = (key: string, fallback?: string) => getI18nText(key, state.currentVariant, fallback);
  (window as any).__shijianus_applyLocaleVariant = (variant: LocaleVariant) => applyLocaleVariant(variant, { persist: true, translate: true, manual: true });

  // Background pre-warm for OpenCC so switching to zh-Hant is instant with zero stutter
  const idleWarmup = () => {
    void ensureChineseConverters();
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(idleWarmup, { timeout: 3000 });
  } else {
    setTimeout(idleWarmup, 1500);
  }

  const syncLocaleVariant = (event?: Event) => {
    let next: LocaleVariant;
    let isArticleSpecific = false;
    if (event instanceof CustomEvent && event.detail) {
      const raw = typeof event.detail === 'string' ? event.detail : (event.detail.locale || event.detail.variant);
      next = normaliseLocaleVariant(raw);
      const cleanRaw = String(raw || '').trim().toLowerCase();
      if (cleanRaw && !['zh-cn', 'zh-hans', 'zh', 'zh-hant', 'zh-tw', 'zh-hk', 'zh-mo', 'en', 'fr', 'es', 'de'].includes(cleanRaw)) {
        isArticleSpecific = true;
      }
    } else {
      next = readStoredLocaleVariant();
    }
    // Only skip if variant changed from state and NOT coming from storage or custom event
    if (next === state.currentVariant && !(event instanceof StorageEvent) && !(event instanceof CustomEvent)) return;
    state.currentVariant = next;
    if (!isArticleSpecific) {
      document.documentElement.dataset.localeVariant = next;
      document.documentElement.lang = next;
    }
    syncLocaleObserver();
    queueLocaleTranslation(state.currentVariant, true);
  };

  syncLocaleObserver();

  window.addEventListener('shijianus:localechange', syncLocaleVariant as EventListener);
  window.addEventListener('storage', (event) => {
    if (event.key === LOCALE_VARIANT_KEY || event.key === MANUAL_LOCALE_KEY) {
      syncLocaleVariant(event);
    }
  });

  if (state.currentVariant !== 'zh-CN') {
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        queueLocaleTranslation(state.currentVariant, true);
      });
    } else {
      queueLocaleTranslation(state.currentVariant, true);
    }
  }
}
