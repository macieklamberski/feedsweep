import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { yumpuEmbedResolver } from './yumpu.js'

describeForEachParser('yumpuEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, yumpuEmbedResolver)

  describe('happy paths', () => {
    it('should read the document hash and keep its locale prefix', async () => {
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
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the document page and title from the companion anchor', async () => {
      const value = html`
        <iframe
          width="940px"
          height="812px"
          src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"
          frameborder="0"
          allowfullscreen="true"
          allowtransparency="true"
        ></iframe>
        <a
          href="https://www.yumpu.com/de/document/view/71235096/sukultur-2026"
          title="SUKULTUR 2026"
          target="_blank"
          rel="noopener"
        ></a>
      `
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        url: 'https://www.yumpu.com/de/document/view/71235096/sukultur-2026',
        ratio: '4/3',
        title: 'SUKULTUR 2026',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should give the same document the same id under another locale prefix', async () => {
      const value = '<iframe src="https://www.yumpu.com/fr/embed/view/z4xYaRXnsDqwc2GE"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/fr/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the embed path', async () => {
      const value = '<iframe src="https://evil.test/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host that opens with the platform name', async () => {
      const value =
        '<iframe src="https://www.yumpu.com.evil.test/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a subdomain that serves the player machinery', async () => {
      const value =
        '<iframe src="https://players.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a document page pasted into the carrier', async () => {
      const value =
        '<iframe src="https://www.yumpu.com/de/document/view/71235096/sukultur-2026"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another route under the embed path', async () => {
      const value = '<iframe src="https://www.yumpu.com/de/embed/other/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed hash as written, even if the player answers an error', async () => {
      const value = '<iframe src="https://www.yumpu.com/de/embed/view/z4xY%2F..%2Fevil"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xY%2F..%2Fevil',
        src: 'https://www.yumpu.com/de/embed/view/z4xY%2F..%2Fevil',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a locale prefix carrying a query separator', async () => {
      const value = '<iframe src="https://www.yumpu.com/d&/embed/view/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a locale prefix carrying a separator after the locale', async () => {
      const value =
        '<iframe src="https://www.yumpu.com/de%2F..%2Fx/embed/view/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a locale prefix carrying a separator before the locale', async () => {
      const value =
        '<iframe src="https://www.yumpu.com/x%2Fde/embed/view/z4xYaRXnsDqwc2GE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should ignore the embed route naming no document', async () => {
      const value = '<iframe src="https://www.yumpu.com/de/embed/view/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should mint the English locale onto a locale-less embed path', async () => {
      const value = '<iframe src="https://www.yumpu.com/embed/view/z4xYaRXnsDqwc2GE"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/en/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the bare host onto www', async () => {
      const value = '<iframe src="https://yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a trailing path segment after the hash', async () => {
      const value =
        '<iframe src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE/extra"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the carrier query from the minted url', async () => {
      const value =
        '<iframe src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE?utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the anchor the snippet leaves after the iframe', () => {
    it('should take the title from the anchor text when it carries no title', async () => {
      const value = html`
        <iframe src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>
        <a href="https://www.yumpu.com/de/document/view/71235096/sukultur-2026">SUKULTUR 2026</a>
      `
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        url: 'https://www.yumpu.com/de/document/view/71235096/sukultur-2026',
        ratio: '4/3',
        title: 'SUKULTUR 2026',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an anchor that prose separates from the iframe', async () => {
      const value = html`
        <iframe src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>
        Also read
        <a href="https://www.yumpu.com/en/document/view/999/other-doc">our other catalogue</a>
      `
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an anchor on a foreign host carrying the document path', async () => {
      const value = html`
        <iframe src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>
        <a
          href="https://evil.test/de/document/view/71235096/sukultur-2026"
          title="SUKULTUR 2026"
        ></a>
      `
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an anchor on another YUMPU route', async () => {
      const value = html`
        <iframe src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>
        <a
          href="https://www.yumpu.com/de/user/sukultur"
          title="SUKULTUR"
        ></a>
      `
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an anchor with the document path under a prefix', async () => {
      const value = html`
        <iframe src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>
        <a
          href="https://www.yumpu.com/x/de/document/view/71235096/sukultur-2026"
          title="SUKULTUR 2026"
        ></a>
      `
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an anchor whose document id is not numeric', async () => {
      const value = html`
        <iframe src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>
        <a
          href="https://www.yumpu.com/de/document/view/71235096x/sukultur-2026"
          title="SUKULTUR 2026"
        ></a>
      `
      const expected: EmbedResolverResult = {
        provider: 'yumpu',
        id: 'z4xYaRXnsDqwc2GE',
        src: 'https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('yumpu through the pipeline', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should state the platform size over the box the publisher declared and drop the resizer script', async () => {
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
        data-embed-id="z4xYaRXnsDqwc2GE"
        data-embed-provider="yumpu"
        data-embed-ratio="4/3"
        data-embed-src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should fold the companion anchor into the placeholder and keep a link in prose', async () => {
    const value = html`
      <p>
        See the
        <a href="https://www.yumpu.com/de/document/view/71235096/sukultur-2026">catalogue</a>.
      </p>
      <iframe
        width="940px"
        height="812px"
        src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"
        frameborder="0"
        allowfullscreen="true"
        allowtransparency="true"
      ></iframe>
      <a
        href="https://www.yumpu.com/de/document/view/71235096/sukultur-2026"
        title="SUKULTUR 2026"
        target="_blank"
        rel="noopener"
      ></a>
    `
    const expected = html`
      <p>
        See the
        <a href="https://www.yumpu.com/de/document/view/71235096/sukultur-2026">catalogue</a>.
      </p>
      <div
        data-embed-id="z4xYaRXnsDqwc2GE"
        data-embed-provider="yumpu"
        data-embed-ratio="4/3"
        data-embed-src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"
        data-embed-title="SUKULTUR 2026"
        data-embed-url="https://www.yumpu.com/de/document/view/71235096/sukultur-2026"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should remove a companion anchor that carries text once the title is read', async () => {
    const value = html`
      <p>
        <iframe src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"></iframe>
        <a href="https://www.yumpu.com/de/document/view/71235096/sukultur-2026">SUKULTUR 2026</a>
      </p>
    `
    const expected = html`
      <div
        data-embed-id="z4xYaRXnsDqwc2GE"
        data-embed-provider="yumpu"
        data-embed-src="https://www.yumpu.com/de/embed/view/z4xYaRXnsDqwc2GE"
        data-embed-title="SUKULTUR 2026"
        data-embed-url="https://www.yumpu.com/de/document/view/71235096/sukultur-2026"
        data-embed-ratio="4/3"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
