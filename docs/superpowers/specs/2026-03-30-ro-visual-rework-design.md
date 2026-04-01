# Design Spec — RO Visual Rework + Backend Logic Cleanup

**Date:** 2026-03-30
**Status:** Approved
**Scope:** ragnarok-front only (visual) + backend contract additions (battle outcome fields)

---

## 1. Objetivo

Equalizar a estética de todos os menus e painéis do frontend com a identidade visual do Ragnarok Online clássico: painéis claros com header em azul suave, gradiente vertical sutil, cantos arredondados e layout compacto. O BattleHud atual é a referência de qualidade — o restante deve alcançá-lo em coesão visual.

Paralelamente, remover do frontend toda lógica de negócio que pertence ao backend, documentando os contratos de API necessários.

---

## 2. Paleta de Cores

| Token CSS            | Valor     | Uso                                            |
|----------------------|-----------|------------------------------------------------|
| `--ro-panel-bg`      | `#F7F7F7` | Fundo de todos os painéis                      |
| `--ro-header-light`  | `#D1E4F7` | Topo do gradiente nos headers e tab bar        |
| `--ro-header-dark`   | `#9DB2DB` | Base do gradiente nos headers e tab bar        |
| `--ro-border`        | `#9DB2DB` | Borda de todos os painéis                      |
| `--ro-selection`     | `#B5CFE9` | Itens selecionados em listas, hover            |
| `--ro-body-bg`       | `#EEF4F9` | Fundo da área de conteúdo (dentro do painel)   |
| `--ro-text`          | `#1A2A3A` | Texto principal                                |
| `--ro-text-muted`    | `#667788` | Texto secundário / labels                      |
| `--ro-text-accent`   | `#1A3060` | Valores de stats, números importantes          |
| `--ro-hp`            | `#D02020` | Barra de HP                                    |
| `--ro-sp`            | `#2050D0` | Barra de SP                                    |
| `--ro-exp`           | `#38A010` | Barra de EXP                                   |
| `--ro-zenny`         | `#7A5800` | Valor de Zenny                                 |

### Gradiente padrão (headers, tab bar, botões primários, seleções)

```css
background: linear-gradient(180deg, #D1E4F7 0%, #9DB2DB 100%);
```

Vertical: claro no topo (`#D1E4F7`), mais escuro na base (`#9DB2DB`). Cor uniforme na horizontal. Mesmo padrão aplicado em: headers de painéis, tab bar, botões primários, itens selecionados, botões `+` de stats.

---

## 3. Design System — Classes CSS Globais

Definidas em `globals.css` como `@layer components`. Substituem o `game-panel` atual e os tokens do dark theme.

### `.ro-panel`
```css
background: var(--ro-panel-bg);
border: 1px solid var(--ro-border);
border-radius: 10px;
box-shadow: 0 2px 10px rgba(80,120,180,0.13), 0 1px 2px rgba(80,120,180,0.07);
overflow: hidden;
```

### `.ro-panel-header`
```css
background: linear-gradient(180deg, var(--ro-header-light) 0%, var(--ro-header-dark) 100%);
border-bottom: 1px solid #8AA4CC;
padding: 5px 10px;
font-size: 10px;
font-weight: 600;
color: var(--ro-text);
letter-spacing: 0.3px;
```

### `.ro-btn-primary`
```css
background: linear-gradient(180deg, var(--ro-header-light) 0%, var(--ro-header-dark) 100%);
border: 1px solid var(--ro-border);
border-radius: 8px;
color: var(--ro-text);
box-shadow: 0 1px 3px rgba(100,150,210,0.18);
```

### `.ro-list-item` / `.ro-list-item.selected`
```css
/* base */
padding: 5px 8px;
border-radius: 6px;
background: rgba(157,178,219,0.12);

/* selected */
background: linear-gradient(180deg, var(--ro-header-light) 0%, var(--ro-selection) 100%);
font-weight: 600;
```

