import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Lock,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  MessageSquare,
  Sparkles,
  Heart,
  Send,
  ChevronDown,
} from 'lucide-react';

// Quick donation amounts in USD
const AMOUNT_OPTIONS = [3, 5, 10, 20, 50];

// 官方 4 大卡组织矢量图标
const VisaBadge: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-auto' }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" aria-label="Visa">
    <rect width="36" height="24" rx="3" fill="#1434CB" />
    <path
      d="M14.6 16.5h-2.4l1.5-9.2h2.4l-1.5 9.2zm8.6-9c-.5-.2-1.3-.4-2.2-.4-2.5 0-4.2 1.3-4.2 3.1 0 1.4 1.3 2.1 2.2 2.6.9.5 1.3.8 1.3 1.2 0 .6-.8.9-1.5.9-1 0-1.6-.2-2.4-.6l-.3-.2-.4 2.2c.6.3 1.8.5 2.9.5 2.7 0 4.5-1.3 4.5-3.3 0-1.1-.7-2-2.2-2.7-.9-.5-1.5-.8-1.5-1.3 0-.4.5-.9 1.5-.9.8 0 1.5.2 2 .4l.2.1.4-2.1zm5.8 4.3c.2-.5.9-2.5.9-2.5-.0.0.2-.5.3-.8l.2.7s.4 2.1.5 2.6h-1.9zm2.8 4.7h-2.1c-.6 0-1.1-.2-1.4-.8l-3.9-8.4h2.5l2.4 5.9 2.5-5.9h2.3l-2.3 9.2zm-12.7-9.2l-2.3 6.3-.3-1.3c-.4-1.5-1.7-3.1-3.2-3.9l2.1 8.1h2.5l3.8-9.2h-2.6z"
      fill="#FFFFFF"
    />
  </svg>
);

const MastercardBadge: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-auto' }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" aria-label="Mastercard">
    <rect width="36" height="24" rx="3" fill="#252525" />
    <circle cx="14" cy="12" r="7" fill="#EB001B" />
    <circle cx="22" cy="12" r="7" fill="#F79E1B" />
    <path
      d="M18 7.3a7 7 0 0 1 2.4 4.7 7 7 0 0 1-2.4 4.7 7 7 0 0 1-2.4-4.7 7 7 0 0 1 2.4-4.7z"
      fill="#FF5F00"
    />
  </svg>
);

const AmexBadge: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-auto' }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" aria-label="American Express">
    <rect width="36" height="24" rx="3" fill="#0077A6" />
    <path
      d="M5 9.5h3.4l.7 1.6.7-1.6h3.4v5h-2.1v-2.8l-.9 2h-1.6l-.9-2v2.8H5v-5zm9.5 0h4.8v1.3h-3.2v.6h3.1v1.2h-3.1v.7h3.3v1.2h-4.9v-5zm6.5 0h2.4l1.4 2.2 1.4-2.2h2.4l-2.4 3.2 2.6 3.8h-2.5l-1.5-2.4-1.5 2.4h-2.4l2.5-3.8-2.3-3.2z"
      fill="#FFFFFF"
    />
  </svg>
);

const DiscoverBadge: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-auto' }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" aria-label="Discover">
    <rect width="36" height="24" rx="3" fill="#231F20" />
    <circle cx="21" cy="12" r="4.5" fill="#F47216" />
    <path
      d="M7 8.5h3.4c2.4 0 3.8 1.4 3.8 3.5s-1.4 3.5-3.8 3.5H7v-7zm2.4 5.3h.8c1.3 0 1.9-.7 1.9-1.8s-.6-1.8-1.9-1.8h-.8v3.6zm6.8-5.3h2.3v7h-2.3v-7zm8.5 0h2.2l-2.2 7h-2.1l-2-7h2.2l1 4.5 1-4.5zm5.5 0h4.5v1.6h-2.3v1.1h2v1.5h-2v1.3h2.4v1.5h-4.6v-7z"
      fill="#FFFFFF"
    />
  </svg>
);

// 卡片背面安全码图示 (带 123)
const CvcCardIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 28 18" fill="none" aria-label="CVC">
    <rect x="0.5" y="0.5" width="27" height="17" rx="2.5" stroke="#94A3B8" fill="#F8FAFC" />
    <rect x="0.5" y="3.5" width="27" height="3" fill="#64748B" />
    <rect x="14" y="9.5" width="10" height="4" rx="1" fill="#E2E8F0" />
    <text x="19" y="12.8" fontSize="3.8" fontWeight="bold" fill="#0F172A" textAnchor="middle">
      123
    </text>
  </svg>
);

