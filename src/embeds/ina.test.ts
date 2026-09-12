import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { inaEmbedResolver, inaResolveEmbed } from './ina.js'

describe('inaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should keep the player as written and name the archive page', () => {
      const value =
        'http://player.ina.fr/player/embed/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I04224962',
        src: 'http://player.ina.fr/player/embed/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259',
        url: 'https://www.ina.fr/video/I04224962',
        width: 460,
        height: 259,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })

    it('should read the archive route of the same player', () => {
      const value =
        'http://www.ina.fr/video/embed/CPC82053053/1019544/f6d4ef1e5d2a7f5359b350d693da3394/425/319/0'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'CPC82053053',
        src: 'http://www.ina.fr/video/embed/CPC82053053/1019544/f6d4ef1e5d2a7f5359b350d693da3394/425/319/0',
        url: 'https://www.ina.fr/video/CPC82053053',
        width: 425,
        height: 319,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })

    it('should read a numeric id the same way', () => {
      const value =
        'https://player.ina.fr/player/embed/2478477001020/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: '2478477001020',
        src: 'https://player.ina.fr/player/embed/2478477001020/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259',
        url: 'https://www.ina.fr/video/2478477001020',
        width: 460,
        height: 259,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the archive page itself', () => {
      const value = 'https://www.ina.fr/video/I04224962'

      expect(inaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id carrying a separator', () => {
      const value = 'https://player.ina.fr/player/embed/..%2Fother/1/key/460/259'

      expect(inaResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('inaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, inaEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://player.ina.fr/player/embed/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259"
          width="460"
          height="259"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I04224962',
        src: 'https://player.ina.fr/player/embed/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259',
        url: 'https://www.ina.fr/video/I04224962',
        width: 460,
        height: 259,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the player in its path', async () => {
      const value =
        '<iframe src="https://evil.test/player.ina.fr/player/embed/I04224962/1/k"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
