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
  { key: 'GB', label: '英国', flag: '🇬🇧', desc: 'PayPal UK / Stripe / USDT Arbitrum' },
  { key: 'GLOBAL', label: '全球其它地区', flag: '🌐', desc: 'Stripe / PayPal / USDT Arbitrum' },
];

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

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const popoverHeight = popoverRef.current?.offsetHeight || 380;

    if (spaceAbove < popoverHeight + 20 || (spaceAbove < 260 && spaceBelow > spaceAbove)) {
      setPopoverPos('down');
    } else {
      setPopoverPos('up');
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

  // PayPal click: copy & open in new tab
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

  // USDT click: copy address
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

  // Open the dedicated 2-step Stripe Modal
  const handleOpenStripeModal = () => {
    setIsPinned(false);
    setIsOpen(false);
    window.dispatchEvent(
      new CustomEvent('open-stripe-modal', {
        detail: { region },
      })
    );
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

  const currentRegionMeta =
    REGION_OPTIONS.find((o) => o.key === region) || REGION_OPTIONS[0];

  const currentPaypalUrl =
    region === 'GB' ? (paypalUkMeUrl || paypalMeUrl) : paypalMeUrl;

  // Listen for global open post reward extension event
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
          style={{ display: 'flex', flexDirection: 'column' }}
          className={`reward-main is-pinned z-[100] transition-all animate-in fade-in duration-200 max-sm:fixed max-sm:inset-x-3 max-sm:top-1/2 max-sm:-translate-y-1/2 max-sm:max-h-[90vh] max-sm:w-auto max-sm:max-w-none sm:absolute ${
            region === 'HK'
              ? 'sm:w-[520px]'
              : 'sm:w-[380px]'
          } ${
            popoverPos === 'up'
              ? 'sm:bottom-[calc(100%+12px)] sm:left-0'
              : 'sm:top-[calc(100%+12px)] sm:left-0'
          }`}
          role="region"
          aria-label="赞赏支持扩展栏"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="reward-all rounded-2xl bg-white dark:bg-[#13151b] backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-2xl p-4 sm:p-5 text-slate-800 dark:text-slate-100 flex flex-col space-y-3.5 max-h-full overflow-y-auto">
            {/* 1. 卡片顶部标题与地区选择器 */}
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    赞赏支持作者
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    如果内容对你有帮助，欢迎请作者喝杯咖啡 ☕️
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

            {/* 2. 二维码直接平铺展示区域 (Direct QR Cards) */}
            {/* 2.1 中国大陆 (CN): 2张卡片 (微信 & 支付宝) */}
            {region === 'CN' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  {/* 微信支付 */}
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

                  {/* 支付宝 */}
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

            {/* 2.2 中国香港 (HK): 3张宽敞卡片 (WeChat HK, Alipay HK, PayPal HK) */}
            {region === 'HK' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* WeChat Pay HK */}
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

                  {/* Alipay HK */}
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

                  {/* PayPal HK (High-End Card with Click to Copy & Jump) */}
                  <div
                    onClick={() => handlePayPalClick(paypalMeUrl, 'HK')}
                    className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-[#181b22] border border-[#0079C1]/30 hover:border-[#0079C1] shadow-xs hover:shadow-md hover:shadow-blue-500/10 transition-all cursor-pointer"
                    title="点击扫码或跳转 PayPal HK 付款"
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

            {/* 2.3 英国 (GB): PayPal UK + USDT Arbitrum + Stripe 按钮 */}
            {region === 'GB' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* PayPal UK (High-End Card) */}
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

                  {/* USDT Arbitrum (Clickable to copy) */}
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

                {/* USDT 提示信息 */}
                <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                  <div className="flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>USDT 链路提示</span>
                  </div>
                  <p className="text-amber-700 dark:text-amber-300/90 leading-tight">
                    请使用 <strong className="underline font-bold">Arbitrum</strong> 链路，汇错链路将导致资产丢失。
                  </p>
                </div>

                {/* Stripe 收银台入口 Button */}
                <button
                  type="button"
                  onClick={handleOpenStripeModal}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>通过 Stripe 信用卡 / Apple Pay 赞赏 →</span>
                </button>
              </div>
            )}

            {/* 2.4 全球其它 (GLOBAL): PayPal Global + USDT Arbitrum + Stripe 按钮 */}
            {region === 'GLOBAL' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* PayPal Global (High-End Card) */}
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

                  {/* USDT Arbitrum (Clickable to copy) */}
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

                {/* USDT 提示信息 */}
                <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                  <div className="flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>USDT 链路提示</span>
                  </div>
                  <p className="text-amber-700 dark:text-amber-300/90 leading-tight">
                    请使用 <strong className="underline font-bold">Arbitrum</strong> 链路，汇错链路将导致资产丢失。
                  </p>
                </div>

                {/* Stripe 收银台入口 Button */}
                <button
                  type="button"
                  onClick={handleOpenStripeModal}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>通过 Stripe 信用卡 / Apple Pay 赞赏 →</span>
                </button>
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