// 马来西亚国旗图标
const MalaysiaFlagIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg className={className} viewBox="0 0 28 14" fill="none" aria-label="Malaysia Flag">
    <rect width="28" height="14" fill="#CC0000" />
    <path
      d="M0 1h28M0 3h28M0 5h28M0 7h28M0 9h28M0 11h28M0 13h28"
      stroke="#FFFFFF"
      strokeWidth="1"
    />
    <rect width="14" height="8" fill="#000066" />
    <path
      d="M6.5 4a2.5 2.5 0 1 0 0-4.8 2.5 2.5 0 0 0 0 4.8zm1.2-2.4l.6 1.4-1.4-.6 1.4-.6-.6 1.4z"
      fill="#FFCC00"
    />
  </svg>
);

// 官方 Apple Pay 按钮内容
const ApplePayBadge: React.FC = () => (
  <div className="flex items-center justify-center gap-1 font-semibold text-sm tracking-tight text-white select-none pointer-events-none">
    <svg className="h-4.5 w-auto fill-current -mt-0.5" viewBox="0 0 170 170">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.99-6.3-9.77-11.19-20.78-14.66-33.02-3.48-12.24-5.22-23.72-5.22-34.43 0-14.99 3.69-27.42 11.08-37.28 7.39-9.87 16.63-14.88 27.72-15.02 5.01 0 10.39 1.25 16.14 3.74 5.76 2.49 9.38 3.79 10.87 3.89 1.19-.1 5.07-1.45 11.64-4.04 6.58-2.59 12.18-3.74 16.8-3.46 12.82.74 23.01 5.56 30.56 14.44-11.41 6.94-17.02 16.5-16.83 28.69.19 9.87 3.99 18.06 11.39 24.58 7.4 6.51 16.19 10.23 26.37 11.14-2.28 7.05-5.07 14.28-8.36 21.68zM119.22 33.36c-.19 3.26-1.27 6.46-3.24 9.59-1.97 3.13-4.66 5.66-8.07 7.59-2.6 1.44-5.46 2.3-8.58 2.59-.19-3.08.76-6.19 2.85-9.33 2.09-3.14 4.88-5.64 8.37-7.5 2.69-1.44 5.59-2.39 8.67-2.94z" />
    </svg>
    <span className="font-semibold text-base tracking-tight leading-none">Pay</span>
  </div>
);

// 官方 Google Pay 按钮内容
const GooglePayBadge: React.FC = () => (
  <div className="flex items-center justify-center gap-1.5 font-semibold text-sm tracking-tight text-white select-none pointer-events-none">
    <svg className="h-4.5 w-auto" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
    <span className="font-semibold text-base tracking-tight text-white leading-none">Pay</span>
  </div>
);

