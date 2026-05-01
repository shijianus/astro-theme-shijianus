import {
  countryLabel,
  countryToRewardRegion,
  getPrimaryLanguage,
  normalizeLanguageTag,
  normalizeTimeZone,
  readClientIp,
  readCountryHeader,
  type RuntimeClientHints,
} from '../_lib/client';
import { optionsResponse, jsonResponse, safeReadJson } from '../_lib/http';
import { lookupIpInfo } from '../_lib/provider-ipinfo';
import { enforceRateLimit, envLimit } from '../_lib/rate-limit';
import type { AppEnv } from '../_lib/types';

type RewardRegion = 'cn' | 'hk' | 'uk' | 'unsupported';
type Confidence = 'low' | 'medium' | 'high';
type RiskLevel = 'low' | 'medium' | 'high';

type RegionSignal = {
  region: RewardRegion;
  ipScore: number;
  hintScore: number;
  totalScore: number;
};

const REGION_RULES: Array<{
  region: Exclude<RewardRegion, 'unsupported'>;
  countryCodes: string[];
  timezones: string[];
  languages: string[];
}> = [
  {
    region: 'cn',
    countryCodes: ['CN'],
    timezones: ['Asia/Shanghai'],
    languages: ['zh-cn', 'zh-hans', 'zh-sg'],
  },
  {
    region: 'hk',
    countryCodes: ['HK'],
    timezones: ['Asia/Hong_Kong'],
    languages: ['zh-hk', 'zh-hant-hk', 'en-hk'],
  },
  {
    region: 'uk',
    countryCodes: ['GB', 'UK'],
    timezones: ['Europe/London'],
    languages: ['en-gb'],
  },
];

function scoreRegions(ipCountry: string, headerCountry: string, hints: RuntimeClientHints) {
  const timezone = normalizeTimeZone(hints.timezone || '');
  const language = normalizeLanguageTag(hints.language || '');
  const locale = normalizeLanguageTag(hints.locale || '');
  const primaryLanguage = getPrimaryLanguage(hints);
  const languages = (hints.languages || []).map(normalizeLanguageTag);

  const scores = REGION_RULES.map<RegionSignal>((rule) => {
    let ipScore = 0;
    let hintScore = 0;

    if (rule.countryCodes.includes(ipCountry)) ipScore += 4;
    if (headerCountry && headerCountry !== ipCountry && rule.countryCodes.includes(headerCountry)) {
      ipScore += 2;
    }

    if (rule.timezones.includes(timezone)) hintScore += 3;
    if (rule.languages.includes(language)) hintScore += 2;
    if (rule.languages.includes(locale)) hintScore += 1;
    if (rule.languages.includes(primaryLanguage)) hintScore += 1;
    if (languages.some((item) => rule.languages.includes(item))) hintScore += 1;

    return {
      region: rule.region,
      ipScore,
      hintScore,
      totalScore: ipScore + hintScore,
    };
  }).sort((left, right) => right.totalScore - left.totalScore);

  return {
    scores,
    hintLeader: [...scores].sort((left, right) => right.hintScore - left.hintScore)[0],
    ipLeader: [...scores].sort((left, right) => right.ipScore - left.ipScore)[0],
    primaryLanguage,
  };
}

function resolveRewardRegion(topScore: RegionSignal, runnerUp?: RegionSignal): RewardRegion {
  if (!topScore || topScore.totalScore < 3) return 'unsupported';
  if ((runnerUp?.totalScore || 0) >= topScore.totalScore && topScore.totalScore < 5) return 'unsupported';
  return topScore.region;
}

function deriveConfidence(topScore: RegionSignal, runnerUp?: RegionSignal): Confidence {
  const scoreGap = topScore.totalScore - (runnerUp?.totalScore || 0);
  if (topScore.totalScore >= 6 && scoreGap >= 2 && topScore.ipScore >= 2) return 'high';
  if (topScore.totalScore >= 4) return 'medium';
  return 'low';
}

function buildMismatchReasons(
  rewardRegion: RewardRegion,
  ipCountry: string,
  headerCountry: string,
  hintLeader: RegionSignal,
  confidence: Confidence,
  hints: RuntimeClientHints,
) {
  const reasons: string[] = [];
  const hintedRegion = hintLeader.hintScore >= 3 ? hintLeader.region : 'unsupported';
  const ipRegion = countryToRewardRegion(ipCountry);
  const headerRegion = countryToRewardRegion(headerCountry);

  if (ipCountry && headerCountry && ipCountry !== headerCountry) {
    reasons.push('IP 数据源与 Cloudflare 国家头部不一致');
  }

  if (hintedRegion !== 'unsupported' && ipRegion !== 'unsupported' && hintedRegion !== ipRegion) {
    reasons.push('设备时区或语言画像与当前出口国家不一致');
  }

  if (hintedRegion !== 'unsupported' && rewardRegion !== 'unsupported' && hintedRegion !== rewardRegion) {
    reasons.push('浏览器画像与当前推荐地区存在偏差');
  }

  if (!ipCountry && confidence === 'low') {
    reasons.push('IP 地理信息不可用，当前仅按浏览器画像估计');
  }

  if (rewardRegion === 'uk' && normalizeTimeZone(hints.timezone || '') === 'Asia/Shanghai') {
    reasons.push('中国大陆时区环境下不开放加密钱包展示');
  }

  return reasons;
}

