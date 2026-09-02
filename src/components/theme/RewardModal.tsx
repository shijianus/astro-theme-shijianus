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
  ShieldCheck,
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
  amounts: number[]; // preset amounts (5 values)
  min: number;     // minimum allowed amount (human units)
}

/** All major Stripe-supported currencies by country code */
const COUNTRY_CURRENCY: Record<string, CurrencyConfig> = {
  // ── East Asia ──────────────────────────────────────────────────────────────
  HK: { code: 'hkd', symbol: 'HK$',  amounts: [20,  50,  100,  200,  500],    min: 4    },
  TW: { code: 'twd', symbol: 'NT$',  amounts: [50,  100, 200,  500,  1000],   min: 15   },
  JP: { code: 'jpy', symbol: '¥',    amounts: [500, 1000,2000, 5000, 10000],  min: 50   },
  KR: { code: 'krw', symbol: '₩',   amounts: [3000,5000,10000,20000,50000],  min: 500  },
  MO: { code: 'hkd', symbol: 'HK$',  amounts: [20,  50,  100,  200,  500],    min: 4    }, // Macao → HKD

  // ── Southeast Asia ─────────────────────────────────────────────────────────
  SG: { code: 'sgd', symbol: 'S$',   amounts: [5,   10,  20,   50,   100],    min: 1    },
  MY: { code: 'myr', symbol: 'RM',   amounts: [5,   10,  20,   50,   100],    min: 2    },
  TH: { code: 'thb', symbol: '฿',   amounts: [50,  100, 200,  500,  1000],   min: 20   },
  ID: { code: 'idr', symbol: 'Rp',   amounts: [15000,30000,50000,100000,200000], min: 10000 },
  PH: { code: 'php', symbol: '₱',   amounts: [50,  100, 200,  500,  1000],   min: 30   },
  VN: { code: 'vnd', symbol: '₫',   amounts: [25000,50000,100000,200000,500000], min: 12000 }, // zero-decimal
  BN: { code: 'sgd', symbol: 'S$',   amounts: [5,   10,  20,   50,   100],    min: 1    }, // Brunei → SGD

  // ── South Asia ─────────────────────────────────────────────────────────────
  IN: { code: 'inr', symbol: '₹',   amounts: [100, 200, 500,  1000, 2000],   min: 50   },
  LK: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    }, // Sri Lanka → USD

  // ── Oceania ────────────────────────────────────────────────────────────────
  AU: { code: 'aud', symbol: 'A$',   amounts: [5,   10,  20,   50,   100],    min: 1    },
  NZ: { code: 'nzd', symbol: 'NZ$',  amounts: [5,   10,  20,   50,   100],    min: 1    },

  // ── North America ──────────────────────────────────────────────────────────
  US: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    },
  CA: { code: 'cad', symbol: 'CA$',  amounts: [5,   10,  20,   50,   100],    min: 1    },
  MX: { code: 'mxn', symbol: 'MX$',  amounts: [50,  100, 200,  500,  1000],   min: 20   },

  // ── South & Central America ────────────────────────────────────────────────
  BR: { code: 'brl', symbol: 'R$',   amounts: [10,  20,  50,   100,  200],    min: 3    },
  AR: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    }, // ARS too volatile → USD
  CL: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    }, // CLP is zero-decimal → USD simpler
  CO: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    },

  // ── United Kingdom ─────────────────────────────────────────────────────────
  GB: { code: 'gbp', symbol: '£',    amounts: [3,   5,   10,   20,   50],     min: 1    },

  // ── Nordic ─────────────────────────────────────────────────────────────────
  SE: { code: 'sek', symbol: 'kr',   amounts: [30,  50,  100,  200,  500],    min: 3    },
  NO: { code: 'nok', symbol: 'kr',   amounts: [30,  50,  100,  200,  500],    min: 3    },
  DK: { code: 'dkk', symbol: 'kr.',  amounts: [20,  50,  100,  200,  500],    min: 2    },
  IS: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    },

  // ── Non-Euro Europe ────────────────────────────────────────────────────────
  CH: { code: 'chf', symbol: 'Fr.',  amounts: [3,   5,   10,   20,   50],     min: 1    },
  PL: { code: 'pln', symbol: 'zł',   amounts: [10,  20,  50,   100,  200],    min: 2    },
  CZ: { code: 'czk', symbol: 'Kč',   amounts: [50,  100, 200,  500,  1000],   min: 15   },
  HU: { code: 'huf', symbol: 'Ft',   amounts: [500, 1000,2000, 5000, 10000],  min: 175  },
  RO: { code: 'ron', symbol: 'lei',  amounts: [10,  20,  50,   100,  200],    min: 2    },
  TR: { code: 'try', symbol: '₺',   amounts: [50,  100, 200,  500,  1000],   min: 10   },
  UA: { code: 'uah', symbol: '₴',   amounts: [50,  100, 200,  500,  1000],   min: 20   },
  RS: { code: 'rsd', symbol: 'din',  amounts: [200, 500, 1000, 2000, 5000],   min: 60   },
  BG: { code: 'bgn', symbol: 'лв.',  amounts: [5,   10,  20,   50,   100],    min: 1    },
  HR: { code: 'eur', symbol: '€',    amounts: [3,   5,   10,   20,   50],     min: 1    }, // Croatia uses EUR since 2023

  // ── Middle East ────────────────────────────────────────────────────────────
  AE: { code: 'aed', symbol: 'AED',  amounts: [10,  20,  50,   100,  200],    min: 2    },
  SA: { code: 'sar', symbol: 'SAR',  amounts: [10,  20,  50,   100,  200],    min: 2    },
  IL: { code: 'ils', symbol: '₪',   amounts: [10,  20,  50,   100,  200],    min: 2    },
  QA: { code: 'qar', symbol: 'QAR',  amounts: [10,  20,  50,   100,  200],    min: 2    },
  KW: { code: 'kwd', symbol: 'KWD',  amounts: [1,   2,   5,    10,   20],     min: 1    },
  BH: { code: 'bhd', symbol: 'BHD',  amounts: [1,   2,   5,    10,   20],     min: 1    },
  OM: { code: 'omr', symbol: 'OMR',  amounts: [1,   2,   5,    10,   20],     min: 1    },
  JO: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    },

  // ── Africa ─────────────────────────────────────────────────────────────────
  ZA: { code: 'zar', symbol: 'R',    amounts: [20,  50,  100,  200,  500],    min: 5    },
  NG: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    }, // NGN volatility → USD
  KE: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    },
  GH: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    },
  EG: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    },
  MA: { code: 'usd', symbol: '$',    amounts: [3,   5,   10,   20,   50],     min: 1    },
};

