# Spec: Fix Build Errors — Abordagem Stub Mínimo

**Data:** 2026-03-26
**Objetivo:** Corrigir todos os erros de compilação do projeto para que `next build` e `next dev` passem, sem remover estrutura existente. Auth será implementada de verdade no futuro; por ora usa localStorage como stub.

---

## Contexto

O projeto possui 4 arquivos que precisam de mudança para compilar:

1. `lib/types.ts` — faltam tipos usados por outros arquivos
2. `lib/auth-context.tsx` — importa `{ api }` e `{ User }` que não existem
3. `app/(game)/select-character/page.tsx` — importa tipos inexistentes, usa campos de API errados, chama métodos que não existem
4. `components/game/class-change-panel.tsx` — importa tipos inexistentes, usa campos de API errados, chama métodos que não existem

Os demais 14 arquivos TS/TSX estão corretos e **não serão tocados**.

---

## Escopo — fora do escopo

- Implementar autenticação real com backend
- Implementar endpoint de listagem de personagens
- Implementar endpoint de deleção de personagem
- Implementar endpoints de mudança de classe
- Qualquer refactor além do necessário para compilar e rodar

---

## Arquivo 1: `lib/types.ts`

Adicionar ao **final** do arquivo (após `FraudResponse`):

```ts
export interface User {
  id: number
  username: string
  email: string
}

export type JobClass =
  | 'NOVICE' | 'SWORDSMAN' | 'MAGE' | 'ARCHER' | 'THIEF' | 'MERCHANT' | 'ACOLYTE'
  | 'KNIGHT' | 'WIZARD' | 'HUNTER' | 'ASSASSIN' | 'BLACKSMITH' | 'PRIEST'

export interface ClassChangeRequirement {
  targetClass: JobClass
  requiredJobLevel: number
  requiredZeny?: number
  requiredItems?: { itemId: number; quantity: number }[]
}

/** Alias para manter compatibilidade com imports existentes */
export type Player = PlayerResponse
```

Além disso, alterar o campo `jobClass` em `PlayerResponse` de `string` para `JobClass`:

```ts
// antes
jobClass: string

// depois
jobClass: JobClass
```

> **Motivo:** `select-character/page.tsx` e `class-change-panel.tsx` usam `player.jobClass` como chave em `Record<JobClass, ...>`. Se `jobClass` for `string`, TypeScript rejeita. Trocar para `JobClass` resolve sem cast em nenhum consumidor.

---

## Arquivo 2: `lib/auth-context.tsx`

Reescrever completamente como stub com localStorage. A interface pública (`AuthContextType`) permanece **idêntica** ao arquivo atual — `login`, `register`, `logout`, `user`, `isLoading`, `isAuthenticated`.

### Comportamento do stub

- `checkAuth()` (chamado no `useEffect` de montagem):
  - Lê `localStorage.getItem('auth_user')`
  - Se existir, faz `JSON.parse` e seta o estado com o objeto `User`
  - Seta `isLoading(false)` no `finally`

- `login(username: string, password: string): Promise<void>`:
  - Função `async` com corpo síncrono (mantém a assinatura `Promise<void>` do contrato)
  - Cria `User` fake: `{ id: 1, username, email: '' }`
  - Salva em `localStorage.setItem('auth_user', JSON.stringify(user))`
  - Seta estado com `setUser(user)`

- `register(username: string, email: string, password: string): Promise<void>`:
  - Função `async` com corpo síncrono
  - Cria `User` fake: `{ id: 1, username, email }`
  - Salva em `localStorage.setItem('auth_user', JSON.stringify(user))`
  - Seta estado com `setUser(user)`

- `logout()`:
  - `localStorage.removeItem('auth_user')`
  - `setUser(null)`

### O que NÃO fazer

- Não importar `api` de nenhum lugar
- Não fazer nenhuma chamada de rede
- Não alterar `AuthContextType` nem `useAuth()`

---

## Arquivo 3: `app/(game)/select-character/page.tsx`

### Imports

Remover:
```ts
import { api } from '@/lib/api'  // remover — não existe default export
```

