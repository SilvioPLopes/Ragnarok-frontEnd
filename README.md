# Ragnarok Emulator — Frontend

Web interface for **Ragnarok Simulator**, a from-scratch Ragnarok Online emulator built with a modern stack. This repository contains exclusively the Next.js frontend that communicates with the [Spring Boot backend](../ragnarok-core).

---

## Overview

The project simulates the core mechanics of classic Ragnarok Online:

- Account registration and JWT authentication
- Character creation (NOVICE only — class progression via in-game advancement)
- Character selection filtered by authenticated account
- Map exploration with random monster encounters
- Multi-round turn-based combat with real-time HP tracking
- Stat distribution (STR / AGI / VIT / INT / DEX / LUK)
- Skill system — learn and use skills (with monster targeting in combat)
- Inventory with consumable use and equipment toggle (equip/unequip)
- Class advancement (1st → 2nd class)
- Death overlay with resurrection
- Battle log tab
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
│   ├── layout.tsx           # Root layout (AuthProvider, Toaster)
│   └── page.tsx             # Redirects to /login
│
├── components/
│   ├── game/
│   │   ├── player-hud.tsx       # HP / SP / Zenny sidebar
│   │   ├── map-panel.tsx        # Map, walk, encounters, portals
│   │   ├── battle-panel.tsx     # Battle log (LOG tab)
│   │   ├── skill-panel.tsx      # Learn and use skills
│   │   ├── inventory-panel.tsx  # Items — use consumables, equip gear
│   │   ├── status-panel.tsx     # Stats display and point distribution
│   │   └── class-change-panel.tsx  # Class advancement
│   └── ui/                  # shadcn/ui components
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
authApi      // login, register
```

All responses are typed via `lib/types.ts`. The module includes automatic anti-fraud response handling (`FraudResponse`).

### Combat Flow

```
walk()  →  encounterOccurred: true  →  setCurrentEncounter({ monsterHpInitial, monsterHpCurrent })
attack()  →  { message, monsterHpRemaining }
           ├── message includes 'VITÓRIA'  →  clearEncounter()
           └── otherwise               →  update monsterHpCurrent, keep encounter active
```

Combat is multi-round: the encounter persists between attacks until the monster dies (`VITÓRIA` in message) or the player dies (`FATAL` in message).

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
              ├── MAP tab    (walk, encounter, attack, portals)
              ├── SKILLS tab (learn and use skills)
              ├── ITEMS tab  (use consumables, equip/unequip weapons and armor)
              ├── STATUS tab (view stats, distribute stat points)
              ├── CLASS tab  (class advancement)
              └── LOG tab    (battle log history)
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
| `POST /api/battle/attack` | Attack monster — returns `{ message, monsterHpRemaining }` |
| `GET /api/players/{id}/skills` | List skills |
| `POST /api/players/{id}/skills/{aegisName}/learn` | Learn skill |
| `POST /api/players/{id}/skills/{aegisName}/use` | Use skill (optional `monsterId` body) |
| `GET /api/players/{id}/inventory` | List inventory |
| `POST /api/players/{id}/inventory/{itemId}/use` | Use consumable |
| `POST /api/players/{id}/inventory/{uuid}/equip` | Toggle equip/unequip |

---

## Feature Status

| Feature | Status |
|---|---|
| Login / Registration | Connected to real backend (JWT) |
| Character creation | Functional — always creates as NOVICE |
| Character selection | Functional — filtered by authenticated account |
| Map / Walk | Functional |
| Multi-round combat | Functional — HP tracks across rounds |
| Battle log | Functional — LOG tab |
| Skills | Functional — combat targeting included |
| Inventory — use items | Functional |
| Inventory — equip/unequip | Functional |
| Stat distribution | Functional |
| Resurrect | Functional |
| Class advancement | Functional |
| Demo mode | Available via "ENTER DEMO MODE" on login page |

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
