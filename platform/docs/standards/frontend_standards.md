# Frontend Standards

> **Status:** Approved — Program 0, Phase 0.3
> **Owner:** Principal Engineer (Frontend)
> **Stack:** React 19 · Next.js (App Router) · TypeScript 5 · React Native (mobile) · Electron (desktop)

Extends [`coding_standards.md`](coding_standards.md).

---

## 1. Versions & Toolchain

| Tool | Version |
|---|---|
| Node | **20 LTS** (or current active LTS) |
| Package manager | **pnpm** |
| TypeScript | **5.x**, `strict: true`, `noUncheckedIndexedAccess: true` |
| Formatter | **Prettier** |
| Linter | **ESLint** (`@typescript-eslint`, `eslint-plugin-react`, `-jsx-a11y`, `-import`) |
| Tests | **Vitest** (unit), **Playwright** (e2e), **Testing Library** |
| Build | Next.js, Vite (libraries), Metro (RN), electron-builder |
| Pre-commit | `husky` + `lint-staged` |

---

## 2. Naming

- Components / hooks / types: `PascalCase` (`PatientCard`, `usePatient`).
- Hook files: `useThing.ts`; component files: `PascalCase.tsx`.
- Utility files: `kebab-case.ts`.
- CSS modules: `Component.module.css`.
- Test files: co-located, `*.test.ts(x)` (unit), `*.e2e.ts` (Playwright).

---

## 3. Folder Layout (Next.js App Router)

```
<app>/
├── package.json
├── tsconfig.json
├── next.config.ts
├── public/
├── src/
│   ├── app/                      # Routes (App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── (group)/...
│   ├── components/               # Reusable UI primitives & composites
│   │   ├── ui/                   # Design-system primitives
│   │   └── features/<feature>/   # Feature-scoped components
│   ├── features/<feature>/       # Co-located feature code (hooks, api, types)
│   ├── lib/                      # Pure utils (no React)
│   ├── hooks/                    # Cross-feature hooks
│   ├── api/                      # Generated API clients (OpenAPI)
│   ├── styles/
│   └── types/
└── tests/
    ├── unit/
    └── e2e/
```

**Rule:** features own their state, hooks, and components. Cross-feature sharing goes through `components/ui` or `lib/`.

---

## 4. Next.js Conventions

- **App Router only** for new apps; Pages Router only for legacy migrations (per ADR).
- **Server Components by default.** Use `'use client'` only when needed (state, effects, browser APIs).
- **Data fetching:**
  - Server Components: `fetch` with explicit `cache` / `next.revalidate`.
  - Client: **TanStack Query** (preferred) or **SWR**; never raw `useEffect` for data fetching.
- **Mutations:** Server Actions for trusted, simple mutations; otherwise TanStack Query mutation against typed API client.
- **Routing:** prefer file-based; use `redirect`/`notFound` from `next/navigation`.
- **Images:** `next/image` with explicit width/height; remote patterns whitelisted in `next.config.ts`.
- **Fonts:** `next/font` only; no `<link>` to Google Fonts.
- **Env vars:** `NEXT_PUBLIC_*` for client; everything else server-only. Validate via Zod at boot.

---

## 5. TypeScript Rules

- `strict: true`, `noImplicitAny`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- No `any`. Use `unknown` and narrow.
- Prefer **type aliases** for unions/intersections, **interfaces** for object shapes that extend.
- Discriminated unions for state machines.
- `enum` discouraged → use `as const` objects + `keyof typeof`.
- Path aliases via `tsconfig.json` `paths`; no deep `../../../`.

---

## 6. State Management

| Scope | Recommended |
|---|---|
| Server state | TanStack Query |
| URL state | `nuqs` or Next.js `searchParams` |
| Local UI state | `useState` / `useReducer` |
| Cross-feature client state | Zustand (small, typed) |
| Forms | React Hook Form + Zod resolver |
| Complex flows | XState (per ADR) |

Redux is permitted only with an ADR and a concrete justification.

---

## 7. Styling

