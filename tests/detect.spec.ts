import { describe, expect, it } from 'vitest'
import { hasImageBlocks, countImages, isImageBlock } from '../src/detect.ts'

describe('isImageBlock', () => {
  it('detects image type', () => {
    expect(isImageBlock({ type: 'image', source: { type: 'base64' } })).toBe(true)
  })
  it('detects image_url type', () => {
    expect(isImageBlock({ type: 'image_url', image_url: { url: 'https://...' } })).toBe(true)
  })
  it('rejects text blocks', () => {
    expect(isImageBlock({ type: 'text' })).toBe(false)
  })
})

describe('hasImageBlocks', () => {
  it('returns false for text-only messages', () => {
    const msgs = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: [{ type: 'text' }] },
    ]
    expect(hasImageBlocks(msgs as any)).toBe(false)
  })

  it('returns true when user message contains image', () => {
    const msgs = [
      { role: 'user', content: [{ type: 'text' }, { type: 'image', source: { type: 'base64' } }] },
    ]
    expect(hasImageBlocks(msgs as any)).toBe(true)
  })

  it('returns true when tool result contains image', () => {
    const msgs = [
      { role: 'tool', content: [{ type: 'text' }, { type: 'image', source: { type: 'base64', data: 'abc' } }] },
    ]
    expect(hasImageBlocks(msgs as any)).toBe(true)
  })

  it('respects toolResultsOnly flag', () => {
    const msgs = [
      { role: 'user', content: [{ type: 'image', source: { type: 'base64' } }] },
      { role: 'tool', content: [{ type: 'text' }] },
    ]
    expect(hasImageBlocks(msgs as any, true)).toBe(false)
    expect(hasImageBlocks(msgs as any, false)).toBe(true)
  })
})

describe('countImages', () => {
  it('counts all image blocks across messages', () => {
    const msgs = [
      { role: 'user', content: [{ type: 'image' }, { type: 'text' }] },
      { role: 'tool', content: [{ type: 'image' }, { type: 'image' }] },
    ]
    expect(countImages(msgs as any)).toBe(3)
  })

  it('returns 0 for no images', () => {
    const msgs = [{ role: 'user', content: 'hello' }]
    expect(countImages(msgs as any)).toBe(0)
  })
})
