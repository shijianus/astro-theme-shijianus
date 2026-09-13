export interface CoffeeTier {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
  amounts: Record<string, number>; // currency code -> amount
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  min: number;
  max: number;
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
  currencies: CurrencyOption[];
  coffeeTiers: CoffeeTier[];
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
  currencies: [
    { code: 'CNY', symbol: '¥', name: '人民币 CNY', flag: '🇨🇳', min: 1, max: 999 },
    { code: 'USD', symbol: '$', name: '美元 USD', flag: '🇺🇸', min: 1, max: 150 },
    { code: 'HKD', symbol: 'HK$', name: '港币 HKD', flag: '🇭🇰', min: 10, max: 1200 },
    { code: 'EUR', symbol: '€', name: '欧元 EUR', flag: '🇪🇺', min: 1, max: 150 },
    { code: 'GBP', symbol: '£', name: '英镑 GBP', flag: '🇬🇧', min: 1, max: 120 },
    { code: 'JPY', symbol: '¥', name: '日元 JPY', flag: '🇯🇵', min: 100, max: 20000 },
  ],
  coffeeTiers: [
    {
      id: 'espresso',
      name: '1 杯意式浓缩',
      badge: '提神醒脑',
      icon: '☕',
      description: '写出一行优雅代码的能量源泉',
      amounts: {
        CNY: 15,
        USD: 2,
        HKD: 15,
        EUR: 2,
        GBP: 1.5,
        JPY: 300,
      },
    },
    {
      id: 'americano',
      name: '2 杯经典美式',
      badge: '通宵奋战',
      icon: '☕☕',
      description: '陪伴一整晚的开源迭代与性能调优',
      amounts: {
        CNY: 30,
        USD: 5,
        HKD: 35,
        EUR: 5,
        GBP: 4,
        JPY: 750,
      },
    },
    {
      id: 'dessert',
      name: '咖啡 + 甜点套餐',
      badge: '惬意午后',
      icon: '🍰',
      description: '午后灵感迸发，滋养深度长文构思',
      amounts: {
        CNY: 50,
        USD: 10,
        HKD: 70,
        EUR: 10,
        GBP: 8,
        JPY: 1500,
      },
    },
    {
      id: 'booster',
      name: '强力造物赞助',
      badge: '极客引擎',
      icon: '🚀',
      description: '直接赞助服务器带宽与生态持续升级',
      amounts: {
        CNY: 100,
        USD: 20,
        HKD: 150,
        EUR: 20,
        GBP: 15,
        JPY: 3000,
      },
    },
  ],
  seedSponsors: [
    {
      id: 'sp_seed_1',
      name: 'CyberNomad',
      amount: 20,
      currency: 'USD',
      message: '超喜欢博客的动效与极客质感，继续加油！🚀',
      channel: 'Stripe (Apple Pay)',
      date: '2026-09-10',
      featured: true,
    },
    {
      id: 'sp_seed_2',
      name: '时间的朋友',
      amount: 50,
      currency: 'CNY',
      message: '请作者喝杯下午茶，期待更多系统架构与Astro干货！☕️',
      channel: '微信支付',
      date: '2026-09-08',
      featured: true,
    },
    {
      id: 'sp_seed_3',
      name: '匿名支持者',
      amount: 35,
      currency: 'HKD',
      message: '很棒的数字花园，排版和交互细节太让人舒适了。',
      channel: 'Alipay HK',
      date: '2026-09-05',
    },
    {
      id: 'sp_seed_4',
      name: 'Alex Chen',
      amount: 10,
      currency: 'USD',
      message: 'Thanks for maintaining such a clean and aesthetic open-source blog theme!',
      channel: 'Stripe (Google Pay)',
      date: '2026-09-02',
    },
    {
      id: 'sp_seed_5',
      name: '热心极客读者',
      amount: 30,
      currency: 'CNY',
      message: '默默关注很久了，文章质量非常高，赞赏支持！',
      channel: '支付宝',
      date: '2026-08-28',
    },
    {
      id: 'sp_seed_6',
      name: 'K. Sparks',
      amount: 8,
      currency: 'GBP',
      message: 'Greetings from London! Fantastic frontend engineering here.',
      channel: 'PayPal',
      date: '2026-08-25',
    },
    {
      id: 'sp_seed_7',
      name: '前端探索者',
      amount: 15,
      currency: 'CNY',
      message: '一杯意式浓缩，感谢分享技术心得。',
      channel: '微信支付',
      date: '2026-08-19',
    },
  ],
  faqs: [
    {
      question: '赞赏的资金将如何使用？',
      answer:
        '所有赞赏资金均将直接用于本博客的持续运转与创作支持：包括 Cloudflare 企业网络与 Workers/Pages 资源成本、域名续费、高可用存储、开发测试设备以及支持作者在深夜写代码时的咖啡补给。',
    },
    {
      question: '通过微信或支付宝扫码后，如何出现在下方的支援名录中？',
      answer:
        '若你使用微信或支付宝转账赞赏，可在转账附言中写下你的昵称/称呼与寄语。由于微信/支付宝个人赞赏码没有开放实时回调 Webhook，作者在核对账单后会定期手动同步收录进名录；你也可以通过 Telegram 或邮件（shijianus@epocanvas.com）告知单号与寄语，我们将第一时间录入致谢！',
    },
    {
      question: 'Stripe 国际收银台安全吗？',
      answer:
        '极其安全。本站采用 Stripe 官方最高等级的 Embedded Checkout 架构，所有卡号、CVC 及支付信息均在 Stripe 端到端加密沙箱中完成处理，符合金融级 PCI-DSS Level 1 安全标准。本站服务器绝不触碰且无法储存任何支付凭证。',
    },
    {
      question: '如果我想保持完全匿名可以吗？',
      answer:
        '当然可以！在赞赏时无需填写称呼与留言，系统将自动以"匿名支持者"或"热心读者"的形式载入名录，完全尊重并守护每一位支持者的隐私。',
    },
  ],
};
