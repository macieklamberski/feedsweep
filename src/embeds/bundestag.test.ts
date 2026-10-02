import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  bundestagIframeEmbedResolver,
  bundestagResolveEmbed,
  bundestagScriptEmbedResolver,
} from './bundestag.js'

describe('bundestagResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player and drop the share link', () => {
      const value =
        'https://webtv.bundestag.de/pservices/player/embed/nokey?e=bt-od&ep=69&a=144277506&c=7657467&t=https%3A%2F%2Fdbtg.tv%2Fcvid%2F7657467'
      const expected: EmbedResolverResult = {
        provider: 'bundestag',
        id: '7657467',
        src: 'https://webtv.bundestag.de/pservices/player/embed/nokey?e=bt-od&ep=69&a=144277506&c=7657467',
        url: 'https://dbtg.tv/cvid/7657467',
        ratio: '16/9',
      }

      expect(bundestagResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the player from the loader script', () => {
      const value =
        'https://webtv.bundestag.de/player/macros/bttv/hls/player.js?content=7197510&phi=default'
      const expected: EmbedResolverResult = {
        provider: 'bundestag',
        id: '7197510',
        src: 'https://webtv.bundestag.de/pservices/player/embed/nokey?e=bt-od&ep=69&a=144277506&c=7197510',
        url: 'https://dbtg.tv/cvid/7197510',
        ratio: '16/9',
      }

      expect(bundestagResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the id through as written', () => {
      const value = 'https://webtv.bundestag.de/pservices/player/embed/nokey?c=76574x_y'
      const expected: EmbedResolverResult = {
        provider: 'bundestag',
        id: '76574x_y',
        src: 'https://webtv.bundestag.de/pservices/player/embed/nokey?e=bt-od&ep=69&a=144277506&c=76574x_y',
        url: 'https://dbtg.tv/cvid/76574x_y',
        ratio: '16/9',
      }

      expect(bundestagResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/pservices/player/embed/nokey?e=bt-od&ep=69&c=7657467'

      expect(bundestagResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://webtv.bundestag.de/x/pservices/player/embed/nokey?c=7657467'

      expect(bundestagResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://webtv.bundestag.de/pservices/player/embed/nokey/extra?c=7657467'

      expect(bundestagResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player with no video', () => {
      const value = 'https://webtv.bundestag.de/pservices/player/embed/nokey?e=bt-od&ep=69'

      expect(bundestagResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the loader with no video', () => {
      const value = 'https://webtv.bundestag.de/player/macros/bttv/hls/player.js?phi=default'

      expect(bundestagResolveEmbed(value)).toBeUndefined()
    })

    it('should read the loader video from its own parameter only', () => {
      const value = 'https://webtv.bundestag.de/player/macros/bttv/hls/player.js?c=7197510'

      expect(bundestagResolveEmbed(value)).toBeUndefined()
    })

    it('should leave the Flash player alone', () => {
      const value = 'https://webtv.bundestag.de/iptv/swf/xflv/showIt3.swf'

      expect(bundestagResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('bundestagIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, bundestagIframeEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the declared box', async () => {
      const value = html`
        <iframe
          src="https://webtv.bundestag.de/pservices/player/embed/nokey?e=bt-od&amp;ep=69&amp;a=144277506&amp;c=7616892&amp;t=https%3A%2F%2Fdbtg.tv%2Fcvid%2F7616892"
          width="640"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bundestag',
        id: '7616892',
        src: 'https://webtv.bundestag.de/pservices/player/embed/nokey?e=bt-od&ep=69&a=144277506&c=7616892',
        url: 'https://dbtg.tv/cvid/7616892',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/pservices/player/embed/nokey?c=7616892"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('bundestagScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, bundestagScriptEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the loader script', async () => {
      const value = html`
        <script
          id="tv7197510"
          src="https://webtv.bundestag.de/player/macros/bttv/hls/player.js?content=7197510&#038;phi=default"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'bundestag',
        id: '7197510',
        src: 'https://webtv.bundestag.de/pservices/player/embed/nokey?e=bt-od&ep=69&a=144277506&c=7197510',
        url: 'https://dbtg.tv/cvid/7197510',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the loader in its query', async () => {
      const value =
        '<script src="https://evil.test/player/macros/bttv/hls/player.js?content=7197510&amp;webtv.bundestag.de/player/"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('bundestag players through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the loader script with the player', async () => {
    const value = html`
      <script
        id="tv7466652"
        src="https://webtv.bundestag.de/player/macros/bttv/hls/player.js?content=7466652&amp;phi=default"
      ></script>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://dbtg.tv/cvid/7466652"
        data-embed-id="7466652"
        data-embed-provider="bundestag"
        data-embed-src="https://webtv.bundestag.de/pservices/player/embed/nokey?e=bt-od&amp;ep=69&amp;a=144277506&amp;c=7466652"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
