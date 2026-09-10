# Ferdin Raphael — Technical Identity

A standalone technical identity site for Ferdin Raphael: software projects, published books and tools, remote services, and technical writing, connected through a responsive interactive constellation.

This repository contains validation CI but no deployment workflow. The target is [the Tech site on GitHub Pages](https://ferdinraphael.github.io/tech/) under `/tech/`. Deployment/readiness work is separate; the build alone does not publish the site or change Pages settings.

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

The production build copies `dist/index.html` to `dist/404.html` for the GitHub Pages SPA fallback. Clean URLs such as `/tech/projects` are handled by React Router once the entry point loads. Host-level direct requests and reloads must be verified during deployment/readiness. No hash routing is used.

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

## Intentional content boundaries

- Profile is hidden from public navigation; its direct route is retained.
- Website in 2 Days and standalone Technical Content are absent from public services.
- Variables and framework previews remain development-only. Release builds must not set `VITE_INCLUDE_DRAFTS=true`.
- The published workaround article must remain unchanged; required Git blob: `f23fb656e3e6fc9eda611c575640832e7068a541`.

## Known implementation limitations

- The constellation uses curated coordinates; new content requires deliberate placement at both layout sizes.
- Tablet context moves below the visual instead of keeping a compressed three-column arrangement.
- Page titles and social metadata are currently global in `index.html`, not generated per route.
- GitHub Pages clean-route fallback is prepared; host-level behavior remains part of the separate deployment/readiness pass.

## Human review items

- Review final node spacing on the most common physical devices.
- Verify direct routes, static assets, production draft exclusion, and the protected article blob during deployment/readiness.
- Review and approve each future writing before following the documented publication workflow.
