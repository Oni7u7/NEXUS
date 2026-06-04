import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const callerAddress = authHeader.replace('Bearer ', '').trim().toLowerCase()
  const ownerEnv = process.env.OWNER_WALLET?.trim() ?? ''

  if (!callerAddress || callerAddress !== ownerEnv.toLowerCase()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const privateKey = process.env.AGENT_PRIVATE_KEY?.trim() as `0x${string}` | undefined

  if (!ownerEnv) {
    return NextResponse.json({ error: 'OWNER_WALLET no configurado' }, { status: 500 })
  }
  if (!privateKey) {
    return NextResponse.json({ error: 'AGENT_PRIVATE_KEY no configurado' }, { status: 500 })
  }

  try {
    const rpcUrl = process.env.RPC_URL ?? 'https://rpc.sepolia.org'
    const account = privateKeyToAccount(privateKey)

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    })

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    })

    const balance = await publicClient.getBalance({ address: account.address })

    if (balance === BigInt(0)) {
      return NextResponse.json({ error: 'Balance del agente es 0' }, { status: 400 })
    }

    // Reservar 10% para gas futuro; enviar el 90% restante
    const toSend = (balance * BigInt(9)) / BigInt(10)

    // Gas de transferencia ETH simple
    const gasPrice = await publicClient.getGasPrice()
    const gasLimit = BigInt(21000)
    const gasCost = gasLimit * gasPrice

    if (toSend <= gasCost) {
      return NextResponse.json({ error: 'Balance insuficiente para cubrir gas' }, { status: 400 })
    }

    const txHash = await walletClient.sendTransaction({
      to: ownerEnv as `0x${string}`,
      value: toSend - gasCost,
      gas: gasLimit,
      gasPrice,
    })

    return NextResponse.json({ txHash, to: ownerEnv, sent: (toSend - gasCost).toString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[NEXUS:api/admin/withdraw] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
