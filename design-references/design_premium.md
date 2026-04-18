# 💎 STRATUM INDUSTRIAL OS 1.0: MASTER UI REFINEMENT

**TARGET:** Transform the current "Functional Dashboard" into a "Premium Industrial Command Center."

---

## 1. GLOBAL UI CORE (Eyes-Comfort Focus)
- **Base Font:** 'Plus Jakarta Sans'. 
    - UI Labels/Table Data: `14px` (Regular).
    - Card Values (e.g., 0.04%): `28px` (Extra Bold).
- **Platform Size:** Ensure `max-width: 1440px` for the main container to prevent over-stretching on large monitors.
- **Background:** Replace the flat gray background with a very subtle dark gradient (`#0F172A` to `#1E293B`) to allow glass elements to "pop."

---

## 2. COMPONENT OVERHAUL (Based on Pulse Dashboard)

### A. The Sidebar (The "Glass" Anchor)
- **Visuals:** Change from solid navy to `rgba(15, 23, 42, 0.4)` with `backdrop-filter: blur(20px)`.
- **Active State (Executive Pulse):** Remove the solid blue block. Replace with a **Subtle Left-Border Glow** and a light blue transparent background.
- **Icons:** Replace current icons with **Lucide React** (Stroke: 1.5).

### B. KPI Cards (System OEE, Node Status, etc.)
- **Architecture:** - **Radius:** `24px`.
    - **Background:** `white` at `0.7` opacity for light mode OR `rgba(30, 41, 59, 0.5)` for dark mode.
    - **Border:** `1px solid rgba(255, 255, 255, 0.1)`.
- **Icons:** Enclose the icons (Shield, Satellite) in a small circle with a soft background glow matching their status (Emerald for active, Amber for warning).

### C. Incident Feed (The Right Column)
- **Transparency:** Remove the white card backgrounds.
- **Item Styling:** Use a horizontal "Glass Plank" for each incident.
- **Status Indicators:** Use a "Pill" style for [WARNING] and [CRITICAL] with a blurred background of the same color to create a "Neon Glow" effect.

### D. Main Charts (Efficiency Trend-Line)
- **Color:** Use a gradient fill under the line/bars from `#3B82F6` to `transparent`.
- **Rounding:** Ensure bar charts have `4px` top-corner rounding for a smoother look.

---

## 3. ICONOGRAPHY & LOGO REPLACEMENT
- **Top Left Logo:** Ensure the 'S' icon uses a mesh gradient (Blue to Purple).
- **Incident Icons:** Replace the yellow triangles with custom SVG Lucide icons (`AlertTriangle`, `XCircle`) and all emojies in the platform.
- **Profile:** Ensure the user profile (top right) has a `2px` white glass border.

---

## 4. INTERACTION & POLISH
- **Hover:** All cards should lift slightly (`translate-y-[-4px]`) and increase shadow depth on hover.
- **Transitions:** Use `cubic-bezier(0.4, 0, 0.2, 1)` for all state changes to give that "Premium OS" feel.