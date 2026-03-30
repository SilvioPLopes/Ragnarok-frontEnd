// components/game/map-sprite.tsx
'use client'

import { useState } from 'react'
import { Map } from 'lucide-react'

interface MapSpriteProps {
  mapName: string
  className?: string
}

export function MapSprite({ mapName, className }: MapSpriteProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 rounded ${className ?? 'w-full h-32'}`}>
        <Map className="w-8 h-8 text-muted-foreground/40" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://file5s.ratemyserver.net/maps/${mapName}.png`}
      alt={mapName}
      onError={() => setError(true)}
      className={className ?? 'w-full h-32 object-cover rounded'}
    />
  )
}
