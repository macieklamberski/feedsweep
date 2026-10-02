import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { dvidsEmbedResolver, dvidsResolveEmbed } from './dvids.js'

describe('dvidsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player the share dialog writes and its page', () => {
      const value = 'https://www.dvidshub.net/video/embed/549765'
      const expected: EmbedResolverResult = {
        provider: 'dvids',
        id: '549765',
        src: 'https://www.dvidshub.net/video/embed/549765',
        url: 'https://www.dvidshub.net/video/549765',
        ratio: '16/9',
      }

      expect(dvidsResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the canonical host from the apex', () => {
      const value = 'http://dvidshub.net/video/embed/663649'
      const expected: EmbedResolverResult = {
        provider: 'dvids',
        id: '663649',
        src: 'https://www.dvidshub.net/video/embed/663649',
        url: 'https://www.dvidshub.net/video/663649',
        ratio: '16/9',
      }

      expect(dvidsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a query the player does not read', () => {
      const value = 'https://www.dvidshub.net/video/embed/655485?autoplay=1&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'dvids',
        id: '655485',
        src: 'https://www.dvidshub.net/video/embed/655485',
        url: 'https://www.dvidshub.net/video/655485',
        ratio: '16/9',
      }

      expect(dvidsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/video/embed/549765'

      expect(dvidsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route below another segment', () => {
      const value = 'https://www.dvidshub.net/unit/video/embed/549765'

      expect(dvidsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the id', () => {
      const value = 'https://www.dvidshub.net/video/embed/549765/extra'

      expect(dvidsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route in capitals, which the server answers 404', () => {
      const value = 'https://www.dvidshub.net/VIDEO/EMBED/549765'

      expect(dvidsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the video page', () => {
      const value =
        'https://www.dvidshub.net/video/549765/102nd-intelligence-wing-airmen-provide-disaster-relief'

      expect(dvidsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a webcast', () => {
      const value = 'https://www.dvidshub.net/webcast/embed/12345'

      expect(dvidsResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the route with a trailing slash', () => {
      const value = 'https://www.dvidshub.net/video/embed/549765/'
      const expected: EmbedResolverResult = {
        provider: 'dvids',
        id: '549765',
        src: 'https://www.dvidshub.net/video/embed/549765',
        url: 'https://www.dvidshub.net/video/549765',
        ratio: '16/9',
      }

      expect(dvidsResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an id that is not a number as written', () => {
      const value = 'https://www.dvidshub.net/video/embed/549765a'
      const expected: EmbedResolverResult = {
        provider: 'dvids',
        id: '549765a',
        src: 'https://www.dvidshub.net/video/embed/549765a',
        url: 'https://www.dvidshub.net/video/549765a',
        ratio: '16/9',
      }

      expect(dvidsResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('dvidsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, dvidsEmbedResolver)

  describe('happy paths', () => {
    it('should take the platform size over the declared box', async () => {
      const value = html`
        <iframe
          align="center"
          src="https://www.dvidshub.net/video/embed/655485"
          width="770"
          height="450"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'dvids',
        id: '655485',
        src: 'https://www.dvidshub.net/video/embed/655485',
        url: 'https://www.dvidshub.net/video/655485',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/video/embed/655485"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('dvids player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should state the player ratio over the declared box', async () => {
    const value = html`
      <iframe
        src="https://www.dvidshub.net/video/embed/549765"
        width="500"
        height="300"
        frameborder="0"
        allowtransparency
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://www.dvidshub.net/video/549765"
        data-embed-id="549765"
        data-embed-provider="dvids"
        data-embed-src="https://www.dvidshub.net/video/embed/549765"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
