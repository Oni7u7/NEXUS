'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartTooltip } from 'recharts'
import { usePrivy } from '@privy-io/react-auth'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import WalletButton from '@/app/_components/WalletButton'
import SPEIReceipt from '@/app/_components/SPEIReceipt'
import Header from '@/app/_components/Header'

// ── Tipos ────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'agent' | 'tool' | 'system'

interface Message {
  id: string
  role: MessageRole
  content: string
  toolName?: string
  timestamp: number
}

interface StoredAuction {
  contract: string
  tokenId: number
  endTime: number
  reservePrice: number
  settled?: boolean
  speiId?: string
  creatorMXN?: number
  clabe?: string
}

interface SessionState {
  collectionAddress: string | null
  collectionName: string | null
  mintedTokens: number[]
  activeAuctions: StoredAuction[]
  totalEarnedMXN: number
  creatorClabe: string | null
  lastUploadedIpfsUri?: string
}

// ── Componentes internos ─────────────────────────────────────────────────────

function ToolPill({ name, done }: { name: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-700 text-violet-400 text-xs w-fit">
      {done ? (
        <span className="text-green-400">✓</span>
      ) : (
        <span className="animate-spin inline-block w-3 h-3 border border-violet-400 border-t-transparent rounded-full" />
      )}
      <span>{name}</span>
    </div>
  )
}

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role === 'tool') {
    return (
      <div className="flex justify-start mb-2">
        <ToolPill name={msg.toolName ?? msg.content} done />
      </div>
    )
  }

  if (msg.role === 'system') {
    return (
      <div className="mb-3">
        <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 font-mono text-xs text-zinc-400 whitespace-pre-wrap overflow-x-auto">
          {msg.content}
        </pre>
      </div>
    )
  }

  const isUser = msg.role === 'user'
  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-16 h-16 rounded-full overflow-hidden mr-2 shrink-0 mt-0.5">
          <Image src="/logo-nexus (2).png" alt="NEXUS" width={64} height={64} className="rounded-full" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-600 text-white rounded-tr-sm'
            : 'bg-zinc-800 text-zinc-100 rounded-tl-sm border-l-2 border-violet-500'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

