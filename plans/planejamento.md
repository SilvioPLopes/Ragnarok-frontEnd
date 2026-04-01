Contexto: Projeto Next.js de um clone de Ragnarok Online.
Já existem: MapPanel, autenticação JWT, Sonner para toasts, e chamadas aos endpoints antigos de loja.

REGRA ABSOLUTA: Não toque nos endpoints existentes abaixo. Eles continuam funcionando em paralelo:
- GET  /api/shop/npc/items
- POST /api/shop/npc/buy    (body: { playerId, itemId, quantity })
- POST /api/shop/npc/sell   (body: { playerId, playerItemId, quantity })

---

## PARTE 1 — LIMPEZA DE LÓGICA DE NEGÓCIO VAZADA

Faça uma busca no projeto por estas lógicas e remova-as do frontend:
- Qualquer cálculo que some ou subtraia Zenny localmente
- Qualquer código que modifique o inventário sem chamar o backend
- Qualquer cálculo de cura de HP/SP

Substitua pela exibição do resultado retornado pelo backend. Não mexa em nada além desses pontos.

---

## PARTE 2 — TIPOS TYPESCRIPT

Crie ou atualize o arquivo `types/npc.ts` com as interfaces abaixo.
Não altere types existentes de outros módulos.
```typescript
// types/npc.ts

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

export interface NpcHealRequest  { playerId: number }
export interface NpcHealResponse { message: string; hp: number; sp: number }

export interface NpcWarpRequest  { playerId: number; destination: string }
export interface NpcWarpResponse { newMap: string; x: number; y: number }

// Sell usa o endpoint antigo — mapeado aqui apenas para referência
export interface NpcSellRequest  { playerId: number; playerItemId: number; quantity: number }
export interface NpcSellResponse { message: string; remainingZenny: number }
```

---

## PARTE 3 — CLIENTE DE API (lib/api.ts)

Adicione um namespace `npcApi` ao arquivo `lib/api.ts` existente.
NÃO remova as funções já existentes nesse arquivo.
```typescript
// Adicionar ao lib/api.ts existente

export const npcApi = {
  // Listar NPCs de um mapa
  getNpcsByMap: (mapName: string): Promise<NpcDTO[]> =>
    apiClient.get(`/api/maps/${mapName}/npcs`),

  // Ver itens de uma loja (apenas para type: SHOP)
  getShop: (npcId: number): Promise<NpcShopResponse> =>
    apiClient.get(`/api/npcs/${npcId}/shop`),

  // Comprar item em NPC específico
  // ATENÇÃO: playerId vem do estado de auth, não pode ser hardcoded
  buyItem: (npcId: number, body: NpcBuyRequest): Promise<NpcBuyResponse> =>
    apiClient.post(`/api/npcs/${npcId}/buy`, body),

  // Curar HP/SP na Kafra
  heal: (npcId: number, body: NpcHealRequest): Promise<NpcHealResponse> =>
    apiClient.post(`/api/npcs/${npcId}/heal`, body),

  // Usar portal de warp
  warp: (npcId: number, body: NpcWarpRequest): Promise<NpcWarpResponse> =>
    apiClient.post(`/api/npcs/${npcId}/warp`, body),

  // Vender item — usa endpoint antigo (não é por NPC específico)
  sellItem: (body: NpcSellRequest): Promise<NpcSellResponse> =>
    apiClient.post(`/api/shop/npc/sell`, body),
}
```

Regra de auth: todos os endpoints POST precisam do header `Authorization: Bearer <token>`.
Verifique se o `apiClient` já envia esse header automaticamente. Se sim, não adicione manualmente.

---

## PARTE 4 — COMPONENTE CityPanel

Crie `components/CityPanel.tsx`.

**Props:**
```typescript
interface CityPanelProps {
  mapName: string
  playerId: number
  onWarp: (newMap: string, x: number, y: number) => void
  onZennyChange?: (newZenny: number) => void
  onHpSpChange?: (hp: number, sp: number) => void
}
```

**Comportamento por tipo de NPC:**

### Tipo SHOP
- Ao clicar: abre modal com lista de itens (chama `npcApi.getShop(npc.id)`)
- Modal tem duas abas: **Comprar** e **Vender**