/** Euro-zone countries (all map to EUR) */
const EUR_ZONE = new Set([
  'DE','FR','IT','ES','NL','PT','BE','AT','GR','FI',
  'IE','LU','MT','CY','SK','SI','EE','LV','LT','MC',
  'SM','VA','AD','XK',
]);

const EUR_CONFIG: CurrencyConfig = {
  code: 'eur', symbol: '€', amounts: [3, 5, 10, 20, 50], min: 1,
};

const DEFAULT_CONFIG: CurrencyConfig = {
  code: 'usd', symbol: '$', amounts: [3, 5, 10, 20, 50], min: 1,
};

function getCurrencyConfig(country: string): CurrencyConfig {
  if (EUR_ZONE.has(country)) return EUR_CONFIG;
  return COUNTRY_CURRENCY[country] ?? DEFAULT_CONFIG;
}

/* ── Amount formatter ──────────────────────────────────────────────────────── */
function fmtAmt(amount: number, cfg: CurrencyConfig): string {
  if (ZERO_DECIMAL.has(cfg.code) || cfg.code === 'idr') {
    return `${cfg.symbol}${amount.toLocaleString()}`;
  }
  return `${cfg.symbol}${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/* ── Stripe SVG Logo ───────────────────────────────────────────────────────── */
const StripeWordmark: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-auto' }) => (
  <svg viewBox="0 0 60 25" fill="none" className={className} aria-label="Stripe">
    <path
      d="M5.45 10.22c0-.78.64-1.08 1.7-1.08 1.52 0 3.44.46 4.96 1.28V6.48c-1.66-.66-3.3-.92-4.96-.92C3.93 5.56 1.5 7.3 1.5 10.4c0 4.74 6.52 3.98 6.52 6.02 0 .92-.8 1.22-1.92 1.22-1.66 0-3.78-.68-5.46-1.6v3.98c1.86.8 3.74 1.14 5.46 1.14 4.16 0 7-2.06 7-5.22 0-5.12-6.65-4.2-6.65-5.72zm17.2 8.52V6.06h-4.06v16.58l4.06-3.9zm.32-12.52c0-1.16-.9-2.06-2.06-2.06-1.16 0-2.06.9-2.06 2.06 0 1.16.9 2.06 2.06 2.06 1.16 0 2.06-.9 2.06-2.06zM33.1 6c-1.64 0-2.7.78-3.3 1.32L29.6 6.3h-3.8v18.06l4.06-.86V21.4c.62.44 1.52 1.06 3.2 1.06 3.22 0 6.16-2.6 6.16-8.32C39.22 8.9 36.26 6 33.1 6zm-.72 12.86c-1.06 0-1.68-.38-2.12-.84v-6.6c.48-.52 1.12-.88 2.12-.88 1.62 0 2.74 1.82 2.74 4.16 0 2.38-1.1 4.16-2.74 4.16zm13.12-8.6c.84 0 1.26.58 1.44 1.58h-3.12c.2-1.06.82-1.58 1.68-1.58zm5.36 3.8c0-4.16-2.18-8.06-6.44-8.06-4.3 0-6.9 3.38-6.9 7.82 0 5.18 2.92 7.82 7.28 7.82 2.1 0 3.68-.46 4.88-1.24v-3.24c-1.2.82-2.58 1.28-4.32 1.28-1.7 0-3.2-.74-3.4-3.26h8.82c.02-.28.08-.82.08-1.12z"
      fill="#635BFF"
    />
  </svg>
);

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

  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount]     = useState('');
  const [isCustomMode, setIsCustomMode]     = useState(false);

  const [clientSecret, setClientSecret] = useState('');
  const [sessionId, setSessionId]       = useState('');
  const [paidAmount, setPaidAmount]     = useState(0);

  const [isCreating, setIsCreating]   = useState(false);
  const [createError, setCreateError] = useState('');

  const [donorName, setDonorName]         = useState('');
  const [donorMsg, setDonorMsg]           = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [blessingDone, setBlessingDone]   = useState(false);

  const checkoutRef = useRef<HTMLDivElement>(null);

  /* current amount (derived) */
  const currentAmount = isCustomMode
    ? (parseFloat(customAmount) || 0)
    : (selectedAmount || currencyConfig.amounts[1]);

  /* ── 1. On mount: detect stripe_return + geo ──────────────────────────── */
  useEffect(() => {
    // Detect return from Stripe Checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_return') === '1') {
      const sid  = params.get('session_id') || '';
      const amt  = parseFloat(params.get('amount') || '0') || 5;
      setSessionId(sid);
      setPaidAmount(amt);
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
        const c = (d?.country || '').toUpperCase();
        setCountry(c);
        const cfg = getCurrencyConfig(c);
        setCurrencyConfig(cfg);
        setSelectedAmount(cfg.amounts[1]);
      })
      .catch(() => {
        setSelectedAmount(DEFAULT_CONFIG.amounts[1]);
      });
  }, []);

  /* ── 2. Open modal from PostRewardExtension ───────────────────────────── */
  useEffect(() => {
    const handle = () => {
      resetState();
      setIsOpen(true);
    };
    window.addEventListener('open-stripe-modal' as any, handle);
    return () => window.removeEventListener('open-stripe-modal' as any, handle);
  }, []);

  /* ── 3. Mount Stripe Embedded Checkout ───────────────────────────────── */
  useEffect(() => {
    if (step !== 'checkout' || !clientSecret || !resolvedKey) return;
    let checkout: any = null;
    let cancelled = false;

    (async () => {
      try {
        const stripe = await getStripe(resolvedKey);
        if (!stripe || cancelled) return;
        const initFn =
          typeof stripe.createEmbeddedCheckoutPage === 'function'
            ? stripe.createEmbeddedCheckoutPage
            : stripe.initEmbeddedCheckout;
        if (!initFn) throw new Error('Stripe embedded checkout is not supported in this environment');
        checkout = await initFn.call(stripe, { clientSecret });
        if (!cancelled && checkoutRef.current) {
          checkout.mount(checkoutRef.current);
        }
      } catch (e: any) {
        if (!cancelled) setCreateError(e?.message || 'Failed to initialise Stripe Checkout');
      }
    })();

    return () => {
      cancelled = true;
      checkout?.destroy();
    };
  }, [step, clientSecret, resolvedKey]);

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
        body:    JSON.stringify({ amount: currentAmount, currency: currencyConfig.code, country, returnUrl }),
      });
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
    try {
      await fetch('/api/record-blessing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:      sessionId,
          amount:  Math.round(paidAmount * (ZERO_DECIMAL.has(currencyConfig.code) ? 1 : 100)),
          currency: currencyConfig.code,
          name:    donorName.trim() || '匿名支持者',
          message: donorMsg.trim() || '',
          country,
        }),
      });
    } catch { /* silent */ }
    setBlessingDone(true);
    setIsSubmitting(false);
  };

  const resetState = () => {
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

  const closeModal = () => { setIsOpen(false); resetState(); };

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
              {step === 'amount' ? '赞赏支持' : step === 'checkout' ? '安全结账' : '感谢支持'}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-px">
              {step === 'amount'
                ? '信用卡 · Apple Pay · Google Pay · Link'
                : step === 'checkout'
                ? `${fmtAmt(paidAmount, currencyConfig)} · 由 Stripe 安全处理`
                : '您的赞赏已成功送达 ❤️'}
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
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {currencyConfig.code}
                </div>
              </div>

              {/* Preset amounts — 3-column grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {currencyConfig.amounts.map(amt => {
                  const active = !isCustomMode && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setIsCustomMode(false); setSelectedAmount(amt); }}
                      className={`py-4 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer select-none ${
                        active
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                          : 'bg-slate-100 dark:bg-white/[0.07] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.13]'
                      }`}
                    >
                      {fmtAmt(amt, currencyConfig)}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount input */}
              <label
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all cursor-text ${
                  isCustomMode
                    ? 'border-violet-500 bg-violet-50/60 dark:bg-violet-950/25'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]'
                }`}
              >
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                  {currencyConfig.symbol}
                </span>
                <input
                  type="number"
                  min={currencyConfig.min}
                  step={ZERO_DECIMAL.has(currencyConfig.code) ? 100 : 1}
                  placeholder={`自定义金额（最低 ${fmtAmt(currencyConfig.min, currencyConfig)}）`}
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
                disabled={currentAmount <= 0 || isCreating}
                className={`w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${
                  currentAmount <= 0
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                    : isCreating
                    ? 'bg-violet-400 cursor-wait'
                    : 'bg-[#635BFF] hover:bg-[#4f46e5] active:scale-[0.99] shadow-md shadow-violet-500/25 cursor-pointer'
                }`}
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreating ? '处理中…' : `继续 — ${fmtAmt(currentAmount > 0 ? currentAmount : currencyConfig.amounts[1], currencyConfig)}`}
              </button>
            </div>
          )}

          {/* Step: Checkout (Stripe Embedded) ─────────────────────────── */}
          {step === 'checkout' && (
            <div className="min-h-[380px]">
              {!clientSecret ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  <span className="text-xs text-slate-400">正在准备安全结账…</span>
                </div>
              ) : (
                <div ref={checkoutRef} id="embedded-stripe-checkout" />
              )}
              {createError && (
                <div className="m-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400">
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
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">赞赏成功，非常感谢！</p>
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
                    留下您的寄语（将推送给作者）
                  </div>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="称呼或社交账号（选填）"
                      value={donorName}
                      onChange={e => setDonorName(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1a1d26] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition"
                    />
                    <textarea
                      rows={3}
                      placeholder="写下想对作者说的话…（选填）"
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
                      发送寄语
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                    >
                      完成
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">寄语已送达 ✨</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">感谢每一次陪伴，这是创作最大的动力。</p>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-2 px-8 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer transition-colors hover:bg-slate-700 dark:hover:bg-slate-100"
                  >
                    完成
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-5 py-2.5 border-t border-slate-100 dark:border-white/[0.07] shrink-0 bg-slate-50/50 dark:bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Secured by</span>
            <StripeWordmark className="h-3 w-auto opacity-60 dark:opacity-40" />
          </div>
          <a
            href="/status/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
          >
            赞赏记录
          </a>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;
