import React, { useState, useEffect, useMemo } from 'react';
import {
  Coffee,
  CreditCard,
  Heart,
  ExternalLink,
  Search,
  ChevronDown,
  Coins,
  ArrowRight,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
} from 'lucide-react';
import {
  supportConfig,
  type CurrencyPresetConfig,
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
  // ── 1. Currency & Amount State ──
  const [detectedCountry, setDetectedCountry] = useState<string>('CN');
  const [currency, setCurrency] = useState<string>('CNY');
  const [selectedAmount, setSelectedAmount] = useState<number>(14);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // ── 2. Serv00 Supporter Inputs ──
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');

  // ── 3. Payment QR Tabs ──
  const [qrTab, setQrTab] = useState<'cn' | 'hk' | 'paypal' | 'crypto'>('cn');
  const [modalImage, setModalImage] = useState<{ src: string; title: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ── 4. FAQ Accordion ──
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // ── 5. Supporter Roster State ──
  const [sponsors, setSponsors] = useState<SponsorItem[]>(supportConfig.seedSponsors);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tablePage, setTablePage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [showJumpPopover, setShowJumpPopover] = useState<boolean>(false);
  const pageSize = 5;

  // Auto-detect country on mount
  useEffect(() => {
    try {
      fetch('/api/geo-profile')
        .then((res) => res.json())
        .then((data: any) => {
          const c = (data?.country || '').toUpperCase();
          if (c) {
            setDetectedCountry(c);
            if (c === 'CN') {
              setCurrency('CNY');
              setSelectedAmount(supportConfig.currencies.CNY.amounts[2]);
            } else if (c === 'HK' || c === 'MO') {
              setCurrency('HKD');
              setSelectedAmount(supportConfig.currencies.HKD.amounts[2]);
            } else if (c === 'TW') {
              setCurrency('TWD');
              setSelectedAmount(supportConfig.currencies.TWD.amounts[2]);
            } else if (c === 'US') {
              setCurrency('USD');
              setSelectedAmount(supportConfig.currencies.USD.amounts[2]);
            } else if (c === 'GB') {
              setCurrency('GBP');
              setSelectedAmount(supportConfig.currencies.GBP.amounts[2]);
            } else if (['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE', 'FI', 'IE', 'PT'].includes(c)) {
              setCurrency('EUR');
              setSelectedAmount(supportConfig.currencies.EUR.amounts[2]);
            } else if (c === 'JP') {
              setCurrency('JPY');
              setSelectedAmount(supportConfig.currencies.JPY.amounts[2]);
            } else if (c === 'SG') {
              setCurrency('SGD');
              setSelectedAmount(supportConfig.currencies.SGD.amounts[2]);
            } else if (c === 'CA') {
              setCurrency('CAD');
              setSelectedAmount(supportConfig.currencies.CAD.amounts[2]);
            } else if (c === 'AU') {
              setCurrency('AUD');
              setSelectedAmount(supportConfig.currencies.AUD.amounts[2]);
            } else {
              setCurrency('USD');
              setSelectedAmount(supportConfig.currencies.USD.amounts[2]);
            }
          }
        })
        .catch(() => {});
    } catch {}

    // Fetch live sponsorships from D1
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
              setSponsors(apiItems);
            } else {
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

  // Compute the 2 allowed currency choices based on detected location (Local Currency & USD)
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

    const localOpt = supportConfig.currencies[localCode] || supportConfig.currencies['CNY'];
    const globalCode = localOpt.code.toUpperCase() === 'USD' ? 'HKD' : 'USD';
    const globalOpt = supportConfig.currencies[globalCode] || supportConfig.currencies['USD'];

    return [localOpt, globalOpt];
  }, [detectedCountry]);

  // Active currency config
  const activeCurrencyConfig: CurrencyPresetConfig = useMemo(() => {
    return supportConfig.currencies[currency] || localCurrencyOption;
  }, [currency, localCurrencyOption]);

  // Dynamic currency switching with exchange rate conversion
  const handleCurrencyChange = (newCode: string) => {
    if (newCode === currency) return;
    const oldCfg = activeCurrencyConfig;
    const newCfg = supportConfig.currencies[newCode] || supportConfig.currencies['USD'];

    if (isCustomMode && customAmount) {
      const numeric = parseFloat(customAmount);
      if (!isNaN(numeric) && numeric > 0) {
        const usdVal = numeric * oldCfg.rateToUSD;
        const converted = Math.round(usdVal / newCfg.rateToUSD);
        const bounded = Math.max(newCfg.min, Math.min(newCfg.max, converted));
        setCustomAmount(String(bounded));
      }
    } else {
      const currentIdx = oldCfg.amounts.indexOf(selectedAmount);
      const targetIdx = currentIdx !== -1 ? currentIdx : 2;
      setSelectedAmount(newCfg.amounts[targetIdx]);
    }

    setCurrency(newCode);
  };

  // Custom amount validation
  const parsedCustom = parseFloat(customAmount);
  const isCustomInvalid =
    isCustomMode &&
    (customAmount === '' ||
      isNaN(parsedCustom) ||
      parsedCustom < activeCurrencyConfig.min ||
      parsedCustom > activeCurrencyConfig.max);

  const effectiveAmount = isCustomMode
    ? isNaN(parsedCustom)
      ? 0
      : parsedCustom
    : selectedAmount;

  const isAmountValid = effectiveAmount >= activeCurrencyConfig.min && effectiveAmount <= activeCurrencyConfig.max;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Trigger Stripe Direct Checkout Modal
  const handleTriggerStripe = () => {
    if (!isAmountValid) return;

    window.dispatchEvent(
      new CustomEvent('open-stripe-modal', {
        detail: {
          directCheckout: true,
          amount: effectiveAmount,
          currency: activeCurrencyConfig.code,
          name: donorName.trim(),
          message: donorMessage.trim(),
        },
      }),
    );
  };

  // Supporter filtering & pagination
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

  // Windowed pagination items
  const paginationItems = useMemo(() => {
    const items: Array<{ type: 'page' | 'ellipsis'; page?: number; key: string }> = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push({ type: 'page', page: i, key: `p-${i}` });
      }
      return items;
    }

    items.push({ type: 'page', page: 1, key: 'p-1' });
    items.push({ type: 'page', page: 2, key: 'p-2' });

    if (tablePage > 4) {
      items.push({ type: 'ellipsis', key: 'ellipsis-left' });
    }

    const start = Math.max(3, tablePage - 1);
    const end = Math.min(totalPages - 2, tablePage + 1);
    for (let i = start; i <= end; i++) {
      if (i > 2 && i < totalPages - 1) {
        items.push({ type: 'page', page: i, key: `p-${i}` });
      }
    }

    if (tablePage < totalPages - 3) {
      items.push({ type: 'ellipsis', key: 'ellipsis-right' });
    }

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
    <div className="support-dashboard w-full max-w-[1240px] mx-auto px-3 sm:px-6 py-6 md:py-10 space-y-10 md:space-y-12 text-slate-800 dark:text-slate-100">
      {/* ── 1. Hero Header ────────────────────────────────────────────── */}
      <section className="support-hero relative overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 text-center bg-gradient-to-b from-blue-50/70 via-white to-slate-50/50 dark:from-[#151a2e]/80 dark:via-[#0e121f] dark:to-[#0a0d17] border border-blue-100/80 dark:border-white/[0.08] shadow-sm">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100/80 dark:bg-blue-500/20 text-[#425aef] dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/30 mb-4">
          <Coffee className="w-4 h-4 text-[#425aef]" />
          <span>{supportConfig.subtitle}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
          {supportConfig.title}
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {supportConfig.description}
        </p>

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

      {/* ── 2. Donation Main Section: Naturally Balanced Columns ──────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
        {/* Left Column: Stripe Checkout Amount & Serv00-styled Inputs (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121520] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Header with 2-Currency Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#425aef] dark:text-blue-400">
                  Stripe 国际收银台
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  自选金额与寄语
                </h2>
              </div>

              {/* 2-Currency Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleCurrencyChange(localCurrencyOption.code.toUpperCase())}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    currency === localCurrencyOption.code.toUpperCase()
                      ? 'bg-white dark:bg-[#1e2233] text-[#425aef] dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`本地货币 (${localCurrencyOption.name})`}
                >
                  <span aria-hidden="true">{localCurrencyOption.flag}</span>
                  <span>{localCurrencyOption.code.toUpperCase()} ({localCurrencyOption.symbol})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencyChange(globalCurrencyOption.code.toUpperCase())}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    currency === globalCurrencyOption.code.toUpperCase()
                      ? 'bg-white dark:bg-[#1e2233] text-[#425aef] dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="全球通用结算货币"
                >
                  <span aria-hidden="true">{globalCurrencyOption.flag}</span>
                  <span>{globalCurrencyOption.code.toUpperCase()} ({globalCurrencyOption.symbol})</span>
                </button>
              </div>
            </div>

            {/* 6 Preset Amounts Grid (Copied from RewardModal: grid grid-cols-3 gap-2.5) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                1. 选择支持档位
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {activeCurrencyConfig.amounts.map((amt, idx) => {
                  const isSelected = !isCustomMode && selectedAmount === amt;
                  const label = activeCurrencyConfig.labels[idx];
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setIsCustomMode(false);
                        setSelectedAmount(amt);
                      }}
                      className={`py-3 px-2 rounded-xl text-center transition-all duration-150 cursor-pointer select-none border ${
                        isSelected
                          ? 'bg-[#425aef] border-[#425aef] text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40 scale-[1.02]'
                          : 'bg-slate-50/80 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="text-sm font-black tracking-tight">
                        {activeCurrencyConfig.symbol}{amt}
                      </div>
                      <div
                        className={`text-[11px] font-medium mt-0.5 whitespace-nowrap ${
                          isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input (Copied from RewardModal: border-2 transition-all cursor-text) */}
              <div className="space-y-1 pt-1">
                <label
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all cursor-text ${
                    isCustomMode
                      ? isCustomInvalid
                        ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20'
                        : 'border-[#425aef] bg-blue-50/60 dark:bg-blue-950/25'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                    {activeCurrencyConfig.symbol}
                  </span>
                  <input
                    type="number"
                    min={activeCurrencyConfig.min}
                    max={activeCurrencyConfig.max}
                    step={activeCurrencyConfig.code === 'jpy' ? 100 : 1}
                    placeholder={`自定义金额（${activeCurrencyConfig.symbol}${activeCurrencyConfig.min} ~ ${activeCurrencyConfig.symbol}${activeCurrencyConfig.max}）`}
                    value={customAmount}
                    onFocus={() => setIsCustomMode(true)}
                    onChange={(e) => {
                      setIsCustomMode(true);
                      setCustomAmount(e.target.value);
                    }}
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
                  />
                  {isCustomMode && customAmount && (
                    <span className="text-[11px] font-bold uppercase text-[#425aef] shrink-0">
                      {activeCurrencyConfig.code.toUpperCase()}
                    </span>
                  )}
                </label>
                {isCustomMode && isCustomInvalid && (
                  <div className="text-[11px] text-red-500 dark:text-red-400 px-1 font-medium">
                    请输入 {activeCurrencyConfig.symbol}{activeCurrencyConfig.min} ~ {activeCurrencyConfig.symbol}{activeCurrencyConfig.max} 之间的金额
                  </div>
                )}
              </div>
            </div>

            {/* Serv00-styled Supporter Inputs */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                2. 支持者信息登记
              </label>
              <div className="space-y-3">
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
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40 transition-all"
                  />
                </div>

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
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40 resize-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Button & Notification Notice */}
          <div className="pt-4 space-y-2 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              disabled={!isAmountValid}
              onClick={handleTriggerStripe}
              className="w-full group relative overflow-hidden py-3.5 px-6 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all duration-200 bg-[linear-gradient(115deg,#3B82F6_0%,#425AEF_50%,#7C3AED_100%)] hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CreditCard className="w-5 h-5 text-white/90" />
              <span>
                前往 Stripe 安全收银台支付 — {activeCurrencyConfig.symbol}
                {effectiveAmount} {activeCurrencyConfig.code.toUpperCase()}
              </span>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-1 leading-relaxed">
              支持信息将在完成付款后自动推送到作者 Telegram 频道并安全保存
            </p>
          </div>
        </div>

        {/* Right Column: QR Codes Overview & Web3 Channels (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121520] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
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

            {/* Tab 1: CN QR Codes */}
            {qrTab === 'cn' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3.5">
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

          {/* Clean Tip Box: Balanced with Left Column */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            💡 <strong>扫码支持提示</strong>：转账时可在附言中备注称呼与寄语，博主定期查对账单后将手动录入至下方致谢名录。若希望保持匿名，无需填写附言。
          </div>
        </div>
      </section>

      {/* ── 3. Part 2: Supporter Roster (公开致谢名册) ────────────────── */}
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
              致谢每一位慷慨支持的读者与同行，名单定期与后台数据库同步。
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
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              累计支持人次
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {sponsors.length} <span className="text-xs font-normal text-slate-400">位</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              喝到咖啡
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {Math.round(sponsors.length * 2.4)} <span className="text-xs font-normal text-slate-400">杯 ☕</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              汇聚币种
            </div>
            <div className="text-2xl font-black text-[#425aef] dark:text-blue-400 mt-1">
              {new Set(sponsors.map((s) => s.currency)).size} <span className="text-xs font-normal text-slate-400">种</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                  <th scope="col" className="px-5 py-3.5">赞赏支持者</th>
                  <th scope="col" className="px-4 py-3.5">支持金额</th>
                  <th scope="col" className="px-4 py-3.5">祝福与寄语</th>
                  <th scope="col" className="px-4 py-3.5">支付渠道</th>
                  <th scope="col" className="px-5 py-3.5 text-right">日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {paginatedSponsors.length > 0 ? (
                  paginatedSponsors.map((sponsor) => (
                    <tr
                      key={sponsor.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
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

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                          {sponsor.channel}
                        </span>
                      </td>

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

          {/* Advanced Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
              <div>
                第 <strong className="text-slate-800 dark:text-white font-bold">{tablePage}</strong> / {totalPages} 页 (共 {filteredSponsors.length} 条记录)
              </div>

              <div className="flex items-center gap-1.5 relative">
                <button
                  type="button"
                  disabled={tablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>上一页</span>
                </button>

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

                <button
                  type="button"
                  disabled={tablePage >= totalPages}
                  onClick={() => setTablePage((p) => Math.min(p + 1, totalPages))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 font-medium"
                >
                  <span>下一页</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

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
