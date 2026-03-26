# ragnarok-front Refactor — Design Spec

**Data:** 2026-03-25
**Status:** Aprovado

---

## Objetivo

Refatorar o frontend Next.js gerado pelo V0 para consumir corretamente a API REST do ragnarok-core atual. O visual existente (dark theme, shadcn/Radix UI, pixel fonts, layout responsivo) é mantido. Toda a camada de lógica (types, api client, contexto de jogo, painéis) é reescrita.

Features do core ainda não implementadas (auth JWT, equip item, shop, trade, market) recebem **stubs vazios** — componentes existem na UI mas não chamam API até o core estar pronto.

---

## Arquitetura

**Stack mantida:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/Radix UI, Sonner

**O que muda:**
- `lib/types.ts` — reescrito com tipos reais do core
- `lib/api.ts` — reescrito com endpoints corretos + interceptor antifraude
- `lib/game-context.tsx` — reescrito para modelo simplificado (walk → encontro → ataque)
- `components/game/*` — painéis reescritos para os tipos/endpoints corretos

**O que permanece sem alteração:** UI shell (layout, tema, fonts, shadcn components, `app/` routing, `class-change-panel.tsx`, páginas de auth)

---

## API Real do ragnarok-core (contratos atuais)

### Player
- `GET /api/players/{id}` → `PlayerResponse`
- `POST /api/players` `{name: string, jobClass: string}` → `PlayerResponse` (201)

**PlayerResponse:**
```typescript
{
  id: number
  name: string
  jobClass: string
  baseLevel: number
  jobLevel: number
  hpCurrent: number
  hpMax: number
  spCurrent: number
  spMax: number
  str: number
  agi: number
  vit: number
  intelligence: number   // campo no TS; chave no payload da API é "int"
  dex: number
  luk: number
  statPoints: number
  skillPoints: number
  zenny: number
  mapName: string
}
```

### Battle
- `POST /api/battle/attack` `{playerId: number, monsterId: number}` → `BattleResult`

**BattleResult:**
```typescript
{
  message: string        // ex: "Você atacou Poring por 45 de dano!"
  fraud?: FraudResponse  // presente apenas quando antifraude disparou
}
```

> O core não retorna XP, HP atualizado ou loot nesta resposta. Após o ataque, chamar `GET /api/players/{id}` para atualizar o player.

### Skills

> **Nomenclatura:** `SkillRow.aegisName` é o identificador único (ex: `"BASH"`). `SkillRow.name` é o nome exibível (ex: `"Bash"`). O parâmetro `{skillName}` nas URLs **sempre recebe o valor de `aegisName`**, nunca `name`.

- `GET /api/players/{id}/skills` → `SkillRow[]`
- `POST /api/players/{id}/skills/{aegisName}/learn` → `{message: string}`
- `POST /api/players/{id}/skills/{aegisName}/use` `{monsterId?: number}` → `{message: string}`

**SkillRow:**
```typescript
{
  aegisName: string      // identificador para URLs (ex: "BASH")
  name: string           // nome display (ex: "Bash") — NÃO usar em URLs
  maxLevel: number
  currentLevel: number
  canLearn: boolean
  blockedReason?: string // presente quando canLearn === false
}
```

> "Botão Usar" aparece para todas as skills com `currentLevel > 0`. O core retorna erro se a skill não puder ser usada no contexto atual — a UI não diferencia ativa/passiva. Após `use`, chamar `refreshPlayer()` para atualizar SP.

### Inventory
- `GET /api/players/{id}/inventory` → `InventoryItem[]`
- `POST /api/players/{id}/inventory/{uuid}/use` → `{message: string}`

**InventoryItem:**
```typescript
{
  id: string             // UUID
  name: string
  type: 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'ETC'
  amount: number
  equipped: boolean
}
```

### Map
- `GET /api/players/{id}/map` → `MapInfo`
- `POST /api/players/{id}/map/walk` → `WalkResult`
- `POST /api/players/{id}/map/travel` `{destination: string}` → **200 OK sem body**
- `GET /api/maps/{mapId}/portals` → `string[]`

**MapInfo:**
```typescript
{
  mapName: string
  portals: string[]      // nomes de destino disponíveis
}
```

**WalkResult:**
```typescript
{
  encounterOccurred: boolean
  monsterId: number | null       // null quando encounterOccurred === false
  monsterName: string | null
  monsterHp: number | null       // HP inicial do monstro no momento do encontro
  message: string
}
```

