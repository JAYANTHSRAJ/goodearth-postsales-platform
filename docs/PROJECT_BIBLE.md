# GoodEarth Post-Sales Platform: Project Bible

## 1. Product Vision

The GoodEarth Post-Sales Platform is the operational backbone for managing the customer journey after booking and through handover. It exists to give GoodEarth teams a reliable, secure, and auditable system of execution for post-sales operations, while integrating cleanly with the systems that already support customer acquisition, payments, and enterprise data.

The platform should become the trusted internal source for post-booking workflow visibility, customer status tracking, payment context, and handover readiness. It must be designed for long-term maintainability, predictable scaling, and disciplined integration with Zoho CRM, Razorpay, and MySQL.

## 2. Mission

Build an enterprise-grade post-sales platform that helps GoodEarth teams manage customers consistently from booking to handover.

The mission is to:

- Provide a structured system for post-sales execution.
- Maintain accurate customer and booking context across integrated systems.
- Improve operational visibility for teams responsible for customer progress.
- Support secure payment-related workflows through Razorpay integration.
- Establish engineering practices that allow AI-assisted development without compromising review quality, security, or architectural consistency.

## 3. Business Problem

Post-sales delivery depends on coordination across customer-facing, finance, operations, and handover activities. Without a dedicated platform, teams risk fragmented information, inconsistent workflow tracking, weak auditability, delayed handovers, and manual reconciliation across CRM and payment systems.

The business problem is not only technical. It is an operational reliability problem: GoodEarth needs a dependable system that keeps customer journey data consistent from booking until handover, while respecting the boundaries and responsibilities of external systems such as Zoho CRM and Razorpay.

## 4. Business Goals

- Establish a reliable post-sales operating platform for GoodEarth.
- Improve visibility into the customer journey after booking.
- Reduce manual coordination effort between CRM, payment, and post-sales teams.
- Maintain clean integration boundaries with Zoho CRM and Razorpay.
- Protect customer, payment, and operational data through secure engineering practices.
- Create a codebase that can be safely extended by engineering teams and AI-assisted development workflows.
- Support production-grade observability, auditability, and operational support.

## 5. User Roles

The platform should recognize clear role boundaries. Actual permissions must be defined through business-approved access-control requirements.

| Role | Primary Responsibility |
| --- | --- |
| Customer | Views relevant post-booking journey information where customer-facing access is implemented. |
| Sales / CRM Team | Owns booking-originated customer context and CRM alignment. |
| Post-Sales Operations Team | Manages the customer journey from booking through handover readiness. |
| Finance Team | Reviews payment context and reconciles payment-related operational states. |
| Handover Team | Tracks readiness and completion of handover-related activities. |
| Administrator | Manages platform configuration, users, roles, and operational controls. |
| Engineering / Support | Maintains the platform, monitors production behavior, and supports incident resolution. |

## 6. Core Modules

Core modules should be implemented only where validated by product requirements and operational workflows.

| Module | Purpose |
| --- | --- |
| Customer Journey Management | Tracks customer progress from booking to handover using clear lifecycle states. |
| Booking Context | Maintains post-booking customer and unit context received from source systems. |
| Zoho CRM Integration | Synchronizes approved customer and booking-related data with Zoho CRM through controlled APIs and integration jobs. |
| Razorpay Integration | Handles payment-related integration requirements, webhook processing, and reconciliation support without storing sensitive payment credentials. |
| User and Access Management | Provides authentication, authorization, role-based permissions, and administrative user controls. |
| Workflow and Status Tracking | Represents operational steps, ownership, state transitions, and exceptions in the post-sales process. |
| Audit and Activity History | Records important system and user actions for traceability, support, and compliance review. |
| Reporting and Operational Visibility | Provides internal visibility into journey status, pending actions, and operational exceptions where required. |
| Platform Administration | Manages configuration, integration health, operational controls, and system settings. |

