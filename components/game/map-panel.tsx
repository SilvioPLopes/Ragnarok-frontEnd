// components/game/map-panel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'
import { Footprints, Swords, MapPin, ChevronRight } from 'lucide-react'

export function MapPanel() {
  const {
    playerId, mapInfo, refreshMapInfo, currentEncounter,
    walkMap, travelTo, attackMonster, isLoading
  } = useGame()

  // Throttle refs — 500ms per action (antifraude)
  const walkThrottle = useRef(false)
  const attackThrottle = useRef(false)

  // Seed map info on mount
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

  const handleAttack = () => {
    if (!currentEncounter || attackThrottle.current || isLoading) return
    attackThrottle.current = true
    attackMonster(currentEncounter.monsterId).finally(() => {
      setTimeout(() => { attackThrottle.current = false }, 500)
    })
  }

  const handleTravel = (destination: string) => {
    travelTo(destination)
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      {/* Map Info */}
      <div className="game-panel p-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
            LOCALIZAÇÃO ATUAL
          </span>
        </div>
        <p className="font-[family-name:var(--font-pixel-body)] text-xl text-primary">
          {mapInfo?.mapName ?? 'Prontera Field'}
        </p>
      </div>

      {/* Encounter Card */}
      {currentEncounter ? (
        <div className="game-panel p-4 border-2 border-destructive/50 bg-destructive/5">
          <p className="font-[family-name:var(--font-pixel)] text-xs text-destructive mb-2">
            ENCONTRO!
          </p>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-[family-name:var(--font-pixel-body)] text-xl text-foreground">
                {currentEncounter.monsterName}
              </p>
              <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
                HP: {currentEncounter.monsterHpInitial}
              </p>
            </div>
            <Swords className="w-8 h-8 text-destructive opacity-70" />
          </div>
          <Button
            onClick={handleAttack}
            disabled={isLoading}
            className="w-full font-[family-name:var(--font-pixel)] text-sm pixel-button bg-destructive hover:bg-destructive/80"
          >
            {isLoading ? 'ATACANDO...' : 'ATACAR'}
          </Button>
        </div>
      ) : (
        /* Walk Button */
        <Button
          onClick={handleWalk}
          disabled={isLoading}
          className="w-full h-14 font-[family-name:var(--font-pixel)] text-sm pixel-button"
        >
          <Footprints className="w-5 h-5 mr-2" />
          {isLoading ? 'ANDANDO...' : 'ANDAR'}
        </Button>
      )}

      {/* Portals */}
      {mapInfo && mapInfo.portals.length > 0 && (
        <div className="game-panel p-4">
          <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-3">
            PORTAIS DISPONÍVEIS
          </p>
          <div className="space-y-2">
            {mapInfo.portals.map((portal) => (
              <Button
                key={portal}
                variant="outline"
                onClick={() => handleTravel(portal)}
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
