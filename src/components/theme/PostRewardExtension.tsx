import React, { useState, useEffect, useRef } from 'react';
import {
  HeartHandshake,
  CreditCard,
  ExternalLink,
  Check,
  ChevronDown,
  Globe,
  RefreshCw,
  Copy,
  CheckCheck,
} from 'lucide-react';

export type RegionKey = 'CN' | 'HK' | 'GB' | 'GLOBAL';

interface PostRewardExtensionProps {
  arbitrumAddress?: string;
  paypalMeUrl?: string;
  paypalUkMeUrl?: string;
  rewardLabel?: string;
}

const REGION_OPTIONS: Array<{ key: RegionKey; label: string; flag: string; desc: string }> = [
  { key: 'CN', label: '中国大陆', flag: '🇨🇳', desc: '微信 / 支付宝' },
  { key: 'HK', label: '中国香港', flag: '🇭🇰', desc: 'WeChat HK / Alipay HK' },
  { key: 'GB', label: '英国', flag: '🇬🇧', desc: 'PayPal UK / Stripe' },
  { key: 'GLOBAL', label: '全球', flag: '🌐', desc: 'Stripe / PayPal' },
];

/* ── SVG Icons ── */
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

const StripeLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg
    viewBox="54 36 360 150"
    fill="currentColor"
    className={className}
    aria-label="Stripe"
  >
    <path d="M414,113.4c0-25.6-12.4-45.8-36.1-45.8c-23.8,0-38.2,20.2-38.2,45.6c0,30.1,17,45.3,41.4,45.3 c11.9,0,20.9-2.7,27.7-6.5v-20c-6.8,3.4-14.6,5.5-24.5,5.5c-9.7,0-18.3-3.4-19.4-15.2h48.9C413.8,121,414,115.8,414,113.4z M364.6,103.9c0-11.3,6.9-16,13.2-16c6.1,0,12.6,4.7,12.6,16H364.6z" />
    <path d="M301.1,67.6c-9.8,0-16.1,4.6-19.6,7.8l-1.3-6.2h-22v116.6l25-5.3l0.1-28.3c3.6,2.6,8.9,6.3,17.7,6.3 c17.9,0,34.2-14.4,34.2-46.1C335.1,83.4,318.6,67.6,301.1,67.6z M295.1,136.5c-5.9,0-9.4-2.1-11.8-4.7l-0.1-37.1 c2.6-2.9,6.2-4.9,11.9-4.9c9.1,0,15.4,10.2,15.4,23.3C310.5,126.5,304.3,136.5,295.1,136.5z" />
    <polygon points="223.8,61.7 248.9,56.3 248.9,36 223.8,41.3" />
    <rect x="223.8" y="69.3" width="25.1" height="87.5" />
    <path d="M196.9,76.7l-1.6-7.4h-21.6v87.5h25V97.5c5.9-7.7,15.9-6.3,19-5.2v-23C214.5,68.1,202.8,65.9,196.9,76.7z" />
    <path d="M146.9,47.6l-24.4,5.2l-0.1,80.1c0,14.8,11.1,25.7,25.9,25.7c8.2,0,14.2-1.5,17.5-3.3V135 c-3.2,1.3-19,5.9-19-8.9V90.6h19V69.3h-19L146.9,47.6z" />
    <path d="M79.3,94.7c0-3.9,3.2-5.4,8.5-5.4c7.6,0,17.2,2.3,24.8,6.4V72.2c-8.3-3.3-16.5-4.6-24.8-4.6 C67.5,67.6,54,78.2,54,95.9c0,27.6,38,23.2,38,35.1c0,4.6-4,6.1-9.6,6.1c-8.3,0-18.9-3.4-27.3-8v23.8c9.3,4,18.7,5.7,27.3,5.7 c20.8,0,35.1-10.3,35.1-28.2C117.4,100.6,79.3,105.9,79.3,94.7z" />
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');
  const [popoverPos, setPopoverPos] = useState<'up' | 'down'>('up');
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto GeoIP Detection
  useEffect(() => {
    if (isManualOverride) return;
    let isMounted = true;
    fetch('/api/geo-profile')
      .then((res) => res.json())
      .then((data: any) => {
        if (!isMounted) return;
        const c = (data?.country || '').toUpperCase();
        if (c === 'CN') setRegion('CN');
        else if (c === 'HK') setRegion('HK');
        else if (c === 'GB' || c === 'UK') setRegion('GB');
        else setRegion('GLOBAL');
      })
      .catch(() => { if (isMounted) setRegion('CN'); });
    return () => { isMounted = false; };
  }, [isManualOverride]);

  // Popover position
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverH = popoverRef.current?.offsetHeight || 420;
    if (spaceAbove >= popoverH + 20) setPopoverPos('up');
    else if (spaceBelow >= popoverH + 20) setPopoverPos('down');
    else setPopoverPos(spaceAbove >= spaceBelow ? 'up' : 'down');
  };

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPinned(false);
        setIsOpen(false);
        setIsRegionDropdownOpen(false);
      }
    };
    if (isPinned || isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isPinned, isOpen]);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const handlePayPalClick = (url: string, regionLabel: string) => {
    navigator.clipboard?.writeText(url).catch(() => {});
    showToast(`正在打开 PayPal ${regionLabel}...`, 'info');
    try { window.open(url, '_blank', 'noopener,noreferrer'); }
    catch (_) { window.location.href = url; }
  };

  const handleUsdtClick = () => {
    navigator.clipboard?.writeText(arbitrumAddress).catch(() => {});
    setCopied(true);
    showToast('已复制 USDT (Arbitrum) 钱包地址');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectRegion = (r: RegionKey) => {
    setRegion(r);
    setIsManualOverride(true);
    setIsRegionDropdownOpen(false);
    showToast(`已切换至 ${REGION_OPTIONS.find((o) => o.key === r)?.label}`, 'info');
  };

  const handleResetToAuto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsManualOverride(false);
    setIsRegionDropdownOpen(false);
    showToast('已恢复自动 IP 地区识别', 'info');
  };

  const handleOpenStripeModal = () => {
    setIsPinned(false);
    setIsOpen(false);
    window.dispatchEvent(
      new CustomEvent('open-stripe-modal', {
        detail: {
          region,
          country: region === 'CN' ? 'CN' : region === 'HK' ? 'HK' : region === 'GB' ? 'GB' : undefined,
          amount: 5,
        },
      })
    );
  };

  const togglePinned = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updatePosition();
    const next = !isPinned;
    setIsPinned(next);
    setIsOpen(next);
  };

  // Global trigger listener
  useEffect(() => {
    const handler = (e: CustomEvent<{ region?: RegionKey }>) => {
      if (e.detail?.region && ['CN', 'HK', 'GB', 'GLOBAL'].includes(e.detail.region)) {
        setRegion(e.detail.region);
        setIsManualOverride(true);
      }
      setIsPinned(true);
      setIsOpen(true);
      updatePosition();
    };
    window.addEventListener('open-post-reward-extension' as any, handler);
    return () => window.removeEventListener('open-post-reward-extension' as any, handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRegionMeta = REGION_OPTIONS.find((o) => o.key === region) || REGION_OPTIONS[0];

  /* ── QR Card Component ── */
  const QrCard = ({
    src, alt, label, labelColor, icon, onClick, subLabel,
  }: {
    src: string;
    alt: string;
    label: string;
    labelColor: string;
    icon: React.ReactNode;
    onClick?: () => void;
    subLabel?: string;
  }) => (
    <div
      onClick={onClick}
      className={`group flex flex-col items-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/80 dark:border-white/8 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.98]' : ''}`}
    >
      <div className="w-[110px] h-[110px] bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-contain select-none ${onClick ? 'group-hover:scale-[1.04] transition-transform duration-200' : ''}`}
          loading="lazy"
        />
      </div>
      <div className="text-center">
        <div className={`flex items-center justify-center gap-1 text-xs font-bold ${labelColor}`}>
          {icon}
          <span>{label}</span>
        </div>
        {subLabel && (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subLabel}</div>
        )}
      </div>
    </div>
  );

  /* ── Stripe / 国际收银台 Button ── */
  const StripeButton = () => (
    <div className="flex justify-center w-full">
      <button
        type="button"
        onClick={handleOpenStripeModal}
        className="relative w-full flex items-center justify-between px-3.5 py-3 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ease-out bg-white dark:bg-[#181b22] text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-white/10 shadow-sm hover:bg-[linear-gradient(115deg,#5A54FF_0%,#635BFF_35%,#8B5CF6_100%)] hover:text-white hover:border-transparent hover:shadow-[0_10px_28px_-8px_rgba(99,91,255,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#13151b]"
      >
        {/* sheen sweep on hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-[18deg] bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-120%] group-hover:translate-x-[420%] transition-transform duration-700 ease-out"
        />

        <div className="relative flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 group-hover:bg-white/20 ring-1 ring-slate-200/80 dark:ring-white/10 group-hover:ring-white/30 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] group-hover:scale-105 transition-all duration-300 text-[#635BFF] dark:text-violet-400 group-hover:text-white">
            <CreditCard className="w-[18px] h-[18px] drop-shadow-sm" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs sm:text-[13px] font-bold leading-tight tracking-[0.01em] flex items-center gap-1.5 whitespace-nowrap">
              <span>Stripe 国际收银台</span>
              <span className="px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-white/10 group-hover:bg-white/20 text-[#635BFF] dark:text-violet-300 group-hover:text-white ring-1 ring-violet-200 dark:ring-white/15 group-hover:ring-white/25 text-[9px] font-semibold tracking-wider uppercase transition-colors">
                推荐
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 group-hover:text-white/80 mt-0.5 leading-none transition-colors truncate">
              信用卡 · Apple Pay · Google Pay · Link
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2 shrink-0 ml-1.5">
          <span className="flex items-center px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 group-hover:bg-white/15 ring-1 ring-slate-200/60 dark:ring-white/10 group-hover:ring-white/20 backdrop-blur-sm transition-colors text-[#635BFF] dark:text-white group-hover:text-white">
            <StripeLogo className="h-3.5 w-auto" />
          </span>
          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 group-hover:bg-white/25 ring-1 ring-slate-200/60 dark:ring-white/10 group-hover:ring-white/25 flex items-center justify-center text-slate-400 dark:text-slate-300 group-hover:text-white transition-colors duration-300">
            <ChevronDown className="w-3 h-3 -rotate-90 group-hover:translate-x-0.5 transition-transform duration-300" />
          </span>
        </div>
      </button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`share-link post-reward relative inline-block ${isPinned ? 'is-pinned' : ''}`}
      data-reward-wrapper
      data-open={isOpen || isPinned ? 'true' : 'false'}
      onMouseEnter={() => { updatePosition(); setIsOpen(true); }}
      onMouseLeave={() => { if (!isPinned) { setIsOpen(false); setIsRegionDropdownOpen(false); } }}
    >
      {/* Trigger button */}
      <button
        type="button"
        className={`reward-button button--animated flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs sm:text-sm bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/25 transition-all cursor-pointer ${
          isPinned ? 'ring-2 ring-rose-400/50 scale-[1.02]' : ''
        }`}
        data-panel-trigger="reward"
        onClick={togglePinned}
        title="赞赏支持作者"
        aria-expanded={isOpen || isPinned}
      >
        <HeartHandshake className="w-4 h-4 shrink-0" />
        <span>{rewardLabel}</span>
      </button>

      {/* Backdrop overlay when pinned */}
      {isPinned && (
        <div
          className="fixed inset-0 z-[90] bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={(e) => { e.stopPropagation(); setIsPinned(false); setIsOpen(false); setIsRegionDropdownOpen(false); }}
          aria-hidden="true"
        />
      )}

      {/* Popover card */}
      {(isOpen || isPinned) && (
        <div
          ref={popoverRef}
          className={`reward-main is-pinned z-[100] transition-all animate-in fade-in duration-200 max-sm:fixed max-sm:inset-x-3 max-sm:top-1/2 max-sm:-translate-y-1/2 max-sm:max-h-[92vh] max-sm:w-auto max-sm:max-w-none sm:absolute sm:w-[400px] ${
            popoverPos === 'up'
              ? 'sm:bottom-[calc(100%+14px)] sm:left-0 popover-up'
              : 'sm:top-[calc(100%+14px)] sm:left-0 popover-down'
          }`}
          role="region"
          aria-label="赞赏支持扩展栏"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="reward-all rounded-2xl bg-white dark:bg-[#13151b] border border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    赞赏支持作者
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    如果内容对你有帮助，欢迎请作者喝杯咖啡 ☕️
                  </div>
                </div>
              </div>

              {/* Region picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200/70 dark:border-white/8"
                >
                  <span>{currentRegionMeta.flag}</span>
                  <span className="truncate max-w-[64px]">{currentRegionMeta.label}</span>
                  <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isRegionDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-white/12 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/8 mb-1">
                      选择地区优选通道
                    </div>
                    {REGION_OPTIONS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectRegion(item.key)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          region === item.key
                            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.flag}</span>
                          <div>
                            <div className="font-semibold">{item.label}</div>
                            <div className="text-[10px] opacity-60">{item.desc}</div>
                          </div>
                        </div>
                        {region === item.key && <Check className="w-3.5 h-3.5 text-violet-500" />}
                      </button>
                    ))}
                    {isManualOverride && (
                      <div className="border-t border-slate-100 dark:border-white/8 mt-1 pt-1">
                        <button
                          type="button"
                          className="w-full text-left px-2.5 py-1.5 text-[10px] text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-1.5 cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                          onClick={handleResetToAuto}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>恢复自动 IP 识别</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3.5 max-h-[72vh] sm:max-h-[80vh] overflow-y-auto">

              {/* CN: WeChat + Alipay */}
              {region === 'CN' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <QrCard
                      src="/media/shijianus/support/weixin-pay-cn.jpg"
                      alt="微信支付"
                      label="微信扫一扫"
                      labelColor="text-emerald-600 dark:text-emerald-400"
                      icon={<WeChatIcon className="w-3.5 h-3.5" />}
                    />
                    <QrCard
                      src="/media/shijianus/support/alipay-cn.jpg"
                      alt="支付宝"
                      label="支付宝扫一扫"
                      labelColor="text-blue-600 dark:text-blue-400"
                      icon={<AlipayIcon className="w-3.5 h-3.5" />}
                    />
                  </div>
                  <StripeButton />
                  <div className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                    手机端可长按或截图保存二维码扫码支持 ☕️
                  </div>
                </div>
              )}

              {/* HK: WeChat HK + Alipay HK + PayPal */}
              {region === 'HK' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <QrCard
                      src="/media/shijianus/support/wechat-pay-hk.jpg"
                      alt="WeChat Pay HK"
                      label="WeChat HK"
                      labelColor="text-emerald-600 dark:text-emerald-400"
                      icon={<WeChatIcon className="w-3 h-3" />}
                    />
                    <QrCard
                      src="/media/shijianus/support/alipay-hk.jpg"
                      alt="Alipay HK"
                      label="Alipay HK"
                      labelColor="text-blue-600 dark:text-blue-400"
                      icon={<AlipayIcon className="w-3 h-3" />}
                    />
                    <QrCard
                      src="/media/shijianus/support/paypal-hk.jpg"
                      alt="PayPal HK"
                      label="PayPal HK"
                      labelColor="text-[#0079C1] dark:text-[#38bdf8]"
                      icon={<PayPalIcon className="w-3 h-3" />}
                      subLabel="点击跳转 ↗"
                      onClick={() => handlePayPalClick(paypalMeUrl, 'HK')}
                    />
                  </div>
                  <StripeButton />
                </div>
              )}

              {/* GB: PayPal UK + USDT + Stripe */}
              {region === 'GB' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <QrCard
                      src="/media/shijianus/support/paypal-uk.jpg"
                      alt="PayPal UK"
                      label="PayPal UK"
                      labelColor="text-[#0079C1] dark:text-[#38bdf8]"
                      icon={<PayPalIcon className="w-4 h-4" />}
                      subLabel="点击跳转 ↗"
                      onClick={() => handlePayPalClick(paypalUkMeUrl || paypalMeUrl, 'UK')}
                    />
                    <div
                      onClick={handleUsdtClick}
                      className="group flex flex-col items-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/80 dark:border-white/8 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                      title="点击复制 USDT 钱包地址"
                    >
                      <div className="w-[110px] h-[110px] bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
                        <img
                          src="/media/shijianus/support/0x00d52edc5230dD21F521D8396c68b84D576e6041_Arbitrum.jpg"
                          alt="USDT Arbitrum"
                          className="w-full h-full object-contain select-none group-hover:scale-[1.04] transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs font-bold text-[#26A17B] dark:text-emerald-400">
                          <UsdtIcon className="w-3.5 h-3.5" />
                          <span>USDT Arbitrum</span>
                          {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-60" />}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">点击复制地址</div>
                      </div>
                    </div>
                  </div>
                  <StripeButton />
                </div>
              )}

              {/* GLOBAL: PayPal + USDT + Stripe */}
              {region === 'GLOBAL' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <QrCard
                      src="/media/shijianus/support/paypal-hk.jpg"
                      alt="PayPal Global"
                      label="PayPal"
                      labelColor="text-[#0079C1] dark:text-[#38bdf8]"
                      icon={<PayPalIcon className="w-4 h-4" />}
                      subLabel="点击跳转 ↗"
                      onClick={() => handlePayPalClick(paypalMeUrl, 'Global')}
                    />
                    <div
                      onClick={handleUsdtClick}
                      className="group flex flex-col items-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/80 dark:border-white/8 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                      title="点击复制 USDT 钱包地址"
                    >
                      <div className="w-[110px] h-[110px] bg-white p-2 rounded-xl flex items-center justify-center overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
                        <img
                          src="/media/shijianus/support/0x00d52edc5230dD21F521D8396c68b84D576e6041_Arbitrum.jpg"
                          alt="USDT Arbitrum"
                          className="w-full h-full object-contain select-none group-hover:scale-[1.04] transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs font-bold text-[#26A17B] dark:text-emerald-400">
                          <UsdtIcon className="w-3.5 h-3.5" />
                          <span>USDT Arbitrum</span>
                          {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-60" />}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">点击复制地址</div>
                      </div>
                    </div>
                  </div>
                  <StripeButton />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/8 bg-slate-50/60 dark:bg-[#0f1117]/60">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>{isManualOverride ? `已选 ${currentRegionMeta.label}` : currentRegionMeta.label}</span>
              </div>
              <a
                href="/status/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors font-medium cursor-pointer"
              >
                <span>赞赏记录</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none ${
          toastType === 'success'
            ? 'bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900'
            : 'bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900'
        }`}>
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default PostRewardExtension;
