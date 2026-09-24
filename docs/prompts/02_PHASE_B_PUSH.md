# WILDFOLK — PHASE B PUSH (run only after Claude Code's Phase B report)

**Prerequisites:**

- Phase A is pushed and verified.
- You pulled after the Phase A Theme Editor follow-ups.
- You have not used the Theme Editor since.

Run in `wildfolkgithub`, one block at a time. Stop at any ⚠️.

## 1. Confirm local state

```bash
git status                                # working tree clean
git branch --show-current                 # main
git log --oneline origin/main..HEAD       # the Phase B commits (about 7)
```

## 2. Check for Shopify-side commits

```bash
git fetch origin
git log --oneline HEAD..origin/main       # empty = safe
```

If commits are listed:

```bash
git diff --name-only HEAD...origin/main
git diff --name-only origin/main...HEAD
```

- **No shared files:**
  ```bash
  git pull --rebase origin main
  ```
- ⚠️ **Shared files or conflicts:**
  ```bash
  git rebase --abort
  ```
  Stop, and paste both lists into the planning chat. Never force-push.

## 3. Final gate

```bash
npx shopify theme check                   # 0 errors
```

With `npx shopify theme dev --store 8jvdhd-c3.myshopify.com` running in another terminal:

```bash
npm run qa:quick                          # must pass
```

Then do a manual check on your own phone against `http://<your-LAN-IP>:9292`, or use the preview link printed by `theme dev`:

- [ ] Home scrolls cleanly; there is a clear route to the product early on.
- [ ] On the product page, the sticky bar appears after scrolling past Add to Cart, and adding to cart shows the cart notification.
- [ ] The header "Shop Honey" works, and the drawer menu opens and closes.
- [ ] A journal article reads comfortably.

## 4. Push

```bash
git push origin main
```

⚠️ Never use `--force`.

## 5. Verify

```bash
git log --oneline -3 origin/main
```

- In Shopify admin → Themes, check that the connected theme shows no sync error.
- Preview at 390px, 834px, 1280×720 and 1440px.
- Do every **THEME EDITOR FOLLOW-UP** item from the Phase B report, save, wait for the Shopify commits, then:
  ```bash
  git pull --ff-only
  ```
- Send the **CLIENT CONTENT STILL NEEDED** list and the photography brief to the client.
- Keep the store password on until every `[CLIENT-CONFIRM]` is resolved and Razorpay checkout has been tested end to end.
