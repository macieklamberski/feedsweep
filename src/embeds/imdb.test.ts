import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { imdbEmbedResolver, imdbResolveEmbed } from './imdb.js'

describe('imdbResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the current player', () => {
      const value = 'https://www.imdb.com/video/embed/vi3012802841/'
      const expected: EmbedResolverResult = {
        provider: 'imdb',
        id: 'vi3012802841',
        src: 'https://www.imdb.com/video/embed/vi3012802841/',
        url: 'https://www.imdb.com/video/vi3012802841/',
        ratio: '16/9',
      }

      expect(imdbResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the videoembed route onto the current player', () => {
      const value = 'https://www.imdb.com/videoembed/vi2742270233'
      const expected: EmbedResolverResult = {
        provider: 'imdb',
        id: 'vi2742270233',
        src: 'https://www.imdb.com/video/embed/vi2742270233/',
        url: 'https://www.imdb.com/video/vi2742270233/',
        ratio: '16/9',
      }

      expect(imdbResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the source route onto the current player and drop its query', () => {
      const value =
        'http://www.imdb.com/video/imdb/vi3012802841/imdb/embed?autoplay=false&width=480'
      const expected: EmbedResolverResult = {
        provider: 'imdb',
        id: 'vi3012802841',
        src: 'https://www.imdb.com/video/embed/vi3012802841/',
        url: 'https://www.imdb.com/video/vi3012802841/',
        ratio: '16/9',
      }

      expect(imdbResolveEmbed(value)).toEqual(expected)
    })

    it('should take any source word on the source route', () => {
      const value = 'https://www.imdb.com/video/wab/vi3494577433/imdb/embed?autoplay=false'
      const expected: EmbedResolverResult = {
        provider: 'imdb',
        id: 'vi3494577433',
        src: 'https://www.imdb.com/video/embed/vi3494577433/',
        url: 'https://www.imdb.com/video/vi3494577433/',
        ratio: '16/9',
      }

      expect(imdbResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the id through as written', () => {
      const value = 'https://www.imdb.com/videoembed/VI22062873_x'
      const expected: EmbedResolverResult = {
        provider: 'imdb',
        id: 'VI22062873_x',
        src: 'https://www.imdb.com/video/embed/VI22062873_x/',
        url: 'https://www.imdb.com/video/VI22062873_x/',
        ratio: '16/9',
      }

      expect(imdbResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/video/embed/vi3012802841/'

      expect(imdbResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the watch page', () => {
      const value = 'https://www.imdb.com/video/vi3012802841/'

      expect(imdbResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another two-segment route', () => {
      const value = 'https://www.imdb.com/title/tt5013056'

      expect(imdbResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an embed route under another section', () => {
      const value = 'https://www.imdb.com/x/embed/vi3012802841/'

      expect(imdbResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a three-segment video route that is not an embed', () => {
      const value = 'https://www.imdb.com/video/imdb/vi3012802841'

      expect(imdbResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a source route under another section', () => {
      const value = 'https://www.imdb.com/x/imdb/vi3012802841/imdb/embed'

      expect(imdbResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a source route with another fourth word', () => {
      const value = 'https://www.imdb.com/video/imdb/vi3012802841/x/embed'

      expect(imdbResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a source route that is not an embed', () => {
      const value = 'https://www.imdb.com/video/imdb/vi3012802841/imdb/x'

      expect(imdbResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://www.imdb.com/video/embed/vi3012802841/extra'

      expect(imdbResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('imdbEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, imdbEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the declared box', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          height="315"
          src="https://www.imdb.com/videoembed/vi2742270233"
          width="560"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'imdb',
        id: 'vi2742270233',
        src: 'https://www.imdb.com/video/embed/vi2742270233/',
        url: 'https://www.imdb.com/video/vi2742270233/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/videoembed/vi2742270233"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('imdb players through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should resolve the source route with its autoplay flag', async () => {
    const value = html`
      <iframe
        src="http://www.imdb.com/video/imdb/vi3012802841/imdb/embed?autoplay=false&amp;width=480"
        width="480"
        height="270"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://www.imdb.com/video/vi3012802841/"
        data-embed-id="vi3012802841"
        data-embed-provider="imdb"
        data-embed-src="https://www.imdb.com/video/embed/vi3012802841/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
