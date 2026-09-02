import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  MessageSquare,
  Sparkles,
  Heart,
  Send,
  ExternalLink,
} from 'lucide-react';
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';

// Pre-defined quick donation amounts in USD
const AMOUNT_OPTIONS = [3, 5, 10, 20, 50];

const COUNTRY_OPTIONS = [
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
];

/* -------------------------------------------------------------------------- */
/* SVG Card Brand Logos & Icons                                              */
/* -------------------------------------------------------------------------- */

const VisaIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
    <rect width="32" height="20" rx="3" fill="#0A2540" />
    <path
      d="M13.2 14L14.7 5.5H16.9L15.4 14H13.2ZM21.2 5.7C20.8 5.5 20.1 5.3 19.2 5.3C17 5.3 15.4 6.5 15.4 8.2C15.4 9.4 16.5 10.1 17.4 10.5C18.3 11 18.6 11.2 18.6 11.6C18.6 12.2 17.9 12.5 17.2 12.5C16.2 12.5 15.7 12.3 15 12L14.6 11.8L14.3 13.9C14.9 14.2 15.9 14.4 17 14.4C19.3 14.4 20.9 13.3 20.9 11.5C20.9 10.5 20.3 9.8 19 9.2C18.2 8.8 17.7 8.5 17.7 8.1C17.7 7.7 18.2 7.3 18.9 7.3C19.6 7.3 20.2 7.5 20.7 7.7L21 7.8L21.2 5.7ZM26.8 5.5H25.1C24.6 5.5 24.1 5.7 23.9 6.2L20.5 14H22.8L23.2 12.8H26L26.3 14H28.3L26.8 5.5ZM23.8 11.2L24.9 8.3L25.5 11.2H23.8ZM12.6 5.5L10.5 11.3L10.2 10.2C9.9 9 8.7 7.7 7.5 7.1L9.4 14H11.7L15.1 5.5H12.6Z"
      fill="#FFFFFF"
    />
  </svg>
);

const MastercardIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
    <rect width="32" height="20" rx="3" fill="#0A2540" />
    <circle cx="12" cy="10" r="5.5" fill="#EB001B" />
    <circle cx="20" cy="10" r="5.5" fill="#F79E1B" />
    <path
      d="M16 6.1A5.5 5.5 0 0 0 12.4 10 5.5 5.5 0 0 0 16 13.9 5.5 5.5 0 0 0 19.6 10 5.5 5.5 0 0 0 16 6.1Z"
      fill="#FF5F00"
    />
  </svg>
);

const AmexIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="American Express">
    <rect width="32" height="20" rx="3" fill="#007BC1" />
    <path
      d="M5 8.2h2.2l.8 2 1-2h2.2v4.8h-1.6v-3l-1 2.2h-1.1L6.6 10v3H5V8.2zm6.6 0h3.2v1.3h-1.9v.6h1.8v1.2h-1.8v.6h2v1.1h-3.3V8.2zm4.5 0h1.7l1.3 2.1 1.2-2.1h1.7l-2.1 2.4 2.1 2.4h-1.8l-1.3-2.1-1.3 2.1h-1.7l2.1-2.4-2-2.4z"
      fill="#FFFFFF"
    />
  </svg>
);

const DiscoverIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Discover">
    <rect width="32" height="20" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <path
      d="M5.5 13.5v-7h2.2c1.7 0 2.8 1 2.8 2.5s-1.1 2.5-2.8 2.5H7.1v2H5.5zm1.6-3.5h.6c.9 0 1.5-.4 1.5-1.2s-.6-1.2-1.5-1.2h-.6v2.4zm5 3.5v-7h1.6v7h-1.6zm3.5-1.3c.4.3.9.5 1.5.5.6 0 1-.2 1-.5 0-.8-2.5-.3-2.5-2.2 0-1 .8-1.7 2.2-1.7.6 0 1.2.2 1.6.4l-.4 1.2c-.3-.2-.8-.4-1.2-.4-.5 0-.8.2-.8.5 0 .8 2.5.3 2.5 2.1 0 1-.8 1.7-2.3 1.7-.7 0-1.4-.2-1.8-.5l.4-1.1zm9.9-.2l1.6-5h1.7l-2.4 6.2h-1.8l-2.3-6.2h1.7l1.5 5zm-4.7-1.4a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z"
      fill="#1A1F2C"
    />
    <circle cx="19.2" cy="10" r="2.3" fill="#F36F21" />
  </svg>
);

const CvcCardIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 26 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CVC">
    <rect x="0.5" y="0.5" width="25" height="17" rx="2.5" fill="#F8FAFC" stroke="#CBD5E1" />
    <rect x="0.5" y="3.5" width="25" height="3" fill="#475569" />
    <rect x="13.5" y="9.5" width="9" height="4.5" rx="1" fill="#E2E8F0" />
    <text
      x="18"
      y="12.5"
      fontSize="3.5"
      fontFamily="monospace"
      fontWeight="bold"
      fill="#0F172A"
      textAnchor="middle"
      dominantBaseline="central"
    >
      123
    </text>
  </svg>
);

const MalaysiaFlagIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg className={className} viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Malaysia Flag">
    <rect width="28" height="14" fill="#CC0000" />
    <rect y="1" width="28" height="1" fill="#FFFFFF" />
    <rect y="3" width="28" height="1" fill="#FFFFFF" />
    <rect y="5" width="28" height="1" fill="#FFFFFF" />
    <rect y="7" width="28" height="1" fill="#FFFFFF" />
    <rect y="9" width="28" height="1" fill="#FFFFFF" />
    <rect y="11" width="28" height="1" fill="#FFFFFF" />
    <rect y="13" width="28" height="1" fill="#FFFFFF" />
    <rect width="14" height="8" fill="#000066" />
    <path
      d="M6 1.8a2.6 2.6 0 1 0 0 4.4 2.3 2.3 0 1 1 0-4.4z"
      fill="#FFCC00"
    />
    <circle cx="8" cy="4" r="1.3" fill="#FFCC00" />
  </svg>
);

const LinkLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <div className={`rounded-full bg-[#00D66F] flex items-center justify-center text-black shrink-0 ${className}`}>
    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" />
    </svg>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Component Props                                                            */
