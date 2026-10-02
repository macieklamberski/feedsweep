import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { ispotEmbedResolver, ispotResolveEmbed } from './ispot.js'

describe('ispotResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player and thumbnail of a spot', () => {
      const value = 'https://www.ispot.tv/share/IoLU'
      const expected: EmbedResolverResult = {
        provider: 'ispot',
        id: 'IoLU',
        src: 'https://www.ispot.tv/share/IoLU',
        thumbnail: 'https://images-cdn.ispot.tv/ad/IoLU/default-large.jpg',
        ratio: '16/9',
      }

      expect(ispotResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the query', () => {
      const value = 'https://www.ispot.tv/share/7kkJ?autoplay=1&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'ispot',
        id: '7kkJ',
        src: 'https://www.ispot.tv/share/7kkJ',
        thumbnail: 'https://images-cdn.ispot.tv/ad/7kkJ/default-large.jpg',
        ratio: '16/9',
      }

      expect(ispotResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the case of the id', () => {
      const value = 'https://www.ispot.tv/share/IOLU'
      const expected: EmbedResolverResult = {
        provider: 'ispot',
        id: 'IOLU',
        src: 'https://www.ispot.tv/share/IOLU',
        thumbnail: 'https://images-cdn.ispot.tv/ad/IOLU/default-large.jpg',
        ratio: '16/9',
      }

      expect(ispotResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the trailing slash the player answers 404 to', () => {
      const value = 'https://www.ispot.tv/share/tZOF/'
      const expected: EmbedResolverResult = {
        provider: 'ispot',
        id: 'tZOF',
        src: 'https://www.ispot.tv/share/tZOF',
        thumbnail: 'https://images-cdn.ispot.tv/ad/tZOF/default-large.jpg',
        ratio: '16/9',
      }

      expect(ispotResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/share/IoLU'

      expect(ispotResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://www.ispot.tv/x/share/IoLU'

      expect(ispotResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://www.ispot.tv/share/IoLU/extra'

      expect(ispotResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the ad page', () => {
      const value = 'https://www.ispot.tv/ad/IoLU'

      expect(ispotResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route with no id', () => {
      const value = 'https://www.ispot.tv/share/'

      expect(ispotResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('ispotEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, ispotEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over a container-filling box', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          scrolling="no"
          src="https://www.ispot.tv/share/IoLU"
          style="bottom: 0; height: 100%; left: 0; position: absolute; right: 0; top: 0; width: 100%;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ispot',
        id: 'IoLU',
        src: 'https://www.ispot.tv/share/IoLU',
        thumbnail: 'https://images-cdn.ispot.tv/ad/IoLU/default-large.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the platform size over the declared box', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="323"
          scrolling="no"
          src="https://www.ispot.tv/share/7kkJ"
          width="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ispot',
        id: '7kkJ',
        src: 'https://www.ispot.tv/share/7kkJ',
        thumbnail: 'https://images-cdn.ispot.tv/ad/7kkJ/default-large.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/share/IoLU"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('ispot player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should resolve a protocol-relative player', async () => {
    const value = html`
      <iframe
        src="//www.ispot.tv/share/7V5I"
        width="500"
        height="323"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="7V5I"
        data-embed-provider="ispot"
        data-embed-src="https://www.ispot.tv/share/7V5I"
        data-embed-thumbnail="https://images-cdn.ispot.tv/ad/7V5I/default-large.jpg"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
