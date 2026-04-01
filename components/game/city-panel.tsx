// components/game/city-panel.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGame } from '@/lib/game-context'
import { npcApi } from '@/lib/api'
import { toast } from 'sonner'
import type { NpcDTO, NpcShopResponse, InventoryItem } from '@/lib/types'

interface CityPanelProps {
  mapName: string
  playerId: number
  onWarp: (newMap: string, x: number, y: number) => void
  onZennyChange?: (newZenny: number) => void
  onHpSpChange?: (hp: number, sp: number) => void
}

const WARP_DESTINATIONS = ['prt_in', 'prt_fild08', 'prt_fild05', 'prt_fild06', 'prt_church']

const NpcSprite = ({ spriteRef, name }: { spriteRef: string; name: string }) => {
  const [imgError, setImgError] = useState(false)

  if (imgError) {
    return (
      <div className="w-16 h-16 bg-gray-700 border border-gray-500 flex items-center
                      justify-center rounded text-xs text-gray-300 text-center p-1">
        {name}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/sprites/npcs/${spriteRef}.gif`}
      alt={name}
      width={64}
      height={64}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  )
}

export function CityPanel({ mapName, playerId, onWarp, onZennyChange, onHpSpChange }: CityPanelProps) {
  const { inventory, refreshPlayer } = useGame()

  const [npcs, setNpcs] = useState<NpcDTO[]>([])
  const [loadingNpcs, setLoadingNpcs] = useState(false)

  const [selectedShopNpc, setSelectedShopNpc] = useState<NpcDTO | null>(null)
  const [shopData, setShopData] = useState<NpcShopResponse | null>(null)
  const [shopTab, setShopTab] = useState<'buy' | 'sell'>('buy')
  const [buyQtys, setBuyQtys] = useState<Record<number, number>>({})
  const [sellQtys, setSellQtys] = useState<Record<string, number>>({})

  const [warpNpc, setWarpNpc] = useState<NpcDTO | null>(null)
  const [isActing, setIsActing] = useState(false)

  const loadNpcs = useCallback(async () => {
    setLoadingNpcs(true)
    try {
      const data = await npcApi.getNpcsByMap(mapName)
      setNpcs(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar NPCs')
    } finally {
      setLoadingNpcs(false)
    }
  }, [mapName])

  useEffect(() => { loadNpcs() }, [loadNpcs])

  const handleNpcClick = async (npc: NpcDTO) => {
    if (npc.type === 'NPC') {
      toast(`${npc.name} não tem interação disponível`)
      return
    }

    if (npc.type === 'HEAL') {
      setIsActing(true)
      try {
        const res = await npcApi.heal(npc.id, playerId)
        toast.success(res.message)
        await refreshPlayer()
        onHpSpChange?.(res.hp, res.sp)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao curar')
      } finally {
        setIsActing(false)
      }
      return
    }

    if (npc.type === 'WARP') {
      setWarpNpc(npc)
      return
    }

    if (npc.type === 'SHOP') {
      try {
        const data = await npcApi.getShop(npc.id)
        setShopData(data)
        setSelectedShopNpc(npc)
        setShopTab('buy')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao abrir loja')
      }
    }
  }

  const handleBuy = async (itemId: number, amount: number) => {
    if (!selectedShopNpc || amount < 1) return
    setIsActing(true)
    try {
      const res = await npcApi.buyItem(selectedShopNpc.id, { playerId, itemId, amount })
      toast.success(res.message)
      await refreshPlayer()
      onZennyChange?.(res.remainingZenny)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao comprar')
    } finally {
      setIsActing(false)
    }
  }

  const handleSell = async (item: InventoryItem, quantity: number) => {
    if (quantity < 1) return
    setIsActing(true)
    try {
      const res = await npcApi.sellItem({ playerId, playerItemId: item.id, quantity })
      toast.success(res.message)
      await refreshPlayer()
      onZennyChange?.(res.remainingZenny)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao vender')
    } finally {
      setIsActing(false)
    }
  }

  const handleWarp = async (npc: NpcDTO, destination: string) => {
    setIsActing(true)
    try {
      const res = await npcApi.warp(npc.id, playerId, destination)
      setWarpNpc(null)
      onWarp(res.newMap, res.x, res.y)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar portal')
    } finally {
      setIsActing(false)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '10px', overflowY: 'auto' }}>

      {/* Mapa com NPCs sobrepostos */}
      <div
        className="relative w-full rounded-lg overflow-hidden"
        style={{
          height: '192px',
          backgroundColor: '#111827',
          backgroundImage: `url('/sprites/maps/${mapName}.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {loadingNpcs && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Carregando NPCs...</span>
          </div>
        )}

        {npcs.map((npc) => (
          <button
            key={npc.id}
            className="absolute flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              left: `${npc.x}%`,
              top: `${npc.y}%`,
              transform: 'translate(-50%, -50%)',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
            onClick={() => handleNpcClick(npc)}
            title={npc.name}
            disabled={isActing}
          >
            <NpcSprite spriteRef={npc.spriteRef} name={npc.name} />
            <span style={{ fontSize: '8px', color: '#fff', textShadow: '0 1px 2px #000', marginTop: '2px' }}>
              {npc.name}
            </span>
          </button>
        ))}
      </div>

      {/* Lista de NPCs (fallback / acessibilidade) */}
      {npcs.length > 0 && (
        <div>
          <div className="ro-section-label">NPCs em {mapName}</div>
          {npcs.map((npc) => (
            <div
              key={npc.id}
              className="ro-list-item"
              style={{ cursor: isActing ? 'default' : 'pointer', fontSize: '11px', alignItems: 'center' }}
              onClick={() => !isActing && handleNpcClick(npc)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/sprites/npcs/${npc.spriteRef}.gif`}
                alt={npc.name}
                width={24}
                height={24}
                style={{ objectFit: 'contain', flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="font-[family-name:var(--font-pixel-body)]">{npc.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--ro-text-muted)' }}>
                {npc.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {npcs.length === 0 && !loadingNpcs && (
        <p style={{ fontSize: '11px', color: 'var(--ro-text-muted)', textAlign: 'center', padding: '16px 0' }}>
          Nenhum NPC encontrado em {mapName}.
        </p>
      )}

      {/* Modal de Loja */}
      {selectedShopNpc && shopData && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelectedShopNpc(null)}
        >
          <div
            className="ro-panel flex flex-col"
            style={{ width: '340px', maxHeight: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ro-panel-header">
              <span>{shopData.npcName}</span>
              <button
                onClick={() => setSelectedShopNpc(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--ro-text)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div className="ro-tab-bar">
              <button className={`ro-tab ${shopTab === 'buy' ? 'active' : ''}`} onClick={() => setShopTab('buy')}>
                Comprar
              </button>
              <button className={`ro-tab ${shopTab === 'sell' ? 'active' : ''}`} onClick={() => setShopTab('sell')}>
                Vender
              </button>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ background: 'var(--ro-body-bg)' }}>

              {shopTab === 'buy' && shopData.items.map((item) => (
                <div key={item.itemId} className="ro-list-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '11px' }}>
                      {item.itemName}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ro-zenny)' }}>
                      {item.price.toLocaleString()} z
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min={1}
                      value={buyQtys[item.itemId] ?? 1}
                      onChange={(e) =>
                        setBuyQtys(q => ({ ...q, [item.itemId]: Math.max(1, parseInt(e.target.value) || 1) }))
                      }
                      style={{
                        width: '48px', fontSize: '11px',
                        background: 'var(--ro-panel-bg)', border: '1px solid var(--ro-border)',
                        color: 'var(--ro-text)', padding: '2px 4px', borderRadius: '3px',
                      }}
                    />
                    <button
                      className="ro-btn-primary"
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                      disabled={isActing}
                      onClick={() => handleBuy(item.itemId, buyQtys[item.itemId] ?? 1)}
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              ))}

              {shopTab === 'sell' && inventory.map((item) => (
                <div key={item.id} className="ro-list-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '11px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>
                      x{item.amount}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min={1}
                      max={item.amount}
                      value={sellQtys[item.id] ?? 1}
                      onChange={(e) =>
                        setSellQtys(q => ({
                          ...q,
                          [item.id]: Math.max(1, Math.min(item.amount, parseInt(e.target.value) || 1)),
                        }))
                      }
                      style={{
                        width: '48px', fontSize: '11px',
                        background: 'var(--ro-panel-bg)', border: '1px solid var(--ro-border)',
                        color: 'var(--ro-text)', padding: '2px 4px', borderRadius: '3px',
                      }}
                    />
                    <button
                      className="ro-btn-primary"
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                      disabled={isActing}
                      onClick={() => handleSell(item, sellQtys[item.id] ?? 1)}
                    >
                      Vender
                    </button>
                  </div>
                </div>
              ))}

              {shopTab === 'sell' && inventory.length === 0 && (
                <p style={{ fontSize: '11px', color: 'var(--ro-text-muted)', padding: '12px', textAlign: 'center' }}>
                  Inventário vazio.
                </p>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Modal de Warp */}
      {warpNpc && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setWarpNpc(null)}
        >
          <div
            className="ro-panel"
            style={{ width: '280px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ro-panel-header">
              <span>{warpNpc.name}</span>
              <button
                onClick={() => setWarpNpc(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--ro-text)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '8px', background: 'var(--ro-body-bg)' }}>
              <div className="ro-section-label">Destinos</div>
              {WARP_DESTINATIONS.map((dest) => (
                <div
                  key={dest}
                  className="ro-list-item"
                  style={{ cursor: isActing ? 'default' : 'pointer', fontSize: '11px' }}
                  onClick={() => !isActing && handleWarp(warpNpc, dest)}
                >
                  <span>→</span>
                  <span className="font-[family-name:var(--font-pixel-body)]">{dest}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
