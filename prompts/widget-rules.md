# Pobo widget rules (canonical)

This is the canonical, server-enforced ruleset for Pobo widgets. Markup that violates these rules is rejected by the Pobo server on push with HTTP 400.

Two consumers load this file:

- **Local Claude Code agent** — via `prompts/widget-claude-md.md`, which inlines this content (Claude Code cannot follow file references, so the rules are duplicated there verbatim — keep both in sync when editing).
- **Pobo Laravel backend** — as the Claude API system prompt for the `pobo widget ai` endpoint. The synced copy lives at `pobo-laravel/resources/prompts/widget-system-prompt.md`.

The rules apply identically regardless of who is generating the widget (a human, Claude Code, or Claude API).

---

# Server-enforced rules

## Allowed HTML tags

`div`, `a`, `h1`, `h2`, `h3`, `h4`, `p`, `ul`, `li`, `span`, `img`, `textarea`, `aside`

**Anything else** (`section`, `button`, `header`, `footer`, `nav`, `article`, `figure`, `picture`, `svg`, `video`, `input`, `form`, `table`, `b`, `strong`, `em`, `i`, `br`, `hr`, …) is rejected. Use `<div>` with semantic class names instead.

### `<li>` content restriction

A `<li>` element may only contain **plain text** — no nested tags (no `<span>`, `<a>`, `<img>`, no nested `<ul>` or `<li>` inside).

**Why:** the Pobo Page Builder UI replaces every `<ul>` block with a single `<textarea>` where each line becomes one `<li>`. Any markup nested inside `<li>` is lost on the first edit. If you need styled, linked, or media-rich list items, build them as `<div>` siblings with a class like `__item` instead of using `<ul>`/`<li>`.

### `<span>` and heading content restriction

`<span>`, `<h2>`, `<h3>`, and `<h4>` may only contain **plain text** — no nested tags.

In particular:

- A `<span>` must NOT contain another `<span>` (no `<span><span>…</span></span>`).
- An `<h2>`, `<h3>`, or `<h4>` must NOT contain a `<span>` (no `<h2>Foo <span>bar</span></h2>`).

**Why:** all four are leaf text containers in the Pobo Page Builder (direct text edit, no rich-text controls). Nesting another text element inside breaks the editor — the merchant sees overlapping edit handles and the nested element is silently dropped on first save.

**Avoid:**

```html
<span class="...__outer">Lorem <span class="...__inner">ipsum</span> dolor</span>
<h2 class="...__title">Foo <span class="...__highlight">bar</span></h2>
<h3 class="...__subtitle"><span>Wrap</span></h3>
```

**Good — flatten to a single text element:**

```html
<span class="...__outer">Lorem ipsum dolor</span>
<h2 class="...__title">Foo bar</h2>
<h3 class="...__subtitle">Wrap</h3>
```

If the design highlights a fragment of a heading (e.g., a colored last word, an inline counter badge), use a single style on the whole heading or move the fragment to a sibling element with its own class. The Pobo Page Builder doesn't support per-fragment styling on leaf text elements.

### `<a>` is a button, not a wrapper

`<a>` represents a **button CTA** in the Pobo Page Builder UI — a styled clickable element with a short button label.

**Hard rules:**

- `<a>` may only contain **plain text** — no nested tags whatsoever (no `<span>`, no `<img>`, no `<div>`, no headings). The Pobo Page Builder strips any nested markup inside `<a>` on the merchant's first edit, leaving only the text.
- `<a>` must NOT wrap images, headings, paragraphs, or multi-element composites — that responsibility belongs to the merchant via the Page Builder UI.
- `<a>` is the only allowed clickable element — there is no `<button>` tag.
- Style `<a>` in SCSS as a button (padding, background, border-radius, hover state).
- Only emit an `<a>` when the design shows an actual button. Do not invent CTAs the design doesn't have.
- For navigation without a destination, use `href="#"` as a placeholder — never invent fake URLs.

**Why:** the Pobo Page Builder gives the merchant separate UI controls to make an image a link (the photo picker has a "linked URL" option) and to link text fragments (text editor link tool). Wrapping a card or image in `<a>` removes the merchant's ability to manage those links independently. Additionally, the builder normalizes `<a>` content to plain text on edit; any nested `<span>`, `<img>`, or `<div>` is silently discarded.

