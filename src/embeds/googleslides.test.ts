import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { googleslidesEmbedResolver, googleslidesResolveEmbed } from './googleslides.js'

const deckId = '2PACX-1vTestDeckOnly0000000000000000000000000000000000000000000000000000000000'

describe('googleslidesResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the published embed url', () => {
      const value = `https://docs.google.com/presentation/d/e/${deckId}/embed?start=true&loop=true&delayms=3000`
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: deckId,
        src: `https://docs.google.com/presentation/d/e/${deckId}/embed`,
        url: `https://docs.google.com/presentation/d/e/${deckId}/pub`,
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the slide the publisher opened the deck on', () => {
      const value = `https://docs.google.com/presentation/d/e/${deckId}/embed?start=false&slide=id.g2a1b3c4d5e_0_12`
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: deckId,
        src: `https://docs.google.com/presentation/d/e/${deckId}/embed?slide=id.g2a1b3c4d5e_0_12`,
        url: `https://docs.google.com/presentation/d/e/${deckId}/pub`,
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a deck named by its file id', () => {
      const value =
        'https://docs.google.com/presentation/d/1TestFileOnly000000000000000000000/embed'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a form on the same host', () => {
      const value = 'https://docs.google.com/forms/d/e/1FAIpQLSfQq3/viewform?embedded=true'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a document on the same host', () => {
      const value = 'https://docs.google.com/document/d/e/2PACX-1vT/pub?embedded=true'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a sheet on the same host', () => {
      const value = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT/pubhtml'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the pdf viewer on the same host', () => {
      const value =
        'https://docs.google.com/viewer?url=https%3A%2F%2Fexample.com%2Fa.pdf&embedded=true'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('googleslidesEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, googleslidesEmbedResolver)

  describe('happy paths', () => {
    it('should take the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://docs.google.com/presentation/d/e/${deckId}/embed?start=true&loop=true&delayms=3000"
          width="1280"
          height="749"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: deckId,
        src: `https://docs.google.com/presentation/d/e/${deckId}/embed`,
        url: `https://docs.google.com/presentation/d/e/${deckId}/pub`,
        width: 1280,
        height: 749,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the deck route in its path', async () => {
      const value = html`
        <iframe src="https://evil.test/docs.google.com/presentation/d/e/${deckId}/embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