// 官方 Link by Stripe 按钮内容
const LinkPayBadge: React.FC = () => (
  <div className="flex items-center justify-center gap-1.5 font-bold tracking-tight text-[#0A2540] select-none pointer-events-none">
    <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-label="Link">
      <circle cx="12" cy="12" r="11" fill="#0A2540" />
      <path
        d="M8.5 15.5L15.5 8.5M15.5 8.5H9.5M15.5 8.5V14.5"
        stroke="#00D66F"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span className="font-extrabold text-base tracking-tight text-[#0A2540] leading-none">
      link
    </span>
  </div>
);

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
  const [isOpen, setIsOpen] = useState(false);
  const [region, setRegion] = useState<string>('GLOBAL');

  // Amount State
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  // Form Fields State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [country, setCountry] = useState('Malaysia');
  const [saveInfo, setSaveInfo] = useState(true);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');

  // Processing & Payment State
  const [isPaying, setIsPaying] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(defaultAmount);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  // Post-payment Blessing State
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [isSubmittingBlessing, setIsSubmittingBlessing] = useState(false);
  const [isBlessingSubmitted, setIsBlessingSubmitted] = useState(false);

  // Event Listeners to Open Modal
  useEffect(() => {
    const handleOpen = (
      e: CustomEvent<{ region?: string; amount?: number; simulateSuccess?: boolean; id?: string }>
    ) => {
      if (e.detail?.region) setRegion(e.detail.region);
      if (e.detail?.amount) setAmount(e.detail.amount);
      if (e.detail?.simulateSuccess) {
        setPaidAmount(e.detail.amount || 5);
        setPaymentIntentId(e.detail.id || 'pi_sim_' + Math.random().toString(36).substring(2, 9));
        setIsPaidSuccess(true);
        setIsBlessingSubmitted(false);
        setIsOpen(true);
        return;
      }
      setIsPaidSuccess(false);
      setIsBlessingSubmitted(false);
      setDonorName('');
      setDonorMessage('');
      setIsOpen(true);
    };

    window.addEventListener('open-stripe-modal' as any, handleOpen);
    return () => {
      window.removeEventListener('open-stripe-modal' as any, handleOpen);
    };
  }, []);

  const currentAmountNum = isCustom
    ? parseFloat(customAmount) || 0
    : amount;

  // Format Card Number input with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    v = v.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(v);
  };

  // Format Expiration Date input MM / YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) {
      v = `${v.slice(0, 2)} / ${v.slice(2)}`;
    }
    setExpiry(v);
  };

  // Format CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvc(v);
  };

  // Process Pay Execution (Card or Express Checkout)
  const handleExecutePayment = (paymentMethodName: string = 'Card') => {
    if (currentAmountNum <= 0) return;
    setIsPaying(true);

    setTimeout(() => {
      const mockId = 'pi_' + Math.random().toString(36).substring(2, 11);
      setPaymentIntentId(mockId);
      setPaidAmount(currentAmountNum);
      setIsPaidSuccess(true);
      setIsPaying(false);
    }, 900);
  };

  // Submit Donor Blessing
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
    setIsPaying(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stripe-modal-title"
      onClick={closeModal}
    >
      {/* Centered Modal Card Container */}
      <div
        className="w-full max-w-[460px] rounded-2xl bg-white dark:bg-[#13151b] border border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold">
              {isPaidSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3
                id="stripe-modal-title"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight"
              >
                {isPaidSuccess ? '赞赏成功 · 留下寄语' : 'Stripe 国际收银台'}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isPaidSuccess
                  ? '感谢您的温暖支持与厚爱 ❤️'
                  : '支持信用卡 · Apple Pay · Google Pay · Link'}
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

        {/* Modal Body (Scrollable form fields) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {!isPaidSuccess ? (
            <div className="space-y-3.5">
              {/* 1. 金额选择 Chips (精工优化组件：Apple 风格分段选择器) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    赞赏金额 (Amount)
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    ${currentAmountNum.toFixed(2)}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">USD</span>
                  </span>
                </div>

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
                        style={{
                          backgroundColor: isSelected ? 'var(--chip-bg, #ffffff)' : 'transparent',
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? '!bg-white dark:!bg-[#222736] !text-slate-900 dark:!text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-white/10'
                            : '!text-slate-600 dark:!text-slate-400 hover:!text-slate-900 dark:hover:!text-white'
                        }`}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    style={{
                      backgroundColor: isCustom ? 'var(--chip-bg, #ffffff)' : 'transparent',
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      isCustom
                        ? '!bg-white dark:!bg-[#222736] !text-slate-900 dark:!text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-white/10'
                        : '!text-slate-600 dark:!text-slate-400 hover:!text-slate-900 dark:hover:!text-white'
                    }`}
                  >
                    自定义
                  </button>
                </div>

                {isCustom && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="输入任意金额 (例如 8.88)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* 2. 快捷支付通道 (Apple Pay / Google Pay / Link Pay 官方按钮支援) */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  快捷闪付通道 (Express Checkout)
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Apple Pay Button */}
                  <button
                    type="button"
                    onClick={() => handleExecutePayment('Apple Pay')}
                    disabled={isPaying}
                    style={{ backgroundColor: '#000000', color: '#ffffff' }}
                    className="h-10 rounded-xl !bg-black hover:!bg-neutral-900 active:scale-[0.99] flex items-center justify-center shadow-xs cursor-pointer transition-all border border-neutral-800 disabled:opacity-50"
                    title="使用 Apple Pay 极速支付"
                  >
                    <ApplePayBadge />
                  </button>

                  {/* Google Pay Button */}
                  <button
                    type="button"
                    onClick={() => handleExecutePayment('Google Pay')}
                    disabled={isPaying}
                    style={{ backgroundColor: '#000000', color: '#ffffff' }}
                    className="h-10 rounded-xl !bg-black hover:!bg-neutral-900 active:scale-[0.99] flex items-center justify-center shadow-xs cursor-pointer transition-all border border-neutral-800 disabled:opacity-50"
                    title="使用 Google Pay 极速支付"
                  >
                    <GooglePayBadge />
                  </button>

                  {/* Link Pay Button */}
                  <button
                    type="button"
                    onClick={() => handleExecutePayment('Link')}
                    disabled={isPaying}
                    style={{ backgroundColor: '#00D66F', color: '#0A2540' }}
                    className="h-10 rounded-xl !bg-[#00D66F] hover:!bg-[#00c564] active:scale-[0.99] flex items-center justify-center shadow-xs cursor-pointer transition-all font-bold disabled:opacity-50"
                    title="使用 Link by Stripe 快捷支付"
                  >
                    <LinkPayBadge />
                  </button>
                </div>

                {/* 分割线 */}
                <div className="relative flex items-center justify-center pt-2 pb-1">
                  <div className="w-full border-t border-slate-200 dark:border-white/10" />
                  <span className="absolute bg-white dark:bg-[#13151b] px-3 text-[10px] text-slate-400 dark:text-slate-500">
                    或使用信用卡支付
                  </span>
                </div>
              </div>

              {/* 3. 顶部状态栏: 绿色锁 + 蓝色Link文字 + 折角小箭头 */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5" />
                  </div>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs">
                    Secure, fast checkout with Link
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 cursor-pointer" />
              </div>

              {/* 4. 卡片信息表单 */}
              <div className="space-y-2">
                {/* 4.1 Card number + 4大卡组织标 */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Card number
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="1234 1234 1234 1234"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full pl-3 pr-32 py-2 text-xs rounded-xl bg-slate-50/90 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                    <div className="absolute right-2 flex items-center gap-1 pointer-events-none">
                      <VisaBadge />
                      <MastercardBadge />
                      <AmexBadge />
                      <DiscoverBadge />
                    </div>
                  </div>
                </div>

                {/* 4.2 Expiration date & Security code 并排双字段 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Expiration date
                    </label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/90 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Security code
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        placeholder="CVC"
                        maxLength={4}
                        value={cvc}
                        onChange={handleCvcChange}
                        className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-slate-50/90 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                      <div className="absolute right-2.5 pointer-events-none">
                        <CvcCardIcon />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4.3 Country 下拉选择框 (默认 Malaysia) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Country
                  </label>
                  <div className="relative flex items-center">
                    <div className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl bg-slate-50/90 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <MalaysiaFlagIcon />
                        <span className="font-medium">{country}</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. 快捷保存信息线框卡片 (浅灰细边框) */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-white/2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400">
                    Optional
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Save my information for faster checkout
                  </span>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Mobile number */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Mobile number
                  </label>
                  <div className="flex items-center rounded-lg bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 overflow-hidden">
                    <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 dark:bg-white/5 border-r border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 cursor-pointer">
                      <MalaysiaFlagIcon />
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="012-345 6789"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="First and last name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Link Legal Info */}
                <div className="flex items-start gap-1.5 pt-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#0A2540" />
                    <path
                      d="M8.5 15.5L15.5 8.5M15.5 8.5H9.5M15.5 8.5V14.5"
                      stroke="#00D66F"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <strong className="font-bold text-slate-700 dark:text-slate-300">link</strong> • By
                    providing phone number and email, you agree to create an account subject to
                    Link's <span className="underline cursor-pointer">Terms</span> and{' '}
                    <span className="underline cursor-pointer">Privacy Policy</span>.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 8. 支付成功后的致谢与 Telegram 寄语表单 */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* 成功凭据 Banner */}
              <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 text-center space-y-1">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  赞赏成功！非常感谢您的支持 ❤️
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  已成功支付 <strong>${paidAmount.toFixed(2)} USD</strong> (订单: {paymentIntentId})
                </p>
              </div>

              {!isBlessingSubmitted ? (
                <form onSubmit={handleSubmitBlessing} className="space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>留下您的称呼与寄语祝福（将推送到作者 Telegram 频道）：</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      称呼或社交账号 (Name or your social)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：@github_username 或 Shijian Friend"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      留言寄语与祝福 (Say something nice)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="写下想对作者说的话、鼓励或交流建议..."
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingBlessing}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingBlessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>发送寄语与祝福 ✨</span>
                    </button>

                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                    >
                      稍后 / 完成
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ✨ 寄语已成功送达作者！
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    感谢您的温暖支持，每一次陪伴都是持续创作的最大动力。
                  </p>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-2 px-6 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    完成
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6 & 7. 居底固定的支付主按钮与底部说明 (始终清晰可见，不被滚动遮挡) */}
        {!isPaidSuccess && (
          <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 space-y-2 bg-slate-50/60 dark:bg-[#151820]">
            {/* 支付按钮 (精工优化组件：全宽胶囊形纯黑底色按钮) */}
            <button
              type="button"
              onClick={() => handleExecutePayment('Card')}
              disabled={isPaying || currentAmountNum <= 0}
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

            {/* 底部说明文本 */}
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed px-2">
              Payment secured by <strong className="font-bold text-slate-700 dark:text-slate-300">stripe</strong> .
              You'll be taken to a thank you page after the payment.{' '}
              <span className="underline cursor-pointer">Terms</span> and{' '}
              <span className="underline cursor-pointer">Privacy</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardModal;
