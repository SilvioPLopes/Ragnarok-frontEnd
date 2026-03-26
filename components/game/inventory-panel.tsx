// components/game/inventory-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { inventoryApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Backpack } from 'lucide-react'
import type { InventoryItem } from '@/lib/types'

export function InventoryPanel() {
  const { playerId, inventory, refreshInventory, refreshPlayer } = useGame()
  const [loading, setLoading] = useState<string | null>(null) // itemId being processed

  useEffect(() => {
    if (playerId) refreshInventory()
  }, [playerId, refreshInventory])

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
    } finally {
      setLoading(null)
    }
  }

  if (inventory.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <Backpack className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
            Inventário vazio.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-3">
        INVENTÁRIO ({inventory.length} itens)
      </p>
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {inventory.map((item) => (
            <div
              key={item.id}
              className="game-panel p-3 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground truncate">
                    {item.name}
                  </span>
                  {item.equipped && (
                    <Badge variant="secondary" className="font-[family-name:var(--font-pixel)] text-[9px] shrink-0">
                      EQUIPADO
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-[family-name:var(--font-pixel)] text-[9px]">
                    {item.type}
                  </Badge>
                  <span className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
                    x{item.amount}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {item.type === 'CONSUMABLE' && (
                  <Button
                    size="sm"
                    onClick={() => handleUse(item)}
                    disabled={loading === item.id}
                    className="font-[family-name:var(--font-pixel)] text-[10px]"
                  >
                    {loading === item.id ? '...' : 'USAR'}
                  </Button>
                )}
                {(item.type === 'WEAPON' || item.type === 'ARMOR') && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    title="Aguardando implementação no servidor"
                    className="font-[family-name:var(--font-pixel)] text-[10px] opacity-40"
                  >
                    EQUIPAR
                    {/* TODO: aguardando endpoint core — POST /api/players/{id}/inventory/{uuid}/equip */}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