### Distribuir Stats
- `PUT /api/players/{id}/stats` `{str?: number, agi?: number, vit?: number, int?: number, dex?: number, luk?: number}` → `PlayerResponse`

> **Naming:** o payload usa `int` (não `intelligence`). `PlayerResponse` usa `intelligence`. `distributeStats` mapeia a chave interna para o payload correto.
>
> Se retornar 404, `toast.error("Distribuição de stats não disponível ainda")` — sem quebrar a aplicação.

---

## Antifraude (frontend)

O ragnarok-core pode retornar um campo `fraud` no body de qualquer resposta JSON.

### Shape do FraudResponse

```typescript
interface FraudResponse {
  verdict: 'APPROVED' | 'BLOCKED' | 'CHALLENGE' | 'UNKNOWN'
  requiredAction: 'NONE' | 'CANCEL_ACTION' | 'SHOW_CAPTCHA' | 'DROP_SESSION' | 'FLAG_FOR_REVIEW' | 'ALERT_ONLY'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason?: string
}
```

`fraud` é opcional. Se ausente, nenhuma ação é tomada.
`verdict` e `requiredAction` são campos independentes — `BLOCKED` vem via `verdict`; as demais ações via `requiredAction`.

### Regras de tratamento

| Condição | Ação |
|----------|------|
| `fraud` ausente | Nada |
| `verdict === 'BLOCKED'` | `localStorage.removeItem('playerId')` + `toast.error("Conta bloqueada")` + `router.push('/')` |
| `requiredAction === 'DROP_SESSION'` | `localStorage.removeItem('playerId')` + `router.push('/')` |
| `requiredAction === 'SHOW_CAPTCHA'` | Chama `showCaptcha()` do GameContext |
| `requiredAction === 'CANCEL_ACTION'` | `toast.error("Ação cancelada pelo sistema de segurança")` |
| `requiredAction === 'FLAG_FOR_REVIEW'` | `console.warn('[antifraude] FLAG_FOR_REVIEW', fraud)` — fail-open |
| `requiredAction === 'ALERT_ONLY'` | `console.warn('[antifraude] ALERT_ONLY', fraud)` — fail-open |
| `requiredAction === 'NONE'` | Nada |

### CaptchaModal (stub)

O `CaptchaModal` é renderizado no `app/(game)/layout.tsx` (não dentro de painéis individuais), garantindo que qualquer chamada de API possa ativá-lo.

```tsx
// app/(game)/layout.tsx
<GameProvider>
  {children}
  <CaptchaModal />   {/* renderizado aqui, controlado por captchaVisible no context */}
</GameProvider>
```

Comportamento do modal:
- Aparece quando `captchaVisible === true`
- Exibe mensagem "Verificação de segurança necessária"
- Botão "Sou Humano" → `hideCaptcha()`
- Não faz chamada API
- `// TODO: integrar reCAPTCHA/hCaptcha — POST /api/antifraude/captcha/verify`

### Implementação no `lib/api.ts`

```typescript
// Em todo request:
headers['X-Action-Timestamp'] = Date.now().toString()

// Endpoints com body JSON — verificar fraud:
const data = await response.json()
if (data?.fraud) handleFraudResponse(data.fraud)
return data

// Endpoints sem body (ex: travel) — NÃO chamar .json():
if (!response.ok) throw new Error(`HTTP ${response.status}`)
return  // void

// Exportar para testes:
export function handleFraudResponse(fraud: FraudResponse): void
```

> `handleFraudResponse` precisa de acesso ao `router` e `showCaptcha`. Implementar como factory:
> `export function createFraudHandler(router: AppRouter, showCaptcha: () => void): (fraud: FraudResponse) => void`

### Throttle de 500ms

Botões "Andar" e "Atacar" desabilitados por 500ms após cada click:

```typescript
const throttleRef = useRef(false)
const handleClick = () => {
  if (throttleRef.current) return
  throttleRef.current = true
  doAction()
  setTimeout(() => { throttleRef.current = false }, 500)
}
```

---

## Fluxo de jogo (modelo correto)

