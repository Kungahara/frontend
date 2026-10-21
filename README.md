<div align="center">
  <img src="public/images/kungahara-logo.png" alt="Kungahara logo" width="88" />
  <h1>Kungahara Frontend</h1>
  <p><strong>A clear view of your business, from stock to sales.</strong></p>
  <p>Next.js 16 · React 19 · TypeScript · English / French / Kinyarwanda</p>
</div>

---

The web application for **Kungahara**, bringing inventory, sales, documents, finance, and team management into one workspace. Owners manage the business; members work with shared stock and their own sales and documents.

**Explore:** [Features](#features) · [Quick start](#quick-start) · [Configuration](#configuration) · [Development](#development) · [Deployment](#deployment)

## Features

| Workspace | What it offers |
| --- | --- |
| **Dashboard** | Stock purchases, sales summaries, and recent activity. |
| **Stock** | Shared product inventory, stock values, availability, and selling-item summaries. |
| **Sales** | Record sales, review history, and view owner analytics. |
| **Finance** | Owner-only financial workspace. |
| **My docs** | Image documents organized into shared folders, with member uploads scoped to their account. |
| **Settings** | Profile, appearance, language, team controls, and owner report exports. |
| **Notifications** | Business alerts, owner approvals, and downloadable daily member reports. |

The interface supports light and dark themes. Member sales and activity are filtered by the backend; hiding a control is not the permission boundary.

## Quick start

**You will need:** Node.js and npm compatible with the installed Next.js version, plus the Django API running on port **8000**.

Run these commands from the frontend directory:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

If `.env.local` already exists, edit it instead of copying over it.

Open **[localhost:3001](http://localhost:3001)**. The development command binds to `0.0.0.0` so the app can also be reached from your local network.

> **Start the API first.** The frontend forwards application requests to Django. A running Next.js server alone cannot load your business data.

## Configuration

Use [.env.example](.env.example) as the configuration reference.

| Variable | Purpose | Local value |
| --- | --- | --- |
| `API_URL` | Server-side Django API address; takes precedence over the public fallback. | `http://127.0.0.1:8000/api` |
| `NEXT_PUBLIC_API_URL` | API address fallback. | `http://127.0.0.1:8000/api` |
| `AUTH_COOKIE_SECURE` | Enables secure authentication cookies when set to `true`. | `false` for local HTTP |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in client ID. | Optional |
| `NEXT_PUBLIC_MICROSOFT_CLIENT_ID` | Microsoft sign-in client ID. | Optional |

Provider secrets, database credentials, and Cloudinary credentials belong on the backend. Never place secrets in a `NEXT_PUBLIC_*` variable.

## Development

### AI assistant

The bottom-right, icon-only assistant is available throughout the signed-in workspace, with English, French, and Kinyarwanda UI and light/dark themes. The conversation stays in memory while navigating and is cleared when the workspace unmounts or a new conversation is started.

To enable Grok replies, set `XAI_API_KEY` and `XAI_ASSISTANT_MODEL` in `.env.local` (or your hosting server environment), then restart Next.js. Create a key in the [xAI console](https://console.x.ai/) and choose a Grok model available to your account that supports the [xAI Responses API](https://docs.x.ai/developers/model-capabilities/text/generate-text). These variables are server-only; never prefix them with `NEXT_PUBLIC_`.

The authenticated `/api/assistant` route sends the conversation, selected language, and current page path to xAI with `store: false`. It does not send account details or fetch business records. This first version explains application features; it cannot read inventory, calculate live business totals, or make changes. Missing configuration and provider failures display a retryable message without fabricating a reply.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start development mode on port 3001. |
| `npm run build` | Create the production build and check TypeScript. |
| `npm start` | Serve the production build on port 3001. |
| `npm run lint` | Run ESLint. |
| `npx tsc --noEmit` | Check TypeScript without building. |
| `node --test tests/session-outage.test.cjs` | Verify that server outages preserve authentication sessions. |

### Project map

```text
src/
├── app/
│   ├── (auth)/          Sign-in and account verification pages
│   ├── (protected)/     Business workspace pages and layout
│   ├── (public)/        Marketing and legal pages
│   ├── api/             Server-side routes that forward requests to Django
│   └── globals.css      Application styles and themes
├── components/          Forms, tables, summaries, and shared controls
├── i18n/                Locale selection and translation loading
└── lib/                 API, authentication, formatting, and session helpers
messages/                English, French, and Kinyarwanda translations
public/                  Branding, images, and notification service worker
tests/                   Session recovery regression tests
```

### Request flow

```text
Browser → Next.js API routes → Django API → PostgreSQL
```

Authentication tokens are stored in HTTP-only cookies. API routes attach the access token when forwarding protected requests. Temporary backend failures return a retryable response instead of clearing the session.

Read [AGENTS.md](AGENTS.md) before agent-assisted changes. The installed Next.js package includes version-specific guidance in `node_modules/next/dist/docs/`.

## Deployment

1. Configure `API_URL` with the deployed Django API address, including `/api`.
2. Set `AUTH_COOKIE_SECURE=true` for HTTPS hosting.
3. Configure the corresponding frontend origin and OAuth credentials on the backend.
4. Run `npm run build`, then start the application with `npm start` or your hosting platform's Next.js integration.

Daily reports require the backend's migrations and report worker. Enabling a schedule in Settings does not start a worker on the hosting platform.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Connection interrupted or API `503` | Confirm Django is running and `API_URL` points to it. Retry when the API recovers. |
| Member receives `403` on finance or exports | These endpoints are owner-only. |
| Daily report schedule does not load | Apply the backend report migrations and inspect the API response. |
| Report does not arrive while the app is closed | Confirm the backend report worker is running. |
| Images fail to upload | Check backend Cloudinary configuration and upload size limits. |

---

<div align="center">
  <strong>Kungahara</strong><br />
  Stock, sales, and teamwork in one place.
</div>
