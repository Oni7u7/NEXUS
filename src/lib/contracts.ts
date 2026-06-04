/**
 * NEXUS — Integración con el contrato NexusRegistry via Viem
 *
 * NexusRegistry está deployado en Sepolia (chain ID 11155111).
 * El agente usa su AGENT_PRIVATE_KEY para firmar transacciones de escritura.
 *
 * Modo mock si NEXUS_REGISTRY_ADDRESS es 0x000... o no está configurado.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
} from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// ── ABI mínimo del contrato NexusRegistry ────────────────────────────────────

const NEXUS_REGISTRY_ABI = [
  {
    name: 'recordSale',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'creator', type: 'address' },
      { name: 'grossMXNCents', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'getCreatorEarnings',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'isAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'totalEarnedMXN',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSales',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'protocolFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// ── Helpers de inicialización ────────────────────────────────────────────────

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function getContractAddress(): `0x${string}` | null {
  const addr = process.env.NEXUS_REGISTRY_ADDRESS
  if (!addr || addr === ZERO_ADDRESS || addr.startsWith('0x000000')) return null
  return addr as `0x${string}`
}

function getPublicClient() {
  return createPublicClient({
    chain: sepolia,
    transport: http(
      process.env.RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  })
}

function getWalletClient() {
  const privateKey = process.env.AGENT_PRIVATE_KEY
  if (!privateKey) return null

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(
      process.env.RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  })
}

// ── Objeto principal exportado ───────────────────────────────────────────────

export const nexusRegistry = {

  /**
   * Registra una venta onchain. Solo agentes autorizados pueden llamar esto.
   */
  async recordSale(params: {
    creatorAddress: string
    grossMXNCents: bigint   // ej: 284750n para $2,847.50 MXN
    tokenId: number
  }): Promise<{ txHash: string; mock?: boolean }> {
    const contractAddress = getContractAddress()

    if (!contractAddress) {
      console.log('[NEXUS:contracts] MODO MOCK — contrato no deployado')
      return { txHash: `0xMOCKRECORD${Date.now().toString(16).toUpperCase()}`, mock: true }
    }

    const walletClient = getWalletClient()
    if (!walletClient) {
      console.log('[NEXUS:contracts] MODO MOCK — AGENT_PRIVATE_KEY no configurado')
      return { txHash: `0xMOCKRECORD${Date.now().toString(16).toUpperCase()}`, mock: true }
    }

    try {
      const publicClient = getPublicClient()

      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: NEXUS_REGISTRY_ABI,
        functionName: 'recordSale',
        args: [
          params.creatorAddress as `0x${string}`,
          params.grossMXNCents,
          BigInt(params.tokenId),
        ],
        account: walletClient.account,
      })

      const txHash = await walletClient.writeContract(request)
      console.log('[NEXUS:contracts] recordSale tx:', txHash)
      return { txHash }
    } catch (error) {
      console.error('[NEXUS:contracts] Error en recordSale:', error)
      // En modo demo, retorna mock en lugar de fallar
      return { txHash: `0xMOCKRECORD${Date.now().toString(16).toUpperCase()}`, mock: true }
    }
  },

  /**
   * Lectura pública — cuánto ha ganado un creador en total (en centavos MXN).
   */
  async getCreatorEarnings(creatorAddress: string): Promise<number> {
    const contractAddress = getContractAddress()

    if (!contractAddress) {
      console.log('[NEXUS:contracts] MODO MOCK — contrato no deployado')
      return 0
    }

    try {
      const publicClient = getPublicClient()
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: NEXUS_REGISTRY_ABI,
        functionName: 'getCreatorEarnings',
        args: [creatorAddress as `0x${string}`],
      })
      return Number(result)
    } catch (error) {
      console.error('[NEXUS:contracts] Error en getCreatorEarnings:', error)
      return 0
    }
  },

  /**
   * Lectura admin — totales del protocolo (totalSales y protocolFees en centavos MXN).
   */
  async adminStats(): Promise<{ totalSales: number; protocolFees: number }> {
    const contractAddress = getContractAddress()

    if (!contractAddress) {
      console.log('[NEXUS:contracts] MODO MOCK — adminStats simulado')
      return { totalSales: 3, protocolFees: 300 }
    }

    try {
      const publicClient = getPublicClient()
      const [sales, fees] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: NEXUS_REGISTRY_ABI,
          functionName: 'totalSales',
          args: [],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: NEXUS_REGISTRY_ABI,
          functionName: 'protocolFees',
          args: [],
        }),
      ])
      return { totalSales: Number(sales), protocolFees: Number(fees) }
    } catch (error) {
      console.error('[NEXUS:contracts] Error en adminStats:', error)
      return { totalSales: 0, protocolFees: 0 }
    }
  },

  /**
   * Lectura pública — verifica si una address es agente registrado.
   */
  async isAgent(address: string): Promise<boolean> {
    const contractAddress = getContractAddress()

    if (!contractAddress) {
      console.log('[NEXUS:contracts] MODO MOCK — contrato no deployado')
      return false
    }

    try {
      const publicClient = getPublicClient()
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: NEXUS_REGISTRY_ABI,
        functionName: 'isAgent',
        args: [address as `0x${string}`],
      })
      return Boolean(result)
    } catch (error) {
      console.error('[NEXUS:contracts] Error en isAgent:', error)
      return false
    }
  },
}
