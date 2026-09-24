// Routes are discovered once by the runner (see playwright.config.mjs) and shared with workers via env.
const data = JSON.parse(process.env.WF_QA_ROUTES || '{"routes":[],"notes":[]}');
export const routes = data.routes;
export const notes = data.notes;
export const productHandle = data.productHandle;
export const route = (key) => routes.find((r) => r.key === key);
