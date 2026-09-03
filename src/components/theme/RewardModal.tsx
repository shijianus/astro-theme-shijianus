/**
 * RewardModal — Stripe Checkout Sessions (Embedded) 集成
 * 使用最新 Stripe Embedded Checkout API
 * 货币根据 IP 自动本地化（覆盖全球30+主要货币）
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Loader2,
  CheckCircle2,
  Sparkles,
  Send,
  ChevronLeft,
} from 'lucide-react';

/* ── Stripe lazy load ──────────────────────────────────────────────────────── */
let stripePromise: Promise<any> | null = null;
async function getStripe(publishableKey: string): Promise<any> {
  if (!stripePromise) {
    const { loadStripe } = await import('@stripe/stripe-js');
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

/* ── Zero-decimal currencies (Stripe official list) ───────────────────────── */
const ZERO_DECIMAL = new Set([
  'bif','clp','djf','gnf','jpy','kmf','krw','mga',
  'pyg','rwf','ugx','vnd','xaf','xof','xpf',
]);

/* ── Currency config ───────────────────────────────────────────────────────── */
interface CurrencyConfig {
  code: string;    // Stripe lowercase currency code
  symbol: string;  // display symbol
  amounts: [number, number, number, number, number, number]; // preset amounts (6 values)
  min: number;     // minimum allowed amount (human units, >= 1 HKD eq)
  max: number;     // maximum allowed amount (human units, <= 1000 HKD eq)
}

/** All major Stripe-supported currencies by country code */
const COUNTRY_CURRENCY: Record<string, CurrencyConfig> = {
  // ── East Asia ──────────────────────────────────────────────────────────────
  CN: { code: 'cny', symbol: '¥',   amounts: [4, 9, 14, 16, 20, 25],               min: 1,   max: 930   },
  HK: { code: 'hkd', symbol: 'HK$', amounts: [15, 25, 40, 60, 80, 120],            min: 1,   max: 1000  },
  MO: { code: 'hkd', symbol: 'HK$', amounts: [15, 25, 40, 60, 80, 120],            min: 1,   max: 1000  }, // Macao → HKD
  TW: { code: 'twd', symbol: 'NT$', amounts: [35, 55, 80, 120, 160, 220],          min: 5,   max: 4100  },
  JP: { code: 'jpy', symbol: '¥',   amounts: [120, 250, 450, 680, 1100, 1300],     min: 50,  max: 20000 },
  KR: { code: 'krw', symbol: '₩',   amounts: [1500, 3500, 4700, 6000, 7000, 9000], min: 500, max: 175000},

  // ── Southeast Asia ─────────────────────────────────────────────────────────
  MY: { code: 'myr', symbol: 'RM',  amounts: [3, 8, 13, 17, 20, 25],               min: 1,   max: 570   },
  SG: { code: 'sgd', symbol: 'S$',  amounts: [3, 5, 7, 10, 15, 25],                min: 1,   max: 170   },
  TH: { code: 'thb', symbol: '฿',   amounts: [40, 60, 90, 120, 180, 250],          min: 10,  max: 4500  },
  ID: { code: 'idr', symbol: 'Rp',  amounts: [15000, 25000, 40000, 65000, 100000, 150000], min: 10000, max: 2000000 },
  PH: { code: 'php', symbol: '₱',   amounts: [50, 80, 120, 180, 250, 350],         min: 30,  max: 7000  },
  VN: { code: 'vnd', symbol: '₫',   amounts: [25000, 45000, 70000, 100000, 150000, 250000], min: 12000, max: 3200000 }, // zero-decimal
  BN: { code: 'sgd', symbol: 'S$',  amounts: [3, 5, 7, 10, 15, 25],                min: 1,   max: 170   }, // Brunei → SGD

  // ── South Asia ─────────────────────────────────────────────────────────────
  IN: { code: 'inr', symbol: '₹',   amounts: [100, 160, 250, 400, 650, 1000],      min: 50,  max: 11000 },
  LK: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   }, // Sri Lanka → USD

  // ── Oceania ────────────────────────────────────────────────────────────────
  AU: { code: 'aud', symbol: 'A$',  amounts: [3, 5, 7, 10, 15, 25],                min: 1,   max: 200   },
  NZ: { code: 'nzd', symbol: 'NZ$', amounts: [3, 5, 7, 10, 15, 25],                min: 1,   max: 220   },

  // ── North America ──────────────────────────────────────────────────────────
  US: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   },
  CA: { code: 'cad', symbol: 'CA$', amounts: [3, 5, 7, 10, 15, 25],                min: 1,   max: 180   },
  MX: { code: 'mxn', symbol: 'MX$', amounts: [35, 55, 80, 120, 180, 250],          min: 20,  max: 2600  },

  // ── South & Central America ────────────────────────────────────────────────
  BR: { code: 'brl', symbol: 'R$',  amounts: [10, 18, 25, 40, 60, 90],             min: 3,   max: 750   },
  AR: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   }, // ARS too volatile → USD
  CL: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   }, // CLP is zero-decimal → USD simpler
  CO: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   },

  // ── United Kingdom ─────────────────────────────────────────────────────────
  GB: { code: 'gbp', symbol: '£',   amounts: [1.5, 2.5, 3.5, 5, 7, 10],            min: 1,   max: 100   },

  // ── Nordic ─────────────────────────────────────────────────────────────────
  SE: { code: 'sek', symbol: 'kr',  amounts: [25, 40, 60, 90, 130, 180],           min: 3,   max: 1350  },
  NO: { code: 'nok', symbol: 'kr',  amounts: [25, 40, 60, 90, 130, 180],           min: 3,   max: 1400  },
  DK: { code: 'dkk', symbol: 'kr.', amounts: [18, 28, 42, 65, 90, 130],            min: 2,   max: 900   },
  IS: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   },

  // ── Non-Euro Europe ────────────────────────────────────────────────────────
  CH: { code: 'chf', symbol: 'Fr.', amounts: [2.5, 4, 6, 9, 14, 20],               min: 1,   max: 115   },
  PL: { code: 'pln', symbol: 'zł',  amounts: [8, 14, 20, 32, 50, 75],              min: 2,   max: 520   },
  CZ: { code: 'czk', symbol: 'Kč',  amounts: [45, 75, 110, 160, 240, 350],         min: 15,  max: 3000  },
  HU: { code: 'huf', symbol: 'Ft',  amounts: [500, 900, 1500, 2500, 4000, 6000],   min: 175, max: 48000 },
  RO: { code: 'ron', symbol: 'lei', amounts: [8, 14, 20, 32, 50, 75],              min: 2,   max: 600   },
  TR: { code: 'try', symbol: '₺',   amounts: [40, 70, 110, 160, 240, 350],         min: 10,  max: 4500  },
  UA: { code: 'uah', symbol: '₴',   amounts: [50, 90, 140, 200, 300, 450],         min: 20,  max: 5300  },
  RS: { code: 'rsd', symbol: 'din', amounts: [150, 280, 450, 700, 1100, 1600],     min: 60,  max: 14000 },
  BG: { code: 'bgn', symbol: 'лв.', amounts: [3, 5, 8, 12, 18, 25],                min: 1,   max: 235   },
  HR: { code: 'eur', symbol: '€',   amounts: [2, 3, 5, 7, 10, 15],                 min: 1,   max: 120   }, // Croatia uses EUR since 2023

  // ── Middle East ────────────────────────────────────────────────────────────
  AE: { code: 'aed', symbol: 'AED', amounts: [8, 14, 20, 30, 45, 65],              min: 2,   max: 470   },
  SA: { code: 'sar', symbol: 'SAR', amounts: [8, 14, 20, 30, 45, 65],              min: 2,   max: 480   },
  IL: { code: 'ils', symbol: '₪',   amounts: [8, 14, 20, 30, 45, 65],              min: 2,   max: 470   },
  QA: { code: 'qar', symbol: 'QAR', amounts: [8, 14, 20, 30, 45, 65],              min: 2,   max: 470   },
  KW: { code: 'kwd', symbol: 'KWD', amounts: [0.8, 1.5, 2.5, 4, 6, 9],             min: 1,   max: 40    },
  BH: { code: 'bhd', symbol: 'BHD', amounts: [0.8, 1.5, 2.5, 4, 6, 9],             min: 1,   max: 48    },
  OM: { code: 'omr', symbol: 'OMR', amounts: [0.8, 1.5, 2.5, 4, 6, 9],             min: 1,   max: 49    },
  JO: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   },

  // ── Africa ─────────────────────────────────────────────────────────────────
  ZA: { code: 'zar', symbol: 'R',   amounts: [20, 35, 55, 85, 130, 190],           min: 5,   max: 2400  },
  NG: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   },
  KE: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   },
  GH: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   },
  EG: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   },
  MA: { code: 'usd', symbol: '$',   amounts: [2, 3, 5, 7, 10, 20],                 min: 1,   max: 130   },
};

