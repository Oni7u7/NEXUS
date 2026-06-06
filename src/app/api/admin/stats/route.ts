import { NextResponse } from 'next/server'
import { createPublicClient, http, formatEther } from 'viem'
import { sepolia } from 'viem/chains'
import { nexusRegistry } from '@/lib/contracts'
import { getBitsoTicker, bitsoHMAC } from '@/lib/bitso'

export const runtime = 'nodejs'

const BITSO_BASE_URL = (process.env.BITSO_API_URL ?? 'https://bitso.com').replace(/\/$/, '')

export async function GET() {
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.RPC_URL ?? 'https://rpc.sepolia.org'),
    })

    const agentAddress = process.env.AGENT_ADDRESS?.trim() as `0x${string}` | undefined
    if (!agentAddress) {
      return NextResponse.json({ error: 'AGENT_ADDRESS no configurado' }, { status: 500 })
    }

    const isMockContract =
      !process.env.NEXUS_REGISTRY_ADDRESS ||
      process.env.NEXUS_REGISTRY_ADDRESS.startsWith('0x000')

    const [rawBalance, ticker] = await Promise.all([
      publicClient.getBalance({ address: agentAddress }),
      getBitsoTicker('eth_mxn').catch(() => null),
    ])

    const agentBalance = formatEther(rawBalance)
    const ethPriceMXN = ticker?.last ? parseFloat(ticker.last) : 0
    const agentBalanceMXN = parseFloat(agentBalance) * ethPriceMXN

    // Bitso Business balance
    let bitsoMXNBalance = '0'
    let bitsoUSDTBalance = '0'
    const bitsoEnvironment = process.env.BITSO_API_URL?.includes('stage') ? 'stage' : 'production'

    if (process.env.BITSO_API_KEY && process.env.BITSO_API_SECRET) {
      try {
        const balancePath = '/api/v3/balance/'
        const balanceRes = await fetch(`${BITSO_BASE_URL}${balancePath}`, {
          headers: {
            Authorization: bitsoHMAC('GET', balancePath),
          },
        })
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json()
          bitsoMXNBalance =
            balanceData.payload?.balances?.find((b: { currency: string }) => b.currency === 'mxn')
              ?.available ?? '0'
          bitsoUSDTBalance =
            balanceData.payload?.balances?.find((b: { currency: string }) => b.currency === 'usdt')
              ?.available ?? '0'
        }
      } catch {
        console.warn('[NEXUS:api/admin/stats] No se pudo obtener balance de Bitso')
      }
    }

    if (isMockContract) {
      return NextResponse.json({
        agentBalance,
        agentBalanceMXN: Math.round(agentBalanceMXN),
        totalSales: null,
        protocolFees: null,
        totalPaidMXN: null,
        contractMode: 'demo',
        bitsoMXNBalance,
        bitsoUSDTBalance,
        bitsoEnvironment,
      })
    }

    const { totalSales, protocolFees } = await nexusRegistry.adminStats()
    // protocolFees está en centavos MXN (ej: 17029 = $170.29 MXN)
    const protocolFeesMXN = protocolFees / 100
    // El creador recibe el 99%, el protocolo el 1%
    const totalPaidMXN = protocolFeesMXN * 99

    return NextResponse.json({
      agentBalance,
      agentBalanceMXN: Math.round(agentBalanceMXN),
      totalSales,
      protocolFees: Math.round(protocolFeesMXN * 100) / 100,
      totalPaidMXN: Math.round(totalPaidMXN * 100) / 100,
      contractMode: 'live',
      bitsoMXNBalance,
      bitsoUSDTBalance,
      bitsoEnvironment,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[NEXUS:api/admin/stats] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
