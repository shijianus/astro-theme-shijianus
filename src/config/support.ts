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
  allocation?: string; // 资金去向 / 消费公示，若未公示使用 "-"
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
    KRW: {
      code: 'krw',
      symbol: '₩',
      name: '韩元 KRW',
      flag: '🇰🇷',
      amounts: [1500, 3500, 4700, 6000, 7000, 9000],
      labels: ['에스프레소', '아메리카노', '카페라떼', '콜드브루', '핸드드립', '응원'],
      min: 500,
      max: 175000,
      rateToUSD: 0.00075,
    },
    MYR: {
      code: 'myr',
      symbol: 'RM',
      name: '马来西亚林吉特 MYR',
      flag: '🇲🇾',
      amounts: [3, 8, 13, 17, 20, 25],
      labels: ['Espresso', 'Kopi', 'Americano', 'Latte', 'Pour Over', 'Sokongan'],
      min: 1,
      max: 570,
      rateToUSD: 0.22,
    },
    THB: {
      code: 'thb',
      symbol: '฿',
      name: '泰铢 THB',
      flag: '🇹🇭',
      amounts: [40, 60, 90, 120, 180, 250],
      labels: ['เอสเพรสโซ', 'อเมริกาโน', 'ลาเต้', 'คาปูชิโน', 'ดริปกาแฟ', 'สนับสนุน'],
      min: 10,
      max: 4500,
      rateToUSD: 0.029,
    },
    CHF: {
      code: 'chf',
      symbol: 'Fr.',
      name: '瑞士法郎 CHF',
      flag: '🇨🇭',
      amounts: [2.5, 4, 6, 9, 14, 20],
      labels: ['Espresso', 'Café Crème', 'Cappuccino', 'Latte', 'Filter', 'Support'],
      min: 1,
      max: 115,
      rateToUSD: 1.15,
    },
  },
  // 仅保留最多 3 个真实/初始原型赞赏记录（拒绝虚假过度填充）
  seedSponsors: [
    {
      id: 'sp_seed_1',
      name: 'CyberNomad',
      amount: 10,
      currency: 'USD',
      message: '超喜欢博客的动效与极客质感，继续加油！🚀',
      channel: 'Stripe (Apple Pay)',
      allocation: 'Cloudflare Pro 边缘算力服务',
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
      allocation: 'D1 数据库与高可用存储扩容',
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
      allocation: '-',
      date: '2026-09-10',
    },
  ],
  faqs: [
    {
      question: '赞赏的资金将如何使用？实际去向与技术投入如何公示？',
      answer:
        '为了为您提供更加极速、稳定与纯粹的阅读与交互服务，本博客完全基于现代化 Serverless 边缘计算架构自建构建。所有赞赏资金主要用于维持站点高可用基础设施开销，包括全球分布式 Cloudflare CDN 与边缘算力服务、Cloudflare D1 边缘关系型数据库与高可用对象存储、跨国顶级域名解析续费以及各类安全防护能力。在此必须真诚说明：您为博主所点的咖啡实际上是象征意义的精神咖啡，它们实际上会被用于真实的技术辅助和开发工作投入中。我们致力于公开、公示所有打赏资金的实际去向。我们会不定时地选择性展示支持者的资金所用于的真实消费（例如基础设施续费、API 算力或云工具订阅），并将本笔消费与支持者直接挂钩并在下方支援榜单中实际展示。对于暂未使用的资金或尚在流转没有公示的部分，均在名录中使用“-”替代，公开严谨，绝不弄虚作假。',
    },
    {
      question: '为什么支援选择仅提供两种结算货币？金额与当地购买力是如何挂钩的？',
      answer:
        '为了消除繁杂多余的币种干扰，收银台仅提供两款精准货币选择：① 本地货币（基于您当前访问的网络 IP 智能探测当地法币，贴合生活常用认知）；② 统一结算货币（全球统一采用 USD；若您的本地货币本身即为美元或当地通行美元，则统一货币自适应切换为 HKD）。两者的价格档位严格与当地购买力平价（PPP）深度配合：本地货币以您所在地区“日常一杯真实咖啡”的价格阶梯进行设定；当您切换至统一货币时，该金额并非直接套用昂贵的美国本土定价，而是将当前本地购买力基准通过实时汇率换算并做整洁取整（统一货币美元在这里是作为换汇结算桥梁，其金额直接由当地购买力折算变动）。这确保无论您身处何地、使用何种币种结算，实际支持负担都处于最自然适度的舒适区间。',
    },
    {
      question: '通过微信、支付宝、PayPal 扫码后，如何出现在致谢名册中？与 Stripe 收银台有何区别？',
      answer:
        '两者在技术原理与到账链路上存在本质差异：① Stripe 国际收银台：资金流动是全自动的，直接连接 Cloudflare 边缘计算并记录真实的、精确到秒的瞬时 Webhook 更新。当您在 Stripe 完成支付后，系统瞬时记账并入库，您无需等待刷新即可在致谢名册中看到自己的名字与寄语；② 微信、支付宝、PayPal 等第三方：由于属于封闭式第三方支付生态，无法提供对外公开的瞬时 Webhook 自动化接入，只能依靠博主在收到官方通知后手动添加（作者会尽力将您的名称与寄语添加入榜单；如果核对发现可能存在遗漏，非常欢迎随时发送邮件至 shijianus@epocanvas.com，博主会第一时间补充）；③ Telegram 记账机器人：无论哪种渠道，Telegram Bot 都会自动同步、更新资金状态，确保每一笔钱都有真实、不可篡改的日志记录；④ 为什么专门提供原生二维码？因为国内微信、支付宝如果强行走 Stripe 国际聚合收银台，往往需要支付额外高昂的跨境手续费与清算磨损（通常高达 3.4% ~ 5%）。为了避免通道抽成，我们专门为这些常用平台给予原生免手续费 QR-Code，让支持者的每一分心意 100% 完整用于创作与技术投入。',
    },
    {
      question: '如果赞赏出现误操作或需要退款，该如何申请？支持原路退回吗？',
      answer:
        '赞赏支持纯属自愿，如果在操作过程中因网络卡顿、重复点击导致多次扣款，或者事后希望撤销赞赏，这是一个真实而正当的问题。我们对此秉持完全理解与负责的态度，并明确承诺：我们倾向于原路返回！如需申请退还，请发送邮件至博主邮箱：shijianus@epocanvas.com，并请提供以下核验材料：① 支付渠道（Stripe、微信支付、支付宝或 PayPal）；② 支付凭单或交易单号（如 Stripe 账单邮件中的 Receipt / PaymentIntent ID、微信转账单号、支付宝订单号等）；③ 付款时的称呼、支付时间及具体金额截图。博主在查阅邮件并确认账目后，将在后台系统发起原路退款操作，款项将退回至您的原支付账户或银行卡。由于个人独立维护精力有限，无法提供 24 小时即时客服，博主在 24~48 小时内核实邮件后会尽快跟进，感谢您的理解与耐心。',
    },
    {
      question: '赞赏支持能否提升我的社区等级 (LV) 或信任等级 (TL)？',
      answer:
        '完全不能，两者 100% 独立脱钩。本站读者成长体系（LV.0 至 LV.4）及信任等级（TL）纯粹由系统根据读者的实际阅读深度、评论交流质量、表情互动及活跃天数等客观行为指标自动计算（详见账号中心规则），绝无任何付费充值升级特权或商业通道。无论是否赞赏，所有读者在社区中均享有完全平等的阅读、评论与互动权益，赞赏纯粹属于读者对博主开源创作与技术投入的心意鼓励。',
    },
    {
      question: 'Web3 / USDT 加密货币赞赏支持哪些网络？如何核验与录入名册？',
      answer:
        '为了照顾重视链上隐私与国际极客读者的偏好，我们提供了 Arbitrum One EVM Layer 2 网络的 USDT 收款地址。Arbitrum 拥有以太坊同等级别安全性，且单笔 Gas 费通常低于 $0.01。转账完成后，您可将区块链交易哈希（TxHash）连同您希望公开展示的称呼与寄语发送邮件给博主。博主在区块链浏览器上查验到账后，将手动将您的信息收录至致谢名录中，并清晰标注“USDT (Arbitrum One)”。',
    },
    {
      question: '如果我想保持完全匿名可以吗？隐私与安全如何保障？',
      answer:
        '当然可以。在 Stripe 国际收银台或微信/支付宝转账附言中留空称呼与留言即可，系统将统一以“匿名支持者”形式收录致谢。在前台公开展示的支援名册中，绝不公开展示任何邮箱地址、信用卡号、网络 IP 地址或个人敏感信息。同时，Stripe 国际收银台采用金融级 PCI-DSS Level 1 加密沙箱结算，本站服务器完全无法获取且不存储任何银行卡数据，切实保障每一位支持者的数字隐私。',
    },
  ],
};

