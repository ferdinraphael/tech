# Vendored writing dependencies

The technical-writing route uses pinned, browser-ready distributions because this workspace's package registry is unavailable during the framework build.

- Marked 16.2.1 — CommonMark/GFM tokenisation used by the React renderer.
- js-yaml 4.1.0 — YAML frontmatter parsing.
- Highlight.js 11.11.1 core plus the ten registered grammars used by notes.
- github-slugger — stable GitHub-style heading IDs.

The source distributions came from their official projects through the cdnjs repository where applicable. Corresponding licences are stored in `src/vendor/licenses/`. Application code imports only these pinned local files, so production reading has no CDN or runtime-network dependency.
