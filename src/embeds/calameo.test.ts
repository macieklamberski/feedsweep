import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { calameoEmbedResolver, calameoResolveEmbed } from './calameo.js'

describe('calameoResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the viewer url', () => {
      const value = 'https://v.calameo.com/?bkcode=000000000000000abc01'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '000000000000000abc01',
        src: 'https://v.calameo.com/?bkcode=000000000000000abc01',
        url: 'https://www.calameo.com/books/000000000000000abc01',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should lift the code off the retired Flash viewer', () => {
      const value = 'http://v.calameo.com/2.3/cviewer.swf?bkcode=000000000000000abc01&langid=pt'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '000000000000000abc01',
        src: 'https://v.calameo.com/?bkcode=000000000000000abc01',
        url: 'https://www.calameo.com/books/000000000000000abc01',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a library shelf naming no publication', () => {
      const value = 'https://v.calameo.com/library?subscriptionid=123'

      expect(calameoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a code outside the hex alphabet', () => {
      const value = 'https://v.calameo.com/?bkcode=../books'

      expect(calameoResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('calameoEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, calameoEmbedResolver)

  describe('happy paths', () => {
    it('should read the Flash viewer object at its declared box', async () => {
      const value = html`
        <object
          id="calameo-viewer-000000000000000abc01-1324375075"
          width="100%"
          height="500"
          data="http://v.calameo.com/2.3/cviewer.swf?bkcode=000000000000000abc01&amp;langid=pt"
          type="application/x-shockwave-flash"
        >
          <param
            name="src"
            value="http://v.calameo.com/2.3/cviewer.swf?bkcode=000000000000000abc01&amp;langid=pt"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '000000000000000abc01',
        src: 'https://v.calameo.com/?bkcode=000000000000000abc01',
        url: 'https://www.calameo.com/books/000000000000000abc01',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the Flash mini player embed', async () => {
      const value = html`
        <object
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          width="240"
          height="147"
        >
          <param
            name="movie"
            value="http://v.calameo.com/2.1/cmini.swf?bkcode=000000000000000abc01&amp;langid=es"
          />
          <embed
            id="calameo-mini-inner-000000000000000abc01"
            type="application/x-shockwave-flash"
            src="http://v.calameo.com/2.1/cmini.swf?bkcode=000000000000000abc01&amp;langid=es"
            width="240"
            height="147"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '000000000000000abc01',
        src: 'https://v.calameo.com/?bkcode=000000000000000abc01',
        url: 'https://www.calameo.com/books/000000000000000abc01',
        width: 240,
        height: 147,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the viewer in its path', async () => {
      const value = html`
        <iframe src="https://evil.test/v.calameo.com/?bkcode=000000000000000abc01"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Only the whole run proves the Flash object reaches this resolver ahead of every other reader
// of an object.
describeForEachParser('calameoEmbedResolver through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the Flash viewer into a placeholder onto the live viewer', async () => {
    const value = html`
      <p>Book below.</p>
      <object
        id="calameo-viewer-000000000000000abc01-1332666616"
        width="100%"
        height="500"
        data="http://v.calameo.com/2.3/cviewer.swf?bkcode=000000000000000abc01&amp;langid=pt"
        type="application/x-shockwave-flash"
      >
        <param
          name="wmode"
          value="transparent"
        />
      </object>
    `
    const expected = html`
      <p>Book below.</p>
      <div
        data-embed-provider="calameo"
        data-embed-id="000000000000000abc01"
        data-embed-src="https://v.calameo.com/?bkcode=000000000000000abc01"
        data-embed-url="https://www.calameo.com/books/000000000000000abc01"
        data-embed-height="500"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