Alterar:
```ts
// antes
import type { Player, JobClass } from '@/lib/types'

// depois
import type { Player, JobClass } from '@/lib/types'  // permanece igual — agora existem
```

Manter todos os outros imports sem alteração.

### Lógica — `loadPlayers()`

Substituir o bloco fora do demo mode:

```ts
// REMOVER:
const data = await api.getPlayers()
setPlayers(data)
if (data.length > 0 && !selectedPlayer) {
  setSelectedPlayer(data[0])
}

// SUBSTITUIR POR:
setPlayers([])
// UI já exibe "Nenhum personagem encontrado" quando lista vazia
```

### Lógica — `handleDeletePlayer()`

Substituir o bloco fora do demo mode:

```ts
// REMOVER:
await api.deletePlayer(selectedPlayer.id)
toast.success('Personagem deletado')
setSelectedPlayer(null)
loadPlayers()

// SUBSTITUIR POR:
setPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id))
setSelectedPlayer(null)
toast.success('Personagem removido')
// Não esquecer: setIsDeleting(false) fica no finally que já existe
```

> O bloco `finally { setIsDeleting(false) }` já existe no código original — mantê-lo.

### Lógica — `handlePlayClick()`

```ts
// REMOVER:
setPlayer(selectedPlayer)

// SUBSTITUIR POR:
setPlayerId(selectedPlayer.id)
```

Atualizar o destructure do `useGame()`:
```ts
// antes
const { setPlayer } = useGame()

// depois
const { setPlayerId } = useGame()
```

### Campos — `demoPlayers` (array de objetos)

Corrigir **todos** os campos para corresponder a `PlayerResponse`. Campos a renomear/remover:

| Campo atual | Ação |
|---|---|
| `level` | renomear para `baseLevel` |
| `hp` | renomear para `hpCurrent` |
| `maxHp` | renomear para `hpMax` |
| `mp` | renomear para `spCurrent` |
| `maxMp` | renomear para `spMax` |
| `int` | renomear para `intelligence` |
| `statusPoints` | renomear para `statPoints` |
| `zeny` | renomear para `zenny` |
| `baseExp` | remover — não existe em `PlayerResponse` |
| `jobExp` | remover — não existe em `PlayerResponse` |
| `currentMapId` | remover — não existe em `PlayerResponse` |
| `posX` | remover — não existe em `PlayerResponse` |
| `posY` | remover — não existe em `PlayerResponse` |

Adicionar campos obrigatórios que faltam nos objetos demo:
- `jobLevel: number` (ex: `10`)
- `skillPoints: number`
- `mapName: string` (ex: `'prontera'`)

### Display — lista de personagens (botão na lista)

Linha com `Lv.{player.level}` — **duas ocorrências**: no botão da lista E no cabeçalho do detalhe. Corrigir ambas:

```tsx
// antes (duas vezes no arquivo)
Lv.{player.level}

// depois
Lv.{player.baseLevel}
```

### Display — HP e SP bars

```tsx
// antes
{selectedPlayer.hp}/{selectedPlayer.maxHp}
style={{ width: `${(selectedPlayer.hp / selectedPlayer.maxHp) * 100}%` }}

// depois
{selectedPlayer.hpCurrent}/{selectedPlayer.hpMax}
style={{ width: `${(selectedPlayer.hpCurrent / selectedPlayer.hpMax) * 100}%` }}

// antes
{selectedPlayer.mp}/{selectedPlayer.maxMp}
style={{ width: `${(selectedPlayer.mp / selectedPlayer.maxMp) * 100}%` }}

// depois
{selectedPlayer.spCurrent}/{selectedPlayer.spMax}
style={{ width: `${(selectedPlayer.spCurrent / selectedPlayer.spMax) * 100}%` }}
```

### Display — bloco de EXP (linhas 381–395)

**Deletar o bloco inteiro.** Não substituir. O bloco começa em `{/* Experience */}` e termina no `</div>` que fecha o `mb-6`. `baseExp` não existe em `PlayerResponse` e não há campo equivalente na API atual.

### Display — Stats Grid (StatBox)

```tsx
// antes
<StatBox label="INT" value={selectedPlayer.int} />

// depois
<StatBox label="INT" value={selectedPlayer.intelligence} />
```

