// Direct verification of Stripe PaymentIntent creation with user's test key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required to run this test script.');
  process.exit(1);
}

async function testStripe() {
  console.log('Testing Stripe PaymentIntent API creation with sandbox key...');
  const params = new URLSearchParams();
  params.set('amount', '500'); // $5.00
  params.set('currency', 'usd');
  params.set('automatic_payment_methods[enabled]', 'true');
  params.set('description', 'shijianus blog test sponsorship');

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (res.ok && data.id && data.client_secret) {
    console.log('✅ Stripe PaymentIntent created successfully!');
    console.log(`- ID: ${data.id}`);
    console.log(`- Amount: $${data.amount / 100} ${data.currency.toUpperCase()}`);
    console.log(`- Client Secret: ${data.client_secret.slice(0, 15)}...`);
    console.log(`- Status: ${data.status}`);
  } else {
    console.error('❌ Stripe PaymentIntent creation failed:', data);
    process.exit(1);
  }
}

testStripe().catch((err) => {
  console.error(err);
  process.exit(1);
});