```
/ (criar personagem)
  └─ POST /api/players → setPlayerId → router.push('/game')
        └─ /game
              ├─ Tab Mapa
              │    ├─ mount → GET /players/{id}/map
              │    ├─ [Botão Andar, throttle 500ms] POST /map/walk
              │    │    ├─ encounterOccurred: false → toast(message), append battleLog
              │    │    └─ encounterOccurred: true → setCurrentEncounter + append battleLog
              │    │         └─ [Botão Atacar, throttle 500ms] POST /battle/attack
              │    │              └─ toast(message) + append battleLog
              │    │                   + GET /players/{id} (refresh)
              │    │                   + clearEncounter()  ← sempre, independente do resultado
              │    └─ [Portal] POST /map/travel → GET /players/{id}/map (refresh mapa)
              │                                 + clearBattleLog()
              ├─ Tab Inventário
              │    ├─ mount → GET /inventory
              │    ├─ [Usar consumível] inventoryApi.use → toast(message)
              │    │                   + refreshInventory() + refreshPlayer()
              │    └─ [Equipar] disabled stub + TODO
              ├─ Tab Skills
              │    ├─ mount → GET /skills
              │    ├─ [Aprender] skillApi.learn(playerId, aegisName) → toast(message)
              │    │             + refreshSkills() + refreshPlayer()
              │    └─ [Usar, currentLevel > 0] skillApi.use(playerId, aegisName)
              │                               → toast(message) + refreshPlayer()
              ├─ Tab Status
              │    ├─ exibe campos do PlayerResponse
              │    └─ [+1 stat] playerApi.distributeStats → refreshPlayer()
              └─ Estado "Morto" (hpCurrent === 0)
                   └─ overlay com botão Ressuscitar (disabled stub + TODO)
```

**Nota crítica:** `clearEncounter()` é chamado **sempre** após o ataque, independente do resultado. O modelo é: um ataque → uma mensagem → monstro desaparece. O player deve andar de novo para o próximo encontro. Não existe tracking de HP do monstro entre rounds.

**battleLog:**
- Array de strings no GameContext
- Appended por: `walkMap()` (campo `message`) e `attackMonster()` (campo `message`)
- Máximo 100 entradas (remove as mais antigas)
- Limpo (`clearBattleLog()`) quando `travelTo()` completa com sucesso

---

## Stubs (não integrar — core ainda não tem)

| Feature | Componente | Endpoint futuro esperado |
|---------|-----------|--------------------------|
| Auth JWT | `app/(auth)/login`, `app/(auth)/register` | `POST /api/auth/login`, `POST /api/auth/register` |
| Equipar item | `inventory-panel.tsx` | `POST /api/players/{id}/inventory/{uuid}/equip` |
| Class change | `class-change-panel.tsx` | `POST /api/players/{id}/class/change {targetClass}` |
| Ressuscitar | overlay em `/game` | `POST /api/players/{id}/resurrect` |
| Captcha verify | `CaptchaModal` | `POST /api/antifraude/captcha/verify` |
| Troca, Loja, Mercado | — | Não criar por enquanto |

> `class-change-panel.tsx` **não é alterado** por nenhum agente — permanece como está no V0.

---

## Fase 0 — Sequencial (base, ambos os agentes dependem)

**Arquivos:**
- `lib/types.ts` — reescrever completo
- `lib/api.ts` — reescrever completo
- `lib/game-context.tsx` — reescrever completo

### `lib/types.ts`

Exportar exatamente:

```typescript
export interface PlayerResponse { /* campos acima */ }
export interface SkillRow { /* campos acima */ }
export interface InventoryItem { /* campos acima */ }
export interface MapInfo { mapName: string; portals: string[] }
export interface WalkResult { encounterOccurred: boolean; monsterId: number|null; monsterName: string|null; monsterHp: number|null; message: string }
export interface BattleResult { message: string; fraud?: FraudResponse }
export interface FraudResponse { verdict: Verdict; requiredAction: RequiredAction; riskLevel: string; reason?: string }
export type Verdict = 'APPROVED' | 'BLOCKED' | 'CHALLENGE' | 'UNKNOWN'
export type RequiredAction = 'NONE' | 'CANCEL_ACTION' | 'SHOW_CAPTCHA' | 'DROP_SESSION' | 'FLAG_FOR_REVIEW' | 'ALERT_ONLY'
export interface Encounter { monsterId: number; monsterName: string; monsterHpInitial: number }
```

### `lib/api.ts`

