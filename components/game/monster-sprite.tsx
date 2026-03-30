// components/game/monster-sprite.tsx
'use client'

import { useState } from 'react'
import { Swords } from 'lucide-react'

interface MonsterSpriteProps {
  id: number
  name?: string
  className?: string
}

export function MonsterSprite({ id, name, className }: MonsterSpriteProps) {
  const [error, setError] = useState(false)

  if (error) {
    return <Swords className="w-12 h-12 text-destructive opacity-70" />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://file5s.ratemyserver.net/mobs/${id}.gif`}
      alt={name ?? `Monster ${id}`}
      onError={() => setError(true)}
      className={className}
    />
  )
}
