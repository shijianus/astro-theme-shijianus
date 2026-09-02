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

let stripePromise: Promise<any> | null = null;

async function getStripe(publishableKey: string): Promise<any> {
  if (!stripePromise) {
    const { loadStripe } = await import('@stripe/stripe-js');
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

const ZERO_DECIMAL_CURRENCIES = new Set(['jpy','krw','vnd','bif','clp','gnf','kmf','mga','pyg','rwf','ugx','xaf','xof','xpf']);

interface CurrencyConfig {
  code: string;
  symbol: string;
  amounts: number[];
  min: number;
  locale: string;
}

const COUNTRY_CURRENCY: Record<string, CurrencyConfig> = {
  CN: { code: 'cny', symbol: '¥', amounts: [10, 30, 50, 100, 200], min: 1, locale: 'zh-CN' },
  HK: { code: 'hkd', symbol: 'HK$', amounts: [20, 50, 100, 200, 500], min: 4, locale: 'zh-HK' },
  TW: { code: 'twd', symbol: 'NT$', amounts: [50, 100, 200, 500, 1000], min: 15, locale: 'zh-TW' },
  GB: { code: 'gbp', symbol: '£', amounts: [3, 5, 10, 20, 50], min: 1, locale: 'en-GB' },
  AU: { code: 'aud', symbol: 'A$', amounts: [5, 10, 20, 50, 100], min: 1, locale: 'en-AU' },
  CA: { code: 'cad', symbol: 'CA$', amounts: [5, 10, 20, 50, 100], min: 1, locale: 'en-CA' },
  SG: { code: 'sgd', symbol: 'S$', amounts: [5, 10, 20, 50, 100], min: 1, locale: 'en-SG' },
  JP: { code: 'jpy', symbol: '¥', amounts: [500, 1000, 2000, 5000, 10000], min: 50, locale: 'ja-JP' },
  KR: { code: 'krw', symbol: '₩', amounts: [3000, 5000, 10000, 20000, 50000], min: 500, locale: 'ko-KR' },
  US: { code: 'usd', symbol: '$', amounts: [3, 5, 10, 20, 50], min: 1, locale: 'en-US' },
};

const EUR_COUNTRIES = new Set(['DE','FR','IT','ES','NL','PT','BE','AT','GR','FI','IE','LU','MT','CY','SK','SI','EE','LV','LT']);
const EUR_CONFIG: CurrencyConfig = { code: 'eur', symbol: '€', amounts: [3, 5, 10, 20, 50], min: 1, locale: 'de-DE' };
const DEFAULT_CONFIG: CurrencyConfig = { code: 'usd', symbol: '$', amounts: [3, 5, 10, 20, 50], min: 1, locale: 'en-US' };

function getCurrencyConfig(country: string): CurrencyConfig {
  if (EUR_COUNTRIES.has(country)) return EUR_CONFIG;
  return COUNTRY_CURRENCY[country] || DEFAULT_CONFIG;
}

function fmtAmt(amount: number, cfg: CurrencyConfig): string {
  if (ZERO_DECIMAL_CURRENCIES.has(cfg.code)) {
    return `${cfg.symbol}${amount.toLocaleString()}`;
  }
  return `${cfg.symbol}${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

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

export const RewardModal: React.FC<RewardModalProps> = ({
  stripePublishableKey,
  publishableKey,
  defaultAmount = 5,
}) => {
  const resolvedKey = stripePublishableKey || publishableKey || '';

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'amount' | 'checkout' | 'success'>('amount');
  const [country, setCountry] = useState<string>('');
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(DEFAULT_CONFIG);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [isSubmittingBlessing, setIsSubmittingBlessing] = useState(false);
  const [isBlessingDone, setIsBlessingDone] = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);

  const currentAmount = isCustomMode ? (parseFloat(customAmount) || 0) : (selectedAmount || currencyConfig.amounts[1]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_return') === '1') {
      const sid = params.get('session_id') || '';
      setSessionId(sid);
      setPaidAmount(parseFloat(params.get('amount') || '0') || 5);
      setStep('success');
      setIsOpen(true);
      const clean = new URL(window.location.href);
      ['stripe_return','session_id','amount'].forEach(k => clean.searchParams.delete(k));
      window.history.replaceState({}, '', clean.toString());
    }
    
    fetch('/api/geo-profile').then(r => r.json()).then((d: any) => {
      const c = (d?.country || 'US').toUpperCase();
      setCountry(c);
      const cfg = getCurrencyConfig(c);
      setCurrencyConfig(cfg);
      setSelectedAmount(cfg.amounts[1]);
    }).catch(() => {
      setSelectedAmount(DEFAULT_CONFIG.amounts[1]);
    });
  }, []);

  useEffect(() => {
    const handleOpen = (e: CustomEvent<{ region?: string; amount?: number }>) => {
      resetPaymentState();
      setIsOpen(true);
    };
    window.addEventListener('open-stripe-modal' as any, handleOpen);
    return () => window.removeEventListener('open-stripe-modal' as any, handleOpen);
  }, []);

  useEffect(() => {
    if (step !== 'checkout' || !clientSecret || !resolvedKey) return;
    let checkout: any = null;
    let cancelled = false;
    (async () => {
      try {
        const stripe = await getStripe(resolvedKey);
        if (!stripe || cancelled) return;
        checkout = await stripe.initEmbeddedCheckout({ clientSecret });
        if (!cancelled && checkoutRef.current) {
          checkout.mount(checkoutRef.current);
        }
      } catch (e: any) {
        if (!cancelled) setCreateError(e?.message || 'Failed to load checkout');
      }
    })();
    return () => { cancelled = true; checkout?.destroy(); };
  }, [step, clientSecret, resolvedKey]);

  const handleProceedToCheckout = async () => {
    if (currentAmount <= 0 || isCreating) return;
    setIsCreating(true);
    setCreateError('');
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?stripe_return=1&amount=${currentAmount}&session_id={CHECKOUT_SESSION_ID}`;
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          currency: currencyConfig.code,
          country,
          returnUrl,
        }),
      });
      const data = await res.json() as any;
      if (!res.ok || !data.ok || !data.clientSecret) throw new Error(data.error || 'Failed to create session');
      setClientSecret(data.clientSecret);
      setSessionId(data.sessionId || '');
      setPaidAmount(currentAmount);
      setStep('checkout');
    } catch (e: any) {
      setCreateError(e?.message || 'Payment setup failed, please try again');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmitBlessing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBlessing(true);
    try {
      await fetch('/api/record-blessing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          amount: Math.round(paidAmount * (ZERO_DECIMAL_CURRENCIES.has(currencyConfig.code) ? 1 : 100)),
          currency: currencyConfig.code,
          name: donorName.trim() || '匿名支持者',
          message: donorMessage.trim() || '',
          country,
        }),
      });
    } catch {}
    setIsBlessingDone(true);
    setIsSubmittingBlessing(false);
  };

  const resetPaymentState = () => {
    setStep('amount');
    setClientSecret('');
    setCreateError('');
    setIsCreating(false);
    setIsCustomMode(false);
    setCustomAmount('');
    setDonorName('');
    setDonorMessage('');
    setIsBlessingDone(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    resetPaymentState();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={closeModal}>
      <div className="w-full sm:max-w-[440px] bg-white dark:bg-[#13151b] rounded-t-3xl sm:rounded-2xl border-t border-x border-slate-200/90 dark:border-white/10 shadow-2xl flex flex-col" style={{ maxHeight: step === 'checkout' ? '90vh' : '75vh' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/8 shrink-0">
          {step === 'checkout' && (
            <button onClick={() => { setStep('amount'); setClientSecret(''); setCreateError(''); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              step === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400'
            }`}>
              {step === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {step === 'amount' ? '赞赏支持' : step === 'checkout' ? '安全结账' : '感谢支持'}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {step === 'amount' ? `信用卡 · Apple Pay · Google Pay · Link` : step === 'checkout' ? `${fmtAmt(paidAmount, currencyConfig)} · 由 Stripe 安全处理` : '您的赞赏已成功送达 ❤️'}
              </div>
            </div>
          </div>
          <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 cursor-pointer transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          
          {/* AMOUNT STEP */}
          {step === 'amount' && (
            <div className="p-5 space-y-5">
              {/* Large amount display */}
              <div className="text-center py-2">
                <div className="text-5xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {fmtAmt(currentAmount, currencyConfig)}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide">{currencyConfig.code}</div>
              </div>
              
              {/* Amount grid - 3 columns, large */}
              <div className="grid grid-cols-3 gap-3">
                {currencyConfig.amounts.slice(0, 6).map((amt) => {
                  const isSelected = !isCustomMode && selectedAmount === amt;
                  return (
                    <button key={amt} type="button" onClick={() => { setIsCustomMode(false); setSelectedAmount(amt); }}
                      className={`py-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                          : 'bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15'
                      }`}
                    >
                      {fmtAmt(amt, currencyConfig)}
                    </button>
                  );
                })}
              </div>
              
              {/* Custom amount input */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                isCustomMode
                  ? 'border-violet-400 dark:border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                  : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/4'
              }`}>
                <span className="text-sm font-bold text-slate-500 shrink-0">{currencyConfig.symbol}</span>
                <input
                  type="number"
                  min={currencyConfig.min}
                  step={ZERO_DECIMAL_CURRENCIES.has(currencyConfig.code) ? '100' : '1'}
                  placeholder={`自定义金额 (min ${fmtAmt(currencyConfig.min, currencyConfig)})`}
                  value={customAmount}
                  onFocus={() => setIsCustomMode(true)}
                  onChange={e => { setIsCustomMode(true); setCustomAmount(e.target.value); }}
                  className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                {isCustomMode && customAmount && (
                  <span className="text-[11px] uppercase text-violet-500 font-bold shrink-0">{currencyConfig.code}</span>
                )}
              </div>
              
              {/* Error */}
              {createError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400">
                  {createError}
                </div>
              )}
              
              {/* CTA button */}
              <button type="button" onClick={handleProceedToCheckout}
                disabled={currentAmount <= 0 || isCreating}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all ${
                  currentAmount <= 0 ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' :
                  isCreating ? 'bg-violet-400 cursor-wait' :
                  'bg-[#635BFF] hover:bg-[#4f46e5] active:scale-[0.99] shadow-md shadow-violet-500/20 cursor-pointer'
                }`}
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isCreating ? 'Preparing...' : `Continue — ${fmtAmt(currentAmount, currencyConfig)}`}</span>
              </button>
            </div>
          )}
          
          {/* CHECKOUT STEP - Stripe Embedded Checkout */}
          {step === 'checkout' && (
            <div className="min-h-[400px]">
              {!clientSecret ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                </div>
              ) : (
                <div ref={checkoutRef} id="embedded-checkout" />
              )}
            </div>
          )}
          
          {/* SUCCESS STEP */}
          {step === 'success' && (
            <div className="p-5 space-y-5 animate-in fade-in duration-300">
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">赞赏成功，非常感谢！</h4>
                {paidAmount > 0 && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">{fmtAmt(paidAmount, currencyConfig)} {currencyConfig.code.toUpperCase()}</p>
                )}
              </div>
              
              {!isBlessingDone ? (
                <form onSubmit={handleSubmitBlessing} className="space-y-4">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    留下您的寄语（将推送给作者）
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">称呼或社交账号</label>
                    <input type="text" placeholder="例如：@github_username" value={donorName} onChange={e => setDonorName(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">留言寄语</label>
                    <textarea rows={3} placeholder="写下想对作者说的话..." value={donorMessage} onChange={e => setDonorMessage(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 resize-none" />
                  </div>
                  <div className="flex gap-2.5">
                    <button type="submit" disabled={isSubmittingBlessing}
                      className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
                      {isSubmittingBlessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      发送寄语
                    </button>
                    <button type="button" onClick={closeModal}
                      className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer">
                      完成
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/4 border border-slate-200 dark:border-white/10 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">寄语已送达 ✨</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">感谢每一次陪伴，这是创作最大的动力。</p>
                  <button type="button" onClick={closeModal} className="mt-2 px-8 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer">
                    完成
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/8 shrink-0 bg-slate-50/60 dark:bg-[#0f1117]/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Secured by</span>
            {/* StripeLogo SVG inline */}
            <svg viewBox="0 0 60 25" fill="none" className="h-3.5 w-auto opacity-60" aria-label="Stripe">
              <path d="M5.45 10.22c0-.78.64-1.08 1.7-1.08 1.52 0 3.44.46 4.96 1.28V6.48c-1.66-.66-3.3-.92-4.96-.92C3.93 5.56 1.5 7.3 1.5 10.4c0 4.74 6.52 3.98 6.52 6.02 0 .92-.8 1.22-1.92 1.22-1.66 0-3.78-.68-5.46-1.6v3.98c1.86.8 3.74 1.14 5.46 1.14 4.16 0 7-2.06 7-5.22 0-5.12-6.65-4.2-6.65-5.72zm17.2 8.52V6.06h-4.06v16.58l4.06-3.9zm.32-12.52c0-1.16-.9-2.06-2.06-2.06-1.16 0-2.06.9-2.06 2.06 0 1.16.9 2.06 2.06 2.06 1.16 0 2.06-.9 2.06-2.06zM33.1 6c-1.64 0-2.7.78-3.3 1.32L29.6 6.3h-3.8v18.06l4.06-.86V21.4c.62.44 1.52 1.06 3.2 1.06 3.22 0 6.16-2.6 6.16-8.32C39.22 8.9 36.26 6 33.1 6zm-.72 12.86c-1.06 0-1.68-.38-2.12-.84v-6.6c.48-.52 1.12-.88 2.12-.88 1.62 0 2.74 1.82 2.74 4.16 0 2.38-1.1 4.16-2.74 4.16zm13.12-8.6c.84 0 1.26.58 1.44 1.58h-3.12c.2-1.06.82-1.58 1.68-1.58zm5.36 3.8c0-4.16-2.18-8.06-6.44-8.06-4.3 0-6.9 3.38-6.9 7.82 0 5.18 2.92 7.82 7.28 7.82 2.1 0 3.68-.46 4.88-1.24v-3.24c-1.2.82-2.58 1.28-4.32 1.28-1.7 0-3.2-.74-3.4-3.26h8.82c.02-.28.08-.82.08-1.12z" fill="#635BFF" /></svg>
          </div>
          <a href="/status/" target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-400 hover:text-violet-500 transition-colors">赞赏记录</a>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;