## 7. Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL |
| CRM Integration | Zoho CRM APIs |
| Payments Integration | Razorpay APIs and webhooks |
| API Style | RESTful HTTP APIs unless a different style is explicitly approved |
| Package Organization | Monorepo-style structure using `apps/`, `packages/`, and supporting directories |
| Documentation | Markdown under `docs/` |

Technology choices should favor stability, observability, ecosystem maturity, and straightforward hiring and maintenance.

## 8. Engineering Principles

- **Domain clarity first:** Code should reflect the business language of booking, customer journey, payment context, and handover.
- **Integration boundaries are explicit:** Zoho CRM and Razorpay interactions must be isolated behind dedicated integration layers.
- **Type safety by default:** TypeScript should be used consistently across frontend, backend, shared packages, and integration contracts.
- **Security is part of design:** Authentication, authorization, secrets handling, and auditability must be designed before production rollout.
- **Small, reviewable changes:** Changes should be scoped, tested, and easy to reason about.
- **Operational reliability:** Production behavior must be observable through logs, metrics, health checks, and actionable error reporting.
- **Data correctness over convenience:** Customer, booking, and payment states must not be guessed or silently overwritten.
- **Idempotency for external events:** Webhooks and integration sync jobs must tolerate retries and duplicate delivery.
- **Backward compatibility:** API and database changes must consider deployed clients, migration safety, and rollback strategy.
- **AI-assisted, human-owned engineering:** AI may accelerate implementation and documentation, but engineers remain accountable for correctness, security, and maintainability.

## 9. Repository Structure

Current top-level structure:

```text
goodearth-postsales-platform/
  .github/              # CI, pull request templates, and GitHub automation
  agents/               # AI agent instructions, operating procedures, or automation assets
  apps/                 # Deployable applications such as API and web frontend
  database/             # Database schema, migrations, seeds, and database documentation
  docs/                 # Architecture, requirements, workflows, API, deployment, and integration docs
  packages/             # Shared libraries, types, utilities, and cross-app modules
  prompts/              # Reusable prompts for AI-assisted development workflows
  scripts/              # Developer, build, migration, and operational scripts
  tasks/                # Task definitions, planning notes, or delivery artifacts
  README.md             # Project overview and onboarding entry point
```

Recommended documentation layout:

```text
docs/
  api/                  # API contracts and endpoint documentation
  architecture/         # System design, ADRs, data flow, and integration boundaries
  deployment/           # Environment, release, rollback, and operational runbooks
  integrations/         # Zoho CRM and Razorpay integration specifications
  requirements/         # Product and business requirements
  workflows/            # Booking-to-handover workflow documentation
  PROJECT_BIBLE.md      # Project operating charter
```

As the project matures, each deployable app should have its own local README covering setup, commands, environment variables, and ownership.

## 10. AI Development Workflow

AI-assisted development is allowed, but it must be governed. AI output is not a substitute for engineering ownership.

Required workflow:

1. Start from documented requirements, accepted issues, or approved architecture notes.
2. Ask AI tools for scoped implementation help, analysis, tests, or documentation.
3. Review generated code manually before committing.
4. Verify architecture boundaries, security implications, and data correctness.
5. Run formatting, linting, type checks, and relevant tests.
6. Include human-written pull request context explaining the change, risks, and verification.
7. Do not commit secrets, customer data, tokens, production exports, or confidential business material into prompts, logs, or repository files.

AI may be used for:

- Drafting documentation.
- Generating test cases.
- Explaining unfamiliar code.
- Refactoring within a clearly defined scope.
- Creating boilerplate that follows existing project patterns.
- Reviewing code for edge cases and security concerns.

AI must not be used as the sole authority for:

- Security-sensitive design decisions.
- Payment handling logic.
- Authorization rules.
- Database migration safety.
- Production incident decisions.
- Business policy interpretation.

## 11. Coding Standards

