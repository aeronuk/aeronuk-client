# aeronuk-client

Angular 20 frontend for the AeroNuk distributed airline booking platform.

## Development

```bash
npm install
npm start          # ng serve with proxy to localhost:80
```

Open http://localhost:4200.

The dev proxy (`proxy.conf.json`) forwards `/api/*` to the aeronuk-ops nginx at `http://localhost:80`, which routes to each backend service. Run `docker compose up` in `aeronuk-ops` first.

## Tests

```bash
npm test                                          # watch mode
npx ng test --watch=false --browsers=ChromeHeadless  # CI mode
```

## Docker

```bash
docker compose up --build
```

The container serves the built Angular app on port 4200. In the full stack (`aeronuk-ops`), nginx proxies the Angular app and routes `/api/*` to the correct services.

## Future Work

- **E2E testing with Playwright**: add a `e2e/` directory with Playwright tests covering the full wizard flow (search → book → pay) against the Docker stack. See [Playwright docs](https://playwright.dev).
