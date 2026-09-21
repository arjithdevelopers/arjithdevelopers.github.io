# Arjith Property Developers website

Static website served at https://arjithdevelopers.github.io/ by GitHub Pages from the root of `main`.

- `/`: company website.
- `/anugraha/`: the Anugraha 3D property tour, including exterior, furnished floor plan, apartment walkthroughs and expandable position map.
- `/legacy/`: archived company website.

## Anugraha subsite

The tour is self-contained static HTML, CSS and JavaScript. Its fonts, Three.js modules, 2K materials and furniture are bundled under `anugraha/`, with asset credits and licenses retained. All runtime URLs are relative so the subsite works beneath the GitHub Pages domain. No build step, API key or server component is required.

The tour follows the supplied brochure with illustrative interiors. It preserves the completed circulation fixes: wall-mounted televisions, fewer and shallower wardrobes, clear bedroom approaches, and collision-aware walking. Before integration, a continuous browser walkthrough passed all 30 destinations and 19 additional bedroom checkpoints across 52 walking legs.

To preview the website and subsite together:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Open `http://127.0.0.1:4174/` and follow **Anugraha 3D tour**, or open `http://127.0.0.1:4174/anugraha/` directly. The tour header links back to the company website.

Push static-file changes to `main` to trigger the existing GitHub Pages deployment. `.nojekyll` preserves direct asset serving. No custom domain is configured: do not add a `CNAME` file unless a domain migration is intended.
