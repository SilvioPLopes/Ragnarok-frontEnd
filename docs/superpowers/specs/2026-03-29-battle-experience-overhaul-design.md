# Battle Experience Overhaul — Design Spec
**Date:** 2026-03-29
**Status:** Approved

---

## Contexto

O frontend de batalha atual é rudimentar: um card simples com apenas o botão ATACAR, sem menu de skills/itens em combate, sem botão de fuga, log de batalha em aba separada, e um bug crítico de morte onde o encontro não é limpo ao morrer. Este spec cobre o redesign completo da experiência de batalha.

---

## Decisões de Design

### 1. Layout da Tela de Batalha (MapPanel em modo encontro)

Layout estilo Pokémon com posicionamento fixo via `position: absolute` dentro de um container de altura fixa:

| Posição | Elemento |
|---|---|
| Topo-esquerda | HP box do monstro (nome + barra vermelha) |
| Topo-direita | Sprite GIF do monstro (`MonsterSprite` já existente, fallback `<Swords>`) |
| Base-esquerda | Sprite do personagem (placeholder estático por ora) |
| Base-direita | HP + SP box do personagem |

Abaixo da cena:
- **Textbox**: turno atual em destaque + botão `↑ N turnos anteriores` que expande histórico inline com scroll
- **Menu 2×2**: ATACAR · SKILL · ITEM · FUGIR (fixo, substituído por submenus conforme ação)

### 2. Submenu SKILL

Ao clicar em SKILL, o menu 2×2 é substituído por:
- Grade 2×2 de botões de skill (skills com `currentLevel > 0`)
- Skills sem SP suficiente: visíveis mas desabilitadas (opacity reduzida)
- Paginação: 4 skills por página com botões ANTERIOR / PRÓXIMO / VOLTAR
- Dots indicadores de página
- Clicar em uma skill chama `skillApi.use(playerId, aegisName, monsterId)` e retorna ao menu 2×2

### 3. Submenu ITEM

Ao clicar em ITEM, um overlay cobre toda a área de batalha (sprites + HPs):
- Lista de consumíveis (`item.type === 'CONSUMABLE'`) em botões largos
- Badge de quantidade à direita: verde normal, laranja quando `amount === 1`
- Scroll com scrollbar no tema escuro (`scrollbar-color` + webkit custom)
- Header mantém nome do monstro como referência
- VOLTAR AO COMBATE fixo no rodapé
- Clicar num item chama `inventoryApi.use(playerId, itemId)` e fecha overlay

### 4. FUGIR

Apenas frontend — sem chamada de API:
1. Chama `clearEncounter()`
2. Exibe `"Você conseguiu escapar!"` via `appendLog()`
3. Retorna ao estado de andar (textbox desaparece, botão ANDAR volta)

### 5. Morte — Bug Fix + Visual

**Bug atual:** `attackMonster` em `game-context.tsx` não chama `clearEncounter()` ao detectar morte do player.

**Correção + fluxo:**
1. Detectar `result.message.includes('FATAL')` em `attackMonster`
2. Chamar `clearEncounter()` imediatamente
3. Exibir `"⚠ GOLPE FATAL! Você foi derrotado."` na textbox (estado `dying`)
4. Após 1500ms, `refreshPlayer()` → HP = 0 → death overlay existente em `page.tsx` aparece

### 6. Vitória — Overlay Dedicada

Ao detectar `'VITÓRIA'` na mensagem:
1. `clearEncounter()`
2. Parse da string de resposta para extrair EXP, drops e level up via regex
3. Exibir overlay com: troféu 🏆, título VITÓRIA!, badge de level up (se detectado), tabela de EXP e drops
4. Botão CONTINUAR fecha overlay e volta ao estado de andar

**Parser de mensagem** (regex simples, sem depender de estrutura do backend):
- EXP: `/\+\s*(\d+)\s*EXP/i` ou similar dependendo do formato real
- Drop: `/Drop[:\s]+(.+)/i`
- Level up: `/level\s*up|subiu\s*de\s*n[íi]vel/i`
- Fallback: se nenhum padrão bater, exibe a string completa na textbox sem parse

### 7. Ajustes em `game-context.tsx`

- `attackMonster`: adicionar detecção de `'FATAL'` com `clearEncounter()` + delay de 1500ms antes de `refreshPlayer()`
- Novo estado `battlePhase: 'idle' | 'fighting' | 'dying' | 'victory'` no contexto (ou gerenciado localmente no `MapPanel`)
- `appendLog` continua funcionando normalmente para o histórico da aba LOG

### 8. O que NÃO muda

- `SkillPanel` e `BattlePanel` (aba LOG) continuam existindo — o LOG vira arquivo histórico
- `inventoryApi`, `skillApi`, `battleApi` — nenhuma chamada de API é alterada
- `MonsterSprite` — já implementado, reutilizado aqui
- `game-context.tsx` — apenas `attackMonster` é modificado

---

## Novos Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `components/game/battle-hud.tsx` | Container do layout Pokémon (cena + textbox + menu) |
| `components/game/battle-menu.tsx` | Menu 2×2 (ATACAR/SKILL/ITEM/FUGIR) + lógica de submenus |
| `components/game/battle-skill-menu.tsx` | Submenu de skills com paginação |
| `components/game/battle-item-overlay.tsx` | Overlay de consumíveis |
| `components/game/battle-victory-overlay.tsx` | Overlay de vitória com parser |

## Arquivos Modificados

| Arquivo | O que muda |
|---|---|
| `components/game/map-panel.tsx` | Remove lógica de encontro atual, usa `BattleHud` |
| `lib/game-context.tsx` | `attackMonster` detecta FATAL, delay antes de refreshPlayer |

---

## Fora de Escopo

- Sprite do personagem animada (placeholder estático por ora)
- Animações de ataque/dano
- Backend: nenhuma alteração no core
- `ItemSprite` no inventário (bloqueado por falta de `itemId` numérico no backend)
