# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
## Server Instructions

To start the server, run the following command:
```
npm run dev
```

## Testing Instructions

To run tests, use the following command:
```
npm test
```

## Stripe webhooks (local development)

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Start the local server: `npm run server` (uses `STRIPE_SECRET_KEY` from `.env`)
3. Forward events to your local webhook endpoint:

```bash
stripe listen --forward-to localhost:4242/webhook
```

4. Use the Stripe test card 4242 4242 4242 4242 for successful payments in Checkout.

