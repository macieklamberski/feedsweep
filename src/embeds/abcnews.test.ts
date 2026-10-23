import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { abcnewsEmbedResolver, abcnewsResolveEmbed } from './abcnews.js'

describe('abcnewsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player on the current host from the snippet publishers wrote', () => {
      const value = 'http://abcnews.go.com/video/embed?id=39415146'
      const expected: EmbedResolverResult = {
        provider: 'abcnews',
        id: '39415146',
        src: 'https://abcnews.com/video/embed?id=39415146',
        url: 'https://abcnews.com/video/39415146',
        ratio: '16/9',
      }

      expect(abcnewsResolveEmbed(value)).toEqual(expected)
    })

    it('should claim the player on the current host', () => {
      const value = 'https://abcnews.com/video/embed?id=43622203'
      const expected: EmbedResolverResult = {
        provider: 'abcnews',
        id: '43622203',
        src: 'https://abcnews.com/video/embed?id=43622203',
        url: 'https://abcnews.com/video/43622203',
        ratio: '16/9',
      }

      expect(abcnewsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop everything in the query but the id', () => {
      const value = 'https://abcnews.go.com/video/embed?id=42185662&autoplay=true&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'abcnews',
        id: '42185662',
        src: 'https://abcnews.com/video/embed?id=42185662',
        url: 'https://abcnews.com/video/42185662',
        ratio: '16/9',
      }

      expect(abcnewsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/video/embed?id=39415146'

      expect(abcnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a player url with no id', () => {
      const value = 'https://abcnews.go.com/video/embed'

      expect(abcnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route below another segment', () => {
      const value = 'https://abcnews.go.com/archive/video/embed?id=39415146'

      expect(abcnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the route', () => {
      const value = 'https://abcnews.go.com/video/embed/clip?id=39415146'

      expect(abcnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for an id under an uppercase name, which the player answers 404', () => {
      const value = 'https://abcnews.com/video/embed?ID=39415146'

      expect(abcnewsResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the route words in any case', () => {
      const value = 'https://abcnews.com/VIDEO/EMBED?id=39415146'
      const expected: EmbedResolverResult = {
        provider: 'abcnews',
        id: '39415146',
        src: 'https://abcnews.com/video/embed?id=39415146',
        url: 'https://abcnews.com/video/39415146',
        ratio: '16/9',
      }

      expect(abcnewsResolveEmbed(value)).toEqual(expected)
    })

    it('should read the route with a trailing slash', () => {
      const value = 'https://abcnews.com/video/embed/?id=39415146'
      const expected: EmbedResolverResult = {
        provider: 'abcnews',
        id: '39415146',
        src: 'https://abcnews.com/video/embed?id=39415146',
        url: 'https://abcnews.com/video/39415146',
        ratio: '16/9',
      }

      expect(abcnewsResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an id that is not a number as written', () => {
      const value = 'https://abcnews.com/video/embed?id=39415146a'
      const expected: EmbedResolverResult = {
        provider: 'abcnews',
        id: '39415146a',
        src: 'https://abcnews.com/video/embed?id=39415146a',
        url: 'https://abcnews.com/video/39415146a',
        ratio: '16/9',
      }

      expect(abcnewsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('players and files that are not an ABC News clip', () => {
    // The Flash player's `clipId` belongs to an id space the current player answers 404 for.
    it('should return undefined for the Flash player', () => {
      const value = 'http://abcnews.go.com/assets/player/walt2.6/flash/SFP_Walt_2_65.swf'

      expect(abcnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the ABC network player', () => {
      const value = 'https://abc.go.com/embed?id=VDKA0_dc1yn7tn'

      expect(abcnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a poster on the image host', () => {
      const value = 'https://s.abcnews.com/images/Health/160527_wn_besser_16x9_992.jpg'

      expect(abcnewsResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('abcnewsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, abcnewsEmbedResolver)

  describe('happy paths', () => {
    it('should take the platform size over the declared box', async () => {
      const value = html`
        <iframe
          style="border: none;"
          src="http://abcnews.go.com/video/embed?id=43622203"
          width="640"
          height="360"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'abcnews',
        id: '43622203',
        src: 'https://abcnews.com/video/embed?id=43622203',
        url: 'https://abcnews.com/video/43622203',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/video/embed?id=43622203"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('abcnews player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should state the player ratio over the declared box', async () => {
    const value = html`
      <iframe
        src="http://abcnews.go.com/video/embed?id=39415146"
        width="640"
        height="360"
        scrolling="no"
        style="border:none;"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="39415146"
        data-embed-provider="abcnews"
        data-embed-src="https://abcnews.com/video/embed?id=39415146"
        data-embed-url="https://abcnews.com/video/39415146"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
