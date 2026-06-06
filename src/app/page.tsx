'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import Header from './_components/Header'

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const IconMoney = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
)

const IconGlobe = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const IconFrame = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="m9 9 2 2 4-4" />
    <rect x="7" y="13" width="10" height="4" rx="1" opacity=".4" />
  </svg>
)

const IconTrendUp = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
)

const IconNetwork = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M12 7v4M12 11l-5.5 6M12 11l5.5 6" />
  </svg>
)

const IconPalette = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
)

const IconHammer = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
    <path d="M17.64 15 22 10.64" />
    <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
  </svg>
)

const IconWallet = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
)

const IconChat = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const IconCamera = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
)

const IconRocket = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
)

const IconAuction = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8L4 6l2-2 2 2-2 2z" />
    <path d="m7.5 9.5 7 7" />
    <path d="M16 8l2-2 2 2-2 2-2-2z" />
    <path d="m14.5 9.5-7 7" />
    <path d="M2 20h20" />
    <path d="m9 15 3-3" />
  </svg>
)

const IconCoins = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </svg>
)

const IconMusic = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)

const IconPen = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

const IconTrophy = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

const IconCheck = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconX = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ─── Data ───────────────────────────────────────────────────────────────────

const remesasData = [
  { year: '2020', amount: 40.6 },
  { year: '2021', amount: 51.6 },
  { year: '2022', amount: 58.5 },
  { year: '2023', amount: 63.3 },
  { year: '2024', amount: 64.7 },
]

const nftLatamData = [
  { year: '2024', value: 100 },
  { year: '2025', value: 130.8 },
  { year: '2026', value: 171 },
  { year: '2027', value: 223.5 },
  { year: '2028', value: 292.3 },
  { year: '2030', value: 499.2 },
]

// ─── Counter hook ─────────────────────────────────────────────────────────────

