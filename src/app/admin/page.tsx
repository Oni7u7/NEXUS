'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import Link from 'next/link'

interface AdminStats {
  agentBalance: string
  agentBalanceMXN: number
  totalSales: number | null
  protocolFees: number | null
  totalPaidMXN: number | null
  contractMode?: 'demo' | 'live'
  bitsoMXNBalance?: string
  bitsoUSDTBalance?: string
  bitsoEnvironment?: 'stage' | 'production'
}

const OWNER_WALLET = process.env.NEXT_PUBLIC_OWNER_WALLET?.trim().toLowerCase() ?? ''

export default function AdminPage() {
  const { ready, authenticated, user } = usePrivy()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawResult, setWithdrawResult] = useState<{ txHash?: string; error?: string } | null>(null)

  const connectedAddress = user?.wallet?.address?.toLowerCase() ?? ''
  const isOwner = authenticated && connectedAddress === OWNER_WALLET

  useEffect(() => {
    if (!isOwner) return

    setLoadingStats(true)
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoadingStats(false))
  }, [isOwner])

  async function handleWithdraw() {
    if (!isOwner) return
    setWithdrawing(true)
    setWithdrawResult(null)

    try {
      const res = await fetch('/api/admin/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${connectedAddress}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        setWithdrawResult({ error: data.error ?? 'Error desconocido' })
      } else {
        setWithdrawResult({ txHash: data.txHash })
        // Refrescar stats
        const updated = await fetch('/api/admin/stats').then((r) => r.json())
        setStats(updated)
      }
    } catch (err) {
      setWithdrawResult({ error: err instanceof Error ? err.message : 'Error desconocido' })
    } finally {
      setWithdrawing(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 flex-col gap-4 px-4 text-center">
        <span className="text-4xl">🔒</span>
        <p className="text-zinc-300 font-medium">
          Acceso denegado — solo el owner de NEXUS puede ver esta pagina
        </p>
        <Link
          href="/chat"
          className="mt-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Volver al chat
        </Link>
      </div>
    )
  }

  const shortAddress = `${OWNER_WALLET.slice(0, 6)}...${OWNER_WALLET.slice(-4)}`
  const protocolFeesMXN = stats?.protocolFees != null ? stats.protocolFees : null

  return (
    <div className="min-h-screen bg-zinc-950 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-800">
            <h1 className="text-white font-bold text-xl">Admin Panel</h1>
            <p className="text-zinc-500 text-xs mt-1 font-mono">Owner: {shortAddress}</p>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Balance */}
            <div>
              <h2 className="text-zinc-300 font-semibold text-sm mb-3">
                Fees acumulados del protocolo
              </h2>

              {loadingStats ? (
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-1/2" />
                </div>
              ) : stats ? (
                <div className="space-y-1">
                  <p className="text-zinc-400 text-xs">ETH en wallet del agente</p>
                  <p className="text-white font-bold text-2xl">
                    {parseFloat(stats.agentBalance).toFixed(4)} ETH
                  </p>
                  <p className="text-zinc-400 text-sm">
                    Equivalente: ${stats.agentBalanceMXN.toLocaleString('es-MX')} MXN
                  </p>
                </div>
              ) : (
                <p className="text-zinc-600 text-sm">Sin datos</p>
              )}
            </div>

            {/* Estadísticas */}
            <div>
              <h2 className="text-zinc-300 font-semibold text-sm mb-3">Estadísticas</h2>

              {stats?.contractMode === 'demo' && (
                <div className="mb-3 flex items-center gap-2 bg-yellow-950 border border-yellow-700 rounded-lg px-3 py-2 text-xs text-yellow-300">
                  <span>⚠️</span>
                  <span>Contrato en modo demo — deploya NexusRegistry para ver datos reales</span>
                </div>
              )}

              {loadingStats ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-3 bg-zinc-800 rounded animate-pulse" />
                  ))}
                </div>
              ) : stats ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total ventas procesadas</span>
                    <span className="text-white font-medium">
                      {stats.totalSales != null ? stats.totalSales : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total pagado a creadores</span>
                    <span className="text-white font-medium">
                      {stats.totalPaidMXN != null
                        ? `$${stats.totalPaidMXN.toLocaleString('es-MX')} MXN`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total fees cobrados</span>
                    <span className="text-violet-400 font-medium">
                      {protocolFeesMXN != null
                        ? `$${protocolFeesMXN.toLocaleString('es-MX')} MXN`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-600 text-sm">Sin datos</p>
              )}
            </div>

            {/* Saldo Bitso Business */}
            <div>
              <h2 className="text-zinc-300 font-semibold text-sm mb-3">Saldo Bitso Business</h2>
              {loadingStats ? (
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-1/2" />
                </div>
              ) : stats ? (
                <div className="bg-zinc-800 rounded-xl p-4 space-y-2 border border-zinc-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">MXN disponible</span>
                    <span className="text-white font-medium">
                      ${parseFloat(stats.bitsoMXNBalance ?? '0').toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">USDT disponible</span>
                    <span className="text-white font-medium">
                      {parseFloat(stats.bitsoUSDTBalance ?? '0').toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Ambiente</span>
                    <span className={`font-medium ${stats.bitsoEnvironment === 'stage' ? 'text-yellow-400' : 'text-green-400'}`}>
                      {stats.bitsoEnvironment === 'stage' ? '🟡 Stage (pruebas)' : '🟢 Producción'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-600 text-sm">Sin datos</p>
              )}
            </div>

            {/* Botón retirar */}
            <div className="space-y-3">
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || loadingStats || !stats}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
              >
                {withdrawing ? 'Enviando...' : 'Retirar ETH a mi wallet →'}
              </button>

              {withdrawResult?.txHash && (
                <div className="bg-green-950 border border-green-800 rounded-xl p-3">
                  <p className="text-green-400 text-xs font-medium">Transferencia exitosa</p>
                  <p className="text-green-300 font-mono text-xs mt-1 break-all">
                    {withdrawResult.txHash}
                  </p>
                </div>
              )}

              {withdrawResult?.error && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-3">
                  <p className="text-red-400 text-xs">{withdrawResult.error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-800">
            <Link href="/chat" className="text-zinc-500 hover:text-violet-400 text-xs transition-colors">
              ← Volver al chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
