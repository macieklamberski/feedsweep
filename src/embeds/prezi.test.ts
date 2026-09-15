import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { preziEmbedResolver, preziResolveEmbed } from './prezi.js'

describe('preziResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the legacy embed route', () => {
      const value = 'https://prezi.com/embed/testonly0001/?bgcolor=ffffff&lock_to_path=0'
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'testonly0001',
        src: 'https://prezi.com/p/testonly0001/embed',
        url: 'https://prezi.com/p/testonly0001/',
      }

      expect(preziResolveEmbed(value)).toEqual(expected)
    })

    it('should read the current embed route the same way', () => {
      const value = 'https://prezi.com/p/testonly0001/embed'
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'testonly0001',
        src: 'https://prezi.com/p/testonly0001/embed',
        url: 'https://prezi.com/p/testonly0001/',
      }

      expect(preziResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the view route of the newer product', () => {
      const value = 'https://prezi.com/view/testonly0001/embed'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the presentation page itself', () => {
      const value = 'https://prezi.com/p/testonly0001/'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a loader whose element id carries no prezi prefix', () => {
      const value = '<embed src="http://prezi.com/bin/preziloader.swf" id="player" />'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Flash loader with nothing naming a presentation', () => {
      const value = 'http://prezi.com/bin/preziloader.swf'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('preziEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, preziEmbedResolver)

  describe('happy paths', () => {
    it('should read the presentation out of the Flash loader flashvars', async () => {
      const value = html`
        <object
          id="prezi_testonly0001"
          name="prezi_testonly0001"
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          width="440"
          height="325"
        >
          <param
            name="movie"
            value="http://prezi.com/bin/preziloader.swf"
          />
          <param
            name="flashvars"
            value="prezi_id=testonly0001&amp;lock_to_path=0&amp;color=ffffff&amp;autoplay=no"
          />
          <embed
            id="preziEmbed_testonly0001"
            src="http://prezi.com/bin/preziloader.swf"
            type="application/x-shockwave-flash"
            width="440"
            height="325"
            flashvars="prezi_id=testonly0001&amp;lock_to_path=0"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'testonly0001',
        src: 'https://prezi.com/p/testonly0001/embed',
        url: 'https://prezi.com/p/testonly0001/',
        width: 440,
        height: 325,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the element id when the flashvars are gone', async () => {
      const value = html`
        <object
          width="440"
          height="325"
        >
          <param
            name="movie"
            value="http://prezi.com/bin/preziloader.swf"
          />
          <embed
            id="preziEmbed_testonly0001"
            src="http://prezi.com/bin/preziloader.swf"
            type="application/x-shockwave-flash"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'testonly0001',
        src: 'https://prezi.com/p/testonly0001/embed',
        url: 'https://prezi.com/p/testonly0001/',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the loader in its path', async () => {
      const value = html`
        <embed
          src="https://evil.test/prezi.com/bin/preziloader.swf"
          flashvars="prezi_id=testonly0001"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Only the whole run proves the Flash embed reaches this resolver ahead of every other reader
// of a Flash carrier.
describeForEachParser('preziEmbedResolver through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the Flash player into a placeholder onto the current embed route', async () => {
    const value = html`
      <div class="prezi-player">
        <object
          id="prezi_testonly0001"
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          width="440"
          height="325"
        >
          <param
            name="movie"
            value="http://prezi.com/bin/preziloader.swf"
          />
          <param
            name="flashvars"
            value="prezi_id=testonly0001&amp;lock_to_path=0"
          />
          <embed
            id="preziEmbed_testonly0001"
            src="http://prezi.com/bin/preziloader.swf"
            type="application/x-shockwave-flash"
            width="440"
            height="325"
            flashvars="prezi_id=testonly0001&amp;lock_to_path=0"
          />
        </object>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="prezi"
        data-embed-id="testonly0001"
        data-embed-src="https://prezi.com/p/testonly0001/embed"
        data-embed-url="https://prezi.com/p/testonly0001/"
        data-embed-width="440"
        data-embed-height="325"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
