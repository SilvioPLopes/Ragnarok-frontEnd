# Fix Build Errors — Stub Mínimo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todos os erros de compilação e runtime que impedem o projeto de rodar, usando stubs de localStorage para auth e stubs inline para endpoints inexistentes.

**Architecture:** 4 arquivos modificados. `lib/types.ts` recebe os tipos faltantes. `lib/auth-context.tsx` é reescrito como stub localStorage. `select-character/page.tsx` e `class-change-panel.tsx` têm imports e campos corrigidos e chamadas de API inexistentes substituídas por stubs inline.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4, sonner (toast), pnpm

**Nota:** `next.config.mjs` tem `typescript: { ignoreBuildErrors: true }` — o build não falha por erros TS, mas o app crasha em runtime. O verificador usado será `pnpm tsc --noEmit` + navegação manual nas rotas.

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `lib/types.ts` | Modificar — adicionar User, JobClass, ClassChangeRequirement, Player; narrowar jobClass |
| `lib/auth-context.tsx` | Reescrever completamente — stub localStorage |
| `app/(game)/select-character/page.tsx` | Modificar — imports, campos, stubs de API |
| `components/game/class-change-panel.tsx` | Modificar — imports, campos, stubs de API |

---

## Task 1: Adicionar tipos faltantes em `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Alterar `jobClass: string` para `jobClass: JobClass` em `PlayerResponse`**

Em `lib/types.ts`, a interface `PlayerResponse` tem `jobClass: string`. Substituir pela referência ao tipo `JobClass` que será definido abaixo. Como `JobClass` ainda não existe neste ponto do arquivo, mover a declaração de `PlayerResponse` para depois de `JobClass`, **ou** adicionar `JobClass` antes de `PlayerResponse`.

A solução mais simples: adicionar `JobClass` no topo do arquivo, antes de `PlayerResponse`.

> **ATENÇÃO:** O spec diz para adicionar todos os tipos no final do arquivo — isso está **errado** para `JobClass`. TypeScript não hoista declarações de tipo, então `JobClass` precisa obrigatoriamente aparecer antes de `PlayerResponse` que o referencia. Seguir o plano, não o spec, neste ponto.

```ts
// lib/types.ts  — adicionar ANTES de PlayerResponse

export type JobClass =
  | 'NOVICE' | 'SWORDSMAN' | 'MAGE' | 'ARCHER' | 'THIEF' | 'MERCHANT' | 'ACOLYTE'
  | 'KNIGHT' | 'WIZARD' | 'HUNTER' | 'ASSASSIN' | 'BLACKSMITH' | 'PRIEST'
```

Depois, em `PlayerResponse`, trocar o campo:

```ts
// antes
jobClass: string

// depois
jobClass: JobClass
```

- [ ] **Step 2: Adicionar User, ClassChangeRequirement e Player ao final de `lib/types.ts`**

Adicionar ao **final** do arquivo, após `FraudResponse`:

```ts
export interface User {
  id: number
  username: string
  email: string
}

export interface ClassChangeRequirement {
  targetClass: JobClass
  requiredJobLevel: number
  requiredZeny?: number
  requiredItems?: { itemId: number; quantity: number }[]
}

/** Alias para compatibilidade com imports existentes em select-character e class-change-panel */
export type Player = PlayerResponse
```

- [ ] **Step 3: Verificar que nenhum consumidor existente quebrou**

Rodar:
```bash
pnpm tsc --noEmit 2>&1 | head -40
```

