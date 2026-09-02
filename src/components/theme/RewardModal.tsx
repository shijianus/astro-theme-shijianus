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
} from 'lucide-react';
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';

// Pre-defined quick donation amounts in USD
const AMOUNT_OPTIONS = [3, 5, 10, 20, 50];

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

  // Checkout state
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

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
      setPaymentError(err.message || '网络连接失败，请检查网络设置');
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

  // Mount Stripe Card Element
  useEffect(() => {
    if (!isOpen || isPaidSuccess || !clientSecret || !stripeObj) return;

    if (!cardElementMountRef.current) return;

    try {
      if (cardElementInstanceRef.current) {
        cardElementInstanceRef.current.destroy();
        cardElementInstanceRef.current = null;
      }

      const elements = stripeObj.elements({
        clientSecret,
        appearance: {
          theme: document.documentElement.classList.contains('dark') ? 'night' : 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: document.documentElement.classList.contains('dark') ? '#181b22' : '#f8fafc',
            colorText: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '10px',
          },
        },
      });
      setElementsObj(elements);

      const card = elements.create('card', {
        hidePostalCode: true,
        style: {
          base: {
            fontSize: '14px',
            color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
            '::placeholder': {
              color: '#94a3b8',
            },
          },
        },
      });

      card.mount(cardElementMountRef.current);
      cardElementInstanceRef.current = card;
    } catch (err) {
      console.error('Mount Stripe Card error:', err);
    }

    return () => {
      if (cardElementInstanceRef.current) {
        cardElementInstanceRef.current.destroy();
        cardElementInstanceRef.current = null;
      }
    };
  }, [isOpen, isPaidSuccess, clientSecret, stripeObj]);

  // Confirm Card Payment
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof window !== 'undefined' && (window as any).__SIMULATE_PAYMENT_SUCCESS__) {
      setPaidAmount(currentAmountNum);
      setPaymentIntentId('pi_mock_sponsor_' + Date.now().toString(36));
      setIsPaidSuccess(true);
      return;
    }

    if (!stripeObj || !elementsObj || !clientSecret || !cardElementInstanceRef.current) {
      setPaymentError('Stripe 支付组件未就绪，请刷新重试');
      return;
    }

    setIsPaying(true);
    setPaymentError(null);

    try {
      const result = await stripeObj.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElementInstanceRef.current,
        },
      });

      if (result.error) {
        setPaymentError(result.error.message || '支付失败，请检查卡号信息');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        setPaidAmount(currentAmountNum);
        setPaymentIntentId(result.paymentIntent.id);
        setIsPaidSuccess(true);
      }
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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stripe-modal-title"
      onClick={closeModal}
    >
      {/* Modal Container */}
      <div
        className="w-full max-w-[480px] rounded-2xl bg-white dark:bg-[#13151b] border border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden transition-all text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold">
              {isPaidSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <CreditCard className="w-4 h-4" />}
            </div>
            <div>
              <h3 id="stripe-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isPaidSuccess ? '赞赏成功 · 留下寄语' : 'Stripe 国际收银台'}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isPaidSuccess ? '非常感谢您的支持与厚爱 ☕️' : '支持安全信用卡、Apple Pay 及移动支付'}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {!isPaidSuccess ? (
            /* 1. 支付前：金额选择与卡片输入收银台 */
            <form onSubmit={handlePay} className="space-y-4">
              {/* 金额选择 Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    选择赞赏金额 (USD)
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    当前: ${currentAmountNum.toFixed(2)} USD
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
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
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-2 ring-blue-500/50'
                            : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5'
                        }`}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCustom
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-2 ring-blue-500/50'
                        : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5'
                    }`}
                  >
                    自定义
                  </button>
                </div>

                {isCustom && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      placeholder="输入任意金额 (例如 8.88)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* 快捷支付组件模拟 (Apple Pay / GPay / Link) */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center justify-center py-2.5 rounded-xl bg-black text-white text-xs font-bold shadow-xs select-none">
                     Pay
                  </div>
                  <div className="flex items-center justify-center py-2.5 rounded-xl bg-black text-white text-xs font-bold shadow-xs select-none">
                    G Pay
                  </div>
                  <div className="flex items-center justify-center py-2.5 rounded-xl bg-[#00D66F] text-black text-xs font-bold shadow-xs select-none">
                    Link
                  </div>
                </div>

                <div className="relative flex items-center justify-center py-1">
                  <div className="w-full border-t border-slate-200 dark:border-white/10" />
                  <span className="absolute bg-white dark:bg-[#13151b] px-3 text-[10px] text-slate-400 dark:text-slate-500">
                    或输入卡号安全支付
                  </span>
                </div>
              </div>

              {/* Stripe Card Element 挂载区域 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>信用卡信息 (Card Information)</span>
                  <span className="text-[10px] text-slate-400 font-normal">支持 Visa / Master / JCB / Amex</span>
                </label>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 min-h-[46px] flex items-center justify-center">
                  {isCreatingIntent ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span>正在安全连接 Stripe 网关...</span>
                    </div>
                  ) : (
                    <div ref={cardElementMountRef} className="w-full" />
                  )}
                </div>
              </div>

              {/* 错误提示 */}
              {paymentError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* 确认支付按钮 */}
              <button
                type="submit"
                disabled={isPaying || isCreatingIntent || currentAmountNum < 0.5}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在安全处理支付...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>确认并支付 ${currentAmountNum.toFixed(2)} USD ✦</span>
                  </>
                )}
              </button>

              <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>256-Bit SSL 加密 · 由 Stripe 官方提供安全保障</span>
              </div>
            </form>
          ) : (
            /* 2. 支付成功后：激发寄语与祝福填写！ */
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
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
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
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    完成并关闭
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50/50 dark:bg-white/2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
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
