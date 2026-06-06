'use client'

import Link from 'next/link'
import Image from 'next/image'
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
      <div className="mx-auto max-w-7xl px-6 py-2 flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0 flex items-center gap-2">
          <Image
            src="/Nexus-words.png"
            alt="NEXUS"
            width={100}
            height={26}
            className="h-8 w-auto object-contain"
          />
        </Link>

        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-6">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`relative text-sm transition-colors pb-1 ${
                      active ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-violet-500" />
                    )}
                  </Link>
                </li>
              )
            })}
            {isOwner && (
              <li>
                {(() => {
                  const active = pathname === '/admin'
                  return (
                    <Link
                      href="/admin"
                      className={`relative text-sm transition-colors pb-1 ${
                        active ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Admin
                      {active && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-violet-500" />
                      )}
                    </Link>
                  )
                })()}
              </li>
            )}
          </ul>
        </nav>

        <WalletButton />
      </div>
    </header>
  )
}
