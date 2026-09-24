// Discovers the routes to test from the running preview. Prints JSON.
// Never hard-codes the product handle: /collections/all → /products.json → WF_PRODUCT_HANDLE.
const base = (process.env.WF_BASE_URL || 'http://127.0.0.1:9292').replace(/\/$/, '');
const notes = [];

async function get(path) {
  // Retry transient dev-server failures (5xx / network) before trusting a status.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(base + path, { redirect: 'follow' });
      if (res.status < 500) return { status: res.status, text: await res.text() };
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  return { status: 0, text: '' };
}

async function productHandle() {
  const all = await get('/collections/all');
  const m = all.text.match(/href="\/(?:collections\/all\/)?products\/([a-z0-9][a-z0-9-]*)/i);
  if (m) return m[1];
  const pj = await get('/products.json');
  try {
    const first = JSON.parse(pj.text).products?.[0];
    if (first) return first.handle;
  } catch {}
  return process.env.WF_PRODUCT_HANDLE || null;
}

async function blogHandle() {
  const home = await get('/');
  const m = home.text.match(/href="\/blogs\/([a-z0-9-]+)"/i);
  const candidates = [m?.[1], process.env.WF_BLOG_HANDLE, 'journal', 'news'].filter(Boolean);
  for (const h of candidates) {
    if ((await get(`/blogs/${h}`)).status === 200) return h;
  }
  return null;
}

const routes = [{ key: 'home', path: '/' }];
const handle = await productHandle();
if (handle) routes.push({ key: 'product', path: `/products/${handle}` });
else notes.push('No product found (collections/all, products.json, WF_PRODUCT_HANDLE) — product route skipped.');

const contactOk = (await get('/pages/contact')).status === 200;
for (const [key, path, view] of [['our-story', '/pages/our-story', 'our-story'], ['faq', '/pages/faq', 'faq'], ['contact', '/pages/contact']]) {
  if ((await get(path)).status === 200) routes.push({ key, path });
  else if (view && contactOk) {
    // The page doesn't exist in the store yet: render its template through an existing page.
    routes.push({ key, path: `/pages/contact?view=${view}` });
    notes.push(`${path} missing in store — testing template via /pages/contact?view=${view}.`);
  } else notes.push(`${path} not found — skipped.`);
}
routes.push({ key: 'cart', path: '/cart' });
routes.push({ key: 'search', path: '/search?q=honey' });
routes.push({ key: '404', path: '/this-page-does-not-exist' });

const blog = await blogHandle();
if (blog) {
  routes.push({ key: 'blog', path: `/blogs/${blog}` });
  const page = await get(`/blogs/${blog}`);
  const a = page.text.match(new RegExp(`href="(/blogs/${blog}/[a-z0-9-]+)"`, 'i'));
  if (a) routes.push({ key: 'article', path: a[1] });
  else notes.push(`Blog ${blog} has no articles — article route skipped.`);
} else notes.push('No blog found — blog route skipped.');

process.stdout.write(JSON.stringify({ routes, productHandle: handle, blogHandle: blog, notes }));
