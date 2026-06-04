'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useConnection, useBalance, useWalletClient } from 'wagmi'
import { sepolia, arbitrumSepolia, baseSepolia, scrollSepolia } from 'viem/chains'
import { formatEther } from 'viem'

// Chainlist-style chain configs with verified public RPCs
const CHAINS = [
  {
    chain: sepolia,
    label: 'Ethereum Sepolia',
    rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  {
    chain: arbitrumSepolia,
    label: 'Arbitrum Sepolia',
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
  },
  {
    chain: baseSepolia,
    label: 'Base Sepolia',
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  },
  {
    chain: scrollSepolia,
    label: 'Scroll Sepolia',
    rpcUrls: ['https://sepolia-rpc.scroll.io'],
    blockExplorerUrls: ['https://sepolia.scrollscan.com'],
  },
]

export default function WalletInfo() {
  const { authenticated } = usePrivy()
  const { address, chainId } = useConnection()
  const { data: balance, isLoading } = useBalance({ address, chainId })
  const { data: walletClient } = useWalletClient()
  const [switching, setSwitching] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!authenticated || !address) return null

  const formatted = balance
    ? parseFloat(formatEther(balance.value)).toFixed(4)
    : null

  async function handleSwitchChain(entry: typeof CHAINS[number]) {
    if (!walletClient) return
    setSwitching(entry.chain.id)
    setError(null)
    const chainIdHex = `0x${entry.chain.id.toString(16)}` as `0x${string}`
    try {
      // Try switch first (chain already added)
      await walletClient.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
    } catch (err: unknown) {
      const e = err as { code?: number }
      // 4902 = chain not added to wallet — add it using Chainlist data
      if (e?.code === 4902) {
        try {
          await walletClient.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: entry.chain.name,
                nativeCurrency: entry.chain.nativeCurrency,
                rpcUrls: entry.rpcUrls,
                blockExplorerUrls: entry.blockExplorerUrls,
              },
            ],
          })
        } catch (addErr: unknown) {
          const ae = addErr as { message?: string }
          setError(ae?.message ?? 'No se pudo agregar la red')
        }
      } else {
        const e2 = err as { message?: string }
        setError(e2?.message ?? 'Error al cambiar de red')
      }
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col gap-5">
      {/* Balance */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Balance</span>
        <span className="text-3xl font-bold text-white">
          {isLoading ? (
            <span className="text-zinc-600 text-lg">Loading...</span>
          ) : formatted !== null ? (
            <>
              {formatted}{' '}
              <span className="text-violet-400 text-lg">{balance?.symbol}</span>
            </>
          ) : (
            <span className="text-zinc-600 text-lg">—</span>
          )}
        </span>
      </div>

      {/* Network selector */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Network</span>
        <div className="grid grid-cols-2 gap-2">
          {CHAINS.map((entry) => {
            const active = chainId === entry.chain.id
            const pending = switching === entry.chain.id
            return (
              <button
                key={entry.chain.id}
                onClick={() => handleSwitchChain(entry)}
                disabled={!!switching || active}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  active
                    ? 'bg-violet-600 border-violet-500 text-white cursor-default'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500 cursor-pointer'
                } disabled:opacity-60`}
              >
                {pending ? 'Agregando...' : entry.label}
              </button>
            )
          })}
        </div>
        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>
    </div>
  )
}
