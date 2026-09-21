# site-footer

This feature is about a site footer; its children are links. `SiteFooter` closes
every demo page: the gallery home, each fixture route, and the showcase.

- **Exports:** `SiteFooter` from `index.tsx`.
- **Boundary:** plain composition with no hook and no data; it opens links through
  `Linking`.
- **Density:** `full` stacks the links, NOTICE pointer, and credit for a
  scrolling page; `compact` is one row under a bounded fixture viewport.

```text
site-footer/
  index.tsx              # SiteFooter
  parts/footer-link.tsx  # one pressable mark
  parts/glyph.tsx        # native: writes the name
  parts/glyph.web.tsx    # web: inline SVG marks
  parts/glyph.types.ts   # shared props
```
