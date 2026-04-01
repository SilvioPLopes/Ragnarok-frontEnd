# RO Visual Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o dark theme genérico atual por um light theme fiel à estética do Ragnarok Online (painéis `#F7F7F7`, headers com gradiente azul vertical `#D1E4F7→#9DB2DB`, cantos arredondados, layout compacto), equalizando visualmente todos os menus com o BattleHud já existente; e remover do frontend as três peças de lógica de negócio que pertencem ao backend.

**Architecture:** Toda a paleta e os componentes CSS base ficam em `globals.css` como custom properties `--ro-*` e classes `@layer components`. Cada componente de jogo é atualizado para usar essas classes diretamente (sem depender de variants shadcn). BattleHud e seus filhos não são tocados. Lógica de negócio removida do front é documentada com comentários `// ⚠ BACKEND NEEDED` para sinalizar o trabalho pendente no core.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4, CSS custom properties

---

## Arquivos Modificados

| Arquivo | O que muda |
|---|---|
| `app/globals.css` | Adiciona tokens `--ro-*` e classes `.ro-*` |
| `app/layout.tsx` | Background da `<body>` |
| `app/(game)/game/page.tsx` | Layout, sidebar, tab bar customizada |
| `components/game/player-hud.tsx` | Painéis + barras HP/SP |
| `components/game/map-panel.tsx` | Botão andar + lista portais |
| `components/game/status-panel.tsx` | Stats grid + barras |
| `components/game/skill-panel.tsx` | Cards de skill + botões |
| `components/game/inventory-panel.tsx` | Lista de itens + botões |
| `components/game/battle-panel.tsx` | Log colorido por tipo |
| `components/game/class-change-panel.tsx` | Lista de classes + sinal backend |
| `components/game/battle-hud.tsx` | Apenas: adiciona bg escuro no wrapper |
| `app/(auth)/login/page.tsx` | ro-panel + ro-btn |
| `app/(auth)/register/page.tsx` | ro-panel + ro-btn |
| `app/(game)/select-character/page.tsx` | ro-panel + fix delete bug |
| `lib/types.ts` | Adiciona campos opcionais `playerDied?`, `monsterDied?` em `BattleResult` |
| `lib/api.ts` | Adiciona `playerApi.delete` |
| `lib/game-context.tsx` | Usa `playerDied`/`monsterDied` com fallback; sinal backend |

---

## Task 1: Tokens CSS e classes base em `globals.css`

**Arquivo:** `app/globals.css`

- [ ] **Adicionar tokens `--ro-*` no bloco `:root` existente**

Abrir `app/globals.css`. Logo após a linha `--radius: 0.25rem;`, adicionar:

```css
  /* ── Ragnarok Online light theme tokens ── */
  --ro-panel-bg:      #F7F7F7;
  --ro-header-light:  #D1E4F7;
  --ro-header-dark:   #9DB2DB;
  --ro-border:        #9DB2DB;
  --ro-selection:     #B5CFE9;
  --ro-body-bg:       #EEF4F9;
  --ro-page-bg:       #CCDAE8;
  --ro-text:          #1A2A3A;
  --ro-text-muted:    #667788;
  --ro-text-accent:   #1A3060;
  --ro-zenny:         #7A5800;
```

- [ ] **Adicionar classes `.ro-*` no bloco `@layer components` existente**

Ao final do bloco `@layer components { ... }` (depois das classes `.battle-log-info` existentes), adicionar:

```css
  /* ── RO Panel ── */
  .ro-panel {
    background: var(--ro-panel-bg);
    border: 1px solid var(--ro-border);
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(80,120,180,0.13), 0 1px 2px rgba(80,120,180,0.07);
    overflow: hidden;
  }

  .ro-panel-header {
    background: linear-gradient(180deg, var(--ro-header-light) 0%, var(--ro-header-dark) 100%);
    border-bottom: 1px solid #8AA4CC;
    padding: 5px 10px;
    font-size: 10px;
    font-weight: 600;
    color: var(--ro-text);
    letter-spacing: 0.3px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* ── RO Buttons ── */
  .ro-btn-primary {
    background: linear-gradient(180deg, var(--ro-header-light) 0%, var(--ro-header-dark) 100%);
    border: 1px solid var(--ro-border);
    border-radius: 8px;
    color: var(--ro-text);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(100,150,210,0.18);
    cursor: pointer;
  }
  .ro-btn-primary:hover {
    background: linear-gradient(180deg, #dceefa 0%, #8aaac8 100%);
  }
  .ro-btn-primary:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .ro-btn-ghost {
    background: var(--ro-panel-bg);
    border: 1px solid var(--ro-border);
    border-radius: 8px;
    color: var(--ro-text-muted);
    font-weight: 600;
    cursor: pointer;
  }
  .ro-btn-ghost:hover {
    background: rgba(157,178,219,0.15);
  }
  .ro-btn-ghost:disabled {
    opacity: 0.55;
    cursor: default;
  }

  /* ── RO List items ── */
  .ro-list-item {
    padding: 5px 8px;
    border-radius: 6px;
    margin-bottom: 2px;
    cursor: default;
    color: var(--ro-text);
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    background: rgba(157,178,219,0.12);
    transition: background 0.1s;
  }
  .ro-list-item:hover {
    background: rgba(157,178,219,0.22);
  }
  .ro-list-item.selected {
    background: linear-gradient(180deg, var(--ro-header-light) 0%, var(--ro-selection) 100%);
    color: #0A1A30;
    font-weight: 600;
  }

  /* ── RO Stat bars ── */
  .ro-bar-track {
    background: #E2EDF5;
    border: 1px solid #C0D4E8;
    border-radius: 4px;
    overflow: hidden;
  }
  .ro-bar-fill {
    height: 100%;
    border-radius: 4px;
  }
  .ro-bar-hp  { background: linear-gradient(90deg, #F08080, #D02020 60%, #A01010); }
  .ro-bar-sp  { background: linear-gradient(90deg, #80A8F0, #2050D0 60%, #1030A0); }
  .ro-bar-exp { background: linear-gradient(90deg, #90D870, #38A010 60%, #206000); }

  /* ── RO Tab bar ── */
  .ro-tab-bar {
    display: flex;
    background: linear-gradient(180deg, var(--ro-header-light) 0%, var(--ro-header-dark) 100%);
    border-top: 1px solid #8AA4CC;
    padding: 4px 5px;
    gap: 3px;
    flex-shrink: 0;
  }
  .ro-tab {
    flex: 1;
    padding: 5px 3px;
    text-align: center;
    font-size: 8px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    color: #1A3A5A;
    letter-spacing: 0.2px;
    border: none;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .ro-tab.active {
    background: var(--ro-panel-bg);
    color: #0A2040;
    box-shadow: 0 1px 4px rgba(80,130,200,0.18);
  }

  /* ── RO Section label ── */
  .ro-section-label {
    font-size: 8px;
    font-weight: 600;
    color: #4A7A9A;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  /* ── RO Stat row (zebra) ── */
  .ro-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 6px;
    font-size: 10px;
    border-radius: 5px;
  }
  .ro-stat-row:nth-child(even) { background: rgba(157,178,219,0.13); }

  /* ── RO Badge ── */
  .ro-badge {
    display: inline-block;
    font-size: 8px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(157,178,219,0.25);
    color: #3A5A7A;
    border: 1px solid #B0C8E0;
  }

  /* ── RO Log box ── */
  .ro-log-box {
    background: #fff;
    border: 1px solid #C8DCEA;
    border-radius: 7px;
    padding: 6px 8px;
  }
  .ro-log-dmg  { color: #B02020; }
  .ro-log-exp  { color: #207020; }
  .ro-log-info { color: #205090; }
```