> Apenas o `value` muda. O `label="INT"` permanece igual.

### Display — Zenny

```tsx
// antes
{selectedPlayer.zeny.toLocaleString()} Zeny

// depois
{selectedPlayer.zenny.toLocaleString()} Zeny
```

### Display — Status Points / Skill Points

```tsx
// antes
{selectedPlayer.statusPoints}

// depois
{selectedPlayer.statPoints}
```

---

## Arquivo 4: `components/game/class-change-panel.tsx`

### Imports

```ts
// REMOVER:
import { api } from '@/lib/api'

// MANTER (agora funciona — tipos existem após lib/types.ts ser atualizado):
import type { ClassChangeRequirement, JobClass } from '@/lib/types'
```

### Destructure do `useGame()`

```ts
// antes
const { player, setPlayer, refreshPlayer } = useGame()

// depois
const { player, refreshPlayer } = useGame()
```

> Remover `setPlayer` do destructure — não existe em `GameContextType`.

### Lógica — `loadRequirements()`

```ts
// REMOVER:
const reqs = await api.getClassChangeRequirements(player.jobClass)
setRequirements(reqs)

// SUBSTITUIR POR:
setRequirements([])
// UI já exibe "Nenhuma evolução disponível" quando lista vazia
```

### Lógica — `handleSelectClass()`

```ts
// REMOVER:
const result = await api.checkClassChangeEligibility(player.id, req.targetClass)
setEligibility(result)

// SUBSTITUIR POR:
setEligibility({ eligible: false, message: 'Mudança de classe em breve' })
```

### Lógica — `handleChangeClass()`

```ts
// REMOVER todo o bloco try/catch e substituir por:
toast.info('Mudança de classe em breve')
setSelectedClass(null)
setEligibility(null)
```

### Campos — cabeçalho da classe atual (dentro do return JSX)

```tsx
// antes
Job Level: {player.level} | Job EXP: {player.jobExp.toLocaleString()}

// depois
Job Level: {player.jobLevel}
```

> Remover `| Job EXP: ...` inteiramente — `jobExp` não existe em `PlayerResponse`.

### Campos — Dialog de requisitos

```tsx
// antes
{player.level >= selectedClass.requiredJobLevel ? ...}

// depois
{player.jobLevel >= selectedClass.requiredJobLevel ? ...}

// antes
{player.zeny >= selectedClass.requiredZeny ? ...}

// depois
{player.zenny >= selectedClass.requiredZeny ? ...}
```

> Atenção: `player.zeny` está dentro do bloco `<Dialog>`, não no cabeçalho — verificar que ambas as ocorrências sejam corrigidas.

### `setPlayer` nas chamadas de resultado

```ts
// REMOVER:
if (result.player) {
  setPlayer(result.player)
} else {
  refreshPlayer()
}

// O bloco handleChangeClass inteiro é substituído pelo stub acima — linha não existe mais
```

---

## Resultado esperado

Após as correções:
- `next build` passa sem erros de TypeScript
- `next dev` sobe na porta padrão
- Fluxo funcional: `/login` → `/select-character` → `/game` (com `playerId` válido)
- `/create-character` cria personagem real via `playerApi.create()`
- Abas do jogo (Mapa, Skills, Itens, Status, Classe) funcionam
- Login/Register usam stub localStorage — sem backend de auth
- Class Change mostra "Mudança de classe em breve"
- Select Character mostra lista vazia com botão "Criar Primeiro" (demo players ainda funcionam se `demo_mode` ativo)

---

## Arquivos que NÃO mudam

- `lib/api.ts`
- `lib/game-context.tsx`
- `lib/utils.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/(auth)/layout.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(game)/layout.tsx`
- `app/(game)/game/page.tsx`
- `app/(game)/create-character/page.tsx`
- `components/game/player-hud.tsx`
- `components/game/map-panel.tsx`
- `components/game/battle-panel.tsx`
- `components/game/status-panel.tsx`
- `components/game/skill-panel.tsx`
- `components/game/inventory-panel.tsx`
- `components/ui/captcha-modal.tsx`
