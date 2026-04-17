# Component Style Rules

Reference guide for building new UI block components. Extracted from auditing
all existing components in the project to ensure visual consistency.

---

## 1. Section Container

Every block component wraps its content in `<SectionContainer>`:

```tsx
<SectionContainer color={color} padding={padding}>
  <div className="...">{children}</div>
</SectionContainer>
```

- `color` comes from `stegaClean(colorVariant)` — applies `bg-${color}` 
- `padding` is `{ top: boolean, bottom: boolean }`:
  - top → `pt-16 xl:pt-20`
  - bottom → `pb-16 xl:pb-20`
- The container adds `.container` which handles max-width + horizontal padding

---

## 2. Typography

### Tag Line
Always the same class string:
```
text-base font-semibold font-pixel tracking-wide uppercase text-muted-foreground mb-4
```
Rendered as a `<span className="block ...">`.

### Titles
- `h1`: used only in Hero. Class: `mt-4 font-bold leading-[1.1]`
- `h2`: section-level titles. Class: `text-3xl md:text-5xl mb-4`
- `h3`: sub-section titles (split-column, grids). Class: `mb-4 font-semibold`

### Body Text (PortableText)
- Wrap with `<PortableTextRenderer value={body} />`
- **Do NOT** add `text-lg` or `text-muted-foreground` to the wrapper—those
  classes override PortableText's own heading/list styles and flatten visual
  hierarchy.
- If you need to tint body text, wrap in a container that only sets color
  on `<p>` elements, not on headings or lists.

### Description (plain text)
```
text-muted-foreground text-lg leading-relaxed
```
Used in `section-header` for single-paragraph descriptions only.

---

## 3. Color on Primary Background

When the section uses `colorVariant === "primary"` (dark bg), flip text:
```tsx
<div className={cn(color === "primary" ? "text-background" : undefined)}>
```
Apply this on the wrapper that contains headings and body text.

---

## 4. Layout Patterns

### Horizontal (side-by-side: left/right)
```
grid grid-cols-1 lg:grid-cols-2
```
- **NO gap on the grid** — the text column's padding handles all spacing
- **Media column**: full width, responsive height
- **Text column**: `px-4 py-6 lg:px-16 xl:px-20 flex flex-col justify-center`
- This matches `split-column` exactly

### Vertical (stacked: top/bottom)
```
grid grid-cols-1 gap-6
```
- Gap `gap-6` (1.5rem) between stacked elements
- Content constrained: `max-w-[48rem] mx-auto` for text-heavy blocks
- Media constrained: `max-w-4xl mx-auto` when standalone

### Alignment
- `items-center` on the grid for horizontal layouts (vertical centering)
- `text-center mx-auto` for centered/narrow content

---

## 5. Spacing Tokens

| Token    | Value  | Use Case                       |
|----------|--------|--------------------------------|
| `gap-4`  | 1rem   | Buttons, form elements         |
| `gap-6`  | 1.5rem | Grid rows, section gaps        |
| `gap-10` | 2.5rem | Hero grid                      |
| `gap-16` | 4rem   | XL split-row gaps              |
| `mb-4`   | 1rem   | After tagLine, after title     |
| `mt-2`   | 0.5rem | Button after body (split)      |
| `mt-6`   | 1.5rem | Body after title (hero)        |
| `mt-10`  | 2.5rem | Buttons after body (hero/cta)  |

---

## 6. Image / Media Styling

- Always `rounded-lg overflow-hidden` for media containers
- Images: `object-cover` + responsive height classes
- Quality: `quality={100}`
- Placeholder: `placeholder="blur"` with `blurDataURL` when lqip available

---

## 7. Responsive Breakpoints

| Breakpoint | Width  | Typical Change                       |
|------------|--------|--------------------------------------|
| sm         | 640px  | Image heights increase               |
| md         | 768px  | Font sizes increase, some grid cols  |
| lg         | 1024px | Grid switches to multi-column        |
| xl         | 1280px | Padding increases, gaps widen        |

---

## 8. Max-Width Constraints

| Value              | Use Case                             |
|--------------------|--------------------------------------|
| `max-w-[48rem]`    | Narrow text sections, timelines      |
| `max-w-[35rem]`    | Single carousel image                |
| `max-w-3xl`        | Centered body text (48rem)           |
| `max-w-4xl`        | Centered media (56rem)               |

---

## 9. Component Skeleton

```tsx
import { cn } from "@/lib/utils";
import SectionContainer, {
  ISectionContainer,
  ISectionPadding,
} from "@/components/ui/section-container";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { stegaClean } from "next-sanity";

export default function MyComponent({
  padding,
  colorVariant,
  body,
  // ... other props
}: Partial<{
  padding: ISectionPadding;
  colorVariant: ISectionContainer["color"];
  body: any;
}>) {
  const color = stegaClean(colorVariant);

  return (
    <SectionContainer color={color} padding={padding}>
      <div className={cn(color === "primary" ? "text-background" : undefined)}>
        {body && <PortableTextRenderer value={body} />}
      </div>
    </SectionContainer>
  );
}
```

---

## 10. Anti-Patterns (Do NOT)

- **Do NOT** duplicate tagLine/title fields—use `section-header` block above
- **Do NOT** wrap PortableText in `text-lg text-muted-foreground`—it kills
  heading/list hierarchy inside the rich text
- **Do NOT** use arbitrary max-widths—stick to `48rem`, `3xl`, `4xl`
- **Do NOT** add `gap` to horizontal (side-by-side) grids—the text padding
  handles spacing (matching `split-column` pattern)
- **Do NOT** skip `stegaClean()` on any Sanity string field
