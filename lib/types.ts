// lib/types.ts

export type JobClass =
  | 'NOVICE' | 'SWORDSMAN' | 'MAGE' | 'ARCHER' | 'THIEF' | 'MERCHANT' | 'ACOLYTE'
  | 'KNIGHT' | 'WIZARD' | 'HUNTER' | 'ASSASSIN' | 'BLACKSMITH' | 'PRIEST'

export interface PlayerResponse {
  id: number
  name: string
  jobClass: JobClass
  baseLevel: number
  jobLevel: number
  hpCurrent: number
  hpMax: number
  spCurrent: number
  spMax: number
  str: number
  agi: number
  vit: number
  intelligence: number   // API returns "intelligence"; payload for PUT uses key "int"
  dex: number
  luk: number
  statPoints: number
  skillPoints: number
  zenny: number
  mapName: string
}

export interface SkillRow {
  aegisName: string       // used in API URLs — never use `name` in URLs
  name: string            // display only
  maxLevel: number
  currentLevel: number
  canLearn: boolean
  blockedReason?: string
  targetable?: boolean    // true = offensive skill that requires a monsterId in combat
}

export interface InventoryItem {
  id: string              // UUID
  name: string
  type: 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'ETC'
  amount: number
  equipped: boolean
}

export interface MapInfo {
  currentMap: string
  availablePortals: string[]
}

export interface WalkResult {
  encounterOccurred: boolean
  monsterId: number | null
  monsterName: string | null
  monsterHp: number | null   // HP at encounter start — does not update between rounds
  message: string
}

export interface BattleResult {
  message: string
  monsterHpRemaining?: number | null
  // ⚠ BACKEND NEEDED: ragnarok-core BattleResponseDTO deve adicionar:
  //   Boolean playerDied  — true quando HP do jogador chegou a 0
  //   Boolean monsterDied — true quando o monstro foi derrotado
  // Enquanto o backend não enviar esses campos, o fallback abaixo usa message.includes()
  playerDied?: boolean
  monsterDied?: boolean
  fraud?: FraudResponse
}

export interface Encounter {
  monsterId: number
  monsterName: string
  monsterHpInitial: number
  monsterHpCurrent: number
}

export type Verdict = 'APPROVED' | 'BLOCKED' | 'CHALLENGE' | 'UNKNOWN'
export type RequiredAction =
  | 'NONE'
  | 'CANCEL_ACTION'
  | 'SHOW_CAPTCHA'
  | 'DROP_SESSION'
  | 'FLAG_FOR_REVIEW'
  | 'ALERT_ONLY'

export interface FraudResponse {
  verdict: Verdict
  requiredAction: RequiredAction
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason?: string
}

export interface User {
  id: number
  username: string
  email: string
}

export interface ClassChangeRequirement {
  targetClass: JobClass
  requiredJobLevel: number
  requiredZeny?: number
  requiredItems?: { itemId: number; quantity: number }[]
}

/** Alias para compatibilidade com imports existentes em select-character e class-change-panel */
export type Player = PlayerResponse

// ─── NPC types ────────────────────────────────────────────────────────────────

export interface NpcDTO {
  id: number
  name: string
  type: 'SHOP' | 'HEAL' | 'WARP' | 'NPC'
  x: number
  y: number
  spriteRef: string
}

export interface NpcShopResponse {
  npcName: string
  items: { itemId: number; itemName: string; price: number }[]
}

export interface NpcBuyRequest  { playerId: number; itemId: number; amount: number }
export interface NpcBuyResponse { message: string; itemName: string; remainingZenny: number }

export interface NpcHealResponse { message: string; hp: number; sp: number }

export interface NpcWarpResponse { newMap: string; x: number; y: number }

export interface NpcSellRequest  { playerId: number; playerItemId: string; quantity: number }
export interface NpcSellResponse { message: string; remainingZenny: number }
