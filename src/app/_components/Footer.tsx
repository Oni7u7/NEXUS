import Link from 'next/link'

const footerLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/chat', label: 'Agente' },
  { href: '/dashboard', label: 'Dashboard' },
]

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-lg font-bold text-white">NEXUS</p>
          <p className="text-sm text-zinc-500 mt-1">Built at ETH Mexico 2025</p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-6">
            {footerLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} Nexus. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