/** Euro-zone countries (all map to EUR) */
const EUR_ZONE = new Set([
  'DE','FR','IT','ES','NL','PT','BE','AT','GR','FI',
  'IE','LU','MT','CY','SK','SI','EE','LV','LT','MC',
  'SM','VA','AD','XK',
]);

const EUR_CONFIG: CurrencyConfig = {
  code: 'eur', symbol: '€', amounts: [2, 3, 5, 7, 10, 15], min: 1, max: 120,
};

const DEFAULT_CONFIG: CurrencyConfig = {
  code: 'usd', symbol: '$', amounts: [2, 3, 5, 7, 10, 20], min: 1, max: 130,
};

function detectCountryFromClient(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Kuala_Lumpur') || tz.includes('Kuching')) return 'MY';
    if (tz.includes('Tokyo')) return 'JP';
    if (tz.includes('London')) return 'GB';
    if (tz.includes('Seoul')) return 'KR';
    if (tz.includes('Shanghai') || tz.includes('Chongqing') || tz.includes('Urumqi') || tz.includes('Harbin') || tz.includes('Beijing')) return 'CN';
    if (tz.includes('Hong_Kong')) return 'HK';
    if (tz.includes('Taipei')) return 'TW';
    if (tz.includes('Singapore')) return 'SG';
    if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Brisbane') || tz.includes('Perth')) return 'AU';
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal')) return 'CA';
    if (tz.includes('Berlin') || tz.includes('Paris') || tz.includes('Rome') || tz.includes('Madrid') || tz.includes('Amsterdam') || tz.includes('Vienna') || tz.includes('Brussels') || tz.includes('Athens') || tz.includes('Dublin') || tz.includes('Helsinki') || tz.includes('Lisbon')) return 'DE';
    if (tz.startsWith('America/')) return 'US';
  } catch {}
  return 'US';
}

