# CareKaro

CareKaro is an AI-powered personal health management platform that lets users upload medical reports, get instant AI analysis, track health trends over time, and connect with family members and doctors — all in one place.

**Live Demo:** [https://dream-weave-studio-84.vercel.app](https://dream-weave-studio-84.vercel.app)

---

## Features

### For Patients
- **Medical Report Upload & Analysis** — Upload lab reports and get AI-powered plain-language summaries, key findings, and risk indicators
- **Health Trends** — Visualize health parameters over time with interactive charts
- **Health Tools** — 20+ built-in tools including:
  - Mental health check-in
  - Symptom checker
  - BMI & blood pressure tracker
  - Sleep, fitness, and water tracker
  - Period & ovulation predictor
  - Testosterone analyzer
  - Safe medicines checker (pregnancy)
  - Vision tracker, libido tracker, substance tracker, and more
- **Specialist Recommendations** — AI-suggested specialists based on report findings
- **Report Sharing** — Share reports via secure public links or directly with doctors
- **Family Dashboard** — Connect with family members using invite codes or QR codes, and manage health sharing permissions
- **Doctor Reports Inbox** — Receive and view reports sent directly by your doctor

### For Doctors
- **Doctor Dashboard** — Overview of patients and sent reports
- **Send Reports** — Send medical reports with observations, remarks, and follow-up advice directly to patients
- **Reports Inbox** — Track all reports sent to patients

### For Admins
- **Platform Analytics** — User growth, report activity, and system health metrics
- **Doctor Management** — Approve, reject, or suspend doctor registrations
- **Audit Logs** — Full audit trail of user actions
- **Suspicious Activity Detection** — Automated detection of anomalous patterns with email alerts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI | Google Gemini 2.5 Flash via OpenRouter |
| Email | Resend |
| Payments | Razorpay |
| Notifications | WhatsApp (via webhook) |
| Error Tracking | Sentry |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin panel components
│   ├── auth/           # Auth guards and form components
│   ├── dashboard/      # Role-specific dashboard widgets
│   ├── health/         # Trend charts and selectors
│   ├── health-tools/   # Individual health tool components
│   ├── landing/        # Landing page sections
│   ├── layout/         # Header, footer, sidebar, layout wrapper
│   ├── payments/       # Razorpay checkout
│   ├── profile/        # Profile and settings components
│   ├── recommendations/# Specialist recommendation UI
│   ├── reports/        # Report viewer, share modal, upload progress
│   └── ui/             # shadcn/ui base components
├── contexts/           # AuthContext
├── hooks/              # Custom hooks
├── integrations/       # Supabase client and generated types
├── lib/                # Utilities, auth helpers, export, storage
├── pages/
│   ├── auth/           # Login, SignUp, PasswordReset, EmailVerification, etc.
│   ├── doctor/         # Doctor dashboard, send report, inbox
│   ├── family/         # Family dashboard, add/join member, preferences
│   └── ...             # Dashboard, HealthTools, Trends, Admin, etc.
└── services/           # Data access layer (Supabase queries)

supabase/
└── functions/
    ├── analyze-medical-report/   # AI report analysis
    ├── create-doctor-account/    # Doctor registration
    ├── delete-account/           # Account deletion
    ├── detect-suspicious/        # Anomaly detection + admin alerts
    ├── family-linking/           # Invite code validation
    ├── get-user-email/           # Service-role email lookup
    ├── health-tools/             # AI health tool processing
    ├── promote-to-doctor/        # Admin: promote user to doctor
    ├── send-notification-email/  # Transactional emails via Resend
    ├── view-shared-report/       # Public shared report access
    ├── whatsapp-send/            # WhatsApp message sending
    └── whatsapp-webhook/         # WhatsApp webhook handler
```

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A [Supabase](https://supabase.com) project
- An [OpenRouter](https://openrouter.ai) API key (for AI features)
- A [Resend](https://resend.com) API key (for emails)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/carekaro.git
cd carekaro

# Install dependencies
npm install
# or
bun install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SENTRY_DSN=your_sentry_dsn
```

### Supabase Edge Function Secrets

Set these secrets in your Supabase project dashboard or via the CLI:

```bash
supabase secrets set AI_API_KEY=your_openrouter_api_key
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set DASHBOARD_URL=https://your-deployment-url.vercel.app
```

### Run Locally

```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`.

### Build for Production

```bash
npm run build
```

---

## Deployment

The project is configured for Vercel. The `vercel.json` rewrites all routes to `/` for client-side routing.

```bash
vercel deploy
```

After deploying, update the `DASHBOARD_URL` Supabase secret to your production URL.

---

## User Roles

| Role | Access |
|---|---|
| `patient` | Dashboard, health tools, report upload/analysis, family, doctor inbox |
| `doctor` | Doctor dashboard, send reports to patients |
| `admin` | Full platform access including analytics, doctor management, audit logs |

---

## Database Migrations

All migrations are in `supabase/migrations/`. Apply them via:

```bash
supabase db push
```

---

## License

This project is private and not licensed for public use or redistribution.
