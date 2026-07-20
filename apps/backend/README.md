# Backend Package

This package contains the GoodEarth post-sales backend built with Node.js, Express, and TypeScript.

Structure goals:

- Keep business logic inside domain modules.
- Isolate external integrations behind dedicated adapters.
- Keep shared infrastructure concerns separate from domain code.
- Preserve a clean path for tests, scripts, and deployments.

No business logic is implemented in this scaffold.
