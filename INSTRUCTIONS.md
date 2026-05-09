# Field Journal — Local Dev & Deploy

## Run locally

```powershell
cd "C:\code\field-journal"
python -m http.server 8080
```

Open http://localhost:8080 in your browser. Press Ctrl+C to stop the server.

## Deploy changes

```powershell
git add .
git commit -m "your message"
git push
```

Pushing to `main` triggers GitHub Actions, which deploys to https://sediket.github.io/field-journal/ automatically (takes ~1-2 minutes).

## Adding a trip

Two files are required for each new trip:

1. **Add an entry to `data/trips.json`** — this is the index card shown on the home page:
   ```json
   {
     "slug": "your-trip-slug",
     "title": "Trip Title",
     "subtitle": "Location, State",
     "date": "YYYY-MM-DD",
     "hero": "images/your-trip-slug/hero.jpg",
     "summary_short": "One sentence teaser shown on the home page."
   }
   ```

2. **Create `data/trips/your-trip-slug.json`** — the full trip detail. Use `data/trips/uintas-2024.json` as a reference.
