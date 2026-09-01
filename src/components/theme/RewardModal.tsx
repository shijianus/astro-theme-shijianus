import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  HeartHandshake,
  CreditCard,
  QrCode,
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
  ArrowRight,
} from 'lucide-react';

export type RegionKey = 'CN' | 'HK' | 'GB' | 'GLOBAL';
export type ViewMode = 'main' | 'stripe';

interface RewardModalProps {
  publishableKey?: string;
  trc20Address?: string;
  erc20Address?: string;
  paypalMeUrl?: string;
  paypalUkMeUrl?: string;
}

const PRESET_AMOUNTS = [3, 5, 10];

const REGION_OPTIONS: Array<{ key: RegionKey; label: string; flag: string; desc: string }> = [
  { key: 'CN', label: '中国大陆', flag: '🇨🇳', desc: '微信 / 支付宝 扫码赞赏' },
  { key: 'HK', label: '中国香港', flag: '🇭🇰', desc: '微信 / 支付宝 / PayPal HK' },
  { key: 'GB', label: '英国', flag: '🇬🇧', desc: 'PayPal UK / Stripe / USDT' },
  { key: 'GLOBAL', label: '全球其它地区', flag: '🌐', desc: 'Stripe / PayPal / USDT' },
];

// Official brand SVG emblems (Complies with UI-UX Pro Max no-emoji icon standards)
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
    <path
      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.2c5.412 0 9.8 4.388 9.8 9.8 0 5.412-4.388 9.8-9.8 9.8-5.412 0-9.8-4.388-9.8-9.8 0-5.412 4.388-9.8 9.8-9.8zm-.89 3.52v2.24H6.38v2.42h4.73v.81c-3.7.16-6.49.88-6.49 1.74s2.79 1.58 6.49 1.74v4.54h1.78v-4.54c3.7-.16 6.49-.88 6.49-1.74s-2.79-1.58-6.49-1.74v-.81h4.73V7.96h-4.73V5.72h-1.78zm0 7.82c-3.21 0-5.34-.52-5.34-1.07 0-.55 2.13-1.07 5.34-1.07s5.34.52 5.34 1.07c0 .55-2.13 1.07-5.34 1.07z"
      fill="#26A17B"
    />
  </svg>
);

// Light & Dark Stripe Elements theme styling
const getStripeAppearance = (isDark: boolean) => ({
  theme: (isDark ? 'night' : 'stripe') as any,
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: isDark ? '#181b22' : '#ffffff',
    colorText: isDark ? '#f8fafc' : '#0f172a',
    colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      backgroundColor: isDark ? '#12141a' : '#ffffff',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      padding: '11px 14px',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    '.Input:focus': {
      border: '1px solid #2563eb',
      boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
    },
    '.Tab': {
      backgroundColor: isDark ? '#12141a' : '#f8fafc',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
      color: isDark ? '#cbd5e1' : '#475569',
    },
    '.Tab--selected': {
      border: '1.5px solid #2563eb',
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
      color: isDark ? '#60a5fa' : '#2563eb',
    },
    '.Label': {
      fontSize: '12px',
      fontWeight: '600',
      marginBottom: '6px',
      color: isDark ? '#cbd5e1' : '#334155',
    },
  },
});

