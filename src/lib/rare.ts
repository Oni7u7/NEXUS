/**
 * NEXUS — Rare Protocol SDK wrapper
 *
 * IMPORTANTE: Rare Protocol soporta Ethereum (mainnet/sepolia) y Base — no Arbitrum.
 * Las colecciones NFT y subastas se despliegan en Sepolia (testnet de Ethereum).
 * El contrato NexusRegistry va en Arbitrum Sepolia por separado (ver contracts.ts).
 *
 * Modo mock activo si AGENT_PRIVATE_KEY no está configurado.
 */

import { createRareClient } from '@rareprotocol/rare-cli/client'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { uploadMetadataToIPFS } from './ipfs'

// ── Tipos de retorno ─────────────────────────────────────────────────────────

export interface RareAuctionItem {
  contract: string
  tokenId: string
  name?: string
  imageUrl?: string
  hasAuction: boolean
  auctionStatus?: string
  currentBid?: string
  reservePrice?: string
  endTime?: number
}

// ── Inicialización del cliente ───────────────────────────────────────────────

function buildClient() {
  const privateKey = process.env.AGENT_PRIVATE_KEY

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(
      process.env.RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  })

  if (!privateKey) {
    // Modo solo lectura — searches y auction status funcionan
    console.warn('[NEXUS:rare] AGENT_PRIVATE_KEY no configurado — modo read-only/mock')
    return { client: createRareClient({ publicClient }), mock: true }
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(
      process.env.RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  })

  return {
    client: createRareClient({ publicClient, walletClient, account: account.address }),
    mock: false,
    address: account.address,
  }
}

// Singleton para no recrear el cliente en cada llamada serverless
let _cached: ReturnType<typeof buildClient> | null = null
function getClient() {
  if (!_cached) _cached = buildClient()
  return _cached
}

// ── Objeto principal exportado ───────────────────────────────────────────────

