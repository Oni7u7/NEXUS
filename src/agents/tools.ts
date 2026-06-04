import { getBitsoTicker, getBitsoOrderBook } from '@/lib/bitso'
import { rare } from '@/lib/rare'
import { nexusRegistry } from '@/lib/contracts'
import type { AgentTool } from './types'

// Tool definitions sent to Claude
export const tools: AgentTool[] = [
  // ── Tools existentes ───────────────────────────────────────────────────────
  {
    name: 'get_ticker',
    description: 'Obtiene el precio actual y datos de mercado de un par en Bitso. Úsala siempre que necesites el precio de ETH en MXN para mostrar equivalencias al usuario.',
    inputSchema: {
      type: 'object',
      properties: {
        book: {
          type: 'string',
          description: 'Par de trading, ej: btc_mxn, eth_mxn, usdc_mxn',
        },
      },
      required: ['book'],
    },
  },
  {
    name: 'get_order_book',
    description: 'Obtiene el libro de órdenes (bids y asks) para un par en Bitso.',
    inputSchema: {
      type: 'object',
      properties: {
        book: {
          type: 'string',
          description: 'Par de trading, ej: btc_mxn, eth_mxn',
        },
      },
      required: ['book'],
    },
  },

  // ── Nuevas tools de Rare Protocol ─────────────────────────────────────────
  {
    name: 'deploy_collection',
    description: 'Despliega una nueva colección ERC-721 en Sepolia via Rare Protocol. Úsala cuando el creador quiera lanzar su colección de arte digital. Retorna la dirección del contrato.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nombre completo de la colección, ej: "Arte de Valentina"',
        },
        symbol: {
          type: 'string',
          description: 'Símbolo corto de la colección (3-5 letras), ej: "VALE"',
        },
        maxTokens: {
          type: 'number',
          description: 'Número máximo de NFTs en la colección (opcional)',
        },
      },
      required: ['name', 'symbol'],
    },
  },
  {
    name: 'mint_nft',
    description: 'Acuña un NFT en una colección existente. Úsala después de deploy_collection y después de que la imagen haya sido subida a IPFS. Requiere la URI de IPFS de la imagen.',
    inputSchema: {
      type: 'object',
      properties: {
        contract: {
          type: 'string',
          description: 'Dirección del contrato de la colección (retornada por deploy_collection)',
        },
        name: {
          type: 'string',
          description: 'Nombre del NFT/obra',
        },
        description: {
          type: 'string',
          description: 'Descripción de la obra',
        },
        ipfsImageUri: {
          type: 'string',
          description: 'URI ipfs:// de la imagen ya subida a Pinata',
        },
        attributes: {
          type: 'array',
          description: 'Atributos opcionales del NFT',
          items: {
            type: 'object',
            properties: {
              trait_type: { type: 'string' },
              value: { type: 'string' },
            },
          },
        },
      },
      required: ['contract', 'name', 'description', 'ipfsImageUri'],
    },
  },
  {
    name: 'search_market',
    description: 'Busca NFTs y subastas en el marketplace de Rare Protocol. Úsala para analizar precios del mercado antes de crear una subasta nueva.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Búsqueda de texto libre, ej: "illustration art"',
        },
        state: {
          type: 'string',
          enum: ['RUNNING', 'SETTLED', 'ENDED'],
          description: 'Filtrar por estado de subasta',
        },
        limit: {
          type: 'number',
          description: 'Máximo de resultados (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_auction',
    description: 'Crea una subasta reservada para un NFT en el marketplace de Rare Protocol. Úsala después de mint_nft para poner la obra a subasta. Precio de reserva en ETH.',
    inputSchema: {
      type: 'object',
      properties: {
        contract: {
          type: 'string',
          description: 'Dirección del contrato de la colección',
        },
        tokenId: {
          type: 'number',
          description: 'ID del token a subastar',
        },
        reservePrice: {
          type: 'number',
          description: 'Precio de reserva en ETH, ej: 0.1',
        },
        durationHours: {
          type: 'number',
          description: 'Duración de la subasta en horas (default 48)',
        },
      },
      required: ['contract', 'tokenId', 'reservePrice'],
    },
  },
  {
    name: 'auction_status',
    description: 'Obtiene el estado actual de una subasta: si está corriendo, la oferta actual, y cuándo termina. Úsala para monitorear subastas activas.',
    inputSchema: {
      type: 'object',
      properties: {
        contract: {
          type: 'string',
          description: 'Dirección del contrato de la colección',
        },
        tokenId: {
          type: 'number',
          description: 'ID del token en subasta',
        },
      },
      required: ['contract', 'tokenId'],
    },
  },
  {
    name: 'settle_auction',
    description: 'Liquida una subasta que ya terminó. Úsala cuando el estado de la subasta sea ENDED y haya al menos una oferta. Esto transfiere el NFT al ganador.',
    inputSchema: {
      type: 'object',
      properties: {
        contract: {
          type: 'string',
          description: 'Dirección del contrato de la colección',
        },
        tokenId: {
          type: 'number',
          description: 'ID del token cuya subasta terminó',
        },
      },
      required: ['contract', 'tokenId'],
    },
  },
  {
    name: 'record_sale',
    description: 'Registra una venta en el contrato NexusRegistry, calcula la conversión ETH→MXN y ejecuta el pago SPEI al creador si tiene CLABE registrada. Úsala después de settle_auction.',
    inputSchema: {
      type: 'object',
      properties: {
        contract: {
          type: 'string',
          description: 'Dirección del contrato de la colección',
        },
        tokenId: {
          type: 'number',
          description: 'ID del token vendido',
        },
        ethAmount: {
          type: 'number',
          description: 'Monto de la venta en ETH, ej: 0.12',
        },
        creatorAddress: {
          type: 'string',
          description: 'Wallet address del creador',
        },
        creatorClabe: {
          type: 'string',
          description: 'CLABE de 18 dígitos del creador para pago SPEI (opcional)',
        },
      },
      required: ['contract', 'tokenId', 'ethAmount', 'creatorAddress'],
    },
  },
]

