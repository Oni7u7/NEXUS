'use client'

import { useState } from 'react'

export interface SPEIReceiptData {
  collectionName: string | null
  tokenId: number | null
  amountMXN: number
  speiId: string | null
  speiStatus?: string   // 'simulated' | 'pending' | 'processing' | 'complete'
  clabe: string | null // pre-masked, e.g. "••••••••••••3327"
}

function printReceipt(data: SPEIReceiptData) {
  const fecha = new Date().toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const concepto = data.collectionName
    ? `Venta NFT — ${data.collectionName}${data.tokenId != null ? ` #${data.tokenId}` : ''}`
    : `Venta NFT${data.tokenId != null ? ` #${data.tokenId}` : ''}`
  const monto = data.amountMXN.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Comprobante SPEI — NEXUS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 32px 16px; }
    .receipt { background: #fff; width: 420px; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,.12); overflow: hidden; }
    .header { background: #18181b; color: #fff; padding: 20px 24px; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .logo span { color: #a78bfa; }
    .subtitle { font-size: 11px; color: #a1a1aa; margin-top: 2px; }
    .status-bar { background: #16a34a; color: #fff; padding: 10px 24px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .body { padding: 24px; }
    .amount-block { text-align: center; padding: 20px 0 24px; border-bottom: 1px dashed #e4e4e7; }
    .amount-label { font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: .5px; }
    .amount-value { font-size: 36px; font-weight: 800; color: #18181b; margin-top: 4px; }
    .amount-currency { font-size: 16px; font-weight: 600; color: #52525b; }
    .rows { margin-top: 20px; display: flex; flex-direction: column; gap: 14px; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .row-label { font-size: 12px; color: #71717a; white-space: nowrap; }
    .row-value { font-size: 13px; color: #18181b; font-weight: 500; text-align: right; word-break: break-all; }
    .row-value.mono { font-family: monospace; letter-spacing: .5px; }
    .divider { border: none; border-top: 1px solid #f4f4f5; margin: 20px 0; }
    .footer { padding: 16px 24px 24px; text-align: center; }
    .footer p { font-size: 11px; color: #a1a1aa; line-height: 1.6; }
    .footer strong { color: #52525b; }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">NEX<span>US</span></div>
      <div class="subtitle">Comprobante de Transferencia SPEI</div>
    </div>
    <div class="status-bar">&#x2705; En proceso &#x2014; SPEI iniciado</div>
    <div class="body">
      <div class="amount-block">
        <div class="amount-label">Monto a recibir</div>
        <div class="amount-value">$${monto} <span class="amount-currency">MXN</span></div>
      </div>
      <div class="rows">
        <div class="row"><span class="row-label">Concepto</span><span class="row-value">${concepto}</span></div>
        <div class="row"><span class="row-label">CLABE destino</span><span class="row-value mono">${data.clabe ?? 'No registrada'}</span></div>
        <div class="row"><span class="row-label">Referencia</span><span class="row-value mono">${data.speiId ?? '&#x2014;'}</span></div>
        <div class="row"><span class="row-label">Fecha</span><span class="row-value">${fecha}</span></div>
        <div class="row"><span class="row-label">Tiempo estimado</span><span class="row-value">2 &#x2013; 4 horas h&#xE1;biles</span></div>
      </div>
      <hr class="divider" />
    </div>
    <div class="footer">
      <p>Transferencia procesada por <strong>NEXUS Protocol</strong> v&#xED;a Bitso.</p>
      <p style="margin-top:6px">Guarda este comprobante para cualquier aclaraci&#xF3;n.</p>
    </div>
  </div>
  <script>window.onload = function(){ window.print() }</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'width=520,height=680')
  // Revoca el blob URL después de que la ventana cargue
  if (win) {
    win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  }
}

// ── Componente inline (para chat y dashboard) ─────────────────────────────────

export default function SPEIReceipt({
  data,
  collapsible = false,
}: {
  data: SPEIReceiptData
  collapsible?: boolean
}) {
  const concepto = data.collectionName
    ? `Venta NFT — ${data.collectionName}${data.tokenId != null ? ` #${data.tokenId}` : ''}`
    : `Venta NFT${data.tokenId != null ? ` #${data.tokenId}` : ''}`
  const monto = data.amountMXN.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const inner = (
    <div className="rounded-xl border border-zinc-700 overflow-hidden text-sm bg-zinc-900">
      {/* Header */}
      <div className="bg-zinc-950 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-bold text-white tracking-tight">
            NEX<span className="text-violet-400">US</span>
          </span>
          <span className="ml-2 text-zinc-500 text-xs">Comprobante SPEI</span>
        </div>
        {data.speiStatus === 'simulated' ? (
          <span className="text-xs bg-blue-900/60 text-blue-300 border border-blue-700 rounded-full px-2 py-0.5 font-medium">
            🔵 Demo — En producción llegaría vía SPEI real
          </span>
        ) : (
          <span className="text-xs bg-green-900/60 text-green-400 border border-green-700 rounded-full px-2 py-0.5 font-medium">
            ✅ En proceso
          </span>
        )}
      </div>

      {/* Monto destacado */}
      <div className="text-center py-4 border-b border-dashed border-zinc-700">
        <p className="text-zinc-500 text-xs uppercase tracking-wide">Monto a recibir</p>
        <p className="text-2xl font-extrabold text-white mt-1">
          ${monto} <span className="text-base font-semibold text-zinc-400">MXN</span>
        </p>
      </div>

      {/* Filas de datos */}
      <div className="px-4 py-4 space-y-3">
        {[
          { label: 'Concepto', value: concepto },
          { label: 'CLABE destino', value: data.clabe ?? 'No registrada', mono: true },
          { label: 'Referencia', value: data.speiId ?? '—', mono: true },
          { label: 'Tiempo estimado', value: '2 – 4 horas hábiles' },
        ].map(({ label, value, mono }) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-zinc-500 text-xs shrink-0">{label}</span>
            <span
              className={`text-zinc-200 text-xs text-right ${mono ? 'font-mono' : 'font-medium'}`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
        <p className="text-zinc-600 text-xs">Procesado via Bitso · NEXUS Protocol</p>
        <button
          onClick={() => printReceipt(data)}
          className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Guardar PDF →
        </button>
      </div>
    </div>
  )

  if (!collapsible) return inner

  // Versión colapsable (para dashboard)
  return <CollapsibleReceipt>{inner}</CollapsibleReceipt>
}

function CollapsibleReceipt({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v: boolean) => !v)}
        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
      >
        <span>🏦 Ver comprobante SPEI</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}
