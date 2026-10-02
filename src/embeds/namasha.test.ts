import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { namashaEmbedResolver, namashaResolveEmbed } from './namasha.js'

describe('namashaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player and the watch page', () => {
      const value = 'https://www.namasha.com/embed/TR5Otj9Q'
      const expected: EmbedResolverResult = {
        provider: 'namasha',
        id: 'tr5otj9q',
        src: 'https://www.namasha.com/embed/TR5Otj9Q',
        url: 'https://www.namasha.com/v/TR5Otj9Q',
        ratio: '16/9',
      }

      expect(namashaResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the www host for the apex', () => {
      const value = 'https://namasha.com/embed/eP9x4n68'
      const expected: EmbedResolverResult = {
        provider: 'namasha',
        id: 'ep9x4n68',
        src: 'https://www.namasha.com/embed/eP9x4n68',
        url: 'https://www.namasha.com/v/eP9x4n68',
        ratio: '16/9',
      }

      expect(namashaResolveEmbed(value)).toEqual(expected)
    })

    it('should read the route word in any case and keep the id as written', () => {
      const value = 'https://www.namasha.com/EMBED/TR5Otj9Q/'
      const expected: EmbedResolverResult = {
        provider: 'namasha',
        id: 'tr5otj9q',
        src: 'https://www.namasha.com/embed/TR5Otj9Q',
        url: 'https://www.namasha.com/v/TR5Otj9Q',
        ratio: '16/9',
      }

      expect(namashaResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position and drop the autoplay and a tracker', () => {
      const value = 'https://www.namasha.com/embed/TR5Otj9Q?t=30&autoplay=true&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'namasha',
        id: 'tr5otj9q',
        src: 'https://www.namasha.com/embed/TR5Otj9Q?t=30',
        url: 'https://www.namasha.com/v/TR5Otj9Q',
        ratio: '16/9',
      }

      expect(namashaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the watch page', () => {
      const value = 'https://www.namasha.com/v/TR5Otj9Q'

      expect(namashaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://www.namasha.com/x/embed/TR5Otj9Q'

      expect(namashaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://www.namasha.com/embed/TR5Otj9Q/extra'

      expect(namashaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video file', () => {
      const value = 'https://s15.namasha.com/videos/7246593438.mp4'

      expect(namashaResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('namashaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, namashaEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the iframe in a responsive wrapper, without the box it states', async () => {
      const value = html`
        <iframe
          style="position: absolute; top: 0; bottom: 0; left: 0; width: 100%; height: 100%; border: 0;"
          src="https://www.namasha.com/embed/TR5Otj9Q"
          frameborder="0"
          scrolling="no"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'namasha',
        id: 'tr5otj9q',
        src: 'https://www.namasha.com/embed/TR5Otj9Q',
        url: 'https://www.namasha.com/v/TR5Otj9Q',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the iframe with a pixel box, without the box it states', async () => {
      const value = html`
        <iframe
          src="https://www.namasha.com/embed/eP9x4n68"
          width="480"
          height="320"
          frameborder="0"
          scrolling="no"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'namasha',
        id: 'ep9x4n68',
        src: 'https://www.namasha.com/embed/eP9x4n68',
        url: 'https://www.namasha.com/v/eP9x4n68',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/TR5Otj9Q"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('namasha through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a video enclosure on a namasha host playable', async () => {
    const enclosures = [{ url: 'https://s15.namasha.com/videos/7246593438.mp4', type: 'video/mp4' }]

    const expected = html`
      <video data-enclosure="" controls src="https://s15.namasha.com/videos/7246593438.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
