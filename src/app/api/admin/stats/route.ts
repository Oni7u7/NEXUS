import { NextResponse } from 'next/server'
import { createPublicClient, http, formatEther } from 'viem'
import { sepolia } from 'viem/chains'
import { nexusRegistry } from '@/lib/contracts'
import { getBitsoTicker } from '@/lib/bitso'

export const runtime = 'nodejs'

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

    if (isMockContract) {
      return NextResponse.json({
        agentBalance,
        agentBalanceMXN: Math.round(agentBalanceMXN),
        totalSales: null,
        protocolFees: null,
        totalPaidMXN: null,
        contractMode: 'demo',
      })
    }

    const { totalSales, protocolFees } = await nexusRegistry.adminStats()
    const totalPaidMXN = (totalSales > 0 ? totalSales * 100 - protocolFees : 0) / 100

    return NextResponse.json({
      agentBalance,
      agentBalanceMXN: Math.round(agentBalanceMXN),
      totalSales,
      protocolFees,
      totalPaidMXN: Math.round(totalPaidMXN),
      contractMode: 'live',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[NEXUS:api/admin/stats] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
