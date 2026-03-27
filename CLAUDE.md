# CLAUDE.md — ragnarok-front

> See also `../../CLAUDE.md` for full ecosystem context.

## What this project is

Next.js frontend for the Ragnarok Simulator. Player interface that consumes the `ragnarok-core` API (port 8080).

## Ports and dependencies

| Service | Port | Required for |
|---|---|---|
| This project | 3000 | — |
| `ragnarok-core` | 8080 | All game features |

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript 5.7 (strict)
- Tailwind CSS 4, shadcn/ui, Radix UI
- Sonner (toasts), Lucide React (icons)
- pnpm

## Run locally

```bash
pnpm install
pnpm dev              # http://localhost:3000
npx tsc --noEmit      # type check without build
```

## Critical files

| File | Responsibility |
|---|---|
| `lib/types.ts` | All TypeScript types. Source of truth. |
| `lib/api.ts` | All HTTP calls to backend, organized by namespace. No business logic. |
| `lib/game-context.tsx` | Global game state. `GameProvider` wraps `(game)` routes. |
| `lib/auth-context.tsx` | Auth state. `AuthProvider` is in root layout. Calls real backend. |

## API namespaces — `lib/api.ts`

| Namespace | Methods |
|---|---|
| `playerApi` | `list`, `get`, `create`, `distributeStats`, `resurrect`, `listAvailableClasses`, `changeClass` |
| `battleApi` | `attack` |
| `skillApi` | `list`, `learn`, `use` (optional `monsterId` for combat targeting) |
| `inventoryApi` | `list`, `use`, `equip` (toggle — same endpoint equips and unequips) |
| `mapApi` | `get`, `walk`, `travel` |
| `authApi` | `login`, `register` |

`apiFetch` automatically injects `Authorization: Bearer <token>` (reads `auth_token` from localStorage) and `X-Action-Timestamp` on every request.

## Naming conventions

- `jobClass` in `PlayerResponse` is `JobClass` (union type) — never `string`
- `intelligence` is the frontend field; the PUT stats payload uses `"int"` as the key
- `zenny` (double n) — not `zeny`
- `statPoints` — not `statusPoints`
- `aegisName` from `SkillRow` goes in API URLs — never use `name`
- `hpCurrent/hpMax` and `spCurrent/spMax` — not `hp/maxHp/mp/maxMp`
- `MapInfo` fields: `currentMap` and `availablePortals` (not `mapName`/`portals`)
- `BattleResult` has `monsterHpRemaining` — updated after each attack round
- `Encounter` has both `monsterHpInitial` (set once) and `monsterHpCurrent` (updated each round)

## Auth

`lib/auth-context.tsx` calls the real backend:
- `login()` → `POST /api/accounts/login` → stores `auth_token` + `auth_user` in localStorage, clears `demo_mode`
- `register()` → `POST /api/accounts/register` → then auto-login
- `logout()` → clears `auth_token`, `auth_user`, `demo_mode`, `demo_user`

`LoginResponseDTO` returns `{ token: string, accountId: number }`.

## Demo mode

The login page has an "ENTER DEMO MODE" button that sets `localStorage.setItem('demo_mode', 'true')`. When `demo_mode === 'true'`, `select-character` shows fake players instead of calling the API. Real login clears `demo_mode` automatically.

## Game tabs (`/game`)

| Tab value | Component | Status |
|---|---|---|
| `map` | `MapPanel` | Walk, encounter, multi-round combat, portals |
| `skills` | `SkillPanel` | Learn skills, use skills (with monster targeting in combat) |
| `inventory` | `InventoryPanel` | Use consumables, equip/unequip weapons and armor |
| `status` | `StatusPanel` | View and distribute stat points |
| `class` | `ClassChangePanel` | Class advancement — lists from API |
| `log` | `BattlePanel` | Battle log history |

## Combat flow

```
walk() → encounterOccurred: true → currentEncounter = { monsterHpInitial, monsterHpCurrent }
attack() → { message, monsterHpRemaining }
  ├── message includes 'VITÓRIA' → clearEncounter()
  ├── message includes 'FATAL'   → clearEncounter() (player died)
  └── otherwise                  → monsterHpCurrent = monsterHpRemaining (next round)
```

## Anti-fraud system

Any backend response may include `fraud: FraudResponse`. Handler is `handleFraudResponse()` in `lib/api.ts`. Configured via `configureFraudHandler()` inside `GameProvider`.

| requiredAction | Behavior |
|---|---|
| `DROP_SESSION` | Clears session, redirects to `/` |
| `SHOW_CAPTCHA` | Opens captcha modal |
| `BLOCKED` | Error toast + redirect to `/` |
| `CANCEL_ACTION` | Error toast |
| `FLAG_FOR_REVIEW` / `ALERT_ONLY` | Silent console warn |

## Known gaps (backend endpoints pending)

| Feature | Missing endpoint |
|---|---|
| NPC Shop UI | `GET/POST /api/shop/npc/*` — endpoints exist in core, no UI in front |
| Cash Shop UI | `GET/POST /api/shop/cash/*` — endpoints exist in core, no UI in front |
| Market UI | `GET/POST /api/market/listings/*` — endpoints exist in core, no UI in front |
| Trade UI | `POST/GET /api/trade/offers/*` — endpoints exist in core, no UI in front |
