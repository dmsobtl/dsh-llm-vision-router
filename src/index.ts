/**
 * dsh-llm-vision-router
 *
 * Routes a request to a configured multimodal model when the current
 * conversation history contains an image, and passes through to the default
 * (cheap, non-vision) model otherwise.
 *
 * The `agent/request` waterfall yields the default call config; a listener
 * returns a replacement to switch provider/model. Model-visible content is
 * read from the agent's live session (the logged surface), never mutated.
 */

import type { Context } from '@deepseek-ai/cordis'
// Imported for its `agent/request` event module augmentation on cordis' Events.
import type { Agent } from '@deepseek-ai/dsh-agent'
import z from '@deepseek-ai/schemastery'
import { hasImageBlocks } from './detect.ts'

export const name = 'llm-vision-router'
export const inject = [] as const

export const Config = z.object({
  /** Provider route for the vision model (e.g. "openai", "qwen", "anthropic"). */
  visionProvider: z.string(),
  /** Model id for the vision model (e.g. "gpt-4o-mini", "qwen-vl-plus"). */
  visionModel: z.string(),
  /** Only route when images come from tool results (ignore user-uploaded images). */
  toolResultsOnly: z.boolean().default(false),
  /** Log when routing switches to the vision model. */
  verbose: z.boolean().default(false),
})

interface ResolvedConfig {
  visionProvider: string
  visionModel: string
  toolResultsOnly: boolean
  verbose: boolean
}

export function apply(ctx: Context, config: ResolvedConfig) {
  ctx.on('agent/request', async (payload, next) => {
    const current = await next()

    const messages = payload.agent.session.deriveMessages()
    if (!hasImageBlocks(messages, config.toolResultsOnly)) return current

    if (config.verbose) {
      console.log(`[vision-router] image detected, routing to ${config.visionProvider}/${config.visionModel}`)
    }

    // Drop the default model's adapter-owned reasoning effort; the vision
    // adapter resolves its own provider/default behavior for the new model.
    const { reasoningEffort: _reasoningEffort, ...rest } = current
    return { ...rest, provider: config.visionProvider, model: config.visionModel }
  })
}
