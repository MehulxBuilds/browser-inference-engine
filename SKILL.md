---
name: minecraft-ui
description: Build polished Minecraft-inspired interfaces, websites, dashboards, and applications using voxel aesthetics, pixel-art textures, block-based layouts, inventory grids, and authentic Minecraft-inspired UI patterns. Use when users request Minecraft-style, voxel-style, blocky pixel-art, or game-inspired interfaces.
---

# Minecraft UI Design Skill

## 1. Design Philosophy

Create interfaces inspired by Minecraft's distinctive visual identity.

The interface should feel like an extension of the Minecraft universe:
- Block-based visual language.
- Pixel-art textures and patterns.
- Chunky borders and sharp edges.
- Natural materials and earthy colors.
- Retro game interfaces.
- Functional, readable layouts.

Do not make every interface look like an actual game inventory. Adapt the visual language to the product's purpose.

## 2. Visual Identity

### Color Palette

Use these colors as the foundation:

| Token | Color | Usage |
|---|---|---|
| Grass Green | #5D9B35 | Primary actions |
| Dark Green | #365E26 | Hover and active states |
| Dirt Brown | #795438 | Panels |
| Wood Brown | #9C7046 | Secondary surfaces |
| Stone Gray | #777777 | Neutral elements |
| Dark Stone | #333333 | Backgrounds |
| Sand | #DCCB9C | Light surfaces |
| Diamond Blue | #42C8D8 | Highlights |
| Redstone | #B73535 | Destructive actions |

Adapt the palette to the context. Avoid using every color simultaneously.

## 3. Typography

Preferred typography:
- Minecraftia
- Press Start 2P
- VT323
- Silkscreen
- Monospace fallbacks

Rules:
- Use pixel fonts for headings, buttons, badges, and game-like labels.
- Use readable sans-serif fonts for longer descriptions.
- Avoid using highly pixelated typography for paragraphs.
- Maintain clear typographic hierarchy.

## 4. Component Design

### Buttons

Buttons should resemble Minecraft game controls.

Requirements:
- Square or minimally rounded corners.
- Thick borders.
- Pixel-style shadows.
- Strong pressed states.
- Visible hover feedback.
- Clear disabled states.

### Cards and Panels

Use:
- Stone-like surfaces.
- Wooden panels.
- Dirt-textured containers.
- Chunky borders.
- Subtle pixel shadows.

### Inventory Grids

When appropriate, use:
- Uniform square item slots.
- Dark recessed backgrounds.
- Slot borders.
- Item icons.
- Hover tooltips.
- Selected and disabled states.

### Navigation

Possible patterns:
- Minecraft hotbar navigation.
- Wooden tab navigation.
- Stone menu buttons.
- Pixelated active indicators.

### Modals

Use Minecraft-inspired dialog panels:
- Centered layout.
- Dark translucent overlay.
- Stone or wood background.
- Pixel-style title.
- Clear action buttons.

## 5. Texture and Background Rules

Use textures selectively:
- Grass blocks.
- Dirt.
- Stone.
- Cobblestone.
- Oak planks.
- Obsidian.
- Deepslate.

Rules:
- Prefer subtle repeating textures.
- Preserve text contrast.
- Avoid excessive visual noise.
- Use pixelated backgrounds without smoothing.
- Use CSS patterns or custom assets where appropriate.

## 6. Layout Principles

- Use consistent spacing.
- Favor clear geometric alignment.
- Use block-based compositions.
- Keep interactive elements visually distinct.
- Maintain responsive layouts.
- Do not sacrifice usability for aesthetic accuracy.

Desktop:
- More elaborate panels and grid compositions.
- Sidebar or top navigation.
- Optional inventory-inspired layouts.

Mobile:
- Simplified navigation.
- Responsive item grids.
- Touch-friendly buttons.
- Avoid unnecessarily dense inventory layouts.

## 7. Animation and Interaction

Use restrained game-inspired interactions.

Examples:
- Button press depth animation.
- Pixelated hover transitions.
- Item-slot highlighting.
- Smooth modal transitions.
- Subtle floating item icons.
- Loading indicators inspired by game progress bars.

Avoid:
- Excessive bouncing.
- Constant movement.
- Unnecessary particle effects.
- Long animations.

## 8. Technical Implementation

Preferred stack:
- React
- Next.js
- TypeScript
- Tailwind CSS
- Lucide React
- shadcn/ui when useful

Implementation rules:
- Build reusable components.
- Use design tokens.
- Keep components accessible.
- Use semantic HTML.
- Implement responsive behavior.
- Preserve keyboard navigation.
- Avoid unnecessary dependencies.
- Use CSS `image-rendering: pixelated` for pixel-art assets.
- Use custom SVG or CSS assets where practical.

## 9. Design Quality Rules

Never:
- Make the entire interface green.
- Use pixel fonts for all body text.
- Add random Minecraft blocks as decoration.
- Make everything look like a game menu.
- Compromise readability.
- Use generic modern SaaS cards without adapting their styling.

Always:
- Establish a cohesive Minecraft-inspired design system.
- Make the visual hierarchy obvious.
- Use textures intentionally.
- Maintain spacing consistency.
- Make interactions feel tactile.
- Ensure the interface is usable on mobile and desktop.

## 10. Final Design Goal

The final interface should feel like a carefully designed product that exists inside the Minecraft universe.

It should be recognizable through its:
- Textures.
- Color language.
- Pixel aesthetics.
- Block-based compositions.
- Game-inspired interactions.

But it must still feel like a polished, modern, usable application.