function deriveRiskLevel(confidence: Confidence, mismatchReasons: string[], hintLeader: RegionSignal) {
  if (mismatchReasons.length >= 2) return 'high';
  if (mismatchReasons.length === 1) return 'medium';
  if (confidence === 'low' || hintLeader.hintScore === 0) return 'medium';
  return 'low';
}

function recommendationForRegion(region: RewardRegion, cryptoAllowed: boolean) {
  if (region === 'cn') {
    return {
      primaryChannelId: 'alipay-cn',
      secondaryChannelIds: ['weixin-pay-cn'],
      collapsedChannelIds: ['paypal-cn'],
    };
  }

  if (region === 'hk') {
    return {
      primaryChannelId: 'alipay-hk',
      secondaryChannelIds: ['wechat-pay-hk'],
      collapsedChannelIds: ['paypal-hk'],
    };
  }

  if (region === 'uk') {
    return {
      primaryChannelId: 'paypal-hk-uk',
      secondaryChannelIds: cryptoAllowed ? ['trustwallet-usdt'] : ['paypal-uk'],
      collapsedChannelIds: cryptoAllowed ? ['paypal-uk'] : ['trustwallet-usdt'],
    };
  }

  return {
    primaryChannelId: '',
    secondaryChannelIds: [],
    collapsedChannelIds: [],
  };
}

export async function onRequest(context: { request: Request; env: AppEnv }) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return optionsResponse(request, env);
  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const limit = envLimit(env, 'REWARD_GEO_PER_MINUTE', 20);
  const rate = await enforceRateLimit({
    namespace: 'geo-risk',
    request,
    env,
    limit,
    windowSeconds: 60,
  });

  if (!rate.allowed) {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        error: 'Too many geo lookups, please retry later.',
        resetAt: rate.resetAt,
      },
      { status: 429 },
    );
  }

  const hints = (await safeReadJson<RuntimeClientHints>(request)) || {};
  const ip = readClientIp(request);
  const headerCountry = readCountryHeader(request);
  const ipInfo = await lookupIpInfo(env, request, ip);
  const { scores, hintLeader, primaryLanguage } = scoreRegions(ipInfo.countryCode, headerCountry, hints);
  const [topScore, runnerUp] = scores;
  const rewardRegion = resolveRewardRegion(topScore, runnerUp);
  const confidence = deriveConfidence(topScore, runnerUp);
  const mismatchReasons = buildMismatchReasons(
    rewardRegion,
    ipInfo.countryCode,
    headerCountry,
    hintLeader,
    confidence,
    hints,
  );
  const riskLevel = deriveRiskLevel(confidence, mismatchReasons, hintLeader);
  const mainlandSignal = hintLeader.region === 'cn' && hintLeader.hintScore >= 3;
  const hongKongSignal = hintLeader.region === 'hk' && hintLeader.hintScore >= 3;

  const cryptoAllowed =
    rewardRegion === 'uk'
    && confidence === 'high'
    && riskLevel === 'low'
    && topScore.region === 'uk'
    && (ipInfo.countryCode === 'GB' || headerCountry === 'GB')
    && !mainlandSignal
    && !hongKongSignal;

  const recommendation = recommendationForRegion(rewardRegion, cryptoAllowed);

  return jsonResponse(request, env, {
    ok: true,
    rewardRegion,
    regionLabel:
      rewardRegion === 'cn'
        ? '中国大陆'
        : rewardRegion === 'hk'
          ? '中国香港'
          : rewardRegion === 'uk'
            ? '英国'
            : '暂不支援',
    confidence,
    riskLevel,
    recommendation,
    signals: {
      hintRegion: hintLeader.hintScore >= 3 ? hintLeader.region : 'unsupported',
      ipRegion: countryToRewardRegion(ipInfo.countryCode),
      headerRegion: countryToRewardRegion(headerCountry),
      topScore: topScore.totalScore,
      runnerUpScore: runnerUp?.totalScore || 0,
    },
    ip: {
      countryCode: ipInfo.countryCode,
      countryLabel: countryLabel(ipInfo.countryCode),
      headerCountryCode: headerCountry,
      headerCountryLabel: countryLabel(headerCountry),
      source: ipInfo.source,
      asn: ipInfo.asn,
      asName: ipInfo.asName,
      asDomain: ipInfo.asDomain,
    },
    profile: {
      timezone: hints.timezone || '',
      timezoneOffsetMinutes: hints.timezoneOffsetMinutes ?? null,
      language: hints.language || '',
      primaryLanguage,
      languages: hints.languages || [],
      locale: hints.locale || '',
      platform: hints.platform || '',
      webrtcSupported: Boolean(hints.webrtcSupported),
      mismatchReasons,
    },
    crypto: {
      allowed: cryptoAllowed,
      address: cryptoAllowed ? (env.SUPPORT_USDT_ADDRESS || '') : '',
      network: env.SUPPORT_USDT_NETWORK || 'USDT / TRC20',
      blockedReason: cryptoAllowed
        ? ''
        : mainlandSignal
          ? '检测到中国大陆设备画像，已关闭 USDT 钱包展示。'
          : hongKongSignal
            ? '检测到中国香港设备画像，当前默认不展示 USDT 钱包。'
            : riskLevel === 'high'
              ? '检测到出口国家与设备画像冲突，已关闭加密钱包展示。'
              : '当前地区未开放加密钱包展示。',
    },
  });
}
