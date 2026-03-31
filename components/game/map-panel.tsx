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
          <div style={{ maxHeight: '120px', overflow: 'hidden' }}>
            <MapSprite mapName={mapInfo.currentMap} className="w-full object-contain" />
          </div>
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
