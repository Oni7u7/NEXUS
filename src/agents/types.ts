export interface AgentInput {
  message: string
  context?: Record<string, unknown>
  history?: Array<{ role: string; content: string }>
}

export interface AgentOutput {
  response: string
  toolsUsed?: string[]
  metadata?: Record<string, unknown>
}

export interface AgentTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}