function useCountUp(target: string, duration = 2000) {
  const [display, setDisplay] = useState('0')
  const [animating, setAnimating] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const numericMatch = target.replace(/,/g, '').match(/[\d.]+/)
    if (!numericMatch) { setDisplay(target); return }
    const end = parseFloat(numericMatch[0])

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          setAnimating(true)
          const startTime = performance.now()
          const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // ease out expo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            const current = eased * end

            let formatted = ''
            if (target.startsWith('$') && target.includes(',')) {
              formatted = '$' + Math.round(current).toLocaleString('en-US') + 'M USD'
            } else if (target.startsWith('$') && target.includes('B')) {
              formatted = '$' + current.toFixed(0) + 'B USD'
            } else if (target.endsWith('%')) {
              formatted = current.toFixed(1) + '%'
            } else if (target.endsWith('M')) {
              formatted = Math.round(current) + 'M'
            } else {
              formatted = current.toFixed(1)
            }
            setDisplay(formatted)
            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              setDisplay(target)
              setAnimating(false)
            }
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { ref, display, animating }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  source,
  icon,
  subtext,
}: {
  value: string
  label: string
  source: string
  icon: React.ReactNode
  subtext: string
}) {
  const { ref, display, animating } = useCountUp(value)
  return (
    <div className="rounded-2xl border border-calypso-800 bg-calypso-900/60 p-6 flex flex-col gap-3 hover:border-calypso-500/40 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-calypso-500/10 border border-calypso-500/20 flex items-center justify-center text-calypso-300 group-hover:bg-calypso-500/20 transition-colors">
          {icon}
        </div>
        <span className="text-xs text-calypso-600 text-right max-w-[130px] leading-snug">{source}</span>
      </div>
      <span
        ref={ref}
        className={`text-3xl md:text-4xl font-bold tabular-nums transition-all duration-300 ${
          animating ? 'text-calypso-200' : 'text-white'
        }`}
      >
        {display}
      </span>
      <p className="text-sm font-medium text-calypso-200">{label}</p>
      <p className="text-xs text-calypso-400">{subtext}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-calypso-950 text-white">

        {/* ── SECTION 1: HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-calypso-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 flex flex-col items-center text-center gap-8">

            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              El arte de LATAM merece estar en el mundo
            </h2>

            <p className="text-lg text-calypso-300 leading-relaxed max-w-xl">
              Unete a los primeros creadores que estan monetizando su arte digitalmente con IA y
              blockchain — en espanol, en pesos.
            </p>


            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/chat"
                className="px-7 py-3.5 rounded-full bg-calypso-600 hover:bg-calypso-500 hover:shadow-xl hover:shadow-calypso-500/30 text-white font-semibold transition-all duration-200 text-base"
              >
                Hablar con NEXUS →
              </Link>
              <Link
                href="/dashboard"
                className="px-7 py-3.5 rounded-full border border-calypso-700 hover:border-calypso-500/50 hover:text-calypso-200 text-calypso-300 font-medium transition-all duration-200 text-base"
              >
                Ver el mercado ↗
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-calypso-400 mt-2">
              {[
                'Sin comisiones ocultas',
                'Sin conocimientos tecnicos',
                'Pago directo a tu cuenta',
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <IconCheck className="w-3.5 h-3.5 text-green-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 2: STATS ────────────────────────────────────────────── */}
        <section className="py-20 px-6 border-t border-calypso-800/50">
          <div className="mx-auto max-w-6xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                value="3.3M"
                label="Creadores digitales en Mexico"
                source="BBVA Research + Social Media Week 2024"
                icon={<IconPalette className="w-5 h-5" />}
                subtext="Solo el 1% monetiza globalmente su arte"
              />
              <StatCard
                value="12M"
                label="Mexicanos en EE.UU."
                source="CONAPO + BBVA Research 2024"
                icon={<IconGlobe className="w-5 h-5" />}
                subtext="Pagando 5-8% de comision en remesas"
              />
              <StatCard
                value="$49B USD"
                label="Mercado NFT Global 2025"
                source="AInvest Research 2025"
                icon={<IconFrame className="w-5 h-5" />}
                subtext="Proyectado a $703B para 2034"
              />
              <StatCard
                value="30.8%"
                label="CAGR NFT en LATAM 2024-2030"
                source="AInvest Research 2025"
                icon={<IconTrendUp className="w-5 h-5" />}
                subtext="La region de mayor crecimiento mundial"
              />
            </div>
          </div>
        </section>

        {/* ── SECTION 3: EL PROBLEMA ──────────────────────────────────────── */}
        <section className="py-20 px-6 border-t border-calypso-800/50">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                El talento esta en LATAM. El mercado, en el mundo.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-calypso-300 to-calypso-400">
                  NEXUS los conecta.
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-red-900/40 bg-red-950/10 p-7">
                <h3 className="text-lg font-bold text-red-400 mb-5">Sin NEXUS</h3>
                <ul className="flex flex-col gap-3.5">
                  {[
                    'Necesitas saber Solidity para crear NFTs',
                    'Las plataformas solo estan en ingles',
                    'Western Union cobra hasta 8% de comision',
                    'Necesitas ETH para pagar el gas',
                    'El pago llega en crypto, no en pesos',
                    'Proceso manual de 6+ plataformas distintas',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-calypso-300 text-sm">
                      <IconX className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-green-900/40 bg-green-950/10 p-7">
                <h3 className="text-lg font-bold text-green-400 mb-5">Con NEXUS</h3>
                <ul className="flex flex-col gap-3.5">
                  {[
                    'Solo hablas en espanol con el agente',
                    'Interface 100% en espanol',
                    'Menos del 1% de fee del protocolo',
                    'El protocolo paga el gas por ti',
                    'Recibes pesos mexicanos via SPEI',
                    'Un solo chat hace todo automaticamente',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-calypso-200 text-sm">
                      <IconCheck className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-calypso-500/20 bg-calypso-500/5 p-6 text-center">
              <p className="text-base md:text-lg text-calypso-200 leading-relaxed">
                Si el 1% de los creadores digitales de Mexico usara NEXUS,{' '}
                <span className="text-calypso-300 font-semibold">
                  generariamos $2.4M USD en volumen mensual
                </span>
              </p>
              <p className="text-xs text-calypso-600 mt-2">
                443,000 creadores en Mexico x ingreso promedio $1,100 USD/mes (Stripe, 2023)
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-900/30 bg-amber-950/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="shrink-0 text-2xl">💸</div>
              <div className="flex-1">
                <p className="text-sm text-calypso-200 leading-relaxed">
                  Los mexicanos pagan{' '}
                  <span className="text-amber-400 font-semibold">5-8%</span>{' '}
                  para recibir dinero del extranjero via Western Union. Con NEXUS los creadores pagan{' '}
                  <span className="text-green-400 font-semibold">menos del 1%</span>.
                </p>
                <p className="text-xs text-calypso-600 mt-1">Fuente: Profeco + Banco de Mexico 2024</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: COMO FUNCIONA ────────────────────────────────────── */}
        <section className="py-20 px-6 border-t border-calypso-800/50">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                De &ldquo;quiero vender mi arte&rdquo; a pesos en tu cuenta.{' '}
                <span className="text-calypso-300">En minutos.</span>
              </h2>
            </div>

            <div className="relative flex flex-col gap-0">
              <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-calypso-500/60 via-calypso-500/20 to-transparent hidden sm:block" />

              {[
                {
                  icon: <IconChat className="w-5 h-5" />,
                  title: 'Habla con NEXUS',
                  desc: 'Escribele en espanol lo que quieres crear. No necesitas saber nada de blockchain.',
                  time: '30 segundos',
                },
                {
                  icon: <IconCamera className="w-5 h-5" />,
                  title: 'Sube tu arte',
                  desc: 'Adjunta tu imagen (JPG, PNG, GIF). NEXUS la sube automaticamente a IPFS — almacenamiento descentralizado permanente.',
                  time: '10 segundos',
                },
                {
                  icon: <IconRocket className="w-5 h-5" />,
                  title: 'Tu coleccion en Ethereum',
                  desc: 'El agente despliega tu contrato ERC-721, acuna tu NFT y lo registra en la blockchain de Ethereum. Todo con tu metadata en IPFS.',
                  time: '~2 minutos',
                },
                {
                  icon: <IconHammer className="w-5 h-5" />,
                  title: 'Subasta al mundo',
                  desc: 'NEXUS analiza el mercado en SuperRareBazaar, sugiere el precio optimo y abre una subasta de 48 horas visible para compradores globales.',
                  time: '30 segundos',
                },
                {
                  icon: <IconCoins className="w-5 h-5" />,
                  title: 'Pesos en tu cuenta',
                  desc: 'Cuando alguien compra, NEXUS convierte ETH a MXN usando el tipo de cambio real de Bitso y deposita via SPEI directo a tu CLABE bancaria.',
                  time: '2-4 horas habiles',
                },
              ].map((step, i) => (
                <div key={i} className="relative flex gap-5 pb-10 last:pb-0">
                  <div className="relative z-10 shrink-0 w-12 h-12 rounded-full bg-calypso-900 border-2 border-calypso-500/50 flex items-center justify-center text-calypso-300">
                    {step.icon}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex flex-wrap items-baseline gap-3 mb-1.5">
                      <h3 className="text-white font-semibold text-base">{step.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-calypso-500/10 border border-calypso-500/20 text-calypso-300 font-mono">
                        {step.time}
                      </span>
                    </div>
                    <p className="text-sm text-calypso-300 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: LOS 4 AGENTES ────────────────────────────────────── */}
        <section className="py-20 px-6 border-t border-calypso-800/50">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                4 agentes de IA trabajando para ti
              </h2>
              <p className="text-calypso-400 max-w-xl mx-auto">
                Cada agente tiene un rol especializado. Juntos gestionan toda tu economia digital.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  icon: <IconNetwork className="w-6 h-6" />,
                  title: 'Agente Embajador',
                  badge: 'Interfaz',
                  desc: 'Habla contigo en espanol. Interpreta tus intenciones y coordina a los demas agentes. Es tu unico punto de contacto.',
                  tags: ['Claude AI', 'Espanol', 'NLP'],
                  badgeColor: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
                  iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
                },
                {
                  icon: <IconPalette className="w-6 h-6" />,
                  title: 'Agente Creador',
                  badge: 'Blockchain',
                  desc: 'Despliega colecciones ERC-721, acuna NFTs con metadata valido y los sube a IPFS via Pinata automaticamente.',
                  tags: ['Rare Protocol', 'IPFS', 'ERC-721'],
                  badgeColor: 'bg-calypso-500/10 border-calypso-500/20 text-calypso-300',
                  iconBg: 'bg-calypso-500/10 border-calypso-500/20 text-calypso-300',
                },
                {
                  icon: <IconAuction className="w-6 h-6" />,
                  title: 'Agente Mercado',
                  badge: 'DeFi',
                  desc: 'Analiza subastas activas en SuperRareBazaar, optimiza el precio de reserva y gestiona el ciclo completo de la subasta.',
                  tags: ['SuperRare', 'Auctions', 'Market Data'],
                  badgeColor: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
                  iconBg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
                },
                {
                  icon: <IconWallet className="w-6 h-6" />,
                  title: 'Agente Tesorero',
                  badge: 'Pagos',
                  desc: 'Convierte ETH a MXN con tipo de cambio real, registra la venta onchain en NexusRegistry y ejecuta el SPEI a tu CLABE bancaria.',
                  tags: ['Bitso', 'SPEI', 'Smart Contract'],
                  badgeColor: 'bg-green-500/10 border-green-500/20 text-green-400',
                  iconBg: 'bg-green-500/10 border-green-500/20 text-green-400',
                },
              ].map((agent) => (
                <div
                  key={agent.title}
                  className="rounded-2xl border border-calypso-800 bg-calypso-900/50 p-6 flex flex-col gap-4 hover:border-calypso-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${agent.iconBg}`}>
                      {agent.icon}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${agent.badgeColor}`}>
                      {agent.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base mb-2">{agent.title}</h3>
                    <p className="text-sm text-calypso-300 leading-relaxed">{agent.desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {agent.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-calypso-800 text-calypso-400 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6: DATOS DEL MERCADO ────────────────────────────────── */}
        <section className="py-20 px-6 border-t border-calypso-800/50">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                El mercado que NEXUS esta abriendo
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Chart 1 — Remesas: AreaChart con gradiente */}
              <div className="rounded-2xl border border-calypso-800 bg-calypso-900/50 p-6">
                <h3 className="text-white font-semibold mb-1">
                  Remesas a Mexico (miles de millones USD)
                </h3>
                <p className="text-xs text-calypso-600 mb-6">Fuente: Banco de Mexico</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={remesasData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="remesasGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#40809a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#40809a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#304a5a" />
                    <XAxis dataKey="year" tick={{ fill: '#5b9db5', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#5b9db5', fontSize: 11 }} axisLine={false} tickLine={false} domain={[35, 70]} />
                    <Tooltip
                      contentStyle={{ background: '#2c3f4d', border: '1px solid #304a5a', borderRadius: 8, color: '#fff' }}
                      formatter={(v) => [`$${v}B USD`, 'Remesas']}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#40809a"
                      strokeWidth={2.5}
                      fill="url(#remesasGrad)"
                      dot={{ fill: '#40809a', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#5b9db5', strokeWidth: 0 }}
                      isAnimationActive
                      animationDuration={1800}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 2 — NFT LATAM: BarChart con animacion escalonada */}
              <div className="rounded-2xl border border-calypso-800 bg-calypso-900/50 p-6">
                <h3 className="text-white font-semibold mb-1">
                  Crecimiento NFT en LATAM (indice base 100)
                </h3>
                <p className="text-xs text-calypso-600 mb-6">CAGR 30.8% — Fuente: AInvest Research 2025</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={nftLatamData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5b9db5" />
                        <stop offset="100%" stopColor="#32576c" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#304a5a" />
                    <XAxis dataKey="year" tick={{ fill: '#5b9db5', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#5b9db5', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#2c3f4d', border: '1px solid #304a5a', borderRadius: 8, color: '#fff' }}
                      formatter={(v) => [Number(v).toFixed(1), 'Indice']}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#barGrad)"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive
                      animationDuration={1400}
                      animationEasing="ease-out"
                      animationBegin={100}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 mt-8">
              {[
                { value: '99.1%', label: 'Remesas a Mexico por transferencia electronica', source: 'BBVA 2024' },
                { value: '116%', label: 'Crecimiento crypto en LATAM en 2024', source: 'Bitso + Coinchange' },
                { value: '3.3M', label: 'Creadores digitales en Mexico', source: 'BBVA Research 2024' },
              ].map((d) => (
                <div key={d.value} className="rounded-xl border border-calypso-800 bg-calypso-900/40 p-5 text-center">
                  <p className="text-3xl font-bold text-calypso-300 mb-1">{d.value}</p>
                  <p className="text-sm text-calypso-300 leading-snug">{d.label}</p>
                  <p className="text-xs text-calypso-600 mt-1">{d.source}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 7: PARA QUIEN ES NEXUS ─────────────────────────────── */}
        <section className="py-20 px-6 border-t border-calypso-800/50">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white">¿Eres tu?</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: <IconPalette className="w-6 h-6" />,
                  iconBg: 'bg-calypso-500/10 border-calypso-500/20 text-calypso-300',
                  title: 'El Artista Digital',
                  desc: 'Tienes talento, tienes obras. Te falta el mercado global. NEXUS te conecta con compradores en todo el mundo sin que tengas que aprender ingles ni blockchain.',
                },
                {
                  icon: <IconCamera className="w-6 h-6" />,
                  iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
                  title: 'El Fotografo',
                  desc: 'Tus fotografias merecen vivir para siempre. Con NEXUS las conviertes en NFTs unicos con metadata permanente en IPFS.',
                },
                {
                  icon: <IconMusic className="w-6 h-6" />,
                  iconBg: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
                  title: 'El Musico',
                  desc: 'Tu musica como NFT te da royalties automaticos cada vez que se revende. Para siempre. Sin intermediarios.',
                },
                {
                  icon: <IconPen className="w-6 h-6" />,
                  iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
                  title: 'El Ilustrador',
                  desc: 'Cada ilustracion es una inversion. Los compradores coleccionan tu trabajo y tu recibes pesos en tu cuenta bancaria por cada venta.',
                },
              ].map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-calypso-800 bg-calypso-900/50 p-6 flex flex-col gap-4 hover:border-calypso-500/30 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${p.iconBg}`}>
                    {p.icon}
                  </div>
                  <h3 className="text-white font-semibold">{p.title}</h3>
                  <p className="text-sm text-calypso-300 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── FOOTER agregacion de extras ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-calypso-800 bg-calypso-950 py-12 px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
              <div className="flex flex-col gap-2">
                <Image
                  src="/Nexus-words.png"
                  alt="NEXUS"
                  width={90}
                  height={22}
                  className="h-6 w-auto object-contain"
                />
                <p className="text-xs text-calypso-600">© 2026 NEXUS Protocol</p>
              </div>

              <div className="flex gap-12">
                <div>
                  <p className="text-xs font-semibold text-calypso-400 uppercase tracking-wider mb-3">
                    Producto
                  </p>
                  <ul className="flex flex-col gap-2">
                    {[
                      { href: '/chat', label: 'Chat' },
                      { href: '/dashboard', label: 'Dashboard' },
                      { href: '/admin', label: 'Admin' },
                    ].map(({ href, label }) => (
                      <li key={href}>
                        <Link href={href} className="text-sm text-calypso-400 hover:text-white transition-colors">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-calypso-400 uppercase tracking-wider mb-3">
                    Ecosistema
                  </p>
                  <ul className="flex flex-col gap-2">
                    {['Rare Protocol', 'Bitso', 'Ethereum Mexico', 'Arbitrum'].map((label) => (
                      <li key={label}>
                        <span className="text-sm text-calypso-400">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-calypso-800 pt-6">
              <p className="text-xs text-calypso-700 leading-relaxed max-w-2xl">
                NEXUS Protocol es un proyecto experimental presentado en ETH Mexico 2026. Los NFTs
                se despliegan en Ethereum Sepolia (testnet). El SPEI usa Bitso Business Stage
                (sandbox).
              </p>
            </div>
          </div>
        </footer>

      </main>
    </>
  )
}
