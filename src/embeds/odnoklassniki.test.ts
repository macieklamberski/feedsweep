import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { odnoklassnikiEmbedResolver, odnoklassnikiResolveEmbed } from './odnoklassniki.js'

describe('odnoklassnikiResolveEmbed', () => {
  describe('happy paths', () => {
    it('should drop the player settings the publisher chose', () => {
      const value = 'https://ok.ru/videoembed/36463446577?nochat=1&autoplay=1'
      const expected: EmbedResolverResult = {
        provider: 'odnoklassniki',
        id: '36463446577',
        src: 'https://ok.ru/videoembed/36463446577',
        url: 'https://ok.ru/video/36463446577',
        ratio: '16/9',
      }

      expect(odnoklassnikiResolveEmbed(value)).toEqual(expected)
    })

    it('should read the route spelled in mixed case', () => {
      const value = 'https://ok.ru/VideoEmbed/36463446577'
      const expected: EmbedResolverResult = {
        provider: 'odnoklassniki',
        id: '36463446577',
        src: 'https://ok.ru/videoembed/36463446577',
        url: 'https://ok.ru/video/36463446577',
        ratio: '16/9',
      }

      expect(odnoklassnikiResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the watch page itself', () => {
      const value = 'https://ok.ru/video/36463446577'

      expect(odnoklassnikiResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path going on past the video id', () => {
      const value = 'https://ok.ru/videoembed/36463446577/extra'

      expect(odnoklassnikiResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video id that is not a number', () => {
      const value = 'https://ok.ru/videoembed/latest'

      expect(odnoklassnikiResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video id with letters before the digits', () => {
      const value = 'https://ok.ru/videoembed/abc36463446577'

      expect(odnoklassnikiResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video id with letters after the digits', () => {
      const value = 'https://ok.ru/videoembed/36463446577abc'

      expect(odnoklassnikiResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('odnoklassnikiEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, odnoklassnikiEmbedResolver)

  describe('happy paths', () => {
    it('should take the box the carrier declares over the player ratio', async () => {
      const value = html`
        <iframe
          src="http://ok.ru/videoembed/36463446577"
          width="640"
          height="360"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odnoklassniki',
        id: '36463446577',
        src: 'https://ok.ru/videoembed/36463446577',
        url: 'https://ok.ru/video/36463446577',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the player ratio for a carrier declaring no box', async () => {
      const value = '<iframe src="https://ok.ru/videoembed/36463446577"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'odnoklassniki',
        id: '36463446577',
        src: 'https://ok.ru/videoembed/36463446577',
        url: 'https://ok.ru/video/36463446577',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // m.ok.ru answers its player with x-frame-options DENY, and ok.ru frames the same id.
    it('should move the mobile player onto the host that frames it', async () => {
      const value = '<iframe src="https://m.ok.ru/videoembed/36463446577"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'odnoklassniki',
        id: '36463446577',
        src: 'https://ok.ru/videoembed/36463446577',
        url: 'https://ok.ru/video/36463446577',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the player path on a foreign host', async () => {
      const value = '<iframe src="https://evil.test/videoembed/36463446577"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
