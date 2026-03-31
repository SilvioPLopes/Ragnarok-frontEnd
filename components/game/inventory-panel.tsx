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