function CollectionStatus({
  state,
  ethPriceMXN,
}: {
  state: SessionState
  ethPriceMXN: number | null
}) {
  const [open, setOpen] = useState(false)

  if (!state.collectionAddress && state.mintedTokens.length === 0) return null

  return (
    <div className="border-t border-zinc-800 bg-zinc-950">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <span>Estado de tu colección</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-3 text-sm">
          {state.collectionAddress && (
            <div className="col-span-2">
              <span className="text-zinc-500 text-xs">Contrato</span>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-violet-400 font-mono text-xs truncate">
                  {state.collectionAddress}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(state.collectionAddress!)}
                  className="text-zinc-600 hover:text-zinc-300 text-xs shrink-0"
                  title="Copiar"
                >
                  ⎘
                </button>
              </div>
            </div>
          )}

          <div>
            <span className="text-zinc-500 text-xs">NFTs acuñados</span>
            <p className="text-white font-medium mt-0.5">{state.mintedTokens.length}</p>
          </div>

          <div>
            <span className="text-zinc-500 text-xs">Subastas activas</span>
            <p className="text-white font-medium mt-0.5">{state.activeAuctions.length}</p>
          </div>

          <div className="col-span-2">
            <span className="text-zinc-500 text-xs">Total ganado</span>
            <p className="text-green-400 font-semibold mt-0.5">
              ${state.totalEarnedMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </p>
          </div>

          {ethPriceMXN && (
            <div className="col-span-2">
              <span className="text-zinc-500 text-xs">Precio ETH ahora</span>
              <p className="text-zinc-300 mt-0.5">
                ${ethPriceMXN.toLocaleString('es-MX')} MXN
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ImageUploadButton({
  onUpload,
  disabled,
}: {
  onUpload: (uri: string, filename: string) => void
  disabled: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Error subiendo imagen')
      onUpload(data.ipfsUri as string, file.name)
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      // reset input so the same file can be selected again
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
        title="Subir imagen"
      >
        {uploading ? (
          <span className="animate-spin inline-block w-5 h-5 border border-zinc-400 border-t-transparent rounded-full" />
        ) : (
          <span className="text-lg">📎</span>
        )}
      </button>
    </>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'agent',
  content:
    '¡Hola! Soy NEXUS 👋 Tu agente de arte digital.\n\nPuedo lanzar tu colección NFT en Ethereum y hacer que tus compradores de todo el mundo te paguen en pesos mexicanos directamente en tu cuenta bancaria.\n\n¿Qué quieres crear hoy?',
  timestamp: Date.now(),
}

export default function ChatPage() {
  const { ready, authenticated, getAccessToken, user } = usePrivy()
  // Key aislada por wallet — evita que un usuario B vea la sesión de A
  const address = user?.wallet?.address ?? null
  const storageKey = address ? `nexus_session_${address.toLowerCase()}` : null

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [sessionState, setSessionState] = useState<SessionState>({
    collectionAddress: null,
    collectionName: null,
    mintedTokens: [],
    activeAuctions: [],
    totalEarnedMXN: 0,
    creatorClabe: null,
  })
  const [auctionCreated, setAuctionCreated] = useState(false)
  const [saleBanner, setSaleBanner] = useState<{
    collectionName: string | null
    ethAmount: number
    creatorMXN: number
    speiId: string | null
    speiStatus: string | null
    clabe: string | null
    tokenId: number | null
  } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Hidrata desde localStorage cuando cambia la wallet (aislado por address)
  useEffect(() => {
    // Resetea el estado al cambiar de wallet para no exponer datos de otra cuenta
    setSessionState({
      collectionAddress: null,
      collectionName: null,
      mintedTokens: [],
      activeAuctions: [],
      totalEarnedMXN: 0,
      creatorClabe: null,
    })
    setMessages([WELCOME_MESSAGE])
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SessionState> & { messages?: Message[] }
        setSessionState((prev) => ({ ...prev, ...parsed }))
        if (parsed.messages && parsed.messages.length > 0) {
          setMessages(parsed.messages)
        }
      }
    } catch {}
  }, [storageKey])

  // Guarda en localStorage cada vez que cambia sessionState con colección
  useEffect(() => {
    if (!storageKey || !sessionState.collectionAddress) return
    try {
      console.log('[NEXUS:chat] guardando en localStorage:', JSON.stringify({
        collectionAddress: sessionState.collectionAddress,
        activeAuctions: sessionState.activeAuctions,
      }))
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          collectionAddress: sessionState.collectionAddress,
          collectionName: sessionState.collectionName,
          mintedTokens: sessionState.mintedTokens,
          activeAuctions: sessionState.activeAuctions,
          totalEarnedMXN: sessionState.totalEarnedMXN,
          creatorClabe: sessionState.creatorClabe,
          messages: messages.slice(-50),
        })
      )
    } catch {}
  }, [sessionState, storageKey, messages])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Precio ETH/MXN en tiempo real
  const { data: ticker } = useQuery({
    queryKey: ['ticker', 'eth_mxn'],
    queryFn: () =>
      fetch('/api/bitso?action=ticker&book=eth_mxn').then((r) => r.json()),
    refetchInterval: 30_000,
  })
  const ethPriceMXN = ticker?.last ? parseFloat(ticker.last) : null

  // Historial de precios para sparkline
  const [priceHistory, setPriceHistory] = useState<{ t: number; p: number }[]>([])
  useEffect(() => {
    if (!ethPriceMXN) return
    setPriceHistory((prev) => [...prev, { t: Date.now(), p: ethPriceMXN }].slice(-30))
  }, [ethPriceMXN])

  const priceChange =
    priceHistory.length >= 2
      ? ((priceHistory.at(-1)!.p - priceHistory[0].p) / priceHistory[0].p) * 100
      : null

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTool])

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() },
    ])
  }, [])

  const handleNewConversation = useCallback(() => {
    if (storageKey) {
      try { localStorage.removeItem(storageKey) } catch {}
    }
    setMessages([WELCOME_MESSAGE])
    setSessionState({
      collectionAddress: null,
      collectionName: null,
      mintedTokens: [],
      activeAuctions: [],
      totalEarnedMXN: 0,
      creatorClabe: null,
    })
    setSaleBanner(null)
    setAuctionCreated(false)
  }, [storageKey])

  const handleImageUpload = useCallback(
    (ipfsUri: string, filename: string) => {
      setInput((prev) =>
        prev
          ? `${prev}\n[Imagen subida: ${filename} — ${ipfsUri}]`
          : `[Imagen subida: ${filename} — ${ipfsUri}]`
      )
      setSessionState((prev) => ({ ...prev, lastUploadedIpfsUri: ipfsUri }))
    },
    []
  )

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    addMessage({ role: 'user', content: text })
    setIsLoading(true)

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'agent')
        .slice(-10)
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))

      const accessToken = await getAccessToken().catch(() => null)
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          context: {
            ...sessionState,
            creatorWallet: user?.wallet?.address ?? null,
          },
          history,
        }),
      })

      const data = await res.json()

      // Muestra tools usadas
      if (data.toolsUsed?.length) {
        for (const toolName of data.toolsUsed as string[]) {
          addMessage({ role: 'tool', content: toolName, toolName })
        }
      }

      if (data.response) {
        addMessage({ role: 'agent', content: data.response })
      }

      // Actualiza sessionState si el agente retornó metadata
      if (data.metadata) {
        const meta = data.metadata as Partial<SessionState> & {
          lastSaleEth?: number
          lastSaleMXN?: number
          lastSaleSpeiId?: string | null
          lastSaleSpeiStatus?: string | null
          lastSaleClabe?: string | null
          lastSaleTokenId?: number
        }
        setSessionState((prev) => {
          const next = {
            ...prev,
            ...(meta.collectionAddress && { collectionAddress: meta.collectionAddress }),
            ...(meta.collectionName && { collectionName: meta.collectionName }),
            ...(meta.mintedTokens && { mintedTokens: meta.mintedTokens }),
            ...(meta.activeAuctions && {
              activeAuctions: [...prev.activeAuctions, ...meta.activeAuctions],
            }),
            ...(typeof meta.totalEarnedMXN === 'number' && {
              totalEarnedMXN: meta.totalEarnedMXN,
            }),
            ...(meta.creatorClabe && { creatorClabe: meta.creatorClabe }),
          }
          // Persiste inmediatamente cuando hay datos de colección/subasta
          if (storageKey && next.collectionAddress) {
            try {
              console.log('[NEXUS:chat] guardando en localStorage (inmediato):', JSON.stringify({
                collectionAddress: next.collectionAddress,
                activeAuctions: next.activeAuctions,
              }))
              localStorage.setItem(
                storageKey,
                JSON.stringify({
                  collectionAddress: next.collectionAddress,
                  collectionName: next.collectionName,
                  mintedTokens: next.mintedTokens,
                  activeAuctions: next.activeAuctions,
                  totalEarnedMXN: next.totalEarnedMXN,
                  creatorClabe: next.creatorClabe,
                })
              )
            } catch {}
          }

          // Banner de venta exitosa + marcar subasta como settled
          if ((data.toolsUsed as string[])?.includes('record_sale')) {
            const earnedDelta =
              typeof meta.totalEarnedMXN === 'number'
                ? meta.totalEarnedMXN - prev.totalEarnedMXN
                : (meta.lastSaleMXN as number | undefined) ?? 0
            const saleMXN = earnedDelta || (meta.lastSaleMXN as number | undefined) || 0
            const settledTokenId = meta.lastSaleTokenId as number | undefined

            if (saleMXN > 0) {
              setSaleBanner({
                collectionName: next.collectionName ?? prev.collectionName,
                ethAmount: (meta.lastSaleEth as number | undefined) ?? (ethPriceMXN ? saleMXN / ethPriceMXN : 0),
                creatorMXN: saleMXN,
                speiId: (meta.lastSaleSpeiId as string | null | undefined) ?? null,
                speiStatus: (meta.lastSaleSpeiStatus as string | null | undefined) ?? null,
                clabe: (meta.lastSaleClabe as string | null | undefined) ?? null,
                tokenId: settledTokenId ?? null,
              })
            }

            // Marca la subasta como settled en el estado local
            if (settledTokenId !== undefined) {
              next.activeAuctions = next.activeAuctions.map((a) =>
                a.tokenId === settledTokenId
                  ? {
                      ...a,
                      settled: true,
                      speiId: (meta.lastSaleSpeiId as string | undefined) ?? undefined,
                      creatorMXN: saleMXN,
                      clabe: (meta.lastSaleClabe as string | undefined) ?? undefined,
                    }
                  : a
              )
            }
          }

          return next
        })
      }

      // Activa banner si se creó una subasta
      if ((data.toolsUsed as string[])?.includes('create_auction')) {
        setAuctionCreated(true)
      }
    } catch {
      addMessage({
        role: 'agent',
        content: 'Algo salió mal. ¿Podrías intentarlo de nuevo?',
      })
    } finally {
      setIsLoading(false)
      setActiveTool(null)
    }
  }, [input, isLoading, messages, sessionState, addMessage, storageKey, getAccessToken, ethPriceMXN])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auth overlay
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <Header />

      <div className="flex flex-col flex-1 min-h-0 relative">
      {/* Sub-barra del chat */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-950/80 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
          )}
          {ethPriceMXN && (
            <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
              {/* Texto */}
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">ETH / MXN</span>
                <span className="text-sm font-bold text-violet-400 tabular-nums mt-0.5">
                  ${ethPriceMXN.toLocaleString('es-MX')}
                </span>
                {priceChange !== null && (
                  <span className={`text-[10px] font-semibold mt-0.5 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
                  </span>
                )}
              </div>
              {/* Sparkline */}
              {priceHistory.length >= 2 && (
                <div className="w-20 h-9 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <RechartTooltip
                        contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6, padding: '2px 6px' }}
                        itemStyle={{ color: '#a78bfa', fontSize: 10 }}
                        formatter={(v: number) => [`$${v.toLocaleString('es-MX')}`, 'ETH']}
                        labelFormatter={() => ''}
                      />
                      <Line
                        type="monotone"
                        dataKey="p"
                        stroke={priceChange !== null && priceChange < 0 ? '#f87171' : '#a78bfa'}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
        {messages.length > 1 && (
          <button
            onClick={handleNewConversation}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors shrink-0"
          >
            🗑️ Nueva conversación
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-zinc-950 to-zinc-900">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}

        {/* Tool en ejecución */}
        {activeTool && (
          <div className="flex justify-start mb-2">
            <ToolPill name={activeTool} done={false} />
          </div>
        )}

        {/* Indicador de escritura */}
        {isLoading && !activeTool && (
          <div className="flex justify-start mb-3">
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
              <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Banner: venta completada + comprobante SPEI */}
      {saleBanner && (
        <>
          <div className="shrink-0 mx-3 mb-2 relative overflow-hidden rounded-xl border border-green-400 bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 shadow-lg shadow-green-900/40 animate-[fadeSlideUp_0.4s_ease-out]">
            {/* confeti decorativo */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              {['🎉','✨','🎊','⭐','💚'].map((emoji, i) => (
                <span
                  key={i}
                  className="absolute text-lg animate-bounce"
                  style={{
                    left: `${10 + i * 18}%`,
                    top: `${i % 2 === 0 ? '-4px' : '2px'}`,
                    animationDelay: `${i * 120}ms`,
                    animationDuration: '1.2s',
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">
                  🎉 ¡Venta completada! {saleBanner.collectionName ? `— ${saleBanner.collectionName}` : ''}
                </p>
                <p className="text-green-100 text-xs mt-0.5 font-medium">
                  Ganaste:{' '}
                  {saleBanner.ethAmount > 0
                    ? `${saleBanner.ethAmount.toFixed(4)} ETH = `
                    : ''}
                  <span className="text-white font-bold">
                    ${saleBanner.creatorMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </p>
                <p className="text-green-200 text-xs mt-0.5">En camino a tu cuenta vía SPEI</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/dashboard"
                  className="text-xs text-white font-semibold underline underline-offset-2 hover:no-underline whitespace-nowrap"
                >
                  Ver en Dashboard →
                </Link>
                <button
                  onClick={() => setSaleBanner(null)}
                  className="text-green-200 hover:text-white text-lg leading-none"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* Comprobante SPEI */}
          <div className="shrink-0 mx-3 mb-2 animate-[fadeSlideUp_0.5s_ease-out_0.15s_both]">
            <SPEIReceipt
              data={{
                collectionName: saleBanner.collectionName,
                tokenId: saleBanner.tokenId,
                amountMXN: saleBanner.creatorMXN,
                speiId: saleBanner.speiId,
                speiStatus: saleBanner.speiStatus ?? undefined,
                clabe: saleBanner.clabe,
              }}
            />
          </div>
        </>
      )}

      {/* Banner: subasta creada */}
      {auctionCreated && (
        <div className="shrink-0 mx-3 mb-2 flex items-center justify-between gap-3 bg-green-950 border border-green-700 rounded-xl px-4 py-2.5">
          <span className="text-green-400 text-sm font-medium">
            ✅ Tu subasta está activa
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs text-green-300 hover:text-white font-medium transition-colors"
            >
              Ver en Dashboard →
            </Link>
            <button
              onClick={() => setAuctionCreated(false)}
              className="text-green-600 hover:text-green-400 text-sm"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 border-t border-zinc-800 backdrop-blur-sm bg-zinc-900/80">
        <div className="flex items-end gap-2 px-3 py-2 max-w-3xl mx-auto">
          <ImageUploadButton onUpload={handleImageUpload} disabled={isLoading} />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-1 focus:ring-violet-600 disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collection status */}
      <CollectionStatus state={sessionState} ethPriceMXN={ethPriceMXN} />

      {/* Auth overlay */}
      {!authenticated && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
          <p className="text-zinc-300 text-sm">Conecta tu cuenta para empezar</p>
          <WalletButton />
        </div>
      )}
      </div>
    </div>
  )
}
