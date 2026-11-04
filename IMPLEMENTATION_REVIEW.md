# AirVoice — Implementation review and delivery notes

## Inputs reviewed

- Candidate's handwritten journey: public dashboard; subscriber login with mobile/email OTP; logged-in dashboard; optional subscribe/payment entry.
- Candidate's flowchart: active subscriber checks, OTP verification, billing, itemized charges, downloads, demo UPI QR, confirmation, persistent mock payment history.
- Candidate's previous archive `new-project-main.zip`: Create React App UI, Express/Mongoose API, Mailpit OTP, billing pages, invoice generation and in-memory fallback.
- Company's two-page assessment: self-service subscriber portal; registered mobile + OTP; bill list and itemized services; per-bill payments; PDF/Excel/CSV; fake QR; spreadsheet **or PostgreSQL**; documented assumptions and AI assistance.

## Key corrective decisions

1. Preserve existing subscriber portal scope and interactions; present them with a unified navigation and a refined visual system rather than copy an external GitHub template.
2. Replace MongoDB + in-memory fallback with PostgreSQL, a permitted data source. Seed two active and one inactive account, plus monthly bills and prior payments.
3. Avoid leaking the OTP via an API `devOtp` field. Send it only to Mailpit; hash it in PostgreSQL with expiry and an attempt limit.
4. Calculate total due directly from bill service charges and payment records, rather than trusting a manually updated state string.
5. Lock the corresponding bill row during settlement to prevent simultaneous mock confirmations from double-paying the same invoice.
6. Build separate, subscriber-scoped API routes for bills, payments, invoice downloads and demo QR generation.
7. Use a nonpayable demonstration UPI recipient (`demo.airvoice.invalid@upi`) and explicit 'no real money' language.
8. Keep the user's requested public introduction but do not create an unrelated telecom plan purchase flow, which was not required in the assessment.
9. Label Excel export correctly as `.xlsx` even though the assessment says `.xls`; this is a known format limitation.
10. Provide source and realistic offline UI design previews; do not imply screenshots are from a running connected database.

## Page map

| Path | Experience |
|---|---|
| `/` | Public brand/marketing overview and subscriber sign-in CTA |
| `/login` | Mobile entry → OTP request → OTP verification via Mailpit |
| `/dashboard` | Account overview, outstanding, billing summary, current breakdown |
| `/bills` | Monthly bill list, search, status filter |
| `/bills/:id` | Itemized charges, payment entries, statement downloads |
| `/bills/:id/pay` | Demonstration QR and mock payment confirmation |
| `/payments` | All recorded payment history |

## Usability / design

- Navy-and-blue brand identity with original wordmark concept
- Clear account header and focused sidebar
- Summary cards with legible monetary values
- Bills show paid/unpaid status and outstanding balance separately
- Invoice detail separates service breakdown from downloads and payments
- Mock payment warning is visible next to the QR and confirmation CTA
- Responsive breakpoints for tablet and mobile
- Consistent empty, error and loading states

## Verification performed in this environment

- Backend passed Node.js syntax check.
- Frontend JSX passed TypeScript's transpile diagnostics with no syntax errors.
- Six styled static layout previews were rendered through Chromium from included CSS and sample HTML.
- npm dependency installation was blocked/timed out in this sandbox, so a real frontend build and complete PostgreSQL/Mailpit HTTP integration test **have not been run**.

Before submission, execute the README installation steps on your computer, then complete the manual verification checklist in README. Do not claim that end-to-end tests passed until you have personally run them.
