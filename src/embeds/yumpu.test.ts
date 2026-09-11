import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { yumpuEmbedResolver } from './yumpu.js'

describeForEachParser('yumpuEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, yumpuEmbedResolver)

  describe('happy paths', () => {
    it('should read the document hash out of the embed url', async () => {
      const value = html`
        <iframe
          src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"
          allowfullscreen="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should give the same document the same id under another locale prefix', async () => {
      const value = '<iframe src="https://www.yumpu.com/en/embed/view/z4xYaRXnsDqwc2GE"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/en/embed/view/z4xYaRXnsDqwc2GE',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the embed path', async () => {
      const value =
        '<iframe src="https://evil.test/yumpu.com/en/embed/view/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host that opens with the platform name', async () => {
      const value =
        '<iframe src="https://www.yumpu.com.evil.test/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a document page pasted into the carrier', async () => {
      const value =
        '<iframe src="https://www.yumpu.com/de/document/view/71235096/sukultur-2026"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should ignore the embed route naming no document', async () => {
      const value = '<iframe src="https://www.yumpu.com/de/embed/view/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a locale-less embed path, a spelling the corpus does not carry', async () => {
      const value = '<iframe src="https://www.yumpu.com/embed/view/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('yumpu markup the pipeline settles on its own', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the box the publisher declared and drop the resizer script', async () => {
    const value = html`
      <iframe
        width="940px"
        height="812px"
        src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"
        frameborder="0"
        allowfullscreen="true"
      ></iframe>
      <script src="https://players.yumpu.com/modules/embed/yp_r_iframe.js"></script>
    `
    const expected = html`
      <div
        data-embed-height="812"
        data-embed-width="940"
        data-embed-id="z4xYaRXnsDqwc2GE"
        data-embed-provider="yumpu"
        data-embed-src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a document page link in prose as a link', async () => {
    const value = html`
      <p>
        See the
        <a href="https://www.yumpu.com/de/document/view/71235096/sukultur-2026">catalogue</a>.
      </p>
    `

    expect(await convert(value)).toEqualHtml(value)
  })
})
