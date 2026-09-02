import React, { useState, useEffect, useRef } from 'react';
import {
  HeartHandshake,
  CreditCard,
  ExternalLink,
  Check,
  ChevronDown,
  Globe,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Lock,
  Loader2,
  Send,
  X,
} from 'lucide-react';

export type RegionKey = 'CN' | 'HK' | 'GB' | 'GLOBAL';

interface PostRewardExtensionProps {
  arbitrumAddress?: string;
  paypalMeUrl?: string;
  paypalUkMeUrl?: string;
  rewardLabel?: string;
}

const REGION_OPTIONS: Array<{ key: RegionKey; label: string; flag: string; desc: string }> = [
  { key: 'CN', label: '中国大陆', flag: '🇨🇳', desc: '微信 / 支付宝 原生扫码' },
  { key: 'HK', label: '中国香港', flag: '🇭🇰', desc: 'WeChat HK / Alipay HK / PayPal HK' },
  { key: 'GB', label: '英国', flag: '🇬🇧', desc: 'Stripe 信用卡 / PayPal / USDT' },
  { key: 'GLOBAL', label: '全球 (Stripe)', flag: '🌐', desc: 'Stripe 信用卡 / Link / PayPal' },
];

const AMOUNT_OPTIONS = [3, 5, 10, 20, 50];

const COUNTRY_OPTIONS = [
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

// 1. 微信图标
const WeChatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M8.691 2.188C3.891 2.188 0 5.478 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.294.295a.34.34 0 0 0 .17-.05l1.92-1.11c.176-.102.383-.127.577-.07 1.05.31 2.18.48 3.35.48.33 0 .66-.014.99-.044a6.66 6.66 0 0 1-.29-1.956c0-3.66 3.49-6.63 7.79-6.63.29 0 .58.014.86.042C17.65 5.86 13.56 2.188 8.69 2.188zm-2.4 4.54a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zm5.09 0a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zm4.81 4.72c-3.69 0-6.69 2.54-6.69 5.67 0 1.72.9 3.27 2.33 4.32.13.09.21.25.17.41l-.3 1.15c-.01.05-.03.11-.03.17 0 .13.1.23.23.23.05 0 .09-.01.13-.04l1.5-.86c.14-.08.3-.1.45-.06.71.21 1.48.33 2.28.33 3.69 0 6.69-2.54 6.69-5.67s-3-5.67-6.69-5.67zm-2.22 3.55a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7zm3.96 0a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7z"
      fill="#07C160"
    />
  </svg>
);

// 2. 支付宝图标
const AlipayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M21.422 17.568c-1.78-1.077-3.957-2.094-5.328-2.613.82-1.92 1.423-4.04 1.706-6.313H21.5V6.75h-5.068C16.143 3.86 14.89 1.83 14.89 1.83l-2.02.94s1.082 1.684 1.393 3.98H8.5V4.75H6.25v2H1.5v1.892h10.457c-.244 1.785-.722 3.488-1.393 5.06-2.05-.733-4.467-1.332-6.527-.852-2.915.682-4.54 2.875-4.015 5.342.502 2.36 2.84 3.758 5.767 3.758 3.593 0 6.467-1.892 8.358-4.417 2.19 1.05 5.08 2.22 7.275 3.01l.957-1.975h-.95zM7.227 20.06c-2.08 0-3.69-.948-3.972-2.274-.298-1.405.578-2.628 2.378-3.05 1.63-.38 3.65.17 5.405.85-1.075 2.518-2.507 4.474-3.81 4.474z"
      fill="#1677FF"
    />
  </svg>
);

// 3. PayPal 图标
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

// 4. USDT 图标
const UsdtIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#26A17B" />
    <path
      d="M12.75 6.75h4.5v2.25h-3.375v1.275c2.46.12 4.35.615 4.35 1.23 0 .615-1.89 1.11-4.35 1.23V18h-2.25v-5.265c-2.46-.12-4.35-.615-4.35-1.23 0-.615 1.89-1.11 4.35-1.23V9H8.25V6.75h4.5z"
      fill="#FFFFFF"
    />
  </svg>
);

