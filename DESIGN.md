---
version: alpha
name: 100Percent — The Descent
description: "Cinematic deep-space minimalism: a near-monochrome navy abyss with hairline HUD instrumentation, monospace labels, and a single gold accent. Reference posture: igloo.inc — scroll as camera, type as instrument — adapted for a maths education platform."
colors:
  abyss: "#050a12"
  deep: "#0a1523"
  surface: "#0e1b2c"
  fog: "#8fa3b8"
  snow: "#e8edf2"
  gold: "#d4af37"
  line: "rgba(232,237,242,0.14)"
  danger: "#ef4444"
  success: "#10b981"
typography:
  mono-label:
    fontFamily: "Geist Mono"
    fontSize: 0.6875rem
    fontWeight: 500
    letterSpacing: "0.14em"
    lineHeight: 1.4
  mono-body:
    fontFamily: "Geist Mono"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.7
  display-xl:
    fontFamily: "Bricolage Grotesque"
    fontSize: 4.5rem
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  display-md:
    fontFamily: "Bricolage Grotesque"
    fontSize: 2.75rem
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  numeral-giant:
    fontFamily: "Bricolage Grotesque"
    fontSize: 7rem
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.03em"
rounded:
  sm: 2px
  md: 4px
  full: 999px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 96px
  xxl: 160px
components:
  hud-label:
    textColor: "{colors.fog}"
    typography: "{typography.mono-label}"
  hud-label-active:
    textColor: "{colors.snow}"
    typography: "{typography.mono-label}"
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.abyss}"
    typography: "{typography.mono-label}"
    rounded: "{rounded.sm}"
    padding: 16px
  button-primary-hover:
    backgroundColor: "{colors.snow}"
    textColor: "{colors.abyss}"
    typography: "{typography.mono-label}"
    rounded: "{rounded.sm}"
    padding: 16px
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.snow}"
    typography: "{typography.mono-label}"
    rounded: "{rounded.sm}"
    padding: 16px
  hairline-divider:
    backgroundColor: "{colors.line}"
    height: 1px
    width: 100%
  station-leader:
    backgroundColor: "{colors.line}"
    height: 1px
    width: 120px
---

## Overview

**100Percent — "The Descent"** is a cinematic, scroll-driven identity for a maths
education platform (Gordon's School brand: navy + gold). The reference posture is
igloo.inc: the page is a journey, not a document. One fixed WebGL canvas sits behind
everything; the document is a tall spacer whose only job is to feed scroll progress
to a camera on a fixed path. Type is instrumentation — small, monospaced, pinned to
corners and edges — never a headline floating over the scene's center.

Three content beats replace feature-card grids: **stations** (labelled objects in
space with leader lines), **data readouts** (instrument-style values, not monument
stat tiles), and a **finale platform** (one primary action).

## Colors

- **Abyss (#050a12):** the void. Page background; canvas clear color.
- **Deep (#0a1523):** section panels, app chrome (dashboard, task, question pages).
- **Surface (#0e1b2c):** raised elements — inputs, table rows, cards on app pages.
- **Fog (#8fa3b8):** muted text, inactive labels, captions. The "grey ice" voice.
- **Snow (#e8edf2):** primary text. Never pure white — slightly cold.
- **Gold (#d4af37):** the ONLY accent. Interactive affordances, the crystal,
  key numerals. If two accent colors appear on one screen, one is wrong.
- **Line (rgba(232,237,242,0.14)):** hairlines, borders, leader lines, brackets.

## Typography

Two families, strict roles:

- **Geist Mono** — all UI: nav, labels, buttons, body copy, captions, data.
  Labels are 10–11px uppercase, +0.14em tracking. This is the site's voice.
- **Bricolage Grotesque** — display only: hero statements, giant numerals,
  section titles. Tight leading (0.95), slight negative tracking. Used rarely;
  scarcity is what makes it land.

Never center body text. Content hangs from the left or right edge; the canvas
center belongs to the 3D scene.

## Layout

- Full-bleed fixed canvas (`position: fixed; inset: 0`), z-index 0.
- HUD elements pinned to the four corners, always visible, z-index above content.
- Scroll spacer sections: `min-height: 100vh`, content constrained to a 1200px
  rail, aligned to rails — never centered stacks.
- App pages (login, dashboard, task, question) are **Monitor/Operate** surfaces:
  no hero theatre, density and glanceability first, same tokens.

## Elevation & Depth

No glassmorphism, no blurred cards, no glow shadows. Depth comes from the 3D
scene (fog, camera distance) and from **hairlines**: 1px `line` borders and
divider rules. Raised elements on app pages use a 1px border on `surface` —
not a shadow.

## Shapes

Sharp, near-square: radius 2px on interactive elements, 4px on containers.
Full-round only for the status dot. No pill buttons, no rounded cards.

## Components

- **hud-label** — corner/edge instrumentation; mono, fog color.
- **button-primary** — gold fill, abyss text, sharp corners, mono label.
  The single high-emphasis action per view.
- **button-ghost** — hairline border, snow text, transparent fill.
- **station-leader** — 1px horizontal rule connecting a 3D object's screen
  position to its mono caption block.
- **Section marks** — mono indices (`01`, `02`, `03`) and slash runs
  (`//////`) open each beat, left-aligned.

## Do's and Don'ts

**Do**

- Keep one accent (gold) per screen.
- Use mono labels with index numbers for everything instructional.
- Let the 3D scene carry emotion; keep DOM type quiet.
- Respect `prefers-reduced-motion`: static frame, no camera flight.

**Don't**

- No emoji icons, no icon-topped cards, no equal-width feature grids.
- No glassmorphism/backdrop-blur panels, no gradient buttons.
- No monument stat blocks — data belongs in readout rows with units.
- No centered hero stacks over the scene; corners and rails only.
- No pure black or pure white; everything sits in the cold navy/snow range.
