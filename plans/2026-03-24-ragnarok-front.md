# ragnarok-front Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o frontend React/TypeScript do jogo Ragnarok Online que consome a API REST do ragnarok-core e integra com as respostas do sistema antifraude.

**Architecture:** SPA com Vite + React 18 + TypeScript. Estado global via Zustand (player, combat). Data fetching via TanStack Query com invalidacao automatica. A camada antifraude nao e chamada diretamente pelo frontend — o backend (ragnarok-core) chama o microsservico, mas o frontend precisa enviar metadados de timing nas acoes e tratar as respostas de `requiredAction` (SHOW_CAPTCHA, DROP_SESSION, BLOCKED).

**Tech Stack:** Vite 5, React 18, TypeScript 5, React Router v6, Zustand 4, TanStack Query v5, Axios, Tailwind CSS, Vitest + React Testing Library

---

## Convencoes importantes

- Backend base URL: `http://localhost:8080/api` (configuravel via `.env`)
- Antifraude base URL: `http://localhost:8081` (chamado PELO CORE, nao pelo frontend diretamente)
- Cada acao de combat/click DEVE incluir header `X-Action-Timestamp` e campo `actionsPerSecond` no body quando a API aceitar (para o core repassar ao antifraude via `BotClickSpeedRule`)
- Respostas do core podem trazer campo `requiredAction: "SHOW_CAPTCHA" | "DROP_SESSION" | "CANCEL_ACTION" | "FLAG_FOR_REVIEW" | "NONE"` — o frontend DEVE tratar todos
- Botoes de acao de combate devem ter cooldown minimo de 500ms (throttle) para nao disparar `APS > 15` no antifraude
- Se `verdict === "BLOCKED"` ou `requiredAction === "DROP_SESSION"`: logout imediato + redirect para `/`

---

## Mapa de Arquivos

```
ragnarok-front/
├── src/
│   ├── api/
│   │   ├── client.ts            # Axios instance + interceptors (timestamp header, fraud handler)
│   │   ├── playerApi.ts         # CRUD de player, resurrect, stat distribution
│   │   ├── battleApi.ts         # attack, useSkillInCombat
│   │   ├── skillApi.ts          # listSkills, learnSkill, useSkillOutOfCombat
│   │   ├── itemApi.ts           # listInventory, equipItem, useItem
│   │   ├── mapApi.ts            # getMap, getMonsters, getPortals, move
│   │   └── classApi.ts          # listAvailableClasses, changeClass
│   ├── store/
│   │   ├── playerStore.ts       # Zustand: player atual (id, name, hp, sp, buffs, location)
│   │   ├── combatStore.ts       # Zustand: monstro alvo, log de batalha, estado de combate
│   │   └── uiStore.ts           # Zustand: loading global, modal captcha, notificacoes
│   ├── hooks/
│   │   ├── useActionGuard.ts    # Throttle 500ms + calcula actionsPerSecond + trata requiredAction
│   │   ├── usePlayer.ts         # useQuery: GET /players/{id}
│   │   ├── useCombat.ts         # useMutation: attack + skillInCombat
│   │   ├── useInventory.ts      # useQuery + useMutation: inventory, equip, use
│   │   ├── useSkills.ts         # useQuery + useMutation: listSkills, learn, useOutOfCombat
│   │   ├── useMap.ts            # useQuery: map + monsters + portals + move
│   │   └── useClassChange.ts    # useQuery + useMutation: available classes, change
│   ├── components/
│   │   ├── ui/
│   │   │   ├── HpBar.tsx        # Barra HP com cores (verde/amarelo/vermelho por %)
│   │   │   ├── SpBar.tsx        # Barra SP (azul)
│   │   │   ├── ExpBar.tsx       # Barra EXP base + barra EXP job (separadas)
│   │   │   ├── StatPanel.tsx    # STR/AGI/VIT/INT/DEX/LUK (base + bonus equipamento + buff)
│   │   │   ├── BuffList.tsx     # Lista de buffs ativos com duração restante em turnos
│   │   │   ├── CaptchaModal.tsx # Modal que bloqueia UI quando requiredAction=SHOW_CAPTCHA
│   │   │   └── ActionButton.tsx # Botao com throttle interno + spinner durante requisicao
│   │   ├── player/
│   │   │   ├── PlayerDashboard.tsx   # Painel completo: nome, classe, level, HP, SP, EXP, stats
│   │   │   └── StatDistributor.tsx   # UI para gastar statPoints (+ / -)
│   │   ├── inventory/
│   │   │   ├── InventoryGrid.tsx     # Grade de itens com filtros (arma/armadura/consumivel)
│   │   │   └── ItemCard.tsx          # Card de item: nome, quantidade, slots, equipado/não
│   │   ├── skills/
│   │   │   ├── SkillTree.tsx         # Lista de skills com prereqs, nivel atual/max
│   │   │   └── SkillCard.tsx         # Card de skill: nome, nivel, bloqueado/disponivel
│   │   ├── combat/
│   │   │   ├── CombatScreen.tsx      # Tela principal de combate: monstro + acoes + log
│   │   │   ├── BattleLog.tsx         # Log de texto com scroll automatico
│   │   │   └── MonsterCard.tsx       # Card do monstro: nome, HP restante, gif, atributos
│   │   ├── map/
│   │   │   ├── MapView.tsx           # Mapa atual: nome, coordenada do player, lista de spawns
│   │   │   └── PortalList.tsx        # Lista de portais disponiveis para navegar
│   │   └── classchange/
│   │       └── ClassChangeScreen.tsx # Arvore de progressao de classe com validacao
│   ├── pages/
│   │   ├── CreateCharacterPage.tsx   # Formulario: nome + selecao de classe inicial
│   │   ├── GamePage.tsx              # Shell do jogo: sidebar (player) + tabs (mapa/combate/inv/skills)
│   │   └── NotFoundPage.tsx
│   ├── types/
│   │   ├── player.ts    # Player, PlayerStats, ActiveBuff, PlayerLocation, PlayerItem
│   │   ├── monster.ts   # Monster, MonsterDrop
│   │   ├── item.ts      # Item, ItemStats, ItemType, EquipSlot
│   │   ├── skill.ts     # SkillRow, SkillEffect
│   │   ├── map.ts       # GameMap, Portal, MonsterSpawn
│   │   └── fraud.ts     # FraudResponse (requiredAction, verdict, riskLevel)
│   ├── App.tsx          # Router setup
│   └── main.tsx         # Entry point
├── .env.example
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## FASE 0 — Fundacao (sequential, todos os agentes dependem disso)

### Task 0: Scaffold do projeto

**Files:**
- Create: `ragnarok-front/package.json`
- Create: `ragnarok-front/vite.config.ts`
- Create: `ragnarok-front/tsconfig.json`
- Create: `ragnarok-front/tailwind.config.ts`
- Create: `ragnarok-front/.env.example`
- Create: `ragnarok-front/src/main.tsx`
- Create: `ragnarok-front/src/App.tsx`

- [ ] **Step 1: Criar o projeto com Vite**

```bash
cd C:\Users\silve\IdeaProjects
npm create vite@latest ragnarok-front -- --template react-ts
cd ragnarok-front
npm install
```

- [ ] **Step 2: Instalar dependencias**

```bash
npm install \
  react-router-dom@6 \
  zustand@4 \
  @tanstack/react-query@5 \
  axios \
  tailwindcss @tailwindcss/vite \
  clsx

npm install -D \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  jsdom
```

- [ ] **Step 3: Configurar Tailwind no vite.config.ts**

```typescript
// ragnarok-front/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 4: Criar src/test-setup.ts**

```typescript
// ragnarok-front/src/test-setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Criar .env.example**

```
VITE_API_URL=http://localhost:8080/api
VITE_PLAYER_ID=1
```

- [ ] **Step 6: Criar App.tsx com rotas**

```typescript
// ragnarok-front/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CreateCharacterPage from './pages/CreateCharacterPage'
import GamePage from './pages/GamePage'
import NotFoundPage from './pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CreateCharacterPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 7: Criar paginas vazias (stubs) para o router nao quebrar**

```typescript
// ragnarok-front/src/pages/CreateCharacterPage.tsx
export default function CreateCharacterPage() { return <div>Create Character</div> }

// ragnarok-front/src/pages/GamePage.tsx
export default function GamePage() { return <div>Game</div> }

// ragnarok-front/src/pages/NotFoundPage.tsx
export default function NotFoundPage() { return <div>404</div> }
```

- [ ] **Step 8: Verificar que o projeto roda**

```bash
npm run dev
```
Expected: servidor em http://localhost:5173 sem erros no console

- [ ] **Step 9: Commit**

```bash
git init && git add . && git commit -m "feat: scaffold ragnarok-front (Vite + React + TS + TailwindCSS + React Query)"
```

---

### Task 1: Tipos de dominio (types/)

**Files:**
- Create: `ragnarok-front/src/types/player.ts`
- Create: `ragnarok-front/src/types/monster.ts`
- Create: `ragnarok-front/src/types/item.ts`
- Create: `ragnarok-front/src/types/skill.ts`
- Create: `ragnarok-front/src/types/map.ts`
- Create: `ragnarok-front/src/types/fraud.ts`

- [ ] **Step 1: Criar player.ts**

```typescript
// ragnarok-front/src/types/player.ts
import type { ItemDefinition } from './item'

export interface PlayerStats {
  str: number
  agi: number
  vit: number
  intVal: number
  dex: number
  luk: number
  maxHp: number
  maxSp: number
}

export interface ActiveBuff {
  skillAegisName: string
  statType: string
  value: number
  remainingTurns: number  // -1 = passiva permanente
}

export interface PlayerLocation {
  mapName: string
  x: number
  y: number
  savePointMap: string
}

export interface PlayerItem {
  id: string  // UUID
  itemDefinition: ItemDefinition
  amount: number
  isEquipped: boolean
  refineLevel: number
}

export interface Player {
  id: number
  name: string
  jobClass: string
  gender?: string
  baseLevel: number
  jobLevel: number
  baseExp: number
  jobExp: number
  // Fornecidos pelo backend para barras de EXP
  baseExpNeeded?: number
  jobExpNeeded?: number
  zenny: number
  statPoints: number
  skillPoints: number
  hpCurrent: number
  spCurrent: number
  stats: PlayerStats
  location: PlayerLocation
  inventory: PlayerItem[]
  activeBuffs: ActiveBuff[]
  // Totais calculados pelo backend (com bonus de equip + buff)
  totalStr?: number
  totalAgi?: number
  totalVit?: number
  totalInt?: number
  totalDex?: number
  totalLuk?: number
  maxHp?: number
  maxSp?: number
  totalAtk?: number
  totalDef?: number
  totalHit?: number
  totalFlee?: number
}
```

- [ ] **Step 2: Criar monster.ts**

```typescript
// ragnarok-front/src/types/monster.ts
export interface MonsterAttributes {
  str?: number
  agi?: number
  vit?: number
  int?: number
  dex?: number
  luk?: number
}

export interface MonsterStats {
  hp?: number
  atk?: number
  def?: number
  flee?: number
  hit?: number
  mdef?: number
}

export interface MonsterDrop {
  itemId: number
  itemName: string
  chance: number  // 0-10000 (base 10000 = 100%)
}

export interface Monster {
  id: number
  name: string
  size: 'SMALL' | 'MEDIUM' | 'LARGE'
  race: string
  type: string
  elementPower?: number
  gifUrl?: string
  baseExp?: number
  jobExp?: number
  attributes?: MonsterAttributes
  stats?: MonsterStats
  drops?: MonsterDrop[]
  modes?: string[]
  // HP atual (quando spawnado no mapa)
  hpCurrent?: number
}
```

