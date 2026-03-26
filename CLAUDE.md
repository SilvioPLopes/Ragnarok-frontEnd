# CLAUDE.md — ragnarok-front

> Ver também `../../CLAUDE.md` para contexto do ecossistema completo.

## O que é este projeto

Frontend Next.js do Ragnarok Simulator. Interface do jogador que consome a API do `ragnarok-core` (porta 8080).

## Portas e dependências

| Serviço | Porta | Necessário para |
|---|---|---|
| Este projeto | 3000 | — |
| `ragnarok-core` | 8080 | Todas as funcionalidades do jogo |

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript 5.7 (strict)
- Tailwind CSS 4, shadcn/ui, Radix UI
- Sonner (toasts), Lucide React (ícones)
- pnpm

## Rodar local

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm tsc --noEmit # checar tipos sem build
```

## Arquivos críticos

| Arquivo | Responsabilidade |
|---|---|
| `lib/types.ts` | Todos os tipos TypeScript do projeto. Source of truth. |
| `lib/api.ts` | Todas as chamadas HTTP ao backend, organizadas por namespace (`playerApi`, `battleApi`, etc.). Sem lógica de negócio. |
| `lib/game-context.tsx` | Estado global do jogo. `GameProvider` wrapa as rotas `(game)`. |
| `lib/auth-context.tsx` | Estado de auth. `AuthProvider` fica no root layout. **Atualmente stub localStorage.** |

## Convenções importantes

- **`jobClass`** no `PlayerResponse` é `JobClass` (union type), nunca `string`
- **`intelligence`** é o campo do frontend/API; o payload de PUT para stats usa `"int"` como chave
- **`zenny`** (com dois n) — não `zeny`
- **`statPoints`** — não `statusPoints`
- **`aegisName`** de `SkillRow` é o que vai nas URLs da API, nunca `name`
- `hpCurrent/hpMax` e `spCurrent/spMax` — não hp/maxHp/mp/maxMp

## Sistema antifraude no front

Qualquer resposta do backend pode incluir `fraud: FraudResponse`. O handler fica em `lib/api.ts` (`handleFraudResponse`). Configurado via `configureFraudHandler()` dentro do `GameProvider`.

Ações possíveis: `SHOW_CAPTCHA` → modal, `DROP_SESSION` → logout, `BLOCKED` → toast + logout, `CANCEL_ACTION` → toast de erro.

## Auth — estado atual

`lib/auth-context.tsx` usa **stub localStorage**. Login aceita qualquer credencial sem chamar backend. Quando o backend de auth estiver pronto:
1. Adicionar `authApi.login()` e `authApi.register()` em `lib/api.ts`
2. Reescrever `lib/auth-context.tsx` para chamar a API real
3. Adicionar `User` real com campos do JWT (provavelmente `id`, `username`, `email`)

## Funcionalidades com stub (pendentes de backend)

- `auth-context.tsx`: login/registro (stub localStorage)
- `select-character/page.tsx`: listagem de personagens (sem endpoint `GET /api/players`)
- `class-change-panel.tsx`: mudança de classe (sem endpoints no core)