function getCurrencyConfig(country: string): CurrencyConfig {
  if (EUR_ZONE.has(country)) return EUR_CONFIG;
  return COUNTRY_CURRENCY[country] ?? DEFAULT_CONFIG;
}

/* ── Amount formatter ──────────────────────────────────────────────────────── */
function fmtAmt(amount: number, cfg: CurrencyConfig): string {
  if (ZERO_DECIMAL.has(cfg.code) || cfg.code === 'idr') {
    return `${cfg.symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${cfg.symbol}${Number.isInteger(amount) ? amount : amount.toFixed(1)}`;
}

/* ── Stripe SVG Logo ───────────────────────────────────────────────────────── */
const StripeWordmark: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-auto' }) => (
  <svg
    viewBox="54 36 360 150"
    fill="currentColor"
    className={className}
    aria-label="Stripe"
  >
    <path d="M414,113.4c0-25.6-12.4-45.8-36.1-45.8c-23.8,0-38.2,20.2-38.2,45.6c0,30.1,17,45.3,41.4,45.3 c11.9,0,20.9-2.7,27.7-6.5v-20c-6.8,3.4-14.6,5.5-24.5,5.5c-9.7,0-18.3-3.4-19.4-15.2h48.9C413.8,121,414,115.8,414,113.4z M364.6,103.9c0-11.3,6.9-16,13.2-16c6.1,0,12.6,4.7,12.6,16H364.6z" />
    <path d="M301.1,67.6c-9.8,0-16.1,4.6-19.6,7.8l-1.3-6.2h-22v116.6l25-5.3l0.1-28.3c3.6,2.6,8.9,6.3,17.7,6.3 c17.9,0,34.2-14.4,34.2-46.1C335.1,83.4,318.6,67.6,301.1,67.6z M295.1,136.5c-5.9,0-9.4-2.1-11.8-4.7l-0.1-37.1 c2.6-2.9,6.2-4.9,11.9-4.9c9.1,0,15.4,10.2,15.4,23.3C310.5,126.5,304.3,136.5,295.1,136.5z" />
    <polygon points="223.8,61.7 248.9,56.3 248.9,36 223.8,41.3" />
    <rect x="223.8" y="69.3" width="25.1" height="87.5" />
    <path d="M196.9,76.7l-1.6-7.4h-21.6v87.5h25V97.5c5.9-7.7,15.9-6.3,19-5.2v-23C214.5,68.1,202.8,65.9,196.9,76.7z" />
    <path d="M146.9,47.6l-24.4,5.2l-0.1,80.1c0,14.8,11.1,25.7,25.9,25.7c8.2,0,14.2-1.5,17.5-3.3V135 c-3.2,1.3-19,5.9-19-8.9V90.6h19V69.3h-19L146.9,47.6z" />
    <path d="M79.3,94.7c0-3.9,3.2-5.4,8.5-5.4c7.6,0,17.2,2.3,24.8,6.4V72.2c-8.3-3.3-16.5-4.6-24.8-4.6 C67.5,67.6,54,78.2,54,95.9c0,27.6,38,23.2,38,35.1c0,4.6-4,6.1-9.6,6.1c-8.3,0-18.9-3.4-27.3-8v23.8c9.3,4,18.7,5.7,27.3,5.7 c20.8,0,35.1-10.3,35.1-28.2C117.4,100.6,79.3,105.9,79.3,94.7z" />
  </svg>
);

const AppleIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-label="Apple Pay">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-label="Google Pay">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const StripeLinkIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-label="Link by Stripe">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

/* ── I18N Dictionary ───────────────────────────────────────────────────────── */
type LocaleKey = 'zh-CN' | 'zh-Hant' | 'en';

