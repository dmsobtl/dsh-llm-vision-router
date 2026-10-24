/**
 * Image detection helpers over DSH message/content shapes.
 *
 * DSH represents images as `ImageBlock` (`{ type: 'image', attachment }`).
 * Since dsh 0.2.x content blocks are flat: tool results are first-class
 * `role: 'tool'` messages whose images sit directly in the message content
 * array, with no nested `tool-result` blocks to walk. `contentHasImage` from
 * `@deepseek-ai/dsh-llm` is the canonical walk, so these helpers delegate to
 * it rather than re-implementing the rules.
 */

import { contentHasImage } from '@deepseek-ai/dsh-llm'
import type { ContentBlock, Message } from '@deepseek-ai/dsh-llm'

/** True when any message (optionally only tool-result messages) carries an image. */
export function hasImageBlocks(messages: readonly Message[], toolResultsOnly = false): boolean {
  for (const msg of messages) {
    if (toolResultsOnly && msg.source.kind !== 'tool') continue
    if (contentHasImage(msg.content)) return true
  }
  return false
}

/** Count image blocks across messages, including images nested in tool results. */
export function countImages(messages: readonly Message[]): number {
  let count = 0
  for (const msg of messages) count += countImagesInContent(msg.content)
  return count
}

/** Count image blocks in one content array. */
export function countImagesInContent(content: readonly ContentBlock[]): number {
  let count = 0
  for (const block of content) {
    if (block.type === 'image') count++
  }
  return count
}

/** True for a DSH image content block. */
export function isImageBlock(block: ContentBlock): boolean {
  return block.type === 'image'
}
