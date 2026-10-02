import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  lglformsIframeEmbedResolver,
  lglformsResolveEmbed,
  lglformsScriptEmbedResolver,
} from './lglforms.js'

describe('lglformsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the form from the form page', () => {
      const value = 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A'
      const expected: EmbedResolverResult = {
        provider: 'lglforms',
        id: 'F55Z_RZ2NPkjQX0XoghR5A',
        src: 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A',
        url: 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A',
        height: 600,
      }

      expect(lglformsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the host page address the loader passes in the query', () => {
      const value =
        'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A?origin=https%3A%2F%2Fexample.com%2Fpost'
      const expected: EmbedResolverResult = {
        provider: 'lglforms',
        id: 'F55Z_RZ2NPkjQX0XoghR5A',
        src: 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A',
        url: 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A',
        height: 600,
      }

      expect(lglformsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A'

      expect(lglformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a form path below another segment', () => {
      const value = 'https://secure.lglforms.com/x/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A'

      expect(lglformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route below the form', () => {
      const value = 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A/extra'

      expect(lglformsResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('lglformsScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, lglformsScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the form from the loader script', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'lglforms',
        id: 'F55Z_RZ2NPkjQX0XoghR5A',
        src: 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A',
        url: 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass a key holding an underscore and a dash through as written', async () => {
      const value = html`
        <script
          src="https://secure.lglforms.com/form_engine/s/_-sfOGcRLLnCbi71zCVkIA.js"
          type="text/javascript"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'lglforms',
        id: '_-sfOGcRLLnCbi71zCVkIA',
        src: 'https://secure.lglforms.com/form_engine/s/_-sfOGcRLLnCbi71zCVkIA',
        url: 'https://secure.lglforms.com/form_engine/s/_-sfOGcRLLnCbi71zCVkIA',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <script
          src="https://evil.test/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A.js?lglforms.com/form_engine/s/"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader path below another segment', async () => {
      const value = html`
        <script
          src="https://secure.lglforms.com/form_engine/s/x/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A.js"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader path with a trailing segment', async () => {
      const value = html`
        <script
          src="https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A.js/extra"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('lglformsIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, lglformsIframeEmbedResolver)

  it('should build the form from the frame the loader writes', async () => {
    const value = html`
      <iframe
        id="frame-F55Z_RZ2NPkjQX0XoghR5A"
        height="1197"
        src="https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A?origin=https%3A%2F%2Fexample.com%2Fpost"
        frameborder="0"
        scrolling="no"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'lglforms',
      id: 'F55Z_RZ2NPkjQX0XoghR5A',
      src: 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A',
      url: 'https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A',
      height: 600,
    }

    expect(await extract(value)).toEqual(expected)
  })
})

describeForEachParser('lglforms through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should turn the loader script into a form placeholder', async () => {
    const value = html`
      <script
        type="text/javascript"
        src="https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A.js"
      ></script>
    `
    const expected = html`
      <div
        data-embed-height="600"
        data-embed-url="https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A"
        data-embed-id="F55Z_RZ2NPkjQX0XoghR5A"
        data-embed-provider="lglforms"
        data-embed-src="https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn the frame the loader writes into a form placeholder', async () => {
    const value = html`
      <iframe
        id="frame-F55Z_RZ2NPkjQX0XoghR5A"
        height="1197"
        src="https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A?origin=https%3A%2F%2Fexample.com%2Fpost"
        frameborder="0"
        scrolling="no"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="600"
        data-embed-url="https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A"
        data-embed-id="F55Z_RZ2NPkjQX0XoghR5A"
        data-embed-provider="lglforms"
        data-embed-src="https://secure.lglforms.com/form_engine/s/F55Z_RZ2NPkjQX0XoghR5A"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
