# Writings authoring guide

Writings are repository-owned plain Markdown files. React supplies presentation, navigation, code controls, and related-project context; writing files contain no JSX or MDX.

## Routes and content directories

- `/writings` is the canonical index route; deployed under the configured base it is `/tech/writings`.
- `/writings/:slug` is the canonical writing route; deployed it is `/tech/writings/:slug`.
- Legacy `/notes` and `/notes/:slug` addresses replace-redirect to the matching canonical Writings route and preserve query strings and hash fragments.
- `src/content/writings/drafts/` contains development-only authoring previews.
- `src/content/writings/published/` contains published writings.
- The filename becomes the route slug: `dependency-direction.md` becomes `/writings/dependency-direction`.
- Filenames must be unique, lowercase, and kebab-case across both directories.

Development builds expose valid drafts under `/writings/:slug` and label them `DRAFT`. Production builds exclude drafts from the visible catalogue, index, and writing lookup.

## Reusable writing template

````markdown
---
title: "Writing title"
description: "A concise description used by the Writings index and writing header."
format: article
publishedAt: "2026-08-18"
updatedAt: "2026-08-20"
draft: true
tags:
  - architecture
  - maintainability
technologies:
  - C#
  - TypeScript
series:
  name: "Optional series name"
  order: 1
relatedProjects:
  - little-worlds
featured: false
---

