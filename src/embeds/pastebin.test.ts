import { describe, expect, it } from 'bun:test'
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
      const value = 'https://pastebin.com/embed_iframe/AbCd1234'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'AbCd1234',
        src: 'https://pastebin.com/embed_iframe/AbCd1234',
        url: 'https://pastebin.com/AbCd1234',
      }

      expect(pastebinResolveEmbed(value)).toEqual(expected)
    })

    it('should move the retired query form onto the route that serves', () => {
      const value = 'https://pastebin.com/embed_iframe.php?i=AbCd1234'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'AbCd1234',
        src: 'https://pastebin.com/embed_iframe/AbCd1234',
        url: 'https://pastebin.com/AbCd1234',
      }

      expect(pastebinResolveEmbed(value)).toEqual(expected)
    })

    it('should read the script route onto the same frame', () => {
      const value = 'https://pastebin.com/embed_js/AbCd1234'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'AbCd1234',
        src: 'https://pastebin.com/embed_iframe/AbCd1234',
        url: 'https://pastebin.com/AbCd1234',
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
          src="https://pastebin.com/embed_iframe/AbCd1234"
          style="border:none;width:100%;height:300px;font-size:7px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'AbCd1234',
        src: 'https://pastebin.com/embed_iframe/AbCd1234',
        url: 'https://pastebin.com/AbCd1234',
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

    it('should ignore a foreign host naming the embed route in its path', async () => {
      const value = '<iframe src="https://evil.test/pastebin.com/embed_iframe/AbCd1234"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pastebinScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pastebinScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the frame the script would have written', async () => {
      const value = '<script src="https://pastebin.com/embed_js/AbCd1234"></script>'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'AbCd1234',
        src: 'https://pastebin.com/embed_iframe/AbCd1234',
        url: 'https://pastebin.com/AbCd1234',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build it from the retired query form as well', async () => {
      const value = '<script src="https://pastebin.com/embed_js.php?i=AbCd1234"></script>'
      const expected: EmbedResolverResult = {
        provider: 'pastebin',
        id: 'AbCd1234',
        src: 'https://pastebin.com/embed_iframe/AbCd1234',
        url: 'https://pastebin.com/AbCd1234',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the script route in its path', async () => {
      const value = '<script src="https://evil.test/pastebin.com/embed_js/AbCd1234"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
