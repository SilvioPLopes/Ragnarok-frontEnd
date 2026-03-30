// lib/game-context.tsx
'use client'

import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  playerApi, battleApi, skillApi, inventoryApi, mapApi,
  configureFraudHandler
} from './api'
import type {
  PlayerResponse, SkillRow, InventoryItem, MapInfo, Encounter, BattleResult
} from './types'

const MAX_BATTLE_LOG = 100

interface GameContextType {
  playerId: number | null
  setPlayerId: (id: number) => void
  player: PlayerResponse | null
  refreshPlayer: () => Promise<void>
  currentEncounter: Encounter | null
  clearEncounter: () => void
  walkMap: () => Promise<void>
  travelTo: (destination: string) => Promise<void>
  attackMonster: (monsterId: number) => Promise<BattleResult | null>
  flee: () => void
  battleLog: string[]
  clearBattleLog: () => void
  mapInfo: MapInfo | null
  inventory: InventoryItem[]
  refreshInventory: () => Promise<void>
  skills: SkillRow[]
  refreshSkills: () => Promise<void>
  refreshMapInfo: () => Promise<void>
  isLoading: boolean
  captchaVisible: boolean
  showCaptcha: () => void
  hideCaptcha: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [playerId, setPlayerIdState] = useState<number | null>(null)
  const [player, setPlayer] = useState<PlayerResponse | null>(null)
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [captchaVisible, setCaptchaVisible] = useState(false)

  const showCaptcha = useCallback(() => setCaptchaVisible(true), [])
  const hideCaptcha = useCallback(() => setCaptchaVisible(false), [])
  const clearEncounter = useCallback(() => setCurrentEncounter(null), [])
  const clearBattleLog = useCallback(() => setBattleLog([]), [])

  const appendLog = useCallback((message: string) => {
    setBattleLog(prev => {
      const next = [...prev, message]
      return next.length > MAX_BATTLE_LOG ? next.slice(-MAX_BATTLE_LOG) : next
    })
  }, [])

  // Configure fraud handler once (needs router + showCaptcha)
  const fraudConfigured = useRef(false)
  useEffect(() => {
    if (fraudConfigured.current) return
    fraudConfigured.current = true
    configureFraudHandler({ push: router.push, showCaptcha })
  }, [router.push, showCaptcha])

  // Restore playerId from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('playerId')
    if (stored) {
      const id = parseInt(stored, 10)
      if (!isNaN(id)) setPlayerIdState(id)
    }
  }, [])

  const setPlayerId = useCallback((id: number) => {
    localStorage.setItem('playerId', String(id))
    setPlayerIdState(id)
  }, [])

  const refreshPlayer = useCallback(async () => {
    if (!playerId) return
    try {
      const p = await playerApi.get(playerId)
      setPlayer(p)
    } catch (err) {
      console.error('refreshPlayer failed', err)
    }
  }, [playerId])

  // Load player when playerId becomes available
  useEffect(() => {
    if (playerId && !player) refreshPlayer()
  }, [playerId, player, refreshPlayer])

  const refreshInventory = useCallback(async () => {
    if (!playerId) return
    try {
      const items = await inventoryApi.list(playerId)
      setInventory(items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar inventário')
    }
  }, [playerId])

  const refreshSkills = useCallback(async () => {
    if (!playerId) return
    try {
      const rows = await skillApi.list(playerId)
      setSkills(rows)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar skills')
    }
  }, [playerId])

  const walkMap = useCallback(async () => {
    if (!playerId) return
    console.log('[walkMap] start', { playerId })
    setIsLoading(true)
    try {
      const result = await mapApi.walk(playerId)
      console.log('[walkMap] result', result)
      appendLog(result.message)
      if (result.encounterOccurred && result.monsterId && result.monsterName && result.monsterHp) {
        console.log('[walkMap] encounter!', { monsterId: result.monsterId, monsterName: result.monsterName, hp: result.monsterHp })
        setCurrentEncounter({
          monsterId: result.monsterId,
          monsterName: result.monsterName,
          monsterHpInitial: result.monsterHp,
          monsterHpCurrent: result.monsterHp,
        })
      } else {
        console.log('[walkMap] no encounter', { encounterOccurred: result.encounterOccurred, monsterId: result.monsterId })
      }
    } catch (err) {
      console.error('[walkMap] error', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao andar')
    } finally {
      setIsLoading(false)
    }
  }, [playerId, appendLog])

  const travelTo = useCallback(async (destination: string) => {
    if (!playerId) return
    console.log('[travelTo] start', { playerId, destination })
    setIsLoading(true)
    try {
      await mapApi.travel(playerId, destination)
      console.log('[travelTo] travel OK, refreshing map...')
      clearBattleLog()
      clearEncounter()
      const info = await mapApi.get(playerId)
      console.log('[travelTo] new mapInfo', info)
      setMapInfo(info)
      await refreshPlayer()
    } catch (err) {
      console.error('[travelTo] error', { destination, err })
      toast.error(err instanceof Error ? err.message : 'Erro ao viajar')
    } finally {
      setIsLoading(false)
    }
  }, [playerId, clearBattleLog, clearEncounter, refreshPlayer])

  const attackMonster = useCallback(async (monsterId: number): Promise<BattleResult | null> => {
    if (!playerId) return null
    console.log('[attackMonster] start', { playerId, monsterId })
    setIsLoading(true)
    try {
      const result = await battleApi.attack(playerId, monsterId)
      console.log('[attackMonster] result', result)
      appendLog(result.message)

      const isFatal = result.message.includes('FATAL')
      const isVictory = result.message.includes('VITÓRIA')

      // Update monster HP for normal rounds (BattleHud handles victory/fatal)
      if (!isFatal && !isVictory && result.monsterHpRemaining != null) {
        setCurrentEncounter(prev =>
          prev ? { ...prev, monsterHpCurrent: result.monsterHpRemaining! } : null
        )
      }

      // For fatal: BattleHud handles the 1500ms delay, clearEncounter, and refreshPlayer
      if (!isFatal) {
        await refreshPlayer()
      }

      return result
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atacar')
      clearEncounter()
      return null
    } finally {
      setIsLoading(false)
    }
  }, [playerId, appendLog, refreshPlayer, clearEncounter])

  const flee = useCallback(() => {
    clearEncounter()
    setBattleLog(prev => {
      const next = [...prev, 'Você conseguiu escapar!']
      return next.length > MAX_BATTLE_LOG ? next.slice(-MAX_BATTLE_LOG) : next
    })
  }, [clearEncounter])

  const refreshMapInfo = useCallback(async () => {
    if (!playerId) return
    try {
      const info = await mapApi.get(playerId)
      setMapInfo(info)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar mapa')
    }
  }, [playerId])

  return (
    <GameContext.Provider value={{
      playerId, setPlayerId,
      player, refreshPlayer,
      currentEncounter, clearEncounter,
      walkMap, travelTo, attackMonster, flee,
      battleLog, clearBattleLog,
      mapInfo, refreshMapInfo,
      inventory, refreshInventory,
      skills, refreshSkills,
      isLoading, captchaVisible, showCaptcha, hideCaptcha,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