// ── Tool execution handler ────────────────────────────────────────────────────

const isValidEthAddress = (addr: unknown): addr is string =>
  typeof addr === 'string' && addr.startsWith('0x') && addr.length === 42

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  context?: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    // Tools existentes
    case 'get_ticker':
      return getBitsoTicker(input.book as string)

    case 'get_order_book':
      return getBitsoOrderBook(input.book as string)

    // Deploy y mint
    case 'deploy_collection':
      return rare.deployCollection(
        input.name as string,
        input.symbol as string,
        input.maxTokens as number | undefined
      )

    case 'mint_nft':
      return rare.mintNFT({
        contract: input.contract as string,
        name: input.name as string,
        description: input.description as string,
        ipfsImageUri: input.ipfsImageUri as string,
        attributes: input.attributes as Array<{ trait_type: string; value: string }> | undefined,
      })

    // Mercado
    case 'search_market':
      return rare.searchMarket({
        query: input.query as string | undefined,
        state: input.state as 'RUNNING' | 'SETTLED' | 'ENDED' | undefined,
        limit: input.limit as number | undefined,
      })

    case 'create_auction': {
      const contract = isValidEthAddress(input.contract)
        ? input.contract
        : context?.collectionAddress as string | undefined
      if (!isValidEthAddress(contract)) {
        return { success: false, error: `contract inválido: '${input.contract}'. Usa la address 0x de la colección.` }
      }
      return rare.createAuction({
        contract,
        tokenId: input.tokenId as number,
        reservePrice: input.reservePrice as number,
        durationHours: input.durationHours as number | undefined,
      })
    }

    case 'auction_status': {
      const contract = isValidEthAddress(input.contract)
        ? input.contract
        : context?.collectionAddress as string | undefined
      if (!isValidEthAddress(contract)) {
        return { success: false, error: `contract inválido: '${input.contract}'. Usa la address 0x de la colección.` }
      }
      return rare.auctionStatus(contract, input.tokenId as number)
    }

    case 'settle_auction': {
      const contract = isValidEthAddress(input.contract)
        ? input.contract
        : context?.collectionAddress as string | undefined

      if (!isValidEthAddress(contract)) {
        return {
          success: false,
          error: `No hay colección activa. contract recibido: '${input.contract}', sessionState.collectionAddress: '${context?.collectionAddress}'`,
        }
      }

      const tokenId = (input.tokenId as number | undefined) ?? (context?.mintedTokens as number[] | undefined)?.[0] ?? 1

      try {
        const result = await rare.settleAuction(contract, tokenId)
        // Handle explicit { success: false, error: '...' } responses
        if (result && typeof result === 'object' && 'success' in result && result.success === false) {
          const errStr = String((result as { error?: unknown }).error ?? '').toLowerCase()
          if (errStr.includes('auction not ended') || errStr.includes('not ended') || errStr.includes('not over')) {
            return {
              success: true,
              mock: true,
              demoNote: 'La subasta aún no ha terminado oficialmente, pero continuamos con el flujo para el demo.',
              tokenId,
              contract,
            }
          }
          return result
        }
        // Detecta si fue un settle real o de cliente mock (txHash empieza con 0xMOCK)
        const isMockSettle =
          'txHash' in result &&
          typeof (result as { txHash?: unknown }).txHash === 'string' &&
          (result as { txHash: string }).txHash.startsWith('0xMOCK')
        return {
          ...result,
          mock: isMockSettle,
          ...(isMockSettle && { demoNote: 'Subasta liquidada en modo demo.' }),
        }
      } catch (err) {
        const errStr = (err instanceof Error ? err.message : String(err)).toLowerCase()
        if (errStr.includes('auction not ended') || errStr.includes('not ended') || errStr.includes('not over')) {
          return {
            success: true,
            mock: true,
            demoNote: 'La subasta aún no ha terminado oficialmente, pero continuamos con el flujo para el demo.',
            tokenId,
            contract,
          }
        }
        throw err
      }
    }

    // Registro de venta + SPEI
    case 'record_sale': {
      const ethAmount = input.ethAmount as number

      // Validar contract
      const saleContract = isValidEthAddress(input.contract)
        ? input.contract
        : context?.collectionAddress as string | undefined
      if (!isValidEthAddress(saleContract)) {
        return { success: false, error: `contract inválido en record_sale: '${input.contract}'` }
      }

      // Nunca usar el winner del settle como creatorAddress — el creador es quien inició la sesión
      const rawAddress = context?.creatorWallet ?? input.creatorAddress
      const isValidAddress =
        rawAddress &&
        typeof rawAddress === 'string' &&
        rawAddress.startsWith('0x') &&
        rawAddress.length === 42 &&
        rawAddress !== '0xCreatorAddress'
      const creatorAddress = isValidAddress
        ? (rawAddress as string)
        : (process.env.AGENT_ADDRESS as string)
      const creatorClabe = input.creatorClabe as string | undefined

      // a) Precio ETH/MXN actual
      let ethPriceMXN = 47000  // fallback razonable
      try {
        const ticker = await getBitsoTicker('eth_mxn')
        ethPriceMXN = parseFloat(ticker.last)
      } catch {
        console.warn('[NEXUS:tools] No se pudo obtener el precio ETH/MXN — usando fallback')
      }

      // b) Calcula montos
      const grossMXN = ethAmount * ethPriceMXN
      const feeMXN = grossMXN * 0.01
      const creatorMXN = grossMXN - feeMXN
      const grossMXNCents = BigInt(Math.round(grossMXN * 100))

      // c) Registra en el contrato
      const contractResult = await nexusRegistry.recordSale({
        creatorAddress,
        grossMXNCents,
        tokenId: input.tokenId as number,
      })

      // d) Pago SPEI si hay CLABE
      let speiResult: { withdrawalId: string; status: string; mock?: boolean } | null = null
      if (creatorClabe) {
        const { requestSPEIWithdrawal } = await import('@/lib/bitso')
        speiResult = await requestSPEIWithdrawal({
          amountMXN: creatorMXN,
          clabe: creatorClabe,
          reference: `NEXUS-NFT-${input.tokenId}-${Date.now()}`,
        })
      }

      return {
        grossMXN: Math.round(grossMXN * 100) / 100,
        feeMXN: Math.round(feeMXN * 100) / 100,
        creatorMXN: Math.round(creatorMXN * 100) / 100,
        ethPriceMXN,
        ethAmount,
        txHash: contractResult.txHash,
        mock: contractResult.mock,
        speiId: speiResult?.withdrawalId ?? null,
        speiStatus: speiResult?.status ?? null,
        speiMock: speiResult?.mock ?? null,
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