### `.ro-bar-track` / `.ro-bar-fill`
```css
/* track */
background: #E2EDF5;
border: 1px solid #C0D4E8;
border-radius: 4px;
height: 8px;

/* fill variants */
.ro-bar-hp  { background: linear-gradient(90deg, #F08080, #D02020 60%, #A01010); }
.ro-bar-sp  { background: linear-gradient(90deg, #80A8F0, #2050D0 60%, #1030A0); }
.ro-bar-exp { background: linear-gradient(90deg, #90D870, #38A010 60%, #206000); }
```

---

## 4. Layout da Tela de Jogo

### Desktop (≥1024px)
```
┌─────────────────┬────────────────────────────────────┐
│  Sidebar 186px  │  Main area (flex: 1)               │
│                 │  ┌──────────────────────────────┐  │
│  [PlayerHUD]    │  │ panel-header                 │  │
│  [Localização]  │  ├──────────────────────────────┤  │
│                 │  │ conteúdo da aba ativa        │  │
│                 │  │ (bg: --ro-body-bg)           │  │
│                 │  ├──────────────────────────────┤  │
│                 │  │ tab-bar (6 abas)             │  │
│                 │  └──────────────────────────────┘  │
└─────────────────┴────────────────────────────────────┘
```

- Sidebar: `ro-panel` com headers por seção
- Main area: `ro-panel` único com header mostrando aba ativa e tab bar embaixo
- Gap entre sidebar e main: `10px`
- Padding externo: `16px`

### Mobile (<1024px)
- Sidebar vira Sheet (comportamento atual mantido)
- Main ocupa tela inteira
- Tab bar fica fixa no rodapé

---

## 5. Componentes a Reworkar

### 5.1 `globals.css`
- Adicionar os tokens `--ro-*` na seção `:root`
- Adicionar as classes `.ro-panel`, `.ro-panel-header`, `.ro-btn-primary`, `.ro-list-item`, `.ro-bar-track`, `.ro-bar-fill` (e variantes HP/SP/EXP) em `@layer components`
- Adicionar os tokens `--ro-*` **ao lado** dos tokens shadcn existentes — não remover `--background`, `--card`, `--primary` etc., pois componentes shadcn (Button, Badge, Dialog) ainda dependem deles
- Os componentes reworkados passam a usar diretamente as classes `.ro-*` em vez de props do shadcn (ex: `className="ro-btn-primary"` em vez de `variant="default"`)
- O dark theme do BattleHud coexiste porque ele usa cores inline hardcoded (não depende de CSS variables globais)

### 5.2 `player-hud.tsx`
- Substituir `game-panel` por `ro-panel` + `ro-panel-header`
- Substituir `bg-red-500` → `ro-bar-fill ro-bar-hp`
- Substituir `bg-blue-500` → `ro-bar-fill ro-bar-sp`
- Adicionar barra de EXP (campo `baseExp`/`nextLevelExp` — se não existir no backend, omitir e documentar como gap)

### 5.3 `app/(game)/game/page.tsx`
- Sidebar desktop: aplicar `ro-panel` na estrutura
- Main area: envolver em `ro-panel` com `ro-panel-header` dinâmico (mostra nome da aba ativa)
- Tab bar: substituir `TabsList` shadcn por elemento com gradiente `ro` e abas com `.tab` / `.tab.active`
- Background da página: `--ro-body-bg` em vez do dark

### 5.4 `map-panel.tsx`
- Botão "ANDAR" → `ro-btn-primary`
- Lista de portais → `ro-list-item` com selected state
- Estrutura interna com `section-label` para "PORTAIS DISPONÍVEIS"
- Remover `game-panel` inline dos sub-blocos

