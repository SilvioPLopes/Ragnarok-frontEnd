// components/game/map-sprite.tsx
'use client'

import { useState } from 'react'
import { Map } from 'lucide-react'

interface MapSpriteProps {
  mapName: string
  className?: string
}

// Known CDN candidates — tried in order until one loads
const CDN_PATTERNS = [
  (name: string) => `https://file5s.ratemyserver.net/maps/${name}.png`,
  (name: string) => `https://file5s.ratemyserver.net/maps/${name}.jpg`,
  (name: string) => `https://static.divine-pride.net/images/maps/map/${name}.png`,
]

export function MapSprite({ mapName, className }: MapSpriteProps) {
  const [attempt, setAttempt] = useState(0)

  const src = CDN_PATTERNS[attempt]?.(mapName)

  console.log('[MapSprite]', { mapName, attempt, src, totalPatterns: CDN_PATTERNS.length })

  const handleError = () => {
    console.warn(`[MapSprite] failed attempt ${attempt} — url: ${src}`)
    if (attempt + 1 < CDN_PATTERNS.length) {
      setAttempt(a => a + 1)
    } else {
      console.warn(`[MapSprite] all CDN patterns exhausted for mapName="${mapName}"`)
      setAttempt(CDN_PATTERNS.length) // sentinel: all failed
    }
  }

  if (!src) {
    console.warn('[MapSprite] no more CDN patterns — showing fallback icon')
    return (
      <div className={`flex items-center justify-center bg-muted/20 rounded ${className ?? 'w-full py-10'}`}>
        <Map className="w-8 h-8 text-muted-foreground/40" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={mapName}
      onLoad={() => console.log(`[MapSprite] ✓ loaded: ${src}`)}
      onError={handleError}
      className={className ?? 'w-full object-contain'}
    />
  )
}
