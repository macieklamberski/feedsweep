import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { dzenEmbedResolver, dzenResolveEmbed } from './dzen.js'

describe('dzenResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the player url', () => {
      const value = 'https://dzen.ru/embed/oW0bt8mcOAAA'
      const expected: EmbedResolverResult = {
        provider: 'dzen',
        id: 'oW0bt8mcOAAA',
        src: 'https://dzen.ru/embed/oW0bt8mcOAAA',
        ratio: '16/9',
      }

      expect(dzenResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an id with a dash and an underscore through as written', () => {
      const value = 'https://dzen.ru/embed/vw-kLXE_sRWA'
      const expected: EmbedResolverResult = {
        provider: 'dzen',
        id: 'vw-kLXE_sRWA',
        src: 'https://dzen.ru/embed/vw-kLXE_sRWA',
        ratio: '16/9',
      }

      expect(dzenResolveEmbed(value)).toEqual(expected)
    })

    it('should read the player url with a trailing slash', () => {
      const value = 'https://dzen.ru/embed/oW0bt8mcOAAA/'
      const expected: EmbedResolverResult = {
        provider: 'dzen',
        id: 'oW0bt8mcOAAA',
        src: 'https://dzen.ru/embed/oW0bt8mcOAAA',
        ratio: '16/9',
      }

      expect(dzenResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the share dialog query and a tracker', () => {
      const value =
        'https://dzen.ru/embed/ob1uPDp8NAAA?from_block=partner&from=zen&mute=1&autoplay=1&tv=0&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'dzen',
        id: 'ob1uPDp8NAAA',
        src: 'https://dzen.ru/embed/ob1uPDp8NAAA',
        ratio: '16/9',
      }

      expect(dzenResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position', () => {
      const value = 'https://dzen.ru/embed/oW0bt8mcOAAA?from_block=partner&t=60'
      const expected: EmbedResolverResult = {
        provider: 'dzen',
        id: 'oW0bt8mcOAAA',
        src: 'https://dzen.ru/embed/oW0bt8mcOAAA?t=60',
        ratio: '16/9',
      }

      expect(dzenResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/embed/oW0bt8mcOAAA'

      expect(dzenResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player route below another segment', () => {
      const value = 'https://dzen.ru/x/embed/oW0bt8mcOAAA'

      expect(dzenResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the video', () => {
      const value = 'https://dzen.ru/embed/oW0bt8mcOAAA/extra'

      expect(dzenResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route in capitals, which the server answers 404', () => {
      const value = 'https://dzen.ru/EMBED/oW0bt8mcOAAA'

      expect(dzenResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player route with no id', () => {
      const value = 'https://dzen.ru/embed/'

      expect(dzenResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('shapes that are not a player', () => {
    it('should return undefined for a news story page', () => {
      const value = 'https://dzen.ru/news/story/016e953d-d9ca-5a23-8062-e94c7d9f9e0e'

      expect(dzenResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a video watch page, whose id is not the player id', () => {
      const value = 'https://dzen.ru/video/watch/6a47e3293d9f123299fe806a'

      expect(dzenResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('dzenEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, dzenEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform ratio over the box the share dialog declares', async () => {
      const value = html`
        <iframe
          width="480"
          height="270"
          src="https://dzen.ru/embed/oW0bt8mcOAAA?from_block=partner&amp;from=zen&amp;mute=0&amp;autoplay=0&amp;tv=0"
          allow="autoplay; fullscreen; accelerometer; gyroscope; picture-in-picture; encrypted-media"
          data-testid="embed-iframe"
          frameborder="0"
          scrolling="no"
          allowfullscreen=""
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'dzen',
        id: 'oW0bt8mcOAAA',
        src: 'https://dzen.ru/embed/oW0bt8mcOAAA',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/oW0bt8mcOAAA"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('dzen through the pipeline', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the player frame into a placeholder without the publisher autoplay', async () => {
    const value = html`
      <iframe
        src="https://dzen.ru/embed/ob1uPDp8NAAA?from_block=partner&amp;from=zen&amp;mute=1&amp;autoplay=1&amp;tv=0"
        width="480"
        height="270"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="ob1uPDp8NAAA"
        data-embed-provider="dzen"
        data-embed-src="https://dzen.ru/embed/ob1uPDp8NAAA"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
