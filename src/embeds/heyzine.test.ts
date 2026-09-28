import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { heyzineEmbedResolver, heyzineResolveEmbed } from './heyzine.js'

describe('heyzineResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the flipbook id off the viewer url', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should read the spelling without the extension', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should carry the page the fragment opens on', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c.html#page/4'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html#page/4',
        url: 'https://heyzine.com/flip-book/4db16f598c.html#page/4',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should lowercase an uppercase id', () => {
      const value = 'https://heyzine.com/flip-book/4DB16F598C.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should read a custom slug, lowercased and without the extension', () => {
      const value = 'https://heyzine.com/flip-book/ThroughThePrism'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'throughtheprism',
        src: 'https://heyzine.com/flip-book/throughtheprism',
        url: 'https://heyzine.com/flip-book/throughtheprism',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the apex host for the viewer on the www host', () => {
      const value = 'https://www.heyzine.com/flip-book/695b82b89c.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '695b82b89c',
        src: 'https://heyzine.com/flip-book/695b82b89c.html',
        url: 'https://heyzine.com/flip-book/695b82b89c.html',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the apex host for the viewer on the cdn host', () => {
      const value = 'https://cdn.heyzine.com/flip-book/695b82b89c.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '695b82b89c',
        src: 'https://heyzine.com/flip-book/695b82b89c.html',
        url: 'https://heyzine.com/flip-book/695b82b89c.html',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route that is not a flipbook', () => {
      const value = 'https://heyzine.com/pricing/4db16f598c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id outside the hexadecimal the viewer writes', () => {
      const value = 'https://heyzine.com/flip-book/zzzzzzzzzz.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id carrying a query separator', () => {
      const value = 'https://heyzine.com/flip-book/4db16f59=c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id longer than the ten characters the viewer writes', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c5.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id shorter than the ten characters the viewer writes', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a name that only ends in a hexadecimal id', () => {
      const value = 'https://heyzine.com/flip-book/x4db16f598c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the file host, where the flipbook PDF itself lives', () => {
      const value = 'https://cdnm.heyzine.com/files/uploaded/4db16f598c5a1f41c91c75d099f41ea4.pdf'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the PDF route that shares the flipbook segment', () => {
      const value =
        'https://cdn.heyzine.com/flip-book/pdf/4db16f598c5a1f41c91c75d099f41ea4b2c3d4e5.pdf'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a longer hexadecimal name without the extension', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c5'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a custom slug with the extension, which the viewer does not serve', () => {
      const value = 'https://heyzine.com/flip-book/ThroughThePrism.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a custom slug carrying an encoded separator', () => {
      const value = 'https://heyzine.com/flip-book/Through%2FThePrism'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the flipbook route on a foreign host', () => {
      const value = 'https://evil.test/flip-book/695b82b89c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the flipbook route on a file host', () => {
      const value = 'https://cdnm.heyzine.com/flip-book/695b82b89c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deeper path under the flipbook', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c/page/2'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read a custom slug that starts and ends in hexadecimal characters', () => {
      const value = 'https://heyzine.com/flip-book/Brochure2026'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'brochure2026',
        src: 'https://heyzine.com/flip-book/brochure2026',
        url: 'https://heyzine.com/flip-book/brochure2026',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a fragment that names no page', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c.html#comments'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('heyzineEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, heyzineEmbedResolver)

  describe('happy paths', () => {
    it('should keep the height the snippet states in its style', async () => {
      const value = html`
        <iframe
          src="https://heyzine.com/flip-book/4db16f598c.html"
          class="fp-iframe"
          style="border: 1px solid lightgray; width: 100%; height: 400px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the custom slug carrier', async () => {
      const value = html`
        <iframe
          allowfullscreen="allowfullscreen"
          allow="clipboard-write"
          scrolling="no"
          class="fp-iframe"
          style="border: 1px solid lightgray; width: 100%; height: 600px;"
          src="https://heyzine.com/flip-book/ThroughThePrism"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'throughtheprism',
        src: 'https://heyzine.com/flip-book/throughtheprism',
        url: 'https://heyzine.com/flip-book/throughtheprism',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://heyzine.com.evil.test/flip-book/4db16f598c.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the flipbook route in its path', async () => {
      const value =
        '<iframe src="https://evil.test/heyzine.com/flip-book/4db16f598c.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('heyzine through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a flipbook PDF enclosure a file', async () => {
    const enclosures = [
      {
        url: 'https://cdn.heyzine.com/flip-book/pdf/4db16f598c5a1f41c91c75d099f41ea4b2c3d4e5.pdf',
        type: 'application/pdf',
      },
    ]
    const expected = html`
      <p>Body</p>
      <div
        data-enclosure=""
        data-file-type="application/pdf"
        data-file-name="4db16f598c5a1f41c91c75d099f41ea4b2c3d4e5.pdf"
        data-file-url="https://cdn.heyzine.com/flip-book/pdf/4db16f598c5a1f41c91c75d099f41ea4b2c3d4e5.pdf"
      ></div>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
