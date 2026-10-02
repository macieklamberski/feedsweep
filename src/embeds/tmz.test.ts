import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { tmzEmbedResolver, tmzResolveEmbed } from './tmz.js'

describe('tmzResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player of a dated slug', () => {
      const value = 'https://share.tmz.com/videos/2021-12-13-121321-danny-carey-1322198/'
      const expected: EmbedResolverResult = {
        provider: 'tmz',
        id: '2021-12-13-121321-danny-carey-1322198',
        src: 'https://share.tmz.com/videos/2021-12-13-121321-danny-carey-1322198/',
        url: 'https://www.tmz.com/watch/2021-12-13-121321-danny-carey-1322198/',
        ratio: '16/9',
      }

      expect(tmzResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the player of an older slug', () => {
      const value = 'https://share.tmz.com/videos/0-aw46wcaj/'
      const expected: EmbedResolverResult = {
        provider: 'tmz',
        id: '0-aw46wcaj',
        src: 'https://share.tmz.com/videos/0-aw46wcaj/',
        url: 'https://www.tmz.com/watch/0-aw46wcaj/',
        ratio: '16/9',
      }

      expect(tmzResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the watch route onto the player', () => {
      const value = 'https://share.tmz.com/watch/2024-07-12-071224-travis-kelce-1862808-319/'
      const expected: EmbedResolverResult = {
        provider: 'tmz',
        id: '2024-07-12-071224-travis-kelce-1862808-319',
        src: 'https://share.tmz.com/videos/2024-07-12-071224-travis-kelce-1862808-319/',
        url: 'https://www.tmz.com/watch/2024-07-12-071224-travis-kelce-1862808-319/',
        ratio: '16/9',
      }

      expect(tmzResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the query', () => {
      const value = 'https://share.tmz.com/videos/0-aw46wcaj/?autoplay=true&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'tmz',
        id: '0-aw46wcaj',
        src: 'https://share.tmz.com/videos/0-aw46wcaj/',
        url: 'https://www.tmz.com/watch/0-aw46wcaj/',
        ratio: '16/9',
      }

      expect(tmzResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the case of the slug in the key only', () => {
      const value = 'https://share.tmz.com/videos/0-AW46WCAJ/'
      const expected: EmbedResolverResult = {
        provider: 'tmz',
        id: '0-aw46wcaj',
        src: 'https://share.tmz.com/videos/0-AW46WCAJ/',
        url: 'https://www.tmz.com/watch/0-AW46WCAJ/',
        ratio: '16/9',
      }

      expect(tmzResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/videos/0-aw46wcaj/'

      expect(tmzResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://share.tmz.com/x/videos/0-aw46wcaj/'

      expect(tmzResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://share.tmz.com/videos/0-aw46wcaj/extra/'

      expect(tmzResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another route word', () => {
      const value = 'https://share.tmz.com/clips/0-aw46wcaj/'

      expect(tmzResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route with no slug', () => {
      const value = 'https://share.tmz.com/videos/'

      expect(tmzResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('tmzEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tmzEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the declared box', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://share.tmz.com/videos/2021-12-13-121321-danny-carey-1322198/"
          width="560"
          height="395"
          frameborder="0"
          allowfullscreen=""
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tmz',
        id: '2021-12-13-121321-danny-carey-1322198',
        src: 'https://share.tmz.com/videos/2021-12-13-121321-danny-carey-1322198/',
        url: 'https://www.tmz.com/watch/2021-12-13-121321-danny-carey-1322198/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/videos/0-aw46wcaj/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('tmz player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should state the player ratio over the declared box', async () => {
    const value = html`
      <iframe
        loading="lazy"
        src="https://share.tmz.com/videos/2021-12-13-121321-danny-carey-1322198/"
        width="560"
        height="395"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="2021-12-13-121321-danny-carey-1322198"
        data-embed-provider="tmz"
        data-embed-src="https://share.tmz.com/videos/2021-12-13-121321-danny-carey-1322198/"
        data-embed-url="https://www.tmz.com/watch/2021-12-13-121321-danny-carey-1322198/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
