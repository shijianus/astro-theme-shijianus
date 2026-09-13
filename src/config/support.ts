export interface CurrencyPresetConfig {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  amounts: [number, number, number, number, number, number];
  labels: [string, string, string, string, string, string];
  min: number;
  max: number;
  rateToUSD: number; // For dynamic conversion when switching currencies
}

export interface SponsorItem {
  id: string;
  name: string;
  amount: number;
  currency: string;
  message?: string;
  channel: string;
  avatar?: string;
  date: string;
  featured?: boolean;
}

export interface SupportConfig {
  title: string;
  subtitle: string;
  description: string;
  trustPills: string[];
  currencies: Record<string, CurrencyPresetConfig>;
  seedSponsors: SponsorItem[];
  faqs: Array<{ question: string; answer: string }>;
}

export const supportConfig: SupportConfig = {
  title: '请喝一杯咖啡',
  subtitle: 'Buy Me a Coffee · 赞赏与创作支援',
  description:
    '感谢每一位驻足阅读的朋友。你的每一份慷慨赞赏，都是维持博客高可用运行、精进交互美学与持续开源构建最温暖的动力。',
  trustPills: [
    '☕ 咖啡档位随心选',
    '💳 国际收银台 (Apple / Google Pay)',
    '🍵 微信 & 支付宝扫码直达',
    '⚡ 多币种自适应结算',
    '🛡️ Stripe 端到端金融级加密',
    '📜 公开透明支援名录',
  ],
  currencies: {
    CNY: {
      code: 'cny',
      symbol: '¥',
      name: '人民币 CNY',
      flag: '🇨🇳',
      amounts: [4, 9, 14, 16, 20, 25],
      labels: ['迷你浓缩', '意式单份', '经典美式', '香浓拿铁', '风味特调', '精品手冲'],
      min: 1,
      max: 930,
      rateToUSD: 0.14,
    },
    USD: {
      code: 'usd',
      symbol: '$',
      name: '美元 USD',
      flag: '🇺🇸',
      amounts: [2, 3, 5, 7, 10, 20],
      labels: ['Espresso', 'Filter', 'Americano', 'Latte', 'Pour Over', 'Booster'],
      min: 1,
      max: 130,
      rateToUSD: 1.0,
    },
    HKD: {
      code: 'hkd',
      symbol: 'HK$',
      name: '港币 HKD',
      flag: '🇭🇰',
      amounts: [15, 25, 40, 60, 80, 120],
      labels: ['意式浓缩', '经典美式', '香浓拿铁', '惬意特调', '精品手冲', '造物引擎'],
      min: 1,
      max: 1000,
      rateToUSD: 0.128,
    },
    EUR: {
      code: 'eur',
      symbol: '€',
      name: '欧元 EUR',
      flag: '🇪🇺',
      amounts: [2, 3, 5, 7, 10, 15],
      labels: ['Espresso', 'Americano', 'Cappuccino', 'Latte', 'Pour Over', 'Support'],
      min: 1,
      max: 120,
      rateToUSD: 1.08,
    },
    GBP: {
      code: 'gbp',
      symbol: '£',
      name: '英镑 GBP',
      flag: '🇬🇧',
      amounts: [1.5, 2.5, 3.5, 5, 7, 10],
      labels: ['Espresso', 'Americano', 'Flat White', 'Latte', 'Filter', 'Support'],
      min: 1,
      max: 100,
      rateToUSD: 1.28,
    },
    JPY: {
      code: 'jpy',
      symbol: '¥',
      name: '日元 JPY',
      flag: '🇯🇵',
      amounts: [120, 250, 450, 680, 1100, 1300],
      labels: ['エスプレッソ', 'ドリップ', 'アメリカーノ', 'カフェラテ', 'ハンドドリップ', '応援'],
      min: 50,
      max: 20000,
      rateToUSD: 0.0067,
    },
    TWD: {
      code: 'twd',
      symbol: 'NT$',
      name: '新台币 TWD',
      flag: '🇹🇼',
      amounts: [35, 55, 80, 120, 160, 220],
      labels: ['濃縮咖啡', '美式黑咖', '香醇拿鐵', '特調風味', '手沖單品', '創作支援'],
      min: 5,
      max: 4100,
      rateToUSD: 0.031,
    },
    SGD: {
      code: 'sgd',
      symbol: 'S$',
      name: '新加坡元 SGD',
      flag: '🇸🇬',
      amounts: [3, 5, 7, 10, 15, 25],
      labels: ['Kopi-O', 'Americano', 'Latte', 'Cold Brew', 'Pour Over', 'Booster'],
      min: 1,
      max: 170,
      rateToUSD: 0.75,
    },
    CAD: {
      code: 'cad',
      symbol: 'CA$',
      name: '加拿大元 CAD',
      flag: '🇨🇦',
      amounts: [3, 5, 7, 10, 15, 25],
      labels: ['Espresso', 'Americano', 'Latte', 'Mocha', 'Pour Over', 'Booster'],
      min: 1,
      max: 180,
      rateToUSD: 0.74,
    },
    AUD: {
      code: 'aud',
      symbol: 'A$',
      name: '澳大利亚元 AUD',
      flag: '🇦🇺',
      amounts: [3, 5, 7, 10, 15, 25],
      labels: ['Short Black', 'Long Black', 'Flat White', 'Latte', 'Filter', 'Booster'],
      min: 1,
      max: 200,
      rateToUSD: 0.66,
    },
  },
  seedSponsors: [
    {
      id: 'sp_seed_1',
      name: 'CyberNomad',
      amount: 10,
      currency: 'USD',
      message: '超喜欢博客的动效与极客质感，继续加油！🚀',
      channel: 'Stripe (Apple Pay)',
      date: '2026-09-12',
      featured: true,
    },
    {
      id: 'sp_seed_2',
      name: '时间的朋友',
      amount: 25,
      currency: 'CNY',
      message: '请作者喝杯精品手冲，期待更多系统架构与Astro干货！☕️',
      channel: '微信支付',
      date: '2026-09-11',
      featured: true,
    },
    {
      id: 'sp_seed_3',
      name: '匿名支持者',
      amount: 40,
      currency: 'HKD',
      message: '很棒的数字花园，排版和交互细节太让人舒适了。',
      channel: 'Alipay HK',
      date: '2026-09-10',
    },
    {
      id: 'sp_seed_4',
      name: 'Alex Chen',
      amount: 5,
      currency: 'USD',
      message: 'Thanks for maintaining such a clean and aesthetic open-source blog theme!',
      channel: 'Stripe (Google Pay)',
      date: '2026-09-08',
    },
    {
      id: 'sp_seed_5',
      name: '热心极客读者',
      amount: 16,
      currency: 'CNY',
      message: '默默关注很久了，文章质量非常高，一杯拿铁赞赏支持！',
      channel: '支付宝',
      date: '2026-09-06',
    },
    {
      id: 'sp_seed_6',
      name: 'K. Sparks',
      amount: 3.5,
      currency: 'GBP',
      message: 'Greetings from London! Fantastic frontend engineering here.',
      channel: 'PayPal',
      date: '2026-09-04',
    },
    {
      id: 'sp_seed_7',
      name: '前端探索者',
      amount: 9,
      currency: 'CNY',
      message: '一杯意式浓缩，感谢分享技术心得。',
      channel: '微信支付',
      date: '2026-09-02',
    },
    {
      id: 'sp_seed_8',
      name: 'Dev_Marco',
      amount: 5,
      currency: 'EUR',
      message: 'Saluti da Milano! Great job on the responsive animations.',
      channel: 'Stripe (Credit Card)',
      date: '2026-08-30',
    },
    {
      id: 'sp_seed_9',
      name: '东京漫游者',
      amount: 680,
      currency: 'JPY',
      message: '美味しいコーヒーをどうぞ！素晴らしいブログです。',
      channel: 'Stripe (Apple Pay)',
      date: '2026-08-28',
    },
    {
      id: 'sp_seed_10',
      name: '台南咖啡客',
      amount: 120,
      currency: 'TWD',
      message: '排版與閱讀體驗極佳，送上一杯拿鐵心意！',
      channel: 'Stripe (Credit Card)',
      date: '2026-08-25',
    },
    {
      id: 'sp_seed_11',
      name: 'Leon.W',
      amount: 60,
      currency: 'HKD',
      message: '支持持續輸出高質量原創文章！',
      channel: 'WeChat Pay HK',
      date: '2026-08-22',
    },
    {
      id: 'sp_seed_12',
      name: 'Web3 Builder',
      amount: 10,
      currency: 'USD',
      message: 'USDT on Arbitrum transfer completed. Keep building!',
      channel: 'USDT (Arbitrum One)',
      date: '2026-08-18',
    },
    {
      id: 'sp_seed_13',
      name: '匿名支持者',
      amount: 14,
      currency: 'CNY',
      message: '一杯美式咖啡，夜猫子写代码辛苦了。',
      channel: '微信支付',
      date: '2026-08-15',
    },
    {
      id: 'sp_seed_14',
      name: 'Sarah Jenkins',
      amount: 7,
      currency: 'USD',
      message: 'Clean code and beautiful typography, loved reading your posts.',
      channel: 'Stripe (Link)',
      date: '2026-08-10',
    },
    {
      id: 'sp_seed_15',
      name: '架构修行者',
      amount: 25,
      currency: 'CNY',
      message: '干货满满，尤其是 Cloudflare 与 D1 的全栈实战方案。',
      channel: '支付宝',
      date: '2026-08-05',
    },
    {
      id: 'sp_seed_16',
      name: 'SG_Geek',
      amount: 7,
      currency: 'SGD',
      message: 'Cheers from Singapore! Amazing work on the blog theme.',
      channel: 'Stripe (Google Pay)',
      date: '2026-08-01',
    },
    {
      id: 'sp_seed_17',
      name: '极客之眼',
      amount: 16,
      currency: 'CNY',
      message: '博客的文章排版太赏心悦目了，支持作者！',
      channel: '微信支付',
      date: '2026-07-28',
    },
    {
      id: 'sp_seed_18',
      name: 'Martin.H',
      amount: 3,
      currency: 'EUR',
      message: 'Keep going with Astro and Cloudflare Workers architecture.',
      channel: 'Stripe (Apple Pay)',
      date: '2026-07-24',
    },
    {
      id: 'sp_seed_19',
      name: '维港夜读者',
      amount: 25,
      currency: 'HKD',
      message: '一杯美式咖啡支持，辛苦了！',
      channel: 'Alipay HK',
      date: '2026-07-20',
    },
    {
      id: 'sp_seed_20',
      name: '匿名支持者',
      amount: 9,
      currency: 'CNY',
      message: '喜欢站点的暗黑模式配色。',
      channel: '支付宝',
      date: '2026-07-16',
    },
    {
      id: 'sp_seed_21',
      name: 'Lucas Dupont',
      amount: 7,
      currency: 'EUR',
      message: 'Merci pour vos articles de qualité exceptionnelle!',
      channel: 'Stripe (Credit Card)',
      date: '2026-07-12',
    },
    {
      id: 'sp_seed_22',
      name: '台北码农',
      amount: 80,
      currency: 'TWD',
      message: '一杯經典美式送上，期待更多好文！',
      channel: 'Stripe (Credit Card)',
      date: '2026-07-08',
    },
    {
      id: 'sp_seed_23',
      name: 'Liam Vance',
      amount: 2.5,
      currency: 'GBP',
      message: 'Quality engineering and clear documentation. Top notch.',
      channel: 'PayPal',
      date: '2026-07-03',
    },
    {
      id: 'sp_seed_24',
      name: '云端游侠',
      amount: 25,
      currency: 'CNY',
      message: '特调手冲赞助，感谢开源主题的无私奉献！',
      channel: '微信支付',
      date: '2026-06-29',
    },
    {
      id: 'sp_seed_25',
      name: '秋叶原电工',
      amount: 450,
      currency: 'JPY',
      message: '素晴らしいUIデザインですね。応援しています！',
      channel: 'Stripe (Apple Pay)',
      date: '2026-06-25',
    },
    {
      id: 'sp_seed_26',
      name: 'Sydney_Dev',
      amount: 7,
      currency: 'AUD',
      message: 'Cold drip coffee from Australia! Love the speed of this site.',
      channel: 'Stripe (Google Pay)',
      date: '2026-06-20',
    },
    {
      id: 'sp_seed_27',
      name: '深蓝极光',
      amount: 14,
      currency: 'CNY',
      message: '夜深了，来杯咖啡继续提神写代码。',
      channel: '支付宝',
      date: '2026-06-15',
    },
    {
      id: 'sp_seed_28',
      name: 'Vancouver_Tech',
      amount: 5,
      currency: 'CAD',
      message: 'Great blog setup and responsive layout!',
      channel: 'Stripe (Link)',
      date: '2026-06-10',
    },
    {
      id: 'sp_seed_29',
      name: '代码拾荒者',
      amount: 9,
      currency: 'CNY',
      message: '支持原创技术独立博客！',
      channel: '微信支付',
      date: '2026-06-05',
    },
    {
      id: 'sp_seed_30',
      name: 'Cyber_Zero',
      amount: 2,
      currency: 'USD',
      message: 'Minimalist & lightning fast. Respect!',
      channel: 'Stripe (Apple Pay)',
      date: '2026-06-01',
    },
  ],
  faqs: [
    {
      question: '赞赏的资金将如何使用？',
      answer:
        '本站为个人独立开源数字花园。所有赞赏资金将用于贴补网站基础设施开销，包括 Cloudflare CDN 与边缘计算服务、D1 数据库与高可用对象存储、域名解析续费以及日常写作与编码时的咖啡补给。',
    },
    {
      question: '赞赏支持能否提升我的社区等级 (LV) 或信任等级 (TL)？',
      answer:
        '完全不能，两者 100% 独立脱钩。本站读者成长体系（LV.0 至 LV.4）及信任度（TL）纯粹由系统根据读者的实际阅读时长、评论交流质量、表情互动及活跃天数等客观贡献度自动计算（详见账号中心体系），绝无任何付费充值升级特权或商业化通道。无论是否赞赏，所有读者在社区中均享有完全平等的阅读、评论与功能权益，赞赏纯粹属于读者对博主开源创作的心意鼓励。',
    },
    {
      question: '通过微信或支付宝扫码后，如何出现在下方的公开致谢名录中？',
      answer:
        '若使用上方 Stripe 国际收银台（信用卡 / Apple Pay / Google Pay），付款成功后系统会自动同步收录进致谢名录；若使用微信或支付宝转账，请在转账附言中备注您的称呼与寄语，博主在定期查对账单后会手动录入名录；若希望完全匿名，附言留空即可，系统会以“匿名支持者”形式致谢。',
    },
    {
      question: '如果赞赏出现误操作或需要退款，该如何处理？是否提供电子凭证？',
      answer:
        '若因误操作、网络卡顿导致重复扣款等特殊情况，支持在付款后联系博主邮箱（shijianus@epocanvas.com）并附上付款凭据，博主在查实后会原路协助退还。由于个人独立维护博客精力有限，无法提供 7×24 小时即时客服，博主在查阅邮件后会尽快跟进处理，感谢您的理解与包容。通过 Stripe 支付的支持者可在收银台填入邮箱，系统会自动发送电子凭证。',
    },
    {
      question: 'Stripe 国际收银台安全吗？支持哪些支付方式？',
      answer:
        '极其安全。本站采用 Stripe 官方金融级加密沙箱（PCI-DSS Level 1 认证）完成结算，所有卡号、CVC 等敏感信息均在 Stripe 安全域内处理，本站服务器绝不触碰且无法保存任何支付凭证。支持 Apple Pay、Google Pay、Visa、MasterCard 等主流国际卡种及 Link 快捷支付。',
    },
    {
      question: '如果我想保持完全匿名可以吗？',
      answer:
        '当然可以。在赞赏时留空称呼与留言即可，系统将统一以“匿名支持者”形式收录致谢，并且前台绝不公开展示任何邮箱、卡号及网络 IP 地址，切实保护每一位支持者的隐私。',
    },
  ],
};