### 5.5 `status-panel.tsx`
- Stats grid → `stat-row` com zebra striping (`rgba(157,178,219,0.13)`)
- HP/SP bars → `ro-bar-track` + `ro-bar-fill ro-bar-hp/sp`
- Botões `+` → gradiente `ro-header`
- Layout em 2 colunas no desktop (stats à esquerda, HP/SP à direita)

### 5.6 `skill-panel.tsx`
- Cards de skill → `ro-panel` compacto com `ro-panel-header`
- Botões "APRENDER" / "USAR" → `ro-btn-primary` / `ro-btn-ghost`
- Badge de nível → estilo `ro-selection`

### 5.7 `inventory-panel.tsx`
- Itens → `ro-list-item` com badge "EQUIPADO" em `ro-selection`
- Botões "USAR" / "EQUIPAR" → `ro-btn-primary`
- Filtro por tipo (CONSUMABLE / WEAPON / ARMOR) deve vir do backend — não adicionar lógica nova

### 5.8 `class-change-panel.tsx`
- Cards de classe disponível → `ro-list-item` com hover
- Dialog de confirmação → `ro-panel` estilizado
- Texto de bloqueio deve consumir `reason` do backend (ver seção 7.2)

### 5.9 `battle-panel.tsx`
- Log de batalha → `log-box` com entradas coloridas por tipo (dano=vermelho, exp=verde, info=azul)
- Colorização por keywords no texto da mensagem (`FATAL`/`dano` → vermelho, `EXP`/`derrotado` → verde, resto → azul) — aceitável como lógica de apresentação, não é regra de negócio

### 5.10 `app/(auth)/login/page.tsx` e `register/page.tsx`
- Card central → `ro-panel` com `ro-panel-header`
- Botão submit → `ro-btn-primary`
- Inputs → borda `--ro-border`, foco com `--ro-header-dark`
- Background da página → `#ccdae8` (azul acinzentado suave, como no mockup)

### 5.11 `app/(game)/select-character/page.tsx`
- Lista de personagens → `ro-list-item` com selected state
- Painel de detalhes → `ro-panel`
- HP/SP bars → `ro-bar-track` + variantes
- Botão "JOGAR" → `ro-btn-primary`

---

## 6. Tipografia

- **Rótulos estruturais** (labels de seção, títulos de painel): `font-size: 8-10px`, `font-weight: 600`, `color: var(--ro-text-muted)`, `letter-spacing: 0.4px` — **sem pixel font**
- **Valores de jogo** (HP/SP números, stats, zenny, nomes de personagem): `font-[family-name:var(--font-pixel-body)]` (VT323) — mantém identidade pixel art nos dados
- **Títulos importantes** (nome do personagem no header, título "RAGNAROK"): `font-[family-name:var(--font-pixel)]` (Press Start 2P)
- Não usar Press Start 2P em textos longos ou em todo label de UI — reservar para títulos e destaques

---

## 7. Lógica de Negócio a Remover do Frontend

### 7.1 Detecção de resultado de batalha via parsing de string — CRÍTICO

**Problema:** O frontend detecta vitória e morte do jogador lendo o campo `message` retornado pelo backend:

```ts
// game-context.tsx:185-186
const isFatal = result.message.includes('FATAL')
const isVictory = result.message.includes('VITÓRIA')

// battle-hud.tsx:42-45 (duplicado)
if (result.message.includes('VITÓRIA')) { ... }
else if (result.message.includes('FATAL')) { ... }
```

**Risco:** Se o backend mudar o texto da mensagem (ex: internacionalização, typo fix), o sistema de batalha quebra silenciosamente. O frontend nunca deve inferir estado de jogo a partir de texto localizado.

**Solução — contrato de API a adicionar no core:**

```java
// BattleResponseDTO — adicionar dois campos booleanos:
public record BattleResponseDTO(
    String message,
    Integer monsterHpRemaining,
    Boolean playerDied,    // ← NOVO: true quando HP do player chegou a 0
    Boolean monsterDied    // ← NOVO: true quando o monstro foi derrotado
) {}
```

