'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

export default function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Render a static placeholder until client hydration completes —
  // this prevents a SSR/client mismatch on the `disabled` attribute.
  if (!mounted || !ready) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-full bg-calypso-600/40 text-white/50 text-sm font-medium cursor-not-allowed"
      >
        Connect Wallet
      </button>
    )
  }

  if (authenticated) {
    const address = user?.wallet?.address
    const display = address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : 'Connected'

    return (
      <button
        onClick={() => logout()}
        className="px-4 py-2 rounded-full border border-calypso-500 text-calypso-300 text-sm font-medium hover:bg-calypso-500/10 transition-colors cursor-pointer"
      >
        {display}
      </button>
    )
  }

  return (
    <button
      onClick={() => login()}
      className="px-4 py-2 rounded-full bg-calypso-600 hover:bg-calypso-500 text-white text-sm font-medium transition-colors cursor-pointer"
    >
      Connect Wallet
    </button>
  )
}
