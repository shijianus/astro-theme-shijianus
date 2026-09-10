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
    'tab.auth': '登录 / 授权',
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
    'settings.comments.sort.hot': '🔥 最热',
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
    'tab.auth': '登入 / 授權',
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
    'settings.comments.sort.hot': '🔥 最熱',
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
    'tab.auth': 'Sign In',
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
    'settings.comments.sort.hot': '🔥 Popular',
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
    'tab.auth': 'Connexion',
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
    'settings.comments.sort.hot': '🔥 Populaires',
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
    'tab.auth': 'Acceso',
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
    'settings.comments.sort.hot': '🔥 Más populares',
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
    'tab.auth': 'Anmelden',
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
    'settings.comments.sort.hot': '🔥 Beliebteste',
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
  return table[key] ?? I18N_STRINGS['en']?.[key] ?? I18N_STRINGS['zh-CN']?.[key] ?? fallback ?? key;
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

  // Table of contents & Post details
  '文章目录': { en: 'Table of contents', fr: 'Sommaire', es: 'Índice', de: 'Inhaltsverzeichnis' },
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
  '站点资讯': { en: 'Site Info', fr: 'Infos du site', es: 'Información del sitio', de: 'Website-Info' },
  '全站字数': { en: 'Total Words', fr: 'Nombre de mots', es: 'Palabras totales', de: 'Wörter gesamt' },
  '建站天数': { en: 'Days Online', fr: 'Jours en ligne', es: 'Días en línea', de: 'Tage online' },
  '运行时间': { en: 'Uptime', fr: 'Temps de fonctionnement', es: 'Tiempo activo', de: 'Betriebszeit' },
  '最后更新': { en: 'Last Updated', fr: 'Dernière mise à jour', es: 'Última actualización', de: 'Zuletzt aktualisiert' },
  '本站访客数': { en: 'Total Visitors', fr: 'Visiteurs uniques', es: 'Visitantes únicos', de: 'Besucher gesamt' },
  '访问总量': { en: 'Total Views', fr: 'Vues totales', es: 'Visitas totales', de: 'Aufrufe gesamt' },
  '持续更新': { en: 'Continuous updates', fr: 'Mises à jour continues', es: 'Actualizaciones continuas', de: 'Laufende Aktualisierungen' },
  '切换目录层级 (全部 / 1级 / 2级 / 3级)': { en: 'Toggle TOC levels (All / L1 / L2 / L3)', fr: 'Changer le niveau du sommaire (Tous / N1 / N2 / N3)', es: 'Alternar niveles de índice (Todos / N1 / N2 / N3)', de: 'Inhaltsverzeichnisebenen umschalten (Alle / E1 / E2 / E3)' },
  '切换目录层级': { en: 'Toggle TOC levels', fr: 'Changer de niveau', es: 'Alternar niveles', de: 'Ebenen umschalten' },

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
  '产品观察': { en: 'Product', fr: 'Produit', es: 'Producto', de: 'Produkt' },

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
  '本站总字数': { en: 'Total Words', fr: 'Mots totaux', es: 'Palabras totales', de: 'Wörter gesamt' },
  '本站总访问量': { en: 'Total Views', fr: 'Vues totales', es: 'Visitas totales', de: 'Aufrufe gesamt' },
  '最后更新时间': { en: 'Last Updated', fr: 'Dernière mise à jour', es: 'Última actualización', de: 'Zuletzt aktualisiert' },
  '加入 chronoral 社群': { en: 'Join chronoral community', fr: 'Rejoindre chronoral', es: 'Unirse a chronoral', de: 'chronoral Community beitreten' },
  '海外更新、测试通知和小范围交流入口。': { en: 'Overseas updates, testing notices, and discussions.', fr: 'Mises à jour, annonces et discussions.', es: 'Actualizaciones, avisos y discusiones.', de: 'Updates, Testankündigungen und Diskussionen.' },
  '加入': { en: 'Join', fr: 'Rejoindre', es: 'Unirse', de: 'Beitreten' },
  '扫码加入': { en: 'Scan QR to join', fr: 'Scanner pour rejoindre', es: 'Escanear para unirse', de: 'QR scannen zum Beitreten' },
  '立即加入': { en: 'Join Now', fr: 'Rejoindre', es: 'Unirse', de: 'Beitreten' },
  '立即加入 →': { en: 'Join Now →', fr: 'Rejoindre →', es: 'Unirse →', de: 'Beitreten →' },
  '无缝安全交流': { en: 'Seamless & Secure Chat', fr: 'Échange sécurisé', es: 'Chat seguro y fluido', de: 'Sicherer Austausch' },
  '加入 Telegram': { en: 'Join Telegram', fr: 'Rejoindre Telegram', es: 'Unirse a Telegram', de: 'Telegram beitreten' },
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

};

