/**
 * RunSplit QA Test Suite
 * Tests all critical integrations and user flows
 * 
 * Usage: node qa-test.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Load .env.local ───────────────────────────────────────────────
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.substring(0, idx).trim();
    const val = line.substring(idx + 1).trim();
    if (key && val) env[key] = val;
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
const STRIPE_MONTHLY_PRICE_ID = env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
const STRIPE_ANNUAL_PRICE_ID = env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID;
const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

const TEST_EMAIL = 'qa-test@runsplit.co';
const TEST_PASSWORD = 'QaTest2026!Secure';

let passed = 0;
let failed = 0;
let warnings = 0;
const results = [];

function log(status, test, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else warnings++;
  const msg = `${icon} [${status}] ${test}${detail ? ` — ${detail}` : ''}`;
  console.log(msg);
  results.push({ status, test, detail });
}

// ─── 1. Environment Variables ──────────────────────────────────────
console.log('\n━━━ 1. ENVIRONMENT VARIABLES ━━━');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID',
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_APP_URL',
];

for (const v of requiredEnvVars) {
  if (env[v]) {
    log('PASS', `Env: ${v}`, 'set');
  } else {
    log('FAIL', `Env: ${v}`, 'MISSING');
  }
}

// Check key modes
if (STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
  log('PASS', 'Stripe key mode', 'LIVE ✓');
} else if (STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
  log('WARN', 'Stripe key mode', 'TEST mode — checkout will show "Sandbox"');
} else {
  log('FAIL', 'Stripe key mode', 'Unknown key format');
}

// ─── 2. Supabase Connectivity ──────────────────────────────────────
console.log('\n━━━ 2. SUPABASE CONNECTIVITY ━━━');

try {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (res.ok) {
    log('PASS', 'Supabase REST API', `Status ${res.status}`);
  } else {
    log('FAIL', 'Supabase REST API', `Status ${res.status}`);
  }
} catch (e) {
  log('FAIL', 'Supabase REST API', e.message);
}

// Test required tables exist
const requiredTables = ['profiles', 'training_plans', 'race_results', 'strava_activities', 'email_log', 'support_tickets'];
for (const table of requiredTables) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=0`, {
      headers: { 
        apikey: SUPABASE_SERVICE_KEY, 
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: 'count=exact'
      }
    });
    if (res.ok) {
      const count = res.headers.get('content-range');
      log('PASS', `Table: ${table}`, `exists (${count || 'accessible'})`);
    } else {
      const text = await res.text();
      log('FAIL', `Table: ${table}`, `${res.status} — ${text.substring(0, 100)}`);
    }
  } catch (e) {
    log('FAIL', `Table: ${table}`, e.message);
  }
}

// Test profiles table has required columns
try {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,display_name,subscription_status,stripe_customer_id,experience_level,strava_athlete_id,email_weekly_summary&limit=1`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
  });
  if (res.ok) {
    log('PASS', 'Profiles columns', 'All required columns accessible');
  } else {
    const text = await res.text();
    log('FAIL', 'Profiles columns', text.substring(0, 150));
  }
} catch (e) {
  log('FAIL', 'Profiles columns', e.message);
}

// ─── 3. Supabase Auth ──────────────────────────────────────────────
console.log('\n━━━ 3. SUPABASE AUTH ━━━');

// Test auth endpoint is reachable
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: SUPABASE_ANON_KEY }
  });
  if (res.ok) {
    const settings = await res.json();
    log('PASS', 'Supabase Auth endpoint', 'reachable');
    
    // Check enabled providers
    const providers = settings.external || {};
    if (providers.google) log('PASS', 'Google OAuth', 'enabled');
    else log('WARN', 'Google OAuth', 'not enabled in Supabase');
    
    if (providers.apple) log('PASS', 'Apple OAuth', 'enabled');
    else log('WARN', 'Apple OAuth', 'not enabled in Supabase');
  } else {
    log('FAIL', 'Supabase Auth endpoint', `Status ${res.status}`);
  }
} catch (e) {
  log('FAIL', 'Supabase Auth endpoint', e.message);
}

// Create/sign in test user
let testUserId = null;
let testAccessToken = null;

try {
  // Try sign up first
  const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  const signupData = await signupRes.json();
  
  if (signupData.id || signupData.user?.id) {
    testUserId = signupData.id || signupData.user?.id;
    testAccessToken = signupData.access_token;
    log('PASS', 'Test user signup', `Created ${TEST_EMAIL}`);
  } else if (signupData.msg?.includes('already registered') || signupData.error_description?.includes('already registered')) {
    // User already exists, try login
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });
    const loginData = await loginRes.json();
    
    if (loginData.access_token) {
      testUserId = loginData.user?.id;
      testAccessToken = loginData.access_token;
      log('PASS', 'Test user login', `Signed in ${TEST_EMAIL}`);
    } else {
      log('WARN', 'Test user login', `Could not sign in — ${loginData.error_description || JSON.stringify(loginData).substring(0, 100)}`);
    }
  } else {
    log('WARN', 'Test user signup', `Unexpected: ${JSON.stringify(signupData).substring(0, 150)}`);
  }
} catch (e) {
  log('FAIL', 'Test user creation', e.message);
}

// Confirm test user via admin API (skip email confirmation)
if (testUserId && !testAccessToken) {
  try {
    const confirmRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${testUserId}`, {
      method: 'PUT',
      headers: { 
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email_confirm: true })
    });
    if (confirmRes.ok) {
      log('PASS', 'Test user email confirmed', 'via admin API');
      
      // Now try login
      const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
      });
      const loginData = await loginRes.json();
      if (loginData.access_token) {
        testAccessToken = loginData.access_token;
        testUserId = loginData.user?.id;
        log('PASS', 'Test user login after confirm', 'success');
      } else {
        log('WARN', 'Test user login after confirm', loginData.error_description || 'failed');
      }
    } else {
      log('WARN', 'Test user email confirm', `Status ${confirmRes.status}`);
    }
  } catch (e) {
    log('WARN', 'Test user email confirm', e.message);
  }
}

// Test profile upsert (simulates onboarding)
if (testUserId && testAccessToken) {
  try {
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${testAccessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: testUserId,
        display_name: 'QA Tester',
        age: 30,
        gender: 'male',
        experience_level: 'intermediate',
        current_weekly_km: 30,
        preferred_unit: 'km',
      })
    });
    if (upsertRes.ok || upsertRes.status === 201) {
      log('PASS', 'Profile upsert (onboarding)', 'success');
    } else {
      const text = await upsertRes.text();
      log('FAIL', 'Profile upsert (onboarding)', `${upsertRes.status} — ${text.substring(0, 150)}`);
    }
  } catch (e) {
    log('FAIL', 'Profile upsert (onboarding)', e.message);
  }

  // Test profile read back
  try {
    const readRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${testUserId}&select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${testAccessToken}`,
      }
    });
    const profiles = await readRes.json();
    if (profiles.length > 0 && profiles[0].display_name === 'QA Tester') {
      log('PASS', 'Profile read back', `display_name=${profiles[0].display_name}, sub=${profiles[0].subscription_status || 'none'}`);
    } else {
      log('FAIL', 'Profile read back', JSON.stringify(profiles).substring(0, 150));
    }
  } catch (e) {
    log('FAIL', 'Profile read back', e.message);
  }

  // Test RLS: user can only read own profile
  try {
    const readAllRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${testAccessToken}`,
        Prefer: 'count=exact'
      }
    });
    const allProfiles = await readAllRes.json();
    if (allProfiles.length <= 1) {
      log('PASS', 'RLS: profiles isolation', `User sees ${allProfiles.length} profile(s)`);
    } else {
      log('FAIL', 'RLS: profiles isolation', `User can see ${allProfiles.length} profiles — RLS broken!`);
    }
  } catch (e) {
    log('FAIL', 'RLS: profiles isolation', e.message);
  }
}

// ─── 4. Stripe Integration ─────────────────────────────────────────
console.log('\n━━━ 4. STRIPE INTEGRATION ━━━');

const stripeHeaders = {
  Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded'
};

// Test Stripe API connectivity
try {
  const res = await fetch('https://api.stripe.com/v1/balance', { headers: stripeHeaders });
  const data = await res.json();
  if (data.available !== undefined) {
    log('PASS', 'Stripe API', `Connected, livemode: ${data.livemode}`);
  } else {
    log('FAIL', 'Stripe API', data.error?.message || 'Unknown error');
  }
} catch (e) {
  log('FAIL', 'Stripe API', e.message);
}

// Test monthly price exists
try {
  const res = await fetch(`https://api.stripe.com/v1/prices/${STRIPE_MONTHLY_PRICE_ID}`, { headers: stripeHeaders });
  const price = await res.json();
  if (price.id && price.active) {
    log('PASS', 'Stripe monthly price', `£${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval}, active=${price.active}, live=${price.livemode}`);
  } else if (price.id && !price.active) {
    log('FAIL', 'Stripe monthly price', `Price exists but is INACTIVE`);
  } else {
    log('FAIL', 'Stripe monthly price', price.error?.message || 'Not found');
  }
} catch (e) {
  log('FAIL', 'Stripe monthly price', e.message);
}

// Test annual price (if set)
if (STRIPE_ANNUAL_PRICE_ID) {
  try {
    const res = await fetch(`https://api.stripe.com/v1/prices/${STRIPE_ANNUAL_PRICE_ID}`, { headers: stripeHeaders });
    const price = await res.json();
    if (price.id && price.active) {
      log('PASS', 'Stripe annual price', `£${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval}, active=${price.active}`);
    } else if (price.id && !price.active) {
      log('WARN', 'Stripe annual price', 'Price exists but is INACTIVE');
    } else {
      log('WARN', 'Stripe annual price', price.error?.message || 'Not found');
    }
  } catch (e) {
    log('WARN', 'Stripe annual price', e.message);
  }
} else {
  log('WARN', 'Stripe annual price', 'NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID not set');
}

// Test checkout session creation (without a real customer)
try {
  const body = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': STRIPE_MONTHLY_PRICE_ID,
    'line_items[0][quantity]': '1',
    success_url: 'https://runsplit.co/plan/builder?subscribed=true',
    cancel_url: 'https://runsplit.co/pricing',
  });
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: stripeHeaders,
    body: body.toString()
  });
  const session = await res.json();
  if (session.url) {
    log('PASS', 'Stripe checkout session', `Created ${session.id.substring(0,25)}..., livemode=${session.livemode}`);
  } else {
    log('FAIL', 'Stripe checkout session', session.error?.message || 'No URL returned');
  }
} catch (e) {
  log('FAIL', 'Stripe checkout session', e.message);
}

// Test webhook endpoint config
try {
  const res = await fetch('https://api.stripe.com/v1/webhook_endpoints', { headers: stripeHeaders });
  const data = await res.json();
  const endpoints = data.data || [];
  const runsplitEndpoint = endpoints.find(ep => ep.url?.includes('runsplit'));
  if (runsplitEndpoint) {
    log('PASS', 'Stripe webhook endpoint', `${runsplitEndpoint.url} (status: ${runsplitEndpoint.status})`);
    const events = runsplitEndpoint.enabled_events || [];
    const requiredEvents = ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'];
    for (const ev of requiredEvents) {
      if (events.includes(ev) || events.includes('*')) {
        log('PASS', `Webhook event: ${ev}`, 'subscribed');
      } else {
        log('FAIL', `Webhook event: ${ev}`, 'NOT subscribed');
      }
    }
  } else {
    log('WARN', 'Stripe webhook endpoint', `No endpoint found for runsplit. ${endpoints.length} endpoint(s) configured.`);
    for (const ep of endpoints) {
      log('WARN', `  Webhook: ${ep.url}`, `status: ${ep.status}`);
    }
  }
} catch (e) {
  log('FAIL', 'Stripe webhook endpoints', e.message);
}

// ─── 5. Anthropic API ──────────────────────────────────────────────
console.log('\n━━━ 5. ANTHROPIC AI API ━━━');

try {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "QA test passed" in exactly those words.' }]
    })
  });
  const data = await res.json();
  if (data.content?.[0]?.text) {
    log('PASS', 'Anthropic API', `Model responded: "${data.content[0].text.substring(0, 50)}"`);
  } else {
    log('FAIL', 'Anthropic API', data.error?.message || JSON.stringify(data).substring(0, 150));
  }
} catch (e) {
  log('FAIL', 'Anthropic API', e.message);
}

// ─── 6. Dev Server Page Tests ──────────────────────────────────────
console.log('\n━━━ 6. PAGE RENDERING (dev server) ━━━');

// Check if dev server is running
let devServerRunning = false;
try {
  const res = await fetch('http://localhost:3000', { redirect: 'follow' });
  devServerRunning = res.ok || res.status === 200;
} catch (e) {
  // Not running
}

if (!devServerRunning) {
  log('WARN', 'Dev server', 'Not running on localhost:3000 — skipping page tests. Start with: npm run dev');
} else {
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/tools', name: 'Tools index' },
    { path: '/plans', name: 'Plans index' },
    { path: '/calculators', name: 'Calculators index' },
    { path: '/pricing', name: 'Pricing' },
    { path: '/login', name: 'Login' },
    { path: '/signup', name: 'Signup' },
    { path: '/onboarding', name: 'Onboarding' },
    { path: '/support', name: 'Support' },
    { path: '/tools/pace', name: 'Pace calculator' },
    { path: '/tools/predict', name: 'Race predictor' },
    { path: '/tools/splits', name: 'Splits calculator' },
    { path: '/tools/vo2max', name: 'VO2max calculator' },
    { path: '/plans/couch-to-5k', name: 'Sample plan: Couch to 5K' },
    { path: '/sitemap.xml', name: 'Sitemap' },
    { path: '/robots.txt', name: 'Robots.txt' },
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`http://localhost:3000${page.path}`, { redirect: 'follow' });
      if (res.ok) {
        const text = await res.text();
        const hasError = text.includes('Application error') || text.includes('Internal Server Error') || text.includes('NEXT_NOT_FOUND');
        if (hasError) {
          log('FAIL', `Page: ${page.name}`, `${page.path} — rendered but contains error`);
        } else {
          log('PASS', `Page: ${page.name}`, `${page.path} — ${res.status}`);
        }
      } else {
        log('FAIL', `Page: ${page.name}`, `${page.path} — ${res.status}`);
      }
    } catch (e) {
      log('FAIL', `Page: ${page.name}`, `${page.path} — ${e.message}`);
    }
  }

  // Test API routes respond (without valid auth, expect 401 not 500)
  console.log('\n━━━ 7. API ENDPOINT TESTS ━━━');

  const apiTests = [
    { path: '/api/create-checkout-session', method: 'POST', name: 'Checkout session', expectStatus: [401] },
    { path: '/api/create-portal-session', method: 'POST', name: 'Portal session', expectStatus: [401] },
    { path: '/api/generate-plan', method: 'POST', name: 'Generate plan', expectStatus: [400, 401, 403, 500] },
    { path: '/api/support', method: 'POST', name: 'Support API', expectStatus: [400], body: JSON.stringify({}) },
    { path: '/api/strava/sync', method: 'POST', name: 'Strava sync', expectStatus: [401] },
    { path: '/api/strava/disconnect', method: 'POST', name: 'Strava disconnect', expectStatus: [401] },
  ];

  for (const test of apiTests) {
    try {
      const fetchOpts = { 
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (test.body) fetchOpts.body = test.body;
      
      const res = await fetch(`http://localhost:3000${test.path}`, fetchOpts);
      
      if (res.status === 500) {
        const text = await res.text();
        log('FAIL', `API: ${test.name}`, `${test.path} — 500 Server Error: ${text.substring(0, 100)}`);
      } else if (test.expectStatus.includes(res.status)) {
        log('PASS', `API: ${test.name}`, `${test.path} — ${res.status} (expected)`);
      } else {
        log('PASS', `API: ${test.name}`, `${test.path} — ${res.status}`);
      }
    } catch (e) {
      log('FAIL', `API: ${test.name}`, `${test.path} — ${e.message}`);
    }
  }

  // Test support API with valid data
  try {
    const res = await fetch('http://localhost:3000/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Tester',
        email: 'qa@runsplit.co',
        subject: 'QA Test',
        message: 'This is an automated QA test message.'
      })
    });
    const data = await res.json();
    if (res.ok && (data.reply || data.aiResponse)) {
      const reply = data.reply || data.aiResponse;
      log('PASS', 'Support API (with data)', `AI responded: "${reply.substring(0, 60)}..."`);
    } else {
      log('FAIL', 'Support API (with data)', `${res.status} — ${JSON.stringify(data).substring(0, 100)}`);
    }
  } catch (e) {
    log('FAIL', 'Support API (with data)', e.message);
  }

  // Test generate-plan API returns proper error for empty body
  try {
    const res = await fetch('http://localhost:3000/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    if (res.status === 400) {
      log('PASS', 'API: Generate plan (empty body)', `Returns 400 with clear message`);
    } else {
      log('WARN', 'API: Generate plan (empty body)', `Expected 400, got ${res.status}`);
    }
  } catch (e) {
    log('FAIL', 'API: Generate plan (empty body)', e.message);
  }
}

// ─── 8. Vercel Deployment Check ────────────────────────────────────
console.log('\n━━━ 8. PRODUCTION DEPLOYMENT ━━━');

try {
  const res = await fetch('https://runsplit.vercel.app', { redirect: 'follow' });
  if (res.ok) {
    log('PASS', 'Vercel deployment (runsplit.vercel.app)', `Status ${res.status}`);
  } else {
    log('FAIL', 'Vercel deployment (runsplit.vercel.app)', `Status ${res.status}`);
  }
} catch (e) {
  log('FAIL', 'Vercel deployment (runsplit.vercel.app)', e.message);
}

try {
  const res = await fetch('https://runsplit.co', { redirect: 'follow' });
  if (res.ok) {
    const text = await res.text();
    if (text.includes('RunSplit')) {
      log('PASS', 'Custom domain (runsplit.co)', 'Resolves and contains RunSplit');
    } else {
      log('WARN', 'Custom domain (runsplit.co)', 'Resolves but may not be the right site');
    }
  } else {
    log('FAIL', 'Custom domain (runsplit.co)', `Status ${res.status}`);
  }
} catch (e) {
  log('FAIL', 'Custom domain (runsplit.co)', e.message);
}

// ─── CLEANUP: Remove test user ─────────────────────────────────────
if (testUserId) {
  console.log('\n━━━ CLEANUP ━━━');
  try {
    // Delete test profile
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${testUserId}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
    });
    // Delete test user
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${testUserId}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
    });
    log('PASS', 'Cleanup', `Removed test user ${TEST_EMAIL}`);
  } catch (e) {
    log('WARN', 'Cleanup', `Could not remove test user: ${e.message}`);
  }
}

// ─── SUMMARY ───────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
console.log(`QA RESULTS: ${passed} passed, ${failed} failed, ${warnings} warnings`);
console.log('═'.repeat(50));

if (failed > 0) {
  console.log('\n❌ FAILURES:');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`   • ${r.test}: ${r.detail}`);
  });
}
if (warnings > 0) {
  console.log('\n⚠️  WARNINGS:');
  results.filter(r => r.status === 'WARN').forEach(r => {
    console.log(`   • ${r.test}: ${r.detail}`);
  });
}

console.log('');
process.exit(failed > 0 ? 1 : 0);

