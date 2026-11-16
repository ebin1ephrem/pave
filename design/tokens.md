# PAVE design tokens

Source: the FundRadar codebase (`src/app/globals.css`, `src/components/admin/*`, `src/components/public/opportunity-card.tsx`, `src/app/admin/login/page.tsx`), read at commit `16b2b4a`. Values are copied from source, not measured from the rendered site. They live in `src/index.css` as a Tailwind v4 `@theme` block, which generates both the CSS variables and the utility classes; there is no separate `tailwind.config`.

Open items: none.

## Colour

Proportion rule: about 78% white or off-white, about 18% charcoal, under 5% lime. Hierarchy comes from type, space, contrast and 1px lines, not from adding colours.

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#ffffff` | Page and card background |
| `subtle` | `#f6f7f4` | App background behind cards, hover fill, disabled field |
| `ink` | `#151515` | Primary text, primary button, dark panel |
| `ink-2` | `#202020` | Dark surface variant |
| `ink-3` | `#2a2a2a` | Primary button hover |
| `body` | `#151515` | Body text |
| `muted` | `#707070` | Secondary text, eyebrow |
| `faint` | `#9a9a9a` | Placeholder, inactive icons, fact labels |
| `on-dark` | `#ffffff` | Text on ink |
| `on-dark-muted` | `#a6a6a6` | Secondary text on ink |
| `on-dark-faint` | `#707070` | Tertiary text on ink |
| `accent` | `#b9ff5a` | Accent button, active nav icon, emphasis bar, selection |
| `accent-hover` | `#aaf04d` | Accent button hover |
| `line` | `#e7e7e7` | Default 1px border |
| `line-strong` | `#d8d8d8` | Hover border, dashed empty-state border |
| `ok` | `#1f7a4d` | Positive status |
| `warn` | `#b76e00` | Caution status |
| `danger` | `#c0392b` | Error and destructive status |

Other colour values used in source: secondary button hover border `#b9b9b9`; focus ring `rgba(185, 255, 90, 0.4)` (accent at 40%); line on dark `rgba(255, 255, 255, 0.08)`; status badge fills are the status colour at 5% with a 30% border (40% for warn).

## Type

| Role | Family | Size | Line height | Weight | Tracking |
|---|---|---|---|---|---|
| `display-xl` | Inter Tight | `clamp(40px, 6vw, 82px)` | 1.0 | 500 | -0.04em |
| `display-lg` | Inter Tight | `clamp(32px, 4vw, 60px)` | 1.04 | 500 | -0.035em |
| `display-md` | Inter Tight | `clamp(26px, 2.6vw, 40px)` | 1.08 | 500 | -0.03em |
| Sign-in title | Inter Tight | 30px | 1.1 | 500 | -0.035em |
| Page title | Inter Tight | 26px | 1.12 | 500 | -0.032em |
| Stat value | Inter Tight | 30px | 1.0 | 500 | -0.035em, tabular numerals |
| Card title | Inter Tight | 17px | 1.25 | 500 | -0.02em |
| Step title | Inter | 15.5px | default | 500 | -0.02em |
| `lede` | Inter | `clamp(16px, 1.4vw, 19px)` | 1.6 | 400 | -0.01em |
| Body | Inter | 16px | 1.55 | 400 | 0 |
| Supporting | Inter | 14px | relaxed | 400 | 0 |
| Nav item | Inter | 13.5px | default | 400 (500 active) | 0 |
| Label | Inter | 13px | default | 500 | 0 |
| `hint` | Inter | 12.5px | 1.45 | 400 | 0 |
| Pill | Inter | 11.5px | default | 500 | -0.005em |
| Stat label | Inter | 11.5px | default | 600 | 0.07em, uppercase |
| `eyebrow` | Inter | 11px | default | 600 | 0.09em, uppercase |
| Fact label | Inter | 11px | default | 400 | 0.06em, uppercase |

Fonts: Inter and Inter Tight, variable weight 100 to 900, Latin subset, self-hosted from `src/assets/fonts` (the same files FundRadar ships). Headings default to weight 500, tracking -0.035em, line height 1.05, balanced wrapping. Body uses font features `cv05` and `ss01`.

