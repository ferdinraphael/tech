# Ferdin Raphael — Technical Identity

A standalone technical identity site for Ferdin Raphael: software projects, published books and tools, remote services, and technical writing, connected through a responsive interactive constellation.

This repository contains validation CI and a GitHub Pages deployment workflow targeting [the Tech site](https://ferdinraphael.github.io/tech/) under `/tech/`. After the deployment workflow reaches `main`, a validated push to `main` can publish the site. A local build does not publish or change Pages settings; deployment and live-host verification must succeed before launch is considered complete.

## Current scope

- Complete responsive Overview route
- Typed, data-driven interactive constellation
- Neutral, featured, selected, and cleared interaction states
- Desktop contextual panel and in-flow mobile contextual details
- Little Worlds and Wildpath as public projects
- Built & Published shelves for C# Debugging Drills, SQL Data Cleaning Cookbook, EnvGuard, and RPG Data Forge
- Published writing: “When the Workaround Becomes the Architecture”
- Development-only draft previews, validated frontmatter, writing routes, active Contents navigation, and accessible code examples
- Three service categories with dedicated detail pages: Software Development, Technical Consulting, and Mentoring & Teaching; all services are remote
- Public navigation: Overview · Projects · Built & Published · Services · Writings
- Profile remains available by direct route but intentionally hidden from public navigation
- “Variables Are Simple — Until They Aren't” remains unchanged and draft-only
- Accessibility behavior, component tests, browser smoke tests, and build-only CI

Wildpath is a [public playable project](https://ferdinraphael.github.io/wildpath/). The Tech site intentionally provides no public source-repository action for it. Little Worlds remains the featured project.

Website in 2 Days is not a public service. Technical Content is not a standalone service.

## Technology

- React 19 and TypeScript
- Vite
- React Router with `BrowserRouter`
- SVG relationship layers plus semantic HTML node controls
- CSS Modules and a small global token layer
- Local IBM Plex Mono and Inter font packages
- Lucide React icons
- Marked, js-yaml, github-slugger, and focused Highlight.js grammars from npm
- Vitest, React Testing Library, and Playwright Chromium
- npm

The constellation deliberately does not use canvas, WebGL, Three.js, a graph layout engine, or a particle dependency.

## Local setup

Requirements:

- Node.js 24
- npm

```bash
npm ci
npm run dev
```

The development server serves the application with the `/tech/` base path. Follow the URL printed by Vite.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run typecheck` | Check the TypeScript project |
| `npm run lint` | Run Oxlint over application, tests, and configuration |
| `npm run test` | Run unit and component tests once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Type-check and create the production `/tech/` build |
| `npm run content:check` | Validate every published and draft Markdown writing |
| `npm run preview` | Serve the production output locally |
| `npm run test:e2e` | Run Playwright Chromium smoke tests against a production preview |
| `npm run test:writings-preview` | Run the bounded development-only writing review and capture screenshots |

## Routes

| Source route | Path under the configured base | Scope |
| --- | --- | --- |
| `/` | `/tech/` | Complete overview and constellation |
| `/profile` | `/tech/profile` | Profile; intentionally hidden from public navigation |
| `/projects` | `/tech/projects` | Little Worlds and Wildpath |
| `/built-and-published` | `/tech/built-and-published` | Bookshelf and Tool Shelf |
| `/services` | `/tech/services` | Three remote service categories |
| `/services/software-development` | `/tech/services/software-development` | Software Development |
| `/services/technical-consulting` | `/tech/services/technical-consulting` | Technical Consulting |
| `/services/mentoring-teaching` | `/tech/services/mentoring-teaching` | Mentoring & Teaching |
| `/writings` | `/tech/writings` | Published writing index; separate draft previews in development |
| `/writings/:slug` | `/tech/writings/:slug` | Reusable writing route or intentional writing-not-found state |
| `/notes`, `/notes/:slug` | matching `/tech/writings...` route | Replace-style compatibility redirects preserving slug, query, and hash |
| `/overview` | `/tech/overview` | Replace-style redirect to Overview |

Unknown paths render an intentional in-app 404.

## Base path and clean routing

`vite.config.ts` sets `base: '/tech/'`. `BrowserRouter` derives its basename from `import.meta.env.BASE_URL`, keeping local, test, and future Pages paths aligned.

The production build derives nine static route entry shells from the final Vite HTML, including `projects/index.html` and nested service/article entries. Each contains route-specific metadata and the same `/tech/assets/` application files. React Router still renders the page; no content is prerendered. `404.html` remains an app shell for unknown paths, with Not Found metadata, `noindex, follow`, and no canonical. No hash routing is used.

This fallback prepares build output only; it does not deploy, enable Pages, or change repository settings.

## Constellation architecture

The visual is a curated composition, not a physics simulation.

- `src/data/site.ts` is the shared source of truth.
- Interactive nodes are positioned semantic buttons layered over an SVG relationship field; concept nodes are non-interactive labels.
- SVG draws orbits, connectors, and relationship emphasis.
- CSS provides the restrained star field, glow, and state transitions.
- Desktop and mobile use independent percentage coordinate maps.
- Selection is held by the Overview route and passed down to the constellation and contextual views.

### Node model

`ConstellationNode` captures the fields each node needs without forcing unrelated data onto every type:

- identity and label
- node kind and accent
- icon and content
- optional status, tags, route, and actions
- desktop and mobile positions
- featured, interactive, and compact flags

The nine current nodes are Technical identity; the categories Projects, Built & Published, Services, and Writings; the projects Little Worlds and Wildpath; and the non-interactive concepts Experiments and Technical Thinking.

### Relationship model

Relationships are separate typed `{ from, to }` records. Rendering and selected-state emphasis both use this model. Current connections are:

- Technical identity → Projects, Built & Published, Services, and Writings
- Projects → Little Worlds
- Projects → Wildpath
- Little Worlds → Experiments
- Experiments → Built & Published
- Writings → Technical Thinking
- Built & Published → Technical Thinking

The arrows describe the stored endpoints; highlighting treats connections as relationships in either direction. Little Worlds has two direct relationships, to Projects and Experiments.

### Featured versus selected

- **Neutral:** initial state; no node has `aria-pressed="true"` and all relationships remain restrained.
- **Featured:** Little Worlds supplies the wide-desktop panel without becoming selected. A subtle indicator may appear, but the graph remains neutral.
- **Selected:** direct paths and connected nodes become prominent, unrelated content quiets, and contextual content switches.
- **Cleared:** Escape, the inline clear action, or the central identity control restores neutral state and the wide-desktop featured panel.

### Coordinate maps

Every node has both `desktopPosition` and `mobilePosition`. CSS swaps the active coordinate set at the mobile breakpoint. This makes the mobile map a deliberately composed layout rather than a scaled desktop diagram.

## Extending the content

### Add a node

1. Add a unique `NodeId`.
2. Add a typed node record with approved content and both coordinate maps.
3. Add one or more relationship records.
4. Confirm the accessible label and keyboard interaction.
5. Review every viewport in the matrix below and update data tests.

### Add a project

Add the project ID and record in `src/data/site.ts`, including only approved public links and claims. A repository is optional. The Projects page and related-writing references consume the shared record. If the project belongs in the curated constellation, add its node, relationships, and both coordinate maps separately. Review category summaries and tests that intentionally list launch content. Changing the featured project also requires reviewing the Overview card and featured graph node.

### Add a book or tool

Add a published-output ID and record in `src/data/site.ts`, then place it in the appropriate shelf's ordered `itemIds`. Actions distinguish external links, internal routes, and downloads. Overview shows the first three books and the current tool shelf, with separately chosen preview actions.

### Add a service

Add the service ID and summary in `serviceOfferings`, compose its page with `ServiceDetailLayout` and `ServiceSection`, and register its detail route in `src/App.tsx`. Overview and the Services index derive summary cards from the shared records. The constellation represents Services as a category, not each individual offering. Review the summary, detail page, responsive layout, and route tests together.

### Add a writing

Technical writings live as plain Markdown under `src/content/writings/`. YAML frontmatter requires a validated resource `format`, published writings populate `/writings` automatically, and development drafts remain visibly separate and unreachable in production. See [the Writings authoring guide](docs/writings.md) for formats versus tags, the reusable template, code-tab syntax, supported languages, and draft-to-published workflow.

## Accessibility

- Semantic page landmarks, headings, links, and buttons
- Skip link and visible focus treatment
- `aria-current` from React Router navigation
- Semantic constellation buttons with state and relationship summaries
- Live selection announcement
- Keyboard selection and Escape-to-clear
- Mobile navigation drawer closes on every destination, including the active route, and on external actions, close button, backdrop, or Escape
- Drawer keyboard focus stays within the visible menu while background content is inert; closing returns focus to the trigger
- Mobile contextual details remain in normal document flow without modal or focus-trap semantics
- Motion-aware scrolling brings inline context into view without stealing focus
- Minimum 44-pixel interactive controls where practical
- Persistent mobile navigation respects safe-area insets
- Status text accompanies color indicators
- `prefers-reduced-motion` removes transitions and animations
- Writing headings have stable direct-link anchors, sticky-header offsets, and active-section tracking
- The active Contents link uses `aria-current="location"`; mobile readers receive a motion-aware return-to-Contents control only after leaving the TOC
- Multi-language examples use semantic tabs with arrow, Home, and End navigation
- Every fenced code block includes an accessible copy action and live feedback

## Testing

Vitest and React Testing Library cover:

- node and relationship integrity
- Little Worlds’ multiple relationships
- approved content and absence of fabricated projects/satellites
- neutral versus featured state
- selection, Escape clearing, and contextual switching
- Projects, Little Worlds, and Wildpath panels, including Wildpath's optional repository
- approved enquiry action
- mobile inline context rendering, updating, relationship persistence, and clearing
- reduced-motion inline-context scrolling
- Published writing, development drafts, multiple-writing presentation, and legacy Notes redirects
- Service summaries, detail routes, remote engagement copy, and mentoring rates
- Drawer dismissal, keyboard containment, and focus restoration
- foundation and invalid routes
- writing format metadata, dates, duplicate slugs, project references, and draft visibility
- Shared heading-anchor allocation across levels, stable published article anchors, safe raw-HTML handling, code blocks, language aliases, synchronized tabs, persistence, keyboard navigation, and copy controls

Playwright covers:

- overview loading
- Projects, Little Worlds, and Wildpath selection
- mobile inline-context behavior and persistent selected relationships
- route navigation and browser back
- production serving under `/tech/`
- horizontal-overflow checks
- navigation visibility
- mobile bottom-navigation clearance
- production article reading, draft exclusion, nested route state, legacy redirects, and writing-not-found behaviour
- service detail links and readability, mentoring rate visibility, and enquiry-action clearance
- drawer keyboard containment and current-route dismissal at 430 × 932, 375 × 667, and 360 × 800
- bounded development-only writing review, scroll-spy, and mobile Contents behaviour at desktop and mobile sizes

## Viewport matrix

Primary visual review:

- 1536 × 864
- 412 × 767

Responsive smoke checks:

- 360 × 800
- 375 × 667
- 430 × 932
- 768 × 1024
- 1366 × 768
- 1920 × 1080

Generated review screenshots belong in the untracked `visual-review/` directory.

After a production build, `node scripts/run-e2e.mjs` runs the standard production suite. The runner starts its own preview child on strict port 4173, waits for that child to confirm it has bound the port, and checks `/tech/` before testing. An occupied port fails the run rather than reusing another server. The suite budget is eight minutes locally and 24 minutes in CI to accommodate the configured two retries; per-test Playwright limits are unchanged. Preview cleanup runs on success or failure. Development-only writing tests skip in production mode.

Run `npm run test:writings-preview` to reproduce the draft-writing review. The bounded harness creates a temporary draft-enabled development build, serves it at `http://127.0.0.1:4174/tech/`, runs the desktop/mobile checks, writes review screenshots, stops the server, and removes the temporary build on success or failure.

## Build-only continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to non-main branches. It uses read-only repository contents permission and validates:

1. `npm ci`
2. type-checking
3. linting
4. unit/component tests
5. technical-writing content validation
6. production build

It does not upload a Pages artifact, request deployment permissions, publish a release, or deploy.

## GitHub Pages deployment

`.github/workflows/deploy-pages.yml` owns release validation and deployment. It runs on pushes to `main` and manual dispatch; both jobs require `refs/heads/main`, so dispatching a feature branch cannot deploy. Main releases share the `pages-refs/heads/main` concurrency group: an active release finishes, while only the newest pending run is retained. A skipped dispatch on another branch cannot replace a pending main release.

The build job uses Node 24, npm caching, and read-only contents/Pages permissions. It requires `VITE_INCLUDE_DRAFTS=false`, verifies the protected article blob, runs type-checking, lint, the full unit suite and content check, and builds once. After installing Playwright Chromium with its system dependencies, it runs the standard production E2E harness against that artifact. The final artifact check verifies the `/tech/` asset paths, all public entry shells and their metadata, matching sitemap URLs, a valid noindex `404.html` with the same app body/scripts, social image, local fonts, and absence of draft titles/slugs.

Only after all checks pass does the workflow read Pages configuration and upload `dist/` with the official Pages artifact action. A separate dependent job deploys that artifact using only `pages: write` and `id-token: write`, targeting the `github-pages` environment and exposing its deployment URL. PR/feature CI remains in `ci.yml`; it has no deployment permissions.

The repository owner must verify **Settings → Pages → Build and deployment → Source → GitHub Actions** before the first successful deployment. This workflow does not enable Pages or change that setting. Prefer checking it before merging the workflow; if a run fails because Pages is not configured, configure the source and rerun the workflow from `main`. Any environment approval rules also need to be satisfied.

Run the release checks locally from the repository root. First set the environment explicitly: `$env:VITE_INCLUDE_DRAFTS = 'false'` in PowerShell, or `export VITE_INCLUDE_DRAFTS=false` in a POSIX shell. Then:

```sh
npm ci
node scripts/check-release.mjs
npm run typecheck
npm run lint
npm run test
npm run content:check
npm run build
npx playwright install chromium
node scripts/run-e2e.mjs
node scripts/check-release.mjs --artifact
git diff --check
```

On Linux/CI, install browser system dependencies with `npx playwright install --with-deps chromium`. Do not substitute the draft-preview mode or run `npm run test:e2e` after this build, since that convenience command builds again. The separate development writing-preview command remains available and does not produce a release artifact.

Keep Vite's `/tech/` base, the derived router basename, and the build-time route shells. Canonical public routes have physical directory entry files, so they no longer rely on `404.html`. Canonicals and React links retain clean URLs without trailing slashes (except the site root); directory serving may redirect to a trailing slash. The standard E2E suite includes an ordinary static-file server that checks all nine entries, missing-route 404s, and nested page boots/reloads. This proves the artifact works with directory serving, not GitHub Pages' actual HTTP behavior. After deployment, verify clean URLs, slash redirects, final HTTP 200 responses, navigation/reloads, `/tech/og.png`, and application/font assets on the live host.

## SEO and analytics

The explicit metadata table and URL/title formatting in `src/seo.ts` are shared by the runtime `usePageSeo` hook and the build-time `scripts/route-shells.mjs` generator. Both set titles, descriptions, canonicals, robots meta, and OG/Twitter metadata. Published article titles/descriptions come from the same frontmatter identity parser used by the writing catalogue; the generator only reads published sources. Canonicals use `https://ferdinraphael.github.io/tech/` and exclude query strings, fragments, and redirect aliases. Drafts, the hidden Profile page, and Not Found use `noindex, follow` with no canonical. Each static shell retains the shared social image/card and a small Person JSON-LD block containing only name, site URL, and the public GitHub profile.

Route-specific static metadata is available before JavaScript runs, improving crawler and social visibility. Page bodies remain client-rendered: there is no SSR or content prerendering. Actual indexing, social previews, and GitHub Pages HTTP statuses still require live verification.

The static sitemap at `/tech/sitemap.xml` lists the nine public launch routes, with no drafts, aliases, hidden Profile, or invented modification dates. Update `public/sitemap.xml` when public metadata routes or published articles change. Release validation compares it with the shared route registry and requires exactly those HTML entry files, plus `404.html`; aliases, hidden pages, drafts, and `index.html` file URLs stay out of the sitemap. `public/robots.txt` builds to `/tech/robots.txt` and points to that sitemap. Crawlers read robots rules from the host-root `/robots.txt`, so this project-subdirectory file does not control host crawling; the root site can reference the sitemap, or the sitemap can be submitted in Search Console. Neither root-site configuration nor Search Console is changed by this repository.

GA4 uses the checked-in public measurement ID **`G-G1V96CEM5J`**, with the direct Google tag rather than Google Tag Manager. It initializes once after the first resolved page's metadata, only for production builds on `https://ferdinraphael.github.io/tech/` (and never for draft-enabled builds). Development, localhost previews, Vitest, and normal E2E runs do not load Google or send events.

Enhanced Measurement owns page views, scrolls, outbound clicks, and file downloads. Keep **Page loads** and **Page changes based on browser history events** enabled in the stream's advanced page-view settings; site search, form interactions, and video engagement remain off. App code sends no custom `page_view` events and does not reconfigure GA on navigation. After deployment, confirm single page-view counts in GA DebugView; local mocked checks do not prove remote stream configuration or event ingestion.

The typed analytics helper adds only these site-specific events, from approved action links across the shared app shell:

| Event | Parameters |
| --- | --- |
| `service_enquiry` | `source_page` (fixed page label), optional `service_category`, `link_type=mailto` |
| `project_open` | `project_name`, `destination_type=live_demo` |
| `published_output_open` | `item_name`, `item_type`, `destination` (approved destination hostname) |

Custom events contain no email address, mail subject/body, arbitrary URL, query string, or user-entered content. Analytics never cancels a link, awaits delivery, or adds a callback before navigation. Missing/blocked `gtag` safely no-ops. Tests use spies or intercepted Google requests and do not send real GA traffic. No consent UI is added by this integration.

## Intentional content boundaries

- Profile is hidden from public navigation; its direct route is retained.
- Website in 2 Days and standalone Technical Content are absent from public services.
- Variables and framework previews remain development-only. Release builds must not set `VITE_INCLUDE_DRAFTS=true`.
- The published workaround article must remain unchanged; required Git blob: `f23fb656e3e6fc9eda611c575640832e7068a541`.

## Known implementation limitations

- The constellation uses curated coordinates; new content requires deliberate placement at both layout sizes.
- Tablet context moves below the visual instead of keeping a compressed three-column arrangement.
- Route-specific metadata is static, but page bodies still require JavaScript; live indexing and social previews remain unverified.
- Public route entry files and the unknown-path fallback are prepared; host-level status and redirect behavior must be verified after deployment.

## Human review items

- Review final node spacing on the most common physical devices.
- After deployment, verify live direct routes/reloads, static assets, and production draft exclusion before declaring launch complete.
- Review and approve each future writing before following the documented publication workflow.
