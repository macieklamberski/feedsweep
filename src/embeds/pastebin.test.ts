import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  pastebinIframeEmbedResolver,
  pastebinResolveEmbed,
  pastebinScriptEmbedResolver,
} from './pastebin.js'

describe('pastebinResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the frame and the paste page from the path form', () => {
      const value = 'https://pastebin.com/embed_iframe/jFp3Y1wP'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'jFp3Y1wP',
        src: 'https://pastebin.com/embed_iframe/jFp3Y1wP',
        url: 'https://pastebin.com/jFp3Y1wP',
      }

      expect(pastebinResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the dark theme the snippet chose and drop a tracker', () => {
      const value = 'https://pastebin.com/embed_iframe/jFp3Y1wP?theme=dark&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'jFp3Y1wP',
        src: 'https://pastebin.com/embed_iframe/jFp3Y1wP?theme=dark',
        url: 'https://pastebin.com/jFp3Y1wP',
      }

      expect(pastebinResolveEmbed(value)).toEqual(expected)
    })

    it('should move the retired query form onto the route that serves', () => {
      const value = 'https://pastebin.com/embed_iframe.php?i=FzCyksKn'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'FzCyksKn',
        src: 'https://pastebin.com/embed_iframe/FzCyksKn',
        url: 'https://pastebin.com/FzCyksKn',
      }

      expect(pastebinResolveEmbed(value)).toEqual(expected)
    })

    it('should mint https for an http carrier, which the host redirects there', () => {
      const value = 'http://pastebin.com/embed_iframe.php?i=agtNppwK'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'agtNppwK',
        src: 'https://pastebin.com/embed_iframe/agtNppwK',
        url: 'https://pastebin.com/agtNppwK',
      }

      expect(pastebinResolveEmbed(value)).toEqual(expected)
    })

    it('should read the script route onto the same frame', () => {
      const value = 'https://pastebin.com/embed_js/heGyGJgS'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'heGyGJgS',
        src: 'https://pastebin.com/embed_iframe/heGyGJgS',
        url: 'https://pastebin.com/heGyGJgS',
      }

      expect(pastebinResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the paste page itself, which is not an embed', () => {
      const value = 'https://pastebin.com/AbCd1234'

      expect(pastebinResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route that is not one of the embed four', () => {
      const value = 'https://pastebin.com/raw/AbCd1234'

      expect(pastebinResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an embed route naming no paste', () => {
      const value = 'https://pastebin.com/embed_iframe.php'

      expect(pastebinResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a paste id carrying a separator', () => {
      const value = 'https://pastebin.com/embed_iframe.php?i=AbCd%2F1234'

      expect(pastebinResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deeper path under the embed route', () => {
      const value = 'https://pastebin.com/embed_iframe/AbCd1234/raw'

      expect(pastebinResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pastebinIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pastebinIframeEmbedResolver)

  describe('happy paths', () => {
    it('should keep the height the snippet states in its style', async () => {
      const value = html`
        <iframe
          src="https://pastebin.com/embed_iframe/jFp3Y1wP"
          style="border:none;width:100%;height:300px;font-size:7px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'jFp3Y1wP',
        src: 'https://pastebin.com/embed_iframe/jFp3Y1wP',
        url: 'https://pastebin.com/jFp3Y1wP',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value = '<iframe src="https://pastebin.com.evil.test/embed_iframe/AbCd1234"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pastebinScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pastebinScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the frame for the paste the script writes inline', async () => {
      const value = '<script src="https://pastebin.com/embed_js/heGyGJgS"></script>'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'heGyGJgS',
        src: 'https://pastebin.com/embed_iframe/heGyGJgS',
        url: 'https://pastebin.com/heGyGJgS',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the dark theme the script snippet chose', async () => {
      const value = '<script src="https://pastebin.com/embed_js/heGyGJgS?theme=dark"></script>'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'heGyGJgS',
        src: 'https://pastebin.com/embed_iframe/heGyGJgS?theme=dark',
        url: 'https://pastebin.com/heGyGJgS',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build an https frame from the retired http query form as well', async () => {
      const value = '<script src="http://pastebin.com/embed_js.php?i=7v2qkUqr"></script>'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: '7v2qkUqr',
        src: 'https://pastebin.com/embed_iframe/7v2qkUqr',
        url: 'https://pastebin.com/7v2qkUqr',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host ending in the platform name', async () => {
      const value = '<script src="https://notpastebin.com/embed_js/AbCd1234"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pastebin through the pipeline', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should claim the script before the script is stripped', async () => {
    const value = html`
      <p>The config:</p>
      <script src="https://pastebin.com/embed_js/heGyGJgS"></script>
    `
    const expected = html`
      <p>The config:</p>
      <div
        data-embed-src="https://pastebin.com/embed_iframe/heGyGJgS"
        data-embed-provider="pastebin"
        data-embed-id="heGyGJgS"
        data-embed-url="https://pastebin.com/heGyGJgS"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should move the retired query frame onto the route that serves', async () => {
    const value = html`
      <iframe
        style="border:none;width:100%;height:300px;font-size:7px;"
        src="https://pastebin.com/embed_iframe.php?i=kiDpUViY"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://pastebin.com/embed_iframe/kiDpUViY"
        data-embed-provider="pastebin"
        data-embed-id="kiDpUViY"
        data-embed-url="https://pastebin.com/kiDpUViY"
        data-embed-height="300"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
