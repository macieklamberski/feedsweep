import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { komootEmbedResolver, komootResolveEmbed } from './komoot.js'

describe('komootResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the map and the tour page from the tour id', () => {
      const value = 'https://www.komoot.com/tour/727321743/embed?profile=1'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '727321743',
        src: 'https://www.komoot.com/tour/727321743/embed?profile=1',
        url: 'https://www.komoot.com/tour/727321743',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should read a tour behind a locale segment', () => {
      const value = 'https://www.komoot.com/de-de/tour/2011745032/embed'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '2011745032',
        src: 'https://www.komoot.com/tour/2011745032/embed',
        url: 'https://www.komoot.com/tour/2011745032',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should keep the share token and name no page for a private tour', () => {
      const value =
        'https://www.komoot.com/tour/2011745032/embed?share_token=TestTokenOnly0&profile=1'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '2011745032',
        src: 'https://www.komoot.com/tour/2011745032/embed?share_token=TestTokenOnly0&profile=1',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should mint the current host for a tour framed on the German one', () => {
      const value = 'https://www.komoot.de/tour/727321743/embed'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '727321743',
        src: 'https://www.komoot.com/tour/727321743/embed',
        url: 'https://www.komoot.com/tour/727321743',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the tour page itself', () => {
      const value = 'https://www.komoot.com/tour/727321743'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a collection, which names its own id space', () => {
      const value = 'https://www.komoot.com/collection/1234/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a tour id that is not a number', () => {
      const value = 'https://www.komoot.com/tour/latest/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('komootEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, komootEmbedResolver)

  describe('happy paths', () => {
    it('should keep the height the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://www.komoot.com/tour/727321743/embed?profile=1"
          width="100%"
          height="880"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '727321743',
        src: 'https://www.komoot.com/tour/727321743/embed?profile=1',
        url: 'https://www.komoot.com/tour/727321743',
        height: 880,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the tour route in its path', async () => {
      const value = '<iframe src="https://evil.test/komoot.com/tour/727321743/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