- **Tailwind CSS** is the default utility layer.
- **CSS Modules** for component-local styles when Tailwind is insufficient.
- Design tokens (color, spacing, radius, type scale) defined in `docs/uiux/` and consumed via Tailwind theme.
- No inline `style={{ … }}` except for dynamic values.
- Dark mode supported from day 1 (`prefers-color-scheme` + `data-theme`).

---

## 8. Component Standards

- **Single responsibility.** A component that does data fetching, layout, and form handling should be split.
- Props typed; no `React.FC` (prefer explicit `function Component(props: Props)`).
- Children typed as `React.ReactNode`.
- Avoid prop drilling beyond 2 levels — lift state or use context (sparingly).
- Boundaries: every route segment has an `error.tsx` and `loading.tsx`.
- Memoization (`memo`, `useMemo`, `useCallback`) only when measured; do not pre-optimize.

---

## 9. Accessibility (a11y)

- **WCAG 2.2 AA baseline**, AAA where feasible.
- `eslint-plugin-jsx-a11y` errors block CI.
- All interactive elements keyboard-reachable; visible focus rings.
- Semantic HTML before ARIA. ARIA used only when semantics don't exist.
- Color contrast ≥ 4.5:1 for text; ≥ 3:1 for UI components.
- RTL support required (Arabic, Hebrew); `dir` attribute respected.
- Screen-reader smoke tests included in e2e for critical journeys.

---

## 10. Internationalization

- Library: **`next-intl`** (web) / **`react-i18next`** (RN/Electron).
- All user-visible strings extracted; no hard-coded strings in JSX.
- Locales delivered as JSON; English is source of truth.
- Pluralization via ICU MessageFormat.
- RTL toggling tested.

---

## 11. API Integration

- API clients **generated from OpenAPI** (`openapi-typescript` / `orval`).
- No hand-written `fetch` for first-party APIs.
- Errors mapped to the standard envelope (see [`api_standards.md`](api_standards.md)).
- Auth tokens via HttpOnly cookies or a token service; never `localStorage` for sensitive tokens.

---

## 12. Performance

| Metric | Target |
|---|---|
| LCP | ≤ 2.5 s (75th percentile, mobile) |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| TTFB (SSR) | ≤ 600 ms |
| Bundle JS (initial route) | ≤ 200 KB gzipped |

- Code-split per route; lazy-load below-the-fold.
- Images optimized; modern formats (AVIF/WebP).
- Lighthouse CI runs in CI; budgets enforced.

---

## 13. Security

- CSP enforced via Next.js headers; nonces for inline scripts.
- HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy set.
- No `dangerouslySetInnerHTML` without sanitization (DOMPurify).
- No third-party script without a documented risk review.
- Authentication state in HttpOnly, Secure, SameSite=Lax cookies.

---

## 14. React Native (Mobile)

- Expo (managed or bare per ADR) on **React Native 0.74+**.
- Navigation: **React Navigation**.
- State/data: same as web (TanStack Query, Zustand).
- Storage: `expo-secure-store` for secrets; MMKV for non-sensitive.
- Push: Expo Notifications or FCM/APNs per ADR.
- Offline-first patterns required for clinical/field flows; queued mutations with idempotency keys.

---

## 15. Electron (Desktop)

- **Context isolation ON**, **`nodeIntegration` OFF**, **sandbox ON**.
- Renderer talks to main process via `contextBridge` + typed IPC; no direct `require('electron')` in renderer.
- Auto-update via signed releases.
- Crash reporting + telemetry opt-in.
- File-system access mediated by main process with allowlist paths.

---

## 16. Testing

- Unit: Vitest + Testing Library — test behavior, not implementation.
- E2E: Playwright — golden-path flows per feature; cross-browser (Chromium, Firefox, WebKit).
- Visual regression: Playwright snapshots or Chromatic (per ADR).
- Coverage thresholds per [`coding_standards.md`](coding_standards.md) §10 and [`testing_standards.md`](testing_standards.md).

---

## 17. Forbidden

- jQuery, Moment.js (use `date-fns` / `Temporal`).
- CSS-in-JS runtime libraries that hurt SSR (`styled-components` runtime) without ADR.
- `default export` for components in shared libraries (named exports for tree-shaking).
- Accessing `window`/`document` in Server Components.
- Storing tokens in `localStorage`/`sessionStorage`.