export interface PatternRule {
  pattern: RegExp;
  replace: Record<SupportedLocale, (match: RegExpMatchArray) => string>;
}

export const DYNAMIC_PATTERNS: PatternRule[] = [
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
    pattern: /^(\d+(?:\.\d+)?k?)\s*节$/i,
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
    pattern: /^(\d+(?:\.\d+)?k?)\s*字$/i,
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
    pattern: /^(\d+)\s*天$/i,
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

  allForeignToZhMap.set(trans.en, zh);
  allForeignToZhMap.set(trans.fr, zh);
  allForeignToZhMap.set(trans.es, zh);
  allForeignToZhMap.set(trans.de, zh);
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
  if (typeof el.closest === 'function') {
    if (
      el.closest(
        '#article-container, #theme-overlays, #local-search, #console, #rightside, #post-comment, #nav-right, .theme-account-overlay, .theme-account-drawer, .ignore-opencc, .article-body, .post-content, [data-no-translate]'
      )
    ) {
      return true;
    }
  } else {
    if (
      el.id === 'article-container' ||
      el.id === 'theme-overlays' ||
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

const DYNAMIC_PATTERN_QUICK_TEST = /\d|查看|收起|始于|起始于|博客|节|篇|字|分钟|次|天|切换|正在|欢迎|复制|Epomail/;

/**
 * Text translation router based on variant (O(1) exact mapping + dynamic pattern rules)
 */
export function convertText(value: string, variant: LocaleVariant): string {
  if (!value) return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  // 1. Resolve canonical source Chinese key (handles foreign-to-foreign transitions seamlessly)
  const sourceZh = allForeignToZhMap.get(trimmed) || trimmed;

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
    const trans = zhToEnMap.get(sourceZh);
    if (trans) return value.replace(trimmed, trans);
  } else if (variant === 'fr') {
    const trans = zhToFrMap.get(sourceZh);
    if (trans) return value.replace(trimmed, trans);
  } else if (variant === 'es') {
    const trans = zhToEsMap.get(sourceZh);
    if (trans) return value.replace(trimmed, trans);
  } else if (variant === 'de') {
    const trans = zhToDeMap.get(sourceZh);
    if (trans) return value.replace(trimmed, trans);
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
        const replacer = rule.replace[variant];
        if (replacer) {
          return value.replace(trimmed, replacer(match));
        }
      }
    }
  }

  return value;
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
  if (!node.nodeValue) return;
  const parent = node.parentElement;
  if (parent && isIgnoredSubtree(parent)) return;

  const base = rememberOriginalTextValue(node, node.nodeValue, options.refreshBase);

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
    if (event instanceof CustomEvent) {
      next = normaliseLocaleVariant(event.detail);
    } else {
      next = readStoredLocaleVariant();
    }
    // Only re-queue if variant changed from state or if coming from storage event
    if (next === state.currentVariant && !(event instanceof StorageEvent)) return;
    state.currentVariant = next;
    document.documentElement.dataset.localeVariant = next;
    document.documentElement.lang = next;
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
    queueLocaleTranslation(state.currentVariant, true);
  }
}