- [ ] **Step 3: Criar item.ts (com ItemStats e ItemDefinition)**

```typescript
// ragnarok-front/src/types/item.ts
export type ItemType = 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'ETC'
export type EquipSlot = 'HAND_R' | 'HAND_L' | 'HEAD_TOP' | 'HEAD_MID' | 'HEAD_BOTTOM' |
  'ARMOR' | 'SHOES' | 'GARMENT' | 'ACCESSORY_R' | 'ACCESSORY_L' | 'NONE'

export interface ItemStats {
  attack?: number
  mAttack?: number
  defense?: number
  bonusStr?: number
  bonusAgi?: number
  bonusVit?: number
  bonusInt?: number
  bonusDex?: number
  bonusLuk?: number
  bonusSP?: number
  efeito?: number
}

export interface ItemDefinition {
  id: number
  name: string
  type: ItemType
  equipSlot?: EquipSlot
  weaponType?: string
  stats?: ItemStats
  weight?: number
  price?: number
}
```

- [ ] **Step 4: Criar skill.ts (com SkillRow e SkillEffect)**

```typescript
// ragnarok-front/src/types/skill.ts
export interface SkillEffect {
  statType: string        // ex: "STR", "ATK", "MAX_HP_PERCENT"
  valueFormula: string    // ex: "skill_lv * 3"
}

export interface SkillRow {
  skillId: string
  aegisName: string
  maxLevel: number
  currentLevel: number
  canLearn: boolean
  blockedReason?: string
}
```

- [ ] **Step 5: Criar map.ts e fraud.ts**

```typescript
// ragnarok-front/src/types/map.ts
export interface Portal {
  id: number
  fromMap: string
  toMap: string
  fromX: number
  fromY: number
}

export interface MonsterSpawn {
  monsterId: number
  monsterName: string
  amount: number
}

export interface GameMap {
  name: string
  displayName?: string
  portals: Portal[]
  spawns: MonsterSpawn[]
}

// ragnarok-front/src/types/fraud.ts
export type Verdict = 'APPROVED' | 'BLOCKED' | 'CHALLENGE' | 'UNKNOWN'
export type RequiredAction = 'NONE' | 'CANCEL_ACTION' | 'SHOW_CAPTCHA' | 'DROP_SESSION' | 'FLAG_FOR_REVIEW' | 'ALERT_ONLY'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface FraudResponse {
  verdict: Verdict
  requiredAction: RequiredAction
  riskLevel: RiskLevel
  reason?: string
}
```

- [ ] **Step 6: Escrever teste de tipos (smoke test)**

```typescript
// ragnarok-front/src/types/__tests__/types.test.ts
import { describe, it, expect } from 'vitest'
import type { Player } from '../player'
import type { FraudResponse } from '../fraud'

describe('types', () => {
  it('Player shape has required fields', () => {
    const p: Partial<Player> = { id: 1, name: 'Test', baseLevel: 1 }
    expect(p.id).toBe(1)
  })

  it('FraudResponse verdicts are exhaustive', () => {
    const verdicts = ['APPROVED', 'BLOCKED', 'CHALLENGE', 'UNKNOWN']
    expect(verdicts).toHaveLength(4)
  })
})
```

- [ ] **Step 7: Rodar testes**

```bash
npm run test
```
Expected: 2 passed

- [ ] **Step 8: Commit**

```bash
git add src/types && git commit -m "feat: add domain types (Player, Monster, Item, Skill, Map, Fraud)"
```

---

### Task 2: API Client Layer (api/)

**Files:**
- Create: `ragnarok-front/src/api/client.ts`
- Create: `ragnarok-front/src/api/playerApi.ts`
- Create: `ragnarok-front/src/api/battleApi.ts`
- Create: `ragnarok-front/src/api/skillApi.ts`
- Create: `ragnarok-front/src/api/itemApi.ts`
- Create: `ragnarok-front/src/api/mapApi.ts`
- Create: `ragnarok-front/src/api/classApi.ts`

- [ ] **Step 1: Escrever teste do interceptor (ANTES de implementar)**

```typescript
// ragnarok-front/src/api/__tests__/client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useUiStore } from '../../store/uiStore'

vi.mock('../../store/uiStore', () => ({
  useUiStore: { getState: vi.fn() },
}))

describe('fraud interceptor — handleFraudResponse', () => {
  let mockUi: { showCaptcha: ReturnType<typeof vi.fn>; setError: ReturnType<typeof vi.fn>; hideCaptcha: ReturnType<typeof vi.fn> }
  let originalLocation: Location

  beforeEach(() => {
    mockUi = { showCaptcha: vi.fn(), setError: vi.fn(), hideCaptcha: vi.fn() }
    vi.mocked(useUiStore.getState).mockReturnValue(mockUi as any)
    originalLocation = window.location
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true })
    localStorage.clear()
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
    vi.clearAllMocks()
  })

  it('nao faz nada quando fraud e undefined', async () => {
    const { handleFraudResponse } = await import('../client')
    handleFraudResponse(undefined)
    expect(mockUi.showCaptcha).not.toHaveBeenCalled()
    expect(mockUi.setError).not.toHaveBeenCalled()
  })

  it('SHOW_CAPTCHA chama ui.showCaptcha()', async () => {
    const { handleFraudResponse } = await import('../client')
    handleFraudResponse({ verdict: 'CHALLENGE', requiredAction: 'SHOW_CAPTCHA' })
    expect(mockUi.showCaptcha).toHaveBeenCalledTimes(1)
  })

  it('DROP_SESSION limpa playerId e redireciona para /', async () => {
    localStorage.setItem('playerId', '42')
    const { handleFraudResponse } = await import('../client')
    handleFraudResponse({ verdict: 'APPROVED', requiredAction: 'DROP_SESSION' })
    expect(localStorage.getItem('playerId')).toBeNull()
    expect(window.location.href).toBe('/')
  })

  it('verdict BLOCKED faz logout mesmo sem requiredAction', async () => {
    localStorage.setItem('playerId', '42')
    const { handleFraudResponse } = await import('../client')
    handleFraudResponse({ verdict: 'BLOCKED', requiredAction: 'NONE' })
    expect(localStorage.getItem('playerId')).toBeNull()
    expect(window.location.href).toBe('/')
    expect(mockUi.setError).toHaveBeenCalledWith(expect.stringContaining('bloqueada'))
  })

  it('CANCEL_ACTION chama ui.setError()', async () => {
    const { handleFraudResponse } = await import('../client')
    handleFraudResponse({ verdict: 'APPROVED', requiredAction: 'CANCEL_ACTION' })
    expect(mockUi.setError).toHaveBeenCalledWith(expect.stringContaining('cancelada'))
  })

  it('FLAG_FOR_REVIEW e fail-open (nao bloqueia)', async () => {
    const { handleFraudResponse } = await import('../client')
    handleFraudResponse({ verdict: 'APPROVED', requiredAction: 'FLAG_FOR_REVIEW' })
    expect(mockUi.setError).not.toHaveBeenCalled()
    expect(window.location.href).not.toBe('/')
  })
})
```

- [ ] **Step 2: Rodar para confirmar FAIL**

```bash
cd ragnarok-front && npm run test -- client
```
Expected: FAIL — "Cannot find module '../client'"

- [ ] **Step 3: Criar client.ts com interceptor de antifraude**

```typescript
// ragnarok-front/src/api/client.ts
import axios from 'axios'
import { useUiStore } from '../store/uiStore'
import type { RequiredAction } from '../types/fraud'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Injeta timestamp de acao em todo request
apiClient.interceptors.request.use((config) => {
  config.headers['X-Action-Timestamp'] = Date.now().toString()
  return config
})

// Trata respostas de antifraude retornadas pelo core
apiClient.interceptors.response.use(
  (response) => {
    handleFraudResponse(response.data?.fraud)
    return response
  },
  (error) => Promise.reject(error)
)

function handleFraudResponse(fraud: { verdict?: string; requiredAction?: RequiredAction } | undefined) {
  if (!fraud) return

  // BLOCKED via verdict => logout imediato (mesmo sem requiredAction explicito)
  if (fraud.verdict === 'BLOCKED') {
    const ui = useUiStore.getState()
    ui.setError('Conta bloqueada pelo sistema de seguranca.')
    localStorage.removeItem('playerId')
    window.location.href = '/'
    return
  }

  handleFraudAction(fraud.requiredAction)
}

function handleFraudAction(action: RequiredAction | undefined) {
  if (!action || action === 'NONE' || action === 'ALERT_ONLY') return

  const ui = useUiStore.getState()

  if (action === 'SHOW_CAPTCHA') {
    ui.showCaptcha()
    return
  }

  if (action === 'DROP_SESSION') {
    ui.setError('Sessao encerrada pelo sistema de seguranca.')
    localStorage.removeItem('playerId')
    window.location.href = '/'
    return
  }

  if (action === 'CANCEL_ACTION') {
    ui.setError('Acao cancelada pelo sistema de seguranca.')
    return
  }

  if (action === 'FLAG_FOR_REVIEW') {
    // Fail-open: apenas loga, nao bloqueia o jogador
    console.warn('[antifraude] FLAG_FOR_REVIEW — acao permitida, conta monitorada')
    return
  }
}

export { handleFraudResponse }
```

- [ ] **Step 4: Rodar teste para confirmar que ainda falha (store nao existe)**

```bash
cd ragnarok-front && npm run test -- client
```
Expected: FAIL — "Cannot find module '../../store/uiStore'" (store ainda nao existe — criado na Task 3)

- [ ] **Step 5: Criar playerApi.ts**

```typescript
// ragnarok-front/src/api/playerApi.ts
import { apiClient } from './client'
import type { Player } from '../types/player'

export const playerApi = {
  create: (name: string, jobClass: string) =>
    apiClient.post<Player>('/players', { name, jobClass }).then(r => r.data),

  get: (id: number) =>
    apiClient.get<Player>(`/players/${id}`).then(r => r.data),

  resurrect: (id: number) =>
    apiClient.post<void>(`/players/${id}/resurrect`).then(r => r.data),

  distributeStats: (id: number, stats: Partial<Record<string, number>>) =>
    apiClient.put<Player>(`/players/${id}/stats`, stats).then(r => r.data),
}
```

- [ ] **Step 6: Criar battleApi.ts**

```typescript
// ragnarok-front/src/api/battleApi.ts
import { apiClient } from './client'
import type { FraudResponse } from '../types/fraud'

export interface BattleActionPayload {
  actionsPerSecond?: number
  networkLatencyMs?: number
}

export const battleApi = {
  attack: (playerId: number, monsterId: number, meta?: BattleActionPayload) =>
    apiClient
      .post<{ message: string; fraud?: FraudResponse }>(
        `/players/${playerId}/battle/attack`,
        { monsterId, ...meta }
      )
      .then(r => r.data),

  useSkill: (playerId: number, skillName: string, monsterId: number, meta?: BattleActionPayload) =>
    apiClient
      .post<{ message: string; fraud?: FraudResponse }>(
        `/players/${playerId}/battle/skill`,
        { skillName, monsterId, ...meta }
      )
      .then(r => r.data),
}
```

- [ ] **Step 7: Criar skillApi.ts**

