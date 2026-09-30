import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { komootEmbedResolver, komootResolveEmbed } from './komoot.js'

describe('komootResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the map and the tour page and drop the elevation profile', () => {
      const value = 'https://www.komoot.com/tour/178118403/embed?profile=1'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '178118403',
        src: 'https://www.komoot.com/tour/178118403/embed',
        url: 'https://www.komoot.com/tour/178118403',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the locale from the map and the page', () => {
      const value = 'https://www.komoot.com/de-de/tour/2011745032/embed'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '2011745032',
        src: 'https://www.komoot.com/tour/2011745032/embed',
        url: 'https://www.komoot.com/tour/2011745032',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the share token and drop the language and the gallery layout', () => {
      const value =
        'https://www.komoot.com/tour/3055667226/embed?share_token=aFCLXUxhhEfqsWzhS25hO07CKF8AD7IEY8jdgcSp24c6iS2cR0&hl=es&layout=gallery&gallery=1'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '3055667226',
        src: 'https://www.komoot.com/tour/3055667226/embed?share_token=aFCLXUxhhEfqsWzhS25hO07CKF8AD7IEY8jdgcSp24c6iS2cR0',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the classic layout the publisher chose', () => {
      const value = 'https://www.komoot.com/tour/528636996/embed?layout=classic&profile=1'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '528636996',
        src: 'https://www.komoot.com/tour/528636996/embed',
        url: 'https://www.komoot.com/tour/528636996',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should build the collection map and page and drop the map layout', () => {
      const value =
        'https://www.komoot.com/collection/3965053/best-of-national-cycling-routes-of-estonian-islands/embed?layout=map'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: 'collection/3965053',
        src: 'https://www.komoot.com/collection/3965053/best-of-national-cycling-routes-of-estonian-islands/embed',
        url: 'https://www.komoot.com/collection/3965053/best-of-national-cycling-routes-of-estonian-islands',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the tour page itself', () => {
      const value = 'https://www.komoot.com/tour/727321743'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a collection with no slug, which no carrier writes', () => {
      const value = 'https://www.komoot.com/collection/3965053/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a collection page that is not the map', () => {
      const value =
        'https://www.komoot.com/collection/3965053/best-of-national-cycling-routes-of-estonian-islands/share'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed collection slug as written, even if the player answers an error', () => {
      const value = 'https://www.komoot.com/collection/3965053/best&layout=x/embed'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: 'collection/3965053',
        src: 'https://www.komoot.com/collection/3965053/best&layout=x/embed',
        url: 'https://www.komoot.com/collection/3965053/best&layout=x',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed collection id as written, even if the player answers an error', () => {
      const value =
        'https://www.komoot.com/collection/latest/best-of-national-cycling-routes-of-estonian-islands/embed'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: 'collection/latest',
        src: 'https://www.komoot.com/collection/latest/best-of-national-cycling-routes-of-estonian-islands/embed',
        url: 'https://www.komoot.com/collection/latest/best-of-national-cycling-routes-of-estonian-islands',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore a route word that is neither a tour nor a collection', () => {
      const value =
        'https://www.komoot.com/highlight/3965053/best-of-national-cycling-routes-of-estonian-islands/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed tour id as written, even if the player answers an error', () => {
      const value = 'https://www.komoot.com/tour/latest/embed'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: 'latest',
        src: 'https://www.komoot.com/tour/latest/embed',
        url: 'https://www.komoot.com/tour/latest',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore a foreign host carrying the tour route', () => {
      const value = 'https://evil.test/tour/727321743/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a locale segment with a prefix', () => {
      const value = 'https://www.komoot.com/xde-de/tour/727321743/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a locale segment with a suffix', () => {
      const value = 'https://www.komoot.com/de-dex/tour/727321743/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a locale language carrying a query separator', () => {
      const value = 'https://www.komoot.com/d&-de/tour/727321743/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a locale region carrying a query separator', () => {
      const value = 'https://www.komoot.com/de-d=/tour/727321743/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an uppercase locale segment, which the route does not serve', () => {
      const value = 'https://www.komoot.com/DE-DE/tour/727321743/embed'

      expect(komootResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should keep the share token and name no page for a private tour', () => {
      const value =
        'https://www.komoot.com/de-de/tour/2011745032/embed?share_token=aBTJUZkJPE0Q0fxRFmoCr1AfWEChEEtXO4Bm57ZbsAKrVDvgb8&profile=1'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '2011745032',
        src: 'https://www.komoot.com/tour/2011745032/embed?share_token=aBTJUZkJPE0Q0fxRFmoCr1AfWEChEEtXO4Bm57ZbsAKrVDvgb8',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracking parameter the player does not read', () => {
      const value = 'https://www.komoot.com/tour/727321743/embed?utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '727321743',
        src: 'https://www.komoot.com/tour/727321743/embed',
        url: 'https://www.komoot.com/tour/727321743',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should mint no locale for a tour framed on the German host', () => {
      const value = 'https://www.komoot.de/tour/727321743/embed'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '727321743',
        src: 'https://www.komoot.com/tour/727321743/embed',
        url: 'https://www.komoot.com/tour/727321743',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
    })

    it('should mint no locale for a tour framed on the English subdomain of the German host', () => {
      const value = 'https://en.komoot.de/tour/14022454/embed'
      const expected: EmbedResolverResult = {
        provider: 'komoot',
        id: '14022454',
        src: 'https://www.komoot.com/tour/14022454/embed',
        url: 'https://www.komoot.com/tour/14022454',
      }

      expect(komootResolveEmbed(value)).toEqual(expected)
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
        src: 'https://www.komoot.com/tour/727321743/embed',
        url: 'https://www.komoot.com/tour/727321743',
        height: 880,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
