/**
 * Image detection utilities, exported for testing and reuse.
 */

export interface ContentBlock {
  type: string
  source?: { type: string; media_type?: string; data?: string }
  image_url?: { url: string }
}

export interface Message {
  role: string
  content: string | ContentBlock[]
}

export function hasImageBlocks(messages: Message[], toolResultsOnly = false): boolean {
  for (const msg of messages) {
    if (toolResultsOnly && msg.role !== 'tool') continue
    if (typeof msg.content === 'string') continue

    for (const block of msg.content) {
      if (isImageBlock(block)) return true
    }
  }
  return false
}

export function isImageBlock(block: ContentBlock): boolean {
  if (block.type === 'image') return true
  if (block.type === 'image_url') return true
  if (block.type === 'image_file') return true
  return false
}

export function countImages(messages: Message[]): number {
  let count = 0
  for (const msg of messages) {
    if (typeof msg.content === 'string') continue
    for (const block of msg.content) {
      if (isImageBlock(block)) count++
    }
  }
  return count
}