- Use TypeScript in strict mode wherever practical.
- Prefer clear domain names over generic abstractions.
- Keep controllers thin; place business logic in services or domain modules.
- Keep integration clients isolated from core business logic.
- Validate all external input at API and integration boundaries.
- Use structured error handling and avoid leaking sensitive details to clients.
- Avoid global mutable state except for deliberate infrastructure concerns.
- Use environment-based configuration and never hardcode secrets.
- Keep frontend components focused, typed, and accessible.
- Prefer shared types and contracts where they reduce duplication without coupling unrelated modules.
- Write tests for business logic, integration boundaries, critical workflows, and regression-prone behavior.
- Document non-obvious decisions using architecture decision records or focused markdown notes.

## 12. Git Workflow

- Work from short-lived feature branches.
- Keep commits focused and reviewable.
- Use pull requests for all changes entering shared branches.
- Require code review before merge.
- Run required checks before requesting review.
- Use clear commit messages describing the intent of the change.
- Do not rewrite shared branch history unless explicitly coordinated.
- Keep generated files, build output, secrets, and local environment files out of version control.
- Record significant architectural decisions in `docs/architecture/`.

Suggested branch naming:

```text
feature/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
```

Suggested pull request expectations:

- Business or technical context.
- Summary of changes.
- Testing performed.
- Migration or deployment notes, if applicable.
- Security or data impact, if applicable.
- Screenshots or API examples where useful.

## 13. Security Principles

- Apply least-privilege access across users, services, databases, and integration credentials.
- Store secrets only in approved secret-management or environment configuration systems.
- Never commit API keys, Razorpay secrets, Zoho credentials, database passwords, or customer exports.
- Validate and sanitize all inbound API requests and webhook payloads.
- Verify Razorpay webhook signatures before processing events.
- Treat Zoho CRM and Razorpay integrations as untrusted network boundaries.
- Use role-based authorization for internal workflows and administrative operations.
- Protect personally identifiable customer information through access controls and audit trails.
- Encrypt sensitive data in transit using TLS.
- Avoid storing sensitive payment data unless explicitly required and approved.
- Make integration event handling idempotent and replay-safe.
- Log enough for support and auditability, but do not log secrets, tokens, payment credentials, or unnecessary personal data.
- Maintain dependency hygiene through regular updates, vulnerability scanning, and dependency review.

## 14. Definition of Done

A change is done only when it satisfies the engineering and product expectations for production readiness.

Minimum definition:

- Requirement or task acceptance criteria are met.
- Code follows project architecture and naming conventions.
- Type checks pass.
- Linting and formatting pass.
- Relevant automated tests are added or updated.
- Existing relevant tests pass.
- API, workflow, or integration documentation is updated when behavior changes.
- Database migrations are reversible or have an approved forward-only strategy.
- Integration behavior is idempotent where retries are possible.
- Security impact has been considered and documented for sensitive changes.
- Error handling and logging are appropriate for production support.
- Pull request is reviewed and approved.
- Deployment, rollback, and operational notes are included when needed.

## 15. Future Roadmap

The roadmap should remain tied to approved GoodEarth business priorities. The following areas define the likely evolution of the platform without prescribing unapproved features.

- Finalize detailed requirements for the booking-to-handover customer journey.
- Define canonical lifecycle states and ownership rules.
- Establish Zoho CRM data mapping, sync direction, conflict strategy, and failure handling.
- Establish Razorpay payment event handling, reconciliation expectations, and webhook processing rules.
- Design the MySQL schema for customer, booking, workflow, payment context, audit, and user access data.
- Define authentication and authorization architecture.
- Build production-grade API and frontend application foundations.
- Add observability, health checks, error monitoring, and operational runbooks.
- Expand automated test coverage around core workflows and integration boundaries.
- Create architecture decision records for major technical decisions.
- Define deployment environments, release process, backup strategy, and rollback process.
- Mature AI-assisted development practices with reusable prompts, review checklists, and guardrails.

This document should be reviewed whenever business workflow, integration ownership, security posture, or repository architecture changes materially.
