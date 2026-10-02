import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { cspanEmbedResolver, cspanResolveEmbed } from './cspan.js'

describe('cspanResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the clip player without the slug', () => {
      const value =
        'https://www.c-span.org/video/standalone/?c5108942/tim-tebow-appeals-lawmakers-provide-resources-combat-child-sexual-exploitation'
      const expected: EmbedResolverResult = {
        provider: 'cspan',
        id: 'c5108942',
        src: 'https://www.c-span.org/video/standalone/?c5108942',
        url: 'https://www.c-span.org/video/?c5108942',
        ratio: '300/209',
      }

      expect(cspanResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the program player without the slug', () => {
      const value = 'https://www.c-span.org/video/standalone/?173607-1/immigration-policy-issues'
      const expected: EmbedResolverResult = {
        provider: 'cspan',
        id: '173607-1',
        src: 'https://www.c-span.org/video/standalone/?173607-1',
        url: 'https://www.c-span.org/video/?173607-1',
        ratio: '300/209',
      }

      expect(cspanResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position', () => {
      const value =
        'https://www.c-span.org/video/standalone/?457171-1/us-senate-blocks-competing-bills-open-government&start=9398'
      const expected: EmbedResolverResult = {
        provider: 'cspan',
        id: '457171-1',
        src: 'https://www.c-span.org/video/standalone/?457171-1&start=9398',
        url: 'https://www.c-span.org/video/?457171-1',
        ratio: '300/209',
      }

      expect(cspanResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker beside the start position', () => {
      const value = 'https://www.c-span.org/video/standalone/?c4509010&utm_source=feed&start=120'
      const expected: EmbedResolverResult = {
        provider: 'cspan',
        id: 'c4509010',
        src: 'https://www.c-span.org/video/standalone/?c4509010&start=120',
        url: 'https://www.c-span.org/video/?c4509010',
        ratio: '300/209',
      }

      expect(cspanResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the id through as written', () => {
      const value = 'https://www.c-span.org/video/standalone/?C4509010_x'
      const expected: EmbedResolverResult = {
        provider: 'cspan',
        id: 'C4509010_x',
        src: 'https://www.c-span.org/video/standalone/?C4509010_x',
        url: 'https://www.c-span.org/video/?C4509010_x',
        ratio: '300/209',
      }

      expect(cspanResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/video/standalone/?c4509010'

      expect(cspanResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://www.c-span.org/x/video/standalone/?c4509010'

      expect(cspanResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://www.c-span.org/video/standalone/extra/?c4509010'

      expect(cspanResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the video page', () => {
      const value = 'https://www.c-span.org/video/?c4509010'

      expect(cspanResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a standalone route under another section', () => {
      const value = 'https://www.c-span.org/x/standalone/?c4509010'

      expect(cspanResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player with no id', () => {
      const value = 'https://www.c-span.org/video/standalone/'

      expect(cspanResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a named parameter in the lead position', () => {
      const value = 'https://www.c-span.org/video/standalone/?start=10'

      expect(cspanResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('cspanEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, cspanEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the declared box', async () => {
      const value = html`
        <iframe
          src="https://www.c-span.org/video/standalone/?c5108942/tim-tebow-appeals-lawmakers-provide-resources-combat-child-sexual-exploitation"
          width="512"
          height="330"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'cspan',
        id: 'c5108942',
        src: 'https://www.c-span.org/video/standalone/?c5108942',
        url: 'https://www.c-span.org/video/?c5108942',
        ratio: '300/209',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/video/standalone/?c4509010"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('cspan players the pipeline absolutises first', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should resolve a protocol-relative player', async () => {
    const value = html`
      <iframe
        loading="lazy"
        src="//www.c-span.org/video/standalone/?c4509010"
        width="512"
        height="330"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="300/209"
        data-embed-url="https://www.c-span.org/video/?c4509010"
        data-embed-id="c4509010"
        data-embed-provider="cspan"
        data-embed-src="https://www.c-span.org/video/standalone/?c4509010"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