const I18N = {
  'zh-CN': {
    title: '赞赏支持',
    checkoutTitle: '安全结账',
    successTitle: '感谢支持',
    subtitleAmount: '信用卡 · Apple Pay · Google Pay · Link',
    subtitleCheckout: '由 Stripe 安全处理',
    subtitleSuccess: '您的赞赏已成功送达 ❤️',
    customPlaceholder: (min: string, max: string) => `自定义金额（${min} ~ ${max}）`,
    minError: (min: string) => `最低金额为 ${min}（约等值 1 HKD）`,
    maxError: (max: string) => `最高金额不能超过 ${max}（约等值 1,000 HKD）`,
    continueBtn: (amt: string) => `继续 — ${amt}`,
    processing: '处理中…',
    connectingStripe: '正在连接 Stripe 安全收银台…',
    successMsg: '赞赏成功，非常感谢！',
    leaveBlessing: '留下您的寄语（将推送给作者）',
    namePlaceholder: '称呼或社交账号（选填）',
    msgPlaceholder: '写下想对作者说的话…（选填）',
    sendBlessing: '发送寄语',
    done: '完成',
    blessingDelivered: '寄语已送达 ✨',
    blessingDeliveredSub: '感谢每一次陪伴，这是创作最大的动力。',
    privacyNote: '本站不存储任何支付卡号及隐私信息 · 结算由 Stripe 端到端加密处理',
    securedBy: 'Secured by',
    rewardRecords: '赞赏记录 ↗',
  },
  'zh-Hant': {
    title: '讚賞支持',
    checkoutTitle: '安全結賬',
    successTitle: '感謝支持',
    subtitleAmount: '信用卡 · Apple Pay · Google Pay · Link',
    subtitleCheckout: '由 Stripe 安全處理',
    subtitleSuccess: '您的讚賞已成功送達 ❤️',
    customPlaceholder: (min: string, max: string) => `自訂金額（${min} ~ ${max}）`,
    minError: (min: string) => `最低金額為 ${min}（約等值 1 HKD）`,
    maxError: (max: string) => `最高金額不能超過 ${max}（約等值 1,000 HKD）`,
    continueBtn: (amt: string) => `繼續 — ${amt}`,
    processing: '處理中…',
    connectingStripe: '正在連接 Stripe 安全收銀台…',
    successMsg: '讚賞成功，非常感謝！',
    leaveBlessing: '留下您的寄語（將推送給作者）',
    namePlaceholder: '稱呼或社交帳號（選填）',
    msgPlaceholder: '寫下想對作者說的話…（選填）',
    sendBlessing: '發送寄語',
    done: '完成',
    blessingDelivered: '寄語已送達 ✨',
    blessingDeliveredSub: '感謝每一次陪伴，這是創作最大的動力。',
    privacyNote: '本站不儲存任何支付卡號及隱私資訊 · 結算由 Stripe 端到端加密處理',
    securedBy: 'Secured by',
    rewardRecords: '讚賞記錄 ↗',
  },
  'en': {
    title: 'Support Creator',
    checkoutTitle: 'Secure Checkout',
    successTitle: 'Thank You',
    subtitleAmount: 'Cards · Apple Pay · Google Pay · Link',
    subtitleCheckout: 'Secured by Stripe',
    subtitleSuccess: 'Your support has been received ❤️',
    customPlaceholder: (min: string, max: string) => `Custom amount (${min} ~ ${max})`,
    minError: (min: string) => `Minimum amount is ${min} (≈ 1 HKD)`,
    maxError: (max: string) => `Maximum amount is ${max} (≈ 1,000 HKD)`,
    continueBtn: (amt: string) => `Continue — ${amt}`,
    processing: 'Processing…',
    connectingStripe: 'Connecting to Stripe Checkout…',
    successMsg: 'Payment successful, thank you!',
    leaveBlessing: 'Leave a message (sent to author)',
    namePlaceholder: 'Name or handle (optional)',
    msgPlaceholder: 'Write a note to the author… (optional)',
    sendBlessing: 'Send Message',
    done: 'Done',
    blessingDelivered: 'Message delivered ✨',
    blessingDeliveredSub: 'Thank you for your support and encouragement!',
    privacyNote: 'No card or personal data is stored · Processed securely via Stripe',
    securedBy: 'Secured by',
    rewardRecords: 'Donation Log ↗',
  },
};

/* ── Props ─────────────────────────────────────────────────────────────────── */
interface RewardModalProps {
  stripePublishableKey?: string;
  publishableKey?: string;
  defaultAmount?: number;
  arbitrumAddress?: string;
  trc20Address?: string;
  erc20Address?: string;
  paypalMeUrl?: string;
  paypalUkMeUrl?: string;
}