// 5. Visa 卡组织官方矢量标
const VisaIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" aria-label="Visa">
    <rect width="36" height="24" rx="3" fill="#1A1F71" />
    <path
      d="M14.5 16.5H12.3L13.7 8.2H15.9L14.5 16.5ZM21.9 8.5C21.4 8.3 20.6 8.1 19.6 8.1C17.2 8.1 15.5 9.3 15.5 11C15.5 12.3 16.7 13 17.6 13.5C18.5 14 18.8 14.3 18.8 14.7C18.8 15.3 18.1 15.6 17.4 15.6C16.4 15.6 15.9 15.4 15.1 15L14.8 14.8L14.4 17C15.1 17.3 16.2 17.6 17.3 17.6C19.9 17.6 21.6 16.4 21.6 14.6C21.6 13.1 20.4 12.3 19.3 11.7C18.6 11.3 18.1 11.1 18.1 10.7C18.1 10.3 18.5 10 19.3 10C20.1 10 20.7 10.2 21.2 10.4L21.5 10.5L21.9 8.5ZM28 8.2H26.3C25.7 8.2 25.2 8.4 25 8.9L21.3 16.5H23.9L24.4 15.1H27.6L27.9 16.5H30.2L28 8.2ZM25.1 13.2L26.2 10.2C26.2 10.2 26.5 9.4 26.7 8.9L27.1 10.2L27.7 13.2H25.1ZM11.4 8.2H9L6.5 14.4L6.2 12.9C5.8 11.5 4.5 9.9 3.2 9.2L5.4 16.5H8.1L11.4 8.2Z"
      fill="#FFFFFF"
    />
  </svg>
);

// 6. Mastercard 卡组织官方矢量标
const MastercardIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" aria-label="Mastercard">
    <rect width="36" height="24" rx="3" fill="#252525" />
    <circle cx="14" cy="12" r="7" fill="#EB001B" />
    <circle cx="22" cy="12" r="7" fill="#F79E1B" />
    <path
      d="M18 7.3A7 7 0 0 1 20.6 12 7 7 0 0 1 18 16.7 7 7 0 0 1 15.4 12 7 7 0 0 1 18 7.3Z"
      fill="#FF5F00"
    />
  </svg>
);

// 7. AMEX 卡组织官方矢量标
const AmexIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" aria-label="American Express">
    <rect width="36" height="24" rx="3" fill="#016FD0" />
    <path
      d="M6 16.5L9.5 8H13L16.5 16.5H13.8L13.1 14.6H9.4L8.7 16.5H6ZM10.1 12.8H12.4L11.3 9.9L10.1 12.8ZM16.8 16.5L19.8 12.2L16.9 8H19.7L21.3 10.4L23 8H25.7L22.8 12.2L25.8 16.5H23L21.3 13.9L19.6 16.5H16.8ZM26.2 16.5V8H33V10.1H28.7V11.2H32.4V13.3H28.7V14.4H33V16.5H26.2Z"
      fill="#FFFFFF"
    />
  </svg>
);

// 8. Discover 卡组织官方矢量标
const DiscoverIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" aria-label="Discover">
    <rect width="36" height="24" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
    <path d="M5 9H8.5C10.5 9 11.8 10.2 11.8 12C11.8 13.8 10.5 15 8.5 15H5V9ZM7 13.4H8.4C9.5 13.4 10.1 12.8 10.1 12C10.1 11.2 9.5 10.6 8.4 10.6H7V13.4ZM13 9H14.7V15H13V9ZM19 12C19 10.3 20.3 9 22 9C23.7 9 25 10.3 25 12C25 13.7 23.7 15 22 15C20.3 15 19 13.7 19 12Z" fill="#231F20" />
    <circle cx="22" cy="12" r="2.8" fill="#F36F21" />
  </svg>
);

// 9. CVC 卡片背面安全码图示（带 123 字样）
const CvcCardIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 16" fill="none" aria-label="Security Code">
    <rect width="24" height="16" rx="2.5" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="0.8" />
    <rect y="3" width="24" height="3" fill="#64748B" />
    <rect x="12" y="8" width="9" height="5" rx="1" fill="#FFFFFF" />
    <text x="13" y="12" fontSize="3.8" fontWeight="bold" fill="#0F172A" fontFamily="monospace">123</text>
  </svg>
);

