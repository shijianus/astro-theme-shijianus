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
  min: number; // 1 HKD equivalent
  max: number; // 1000 HKD equivalent
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
    { code: 'CNY', symbol: '¥', name: '人民币 CNY', flag: '🇨🇳', min: 1, max: 920 },
    { code: 'USD', symbol: '$', name: '美元 USD', flag: '🇺🇸', min: 1, max: 130 },
    { code: 'HKD', symbol: 'HK$', name: '港币 HKD', flag: '🇭🇰', min: 1, max: 1000 },
    { code: 'EUR', symbol: '€', name: '欧元 EUR', flag: '🇪🇺', min: 1, max: 120 },
    { code: 'GBP', symbol: '£', name: '英镑 GBP', flag: '🇬🇧', min: 1, max: 100 },
    { code: 'JPY', symbol: '¥', name: '日元 JPY', flag: '🇯🇵', min: 100, max: 19000 },
    { code: 'TWD', symbol: 'NT$', name: '新台币 TWD', flag: '🇹🇼', min: 10, max: 4000 },
    { code: 'SGD', symbol: 'S$', name: '新加坡元 SGD', flag: '🇸🇬', min: 1, max: 170 },
    { code: 'CAD', symbol: 'CA$', name: '加拿大元 CAD', flag: '🇨🇦', min: 1, max: 175 },
    { code: 'AUD', symbol: 'A$', name: '澳大利亚元 AUD', flag: '🇦🇺', min: 1, max: 195 },
  ],
  coffeeTiers: [
    {
      id: 'espresso',
      name: '1 杯意式浓缩 (Espresso)',
      badge: '提神醒脑 · 晨间代码',
      icon: '☕',
      description: '唤醒清晨思绪，写出一行优雅代码的能量源泉',
      amounts: {
        CNY: 12,
        USD: 2.5,
        HKD: 18,
        EUR: 2.2,
        GBP: 1.9,
        JPY: 350,
        TWD: 75,
        SGD: 3.5,
        CAD: 3.5,
        AUD: 3.8,
      },
    },
    {
      id: 'americano',
      name: '1 杯经典美式 (Americano)',
      badge: '长效续航 · 深夜调优',
      icon: '☕☕',
      description: '长效醇厚回甘，陪伴一整晚的开源迭代与性能调优',
      amounts: {
        CNY: 22,
        USD: 4.5,
        HKD: 32,
        EUR: 4.0,
        GBP: 3.4,
        JPY: 600,
        TWD: 130,
        SGD: 6.0,
        CAD: 6.0,
        AUD: 6.5,
      },
    },
    {
      id: 'latte',
      name: '1 杯香浓拿铁 (Latte)',
      badge: '丝滑灵感 · 架构构思',
      icon: '🍰',
      description: '奶泡绵密丝滑，惬意午后灵感迸发，滋养深度长文构思',
      amounts: {
        CNY: 32,
        USD: 6.5,
        HKD: 48,
        EUR: 5.8,
        GBP: 4.9,
        JPY: 850,
        TWD: 190,
        SGD: 8.5,
        CAD: 8.5,
        AUD: 9.5,
      },
    },
    {
      id: 'pour_over',
      name: '精品手冲与造物赞助 (Pour Over)',
      badge: '极客引擎 · 生态基建',
      icon: '🚀',
      description: '单一产区风味豆，直接赞助服务器全球加速带宽与生态基建',
      amounts: {
        CNY: 68,
        USD: 12.0,
        HKD: 98,
        EUR: 11.0,
        GBP: 9.5,
        JPY: 1700,
        TWD: 380,
        SGD: 16.0,
        CAD: 16.5,
        AUD: 18.0,
      },
    },
  ],
  seedSponsors: [
    {
      id: 'sp_seed_1',
      name: 'CyberNomad',
      amount: 12,
      currency: 'USD',
      message: '超喜欢博客的动效与极客质感，继续加油！🚀',
      channel: 'Stripe (Apple Pay)',
      date: '2026-09-12',
      featured: true,
    },
    {
      id: 'sp_seed_2',
      name: '时间的朋友',
      amount: 68,
      currency: 'CNY',
      message: '请作者喝杯精品手冲，期待更多系统架构与Astro干货！☕️',
      channel: '微信支付',
      date: '2026-09-11',
      featured: true,
    },
    {
      id: 'sp_seed_3',
      name: '匿名支持者',
      amount: 48,
      currency: 'HKD',
      message: '很棒的数字花园，排版和交互细节太让人舒适了。',
      channel: 'Alipay HK',
      date: '2026-09-10',
    },
    {
      id: 'sp_seed_4',
      name: 'Alex Chen',
      amount: 6.5,
      currency: 'USD',
      message: 'Thanks for maintaining such a clean and aesthetic open-source blog theme!',
      channel: 'Stripe (Google Pay)',
      date: '2026-09-08',
    },
    {
      id: 'sp_seed_5',
      name: '热心极客读者',
      amount: 32,
      currency: 'CNY',
      message: '默默关注很久了，文章质量非常高，一杯拿铁赞赏支持！',
      channel: '支付宝',
      date: '2026-09-06',
    },
    {
      id: 'sp_seed_6',
      name: 'K. Sparks',
      amount: 4.9,
      currency: 'GBP',
      message: 'Greetings from London! Fantastic frontend engineering here.',
      channel: 'PayPal',
      date: '2026-09-04',
    },
    {
      id: 'sp_seed_7',
      name: '前端探索者',
      amount: 12,
      currency: 'CNY',
      message: '一杯意式浓缩，感谢分享技术心得。',
      channel: '微信支付',
      date: '2026-09-02',
    },
    {
      id: 'sp_seed_8',
      name: 'Dev_Marco',
      amount: 5.8,
      currency: 'EUR',
      message: 'Saluti da Milano! Great job on the responsive animations.',
      channel: 'Stripe (Credit Card)',
      date: '2026-08-30',
    },
    {
      id: 'sp_seed_9',
      name: '东京漫游者',
      amount: 850,
      currency: 'JPY',
      message: '美味しいコーヒーをどうぞ！素晴らしいブログです。',
      channel: 'Stripe (Apple Pay)',
      date: '2026-08-28',
    },
    {
      id: 'sp_seed_10',
      name: '台南咖啡客',
      amount: 190,
      currency: 'TWD',
      message: '排版與閱讀體驗極佳，送上一杯拿鐵心意！',
      channel: 'Stripe (Credit Card)',
      date: '2026-08-25',
    },
    {
      id: 'sp_seed_11',
      name: 'Leon.W',
      amount: 98,
      currency: 'HKD',
      message: '支持持續輸出高質量原創文章！',
      channel: 'WeChat Pay HK',
      date: '2026-08-22',
    },
    {
      id: 'sp_seed_12',
      name: 'Web3 Builder',
      amount: 12,
      currency: 'USD',
      message: 'USDT on Arbitrum transfer completed. Keep building!',
      channel: 'USDT (Arbitrum One)',
      date: '2026-08-18',
    },
    {
      id: 'sp_seed_13',
      name: '匿名支持者',
      amount: 22,
      currency: 'CNY',
      message: '一杯美式咖啡，夜猫子写代码辛苦了。',
      channel: '微信支付',
      date: '2026-08-15',
    },
    {
      id: 'sp_seed_14',
      name: 'Sarah Jenkins',
      amount: 4.5,
      currency: 'USD',
      message: 'Clean code and beautiful typography, loved reading your posts.',
      channel: 'Stripe (Link)',
      date: '2026-08-10',
    },
    {
      id: 'sp_seed_15',
      name: '架构修行者',
      amount: 68,
      currency: 'CNY',
      message: '干货满满，尤其是 Cloudflare 与 D1 的全栈实战方案。',
      channel: '支付宝',
      date: '2026-08-05',
    },
    {
      id: 'sp_seed_16',
      name: 'SG_Geek',
      amount: 8.5,
      currency: 'SGD',
      message: 'Cheers from Singapore! Amazing work on the blog theme.',
      channel: 'Stripe (Google Pay)',
      date: '2026-08-01',
    },
    {
      id: 'sp_seed_17',
      name: '极客之眼',
      amount: 32,
      currency: 'CNY',
      message: '博客的文章排版太赏心悦目了，支持作者！',
      channel: '微信支付',
      date: '2026-07-28',
    },
    {
      id: 'sp_seed_18',
      name: 'Martin.H',
      amount: 4.0,
      currency: 'EUR',
      message: 'Keep going with Astro and Cloudflare Workers architecture.',
      channel: 'Stripe (Apple Pay)',
      date: '2026-07-24',
    },
    {
      id: 'sp_seed_19',
      name: '维港夜读者',
      amount: 32,
      currency: 'HKD',
      message: '一杯美式咖啡支持，辛苦了！',
      channel: 'Alipay HK',
      date: '2026-07-20',
    },
    {
      id: 'sp_seed_20',
      name: '匿名支持者',
      amount: 12,
      currency: 'CNY',
      message: '喜欢站点的暗黑模式配色。',
      channel: '支付宝',
      date: '2026-07-16',
    },
    {
      id: 'sp_seed_21',
      name: 'Lucas Dupont',
      amount: 11.0,
      currency: 'EUR',
      message: 'Merci pour vos articles de qualité exceptionnelle!',
      channel: 'Stripe (Credit Card)',
      date: '2026-07-12',
    },
    {
      id: 'sp_seed_22',
      name: '台北码农',
      amount: 130,
      currency: 'TWD',
      message: '一杯經典美式送上，期待更多好文！',
      channel: 'Stripe (Credit Card)',
      date: '2026-07-08',
    },
    {
      id: 'sp_seed_23',
      name: 'Liam Vance',
      amount: 3.4,
      currency: 'GBP',
      message: 'Quality engineering and clear documentation. Top notch.',
      channel: 'PayPal',
      date: '2026-07-03',
    },
    {
      id: 'sp_seed_24',
      name: '云端游侠',
      amount: 68,
      currency: 'CNY',
      message: '特调手冲赞助，感谢开源主题的无私奉献！',
      channel: '微信支付',
      date: '2026-06-29',
    },
    {
      id: 'sp_seed_25',
      name: '秋叶原电工',
      amount: 600,
      currency: 'JPY',
      message: '素晴らしいUIデザインですね。応援しています！',
      channel: 'Stripe (Apple Pay)',
      date: '2026-06-25',
    },
    {
      id: 'sp_seed_26',
      name: 'Sydney_Dev',
      amount: 6.5,
      currency: 'AUD',
      message: 'Cold drip coffee from Australia! Love the speed of this site.',
      channel: 'Stripe (Google Pay)',
      date: '2026-06-20',
    },
    {
      id: 'sp_seed_27',
      name: '深蓝极光',
      amount: 22,
      currency: 'CNY',
      message: '夜深了，来杯咖啡继续提神写代码。',
      channel: '支付宝',
      date: '2026-06-15',
    },
    {
      id: 'sp_seed_28',
      name: 'Vancouver_Tech',
      amount: 6.0,
      currency: 'CAD',
      message: 'Great blog setup and responsive layout!',
      channel: 'Stripe (Link)',
      date: '2026-06-10',
    },
    {
      id: 'sp_seed_29',
      name: '代码拾荒者',
      amount: 12,
      currency: 'CNY',
      message: '支持原创技术独立博客！',
      channel: '微信支付',
      date: '2026-06-05',
    },
    {
      id: 'sp_seed_30',
      name: 'Cyber_Zero',
      amount: 2.5,
      currency: 'USD',
      message: 'Minimalist & lightning fast. Respect!',
      channel: 'Stripe (Apple Pay)',
      date: '2026-06-01',
    },
    {
      id: 'sp_seed_31',
      name: '山水清音',
      amount: 22,
      currency: 'CNY',
      message: '美式咖啡支持，阅读体验很棒。',
      channel: '微信支付',
      date: '2026-05-28',
    },
    {
      id: 'sp_seed_32',
      name: 'Hans_Mueller',
      amount: 4.0,
      currency: 'EUR',
      message: 'Schöne Grüße aus Berlin! Tolles Projekt.',
      channel: 'Stripe (Credit Card)',
      date: '2026-05-22',
    },
    {
      id: 'sp_seed_33',
      name: '港漂程序员',
      amount: 48,
      currency: 'HKD',
      message: '一杯香浓拿铁，感谢博主的技术文章。',
      channel: 'WeChat Pay HK',
      date: '2026-05-18',
    },
    {
      id: 'sp_seed_34',
      name: '匿名支持者',
      amount: 12,
      currency: 'CNY',
      message: '随喜赞赏，祝博客越办越好！',
      channel: '支付宝',
      date: '2026-05-12',
    },
    {
      id: 'sp_seed_35',
      name: 'Elena Rostova',
      amount: 6.5,
      currency: 'USD',
      message: 'Love the animations and design precision!',
      channel: 'Stripe (Google Pay)',
      date: '2026-05-08',
    },
    {
      id: 'sp_seed_36',
      name: '京都茶客',
      amount: 350,
      currency: 'JPY',
      message: '応援しています。美味しいエスプレッソを！',
      channel: 'Stripe (Apple Pay)',
      date: '2026-05-02',
    },
    {
      id: 'sp_seed_37',
      name: '新竹工程师',
      amount: 75,
      currency: 'TWD',
      message: '一行優雅代碼的源泉，一杯義式濃縮送上！',
      channel: 'Stripe (Credit Card)',
      date: '2026-04-26',
    },
    {
      id: 'sp_seed_38',
      name: 'James O.',
      amount: 1.9,
      currency: 'GBP',
      message: 'Quick espresso from London. Stellar work.',
      channel: 'PayPal',
      date: '2026-04-20',
    },
    {
      id: 'sp_seed_39',
      name: '星海探索者',
      amount: 68,
      currency: 'CNY',
      message: '特调手冲赞赏，作者继续加油造物！',
      channel: '微信支付',
      date: '2026-04-15',
    },
    {
      id: 'sp_seed_40',
      name: 'Calgary_Dev',
      amount: 3.5,
      currency: 'CAD',
      message: 'Great theme, thank you for sharing!',
      channel: 'Stripe (Link)',
      date: '2026-04-09',
    },
    {
      id: 'sp_seed_41',
      name: 'Perth_Coder',
      amount: 3.8,
      currency: 'AUD',
      message: 'Morning coffee support from down under!',
      channel: 'Stripe (Google Pay)',
      date: '2026-04-03',
    },
    {
      id: 'sp_seed_42',
      name: '数字游牧者',
      amount: 12,
      currency: 'CNY',
      message: '在清迈喝着咖啡读你的博客，很有启发。',
      channel: '微信支付',
      date: '2026-03-28',
    },
  ],
  faqs: [
    {
      question: '赞赏的资金将如何透明使用？',
      answer:
        '所有赞赏资金均 100% 用于保障博客与开源生态的持续运作与高质量创作：主要包括 Cloudflare 边缘计算与全球 CDN 流量加速、域名安全解析与续费、D1 数据库与高可用对象存储、多端自动化测试与开发硬件投入，以及作者在深夜写代码时的实体咖啡与体能能量补给。',
    },
    {
      question: '赞赏能否提升我的博客会员等级 (LV) 或信任等级 (TL)？',
      answer:
        '【绝对不能，100% 独立脱钩】本博客的会员等级 (LV1 ~ LV6) 与社区信任等级 (TL0 ~ TL4) 旨在衡量读者在社区中的技术交流深度、高质量讨论与开源建设贡献，绝无任何付费购买特权或 Pay-to-Win 属性！无论赞赏与否，每一位读者在社区内均享有完全平等的阅读、评论与交互权益。',
    },
    {
      question: '通过微信或支付宝扫码后，如何出现在下方的公开致谢名册中？',
      answer:
        '若你使用微信或支付宝转账赞赏，请在转账附言中写下你的昵称/称呼与寄语。由于微信/支付宝个人收款码未开放商业 Webhook 回调，作者在核对账单后会定期手动收录进致谢名册；你也可以通过 Telegram (@chronoral) 或邮件 (shijianus@epocanvas.com) 告知转账单号与寄语，我们将第一时间录入致谢！若使用上方 Stripe 国际收银台，支付成功后系统将自动秒级收录。',
    },
    {
      question: '如果赞赏出现误操作或需要退款，该如何处理？是否提供电子凭证？',
      answer:
        '若因手误、重复扣款或任何原因需要退款，我们承诺 7 天内无条件全额原路退还（绝不推诿）。只需联系作者邮件 (shijianus@epocanvas.com) 或 Telegram (@chronoral) 并提供订单尾号即可秒级发起退款。通过 Stripe 支付的支持者在收银台填入邮箱即可自动收到金融级电子收据凭证。',
    },
    {
      question: 'Stripe 国际收银台安全吗？支持哪些支付方式？',
      answer:
        '极其安全。本站采用 Stripe 官方最高等级的 Embedded Checkout 架构，所有卡号、CVC 及敏感信息均在 Stripe 金融级加密沙箱（PCI-DSS Level 1 认证）中完成处理，本站服务器绝不触碰且无法储存任何支付凭证。支持 Apple Pay、Google Pay、Visa、MasterCard、American Express、JCB、UnionPay 及 Stripe Link 快捷支付。',
    },
    {
      question: '如果我想保持完全匿名可以吗？',
      answer:
        '当然可以！在赞赏时无需填写称呼与留言，系统将自动以“匿名支持者”的形式载入名录，并且绝不在前台展示任何邮箱、卡号及 IP 地址，完全尊重并守护每一位支持者的隐私。',
    },
  ],
};
