# ADR-0032: UI Design System Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Domain Architect, Platform Architect, UI/UX Lead |
| **Affects** | All Frontend Applications, Web Portals, Micro-Frontends |
| **Tags** | governance, ui, ux, design-system, rtl |
| **Related** | [ADR-0011](ADR-0011-platform-engineering-strategy.md) |

---

## 1. Context

CyberCom delivers software solutions across multiple business domains: patient portals, clinician dashboards, ERP consoles, and citizen mobile wallets. Many interfaces are built by different teams using various stacks (React, Next.js, and Odoo Web Library - OWL). Without a central UI Design System:
-   User experiences diverge, leading to high training costs for hospital and administrative staff.
-   Right-to-Left (RTL) Arabic layout rendering is fragile and inconsistent.
-   Accessibilities controls (WCAG compliance) are frequently skipped.
-   CSS overrides accumulate, bloat bundles, and degrade web performance.

---

## 2. Decision Drivers

-   **Premium Aesthetics:** Modern, responsive layouts utilizing sleek dark modes, clean typography, and subtle micro-animations to wow the user.
-   **Native RTL Support:** Seamless Middle East localization (Arabic / English switching).
-   **Accessibility:** Strict WCAG 2.1 AA conformance for civic and clinical systems.
-   **Reusability:** Shared design tokens and component libraries across React and OWL.

---

## 3. Decision

We establish a unified **UI Design System Strategy** based on the following architectural rules:

### 3.1 Design Tokens (Vanilla CSS variables)
All applications consume a shared set of design tokens (compiled from JSON token definitions into CSS variables). Ad-hoc hexadecimal colors or custom spacing sizes in source code are prohibited.
*   **Fonts:** `Inter` (sans-serif) for English/Latin UI elements; `Outfit` or `Cairo` for Arabic/RTL text.
*   **Palette:** Harmonious, tailorable HSL colors (e.g., deep clinical blues, sleek ERP slate greens).
*   **Shadows & Blur:** Premium glassmorphism specs:
    ```css
    --glass-background: rgba(255, 255, 255, 0.45);
    --glass-blur: blur(12px);
    --glass-border: 1px solid rgba(255, 255, 255, 0.25);
    ```

### 3.2 Dual RTL/LTR Layout Flow
1.  **Logical Properties:** Developers must use CSS Logical Properties rather than directional positioning.
    *   *Correct:* `margin-inline-start: 1rem;`
    *   *Incorrect:* `margin-left: 1rem;`
2.  **Direction Toggle:** The root HTML tag dynamically updates direction indicators: `<html dir="rtl" lang="ar">`.

### 3.3 Component Architecture & Stacks
*   **React Component Library:** Built on Headless UI/Radix primitives to guarantee accessibility out of the box, styled with the design tokens.
*   **OWL Bridge:** Port design token styles into OWL classes to maintain a unified visual appearance between `CyMed` portals and `CyCom` ERP views.
*   **Micro-Frontends:** Expose shared widgets (e.g., patient banner, tenant profile card) using Web Components, allowing framework-agnostic embedding.

---

## 4. Rationale

*   Vanilla CSS variables decouple styling from JS framework execution, enabling fast performance.
*   Using logical CSS properties eliminates the need to compile separate stylesheet bundles for LTR and RTL layouts.

---

## 5. Consequences

### 5.1 Positive
*   Unified user experience across portals.
*   Faster developer onboarding for UI styling.
*   Built-in RTL support from day one.

### 5.2 Negative / Trade-offs
*   Initial development overhead to construct the React and OWL components.
*   Strict enforcement is required to prevent developer deviations into ad-hoc CSS.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Enterprise Architect | Proposed & Approved |
