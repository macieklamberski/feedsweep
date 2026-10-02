import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { democracynowEmbedResolver, democracynowResolveEmbed } from './democracynow.js'

describe('democracynowResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint a story player and its page', () => {
      const value =
        'http://www.democracynow.org/embed/story/2014/10/22/in_un_speech_noam_chomsky_blasts'
      const expected: EmbedResolverResult = {
        provider: 'democracynow',
        id: 'story/2014/10/22/in_un_speech_noam_chomsky_blasts',
        src: 'https://www.democracynow.org/embed/story/2014/10/22/in_un_speech_noam_chomsky_blasts',
        url: 'https://www.democracynow.org/2014/10/22/in_un_speech_noam_chomsky_blasts',
        ratio: '16/9',
      }

      expect(democracynowResolveEmbed(value)).toEqual(expected)
    })

    it('should mint a show player and its page', () => {
      const value = 'https://www.democracynow.org/embed/show/2023/6/27'
      const expected: EmbedResolverResult = {
        provider: 'democracynow',
        id: 'show/2023/6/27',
        src: 'https://www.democracynow.org/embed/show/2023/6/27',
        url: 'https://www.democracynow.org/shows/2023/6/27',
        ratio: '16/9',
      }

      expect(democracynowResolveEmbed(value)).toEqual(expected)
    })

    it('should mint a headlines player and its page', () => {
      const value = 'http://www.democracynow.org/embed/headlines/2014/2/19'
      const expected: EmbedResolverResult = {
        provider: 'democracynow',
        id: 'headlines/2014/2/19',
        src: 'https://www.democracynow.org/embed/headlines/2014/2/19',
        url: 'https://www.democracynow.org/2014/2/19/headlines',
        ratio: '16/9',
      }

      expect(democracynowResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a query the player does not read', () => {
      const value = 'https://www.democracynow.org/embed/show/2023/6/27?utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'democracynow',
        id: 'show/2023/6/27',
        src: 'https://www.democracynow.org/embed/show/2023/6/27',
        url: 'https://www.democracynow.org/shows/2023/6/27',
        ratio: '16/9',
      }

      expect(democracynowResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/embed/show/2023/6/27'

      expect(democracynowResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route below another segment', () => {
      const value = 'https://www.democracynow.org/es/embed/show/2023/6/27'

      expect(democracynowResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route word in capitals, which the server answers 404', () => {
      const value = 'https://www.democracynow.org/EMBED/show/2023/6/27'

      expect(democracynowResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a kind the player does not serve', () => {
      const value =
        'https://www.democracynow.org/embed/clip/2014/10/22/in_un_speech_noam_chomsky_blasts'

      expect(democracynowResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a date with no day', () => {
      const value = 'https://www.democracynow.org/embed/show/2023/6'

      expect(democracynowResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a story with no slug', () => {
      const value = 'https://www.democracynow.org/embed/story/2014/10/22'

      expect(democracynowResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a show with a slug', () => {
      const value = 'https://www.democracynow.org/embed/show/2023/6/27/extra'

      expect(democracynowResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for headlines with a slug', () => {
      const value = 'https://www.democracynow.org/embed/headlines/2014/2/19/extra'

      expect(democracynowResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the story slug', () => {
      const value =
        'https://www.democracynow.org/embed/story/2014/10/22/in_un_speech_noam_chomsky_blasts/extra'

      expect(democracynowResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the route with a trailing slash', () => {
      const value =
        'https://www.democracynow.org/embed/story/2014/10/22/noam_chomsky_at_united_nations_it/'
      const expected: EmbedResolverResult = {
        provider: 'democracynow',
        id: 'story/2014/10/22/noam_chomsky_at_united_nations_it',
        src: 'https://www.democracynow.org/embed/story/2014/10/22/noam_chomsky_at_united_nations_it',
        url: 'https://www.democracynow.org/2014/10/22/noam_chomsky_at_united_nations_it',
        ratio: '16/9',
      }

      expect(democracynowResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the date as written', () => {
      const value = 'https://democracynow.org/embed/show/2023/06/27'
      const expected: EmbedResolverResult = {
        provider: 'democracynow',
        id: 'show/2023/06/27',
        src: 'https://www.democracynow.org/embed/show/2023/06/27',
        url: 'https://www.democracynow.org/shows/2023/06/27',
        ratio: '16/9',
      }

      expect(democracynowResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('democracynowEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, democracynowEmbedResolver)

  describe('happy paths', () => {
    it('should take the platform size over the declared box', async () => {
      const value = html`
        <iframe
          loading="lazy"
          frameborder="0"
          height="346"
          src="http://www.democracynow.org/embed/story/2013/11/13/as_new_protest_law_looms_egypt"
          width="615"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'democracynow',
        id: 'story/2013/11/13/as_new_protest_law_looms_egypt',
        src: 'https://www.democracynow.org/embed/story/2013/11/13/as_new_protest_law_looms_egypt',
        url: 'https://www.democracynow.org/2013/11/13/as_new_protest_law_looms_egypt',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/show/2023/6/27"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('democracynow player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should state the player ratio over the declared box', async () => {
    const value = html`
      <iframe
        allowfullscreen="true"
        frameborder="0"
        height="360"
        src="https://www.democracynow.org/embed/show/2023/6/27"
        width="640"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://www.democracynow.org/shows/2023/6/27"
        data-embed-id="show/2023/6/27"
        data-embed-provider="democracynow"
        data-embed-src="https://www.democracynow.org/embed/show/2023/6/27"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
