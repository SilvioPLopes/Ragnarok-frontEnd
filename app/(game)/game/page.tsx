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
