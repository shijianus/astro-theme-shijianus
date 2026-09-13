import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Coffee,
  CreditCard,
  Heart,
  Check,
  Copy,
  ExternalLink,
  Search,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Globe,
  Coins,
  ArrowRight,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Award,
  Lock,
} from 'lucide-react';
import {
  supportConfig,
  type CoffeeTier,
  type CurrencyOption,
  type SponsorItem,
} from '../../config/support';

/* ── SVG Brand Icons ── */
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

export const SupportDashboard: React.FC = () => {
  // ── Currency State: Only 2 IP-Adaptive Choices (Local Currency & USD) ──
  const [detectedCountry, setDetectedCountry] = useState<string>('CN');
  const [currency, setCurrency] = useState<string>('CNY');
  const [selectedTierId, setSelectedTierId] = useState<string>('americano');
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');

  // ── Supporter Info (Serv00-styled inputs filled directly on page) ──
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');

  // ── Payment QR Tab ──
  const [qrTab, setQrTab] = useState<'cn' | 'hk' | 'paypal' | 'crypto'>('cn');
  const [modalImage, setModalImage] = useState<{ src: string; title: string } | null>(null);

  // ── Copied Toast Indicator ──
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ── FAQ Accordion ──
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // ── Supporter Roster State & Dynamic Transition ──
  const [sponsors, setSponsors] = useState<SponsorItem[]>(supportConfig.seedSponsors);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tablePage, setTablePage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [showJumpPopover, setShowJumpPopover] = useState<boolean>(false);
  const pageSize = 5; // 5 items per page for clean table rhythm

  // Detect country on mount and determine the 2 supported currency options
  useEffect(() => {
    try {
      fetch('/api/geo-profile')
        .then((res) => res.json())
        .then((data: any) => {
          const c = (data?.country || '').toUpperCase();
          if (c) setDetectedCountry(c);
          if (c === 'CN') setCurrency('CNY');
          else if (c === 'HK' || c === 'MO') setCurrency('HKD');
          else if (c === 'TW') setCurrency('TWD');
          else if (c === 'US') setCurrency('USD');
          else if (c === 'GB') setCurrency('GBP');
          else if (['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE', 'FI', 'IE', 'PT'].includes(c)) setCurrency('EUR');
          else if (c === 'JP') setCurrency('JPY');
          else if (c === 'SG') setCurrency('SGD');
          else if (c === 'CA') setCurrency('CAD');
          else if (c === 'AUD') setCurrency('AUD');
          else setCurrency('USD');
        })
        .catch(() => {});
    } catch {}

    // Fetch live sponsorships from D1 database
    try {
      fetch('/api/sponsorships?limit=50')
        .then((res) => res.json())
        .then((data: any) => {
          if (data?.ok && Array.isArray(data.list) && data.list.length > 0) {
            const apiItems: SponsorItem[] = data.list.map((item: any) => ({
              id: item.id,
              name: item.name || '匿名支持者',
              amount: item.amount,
              currency: item.currency,
              message: item.message,
              channel: item.channel || 'Stripe',
              date: item.createdAt ? item.createdAt.split('T')[0] : '近期',
            }));

            if (apiItems.length >= 8) {
              // Transition entirely to real authentic records once enough exist
              setSponsors(apiItems);
            } else {
              // Graceful blend: authentic records first, followed by remaining seed sponsors
              setSponsors((prev) => {
                const existingIds = new Set(apiItems.map((i) => i.id));
                const remainingSeed = prev.filter((s) => !existingIds.has(s.id));
                return [...apiItems, ...remainingSeed];
              });
            }
          }
        })
        .catch(() => {});
    } catch {}
  }, []);

  // Compute the 2 allowed currency choices based on detected location
  const [localCurrencyOption, globalCurrencyOption] = useMemo(() => {
    const c = detectedCountry.toUpperCase();
    let localCode = 'CNY';

    if (c === 'CN') localCode = 'CNY';
    else if (c === 'HK' || c === 'MO') localCode = 'HKD';
    else if (c === 'TW') localCode = 'TWD';
    else if (c === 'US') localCode = 'USD';
    else if (c === 'GB') localCode = 'GBP';
    else if (['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE', 'FI', 'IE', 'PT'].includes(c)) localCode = 'EUR';
    else if (c === 'JP') localCode = 'JPY';
    else if (c === 'SG') localCode = 'SGD';
    else if (c === 'CA') localCode = 'CAD';
    else if (c === 'AU') localCode = 'AUD';
    else localCode = 'USD';

    const localOpt = supportConfig.currencies.find((cur) => cur.code === localCode) || supportConfig.currencies[0];
    // If local is USD, secondary is HKD; otherwise secondary is always USD
    const globalCode = localOpt.code === 'USD' ? 'HKD' : 'USD';
    const globalOpt = supportConfig.currencies.find((cur) => cur.code === globalCode) || supportConfig.currencies[1];

    return [localOpt, globalOpt];
  }, [detectedCountry]);

  // Current active currency configuration
  const currentCurrency = useMemo(() => {
    return (
      supportConfig.currencies.find((c) => c.code === currency) ||
      localCurrencyOption
    );
  }, [currency, localCurrencyOption]);

  // Amount computation
  const currentAmount = useMemo(() => {
    if (isCustomAmount) {
      const val = parseFloat(customAmountStr);
      return isNaN(val) ? 0 : val;
    }
    const tier = supportConfig.coffeeTiers.find((t) => t.id === selectedTierId);
    return tier?.amounts[currency] ?? 22;
  }, [isCustomAmount, customAmountStr, selectedTierId, currency]);

  // Amount validity (strictly 1 HKD eq. to 1000 HKD eq.)
  const isAmountValid = useMemo(() => {
    if (isCustomAmount) {
      return currentAmount >= currentCurrency.min && currentAmount <= currentCurrency.max;
    }
    return currentAmount > 0;
  }, [isCustomAmount, currentAmount, currentCurrency]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Trigger Stripe direct checkout modal
  const handleTriggerStripe = () => {
    if (!isAmountValid) return;

    window.dispatchEvent(
      new CustomEvent('open-stripe-modal', {
        detail: {
          directCheckout: true,
          amount: currentAmount,
          currency: currency.toLowerCase(),
          name: donorName.trim(),
          message: donorMessage.trim(),
        },
      }),
    );
  };

  // Filtered sponsors for table
  const filteredSponsors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sponsors;
    return sponsors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.message && s.message.toLowerCase().includes(q)) ||
        s.channel.toLowerCase().includes(q),
    );
  }, [sponsors, searchQuery]);

  const totalPages = Math.ceil(filteredSponsors.length / pageSize) || 1;
  const paginatedSponsors = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return filteredSponsors.slice(start, start + pageSize);
  }, [filteredSponsors, tablePage]);

  // Preset quick increments for custom amount based on currency
  const quickIncrements = useMemo(() => {
    if (currency === 'CNY') return [10, 20, 50, 100];
    if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') return [5, 10, 20, 50];
    if (currency === 'HKD') return [20, 50, 100, 200];
    if (currency === 'JPY') return [500, 1000, 2000, 5000];
    if (currency === 'TWD') return [100, 200, 500, 1000];
    return [10, 25, 50, 100];
  }, [currency]);

  // Advanced Pagination Window Generator: 1, 2, ... [jump], k-1, k, k+1, ..., totalPages-1, totalPages
  const paginationItems = useMemo(() => {
    const items: Array<{ type: 'page' | 'ellipsis'; page?: number; key: string }> = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push({ type: 'page', page: i, key: `p-${i}` });
      }
      return items;
    }

    // Always include page 1 and 2
    items.push({ type: 'page', page: 1, key: 'p-1' });
    items.push({ type: 'page', page: 2, key: 'p-2' });

    // Left ellipsis
    if (tablePage > 4) {
      items.push({ type: 'ellipsis', key: 'ellipsis-left' });
    }

    // Middle window around current page
    const start = Math.max(3, tablePage - 1);
    const end = Math.min(totalPages - 2, tablePage + 1);
    for (let i = start; i <= end; i++) {
      if (i > 2 && i < totalPages - 1) {
        items.push({ type: 'page', page: i, key: `p-${i}` });
      }
    }

    // Right ellipsis
    if (tablePage < totalPages - 3) {
      items.push({ type: 'ellipsis', key: 'ellipsis-right' });
    }

    // Always include totalPages - 1 and totalPages
    items.push({ type: 'page', page: totalPages - 1, key: `p-${totalPages - 1}` });
    items.push({ type: 'page', page: totalPages, key: `p-${totalPages}` });

    return items;
  }, [totalPages, tablePage]);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setTablePage(p);
      setShowJumpPopover(false);
      setJumpPageInput('');
    }
  };

  return (
    <div className="support-dashboard w-full max-w-[1240px] mx-auto px-3 sm:px-6 py-6 md:py-10 space-y-10 md:space-y-14 text-slate-800 dark:text-slate-100">
      {/* ── 1. Hero Header ────────────────────────────────────────────── */}
      <section className="support-hero relative overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 text-center bg-gradient-to-b from-blue-50/70 via-white to-slate-50/50 dark:from-[#151a2e]/80 dark:via-[#0e121f] dark:to-[#0a0d17] border border-blue-100/80 dark:border-white/[0.08] shadow-sm">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100/80 dark:bg-blue-500/20 text-[#425aef] dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/30 mb-4 animate-in fade-in">
          <Coffee className="w-4 h-4 text-[#425aef]" />
          <span>{supportConfig.subtitle}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
          {supportConfig.title}
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {supportConfig.description}
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-3xl mx-auto">
          {supportConfig.trustPills.map((pill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs rounded-lg bg-white/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 shadow-2xs backdrop-blur-xs font-medium"
            >
              {pill}
            </span>
          ))}
        </div>
      </section>

      {/* ── 2. Main Donation Section: Top & Bottom Strictly Equal Height ───── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
        {/* Left Column: Stripe Checkout Amount & Serv00-styled Supporter Inputs (7 Cols) */}
        <div className="lg:col-span-7 h-full flex flex-col justify-between bg-white dark:bg-[#121520] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-6">
          <div className="space-y-6">
            {/* Header & 2-Currency Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#425aef] dark:text-blue-400">
                  Stripe 国际收银台
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  自选金额与寄语
                </h2>
              </div>

              {/* 2-Currency IP-Adaptive Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCurrency(localCurrencyOption.code)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    currency === localCurrencyOption.code
                      ? 'bg-white dark:bg-[#1e2233] text-[#425aef] dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`根据访问地区自适应 (${localCurrencyOption.name})`}
                >
                  <span aria-hidden="true">{localCurrencyOption.flag}</span>
                  <span>
                    {localCurrencyOption.code} ({localCurrencyOption.symbol})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency(globalCurrencyOption.code)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    currency === globalCurrencyOption.code
                      ? 'bg-white dark:bg-[#1e2233] text-[#425aef] dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="全球通用结算币种"
                >
                  <span aria-hidden="true">{globalCurrencyOption.flag}</span>
                  <span>
                    {globalCurrencyOption.code} ({globalCurrencyOption.symbol})
                  </span>
                </button>
              </div>
            </div>

            {/* Coffee Tiers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  1. 选择咖啡档位（真实购买力换算）
                </label>
                <span className="text-[11px] text-slate-400">
                  当前币种限额: {currentCurrency.symbol}{currentCurrency.min} ~ {currentCurrency.symbol}{currentCurrency.max}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {supportConfig.coffeeTiers.map((tier) => {
                  const amount = tier.amounts[currency] ?? 22;
                  const isSelected = !isCustomAmount && selectedTierId === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        setSelectedTierId(tier.id);
                        setIsCustomAmount(false);
                      }}
                      className={`relative p-3.5 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-900/20 border-[#425aef] ring-2 ring-[#425aef]/30 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.07] hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-white dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl" aria-hidden="true">{tier.icon}</span>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {tier.name}
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                              {tier.badge}
                            </span>
                          </div>
                        </div>
                        <div className="text-base font-extrabold text-[#425aef] dark:text-blue-400">
                          {currentCurrency.symbol}
                          {amount}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">
                        {tier.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Upgraded Tactile Custom Amount Button & Interactive Input */}
              <div className="pt-1">
                {!isCustomAmount ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomAmount(true)}
                    className="w-full group p-3.5 sm:p-4 rounded-2xl text-left bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-white/[0.02] dark:to-blue-950/20 border border-dashed border-slate-300 dark:border-white/15 hover:border-[#425aef] dark:hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center justify-between shadow-2xs hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 text-[#425aef] dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#425aef] dark:group-hover:text-blue-400 transition-colors">
                          自定义任意赞赏金额
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          自由输入心意金额（支援 1 HKD 等值至 1000 HKD 等值）
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#425aef] dark:text-blue-400 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a1e2d] border border-blue-200/60 dark:border-blue-500/30 group-hover:bg-[#425aef] group-hover:text-white transition-all shrink-0">
                      点此输入 ➔
                    </span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-900/15 border border-[#425aef] ring-2 ring-[#425aef]/25 space-y-3 animate-in fade-in duration-200 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#425aef]" />
                        <span>自定义赞赏金额 ({currentCurrency.name})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomAmount(false)}
                        className="text-xs text-[#425aef] dark:text-blue-400 hover:underline cursor-pointer font-semibold"
                      >
                        返回预设档位
                      </button>
                    </div>

                    {/* Quick increment chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-medium mr-1">快捷预设:</span>
                      {quickIncrements.map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => setCustomAmountStr(String(inc))}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-[#1a1e2d] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#425aef] hover:text-[#425aef] cursor-pointer transition-colors shadow-2xs"
                        >
                          +{currentCurrency.symbol}{inc}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-sm">
                        {currentCurrency.symbol}
                      </span>
                      <input
                        type="number"
                        min={currentCurrency.min}
                        max={currentCurrency.max}
                        step="any"
                        placeholder={`请输入金额 (${currentCurrency.min} ~ ${currentCurrency.max})`}
                        value={customAmountStr}
                        onChange={(e) => setCustomAmountStr(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm font-bold rounded-xl bg-white dark:bg-[#1a1e2d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40"
                      />
                    </div>

                    {!isAmountValid && customAmountStr && (
                      <p className="text-xs text-red-500 font-medium">
                        ⚠️ 金额需在 {currentCurrency.symbol}{currentCurrency.min} ~ {currentCurrency.symbol}{currentCurrency.max} 之间（约 1 HKD ~ 1000 HKD 等值）
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Serv00-styled Supporter Name & Message Inputs */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                2. 支持者信息登记（参考 Serv00 布局规范）
              </label>
              <div className="space-y-3">
                {/* Field 1: Name or Social */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    👤 称呼或社交账号 (Name or your social) (可选)
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    placeholder="例如：@github_username 或 Shijian Friend"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40 transition-all"
                  />
                </div>

                {/* Field 2: Message */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    💬 留言寄语 (Say something nice) (可选)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={120}
                    placeholder="写下想对作者说的话或鼓励..."
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40 resize-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Area: Checkout Button & Clear Guarantees */}
          <div className="pt-4 space-y-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              disabled={!isAmountValid}
              onClick={handleTriggerStripe}
              className="w-full group relative overflow-hidden py-3.5 px-6 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all duration-200 bg-[linear-gradient(115deg,#3B82F6_0%,#425AEF_50%,#7C3AED_100%)] hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CreditCard className="w-5 h-5 text-white/90" />
              <span>
                前往 Stripe 安全收银台支付 — {currentCurrency.symbol}
                {currentAmount > 0 ? currentAmount : currentCurrency.min} {currentCurrency.code}
              </span>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Crucial Notice Under Button explicitly informing user about Telegram Webhook & Security */}
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-center space-y-1">
              <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1">
                <span>🔔</span>
                <span>支持信息将在完成付款后自动推送到作者 Telegram 频道并安全保存</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Stripe 端到端安全加密
                </span>
                <span>•</span>
                <span>支持 Apple Pay / Google Pay / 信用卡 / Link</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">未完成付款绝不触发任何推送</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: QR Codes Overview & Web3 Channels (5 Cols) */}
        <div className="lg:col-span-5 h-full flex flex-col justify-between bg-white dark:bg-[#121520] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-5">
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                扫码支付一览
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                微信 / 支付宝 / PayPal / Web3
              </h2>
            </div>

            {/* Sub-channel Tabs */}
            <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setQrTab('cn')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrTab === 'cn'
                    ? 'bg-white dark:bg-[#1e2233] text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span aria-hidden="true">🇨🇳</span>
                <span>国内扫码</span>
              </button>
              <button
                type="button"
                onClick={() => setQrTab('hk')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrTab === 'hk'
                    ? 'bg-white dark:bg-[#1e2233] text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span aria-hidden="true">🇭🇰</span>
                <span>港澳渠道</span>
              </button>
              <button
                type="button"
                onClick={() => setQrTab('paypal')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrTab === 'paypal'
                    ? 'bg-white dark:bg-[#1e2233] text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PayPalIcon className="w-3.5 h-3.5" />
                <span>PayPal</span>
              </button>
              <button
                type="button"
                onClick={() => setQrTab('crypto')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrTab === 'crypto'
                    ? 'bg-white dark:bg-[#1e2233] text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-emerald-500" />
                <span>USDT</span>
              </button>
            </div>

            {/* Tab 1: CN QR Codes (WeChat & Alipay) */}
            {qrTab === 'cn' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3.5">
                  {/* WeChat Pay */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-500/20 text-center space-y-2 group">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <WeChatIcon className="w-4 h-4" />
                      <span>微信支付</span>
                    </div>
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden bg-white p-1.5 shadow-2xs cursor-pointer"
                      onClick={() =>
                        setModalImage({
                          src: '/media/shijianus/support/weixin-pay-cn.jpg',
                          title: '微信支付赞赏码',
                        })
                      }
                    >
                      <img
                        src="/media/shijianus/support/weixin-pay-cn.jpg"
                        alt="微信支付赞赏码"
                        className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>查看大图</span>
                      </div>
                    </div>
                    <span className="block text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                      微信扫一扫
                    </span>
                  </div>

                  {/* Alipay */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-500/20 text-center space-y-2 group">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                      <AlipayIcon className="w-4 h-4" />
                      <span>支付宝</span>
                    </div>
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden bg-white p-1.5 shadow-2xs cursor-pointer"
                      onClick={() =>
                        setModalImage({
                          src: '/media/shijianus/support/alipay-cn.jpg',
                          title: '支付宝赞赏码',
                        })
                      }
                    >
                      <img
                        src="/media/shijianus/support/alipay-cn.jpg"
                        alt="支付宝赞赏码"
                        className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>查看大图</span>
                      </div>
                    </div>
                    <span className="block text-[11px] text-blue-600/80 dark:text-blue-400/80 font-medium">
                      支付宝扫一扫
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  💡 <strong>扫码提示</strong>：转账时可在附言中写下您的称呼与寄语，博主核对账单后将手动同步至下方公开致谢名册！
                </div>
              </div>
            )}

            {/* Tab 2: HK QR Codes */}
            {qrTab === 'hk' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-500/20 text-center space-y-2 group">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      <AlipayIcon className="w-4 h-4" />
                      <span>Alipay HK</span>
                    </div>
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden bg-white p-1.5 shadow-2xs cursor-pointer"
                      onClick={() =>
                        setModalImage({
                          src: '/media/shijianus/support/alipay-hk.jpg',
                          title: 'Alipay HK 赞赏码',
                        })
                      }
                    >
                      <img
                        src="/media/shijianus/support/alipay-hk.jpg"
                        alt="Alipay HK 赞赏码"
                        className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>查看大图</span>
                      </div>
                    </div>
                    <span className="block text-[11px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">
                      港币 HKD 扫码
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-500/20 text-center space-y-2 group">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <WeChatIcon className="w-4 h-4" />
                      <span>WeChat Pay HK</span>
                    </div>
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden bg-white p-1.5 shadow-2xs cursor-pointer"
                      onClick={() =>
                        setModalImage({
                          src: '/media/shijianus/support/wechat-pay-hk.jpg',
                          title: 'WeChat Pay HK 赞赏码',
                        })
                      }
                    >
                      <img
                        src="/media/shijianus/support/wechat-pay-hk.jpg"
                        alt="WeChat Pay HK 赞赏码"
                        className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>查看大图</span>
                      </div>
                    </div>
                    <span className="block text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                      WeChat HK 扫码
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: PayPal */}
            {qrTab === 'paypal' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <a
                  href="https://www.paypal.com/paypalme/shijianus"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="w-full p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-500/30 flex items-center justify-between group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#003087] text-white flex items-center justify-center font-black">
                      <PayPalIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        paypal.me/shijianus
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        点击直接在 PayPal 网页或 App 付款
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </a>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 text-center space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">PayPal HK 码</span>
                    <img
                      src="/media/shijianus/support/paypal-hk.jpg"
                      alt="PayPal HK"
                      className="w-full aspect-square object-contain rounded-lg p-1 bg-white cursor-pointer"
                      onClick={() =>
                        setModalImage({ src: '/media/shijianus/support/paypal-hk.jpg', title: 'PayPal HK' })
                      }
                    />
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 text-center space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">PayPal UK 码</span>
                    <img
                      src="/media/shijianus/support/paypal-uk.jpg"
                      alt="PayPal UK"
                      className="w-full aspect-square object-contain rounded-lg p-1 bg-white cursor-pointer"
                      onClick={() =>
                        setModalImage({ src: '/media/shijianus/support/paypal-uk.jpg', title: 'PayPal UK' })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Web3 / USDT */}
            {qrTab === 'crypto' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UsdtIcon className="w-5 h-5" />
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          USDT (Arbitrum One)
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Layer 2 极低 Gas 费链路
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Arbitrum
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#1a1e2d] border border-slate-200/70 dark:border-white/10 space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-mono">钱包收款地址 (EVM)：</div>
                    <code className="block text-[11px] font-mono break-all text-slate-800 dark:text-slate-200 select-all">
                      0x00d52edc5230dD21F521D8396c68b84D576e6041
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('0x00d52edc5230dD21F521D8396c68b84D576e6041', 'crypto-addr')
                    }
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'crypto-addr' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>已复制到剪贴板！</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>复制 USDT Arbitrum 钱包地址</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Trust & Level Disassociation Disclaimer Box */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Award className="w-4 h-4 text-amber-600" />
                <span>社区等级与赞赏 100% 独立承诺</span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                本博客会员等级 (LV) 与信任等级 (TL) 纯粹基于技术互动与开源讨论评定，<strong>绝无付费升级特权</strong>，每一位读者均享有完全平等的权益。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Part 2: Supporter Roster (支援名录表格) ──────────────────── */}
      <section id="sponsor-records" className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#425aef] dark:text-blue-400 mb-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>公开致谢名册</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              支援名录 (Hall of Fame)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              致敬每一位慷慨赞助的读者与同行，名单自动与 D1 数据库同步收录。
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索支持者、寄语或渠道..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setTablePage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/30"
            />
          </div>
        </div>

        {/* Highlight Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              累计支持人次
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {sponsors.length} <span className="text-xs font-normal text-slate-400">位</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              喝到咖啡
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {Math.round(sponsors.length * 2.4)} <span className="text-xs font-normal text-slate-400">杯 ☕</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              汇聚币种
            </div>
            <div className="text-2xl font-black text-[#425aef] dark:text-blue-400 mt-1">
              {new Set(sponsors.map((s) => s.currency)).size} <span className="text-xs font-normal text-slate-400">种</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              最新支持
            </div>
            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
              {sponsors[0]?.name || '热心读者'}
            </div>
          </div>
        </div>

        {/* Supporter Table */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121520] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/[0.07] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    赞赏支持者
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    支持金额
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    祝福与寄语
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    支付渠道
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    日期
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {paginatedSponsors.length > 0 ? (
                  paginatedSponsors.map((sponsor) => (
                    <tr
                      key={sponsor.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#425aef] dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {sponsor.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {sponsor.name}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-50 dark:bg-blue-950/40 text-[#425aef] dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                          {sponsor.currency === 'USD'
                            ? '$'
                            : sponsor.currency === 'CNY'
                            ? '¥'
                            : sponsor.currency === 'HKD'
                            ? 'HK$'
                            : sponsor.currency === 'GBP'
                            ? '£'
                            : sponsor.currency === 'EUR'
                            ? '€'
                            : sponsor.currency === 'JPY'
                            ? '¥'
                            : sponsor.currency === 'TWD'
                            ? 'NT$'
                            : sponsor.currency === 'SGD'
                            ? 'S$'
                            : sponsor.currency === 'CAD'
                            ? 'CA$'
                            : sponsor.currency === 'AUD'
                            ? 'A$'
                            : ''}
                          {sponsor.amount} {sponsor.currency}
                        </span>
                      </td>

                      {/* Message */}
                      <td className="px-4 py-3.5 max-w-xs md:max-w-md">
                        {sponsor.message ? (
                          <span className="text-slate-700 dark:text-slate-300 text-xs italic">
                            "{sponsor.message}"
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-400 text-xs">
                            默默送上心意 ❤️
                          </span>
                        )}
                      </td>

                      {/* Channel */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                          {sponsor.channel}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs text-slate-400 dark:text-slate-400 font-mono">
                        {sponsor.date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <Coffee className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm">未搜索到相关支持者记录</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Advanced Pagination Bar: < 上一页, 1, 2, ... [跳转按钮], 10, 11, ..., 下一页 > */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
              <div>
                第 <strong className="text-slate-800 dark:text-white font-bold">{tablePage}</strong> / {totalPages} 页 (共 {filteredSponsors.length} 条记录)
              </div>

              {/* Number Buttons & Prev/Next with Icons */}
              <div className="flex items-center gap-1.5 relative">
                {/* Prev Button with Icon */}
                <button
                  type="button"
                  disabled={tablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>上一页</span>
                </button>

                {/* Number Buttons & Ellipsis Jump Button */}
                <div className="flex items-center gap-1">
                  {paginationItems.map((item) => {
                    if (item.type === 'page' && item.page !== undefined) {
                      const isCurrent = item.page === tablePage;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setTablePage(item.page!)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isCurrent
                              ? 'bg-[#425aef] text-white shadow-xs'
                              : 'border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.page}
                        </button>
                      );
                    }

                    // Ellipsis with Quick Jump Button
                    return (
                      <div key={item.key} className="relative">
                        <button
                          type="button"
                          onClick={() => setShowJumpPopover((prev) => !prev)}
                          title="点击快速跳转页面"
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#425aef] hover:text-[#425aef] text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                        >
                          ...
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Next Button with Icon */}
                <button
                  type="button"
                  disabled={tablePage >= totalPages}
                  onClick={() => setTablePage((p) => Math.min(p + 1, totalPages))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 font-medium"
                >
                  <span>下一页</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Quick Jump Input Popover */}
                {showJumpPopover && (
                  <div className="absolute right-0 bottom-full mb-2 z-20 p-3 rounded-2xl bg-white dark:bg-[#1a1e2d] border border-slate-200 dark:border-white/10 shadow-xl animate-in zoom-in-95 duration-150 w-48">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-white/10">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-white">快速跳转至页码</span>
                      <button
                        type="button"
                        onClick={() => setShowJumpPopover(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <form onSubmit={handleJumpSubmit} className="flex gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        placeholder={`1 ~ ${totalPages}`}
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#425aef]"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-lg bg-[#425aef] hover:bg-blue-600 text-white font-bold text-xs cursor-pointer"
                      >
                        跳转
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. FAQs Section: Strictly Aligned Full-Width With Above Cards ───── */}
      <section className="space-y-4 pt-4 w-full">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            FAQ & Transparency
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            常見問題與透明度承諾
          </h2>
        </div>

        {/* Full-width container aligned perfectly with top cards and table */}
        <div className="w-full space-y-3">
          {supportConfig.faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="w-full rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121520] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-[#425aef] dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#425aef]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/[0.06] pt-3 animate-in fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. Modal for Enlarging QR Codes ───────────────────────────── */}
      {modalImage && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setModalImage(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#121520] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {modalImage.title}
              </span>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-square bg-white p-3 rounded-2xl shadow-inner border border-slate-100">
              <img
                src={modalImage.src}
                alt={modalImage.title}
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              请使用相应 App 扫描上方二维码完成赞赏
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDashboard;