**Aba Comprar:**
- Lista os itens com nome e preço
- Campo numérico para quantidade (mínimo 1)
- Botão "Comprar" chama `npcApi.buyItem(npc.id, { playerId, itemId, amount })`
- No sucesso: toast com `response.message` e chama `onZennyChange(response.remainingZenny)`
- No erro 400: toast com `response.error`

**Aba Vender:**
- Lista os itens do inventário do player (busque do estado global existente)
- Mostra o preço de venda = metade do preço do item (calcule apenas para exibição — o backend recalcula)
- Campo numérico para quantidade
- Botão "Vender" chama `npcApi.sellItem({ playerId, playerItemId: item.id, quantity })`
  - ATENÇÃO: `playerItemId` é o ID do item no inventário do player, não o itemId do catálogo
- No sucesso: toast com `response.message` e chama `onZennyChange(response.remainingZenny)`
- No erro 400: toast com `response.error`

### Tipo HEAL
- Ao clicar: chama `npcApi.heal(npc.id, { playerId })` diretamente (sem modal)
- Toast com `response.message`
- Chama `onHpSpChange(response.hp, response.sp)`
- No erro 400: toast com `response.error`

### Tipo WARP
- Ao clicar: abre modal simples com lista de destinos disponíveis
- Destinos fixos de Prontera: `prt_in`, `prt_fild08`, `prt_fild05`, `prt_fild06`, `prt_church`
- Ao confirmar destino: chama `npcApi.warp(npc.id, { playerId, destination })`
- No sucesso: fecha modal e chama `onWarp(response.newMap, response.x, response.y)`
- No erro 400: toast com `response.error` (ex: "Destino não disponível neste warp: X")

### Tipo NPC (genérico)
- Ao clicar: exibe toast simples com o nome do NPC + " não tem interação disponível"
- Não faz chamada de API

---

## PARTE 5 — REGRAS DE SPRITES (CRÍTICO — sem CDN externo)

Crie o componente de sprite inline dentro do CityPanel:
```tsx
const NpcSprite = ({ spriteRef, name }: { spriteRef: string; name: string }) => {
  const [imgError, setImgError] = useState(false)

  if (imgError) {
    return (
      <div className="w-16 h-16 bg-gray-700 border border-gray-500 flex items-center 
                      justify-center rounded text-xs text-gray-300 text-center p-1">
        {name}
      </div>
    )
  }

  return (
    <img
      src={`/sprites/npcs/${spriteRef}.gif`}
      alt={name}
      width={64}
      height={64}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  )
}
```

Regra do mapa no fundo do painel:
```tsx
<div
  className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden mb-4"
  style={{
    backgroundImage: `url('/sprites/maps/${mapName}.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  {/* NPCs renderizados por cima */}
</div>
```

Se `/sprites/maps/${mapName}.jpg` não existir, o fundo `bg-gray-900` já serve como fallback visual.

---

## PARTE 6 — INTEGRAÇÃO NA TELA PRINCIPAL

Localize o componente da tela principal do jogo (provavelmente onde o `MapPanel` é usado).

Adicione o `CityPanel` passando:
- `mapName`: o mapa atual do player (estado global)
- `playerId`: o id do player autenticado (estado de auth)
- `onWarp`: callback que atualiza o estado de mapa atual
- `onZennyChange`: callback que atualiza o Zenny exibido no HUD
- `onHpSpChange`: callback que atualiza HP/SP exibidos no HUD

O `CityPanel` e o `MapPanel` podem coexistir — não remova o MapPanel.

---

## PARTE 7 — TRATAMENTO DE ERROS (padrão obrigatório)

Todos os erros da API seguem o formato `{ "error": "mensagem" }`.

Implemente um helper reutilizável:
```typescript
// lib/api-error.ts
export const extractApiError = (error: unknown): string => {
  if (error instanceof Response || (error as any)?.error) {
    return (error as any).error ?? 'Erro desconhecido'
  }
  return 'Erro de conexão com o servidor'
}
```

Use assim nos catch:
```typescript
} catch (err) {
  toast.error(extractApiError(err))
}
```

HTTP 401 (JWT inválido): redirecione para login — verifique se o `apiClient` já trata isso globalmente.

---

Use Tailwind para todos os estilos. Não crie arquivos CSS separados.
Não use `<form>` — use `onClick` e `onChange` diretamente nos elementos.