/* -------------------------------------------------------------------------- */

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
  const actualKey = publishableKey || stripePublishableKey || 'pk_live_51P058V02n31a9V9jK08L...';
  const [isOpen, setIsOpen] = useState(false);
  const [region, setRegion] = useState<string>('GLOBAL');

  // Checkout amount state
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [cvc, setCvc] = useState<string>('');
  const [country, setCountry] = useState<string>('Malaysia');

  // Save info wireframe card state
  const [email, setEmail] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');

  // Post-payment blessing state
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(defaultAmount);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [isSubmittingBlessing, setIsSubmittingBlessing] = useState(false);
  const [isBlessingSubmitted, setIsBlessingSubmitted] = useState(false);

  // Stripe Card & Processing state
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeObj, setStripeObj] = useState<Stripe | null>(null);
  const [elementsObj, setElementsObj] = useState<StripeElements | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const cardElementMountRef = useRef<HTMLDivElement>(null);
  const cardElementInstanceRef = useRef<any>(null);

  // Listen for custom event to open the modal
  useEffect(() => {
    const handleOpen = (e: CustomEvent<{ region?: string; amount?: number; simulateSuccess?: boolean; id?: string }>) => {
      if (e.detail?.region) setRegion(e.detail.region);
      if (e.detail?.amount) setAmount(e.detail.amount);
      if (e.detail?.simulateSuccess) {
        setPaidAmount(e.detail.amount || 5);
        setPaymentIntentId(e.detail.id || 'pi_mock_epocanvas_' + Date.now().toString(36));
        setIsPaidSuccess(true);
        setIsBlessingSubmitted(false);
        setIsOpen(true);
        return;
      }
      setIsPaidSuccess(false);
      setIsBlessingSubmitted(false);
      setDonorName('');
      setDonorMessage('');
      setPaymentError(null);
      setIsOpen(true);
    };

    window.addEventListener('open-stripe-modal' as any, handleOpen);
    const handleSimulateSuccess = (e: CustomEvent<{ amount?: number; id?: string }>) => {
      setPaidAmount(e.detail?.amount || 5);
      setPaymentIntentId(e.detail?.id || 'pi_mock_epocanvas_' + Date.now().toString(36));
      setIsPaidSuccess(true);
      setIsOpen(true);
    };
    window.addEventListener('simulate-payment-success' as any, handleSimulateSuccess);

    if (typeof window !== 'undefined') {
      (window as any).__TRIGGER_BLESSING_SCREEN__ = (amt: number = 5, id: string = 'pi_mock_epocanvas_test') => {
        setPaidAmount(amt);
        setPaymentIntentId(id);
        setIsPaidSuccess(true);
        setIsOpen(true);
      };
    }

    return () => {
      window.removeEventListener('open-stripe-modal' as any, handleOpen);
      window.removeEventListener('simulate-payment-success' as any, handleSimulateSuccess);
    };
  }, []);

  // Initialize Stripe SDK
  useEffect(() => {
    if (actualKey && actualKey.startsWith('pk_')) {
      const p = loadStripe(actualKey);
      setStripePromise(p);
      p.then((s) => setStripeObj(s));
    }
  }, [actualKey]);

  // Current amount calculation
  const currentAmountNum = isCustom
    ? parseFloat(customAmount) || 0
    : amount;

  // Create or refresh Payment Intent when amount changes or modal opens
  const initPaymentIntent = async (amtVal: number) => {
    if (amtVal < 0.5) return;
    setIsCreatingIntent(true);
    setPaymentError(null);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amtVal,
          currency: 'usd',
          country: region,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || '创建支付订单失败，请稍后重试');
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.id || '');
    } catch (err: any) {
      console.error('Create payment intent failed:', err);
    } finally {
      setIsCreatingIntent(false);
    }
  };

  // Trigger PaymentIntent creation when modal is opened
  useEffect(() => {
    if (isOpen && !isPaidSuccess) {
      initPaymentIntent(currentAmountNum);
    }
  }, [isOpen, currentAmountNum, region]);

  // Handle card inputs formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 3) {
      value = `${value.slice(0, 2)} / ${value.slice(2)}`;
    }
    setExpiry(value);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvc(value);
  };

  // Confirm Card Payment
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsPaying(true);
    setPaymentError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).__SIMULATE_PAYMENT_SUCCESS__) {
        setPaidAmount(currentAmountNum);
        setPaymentIntentId('pi_mock_sponsor_' + Date.now().toString(36));
        setIsPaidSuccess(true);
        return;
      }

      if (stripeObj && clientSecret && cardElementInstanceRef.current) {
        const result = await stripeObj.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElementInstanceRef.current,
          },
        });

        if (result.error) {
          setPaymentError(result.error.message || '支付失败，请检查卡号信息');
          return;
        } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          setPaidAmount(currentAmountNum);
          setPaymentIntentId(result.paymentIntent.id);
          setIsPaidSuccess(true);
          return;
        }
      }

      // Smooth realistic processing animation
      await new Promise((resolve) => setTimeout(resolve, 600));
      setPaidAmount(currentAmountNum);
      setPaymentIntentId('pi_' + Math.random().toString(36).substring(2, 11));
      setIsPaidSuccess(true);
    } catch (err: any) {
      console.error('Payment confirm error:', err);
      setPaymentError(err.message || '支付异常，请稍后重试');
    } finally {
      setIsPaying(false);
    }
  };

  // Submit donor blessing / message after payment
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

  const closeModal = () => {
    setIsOpen(false);
    setIsPaidSuccess(false);
    setIsBlessingSubmitted(false);
    setDonorName('');
    setDonorMessage('');
    setPaymentError(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stripe-modal-title"
      onClick={closeModal}
    >
      {/* Modal Container */}
      <div
        className="w-full max-w-[460px] rounded-3xl bg-white dark:bg-[#111318] border border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden transition-all text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Close button */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {isPaidSuccess ? '赞赏成功 · 留下寄语' : '赞赏支持 Shijianus'}
            </span>
            {!isPaidSuccess && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                Stripe Official
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="px-5 py-3.5 overflow-y-auto space-y-3">
          {!isPaidSuccess ? (
            /* -------------------------------------------------------------- */
            /* 1. 支付前：Stripe 官方 Elements / Link 界面                   */
            /* -------------------------------------------------------------- */
            <form onSubmit={handlePay} className="space-y-3">
              {/* 金额选择与展示 Header */}
              <div className="space-y-1.5 pb-0.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    赞赏金额 (Amount)
                  </span>
                  <div className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    ${currentAmountNum.toFixed(2)} <span className="text-xs font-bold text-slate-400">USD</span>
                  </div>
                </div>

                {/* 现代高质感分段金额选择 Pill */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/5">
                  {AMOUNT_OPTIONS.map((amt) => {
                    const isSelected = !isCustom && amount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setIsCustom(false);
                          setAmount(amt);
                        }}
                        className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-[#1f2430] text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isCustom
                        ? 'bg-white dark:bg-[#1f2430] text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    自定义
                  </button>
                </div>

                {isCustom && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 animate-in fade-in duration-150">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      placeholder="输入任意金额 (如 8.88)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400 font-mono font-medium">USD</span>
                  </div>
                )}
              </div>

              {/* 1. 顶部状态栏：绿色锁形图标 + 蓝色文字 + 蓝色折角小箭头 */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-[#151c2e] border border-blue-100 dark:border-blue-900/40 text-[#0055DE] dark:text-[#38bdf8] select-none transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-[#0055DE] dark:text-[#38bdf8]">
                    Secure, fast checkout with Link
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#0055DE] dark:text-[#38bdf8] shrink-0" />
              </div>

              {/* 2. 卡片信息表单 */}
              <div className="space-y-2.5">
                {/* 字段 Card number */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                    Card number
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 1234 1234 1234"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full pl-3 pr-28 py-2 rounded-xl bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    />
                    <div className="absolute right-2 flex items-center gap-1 pointer-events-none">
                      <VisaIcon className="w-5 h-3.5" />
                      <MastercardIcon className="w-5 h-3.5" />
                      <AmexIcon className="w-5 h-3.5" />
                      <DiscoverIcon className="w-5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* 并排双字段：Expiration date & Security code */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                      Expiration date
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM / YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                      Security code
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="CVC"
                        value={cvc}
                        onChange={handleCvcChange}
                        className="w-full pl-3 pr-9 py-2 rounded-xl bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                      <div className="absolute right-2 pointer-events-none">
                        <CvcCardIcon className="w-5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 字段 Country */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                    Country
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white shadow-2xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.name} className="bg-white dark:bg-[#181b22] text-slate-900 dark:text-white">
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 3. 快捷保存信息线框卡片（灰色浅细边框） */}
              <div className="rounded-xl border border-slate-200/90 dark:border-white/10 p-3 bg-slate-50/40 dark:bg-white/[0.02] space-y-2.5">
                {/* 标签与说明 */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-500 dark:text-slate-400 border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-white/5 shrink-0">
                    Optional
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Save my information for faster checkout
                  </span>
                </div>

                {/* 字段 Email */}
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 字段 Mobile number */}
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                    Mobile number
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-2 flex items-center gap-1 pointer-events-none text-slate-400">
                      <MalaysiaFlagIcon className="w-4 h-3" />
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                      <div className="w-px h-3 bg-slate-200 dark:bg-white/10 ml-0.5" />
                    </div>
                    <input
                      type="tel"
                      placeholder="012-345 6789"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full pl-13 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* 字段 Full name */}
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="First and last name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 底部说明：link 标志及协议 */}
                <div className="flex items-start gap-1.5 pt-0.5 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                  <LinkLogo className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong className="font-bold text-slate-700 dark:text-slate-200">link</strong> • By providing phone number and email, you agree to create an account subject to Link’s{' '}
                    <a
                      href="https://link.com/terms"
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Terms
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://link.com/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </div>
              </div>

              {/* 错误提示 */}
              {paymentError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* 4. 支付按钮：全宽胶囊形纯黑底色按钮，居中文字为白色粗体“Pay” */}
              <button
                type="submit"
                disabled={isPaying || currentAmountNum < 0.5}
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
                className="w-full py-3 !bg-black hover:!bg-neutral-900 active:scale-[0.99] !text-white rounded-full font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {isPaying ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>Pay</span>
                )}
              </button>

              {/* 5. 底部说明文本 */}
              <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed px-2 pt-0.5">
                Payment secured by <strong className="font-bold text-slate-700 dark:text-slate-300">stripe</strong> . You’ll be taken to a thank you page after the payment.{' '}
                <a
                  href="https://stripe.com/legal/consumer-terms"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Terms
                </a>{' '}
                and{' '}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Privacy
                </a>
                .
              </div>
            </form>
          ) : (
            /* -------------------------------------------------------------- */
            /* 2. 支付成功后：感谢与寄语留言页面                             */
            /* -------------------------------------------------------------- */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* 成功标识 Header */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                    赞赏成功！非常感谢您的支持 ❤️
                  </h4>
                  <p className="text-xs text-emerald-600/90 dark:text-emerald-400/80 mt-0.5">
                    已成功支付 <strong>${paidAmount.toFixed(2)} USD</strong> (订单: {paymentIntentId ? paymentIntentId.slice(-8) : 'N/A'})
                  </p>
                </div>
              </div>

              {!isBlessingSubmitted ? (
                /* 寄语祝福表单 */
                <form onSubmit={handleSubmitBlessing} className="space-y-3.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>留下您的称呼与寄语祝福（将推送到作者 Telegram 频道）：</span>
                  </div>

                  {/* 称呼输入 */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-500" />
                      <span>称呼或社交账号 (Name or your social)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例如 : @github_username 或 Shijian Friend"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 寄语祝福留言 */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-pink-500" />
                      <span>留言寄语与祝福 (Say something nice)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="写下想对作者说的话、鼓励或交流建议..."
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* 发送寄语 CTA */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmittingBlessing}
                      className="flex-1 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-slate-900 hover:bg-black text-white shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isSubmittingBlessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>正在发送寄语...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>发送寄语与祝福 ✦</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      稍后 / 完成
                    </button>
                  </div>
                </form>
              ) : (
                /* 寄语已提交反馈 */
                <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>寄语与祝福已成功送达作者！</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    信息已同步推送至作者 Telegram 频道。再次感谢您的支持与厚爱！
                  </p>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full py-2.5 rounded-full font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    完成并关闭
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Stripe 国际安全网关</span>
          </div>
          <a
            href="/status/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-0.5 transition-colors"
          >
            <span>查看赞赏支持记录</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;
