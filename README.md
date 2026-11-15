# GitDebate — Debate Arena

> Challenge AI, sharpen your mind. An interactive debate practice platform where you argue against Google Gemini 2.0 Flash in real time.

## What it is

Pick a topic, choose your side, and debate an AI that never gets tired. GitDebate is a debate practice arena: you argue **For** or **Against** a motion, and the AI argues the other side.

- **Topic selection** — predefined motions, or bring your own custom topic
- **Difficulty levels** — Beginner, Intermediate, Advanced
- **Position choice** — argue For or Against; the AI takes the opposite stance
- **Real-time AI debate** — message exchange with Google Gemini 2.0 Flash, using position-based argument generation
- **10-minute session timer** — every debate runs against the clock
- **Score tracking** — your argument count is tracked through the session
- **Results summary** — post-debate statistics when the session ends
- **Dark / light theme** and a responsive layout (mobile, tablet, desktop)

## Tech stack

- **React 18 + TypeScript + Vite** — UI, type safety, build tooling
- **Tailwind CSS + shadcn/ui (Radix primitives)** — design system
- **React Router** — client-side routing
- **TanStack React Query** — server state
- **React Hook Form + Zod** — forms and schema validation
- **Lucide icons, Sonner toasts, next-themes**

## Getting started

```bash
git clone https://github.com/sarvasva-dev/gitdebate.git
cd gitdebate
npm install
npm run dev
```

Then open the URL Vite prints in the terminal.

```bash
npm run build    # production build
npm run preview  # preview the production build locally
npm run lint     # eslint
```

## Configuration

The app calls the Gemini API directly from the browser. The API key lives in `src/pages/Index.tsx` (`GEMINI_API_KEY`) — replace it with your own key from Google AI Studio. Never commit a production key; for production, move API calls behind a backend service.

## Deployment

Static site — `vercel.json` is included for Vercel. It also works on Netlify or GitHub Pages (`npm run deploy`).

## Roadmap

- User authentication and debate history
- Human-vs-human multiplayer debates
- Advanced analytics and performance tracking
- Voice input
- Mobile app

## License

MIT
