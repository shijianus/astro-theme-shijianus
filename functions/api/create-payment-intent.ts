import type { AppEnv } from '../_lib/types';
import { optionsResponse, jsonResponse, safeReadJson } from '../_lib/http';

interface PaymentIntentPayload {
  amount?: number;
  currency?: string;
}

export async function onRequest(context: { request: Request; env: AppEnv }): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, env, { ok: false, error: 'Method not allowed' }, { status: 405 });
  }

  const payload = await safeReadJson<PaymentIntentPayload>(request);
  const rawAmount = typeof payload?.amount === 'number' ? payload.amount : 5;
  const currency = (payload?.currency || 'usd').toLowerCase();

  // Validate amount: support both dollar amount (e.g., 5 => 500 cents) or cents
  // Stripe requires minimum charge (usually 50 cents)
  let amountInCents = Math.round(rawAmount >= 50 && Number.isInteger(rawAmount) ? rawAmount : rawAmount * 100);
  if (amountInCents < 50) {
    amountInCents = 50; // Minimum $0.50
  }
  if (amountInCents > 100000) {
    amountInCents = 100000; // Cap at $1000 to prevent errors
  }

  const stripeSecretKey =
    env.STRIPE_SECRET_KEY ||
    (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) ||
    '';

  if (!stripeSecretKey) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: 'Stripe secret key is not configured.' },
      { status: 500 },
    );
  }

  try {
    const params = new URLSearchParams();
    params.set('amount', String(amountInCents));
    params.set('currency', currency);
    params.set('automatic_payment_methods[enabled]', 'true');
    params.set('description', 'shijianus blog sponsorship support');

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = (await stripeRes.json()) as Record<string, any>;

    if (!stripeRes.ok || data.error) {
      const errorMsg = data.error?.message || `Stripe error (${stripeRes.status})`;
      return jsonResponse(request, env, { ok: false, error: errorMsg }, { status: 400 });
    }

    return jsonResponse(request, env, {
      ok: true,
      clientSecret: data.client_secret,
      id: data.id,
      amount: amountInCents,
      currency,
    });
  } catch (err: any) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: err?.message || 'Failed to create Stripe payment intent' },
      { status: 500 },
    );
  }
}
