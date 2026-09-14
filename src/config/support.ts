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
      min: 100,
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
      min: 30,
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
      min: 1000,
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
      min: 30,
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
        '为了维持博客高速、稳定与纯粹的阅读与交互体验，本博客完全基于现代化 Serverless 边缘架构自建。所有赞赏资金主要用于承担站点基础设施的实际开销，包括全球 CDN 边缘算力服务、D1 关系型数据库、高可用存储、顶级域名续费及网络安全防护等。赞赏在形式上是请博主喝一杯咖啡的心意表达，实际资金均投入于真实的技术运维与创作。我们致力于公开透明，在下方“支援名录与资金公示”中，我们会将真实发生的技术支出（如云服务续费、API 算力工具等）与支持记录进行关联展示；尚未实际使用的资金或尚在流转的部分，均在名录中使用“-”严格标注，杜绝虚假记录。',
    },
    {
      question: '为什么收银台仅提供两种结算货币？金额是如何折算的？',
      answer:
        '为了避免过多币种带来的选择干扰，收银台仅提供两款货币选项：① 本地货币：系统基于您当前访问的网络 IP 智能推荐您所在地区的当地法币；② 统一结算货币：全球统一采用 USD（若本地货币本身为美元区，则自适应切换为 HKD）作为国际结算桥梁。各档位金额根据对应货币的当前汇率与对应档位换算并做整洁取整（最低金额严格不低于 1 当前货币单位，上限以 1,000 HKD 等价货币取整化 0 为准）。支持者可根据自己的付款习惯自由切换选择。',
    },
    {
      question: 'Stripe 国际收银台的到账与致谢名册记录机制是怎样的？',
      answer:
        'Stripe 国际收银台（支持 Apple Pay、Google Pay、国际信用卡及 Link 快捷支付）全流程采用自动化链路。当您在收银台完成支付后，Stripe 会通过安全 Webhook 即时向站点边缘接口发送履约通知，系统会自动将您的称呼、金额与寄语记录入库并即时更新至下方支援名册中，无需人工介入等待。',
    },
    {
      question: '通过微信、支付宝扫码赞赏后，如何收录到致谢名册？',
      answer:
        '微信支付与支付宝赞赏码属于第三方独立收款通道，无法向本站提供对外公开的实时 Webhook 自动化接口。因此，扫码赞赏后需要博主在核对官方账单到账后，手动将您的信息录入至下方支援名册。若希望在名录中展示您的昵称与祝福，请在转账时于附言中备注；若转账时未填写备注，系统将默认以“匿名支持者”收录。如核对发现遗漏，欢迎随时发送邮件至 shijianus@epocanvas.com，博主会在查验后及时补充。',
    },
    {
      question: 'Telegram 机器人的通知与数据存储机制是怎样的？',
      answer:
        'Telegram 机器人仅作为博主本人的实时消息提醒终端。当有新的赞赏事件或留言发生时，系统边缘函数会单向向博主绑定的 Telegram 推送一条即时通知。Telegram 内部并不存储、维护任何资金账本或用户敏感隐私，管理员也无权且无法篡改系统接入的真实交易数据。所有致谢记录均以数据库记录为准并在前台公开展示。',
    },
    {
      question: 'PayPal 与 Web3 (USDT) 赞赏的手续费与网络成本如何理解？',
      answer:
        '各个支付通道均存在其客观的规则与成本，本站绝不作“完全免手续费”的虚假承诺：① PayPal 属于国际商业支付平台，转账通常存在平台手续费或跨境汇率折算损耗，使用个人亲友（Friends & Family）方式转账可在符合规则的前提下降低平台抽成；② Web3 USDT（Arbitrum One 网络）属于点对点去中心化链上转账，虽然 Arbitrum 的网络拥堵费极低（通常单笔 Gas 费低于 $0.01），但发起方钱包仍需承担该笔链上矿工费。转账完成后，您可将交易单号或 TxHash 发送邮件告知博主以便核对收录。',
    },
    {
      question: '如果赞赏出现误操作或需要退款，该如何申请？',
      answer:
        '赞赏支持纯属自愿心意。如果在操作过程中因网络延迟、重复点击导致多次扣款，或者因误操作希望撤销赞赏，博主完全支持原路退回。申请退款请发送邮件至 shijianus@epocanvas.com，并请提供：① 支付渠道（Stripe、微信、支付宝或 PayPal）；② 支付凭单或交易单号（如 Stripe Receipt、微信/支付宝转账单号等）；③ 付款时间与金额。博主查阅邮件核对账目后会在后台发起原路退款。因个人精力有限，邮件通常在 24~48 小时内处理，敬请理解。',
    },
    {
      question: '赞赏支持能否提升社区等级 (LV) 或信任等级 (TL)？',
      answer:
        '完全不能，赞赏支持与社区等级 100% 独立脱钩。本站读者成长体系（LV.0 至 LV.4）与信任等级（TL）完全由系统根据读者的实际阅读深度、评论交流质量与日常互动等客观行为指标自动计算，绝无任何付费充值或赞赏特权通道。所有读者在社区中均享有完全平等的阅读、评论与互动权益。',
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
 * 最低金额严格保底为 1，杜绝任何货币小于 1 的情况；
 * 上限以 1000 HKD 等价货币的取整化 0 为准
 */
export function convertByLocalPPP(
  amount: number,
  fromRateToUSD: number,
  toRateToUSD: number,
  targetCode: string,
): number {
  if (!amount || isNaN(amount) || amount <= 0) return 1;
  const usdValue = amount * fromRateToUSD;
  const targetValue = usdValue / toRateToUSD;

  // 零小数位货币 (JPY, KRW 等)
  if (['jpy', 'krw'].includes(targetCode.toLowerCase())) {
    return Math.max(100, Math.round(targetValue / 10) * 10 || Math.round(targetValue));
  }

  if (targetValue >= 20) {
    return Math.round(targetValue);
  } else if (targetValue >= 1) {
    // 0.5 梯度步进取整 (例如 1, 1.5, 2, 2.5, 3, 3.5...)
    return Math.max(1, Math.round(targetValue * 2) / 2);
  } else {
    // 最低金额严格保底为 1，杜绝任何打赏货币小于 1 的情况
    return 1;
  }
}
