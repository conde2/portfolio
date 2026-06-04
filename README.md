# Joao Pasqualini Costa — Game Developer Portfolio

A single-page portfolio for a senior game developer, focused on backend, real-time
networking and tooling. Static site — plain HTML/CSS/JS, no build step.

**Live:** https://conde2.github.io/portfolio/

## Structure

```
index.html      # all content (hero, games, stack, experience, contact)
styles.css      # dark game-dev theme, responsive
script.js       # nav, scroll reveal, screenshot lightbox
assets/games/   # game covers & The Last Magic screenshots
.nojekyll       # tells GitHub Pages to serve folders as-is
```

## Run locally

Just open `index.html` in a browser, or serve it:

```bash
python -m http.server 8000
# visit http://localhost:8000
```

## Deploy to GitHub Pages

This repo's remote is already `github.com/conde2/portfolio`, so:

1. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "Add game developer portfolio"
   git push origin main
   ```
2. On GitHub: **Settings → Pages**.
3. Under **Build and deployment → Source**, pick **Deploy from a branch**.
4. Set **Branch** to `main` and folder to `/ (root)`, then **Save**.
5. Wait ~1 minute. Your site is live at **https://conde2.github.io/portfolio/**.

### Optional: custom domain
Add a `CNAME` file containing your domain (e.g. `joaocosta.dev`), push, then set the
same domain under Settings → Pages → Custom domain and update your DNS.

## Updating content
- **Text / sections** → edit `index.html`.
- **Add a game** → drop images in `assets/games/<name>/` and copy a `<article class="game">` block.
- **Colors / layout** → tweak the CSS variables at the top of `styles.css`.
