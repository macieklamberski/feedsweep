import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { traileraddictEmbedResolver, traileraddictResolveEmbed } from './traileraddict.js'

describe('traileraddictResolveEmbed', () => {
  describe('happy paths', () => {
    it('should rebuild the Flash player onto the current player', () => {
      const value = 'http://www.traileraddict.com/emd/13259'
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '13259',
        src: 'https://traileraddict.com/iframe.php?id=13259',
        url: 'https://traileraddict.com/watch/13259',
        ratio: '16/9',
      }

      expect(traileraddictResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the other Flash route onto the current player', () => {
      const value = 'http://www.traileraddict.com/emb/15437'
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '15437',
        src: 'https://traileraddict.com/iframe.php?id=15437',
        url: 'https://traileraddict.com/watch/15437',
        ratio: '16/9',
      }

      expect(traileraddictResolveEmbed(value)).toEqual(expected)
    })

    it('should claim the current player', () => {
      const value = 'https://traileraddict.com/iframe.php?id=20301'
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '20301',
        src: 'https://traileraddict.com/iframe.php?id=20301',
        url: 'https://traileraddict.com/watch/20301',
        ratio: '16/9',
      }

      expect(traileraddictResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the short host onto the current player', () => {
      const value = 'http://v.traileraddict.com/96331'
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '96331',
        src: 'https://traileraddict.com/iframe.php?id=96331',
        url: 'https://traileraddict.com/watch/96331',
        ratio: '16/9',
      }

      expect(traileraddictResolveEmbed(value)).toEqual(expected)
    })

    it('should drop everything in the query but the id', () => {
      const value = 'https://traileraddict.com/iframe.php?id=11188&autoplay=1&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '11188',
        src: 'https://traileraddict.com/iframe.php?id=11188',
        url: 'https://traileraddict.com/watch/11188',
        ratio: '16/9',
      }

      expect(traileraddictResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the Flash path', () => {
      const value = 'https://evil.test/emd/13259'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a route word the Flash player did not serve', () => {
      const value = 'https://www.traileraddict.com/emx/13259'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a Flash route with no id', () => {
      const value = 'https://www.traileraddict.com/emd/'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the Flash id', () => {
      const value = 'https://www.traileraddict.com/emd/13259/extra'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the current player with no id', () => {
      const value = 'https://traileraddict.com/iframe.php'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the current player in capitals, which the server answers 404', () => {
      const value = 'https://traileraddict.com/IFRAME.PHP?id=13259'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the short host with no id', () => {
      const value = 'https://v.traileraddict.com/'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the short host id', () => {
      const value = 'https://v.traileraddict.com/119230/extra'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for an id alone on the apex host', () => {
      const value = 'https://traileraddict.com/119230'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the watch page', () => {
      const value = 'https://traileraddict.com/watch/13259/untitled/trailer'

      expect(traileraddictResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the Flash route in any case, as the server redirects it', () => {
      const value = 'https://traileraddict.com/EMD/13259'
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '13259',
        src: 'https://traileraddict.com/iframe.php?id=13259',
        url: 'https://traileraddict.com/watch/13259',
        ratio: '16/9',
      }

      expect(traileraddictResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an id that is not a number as written', () => {
      const value = 'http://www.traileraddict.com/emd/13259a'
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '13259a',
        src: 'https://traileraddict.com/iframe.php?id=13259a',
        url: 'https://traileraddict.com/watch/13259a',
        ratio: '16/9',
      }

      expect(traileraddictResolveEmbed(value)).toEqual(expected)
    })

    it('should pass a short host id that is not a number as written', () => {
      const value = 'https://v.traileraddict.com/119230a'
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '119230a',
        src: 'https://traileraddict.com/iframe.php?id=119230a',
        url: 'https://traileraddict.com/watch/119230a',
        ratio: '16/9',
      }

      expect(traileraddictResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('traileraddictEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, traileraddictEmbedResolver)

  describe('happy paths', () => {
    it('should take the platform size over the Flash box', async () => {
      const value = html`
        <embed
          src="http://www.traileraddict.com/emd/20301"
          type="application/x-shockwave-flash"
          allowscriptaccess="always"
          wmode="transparent"
          allowfullscreen="true"
          width="520"
          height="281"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '20301',
        src: 'https://traileraddict.com/iframe.php?id=20301',
        url: 'https://traileraddict.com/watch/20301',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the platform size over the short host frame box', async () => {
      const value = html`
        <iframe
          class="embed-ta"
          src="https://v.traileraddict.com/119230"
          width="853"
          height="480"
          scrolling="no"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'traileraddict',
        id: '119230',
        src: 'https://traileraddict.com/iframe.php?id=119230',
        url: 'https://traileraddict.com/watch/119230',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<embed src="https://evil.test/emd/20301">'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('traileraddict player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should replace the Flash object with the current player', async () => {
    const value = html`
      <object width="450" height="235">
        <param name="movie" value="http://www.traileraddict.com/emd/13259">
        <param name="allowscriptaccess" value="always">
        <embed src="http://www.traileraddict.com/emd/13259" type="application/x-shockwave-flash" width="450" height="235">
      </object>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="13259"
        data-embed-provider="traileraddict"
        data-embed-src="https://traileraddict.com/iframe.php?id=13259"
        data-embed-url="https://traileraddict.com/watch/13259"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace a protocol-relative short host frame with the current player', async () => {
    const value = html`
      <iframe
        loading="lazy"
        src="//v.traileraddict.com/104947"
        width="560"
        height="315"
        scrolling="no"
        allowfullscreen="allowfullscreen"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="104947"
        data-embed-provider="traileraddict"
        data-embed-src="https://traileraddict.com/iframe.php?id=104947"
        data-embed-url="https://traileraddict.com/watch/104947"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
