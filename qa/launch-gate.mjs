// Launch gate: passes while the real storefront is password-protected; once it is
// public, fails if any key page still shows a [CLIENT-CONFIRM] placeholder.
const store = process.env.WF_STORE_URL || 'https://8jvdhd-c3.myshopify.com';
const paths = ['/', '/pages/our-story', '/pages/faq', '/pages/contact'];
const home = await fetch(store + '/', { redirect: 'manual' });
const loc = home.headers.get('location') || '';
if (home.status >= 300 && home.status < 400 && /\/password/.test(loc)) {
  console.log('Launch gate: storefront is password-protected — OK (placeholders are not public).');
  process.exit(0);
}
let failed = false;
for (const p of paths) {
  const res = await fetch(store + p);
  if (res.status !== 200) continue;
  const html = await res.text();
  const n = (html.match(/\[CLIENT-CONFIRM/g) || []).length;
  if (n) { failed = true; console.log(`FAIL ${p}: ${n} [CLIENT-CONFIRM] placeholder(s) are public`); }
}
console.log(failed ? 'Launch gate: FAILED' : 'Launch gate: OK');
process.exit(failed ? 1 : 0);