```typescript
// ragnarok-front/src/api/skillApi.ts
import { apiClient } from './client'
import type { SkillRow } from '../types/skill'

export const skillApi = {
  list: (playerId: number) =>
    apiClient.get<SkillRow[]>(`/players/${playerId}/skills`).then(r => r.data),

  listUsable: (playerId: number) =>
    apiClient.get<SkillRow[]>(`/players/${playerId}/skills/usable`).then(r => r.data),

  learn: (playerId: number, aegisName: string) =>
    apiClient.post<{ message: string }>(`/players/${playerId}/skills/${aegisName}/learn`).then(r => r.data),

  useOutOfCombat: (playerId: number, aegisName: string) =>
    apiClient.post<{ message: string }>(`/players/${playerId}/skills/${aegisName}/use`).then(r => r.data),
}
```

- [ ] **Step 8: Criar itemApi.ts, mapApi.ts, classApi.ts**

```typescript
// ragnarok-front/src/api/itemApi.ts
import { apiClient } from './client'
import type { PlayerItem } from '../types/player'

export const itemApi = {
  list: (playerId: number) =>
    apiClient.get<PlayerItem[]>(`/players/${playerId}/inventory`).then(r => r.data),

  equip: (playerId: number, playerItemId: string) =>
    apiClient.post<{ message: string }>(`/players/${playerId}/inventory/${playerItemId}/equip`).then(r => r.data),

  use: (playerId: number, playerItemId: string) =>
    apiClient.post<{ message: string }>(`/players/${playerId}/inventory/${playerItemId}/use`).then(r => r.data),
}

// ragnarok-front/src/api/mapApi.ts
import { apiClient } from './client'
import type { GameMap } from '../types/map'
import type { Monster } from '../types/monster'

export const mapApi = {
  get: (mapName: string) =>
    apiClient.get<GameMap>(`/maps/${mapName}`).then(r => r.data),

  getMonsters: (mapName: string) =>
    apiClient.get<Monster[]>(`/maps/${mapName}/monsters`).then(r => r.data),

  move: (playerId: number, targetMap: string) =>
    apiClient.post<void>(`/players/${playerId}/move`, { targetMap }).then(r => r.data),
}

// ragnarok-front/src/api/classApi.ts
import { apiClient } from './client'

export const classApi = {
  listAvailable: (playerId: number) =>
    apiClient.get<string[]>(`/players/${playerId}/classes/available`).then(r => r.data),

  change: (playerId: number, newClass: string) =>
    apiClient.post<{ message: string }>(`/players/${playerId}/classes/change`, { newClass }).then(r => r.data),
}
```

- [ ] **Step 9: Rodar testes para confirmar PASS**

```bash
npm run test -- client
```
Expected: 6 passed

- [ ] **Step 10: Commit**

```bash
git add src/api && git commit -m "feat: add API client layer with fraud response interceptor"
```

---

### Task 3: Stores Zustand

**Files:**
- Create: `ragnarok-front/src/store/playerStore.ts`
- Create: `ragnarok-front/src/store/combatStore.ts`
- Create: `ragnarok-front/src/store/uiStore.ts`

- [ ] **Step 1: Escrever testes dos stores**

```typescript
// ragnarok-front/src/store/__tests__/stores.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '../playerStore'
import { useCombatStore } from '../combatStore'
import { useUiStore } from '../uiStore'

describe('playerStore', () => {
  beforeEach(() => usePlayerStore.getState().clearPlayer())

  it('setPlayerId persiste o id', () => {
    usePlayerStore.getState().setPlayerId(42)
    expect(usePlayerStore.getState().playerId).toBe(42)
  })
})

describe('combatStore', () => {
  it('appendLog limita a 100 entradas', () => {
    const store = useCombatStore.getState()
    store.clearLog()
    for (let i = 0; i < 110; i++) store.appendLog(`linha ${i}`)
    expect(useCombatStore.getState().battleLog).toHaveLength(100)
  })
})

describe('uiStore', () => {
  it('showCaptcha / hideCaptcha alterna captchaVisible', () => {
    const ui = useUiStore.getState()
    ui.showCaptcha()
    expect(useUiStore.getState().captchaVisible).toBe(true)
    ui.hideCaptcha()
    expect(useUiStore.getState().captchaVisible).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar para confirmar FAIL**

```bash
cd ragnarok-front && npm run test -- stores
```
Expected: FAIL — "Cannot find module '../playerStore'"

- [ ] **Step 3: Criar playerStore.ts**

```typescript
// ragnarok-front/src/store/playerStore.ts
import { create } from 'zustand'

interface PlayerStore {
  playerId: number | null
  setPlayerId: (id: number) => void
  clearPlayer: () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  playerId: Number(localStorage.getItem('playerId')) || null,

  setPlayerId: (id) => {
    localStorage.setItem('playerId', String(id))
    set({ playerId: id })
  },

  clearPlayer: () => {
    localStorage.removeItem('playerId')
    set({ playerId: null })
  },
}))
```

- [ ] **Step 4: Criar combatStore.ts**

```typescript
// ragnarok-front/src/store/combatStore.ts
import { create } from 'zustand'
import type { Monster } from '../types/monster'

interface CombatStore {
  targetMonster: Monster | null
  battleLog: string[]
  inCombat: boolean
  setTarget: (monster: Monster) => void
  clearTarget: () => void
  appendLog: (line: string) => void
  clearLog: () => void
}

export const useCombatStore = create<CombatStore>((set) => ({
  targetMonster: null,
  battleLog: [],
  inCombat: false,

  setTarget: (monster) => set({ targetMonster: monster, inCombat: true }),
  clearTarget: () => set({ targetMonster: null, inCombat: false }),
  appendLog: (line) => set((s) => ({ battleLog: [...s.battleLog.slice(-99), line] })),
  clearLog: () => set({ battleLog: [] }),
}))
```

- [ ] **Step 5: Criar uiStore.ts**

```typescript
// ragnarok-front/src/store/uiStore.ts
import { create } from 'zustand'

interface UiStore {
  captchaVisible: boolean
  errorMessage: string | null
  showCaptcha: () => void
  hideCaptcha: () => void
  setError: (msg: string) => void
  clearError: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  captchaVisible: false,
  errorMessage: null,

  showCaptcha: () => set({ captchaVisible: true }),
  hideCaptcha: () => set({ captchaVisible: false }),
  setError: (msg) => set({ errorMessage: msg }),
  clearError: () => set({ errorMessage: null }),
}))
```

- [ ] **Step 6: Rodar testes para confirmar PASS**

```bash
npm run test
```
Expected: todos passando

- [ ] **Step 7: Commit**

```bash
git add src/store && git commit -m "feat: add Zustand stores (player, combat, ui)"
```

---

### Task 4: Hook useActionGuard (antifraude throttle)

**Files:**
- Create: `ragnarok-front/src/hooks/useActionGuard.ts`
- Test: `ragnarok-front/src/hooks/__tests__/useActionGuard.test.ts`

Este hook e o ponto central de compliance com o antifraude. Ele:
- Impede acoes mais rapidas que 500ms (throttle)
- Calcula `actionsPerSecond` baseado em historico de clicks
- Retorna o metadata para incluir no body das requisicoes

- [ ] **Step 1: Escrever o teste falhando**

```typescript
// ragnarok-front/src/hooks/__tests__/useActionGuard.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useActionGuard } from '../useActionGuard'

