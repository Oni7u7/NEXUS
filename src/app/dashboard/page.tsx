'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import WalletButton from '@/app/_components/WalletButton'
import SPEIReceipt from '@/app/_components/SPEIReceipt'

// ── IPFS helper ──────────────────────────────────────────────────────────────

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

function ipfsToHttp(uri?: string): string | null {
  if (!uri) return null
  if (uri.startsWith('ipfs://')) return PINATA_GATEWAY + uri.slice(7)
  if (uri.startsWith('http')) return uri
  if (uri.length > 20 && !uri.includes(' ')) return PINATA_GATEWAY + uri
  return null
}

// ── Tipos ────────────────────────────────────────────────────────────────────

interface StoredAuction {
  contract: string
  tokenId: number
  endTime: number
  reservePrice: number
  settled?: boolean
  speiId?: string
  creatorMXN?: number
  clabe?: string
  ipfsImageUri?: string
  metadataUri?: string
}

interface StoredSession {
  collectionAddress: string | null
  collectionName: string | null
  mintedTokens: number[]
  activeAuctions: StoredAuction[]
}

interface MarketItem {
  contract: string
  tokenId: string
  name?: string
  imageUrl?: string
  currentBid?: string
  endTime?: number
}

// ── Cuenta regresiva ─────────────────────────────────────────────────────────

