/**
 * Image detection helpers over DSH message/content shapes.
 *
 * DSH represents images as `ImageBlock` (`{ type: 'image', attachment }`) and
 * nests tool-result content inside `tool-result` blocks. `contentHasImage`
 * from `@deepseek-ai/dsh-llm` is the canonical recursive walk, so these
 * helpers delegate to it rather than re-implementing the nesting rules.
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

/** Count image blocks in one content array, walking nested tool-result content. */
export function countImagesInContent(content: readonly ContentBlock[]): number {
  let count = 0
  for (const block of content) {
    if (block.type === 'image') count++
    else if (block.type === 'tool-result') count += countImagesInContent(block.content)
  }
  return count
}

/** True for a DSH image content block. */
export function isImageBlock(block: ContentBlock): boolean {
  return block.type === 'image'
}
