'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import WalletButton from './WalletButton'

const OWNER_WALLET = process.env.NEXT_PUBLIC_OWNER_WALLET?.trim().toLowerCase() ?? ''

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/chat', label: 'Chat' },
  { href: '/dashboard', label: 'Dashboard' },
]

export default function Header() {
  const pathname = usePathname()
  const { authenticated, user } = usePrivy()

  const connectedAddress = user?.wallet?.address?.toLowerCase() ?? ''
  const isOwner = authenticated && connectedAddress === OWNER_WALLET

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="text-xl font-bold text-white tracking-tight shrink-0">
          NEXUS
        </Link>

        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-6">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`text-sm transition-colors ${
                    pathname === href
                      ? 'text-white font-medium'
                      : 'text-zinc-400 hover:text-violet-400'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
            {isOwner && (
              <li>
                <Link
                  href="/admin"
                  className={`text-sm transition-colors ${
                    pathname === '/admin'
                      ? 'text-white font-medium'
                      : 'text-zinc-400 hover:text-violet-400'
                  }`}
                >
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <WalletButton />
      </div>
    </header>
  )
}