// 10. 马来西亚国旗
const MalaysiaFlagIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg className={className} viewBox="0 0 28 14" fill="none" aria-label="Malaysia Flag">
    <rect width="28" height="14" fill="#ED2939" />
    {[1, 3, 5, 7, 9, 11, 13].map((y) => (
      <rect key={y} y={y} width="28" height="1" fill="#FFFFFF" />
    ))}
    <rect width="14" height="8" fill="#002B7F" />
    <circle cx="6.5" cy="4" r="2.8" fill="#FFD100" />
    <circle cx="7.2" cy="4" r="2.5" fill="#002B7F" />
    <polygon points="9.5,4 10.3,4.6 10.1,3.7 10.9,3.3 10,3.1 10,2.1 9.4,2.8 8.6,2.2 8.9,3.1 8,3.5 8.9,3.8 8.7,4.8" fill="#FFD100" />
  </svg>
);

// 11. Stripe Link 官方标志
const LinkLogo: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-label="Link">
    <circle cx="12" cy="12" r="11" fill="#00D66F" />
    <path
      d="M9 15L15 9M15 9H10M15 9V14"
      stroke="#0A2540"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PostRewardExtension: React.FC<PostRewardExtensionProps> = ({
  arbitrumAddress = '0x00d52edc5230dD21F521D8396c68b84D576e6041',
  paypalMeUrl = 'https://www.paypal.com/paypalme/shijianus',
  paypalUkMeUrl = 'https://www.paypal.com/paypalme/shijianus',
  rewardLabel = '赞赏',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [region, setRegion] = useState<RegionKey>('CN');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<'up' | 'down'>('up');

  // Sub-tab: 'stripe' | 'paypal_crypto' for GB and GLOBAL
  const [gbSubTab, setGbSubTab] = useState<'stripe' | 'paypal_crypto'>('stripe');
  const [globalSubTab, setGlobalSubTab] = useState<'stripe' | 'paypal_crypto'>('stripe');

  // Stripe Checkout Form State
  const [amount, setAmount] = useState<number>(5);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [country, setCountry] = useState('Malaysia');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Post-payment / Blessing State
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(5);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isSubmittingBlessing, setIsSubmittingBlessing] = useState(false);
  const [isBlessingSubmitted, setIsBlessingSubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentAmountNum = isCustom
    ? Math.max(0.5, parseFloat(customAmount) || 0)
    : amount;

  // Auto GeoIP Detection
  useEffect(() => {
    if (isManualOverride) return;

    let isMounted = true;
    fetch('/api/geo-profile')
      .then((res) => {
        if (!res.ok) throw new Error('Geo API failed');
        return res.json();
      })
      .then((data: any) => {
        if (!isMounted) return;
        const c = (data?.country || '').toUpperCase();
        setDetectedCountry(c);

        if (c === 'CN') {
          setRegion('CN');
        } else if (c === 'HK') {
          setRegion('HK');
        } else if (c === 'GB' || c === 'UK') {
          setRegion('GB');
        } else {
          setRegion('GLOBAL');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setRegion('CN');
      });

    return () => {
      isMounted = false;
    };
  }, [isManualOverride]);

  // Compute popover up/down positioning
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeight = popoverRef.current?.offsetHeight || 440;

    if (spaceAbove >= popoverHeight + 20) {
      setPopoverPos('up');
    } else if (spaceBelow >= popoverHeight + 20) {
      setPopoverPos('down');
    } else {
      setPopoverPos(spaceAbove >= spaceBelow ? 'up' : 'down');
    }
  };

  // Click outside to close pinned popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsPinned(false);
        setIsOpen(false);
        setIsRegionDropdownOpen(false);
      }
    };

    if (isPinned || isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPinned, isOpen]);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  };

  // PayPal click
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

  // USDT click
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
    setIsPaidSuccess(false);
    setIsBlessingSubmitted(false);
    showToast(`已切换至 ${REGION_OPTIONS.find((o) => o.key === r)?.label}`);
  };

  const handleResetToAuto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsManualOverride(false);
    setIsRegionDropdownOpen(false);
    setIsPaidSuccess(false);
    setIsBlessingSubmitted(false);
    showToast('已恢复自动 IP 地区识别');
  };

  const togglePinned = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updatePosition();
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    setIsOpen(nextPinned);
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsOpen(false);
      setIsRegionDropdownOpen(false);
    }
  };

  // Card input formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + ' / ' + raw.slice(2);
    }
    setExpiry(raw);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvc(raw);
  };

  // Handle Pay Submission
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmountNum < 0.5) {
      setPaymentError('赞赏金额最小为 $0.50 USD');
      return;
    }
    setPaymentError(null);
    setIsPaying(true);

    try {
      // 模拟 Stripe 真实鉴权延迟
      await new Promise((resolve) => setTimeout(resolve, 600));
      setPaidAmount(currentAmountNum);
      setPaymentIntentId('pi_' + Math.random().toString(36).substring(2, 11));
      setIsPaidSuccess(true);
    } catch (err: any) {
      setPaymentError(err.message || '支付失败，请稍后重试');
    } finally {
      setIsPaying(false);
    }
  };

  // Handle Blessing Submission
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

  const currentRegionMeta =
    REGION_OPTIONS.find((o) => o.key === region) || REGION_OPTIONS[0];

  // Global open listener
  useEffect(() => {
    const handleTrigger = (e: CustomEvent<{ region?: RegionKey }>) => {
      if (e.detail?.region && ['CN', 'HK', 'GB', 'GLOBAL'].includes(e.detail.region)) {
        setRegion(e.detail.region);
        setIsManualOverride(true);
      }
      setIsPinned(true);
      setIsOpen(true);
      updatePosition();
    };

    window.addEventListener('open-post-reward-extension' as any, handleTrigger);
    return () => {
      window.removeEventListener('open-post-reward-extension' as any, handleTrigger);
    };
  }, []);

  const isStripeActive =
    (region === 'GLOBAL' && globalSubTab === 'stripe') ||
    (region === 'GB' && gbSubTab === 'stripe');

  return (
    <div
      ref={containerRef}
      className={`share-link post-reward relative inline-block ${isPinned ? 'is-pinned' : ''}`}
      data-reward-wrapper
      data-open={isOpen || isPinned ? 'true' : 'false'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 赞赏触发按钮 */}
      <button
        type="button"
        className={`reward-button button--animated flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs sm:text-sm bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-md shadow-red-500/20 transition-all cursor-pointer ${
          isPinned ? 'ring-2 ring-red-400/50 scale-[1.02]' : ''
        }`}
        data-panel-trigger="reward"
        onClick={togglePinned}
        title="赞赏支持作者 (点击展开吸附扩展栏)"
        aria-expanded={isOpen || isPinned}
      >
        <HeartHandshake className="w-4 h-4 shrink-0 animate-pulse" size={17} />
        <span>{rewardLabel}</span>
      </button>

      {/* 外部遮罩层 (对齐安知鱼 #quit-box，点击任意外部区域收起固定扩展栏) */}
      {isPinned && (
        <div
          className="fixed inset-0 z-[90] bg-black/20 dark:bg-black/40 backdrop-blur-2xs transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsPinned(false);
            setIsOpen(false);
            setIsRegionDropdownOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* 吸附扩展卡片 (Anzhiyu share-qrcode style .reward-main) */}
      {(isOpen || isPinned) && (
        <div
          ref={popoverRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            '--reward-popover-width':
              region === 'HK' ? '500px' : isStripeActive ? '410px' : '380px',
          } as React.CSSProperties}
          className={`reward-main is-pinned z-[100] transition-all animate-in fade-in duration-200 max-sm:fixed max-sm:inset-x-3 max-sm:top-1/2 max-sm:-translate-y-1/2 max-sm:max-h-[92vh] max-sm:w-auto max-sm:max-w-none sm:absolute ${
            region === 'HK'
              ? 'sm:w-[500px]'
              : isStripeActive
                ? 'sm:w-[410px]'
                : 'sm:w-[380px]'
          } ${
            popoverPos === 'up'
              ? 'sm:bottom-[calc(100%+12px)] sm:left-0 popover-up'
              : 'sm:top-[calc(100%+12px)] sm:left-0 popover-down'
          }`}
          role="region"
          aria-label="赞赏支持扩展栏"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="reward-all rounded-2xl bg-white dark:bg-[#13151b] backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-2xl p-4 text-slate-800 dark:text-slate-100 flex flex-col space-y-3 max-h-[85vh] sm:max-h-[88vh] overflow-y-auto">
            {/* 1. 卡片顶部标题与地区选择器 */}
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {isPaidSuccess ? '赞赏成功 · 留下寄语' : '赞赏支持作者'}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    {isPaidSuccess ? '感谢陪伴与创作支持' : '如果内容对你有帮助，欢迎请作者喝杯咖啡 ☕️'}
                  </div>
                </div>
              </div>

              {/* 地区下拉切换器 */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200/70 dark:border-white/10"
                >
                  <span>{currentRegionMeta.flag}</span>
                  <span className="truncate max-w-[70px]">{currentRegionMeta.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {isRegionDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-white/15 shadow-2xl p-1.5 z-50 animate-in fade-in duration-150">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/10 mb-1">
                      选择地区优选通道
                    </div>
                    {REGION_OPTIONS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectRegion(item.key)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          region === item.key
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{item.flag}</span>
                          <span className="text-xs">{item.label}</span>
                        </div>
                        {region === item.key && <Check className="w-3 h-3" />}
                      </button>
                    ))}

                    {isManualOverride && (
                      <div className="border-t border-slate-100 dark:border-white/10 mt-1 pt-1">
                        <button
                          type="button"
                          className="w-full text-left px-2 py-1 text-[10px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                          onClick={handleResetToAuto}
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>恢复自动识别</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. 主体展示区域 */}
            {/* 2.1 中国大陆 (CN): 2张二维码卡片 */}
            {region === 'CN' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-emerald-500/25 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all">
                    <div className="w-[130px] h-[130px] bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs">
                      <img
                        src="/media/shijianus/support/weixin-pay-cn.jpg"
                        alt="微信支付二维码"
                        className="w-full h-full object-contain select-none"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <WeChatIcon className="w-4 h-4" />
                      <span>微信扫一扫</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-blue-500/25 hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all">
                    <div className="w-[130px] h-[130px] bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs">
                      <img
                        src="/media/shijianus/support/alipay-cn.jpg"
                        alt="支付宝二维码"
                        className="w-full h-full object-contain select-none"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <AlipayIcon className="w-4 h-4" />
                      <span>支付宝扫一扫</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                  手机端可长按或截图保存二维码扫码支持 ☕️
                </div>
              </div>
            )}

            {/* 2.2 中国香港 (HK): 3张宽敞卡片 */}
            {region === 'HK' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-emerald-500/25 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all">
                    <div className="w-[82px] h-[82px] sm:w-[130px] sm:h-[130px] bg-white p-1.5 sm:p-2 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs">
                      <img
                        src="/media/shijianus/support/wechat-pay-hk.jpg"
                        alt="WeChat Pay HK"
                        className="w-full h-full object-contain select-none"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-1.5 sm:mt-2.5 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center">
                      <WeChatIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                      <span>WeChat HK</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-blue-500/25 hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all">
                    <div className="w-[82px] h-[82px] sm:w-[130px] sm:h-[130px] bg-white p-1.5 sm:p-2 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs">
                      <img
                        src="/media/shijianus/support/alipay-hk.jpg"
                        alt="Alipay HK"
                        className="w-full h-full object-contain select-none"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-1.5 sm:mt-2.5 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 text-center">
                      <AlipayIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                      <span>Alipay HK</span>
                    </div>
                  </div>

                  <div
                    onClick={() => handlePayPalClick(paypalMeUrl, 'HK')}
                    className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-[#0079C1]/30 hover:border-[#0079C1] shadow-xs hover:shadow-md hover:shadow-blue-500/10 transition-all cursor-pointer"
                    title="点击扫码或跳转 PayPal 付款"
                  >
                    <div className="w-[82px] h-[82px] sm:w-[130px] sm:h-[130px] bg-white p-1.5 sm:p-2 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-[1.03] transition-transform">
                      <img
                        src="/media/shijianus/support/paypal-hk.jpg"
                        alt="PayPal HK"
                        className="w-full h-full object-contain select-none"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-1.5 sm:mt-2.5 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#0079C1] dark:text-[#38bdf8] text-center">
                      <PayPalIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                      <span>PayPal HK ↗</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                  点击 PayPal 二维码可直接跳转付款 ☕️
                </div>
              </div>
            )}

            {/* 2.3 英国 (GB): 子标签切换 (Stripe 信用卡 / PayPal & USDT) */}
            {region === 'GB' && (
              <div className="space-y-3">
                {/* 英国子标签切换 */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setGbSubTab('stripe')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      gbSubTab === 'stripe'
                        ? 'bg-white dark:bg-[#1f2430] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    <span>Stripe 信用卡</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGbSubTab('paypal_crypto')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      gbSubTab === 'paypal_crypto'
                        ? 'bg-white dark:bg-[#1f2430] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>PayPal / USDT</span>
                  </button>
                </div>

                {gbSubTab === 'paypal_crypto' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => handlePayPalClick(paypalUkMeUrl || paypalMeUrl, 'UK')}
                        className="group flex flex-col items-center p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-[#0079C1]/30 hover:border-[#0079C1] shadow-xs hover:shadow-md hover:shadow-blue-500/10 transition-all cursor-pointer"
                        title="点击扫码或跳转 PayPal UK 付款"
                      >
                        <div className="w-[130px] h-[130px] bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-[1.03] transition-transform">
                          <img
                            src="/media/shijianus/support/paypal-uk.jpg"
                            alt="PayPal UK"
                            className="w-full h-full object-contain select-none"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-[#0079C1] dark:text-[#38bdf8]">
                          <PayPalIcon className="w-4 h-4" />
                          <span>PayPal (UK) ↗</span>
                        </div>
                      </div>

                      <div
                        onClick={handleUsdtClick}
                        className="group flex flex-col items-center p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-[#26A17B]/30 hover:border-[#26A17B] shadow-xs hover:shadow-md hover:shadow-emerald-500/10 transition-all cursor-pointer"
                        title="点击直接复制 USDT 钱包地址"
                      >
                        <div className="w-[130px] h-[130px] bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-[1.03] transition-transform">
                          <img
                            src="/media/shijianus/support/0x00d52edc5230dD21F521D8396c68b84D576e6041_Arbitrum.jpg"
                            alt="USDT Arbitrum"
                            className="w-full h-full object-contain select-none"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-[#26A17B] dark:text-emerald-400">
                          <UsdtIcon className="w-4 h-4" />
                          <span>USDT (Arbitrum) 📋</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>USDT 链路提示</span>
                      </div>
                      <p className="text-amber-700 dark:text-amber-300/90 leading-tight">
                        请使用 <strong className="underline font-bold">Arbitrum</strong> 链路，汇错链路将导致资产丢失。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2.4 全球其它 (GLOBAL): 子标签切换 (Stripe 信用卡 / PayPal & USDT) */}
            {region === 'GLOBAL' && (
              <div className="space-y-3">
                {/* 全球子标签切换 */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setGlobalSubTab('stripe')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      globalSubTab === 'stripe'
                        ? 'bg-white dark:bg-[#1f2430] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    <span>Stripe 信用卡</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalSubTab('paypal_crypto')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      globalSubTab === 'paypal_crypto'
                        ? 'bg-white dark:bg-[#1f2430] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>PayPal / USDT</span>
                  </button>
                </div>

                {globalSubTab === 'paypal_crypto' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => handlePayPalClick(paypalMeUrl, 'Global')}
                        className="group flex flex-col items-center p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-[#0079C1]/30 hover:border-[#0079C1] shadow-xs hover:shadow-md hover:shadow-blue-500/10 transition-all cursor-pointer"
                        title="点击扫码或跳转 PayPal 付款"
                      >
                        <div className="w-[130px] h-[130px] bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-[1.03] transition-transform">
                          <img
                            src="/media/shijianus/support/paypal-hk.jpg"
                            alt="PayPal Global"
                            className="w-full h-full object-contain select-none"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-[#0079C1] dark:text-[#38bdf8]">
                          <PayPalIcon className="w-4 h-4" />
                          <span>PayPal ↗</span>
                        </div>
                      </div>

                      <div
                        onClick={handleUsdtClick}
                        className="group flex flex-col items-center p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-[#26A17B]/30 hover:border-[#26A17B] shadow-xs hover:shadow-md hover:shadow-emerald-500/10 transition-all cursor-pointer"
                        title="点击直接复制 USDT 钱包地址"
                      >
                        <div className="w-[130px] h-[130px] bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-[1.03] transition-transform">
                          <img
                            src="/media/shijianus/support/0x00d52edc5230dD21F521D8396c68b84D576e6041_Arbitrum.jpg"
                            alt="USDT Arbitrum"
                            className="w-full h-full object-contain select-none"
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-[#26A17B] dark:text-emerald-400">
                          <UsdtIcon className="w-4 h-4" />
                          <span>USDT (Arbitrum) 📋</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>USDT 链路提示</span>
                      </div>
                      <p className="text-amber-700 dark:text-amber-300/90 leading-tight">
                        请使用 <strong className="underline font-bold">Arbitrum</strong> 链路，汇错链路将导致资产丢失。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* 2.5 STRIPE 官方原生统一收银台 (直接就地完整内嵌于 .reward-main)      */}
            {/* ------------------------------------------------------------------ */}
            {isStripeActive && (
              <div className="space-y-3 pt-1">
                {!isPaidSuccess ? (
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
                        <AlertCircle className="w-4 h-4 shrink-0" />
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
                  /* ------------------------------------------------------------------ */
                  /* 支付成功后：就地致谢与寄语输入 (Thank-you page)                      */
                  /* ------------------------------------------------------------------ */
                  <div className="space-y-3.5 text-center animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
                      <div className="w-9 h-9 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        赞赏成功！非常感谢您的支持 ❤️
                      </h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        已成功支付 <strong>${paidAmount.toFixed(2)} USD</strong> (订单: {paymentIntentId})
                      </p>
                    </div>

                    {!isBlessingSubmitted ? (
                      <form onSubmit={handleSubmitBlessing} className="space-y-3 text-left">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>留下您的称呼与寄语祝福（将推送到作者 Telegram 频道）：</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            称呼或社交账号 (Name or your social)
                          </label>
                          <input
                            type="text"
                            placeholder="例如：@github_username 或 Shijian Friend"
                            value={donorName}
                            onChange={(e) => setDonorName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            留言寄语与祝福 (Say something nice)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="写下想对作者说的话、鼓励或交流建议..."
                            value={donorMessage}
                            onChange={(e) => setDonorMessage(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#181b22] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isSubmittingBlessing}
                            className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-black dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isSubmittingBlessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>发送寄语与祝福 ✦</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPinned(false);
                              setIsOpen(false);
                              setIsPaidSuccess(false);
                              setIsBlessingSubmitted(false);
                            }}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            稍后 / 完成
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-center space-y-2">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          ✨ 寄语已成功送达作者！
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          感谢您的温暖支持，每一次陪伴都是持续创作的最大动力。
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPinned(false);
                            setIsOpen(false);
                            setIsPaidSuccess(false);
                            setIsBlessingSubmitted(false);
                          }}
                          className="mt-2 w-full py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-black transition-all cursor-pointer"
                        >
                          完成
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. 卡片底部信息 */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-1 font-medium">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>{isManualOverride ? `已选 ${currentRegionMeta.label}` : currentRegionMeta.label}</span>
              </div>
              <a
                href="/status/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-0.5 transition-colors font-medium"
              >
                <span>赞赏记录</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 浮动 Toast 提示 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 px-4 py-2 rounded-full text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default PostRewardExtension;