Esperado: erros apenas nos 3 arquivos ainda não corrigidos (`auth-context.tsx`, `select-character/page.tsx`, `class-change-panel.tsx`). Se aparecer erro em `lib/types.ts` ou em arquivos do jogo (player-hud, status-panel, etc.), parar e investigar antes de continuar.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add User, JobClass, ClassChangeRequirement, Player types"
```

---

## Task 2: Reescrever `lib/auth-context.tsx` como stub localStorage

**Files:**
- Modify: `lib/auth-context.tsx` (reescrita completa)

- [ ] **Step 1: Reescrever o arquivo inteiro**

Substituir todo o conteúdo de `lib/auth-context.tsx` por:

```tsx
'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from './types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        setUser(JSON.parse(stored) as User)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (username: string, _password: string) => {
    const u: User = { id: 1, username, email: '' }
    localStorage.setItem('auth_user', JSON.stringify(u))
    setUser(u)
  }

  const register = async (username: string, email: string, _password: string) => {
    const u: User = { id: 1, username, email }
    localStorage.setItem('auth_user', JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 2: Verificar que erros de `auth-context.tsx` sumiram**

```bash
pnpm tsc --noEmit 2>&1 | head -40
```

Esperado: nenhum erro em `lib/auth-context.tsx`. Erros remanescentes devem ser apenas em `select-character/page.tsx` e `class-change-panel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add lib/auth-context.tsx
git commit -m "feat: stub auth-context with localStorage (no backend)"
```

---

## Task 3: Corrigir `app/(game)/select-character/page.tsx`

**Files:**
- Modify: `app/(game)/select-character/page.tsx`

Esta é a tarefa mais extensa. Seguir os passos na ordem indicada.

- [ ] **Step 1: Corrigir imports**

Localizar e remover a linha:
```ts
import { api } from '@/lib/api'
```

A linha `import type { Player, JobClass } from '@/lib/types'` permanece — os tipos agora existem.

Atualizar o destructure do `useGame()`. Localizar:
```ts
const { setPlayer } = useGame()
```
Substituir por:
```ts
const { setPlayerId } = useGame()
```

- [ ] **Step 2: Corrigir `demoPlayers`**

Localizar o array `demoPlayers: Player[]` (linhas 71–144) e substituir por versão com campos corretos:

```ts
const demoPlayers: Player[] = [
  {
    id: 1,
    name: 'DemoKnight',
    jobClass: 'SWORDSMAN',
    baseLevel: 25,
    jobLevel: 10,
    hpCurrent: 850,
    hpMax: 1200,
    spCurrent: 80,
    spMax: 150,
    str: 35,
    agi: 20,
    vit: 25,
    intelligence: 5,
    dex: 15,
    luk: 10,
    statPoints: 12,
    skillPoints: 5,
    zenny: 25000,
    mapName: 'prontera',
  },
  {
    id: 2,
    name: 'DemoMage',
    jobClass: 'MAGE',
    baseLevel: 18,
    jobLevel: 8,
    hpCurrent: 380,
    hpMax: 500,
    spCurrent: 450,
    spMax: 600,
    str: 5,
    agi: 10,
    vit: 10,
    intelligence: 40,
    dex: 25,
    luk: 15,
    statPoints: 8,
    skillPoints: 3,
    zenny: 18000,
    mapName: 'prontera',
  },
  {
    id: 3,
    name: 'DemoArcher',
    jobClass: 'ARCHER',
    baseLevel: 22,
    jobLevel: 9,
    hpCurrent: 650,
    hpMax: 800,
    spCurrent: 150,
    spMax: 200,
    str: 15,
    agi: 35,
    vit: 15,
    intelligence: 10,
    dex: 40,
    luk: 20,
    statPoints: 10,
    skillPoints: 4,
    zenny: 32000,
    mapName: 'prontera',
  },
]
```

- [ ] **Step 3: Corrigir `loadPlayers()`**

Localizar o bloco dentro de `loadPlayers` fora do demo mode (após o `if (isDemoMode)` block):

```ts
try {
  const data = await api.getPlayers()
  setPlayers(data)
  if (data.length > 0 && !selectedPlayer) {
    setSelectedPlayer(data[0])
  }
} catch (error) {
  toast.error('Erro ao carregar personagens')
  console.error(error)
} finally {
  setIsLoading(false)
}
```

Substituir por:

```ts
// Sem endpoint de listagem no backend ainda — lista começa vazia
setPlayers([])
setIsLoading(false)
```

- [ ] **Step 4: Corrigir `handlePlayClick()`**

Localizar:
```ts
setPlayer(selectedPlayer)
```
Substituir por:
```ts
setPlayerId(selectedPlayer.id)
```

- [ ] **Step 5: Corrigir `handleDeletePlayer()`**

Localizar o bloco dentro de `handleDeletePlayer` fora do demo mode:

```ts
try {
  await api.deletePlayer(selectedPlayer.id)
  toast.success('Personagem deletado')
  setSelectedPlayer(null)
  loadPlayers()
} catch (error) {
  toast.error('Erro ao deletar personagem')
  console.error(error)
} finally {
  setIsDeleting(false)
}
```

Substituir por:

```ts
try {
  setPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id))
  setSelectedPlayer(null)
  toast.success('Personagem removido')
} finally {
  setIsDeleting(false)
}
```

- [ ] **Step 6: Corrigir display — cabeçalho do personagem selecionado**

Localizar `LEVEL {selectedPlayer.level}`:
```tsx
<p className="font-[family-name:var(--font-pixel)] text-sm text-primary">
  LEVEL {selectedPlayer.level}
</p>
```
Substituir por:
```tsx
<p className="font-[family-name:var(--font-pixel)] text-sm text-primary">
  LEVEL {selectedPlayer.baseLevel}
</p>
```

Localizar `{selectedPlayer.zeny.toLocaleString()} Zeny`:
```tsx
{selectedPlayer.zeny.toLocaleString()} Zeny
```
Substituir por:
```tsx
{selectedPlayer.zenny.toLocaleString()} Zeny
```

- [ ] **Step 7: Corrigir display — lista de personagens (botão)**

Localizar (dentro do `.map((player) => ...)` da lista):
```tsx
Lv.{player.level} {player.jobClass}
```
Substituir por:
```tsx
Lv.{player.baseLevel} {player.jobClass}
```

- [ ] **Step 8: Corrigir display — HP e SP bars**

Localizar bloco HP:
```tsx
{selectedPlayer.hp}/{selectedPlayer.maxHp}
...
style={{ width: `${(selectedPlayer.hp / selectedPlayer.maxHp) * 100}%` }}
```
Substituir por:
```tsx
{selectedPlayer.hpCurrent}/{selectedPlayer.hpMax}
...
style={{ width: `${(selectedPlayer.hpCurrent / selectedPlayer.hpMax) * 100}%` }}
```

Localizar bloco MP:
```tsx
{selectedPlayer.mp}/{selectedPlayer.maxMp}
...
style={{ width: `${(selectedPlayer.mp / selectedPlayer.maxMp) * 100}%` }}
```
Substituir por:
```tsx
{selectedPlayer.spCurrent}/{selectedPlayer.spMax}
...
style={{ width: `${(selectedPlayer.spCurrent / selectedPlayer.spMax) * 100}%` }}
```

- [ ] **Step 9: Deletar bloco de EXP inteiro**

Localizar e deletar o bloco completo `{/* Experience */}` (aproximadamente linhas 381–395):

```tsx
{/* Experience */}
<div className="mb-6">
  <div className="flex justify-between mb-1">
    <span ...>Base EXP</span>
    <span ...>
      {selectedPlayer.baseExp.toLocaleString()}
    </span>
  </div>
  <div className="exp-bar h-3 w-full">
    <div
      className="exp-bar-fill h-full"
      style={{ width: '45%' }}
    />
  </div>
</div>
```

Não substituir por nada — apenas deletar.

- [ ] **Step 10: Corrigir Stats Grid**

Localizar:
```tsx
<StatBox label="INT" value={selectedPlayer.int} />
```
Substituir por:
```tsx
<StatBox label="INT" value={selectedPlayer.intelligence} />
```

Localizar o exibidor de Status Points:
```tsx
{selectedPlayer.statusPoints}
```
Substituir por:
```tsx
{selectedPlayer.statPoints}
```

- [ ] **Step 11: Verificar erros remanescentes**

```bash
pnpm tsc --noEmit 2>&1 | head -40
```

Esperado: nenhum erro em `select-character/page.tsx`. Único arquivo com erro restante deve ser `class-change-panel.tsx`.

- [ ] **Step 12: Commit**

```bash
git add "app/(game)/select-character/page.tsx"
git commit -m "fix: correct field names and stub missing API calls in select-character"
```

---

## Task 4: Corrigir `components/game/class-change-panel.tsx`

**Files:**
- Modify: `components/game/class-change-panel.tsx`

- [ ] **Step 1: Corrigir imports**

Localizar e remover:
```ts
import { api } from '@/lib/api'
```

A linha abaixo permanece — os tipos agora existem:
```ts
import type { ClassChangeRequirement, JobClass } from '@/lib/types'
```

- [ ] **Step 2: Corrigir destructure do `useGame()`**

Localizar:
```ts
const { player, setPlayer, refreshPlayer } = useGame()
```
Substituir por:
```ts
const { player, refreshPlayer } = useGame()
```

- [ ] **Step 3: Stub `loadRequirements()`**

Localizar dentro de `loadRequirements()`:
```ts
const reqs = await api.getClassChangeRequirements(player.jobClass)
setRequirements(reqs)
```
Substituir por:
```ts
setRequirements([])
// Endpoints de mudança de classe ainda não implementados no backend
```

- [ ] **Step 4: Stub `handleSelectClass()`**

Localizar dentro de `handleSelectClass()`:
```ts
const result = await api.checkClassChangeEligibility(player.id, req.targetClass)
setEligibility(result)
```
Substituir por:
```ts
setEligibility({ eligible: false, message: 'Mudança de classe em breve' })
```

- [ ] **Step 5: Stub `handleChangeClass()`**

Localizar e substituir desde `setIsChanging(true)` até o `}` que fecha o `finally`. **Importante:** `setIsChanging(true)` está na linha **anterior** ao `try` — a substituição começa nele, não no `try`:
```ts
setIsChanging(true)
try {
  const result = await api.changeClass(player.id, selectedClass.targetClass)
  if (result.success) {
    toast.success(...)
    if (result.player) {
      setPlayer(result.player)
    } else {
      refreshPlayer()
    }
    setSelectedClass(null)
    setEligibility(null)
    loadRequirements()
  } else {
    toast.error(result.message)
  }
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'Erro ao mudar de classe')
} finally {
  setIsChanging(false)
}
```
Substituir por:
```ts
toast.info('Mudança de classe em breve')
setSelectedClass(null)
setEligibility(null)
```

- [ ] **Step 6: Corrigir campos no JSX — cabeçalho da classe atual**

Localizar:
```tsx
Job Level: {player.level} | Job EXP: {player.jobExp.toLocaleString()}
```
Substituir por:
```tsx
Job Level: {player.jobLevel}
```

- [ ] **Step 7: Corrigir campos no Dialog de requisitos**

Localizar (dentro do bloco `<Dialog>`):
```tsx
{player.level >= selectedClass.requiredJobLevel ? (
```
Substituir por:
```tsx
{player.jobLevel >= selectedClass.requiredJobLevel ? (
```

Localizar (dentro do mesmo `<Dialog>`, condicional de Zeny):
```tsx
{player.zeny >= selectedClass.requiredZeny ? (
```
Substituir por:
```tsx
{player.zenny >= selectedClass.requiredZeny ? (
```

- [ ] **Step 8: Verificar que todos os erros de TS sumiram**

```bash
pnpm tsc --noEmit 2>&1
```

Esperado: saída vazia (zero erros). Se houver erros, ler e corrigir antes de continuar.

- [ ] **Step 9: Commit**

```bash
git add components/game/class-change-panel.tsx
git commit -m "fix: stub missing API calls and correct field names in class-change-panel"
```

---

## Task 5: Verificação final e run

- [ ] **Step 1: Garantir que dependências estão instaladas**

```bash
pnpm install
```

Esperado: packages já instaladas, nenhum erro.

- [ ] **Step 2: Rodar TypeScript check limpo**

```bash
pnpm tsc --noEmit 2>&1
```

Esperado: saída vazia.

- [ ] **Step 3: Subir o servidor de desenvolvimento**

```bash
pnpm dev
```

Esperado: servidor sobe na porta 3000 sem erros de compilação no terminal.

- [ ] **Step 4: Verificar rotas**

Abrir no browser (ou confirmar que não há erros no terminal ao navegar para):

1. `http://localhost:3000/` → redireciona para `/login` ✓
2. `http://localhost:3000/login` → página de login renderiza sem crash ✓
3. `http://localhost:3000/register` → página de registro renderiza sem crash ✓
4. Fazer login com qualquer username/senha → vai para `/select-character` ✓
5. `/select-character` → mostra lista vazia com botão "CRIAR PRIMEIRO" ✓
6. Clicar "CRIAR PRIMEIRO" ou "NOVO" → `/create-character` ✓
7. Criar personagem → vai para `/game` ✓
8. Abas Mapa, Skills, Itens, Status, Classe → renderizam sem crash ✓

- [ ] **Step 5: Commit final**

```bash
git add lib/types.ts lib/auth-context.tsx "app/(game)/select-character/page.tsx" components/game/class-change-panel.tsx
git commit -m "chore: verify project runs end-to-end after stub fixes"
```
