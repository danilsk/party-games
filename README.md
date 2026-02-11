# Party Games

A mobile-first social party games app powered by AI. Pick a game, configure it, and play with friends — all from a single phone passed around the room.

## Games

- **Charades** — Act out AI-generated words. Hold to peek at your word, then perform it for your team.
- **Taboo** — Describe the target word without using any of the forbidden words. Race against the clock.
- **Undercover** — Everyone gets a secret word, but one player's word is slightly different. Discuss, deduce, and vote to find the spy.

## Setup

```bash
npm install
npm run dev
```

On first launch, you'll be prompted for an [OpenRouter API key](https://openrouter.ai/keys). The key is stored in your browser's localStorage and never sent anywhere except OpenRouter.

## Deploying

### GitHub Pages

1. In `vite.config.ts`, set the `base` to your repo name:

   ```ts
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react(), tailwindcss()],
   })
   ```

2. Create `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm
         - run: npm ci
         - run: npm run build
         - uses: actions/configure-pages@v4
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

3. In your GitHub repo settings, go to **Pages** and set the source to **GitHub Actions**.

4. Push to `main` — the site will be live at `https://<user>.github.io/<repo>/`.

### Cloudflare Pages

1. Push your repo to GitHub (no `base` change needed — leave it as default `/`).

2. Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/?to=/:account/pages) and click **Create application → Connect to Git**.

3. Select your repository and configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

4. Click **Save and Deploy**. Cloudflare will build and deploy on every push to `main`.

Your site will be available at `https://<project>.pages.dev` (or a custom domain if you configure one).

## Tech Stack

- React + TypeScript (Vite)
- Tailwind CSS v4
- OpenRouter API for LLM-powered word generation
