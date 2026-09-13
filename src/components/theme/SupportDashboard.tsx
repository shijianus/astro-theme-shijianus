import React, { useState, useEffect, useMemo } from 'react';
import {
  Coffee,
  CreditCard,
  Heart,
  Check,
  Copy,
  ExternalLink,
  QrCode,
  Search,
  User,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Globe,
  Coins,
  ArrowRight,
  Maximize2,
  X,
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
  // Currency and Amount State
  const [currency, setCurrency] = useState<string>('CNY');
  const [selectedTierId, setSelectedTierId] = useState<string>('americano');
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  
  // Supporter Info (Filled directly on the page)
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');

  // Payment QR Tab
  const [qrTab, setQrTab] = useState<'cn' | 'hk' | 'paypal' | 'crypto'>('cn');
  const [modalImage, setModalImage] = useState<{ src: string; title: string } | null>(null);

  // Copied toast indicators
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // FAQ Accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Supporter Roster State
  const [sponsors, setSponsors] = useState<SponsorItem[]>(supportConfig.seedSponsors);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tablePage, setTablePage] = useState<number>(1);
  const pageSize = 8;

  // Auto-detect currency via geo profile or browser locale on mount
  useEffect(() => {
    try {
      fetch('/api/geo-profile')
        .then((res) => res.json())
        .then((data: any) => {
          const c = (data?.country || '').toUpperCase();
          if (c === 'CN') setCurrency('CNY');
          else if (c === 'HK' || c === 'MO') setCurrency('HKD');
          else if (c === 'US') setCurrency('USD');
          else if (c === 'GB') setCurrency('GBP');
          else if (['DE', 'FR', 'IT', 'ES', 'NL'].includes(c)) setCurrency('EUR');
          else if (c === 'JP') setCurrency('JPY');
          else setCurrency('USD');
        })
        .catch(() => {});
    } catch {}

    // Fetch real-time sponsorship records from D1 API
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
            
            // Merge with seed sponsors, avoiding duplicates by id
            setSponsors((prev) => {
              const existingIds = new Set(apiItems.map((i) => i.id));
              const remainingSeed = prev.filter((s) => !existingIds.has(s.id));
              return [...apiItems, ...remainingSeed];
            });
          }
        })
        .catch(() => {});
    } catch {}
  }, []);

  // Calculate current amount
  const currentCurrency = useMemo(() => {
    return supportConfig.currencies.find((c) => c.code === currency) || supportConfig.currencies[0];
  }, [currency]);

  const currentAmount = useMemo(() => {
    if (isCustomAmount) {
      const val = parseFloat(customAmountStr);
      return isNaN(val) ? 0 : val;
    }
    const tier = supportConfig.coffeeTiers.find((t) => t.id === selectedTierId);
    return tier?.amounts[currency] ?? 30;
  }, [isCustomAmount, customAmountStr, selectedTierId, currency]);

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

  // Trigger Stripe Checkout Modal directly
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

      {/* ── 2. Main Donation Section (Stripe Trigger & QR Overview) ───── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left Column: Stripe Checkout Amount & Supporter Info (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121520] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#425aef] dark:text-blue-400">
                Stripe 国际收银台
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                自选金额与寄语
              </h2>
            </div>

            {/* Currency Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/10 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="选择结算币种"
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer pr-1"
              >
                {supportConfig.currencies.map((c) => (
                  <option key={c.code} value={c.code} className="dark:bg-[#1a1e2d] text-slate-900 dark:text-white">
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coffee Tiers */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              1. 选择支持档位
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {supportConfig.coffeeTiers.map((tier) => {
                const amount = tier.amounts[currency] ?? 30;
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

            {/* Custom Amount Button & Input */}
            <div className="pt-1">
              {!isCustomAmount ? (
                <button
                  type="button"
                  onClick={() => setIsCustomAmount(true)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-white/[0.04] border border-dashed border-slate-300 dark:border-white/15 hover:border-[#425aef] dark:hover:border-blue-400 hover:text-[#425aef] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#425aef]" />
                  <span>自定义任意赞赏金额</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-[#425aef] ring-2 ring-[#425aef]/20 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>自定义金额 ({currentCurrency.name})</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomAmount(false)}
                      className="text-xs text-[#425aef] hover:underline cursor-pointer"
                    >
                      返回预设档位
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                      {currentCurrency.symbol}
                    </span>
                    <input
                      type="number"
                      min={currentCurrency.min}
                      max={currentCurrency.max}
                      placeholder={`输入金额 (${currentCurrency.min} ~ ${currentCurrency.max})`}
                      value={customAmountStr}
                      onChange={(e) => setCustomAmountStr(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 text-sm font-bold rounded-xl bg-white dark:bg-[#1a1e2d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40"
                    />
                  </div>
                  {!isAmountValid && customAmountStr && (
                    <p className="text-xs text-red-500 font-medium">
                      金额需在 {currentCurrency.symbol}{currentCurrency.min} ~ {currentCurrency.symbol}{currentCurrency.max} 之间
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Supporter Name & Message Inputs */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              2. 留下您的称呼与寄语（将同步收录至名录）
            </label>
            <div className="space-y-2.5">
              <input
                type="text"
                maxLength={32}
                placeholder="您的称呼或社交账号（选填，留空将显示为匿名支持者）"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40"
              />
              <textarea
                rows={2}
                maxLength={120}
                placeholder="写下想对作者说的话或祝福（选填，将同步展示于名录并推送至作者）..."
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40 resize-none"
              />
            </div>
          </div>

          {/* Stripe Trigger Button */}
          <div className="pt-2 space-y-2.5">
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

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Stripe 端到端安全加密
              </span>
              <span>支持 Apple Pay / Google Pay / 信用卡 / Link</span>
            </div>
          </div>
        </div>

        {/* Right Column: QR Codes Overview & Web3 Channels (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121520] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-5">
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
                💡 <strong>扫码提示</strong>：转账时可在附言中写下您的昵称与寄语，博主核对后将手动同步至下方支援名录中致谢！
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

              <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                支持 Trust Wallet、MetaMask、OKX 等主流 Web3 钱包直接转账。
              </div>
            </div>
          )}
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

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
              <div>
                第 {tablePage} / {totalPages} 页 (共 {filteredSponsors.length} 条记录)
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={tablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  上一页
                </button>
                <button
                  type="button"
                  disabled={tablePage >= totalPages}
                  onClick={() => setTablePage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. FAQs Section ───────────────────────────────────────────── */}
      <section className="space-y-4 pt-4">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            FAQ & Transparency
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            常见问题与透明度承诺
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {supportConfig.faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121520] overflow-hidden transition-all"
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
