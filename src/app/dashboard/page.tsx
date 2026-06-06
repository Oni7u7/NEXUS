'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useQuery } from '@tanstack/react-query'
import { useWriteContract, useWaitForTransactionReceipt, useBalance, useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import Link from 'next/link'
import Image from 'next/image'
import WalletButton from '@/app/_components/WalletButton'
import Header from '@/app/_components/Header'
import SPEIReceipt from '@/app/_components/SPEIReceipt'

// ── Constantes ────────────────────────────────────────────────────────────────

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const SUPER_RARE_BAZAAR_SEPOLIA = '0xC8Edc7049b233641ad3723D6C60019D1c8771612' as const

const BAZAAR_ABI = [
  {
    name: 'bid',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_originContract', type: 'address' },
      { name: '_tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

// ── IPFS helper ───────────────────────────────────────────────────────────────

function ipfsToHttp(uri?: string): string | null {
  if (!uri) return null
  if (uri.startsWith('ipfs://')) return PINATA_GATEWAY + uri.slice(7)
  if (uri.startsWith('http')) return uri
  if (uri.length > 20 && !uri.includes(' ')) return PINATA_GATEWAY + uri
  return null
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

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
  lastKnownBid?: string
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

// ── Cuenta regresiva ──────────────────────────────────────────────────────────

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

// ── BidModal ──────────────────────────────────────────────────────────────────

function BidModal({
  contract,
  tokenId,
  currentBidEth,
  ethPriceMXN,
  onClose,
}: {
  contract: string
  tokenId: string
  currentBidEth: number | null
  ethPriceMXN: number | null
  onClose: () => void
}) {
  const [bidAmount, setBidAmount] = useState('')
  const { address } = useAccount()

  const { data: balance } = useBalance({ address })
  const hasBalance = balance && parseFloat(formatEther(balance.value)) > 0

  const { writeContract, data: txHash, isPending, isError, error } = useWriteContract()

  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const bidEth = parseFloat(bidAmount) || 0
  const bidMXN = bidEth && ethPriceMXN ? bidEth * ethPriceMXN : null
  const minBid = currentBidEth ? currentBidEth * 1.05 : 0.001

  function handleBid() {
    if (!bidAmount || bidEth <= 0) return
    writeContract({
      address: SUPER_RARE_BAZAAR_SEPOLIA,
      abi: BAZAAR_ABI,
      functionName: 'bid',
      args: [contract as `0x${string}`, BigInt(tokenId)],
      value: parseEther(bidAmount),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-base">Hacer puja en eth</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <p className="text-zinc-500 text-xs font-mono">
          Token #{tokenId} · {contract.slice(0, 6)}...{contract.slice(-4)}
        </p>

        {currentBidEth !== null && (
          <div className="bg-zinc-800 rounded-lg px-3 py-2 text-sm">
            <span className="text-zinc-400">Oferta actual: </span>
            <span className="text-white font-semibold">{currentBidEth.toFixed(4)} ETH</span>
            {ethPriceMXN && (
              <span className="text-zinc-500 ml-1">
                (${(currentBidEth * ethPriceMXN).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN)
              </span>
            )}
          </div>
        )}

        {!hasBalance && (
          <div className="bg-yellow-950 border border-yellow-700 rounded-lg px-3 py-2 text-xs text-yellow-300">
            No tienes ETH en Sepolia.{' '}
            <a
              href="https://sepoliafaucet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Obtén ETH de prueba →
            </a>
          </div>
        )}

        <div>
          <label className="text-zinc-400 text-xs block mb-1">
            Tu puja en ETH (mínimo ~{minBid.toFixed(4)} ETH)
          </label>
          <input
            type="number"
            step="0.001"
            min={minBid}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={`0.${minBid.toFixed(3).slice(2)}`}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
          />
          {bidMXN !== null && (
            <p className="text-zinc-500 text-xs mt-1">
              ≈ ${bidMXN.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
            </p>
          )}
        </div>

        {isSuccess ? (
          <div className="bg-green-950 border border-green-700 rounded-lg px-3 py-2 text-green-400 text-sm text-center">
            ¡Puja enviada correctamente!
          </div>
        ) : isError ? (
          <div className="bg-red-950 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-xs">
            Error: {error?.message?.slice(0, 120)}
          </div>
        ) : null}

        <button
          onClick={handleBid}
          disabled={isPending || !bidAmount || bidEth <= 0 || !hasBalance || isSuccess}
          className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
        >
          {isPending ? 'Firmando...' : 'Confirmar puja con mi wallet'}
        </button>
      </div>
    </div>
  )
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
    <div className={`bg-zinc-900 rounded-2xl overflow-hidden border ${auction.settled ? 'border-green-700/60' : 'border border-violet-500/20'}`}>
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
  const [showBidModal, setShowBidModal] = useState(false)
  const bidEth = item.currentBid ? parseFloat(item.currentBid) / 1e18 : null
  const bidMXN = bidEth && ethPriceMXN ? bidEth * ethPriceMXN : null

  const imageUrl = ipfsToHttp(item.imageUrl)

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
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

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowBidModal(true)}
              className="flex-1 text-center text-xs text-white bg-violet-600 hover:bg-violet-500 rounded-lg py-1.5 font-medium transition-colors"
            >
              Pujar →
            </button>
            <a
              href={`https://superrare.com/${item.contract}/${item.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 block text-center text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-600 rounded-lg py-1.5 transition-colors"
            >
              Ver en Rare →
            </a>
          </div>
        </div>
      </div>

      {showBidModal && (
        <BidModal
          contract={item.contract}
          tokenId={item.tokenId}
          currentBidEth={bidEth}
          ethPriceMXN={ethPriceMXN}
          onClose={() => setShowBidModal(false)}
        />
      )}
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { ready, authenticated, user } = usePrivy()
  const address = user?.wallet?.address ?? null
  const storageKey = address ? `nexus_session_${address.toLowerCase()}` : null
  const [mySession, setMySession] = useState<StoredSession | null>(null)
  const [newBidNotification, setNewBidNotification] = useState<{
    tokenId: number
    bidAmount: string
    bidAmountMXN: number
  } | null>(null)

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

  // Precio ETH/MXN
  const { data: ticker } = useQuery({
    queryKey: ['ticker', 'eth_mxn'],
    queryFn: () =>
      fetch('/api/bitso?action=ticker&book=eth_mxn').then((r) => r.json()),
    refetchInterval: 30_000,
  })

  const ethPriceMXN = ticker?.last ? parseFloat(ticker.last) : null

  // Mercado global de Rare Protocol
  const { data: marketData, isLoading: loadingMarket } = useQuery({
    queryKey: ['market'],
    queryFn: () =>
      fetch('/api/rare?command=search_auctions').then((r) => r.json()),
    refetchInterval: 60_000,
    enabled: authenticated,
  })

  const marketItems: MarketItem[] =
    marketData?.data?.items ?? marketData?.data?.data?.items ?? []

  // Persistir sesión actualizada en localStorage
  const saveSession = useCallback(
    (updated: StoredSession) => {
      if (!storageKey) return
      setMySession(updated)
      localStorage.setItem(storageKey, JSON.stringify(updated))
    },
    [storageKey]
  )

  // Polling de pujas en mis subastas
  useEffect(() => {
    if (!mySession?.activeAuctions?.length || !ethPriceMXN) return

    const interval = setInterval(async () => {
      for (const auction of mySession.activeAuctions) {
        if (auction.settled) continue
        try {
          const res = await fetch(
            `/api/rare?command=auction_status&contract=${auction.contract}&tokenId=${auction.tokenId}`
          )
          const data = await res.json()

          const currentBid = data.data?.currentBid
          if (
            currentBid &&
            currentBid !== '0' &&
            currentBid !== auction.lastKnownBid
          ) {
            const mxnAmount = parseFloat(currentBid) * ethPriceMXN
            setNewBidNotification({
              tokenId: auction.tokenId,
              bidAmount: currentBid,
              bidAmountMXN: Math.round(mxnAmount),
            })

            // Actualiza lastKnownBid en sesión
            const updated: StoredSession = {
              ...mySession,
              activeAuctions: mySession.activeAuctions.map((a) =>
                a.tokenId === auction.tokenId && a.contract === auction.contract
                  ? { ...a, lastKnownBid: currentBid }
                  : a
              ),
            }
            saveSession(updated)
          }
        } catch { /* silencioso */ }
      }
    }, 60_000)

    return () => clearInterval(interval)
  }, [mySession, ethPriceMXN, saveSession])

  // Auto-cierre de notificación después de 10 segundos
  useEffect(() => {
    if (!newBidNotification) return
    const t = setTimeout(() => setNewBidNotification(null), 10_000)
    return () => clearTimeout(t)
  }, [newBidNotification])

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
      {/* Banner de nueva puja */}
      {newBidNotification && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in slide-in-from-top-4 duration-300"
        >
          <div className="bg-violet-900 border border-violet-600 rounded-xl p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-semibold text-sm">
                  🔔 ¡Nueva puja en Token #{newBidNotification.tokenId}!
                </p>
                <p className="text-violet-200 text-xs mt-0.5">
                  Alguien ofreció {newBidNotification.bidAmount} ETH
                  (~${newBidNotification.bidAmountMXN.toLocaleString('es-MX')} MXN)
                </p>
              </div>
              <button
                onClick={() => setNewBidNotification(null)}
                className="text-violet-300 hover:text-white text-lg leading-none shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <Header />

      <div className="max-w-5xl mx-auto px-4 mt-8 space-y-12">

        {/* ── Sección 1: Mis subastas ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Mis subastas</h2>
            {ethPriceMXN && (
              <span className="text-xs text-zinc-500">
                ETH <span className="text-violet-400 font-medium">${ethPriceMXN.toLocaleString('es-MX')} MXN</span>
              </span>
            )}
          </div>

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
