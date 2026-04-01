// lib/api.ts
// No 'use client' — this module has no React hooks and must be importable from any context

import type {
  PlayerResponse, SkillRow, InventoryItem,
  MapInfo, WalkResult, BattleResult, FraudResponse, RequiredAction,
  NpcDTO, NpcShopResponse, NpcBuyRequest, NpcBuyResponse,
  NpcHealResponse, NpcWarpResponse, NpcSellRequest, NpcSellResponse,
} from './types'
import { toast } from 'sonner'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// ─── Fraud handler factory ────────────────────────────────────────────────────
// Needs router + showCaptcha injected at runtime (to avoid circular deps with context).
// Call configureFraudHandler() once inside GameProvider.

type FraudHandlerDeps = {
  push: (path: string) => void
  showCaptcha: () => void
}

let fraudHandlerDeps: FraudHandlerDeps | null = null

export function configureFraudHandler(deps: FraudHandlerDeps) {
  fraudHandlerDeps = deps
}

export function handleFraudResponse(fraud: FraudResponse): void {
  if (!fraudHandlerDeps) {
    console.warn('[antifraude] handler not configured', fraud)
    return
  }
  const { push, showCaptcha } = fraudHandlerDeps

  if (fraud.verdict === 'BLOCKED') {
    localStorage.removeItem('playerId')
    toast.error('Conta bloqueada')
    push('/')
    return
  }

  const action: RequiredAction = fraud.requiredAction
  switch (action) {
    case 'DROP_SESSION':
      localStorage.removeItem('playerId')
      push('/')
      break
    case 'SHOW_CAPTCHA':
      showCaptcha()
      break
    case 'CANCEL_ACTION':
      toast.error('Ação cancelada pelo sistema de segurança')
      console.warn('[antifraude] CANCEL_ACTION', fraud.reason)
      break
    case 'FLAG_FOR_REVIEW':
    case 'ALERT_ONLY':
      console.warn('[antifraude]', action, fraud)
      break
    case 'NONE':
    default:
      break
  }
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const url = `${BASE_URL}${path}`
  const method = options.method ?? 'GET'
  const bodyParsed = options.body ? (() => { try { return JSON.parse(options.body as string) } catch { return options.body } })() : undefined

  console.log(`[apiFetch] → ${method} ${path}`, bodyParsed ?? '(no body)', {
    hasToken: !!token,
  })

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Action-Timestamp': Date.now().toString(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    let errorBody: unknown = null
    try {
      errorBody = await res.json()
      message = (errorBody as any)?.error ?? (errorBody as any)?.message ?? message
    } catch { /* no body */ }
    console.error(`[apiFetch] ✗ ${method} ${path}`, {
      status: res.status,
      sentBody: bodyParsed,
      errorBody,
    })
    throw new Error(message)
  }

  console.log(`[apiFetch] ✓ ${method} ${path}`, { status: res.status })

  // Handle void responses (e.g., travel returns 200 with no body)
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return undefined as T
  }

  const data = await res.json() as T & { fraud?: FraudResponse }
  if (data?.fraud) {
    handleFraudResponse(data.fraud)
  }
  return data
}

// ─── API namespaces ───────────────────────────────────────────────────────────

export const playerApi = {
  list(): Promise<PlayerResponse[]> {
    return apiFetch<PlayerResponse[]>('/api/players')
  },

  get(id: number): Promise<PlayerResponse> {
    return apiFetch<PlayerResponse>(`/api/players/${id}`)
  },

  create(name: string, jobClass: string): Promise<PlayerResponse> {
    return apiFetch<PlayerResponse>('/api/players', {
      method: 'POST',
      body: JSON.stringify({ name, jobClass }),
    })
  },

  resurrect(id: number): Promise<PlayerResponse> {
    return apiFetch<PlayerResponse>(`/api/players/${id}/resurrect`, { method: 'POST' })
  },

  listAvailableClasses(id: number): Promise<string[]> {
    return apiFetch<string[]>(`/api/players/${id}/class-change`)
  },

  changeClass(id: number, targetClass: string): Promise<PlayerResponse> {
    return apiFetch<PlayerResponse>(`/api/players/${id}/class-change`, {
      method: 'POST',
      body: JSON.stringify({ targetClass }),
    })
  },

  // ⚠ BACKEND NEEDED: DELETE /api/players/{id} — deve validar ownership via JWT e retornar 204
  delete(id: number): Promise<void> {
    return apiFetch<void>(`/api/players/${id}`, { method: 'DELETE' })
  },

  /** stats keys use "int" (not "intelligence") per API contract */
  distributeStats(
    id: number,
    stats: Partial<Record<'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk', number>>
  ): Promise<PlayerResponse> {
    return apiFetch<PlayerResponse>(`/api/players/${id}/stats`, {
      method: 'PUT',
      body: JSON.stringify(stats),
    })
  },
}

