# Field Journal — Camping Trip Log

A static site for tracking camping/backpacking trips. Each trip has a location, checklist, photo gallery, and write-up. Drop a JSON file and a folder of photos to add a new trip — no build step, no framework, no database.

## Stack

- **Pure HTML/CSS/vanilla JS** — no build tooling, no npm install
- **Leaflet + OpenTopoMap** for trail maps (no API key required)
- **marked.js** for rendering trip write-ups from markdown
- **GitHub Pages + GitHub Actions** for deployment

## Project layout

```
.
├── index.html              # Trip list (home)
├── trip.html               # Trip detail page (loads ?slug=xxx)
├── assets/
│   ├── styles.css
│   └── app.js
├── data/
│   ├── trips.json          # Master index of trips
│   └── trips/
│       ├── snow-basin-2025.json
│       └── uintas-2024.json
├── images/
│   ├── snow-basin-2025/  # One folder per trip
│   └── uintas-2024/
├── .github/workflows/
│   └── deploy.yml          # Validates JSON + deploys to Pages
└── .nojekyll               # Tells GH Pages: don't run Jekyll
```

## Adding a new trip

1. Pick a slug (e.g. `wind-rivers-2026`). Use lowercase, hyphens.
2. Create `data/trips/wind-rivers-2026.json` (copy an existing one).
3. Add the trip to the top of `data/trips.json` (the index).
4. Create `images/wind-rivers-2026/` and drop photos in. Reference them by path in the JSON.
5. Commit and push. The pipeline does the rest.

### Trip JSON schema

```jsonc
{
  "slug": "wind-rivers-2026",
  "title": "Wind River Range",
  "subtitle": "Bridger-Teton National Forest, Wyoming",
  "dates": { "start": "2026-08-01", "end": "2026-08-04" },
  "location": {
    "name": "Titcomb Basin",
    "lat": 43.1,
    "lng": -109.65
  },
  "crew": ["Dad", "Older Bro", "Younger Bro"],
  "hero": "images/wind-rivers-2026/hero.jpg",
  "stats": {
    "distance_miles": 16,
    "elevation_ft": 3200,
    "nights": 3
  },
  "checklist": [
    {
      "category": "Shelter & Sleep",
      "items": [
        { "name": "Tent", "checked": true },
        { "name": "Sleeping bags", "checked": false }
      ]
    }
  ],
  "summary": "## Heading\n\nMarkdown goes here. Headings, lists, **bold**, *italic*, > quotes, all work.",
  "gallery": [
    "images/wind-rivers-2026/photo-1.jpg",
    "images/wind-rivers-2026/photo-2.jpg"
  ]
}
```

Fields are mostly optional. Bare minimum: `slug`, `title`, `dates.start`. Everything else gracefully omits if missing.

## Deploying

### One-time setup

1. Push this repo to GitHub.
2. In the repo: **Settings → Pages → Build and deployment**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`. The workflow runs and the site is live at `https://<username>.github.io/<repo>/`.

### How the pipeline works

`.github/workflows/deploy.yml` runs on every push to `main`:

1. **Validates** every JSON file (catches typos before they break the site).
2. **Uploads** the whole repo as a Pages artifact.
3. **Deploys** to GitHub Pages.

If JSON is malformed, the deploy fails before publishing. Check the Actions tab for errors.

## Running locally

The pages use `fetch()` for JSON, which most browsers block on `file://`. Run a quick local server:

```bash
# Python (already installed on most systems)
python3 -m http.server 8000

# Or Node
npx serve .
```

Then open <http://localhost:8000>.

## Customizing

- **Colors / fonts**: top of `assets/styles.css` (CSS variables in `:root`).
- **Map style**: `assets/app.js`, search for `tile.opentopomap.org`. Swap the URL for a different tile provider (OSM standard, CartoDB, etc.).
- **Sections / layout**: `assets/app.js` `renderTripDetail()` builds the page from the JSON. Reorder or add sections there.

## Notes

- Photos: resize to ~1600px wide before committing. Git is not a CDN.
- For lots of photos, consider an external image host (Cloudflare R2, S3, Imgix) and just put URLs in the gallery array — the code already handles full URLs.
- `.nojekyll` is required: without it, GitHub Pages tries to run Jekyll on your files and skips anything starting with `_`.
