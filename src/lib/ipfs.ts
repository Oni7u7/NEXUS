/**
 * NEXUS — Upload de imágenes y metadata a IPFS via Pinata
 *
 * Vercel no tiene filesystem persistente, así que todo sube desde memoria (Buffer).
 * Modo mock activo si PINATA_JWT no está configurado.
 */

const PINATA_BASE = 'https://api.pinata.cloud'

function getPinataJWT(): string | null {
  return process.env.PINATA_JWT ?? null
}

function getGateway(): string {
  return process.env.PINATA_GATEWAY ?? 'https://gateway.pinata.cloud'
}

function ipfsToGateway(ipfsUri: string): string {
  const cid = ipfsUri.replace('ipfs://', '')
  return `${getGateway()}/ipfs/${cid}`
}

// ── Upload de imagen ─────────────────────────────────────────────────────────

/**
 * Sube un Buffer de imagen a Pinata IPFS.
 * Retorna la URI ipfs://Qm... para usar en el metadata del NFT.
 */
export async function uploadImageToIPFS(
  imageBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ ipfsUri: string; gatewayUrl: string }> {
  const jwt = getPinataJWT()

  if (!jwt) {
    console.warn('[NEXUS:ipfs] PINATA_JWT no configurado — retornando URI mock')
    const mockCid = `QmMOCK${Date.now().toString(16).toUpperCase().padStart(42, 'X')}`
    return {
      ipfsUri: `ipfs://${mockCid}`,
      gatewayUrl: `${getGateway()}/ipfs/${mockCid}`,
    }
  }

  const formData = new FormData()
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType })
  formData.append('file', blob, filename)
  formData.append(
    'pinataMetadata',
    JSON.stringify({ name: filename })
  )
  formData.append(
    'pinataOptions',
    JSON.stringify({ cidVersion: 1 })
  )

  const res = await fetch(`${PINATA_BASE}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pinata image upload error ${res.status}: ${text}`)
  }

  const data = await res.json() as { IpfsHash: string }
  const ipfsUri = `ipfs://${data.IpfsHash}`
  console.log('[NEXUS:ipfs] Imagen subida:', ipfsUri)

  return { ipfsUri, gatewayUrl: ipfsToGateway(ipfsUri) }
}

// ── Upload de metadata JSON ──────────────────────────────────────────────────

/**
 * Sube el metadata JSON del NFT a IPFS.
 * Retorna la URI ipfs://Qm... para usar como tokenURI en el contrato.
 */
export async function uploadMetadataToIPFS(metadata: {
  name: string
  description: string
  image: string   // ipfs:// URI de la imagen
  attributes?: Array<{ trait_type: string; value: string }>
}): Promise<{ ipfsUri: string; gatewayUrl: string }> {
  const jwt = getPinataJWT()

  if (!jwt) {
    console.warn('[NEXUS:ipfs] PINATA_JWT no configurado — retornando metadata mock')
    const mockCid = `QmMETAMOCK${Date.now().toString(16).toUpperCase().padStart(38, 'X')}`
    return {
      ipfsUri: `ipfs://${mockCid}`,
      gatewayUrl: `${getGateway()}/ipfs/${mockCid}`,
    }
  }

  const body = {
    pinataMetadata: { name: `${metadata.name}-metadata.json` },
    pinataOptions: { cidVersion: 1 },
    pinataContent: metadata,
  }

  const res = await fetch(`${PINATA_BASE}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pinata metadata upload error ${res.status}: ${text}`)
  }

  const data = await res.json() as { IpfsHash: string }
  const ipfsUri = `ipfs://${data.IpfsHash}`
  console.log('[NEXUS:ipfs] Metadata subida:', ipfsUri)

  return { ipfsUri, gatewayUrl: ipfsToGateway(ipfsUri) }
}
