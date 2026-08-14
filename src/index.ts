/**
 * dsh-llm-vision-router
 *
 * Intercepts the agent/request waterfall. When the conversation history
 * contains image content blocks, swaps the provider and model to a
 * configured multimodal model. Otherwise passes through unchanged.
 *
 * This lets you run DeepSeek (cheap, no vision) as default and only
 * pay for a vision model (GPT-4o-mini, Qwen-VL, Claude) when images
 * are actually present in the context.
 */

import type { Context } from '@deepseek-ai/cordis'

export const name = 'llm-vision-router'
export const inject = [] as const

export interface Config {
  /** Provider route for the vision model (e.g. "openai", "qwen", "anthropic") */
  visionProvider: string
  /** Model ID for the vision model (e.g. "gpt-4o-mini", "qwen-vl-plus") */
  visionModel: string
  /** Only route if images are from tool results (ignore user-uploaded images) */
  toolResultsOnly?: boolean
  /** Log when routing switches to vision model */
  verbose?: boolean
}

export function apply(ctx: Context, config: Config) {
  ctx.on('agent/request', (request, next) => {
    const hasImage = detectImageContent(request.messages, config.toolResultsOnly ?? false)

    if (hasImage) {
      if (config.verbose) {
        console.log(`[vision-router] Image detected, routing to ${config.visionProvider}/${config.visionModel}`)
      }
      request.provider = config.visionProvider
      request.model = config.visionModel
    }

    return next()
  })
}

/**
 * Scan messages for image content blocks.
 */
function detectImageContent(messages: any[], toolResultsOnly: boolean): boolean {
  for (const msg of messages) {
    if (toolResultsOnly && msg.role !== 'tool') continue

    const content = msg.content
    if (!Array.isArray(content)) continue

    for (const block of content) {
      if (block.type === 'image' || block.type === 'image_url') return true
      if (block.type === 'image_file') return true
      if (block.source?.type === 'base64' && block.type === 'image') return true
    }
  }
  return false
}