/**
 * 根据国家代码智能获取当地法币配置
 */
export function getLocalCurrencyByCountry(countryCode: string): CurrencyPresetConfig {
  const c = (countryCode || '').toUpperCase();
  const map: Record<string, string> = {
    CN: 'CNY',
    HK: 'HKD',
    MO: 'HKD',
    TW: 'TWD',
    US: 'USD',
    GB: 'GBP',
    JP: 'JPY',
    KR: 'KRW',
    SG: 'SGD',
    MY: 'MYR',
    TH: 'THB',
    CA: 'CAD',
    AU: 'AUD',
    NZ: 'AUD',
    CH: 'CHF',
    DE: 'EUR',
    FR: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    NL: 'EUR',
    AT: 'EUR',
    BE: 'EUR',
    FI: 'EUR',
    IE: 'EUR',
    PT: 'EUR',
    GR: 'EUR',
    // 本地法币废止或小众统一通行美元的地区
    EC: 'USD',
    SV: 'USD',
    PA: 'USD',
    AR: 'USD',
    CL: 'USD',
    CO: 'USD',
  };

  const currencyKey = map[c] || 'USD';
  return supportConfig.currencies[currencyKey] || supportConfig.currencies['USD'];
}

/**
 * 基于当地购买力（PPP）和汇率，将本地金额折算并整洁取整到目标统一结算货币
 */
export function convertByLocalPPP(
  amount: number,
  fromRateToUSD: number,
  toRateToUSD: number,
  targetCode: string,
): number {
  if (!amount || isNaN(amount) || amount <= 0) return 0;
  const usdValue = amount * fromRateToUSD;
  const targetValue = usdValue / toRateToUSD;

  // 零小数位货币 (JPY, KRW 等)
  if (['jpy', 'krw'].includes(targetCode.toLowerCase())) {
    return Math.round(targetValue / 10) * 10 || Math.round(targetValue);
  }

  if (targetValue >= 20) {
    return Math.round(targetValue);
  } else if (targetValue >= 1) {
    // 0.5 梯度步进取整 (例如 1, 1.5, 2, 2.5, 3, 3.5...)
    return Math.round(targetValue * 2) / 2;
  } else {
    // 0.1 梯度步进，最低 0.5 (保障满足 Stripe 最低收费线)
    return Math.max(0.5, Math.round(targetValue * 10) / 10);
  }
}
