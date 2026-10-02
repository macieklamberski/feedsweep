import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { allocineEmbedResolver, allocineResolveEmbed } from './allocine.js'

describe('allocineResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player from the blog player', () => {
      const value = 'http://www.allocine.fr/_video/iblogvision.aspx?cmedia=19546104'
      const expected: EmbedResolverResult = {
        provider: 'allocine',
        id: '19546104',
        src: 'https://player.allocine.fr/19546104.html',
        ratio: '16/9',
      }

      expect(allocineResolveEmbed(value)).toEqual(expected)
    })

    it('should claim the player on its own host', () => {
      const value = 'https://player.allocine.fr/19548663.html'
      const expected: EmbedResolverResult = {
        provider: 'allocine',
        id: '19548663',
        src: 'https://player.allocine.fr/19548663.html',
        ratio: '16/9',
      }

      expect(allocineResolveEmbed(value)).toEqual(expected)
    })

    it('should drop everything in the query but the id', () => {
      const value =
        'https://www.allocine.fr/_video/iblogvision.aspx?cmedia=19572359&autoplay=1&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'allocine',
        id: '19572359',
        src: 'https://player.allocine.fr/19572359.html',
        ratio: '16/9',
      }

      expect(allocineResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the blog player path', () => {
      const value = 'https://evil.test/_video/iblogvision.aspx?cmedia=19546104'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a blog player with no id', () => {
      const value = 'https://www.allocine.fr/_video/iblogvision.aspx'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the blog player below another segment', () => {
      const value = 'https://www.allocine.fr/fr/_video/iblogvision.aspx?cmedia=19546104'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the blog player', () => {
      const value = 'https://www.allocine.fr/_video/iblogvision.aspx/extra?cmedia=19546104'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the blog player in capitals, which the server answers 404', () => {
      const value = 'https://www.allocine.fr/_VIDEO/IBLOGVISION.ASPX?cmedia=19546104'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the id under an uppercase name, which the server answers 404', () => {
      const value = 'https://www.allocine.fr/_video/iblogvision.aspx?CMEDIA=19546104'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player below another segment', () => {
      const value = 'https://player.allocine.fr/video/19546104.html'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the player', () => {
      const value = 'https://player.allocine.fr/19546104.html/extra'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player without its extension', () => {
      const value = 'https://player.allocine.fr/19546104'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a page on the main host shaped like the player', () => {
      const value = 'https://www.allocine.fr/19546104.html'

      expect(allocineResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should pass an id that is not a number as written', () => {
      const value = 'https://www.allocine.fr/_video/iblogvision.aspx?cmedia=19546104a'
      const expected: EmbedResolverResult = {
        provider: 'allocine',
        id: '19546104a',
        src: 'https://player.allocine.fr/19546104a.html',
        ratio: '16/9',
      }

      expect(allocineResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('allocineEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, allocineEmbedResolver)

  describe('happy paths', () => {
    it('should take the platform size over the declared box', async () => {
      const value = html`
        <iframe
          width="300"
          height="150"
          style="width: 320px; height: 180px;"
          src="http://www.allocine.fr/_video/iblogvision.aspx?cmedia=19567053"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'allocine',
        id: '19567053',
        src: 'https://player.allocine.fr/19567053.html',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/_video/iblogvision.aspx?cmedia=19567053"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('allocine player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should state the player ratio over the declared box', async () => {
    const value = html`
      <iframe
        src="http://www.allocine.fr/_video/iblogvision.aspx?cmedia=19546104"
        style="width:435px; height:245px"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="19546104"
        data-embed-provider="allocine"
        data-embed-src="https://player.allocine.fr/19546104.html"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