Opening prose can use **emphasis**, [links](https://example.com), and `inline code`.

## First meaningful section

- Unordered item
- Another item

1. Ordered step
2. Next step

> A useful quotation or callout.

```typescript
export function ordinaryCodeBlock(): boolean {
  return true
}
```

## Equivalent implementations

The explanation remains outside the group and appears only once.

:::code-tabs

```csharp
public static bool IsReady() => true;
```

```typescript
export const isReady = (): boolean => true
```

```python
def is_ready() -> bool:
    return True
```

:::

| Concern | Approach |
| --- | --- |
| Portability | Plain Markdown |
| Presentation | React components |

![Meaningful alternative text](/tech/writings/example/image.png)

---

Closing prose.
````

For a new draft, omit `publishedAt` instead of inventing a date.

## Format and tags

`format` is required and answers: “What kind of resource is this?” Supported values are:

- `article`
- `concept-note`
- `mental-model`
- `worked-example`
- `practice-set`
- `mini-project`
- `debugging-note`
- `reference-sheet`

`tags` answer: “What subjects does this cover?” Examples include `architecture`, `testing`, `memory`, or `debugging`. Do not use tags as a substitute for format. `technologies` separately records relevant tools or languages. The framework does not yet filter or group by any of these fields.

## Frontmatter rules

- `title`, `description`, and `format` are required.
- `format` must be one of the supported values above.
- `draft` must be explicitly `true` or `false`.
- Published writings require a real `publishedAt` value in `YYYY-MM-DD` format.
- `updatedAt` is optional and cannot precede `publishedAt`.
- `tags` and `technologies` are optional string lists.
- `series` is optional and requires a name plus a positive integer order.
- `relatedProjects` is optional and accepts only IDs from the shared project data.
- `featured` is optional and defaults to `false`.

Draft and published files use the same schema. Invalid dates, formats, duplicate slugs, malformed metadata, unknown project IDs, and malformed code-tab groups fail content validation.

## Code blocks and language tabs

Ordinary fenced blocks receive syntax highlighting, a language label when recognised, horizontal overflow, and a copy action. Supported aliases include:

- `csharp`, `cs`
- `java`
- `typescript`, `ts`
- `javascript`, `js`
- `python`, `py`
- `json`
- `bash`, `shell`
- `powershell`, `ps1`
- `sql`
- `html`
- `css`
- `text`, `plaintext`

A `:::code-tabs` group must contain at least two labelled fenced blocks and cannot repeat a canonical language. Selecting a language stores the preference under `ferdinraphael.tech.preferred-code-language` and synchronises compatible groups. A group without the preferred language falls back to its first example without changing the stored preference.

Language-aware writings declare their supported reading languages and default in frontmatter:

```yaml
readerLanguages:
  - csharp
  - java
  - python
defaultReaderLanguage: csharp
```

Every `:::code-tabs` group in such a writing must contain exactly the declared reader languages once each. In single-language mode, Read As, language-content prose, and every code-tabs group share one selection. Selecting a code tab changes the article-wide reading language. Compare mode renders every code sample in declared language order as labelled code blocks, without tab controls or tab semantics. Writings without `readerLanguages` retain the ordinary independent code-tabs behavior described above.

## Basic runtime models

A `::::runtime-model` is available only in a language-aware writing. It contains exactly one `:::language` variant for every declared reader language, and variants are normalized to `readerLanguages` order. Each variant owns exactly one matching language code fence and one `model` fence:

````markdown
::::runtime-model

:::language csharp

```csharp
int count = 10;
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: count
        kind: variable
        label: count
        directValue:
          type: int
          value: "10"
    relationships: []
```

:::

<!-- Add the complete Java and Python variants here. -->

::::
````

The `model` fence is parsed as semantic YAML and never displayed as source. Runtime models support one state whose ID is `current`, one direct-value variable, one source associated with one object, or exactly two sources sharing one object. Objects contain either a scalar value or a non-empty `members` list whose entries are marked as `field` or `property`. The old `fields:` property is invalid authoring syntax and fails strict validation.

Variables use `reference` relationships and names use `binding` relationships. Shared identity is represented by two ordinary relationships with the same target object: either two variables/references or two names/bindings. Source cards render in entity declaration order regardless of relationship order. Authors describe entities and relationships only; coordinates, styling instructions, and other rendering data are invalid.

Runtime models may contain either one `current` state or exactly one `before` plus one `after` state. Authored transition order is normalized to before then after. Before/after supports two deliberately narrow transitions:

- A shared-target mutation retains the same two sources, target identity, source semantics, and relationship set. The member-backed object retains its member names and kinds, at least one member value changes, and the changed members are derived from the state difference.
- A shared-target split starts with the same Stage E topology, then contains exactly the same two sources, the unchanged original member-backed target, one new same-type target with a new ID, and exactly two relationships. Exactly one source keeps its relationship to the original target while the other changes only its target to the new object. Source IDs, kinds, labels, and relationship semantics remain unchanged; validation derives the stable and changed sources rather than accepting authored transition hints.

A split cannot mutate the original object at the same time, and a split after-state is not accepted as a standalone `current` topology. Before/after is not supported for direct-value, single-source, or scalar-object models. Runtime models do not support arbitrary multiple-object graphs, disconnected or unreachable objects, de-emphasis, garbage-collection semantics, coordinates, or animation. During Compare, they render only the retained selected-language variant, including both transition states; code-tabs and language-content keep their full Compare behavior.

## Related projects and series

Use `relatedProjects` only with verified project IDs from the shared site data. Each valid ID adds contextual project information after the writing. Use `series.name` and a positive `series.order` only when the writing genuinely belongs to an ordered sequence.

## Markdown and safety

The renderer supports headings, paragraphs, emphasis, lists, links, images, blockquotes, inline code, fenced code, tables, horizontal rules, and GitHub-flavoured Markdown conventions. Heading IDs follow GitHub-style slugging and feed the Contents navigation.

Do not place raw HTML or scripts in a writing. Raw HTML is rendered inert rather than executed. External links receive safe new-tab attributes, and unsafe URL schemes are discarded.

## Draft-to-published workflow

1. Create and review the writing under `src/content/writings/drafts/` with `draft: true` and a valid `format`.
2. Preview it with `npm run test:writings-preview`.
3. Complete editorial and factual review.
4. Set `draft: false`.
5. Add the real `publishedAt` date and optional `updatedAt` date.
6. Move the file to `src/content/writings/published/` without changing its slug unless the canonical route should change.
7. Run `npm run content:check`, followed by typecheck, lint, tests, and the production build.

No writing is published merely by adding a draft. Production draft exclusion is deliberate and must remain enabled.
