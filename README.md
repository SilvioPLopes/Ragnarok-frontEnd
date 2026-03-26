# Ragnarok Emulator — Frontend

Interface web do **Ragnarok Simulator**, um emulador de Ragnarok Online construído do zero com stack moderna. Este repositório contém exclusivamente o frontend Next.js que se comunica com o [backend Spring Boot](../ragnarok-simulator).

---

## Visão geral

O projeto simula as mecânicas centrais do Ragnarok Online clássico:

- Criação e seleção de personagens
- Exploração de mapas com encontros aleatórios
- Sistema de batalha por turnos
- Distribuição de atributos (STR / AGI / VIT / INT / DEX / LUK)
- Sistema de skills com aprendizado e uso
- Inventário com itens consumíveis e equipamentos
- Mudança de classe (1ª → 2ª classe)
- Sistema antifraude integrado com captcha e detecção de bots

---

## Tech stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Linguagem | TypeScript 5.7 (strict mode) |
| UI | React 19 |
| Estilização | Tailwind CSS 4 |
| Componentes | [shadcn/ui](https://ui.shadcn.com/) + Radix UI |
| Notificações | [Sonner](https://sonner.emilkowal.ski/) |
| Fontes | Press Start 2P + VT323 (Google Fonts) |
| Package manager | pnpm |
| Analytics | Vercel Analytics |

---

## Pré-requisitos

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- Backend `ragnarok-simulator` rodando em `http://localhost:8080`

---

## Instalação e execução

```bash
# 1. Clone o repositório
git clone <url-do-repositório>
cd ragnarok-front

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# edite .env.local se necessário (veja seção de configuração)

# 4. Suba o servidor de desenvolvimento
pnpm dev
```

Acesse `http://localhost:3000`.

> **O backend precisa estar rodando** para que as funcionalidades do jogo funcionem. Sem o backend, o frontend inicializa normalmente mas todas as chamadas à API retornam erro de conexão.

---

## Configuração

Crie um arquivo `.env.local` na raiz com:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

| Variável | Padrão | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | URL base do backend |

---

## Estrutura do projeto

```
ragnarok-front/
├── app/
│   ├── (auth)/              # Rotas públicas (login, registro)
│   │   ├── login/
│   │   └── register/
│   ├── (game)/              # Rotas protegidas (jogo)
│   │   ├── create-character/
│   │   ├── select-character/
│   │   └── game/
│   ├── layout.tsx           # Layout raiz (AuthProvider, Toaster)
│   └── page.tsx             # Redireciona para /login
│
├── components/
│   ├── game/                # Painéis do jogo
│   │   ├── player-hud.tsx       # HUD com HP/SP/Zenny
│   │   ├── map-panel.tsx        # Mapa, andar, portais
│   │   ├── battle-panel.tsx     # Log de batalha
│   │   ├── skill-panel.tsx      # Skills (aprender/usar)
│   │   ├── inventory-panel.tsx  # Inventário
│   │   ├── status-panel.tsx     # Atributos e distribuição
│   │   └── class-change-panel.tsx
│   └── ui/                  # Componentes shadcn/ui
│
├── lib/
│   ├── api.ts               # Chamadas HTTP ao backend (namespaces por domínio)
│   ├── types.ts             # Tipos TypeScript compartilhados
│   ├── game-context.tsx     # Estado global do jogo (GameProvider)
│   ├── auth-context.tsx     # Estado de autenticação (AuthProvider)
│   └── utils.ts             # Helpers (cn, etc.)
│
└── docs/
    └── superpowers/
        ├── specs/           # Documentos de design
        └── plans/           # Planos de implementação
```

---

## Arquitetura

### Contextos globais

**`GameProvider`** (`lib/game-context.tsx`)
Gerencia todo o estado de jogo: personagem ativo, encontros, log de batalha, inventário, skills e mapa. Configurado no layout de `(game)`.

**`AuthProvider`** (`lib/auth-context.tsx`)
Gerencia autenticação do usuário. Atualmente utiliza **stub com localStorage** — o login aceita qualquer credencial sem validação backend. Será integrado ao sistema de autenticação real em versão futura.

### Camada de API

`lib/api.ts` organiza as chamadas HTTP em namespaces:

```ts
playerApi    // GET/POST /api/players
battleApi    // POST /api/battle/attack
skillApi     // GET/POST /api/players/:id/skills
inventoryApi // GET/POST /api/players/:id/inventory
mapApi       // GET/POST /api/players/:id/map
```

Todas as respostas são tipadas via `lib/types.ts`. O módulo inclui tratamento automático de respostas antifraude (`FraudResponse`).

### Sistema antifraude

O backend pode retornar um campo `fraud` em qualquer resposta. O frontend trata automaticamente os seguintes `requiredAction`:

| Ação | Comportamento |
|---|---|
| `DROP_SESSION` | Remove sessão e redireciona para login |
| `SHOW_CAPTCHA` | Exibe modal de verificação |
| `CANCEL_ACTION` | Toast de erro, ação cancelada |
| `BLOCKED` | Conta bloqueada, logout forçado |
| `FLAG_FOR_REVIEW` | Log silencioso |

---

## Fluxo de navegação

```
/login
  └─► /select-character     (após login)
        ├─► /create-character  (novo personagem)
        └─► /game              (personagem selecionado)
              ├── Aba Mapa       (andar, batalha, portais)
              ├── Aba Skills     (aprender e usar skills)
              ├── Aba Itens      (inventário)
              ├── Aba Status     (atributos + distribuição)
              └── Aba Classe     (mudança de classe)
```

---

## Scripts disponíveis

```bash
pnpm dev      # Servidor de desenvolvimento (Turbopack)
pnpm build    # Build de produção
pnpm start    # Servidor de produção
pnpm lint     # ESLint
```

---

## Estado atual

| Funcionalidade | Status |
|---|---|
| Login / Registro | Stub (localStorage) — backend pendente |
| Criação de personagem | Funcional |
| Seleção de personagem | Lista vazia — endpoint de listagem pendente |
| Mapa / Andar | Funcional |
| Batalha | Funcional |
| Skills | Funcional |
| Inventário | Funcional |
| Distribuição de atributos | Funcional |
| Mudança de classe | Stub — endpoints backend pendentes |
| Ressuscitar | Pendente (endpoint `POST /api/players/:id/resurrect`) |
| Equipar itens | Pendente (endpoint `POST /api/players/:id/inventory/:id/equip`) |

---

## Contribuindo

1. Crie uma branch a partir de `master`
2. Implemente sua feature ou correção
3. Garanta que `pnpm tsc --noEmit` passe sem erros
4. Abra um Pull Request com descrição clara

---

## Licença

Projeto privado. Todos os direitos reservados.
