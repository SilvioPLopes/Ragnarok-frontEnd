# Ragnarok Emulator — Frontend

Web interface for **Ragnarok Simulator**, a from-scratch Ragnarok Online emulator built with a modern stack. This repository contains exclusively the Next.js frontend that communicates with the [Spring Boot backend](../ragnarok-core).

---

## Overview

The project simulates the core mechanics of classic Ragnarok Online:

- Account registration and JWT authentication
- Character creation (NOVICE only — class progression via in-game advancement)
- Character selection filtered by authenticated account
- Map exploration with minimap image and random monster encounters
- **Pokémon-style battle screen** — monster sprite, HP bars, 2×2 action menu (Attack / Skill / Item / Flee)
- Multi-round turn-based combat with real-time HP tracking
- Victory overlay with reward parser and death overlay with animated feedback
- Stat distribution (STR / AGI / VIT / INT / DEX / LUK)
- Skill system — paged 2×2 skill submenu, `targetable` flag for offensive vs buff skills
- Inventory with consumable use in combat and equipment toggle (equip/unequip)
- Class advancement (1st → 2nd class)
- Resurrection with automatic map state refresh
- Battle log tab with color-coded damage / EXP / info entries
- **NPC interaction system** — CityPanel with SHOP, HEAL, WARP, and ambient NPC types; buy/sell modal with quantity picker; warp destination selector; NPC sprites overlaid on map at backend-defined coordinates
- **Ragnarok Online light theme design system** — unified visual language across all game panels, pixel-accurate to the classic RO client aesthetic
- Anti-fraud system integration (captcha, session drop, block detection)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript 5.7 (strict mode) |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Components | [shadcn/ui](https://ui.shadcn.com/) + Radix UI |
| Notifications | [Sonner](https://sonner.emilkowal.ski/) |
| Fonts | Press Start 2P + VT323 (Google Fonts) |
| Package manager | pnpm |

---

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- `ragnarok-core` backend running at `http://localhost:8080`

---

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# 3. Start development server
pnpm dev
```

Open `http://localhost:3000`.

> The backend must be running for all game features to work. Without it, the frontend loads normally but all API calls return connection errors.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend base URL |

---

## Project Structure

```
ragnarok-front/
├── app/
│   ├── (auth)/              # Public routes
│   │   ├── login/
│   │   └── register/
│   ├── (game)/              # Authenticated routes
│   │   ├── create-character/
│   │   ├── select-character/
│   │   └── game/
│   ├── globals.css          # Design tokens + RO component classes
│   ├── layout.tsx           # Root layout (AuthProvider, Toaster)
│   └── page.tsx             # Redirects to /login
│
├── components/
│   ├── game/
│   │   ├── player-hud.tsx          # HP / SP / Zenny sidebar
│   │   ├── map-panel.tsx           # Map minimap, walk, portals — delegates to BattleHud during encounter
│   │   ├── map-sprite.tsx          # Map minimap image (ratemyserver CDN, multi-CDN fallback)
│   │   ├── city-panel.tsx          # NPC panel — SHOP / HEAL / WARP / NPC types, buy/sell modal, warp selector
│   │   ├── battle-hud.tsx          # Pokémon-style battle screen (scene + textbox + menu)
│   │   ├── battle-menu.tsx         # 2×2 action menu (Attack / Skill / Item / Flee)
│   │   ├── battle-skill-menu.tsx   # Paged 2×2 skill submenu
│   │   ├── battle-item-overlay.tsx # Consumables overlay during combat
│   │   ├── battle-victory-overlay.tsx  # Victory screen with reward parser
│   │   ├── monster-sprite.tsx      # Monster GIF (ratemyserver CDN, icon fallback)
│   │   ├── battle-panel.tsx        # Battle log (LOG tab) — color-coded damage / EXP / info
│   │   ├── skill-panel.tsx         # Learn and use skills
│   │   ├── inventory-panel.tsx     # Items — use consumables, equip/unequip gear
│   │   ├── status-panel.tsx        # Stats display and point distribution
│   │   └── class-change-panel.tsx  # Class advancement — surfaces backend blockedReason
│   └── ui/                         # shadcn/ui components
│
├── lib/
│   ├── api.ts               # HTTP calls to backend, organized by namespace
│   ├── types.ts             # Shared TypeScript types (source of truth)
│   ├── game-context.tsx     # Global game state (GameProvider)
│   ├── auth-context.tsx     # Auth state — JWT login/register (AuthProvider)
│   └── utils.ts             # Helpers (cn, etc.)
│
└── docs/
    └── superpowers/
        ├── specs/           # Design documents
        └── plans/           # Implementation plans
```

---

## Architecture

### Global Contexts

**`AuthProvider`** (`lib/auth-context.tsx`)
Manages authentication. Calls `POST /api/accounts/login` and `POST /api/accounts/register` on the backend. Stores the JWT in `localStorage` (`auth_token`) and clears demo mode flags on real login.

**`GameProvider`** (`lib/game-context.tsx`)
Manages all game state: active player, encounters, battle log, inventory, skills, and map info. Configured in the `(game)` route layout.

### API Layer

`lib/api.ts` organizes HTTP calls into namespaces. All requests automatically include `Authorization: Bearer <token>` (read from `localStorage`) and `X-Action-Timestamp`.

```ts
playerApi    // list, get, create, distributeStats, resurrect, listAvailableClasses, changeClass
battleApi    // attack
skillApi     // list, learn, use (with optional monsterId for combat targeting)
inventoryApi // list, use, equip (toggle)
mapApi       // get, walk, travel
npcApi       // getNpcsByMap, getShop, buyItem, heal, warp, sellItem
authApi      // login, register
```

All responses are typed via `lib/types.ts`. The module includes automatic anti-fraud response handling (`FraudResponse`).

### Design System

`app/globals.css` defines the **Ragnarok Online light theme** as a set of CSS custom properties and `@layer components` utility classes. This is the authoritative visual standard for all game panels.

#### CSS Design Tokens (`--ro-*`)

| Token | Value | Usage |
|---|---|---|
| `--ro-panel-bg` | `#F7F7F7` | Panel background fill |
| `--ro-header-light` | `#D1E4F7` | Gradient top (headers, tab bar, primary buttons) |
| `--ro-header-dark` | `#9DB2DB` | Gradient base (headers, tab bar, primary buttons) |
| `--ro-border` | `#9DB2DB` | Panel and button borders |
| `--ro-border-dark` | `#8AA4CC` | Header bottom separator |
| `--ro-selection` | `#B5CFE9` | Selected list item gradient base |
| `--ro-body-bg` | `#EEF4F9` | Panel content area background |
| `--ro-page-bg` | `#CCDAE8` | Full-page background |
| `--ro-text` | `#1A2A3A` | Primary text |
| `--ro-text-muted` | `#667788` | Secondary labels |
| `--ro-text-accent` | `#1A3060` | Stat values, important numbers |
| `--ro-zenny` | `#7A5800` | Zenny currency color |

The standard panel gradient is `linear-gradient(180deg, #D1E4F7 0%, #9DB2DB 100%)`, applied uniformly to headers, tab bars, and primary action buttons.

#### Global Component Classes

| Class | Description |
|---|---|
| `.ro-panel` | Container with `#F7F7F7` background, `10px` border-radius, blue-tinted box shadow |
| `.ro-panel-header` | Standard gradient header with `10px` font, `0.3px` letter-spacing |
| `.ro-btn-primary` | Gradient button — same gradient as header, `8px` radius |
| `.ro-btn-ghost` | Flat button for secondary actions — white background, muted text |
| `.ro-list-item` | Row item with `5px/8px` padding, hover highlight, `.selected` variant |
| `.ro-tab-bar` | Tab navigation strip — gradient background |
| `.ro-tab` / `.ro-tab.active` | Individual tab; active state lifts to white panel background |
| `.ro-bar-track` / `.ro-bar-fill` | Stat bar track and fill base |
| `.ro-bar-hp` | HP gradient: `#F08080 → #D02020 → #A01010` |
| `.ro-bar-sp` | SP gradient: `#80A8F0 → #2050D0 → #1030A0` |
| `.ro-bar-exp` | EXP gradient: `#90D870 → #38A010 → #206000` |
| `.ro-stat-row` | Zebra-striped stat row with `space-between` layout |
| `.ro-section-label` | Uppercase section heading at `8px` / `4A7A9A` |
| `.ro-badge` | Inline label with semi-transparent blue background |
| `.ro-log-box` | White log container with light blue border |
| `.ro-log-dmg` / `.ro-log-exp` / `.ro-log-info` | Color-coded log line variants |

> **Architectural invariant:** BattleHud retains a dark background (the battle scene is always rendered against a dark backdrop, independent of the light theme). All other game panels use the RO light theme exclusively. The `--ro-*` tokens are not overridden in the `.dark` class — RO panels are light-theme by design.

### NPC Interaction System

`components/game/city-panel.tsx` implements the in-map NPC layer. It fetches NPCs from `GET /api/maps/{mapName}/npcs` and renders their sprites at backend-provided `(x, y)` percentage coordinates overlaid on the map image. Clicking an NPC dispatches based on its `type` field:

| NPC Type | Interaction |
|---|---|
| `SHOP` | Opens buy/sell modal (`NpcShopResponse`); quantity picker per line item |
| `HEAL` | Calls `POST /api/npcs/{npcId}/heal`; refreshes player HP/SP |
| `WARP` | Opens destination modal; calls `POST /api/npcs/{npcId}/warp` |
| `NPC` | Toast notification (no backend interaction) |

All NPC sprites are loaded from `/sprites/npcs/{spriteRef}.gif` (local, served from `public/sprites/`).

### Combat Flow

```
walk()  →  encounterOccurred: true  →  setCurrentEncounter(...)
  └── MapPanel renders BattleHud (Pokémon-style)

BattleHud:
  ├── Attack  →  battleApi.attack()  →  { message, monsterHpRemaining, playerDied?, monsterDied? }
  │     ├── monsterDied / 'VITÓRIA'  →  BattleVictoryOverlay  →  clearEncounter() + refreshMapInfo()
  │     ├── playerDied  / 'FATAL'    →  dying animation (1.5s)  →  clearEncounter() + refreshPlayer() + refreshMapInfo()
  │     └── otherwise  →  update monsterHpCurrent, next round
  ├── Skill   →  BattleSkillMenu (2×2 paged)  →  skillApi.use(aegisName, monsterId?)
  ├── Item    →  BattleItemOverlay  →  inventoryApi.use()
  └── Flee    →  clearEncounter()
```

`BattleResult` exposes `playerDied` and `monsterDied` boolean fields (optional, with string-fallback detection for backward compatibility with backends that have not yet adopted the new fields). `refreshMapInfo()` is called on all battle endings — without it, after death the player teleports to their save point but the portal list stays stale, triggering 400 errors.

### Anti-Fraud System

The backend can return a `fraud` field in any response. The frontend handles it automatically:

| Action | Behavior |
|---|---|
| `DROP_SESSION` | Clears session, redirects to login |
| `SHOW_CAPTCHA` | Opens verification modal |
| `CANCEL_ACTION` | Error toast, action cancelled |
| `BLOCKED` | Account blocked toast, forced logout |
| `FLAG_FOR_REVIEW` | Silent console log |

---

## Navigation Flow

```
/login
  └─► /select-character     (after login — lists characters for authenticated account)
        ├─► /create-character  (new character — always starts as NOVICE)
        └─► /game              (character selected)
              ├── MAP tab    (walk, encounter, attack, portals; city maps render CityPanel with NPCs)
              ├── SKILLS tab (learn and use skills)
              ├── ITEMS tab  (use consumables, equip/unequip weapons and armor)
              ├── STATUS tab (view stats, distribute stat points)
              ├── CLASS tab  (class advancement — surfaces blockedReason from backend)
              └── LOG tab    (battle log history, color-coded entries)
```

---

## Backend Integration

This frontend connects to `ragnarok-core` (Spring Boot, port 8080). Key contracts:

| Endpoint | Used for |
|---|---|
| `POST /api/accounts/register` | Registration |
| `POST /api/accounts/login` | Login → returns `{ token, accountId }` |
| `GET /api/players` | List characters (filtered by account via JWT) |
| `POST /api/players` | Create character (body: `{ name, jobClass: "NOVICE" }`) |
| `GET /api/players/{id}` | Load player state |
| `PUT /api/players/{id}/stats` | Distribute stat points |
| `POST /api/players/{id}/resurrect` | Resurrect after death |
| `GET /api/players/{id}/class-change` | List available class advancements |
| `POST /api/players/{id}/class-change` | Execute class change |
| `GET /api/players/{id}/map` | Current map + available portals |
| `POST /api/players/{id}/map/walk` | Walk — may trigger encounter |
| `POST /api/players/{id}/map/travel` | Travel to portal destination |
| `POST /api/battle/attack` | Attack monster — returns `{ message, monsterHpRemaining, playerDied?, monsterDied? }` |
| `GET /api/players/{id}/skills` | List skills |
| `POST /api/players/{id}/skills/{aegisName}/learn` | Learn skill |
| `POST /api/players/{id}/skills/{aegisName}/use` | Use skill (optional `monsterId` body) |
| `GET /api/players/{id}/inventory` | List inventory |
| `POST /api/players/{id}/inventory/{itemId}/use` | Use consumable |
| `POST /api/players/{id}/inventory/{uuid}/equip` | Toggle equip/unequip |
| `GET /api/maps/{mapName}/npcs` | Fetch NPC list for map (returns `NpcDTO[]`) |
| `GET /api/npcs/{npcId}/shop` | Fetch shop catalog (`NpcShopResponse`) |
| `POST /api/npcs/{npcId}/buy` | Purchase item from NPC shop |
| `POST /api/npcs/{npcId}/heal` | Heal player via healer NPC |
| `POST /api/npcs/{npcId}/warp` | Warp player via warp NPC |
| `POST /api/shop/npc/sell` | Sell item to NPC shop |

---

## Feature Status

| Feature | Status |
|---|---|
| Login / Registration | Connected to real backend (JWT) — RO light theme applied |
| Character creation | Functional — always creates as NOVICE |
| Character selection | Functional — filtered by authenticated account; delete calls API |
| Map / Walk | Functional — minimap image via ratemyserver CDN |
| Multi-round combat | Functional — Pokémon-style BattleHud |
| Battle outcome detection | `playerDied` / `monsterDied` fields; string-fallback for legacy backends |
| Battle Victory overlay | Functional — reward parser |
| Battle Death overlay | Functional — 1.5s animation + resurrection |
| Skill use in combat | Functional — `targetable` flag controls monsterId routing |
| Items in combat | Functional — BattleItemOverlay |
| Battle log | Functional — color-coded damage / EXP / info entries |
| Skills (out of combat) | Functional — learn and use |
| Inventory — use items | Functional |
| Inventory — equip/unequip | Functional |
| Stat distribution | Functional |
| Class advancement | Functional — `blockedReason` surfaced from backend response |
| NPC panel (CityPanel) | Implemented — SHOP / HEAL / WARP / NPC; awaiting backend NPC endpoints |
| Demo mode | Available via "ENTER DEMO MODE" on login page |
| Map refresh after battle | Fixed — stale portal list no longer causes 400s after death |
| RO light theme | Applied to all game panels (PlayerHUD, MapPanel, StatusPanel, SkillPanel, InventoryPanel, BattlePanel, ClassChangePanel, SelectCharacter, Login, Register) |

---

## Available Scripts

```bash
pnpm dev          # Development server (Turbopack) — http://localhost:3000
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint
npx tsc --noEmit  # Type check without build
```

---

## Contributing

1. Branch from `master`
2. Implement your feature or fix
3. Ensure `npx tsc --noEmit` passes with zero errors
4. Open a Pull Request with a clear description

---

## License

Private project. All rights reserved.
