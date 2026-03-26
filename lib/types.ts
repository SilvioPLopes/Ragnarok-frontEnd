// lib/types.ts

export interface PlayerResponse {
  id: number
  name: string
  jobClass: string
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
}

export interface InventoryItem {
  id: string              // UUID
  name: string
  type: 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'ETC'
  amount: number
  equipped: boolean
}

export interface MapInfo {
  mapName: string
  portals: string[]       // portal destination names
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
  fraud?: FraudResponse
}

export interface Encounter {
  monsterId: number
  monsterName: string
  monsterHpInitial: number   // display only, does not change
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