- `fetch` nativo (sem Axios)
- Header `X-Action-Timestamp: Date.now().toString()` em todo request
- Endpoints JSON: parseia body, checa `data?.fraud`, chama fraud handler
- Endpoints void (travel): não parseia body, só checa `response.ok`
- Exporta `createFraudHandler(router, showCaptcha)` e `handleFraudResponse` (para testes)

```typescript
export const playerApi = {
  get(id: number): Promise<PlayerResponse>
  create(name: string, jobClass: string): Promise<PlayerResponse>
  // "int" no payload → mapeia de "intelligence" internamente
  distributeStats(id: number, stats: Partial<Record<'str'|'agi'|'vit'|'int'|'dex'|'luk', number>>): Promise<PlayerResponse>
}
export const battleApi = {
  attack(playerId: number, monsterId: number): Promise<BattleResult>
}
export const skillApi = {
  list(playerId: number): Promise<SkillRow[]>
  learn(playerId: number, aegisName: string): Promise<{message: string}>
  use(playerId: number, aegisName: string, monsterId?: number): Promise<{message: string}>
}
export const inventoryApi = {
  list(playerId: number): Promise<InventoryItem[]>
  use(playerId: number, itemId: string): Promise<{message: string}>
}
export const mapApi = {
  get(playerId: number): Promise<MapInfo>
  walk(playerId: number): Promise<WalkResult>
  travel(playerId: number, destination: string): Promise<void>  // sem body na resposta
}
```

### `lib/game-context.tsx`

```typescript
interface GameContextType {
  playerId: number | null
  setPlayerId: (id: number) => void
  player: PlayerResponse | null
  refreshPlayer: () => Promise<void>
  currentEncounter: Encounter | null       // setado por walkMap(), limpo por clearEncounter()
  clearEncounter: () => void
  walkMap: () => Promise<void>             // throttle gerenciado no componente, não aqui
  travelTo: (destination: string) => Promise<void>
  attackMonster: (monsterId: number) => Promise<void>  // sempre chama clearEncounter() ao final
  battleLog: string[]                      // max 100, appended por walk e attack
  clearBattleLog: () => void               // chamado por travelTo ao completar
  mapInfo: MapInfo | null
  inventory: InventoryItem[]
  refreshInventory: () => Promise<void>
  skills: SkillRow[]
  refreshSkills: () => Promise<void>
  isLoading: boolean
  captchaVisible: boolean
  showCaptcha: () => void
  hideCaptcha: () => void
}
```

`playerId` persistido em `localStorage` via `useEffect`.

---

## Agente A — Fluxo de Jogo

**Dependência:** Fase 0 commitada

**Arquivos:**
- `components/game/map-panel.tsx`
- `components/game/battle-panel.tsx`
- `components/game/player-hud.tsx`
- `components/ui/captcha-modal.tsx`
- `app/(game)/layout.tsx` — adicionar `<CaptchaModal />` após `{children}`

**MapPanel:**
1. `useEffect` → `mapApi.get(playerId)` ao montar (ou usa `mapInfo` do contexto se disponível)
2. Botão "Andar" (throttle 500ms via `useRef`) → `walkMap()` → se `currentEncounter !== null` exibe card do monstro
3. Card de encontro exibe: `monsterName` + HP como número fixo (`monsterHpInitial`) — apenas label de texto, sem barra de progresso
4. Botão "Atacar" (throttle 500ms) → `attackMonster(monsterId)` — contexto limpa o encontro ao final
5. Se `encounterOccurred === false` após walk: `toast.info(message)` (sem card de monstro)
6. Portais: botão por string em `mapInfo.portals` → `travelTo(dest)`
7. Erro HTTP em `walkMap`: `toast.error(...)`, estado não muda

**BattlePanel:**
- Visível quando `battleLog.length > 0`
- Lista de mensagens do `battleLog` (scroll automático para a mais recente)
- Sem botão Atacar próprio — ataque é feito no MapPanel

**PlayerHUD:**
- `name`, `jobClass`, `baseLevel` / `jobLevel`
- Barra HP: `hpCurrent` / `hpMax` com `%` calculado
- Barra SP: `spCurrent` / `spMax`
- `zenny` formatado com separador de milhar
- Se `player.hpCurrent === 0`: aplica classe CSS `opacity-50` + exibe badge "MORTO"

