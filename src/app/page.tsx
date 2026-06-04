import Link from 'next/link'
import Header from './_components/Header'
import Footer from './_components/Footer'

const steps = [
  {
    num: '01',
    title: 'Habla con el agente',
    description:
      'Describe tu obra y tu colección. NEXUS te guía paso a paso sin que necesites saber nada de blockchain.',
  },
  {
    num: '02',
    title: 'Lanza tus NFTs',
    description:
      'El agente despliega tu contrato, acuña tus piezas y abre las subastas en Ethereum automáticamente.',
  },
  {
    num: '03',
    title: 'Cobra en pesos',
    description:
      'Cuando alguien gana una subasta, el ETH se convierte en MXN y llega directo a tu cuenta bancaria (CLABE).',
  },
]

const features = [
  {
    icon: '🤖',
    title: 'Agente con IA',
    description:
      'Conversa en español con NEXUS para crear colecciones, acuñar NFTs y gestionar subastas sin código.',
  },
  {
    icon: '🎨',
    title: 'Arte en la cadena',
    description:
      'Tus imágenes se guardan en IPFS y los contratos se despliegan en Ethereum con estándares ERC-721.',
  },
  {
    icon: '💸',
    title: 'Pagos en MXN',
    description:
      'Integración con Bitso y transferencia directa a CLABE para que cobres en pesos mexicanos.',
  },
]

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col gap-28 py-20 px-6">

        {/* Hero */}
        <section className="mx-auto max-w-4xl text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium">
            ETH Mexico 2025
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
            Tu arte en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Ethereum
            </span>
            , tus pagos en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
              pesos
            </span>
          </h1>

          <p className="max-w-xl text-lg text-zinc-400 leading-relaxed">
            NEXUS es tu agente de arte digital. Habla con él, lanza tu colección NFT y recibe
            el dinero de tus ventas directamente en tu cuenta bancaria mexicana.
          </p>

          <div className="flex items-center gap-4 mt-2">
            <Link
              href="/chat"
              className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
            >
              Hablar con NEXUS →
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium transition-colors"
            >
              Ver mis subastas
            </Link>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mx-auto w-full max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">¿Cómo funciona?</h2>
            <p className="text-zinc-500 mt-2 text-sm">Tres pasos para vender tu arte en el mundo</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-3"
              >
                <span className="text-violet-500 font-mono text-sm font-bold">{step.num}</span>
                <h3 className="text-white font-semibold">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Tecnología que trabaja por ti</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-3"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="text-white font-semibold">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-2xl text-center flex flex-col items-center gap-6 pb-4">
          <h2 className="text-3xl font-bold text-white">¿Listo para lanzar tu colección?</h2>
          <p className="text-zinc-400 text-base">
            No necesitas saber de crypto. Solo necesitas tu arte y tu CLABE.
          </p>
          <Link
            href="/chat"
            className="px-8 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors text-lg"
          >
            Empezar ahora →
          </Link>
        </section>

      </main>
      <Footer />
    </>
  )
}
