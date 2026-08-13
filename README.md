# Work Productivity AI

Final Vercel-ready version of the supplied Work Productivity AI project. The existing pages, tools, wording and workflow are preserved; the visual theme is upgraded to a brighter, stronger colour system and the app is packaged as a normal Vite/React site.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Vercel deployment

1. Import this folder/repository into Vercel.
2. Vercel will detect Vite automatically.
3. Add `ANTHROPIC_API_KEY` under Project Settings → Environment Variables.
4. Optionally add `ANTHROPIC_MODEL`.
5. Deploy.

The Anthropic key is kept server-side in `/api/ai.js`; it is not shipped to the browser.

User state is stored in browser `localStorage`, replacing the original host-specific `window.storage` dependency so the project works as a normal hosted website.
