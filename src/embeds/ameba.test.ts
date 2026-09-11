import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { amebaEmbedResolver, amebaResolveEmbed } from './ameba.js'

describe('amebaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the player url', () => {
      const value = 'https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5'
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'MCLP3ViBJRfW3clSWW5saxnjA5',
        src: 'https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5',
      }

      expect(amebaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a player naming no video', () => {
      const value = 'https://static.blog-video.jp/'

      expect(amebaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video id outside its alphabet', () => {
      const value = 'https://static.blog-video.jp/?v=../output'

      expect(amebaResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('amebaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, amebaEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5"
          width="640"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'MCLP3ViBJRfW3clSWW5saxnjA5',
        src: 'https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the player host in its path', async () => {
      const value = '<iframe src="https://evil.test/static.blog-video.jp/?v=MCLP3ViB"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
