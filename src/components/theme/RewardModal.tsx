import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  User,
  MessageSquareHeart,
  CheckCircle2,
} from 'lucide-react';

export type RegionKey = 'CN' | 'HK' | 'GB' | 'GLOBAL';
export type StripeModalViewMode = 'sponsor_form' | 'stripe_checkout';

interface RewardModalProps {
  publishableKey?: string;
  arbitrumAddress?: string;
  trc20Address?: string;
  erc20Address?: string;
  paypalMeUrl?: string;
  paypalUkMeUrl?: string;
}

const PRESET_AMOUNTS = [3, 5, 10, 20, 50];

// Fallback Stripe SDK Loader
function loadStripeSdk(publishableKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window not available'));
    if ((window as any).Stripe) {
      resolve((window as any).Stripe(publishableKey));
      return;
    }
    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if ((window as any).Stripe) {
          resolve((window as any).Stripe(publishableKey));
        } else {
          reject(new Error('Stripe failed to load'));
        }
      });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      if ((window as any).Stripe) {
        resolve((window as any).Stripe(publishableKey));
      } else {
        reject(new Error('Stripe failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Stripe SDK'));
    document.head.appendChild(script);
  });
}

export const RewardModal: React.FC<RewardModalProps> = ({
  publishableKey = 'pk_test_51SMthV3EyFGShpAGV23A2fqoJuoTRVdQN9FVatu4dh268NpH7nk0kZCwhOryoz0j8gsAswcG7pNcrtTQMzoK8Whj00XQp452jb',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<StripeModalViewMode>('sponsor_form');
  const [region, setRegion] = useState<RegionKey>('GLOBAL');

  // Serv00 Support EpoCanvas Form State
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(5);
  const [customAmount, setCustomAmount] = useState<string>('15');
  const [sponsorName, setSponsorName] = useState<string>('');
  const [sponsorMessage, setSponsorMessage] = useState<string>('');

  // Stripe Processing States
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeSuccess, setStripeSuccess] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // References
  const stripeRef = useRef<any>(null);
  const elementsInstanceRef = useRef<any>(null);
  const paymentElementRef = useRef<any>(null);
  const expressCheckoutRef = useRef<any>(null);
  const paymentContainerRef = useRef<HTMLDivElement>(null);
  const expressContainerRef = useRef<HTMLDivElement>(null);

  const effectiveAmount =
    selectedAmount === 'custom'
      ? Math.max(1, parseInt(customAmount, 10) || 5)
      : selectedAmount;

  // Sync theme state
  useEffect(() => {
    const updateTheme = () => {
      const doc = document.documentElement;
      const dark =
        doc.dataset.theme === 'dark' ||
        doc.classList.contains('dark') ||
        (doc.getAttribute('data-theme') || '').toLowerCase().includes('dark');
      setIsDark(dark);
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    const handleCustomTheme = () => updateTheme();
    window.addEventListener('shijianus:themechange', handleCustomTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('shijianus:themechange', handleCustomTheme);
    };
  }, []);

  // Sync Stripe appearance on theme change
  useEffect(() => {
    if (elementsInstanceRef.current) {
      try {
        elementsInstanceRef.current.update({
          appearance: getStripeAppearance(isDark),
        });
      } catch (_) {}
    }
  }, [isDark]);

  // Handle opening Stripe Modal from PostRewardExtension or global trigger
  useEffect(() => {
    const handleOpenStripe = (e: CustomEvent<{ region?: RegionKey; amount?: number }>) => {
      if (e.detail?.region) {
        setRegion(e.detail.region);
      }
      if (e.detail?.amount && PRESET_AMOUNTS.includes(e.detail.amount)) {
        setSelectedAmount(e.detail.amount);
      }
      setViewMode('sponsor_form');
      setStripeError(null);
      setStripeSuccess(false);
      setIsOpen(true);
    };

    const handleOpenReward = (e: CustomEvent<{ region?: RegionKey }>) => {
      // If there is an inline post-reward on the page, expand it
      const inlineRewardBtn = document.querySelector<HTMLButtonElement>(
        '.post-reward .reward-button, [data-panel-trigger="reward"]'
      );
      if (inlineRewardBtn && window.location.pathname.includes('/posts/')) {
        inlineRewardBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inlineRewardBtn.click();
        return;
      }
      // Otherwise open the 2-step Stripe modal
      if (e.detail?.region) {
        setRegion(e.detail.region);
      }
      setViewMode('sponsor_form');
      setStripeError(null);
      setStripeSuccess(false);
      setIsOpen(true);
    };

    window.addEventListener('open-stripe-modal' as any, handleOpenStripe);
    window.addEventListener('open-reward-modal' as any, handleOpenReward);

    return () => {
      window.removeEventListener('open-stripe-modal' as any, handleOpenStripe);
      window.removeEventListener('open-reward-modal' as any, handleOpenReward);
    };
  }, []);

  // Stripe Appearance Rules (Strictly avoids dark blue in light mode)
  const getStripeAppearance = (dark: boolean) => ({
    theme: (dark ? 'night' : 'stripe') as any,
    variables: {
      colorPrimary: dark ? '#3b82f6' : '#2563eb',
      colorBackground: dark ? '#181b22' : '#ffffff',
      colorText: dark ? '#f8fafc' : '#0f172a',
      colorDanger: dark ? '#f87171' : '#df1b41',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      spacingUnit: '4px',
      borderRadius: '10px',
    },
    rules: {
      '.Input': {
        border: dark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
        backgroundColor: dark ? '#13151b' : '#ffffff',
        color: dark ? '#f8fafc' : '#0f172a',
        boxShadow: 'none',
      },
      '.Input:focus': {
        border: dark ? '1px solid #3b82f6' : '1px solid #2563eb',
        boxShadow: dark ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 0 0 2px rgba(37, 99, 235, 0.2)',
      },
      '.Label': {
        color: dark ? '#94a3b8' : '#475569',
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '6px',
      },
      '.Tab': {
        border: dark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
        backgroundColor: dark ? '#1a1d26' : '#f8fafc',
      },
    },
  });

  // Step 1 -> Step 2: Submit Support EpoCanvas form, create Stripe PaymentIntent, and notify TG
  const handleProceedToCheckout = async () => {
    if (!publishableKey) {
      setStripeError('Stripe 公钥未配置');
      return;
    }

    setIsCreatingIntent(true);
    setStripeError(null);

    try {
      // 1. Call Backend to create PaymentIntent, send Telegram notification & record to D1
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          currency: 'usd',
          name: sponsorName,
          message: sponsorMessage,
          country: region,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok || !data.clientSecret) {
        throw new Error(data.error || '无法创建 Stripe 支付意图，请重试');
      }

      const clientSecret = data.clientSecret;

      // 2. Load Stripe JS
      const stripe = await loadStripeSdk(publishableKey);
      stripeRef.current = stripe;

      // 3. Create Elements
      const elements = stripe.elements({
        clientSecret,
        appearance: getStripeAppearance(isDark),
      });
      elementsInstanceRef.current = elements;

      // 4. Mount Express Checkout
      if (expressContainerRef.current) {
        expressContainerRef.current.innerHTML = '';
        const expressCheckoutElement = elements.create('expressCheckout', {
          buttonType: { applePay: 'donate', googlePay: 'donate' },
          buttonTheme: {
            applePay: isDark ? 'white' : 'black',
            googlePay: isDark ? 'white' : 'black',
          },
        });
        expressCheckoutElement.mount(expressContainerRef.current);
        expressCheckoutRef.current = expressCheckoutElement;

        expressCheckoutElement.on('confirm', async (event: any) => {
          setIsStripeProcessing(true);
          const { error: confirmError } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/status/`,
            },
            redirect: 'if_required',
          });

          if (confirmError) {
            setStripeError(confirmError.message || '快捷支付失败');
            setIsStripeProcessing(false);
          } else {
            setStripeSuccess(true);
            setIsStripeProcessing(false);
          }
        });
      }

      // 5. Mount Payment Element
      if (paymentContainerRef.current) {
        paymentContainerRef.current.innerHTML = '';
        const paymentElement = elements.create('payment', {
          layout: 'tabs',
        });
        paymentElement.mount(paymentContainerRef.current);
        paymentElementRef.current = paymentElement;
      }

      // 6. Transition View
      setViewMode('stripe_checkout');
    } catch (err: any) {
      setStripeError(err.message || '收银台加载失败，请检查网络后重试');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  // Submit Card Payment inside Stripe Checkout View
  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeRef.current || !elementsInstanceRef.current) return;

    setIsStripeProcessing(true);
    setStripeError(null);

    try {
      const { error, paymentIntent } = await stripeRef.current.confirmPayment({
        elements: elementsInstanceRef.current,
        confirmParams: {
          return_url: `${window.location.origin}/status/`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setStripeError(error.message || '支付确认失败，请核对卡号信息');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setStripeSuccess(true);
      } else {
        setStripeSuccess(true);
      }
    } catch (err: any) {
      setStripeError(err.message || '网络连接异常，未能完成结算');
    } finally {
      setIsStripeProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stripe-modal-heading"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative w-full max-w-[500px] max-h-[92vh] flex flex-col bg-white dark:bg-[#13151b] backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-800 dark:text-slate-100 transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =================================================================== */}
        {/* 1. 弹窗顶部导航 (Pinned Header) */}
        {/* =================================================================== */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-200/70 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {viewMode === 'stripe_checkout' ? (
              <button
                type="button"
                onClick={() => setViewMode('sponsor_form')}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="返回修改赞赏信息"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            )}

            <div>
              <h3 id="stripe-modal-heading" className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {viewMode === 'stripe_checkout' ? 'Stripe 国际收银台' : 'Support EpoCanvas'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {viewMode === 'stripe_checkout'
                  ? `支持金额: $${effectiveAmount}.00 USD (安全信用卡 / 移动支付)`
                  : '填写寄语与称呼，支持 Shijian 的独立创作 ☕️'}
              </p>
            </div>
          </div>

          {/* 关闭按钮 */}
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-label="关闭弹窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================== */}
        {/* 2. 主体滚动视口 (Scrollable Body) */}
        {/* =================================================================== */}
        <div className="overflow-y-auto overscroll-contain pr-1 -mr-1 flex-1 space-y-4 pt-3.5 pb-1">
          {/* ----------------------------------------------------------------- */}
          {/* 【第一步: Serv00 范式 Support EpoCanvas 赞赏信息输入表单】 */}
          {/* ----------------------------------------------------------------- */}
          {viewMode === 'sponsor_form' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* 金额快捷选择 Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>选择赞赏金额 (USD)</span>
                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                    当前: ${effectiveAmount}.00 USD
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {PRESET_AMOUNTS.map((amt) => {
                    const isActive = selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSelectedAmount(amt)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 border cursor-pointer select-none flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 ring-2 ring-blue-500/20'
                            : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedAmount('custom')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 border cursor-pointer select-none flex items-center justify-center ${
                      selectedAmount === 'custom'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    自定义
                  </button>
                </div>

                {selectedAmount === 'custom' && (
                  <div className="relative mt-2">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="输入赞赏金额 (USD)"
                      className="w-full pl-8 pr-14 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                      USD
                    </span>
                  </div>
                )}
              </div>

              {/* 称呼或社交账号 (Name or your social) */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>称呼或社交账号 (Name or your social)</span>
                  <span className="text-[10px] text-slate-400 font-normal">（可选）</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="例如：@github_username 或 Shijian Friend"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              {/* 留言寄语 (Say something nice) */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <MessageSquareHeart className="w-3.5 h-3.5 text-pink-500" />
                  <span>留言寄语 (Say something nice)</span>
                  <span className="text-[10px] text-slate-400 font-normal">（可选）</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={sponsorMessage}
                  onChange={(e) => setSponsorMessage(e.target.value)}
                  placeholder="写下想对作者说的话或鼓励..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* 错误提示 */}
              {stripeError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{stripeError}</span>
                </div>
              )}

              {/* 下一步按钮 */}
              <button
                type="button"
                disabled={isCreatingIntent || effectiveAmount <= 0}
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isCreatingIntent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在连接 Stripe 收银台...</span>
                  </>
                ) : (
                  <>
                    <span>下一步：前往安全收银台 (${effectiveAmount}.00 USD)</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                支持信息将自动推送到作者 Telegram 频道并安全保存
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* 【第二步: 纯内嵌 Stripe 国际收银台】 */}
          {/* ----------------------------------------------------------------- */}
          <div
            style={{ display: viewMode === 'stripe_checkout' ? 'block' : 'none' }}
            className="space-y-4 animate-in fade-in duration-200"
          >
            {/* 赞赏概要卡片 */}
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  赞赏支持: ${effectiveAmount}.00 USD
                </span>
                {sponsorName && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[11px] text-blue-800 dark:text-blue-200 font-medium truncate max-w-[150px]">
                    来自: {sponsorName}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewMode('sponsor_form')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-[11px] cursor-pointer"
              >
                修改
              </button>
            </div>

            {/* 支付成功结果状态 */}
            {stripeSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  赞赏成功！非常感谢您的支持 ☕️
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  已成功收到您的赞赏（${effectiveAmount}.00 USD）。您的慷慨赞助是持续创作与开源分享的最大动力！
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  完成
                </button>
              </div>
            ) : (
              <form onSubmit={handleStripeSubmit} className="space-y-4">
                {/* Stripe Express Checkout (Apple Pay / Google Pay / Link) */}
                <div ref={expressContainerRef} className="empty:hidden min-h-[44px]" />

                {/* 分隔线 */}
                <div className="relative flex items-center justify-center py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-white/10" />
                  </div>
                  <span className="relative px-3 bg-white dark:bg-[#13151b] text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                    或输入卡号安全支付
                  </span>
                </div>

                {/* Stripe Elements Form */}
                <div
                  ref={paymentContainerRef}
                  className="min-h-[160px] p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 shadow-inner"
                />

                {/* 错误提示 */}
                {stripeError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{stripeError}</span>
                  </div>
                )}

                {/* 提交支付按钮 */}
                <button
                  type="submit"
                  disabled={isStripeProcessing}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isStripeProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在安全结算...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>确认并支付 ${effectiveAmount}.00 USD</span>
                    </>
                  )}
                </button>

                {/* 安全认证角标 */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>256-Bit SSL 加密 · 由 Stripe 官方提供安全保障</span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. 弹窗底部信息 (Pinned Footer) */}
        {/* =================================================================== */}
        <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
          <span>Stripe 国际安全网关</span>
          <a
            href="/status/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
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