**Good — plain-text CTA button:**

```html
<a class="pb-cli-320-card__cta" href="/category/headphones">Shop now</a>
```

**Good — card with separate photo + heading + button siblings:**

```html
<div class="pb-cli-320-card">
    <div class="pb-cli-320-card__photo">
        <img class="pb-cli-320-card__image" src="/headphones.jpg" alt="Headphones">
    </div>
    <h3 class="pb-cli-320-card__title">Headphones</h3>
    <a class="pb-cli-320-card__cta" href="/category/headphones">Shop now</a>
</div>
```

**Good — card without a button (design shows none):**

```html
<div class="pb-cli-320-card">
    <div class="pb-cli-320-card__photo">
        <img class="pb-cli-320-card__image" src="/headphones.jpg" alt="Headphones">
    </div>
    <h3 class="pb-cli-320-card__title">Headphones</h3>
</div>
```

**Avoid — `<a>` containing any markup (all stripped to plain text on edit):**

```html
<a href="/x">Shop <span class="highlight">now</span></a>
<a href="/x"><img src="..."> Shop</a>
<a class="card" href="/x"><div class="photo"><img ...></div><h3>…</h3></a>
```

### `<img>` wrapping requirement

Every `<img>` element must be a child of a `<div>` whose class declares `position: relative` in the SCSS.

**Why:** the Pobo Page Builder overlays a "select photo" picker button on top of every image. That overlay is absolutely positioned and needs a `position: relative` ancestor to anchor against. Without the wrapper, the picker drifts to the nearest positioned element (often the page body), breaking the click target.

The wrapper can be the widget root `<div>` itself when the widget is essentially just an image. For widgets that mix images with other content, use a dedicated `__photo` (or similar) wrapper:

```html
<div class="pb-cli-320-hero">
    <div class="pb-cli-320-hero__photo">
        <img class="pb-cli-320-hero__image" src="https://picsum.photos/800/600" alt="Spring collection">
    </div>
    <h2 class="pb-cli-320-hero__title">…</h2>
</div>
```

```scss
.pb-cli-320-hero {
    &__photo {
        position: relative;   // required — anchors the photo picker overlay
    }
    &__image {
        width: 100%;
        height: auto;
    }
}
```

### Placeholder image URLs

Always use **Lorem Picsum** as the `src` for every `<img>` so the widget renders with realistic visuals during the merchant's preview before they upload their own assets:

```html
<img class="..." src="https://picsum.photos/800/600" alt="Spring collection lifestyle photo">
```

Pick dimensions that match the slot in the design — e.g. `https://picsum.photos/1200/600` for a wide hero, `https://picsum.photos/400/400` for a square card thumbnail, `https://picsum.photos/600/800` for a portrait. The merchant replaces these via the Pobo Page Builder photo picker once they have real assets.

**Never** use paths like `/images/headphones.jpg` or `/hero.png` — those don't resolve on the merchant's e-shop and the preview shows broken images.

Write a descriptive `alt` that names the intended subject (product type, scene, mood) — the merchant uses it both for accessibility and as a hint for what to upload.

## Text container choice

Each text-bearing tag renders a different editor in the Pobo Page Builder UI. Pick the lightest container that fits the content.

| Tag | Editor | Use for |
|---|---|---|
| `<h2>`, `<h3>`, `<h4>` | direct text edit, no formatting controls | Actual headings (section titles, card titles, callout labels) |
| `<span>` | direct text edit, no formatting controls | Short standalone text — captions, taglines, subtitles, single-sentence callouts |
| `<p>` | heavyweight WYSIWYG (toolbar, lists, nested headings) | Multi-sentence body prose |
| `<aside>` | rich-text WYSIWYG (lists, multiple paragraphs, nested headings) | Editorial content blocks |

**Decision rule:**

- One short line or sentence of text → `<span>` (apply `display: block` in SCSS if you need block-level layout, plus margin/text-align as needed). Use `<h2>`/`<h3>`/`<h4>` if the text is semantically a heading.
- Multi-sentence body prose with potential formatting → `<p>`.
- Rich editorial block with multiple paragraphs, lists, nested headings → `<aside>`.