- [ ] **Verificar tipo: `npx tsc --noEmit`**

Rodar no terminal do projeto (`C:/Users/silve/IdeaProjects/ragnarok-simulator/ragnarok-front`):
```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Commit**
```bash
git add app/globals.css
git commit -m "feat(theme): add RO light theme tokens and .ro-* CSS classes"
```

---

## Task 2: Background global e layout

**Arquivos:** `app/layout.tsx`, `app/(game)/game/page.tsx`

- [ ] **Mudar background da `<body>` em `layout.tsx`**

Em `app/layout.tsx`, linha 56, alterar a className do `<body>`:

```tsx
// DE:
<body className={`${pressStart2P.variable} ${vt323.variable} font-sans antialiased min-h-screen`}>

// PARA:
<body className={`${pressStart2P.variable} ${vt323.variable} font-sans antialiased min-h-screen`} style={{ background: 'var(--ro-page-bg)' }}>
```

- [ ] **Reworkar layout da tela de jogo em `game/page.tsx`**

Substituir o conteúdo completo de `app/(game)/game/page.tsx` por:

```tsx
// app/(game)/game/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import { PlayerHUD } from '@/components/game/player-hud'
import { MapPanel } from '@/components/game/map-panel'
import { BattlePanel } from '@/components/game/battle-panel'
import { SkillPanel } from '@/components/game/skill-panel'
import { InventoryPanel } from '@/components/game/inventory-panel'
import { StatusPanel } from '@/components/game/status-panel'
import { ClassChangePanel } from '@/components/game/class-change-panel'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Map, Sparkles, Backpack, User, ArrowUpCircle, Menu, Skull, ScrollText } from 'lucide-react'
import { toast } from 'sonner'

type TabValue = 'map' | 'skills' | 'inventory' | 'status' | 'class' | 'log'

const TABS: { value: TabValue; label: string; icon: React.ReactNode }[] = [
  { value: 'map',       label: 'MAPA',   icon: <Map className="w-4 h-4" /> },
  { value: 'skills',    label: 'SKILLS', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'inventory', label: 'ITENS',  icon: <Backpack className="w-4 h-4" /> },
  { value: 'status',    label: 'STATUS', icon: <User className="w-4 h-4" /> },
  { value: 'class',     label: 'CLASSE', icon: <ArrowUpCircle className="w-4 h-4" /> },
  { value: 'log',       label: 'LOG',    icon: <ScrollText className="w-4 h-4" /> },
]

