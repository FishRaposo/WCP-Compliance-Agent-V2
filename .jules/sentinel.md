## 2026-04-18 - Prevent Stack Trace Leakage in API Errors
**Vulnerability:** The application was inadvertently including internal stack traces in the `details` object returned by the global error handler (`src/utils/errors.ts`), exposing sensitive implementation details.
**Learning:** Even though the main `formatApiError` wrapper didn't expose these directly, instances of `WCPError` serialize their internal `details` property. Stack traces should never be serialized into properties that might eventually become part of an HTTP response payload.
**Prevention:** Remove `error.stack` from globally shared error objects. Instead, log stack traces directly on the server side (e.g., in the API handler `src/app.ts`) where it can be securely captured by observability tools without reaching the client.

## 2026-04-18 - Secure Defaults in Web Frameworks
**Vulnerability:** The application did not employ standard HTTP security headers to protect against common web vulnerabilities like XSS, clickjacking, and MIME-sniffing.
**Learning:** Web frameworks often require explicit middleware to set basic security headers.
**Prevention:** Always implement security headers middleware (e.g., `secureHeaders()` in Hono or `helmet()` in Express) globally before other application routes.
