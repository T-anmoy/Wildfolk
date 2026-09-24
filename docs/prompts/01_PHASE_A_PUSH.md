# WILDFOLK — PHASE A PUSH (run only after Claude Code's Phase A report)

Run in `wildfolkgithub`, one block at a time. Stop at any ⚠️.

## 1. Confirm local state

```bash
git status                                # must say "working tree clean"
git branch --show-current                 # must be: main
git log --oneline origin/main..HEAD       # the Phase A commits (about 6–8)
```

⚠️ If the working tree is not clean, don't push. Ask Claude Code what the uncommitted files are.

## 2. Check whether Shopify committed anything meanwhile

```bash
git fetch origin
git log --oneline HEAD..origin/main       # empty = nothing new on GitHub
```

- **Empty output:** go to step 3.
- **Commits listed** (someone used the Theme Editor): check whether they touch the same files as yours:
  ```bash
  git diff --name-only HEAD...origin/main
  git diff --name-only origin/main...HEAD
  ```
  - **No shared files:**
    ```bash
    git pull --rebase origin main
    ```
  - ⚠️ **Shared files, or the rebase conflicts:**
    ```bash
    git rebase --abort
    ```
    Stop, and paste both lists into the planning chat. Never force-push.

## 3. Final gate

```bash
npx shopify theme check
```

It must show **0 errors**.

With `npx shopify theme dev --store 8jvdhd-c3.myshopify.com` running in another terminal:

```bash
npm run qa:quick
```

It must pass. Also open `http://127.0.0.1:9292` on your phone or in a mobile emulator and scroll the home page once.

## 4. Push

```bash
git push origin main
```

⚠️ Never use `--force`.

## 5. Verify

```bash
git log --oneline -3 origin/main          # matches your local HEAD
```

- On GitHub (`T-anmoy/Wildfolk`), check that the main branch shows the Phase A commits.
- In Shopify admin → Themes, check that the connected theme shows **no sync error**, then preview it at 390px and 1440px.
- Do the **THEME EDITOR FOLLOW-UP** items from Claude Code's report. Then, locally:
  ```bash
  git pull --ff-only
  ```

A successful push means GitHub is in sync. It does **not** mean Phase A is signed off; the visual check above does.
