import { describe, expect, it } from 'vitest'
import { hasImageBlocks, countImages, isImageBlock } from '../src/detect.ts'
import type { Message } from '@deepseek-ai/dsh-llm'

const img = { type: 'image', attachment: { attachmentId: 'att-1', mediaType: 'image/png', bytes: 5, width: 2, height: 2 } } as const
const text = { type: 'text', text: 'hello' } as const

const user = (content: unknown[], kind: 'user' | 'tool' = 'user') => ({ role: 'user', content, source: { kind } }) as unknown as Message

const toolResult = (inner: unknown[]) => user([
  { type: 'tool-result', toolCallId: 'c1', content: inner, isError: false },
], 'tool')

describe('isImageBlock', () => {
  it('detects an image block', () => {
    expect(isImageBlock(img as never)).toBe(true)
  })
  it('rejects text blocks', () => {
    expect(isImageBlock(text as never)).toBe(false)
  })
})

describe('hasImageBlocks', () => {
  it('returns false for text-only messages', () => {
    expect(hasImageBlocks([user([text])])).toBe(false)
  })

  it('returns true when a user message contains an image', () => {
    expect(hasImageBlocks([user([text, img])])).toBe(true)
  })

  it('returns true when a tool result contains a nested image', () => {
    expect(hasImageBlocks([toolResult([text, img])])).toBe(true)
  })

  it('respects toolResultsOnly', () => {
    const msgs = [user([img]), toolResult([text])]
    expect(hasImageBlocks(msgs, true)).toBe(false)
    expect(hasImageBlocks(msgs, false)).toBe(true)
  })

  it('detects a nested tool-result image even with toolResultsOnly', () => {
    expect(hasImageBlocks([toolResult([img])], true)).toBe(true)
  })
})

describe('countImages', () => {
  it('counts images across messages including nested tool results', () => {
    const msgs = [user([img, text]), toolResult([img, img])]
    expect(countImages(msgs)).toBe(3)
  })

  it('returns 0 for no images', () => {
    expect(countImages([user([text])])).toBe(0)
  })
})