/* ── Component ─────────────────────────────────────────────────────────────── */
export const RewardModal: React.FC<RewardModalProps> = ({
  stripePublishableKey,
  publishableKey,
}) => {
  const resolvedKey = stripePublishableKey || publishableKey || '';

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'amount' | 'checkout' | 'success'>('amount');

  const [country, setCountry]           = useState('');
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(DEFAULT_CONFIG);
  const [localeVariant, setLocaleVariant]   = useState<LocaleKey>('zh-CN');

  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount]     = useState('');
  const [isCustomMode, setIsCustomMode]     = useState(false);

  const [clientSecret, setClientSecret] = useState('');
  const [sessionId, setSessionId]       = useState('');
  const [paidAmount, setPaidAmount]     = useState(0);

  const [isCreating, setIsCreating]   = useState(false);
  const [createError, setCreateError] = useState('');
  const [checkoutReady, setCheckoutReady] = useState(false);

  const [donorName, setDonorName]         = useState('');
  const [donorMsg, setDonorMsg]           = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [blessingDone, setBlessingDone]   = useState(false);

  const checkoutRef = useRef<HTMLDivElement>(null);
  const checkoutInstanceRef = useRef<any>(null);
  const pendingNotificationRef = useRef(false);

  /* current amount (derived) */
  const currentAmount = isCustomMode
    ? (parseFloat(customAmount) || 0)
    : (selectedAmount || currencyConfig.amounts[1]);

  const isCustomInvalid = isCustomMode && (
    isNaN(currentAmount) ||
    currentAmount < currencyConfig.min ||
    currentAmount > currencyConfig.max
  );

  const t = I18N[localeVariant] || I18N['zh-CN'];

  /* ── 0. Synchronize Locale Variant ────────────────────────────────────────── */
  useEffect(() => {
    const updateLocale = () => {
      const v = (document.documentElement.dataset.localeVariant || 'zh-CN') as LocaleKey;
      if (v === 'zh-Hant' || v === 'en') {
        setLocaleVariant(v);
      } else {
        setLocaleVariant('zh-CN');
      }
    };
    updateLocale();

    const onLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const next = customEvent.detail as LocaleKey;
      if (next === 'zh-Hant' || next === 'en') setLocaleVariant(next);
      else setLocaleVariant('zh-CN');
    };
    window.addEventListener('shijianus:localechange', onLocaleChange as EventListener);
    return () => window.removeEventListener('shijianus:localechange', onLocaleChange as EventListener);
  }, []);

  /* ── 1. On mount: detect stripe_return + geo ──────────────────────────── */
  useEffect(() => {
    // Detect return from Stripe Checkout (fallback for external redirects)
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_return') === '1') {
      const sid  = params.get('session_id') || '';
      const amt  = parseFloat(params.get('amount') || '0') || 5;
      setSessionId(sid);
      setPaidAmount(amt);
      pendingNotificationRef.current = true;
      setStep('success');
      setIsOpen(true);
      const clean = new URL(window.location.href);
      ['stripe_return', 'session_id', 'amount'].forEach(k => clean.searchParams.delete(k));
      window.history.replaceState({}, '', clean.toString());
    }

    // Geo-detect currency
    fetch('/api/geo-profile')
      .then(r => r.json())
      .then((d: any) => {
        let c = (d?.country || '').toUpperCase();
        if (!c || c === 'GLOBAL' || c === 'XX' || c === 'T1') {
          c = detectCountryFromClient();
        }
        setCountry(c);
        const cfg = getCurrencyConfig(c);
        setCurrencyConfig(cfg);
        setSelectedAmount(cfg.amounts[1]);
      })
      .catch(() => {
        const c = detectCountryFromClient();
        setCountry(c);
        const cfg = getCurrencyConfig(c);
        setCurrencyConfig(cfg);
        setSelectedAmount(cfg.amounts[1]);
      });
  }, []);

  /* ── 2. Open modal from PostRewardExtension ───────────────────────────── */
  useEffect(() => {
    const handle = (e: CustomEvent<{ region?: string; country?: string; amount?: number }>) => {
      resetState();
      try {
        const v = (document.documentElement.dataset.localeVariant || window.localStorage.getItem('shijianus-locale-variant') || 'zh-CN') as LocaleKey;
        if (v === 'zh-Hant' || v === 'en') setLocaleVariant(v);
        else setLocaleVariant('zh-CN');
      } catch {}

      const targetCountry =
        e.detail?.country ||
        (e.detail?.region === 'CN'
          ? 'CN'
          : e.detail?.region === 'HK'
          ? 'HK'
          : e.detail?.region === 'GB'
          ? 'GB'
          : country || detectCountryFromClient());
      if (targetCountry && targetCountry !== 'GLOBAL') {
        const cfg = getCurrencyConfig(targetCountry);
        setCountry(targetCountry);
        setCurrencyConfig(cfg);
        setSelectedAmount(cfg.amounts[1]);
      }
      setIsOpen(true);
    };
    window.addEventListener('open-stripe-modal' as any, handle);
    return () => window.removeEventListener('open-stripe-modal' as any, handle);
  }, [country]);

  /* ── 3. Mount Stripe Embedded Checkout ───────────────────────────────── */
  useEffect(() => {
    if (step !== 'checkout' || !clientSecret || !resolvedKey) return;
    let checkout: any = null;
    let cancelled = false;
    setCheckoutReady(false);

    (async () => {
      try {
        const stripe = await getStripe(resolvedKey);
        if (!stripe || cancelled) return;
        const initFn =
          typeof stripe.createEmbeddedCheckoutPage === 'function'
            ? stripe.createEmbeddedCheckoutPage
            : stripe.initEmbeddedCheckout;
        if (!initFn) throw new Error('Stripe embedded checkout is not supported in this environment');
        
        checkout = await initFn.call(stripe, {
          clientSecret,
          onComplete: () => {
            // 支付成功完成时：平滑销毁 Stripe 嵌入实例，就地展示寄语表单，绝不刷新整个页面！
            try { checkout?.destroy(); } catch {}
            checkoutInstanceRef.current = null;
            pendingNotificationRef.current = true;
            setPaidAmount(currentAmount);
            setStep('success');
          },
        });
        checkoutInstanceRef.current = checkout;

        if (!cancelled && checkoutRef.current) {
          checkout.mount(checkoutRef.current);
          // Watch for the Stripe iframe appearing, then fade the skeleton out
          const host = checkoutRef.current;
          const markReady = () => { if (!cancelled) setCheckoutReady(true); };
          const iframe = host.querySelector('iframe');
          if (iframe) {
            iframe.addEventListener('load', markReady, { once: true });
          } else {
            const mo = new MutationObserver(() => {
              const f = host.querySelector('iframe');
              if (f) {
                mo.disconnect();
                f.addEventListener('load', markReady, { once: true });
                setTimeout(markReady, 2500);
              }
            });
            mo.observe(host, { childList: true, subtree: true });
          }
          setTimeout(markReady, 6000);
        }
      } catch (e: any) {
        if (!cancelled) setCreateError(e?.message || 'Failed to initialise Stripe Checkout');
      }
    })();

    return () => {
      cancelled = true;
      try { checkout?.destroy(); } catch {}
      checkoutInstanceRef.current = null;
    };
  }, [step, clientSecret, resolvedKey]);

  /* ── 4. Unload / Close fallback for pending TG notification ───────────── */
  const sendPendingNotification = (customName?: string, customMsg?: string) => {
    if (!pendingNotificationRef.current || !sessionId) return;
    pendingNotificationRef.current = false;
    const finalName = (customName !== undefined ? customName : donorName).trim() || '匿名支持者';
    const finalMsg = (customMsg !== undefined ? customMsg : donorMsg).trim() || '（用户未附带留言）';
    const amt = Math.round(paidAmount * (ZERO_DECIMAL.has(currencyConfig.code) ? 1 : 100));
    try {
      fetch('/api/record-blessing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          amount: amt,
          currency: currencyConfig.code,
          name: finalName,
          message: finalMsg,
          country,
        }),
      }).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    const onUnload = () => {
      if (pendingNotificationRef.current && sessionId) {
        pendingNotificationRef.current = false;
        const amt = Math.round(paidAmount * (ZERO_DECIMAL.has(currencyConfig.code) ? 1 : 100));
        const data = JSON.stringify({
          id: sessionId,
          amount: amt,
          currency: currencyConfig.code,
          name: donorName.trim() || '匿名支持者',
          message: donorMsg.trim() || '（用户未附带留言）',
          country,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/record-blessing', new Blob([data], { type: 'application/json' }));
        }
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [sessionId, paidAmount, currencyConfig, donorName, donorMsg, country]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleContinue = async () => {
    if (currentAmount <= 0 || isCreating) return;
    setIsCreating(true);
    setCreateError('');
    try {
      const returnUrl =
        `${window.location.origin}${window.location.pathname}` +
        `?stripe_return=1&amount=${currentAmount}&session_id={CHECKOUT_SESSION_ID}`;
      const res  = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount: currentAmount,
          currency: currencyConfig.code,
          country,
          locale: localeVariant,
          returnUrl,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Endpoint missing (e.g. wrong dev server) — Astro returned an HTML error page
        throw new Error('支付接口暂不可用：请确认使用 npm run dev / wrangler pages dev 启动后重试');
      }
      const data = await res.json() as any;
      if (!res.ok || !data.ok || !data.clientSecret) {
        throw new Error(data.error || `Server error (${res.status})`);
      }
      setClientSecret(data.clientSecret);
      setSessionId(data.sessionId || '');
      setPaidAmount(currentAmount);
      setStep('checkout');
    } catch (e: any) {
      setCreateError(e?.message || 'Payment setup failed — please try again');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBlessing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    sendPendingNotification(donorName, donorMsg);
    setBlessingDone(true);
    setIsSubmitting(false);
  };

  const resetState = () => {
    if (step === 'success' && pendingNotificationRef.current) {
      sendPendingNotification();
    }
    setStep('amount');
    setClientSecret('');
    setCreateError('');
    setIsCreating(false);
    setIsCustomMode(false);
    setCustomAmount('');
    setDonorName('');
    setDonorMsg('');
    setBlessingDone(false);
  };

  const closeModal = () => {
    if (step === 'success' && pendingNotificationRef.current) {
      sendPendingNotification();
    }
    setIsOpen(false);
    resetState();
  };

  const goBack = () => {
    setStep('amount');
    setClientSecret('');
    setCreateError('');
  };

  if (!isOpen) return null;

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={closeModal}
    >
      <div
        className="w-full sm:max-w-[420px] bg-white dark:bg-[#12141a] rounded-t-3xl sm:rounded-2xl border border-t border-x sm:border border-slate-200/80 dark:border-white/[0.08] shadow-2xl shadow-black/30 flex flex-col overflow-hidden"
        style={{ maxHeight: step === 'checkout' ? '92vh' : '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/[0.07] shrink-0">
          {step === 'checkout' && (
            <button
              type="button"
              onClick={goBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              step === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400'
            }`}
          >
            {step === 'success'
              ? <CheckCircle2 className="w-4 h-4" />
              : <CreditCard className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {step === 'amount' ? t.title : step === 'checkout' ? t.checkoutTitle : t.successTitle}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-px flex items-center gap-1.5">
              {step === 'amount' ? (
                <span>{t.subtitleAmount}</span>
              ) : step === 'checkout' ? (
                `${fmtAmt(paidAmount, currencyConfig)} · ${t.subtitleCheckout}`
              ) : (
                t.subtitleSuccess
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Step: Amount ──────────────────────────────────────────────── */}
          {step === 'amount' && (
            <div className="p-5 space-y-5">
              {/* Big amount display */}
              <div className="text-center pt-1 pb-2">
                <div className="text-5xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {fmtAmt(currentAmount > 0 ? currentAmount : currencyConfig.amounts[1], currencyConfig)}
                </div>
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5">
                  <span>{currencyConfig.code} ({currencyConfig.symbol})</span>
                </div>
              </div>

              {/* Supported payment methods badges */}
              <div className="flex items-center justify-center flex-wrap gap-2.5 py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <CreditCard className="w-3.5 h-3.5 text-violet-500" />
                  <span>Card</span>
                </span>
                <span className="opacity-30">·</span>
                <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                  <AppleIcon className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                  <span>Apple Pay</span>
                </span>
                <span className="opacity-30">·</span>
                <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                  <GoogleIcon className="w-3.5 h-3.5" />
                  <span>Google Pay</span>
                </span>
                <span className="opacity-30">·</span>
                <span className="flex items-center gap-1 font-semibold text-[#00D66F]">
                  <StripeLinkIcon className="w-3.5 h-3.5 text-[#00D66F]" />
                  <span>Link</span>
                </span>
              </div>

              {/* Preset amounts — 6 presets in 3-column grid (2x3) */}
              <div className="grid grid-cols-3 gap-2.5">
                {currencyConfig.amounts.map(amt => {
                  const active = !isCustomMode && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setIsCustomMode(false); setSelectedAmount(amt); }}
                      className={`py-3.5 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer select-none ${
                        active
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30 ring-2 ring-violet-400/50 scale-[1.02]'
                          : 'bg-slate-100 dark:bg-white/[0.07] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.13]'
                      }`}
                    >
                      {fmtAmt(amt, currencyConfig)}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount input */}
              <div className="space-y-1.5">
                <label
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all cursor-text ${
                    isCustomMode
                      ? isCustomInvalid
                        ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20'
                        : 'border-violet-500 bg-violet-50/60 dark:bg-violet-950/25'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                    {currencyConfig.symbol}
                  </span>
                  <input
                    type="number"
                    min={currencyConfig.min}
                    max={currencyConfig.max}
                    step={ZERO_DECIMAL.has(currencyConfig.code) ? 100 : (Number.isInteger(currencyConfig.amounts[0]) ? 1 : 0.5)}
                    placeholder={t.customPlaceholder(fmtAmt(currencyConfig.min, currencyConfig), fmtAmt(currencyConfig.max, currencyConfig))}
                    value={customAmount}
                    onFocus={() => setIsCustomMode(true)}
                    onChange={e => { setIsCustomMode(true); setCustomAmount(e.target.value); }}
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
                  />
                  {isCustomMode && customAmount && (
                    <span className="text-[11px] font-bold uppercase text-violet-500 shrink-0">
                      {currencyConfig.code}
                    </span>
                  )}
                </label>
                {isCustomMode && customAmount && isCustomInvalid && (
                  <div className="text-[11px] text-red-500 dark:text-red-400 px-1 font-medium">
                    {parseFloat(customAmount) < currencyConfig.min
                      ? t.minError(fmtAmt(currencyConfig.min, currencyConfig))
                      : t.maxError(fmtAmt(currencyConfig.max, currencyConfig))}
                  </div>
                )}
              </div>

              {/* Error */}
              {createError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                  {createError}
                </div>
              )}

              {/* CTA */}
              <button
                type="button"
                onClick={handleContinue}
                disabled={currentAmount <= 0 || isCustomInvalid || isCreating}
                className={`relative overflow-hidden group w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                  currentAmount <= 0 || isCustomInvalid
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                    : isCreating
                    ? 'bg-violet-400 cursor-wait'
                    : 'bg-[linear-gradient(115deg,#5A54FF_0%,#635BFF_35%,#8B5CF6_100%)] hover:bg-[linear-gradient(115deg,#4f46e5_0%,#635BFF_45%,#7c3aed_100%)] shadow-[0_10px_24px_-8px_rgba(99,91,255,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] hover:shadow-[0_14px_32px_-8px_rgba(124,58,237,0.6)] hover:-translate-y-px active:translate-y-0 active:scale-[0.99] cursor-pointer'
                }`}
              >
                {!(currentAmount <= 0 || isCustomInvalid || isCreating) && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-[18deg] bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-120%] group-hover:translate-x-[420%] transition-transform duration-700 ease-out"
                  />
                )}
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreating ? t.processing : t.continueBtn(fmtAmt(currentAmount > 0 ? currentAmount : currencyConfig.amounts[1], currencyConfig))}
              </button>
            </div>
          )}

          {/* Step: Checkout (Stripe Embedded) ─────────────────────────── */}
          {step === 'checkout' && (
            <div className="p-3 sm:p-4">
              <div className="relative rounded-2xl overflow-hidden bg-white ring-1 ring-slate-200/90 dark:ring-white/10 shadow-[0_8px_30px_-12px_rgba(99,91,255,0.25)] min-h-[420px]">
                {/* Loading skeleton — sits under the iframe, fades out once ready */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 z-0 flex flex-col transition-opacity duration-500 ${
                    checkoutReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  <div className="px-5 pt-6 pb-4 border-b border-slate-100">
                    <div className="h-4 w-28 rounded-full bg-slate-100 animate-pulse" />
                    <div className="mt-2.5 h-7 w-40 rounded-lg bg-slate-200/80 animate-pulse" />
                  </div>
                  <div className="p-5 space-y-3.5">
                    <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                      <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                    </div>
                    <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="h-12 rounded-xl bg-violet-100 animate-pulse" />
                  </div>
                  <div className="mt-auto pb-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                    {t.connectingStripe}
                  </div>
                </div>
                {/* Stripe mounts here */}
                <div
                  ref={checkoutRef}
                  id="embedded-stripe-checkout"
                  className={`relative z-10 transition-opacity duration-500 ${checkoutReady ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
              {createError && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400">
                  {createError}
                </div>
              )}
            </div>
          )}

          {/* Step: Success ─────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="p-5 space-y-5 animate-in fade-in duration-300">
              {/* Success banner */}
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-500/20 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{t.successMsg}</p>
                  {paidAmount > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {fmtAmt(paidAmount, currencyConfig)} {currencyConfig.code.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>

              {/* Blessing form */}
              {!blessingDone ? (
                <form onSubmit={handleBlessing} className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    {t.leaveBlessing}
                  </div>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder={t.namePlaceholder}
                      value={donorName}
                      onChange={e => setDonorName(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1a1d26] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition"
                    />
                    <textarea
                      rows={3}
                      placeholder={t.msgPlaceholder}
                      value={donorMsg}
                      onChange={e => setDonorMsg(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1a1d26] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400/40 resize-none transition"
                    />
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {t.sendBlessing}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                    >
                      {t.done}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.blessingDelivered}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.blessingDeliveredSub}</p>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-2 px-8 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer transition-colors hover:bg-slate-700 dark:hover:bg-slate-100"
                  >
                    {t.done}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.07] shrink-0 bg-slate-50/50 dark:bg-black/20 space-y-2">
          <div className="flex items-center justify-between">
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer group"
              title="Stripe Official Security"
            >
              <span className="font-medium">{t.securedBy}</span>
              <StripeWordmark className="h-3.5 w-auto opacity-70 group-hover:opacity-100 dark:opacity-50 dark:group-hover:opacity-80 text-[#635BFF] dark:text-slate-200 transition-opacity" />
            </a>
            <a
              href="/status/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-medium text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer"
            >
              {t.rewardRecords}
            </a>
          </div>

          {/* Concise, subtle single-line privacy note */}
          <div className="text-center text-[10px] text-slate-400/80 dark:text-slate-500 leading-normal truncate">
            {t.privacyNote}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;
