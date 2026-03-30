// components/game/map-panel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'
import { Footprints, MapPin, ChevronRight } from 'lucide-react'
import { BattleHud } from '@/components/game/battle-hud'
import { MapSprite } from '@/components/game/map-sprite'

export function MapPanel() {
  const {
    playerId, mapInfo, refreshMapInfo, currentEncounter,
    walkMap, travelTo, isLoading
  } = useGame()

  const walkThrottle = useRef(false)

  useEffect(() => {
    if (playerId && !mapInfo) refreshMapInfo()
  }, [playerId, mapInfo, refreshMapInfo])

  const handleWalk = () => {
    if (walkThrottle.current || isLoading) return
    walkThrottle.current = true
    walkMap().finally(() => {
      setTimeout(() => { walkThrottle.current = false }, 500)
    })
  }

  // During a battle, hand off entirely to BattleHud
  if (currentEncounter) {
    return <BattleHud />
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      {/* Map Info */}
      <div className="game-panel overflow-hidden">
        {mapInfo?.currentMap && (
          <MapSprite
            mapName={mapInfo.currentMap}
            className="w-full h-36 object-cover"
          />
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
              LOCALIZAÇÃO ATUAL
            </span>
          </div>
          <p className="font-[family-name:var(--font-pixel-body)] text-xl text-primary">
            {mapInfo?.currentMap ?? 'Prontera Field'}
          </p>
        </div>
      </div>

      {/* Walk Button */}
      <Button
        onClick={handleWalk}
        disabled={isLoading}
        className="w-full h-14 font-[family-name:var(--font-pixel)] text-sm pixel-button"
      >
        <Footprints className="w-5 h-5 mr-2" />
        {isLoading ? 'ANDANDO...' : 'ANDAR'}
      </Button>

      {/* Portals */}
      {mapInfo && mapInfo.availablePortals?.length > 0 && (
        <div className="game-panel p-4">
          <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-3">
            PORTAIS DISPONÍVEIS
          </p>
          <div className="space-y-2">
            {mapInfo.availablePortals.map((portal) => (
              <Button
                key={portal}
                variant="outline"
                onClick={() => travelTo(portal)}
                disabled={isLoading}
                className="w-full justify-between font-[family-name:var(--font-pixel-body)] text-lg"
              >
                {portal}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
