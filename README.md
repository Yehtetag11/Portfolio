# Ye Htet Aung — Portfolio

A single-page, dark-first developer portfolio. No build step, no dependencies.

## Open it

Just open `index.html` in a browser, or in VS Code:

1. Install the **Live Server** extension (if you don't have it).
2. Right-click `index.html` → **Open with Live Server**.

That's it — plain HTML/CSS/JS.

## Project structure

```
index.html          everything: markup, styles, and scripts
assets/profile.jpg   your photo, used in the hero
```

## Editing content

All the content lives directly in `index.html` — search for the section you want:

- `id="home"` — hero intro, headline, featured build card
- `id="about"` — bio + quick facts
- `id="education"` — education timeline
- `id="projects"` — project cards
- `id="technologies"` — tech stack pills
- `id="contact"` — email / phone cards
- `<footer>` — footer links

To swap your photo, just replace `assets/profile.jpg` with a new image of the same name (a square image, ~640×640px, works best).

## Features

- Dark theme by default, with a light/dark toggle in the nav (top-right icon) that does a circular reveal animation on click. Falls back to an instant switch on browsers without View Transitions support, and is skipped entirely if the visitor has "reduce motion" turned on.
- Scroll-triggered reveal animations via `IntersectionObserver`.
- Fully responsive down to small phones.
- No external JS frameworks — just vanilla CSS and JS.

## Deploying

Since it's a static file, you can drop it straight onto any static host: GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc. Just make sure `index.html` and the `assets/` folder stay together.
