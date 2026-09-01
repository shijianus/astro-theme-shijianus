import React, { useState, useEffect, useRef } from 'react';
import {
  HeartHandshake,
  CreditCard,
  ExternalLink,
  Loader2,
  Check,
  Copy,
  X,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Globe,
  RefreshCw,
  ArrowLeft,
  User,
  MessageSquareHeart,
  CheckCircle2,
} from 'lucide-react';

export type RegionKey = 'CN' | 'HK' | 'GB' | 'GLOBAL';
export type ViewMode = 'main' | 'sponsor_form' | 'stripe_checkout';

interface RewardModalProps {
  publishableKey?: string;
  arbitrumAddress?: string;
  trc20Address?: string;
  erc20Address?: string;
  paypalMeUrl?: string;
  paypalUkMeUrl?: string;
}

const PRESET_AMOUNTS = [3, 5, 10, 20, 50];

const REGION_OPTIONS: Array<{ key: RegionKey; label: string; flag: string; desc: string }> = [
  { key: 'CN', label: '中国大陆', flag: '🇨🇳', desc: '微信 / 支付宝 原生扫码' },
  { key: 'HK', label: '中国香港', flag: '🇭🇰', desc: 'WeChat HK / Alipay HK / PayPal HK' },
  { key: 'GB', label: '英国', flag: '🇬🇧', desc: 'PayPal UK / Stripe / USDT Arbitrum' },
  { key: 'GLOBAL', label: '全球其它地区', flag: '🌐', desc: 'Stripe / PayPal / USDT Arbitrum' },
];

// Official brand SVG emblems (Complies with UI-UX Pro Max standards)
const WeChatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M8.691 2.188C3.891 2.188 0 5.478 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.294.295a.34.34 0 0 0 .17-.05l1.92-1.11c.176-.102.383-.127.577-.07 1.05.31 2.18.48 3.35.48.33 0 .66-.014.99-.044a6.66 6.66 0 0 1-.29-1.956c0-3.66 3.49-6.63 7.79-6.63.29 0 .58.014.86.042C17.65 5.86 13.56 2.188 8.69 2.188zm-2.4 4.54a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zm5.09 0a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zm4.81 4.72c-3.69 0-6.69 2.54-6.69 5.67 0 1.72.9 3.27 2.33 4.32.13.09.21.25.17.41l-.3 1.15c-.01.05-.03.11-.03.17 0 .13.1.23.23.23.05 0 .09-.01.13-.04l1.5-.86c.14-.08.3-.1.45-.06.71.21 1.48.33 2.28.33 3.69 0 6.69-2.54 6.69-5.67s-3-5.67-6.69-5.67zm-2.22 3.55a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7zm3.96 0a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7z"
      fill="#07C160"
    />
  </svg>
);

const AlipayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M21.422 17.568c-1.78-1.077-3.957-2.094-5.328-2.613.82-1.92 1.423-4.04 1.706-6.313H21.5V6.75h-5.068C16.143 3.86 14.89 1.83 14.89 1.83l-2.02.94s1.082 1.684 1.393 3.98H8.5V4.75H6.25v2H1.5v1.892h10.457c-.244 1.785-.722 3.488-1.393 5.06-2.05-.733-4.467-1.332-6.527-.852-2.915.682-4.54 2.875-4.015 5.342.502 2.36 2.84 3.758 5.767 3.758 3.593 0 6.467-1.892 8.358-4.417 2.19 1.05 5.08 2.22 7.275 3.01l.957-1.975h-.95zM7.227 20.06c-2.08 0-3.69-.948-3.972-2.274-.298-1.405.578-2.628 2.378-3.05 1.63-.38 3.65.17 5.405.85-1.075 2.518-2.507 4.474-3.81 4.474z"
      fill="#1677FF"
    />
  </svg>
);

const PayPalIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.286-.023.143-.05.288-.082.434-.848 4.248-3.47 6.425-7.79 6.425H9.684l-1.393 7.84a.641.641 0 0 1-.633.542h-.582z"
      fill="#003087"
    />
    <path
      d="M9.13 8.955h2.604c2.88 0 4.63-.45 5.2-2.316.516-1.687.11-2.91-1.205-3.64C14.77 2.47 13.06 2.3 10.96 2.3H6.84a.64.64 0 0 0-.632.542L4.032 17.5a.64.64 0 0 0 .633.74h3.19l1.275-9.285z"
      fill="#0079C1"
    />
  </svg>
);

const UsdtIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#26A17B" />
    <path
      d="M12.75 6.75h4.5v2.25h-3.375v1.275c2.46.12 4.35.615 4.35 1.23 0 .615-1.89 1.11-4.35 1.23V18h-2.25v-5.265c-2.46-.12-4.35-.615-4.35-1.23 0-.615 1.89-1.11 4.35-1.23V9H8.25V6.75h4.5z"
      fill="#FFFFFF"
    />
  </svg>
);

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
  arbitrumAddress = '0x00d52edc5230dD21F521D8396c68b84D576e6041',
  paypalMeUrl = 'https://www.paypal.com/paypalme/shijianus',
  paypalUkMeUrl = 'https://www.paypal.com/paypalme/shijianus',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [region, setRegion] = useState<RegionKey>('CN');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>('');
  const [isDetectingGeo, setIsDetectingGeo] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Handle global triggers to open reward modal
  useEffect(() => {
    const handleOpen = (e: CustomEvent<{ region?: RegionKey }>) => {
      if (e.detail?.region && ['CN', 'HK', 'GB', 'GLOBAL'].includes(e.detail.region)) {
        setRegion(e.detail.region);
        setIsManualOverride(true);
      }
      setViewMode('main');
      setStripeError(null);
      setStripeSuccess(false);
      setIsOpen(true);
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest(
        '[data-panel-trigger="reward"], [data-open-reward-modal], .reward-button, #reward-button, a[href="#reward"]'
      );
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        setViewMode('main');
        setStripeError(null);
        setStripeSuccess(false);
        setIsOpen(true);
      }
    };

    window.addEventListener('open-reward-modal' as any, handleOpen);
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      window.removeEventListener('open-reward-modal' as any, handleOpen);
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  // Detect Cloudflare GeoIP
  useEffect(() => {
    if (isManualOverride) return;

    let isMounted = true;
    setIsDetectingGeo(true);

    fetch('/api/geo-profile')
      .then((res) => {
        if (!res.ok) throw new Error('Geo API failed');
        return res.json();
      })
      .then((data: any) => {
        if (!isMounted) return;
        const country = (data?.country || '').toUpperCase();
        setDetectedCountry(country);

        if (country === 'CN') {
          setRegion('CN');
        } else if (country === 'HK') {
          setRegion('HK');
        } else if (country === 'GB' || country === 'UK') {
          setRegion('GB');
        } else {
          setRegion('GLOBAL');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setRegion('CN');
      })
      .finally(() => {
        if (isMounted) setIsDetectingGeo(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isManualOverride]);

  // Click outside to close region dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsRegionDropdownOpen(false);
      }
    };
    if (isRegionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRegionDropdownOpen]);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  };

  // Click PayPal QR Code: quiet copy to clipboard AND open URL
  const handlePayPalClick = (url: string, regionLabel: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    showToast(`已复制 PayPal ${regionLabel} 链接并正在打开...`);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (_) {
      window.location.href = url;
    }
  };

  // Click USDT Arbitrum QR Code: copy address quietly
  const handleUsdtClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(arbitrumAddress).catch(() => {});
    }
    showToast('已复制 USDT (Arbitrum) 钱包地址');
  };

  const handleSelectRegion = (r: RegionKey) => {
    setRegion(r);
    setIsManualOverride(true);
    setIsRegionDropdownOpen(false);
    showToast(`已切换至 ${REGION_OPTIONS.find((o) => o.key === r)?.label}`);
  };

  const handleResetToAuto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsManualOverride(false);
    setIsRegionDropdownOpen(false);
    showToast('已恢复自动 IP 地区识别');
  };

  // Stripe Appearance Rules
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
      // 1. Call Backend to create PaymentIntent and notify Telegram Bot
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

  const currentRegionMeta =
    REGION_OPTIONS.find((o) => o.key === region) || REGION_OPTIONS[0];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-modal-heading"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative w-full max-w-[520px] max-h-[92vh] flex flex-col bg-white dark:bg-[#13151b] backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-800 dark:text-slate-100 transition-all overflow-hidden"
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
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="返回修改赞赏信息"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : viewMode === 'sponsor_form' ? (
              <button
                type="button"
                onClick={() => setViewMode('main')}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="返回其他支付方式"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
            )}

            <div>
              <h3 id="reward-modal-heading" className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {viewMode === 'stripe_checkout'
                  ? 'Stripe 国际收银台'
                  : viewMode === 'sponsor_form'
                  ? 'Support EpoCanvas'
                  : '赞赏支持作者'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {viewMode === 'stripe_checkout'
                  ? `支持金额: $${effectiveAmount}.00 USD (安全信用卡 / 移动支付)`
                  : viewMode === 'sponsor_form'
                  ? '填写寄语与称呼，支持 Shijian 的独立创作 ☕️'
                  : '如果内容对你有帮助，欢迎请作者喝杯咖啡 ☕️'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 地区切换器 (仅在主视图显示) */}
            {viewMode === 'main' && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/70 dark:border-white/10"
                  aria-label="选择地区"
                >
                  <span>{currentRegionMeta.flag}</span>
                  <span className="hidden sm:inline">{currentRegionMeta.label}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {isRegionDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-white dark:bg-[#1a1d26] border border-slate-200/90 dark:border-white/15 shadow-xl p-1.5 z-50 animate-in fade-in duration-150">
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/10 mb-1">
                      选择支付渠道优选地区
                    </div>
                    {REGION_OPTIONS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectRegion(item.key)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          region === item.key
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.flag}</span>
                          <div className="text-left">
                            <div>{item.label}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                        {region === item.key && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}

                    {isManualOverride && (
                      <div className="border-t border-slate-100 dark:border-white/10 mt-1 pt-1 px-1">
                        <button
                          type="button"
                          className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 cursor-pointer"
                          onClick={handleResetToAuto}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>恢复自动 IP 检测地区</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
        </div>

        {/* =================================================================== */}
        {/* 2. 主体滚动视口 (Scrollable Body) */}
        {/* =================================================================== */}
        <div className="overflow-y-auto overscroll-contain pr-1 -mr-1 flex-1 space-y-4 pt-3.5 pb-1">
          {/* ================================================================= */}
          {/* 【视图 1: 地区专属直接展示面板 (Anzhiyu Direct QR Cards)】 */}
          {/* ================================================================= */}
          {viewMode === 'main' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* ------------------------------------------------------------- */}
              {/* 1.1 中国大陆 (CN): 直接展示微信 & 支付宝 2个二维码 */}
              {/* ------------------------------------------------------------- */}
              {region === 'CN' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* 微信支付 */}
                    <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#181b22] border border-emerald-500/20 dark:border-emerald-500/20 shadow-sm hover:border-emerald-500/40 transition-all">
                      <div className="w-full aspect-square bg-white p-2 rounded-xl shadow-xs flex items-center justify-center overflow-hidden">
                        <img
                          src="/media/shijianus/support/weixin-pay-cn.jpg"
                          alt="微信支付二维码"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <WeChatIcon className="w-4 h-4" />
                        <span>微信扫一扫</span>
                      </div>
                    </div>

                    {/* 支付宝 */}
                    <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#181b22] border border-blue-500/20 dark:border-blue-500/20 shadow-sm hover:border-blue-500/40 transition-all">
                      <div className="w-full aspect-square bg-white p-2 rounded-xl shadow-xs flex items-center justify-center overflow-hidden">
                        <img
                          src="/media/shijianus/support/alipay-cn.jpg"
                          alt="支付宝二维码"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <AlipayIcon className="w-4 h-4" />
                        <span>支付宝扫一扫</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                    手机端可长按或截图保存二维码，打开对应 App 扫一扫即可支持作者 ☕️
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* 1.2 中国香港 (HK): 直接展示 WeChatHK、AlipayHK 与 PayPalHK 3个二维码 */}
              {/* ------------------------------------------------------------- */}
              {region === 'HK' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {/* WeChat Pay HK */}
                    <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-[#181b22] border border-emerald-500/20 dark:border-emerald-500/20 shadow-sm">
                      <div className="w-full aspect-square bg-white p-1.5 rounded-xl shadow-xs flex items-center justify-center overflow-hidden">
                        <img
                          src="/media/shijianus/support/wechat-pay-hk.jpg"
                          alt="WeChat Pay HK"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center">
                        <WeChatIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">WeChat HK</span>
                      </div>
                    </div>

                    {/* Alipay HK */}
                    <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-[#181b22] border border-blue-500/20 dark:border-blue-500/20 shadow-sm">
                      <div className="w-full aspect-square bg-white p-1.5 rounded-xl shadow-xs flex items-center justify-center overflow-hidden">
                        <img
                          src="/media/shijianus/support/alipay-hk.jpg"
                          alt="Alipay HK"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 text-center">
                        <AlipayIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Alipay HK</span>
                      </div>
                    </div>

                    {/* PayPal HK (Clickable QR Code without blocking overlay) */}
                    <div
                      onClick={() => handlePayPalClick(paypalMeUrl, 'HK')}
                      className="group flex flex-col items-center p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-[#181b22] border border-[#0070ba]/30 hover:border-[#0070ba] dark:border-[#0070ba]/30 dark:hover:border-[#0070ba] shadow-sm hover:shadow-md transition-all cursor-pointer"
                      title="点击跳转 PayPal HK 付款"
                    >
                      <div className="w-full aspect-square bg-white p-1.5 rounded-xl shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform">
                        <img
                          src="/media/shijianus/support/paypal-hk.jpg"
                          alt="PayPal HK"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#0070ba] dark:text-[#009cde] text-center">
                        <PayPalIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">PayPal HK ↗</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                    微信 / 支付宝可直接扫码；点击 PayPal 二维码可直接跳转付款 ☕️
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* 1.3 英国 (GB): 直接展示 PayPal UK 与 USDT (Arbitrum) 2个二维码 + Stripe 按钮 */}
              {/* ------------------------------------------------------------- */}
              {region === 'GB' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* PayPal UK (Clickable) */}
                    <div
                      onClick={() => handlePayPalClick(paypalUkMeUrl || paypalMeUrl, 'UK')}
                      className="group flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#181b22] border border-[#0070ba]/30 hover:border-[#0070ba] dark:border-[#0070ba]/30 dark:hover:border-[#0070ba] shadow-sm hover:shadow-md transition-all cursor-pointer"
                      title="点击跳转 PayPal UK 付款"
                    >
                      <div className="w-full aspect-square bg-white p-2 rounded-xl shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform">
                        <img
                          src="/media/shijianus/support/paypal-uk.jpg"
                          alt="PayPal UK"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-[#0070ba] dark:text-[#009cde]">
                        <PayPalIcon className="w-4 h-4" />
                        <span>PayPal (UK) ↗</span>
                      </div>
                    </div>

                    {/* USDT (Arbitrum) (Clickable to copy quietly) */}
                    <div
                      onClick={handleUsdtClick}
                      className="group flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#181b22] border border-[#26A17B]/30 hover:border-[#26A17B] dark:border-[#26A17B]/30 dark:hover:border-[#26A17B] shadow-sm hover:shadow-md transition-all cursor-pointer"
                      title="点击直接复制 USDT 钱包地址"
                    >
                      <div className="w-full aspect-square bg-white p-2 rounded-xl shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform">
                        <img
                          src="/media/shijianus/support/0x00d52edc5230dD21F521D8396c68b84D576e6041_Arbitrum.jpg"
                          alt="USDT Arbitrum"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-[#26A17B] dark:text-emerald-400">
                        <UsdtIcon className="w-4 h-4" />
                        <span>USDT (Arbitrum) 📋</span>
                      </div>
                    </div>
                  </div>

                  {/* USDT 提示信息 */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>USDT 链路重要提示</span>
                    </div>
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
                      请使用 <strong className="underline">Arbitrum (One)</strong> 链路转账，汇错链路将导致资产丢失。点击上方二维码或下方按钮可快速复制地址。
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-500/20">
                      <code className="text-[10px] font-mono truncate text-amber-900 dark:text-amber-200">
                        {arbitrumAddress}
                      </code>
                      <button
                        type="button"
                        onClick={handleUsdtClick}
                        className="px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-800/40 hover:bg-amber-300 dark:hover:bg-amber-700/50 text-amber-900 dark:text-amber-100 text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  {/* 独立 Stripe 收银台入口 Button */}
                  <button
                    type="button"
                    onClick={() => setViewMode('sponsor_form')}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>通过 Stripe 信用卡 / Apple Pay / Google Pay 赞赏 →</span>
                  </button>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* 1.4 全球其它地区 (GLOBAL): 直接展示 PayPal (Global) 与 USDT (Arbitrum) + Stripe 按钮 */}
              {/* ------------------------------------------------------------- */}
              {region === 'GLOBAL' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* PayPal Global (Clickable) */}
                    <div
                      onClick={() => handlePayPalClick(paypalMeUrl, 'Global')}
                      className="group flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#181b22] border border-[#0070ba]/30 hover:border-[#0070ba] dark:border-[#0070ba]/30 dark:hover:border-[#0070ba] shadow-sm hover:shadow-md transition-all cursor-pointer"
                      title="点击跳转 PayPal 付款"
                    >
                      <div className="w-full aspect-square bg-white p-2 rounded-xl shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform">
                        <img
                          src="/media/shijianus/support/paypal-hk.jpg"
                          alt="PayPal Global"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-[#0070ba] dark:text-[#009cde]">
                        <PayPalIcon className="w-4 h-4" />
                        <span>PayPal ↗</span>
                      </div>
                    </div>

                    {/* USDT (Arbitrum) (Clickable to copy quietly) */}
                    <div
                      onClick={handleUsdtClick}
                      className="group flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#181b22] border border-[#26A17B]/30 hover:border-[#26A17B] dark:border-[#26A17B]/30 dark:hover:border-[#26A17B] shadow-sm hover:shadow-md transition-all cursor-pointer"
                      title="点击直接复制 USDT 钱包地址"
                    >
                      <div className="w-full aspect-square bg-white p-2 rounded-xl shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform">
                        <img
                          src="/media/shijianus/support/0x00d52edc5230dD21F521D8396c68b84D576e6041_Arbitrum.jpg"
                          alt="USDT Arbitrum"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-[#26A17B] dark:text-emerald-400">
                        <UsdtIcon className="w-4 h-4" />
                        <span>USDT (Arbitrum) 📋</span>
                      </div>
                    </div>
                  </div>

                  {/* USDT 提示信息 */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>USDT 链路重要提示</span>
                    </div>
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
                      请使用 <strong className="underline">Arbitrum (One)</strong> 链路转账，汇错链路将导致资产丢失。点击上方二维码或下方按钮可快速复制地址。
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-500/20">
                      <code className="text-[10px] font-mono truncate text-amber-900 dark:text-amber-200">
                        {arbitrumAddress}
                      </code>
                      <button
                        type="button"
                        onClick={handleUsdtClick}
                        className="px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-800/40 hover:bg-amber-300 dark:hover:bg-amber-700/50 text-amber-900 dark:text-amber-100 text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  {/* 独立 Stripe 收银台入口 Button */}
                  <button
                    type="button"
                    onClick={() => setViewMode('sponsor_form')}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>通过 Stripe 信用卡 / Apple Pay / Google Pay 赞赏 →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 【视图 2: Serv00 范式 Support EpoCanvas 赞赏信息表单】 */}
          {/* ================================================================= */}
          {viewMode === 'sponsor_form' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* 金额选择 */}
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

          {/* ================================================================= */}
          {/* 【视图 3: 纯内嵌 Stripe 国际收银台 (Stripe Checkout View)】 */}
          {/* ================================================================= */}
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
                {/* Stripe Express Checkout (Apple Pay / Google Pay) */}
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
        {/* 3. 弹窗底部版权与支持记录 (Pinned Footer) */}
        {/* =================================================================== */}
        <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>
              {isManualOverride
                ? `已按 ${currentRegionMeta.label} 优选`
                : isDetectingGeo
                ? '识别网络中...'
                : `推荐地区: ${detectedCountry ? `${detectedCountry} · ${currentRegionMeta.label}` : currentRegionMeta.label}`}
            </span>
          </div>
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

      {/* 浮动 Toast 提示 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 px-4 py-2 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default RewardModal;
