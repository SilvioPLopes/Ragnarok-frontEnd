// components/game/battle-item-overlay.tsx
'use client'

import type { InventoryItem } from '@/lib/types'

interface BattleItemOverlayProps {
  items: InventoryItem[]
  monsterName: string
  loading: boolean
  onUse: (item: InventoryItem) => void
  onBack: () => void
}

export function BattleItemOverlay({
  items, monsterName, loading, onUse, onBack,
}: BattleItemOverlayProps) {
  const consumables = items.filter(i => i.type === 'CONSUMABLE')

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-background border-b-2 border-emerald-500/30">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 flex-shrink-0">
        <span className="font-[family-name:var(--font-pixel)] text-[9px] text-emerald-400 tracking-wider">
          🎒 CONSUMÍVEIS
        </span>
        <span className="font-[family-name:var(--font-pixel-body)] text-xs text-muted-foreground">
          {monsterName}
        </span>
      </div>

      {/* Scrollable list */}
      <div
        className="flex-1 overflow-y-auto min-h-0"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e3a2a #0a0a18' }}
      >
        {consumables.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground text-center">
              Nenhum consumível no inventário.
            </p>
          </div>
        ) : (
          consumables.map(item => (
            <button
              key={item.id}
              disabled={loading}
              onClick={() => onUse(item)}
              className="w-full flex items-center justify-between px-3 py-2.5 border-b border-border/20 text-left hover:bg-emerald-500/5 transition-colors disabled:opacity-50"
            >
              <span className="font-[family-name:var(--font-pixel-body)] text-sm text-emerald-300">
                {item.name}
              </span>
              <span className={`font-[family-name:var(--font-pixel)] text-[9px] px-2 py-0.5 rounded border font-bold flex-shrink-0 ${
                item.amount === 1
                  ? 'bg-orange-900/40 border-orange-500/40 text-orange-300'
                  : 'bg-emerald-900/40 border-emerald-500/40 text-emerald-300'
              }`}>
                x{item.amount}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-full py-2.5 border-t border-border/50 font-[family-name:var(--font-pixel)] text-[9px] text-muted-foreground hover:text-foreground transition-colors bg-card flex-shrink-0"
      >
        ✕ VOLTAR AO COMBATE
      </button>
    </div>
  )
}