**Critical — `<p>` and `<aside>` must NOT have a `class` attribute:**

`<p>` and `<aside>` are WYSIWYG editors. The merchant can freely re-format their content — convert `<p>` to `<h2>`, split into multiple paragraphs, add lists, nest headings. A class on `<p>` or `<aside>` itself is unreliable (it doesn't survive those transformations), and the merchant cannot assign classes to the nested elements either.

**Pattern: wrap the WYSIWYG editor element in a classed `<div>` and style via descendant selectors.**

**Avoid:**

```html
<p class="...__lead">Sed ut perspiciatis…</p>
<aside class="...__editorial">Rich content with multiple paragraphs…</aside>
```

**Good:**

```html
<div class="...__lead">
    <p>Sed ut perspiciatis…</p>
</div>

<div class="...__editorial">
    <aside>Rich editorial content with lists and nested headings…</aside>
</div>
```

```scss
.pb-cli-{ID}-{SLUG} {
    &__lead {
        max-width: 60ch;
        margin: 0 auto;
        p { line-height: 1.6; font-size: 1.125rem; }
    }

    &__editorial {
        h2 { font-size: 1.5rem; margin: 0 0 0.5rem; }
        p  { line-height: 1.5; margin: 0 0 0.75rem; }
        ul { padding-left: 1.2rem; }
        a  { color: var(--primary); text-decoration: underline; }
    }
}
```

Descendant selectors (`&__lead p`, `&__editorial h2`, etc.) survive the merchant's edits because the wrapping `<div>` and its class are untouched by the WYSIWYG controls.

**Avoid using `<p>` or `<aside>` for one-line text.** They trigger a disproportionate WYSIWYG editor AND require an extra wrapping `<div>` for styling. For one-line text, `<span>` (or a heading tag) gives the merchant a direct edit field with no overhead and one classable element you can style cleanly via `&__name`.

## Allowed attributes

| Tag      | Attributes (case-sensitive)                       |
|----------|---------------------------------------------------|
| (any)    | `class`                                           |
| `<a>`    | `class`, `href`                                   |
| `<img>`  | `class`, `src`, `alt`, `title`, `width`, `height` |

Any other attribute (`id`, `style`, `data-*`, `role`, `aria-*`, `target`, `rel`, `name`, `type`, `value`, `placeholder`, `loading`, …) is rejected.

## Allowed URL schemes

For `<a href="...">`:

- `http://...`
- `https://...`
- `mailto:...`
- absolute path starting with `/` (e.g. `/contact`)

For `<img src="...">`:

- `http://...`
- `https://...`
- absolute path starting with `/` (e.g. `/images/hero.png`)

`mailto:` is valid **only for `href`**, never for `src`. `javascript:`, `data:`, `file:`, `vbscript:`, relative paths without a leading slash, and protocol-relative `//foo` are rejected for both attributes.

## Forbidden HTML constructs

- `<script>`, `<style>` — anywhere, even self-closing
- HTML comments `<!-- ... -->`
- CDATA `<![CDATA[ ... ]]>`
- Inline event handlers — `onclick=`, `onload=`, `onerror=`, anything `on*`
- Inline `style="..."` attribute (style belongs in SCSS)
- Conditional comments `<!--[if IE]>...`

## Size and count limits

| Limit                      | Maximum         |
|----------------------------|-----------------|
| HTML byte size             | 65,535 B        |
| Element count              | 500             |
| Text content (per node)    | 5,000 chars     |
| URL length (`href`/`src`)  | 2,048 chars     |

Most widgets have 5–30 elements. Keep them small.

## SCSS rules

- The SCSS file is real Sass — nested selectors, `&__element`, `&--modifier`, `$variables`, and basic functions (`darken`, `lighten`, `rgba`) all work.
- The CLI compiles it with `sass` to compressed CSS during push. The compiled CSS is what the validator checks.

**Forbidden in the compiled CSS:**
- `@import` in any form — including CSS escape sequences like `\@import` or `@\69mport`. Inline all rules into this one widget.
- `expression(` (legacy IE)
- `javascript:`, `vbscript:` URLs
- `behavior:` property
- `-moz-binding` property
- Top-level universal selectors — `*`, `*::before`, `*::after`, `*:hover`, etc. They match every element on the host e-shop page (header, products, cart, footer), not just the widget. Common offenders to avoid:
  ```scss
  *, *::before, *::after { box-sizing: border-box; }   // BAD — resets entire host page
  * { margin: 0; padding: 0; }                          // BAD
  ```
  If you genuinely need such a reset, scope it under the widget root: `.<root_class> *, .<root_class> *::before, .<root_class> *::after { ... }`. In practice, almost no widget needs a universal reset — set `box-sizing`, margins, and paddings explicitly on the elements that need them.

**CSS `url()` constraint — only relative or absolute-path URLs:**

- ✓ `url("/local/icon.png")` — absolute path on the host e-shop
- ✓ `url("./icon.png")`, `url("icon.png")` — relative path
- ✗ `url("https://cdn.example.com/img.png")` — absolute URL with scheme
- ✗ `url("//evil.tld/img.png")` — protocol-relative
- ✗ `url("data:image/svg+xml,...")` — data URI

The widget CSS ships to BunnyCDN and loads on customer e-shop pages. External URLs would enable CSS-based exfiltration (visitor tracking, attribute-selector keyloggers against form fields). Use paths that resolve on the host e-shop, or upload assets through the e-shop's own asset system before referencing them by absolute path.

## Style conventions

- Root selector: `.<root_class> { ... }` — everything else nests inside.
- BEM-style: `&__element` for sub-parts, `&--modifier` for variants.
- Mobile-first: write base styles for narrow viewports, scale up with `@media (min-width: …)`.
- Prefer `rem` / `em` over `px` for typography; `px` is fine for borders/shadows.
- Don't reset every browser default. The host page already has its CSS — set only what the widget needs.

---

# Output format

The **HTML must have exactly one root element** — a `<div class="<root_class>">` — and the **SCSS must scope every rule under that root class** (`.<root_class> { ... }`). No global selectors.

When generated via Claude API (`pobo widget ai` endpoint), the response comes through a forced `widget_generator` tool call with two parameters:

- `html` — string, the widget markup
- `scss` — string, the widget styles

When authored locally (Claude Code path), the HTML and SCSS go into `widgets/<id>/<slug>-<id>.html` and `widgets/<id>/<slug>-<id>.scss` respectively.

If the output fails `pobo widget validate`, read the error list carefully and fix only what's flagged — keep the rest of the structure intact.

---

# Example: small hero banner

For a widget with `id=320`, `name=Hero banner`, `root_class=pb-cli-320-hero-banner`:

```html
<div class="pb-cli-320-hero-banner">
    <h2 class="pb-cli-320-hero-banner__title">Discover our new collection</h2>
    <span class="pb-cli-320-hero-banner__text">Hand-picked pieces for the season ahead.</span>
    <a class="pb-cli-320-hero-banner__cta" href="/collections/new">Shop now</a>
</div>
```

```scss
.pb-cli-320-hero-banner {
    padding: 2rem 1.5rem;
    text-align: center;
    background: linear-gradient(135deg, #f8f4ee, #ece2d0);

    &__title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #2a2520;
        margin: 0 0 0.75rem;
        line-height: 1.2;
    }

    &__text {
        display: block;
        font-size: 1rem;
        color: #5a4f44;
        margin: 0 0 1.5rem;
        line-height: 1.5;
    }

    &__cta {
        display: inline-block;
        padding: 0.875rem 2rem;
        background: #2a2520;
        color: #ffffff;
        text-decoration: none;
        font-weight: 600;
        border-radius: 4px;

        &:hover {
            background: #1a1510;
        }
    }

    @media (min-width: 768px) {
        padding: 4rem 2rem;

        &__title {
            font-size: 2.5rem;
        }
    }
}
```

Notice: single root `<div>`, only allowed tags, only allowed attributes (`class`, `href`), no inline styles, BEM under root class, mobile-first media query, no `@import`.
