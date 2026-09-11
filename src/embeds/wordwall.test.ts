import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { wordwallEmbedResolver } from './wordwall.js'

describeForEachParser('wordwallEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, wordwallEmbedResolver)

  describe('happy paths', () => {
    it('should drop the locale prefix from the minted player url', async () => {
      const value = html`
        <iframe
          style="max-width: 100%;"
          src="https://wordwall.net/es/embed/e10cc41040bb489c83a4fc6670afeb5d?themeId=46&templateId=54&fontStackId=0"
          width="500"
          height="380"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'e10cc41040bb489c83a4fc6670afeb5d',
        src: 'https://wordwall.net/embed/e10cc41040bb489c83a4fc6670afeb5d?themeId=46&templateId=54&fontStackId=0',
        width: 500,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the rendering query a player states without a locale', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="380"
          src="https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d?themeId=1&amp;templateId=22"
          width="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'd4e3c25ffe7545a19a8b0cd802f68f4d',
        src: 'https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d?themeId=1&templateId=22',
        width: 500,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the wordwall path', async () => {
      const value = html`<iframe src="https://evil.test/wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a wordwall url outside the embed route', async () => {
      const value = html`<iframe src="https://wordwall.net/play/d4e3c25ffe7545a19a8b0cd802f68f4d"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed route naming no activity id', async () => {
      const value = html`<iframe src="https://wordwall.net/embed/preview"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should state no size and no thumbnail of its own', async () => {
      const value = html`<iframe src="https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'd4e3c25ffe7545a19a8b0cd802f68f4d',
        src: 'https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a query parameter that is not a rendering choice', async () => {
      const value = html`
        <iframe
          src="https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d?themeId=1&utm_source=lesson"
          height="380"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'd4e3c25ffe7545a19a8b0cd802f68f4d',
        src: 'https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d?themeId=1',
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the fields the resolver leaves to enrichment', () => {
    // Whether Wordwall writes the activity's name or a player label here is unmeasured.
    it('should not take the name the carrier title states', async () => {
      const value = html`
        <iframe
          title="Inside the house (rooms) - Labelled diagram"
          src="https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'd4e3c25ffe7545a19a8b0cd802f68f4d',
        src: 'https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