**Mudança no frontend após o backend entregar os campos:**

```ts
// game-context.tsx — substituir includes() pelos campos booleanos:
const isFatal = result.playerDied === true
const isVictory = result.monsterDied === true
```

**Prioridade:** Alta. Bloqueia internacionalização futura.

---

### 7.2 Hint de classe bloqueada hardcoded — MENOR

**Problema:** `class-change-panel.tsx:133-135` decide o texto de bloqueio com base na `jobClass`:

```ts
player.jobClass === 'NOVICE'
  ? 'Atinja Job Level 10 para evoluir'
  : 'Voce ja esta na classe mais avancada'
```

**Risco:** Se surgirem novas classes ou regras de evolução, o frontend exibe a mensagem errada.

**Solução — contrato de API a adicionar no core:**

```java
// GET /api/players/{id}/class-change — quando lista vazia, incluir:
public record ClassChangeOptionsDTO(
    List<String> availableClasses,
    String blockedReason  // ← NOVO: null se há classes disponíveis, string explicativa se não
) {}
```

**Mudança no frontend:** Exibir `blockedReason` diretamente em vez do condicional hardcoded.

**Prioridade:** Baixa (não quebra nada agora, mas deve ser feito antes de adicionar novas classes).

---

### 7.3 Delete de personagem não chama API — BUG

**Problema:** `select-character/page.tsx:178-201` — `handleDeletePlayer` remove o personagem apenas do estado local React. Nenhuma chamada HTTP é feita. O personagem volta a aparecer no próximo login.

**Solução — endpoint a criar no core:**

```
DELETE /api/players/{id}
```

Deve validar ownership (o personagem pertence ao account do JWT). Retornar 204 no sucesso.

**Mudança no frontend:**

```ts
// playerApi — adicionar:
delete: (id: number) => apiFetch(`/players/${id}`, { method: 'DELETE' })

// handleDeletePlayer — chamar antes de atualizar state:
await playerApi.delete(selectedPlayer.id)
setPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id))
```

**Prioridade:** Alta. É um bug funcional visível ao usuário.

---

## 8. O que NÃO muda

- **BattleHud** (`battle-hud.tsx`): layout Pokémon, gradiente escuro inline, sprite do monstro — mantido integralmente. O dark theme do BattleHud coexiste com o light theme do resto via classes inline (não depende de CSS variables globais).
- **BattleMenu**, **BattleSkillMenu**, **BattleItemOverlay**, **BattleVictoryOverlay**: mantidos como estão.
- **game-context.tsx**: sem alterações de lógica além da substituição dos `includes()` quando o backend entregar `playerDied`/`monsterDied`.
- **lib/api.ts**, **lib/types.ts**: sem alterações estruturais — apenas adição de `playerApi.delete` e tipos dos novos campos de `BattleResult` e `ClassChangeOptions`.
- **auth-context.tsx**: sem alterações.

---

## 9. Ordem de implementação sugerida

1. Definir tokens CSS e classes base em `globals.css` — fundação de tudo
2. Aplicar em `player-hud.tsx` e `game/page.tsx` (tab bar + sidebar) — validação visual imediata
3. Aplicar nos painéis de conteúdo: `map-panel`, `status-panel`, `inventory-panel`, `skill-panel`
4. Aplicar nas telas de auth: `login/page.tsx`, `register/page.tsx`, `select-character/page.tsx`
5. Aplicar em `class-change-panel.tsx` e `battle-panel.tsx`
6. Backend: adicionar `playerDied`/`monsterDied` no `BattleResponseDTO`
7. Frontend: substituir `includes()` pelos campos booleanos
8. Backend: adicionar `DELETE /api/players/{id}`
9. Frontend: conectar delete real no `handleDeletePlayer`
10. Backend: adicionar `blockedReason` no `ClassChangeOptionsDTO`
11. Frontend: consumir `blockedReason` no `class-change-panel`
