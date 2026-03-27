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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Map, Sparkles, Backpack, User, ArrowUpCircle, Menu, Skull, ScrollText } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { toast } from 'sonner'

export default function GamePage() {
  const router = useRouter()
  const { player, playerId, refreshPlayer, refreshInventory, refreshSkills } = useGame()
  const [isResurrecting, setIsResurrecting] = useState(false)

  useEffect(() => {
    if (!playerId) {
      router.push('/')
      return
    }
    refreshInventory()
    refreshSkills()
  }, [playerId, router, refreshInventory, refreshSkills])

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-[family-name:var(--font-pixel-body)] text-xl text-muted-foreground">
          Carregando...
        </p>
      </div>
    )
  }

  // Death overlay
  if (player && player.hpCurrent === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <Skull className="w-16 h-16 text-destructive" />
        <h2 className="font-[family-name:var(--font-pixel)] text-2xl text-destructive">
          VOCÊ MORREU
        </h2>
        <Button
          disabled={isResurrecting}
          className="font-[family-name:var(--font-pixel)] text-sm"
          onClick={async () => {
            if (!playerId) return
            setIsResurrecting(true)
            try {
              await playerApi.resurrect(playerId)
              await refreshPlayer()
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Erro ao ressuscitar')
            } finally {
              setIsResurrecting(false)
            }
          }}
        >
          {isResurrecting ? 'RESSUSCITANDO...' : 'RESSUSCITAR'}
        </Button>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-3 border-b border-border">
        <h1 className="font-[family-name:var(--font-pixel)] text-sm text-primary">RAGNAROK</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-card">
            <div className="space-y-4 py-4">
              <PlayerHUD />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 border-r border-border p-4 gap-4">
          <h1 className="font-[family-name:var(--font-pixel)] text-lg text-primary">RAGNAROK</h1>
          <PlayerHUD />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="map" className="flex-1 flex flex-col">
            <div className="flex-1 min-h-0">
              <TabsContent value="map" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <MapPanel />
              </TabsContent>
              <TabsContent value="skills" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <SkillPanel />
              </TabsContent>
              <TabsContent value="inventory" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <InventoryPanel />
              </TabsContent>
              <TabsContent value="status" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <StatusPanel />
              </TabsContent>
              <TabsContent value="class" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ClassChangePanel />
              </TabsContent>
              <TabsContent value="log" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <BattlePanel />
              </TabsContent>
            </div>
            <TabsList className="flex justify-around border-t border-border bg-card h-14 rounded-none">
              <TabsTrigger value="map" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <Map className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">MAPA</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <Sparkles className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">SKILLS</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <Backpack className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">ITENS</span>
              </TabsTrigger>
              <TabsTrigger value="status" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <User className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">STATUS</span>
              </TabsTrigger>
              <TabsTrigger value="class" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <ArrowUpCircle className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">CLASSE</span>
              </TabsTrigger>
              <TabsTrigger value="log" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <ScrollText className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">LOG</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