export const RewardModal: React.FC<RewardModalProps> = ({
  publishableKey = '',
  trc20Address = '',
  erc20Address = '',
  paypalMeUrl = 'https://www.paypal.com/paypalme/shijianus',
  paypalUkMeUrl = 'https://www.paypal.com/paypalme/shijianus',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('main');

  // Region & Geo metadata
  const [region, setRegion] = useState<RegionKey>('GLOBAL');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [isDetectingGeo, setIsDetectingGeo] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>('');

  // Sub-tabs for regions with multiple local channels
  // For HK: 'cn' (WeChat/Alipay) | 'paypal'
  // For GB: 'paypal' | 'crypto'
  // For GLOBAL: 'paypal' | 'crypto'
  const [hkSubTab, setHkSubTab] = useState<'cn' | 'paypal'>('cn');
  const [intlSubTab, setIntlSubTab] = useState<'paypal' | 'crypto'>('paypal');

  // Amount Selection
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(5);
  const [customAmountStr, setCustomAmountStr] = useState('15');

  // Stripe Elements state
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [hasExpressCheckout, setHasExpressCheckout] = useState(false);

  // Crypto State
  const [cryptoNetwork, setCryptoNetwork] = useState<'TRC20' | 'ERC20'>('TRC20');
  const [cryptoQrDataUrl, setCryptoQrDataUrl] = useState<string | null>(null);

  // Toast & Copy State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Refs
  const stripeElementsContainerRef = useRef<HTMLDivElement>(null);
  const expressCheckoutContainerRef = useRef<HTMLDivElement>(null);
  const stripeInstanceRef = useRef<any>(null);
  const elementsInstanceRef = useRef<any>(null);
  const paymentElementRef = useRef<any>(null);
  const expressCheckoutRef = useRef<any>(null);

  const effectiveAmount =
    selectedAmount === 'custom'
      ? Math.max(1, Math.min(1000, parseFloat(customAmountStr) || 5))
      : selectedAmount;

  // Dark mode detection helper
  const getIsDark = () => {
    if (typeof document === 'undefined') return false;
    return (
      document.documentElement.dataset.theme === 'dark' ||
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  };

  const [isDark, setIsDark] = useState<boolean>(getIsDark);

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      showToast(`已复制 ${label} 到剪贴板！`);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      showToast('复制失败，请手动长按复制');
    }
  };

  // Generate Crypto QR Code on mount or network change
  useEffect(() => {
    const currentAddress = cryptoNetwork === 'TRC20' ? trc20Address : erc20Address;
    if (currentAddress) {
      QRCode.toDataURL(currentAddress, {
        margin: 2,
        width: 240,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url: string) => setCryptoQrDataUrl(url))
        .catch(() => setCryptoQrDataUrl(null));
    }
  }, [cryptoNetwork, trc20Address, erc20Address]);

  // Geo detection helper
  const detectGeoLocation = async () => {
    setIsDetectingGeo(true);
    try {
      const cached = sessionStorage.getItem('shijianus-geo-profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        applyGeoProfile(parsed);
        setIsDetectingGeo(false);
        return;
      }

      const res = await fetch('/api/geo-profile');
      if (!res.ok) throw new Error(`Geo lookup failed: ${res.status}`);
      const data = await res.json();
      sessionStorage.setItem('shijianus-geo-profile', JSON.stringify(data));
      applyGeoProfile(data);
    } catch {
      const lang = (navigator.language || '').toLowerCase();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (lang.includes('zh-cn') || tz === 'Asia/Shanghai') {
        applyGeoProfile({ country: 'CN', isMainland: true });
      } else if (lang.includes('zh-hk') || tz === 'Asia/Hong_Kong' || tz === 'Asia/Macau') {
        applyGeoProfile({ country: 'HK' });
      } else if (lang.includes('en-gb') || tz === 'Europe/London') {
        applyGeoProfile({ country: 'GB' });
      } else {
        applyGeoProfile({ country: 'GLOBAL' });
      }
    } finally {
      setIsDetectingGeo(false);
    }
  };

  const applyGeoProfile = (data: { country?: string; isMainland?: boolean }) => {
    const country = (data.country || '').toUpperCase();
    setDetectedCountry(country);
    if (data.isMainland || country === 'CN') {
      setRegion('CN');
    } else if (country === 'HK' || country === 'MO') {
      setRegion('HK');
    } else if (country === 'GB' || country === 'UK') {
      setRegion('GB');
    } else {
      setRegion('GLOBAL');
    }
  };

  // On first modal open, initialize region & geo
  useEffect(() => {
    if (!isOpen) return;

    const saved = localStorage.getItem('shijianus-reward-region') as RegionKey | null;
    if (saved && ['CN', 'HK', 'GB', 'GLOBAL'].includes(saved)) {
      setRegion(saved);
      setIsManualOverride(true);
    } else {
      detectGeoLocation();
    }
  }, [isOpen]);

  // Global event listeners for modal open
  useEffect(() => {
    const handleGlobalTrigger = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        '[data-panel-trigger="reward"], [data-open-reward-modal], .reward-button',
      );
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        setViewMode('main');
        setIsOpen(true);
      }
    };

    const handleCustomEvent = (e: any) => {
      if (e.detail?.region) {
        const targetRegion = e.detail.region as RegionKey;
        setRegion(targetRegion);
        setIsManualOverride(true);
        try {
          localStorage.setItem('shijianus-reward-region', targetRegion);
        } catch {}
      }
      if (e.detail?.viewMode) {
        setViewMode(e.detail.viewMode);
      } else {
        setViewMode('main');
      }
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleGlobalTrigger);
    window.addEventListener('open-reward-modal' as any, handleCustomEvent);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleGlobalTrigger);
      window.removeEventListener('open-reward-modal' as any, handleCustomEvent);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      setRegionDropdownOpen(false);
      setViewMode('main');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  // Handle region switch
  const handleSelectRegion = (newRegion: RegionKey) => {
    setRegion(newRegion);
    setIsManualOverride(true);
    localStorage.setItem('shijianus-reward-region', newRegion);
    setRegionDropdownOpen(false);
    setViewMode('main');
  };

  const handleResetToAuto = () => {
    localStorage.removeItem('shijianus-reward-region');
    setIsManualOverride(false);
    setRegionDropdownOpen(false);
    setViewMode('main');
    detectGeoLocation();
  };

  // Real-time Dark/Light theme change listener & Stripe Elements synchronization
  useEffect(() => {
    const handleThemeEvent = (e: any) => {
      const nextTheme = e.detail;
      const nextIsDark = nextTheme === 'dark';
      setIsDark(nextIsDark);
      if (elementsInstanceRef.current) {
        try {
          elementsInstanceRef.current.update({
            appearance: getStripeAppearance(nextIsDark),
          });
        } catch {}
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && (m.attributeName === 'data-theme' || m.attributeName === 'class')) {
          const nextIsDark = getIsDark();
          setIsDark(nextIsDark);
          if (elementsInstanceRef.current) {
            try {
              elementsInstanceRef.current.update({
                appearance: getStripeAppearance(nextIsDark),
              });
            } catch {}
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    window.addEventListener('shijianus:themechange', handleThemeEvent);

    return () => {
      observer.disconnect();
      window.removeEventListener('shijianus:themechange', handleThemeEvent);
    };
  }, []);

  // Initialize Stripe Elements & Express Checkout (Always ready for Stripe view)
  useEffect(() => {
    if (!isOpen || paymentSuccess) return;

    let isSubscribed = true;
    setStripeLoading(true);
    setStripeError(null);

    const initStripe = async () => {
      try {
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(publishableKey);

        if (!isSubscribed || !stripe) {
          if (isSubscribed) setStripeError('Stripe 初始化失败，请检查网络后重试。');
          return;
        }

        stripeInstanceRef.current = stripe;
        const currentIsDark = getIsDark();
        const appearance = getStripeAppearance(currentIsDark);

        const elements = stripe.elements({
          mode: 'payment',
          amount: Math.round(effectiveAmount * 100),
          currency: 'usd',
          appearance,
        });

        elementsInstanceRef.current = elements;

        // 1. Stripe Express Checkout Element (Apple Pay / Google Pay / Link)
        try {
          const expressCheckout = elements.create('expressCheckout', {
            buttonType: {
              applePay: 'donate',
              googlePay: 'donate',
              paypal: 'paypal',
            },
            buttonTheme: {
              applePay: currentIsDark ? 'white-outline' : 'black',
              googlePay: currentIsDark ? 'white' : 'black',
            },
            buttonHeight: 44,
          });

          expressCheckoutRef.current = expressCheckout;

          if (expressCheckoutContainerRef.current) {
            expressCheckoutContainerRef.current.innerHTML = '';
            expressCheckout.mount(expressCheckoutContainerRef.current);

            expressCheckout.on('ready', ({ availablePaymentMethods }: any) => {
              if (isSubscribed) {
                if (availablePaymentMethods && Object.values(availablePaymentMethods).some(Boolean)) {
                  setHasExpressCheckout(true);
                } else {
                  setHasExpressCheckout(false);
                }
              }
            });

            expressCheckout.on('confirm', async (event: any) => {
              try {
                setIsProcessingPayment(true);
                setStripeError(null);

                const res = await fetch('/api/create-payment-intent', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    amount: effectiveAmount,
                    currency: 'usd',
                  }),
                });

                const data = await res.json();
                if (!res.ok || !data.ok || !data.clientSecret) {
                  throw new Error(data.error || '创建订单失败，请稍后重试');
                }

                const { error: confirmError } = await stripe.confirmPayment({
                  elements,
                  clientSecret: data.clientSecret,
                  confirmParams: {
                    return_url: window.location.href,
                  },
                });

                if (confirmError) {
                  setStripeError(confirmError.message || '快捷支付失败');
                } else {
                  setPaymentSuccess(true);
                }
              } catch (err: any) {
                setStripeError(err?.message || '快捷支付处理异常');
              } finally {
                setIsProcessingPayment(false);
              }
            });
          }
        } catch (ecErr) {
          console.warn('Express checkout element notice:', ecErr);
        }

        // 2. Stripe Payment Element (Native card handling)
        const paymentElement = elements.create('payment', {
          layout: {
            type: 'tabs',
            defaultCollapsed: false,
          },
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'never',
            },
          },
          wallets: {
            applePay: 'never',
            googlePay: 'never',
          },
          terms: {
            card: 'never',
          },
        });

        paymentElementRef.current = paymentElement;

        if (stripeElementsContainerRef.current) {
          stripeElementsContainerRef.current.innerHTML = '';
          paymentElement.mount(stripeElementsContainerRef.current);

          paymentElement.on('ready', () => {
            if (isSubscribed) {
              setStripeReady(true);
              setStripeLoading(false);
            }
          });

          paymentElement.on('change', (event: any) => {
            if (event.error) {
              setStripeError(event.error.message);
            } else {
              setStripeError(null);
            }
          });
        }
      } catch (err: any) {
        if (isSubscribed) {
          setStripeError(err?.message || '加载 Stripe 组件遇到问题');
          setStripeLoading(false);
        }
      }
    };

    initStripe();

    return () => {
      isSubscribed = false;
      if (paymentElementRef.current) {
        try {
          paymentElementRef.current.destroy();
        } catch {}
      }
      if (expressCheckoutRef.current) {
        try {
          expressCheckoutRef.current.destroy();
        } catch {}
      }
    };
  }, [isOpen, paymentSuccess]);

  // Update Stripe Elements when amount changes
  useEffect(() => {
    if (elementsInstanceRef.current && stripeReady) {
      elementsInstanceRef.current.update({
        amount: Math.round(effectiveAmount * 100),
      });
    }
  }, [effectiveAmount, stripeReady]);

  // Submit standard Stripe payment form
  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeInstanceRef.current || !elementsInstanceRef.current) return;

    setIsProcessingPayment(true);
    setStripeError(null);

    try {
      const { error: submitError } = await elementsInstanceRef.current.submit();
      if (submitError) {
        setStripeError(submitError.message || '请完善支付表单信息');
        setIsProcessingPayment(false);
        return;
      }

      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: effectiveAmount,
          currency: 'usd',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok || !data.clientSecret) {
        throw new Error(data.error || '创建支付订单失败，请稍后重试');
      }

      const { error: confirmError } = await stripeInstanceRef.current.confirmPayment({
        elements: elementsInstanceRef.current,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setStripeError(confirmError.message || '支付确认失败');
      } else {
        setPaymentSuccess(true);
      }
    } catch (err: any) {
      setStripeError(err?.message || '支付处理遇到异常');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  const currentRegionMeta = REGION_OPTIONS.find((r) => r.key === region) || REGION_OPTIONS[0];
  const currentCryptoAddress = cryptoNetwork === 'TRC20' ? trc20Address : erc20Address;

  // URLs for PayPal
  const currentPaypalUrl = region === 'GB' ? (paypalUkMeUrl || paypalMeUrl) : paypalMeUrl;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-modal-heading"
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
            {viewMode === 'stripe' ? (
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
                {viewMode === 'stripe' ? 'Stripe 国际收银台' : '赞赏支持作者'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {viewMode === 'stripe'
                  ? '安全信用卡 / 借记卡 / 移动支付通道'
                  : '如果内容对你有帮助，欢迎请作者喝杯咖啡 ☕️'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 地区切换器 (仅在主视图显示) */}
            {viewMode === 'main' && (
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                  onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                  title="切换推荐地区视图"
                >
                  <span>{currentRegionMeta.flag}</span>
                  <span className="hidden sm:inline">{currentRegionMeta.label}</span>
                  <span className="sm:hidden">{currentRegionMeta.key}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {regionDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-white/15 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      地区专属支付渠道
                    </div>
                    {REGION_OPTIONS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer ${
                          region === item.key
                            ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/20'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                        onClick={() => handleSelectRegion(item.key)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{item.flag}</span>
                          <div>
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
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => setIsOpen(false)}
              aria-label="关闭弹窗"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. 主体滚动容器 (Scrollable Viewport) */}
        {/* =================================================================== */}
        <div className="overflow-y-auto overscroll-contain pr-1 -mr-1 flex-1 space-y-4 pt-3.5 pb-1">
          {/* ================================================================= */}
          {/* 【视图 A: 地区专属赞赏面板 (Main View)】 */}
          {/* ================================================================= */}
          {viewMode === 'main' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* ------------------------------------------------------------- */}
              {/* A1: 中国大陆 (CN) —— 仅微信 / 支付宝 */}
              {/* ------------------------------------------------------------- */}
              {region === 'CN' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* 微信支付 */}
                    <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white dark:bg-[#181b22] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-xs">
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-white p-1.5 rounded-xl shadow-xs overflow-hidden flex items-center justify-center border border-slate-100">
                        <img
                          src="/media/shijianus/support/weixin-pay-cn.jpg"
                          alt="微信支付赞赏码"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <WeChatIcon className="w-3.5 h-3.5" />
                        <span>微信扫一扫</span>
                      </div>
                    </div>

                    {/* 支付宝 */}
                    <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white dark:bg-[#181b22] border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-xs">
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-white p-1.5 rounded-xl shadow-xs overflow-hidden flex items-center justify-center border border-slate-100">
                        <img
                          src="/media/shijianus/support/alipay-cn.jpg"
                          alt="支付宝赞赏码"
                          className="w-full h-full object-contain select-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <AlipayIcon className="w-3.5 h-3.5" />
                        <span>支付宝扫一扫</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                    手机端可截屏保存二维码，打开对应 App 扫一扫即可支持作者 ☕️
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* A2: 中国香港 (HK) —— 微信 / 支付宝 / PayPal HK */}
              {/* ------------------------------------------------------------- */}
              {region === 'HK' && (
                <div className="space-y-3.5">
                  {/* 分段选择器 */}
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 gap-1">
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                        hkSubTab === 'cn'
                          ? 'bg-white dark:bg-[#1f242f] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-white/10 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      onClick={() => setHkSubTab('cn')}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>微信 · 支付宝 HK</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                        hkSubTab === 'paypal'
                          ? 'bg-white dark:bg-[#1f242f] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-white/10 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      onClick={() => setHkSubTab('paypal')}
                    >
                      <PayPalIcon className="w-3.5 h-3.5" />
                      <span>PayPal HK</span>
                    </button>
                  </div>

                  {hkSubTab === 'cn' ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-in fade-in duration-150">
                      {/* WeChat Pay HK */}
                      <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white dark:bg-[#181b22] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-xs">
                        <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-white p-1.5 rounded-xl shadow-xs overflow-hidden flex items-center justify-center border border-slate-100">
                          <img
                            src="/media/shijianus/support/wechat-pay-hk.jpg"
                            alt="WeChat Pay HK 赞赏码"
                            className="w-full h-full object-contain select-none"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <WeChatIcon className="w-3.5 h-3.5" />
                          <span>WeChat Pay HK</span>
                        </div>
                      </div>

                      {/* Alipay HK */}
                      <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white dark:bg-[#181b22] border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-xs">
                        <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-white p-1.5 rounded-xl shadow-xs overflow-hidden flex items-center justify-center border border-slate-100">
                          <img
                            src="/media/shijianus/support/alipay-hk.jpg"
                            alt="Alipay HK 赞赏码"
                            className="w-full h-full object-contain select-none"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                          <AlipayIcon className="w-3.5 h-3.5" />
                          <span>Alipay HK</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PayPal HK 独立展示区 */
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#181b22] border border-blue-500/20 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <PayPalIcon className="w-4 h-4" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              PayPal HK 扫码 / 直连付款
                            </span>
                          </div>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                            推荐 HKD 结算
                          </span>
                        </div>

                        {/* 点击 QR Code 跳转 */}
                        <div className="flex flex-col items-center justify-center py-1">
                          <a
                            href={currentPaypalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
                            title="点击前往 PayPal 官方付款页面"
                          >
                            <img
                              src="/media/shijianus/support/paypal-hk.jpg"
                              alt="PayPal HK 付款二维码"
                              className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg select-none group-hover:opacity-95 transition-opacity"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 rounded-2xl transition-colors flex items-end justify-center pb-2">
                              <span className="text-[11px] font-semibold bg-slate-900/80 text-white px-2.5 py-1 rounded-full opacity-90 group-hover:opacity-100 flex items-center gap-1 shadow-sm">
                                <span>点击打开链接</span>
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </div>
                          </a>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                            支持直接扫码或点击上方二维码进入付款链接
                          </span>
                        </div>

                        {/* 跳转按钮 */}
                        <a
                          href={currentPaypalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#0070ba] hover:bg-[#003087] text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>前往 PayPal.Me 付款支持</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* A3: 英国 (GB) —— PayPal UK + Stripe + 加密货币 (USDT) */}
              {/* ------------------------------------------------------------- */}
              {region === 'GB' && (
                <div className="space-y-3.5">
                  {/* Stripe 专属收银台入口按钮 (吸附入口卡片) */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-blue-950/20 border border-blue-200/80 dark:border-blue-500/30 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Stripe 国际收银台</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded-md uppercase">
                            Stripe
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          支持 Visa、Mastercard、Apple Pay 等原生结算
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewMode('stripe')}
                      className="px-3.5 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white shadow-md shadow-blue-500/25 flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      <span>进入收银台</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative flex py-0.5 items-center">
                    <div className="flex-grow border-t border-slate-200/80 dark:border-white/10"></div>
                    <span className="flex-shrink mx-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium select-none">
                      或使用以下渠道直接汇款
                    </span>
                    <div className="flex-grow border-t border-slate-200/80 dark:border-white/10"></div>
                  </div>

                  {/* 分段选择器: PayPal UK vs USDT */}
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 gap-1">
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                        intlSubTab === 'paypal'
                          ? 'bg-white dark:bg-[#1f242f] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-white/10 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      onClick={() => setIntlSubTab('paypal')}
                    >
                      <PayPalIcon className="w-3.5 h-3.5" />
                      <span>PayPal (UK)</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                        intlSubTab === 'crypto'
                          ? 'bg-white dark:bg-[#1f242f] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-white/10 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      onClick={() => setIntlSubTab('crypto')}
                    >
                      <UsdtIcon className="w-3.5 h-3.5" />
                      <span>USDT 加密钱包</span>
                    </button>
                  </div>

                  {/* PayPal UK 独立展示 */}
                  {intlSubTab === 'paypal' && (
                    <div className="p-4 rounded-xl bg-white dark:bg-[#181b22] border border-blue-500/20 space-y-3 shadow-xs animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PayPalIcon className="w-4 h-4" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            PayPal UK 专属收款码
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                          支持 GBP 结算
                        </span>
                      </div>

                      <div className="flex flex-col items-center justify-center py-1">
                        <a
                          href={currentPaypalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
                          title="点击前往 PayPal UK 官方页面"
                        >
                          <img
                            src="/media/shijianus/support/paypal-uk.jpg"
                            alt="PayPal UK 付款二维码"
                            className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg select-none group-hover:opacity-95 transition-opacity"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 rounded-2xl transition-colors flex items-end justify-center pb-2">
                            <span className="text-[11px] font-semibold bg-slate-900/80 text-white px-2.5 py-1 rounded-full opacity-90 group-hover:opacity-100 flex items-center gap-1 shadow-sm">
                              <span>点击打开链接</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </div>
                        </a>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                          可直接扫码或点击上方二维码进入 PayPal UK 官方页面
                        </span>
                      </div>

                      <a
                        href={currentPaypalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#0070ba] hover:bg-[#003087] text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>前往 PayPal UK 付款支持</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* USDT 独立展示 */}
                  {intlSubTab === 'crypto' && (
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      {/* 网络切换 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#26a17b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            ₮
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            USDT 冷钱包直接收款
                          </span>
                        </div>

                        <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold border border-slate-200/70 dark:border-white/10">
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                              cryptoNetwork === 'TRC20'
                                ? 'bg-white dark:bg-[#1e222d] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                            onClick={() => setCryptoNetwork('TRC20')}
                          >
                            TRC20 (低费率)
                          </button>
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                              cryptoNetwork === 'ERC20'
                                ? 'bg-white dark:bg-[#1e222d] text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                            onClick={() => setCryptoNetwork('ERC20')}
                          >
                            ERC20
                          </button>
                        </div>
                      </div>

                      {/* 二维码 */}
                      <div className="flex flex-col items-center justify-center py-1">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                          {cryptoQrDataUrl ? (
                            <img
                              src={cryptoQrDataUrl}
                              alt={`USDT-${cryptoNetwork} 收款二维码`}
                              className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg select-none"
                            />
                          ) : (
                            <div className="w-40 h-40 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                          打开 Web3 / USDT 钱包 App 扫一扫
                        </span>
                      </div>

                      {/* 完整地址与复制 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">收款地址 ({cryptoNetwork})</span>
                          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            {cryptoNetwork === 'TRC20' ? '⚡️ 波场 TRON 网络' : '⛓️ 以太坊 Ethereum 网络'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 focus-within:border-emerald-500 transition-colors">
                          <code className="text-xs font-mono break-all text-slate-800 dark:text-slate-200 select-all leading-relaxed flex-1">
                            {currentCryptoAddress}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentCryptoAddress, `USDT-${cryptoNetwork} 地址`)}
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                            title="复制完整地址"
                          >
                            {copiedAddress ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>复制</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          请核对充币网络为 <strong>USDT-{cryptoNetwork}</strong>，充错网络资产将无法找回。
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* A4: 全球其它地区 (GLOBAL) —— Stripe + PayPal HK + USDT */}
              {/* ------------------------------------------------------------- */}
              {region === 'GLOBAL' && (
                <div className="space-y-3.5">
                  {/* Stripe 专属收银台入口按钮 */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-blue-950/20 border border-blue-200/80 dark:border-blue-500/30 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Stripe 国际收银台</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded-md uppercase">
                            Stripe
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          支持全球信用卡 / Apple Pay / Google Pay
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewMode('stripe')}
                      className="px-3.5 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white shadow-md shadow-blue-500/25 flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      <span>进入收银台</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative flex py-0.5 items-center">
                    <div className="flex-grow border-t border-slate-200/80 dark:border-white/10"></div>
                    <span className="flex-shrink mx-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium select-none">
                      或选择以下支付方式
                    </span>
                    <div className="flex-grow border-t border-slate-200/80 dark:border-white/10"></div>
                  </div>

                  {/* 分段选择器: PayPal (HK) vs USDT */}
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 gap-1">
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                        intlSubTab === 'paypal'
                          ? 'bg-white dark:bg-[#1f242f] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-white/10 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      onClick={() => setIntlSubTab('paypal')}
                    >
                      <PayPalIcon className="w-3.5 h-3.5" />
                      <span>PayPal</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                        intlSubTab === 'crypto'
                          ? 'bg-white dark:bg-[#1f242f] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-white/10 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      onClick={() => setIntlSubTab('crypto')}
                    >
                      <UsdtIcon className="w-3.5 h-3.5" />
                      <span>USDT 加密钱包</span>
                    </button>
                  </div>

                  {/* PayPal (HK) 展示 */}
                  {intlSubTab === 'paypal' && (
                    <div className="p-4 rounded-xl bg-white dark:bg-[#181b22] border border-blue-500/20 space-y-3 shadow-xs animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PayPalIcon className="w-4 h-4" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            PayPal 国际直连付款码
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                          全球主流币种直连
                        </span>
                      </div>

                      <div className="flex flex-col items-center justify-center py-1">
                        <a
                          href={paypalMeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
                          title="点击前往 PayPal 官方页面"
                        >
                          <img
                            src="/media/shijianus/support/paypal-hk.jpg"
                            alt="PayPal 付款二维码"
                            className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg select-none group-hover:opacity-95 transition-opacity"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 rounded-2xl transition-colors flex items-end justify-center pb-2">
                            <span className="text-[11px] font-semibold bg-slate-900/80 text-white px-2.5 py-1 rounded-full opacity-90 group-hover:opacity-100 flex items-center gap-1 shadow-sm">
                              <span>点击打开链接</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </div>
                        </a>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                          支持直接扫码或点击上方二维码进入付款链接
                        </span>
                      </div>

                      <a
                        href={paypalMeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#0070ba] hover:bg-[#003087] text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>前往 PayPal.Me 付款支持</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* USDT 展示 */}
                  {intlSubTab === 'crypto' && (
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#26a17b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            ₮
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            USDT 冷钱包直接收款
                          </span>
                        </div>

                        <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold border border-slate-200/70 dark:border-white/10">
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                              cryptoNetwork === 'TRC20'
                                ? 'bg-white dark:bg-[#1e222d] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                            onClick={() => setCryptoNetwork('TRC20')}
                          >
                            TRC20 (低费率)
                          </button>
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                              cryptoNetwork === 'ERC20'
                                ? 'bg-white dark:bg-[#1e222d] text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                            onClick={() => setCryptoNetwork('ERC20')}
                          >
                            ERC20
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center py-1">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                          {cryptoQrDataUrl ? (
                            <img
                              src={cryptoQrDataUrl}
                              alt={`USDT-${cryptoNetwork} 收款二维码`}
                              className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg select-none"
                            />
                          ) : (
                            <div className="w-40 h-40 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                          打开 Web3 / USDT 钱包 App 扫一扫
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">收款地址 ({cryptoNetwork})</span>
                          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            {cryptoNetwork === 'TRC20' ? '⚡️ 波场 TRON 网络' : '⛓️ 以太坊 Ethereum 网络'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 focus-within:border-emerald-500 transition-colors">
                          <code className="text-xs font-mono break-all text-slate-800 dark:text-slate-200 select-all leading-relaxed flex-1">
                            {currentCryptoAddress}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentCryptoAddress, `USDT-${cryptoNetwork} 地址`)}
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                            title="复制完整地址"
                          >
                            {copiedAddress ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>复制</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          请核对充币网络为 <strong>USDT-{cryptoNetwork}</strong>，充错网络资产将无法找回。
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 【视图 B: 专门的 Stripe 付款界面 (Dedicated Stripe Checkout)】 */}
          {/* ================================================================= */}
          <div
            style={{ display: viewMode === 'stripe' ? 'block' : 'none' }}
            className="space-y-4 animate-in fade-in duration-200"
          >
            {/* 金额快捷选择器 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>赞赏金额 (USD)</span>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                  当前: ${effectiveAmount}.00
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((amt) => {
                  const isActive = selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      data-amt={amt}
                      type="button"
                      onClick={() => setSelectedAmount(amt)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 border cursor-pointer select-none flex items-center justify-center gap-1 ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <span>${amt}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  data-amt="custom"
                  onClick={() => setSelectedAmount('custom')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 border cursor-pointer select-none flex items-center justify-center ${
                    selectedAmount === 'custom'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span>自定义</span>
                </button>
              </div>

              {/* 自定义金额输入框 */}
              {selectedAmount === 'custom' && (
                <div className="flex items-center rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all animate-in fade-in duration-150">
                  <span className="text-slate-400 font-bold text-sm mr-2 select-none">$</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={customAmountStr}
                    onChange={(e) => setCustomAmountStr(e.target.value)}
                    placeholder="输入赞赏金额 (1 - 1000)"
                    className="w-full bg-transparent text-sm font-semibold outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <span className="text-xs text-slate-400 font-medium ml-2 select-none">USD</span>
                </div>
              )}
            </div>

            {/* Stripe Express Checkout 快捷入口 (Apple Pay / Google Pay) */}
            <div
              ref={expressCheckoutContainerRef}
              id="stripe-express-checkout-element"
              className="w-full overflow-hidden"
              style={{ display: hasExpressCheckout ? 'block' : 'none' }}
            />

            {hasExpressCheckout && (
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200/80 dark:border-white/10"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium select-none">
                  或直接输入卡号支付
                </span>
                <div className="flex-grow border-t border-slate-200/80 dark:border-white/10"></div>
              </div>
            )}

            {/* 支付成功反馈 */}
            {paymentSuccess ? (
              <div className="py-8 px-4 text-center space-y-3 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  赞赏支持已完成！☕️
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  非常感谢您的认可与支持，您的鼓励是我持续写作与开源创作的最大动力！
                </p>
                <button
                  type="button"
                  className="mt-2 px-5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  onClick={() => {
                    setPaymentSuccess(false);
                    setViewMode('main');
                  }}
                >
                  返回赞赏主界面
                </button>
              </div>
            ) : (
              <form onSubmit={handleStripeSubmit} className="space-y-3.5">
                {stripeError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{stripeError}</div>
                  </div>
                )}

                {/* Stripe Payment Element 挂载区 (浅色为纯白卡片，深色为暗色) */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 shadow-xs relative min-h-[160px]">
                  {stripeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-[#181b22]/90 backdrop-blur-xs rounded-xl z-10 space-y-2.5">
                      <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        正在安全加载 Stripe 支付组件...
                      </span>
                    </div>
                  )}

                  <div ref={stripeElementsContainerRef} id="stripe-payment-element" />
                </div>

                {/* 立即支付操作按钮 */}
                <button
                  type="submit"
                  disabled={isProcessingPayment || stripeLoading || !stripeReady}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在安全处理支付...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>立即赞赏 ${effectiveAmount}.00 (Stripe)</span>
                    </>
                  )}
                </button>

                {/* 安全认证与卡种说明 */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Stripe 官方 256 位端到端加密结算</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <span>Cards</span>
                    <span>·</span>
                    <span>Apple Pay</span>
                    <span>·</span>
                    <span>Google Pay</span>
                  </div>
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
            href="/about/#about-reward"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
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
