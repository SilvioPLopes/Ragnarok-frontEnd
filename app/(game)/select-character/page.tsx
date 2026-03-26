'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useGame } from '@/lib/game-context'
import type { Player, JobClass } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Play,
  LogOut,
  Sword,
  Shield,
  Wand2,
  Target,
  Coins,
  Heart,
  Footprints
} from 'lucide-react'

const CLASS_ICONS: Record<JobClass, React.ReactNode> = {
  NOVICE: <Footprints className="w-5 h-5" />,
  SWORDSMAN: <Sword className="w-5 h-5" />,
  MAGE: <Wand2 className="w-5 h-5" />,
  ARCHER: <Target className="w-5 h-5" />,
  THIEF: <Footprints className="w-5 h-5" />,
  MERCHANT: <Coins className="w-5 h-5" />,
  ACOLYTE: <Heart className="w-5 h-5" />,
  KNIGHT: <Shield className="w-5 h-5" />,
  WIZARD: <Wand2 className="w-5 h-5" />,
  HUNTER: <Target className="w-5 h-5" />,
  ASSASSIN: <Footprints className="w-5 h-5" />,
  BLACKSMITH: <Coins className="w-5 h-5" />,
  PRIEST: <Heart className="w-5 h-5" />,
}

const CLASS_COLORS: Record<JobClass, string> = {
  NOVICE: 'text-muted-foreground',
  SWORDSMAN: 'text-destructive',
  MAGE: 'text-blue-400',
  ARCHER: 'text-green-400',
  THIEF: 'text-purple-400',
  MERCHANT: 'text-primary',
  ACOLYTE: 'text-pink-400',
  KNIGHT: 'text-destructive',
  WIZARD: 'text-blue-400',
  HUNTER: 'text-green-400',
  ASSASSIN: 'text-purple-400',
  BLACKSMITH: 'text-primary',
  PRIEST: 'text-pink-400',
}

