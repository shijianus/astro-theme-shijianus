/**
 * RewardModal — 真实 Stripe Elements 集成
 *
 * 使用 @stripe/stripe-js 的 loadStripe + Elements + PaymentElement
 * 支持：信用卡 / 借记卡 + Apple Pay + Google Pay + Link by Stripe
 * 沙盒测试卡号：4242 4242 4242 4242 (Visa) | 到期随意 | CVC 任意三位
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  CreditCard,
  Lock,
  Loader2,
  CheckCircle2,
  Sparkles,
  Heart,
  Send,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

/* -----------------------------------------------------------------------
 * Stripe JS — 懒加载，避免影响页面初始性能
 * --------------------------------------------------------------------- */
let stripePromise: Promise<any> | null = null;

async function getStripeInstance(publishableKey: string): Promise<any> {
  if (!stripePromise) {
    const { loadStripe } = await import('@stripe/stripe-js');
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

/* -----------------------------------------------------------------------
 * 金额选项
 * --------------------------------------------------------------------- */
const AMOUNT_OPTIONS = [3, 5, 10, 20, 50];

/* -----------------------------------------------------------------------
 * SVG 图标组件
 * --------------------------------------------------------------------- */

// Stripe 官方 logo (正式配色)
const StripeLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg className={className} viewBox="0 0 60 25" fill="none" aria-label="Stripe">
    <path
      d="M5.45 10.22c0-.78.64-1.08 1.7-1.08 1.52 0 3.44.46 4.96 1.28V6.48c-1.66-.66-3.3-.92-4.96-.92C3.93 5.56 1.5 7.3 1.5 10.4c0 4.74 6.52 3.98 6.52 6.02 0 .92-.8 1.22-1.92 1.22-1.66 0-3.78-.68-5.46-1.6v3.98c1.86.8 3.74 1.14 5.46 1.14 4.16 0 7-2.06 7-5.22 0-5.12-6.65-4.2-6.65-5.72zm17.2 8.52V6.06h-4.06v16.58l4.06-3.9zm.32-12.52c0-1.16-.9-2.06-2.06-2.06-1.16 0-2.06.9-2.06 2.06 0 1.16.9 2.06 2.06 2.06 1.16 0 2.06-.9 2.06-2.06zM33.1 6c-1.64 0-2.7.78-3.3 1.32L29.6 6.3h-3.8v18.06l4.06-.86V21.4c.62.44 1.52 1.06 3.2 1.06 3.22 0 6.16-2.6 6.16-8.32C39.22 8.9 36.26 6 33.1 6zm-.72 12.86c-1.06 0-1.68-.38-2.12-.84v-6.6c.48-.52 1.12-.88 2.12-.88 1.62 0 2.74 1.82 2.74 4.16 0 2.38-1.1 4.16-2.74 4.16zm13.12-8.6c.84 0 1.26.58 1.44 1.58h-3.12c.2-1.06.82-1.58 1.68-1.58zm5.36 3.8c0-4.16-2.18-8.06-6.44-8.06-4.3 0-6.9 3.38-6.9 7.82 0 5.18 2.92 7.82 7.28 7.82 2.1 0 3.68-.46 4.88-1.24v-3.24c-1.2.82-2.58 1.28-4.32 1.28-1.7 0-3.2-.74-3.4-3.26h8.82c.02-.28.08-.82.08-1.12z"
      fill="#635BFF"
    />
  </svg>
);

// Stripe 安全锁盾图标
const SecureBadge: React.FC = () => (
  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
    <span>Payment secured by</span>
    <StripeLogo className="h-3.5 w-auto opacity-70 dark:opacity-50" />
  </div>
);

/* -----------------------------------------------------------------------
 * Stripe Elements 挂载组件（纯 DOM 操作）
 * --------------------------------------------------------------------- */
interface StripeElementsMountProps {
  clientSecret: string;
  publishableKey: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
  amount: number;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

const StripeElementsMount: React.FC<StripeElementsMountProps> = ({
  clientSecret,
  publishableKey,
  onSuccess,
  onError,
  amount,
  isProcessing,
  setIsProcessing,
}) => {
  const paymentRef = useRef<HTMLDivElement>(null);
  const expressRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<any>(null);
  const stripeRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stripe = await getStripeInstance(publishableKey);
        if (!stripe || cancelled) return;
        stripeRef.current = stripe;

        const elements = stripe.elements({
          clientSecret,
          appearance: {
            theme: document.documentElement.classList.contains('dark') ? 'night' : 'stripe',
            variables: {
              colorPrimary: '#635BFF',
              colorBackground: document.documentElement.classList.contains('dark') ? '#181b22' : '#ffffff',
              colorText: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
              colorTextSecondary: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
              colorDanger: '#ef4444',
              borderRadius: '12px',
              fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
              fontSizeBase: '13px',
              spacingUnit: '4px',
            },
            rules: {
              '.Input': {
                border: document.documentElement.classList.contains('dark')
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid #e2e8f0',
                boxShadow: 'none',
                padding: '10px 12px',
              },
              '.Input:focus': {
                border: '1.5px solid #635BFF',
                boxShadow: '0 0 0 3px rgba(99,91,255,0.15)',
              },
              '.Label': {
                fontWeight: '500',
                marginBottom: '4px',
              },
            },
          },
        });

        if (cancelled) return;
        elementsRef.current = elements;

        // Express Checkout Element (Apple Pay / Google Pay — auto-detect)
        if (expressRef.current) {
          const expressCheckout = elements.create('expressCheckout', {
            buttonHeight: 44,
            buttonTheme: {
              applePay: 'black',
              googlePay: 'black',
            },
            layout: {
              maxColumns: 2,
              maxRows: 1,
              overflow: 'never',
            },
          });
          expressCheckout.mount(expressRef.current);

          expressCheckout.on('confirm', async () => {
            setIsProcessing(true);
            const result = await stripe.confirmPayment({
              elements,
              redirect: 'if_required',
            });
            if (result.error) {
              onError(result.error.message || '支付失败，请重试');
            } else if (result.paymentIntent?.status === 'succeeded') {
              onSuccess(result.paymentIntent.id);
            }
            setIsProcessing(false);
          });
        }

        // Payment Element (Card / Link / etc.)
        if (paymentRef.current) {
          const paymentElement = elements.create('payment', {
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            fields: {
              billingDetails: 'never',
            },
          });
          paymentElement.mount(paymentRef.current);
          if (!cancelled) setMounted(true);
        }
      } catch (e: any) {
        console.error('Stripe Elements init error:', e);
        if (!cancelled) onError('Stripe 加载失败，请刷新重试');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSecret, publishableKey]);

  const handleSubmit = async () => {
    if (!stripeRef.current || !elementsRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      // Validate first
      const { error: submitError } = await elementsRef.current.submit();
      if (submitError) {
        onError(submitError.message || '表单验证失败，请检查输入');
        setIsProcessing(false);
        return;
      }

      const result = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (result.error) {
        if (result.error.type !== 'validation_error') {
          onError(result.error.message || '支付失败，请重试');
        }
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
      } else if (result.paymentIntent?.status === 'requires_action') {
        // 3DS etc. — handled by Stripe automatically
      }
    } catch (err: any) {
      onError(err?.message || '支付处理异常，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Express Checkout (Apple Pay / Google Pay — auto-detect by browser) */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-2">
          快捷支付 (Express Checkout)
        </div>
        <div
          ref={expressRef}
          id="express-checkout-element"
          className="min-h-[44px]"
        />
        {/* Divider with "Or pay with card" */}
        <div className="relative flex items-center justify-center my-3">
          <div className="w-full border-t border-slate-200 dark:border-white/10" />
          <span className="absolute bg-white dark:bg-[#13151b] px-3 text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
            或使用信用卡支付
          </span>
        </div>
      </div>

      {/* Payment Element — Stripe 官方表单 */}
      <div>
        {!mounted && (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">加载支付表单中...</span>
          </div>
        )}
        <div ref={paymentRef} id="payment-element" />
      </div>

      {/* Pay button */}
      {mounted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer select-none
            ${isProcessing
              ? 'bg-violet-400 dark:bg-violet-600 cursor-not-allowed'
              : 'bg-[#635BFF] hover:bg-[#4f46e5] active:scale-[0.99] shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
            }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Pay ${amount.toFixed(2)} USD</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

/* -----------------------------------------------------------------------
 * Props Interface
 * --------------------------------------------------------------------- */
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

/* -----------------------------------------------------------------------
 * 主 Modal 组件
 * --------------------------------------------------------------------- */
export const RewardModal: React.FC<RewardModalProps> = ({
  stripePublishableKey,
  publishableKey,
  defaultAmount = 5,
}) => {
  const resolvedKey = stripePublishableKey || publishableKey || '';

  const [isOpen, setIsOpen] = useState(false);
  const [region, setRegion] = useState<string>('GLOBAL');

  // Amount state
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  // Payment flow state
  const [step, setStep] = useState<'amount' | 'checkout' | 'success'>('amount');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(defaultAmount);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Post-payment blessing state
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [isSubmittingBlessing, setIsSubmittingBlessing] = useState(false);
  const [isBlessingSubmitted, setIsBlessingSubmitted] = useState(false);

  const currentAmountNum = isCustom ? parseFloat(customAmount) || 0 : amount;

  // Listen for open event
  useEffect(() => {
    const handleOpen = (
      e: CustomEvent<{ region?: string; amount?: number; simulateSuccess?: boolean; id?: string }>
    ) => {
      if (e.detail?.region) setRegion(e.detail.region);
      if (e.detail?.amount) setAmount(e.detail.amount);
      if (e.detail?.simulateSuccess) {
        setPaidAmount(e.detail.amount || 5);
        setPaymentIntentId(e.detail.id || 'pi_sim_' + Math.random().toString(36).substring(2, 9));
        setStep('success');
        setIsBlessingSubmitted(false);
        setIsOpen(true);
        return;
      }
      resetState();
      setIsOpen(true);
    };

    window.addEventListener('open-stripe-modal' as any, handleOpen);
    return () => {
      window.removeEventListener('open-stripe-modal' as any, handleOpen);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetState = () => {
    setStep('amount');
    setClientSecret('');
    setPaymentIntentId('');
    setErrorMsg('');
    setIsProcessing(false);
    setIsCreatingIntent(false);
    setCustomAmount('');
    setIsCustom(false);
    setAmount(defaultAmount);
    setDonorName('');
    setDonorMessage('');
    setIsBlessingSubmitted(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    resetState();
  };

  // Step 1 → Step 2: Create PaymentIntent, get clientSecret
  const handleProceedToCheckout = async () => {
    if (currentAmountNum <= 0 || isCreatingIntent) return;
    if (!resolvedKey) {
      setErrorMsg('Stripe 公钥未配置，请联系站长');
      return;
    }
    setIsCreatingIntent(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmountNum,
          currency: 'usd',
          country: region,
          paymentMethod: 'Stripe Elements',
        }),
      });

      const data = (await res.json()) as { ok: boolean; clientSecret?: string; id?: string; error?: string };

      if (!res.ok || !data.ok || !data.clientSecret) {
        throw new Error(data.error || '无法创建支付，请稍后重试');
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.id || '');
      setPaidAmount(currentAmountNum);
      setStep('checkout');
    } catch (err: any) {
      setErrorMsg(err?.message || '创建支付失败，请重试');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  // Stripe 支付成功回调
  const handlePaymentSuccess = useCallback(async (piId: string) => {
    setPaymentIntentId(piId);
    setStep('success');
    setErrorMsg('');

    // Notify TG on confirmed payment
    try {
      await fetch('/api/record-blessing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: piId,
          amount: Math.round(paidAmount * 100),
          currency: 'usd',
          name: donorName.trim() || '匿名支持者',
          message: donorMessage.trim() || '',
          country: region,
        }),
      });
    } catch (_) {}
  }, [paidAmount, donorName, donorMessage, region]);

  // Stripe 支付失败回调
  const handlePaymentError = useCallback((msg: string) => {
    setErrorMsg(msg);
  }, []);

  // Submit blessing
  const handleSubmitBlessing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBlessing(true);
    try {
      await fetch('/api/record-blessing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentIntentId,
          amount: Math.round(paidAmount * 100),
          currency: 'usd',
          name: donorName.trim() || '匿名支持者',
          message: donorMessage.trim() || '（支持作者，感谢创作！）',
          country: region,
        }),
      });
      setIsBlessingSubmitted(true);
    } catch (err) {
      console.error('Submit blessing failed:', err);
      setIsBlessingSubmitted(true);
    } finally {
      setIsSubmittingBlessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stripe-modal-title"
      onClick={closeModal}
    >
      {/* Modal Card */}
      <div
        className="w-full sm:max-w-[440px] bg-white dark:bg-[#13151b] rounded-t-3xl sm:rounded-2xl border-t border-x border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Back button when on checkout step */}
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => { setStep('amount'); setClientSecret(''); setErrorMsg(''); }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="返回"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              step === 'success'
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
            }`}>
              {step === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3
                id="stripe-modal-title"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight"
              >
                {step === 'success' ? '赞赏成功 · 留下寄语' : step === 'checkout' ? '安全支付' : '赞赏支持作者'}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {step === 'success'
                  ? '感谢您的温暖支持 ❤️'
                  : step === 'checkout'
                  ? `$ ${paidAmount.toFixed(2)} USD · 由 Stripe 安全加密`
                  : '信用卡 · Apple Pay · Google Pay · Link'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-5 overflow-y-auto flex-1">

          {/* ── Step 1: Amount Selection ── */}
          {step === 'amount' && (
            <div className="space-y-5">
              {/* Amount display */}
              <div className="text-center py-2">
                <div className="text-4xl font-bold text-slate-900 dark:text-white font-mono">
                  ${currentAmountNum > 0 ? currentAmountNum.toFixed(2) : '0.00'}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">USD</div>
              </div>

              {/* Amount preset chips */}
              <div className="grid grid-cols-5 gap-2">
                {AMOUNT_OPTIONS.map((amt) => {
                  const isSelected = !isCustom && amount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setIsCustom(false); setAmount(amt); }}
                      className={`py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30 scale-[1.04]'
                          : 'bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15'
                      }`}
                    >
                      ${amt}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount */}
              <div className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                isCustom
                  ? 'border-violet-400 dark:border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                  : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/4'
              }`}>
                <span className="text-sm font-bold text-slate-400 shrink-0">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="自定义金额 (例如 8.88)"
                  value={customAmount}
                  onFocus={() => setIsCustom(true)}
                  onChange={(e) => { setIsCustom(true); setCustomAmount(e.target.value); }}
                  className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                {isCustom && customAmount && (
                  <span className="text-[10px] text-violet-500 font-bold shrink-0">USD</span>
                )}
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400">
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Proceed button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={currentAmountNum <= 0 || isCreatingIntent}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer
                  ${currentAmountNum <= 0
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                    : isCreatingIntent
                    ? 'bg-violet-400 cursor-not-allowed'
                    : 'bg-[#635BFF] hover:bg-[#4f46e5] active:scale-[0.99] shadow-lg shadow-violet-500/25'
                  }`}
              >
                {isCreatingIntent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在准备支付...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>继续支付 ${currentAmountNum > 0 ? currentAmountNum.toFixed(2) : '0.00'} USD</span>
                  </>
                )}
              </button>

              {/* Test mode tip */}
              {resolvedKey.startsWith('pk_test_') && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
                  <span className="font-bold shrink-0">🔬 TEST MODE</span>
                  <span>测试卡号: <code className="font-mono font-bold">4242 4242 4242 4242</code> | 有效期随意 | CVC 任意3位</span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Stripe Checkout ── */}
          {step === 'checkout' && clientSecret && (
            <div className="space-y-4">
              {/* Error message */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400">
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="ml-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Test mode reminder */}
              {resolvedKey.startsWith('pk_test_') && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
                  <span className="font-bold shrink-0">🔬</span>
                  <div>
                    <div className="font-bold">Stripe Test Mode 沙盒</div>
                    <div>Visa: <code className="font-mono">4242 4242 4242 4242</code> | 任意到期 | 任意 CVC</div>
                  </div>
                </div>
              )}

              {/* Stripe Elements mount point */}
              <StripeElementsMount
                clientSecret={clientSecret}
                publishableKey={resolvedKey}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                amount={paidAmount}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'success' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Success banner */}
              <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-500/20 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  赞赏成功！非常感谢您的支持 ❤️
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  已成功支付 <strong>${paidAmount.toFixed(2)} USD</strong>
                </p>
                {paymentIntentId && (
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/60 font-mono">
                    {paymentIntentId}
                  </p>
                )}
              </div>

              {!isBlessingSubmitted ? (
                <form onSubmit={handleSubmitBlessing} className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>留下您的称呼与寄语（将推送到作者 Telegram）</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      称呼或社交账号
                    </label>
                    <input
                      type="text"
                      placeholder="例如：@github_username 或 Shijian Friend"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      留言寄语
                    </label>
                    <textarea
                      rows={3}
                      placeholder="写下想对作者说的话..."
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="submit"
                      disabled={isSubmittingBlessing}
                      className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-violet-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingBlessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>发送寄语 ✨</span>
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                    >
                      完成
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/4 border border-slate-200 dark:border-white/10 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    ✨ 寄语已成功送达！
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    感谢每一次陪伴，这是持续创作的最大动力。
                  </p>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 px-8 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    完成
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/8 shrink-0 bg-slate-50/60 dark:bg-[#0f1117]/60 flex items-center justify-between">
          <SecureBadge />
          <a
            href="/status/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors flex items-center gap-0.5 font-medium"
          >
            <span>赞赏记录</span>
            <Heart className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;
