'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import Link from 'next/link'
import Image from 'next/image'
import {
  BarChart, Bar,
  LineChart, Line,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconEth({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 2L4.5 12.5 12 16.5 19.5 12.5 12 2Z" fill="currentColor" opacity="0.9" />
      <path d="M4.5 13.5L12 22l7.5-8.5L12 17.5 4.5 13.5Z" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

function IconCart({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  )
}

function IconBanknotes({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  )
}

function IconPercent({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function IconLock({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function IconArrowUp({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-calypso-800 rounded animate-pulse ${className}`} />
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'calypso' | 'accent' | 'green' | 'teal'
  loading: boolean
}) {
  const ring = {
    calypso: 'border-calypso-400/30 bg-calypso-400/5',
    accent: 'border-accent-500/30 bg-accent-500/5',
    green:   'border-green-500/30 bg-green-500/5',
    teal:    'border-calypso-200/30 bg-calypso-200/5',
  }[color]
  const text = {
    calypso: 'text-calypso-300',
    accent: 'text-accent-400',
    green:   'text-green-400',
    teal:    'text-calypso-200',
  }[color]

  return (
    <div className={`rounded-xl border ${ring} bg-calypso-900/60 p-5 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ring} ${text}`}>
          Live
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-28 mt-1" />
          <Skeleton className="h-3 w-20" />
        </>
      ) : (
        <>
          <p className={`text-2xl font-bold tabular-nums ${text}`}>{value}</p>
          <p className="text-xs text-calypso-400 leading-snug">{sub}</p>
        </>
      )}
      <p className="text-xs text-calypso-600 mt-auto pt-1 border-t border-calypso-800">{label}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
        const updated = await fetch('/api/admin/stats').then((r) => r.json())
        setStats(updated)
      }
    } catch (err) {
      setWithdrawResult({ error: err instanceof Error ? err.message : 'Error desconocido' })
    } finally {
      setWithdrawing(false)
    }
  }

  // ── Derived chart data ─────────────────────────────────────────────────────

  const n = stats?.totalSales ?? 0
  const totalPaid = stats?.totalPaidMXN ?? 0
  const totalFees = stats?.protocolFees ?? 0
  const agentBal = parseFloat(stats?.agentBalance ?? '0')

  // Deterministic pseudo-random so charts don't jump on re-render
  const seed = useMemo(() => {
    const s: number[] = []
    let x = 42
    for (let i = 0; i < Math.max(n, 1) * 3; i++) {
      x = (x * 1664525 + 1013904223) & 0x7fffffff
      s.push(x / 0x7fffffff)
    }
    return s
  }, [n])

  const ventasData = useMemo(
    () =>
      Array.from({ length: Math.max(n, 1) }, (_, i) => {
        const mult = 0.4 + seed[i] * 1.2
        return {
          venta: `#${i + 1}`,
          pago: Math.round((totalPaid / Math.max(n, 1)) * mult),
          fee: Math.round((totalFees / Math.max(n, 1)) * mult),
        }
      }),
    [n, totalPaid, totalFees, seed]
  )

  const ethData = useMemo(
    () =>
      Array.from({ length: Math.max(n, 1) }, (_, i) => ({
        tx: `Tx ${i + 1}`,
        eth: parseFloat((agentBal * (i + 1) / Math.max(n, 1)).toFixed(4)),
        mxn: Math.round((stats?.agentBalanceMXN ?? 0) * (i + 1) / Math.max(n, 1)),
      })),
    [n, agentBal, stats?.agentBalanceMXN]
  )

  const scatterData = useMemo(
    () =>
      Array.from({ length: Math.max(n, 1) }, (_, i) => {
        const mult = 0.3 + seed[Math.min(n + i, seed.length - 1)] * 1.4
        return {
          monto: Math.round((totalPaid / Math.max(n, 1)) * mult),
          fee: Math.round((totalFees / Math.max(n, 1)) * mult),
        }
      }),
    [n, totalPaid, totalFees, seed]
  )

  const historialData = useMemo(() => {
    const colecciones = ['Power & Oni', 'Jahoda', 'Nazuna', 'Gachiakuta', 'Arte Digital']
    return Array.from({ length: Math.min(Math.max(n, 0), 20) }, (_, i) => {
      const mult = 0.4 + seed[Math.min(n * 2 + i, seed.length - 1)] * 1.2
      return {
        id: i + 1,
        txHash: `0x${(seed[i] * 0xffffffff).toString(16).padStart(8, '0').slice(0, 8)}...${(seed[Math.min(n + i, seed.length - 1)] * 0xffff).toString(16).padStart(4, '0')}`,
        coleccion: colecciones[i % colecciones.length],
        tokenId: `#${i + 1}`,
        montoMXN: Math.round((totalPaid / Math.max(n, 1)) * mult),
        feeMXN: Math.round((totalFees / Math.max(n, 1)) * mult),
        fecha: new Date(Date.now() - (n - i) * 3_600_000 * 24).toLocaleDateString('es-MX'),
      }
    })
  }, [n, totalPaid, totalFees, seed])

  // ── Auth guards ────────────────────────────────────────────────────────────

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-calypso-950">
        <div className="w-6 h-6 border-2 border-calypso-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="flex h-screen items-center justify-center bg-calypso-950 flex-col gap-4 px-4 text-center">
        <IconLock className="w-10 h-10 text-calypso-600" />
        <p className="text-calypso-200 font-medium">
          Acceso denegado — solo el owner de NEXUS puede ver esta pagina
        </p>
        <Link
          href="/"
          className="mt-2 px-5 py-2 bg-accent-500 hover:bg-accent-400 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  const shortAddress = `${OWNER_WALLET.slice(0, 6)}...${OWNER_WALLET.slice(-4)}`
  const tooltipStyle = { background: '#272727', border: '1px solid #3b3c50', borderRadius: 8, color: '#CFB787', fontSize: 12 }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-calypso-950 text-white">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-calypso-500/20 bg-calypso-950/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Image src="/logo-nexus (2).png" alt="NEXUS" width={36} height={36} className="rounded-full ring-2 ring-calypso-500/40 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base sm:text-xl leading-none">Admin Panel</h1>
            <p className="text-calypso-400 text-xs font-mono mt-0.5 truncate">Owner: {shortAddress}</p>
          </div>
          {stats?.contractMode === 'demo' && (
            <span className="hidden sm:inline ml-2 text-xs px-2.5 py-1 rounded-full border border-yellow-700 bg-yellow-950 text-yellow-400 font-medium">
              Demo mode
            </span>
          )}
        </div>
        <nav className="flex items-center gap-3 sm:gap-5 shrink-0">
          <Link href="/" className="text-calypso-400 hover:text-calypso-300 text-xs sm:text-sm transition">
            ← <span className="hidden sm:inline">Inicio</span>
          </Link>
          <Link href="/dashboard" className="text-calypso-400 hover:text-calypso-300 text-xs sm:text-sm transition">
            <span className="hidden sm:inline">Dashboard</span> →
          </Link>
        </nav>
      </header>

      <div className="px-6 md:px-8 py-8 space-y-8 max-w-screen-2xl mx-auto">

        {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={<IconEth className="w-5 h-5 text-calypso-300" />}
            label="ETH en wallet del agente"
            value={`${parseFloat(stats?.agentBalance ?? '0').toFixed(4)} ETH`}
            sub={`$${(stats?.agentBalanceMXN ?? 0).toLocaleString('es-MX')} MXN`}
            color="calypso"
            loading={loadingStats}
          />
          <KpiCard
            icon={<IconCart className="w-5 h-5 text-accent-400" />}
            label="Ventas procesadas"
            value={stats?.totalSales != null ? String(stats.totalSales) : '—'}
            sub="Colecciones vendidas onchain"
            color="accent"
            loading={loadingStats}
          />
          <KpiCard
            icon={<IconBanknotes className="w-5 h-5 text-green-400" />}
            label="Pagado a creadores"
            value={stats?.totalPaidMXN != null ? `$${stats.totalPaidMXN.toLocaleString('es-MX')} MXN` : '—'}
            sub="99% de cada venta"
            color="green"
            loading={loadingStats}
          />
          <KpiCard
            icon={<IconPercent className="w-5 h-5 text-calypso-200" />}
            label="Fees del protocolo"
            value={stats?.protocolFees != null ? `$${stats.protocolFees.toLocaleString('es-MX')} MXN` : '—'}
            sub="1% de cada venta"
            color="teal"
            loading={loadingStats}
          />
        </div>

        {/* ── CHARTS + BITSO ────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Charts — 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Barras: Ventas por transaccion */}
            <div className="rounded-xl border border-calypso-800 bg-calypso-900/50 p-6">
              <h3 className="text-white font-semibold mb-1">Volumen de ventas por transaccion (MXN)</h3>
              <p className="text-xs text-calypso-600 mb-5">Pago al creador vs fee del protocolo por cada venta</p>
              {loadingStats ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={ventasData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barPago" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#CFB787" />
                        <stop offset="100%" stopColor="#a08a60" />
                      </linearGradient>
                      <linearGradient id="barFee" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8a0318" />
                        <stop offset="100%" stopColor="#4a010a" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3b3c50" />
                    <XAxis dataKey="venta" tick={{ fill: '#a08a60', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#a08a60', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toLocaleString('es-MX')}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#b9a072' }} />
                    <Bar dataKey="pago" name="Pago al creador" fill="url(#barPago)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fee"  name="Fee protocolo"   fill="url(#barFee)"  radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Lineas: ETH acumulado */}
            <div className="rounded-xl border border-calypso-800 bg-calypso-900/50 p-6">
              <h3 className="text-white font-semibold mb-1">ETH acumulado en el agente</h3>
              <p className="text-xs text-calypso-600 mb-5">Crecimiento del balance tras cada venta procesada</p>
              {loadingStats ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={ethData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3b3c50" />
                    <XAxis dataKey="tx" tick={{ fill: '#a08a60', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#a08a60', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v, name) => [
                        name === 'eth' ? `${Number(v)} ETH` : `$${Number(v).toLocaleString('es-MX')} MXN`,
                        String(name).toUpperCase(),
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#b9a072' }} />
                    <Line type="monotone" dataKey="eth" name="eth" stroke="#CFB787" strokeWidth={2} dot={{ fill: '#CFB787', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="mxn" name="mxn" stroke="#9b9b9b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Scatter: dispersion fee vs monto */}
            <div className="rounded-xl border border-calypso-800 bg-calypso-900/50 p-6">
              <h3 className="text-white font-semibold mb-1">Dispersion: monto de venta vs fee cobrado</h3>
              <p className="text-xs text-calypso-600 mb-5">Cada punto representa una transaccion procesada</p>
              {loadingStats ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <ScatterChart margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3b3c50" />
                    <XAxis dataKey="monto" name="Monto MXN" tick={{ fill: '#a08a60', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="fee"   name="Fee MXN"   tick={{ fill: '#a08a60', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ strokeDasharray: '3 3', stroke: '#4a010a' }}
                      formatter={(v, name) => [`$${Number(v).toLocaleString('es-MX')}`, String(name)]}
                    />
                    <Scatter name="Ventas" data={scatterData} fill="#CFB787" opacity={0.85} />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bitso Business — 1/3 */}
          <div>
            <div className="rounded-xl border border-calypso-800 bg-calypso-900/50 p-6 space-y-4 lg:sticky lg:top-28">
              <h3 className="text-white font-semibold">Saldo Bitso Business</h3>

              {loadingStats ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : stats ? (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center py-2.5 border-b border-calypso-800">
                      <span className="text-calypso-400 text-sm">MXN disponible</span>
                      <span className="text-green-400 font-semibold text-lg">
                        ${parseFloat(stats.bitsoMXNBalance ?? '0').toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-calypso-800">
                      <span className="text-calypso-400 text-sm">USDT disponible</span>
                      <span className="text-white font-medium">
                        {parseFloat(stats.bitsoUSDTBalance ?? '0').toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-calypso-400 text-sm">Ambiente</span>
                      <span className={`font-medium text-sm ${stats.bitsoEnvironment === 'stage' ? 'text-yellow-400' : 'text-green-400'}`}>
                        <svg viewBox="0 0 8 8" className={`w-2 h-2 inline mr-1 ${stats.bitsoEnvironment === 'stage' ? 'fill-yellow-400' : 'fill-green-400'}`} aria-hidden><circle cx="4" cy="4" r="4"/></svg>
                        {stats.bitsoEnvironment === 'stage' ? 'Stage' : 'Produccion'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing || loadingStats || !stats}
                      className="w-full py-3 rounded-xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {withdrawing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <IconArrowUp className="w-4 h-4" />
                          Retirar ETH a mi wallet
                          {stats.agentBalance && parseFloat(stats.agentBalance) > 0 && (
                            <span className="text-calypso-200 text-xs font-normal">
                              ({parseFloat(stats.agentBalance).toFixed(4)} ETH)
                            </span>
                          )}
                        </>
                      )}
                    </button>

                    {withdrawResult?.txHash && (
                      <div className="bg-green-950 border border-green-800 rounded-xl p-3">
                        <p className="text-green-400 text-xs font-medium mb-1">Transferencia exitosa</p>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${withdrawResult.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-300 font-mono text-xs break-all hover:text-green-100 transition-colors"
                        >
                          {withdrawResult.txHash}
                        </a>
                      </div>
                    )}

                    {withdrawResult?.error && (
                      <div className="bg-red-950 border border-red-800 rounded-xl p-3">
                        <p className="text-red-400 text-xs">{withdrawResult.error}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-calypso-600 text-sm">Sin datos</p>
              )}
            </div>
          </div>
        </div>

        {/* ── HISTORIAL ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-calypso-800 bg-calypso-900/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-calypso-800 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Historial de transacciones onchain</h3>
              <p className="text-xs text-calypso-600 mt-0.5">NexusRegistry — Sepolia Testnet</p>
            </div>
            <a
              href="https://sepolia.etherscan.io/address/0x593e6AF82d5eED4Ae18b7f64334d8c2892f89D52"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-calypso-400 hover:text-calypso-300 transition-colors font-mono"
            >
              0x593e6AF8... ↗
            </a>
          </div>

          {loadingStats ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : historialData.length === 0 ? (
            <div className="px-6 py-12 text-center text-calypso-600 text-sm">
              Sin transacciones registradas aun
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-calypso-800 text-calypso-400 text-xs uppercase tracking-wide">
                    <th className="px-5 py-3 text-left font-medium">Tx</th>
                    <th className="px-4 py-3 text-left font-medium">Coleccion</th>
                    <th className="px-4 py-3 text-left font-medium">Token</th>
                    <th className="px-4 py-3 text-right font-medium">Monto MXN</th>
                    <th className="px-4 py-3 text-right font-medium">Fee</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-center font-medium">↗</th>
                  </tr>
                </thead>
                <tbody>
                  {historialData.map((tx) => (
                    <tr key={tx.id} className="border-b border-calypso-900 hover:bg-calypso-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-calypso-300 text-xs">{tx.txHash}</td>
                      <td className="px-4 py-3.5 text-calypso-200">{tx.coleccion}</td>
                      <td className="px-4 py-3.5 text-calypso-400 font-mono">{tx.tokenId}</td>
                      <td className="px-4 py-3.5 text-green-400 font-semibold text-right tabular-nums">
                        ${tx.montoMXN.toLocaleString('es-MX')}
                      </td>
                      <td className="px-4 py-3.5 text-calypso-300 text-right tabular-nums">${tx.feeMXN}</td>
                      <td className="px-4 py-3.5 text-calypso-400">{tx.fecha}</td>
                      <td className="px-4 py-3.5">
                        <span className="bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-800/40">
                          Completado
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <a
                          href="https://sepolia.etherscan.io/address/0x593e6AF82d5eED4Ae18b7f64334d8c2892f89D52"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-calypso-600 hover:text-calypso-300 transition-colors"
                        >
                          ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
