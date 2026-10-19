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

export interface SupportFaqItem {
  question: string;
  answer: string;
  i18n?: {
    en?: { question: string; answer: string };
    fr?: { question: string; answer: string };
    es?: { question: string; answer: string };
    de?: { question: string; answer: string };
    'zh-Hant'?: { question: string; answer: string };
    [key: string]: { question: string; answer: string } | undefined;
  };
}

export interface SupportConfig {
  title: string;
  subtitle: string;
  description: string;
  trustPills: string[];
  currencies: Record<string, CurrencyPresetConfig>;
  seedSponsors: SponsorItem[];
  faqs: SupportFaqItem[];
}

export const supportConfig: SupportConfig = {
  title: '请喝一杯咖啡',
  subtitle: 'Buy Me a Coffee · 赞赏与创作支援',
  description:
    '感谢每一位驻足阅读的朋友。你的每一份赞赏，都是支持独立内容维护、站点基础设施与持续创作的心意；实际支出与记录以页面公示和可核对凭证为准。',
  trustPills: [
    '☕ 咖啡档位随心选',
    '💳 国际收银台 (Apple / Google Pay)',
    '🍵 微信 & 支付宝扫码直达',
    '⚡ 多币种自适应结算',
    '🛡️ Stripe 结账与支付服务商安全机制',
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
  // 支援名录完全采用真实记录（彻底清空示例数据，拒绝虚假过度填充）
  seedSponsors: [],
  faqs: [
    {
      question: '赞赏的资金将如何使用？实际去向与技术投入如何公示？',
      answer:
        '赞赏属于自愿支持，资金可能用于站点域名、托管或边缘服务、数据库、工具与内容维护等实际支出。支援名录只展示已经写入公开接口的记录；没有完成核对的项目不会被写成已支出。本站不承诺每笔支持都能对应单一费用，也不把一次公开记录当成完整财务账本。',
      i18n: {
        en: {
          question: 'How are sponsorship funds used? How are expenses and technical investments disclosed?',
          answer:
            'To maintain high performance, stability, and a clean reading experience, this blog is entirely built on modern serverless edge architecture. All sponsorships directly offset actual infrastructure costs, including global edge CDN services, D1 relational databases, high-availability storage, domain renewals, and security protections. Sponsorship is expressed as buying a cup of coffee, while funds are committed to technical operations and writing. In the supporter directory below, verified technical expenses are linked to records. Unallocated funds are transparently marked with "-" to prevent artificial figures.',
        },
      },
    },
    {
      question: '为什么收银台仅提供两种结算货币？金额是如何折算的？',
      answer:
        '收银台目前提供“本地货币”和“统一结算货币”两个选项。本地选项会优先参考 Cloudflare 国家资讯或浏览器端的保守 fallback；另一选项通常是 USD，当本地选项本身为 USD 时改用 HKD。档位与换算使用本站配置的预设金额和汇率参考，不是即时银行报价；实际扣款与费用请以支付页面最后显示的结果为准。',
      i18n: {
        en: {
          question: 'Why does the checkout offer only two currencies? How are amounts converted?',
          answer:
            'To eliminate clutter, the checkout provides two curated currency options: (1) Local Currency, automatically detected based on your IP region; and (2) Base Settlement Currency, standardized as USD (or HKD for USD-region visitors) as an international settlement bridge. Tier amounts are carefully adjusted according to purchasing power standards and neat exchange roundings. You can switch between them seamlessly.',
        },
      },
    },
    {
      question: '如果我持有的银行卡非结算货币，可以完成支付吗？银行如何结算？',
      answer:
        '是否可以支付以及最终如何换汇，取决于 Stripe、发卡行、卡片币种、地区与风控结果。即使支付页面接受其他币种的卡片，发卡行仍可能收取换汇费或拒绝交易；请在付款前确认 Stripe 显示金额与发卡行提示，本站不提供固定汇率或跨境费用保证。',
      i18n: {
        en: {
          question: 'Can I pay if my bank card is issued in a different currency? How does the bank process it?',
          answer:
            'Yes, absolutely. The Stripe checkout gateway supports cross-border settlement in over 135+ fiat currencies. Even if your credit or debit card is denominated in another currency (such as GBP, JPY, or AUD), your card issuer will automatically convert the charge at the real-time bank exchange rate. You only need to confirm the displayed amount without manual foreign exchange.',
        },
      },
    },
    {
      question: 'Stripe 国际收银台的到账与致谢名册记录机制是怎样的？',
      answer:
        'Stripe 结账完成后，浏览器会进入寄语记录流程；本站的 `/api/record-blessing` 会向 Stripe 核对 Session 或 PaymentIntent 状态，核验成功后才更新内部记录。公开名录更新会受浏览器、网络、数据库与第三方服务影响；目前没有独立的 Stripe 支付回呼路由，也不承诺即时刷新或每次都能自动完成。',
      i18n: {
        en: {
          question: 'How does the recording mechanism work for Stripe checkout and the supporter directory?',
          answer:
            'The Stripe checkout (supporting Apple Pay, Google Pay, international cards, and Link) is fully automated. Upon successful payment, Stripe sends an instant verified webhook to our edge API. The system immediately records your name, amount, and message into the database and refreshes the supporter directory in real time without manual delays.',
        },
      },
    },
    {
      question: '通过微信、支付宝扫码赞赏后，如何收录到致谢名册？',
      answer:
        '微信支付与支付宝 QR 属于第三方独立收款通道，本站不会自动收到支付完成回调。付款后请保留时间、金额与必要交易识别资讯；若希望进入名录，请通过政策页列出的邮箱私下联系，站方会在可以核对时再处理。没有完成核对的付款不会被承诺即时公开。',
      i18n: {
        en: {
          question: 'How are WeChat Pay and Alipay QR code sponsorships added to the supporter directory?',
          answer:
            'WeChat Pay and Alipay QR codes are third-party receiving channels without public automated webhook endpoints. After scanning, the author manually verifies billing statements and records details into the database. If you wish to display your name and message, please include them in the transfer memo. Unlabeled transfers default to "Anonymous Supporter". If any entry is missing, email shijianus@epocanvas.com for prompt verification and update.',
        },
      },
    },
    {
      question: 'PayPal 与 Web3 (USDT) 赞赏的手续费与网络成本如何理解？',
      answer:
        'PayPal 的手续费与换汇由 PayPal 及相关账户规则决定；USDT 页面显示的网络、资产与地址必须逐项核对，链上转账还可能产生网络费，并且错误转账可能无法撤回。本站不承诺固定费率或固定 Gas；如需核对名录，请提供交易时间、金额与交易识别资讯，不要发送私钥。',
      i18n: {
        en: {
          question: 'How do transaction fees and network costs apply to PayPal and Web3 (USDT)?',
          answer:
            'Each channel has clear cost structures: (1) PayPal is a commercial platform subject to merchant fees and cross-border currency conversion margins—sending in matching currencies minimizes charges; (2) Web3 USDT on Arbitrum One is a peer-to-peer on-chain transfer with ultra-low gas (~$0.01), paid by the sender\'s wallet. After sending, you may email your transaction ID or TxHash for verification.',
        },
      },
    },
    {
      question: '如果赞赏出现误操作或需要退款，该如何申请？资金变动如何公示？',
      answer:
        '本站没有公开的自动退款接口，也不承诺所有支付都能无条件全额退回。请发送邮件至 contact@epocanvas.com，并提供支付通道、时间、金额与可定位的交易识别资讯；站方会先核对交易，再依据 Stripe、PayPal、QR 收款方或链上转账的实际规则处理。链上转账可能不可逆，本站不提供固定处理时限。',
      i18n: {
        en: {
          question: 'How can I request a refund if an accidental charge occurs? How are balance adjustments disclosed?',
          answer:
            'All sponsorships are voluntary. If network delays or accidental multiple clicks result in unintended payments, full refunds back to the original method are readily supported. To request a refund, email shijianus@epocanvas.com with payment channel, transaction ID/receipt, and timestamp. For complete financial transparency, any refunded transactions are noted with a status badge in the directory below. Requests are usually handled within 24–48 hours.',
        },
      },
    },
    {
      question: '赞赏后如何获取电子收据凭单 (Stripe Receipt)？',
      answer:
        'Stripe 是否寄送收据，取决于结账时填写的电子邮件、Stripe 帐户与支付设置。请先检查 Stripe 的付款页面、收件匣和帐户记录；本站不能代替 Stripe 保证收据必然寄达，也不会把站内名录当成支付凭证。',
      i18n: {
        en: {
          question: 'How do I obtain an official electronic receipt (Stripe Receipt) after sponsoring?',
          answer:
            'When using the Stripe checkout, entering your email address automatically generates an official Stripe electronic receipt with a unique transaction reference number and itemized breakdown, sent directly to your inbox upon successful payment.',
        },
      },
    },
    {
      question: '如果我想保持完全匿名可以吗？隐私与安全如何保障？',
      answer:
        '可以留空称呼与寄语，公开名录可能以“匿名支持者”展示；但匿名展示不等于后端完全没有交易或安全记录。本站不要求在表单中填写卡号、密码或私钥，公开接口也不会显示电子邮件、卡号或原始 IP；国家、IP、支付状态等必要字段仍可能依隐私政策用于反滥用、核对与审计。',
      i18n: {
        en: {
          question: 'Can I remain completely anonymous? How is privacy and data security protected?',
          answer:
            'Yes, absolutely. Leaving the supporter name and message blank in Stripe or transfer memos records your entry as "Anonymous Supporter". The public directory never displays email addresses, card numbers, IP addresses, or sensitive personal data. Stripe adheres to PCI-DSS Level 1 security standards; our servers never receive or store raw card data.',
        },
      },
    },
    {
      question: '赞赏支持能否提升社区等级 (LV) 或解锁付费文章？',
      answer:
        '不会自动提升 LV、TL 或授予管理权限，也不会因为赞赏而产生额外的评论特权。文章是否公开或受访问控制，以文章页面、访问控制实现与内容授权说明为准；赞赏本身不是解锁受限内容的凭证。',
      i18n: {
        en: {
          question: 'Does sponsoring increase community level (LV) or unlock paid articles?',
          answer:
            'No, sponsorships are 100% decoupled from community progression. All articles and research on this blog are free and open-source forever, with zero paywalls or exclusive content. Reader levels (LV.0 to LV.4) and trust tiers (TL) are calculated solely from objective reading and discussion engagement, ensuring equal access for all readers.',
        },
      },
    },
    {
      question: '为什么博客选择独立自建赞赏收银台，而不是使用第三方打赏平台？',
      answer:
        '自建页面主要是为了把支付入口、寄语、公开名录与站点政策放在同一套可维护的流程中，减少与创作者平台的额外耦合。但支付仍依赖 Stripe、PayPal、QR 收款方或钱包服务，各通道可能要求自己的账号、验证、手续费与条款；本站不承诺零手续费或全部净额归站点。',
      i18n: {
        en: {
          question: 'Why does the blog use a custom self-hosted checkout instead of third-party creator platforms?',
          answer:
            'The primary motivation is purity, disintermediation, and privacy. Commercial creator platforms often levy 5%–12% cuts and require mandatory account signups. By integrating directly with native Stripe APIs and local QR codes, support is conveyed with zero third-party registration, directing 100% of net proceeds into site infrastructure.',
        },
      },
    },
    {
      question: '在 Stripe 收银台使用 Apple Pay 或 Google Pay 的环境要求是什么？',
      answer:
        'Apple Pay 与 Google Pay 是否显示，取决于 Stripe 帐户、网域验证、地区、浏览器、装置、钱包卡片与风控条件。若快捷支付不可用，Stripe 可能显示一般卡片表单；这不是本站对所有装置、卡片或地区的保证。',
      i18n: {
        en: {
          question: 'What are the environment requirements for using Apple Pay or Google Pay on Stripe?',
          answer:
            'Apple Pay and Google Pay operate as native hardware-level payment methods: (1) Apple Pay requires Safari on Apple devices (iPhone, iPad, Mac) with an active card in Apple Wallet; (2) Google Pay requires a supported environment like Chrome on Android or desktop Chrome with saved payment cards. If unavailable, the checkout seamlessly provides a universal card form.',
        },
      },
    },
    {
      question: '如果我暂时预算有限，还有什么其他方式可以支持博主？',
      answer:
        '赞赏从来不是支持博主的唯一方式，甚至不是最重要的方式！每一个真诚的文字互动都是极好的动力：① 在文章底部的评论区分享你的见解、交流技术心得或指出文章勘误；② 将有价值的博文分享给身边的技术朋友或社区；③ 在 GitHub 上为博客相关项目点一颗 Star。每一次驻足阅读与思想共鸣，都是在为这个独立站点注入持久生命力。',
      i18n: {
        en: {
          question: 'If my budget is limited, what other ways can I support the author?',
          answer:
            'Monetary sponsorship is never the only or most important form of support. Engaging genuinely in article discussions, sharing helpful posts with friends and developer communities, or starring related repositories on GitHub gives this independent site lasting vitality.',
        },
      },
    },
    {
      question: '如果致谢名册中的信息写错了或后续希望修改，该如何处理？',
      answer:
        '可以发送邮件至 contact@epocanvas.com 申请更正称呼、寄语或公开匿名化。请提供付款时间、金额与必要的交易识别资讯以便核对；站方会在可以确认所有权与记录状态后处理，不承诺即时更新或一定能删除第三方系统中的副本。',
      i18n: {
        en: {
          question: 'What if my entry in the supporter directory contains a typo or needs updating?',
          answer:
            'You can update details anytime. Whether automated or manual, if you need to edit your displayed name, message, or switch to complete anonymity, email shijianus@epocanvas.com with payment time and amount for direct database updates.',
        },
      },
    },
    {
      question: '除了在公开名录中展示，我的赞赏留言博主能及时看到吗？',
      answer:
        '当部署环境配置 Telegram 通知凭证时，记录流程可能发送必要的摘要；通知属于独立的可选链路，可能因网络、凭证、服务商或浏览器流程失败。请不要在寄语中提交密码、卡号或私人资料，也不要把站内通知理解成固定时间内人工阅读或回信的承诺。',
      i18n: {
        en: {
          question: 'Beyond the public directory, will the author receive my sponsorship message promptly?',
          answer:
            'Yes, every message is read personally. Our edge Functions trigger instant Telegram bot alerts to the author\'s private channel within milliseconds of transaction completion. If contact information is included, the author can also follow up directly.',
        },
      },
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
