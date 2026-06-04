import Anthropic from '@anthropic-ai/sdk'
import { tools, executeTool } from './tools'
import { EMBAJADOR_PROMPT } from './prompts'
import type { AgentInput, AgentOutput } from './types'

// Convierte inputSchema → input_schema para la API de Anthropic
function toAnthropicTools(agentTools: typeof tools): Anthropic.Tool[] {
  return agentTools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Tool['input_schema'],
  }))
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  const history = input.history ?? []

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: input.message },
  ]

  const toolsUsed: string[] = []

  // Metadata acumulada de tool results para devolver al cliente
  const metadata: Record<string, unknown> = {}
  const mintedTokensAcc: number[] = []
  const activeAuctionsAcc: Array<{ contract: string; tokenId: number; endTime: number; reservePrice: number; ipfsImageUri?: string; metadataUri?: string }> = []

  const buildMetadata = () => {
    if (mintedTokensAcc.length > 0) metadata.mintedTokens = [...mintedTokensAcc]
    if (activeAuctionsAcc.length > 0) metadata.activeAuctions = [...activeAuctionsAcc]
    return Object.keys(metadata).length > 0 ? metadata : undefined
  }

  // Agentic loop
  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: EMBAJADOR_PROMPT,
      tools: toAnthropicTools(tools),
      messages,
    })

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')

      return { response: text, toolsUsed, metadata: buildMetadata() }
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        toolsUsed.push(block.name)

        const inp = block.input as Record<string, unknown>
        const sessionContext = {
          ...input.context,
          creatorWallet: input.context?.creatorWallet ?? null,
        }
        const result = await executeTool(block.name, inp, sessionContext)

        // Extrae datos estructurados para la sesión del cliente
        if (block.name === 'deploy_collection') {
          const r = result as { success?: boolean; address?: string }
          if (r.address) {
            metadata.collectionAddress = r.address
            metadata.collectionName = inp.name as string
          }
        } else if (block.name === 'mint_nft') {
          const r = result as { success?: boolean; tokenId?: number; ipfsUri?: string; ipfsImageUri?: string }
          if (r.tokenId !== undefined) mintedTokensAcc.push(r.tokenId)
          // ipfsUri from mintNFT is the metadata URI; image URI comes from input
          const imageUri = r.ipfsImageUri ?? inp.ipfsImageUri ?? (input.context as Record<string, unknown> | undefined)?.lastUploadedIpfsUri
          if (imageUri) metadata.lastMintedImageUri = imageUri
          if (r.ipfsUri) metadata.lastMetadataUri = r.ipfsUri
          console.log('[NEXUS:agent] lastMintedImageUri:', metadata.lastMintedImageUri)
        } else if (block.name === 'create_auction') {
          const r = result as { success?: boolean; endTime?: number }
          if (r.endTime) {
            activeAuctionsAcc.push({
              contract: inp.contract as string,
              tokenId: inp.tokenId as number,
              endTime: r.endTime,
              reservePrice: inp.reservePrice as number,
              ipfsImageUri: metadata.lastMintedImageUri as string | undefined,
              metadataUri: metadata.lastMetadataUri as string | undefined,
            })
          }
        }

        if (block.name === 'record_sale') {
          const r = result as {
            creatorMXN?: number
            ethAmount?: number
            speiId?: string | null
            speiStatus?: string | null
          }
          if (r.creatorMXN !== undefined) {
            metadata.lastSaleMXN = r.creatorMXN
            metadata.lastSaleEth = r.ethAmount ?? 0
            metadata.lastSaleSpeiId = r.speiId ?? null
            metadata.lastSaleSpeiStatus = r.speiStatus ?? null
            metadata.lastSaleTokenId = inp.tokenId
            // Mascara la CLABE — solo guarda los últimos 4 dígitos
            const rawClabe = inp.creatorClabe as string | undefined
            metadata.lastSaleClabe = rawClabe
              ? `••••••••••••••${rawClabe.slice(-4)}`
              : null
            metadata.lastSaleCollectionName = metadata.collectionName ?? null
            metadata.settledTokenId = inp.tokenId
            metadata.totalEarnedMXN =
              ((metadata.totalEarnedMXN as number | undefined) ?? 0) + r.creatorMXN
          }
        }

        console.log('[NEXUS:agent] metadata después de', block.name, ':', JSON.stringify(metadata))

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        })
      }

      messages.push({ role: 'user', content: toolResults })
      continue
    }

    break
  }

  return { response: 'No response generated.', toolsUsed, metadata: buildMetadata() }
}