## Radius

| Token | Value | Use |
|---|---|---|
| `control` | 6px | Small button, small field, nav item, brand mark |
| `button` | 8px | Button, field |
| `card` | 12px | Card, stat tile, step, empty state |
| `panel` | 16px | Large panel |
| `showcase` | 22px | Dark feature panel |
| pill | 999px | Badges and chips |

## Shadow

| Token | Value |
|---|---|
| `float` | `0 8px 24px rgba(0, 0, 0, 0.08)` |
| `lifted` | `0 24px 70px rgba(0, 0, 0, 0.14)` |
| `showcase` | `0 30px 80px rgba(0, 0, 0, 0.16)` |
| Card hover | `0 12px 30px rgba(0, 0, 0, 0.055)` |

Cards sit flat by default; borders, not shadows, separate surfaces.

## Spacing and layout

Tailwind's 4px scale is used unchanged. Recurring values:

| Where | Value |
|---|---|
| Page container | max 1200px (`page`), 1320px (`wide`); side padding 20px, 24px from 768px, 36px from 1024px |
| App sidebar | 248px wide; hidden behind a menu button below 1024px |
| App page padding | 20px / 24px; 36px / 32px from 1024px |
| Card padding | 20px (16px on small screens) |
| Grid gap between cards | 12px for tiles and steps, 16px for cards |
| Badge gap | 6px |
| Eyebrow to headline | 10px |
| Public section rhythm | 64px, 96px from 768px, 128px from 1280px |

## Components

| Component | Spec |
|---|---|
| Button | Height 46px, padding 20px, radius 8px, 14.5px / 500. Small: 36px, 13px padding, radius 6px, 13px. Large: 52px, 26px padding, 15.5px. Hover lifts 1px; press scales to 0.988; disabled 50% opacity. |
| Button variants | Primary: ink on white text. Accent: lime with ink text. Secondary: white, 1px line, ink text. Ghost: transparent, muted text. Danger (PAVE addition): danger at 5% fill, 30% border. |
| Field | Height 48px, padding 14px, radius 8px, 1px line, 15px text. Focus: ink border and 3px accent ring. Invalid: danger border. Small: 36px. |
| Pill / badge | Height 24px, padding 9px, full radius, 11.5px / 500, 1px line, muted text on white. Tones: dark, accent, ok, warn, danger, faint. |
| Filter chip | Pill at 32px height; selected is ink with white text; hover darkens border and text. |
| Card | White, 1px line, radius 12px. Linked cards lift 4px and gain the card-hover shadow. |
| Status card | Badges row, 17px title, 13px subtitle, two-line description, two-column facts above a top border, tag row, text call to action with arrow. |
| Stat tile | Card with uppercase label, 30px value, 12.5px hint, optional 3px by 36px accent bar. |
| Step | Card with a two-digit number (13px Inter Tight, muted), 15.5px title, 13.5px body. Hover lifts 2px. |
| Dark panel | Ink background, radius 22px, optional dot grid at 40% opacity. |
| Dot grid | 1px dots at 10% black (or white on dark), 20px spacing. |
| Focus | 2px ink outline, 2px offset; accent outline on dark surfaces. |

## Motion

| Token | Value |
|---|---|
| Fast | 180ms |
| Base | 320ms |
| Button and card transitions | 220ms to 250ms |
| `ease-standard` | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` |

All motion is removed when the user prefers reduced motion.

## PAVE additions (not in FundRadar)

These are built only from the tokens above.

| Addition | Rule |
|---|---|
| Band colours | Explore: `subtle` fill, `line` border, ink text. Validate: ink fill, white text. Scale: accent fill, ink text. |
| Confidence dot | 6px dot inside the stage badge: `ok` for high, `warn` for medium, `danger` for low. Always paired with a text label for screen readers. |
| Step states | Done: "Done" in `ok`. Current: ink border and accent bar. Upcoming: `subtle` fill. |
| Danger button | See button variants. |
