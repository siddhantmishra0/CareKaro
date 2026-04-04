import * as Sentry from "@sentry/react";

export function initSentry() {
  Sentry.init({
    dsn: "https://86d0cbfba70ce459be8c7a2e3ac926df@o4510991590227968.ingest.us.sentry.io/4510991591604224",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance monitoring: capture 20% of transactions in production
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,
    // Session replay: capture 10% of sessions, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Only send errors in production
    enabled: import.meta.env.PROD,
    environment: import.meta.env.DEV ? "development" : "production",
    // Filter out noisy errors
    ignoreErrors: [
      "ResizeObserver loop",
      "Non-Error promise rejection",
      "Network request failed",
    ],
  });
}

export { Sentry };
