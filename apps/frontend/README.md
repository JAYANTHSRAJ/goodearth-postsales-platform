# GoodEarth Post-Sales Platform - Frontend Client

This directory houses the React single-page application (SPA) for the GoodEarth Post-Sales Platform. It serves as the primary portal interface for Customers, Sales/CRM, Finance, Handover, and Operations teams to manage the journey of a unit from booking to handover.

## 🚀 Tech Stack

The application is built on a modern, highly performant, and type-safe frontend stack:

- **Core Framework**: React 19 (for advanced rendering, transition APIs, and performance)
- **Build Tool**: Vite (for rapid HMR and optimized bundler pipelines)
- **Language**: TypeScript (strict mode configured)
- **Styling**: Tailwind CSS (with utility-first styling and custom design tokens)
- **Routing**: React Router v6/v7 (declarative routing structure)
- **State Management**:
  - **Server State**: TanStack Query (React Query) v5 (for cache management, optimistic updates, and sync)
  - **Global Client State**: Zustand (for light, fast, and centralized UI state)
- **Form Handling & Validation**: React Hook Form with Zod (for declarative schema-based validation)
- **Animations**: Framer Motion (for fluid micro-interactions and page transitions)
- **Icons**: Lucide React

---

## 📂 Directory Structure

The project follows a **Feature-First Architecture**, placing related files under cohesive feature modules to avoid directory bloating as the project scales.

```text
apps/frontend/
├── index.html              # Entry HTML template
├── package.json            # Scripts and dependencies
├── vite.config.ts          # Vite bundler configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind design tokens
├── postcss.config.js       # PostCSS processor config
├── eslint.config.js        # ESLint flat config (ESLint 9)
├── .prettierrc             # Code formatter rules
├── .env.example            # Environment variables template
└── src/
    ├── main.tsx            # React application bootstrapper
    ├── vite-env.d.ts       # Global Vite/TypeScript environment declarations
    ├── app/                # Core providers and global app configurations
    ├── assets/             # Static assets (images, global svgs)
    ├── components/         # Shared global components
    │   ├── common/         # Low-level primitives (Buttons, Inputs, Spinners)
    │   ├── layout/         # Shell-level wrappers (Navbar, Sidebar, Footer)
    │   └── ui/             # High-level display components (Modals, Carousels, Alerts)
    ├── features/           # Context-specific business modules (highly encapsulated)
    │   ├── admin/          # Platform administration controls
    │   ├── annotation/     # Document annotation/marking overlays
    │   ├── auth/           # Login, Session management, Role verification
    │   ├── buyer/          # Buyer details, dashboard links, onboarding progress
    │   ├── dashboard/      # Team/role landing hubs and analytics
    │   ├── document/       # File upload, viewer, and document templates
    │   ├── notification/   # Real-time alerts, email logs, task lists
    │   ├── payment/        # Razorpay integration UI and payment histories
    │   ├── project/        # Project and phase listings
    │   ├── stage/          # Lifecycle stage execution panels
    │   └── workflow/       # Workflow history, state-transition timeline
    ├── hooks/              # Global reusable utility hooks (e.g. useDebounce, useMediaQuery)
    ├── layouts/            # Page shell layouts (AuthLayout, DashboardLayout, PortalLayout)
    ├── lib/                # Client initializations (apiClient, queryClient, etc.)
    ├── pages/              # Route entry points (primarily maps imports to feature views)
    ├── routes/             # Route configurations and router setup
    ├── services/           # Global services (Analytics, Zoho Sync utilities)
    ├── store/              # Global client state definitions (Zustand)
    ├── styles/             # Global CSS and Tailwind entry points
    ├── types/              # Shared TypeScript interfaces & types
    └── utils/              # Pure JavaScript utility functions
```

---

## 🛠️ Feature-First Principles

Each module in `src/features/` should follow a self-contained structure where practical:

```text
src/features/payment/
├── components/             # Components specific only to payments (e.g., PaymentCard)
├── hooks/                  # Feature hooks (e.g., usePaymentMutation)
├── store/                  # Localized Zustand slice or stores
├── types.ts                # TypeScript types for the payment module
├── services.ts             # API client calls related to payments
└── index.ts                # Public API (exporting only what the rest of the app needs)
```

### Dependency Rules:
1. **No direct cross-feature imports**: If `Feature A` needs components/hooks from `Feature B`, those dependencies should either:
   - Be imported via `Feature B`'s public entry point (`index.ts`).
   - Be refactored and extracted to global folders (`src/components/`, `src/hooks/`) if they are genuinely reusable.
2. **Absolute Imports**: Always use the path alias `@` (e.g., `import { Button } from '@/components/common/Button'`) rather than relative backtracking paths.

---

## 📝 Design Tokens & Premium Aesthetic

Custom colors and typography are integrated within `tailwind.config.ts`:
- **Brand Colors**: Sleek forest greens (`brand`) and premium warm earth tones (`accent`) to reflect GoodEarth's identity.
- **Typography**: Inter (modern sans-serif for UI readability) and Outfit (geometric sans-serif for headlines/cards).
- **Animations**: Framer Motion is pre-configured to handle route transitions and responsive panel interactions.

---

## 💻 Commands

> [!NOTE]
> Run commands from the `apps/frontend` directory or using your workspace executor.

| Command | Action |
| --- | --- |
| `npm run dev` | Starts the local Vite development server |
| `npm run build` | Compiles TypeScript and builds production bundles |
| `npm run preview` | Runs the compiled production build locally |
| `npm run lint` | Runs ESLint analysis for syntax and styling guidelines |
| `npm run format` | Runs Prettier to format code files |

---

## 🔒 Environment Configuration

Duplicate `.env.example` to `.env` in the root of the app to configure your development server:

```bash
cp .env.example .env
```