function Countdown({ endTime }: { endTime: number }) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    const tick = () => {
      const remaining = endTime * 1000 - Date.now()
      if (remaining <= 0) {
        setDisplay('Terminada')
        return
      }
      const h = Math.floor(remaining / 3_600_000)
      const m = Math.floor((remaining % 3_600_000) / 60_000)
      const s = Math.floor((remaining % 60_000) / 1_000)
      setDisplay(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}h`
      )
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [endTime])

  return <span>{display}</span>
}

// ── Card de subasta propia ────────────────────────────────────────────────────

function UserAuctionCard({
  auction,
  ethPriceMXN,
  collectionName,
}: {
  auction: StoredAuction
  ethPriceMXN: number | null
  collectionName: string | null
}) {
  const reserveMXN = ethPriceMXN ? auction.reservePrice * ethPriceMXN : null
  console.log('[NEXUS:dashboard] ipfsImageUri:', auction.ipfsImageUri)
  console.log('[NEXUS:dashboard] metadataUri:', auction.metadataUri)
  console.log('[NEXUS:dashboard] imageUrl calculado:', ipfsToHttp(auction.ipfsImageUri))
  const [imageUrl, setImageUrl] = useState<string | null>(ipfsToHttp(auction.ipfsImageUri))

  useEffect(() => {
    if (imageUrl) return
    const metaUrl = ipfsToHttp(auction.metadataUri)
    if (!metaUrl) return
    fetch(metaUrl)
      .then((r) => r.json())
      .then((meta) => { if (meta.image) setImageUrl(ipfsToHttp(meta.image)) })
      .catch(() => null)
  }, [auction.metadataUri, imageUrl])

  return (
    <div className={`bg-zinc-900 rounded-2xl overflow-hidden border ${auction.settled ? 'border-green-700/60' : 'border-violet-800/50'}`}>
      <div className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Token #${auction.tokenId}`}
            className="w-full h-full object-cover"
            onError={() => setImageUrl(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">🎨</div>
        )}
        {auction.settled && (
          <span className="absolute top-2 right-2 text-xs bg-green-900 text-green-400 border border-green-700 rounded-full px-2 py-0.5 font-semibold">
            ✅ Vendida
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-white font-medium">Token #{auction.tokenId}</h3>

        {auction.settled ? (
          <div>
            <p className="text-zinc-500 text-xs">Monto recibido</p>
            <p className="text-green-400 font-semibold text-sm">
              ${(auction.creatorMXN ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-zinc-500 text-xs">Precio de reserva</p>
              <p className="text-violet-400 font-semibold text-sm">{auction.reservePrice} ETH</p>
              {reserveMXN && (
                <p className="text-zinc-400 text-xs">
                  ${reserveMXN.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span>⏱</span>
              <Countdown endTime={auction.endTime} />
            </div>
          </>
        )}

        {auction.settled && auction.creatorMXN && (
          <SPEIReceipt
            collapsible
            data={{
              collectionName,
              tokenId: auction.tokenId,
              amountMXN: auction.creatorMXN,
              speiId: auction.speiId ?? null,
              clabe: auction.clabe ?? null,
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Card de mercado global ────────────────────────────────────────────────────

function MarketCard({
  item,
  ethPriceMXN,
}: {
  item: MarketItem
  ethPriceMXN: number | null
}) {
  const bidEth = item.currentBid ? parseFloat(item.currentBid) / 1e18 : null
  const bidMXN = bidEth && ethPriceMXN ? bidEth * ethPriceMXN : null

  const imageUrl = ipfsToHttp(item.imageUrl)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-colors">
      <div className="aspect-square bg-zinc-800 relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={item.name ?? 'NFT'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-zinc-600 text-4xl">🎨</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-medium truncate text-sm">
            {item.name ?? `Token #${item.tokenId}`}
          </h3>
          <span className="shrink-0 text-xs text-zinc-500 border border-zinc-700 rounded-full px-2 py-0.5">
            Mercado de referencia
          </span>
        </div>

        {bidMXN !== null ? (
          <div>
            <p className="text-zinc-500 text-xs">Oferta actual</p>
            <p className="text-zinc-300 font-semibold text-sm">{bidEth?.toFixed(4)} ETH</p>
            <p className="text-zinc-500 text-xs">
              ${bidMXN.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
            </p>
          </div>
        ) : (
          <p className="text-zinc-600 text-xs">Sin ofertas</p>
        )}

        {item.endTime && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>⏱</span>
            <Countdown endTime={item.endTime} />
          </div>
        )}

        <a
          href={`https://superrare.com/${item.contract}/${item.tokenId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-600 rounded-lg py-1.5 transition-colors mt-2"
        >
          Ver en Rare →
        </a>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { ready, authenticated, user } = usePrivy()
  // Key aislada por wallet — igual que en chat/page.tsx
  const address = user?.wallet?.address ?? null
  const storageKey = address ? `nexus_session_${address.toLowerCase()}` : null
  const [mySession, setMySession] = useState<StoredSession | null>(null)

  // Leer la sesión solo de la wallet conectada
  useEffect(() => {
    setMySession(null)
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as StoredSession
        console.log('[NEXUS:dashboard] auction data:', JSON.stringify(parsed?.activeAuctions))
        setMySession(parsed)
      }
    } catch {}
  }, [storageKey])

  // Mercado global de Rare Protocol
  const { data: marketData, isLoading: loadingMarket } = useQuery({
    queryKey: ['market'],
    queryFn: () =>
      fetch('/api/rare?command=search_auctions').then((r) => r.json()),
    refetchInterval: 60_000,
    enabled: authenticated,
  })

  // Precio ETH/MXN
  const { data: ticker } = useQuery({
    queryKey: ['ticker', 'eth_mxn'],
    queryFn: () =>
      fetch('/api/bitso?action=ticker&book=eth_mxn').then((r) => r.json()),
    refetchInterval: 30_000,
  })

  const ethPriceMXN = ticker?.last ? parseFloat(ticker.last) : null
  const marketItems: MarketItem[] =
    marketData?.data?.items ?? marketData?.data?.data?.items ?? []

  const hasCollection = !!mySession?.collectionAddress
  const myAuctions = mySession?.activeAuctions ?? []

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 flex-col gap-4">
        <p className="text-zinc-400 text-sm">Conecta tu cuenta para ver tus subastas</p>
        <WalletButton />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/chat" className="text-xs text-zinc-400 hover:text-violet-400 transition-colors">
              ← Chat
            </Link>
            <h1 className="text-white font-bold text-xl">Dashboard</h1>
            {ethPriceMXN && (
              <span className="text-xs text-zinc-500">
                ETH{' '}
                <span className="text-violet-400">
                  ${ethPriceMXN.toLocaleString('es-MX')} MXN
                </span>
              </span>
            )}
          </div>
          <WalletButton />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8 space-y-12">

        {/* ── Sección 1: Mis subastas ──────────────────────────────────── */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">Mis subastas</h2>

          {hasCollection ? (
            <>
              {/* Resumen de colección */}
              <div className="bg-zinc-900 border border-violet-800/50 rounded-2xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-xs">Colección</p>
                  <p className="text-white font-semibold">
                    {mySession?.collectionName ?? 'Mi colección'}
                  </p>
                  <p className="text-violet-400 font-mono text-xs mt-0.5">
                    {mySession?.collectionAddress?.slice(0, 6)}...
                    {mySession?.collectionAddress?.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-xs">NFTs acuñados</p>
                  <p className="text-white font-bold text-2xl">
                    {mySession?.mintedTokens.length ?? 0}
                  </p>
                </div>
              </div>

              {myAuctions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {myAuctions.map((a) => (
                    <UserAuctionCard
                      key={`${a.contract ?? 'unknown'}-${a.tokenId}`}
                      auction={a}
                      ethPriceMXN={ethPriceMXN}
                      collectionName={mySession?.collectionName ?? null}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">
                  Tu colección está lista. Habla con NEXUS para crear subastas.
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <span className="text-5xl">🎨</span>
              <p className="text-zinc-300 font-medium">Aún no tienes colección</p>
              <p className="text-zinc-600 text-sm text-center max-w-xs">
                Habla con NEXUS para lanzar tu primera colección y empezar a vender tu arte
              </p>
              <Link
                href="/chat"
                className="mt-1 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Crea tu primera colección →
              </Link>
            </div>
          )}
        </section>

        {/* ── Sección 2: Mercado global Rare Protocol ──────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-white font-bold text-lg">Mercado global Rare Protocol</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Así se ve el mercado global donde venderá tu arte
            </p>
          </div>

          {loadingMarket ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-zinc-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : marketItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {marketItems.map((item) => (
                <MarketCard
                  key={`${item.contract}-${item.tokenId}`}
                  item={item}
                  ethPriceMXN={ethPriceMXN}
                />
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">
              No hay datos de mercado disponibles en este momento.
            </p>
          )}
        </section>

      </div>
    </div>
  )
}