export const battleApi = {
  attack(playerId: number, monsterId: number): Promise<BattleResult> {
    return apiFetch<BattleResult>('/api/battle/attack', {
      method: 'POST',
      body: JSON.stringify({ playerId, monsterId }),
    })
  },
}

export const skillApi = {
  list(playerId: number): Promise<SkillRow[]> {
    return apiFetch<SkillRow[]>(`/api/players/${playerId}/skills`)
  },

  /** skillName must be skill.aegisName, NOT skill.name */
  learn(playerId: number, aegisName: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(
      `/api/players/${playerId}/skills/${aegisName}/learn`,
      { method: 'POST' }
    )
  },

  /** skillName must be skill.aegisName, NOT skill.name.
   *  Pass monsterId only for targetable (offensive) skills — self/buff skills must omit it. */
  use(
    playerId: number,
    aegisName: string,
    monsterId?: number
  ): Promise<{ message: string }> {
    const body = monsterId != null ? { monsterId } : {}
    console.log('[skillApi.use]', { playerId, aegisName, monsterId, body })
    return apiFetch<{ message: string }>(
      `/api/players/${playerId}/skills/${aegisName}/use`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    )
  },
}

export const inventoryApi = {
  list(playerId: number): Promise<InventoryItem[]> {
    return apiFetch<InventoryItem[]>(`/api/players/${playerId}/inventory`)
  },

  use(playerId: number, itemId: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(
      `/api/players/${playerId}/inventory/${itemId}/use`,
      { method: 'POST' }
    )
  },

  equip(playerId: number, itemUuid: string): Promise<{ result: string }> {
    return apiFetch<{ result: string }>(
      `/api/players/${playerId}/inventory/${itemUuid}/equip`,
      { method: 'POST' }
    )
  },
}

export const mapApi = {
  get(playerId: number): Promise<MapInfo> {
    return apiFetch<MapInfo>(`/api/players/${playerId}/map`)
  },

  walk(playerId: number): Promise<WalkResult> {
    return apiFetch<WalkResult>(`/api/players/${playerId}/map/walk`, {
      method: 'POST',
    })
  },

  /** Returns void — core responds 200 with no body */
  travel(playerId: number, destination: string): Promise<void> {
    return apiFetch<void>(`/api/players/${playerId}/map/travel`, {
      method: 'POST',
      body: JSON.stringify({ destination }),
    })
  },
}

export const npcApi = {
  getNpcsByMap(mapName: string): Promise<NpcDTO[]> {
    return apiFetch<NpcDTO[]>(`/api/maps/${mapName}/npcs`)
  },

  getShop(npcId: number): Promise<NpcShopResponse> {
    return apiFetch<NpcShopResponse>(`/api/npcs/${npcId}/shop`)
  },

  buyItem(npcId: number, body: NpcBuyRequest): Promise<NpcBuyResponse> {
    return apiFetch<NpcBuyResponse>(`/api/npcs/${npcId}/buy`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  heal(npcId: number, playerId: number): Promise<NpcHealResponse> {
    return apiFetch<NpcHealResponse>(`/api/npcs/${npcId}/heal`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    })
  },

  warp(npcId: number, playerId: number, destination: string): Promise<NpcWarpResponse> {
    return apiFetch<NpcWarpResponse>(`/api/npcs/${npcId}/warp`, {
      method: 'POST',
      body: JSON.stringify({ playerId, destination }),
    })
  },

  sellItem(body: NpcSellRequest): Promise<NpcSellResponse> {
    return apiFetch<NpcSellResponse>('/api/shop/npc/sell', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}

export const authApi = {
  login(username: string, password: string): Promise<{ token: string; accountId: number }> {
    return apiFetch('/api/accounts/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  register(username: string, password: string, email: string): Promise<{ accountId: number }> {
    return apiFetch('/api/accounts/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    })
  },
}