**CaptchaModal:**
- Stub visual
- Renderiza quando `captchaVisible === true`
- Botão "Sou Humano" → `hideCaptcha()`
- `// TODO: POST /api/antifraude/captcha/verify`

---

## Agente B — Personagem

**Dependência:** Fase 0 commitada

**Arquivos:**
- `components/game/inventory-panel.tsx`
- `components/game/skill-panel.tsx`
- `components/game/status-panel.tsx`
- `app/(game)/create-character/page.tsx`
- `app/game/page.tsx` — adicionar overlay de morte quando `player?.hpCurrent === 0`

**InventoryPanel:**
- Lista `inventory` do contexto: `name`, `type`, `amount`, badge `equipped`
- Botão "Usar" apenas para `type === 'CONSUMABLE'` → `inventoryApi.use(playerId, item.id)` → `toast(message)` + `refreshInventory()` + `refreshPlayer()`
- Botão "Equipar" para `WEAPON` / `ARMOR`: `disabled`, tooltip "Aguardando implementação no servidor"
  - `// TODO: POST /api/players/{id}/inventory/{uuid}/equip`

**SkillPanel:**
- Lista `skills` do contexto: `name`, badge `Lv {currentLevel}/{maxLevel}`, indicador `canLearn`
- Botão "Aprender" quando `canLearn === true` e `player.skillPoints > 0`
  - → `skillApi.learn(playerId, skill.aegisName)` → `toast(message)` + `refreshSkills()` + `refreshPlayer()`
- Botão "Usar" quando `skill.currentLevel > 0`
  - → `skillApi.use(playerId, skill.aegisName)` → `toast(message)` + `refreshPlayer()`
- Se `canLearn === false` e `blockedReason`: exibe tooltip com `blockedReason`

**StatusPanel:**
- Exibe: `name`, `jobClass`, `baseLevel`, `jobLevel`, `zenny`, `statPoints`, `skillPoints`
- Barra HP e SP
- Grid de stats: STR=`str`, AGI=`agi`, VIT=`vit`, INT=`intelligence`, DEX=`dex`, LUK=`luk`
- Botão `+1` por stat visível quando `player.statPoints > 0`
  - Payload enviado usa chave `int` para `intelligence`: `{int: 1}` (não `{intelligence: 1}`)
  - → `playerApi.distributeStats(id, {[statKey]: 1})` → `refreshPlayer()`
  - Erro HTTP: `toast.error(...)`, não quebra

**GamePage — overlay de morte:**
- Quando `player?.hpCurrent === 0`: renderiza overlay escuro com mensagem "Você morreu"
- Botão "Ressuscitar" `disabled` + tooltip "Em breve"
- `// TODO: POST /api/players/{id}/resurrect`

**CreateCharacterPage:**
- `POST /api/players {name, jobClass}` → `setPlayerId(player.id)` + `localStorage.setItem('playerId', player.id)` → `router.push('/game')`
- Dropdown classes: NOVICE, SWORDSMAN, MAGE, ARCHER, THIEF, MERCHANT, ACOLYTE
- Validação: nome min 3, max 24 chars, obrigatório

---

## Convenções

- `playerId` em `localStorage('playerId')` (sem auth por enquanto)
- Erros via `toast.error()` (Sonner já instalado)
- Loading: `disabled` + spinner no botão durante request em andamento
- Sem TanStack Query, sem Zustand — GameContext com `useState`/`useCallback`
- Stubs marcados com: `// TODO: aguardando endpoint core — {endpoint esperado}`

---

## Critérios de Sucesso

- [ ] `npm run build` sem erros TypeScript
- [ ] Criar personagem → `/game` funciona
- [ ] Walk → encounter → attack → mensagem no battleLog + encounter limpo
- [ ] Walk sem encontro → toast com mensagem
- [ ] Inventário lista + consumível pode ser usado
- [ ] Skills listam, podem ser aprendidas e usadas
- [ ] Status exibe todos campos corretos, +1 stat funciona (ou exibe erro graciosamente)
- [ ] `X-Action-Timestamp` presente em todos os requests
- [ ] Botões Andar e Atacar bloqueados 500ms após click
- [ ] Player morto exibe overlay com stub de ressuscitar
- [ ] CaptchaModal renderiza quando `captchaVisible === true`
- [ ] Stubs marcados com `// TODO`