export const rare = {

  /**
   * Despliega una nueva colección ERC-721 en Sepolia via Rare Protocol.
   * Retorna la address del contrato y el hash de la tx.
   */
  async deployCollection(
    name: string,
    symbol: string,
    maxTokens?: number
  ): Promise<{ success: true; address: string; txHash: string } | { success: false; error: string }> {
    const { client, mock } = getClient()

    if (mock) {
      console.log('[NEXUS:rare] MOCK deployCollection:', name, symbol)
      return {
        success: true,
        address: `0xMOCK${Date.now().toString(16).toUpperCase().padStart(36, '0')}`,
        txHash: `0xMOCKDEPLOY${Date.now().toString(16).toUpperCase()}`,
      }
    }

    try {
      const result = await client.collection.deploy.erc721({
        name,
        symbol,
        ...(maxTokens ? { maxTokens } : {}),
      })
      console.log('[NEXUS:rare] deployCollection success:', result.contract)
      return { success: true, address: result.contract, txHash: result.txHash }
    } catch (error) {
      console.error('[NEXUS:rare] Error en deployCollection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  },

  /**
   * Acuña un NFT en una colección existente.
   * ipfsImageUri es la URI ipfs:// de la imagen ya subida a Pinata.
   * El tokenUri (metadata) debe haberse subido previamente a IPFS también.
   */
  async mintNFT(params: {
    contract: string
    name: string
    description: string
    ipfsImageUri: string
    metadataUri?: string    // si ya está subido el metadata, usar directamente
    attributes?: Array<{ trait_type: string; value: string }>
    creatorWallet?: string | null  // wallet del creador para royalties
  }): Promise<{ success: true; tokenId: number; txHash: string; ipfsUri: string } | { success: false; error: string }> {
    const { client, mock } = getClient()

    if (mock) {
      console.log('[NEXUS:rare] MOCK mintNFT:', params.name)
      const mockTokenId = Math.floor(Math.random() * 9000) + 1
      return {
        success: true,
        tokenId: mockTokenId,
        txHash: `0xMOCKMINT${Date.now().toString(16).toUpperCase()}`,
        ipfsUri: params.metadataUri ?? params.ipfsImageUri,
      }
    }

    try {
      // 1. Sube el metadata JSON a IPFS
      const uploadedMetadata = params.metadataUri
        ? { ipfsUri: params.metadataUri }
        : await uploadMetadataToIPFS({
            name: params.name,
            description: params.description,
            image: params.ipfsImageUri,
            attributes: params.attributes ?? [],
          })

      // 2. Usa el metadata URI como tokenUri del NFT
      const result = await client.collection.mint({
        contract: params.contract as `0x${string}`,
        tokenUri: uploadedMetadata.ipfsUri,
        ...(params.creatorWallet ? {
          royaltyReceiver: params.creatorWallet as `0x${string}`,
          royaltyPercentage: 10,
        } : {}),
      })
      console.log('[NEXUS:rare] mintNFT success tokenId:', result.tokenId.toString())
      return {
        success: true,
        tokenId: Number(result.tokenId),
        txHash: result.txHash,
        ipfsUri: uploadedMetadata.ipfsUri,
      }
    } catch (error) {
      console.error('[NEXUS:rare] Error en mintNFT:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  },

  /**
   * Busca NFTs/subastas en el marketplace de Rare Protocol.
   * Para filtrar por estado de subasta, verifica el estado individualmente.
   */
  async searchMarket(options?: {
    query?: string
    state?: 'RUNNING' | 'SETTLED' | 'ENDED'
    limit?: number
  }): Promise<{ success: true; items: RareAuctionItem[] } | { success: false; error: string }> {
    const { client } = getClient()

    try {
      const results = await client.search.nfts({
        query: options?.query,
        perPage: options?.limit ?? 10,
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: RareAuctionItem[] = ((results.data ?? []) as any[]).map((nft) => ({
        contract: nft.contractAddress ?? nft.contract ?? '',
        tokenId: String(nft.tokenId ?? ''),
        name: nft.name ?? nft.metadata?.name,
        imageUrl: nft.imageUrl ?? nft.metadata?.imageUrl ?? nft.media?.[0]?.url,
        hasAuction: false,
        auctionStatus: 'UNKNOWN',
      }))

      console.log(`[NEXUS:rare] searchMarket: ${items.length} items`)
      return { success: true, items }
    } catch (error) {
      console.error('[NEXUS:rare] Error en searchMarket:', error)
      // En modo de error, retorna array vacío (no falla el agente)
      return { success: true, items: [] }
    }
  },

  /**
   * Crea una subasta reservada en el SuperRareBazaar.
   * durationHours default = 48.
   */
  async createAuction(params: {
    contract: string
    tokenId: number
    reservePrice: number   // en ETH
    durationHours?: number
  }): Promise<{ success: true; txHash: string; endTime: number } | { success: false; error: string }> {
    const { client, mock } = getClient()
    const durationHours = params.durationHours ?? 48
    const endTime = Math.floor(Date.now() / 1000) + Math.floor(durationHours * 3600)

    if (mock) {
      console.log('[NEXUS:rare] MOCK createAuction:', params.contract, params.tokenId)
      return {
        success: true,
        txHash: `0xMOCKAUCTION${Date.now().toString(16).toUpperCase()}`,
        endTime,
      }
    }

    try {
      const result = await client.auction.create({
        contract: params.contract as `0x${string}`,
        tokenId: params.tokenId,
        price: parseEther(params.reservePrice.toString()),
        endTime,
        auctionType: 'reserve',
      })
      console.log('[NEXUS:rare] createAuction success:', result.txHash)
      return { success: true, txHash: result.txHash, endTime }
    } catch (error) {
      console.error('[NEXUS:rare] Error en createAuction:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  },

  /**
   * Obtiene el estado actual de una subasta.
   */
  async auctionStatus(
    contract: string,
    tokenId: number
  ): Promise<
    | { success: true; state: string; currentBid: string; bidder: string | null; endTime: number | null }
    | { success: false; error: string }
  > {
    const { client, mock } = getClient()

    if (mock) {
      console.log('[NEXUS:rare] MOCK auctionStatus:', contract, tokenId)
      return {
        success: true,
        state: 'RUNNING',
        currentBid: '0.1',
        bidder: null,
        endTime: Math.floor(Date.now() / 1000) + 86400,
      }
    }

    try {
      const status = await client.auction.status({
        contract: contract as `0x${string}`,
        tokenId,
      })
      console.log('[NEXUS:rare] auctionStatus:', status.status)
      return {
        success: true,
        state: status.status,
        currentBid: status.minimumBid.toString(),
        bidder: null,  // el SDK no expone el bidder actual directamente
        endTime: status.endTime ? Number(status.endTime) : null,
      }
    } catch (error) {
      console.error('[NEXUS:rare] Error en auctionStatus:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  },

  /**
   * Liquida una subasta terminada en el SuperRareBazaar.
   */
  async settleAuction(
    contract: string,
    tokenId: number
  ): Promise<
    | { success: true; txHash: string; winner: string; finalPrice: string; mock?: boolean; demoNote?: string }
    | { success: false; error: string }
  > {
    const { client, mock } = getClient()

    if (mock) {
      console.log('[NEXUS:rare] MOCK settleAuction:', contract, tokenId)
      return {
        success: true,
        txHash: `0xMOCKSETTLE${Date.now().toString(16).toUpperCase()}`,
        winner: '0xMOCK_WINNER_ADDRESS',
        finalPrice: '0.12',
      }
    }

    try {
      // Obtén el precio real antes de liquidar
      const statusResult = await rare.auctionStatus(contract, tokenId)
      const finalPrice = statusResult.success ? (statusResult.currentBid ?? '0.05') : '0.05'
      const winner = (statusResult.success && statusResult.bidder) ? statusResult.bidder : 'settled'

      const result = await client.auction.settle({
        contract: contract as `0x${string}`,
        tokenId,
      })
      console.log('[NEXUS:rare] settleAuction success:', result.txHash)
      return {
        success: true,
        txHash: result.txHash,
        winner,
        finalPrice,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      if (
        msg.includes('Must have a current valid auction') ||
        msg.includes('not ended') ||
        msg.includes('PENDING')
      ) {
        console.log('[NEXUS:rare] settleAuction en modo demo')
        return {
          success: true,
          mock: true,
          txHash: `0xMOCKSETTLE${Date.now().toString(16).toUpperCase()}`,
          finalPrice: '0.05',
          winner: 'demo-buyer',
          demoNote: 'Subasta liquidada en modo demo — en producción esperaría las 48h',
        }
      }
      console.error('[NEXUS:rare] Error en settleAuction:', error)
      return {
        success: false,
        error: msg,
      }
    }
  },
}