export default function GamePage() {
  const router = useRouter()
  const { player, playerId, refreshPlayer, refreshInventory, refreshSkills, refreshMapInfo } = useGame()
  const [activeTab, setActiveTab] = useState<TabValue>('map')
  const [isResurrecting, setIsResurrecting] = useState(false)

  useEffect(() => {
    if (!playerId) { router.push('/'); return }
    refreshInventory()
    refreshSkills()
  }, [playerId, router, refreshInventory, refreshSkills])

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ro-page-bg)' }}>
        <p className="font-[family-name:var(--font-pixel-body)] text-xl" style={{ color: 'var(--ro-text-muted)' }}>
          Carregando...
        </p>
      </div>
    )
  }

  if (player && player.hpCurrent === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--ro-page-bg)' }}>
        <Skull className="w-16 h-16" style={{ color: '#D02020' }} />
        <h2 className="font-[family-name:var(--font-pixel)] text-2xl" style={{ color: '#D02020' }}>
          VOCÊ MORREU
        </h2>
        <button
          className="ro-btn-primary px-8 py-3 font-[family-name:var(--font-pixel)] text-sm"
          disabled={isResurrecting}
          onClick={async () => {
            if (!playerId) return
            setIsResurrecting(true)
            try {
              await playerApi.resurrect(playerId)
              await refreshPlayer()
              await refreshMapInfo()
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Erro ao ressuscitar')
            } finally {
              setIsResurrecting(false)
            }
          }}
        >
          {isResurrecting ? 'RESSUSCITANDO...' : 'RESSUSCITAR'}
        </button>
      </div>
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'map':       return <MapPanel />
      case 'skills':    return <SkillPanel />
      case 'inventory': return <InventoryPanel />
      case 'status':    return <StatusPanel />
      case 'class':     return <ClassChangePanel />
      case 'log':       return <BattlePanel />
    }
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--ro-page-bg)' }}>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--ro-border)' }}>
        <h1 className="font-[family-name:var(--font-pixel)] text-sm" style={{ color: 'var(--ro-text-accent)' }}>RAGNAROK</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]" style={{ background: 'var(--ro-page-bg)' }}>
            <div className="space-y-3 py-4">
              <PlayerHUD />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-2.5 p-0 lg:p-4">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[186px] gap-2 flex-shrink-0">
          <div className="font-[family-name:var(--font-pixel)] text-sm mb-1" style={{ color: 'var(--ro-text-accent)' }}>
            RAGNAROK
          </div>
          <PlayerHUD />
        </aside>

        {/* Main panel */}
        <div className="ro-panel flex-1 flex flex-col min-h-0" style={{ borderRadius: '10px' }}>
          <div className="ro-panel-header">
            {TABS.find(t => t.value === activeTab)?.icon}
            <span>{TABS.find(t => t.value === activeTab)?.label}</span>
          </div>

          {/* Content area */}
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: 'var(--ro-body-bg)' }}>
            {renderTab()}
          </div>

          {/* Tab bar */}
          <div className="ro-tab-bar" style={{ borderRadius: '0 0 10px 10px' }}>
            {TABS.map(tab => (
              <button
                key={tab.value}
                className={`ro-tab ${activeTab === tab.value ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.icon}
                <span className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '7px' }}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Abrir `http://localhost:3000/game` no browser — confirmar layout com sidebar + painel central + tab bar azul no rodapé**

- [ ] **Commit**
```bash
git add app/layout.tsx app/(game)/game/page.tsx
git commit -m "feat(theme): apply RO light layout to game page and body background"
```

---

## Task 3: `player-hud.tsx`

**Arquivo:** `components/game/player-hud.tsx`

- [ ] **Substituir conteúdo completo**

```tsx
// components/game/player-hud.tsx
'use client'

import { useGame } from '@/lib/game-context'

function RoBar({ current, max, variant }: { current: number; max: number; variant: 'hp' | 'sp' | 'exp' }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="ro-bar-track w-full" style={{ height: '8px' }}>
      <div className={`ro-bar-fill ro-bar-${variant}`} style={{ width: `${pct}%`, height: '100%' }} />
    </div>
  )
}

export function PlayerHUD() {
  const { player } = useGame()

  if (!player) {
    return (
      <div className="ro-panel">
        <div className="ro-panel-header">⚔ Jogador</div>
        <div style={{ padding: '10px', fontSize: '10px', color: 'var(--ro-text-muted)' }}>Carregando...</div>
      </div>
    )
  }

  return (
    <div className="ro-panel">
      <div className="ro-panel-header">
        ⚔ {player.name}
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '8px', color: 'var(--ro-text-muted)', marginBottom: '6px' }}>
          {player.jobClass} · Base {player.baseLevel} · Job {player.jobLevel}
        </div>

        {/* HP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, width: '18px', textAlign: 'right', color: '#B02020' }}>HP</span>
          <RoBar current={player.hpCurrent} max={player.hpMax} variant="hp" />
          <span style={{ fontSize: '8px', color: 'var(--ro-text-muted)', minWidth: '56px', textAlign: 'right' }}>
            {player.hpCurrent}/{player.hpMax}
          </span>
        </div>

        {/* SP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, width: '18px', textAlign: 'right', color: '#2050D0' }}>SP</span>
          <RoBar current={player.spCurrent} max={player.spMax} variant="sp" />
          <span style={{ fontSize: '8px', color: 'var(--ro-text-muted)', minWidth: '56px', textAlign: 'right' }}>
            {player.spCurrent}/{player.spMax}
          </span>
        </div>

        {/* Zenny */}
        <div style={{ marginTop: '6px', paddingTop: '5px', borderTop: '1px solid #D4E4F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '8px', color: 'var(--ro-text-muted)' }}>Zenny</span>
          <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ro-zenny)' }}>
            {player.zenny.toLocaleString()} z
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Verificar no browser: sidebar mostra painel com gradiente azul no header, barras HP vermelho / SP azul**

- [ ] **Commit**
```bash
git add components/game/player-hud.tsx
git commit -m "feat(theme): rework PlayerHUD with RO light theme"
```

---

## Task 4: `map-panel.tsx`

**Arquivo:** `components/game/map-panel.tsx`

- [ ] **Substituir conteúdo completo**

```tsx
// components/game/map-panel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useGame } from '@/lib/game-context'
import { Footprints } from 'lucide-react'
import { BattleHud } from '@/components/game/battle-hud'
import { MapSprite } from '@/components/game/map-sprite'

export function MapPanel() {
  const { playerId, mapInfo, refreshMapInfo, currentEncounter, walkMap, travelTo, isLoading } = useGame()
  const walkThrottle = useRef(false)

  useEffect(() => {
    if (playerId && !mapInfo) refreshMapInfo()
  }, [playerId, mapInfo, refreshMapInfo])

  const handleWalk = () => {
    if (walkThrottle.current || isLoading) return
    walkThrottle.current = true
    walkMap().finally(() => { setTimeout(() => { walkThrottle.current = false }, 500) })
  }

  if (currentEncounter) return <BattleHud />

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '10px', overflowY: 'auto' }}>

      {/* Map image */}
      {mapInfo?.currentMap && (
        <div className="ro-panel" style={{ overflow: 'hidden' }}>
          <MapSprite mapName={mapInfo.currentMap} className="w-full object-contain" style={{ display: 'block', maxHeight: '120px' }} />
          <div style={{ padding: '6px 10px' }}>
            <div className="ro-section-label">Localização Atual</div>
            <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '16px', color: 'var(--ro-text-accent)', fontWeight: 600 }}>
              {mapInfo.currentMap}
            </div>
          </div>
        </div>
      )}

      {/* Walk button */}
      <button
        className="ro-btn-primary font-[family-name:var(--font-pixel)]"
        style={{ width: '100%', padding: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onClick={handleWalk}
        disabled={isLoading}
      >
        <Footprints style={{ width: '18px', height: '18px' }} />
        {isLoading ? 'ANDANDO...' : 'ANDAR'}
      </button>

      {/* Portals */}
      {mapInfo && mapInfo.availablePortals?.length > 0 && (
        <div>
          <div className="ro-section-label">Portais Disponíveis</div>
          {mapInfo.availablePortals.map((portal) => (
            <div
              key={portal}
              className="ro-list-item"
              style={{ cursor: isLoading ? 'default' : 'pointer', fontSize: '11px' }}
              onClick={() => { if (!isLoading) travelTo(portal) }}
            >
              <span>→</span>
              <span className="font-[family-name:var(--font-pixel-body)]">{portal}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Verificar no browser: aba Mapa mostra botão azul "ANDAR" e lista de portais com hover azul**

- [ ] **Commit**
```bash
git add components/game/map-panel.tsx
git commit -m "feat(theme): rework MapPanel with RO light theme"
```

---

## Task 5: `status-panel.tsx`

**Arquivo:** `components/game/status-panel.tsx`

- [ ] **Substituir conteúdo completo**

```tsx
// components/game/status-panel.tsx
'use client'

import { useState } from 'react'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import { toast } from 'sonner'

type StatKey = 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk'

const STATS: { label: string; field: keyof import('@/lib/types').PlayerResponse; apiKey: StatKey }[] = [
  { label: 'STR', field: 'str',          apiKey: 'str' },
  { label: 'AGI', field: 'agi',          apiKey: 'agi' },
  { label: 'VIT', field: 'vit',          apiKey: 'vit' },
  { label: 'INT', field: 'intelligence', apiKey: 'int' },
  { label: 'DEX', field: 'dex',          apiKey: 'dex' },
  { label: 'LUK', field: 'luk',          apiKey: 'luk' },
]

function RoBar({ current, max, variant }: { current: number; max: number; variant: 'hp' | 'sp' }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="ro-bar-track w-full" style={{ height: '8px' }}>
      <div className={`ro-bar-fill ro-bar-${variant}`} style={{ width: `${pct}%`, height: '100%' }} />
    </div>
  )
}

export function StatusPanel() {
  const { player, playerId, refreshPlayer } = useGame()
  const [loading, setLoading] = useState<StatKey | null>(null)

  const handleDistribute = async (apiKey: StatKey) => {
    if (!playerId || !player || player.statPoints <= 0 || loading) return
    setLoading(apiKey)
    try {
      await playerApi.distributeStats(playerId, { [apiKey]: 1 })
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao distribuir stat')
    } finally {
      setLoading(null)
    }
  }

  if (!player) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--ro-text-muted)', fontSize: '12px' }}>Carregando...</span>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '10px', overflowY: 'auto' }}>

      {/* Identity */}
      <div className="ro-panel">
        <div className="ro-panel-header">
          <span className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '10px' }}>
            {player.name}
          </span>
        </div>
        <div style={{ padding: '8px 10px' }}>
          <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text-muted)' }}>
            {player.jobClass}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--ro-text)' }}>Base Lv {player.baseLevel}</span>
            <span style={{ fontSize: '10px', color: 'var(--ro-text)' }}>Job Lv {player.jobLevel}</span>
            <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '12px', color: 'var(--ro-zenny)', fontWeight: 700 }}>
              {player.zenny.toLocaleString()} z
            </span>
          </div>
        </div>
      </div>

      {/* HP / SP */}
      <div className="ro-panel">
        <div className="ro-panel-header">Vida e Mana</div>
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#B02020' }}>HP</span>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '12px', color: 'var(--ro-text-muted)' }}>
                {player.hpCurrent} / {player.hpMax}
              </span>
            </div>
            <RoBar current={player.hpCurrent} max={player.hpMax} variant="hp" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#2050D0' }}>SP</span>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '12px', color: 'var(--ro-text-muted)' }}>
                {player.spCurrent} / {player.spMax}
              </span>
            </div>
            <RoBar current={player.spCurrent} max={player.spMax} variant="sp" />
          </div>
        </div>
      </div>

      {/* Stat points available */}
      {player.statPoints > 0 && (
        <div style={{ background: 'rgba(157,178,219,0.15)', border: '1px solid var(--ro-border)', borderRadius: '8px', padding: '6px 10px', textAlign: 'center' }}>
          <span className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '9px', color: 'var(--ro-text-accent)' }}>
            {player.statPoints} ponto{player.statPoints !== 1 ? 's' : ''} disponível{player.statPoints !== 1 ? 'is' : ''}
          </span>
        </div>
      )}

      {/* Stats grid */}
      <div className="ro-panel">
        <div className="ro-panel-header">Atributos</div>
        <div style={{ padding: '6px 8px' }}>
          {STATS.map(({ label, field, apiKey }) => (
            <div key={apiKey} className="ro-stat-row">
              <span style={{ color: '#3A5A7A', fontWeight: 600, width: '32px' }}>{label}</span>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '16px', color: 'var(--ro-text-accent)', fontWeight: 700, flex: 1, textAlign: 'center' }}>
                {player[field] as number}
              </span>
              {player.statPoints > 0 && (
                <button
                  style={{
                    width: '18px', height: '18px', borderRadius: '5px',
                    background: 'linear-gradient(180deg, var(--ro-header-light) 0%, var(--ro-header-dark) 100%)',
                    border: '1px solid var(--ro-border)',
                    fontSize: '12px', color: 'var(--ro-text)', fontWeight: 700,
                    cursor: loading === apiKey ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: loading === apiKey ? 0.5 : 1,
                  }}
                  disabled={loading === apiKey}
                  onClick={() => handleDistribute(apiKey)}
                >
                  +
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skill points */}
      <div className="ro-panel">
        <div className="ro-panel-header">Pontos de Skill</div>
        <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>Disponíveis</span>
          <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ro-text-accent)' }}>
            {player.skillPoints}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Commit**
```bash
git add components/game/status-panel.tsx
git commit -m "feat(theme): rework StatusPanel with RO light theme"
```

---

## Task 6: `skill-panel.tsx`

**Arquivo:** `components/game/skill-panel.tsx`

- [ ] **Substituir conteúdo completo**

```tsx
// components/game/skill-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { skillApi } from '@/lib/api'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { SkillRow } from '@/lib/types'

export function SkillPanel() {
  const { playerId, player, skills, refreshSkills, refreshPlayer, currentEncounter } = useGame()
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => { if (playerId) refreshSkills() }, [playerId, refreshSkills])

  const handleLearn = async (skill: SkillRow) => {
    if (!playerId || loading) return
    setLoading(skill.aegisName)
    try {
      const res = await skillApi.learn(playerId, skill.aegisName)
      toast.success(res.message)
      await refreshSkills()
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprender skill')
    } finally { setLoading(null) }
  }

  const handleUse = async (skill: SkillRow) => {
    if (!playerId || loading) return
    setLoading(skill.aegisName)
    try {
      const res = await skillApi.use(playerId, skill.aegisName, currentEncounter?.monsterId ?? undefined)
      toast.success(res.message)
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar skill')
    } finally { setLoading(null) }
  }

  if (skills.length === 0) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px' }}>
      <Sparkles style={{ width: '32px', height: '32px', color: 'var(--ro-text-muted)' }} />
      <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text-muted)' }}>
        Nenhuma skill disponível.
      </span>
    </div>
  )

  const skillPoints = player?.skillPoints ?? 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '6px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div className="ro-section-label" style={{ marginBottom: 0 }}>Skills</div>
        <span style={{ fontSize: '10px', color: 'var(--ro-text-accent)', fontWeight: 600 }}>
          {skillPoints} ponto{skillPoints !== 1 ? 's' : ''}
        </span>
      </div>

      {skills.map((skill) => (
        <div key={skill.aegisName} className="ro-panel">
          <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text)' }}>
                {skill.name}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--ro-text-muted)' }}>
                Lv {skill.currentLevel} / {skill.maxLevel}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {skill.canLearn && skillPoints > 0 && (
                <button
                  className="ro-btn-primary font-[family-name:var(--font-pixel)]"
                  style={{ padding: '4px 10px', fontSize: '9px' }}
                  disabled={loading === skill.aegisName}
                  onClick={() => handleLearn(skill)}
                >
                  {loading === skill.aegisName ? '...' : 'APRENDER'}
                </button>
              )}
              {!skill.canLearn && skill.blockedReason && (
                <span title={skill.blockedReason}>
                  <button
                    className="ro-btn-ghost font-[family-name:var(--font-pixel)]"
                    style={{ padding: '4px 10px', fontSize: '9px', opacity: 0.45 }}
                    disabled
                  >
                    APRENDER
                  </button>
                </span>
              )}
              {skill.currentLevel > 0 && (
                <button
                  className="ro-btn-ghost font-[family-name:var(--font-pixel)]"
                  style={{ padding: '4px 10px', fontSize: '9px' }}
                  disabled={loading === skill.aegisName}
                  onClick={() => handleUse(skill)}
                >
                  {loading === skill.aegisName ? '...' : 'USAR'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Commit**
```bash
git add components/game/skill-panel.tsx
git commit -m "feat(theme): rework SkillPanel with RO light theme"
```

---

## Task 7: `inventory-panel.tsx`

**Arquivo:** `components/game/inventory-panel.tsx`

- [ ] **Substituir conteúdo completo**

```tsx
// components/game/inventory-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { inventoryApi } from '@/lib/api'
import { toast } from 'sonner'
import { Backpack } from 'lucide-react'
import type { InventoryItem } from '@/lib/types'

export function InventoryPanel() {
  const { playerId, inventory, refreshInventory, refreshPlayer } = useGame()
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => { if (playerId) refreshInventory() }, [playerId, refreshInventory])

  const handleEquip = async (item: InventoryItem) => {
    if (!playerId || loading) return
    setLoading(item.id)
    try {
      const res = await inventoryApi.equip(playerId, item.id)
      toast.success(res.result)
      await refreshInventory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao equipar item')
    } finally { setLoading(null) }
  }

  const handleUse = async (item: InventoryItem) => {
    if (!playerId || loading) return
    setLoading(item.id)
    try {
      const res = await inventoryApi.use(playerId, item.id)
      toast.success(res.message)
      await refreshInventory()
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar item')
    } finally { setLoading(null) }
  }

  if (inventory.length === 0) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px' }}>
      <Backpack style={{ width: '32px', height: '32px', color: 'var(--ro-text-muted)' }} />
      <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text-muted)' }}>
        Inventário vazio.
      </span>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '4px', overflowY: 'auto' }}>
      <div className="ro-section-label">Inventário ({inventory.length} itens)</div>
      {inventory.map((item) => (
        <div key={item.id} className="ro-list-item" style={{ justifyContent: 'space-between', cursor: 'default' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text)' }}>
                {item.name}
              </span>
              {item.equipped && <span className="ro-badge">EQUIPADO</span>}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              <span className="ro-badge">{item.type}</span>
              <span style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>x{item.amount}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
            {item.type === 'CONSUMABLE' && (
              <button
                className="ro-btn-primary font-[family-name:var(--font-pixel)]"
                style={{ padding: '4px 10px', fontSize: '9px' }}
                disabled={loading === item.id}
                onClick={() => handleUse(item)}
              >
                {loading === item.id ? '...' : 'USAR'}
              </button>
            )}
            {(item.type === 'WEAPON' || item.type === 'ARMOR') && (
              <button
                className="ro-btn-ghost font-[family-name:var(--font-pixel)]"
                style={{ padding: '4px 10px', fontSize: '9px' }}
                disabled={loading === item.id}
                onClick={() => handleEquip(item)}
              >
                {loading === item.id ? '...' : item.equipped ? 'DESEQUIPAR' : 'EQUIPAR'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Commit**
```bash
git add components/game/inventory-panel.tsx
git commit -m "feat(theme): rework InventoryPanel with RO light theme"
```

---

## Task 8: `battle-panel.tsx`

**Arquivo:** `components/game/battle-panel.tsx`

- [ ] **Substituir conteúdo completo**

```tsx
// components/game/battle-panel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useGame } from '@/lib/game-context'

function classifyLogEntry(msg: string): 'dmg' | 'exp' | 'info' {
  const lower = msg.toLowerCase()
  // Colorização de apresentação apenas — não é regra de negócio
  if (lower.includes('fatal') || lower.includes('dano') || lower.includes('atacou') || lower.includes('derrotado')) return 'dmg'
  if (lower.includes('exp') || lower.includes('vitória') || lower.includes('escapou')) return 'exp'
  return 'info'
}

export function BattlePanel() {
  const { battleLog } = useGame()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [battleLog])

  if (battleLog.length === 0) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
      <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text-muted)' }}>
        Ande pelo mapa para encontrar monstros.
      </span>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', overflowY: 'auto' }}>
      <div className="ro-section-label">Log de Batalha</div>
      <div className="ro-log-box" style={{ flex: 1 }}>
        {battleLog.map((msg, i) => {
          const type = classifyLogEntry(msg)
          return (
            <div
              key={i}
              className={`ro-log-${type} font-[family-name:var(--font-pixel-body)]`}
              style={{ fontSize: '13px', padding: '3px 0', borderBottom: '1px solid #EAF0F8' }}
            >
              {msg}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Commit**
```bash
git add components/game/battle-panel.tsx
git commit -m "feat(theme): rework BattlePanel with RO log-box and color coding"
```

---

## Task 9: `class-change-panel.tsx`

**Arquivo:** `components/game/class-change-panel.tsx`

- [ ] **Substituir conteúdo completo**

```tsx
// components/game/class-change-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import type { JobClass } from '@/lib/types'
import { toast } from 'sonner'
import { ArrowUpCircle, Sparkles } from 'lucide-react'

const CLASS_DESCRIPTIONS: Record<JobClass, string> = {
  NOVICE:     'Classe inicial. Pode evoluir para qualquer primeira classe.',
  SWORDSMAN:  'Guerreiro especializado em combate corpo a corpo com espadas.',
  MAGE:       'Mago especializado em magias elementais devastadoras.',
  ARCHER:     'Arqueiro com alta precisão e ataques a distância.',
  THIEF:      'Ladino ágil com habilidades de furtividade e ataques rápidos.',
  MERCHANT:   'Comerciante com habilidades econômicas e de crafting.',
  ACOLYTE:    'Clérigo com magias de cura e suporte.',
  KNIGHT:     'Cavaleiro blindado com alta defesa e ataques poderosos.',
  WIZARD:     'Mago avançado com magias de área devastadoras.',
  HUNTER:     'Caçador com armadilhas e um falcão companheiro.',
  ASSASSIN:   'Assassino mortal com ataques críticos e venenos.',
  BLACKSMITH: 'Ferreiro capaz de forjar e aprimorar equipamentos.',
  PRIEST:     'Sacerdote com curas poderosas e magias sagradas.',
}

export function ClassChangePanel() {
  const { player, playerId, refreshPlayer } = useGame()
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  // ⚠ BACKEND NEEDED: GET /api/players/{id}/class-change deve retornar `blockedReason: string | null`
  // quando não há classes disponíveis. Por enquanto o frontend mostra mensagem genérica.
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    if (playerId && player?.jobClass) loadClasses()
  }, [playerId, player?.jobClass])

  const loadClasses = async () => {
    if (!playerId) return
    setIsLoading(true)
    try {
      const classes = await playerApi.listAvailableClasses(playerId)
      setAvailableClasses(classes)
    } catch {
      setAvailableClasses([])
    } finally { setIsLoading(false) }
  }

  const handleChangeClass = async () => {
    if (!playerId || !selectedClass || isChanging) return
    setIsChanging(true)
    try {
      await playerApi.changeClass(playerId, selectedClass)
      await refreshPlayer()
      toast.success(`Classe alterada para ${selectedClass}!`)
      setSelectedClass(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao trocar classe')
    } finally { setIsChanging(false) }
  }

  if (!player) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--ro-text-muted)', fontSize: '12px' }}>Carregando...</span>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '10px', overflowY: 'auto' }}>

      {/* Current class */}
      <div className="ro-panel">
        <div className="ro-panel-header">Classe Atual</div>
        <div style={{ padding: '8px 10px' }}>
          <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '18px', color: 'var(--ro-text-accent)', fontWeight: 700 }}>
            {player.jobClass}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--ro-text-muted)', marginTop: '2px' }}>
            Job Level: {player.jobLevel}
          </div>
        </div>
      </div>

      {/* Available classes */}
      <div>
        <div className="ro-section-label">Evoluções Disponíveis</div>
        {isLoading ? (
          <span style={{ fontSize: '11px', color: 'var(--ro-text-muted)' }}>Carregando...</span>
        ) : availableClasses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '24px 0' }}>
            <Sparkles style={{ width: '28px', height: '28px', color: 'var(--ro-text-muted)' }} />
            <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)', textAlign: 'center' }}>
              {/* ⚠ BACKEND NEEDED: exibir blockedReason da API aqui */}
              Nenhuma evolução disponível no momento.
            </span>
          </div>
        ) : (
          availableClasses.map((cls) => (
            <div
              key={cls}
              className="ro-list-item"
              style={{ cursor: 'pointer', marginBottom: '4px' }}
              onClick={() => setSelectedClass(cls)}
            >
              <div style={{ flex: 1 }}>
                <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '15px', fontWeight: 600 }}>
                  {cls}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--ro-text-muted)', marginTop: '2px' }}>
                  {CLASS_DESCRIPTIONS[cls as JobClass] ?? ''}
                </div>
              </div>
              <ArrowUpCircle style={{ width: '16px', height: '16px', color: 'var(--ro-text-accent)', flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>

      {/* Confirmation dialog */}
      {selectedClass && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div className="ro-panel" style={{ width: '320px', borderRadius: '12px' }}>
            <div className="ro-panel-header">Confirmar Evolução</div>
            <div style={{ padding: '14px' }}>
              <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ro-text-accent)', marginBottom: '6px' }}>
                {selectedClass}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ro-text-muted)', marginBottom: '14px' }}>
                {CLASS_DESCRIPTIONS[selectedClass as JobClass] ?? ''}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="ro-btn-primary font-[family-name:var(--font-pixel)]"
                  style={{ flex: 1, padding: '8px', fontSize: '10px' }}
                  disabled={isChanging}
                  onClick={handleChangeClass}
                >
                  {isChanging ? 'EVOLUINDO...' : 'CONFIRMAR'}
                </button>
                <button
                  className="ro-btn-ghost font-[family-name:var(--font-pixel)]"
                  style={{ padding: '8px 14px', fontSize: '10px' }}
                  onClick={() => setSelectedClass(null)}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Commit**
```bash
git add components/game/class-change-panel.tsx
git commit -m "feat(theme): rework ClassChangePanel with RO light theme; signal backend blockedReason"
```

---

## Task 10: `battle-hud.tsx` — apenas background do wrapper

**Arquivo:** `components/game/battle-hud.tsx`

O BattleHud não é reworkado visualmente. Apenas adicionar um `style` no wrapper externo para evitar que o `--ro-body-bg` apareça atrás do painel de batalha.

- [ ] **Editar apenas a linha do wrapper externo**

Em `components/game/battle-hud.tsx`, linha 120, alterar de:
```tsx
  return (
    <div className="flex-1 flex flex-col min-h-0">
```
para:
```tsx
  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: '#1a1a2e' }}>
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Verificar no browser: entrar em batalha — fundo do painel de batalha continua escuro**

- [ ] **Commit**
```bash
git add components/game/battle-hud.tsx
git commit -m "fix(theme): ensure BattleHud wrapper keeps dark background in light theme"
```

---

## Task 11: Telas de auth — login e register

**Arquivos:** `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`

- [ ] **Substituir `app/(auth)/login/page.tsx`**

```tsx
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { toast.error('Preencha todos os campos'); return }
    setIsLoading(true)
    try {
      await login(username, password)
      toast.success('Login realizado com sucesso!')
      router.push('/select-character')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login')
    } finally { setIsLoading(false) }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'var(--ro-page-bg)' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '22px', color: 'var(--ro-text-accent)', marginBottom: '4px', letterSpacing: '2px' }}>
            RAGNAROK
          </h1>
          <p className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '16px', color: 'var(--ro-text-muted)' }}>
            Emulator
          </p>
        </div>

        <div className="ro-panel">
          <div className="ro-panel-header" style={{ justifyContent: 'center', fontSize: '11px', letterSpacing: '1px' }}>
            LOGIN
          </div>
          <div style={{ padding: '20px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>
                  Usuário
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  placeholder="Digite seu usuário..."
                  className="font-[family-name:var(--font-pixel-body)]"
                  style={{
                    width: '100%', padding: '8px 10px', fontSize: '14px',
                    border: '1px solid var(--ro-border)', borderRadius: '7px',
                    background: '#fff', color: 'var(--ro-text)', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Digite sua senha..."
                  className="font-[family-name:var(--font-pixel-body)]"
                  style={{
                    width: '100%', padding: '8px 10px', fontSize: '14px',
                    border: '1px solid var(--ro-border)', borderRadius: '7px',
                    background: '#fff', color: 'var(--ro-text)', outline: 'none',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="ro-btn-primary font-[family-name:var(--font-pixel)]"
                style={{ width: '100%', padding: '10px', fontSize: '11px', letterSpacing: '1px' }}
              >
                {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)' }}>
                Não tem conta?{' '}
                <Link href="/register" style={{ color: 'var(--ro-text-accent)', textDecoration: 'underline' }}>
                  Registre-se
                </Link>
              </span>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--ro-border)' }}>
              <p style={{ fontSize: '10px', color: 'var(--ro-text-muted)', textAlign: 'center', marginBottom: '8px' }}>
                Backend offline? Teste o frontend:
              </p>
              <button
                type="button"
                className="ro-btn-ghost font-[family-name:var(--font-pixel)]"
                style={{ width: '100%', padding: '8px', fontSize: '9px', letterSpacing: '0.5px' }}
                onClick={() => {
                  localStorage.setItem('demo_mode', 'true')
                  localStorage.setItem('demo_user', JSON.stringify({ id: 1, username: 'demo', email: 'demo@test.com' }))
                  toast.success('Modo Demo ativado!')
                  router.push('/select-character')
                }}
              >
                ENTRAR EM MODO DEMO
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '10px', color: 'var(--ro-text-muted)' }}>
          v1.0.0 — Frontend Demo
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Substituir `app/(auth)/register/page.tsx`**

Ler o arquivo atual:
```bash
# Ler para entender o conteúdo antes de editar
```

Substituir pelo conteúdo abaixo (mesmo padrão visual do login):

```tsx
// app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) { toast.error('Preencha todos os campos'); return }
    setIsLoading(true)
    try {
      await register(username, password, email)
      toast.success('Conta criada com sucesso!')
      router.push('/select-character')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar')
    } finally { setIsLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--ro-border)', borderRadius: '7px',
    background: '#fff', color: 'var(--ro-text)', outline: 'none',
  } as React.CSSProperties

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'var(--ro-page-bg)' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '22px', color: 'var(--ro-text-accent)', marginBottom: '4px', letterSpacing: '2px' }}>
            RAGNAROK
          </h1>
          <p className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '16px', color: 'var(--ro-text-muted)' }}>
            Criar Conta
          </p>
        </div>

        <div className="ro-panel">
          <div className="ro-panel-header" style={{ justifyContent: 'center', fontSize: '11px', letterSpacing: '1px' }}>
            REGISTRO
          </div>
          <div style={{ padding: '20px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>Usuário</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} placeholder="Escolha um nome..." className="font-[family-name:var(--font-pixel-body)]" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} placeholder="seu@email.com" className="font-[family-name:var(--font-pixel-body)]" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} placeholder="Escolha uma senha..." className="font-[family-name:var(--font-pixel-body)]" style={inputStyle} />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="ro-btn-primary font-[family-name:var(--font-pixel)]"
                style={{ width: '100%', padding: '10px', fontSize: '11px', letterSpacing: '1px' }}
              >
                {isLoading ? 'CRIANDO...' : 'CRIAR CONTA'}
              </button>
            </form>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)' }}>
                Já tem conta?{' '}
                <Link href="/login" style={{ color: 'var(--ro-text-accent)', textDecoration: 'underline' }}>
                  Entrar
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Commit**
```bash
git add "app/(auth)/login/page.tsx" "app/(auth)/register/page.tsx"
git commit -m "feat(theme): rework login and register pages with RO light theme"
```

---

## Task 12: `select-character/page.tsx` + fix delete bug

**Arquivo:** `app/(game)/select-character/page.tsx`

- [ ] **Adicionar `playerApi.delete` em `lib/api.ts`**

Em `lib/api.ts`, dentro do objeto `playerApi`, adicionar após o método `changeClass`:

```ts
// ⚠ BACKEND NEEDED: DELETE /api/players/{id} — deve validar ownership via JWT e retornar 204
delete: (id: number) =>
  apiFetch(`/players/${id}`, { method: 'DELETE' }),
```

- [ ] **Substituir `app/(game)/select-character/page.tsx`**

```tsx
// app/(game)/select-character/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import type { Player } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Play, LogOut } from 'lucide-react'

const DEMO_PLAYERS: Player[] = [
  { id: 1, name: 'DemoKnight', jobClass: 'SWORDSMAN', baseLevel: 25, jobLevel: 10, hpCurrent: 850, hpMax: 1200, spCurrent: 80, spMax: 150, str: 35, agi: 20, vit: 25, intelligence: 5, dex: 15, luk: 10, statPoints: 12, skillPoints: 5, zenny: 25000, mapName: 'prontera' },
  { id: 2, name: 'DemoMage',   jobClass: 'MAGE',      baseLevel: 18, jobLevel: 8,  hpCurrent: 380, hpMax: 500,  spCurrent: 450, spMax: 600, str: 5, agi: 10, vit: 10, intelligence: 40, dex: 25, luk: 15, statPoints: 8, skillPoints: 3, zenny: 18000, mapName: 'prontera' },
  { id: 3, name: 'DemoArcher', jobClass: 'ARCHER',    baseLevel: 22, jobLevel: 9,  hpCurrent: 650, hpMax: 800,  spCurrent: 150, spMax: 200, str: 15, agi: 35, vit: 15, intelligence: 10, dex: 40, luk: 20, statPoints: 10, skillPoints: 4, zenny: 32000, mapName: 'prontera' },
]

function RoBar({ current, max, variant }: { current: number; max: number; variant: 'hp' | 'sp' }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="ro-bar-track w-full" style={{ height: '10px' }}>
      <div className={`ro-bar-fill ro-bar-${variant}`} style={{ width: `${pct}%`, height: '100%' }} />
    </div>
  )
}

export default function SelectCharacterPage() {
  const router = useRouter()
  const { logout, user } = useAuth()
  const { setPlayerId } = useGame()
  const [players, setPlayers] = useState<Player[]>([])
  const [selected, setSelected] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'

  useEffect(() => { loadPlayers() }, [])

  const loadPlayers = async () => {
    setIsLoading(true)
    if (isDemoMode) {
      setTimeout(() => { setPlayers(DEMO_PLAYERS); setSelected(DEMO_PLAYERS[0]); setIsLoading(false) }, 400)
      return
    }
    try {
      const data = await playerApi.list()
      setPlayers(data)
      if (data.length > 0) setSelected(data[0])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar personagens')
    } finally { setIsLoading(false) }
  }

  const handlePlay = () => {
    if (!selected) { toast.error('Selecione um personagem'); return }
    setPlayerId(selected.id)
    router.push('/game')
  }

  const handleDelete = async () => {
    if (!selected) return
    setIsDeleting(true)
    if (isDemoMode) {
      setTimeout(() => {
        setPlayers(p => p.filter(x => x.id !== selected.id))
        setSelected(null)
        toast.success('Personagem removido (demo)')
        setIsDeleting(false)
      }, 300)
      return
    }
    try {
      // ⚠ BACKEND NEEDED: endpoint DELETE /api/players/{id} deve existir no core
      await playerApi.delete(selected.id)
      setPlayers(p => p.filter(x => x.id !== selected.id))
      setSelected(null)
      toast.success('Personagem removido')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover personagem')
    } finally { setIsDeleting(false) }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ro-page-bg)' }}>

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ro-border)', background: 'var(--ro-panel-bg)' }}>
        <div>
          <h1 className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '14px', color: 'var(--ro-text-accent)' }}>RAGNAROK</h1>
          <p style={{ fontSize: '11px', color: 'var(--ro-text-muted)' }}>Bem-vindo, {user?.username ?? 'Aventureiro'}</p>
        </div>
        <button className="ro-btn-ghost" style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => { logout(); router.push('/login') }}>
          <LogOut style={{ width: '14px', height: '14px' }} />
          Sair
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>

          {/* Character list */}
          <div className="ro-panel" style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="ro-panel-header" style={{ justifyContent: 'space-between' }}>
              <span>Personagens</span>
              <Link href="/create-character">
                <button className="ro-btn-primary font-[family-name:var(--font-pixel)]" style={{ padding: '2px 8px', fontSize: '8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Plus style={{ width: '10px', height: '10px' }} /> NOVO
                </button>
              </Link>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ro-text-muted)', fontSize: '11px' }}>Carregando...</div>
              ) : players.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--ro-text-muted)', marginBottom: '10px' }}>Nenhum personagem</p>
                  <Link href="/create-character">
                    <button className="ro-btn-primary font-[family-name:var(--font-pixel)]" style={{ padding: '6px 12px', fontSize: '9px' }}>CRIAR</button>
                  </Link>
                </div>
              ) : (
                players.map((p) => (
                  <div
                    key={p.id}
                    className={`ro-list-item ${selected?.id === p.id ? 'selected' : ''}`}
                    style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
                    onClick={() => setSelected(p)}
                  >
                    <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px' }}>{p.name}</span>
                    <span style={{ fontSize: '9px', color: selected?.id === p.id ? '#1a3050' : 'var(--ro-text-muted)' }}>
                      Lv {p.baseLevel} {p.jobClass}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Character detail */}
          <div className="ro-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selected ? (
              <>
                <div className="ro-panel-header" style={{ justifyContent: 'space-between' }}>
                  <span className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '10px' }}>{selected.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>{selected.jobClass} · Lv {selected.baseLevel}</span>
                </div>
                <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>

                  {/* Stats grid */}
                  <div className="ro-section-label">Atributos</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '12px' }}>
                    {[
                      ['STR', selected.str], ['AGI', selected.agi], ['VIT', selected.vit],
                      ['INT', selected.intelligence], ['DEX', selected.dex], ['LUK', selected.luk],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: 'rgba(157,178,219,0.1)', border: '1px solid var(--ro-border)', borderRadius: '6px', padding: '6px 8px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 600, color: 'var(--ro-text-muted)' }}>{label}</div>
                        <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ro-text-accent)' }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* HP / SP */}
                  <div className="ro-section-label">Vida e Mana</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#B02020' }}>HP</span>
                        <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)' }}>{selected.hpCurrent}/{selected.hpMax}</span>
                      </div>
                      <RoBar current={selected.hpCurrent} max={selected.hpMax} variant="hp" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#2050D0' }}>SP</span>
                        <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)' }}>{selected.spCurrent}/{selected.spMax}</span>
                      </div>
                      <RoBar current={selected.spCurrent} max={selected.spMax} variant="sp" />
                    </div>
                  </div>

                  {/* Points */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>Status Pts: <strong style={{ color: 'var(--ro-text-accent)' }}>{selected.statPoints}</strong></div>
                    <div style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>Skill Pts: <strong style={{ color: 'var(--ro-text-accent)' }}>{selected.skillPoints}</strong></div>
                    <div style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>Zenny: <strong style={{ color: 'var(--ro-zenny)' }}>{selected.zenny.toLocaleString()} z</strong></div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="ro-btn-primary font-[family-name:var(--font-pixel)]" style={{ flex: 1, padding: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handlePlay}>
                      <Play style={{ width: '14px', height: '14px' }} /> JOGAR
                    </button>
                    <button className="ro-btn-ghost" style={{ padding: '10px 14px', fontSize: '11px', color: '#B02020', borderColor: '#D09090' }} disabled={isDeleting} onClick={handleDelete}>
                      {isDeleting ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--ro-text-muted)' }}>Selecione um personagem</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Verificar no browser: tela de seleção de personagem com novo visual**

- [ ] **Commit**
```bash
git add "app/(game)/select-character/page.tsx" lib/api.ts
git commit -m "feat(theme): rework SelectCharacter page; fix delete character calling no API"
```

---

## Task 13: Remover string parsing de resultado de batalha

**Arquivos:** `lib/types.ts`, `lib/game-context.tsx`, `components/game/battle-hud.tsx`

Esta task remove a lógica frágil de `message.includes('FATAL')` / `message.includes('VITÓRIA')` e adiciona suporte aos campos booleanos que o backend deve prover. Enquanto o backend não entregar os campos, o fallback mantém o comportamento atual.

- [ ] **Adicionar campos opcionais em `lib/types.ts`**

Localizar a interface/type `BattleResult` em `lib/types.ts` e adicionar dois campos opcionais:

```ts
export interface BattleResult {
  message: string
  monsterHpRemaining: number | null
  // ⚠ BACKEND NEEDED: ragnarok-core BattleResponseDTO deve adicionar:
  //   Boolean playerDied  — true quando HP do jogador chegou a 0
  //   Boolean monsterDied — true quando o monstro foi derrotado
  // Enquanto o backend não enviar esses campos, o fallback abaixo usa message.includes()
  playerDied?: boolean
  monsterDied?: boolean
}
```

- [ ] **Atualizar `lib/game-context.tsx` para usar os campos com fallback**

Localizar as linhas 185-186 em `lib/game-context.tsx`:
```ts
      const isFatal = result.message.includes('FATAL')
      const isVictory = result.message.includes('VITÓRIA')
```
Substituir por:
```ts
      // Usa campos booleanos do backend quando disponíveis; fallback para parsing de string
      // ⚠ BACKEND NEEDED: remover fallback após BattleResponseDTO expor playerDied/monsterDied
      const isFatal = result.playerDied ?? result.message.includes('FATAL')
      const isVictory = result.monsterDied ?? result.message.includes('VITÓRIA')
```

- [ ] **Atualizar `components/game/battle-hud.tsx` para usar os campos com fallback**

Localizar linhas 42-45 em `components/game/battle-hud.tsx`:
```ts
      if (result.message.includes('VITÓRIA')) {
        ...
      } else if (result.message.includes('FATAL')) {
```
Substituir por:
```ts
      // ⚠ BACKEND NEEDED: remover fallback após BattleResponseDTO expor playerDied/monsterDied
      const isVictory = result.monsterDied ?? result.message.includes('VITÓRIA')
      const isFatal   = result.playerDied  ?? result.message.includes('FATAL')

      if (isVictory) {
        ...
      } else if (isFatal) {
```

- [ ] **`npx tsc --noEmit` — zero erros**

- [ ] **Commit**
```bash
git add lib/types.ts lib/game-context.tsx components/game/battle-hud.tsx
git commit -m "refactor(battle): add playerDied/monsterDied fields with fallback; signal backend contract"
```

---

## ⚠ Prompts para o projeto ragnarok-core

Após concluir todas as tasks acima, sinalizar ao usuário os três itens pendentes no backend:

### Backend Item 1 — ALTA PRIORIDADE: Campos de resultado de batalha
```
Adicionar dois campos booleanos ao BattleResponseDTO em ragnarok-core:

  Boolean playerDied  — true quando hpCurrent do player chegou a 0 nessa rodada
  Boolean monsterDied — true quando o monstro foi derrotado nessa rodada

Localização: src/main/java/com/ragnarok/battle/dto/BattleResponseDTO.java (ou equivalente)
Isso permite que o frontend pare de detectar resultado de batalha via message.includes('FATAL/VITÓRIA').
```

### Backend Item 2 — ALTA PRIORIDADE: Endpoint DELETE /api/players/{id}
```
Criar endpoint DELETE /api/players/{id} em ragnarok-core:
- Validar ownership: o personagem deve pertencer ao accountId do JWT
- Retornar 204 No Content em caso de sucesso
- Retornar 403 se o personagem não pertencer à conta
- Retornar 404 se não encontrado

Sem esse endpoint, o delete de personagem na tela de seleção é um bug silencioso
(o personagem volta a aparecer no próximo login).
```

### Backend Item 3 — BAIXA PRIORIDADE: blockedReason em class-change
```
Alterar resposta do GET /api/players/{id}/class-change para incluir:

  { availableClasses: string[], blockedReason: string | null }

blockedReason deve ser null quando há classes disponíveis, e uma string explicativa
quando a lista está vazia (ex: "Atinja Job Level 10 para evoluir", "Classe máxima atingida").

Isso remove o condicional hardcoded de jobClass==='NOVICE' no frontend.
```