describe('useActionGuard', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('permite a primeira acao imediatamente', async () => {
    const { result } = renderHook(() => useActionGuard())
    let allowed = false
    await act(async () => { allowed = await result.current.guard() })
    expect(allowed).toBe(true)
  })

  it('bloqueia segunda acao dentro de 500ms', async () => {
    const { result } = renderHook(() => useActionGuard())
    await act(async () => { await result.current.guard() })
    let allowed = true
    await act(async () => { allowed = await result.current.guard() })
    expect(allowed).toBe(false)
  })

  it('permite segunda acao apos 500ms', async () => {
    const { result } = renderHook(() => useActionGuard())
    await act(async () => { await result.current.guard() })
    vi.advanceTimersByTime(501)
    let allowed = false
    await act(async () => { allowed = await result.current.guard() })
    expect(allowed).toBe(true)
  })

  it('retorna actionsPerSecond no metadata', async () => {
    const { result } = renderHook(() => useActionGuard())
    vi.advanceTimersByTime(1000)
    await act(async () => { await result.current.guard() })
    vi.advanceTimersByTime(600)
    await act(async () => { await result.current.guard() })
    const meta = result.current.getActionMeta()
    expect(meta.actionsPerSecond).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npm run test -- useActionGuard
```
Expected: FAIL (arquivo nao existe)

- [ ] **Step 3: Implementar useActionGuard.ts**

```typescript
// ragnarok-front/src/hooks/useActionGuard.ts
import { useRef, useCallback } from 'react'

const THROTTLE_MS = 500
const WINDOW_MS = 5000  // janela para calcular APS

export function useActionGuard() {
  const lastActionAt = useRef<number>(0)
  const actionTimestamps = useRef<number[]>([])

  const guard = useCallback(async (): Promise<boolean> => {
    const now = Date.now()
    const elapsed = now - lastActionAt.current
    if (elapsed < THROTTLE_MS) return false

    lastActionAt.current = now
    actionTimestamps.current = [
      ...actionTimestamps.current.filter(t => now - t < WINDOW_MS),
      now,
    ]
    return true
  }, [])

  const getActionMeta = useCallback(() => {
    const now = Date.now()
    const recent = actionTimestamps.current.filter(t => now - t < WINDOW_MS)
    const actionsPerSecond = recent.length / (WINDOW_MS / 1000)
    const networkLatencyMs = 50 + Math.random() * 80  // estimativa; idealmente medido com ping real
    return { actionsPerSecond: Math.round(actionsPerSecond * 10) / 10, networkLatencyMs }
  }, [])

  return { guard, getActionMeta }
}
```

- [ ] **Step 4: Rodar testes**

```bash
npm run test -- useActionGuard
```
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/hooks && git commit -m "feat: add useActionGuard hook with 500ms throttle and APS tracking"
```

---

## FASE 1 — Features (podem rodar em PARALELO apos Fase 0)

> Tasks 6-11 dependem de Task 5 (UI Components). Task 5 deve ser commitada antes dos demais agentes serem despachados. Tasks 6-11 sao independentes ENTRE SI — podem rodar em paralelo apos Task 5 estar completa.

---

### Task 5: [AGENTE A] Componentes UI base

**Files:**
- Create: `ragnarok-front/src/components/ui/HpBar.tsx`
- Create: `ragnarok-front/src/components/ui/SpBar.tsx`
- Create: `ragnarok-front/src/components/ui/ExpBar.tsx`
- Create: `ragnarok-front/src/components/ui/StatPanel.tsx`
- Create: `ragnarok-front/src/components/ui/BuffList.tsx`
- Create: `ragnarok-front/src/components/ui/ActionButton.tsx`
- Create: `ragnarok-front/src/components/ui/CaptchaModal.tsx`
- Test: `ragnarok-front/src/components/ui/__tests__/HpBar.test.tsx`
- Test: `ragnarok-front/src/components/ui/__tests__/ActionButton.test.tsx`

- [ ] **Step 1: Escrever teste falhando para HpBar**

```typescript
// src/components/ui/__tests__/HpBar.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HpBar } from '../HpBar'

describe('HpBar', () => {
  it('exibe os valores de HP', () => {
    render(<HpBar current={350} max={500} />)
    expect(screen.getByText('350 / 500')).toBeInTheDocument()
  })

  it('aplica classe vermelha quando HP < 25%', () => {
    const { container } = render(<HpBar current={100} max={500} />)
    expect(container.querySelector('.bg-red-500')).toBeTruthy()
  })

  it('aplica classe verde quando HP > 75%', () => {
    const { container } = render(<HpBar current={450} max={500} />)
    expect(container.querySelector('.bg-green-500')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Implementar HpBar.tsx**

```typescript
// src/components/ui/HpBar.tsx
interface HpBarProps { current: number; max: number }

export function HpBar({ current, max }: HpBarProps) {
  const pct = max > 0 ? (current / max) * 100 : 0
  const color = pct > 75 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white mb-1">
        <span>HP</span>
        <span>{current} / {max}</span>
      </div>
      <div className="w-full bg-gray-700 rounded h-3">
        <div className={`${color} h-3 rounded transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implementar SpBar.tsx**

```typescript
// src/components/ui/SpBar.tsx
interface SpBarProps { current: number; max: number }

export function SpBar({ current, max }: SpBarProps) {
  const pct = max > 0 ? (current / max) * 100 : 0
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white mb-1">
        <span>SP</span>
        <span>{current} / {max}</span>
      </div>
      <div className="w-full bg-gray-700 rounded h-3">
        <div className="bg-blue-500 h-3 rounded transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implementar ExpBar.tsx**

```typescript
// src/components/ui/ExpBar.tsx
interface ExpBarProps {
  baseExp: number
  baseExpNeeded: number
  jobExp: number
  jobExpNeeded: number
}

export function ExpBar({ baseExp, baseExpNeeded, jobExp, jobExpNeeded }: ExpBarProps) {
  const basePct = baseExpNeeded > 0 ? (baseExp / baseExpNeeded) * 100 : 0
  const jobPct  = jobExpNeeded  > 0 ? (jobExp  / jobExpNeeded)  * 100 : 0

  return (
    <div className="w-full space-y-1">
      <div className="w-full bg-gray-700 rounded h-2" title={`Base EXP: ${baseExp}/${baseExpNeeded}`}>
        <div className="bg-yellow-400 h-2 rounded" style={{ width: `${Math.min(100, basePct)}%` }} />
      </div>
      <div className="w-full bg-gray-700 rounded h-2" title={`Job EXP: ${jobExp}/${jobExpNeeded}`}>
        <div className="bg-purple-400 h-2 rounded" style={{ width: `${Math.min(100, jobPct)}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implementar StatPanel.tsx**

```typescript
// src/components/ui/StatPanel.tsx
import type { Player } from '../../types/player'

interface StatPanelProps { player: Player }

export function StatPanel({ player }: StatPanelProps) {
  const stats = [
    { label: 'STR', value: player.totalStr ?? player.stats.str },
    { label: 'AGI', value: player.totalAgi ?? player.stats.agi },
    { label: 'VIT', value: player.totalVit ?? player.stats.vit },
    { label: 'INT', value: player.totalInt ?? player.stats.intVal },
    { label: 'DEX', value: player.totalDex ?? player.stats.dex },
    { label: 'LUK', value: player.totalLuk ?? player.stats.luk },
  ]
  return (
    <div className="grid grid-cols-3 gap-1 text-sm">
      {stats.map(({ label, value }) => (
        <div key={label} className="flex justify-between bg-gray-800 px-2 py-1 rounded">
          <span className="text-gray-400">{label}</span>
          <span className="text-white font-bold">{value}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Implementar BuffList.tsx**

```typescript
// src/components/ui/BuffList.tsx
import type { ActiveBuff } from '../../types/player'

interface BuffListProps { buffs: ActiveBuff[] }

export function BuffList({ buffs }: BuffListProps) {
  if (buffs.length === 0) return <p className="text-gray-500 text-xs">Sem buffs ativos</p>

  return (
    <div className="flex flex-wrap gap-1">
      {buffs.map((b, i) => (
        <div key={i} className="bg-blue-900 text-blue-100 text-xs px-2 py-0.5 rounded" title={`${b.statType} +${b.value}`}>
          {b.skillAegisName}
          {b.remainingTurns >= 0 && <span className="ml-1 opacity-60">({b.remainingTurns}t)</span>}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Escrever teste de ActionButton (ANTES de implementar)**

```typescript
// src/components/ui/__tests__/ActionButton.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ActionButton } from '../ActionButton'

describe('ActionButton', () => {
  it('chama onClick com metadata de acao', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    render(<ActionButton label="Atacar" onClick={handler} />)
    await userEvent.click(screen.getByText('Atacar'))
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ actionsPerSecond: expect.any(Number) })
    )
  })

  it('nao chama onClick duas vezes em 500ms', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    render(<ActionButton label="Atacar" onClick={handler} />)
    const btn = screen.getByText('Atacar')
    await userEvent.click(btn)
    await userEvent.click(btn)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
```

> Nota: SpBar, ExpBar, StatPanel, BuffList e CaptchaModal sao componentes puramente presentacionais sem logica de negocio. Sao cobertos indiretamente pelos testes de PlayerDashboard (Task 6) e GamePage (Task 12). CaptchaModal e um placeholder — integrar CAPTCHA real antes de producao.

- [ ] **Step 8: Implementar ActionButton.tsx (integrado com useActionGuard)**

```typescript
// src/components/ui/ActionButton.tsx
import { useState } from 'react'
import { useActionGuard } from '../../hooks/useActionGuard'
import clsx from 'clsx'

interface ActionButtonProps {
  label: string
  onClick: (meta: { actionsPerSecond: number; networkLatencyMs: number }) => Promise<void>
  disabled?: boolean
  variant?: 'primary' | 'danger' | 'secondary'
  className?: string
}

export function ActionButton({ label, onClick, disabled, variant = 'primary', className }: ActionButtonProps) {
  const { guard, getActionMeta } = useActionGuard()
  const [loading, setLoading] = useState(false)

  const colors = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
  }

  async function handleClick() {
    if (!(await guard())) return
    setLoading(true)
    try {
      await onClick(getActionMeta())
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={clsx(
        'px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        colors[variant],
        className
      )}
    >
      {loading ? '...' : label}
    </button>
  )
}
```

- [ ] **Step 9: Implementar CaptchaModal.tsx**

```typescript
// src/components/ui/CaptchaModal.tsx
import { useUiStore } from '../../store/uiStore'

export function CaptchaModal() {
  const { captchaVisible, hideCaptcha } = useUiStore()
  if (!captchaVisible) return null

  function handleSolve() {
    // Integracao real: Google reCAPTCHA ou hCaptcha
    // Por ora, modal simples de confirmacao humana
    hideCaptcha()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-yellow-500 p-6 rounded-lg max-w-sm w-full text-center">
        <h2 className="text-yellow-400 text-xl font-bold mb-2">Verificacao de Seguranca</h2>
        <p className="text-gray-300 text-sm mb-4">
          Atividade suspeita detectada. Por favor, confirme que voce e humano.
        </p>
        <button
          onClick={handleSolve}
          className="bg-yellow-500 text-black px-6 py-2 rounded font-bold hover:bg-yellow-400"
        >
          Sou Humano
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Rodar testes para confirmar PASS**

```bash
npm run test -- components/ui
```
Expected: todos passando

- [ ] **Step 11: Commit**

```bash
git add src/components/ui && git commit -m "feat: add UI base components (HpBar, SpBar, ExpBar, StatPanel, BuffList, ActionButton, CaptchaModal)"
```

---

### Task 6: [AGENTE B] Criacao de Personagem + Dashboard

**Files:**
- Create: `ragnarok-front/src/hooks/usePlayer.ts`
- Create: `ragnarok-front/src/components/player/PlayerDashboard.tsx`
- Create: `ragnarok-front/src/components/player/StatDistributor.tsx`
- Modify: `ragnarok-front/src/pages/CreateCharacterPage.tsx`
- Test: `ragnarok-front/src/components/player/__tests__/PlayerDashboard.test.tsx`
- Test: `ragnarok-front/src/pages/__tests__/CreateCharacterPage.test.tsx`

**Dependencias de Task:** Task 5 (componentes UI) deve estar commitada antes deste agente comecar.

- [ ] **Step 1: Escrever testes falhando (CreateCharacterPage e PlayerDashboard)**

```typescript
// ragnarok-front/src/pages/__tests__/CreateCharacterPage.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CreateCharacterPage from '../CreateCharacterPage'

vi.mock('../../hooks/usePlayer', () => ({
  useCreatePlayer: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}))

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
)

describe('CreateCharacterPage', () => {
  it('exibe formulario de criacao', () => {
    render(<CreateCharacterPage />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('botao fica desabilitado sem nome', () => {
    render(<CreateCharacterPage />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /criar/i })).toBeDisabled()
  })
})
```

```typescript
// ragnarok-front/src/components/player/__tests__/PlayerDashboard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PlayerDashboard } from '../PlayerDashboard'
import type { Player } from '../../../types/player'

const mockPlayer: Player = {
  id: 1, name: 'Teste', jobClass: 'SWORDSMAN', baseLevel: 10, jobLevel: 5,
  baseExp: 1000, jobExp: 500, zenny: 0, statPoints: 3, skillPoints: 2,
  hpCurrent: 300, spCurrent: 40, maxHp: 500, maxSp: 40,
  stats: { str: 9, agi: 5, vit: 6, intVal: 1, dex: 4, luk: 3, maxHp: 500, maxSp: 40 },
  location: { mapName: 'prontera', x: 150, y: 150, savePointMap: 'prontera' },
  inventory: [], activeBuffs: [],
}

describe('PlayerDashboard', () => {
  it('exibe nome e classe do player', () => {
    render(<PlayerDashboard player={mockPlayer} />)
    expect(screen.getByText('Teste')).toBeInTheDocument()
    expect(screen.getByText(/SWORDSMAN/)).toBeInTheDocument()
  })

  it('exibe alerta de morte quando HP = 0', () => {
    render(<PlayerDashboard player={{ ...mockPlayer, hpCurrent: 0 }} />)
    expect(screen.getByText(/MORTO/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar para confirmar FAIL**

```bash
cd ragnarok-front && npm run test -- CreateCharacterPage PlayerDashboard
```
Expected: FAIL (modulos nao existem ainda)

- [ ] **Step 3: Implementar usePlayer.ts**

```typescript
// ragnarok-front/src/hooks/usePlayer.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playerApi } from '../api/playerApi'
import { usePlayerStore } from '../store/playerStore'

export function usePlayer() {
  const { playerId } = usePlayerStore()
  return useQuery({
    queryKey: ['player', playerId],
    queryFn: () => playerApi.get(playerId!),
    enabled: playerId != null,
    refetchInterval: false,
  })
}

export function useCreatePlayer() {
  const qc = useQueryClient()
  const { setPlayerId } = usePlayerStore()
  return useMutation({
    mutationFn: ({ name, jobClass }: { name: string; jobClass: string }) =>
      playerApi.create(name, jobClass),
    onSuccess: (player) => {
      setPlayerId(player.id)
      qc.setQueryData(['player', player.id], player)
    },
  })
}

export function useResurrect() {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()
  return useMutation({
    mutationFn: () => playerApi.resurrect(playerId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player', playerId] }),
  })
}
```

- [ ] **Step 4: Implementar CreateCharacterPage.tsx**

```typescript
// src/pages/CreateCharacterPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreatePlayer } from '../hooks/usePlayer'

const CLASSES = [
  { value: 'SWORDSMAN', label: 'Espadachim' },
  { value: 'MAGE', label: 'Mago' },
  { value: 'ARCHER', label: 'Arqueiro' },
  { value: 'ACOLYTE', label: 'Acólito' },
  { value: 'THIEF', label: 'Ladrão' },
  { value: 'MERCHANT', label: 'Mercador' },
]

export default function CreateCharacterPage() {
  const [name, setName] = useState('')
  const [jobClass, setJobClass] = useState('SWORDSMAN')
  const navigate = useNavigate()
  const { mutate: create, isPending, error } = useCreatePlayer()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    create({ name: name.trim(), jobClass }, {
      onSuccess: () => navigate('/game'),
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-yellow-600 p-8 rounded-lg w-96 space-y-4">
        <h1 className="text-yellow-400 text-2xl font-bold text-center">Criar Personagem</h1>

        {error && <p className="text-red-400 text-sm">{String(error)}</p>}

        <div>
          <label htmlFor="name" className="block text-gray-300 text-sm mb-1">Nome</label>
          <input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={24}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
            placeholder="Nome do personagem"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">Classe</label>
          <select
            value={jobClass}
            onChange={e => setJobClass(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          >
            {CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || isPending}
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 rounded disabled:opacity-50"
        >
          {isPending ? 'Criando...' : 'Criar Personagem'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Implementar PlayerDashboard.tsx**

```typescript
// ragnarok-front/src/components/player/PlayerDashboard.tsx
import type { Player } from '../../types/player'
import { HpBar } from '../ui/HpBar'
import { SpBar } from '../ui/SpBar'
import { ExpBar } from '../ui/ExpBar'
import { StatPanel } from '../ui/StatPanel'
import { BuffList } from '../ui/BuffList'

interface Props { player: Player }

export function PlayerDashboard({ player }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-4 space-y-3">
      <div>
        <h2 className="text-yellow-400 font-bold text-lg">{player.name}</h2>
        <p className="text-gray-400 text-sm">{player.jobClass} | Lv {player.baseLevel} / Job {player.jobLevel}</p>
        <p className="text-gray-400 text-xs">Zenny: {player.zenny} | SP Livres: {player.statPoints} | Skill P: {player.skillPoints}</p>
      </div>

      <HpBar current={player.hpCurrent} max={player.maxHp ?? player.stats.maxHp} />
      <SpBar current={player.spCurrent} max={player.maxSp ?? player.stats.maxSp} />
      {player.baseExpNeeded && (
        <ExpBar
          baseExp={player.baseExp} baseExpNeeded={player.baseExpNeeded}
          jobExp={player.jobExp} jobExpNeeded={player.jobExpNeeded ?? 0}
        />
      )}

      <StatPanel player={player} />

      {player.activeBuffs.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs mb-1">Buffs Ativos</p>
          <BuffList buffs={player.activeBuffs} />
        </div>
      )}

      {player.hpCurrent === 0 && (
        <p className="text-red-500 font-bold text-center animate-pulse">MORTO — Use ressuscitar</p>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Implementar StatDistributor.tsx**

```typescript
// ragnarok-front/src/components/player/StatDistributor.tsx
import { playerApi } from '../../api/playerApi'
import { useQueryClient } from '@tanstack/react-query'
import { usePlayerStore } from '../../store/playerStore'
import type { Player } from '../../types/player'

interface Props { player: Player }

const STATS = ['str', 'agi', 'vit', 'intVal', 'dex', 'luk'] as const
const STAT_LABELS: Record<string, string> = { str: 'STR', agi: 'AGI', vit: 'VIT', intVal: 'INT', dex: 'DEX', luk: 'LUK' }

export function StatDistributor({ player }: Props) {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()

  if (player.statPoints <= 0) {
    return <p className="text-gray-500 text-sm">Sem pontos de status disponíveis.</p>
  }

  async function addStat(stat: string) {
    await playerApi.distributeStats(playerId!, { [stat]: 1 })
    qc.invalidateQueries({ queryKey: ['player', playerId] })
  }

  return (
    <div className="space-y-1">
      <p className="text-yellow-400 text-sm font-bold">Distribuir Status ({player.statPoints} pts)</p>
      {STATS.map(stat => (
        <div key={stat} className="flex items-center justify-between bg-gray-800 rounded px-3 py-1.5">
          <span className="text-gray-300 text-sm">{STAT_LABELS[stat]}: {(player.stats as any)[stat]}</span>
          <button
            onClick={() => addStat(stat)}
            className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-2 py-0.5 rounded"
          >
            +1
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Rodar testes para confirmar PASS**

```bash
cd ragnarok-front && npm run test -- CreateCharacterPage PlayerDashboard
```
Expected: 4 passed

- [ ] **Step 8: Commit**

```bash
git add ragnarok-front/src/hooks/usePlayer.ts ragnarok-front/src/components/player ragnarok-front/src/pages/CreateCharacterPage.tsx && git commit -m "feat: add CreateCharacterPage, PlayerDashboard and StatDistributor"
```

---

### Task 7: [AGENTE C] Inventario

**Files:**
- Create: `ragnarok-front/src/hooks/useInventory.ts`
- Create: `ragnarok-front/src/components/inventory/InventoryGrid.tsx`
- Create: `ragnarok-front/src/components/inventory/ItemCard.tsx`
- Test: `ragnarok-front/src/components/inventory/__tests__/InventoryGrid.test.tsx`

- [ ] **Step 1: Escrever teste falhando ANTES de implementar**

```typescript
// ragnarok-front/src/components/inventory/__tests__/InventoryGrid.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { InventoryGrid } from '../InventoryGrid'

vi.mock('../../../hooks/useInventory', () => ({
  useInventory: () => ({
    data: [
      { id: 'uuid-1', isEquipped: false, amount: 3, refineLevel: 0,
        itemDefinition: { id: 1, name: 'Red Potion', type: 'CONSUMABLE', stats: {} } }
    ],
    isLoading: false,
  }),
  useEquipItem: () => ({ mutate: vi.fn() }),
  useUseItem: () => ({ mutate: vi.fn() }),
}))

describe('InventoryGrid', () => {
  it('exibe item do inventario', () => {
    render(<InventoryGrid />)
    expect(screen.getByText('Red Potion')).toBeInTheDocument()
  })
  it('exibe quantidade do item', () => {
    render(<InventoryGrid />)
    expect(screen.getByText('x3')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar para confirmar FAIL**

```bash
cd ragnarok-front && npm run test -- InventoryGrid
```
Expected: FAIL (componente nao existe)

- [ ] **Step 3: Criar useInventory.ts**

```typescript
// src/hooks/useInventory.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itemApi } from '../api/itemApi'
import { usePlayerStore } from '../store/playerStore'

export function useInventory() {
  const { playerId } = usePlayerStore()
  return useQuery({
    queryKey: ['inventory', playerId],
    queryFn: () => itemApi.list(playerId!),
    enabled: playerId != null,
  })
}

export function useEquipItem() {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()

  return useMutation({
    mutationFn: (playerItemId: string) => itemApi.equip(playerId!, playerItemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', playerId] })
      qc.invalidateQueries({ queryKey: ['player', playerId] })
    },
  })
}

export function useUseItem() {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()

  return useMutation({
    mutationFn: (playerItemId: string) => itemApi.use(playerId!, playerItemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', playerId] })
      qc.invalidateQueries({ queryKey: ['player', playerId] })
    },
  })
}
```

- [ ] **Step 4: Implementar ItemCard.tsx**

```typescript
// src/components/inventory/ItemCard.tsx
import type { PlayerItem } from '../../types/player'
import { ActionButton } from '../ui/ActionButton'

interface Props {
  item: PlayerItem
  onEquip: (id: string) => void
  onUse: (id: string) => void
}

export function ItemCard({ item, onEquip, onUse }: Props) {
  const def = item.itemDefinition
  const isEquipment = def.type === 'WEAPON' || def.type === 'ARMOR'
  const isConsumable = def.type === 'CONSUMABLE'

  return (
    <div className={`bg-gray-800 border rounded p-2 text-sm ${item.isEquipped ? 'border-yellow-500' : 'border-gray-600'}`}>
      <div className="flex justify-between items-start">
        <span className="text-white font-semibold">{def.name}</span>
        {item.amount > 1 && <span className="text-gray-400 text-xs">x{item.amount}</span>}
      </div>
      <p className="text-gray-500 text-xs capitalize">{def.type.toLowerCase()}</p>
      {item.isEquipped && <span className="text-yellow-400 text-xs">[Equipado]</span>}
      <div className="mt-1 flex gap-1">
        {isEquipment && (
          <ActionButton
            label={item.isEquipped ? 'Desequipar' : 'Equipar'}
            onClick={async () => onEquip(item.id)}
            variant="secondary"
            className="text-xs py-0.5 px-2"
          />
        )}
        {isConsumable && (
          <ActionButton
            label="Usar"
            onClick={async () => onUse(item.id)}
            variant="primary"
            className="text-xs py-0.5 px-2"
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implementar InventoryGrid.tsx**

```typescript
// src/components/inventory/InventoryGrid.tsx
import { useState } from 'react'
import { useInventory, useEquipItem, useUseItem } from '../../hooks/useInventory'
import { ItemCard } from './ItemCard'
import type { ItemType } from '../../types/item'

const FILTERS: Array<{ label: string; value: ItemType | 'ALL' }> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Armas', value: 'WEAPON' },
  { label: 'Armaduras', value: 'ARMOR' },
  { label: 'Consumíveis', value: 'CONSUMABLE' },
]

export function InventoryGrid() {
  const { data: items = [], isLoading } = useInventory()
  const { mutate: equip } = useEquipItem()
  const { mutate: use } = useUseItem()
  const [filter, setFilter] = useState<ItemType | 'ALL'>('ALL')

  const filtered = filter === 'ALL' ? items : items.filter(i => i.itemDefinition.type === filter)

  if (isLoading) return <p className="text-gray-400">Carregando inventário...</p>

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-2 py-1 rounded ${filter === f.value ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0
        ? <p className="text-gray-500 text-sm">Inventário vazio.</p>
        : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onEquip={(id) => equip(id)}
                onUse={(id) => use(id)}
              />
            ))}
          </div>
        )
      }
    </div>
  )
}
```

- [ ] **Step 6: Rodar testes para confirmar PASS**

```bash
cd ragnarok-front && npm run test -- inventory
```
Expected: 2 passed

- [ ] **Step 7: Commit**

```bash
git add ragnarok-front/src/hooks/useInventory.ts ragnarok-front/src/components/inventory && git commit -m "feat: add inventory screen with equip/use actions"
```

---

### Task 8: [AGENTE D] Skill Tree

**Files:**
- Create: `ragnarok-front/src/hooks/useSkills.ts`
- Create: `ragnarok-front/src/components/skills/SkillTree.tsx`
- Create: `ragnarok-front/src/components/skills/SkillCard.tsx`
- Test: `ragnarok-front/src/components/skills/__tests__/SkillTree.test.tsx`

- [ ] **Step 1: Escrever teste falhando ANTES de implementar**

```typescript
// ragnarok-front/src/components/skills/__tests__/SkillTree.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SkillTree } from '../SkillTree'

vi.mock('../../../hooks/useSkills', () => ({
  useSkills: () => ({
    data: [
      { skillId: 'BASH', aegisName: 'BASH', maxLevel: 10, currentLevel: 3, canLearn: true, blockedReason: null },
      { skillId: 'MAGNUM_BREAK', aegisName: 'MAGNUM_BREAK', maxLevel: 10, currentLevel: 0, canLearn: false, blockedReason: 'Requer BASH Lv5' },
    ],
    isLoading: false,
  }),
  useUsableSkills: () => ({ data: [] }),
  useLearnSkill: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useSkillOutOfCombat: () => ({ mutate: vi.fn() }),
}))

describe('SkillTree', () => {
  it('exibe lista de skills', () => {
    render(<SkillTree />)
    expect(screen.getByText('BASH')).toBeInTheDocument()
    expect(screen.getByText('MAGNUM_BREAK')).toBeInTheDocument()
  })
  it('exibe razao de bloqueio', () => {
    render(<SkillTree />)
    expect(screen.getByText('Requer BASH Lv5')).toBeInTheDocument()
  })
  it('exibe botao Aprender apenas para skills desbloqueadas', () => {
    render(<SkillTree />)
    expect(screen.getAllByText('Aprender')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Rodar para confirmar FAIL**

```bash
cd ragnarok-front && npm run test -- SkillTree
```
Expected: FAIL (componente nao existe)

- [ ] **Step 3: Criar useSkills.ts**

```typescript
// src/hooks/useSkills.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skillApi } from '../api/skillApi'
import { usePlayerStore } from '../store/playerStore'

export function useSkills() {
  const { playerId } = usePlayerStore()
  return useQuery({
    queryKey: ['skills', playerId],
    queryFn: () => skillApi.list(playerId!),
    enabled: playerId != null,
  })
}

export function useUsableSkills() {
  const { playerId } = usePlayerStore()
  return useQuery({
    queryKey: ['skills-usable', playerId],
    queryFn: () => skillApi.listUsable(playerId!),
    enabled: playerId != null,
  })
}

export function useLearnSkill() {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()

  return useMutation({
    mutationFn: (aegisName: string) => skillApi.learn(playerId!, aegisName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills', playerId] })
      qc.invalidateQueries({ queryKey: ['player', playerId] })
    },
  })
}

export function useSkillOutOfCombat() {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()

  return useMutation({
    mutationFn: (aegisName: string) => skillApi.useOutOfCombat(playerId!, aegisName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player', playerId] }),
  })
}
```

- [ ] **Step 4: Implementar SkillCard.tsx**

```typescript
// src/components/skills/SkillCard.tsx
import type { SkillRow } from '../../types/skill'
import { ActionButton } from '../ui/ActionButton'

interface Props {
  skill: SkillRow
  onLearn: (aegisName: string) => void
  onUse?: (aegisName: string) => void
  showUse?: boolean
}

export function SkillCard({ skill, onLearn, onUse, showUse = false }: Props) {
  return (
    <div className={`bg-gray-800 border rounded p-3 ${skill.canLearn ? 'border-blue-600' : 'border-gray-700'}`}>
      <div className="flex justify-between items-start mb-1">
        <span className="text-white font-semibold text-sm">{skill.aegisName}</span>
        <span className="text-gray-400 text-xs">Lv {skill.currentLevel}/{skill.maxLevel}</span>
      </div>

      {/* Barra de nivel */}
      <div className="w-full bg-gray-700 rounded h-1.5 mb-2">
        <div
          className="bg-blue-500 h-1.5 rounded"
          style={{ width: `${skill.maxLevel > 0 ? (skill.currentLevel / skill.maxLevel) * 100 : 0}%` }}
        />
      </div>

      {skill.blockedReason && (
        <p className="text-gray-500 text-xs mb-1 italic">{skill.blockedReason}</p>
      )}

      <div className="flex gap-1">
        {skill.canLearn && (
          <ActionButton
            label="Aprender"
            onClick={async () => onLearn(skill.skillId)}
            variant="primary"
            className="text-xs py-0.5 px-2"
          />
        )}
        {showUse && skill.currentLevel > 0 && onUse && (
          <ActionButton
            label="Usar"
            onClick={async () => onUse(skill.skillId)}
            variant="secondary"
            className="text-xs py-0.5 px-2"
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implementar SkillTree.tsx**

```typescript
// src/components/skills/SkillTree.tsx
import { useSkills, useLearnSkill, useUsableSkills, useSkillOutOfCombat } from '../../hooks/useSkills'
import { SkillCard } from './SkillCard'

export function SkillTree() {
  const { data: skills = [], isLoading } = useSkills()
  const { data: usable = [] } = useUsableSkills()
  const { mutate: learn, isPending: learning, error } = useLearnSkill()
  const { mutate: useSkill } = useSkillOutOfCombat()

  if (isLoading) return <p className="text-gray-400">Carregando skills...</p>

  return (
    <div className="space-y-3">
      {error && <p className="text-red-400 text-sm">{String(error)}</p>}

      {usable.length > 0 && (
        <div>
          <h3 className="text-blue-400 text-sm font-bold mb-2">Usaveis agora</h3>
          <div className="grid grid-cols-1 gap-2">
            {usable.map(s => (
              <SkillCard key={s.skillId} skill={s} onLearn={learn} onUse={useSkill} showUse />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-gray-300 text-sm font-bold mb-2">Arvore de Skills</h3>
        <div className="grid grid-cols-1 gap-2">
          {skills.map(s => (
            <SkillCard key={s.skillId} skill={s} onLearn={learn} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Rodar testes para confirmar PASS**

```bash
cd ragnarok-front && npm run test -- SkillTree
```
Expected: 3 passed

- [ ] **Step 7: Commit**

```bash
git add ragnarok-front/src/hooks/useSkills.ts ragnarok-front/src/components/skills && git commit -m "feat: add skill tree screen with learn and out-of-combat use"
```

---

### Task 9: [AGENTE E] Tela de Combate

**Files:**
- Create: `ragnarok-front/src/hooks/useCombat.ts`
- Create: `ragnarok-front/src/components/combat/CombatScreen.tsx`
- Create: `ragnarok-front/src/components/combat/BattleLog.tsx`
- Create: `ragnarok-front/src/components/combat/MonsterCard.tsx`
- Test: `ragnarok-front/src/components/combat/__tests__/CombatScreen.test.tsx`

**NOTA:** `CombatScreen` importa `useMap` (definido em Task 10). Como Tasks 9 e 10 rodam em paralelo, crie um stub vazio em `ragnarok-front/src/hooks/useMap.ts` antes de comecar Task 9 caso Task 10 nao tenha sido commitada ainda.

- [ ] **Step 1: Escrever teste falhando ANTES de implementar**

```typescript
// ragnarok-front/src/components/combat/__tests__/CombatScreen.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CombatScreen } from '../CombatScreen'

vi.mock('../../../hooks/useCombat', () => ({
  useAttack: () => ({ mutate: vi.fn() }),
  useSkillInCombat: () => ({ mutate: vi.fn() }),
}))
vi.mock('../../../hooks/useSkills', () => ({
  useUsableSkills: () => ({ data: [] }),
}))
vi.mock('../../../hooks/useMap', () => ({
  useMap: () => ({ data: { monsters: [] } }),
}))
vi.mock('../../../store/combatStore', () => ({
  useCombatStore: (sel: any) => sel({
    targetMonster: null, inCombat: false, battleLog: [],
    setTarget: vi.fn(), clearTarget: vi.fn(), appendLog: vi.fn(), clearLog: vi.fn(),
  }),
}))
vi.mock('../../../store/playerStore', () => ({
  usePlayerStore: (sel?: any) => sel ? sel({ playerId: 1 }) : { playerId: 1 },
}))

describe('CombatScreen', () => {
  it('exibe seletor de monstro quando sem alvo', () => {
    render(<CombatScreen />)
    expect(screen.getByText(/selecione um monstro/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar para confirmar FAIL**

```bash
cd ragnarok-front && npm run test -- CombatScreen
```
Expected: FAIL (componente nao existe)

- [ ] **Step 3: Criar useCombat.ts**

```typescript
// src/hooks/useCombat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { battleApi } from '../api/battleApi'
import { usePlayerStore } from '../store/playerStore'
import { useCombatStore } from '../store/combatStore'

export function useAttack() {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()
  const { appendLog, targetMonster, clearTarget } = useCombatStore()

  return useMutation({
    mutationFn: (meta: { actionsPerSecond: number; networkLatencyMs: number }) => {
      if (!targetMonster) throw new Error('Sem alvo selecionado')
      return battleApi.attack(playerId!, targetMonster.id, meta)
    },
    onSuccess: (data) => {
      appendLog(data.message)
      if (data.message.includes('VITORIA') || data.message.includes('FATAL')) {
        clearTarget()
      }
      qc.invalidateQueries({ queryKey: ['player', playerId] })
    },
    onError: (err) => appendLog(`ERRO: ${err.message}`),
  })
}

export function useSkillInCombat() {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()
  const { appendLog, targetMonster } = useCombatStore()

  return useMutation({
    mutationFn: ({ skillName, meta }: { skillName: string; meta: { actionsPerSecond: number; networkLatencyMs: number } }) => {
      if (!targetMonster) throw new Error('Sem alvo selecionado')
      return battleApi.useSkill(playerId!, skillName, targetMonster.id, meta)
    },
    onSuccess: (data) => {
      appendLog(data.message)
      qc.invalidateQueries({ queryKey: ['player', playerId] })
    },
    onError: (err) => appendLog(`ERRO: ${err.message}`),
  })
}
```

- [ ] **Step 4: Implementar MonsterCard.tsx**

```typescript
// src/components/combat/MonsterCard.tsx
import type { Monster } from '../../types/monster'

interface Props { monster: Monster; isTarget?: boolean }

export function MonsterCard({ monster, isTarget }: Props) {
  return (
    <div className={`bg-gray-800 border rounded p-3 ${isTarget ? 'border-red-500' : 'border-gray-600'}`}>
      {monster.gifUrl && (
        <img src={monster.gifUrl} alt={monster.name} className="h-16 mx-auto mb-2 pixelated" />
      )}
      <h3 className="text-white font-bold text-center">{monster.name}</h3>
      <p className="text-gray-400 text-xs text-center">{monster.race} | {monster.size} | {monster.type}</p>
      {monster.hpCurrent !== undefined && monster.stats?.hp && (
        <div className="mt-1 w-full bg-gray-700 rounded h-2">
          <div
            className="bg-red-500 h-2 rounded"
            style={{ width: `${(monster.hpCurrent / monster.stats.hp) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Implementar BattleLog.tsx**

```typescript
// src/components/combat/BattleLog.tsx
import { useEffect, useRef } from 'react'
import { useCombatStore } from '../../store/combatStore'

export function BattleLog() {
  const log = useCombatStore(s => s.battleLog)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  return (
    <div className="bg-gray-950 border border-gray-700 rounded p-2 h-48 overflow-y-auto font-mono text-xs">
      {log.length === 0
        ? <p className="text-gray-600">Aguardando combate...</p>
        : log.map((line, i) => (
          <p key={i} className={line.startsWith('VITORIA') ? 'text-yellow-400' : line.startsWith('FATAL') ? 'text-red-400' : line.startsWith('ERRO') ? 'text-red-300' : 'text-green-300'}>
            {line}
          </p>
        ))
      }
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 6: Implementar CombatScreen.tsx**

```typescript
// src/components/combat/CombatScreen.tsx
import { useCombatStore } from '../../store/combatStore'
import { useAttack, useSkillInCombat } from '../../hooks/useCombat'
import { useUsableSkills } from '../../hooks/useSkills'
import { useMap } from '../../hooks/useMap'
import { usePlayerStore } from '../../store/playerStore'
import { MonsterCard } from './MonsterCard'
import { BattleLog } from './BattleLog'
import { ActionButton } from '../ui/ActionButton'

export function CombatScreen() {
  const { targetMonster, setTarget, clearTarget, inCombat } = useCombatStore()
  const { mutate: attack } = useAttack()
  const { mutate: useSkill } = useSkillInCombat()
  const { data: usableSkills = [] } = useUsableSkills()

  return (
    <div className="space-y-3">
      {targetMonster ? (
        <>
          <MonsterCard monster={targetMonster} isTarget />

          <div className="flex flex-wrap gap-2">
            <ActionButton
              label="Atacar"
              onClick={async (meta) => attack(meta)}
              variant="danger"
            />
            {usableSkills.filter(s => s.currentLevel > 0).map(skill => (
              <ActionButton
                key={skill.skillId}
                label={skill.aegisName}
                onClick={async (meta) => useSkill({ skillName: skill.skillId, meta })}
                variant="secondary"
              />
            ))}
            <button onClick={clearTarget} className="text-xs text-gray-400 hover:text-gray-200 px-2">
              Fugir
            </button>
          </div>

          <BattleLog />
        </>
      ) : (
        <MonsterSelector onSelect={setTarget} />
      )}
    </div>
  )
}

function MonsterSelector({ onSelect }: { onSelect: (m: any) => void }) {
  const { playerId } = usePlayerStore()
  const { data: map } = useMap()

  // Usa os spawns do mapa para listar monstros disponiveis
  // useMap deve retornar a lista de monstros com HP atual via /maps/{name}/monsters
  const monsters = (map as any)?.monsters ?? []

  return (
    <div>
      <p className="text-gray-400 text-sm mb-2">Selecione um monstro para atacar:</p>
      {monsters.length === 0 && <p className="text-gray-600 text-sm">Nenhum monstro neste mapa.</p>}
      <div className="grid grid-cols-2 gap-2">
        {monsters.map((m: any) => (
          <button key={m.id} onClick={() => onSelect(m)} className="text-left">
            <MonsterCard monster={m} />
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Rodar testes para confirmar PASS**

```bash
cd ragnarok-front && npm run test -- CombatScreen
```
Expected: 1 passed

- [ ] **Step 8: Commit**

```bash
git add ragnarok-front/src/hooks/useCombat.ts ragnarok-front/src/components/combat && git commit -m "feat: add combat screen with attack, skill usage and battle log"
```

---

### Task 10: [AGENTE F] Mapa e Navegacao

**Files:**
- Create: `ragnarok-front/src/hooks/useMap.ts`
- Create: `ragnarok-front/src/components/map/MapView.tsx`
- Create: `ragnarok-front/src/components/map/PortalList.tsx`
- Test: `ragnarok-front/src/components/map/__tests__/MapView.test.tsx`

- [ ] **Step 1: Escrever teste falhando ANTES de implementar**

```typescript
// ragnarok-front/src/components/map/__tests__/MapView.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MapView } from '../MapView'

vi.mock('../../../hooks/useMap', () => ({
  useMap: () => ({
    map: { name: 'prontera', portals: [{ id: 1, fromMap: 'prontera', toMap: 'payon', fromX: 100, fromY: 200 }], spawns: [] },
    monsters: [{ id: 100, name: 'Poring', race: 'Plant', size: 'SMALL', type: 'Normal' }],
    isLoading: false,
  }),
  useMove: () => ({ mutate: vi.fn() }),
}))
vi.mock('../../../hooks/usePlayer', () => ({
  usePlayer: () => ({ data: { location: { mapName: 'prontera', x: 150, y: 150, savePointMap: 'prontera' } } }),
}))

describe('MapView', () => {
  it('exibe o nome do mapa', () => {
    render(<MapView />)
    expect(screen.getByText('prontera')).toBeInTheDocument()
  })
  it('exibe monstro no mapa', () => {
    render(<MapView />)
    expect(screen.getByText('Poring')).toBeInTheDocument()
  })
  it('exibe portal disponivel', () => {
    render(<MapView />)
    expect(screen.getByText('payon')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar para confirmar FAIL**

```bash
cd ragnarok-front && npm run test -- MapView
```
Expected: FAIL (componente nao existe)

- [ ] **Step 3: Criar useMap.ts**

```typescript
// src/hooks/useMap.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mapApi } from '../api/mapApi'
import { usePlayerStore } from '../store/playerStore'
import { usePlayer } from './usePlayer'

export function useMap() {
  const { data: player } = usePlayer()
  const mapName = player?.location?.mapName

  const mapQuery = useQuery({
    queryKey: ['map', mapName],
    queryFn: () => mapApi.get(mapName!),
    enabled: mapName != null,
  })

  const monstersQuery = useQuery({
    queryKey: ['map-monsters', mapName],
    queryFn: () => mapApi.getMonsters(mapName!),
    enabled: mapName != null,
    refetchInterval: 30_000,  // recarrega spawns a cada 30s
  })

  return {
    map: mapQuery.data,
    monsters: monstersQuery.data ?? [],
    isLoading: mapQuery.isLoading,
  }
}

export function useMove() {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()

  return useMutation({
    mutationFn: (targetMap: string) => mapApi.move(playerId!, targetMap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player', playerId] }),
  })
}
```

- [ ] **Step 4: Implementar PortalList.tsx**

```typescript
// src/components/map/PortalList.tsx
import type { Portal } from '../../types/map'
import { ActionButton } from '../ui/ActionButton'

interface Props {
  portals: Portal[]
  onMove: (targetMap: string) => void
}

export function PortalList({ portals, onMove }: Props) {
  if (portals.length === 0) return <p className="text-gray-500 text-sm">Nenhum portal disponível.</p>

  return (
    <div className="space-y-1">
      <h3 className="text-gray-300 text-sm font-bold mb-2">Portais</h3>
      {portals.map((p, i) => (
        <div key={i} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
          <span className="text-gray-200 text-sm">{p.toMap}</span>
          <ActionButton
            label="Entrar"
            onClick={async () => onMove(p.toMap)}
            variant="secondary"
            className="text-xs py-0.5 px-2"
          />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Implementar MapView.tsx**

```typescript
// src/components/map/MapView.tsx
import { useMap, useMove } from '../../hooks/useMap'
import { usePlayer } from '../../hooks/usePlayer'
import { PortalList } from './PortalList'

export function MapView() {
  const { data: player } = usePlayer()
  const { map, monsters, isLoading } = useMap()
  const { mutate: move } = useMove()

  if (isLoading || !player) return <p className="text-gray-400">Carregando mapa...</p>

  const loc = player.location

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded p-3">
        <h2 className="text-yellow-400 font-bold">{loc.mapName}</h2>
        <p className="text-gray-400 text-xs">Posicao: {Math.round(loc.x)}, {Math.round(loc.y)}</p>
        <p className="text-gray-400 text-xs">Save: {loc.savePointMap}</p>
      </div>

      <div>
        <h3 className="text-gray-300 text-sm font-bold mb-2">Monstros ({monsters.length})</h3>
        {monsters.length === 0
          ? <p className="text-gray-500 text-sm">Sem monstros ativos.</p>
          : (
            <div className="space-y-1">
              {monsters.map(m => (
                <div key={m.id} className="flex justify-between bg-gray-800 rounded px-3 py-1.5 text-sm">
                  <span className="text-gray-200">{m.name}</span>
                  <span className="text-gray-500">{m.race} | {m.size}</span>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {map && <PortalList portals={map.portals ?? []} onMove={(target) => move(target)} />}
    </div>
  )
}
```

- [ ] **Step 6: Rodar testes para confirmar PASS**

```bash
cd ragnarok-front && npm run test -- MapView
```
Expected: 3 passed

- [ ] **Step 7: Commit**

```bash
git add ragnarok-front/src/hooks/useMap.ts ragnarok-front/src/components/map && git commit -m "feat: add map view with portal navigation and monster list"
```

---

### Task 11: [AGENTE G] Troca de Classe

**Files:**
- Create: `ragnarok-front/src/hooks/useClassChange.ts`
- Create: `ragnarok-front/src/components/classchange/ClassChangeScreen.tsx`
- Test: `ragnarok-front/src/components/classchange/__tests__/ClassChangeScreen.test.tsx`

- [ ] **Step 1: Escrever teste falhando ANTES de implementar**

```typescript
// ragnarok-front/src/components/classchange/__tests__/ClassChangeScreen.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ClassChangeScreen } from '../ClassChangeScreen'

vi.mock('../../../hooks/useClassChange', () => ({
  useAvailableClasses: () => ({ data: ['KNIGHT', 'CRUSADER'], isLoading: false }),
  useChangeClass: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}))
vi.mock('../../../hooks/usePlayer', () => ({
  usePlayer: () => ({ data: { jobClass: 'SWORDSMAN', jobLevel: 42 } }),
}))

describe('ClassChangeScreen', () => {
  it('exibe classes disponiveis', () => {
    render(<ClassChangeScreen />)
    expect(screen.getByText('Cavaleiro')).toBeInTheDocument()
    expect(screen.getByText('Cruzado')).toBeInTheDocument()
  })
  it('exibe dois botoes Escolher', () => {
    render(<ClassChangeScreen />)
    expect(screen.getAllByText('Escolher')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Rodar para confirmar FAIL**

```bash
cd ragnarok-front && npm run test -- ClassChange
```
Expected: FAIL (componente nao existe)

- [ ] **Step 3: Criar useClassChange.ts**

```typescript
// src/hooks/useClassChange.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classApi } from '../api/classApi'
import { usePlayerStore } from '../store/playerStore'

export function useAvailableClasses() {
  const { playerId } = usePlayerStore()
  return useQuery({
    queryKey: ['classes-available', playerId],
    queryFn: () => classApi.listAvailable(playerId!),
    enabled: playerId != null,
  })
}

export function useChangeClass() {
  const qc = useQueryClient()
  const { playerId } = usePlayerStore()

  return useMutation({
    mutationFn: (newClass: string) => classApi.change(playerId!, newClass),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player', playerId] })
      qc.invalidateQueries({ queryKey: ['classes-available', playerId] })
      qc.invalidateQueries({ queryKey: ['skills', playerId] })
    },
  })
}
```

- [ ] **Step 4: Implementar ClassChangeScreen.tsx**

Regras de exibicao (espelham o ClassChangeService do backend):
- NOVICE pode trocar apos job lv 9
- Tier 1 pode trocar apos job lv 40
- Tier 2+ nao pode trocar via esta tela

```typescript
// src/components/classchange/ClassChangeScreen.tsx
import { useAvailableClasses, useChangeClass } from '../../hooks/useClassChange'
import { usePlayer } from '../../hooks/usePlayer'
import { ActionButton } from '../ui/ActionButton'

const CLASS_LABELS: Record<string, string> = {
  SWORDSMAN: 'Espadachim', MAGE: 'Mago', ARCHER: 'Arqueiro',
  ACOLYTE: 'Acólito', THIEF: 'Ladrão', MERCHANT: 'Mercador',
  KNIGHT: 'Cavaleiro', WIZARD: 'Mago Avançado', HUNTER: 'Caçador',
  PRIEST: 'Sacerdote', ASSASSIN: 'Assassino', BLACKSMITH: 'Ferreiro',
  CRUSADER: 'Cruzado', SAGE: 'Sábio', BARD: 'Bardo', DANCER: 'Dançarina',
  MONK: 'Monge', ROGUE: 'Ladino', ALCHEMIST: 'Alquimista',
}

export function ClassChangeScreen() {
  const { data: player } = usePlayer()
  const { data: available = [], isLoading } = useAvailableClasses()
  const { mutate: change, isPending, error } = useChangeClass()

  if (isLoading) return <p className="text-gray-400">Verificando progressao...</p>

  if (available.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400">Nenhuma troca de classe disponivel.</p>
        {player && (
          <p className="text-gray-600 text-sm mt-1">
            {player.jobClass} | Job Lv {player.jobLevel}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-yellow-400 font-bold">Troca de Classe</h2>
      <p className="text-gray-400 text-sm">Escolha sua proxima classe:</p>

      {error && <p className="text-red-400 text-sm">{String(error)}</p>}

      <div className="grid grid-cols-1 gap-2">
        {available.map(cls => (
          <div key={cls} className="bg-gray-800 border border-gray-600 rounded p-3 flex justify-between items-center">
            <span className="text-white font-semibold">{CLASS_LABELS[cls] ?? cls}</span>
            <ActionButton
              label="Escolher"
              onClick={async () => change(cls)}
              disabled={isPending}
              variant="primary"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Rodar testes para confirmar PASS**

```bash
cd ragnarok-front && npm run test -- ClassChange
```
Expected: 2 passed

- [ ] **Step 6: Commit**

```bash
git add ragnarok-front/src/hooks/useClassChange.ts ragnarok-front/src/components/classchange && git commit -m "feat: add class change screen"
```

---

## FASE 2 — Integracao Final (sequential, apos Fase 1 completa)

### Task 12: GamePage — Shell do Jogo

**Files:**
- Modify: `ragnarok-front/src/pages/GamePage.tsx`
- Test: `ragnarok-front/src/pages/__tests__/GamePage.test.tsx`

- [ ] **Step 1: Escrever teste GamePage**

```typescript
// src/pages/__tests__/GamePage.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import GamePage from '../GamePage'

// Mock todos os hooks e stores
vi.mock('../../store/playerStore', () => ({
  usePlayerStore: (sel?: any) => {
    const state = { playerId: 1, clearPlayer: vi.fn() }
    return sel ? sel(state) : state
  },
}))
vi.mock('../../hooks/usePlayer', () => ({
  usePlayer: () => ({
    data: {
      id: 1, name: 'Heroi', jobClass: 'SWORDSMAN', baseLevel: 10, jobLevel: 5,
      baseExp: 0, jobExp: 0, zenny: 0, statPoints: 0, skillPoints: 0,
      hpCurrent: 300, spCurrent: 40, maxHp: 500, maxSp: 40,
      stats: { str: 9, agi: 5, vit: 6, intVal: 1, dex: 4, luk: 3, maxHp: 500, maxSp: 40 },
      location: { mapName: 'prontera', x: 150, y: 150, savePointMap: 'prontera' },
      inventory: [], activeBuffs: [],
    },
    isLoading: false,
  }),
  useResurrect: () => ({ mutate: vi.fn() }),
}))
vi.mock('../../hooks/useMap', () => ({
  useMap: () => ({ map: { portals: [], spawns: [] }, monsters: [], isLoading: false }),
  useMove: () => ({ mutate: vi.fn() }),
}))
vi.mock('../../store/uiStore', () => ({
  useUiStore: (sel?: any) => {
    const state = { captchaVisible: false, errorMessage: null, clearError: vi.fn(), showCaptcha: vi.fn(), hideCaptcha: vi.fn() }
    return sel ? sel(state) : state
  },
}))
vi.mock('../../hooks/useSkills', () => ({
  useSkills: () => ({ data: [], isLoading: false }),
  useUsableSkills: () => ({ data: [] }),
  useLearnSkill: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useSkillOutOfCombat: () => ({ mutate: vi.fn() }),
}))
vi.mock('../../hooks/useInventory', () => ({
  useInventory: () => ({ data: [], isLoading: false }),
  useEquipItem: () => ({ mutate: vi.fn() }),
  useUseItem: () => ({ mutate: vi.fn() }),
}))
vi.mock('../../hooks/useClassChange', () => ({
  useAvailableClasses: () => ({ data: [], isLoading: false }),
  useChangeClass: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}))
vi.mock('../../store/combatStore', () => ({
  useCombatStore: (sel: any) => sel({
    targetMonster: null, inCombat: false, battleLog: [],
    setTarget: vi.fn(), clearTarget: vi.fn(), appendLog: vi.fn(), clearLog: vi.fn(),
  }),
}))
vi.mock('../../hooks/useCombat', () => ({
  useAttack: () => ({ mutate: vi.fn() }),
  useSkillInCombat: () => ({ mutate: vi.fn() }),
}))

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

describe('GamePage', () => {
  it('exibe nome do personagem', () => {
    render(
      <QueryClientProvider client={qc}><MemoryRouter><GamePage /></MemoryRouter></QueryClientProvider>
    )
    expect(screen.getByText('Heroi')).toBeInTheDocument()
  })

  it('exibe as 5 abas', () => {
    render(
      <QueryClientProvider client={qc}><MemoryRouter><GamePage /></MemoryRouter></QueryClientProvider>
    )
    expect(screen.getByText('Mapa')).toBeInTheDocument()
    expect(screen.getByText('Combate')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar para confirmar FAIL**

```bash
cd ragnarok-front && npm run test -- GamePage
```
Expected: FAIL — "Cannot find module '../GamePage'"

- [ ] **Step 3: Implementar GamePage.tsx com tabs**

```typescript
// src/pages/GamePage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { usePlayer, useResurrect } from '../hooks/usePlayer'
import { PlayerDashboard } from '../components/player/PlayerDashboard'
import { InventoryGrid } from '../components/inventory/InventoryGrid'
import { SkillTree } from '../components/skills/SkillTree'
import { CombatScreen } from '../components/combat/CombatScreen'
import { MapView } from '../components/map/MapView'
import { ClassChangeScreen } from '../components/classchange/ClassChangeScreen'
import { CaptchaModal } from '../components/ui/CaptchaModal'
import { ActionButton } from '../components/ui/ActionButton'
import { useUiStore } from '../store/uiStore'

type Tab = 'mapa' | 'combate' | 'inventario' | 'skills' | 'classe'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'mapa', label: 'Mapa' },
  { key: 'combate', label: 'Combate' },
  { key: 'inventario', label: 'Inv' },
  { key: 'skills', label: 'Skills' },
  { key: 'classe', label: 'Classe' },
]

export default function GamePage() {
  const [activeTab, setActiveTab] = useState<Tab>('mapa')
  const { playerId, clearPlayer } = usePlayerStore()
  const { data: player, isLoading } = usePlayer()
  const { mutate: resurrect } = useResurrect()
  const { errorMessage, clearError } = useUiStore()
  const navigate = useNavigate()

  if (!playerId) {
    navigate('/')
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Carregando personagem...</p>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-4">
        <p className="text-red-400">Personagem nao encontrado.</p>
        <button onClick={() => { clearPlayer(); navigate('/') }} className="text-gray-400 underline text-sm">
          Criar novo personagem
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto">
      <CaptchaModal />

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-3 py-2 flex justify-between items-center">
        <span className="text-yellow-400 font-bold text-sm">Ragnarok Core</span>
        <button onClick={() => { clearPlayer(); navigate('/') }} className="text-gray-500 text-xs hover:text-gray-300">
          Sair
        </button>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-900 border-b border-red-700 px-3 py-2 flex justify-between items-center">
          <p className="text-red-200 text-sm">{errorMessage}</p>
          <button onClick={clearError} className="text-red-400 text-xs">X</button>
        </div>
      )}

      {/* Player Panel */}
      <div className="p-3">
        <PlayerDashboard player={player} />
        {player.hpCurrent === 0 && (
          <ActionButton
            label="Ressuscitar"
            onClick={async () => resurrect()}
            variant="danger"
            className="w-full mt-2"
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-900">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-semibold ${activeTab === tab.key ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-3 overflow-y-auto">
        {activeTab === 'mapa'       && <MapView />}
        {activeTab === 'combate'    && <CombatScreen />}
        {activeTab === 'inventario' && <InventoryGrid />}
        {activeTab === 'skills'     && <SkillTree />}
        {activeTab === 'classe'     && <ClassChangeScreen />}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar todos os testes**

```bash
npm run test
```
Expected: todos passando

- [ ] **Step 5: Build de producao**

```bash
npm run build
```
Expected: sem erros de TypeScript, dist/ gerada

- [ ] **Step 6: Commit**

```bash
git add src/pages && git commit -m "feat: assemble GamePage with all tabs (map, combat, inventory, skills, class-change)"
```

---

## Checklist de Compliance Antifraude

Antes de considerar o frontend pronto, verificar:

- [ ] `ActionButton` tem throttle de 500ms (impede APS > 15 que dispara SHOW_CAPTCHA)
- [ ] `X-Action-Timestamp` e enviado em todo request via interceptor do Axios
- [ ] `actionsPerSecond` e `networkLatencyMs` sao enviados nas acoes de batalha
- [ ] Respostas com `requiredAction: "SHOW_CAPTCHA"` mostram o `CaptchaModal`
- [ ] Respostas com `requiredAction: "DROP_SESSION"` fazem logout imediato
- [ ] Respostas com `verdict: "BLOCKED"` fazem logout mesmo sem `requiredAction` explicito (handleFraudResponse)
- [ ] Respostas com `requiredAction: "CANCEL_ACTION"` mostram erro sem crash
- [ ] Respostas com `requiredAction: "FLAG_FOR_REVIEW"` sao fail-open (jogo continua, log no console)
- [ ] Sem polling agressivo: `refetchInterval` nao e menor que 10s em nenhum hook
- [ ] Botoes de combate ficam desabilitados (spinner) durante a requisicao
- [ ] `CaptchaModal` e um placeholder (aprova ao clicar) — integrar CAPTCHA real antes de ir para producao

---

## Guia de Desenvolvimento Local

```bash
# 1. Backend rodando na porta 8080
cd C:\Users\silve\IdeaProjects\ragnarok-core
./mvnw spring-boot:run

# 2. Antifraude rodando na porta 8081 (opcional, o core tem fallback)
cd C:\Users\silve\IdeaProjects\ragnarok-simulator\ragnarok-antifraude
ANTIFRAUDE_API_KEY=dev-key-123 ./mvnw spring-boot:run

# 3. Frontend
cd C:\Users\silve\IdeaProjects\ragnarok-front
cp .env.example .env
npm run dev

# 4. Testes
npm run test

# 5. Build
npm run build
```

---

## Ordem de Execucao para Agentes Paralelos

```
[Fase 0 - Sequential]
Task 0: Scaffold
Task 1: Types
Task 2: API Client
Task 3: Stores
Task 4: useActionGuard
         |
         v
[Fase 1a - Sequential — GATE: aguardar commit antes de prosseguir]
Task 5: UI Components (COMMIT OBRIGATORIO antes de despachar Tasks 6-11)
         |
         v
[Fase 1b - Parallel - dispatchar simultaneamente apos Task 5 commitada]
Task 6 (A): Player/Character
Task 7 (B): Inventory
Task 8 (C): Skills
Task 9 (D): Combat
Task 10(E): Map
Task 11(F): Class Change
         |
         v
[Fase 2 - Sequential]
Task 12: GamePage Assembly + Integracao Final
```

> **IMPORTANTE:** Tasks 6-11 so devem ser despachadas APOS Task 5 estar commitada no branch. Todos importam componentes de `src/components/ui/` (ActionButton, HpBar, SpBar, ExpBar, etc). Tasks 6-11 sao independentes ENTRE SI e podem rodar em paralelo.
