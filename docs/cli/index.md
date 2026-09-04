# OpenPost CLI (`openpost-cli` v0.2.4)

> **Single bin:** `openpost-cli` only — always use `npx openpost-cli` (legacy alias `create-openpost` removed).

The OpenPost CLI allows you to connect any frontend application to your CMS in seconds through an automated browser handshake.

**Contact:** [officialopenpost@outlook.com](mailto:officialopenpost@outlook.com) for CLI support.

---

## Quickstart with `npx`

You do not need to install anything globally. Simply run:

```bash
npx openpost-cli
```

---

## Step-by-Step CLI Walkthrough

```
=======================================================
  OpenPost CLI — Full-Stack Blog Starter Generator
=======================================================

✔ Enter your OpenPost CMS URL: http://localhost:3000
✔ Connected to OpenPost CMS successfully.

Opening browser for authorization: http://localhost:3000/cli/connect
```

### 1. Enter Your CMS URL
Enter your deployed CMS URL (e.g. `https://cms.yourdomain.com`) or `http://localhost:3000` for local development.

### 2. Authorize in Browser
The CLI automatically opens your browser to `/cli/connect`. If you are logged into your CMS, it displays a one-time authorization code:

```
┌───────────────────────────────┐
│     OP-8492-9102-3841         │
└───────────────────────────────┘
```

### 3. Select Project & Template
Paste the code into the terminal prompt. Select your project and choose a starter template:
- `nextjs-blog` (Next.js 16 App Router + Tailwind CSS 4 + ContentRenderer)

### 4. Automatic Scaffolding & `.env.local`
The CLI scaffolds a complete frontend repository and automatically generates `.env.local`:

```env
OPENPOST_URL="http://localhost:3000"
OPENPOST_PROJECT_ID="550e8400-e29b-41d4-a716-446655440000"
OPENPOST_TOKEN="op_sec_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d..."
```

---

## Running Your Frontend Starter

```bash
cd my-blog
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view your live, fully-connected blog!
