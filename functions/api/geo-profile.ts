import type { AppEnv } from '../_lib/types';
import { optionsResponse, jsonResponse } from '../_lib/http.ts';

export async function onRequest(context: { request: Request; env: AppEnv }): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(request.url);
  // Allow test override via query param ?country=XX or header
  const queryCountry = url.searchParams.get('country')?.trim().toUpperCase();
  const rawCountry = queryCountry || request.headers.get('cf-ipcountry') || 'GLOBAL';
  const country = rawCountry.trim().toUpperCase() || 'GLOBAL';
  const isMainland = country === 'CN';
  const rawCity = url.searchParams.get('city')?.trim() || request.headers.get('cf-ipcity') || '';
  const timezone = request.headers.get('cf-timezone') || '';

  // Determine target locale ('zh-CN' | 'zh-Hant' | 'en')
  const reqLocale = (url.searchParams.get('locale') || '').toLowerCase();
  const locale = reqLocale.includes('hant') || reqLocale.includes('tw') || reqLocale.includes('hk')
    ? 'zh-Hant'
    : reqLocale.startsWith('en')
    ? 'en'
    : 'zh-CN';

  // Standardized international dictionary ensuring strict compliance:
  // "台湾" directly without "中国", "香港" directly without "中国", "澳门" directly without "中国"
  const REGION_I18N: Record<string, { 'zh-CN': string; 'zh-Hant': string; en: string }> = {
    TW: { 'zh-CN': '台湾', 'zh-Hant': '台灣', en: 'Taiwan' },
    HK: { 'zh-CN': '香港', 'zh-Hant': '香港', en: 'Hong Kong' },
    MO: { 'zh-CN': '澳门', 'zh-Hant': '澳門', en: 'Macau' },
    CN: { 'zh-CN': '中国', 'zh-Hant': '中國', en: 'China' },
    US: { 'zh-CN': '美国', 'zh-Hant': '美國', en: 'United States' },
    JP: { 'zh-CN': '日本', 'zh-Hant': '日本', en: 'Japan' },
    KR: { 'zh-CN': '韩国', 'zh-Hant': '韓國', en: 'South Korea' },
    SG: { 'zh-CN': '新加坡', 'zh-Hant': '新加坡', en: 'Singapore' },
    MY: { 'zh-CN': '马来西亚', 'zh-Hant': '馬來西亞', en: 'Malaysia' },
    GB: { 'zh-CN': '英国', 'zh-Hant': '英國', en: 'United Kingdom' },
    CA: { 'zh-CN': '加拿大', 'zh-Hant': '加拿大', en: 'Canada' },
    AU: { 'zh-CN': '澳大利亚', 'zh-Hant': '澳大利亞', en: 'Australia' },
    DE: { 'zh-CN': '德国', 'zh-Hant': '德國', en: 'Germany' },
    FR: { 'zh-CN': '法国', 'zh-Hant': '法國', en: 'France' },
    RU: { 'zh-CN': '俄罗斯', 'zh-Hant': '俄羅斯', en: 'Russia' },
    NL: { 'zh-CN': '荷兰', 'zh-Hant': '荷蘭', en: 'Netherlands' },
    CH: { 'zh-CN': '瑞士', 'zh-Hant': '瑞士', en: 'Switzerland' },
    SE: { 'zh-CN': '瑞典', 'zh-Hant': '瑞典', en: 'Sweden' },
    TH: { 'zh-CN': '泰国', 'zh-Hant': '泰國', en: 'Thailand' },
    VN: { 'zh-CN': '越南', 'zh-Hant': '越南', en: 'Vietnam' },
    PH: { 'zh-CN': '菲律宾', 'zh-Hant': '菲律賓', en: 'Philippines' },
    ID: { 'zh-CN': '印度尼西亚', 'zh-Hant': '印尼', en: 'Indonesia' },
    IN: { 'zh-CN': '印度', 'zh-Hant': '印度', en: 'India' },
  };

  const regionEntry = REGION_I18N[country];
  let countryName = regionEntry ? regionEntry[locale] : (request.headers.get('cf-ipcountry-name') || country);
  // Clean up any undesired prefixes or suffixes from raw cf-ipcountry-name
  if (country === 'TW') countryName = regionEntry[locale];
  if (country === 'HK') countryName = regionEntry[locale];
  if (country === 'MO') countryName = regionEntry[locale];

  // City formatting without repetitive redundancy
  let city = rawCity;
  if (city.toLowerCase() === 'hong kong' || city.toLowerCase() === 'macau' || city.toLowerCase() === 'singapore') {
    city = '';
  }

  let location = countryName;
  if (city) {
    if (locale === 'en') {
      location = `${city}, ${countryName}`;
    } else {
      location = `${countryName}·${city}`;
    }
  }

  return jsonResponse(
    request,
    env,
    {
      country,
      isMainland,
      city,
      timezone,
      countryName,
      location,
      locale,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