export default function SelectCharacterPage() {
  const router = useRouter()
  const { logout, user } = useAuth()
  const { setPlayerId } = useGame()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'

  // Demo data for testing without backend
  const demoPlayers: Player[] = [
    {
      id: 1,
      name: 'DemoKnight',
      jobClass: 'SWORDSMAN',
      baseLevel: 25,
      jobLevel: 10,
      hpCurrent: 850,
      hpMax: 1200,
      spCurrent: 80,
      spMax: 150,
      str: 35,
      agi: 20,
      vit: 25,
      intelligence: 5,
      dex: 15,
      luk: 10,
      statPoints: 12,
      skillPoints: 5,
      zenny: 25000,
      mapName: 'prontera',
    },
    {
      id: 2,
      name: 'DemoMage',
      jobClass: 'MAGE',
      baseLevel: 18,
      jobLevel: 8,
      hpCurrent: 380,
      hpMax: 500,
      spCurrent: 450,
      spMax: 600,
      str: 5,
      agi: 10,
      vit: 10,
      intelligence: 40,
      dex: 25,
      luk: 15,
      statPoints: 8,
      skillPoints: 3,
      zenny: 18000,
      mapName: 'prontera',
    },
    {
      id: 3,
      name: 'DemoArcher',
      jobClass: 'ARCHER',
      baseLevel: 22,
      jobLevel: 9,
      hpCurrent: 650,
      hpMax: 800,
      spCurrent: 150,
      spMax: 200,
      str: 15,
      agi: 35,
      vit: 15,
      intelligence: 10,
      dex: 40,
      luk: 20,
      statPoints: 10,
      skillPoints: 4,
      zenny: 32000,
      mapName: 'prontera',
    },
  ]

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    setIsLoading(true)

    // Demo mode - use fake data
    if (isDemoMode) {
      setTimeout(() => {
        setPlayers(demoPlayers)
        setSelectedPlayer(demoPlayers[0])
        setIsLoading(false)
      }, 500)
      return
    }

    // Sem endpoint de listagem no backend ainda — lista começa vazia
    setPlayers([])
    setIsLoading(false)
  }

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player)
  }

  const handlePlayClick = () => {
    if (!selectedPlayer) {
      toast.error('Selecione um personagem')
      return
    }
    setPlayerId(selectedPlayer.id)
    router.push('/game')
  }

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return

    setIsDeleting(true)

    // Demo mode
    if (isDemoMode) {
      setTimeout(() => {
        setPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id))
        setSelectedPlayer(null)
        toast.success('Personagem deletado (demo)')
        setIsDeleting(false)
      }, 300)
      return
    }

    try {
      setPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id))
      setSelectedPlayer(null)
      toast.success('Personagem removido')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="font-[family-name:var(--font-pixel)] text-lg text-primary">
            RAGNAROK
          </h1>
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
            Bem-vindo, {user?.username || 'Aventureiro'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="font-[family-name:var(--font-pixel-body)] text-lg"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Character List */}
        <div className="w-full lg:w-80 game-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
              PERSONAGENS
            </h2>
            <Link href="/create-character">
              <Button size="sm" className="pixel-button font-[family-name:var(--font-pixel)] text-[10px]">
                <Plus className="w-3 h-3 mr-1" />
                NOVO
              </Button>
            </Link>
          </div>

          <ScrollArea className="h-[300px] lg:h-[calc(100vh-280px)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
                  Carregando...
                </p>
              </div>
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-4">
                <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground text-center">
                  Nenhum personagem encontrado
                </p>
                <Link href="/create-character">
                  <Button className="pixel-button font-[family-name:var(--font-pixel)] text-[10px]">
                    CRIAR PRIMEIRO
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    className={`w-full p-3 text-left transition-all ${
                      selectedPlayer?.id === player.id
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'bg-muted/30 border-2 border-transparent hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${CLASS_COLORS[player.jobClass]}`}>
                        {CLASS_ICONS[player.jobClass]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground truncate">
                          {player.name}
                        </p>
                        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
                          Lv.{player.baseLevel} {player.jobClass}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Character Details */}
        <div className="flex-1 game-panel p-4 lg:p-6">
          {selectedPlayer ? (
            <div className="h-full flex flex-col">
              {/* Character Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-[family-name:var(--font-pixel)] text-lg text-foreground mb-1">
                    {selectedPlayer.name}
                  </h2>
                  <div className={`flex items-center gap-2 ${CLASS_COLORS[selectedPlayer.jobClass]}`}>
                    {CLASS_ICONS[selectedPlayer.jobClass]}
                    <span className="font-[family-name:var(--font-pixel-body)] text-xl">
                      {selectedPlayer.jobClass}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-[family-name:var(--font-pixel)] text-sm text-primary">
                    LEVEL {selectedPlayer.baseLevel}
                  </p>
                  <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
                    {selectedPlayer.zenny.toLocaleString()} Zeny
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <StatBox label="STR" value={selectedPlayer.str} />
                <StatBox label="AGI" value={selectedPlayer.agi} />
                <StatBox label="VIT" value={selectedPlayer.vit} />
                <StatBox label="INT" value={selectedPlayer.intelligence} />
                <StatBox label="DEX" value={selectedPlayer.dex} />
                <StatBox label="LUK" value={selectedPlayer.luk} />
              </div>

              {/* HP/SP Bars */}
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">HP</span>
                    <span className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                      {selectedPlayer.hpCurrent}/{selectedPlayer.hpMax}
                    </span>
                  </div>
                  <div className="hp-bar h-4 w-full">
                    <div
                      className="hp-bar-fill h-full transition-all"
                      style={{ width: `${(selectedPlayer.hpCurrent / selectedPlayer.hpMax) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">SP</span>
                    <span className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                      {selectedPlayer.spCurrent}/{selectedPlayer.spMax}
                    </span>
                  </div>
                  <div className="mp-bar h-4 w-full">
                    <div
                      className="mp-bar-fill h-full transition-all"
                      style={{ width: `${(selectedPlayer.spCurrent / selectedPlayer.spMax) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">Status Points: </span>
                  <span className="font-[family-name:var(--font-pixel-body)] text-lg text-primary">{selectedPlayer.statPoints}</span>
                </div>
                <div>
                  <span className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">Skill Points: </span>
                  <span className="font-[family-name:var(--font-pixel-body)] text-lg text-accent">{selectedPlayer.skillPoints}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex gap-3">
                <Button
                  onClick={handlePlayClick}
                  className="flex-1 h-12 pixel-button font-[family-name:var(--font-pixel)] text-xs"
                >
                  <Play className="w-4 h-4 mr-2" />
                  JOGAR
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePlayer}
                  disabled={isDeleting}
                  className="h-12 px-4 font-[family-name:var(--font-pixel)] text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="font-[family-name:var(--font-pixel-body)] text-xl text-muted-foreground">
                Selecione um personagem para ver detalhes
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/30 p-3 border border-border">
      <p className="font-[family-name:var(--font-pixel)] text-[10px] text-muted-foreground mb-1">
        {label}
      </p>
      <p className="font-[family-name:var(--font-pixel)] text-lg text-primary">
        {value}
      </p>
    </div>
  )
}
