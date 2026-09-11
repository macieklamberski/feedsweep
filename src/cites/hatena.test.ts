import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { CiteResolverResult } from '../types.js'
import { hatenaCiteResolver } from './hatena.js'

describeForEachParser('hatenaCiteResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, hatenaCiteResolver)

  describe('happy paths', () => {
    it('should extract all fields from a complete card', async () => {
      const value = html`
        <p>
          <iframe
            src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fspirit%2F"
            title="Page title"
            class="embed-card embed-webcard"
            scrolling="no"
            frameborder="0"
            loading="lazy"
          ></iframe>
          <cite class="hatena-citation">
            <a href="https://example.com/spirit/">example.com</a>
          </cite>
        </p>
      `
      const expected: CiteResolverResult = {
        provider: 'hatena',
        url: 'https://example.com/spirit/',
        title: 'Page title',
        publisher: 'example.com',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should extract a blogcard the same way as a webcard', async () => {
      const value = html`
        <p>
          <iframe
            src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fentry"
            title="Page title"
            class="embed-card embed-blogcard"
          ></iframe>
          <cite class="hatena-citation">
            <a href="https://example.com/entry">example.com</a>
          </cite>
        </p>
      `
      const expected: CiteResolverResult = {
        provider: 'hatena',
        url: 'https://example.com/entry',
        title: 'Page title',
        publisher: 'example.com',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Of 756 corpus feeds framing the card renderer, 72 spell something other than
    // `embed-card`, so the host is what identifies the card rather than the class.
    it('should extract a card whose iframe carries no class', async () => {
      const value = html`
        <p>
          <iframe
            src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fentry"
            title="Page title"
          ></iframe>
          <cite class="hatena-citation">
            <a href="https://example.com/entry">example.com</a>
          </cite>
        </p>
      `
      const expected: CiteResolverResult = {
        provider: 'hatena',
        url: 'https://example.com/entry',
        title: 'Page title',
        publisher: 'example.com',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should extract a card spelling its class hatenablogcard', async () => {
      const value = html`
        <p>
          <iframe
            src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fentry"
            title="Page title"
            class="hatenablogcard"
          ></iframe>
          <cite class="hatena-citation">
            <a href="https://example.com/entry">example.com</a>
          </cite>
        </p>
      `
      const expected: CiteResolverResult = {
        provider: 'hatena',
        url: 'https://example.com/entry',
        title: 'Page title',
        publisher: 'example.com',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A card pasted outside Hatena's own editor stands on its own, with no paragraph and no
    // citation around it.
    it('should extract a card standing outside a paragraph', async () => {
      const value = html`
        <iframe
          src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fentry"
          title="Page title"
          loading="lazy"
        ></iframe>
      `
      const expected: CiteResolverResult = {
        provider: 'hatena',
        url: 'https://example.com/entry',
        title: 'Page title',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should extract a card whose src is protocol-relative', async () => {
      const value = html`
        <p>
          <iframe
            src="//hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fentry"
            title="Page title"
            class="embed-card"
          ></iframe>
          <cite class="hatena-citation">
            <a href="https://example.com/entry">example.com</a>
          </cite>
        </p>
      `
      const expected: CiteResolverResult = {
        provider: 'hatena',
        url: 'https://example.com/entry',
        title: 'Page title',
        publisher: 'example.com',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should decode the url from the iframe when the citation is missing', async () => {
      const value = html`
        <p>
          <iframe
            src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1"
            title="Page title"
            class="embed-card embed-webcard"
          ></iframe>
        </p>
      `
      const expected: CiteResolverResult = {
        provider: 'hatena',
        url: 'https://example.com/a?b=1',
        title: 'Page title',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the citation href over the encoded iframe url', async () => {
      const value = html`
        <p>
          <iframe
            src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fstale"
            title="Page title"
            class="embed-card"
          ></iframe>
          <cite class="hatena-citation">
            <a href="https://example.com/current">example.com</a>
          </cite>
        </p>
      `
      const expected: CiteResolverResult = {
        provider: 'hatena',
        url: 'https://example.com/current',
        title: 'Page title',
        publisher: 'example.com',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined when the iframe has no title', async () => {
      const value = html`
        <p>
          <iframe
            src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fa"
            class="embed-card"
          ></iframe>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined when no url can be recovered', async () => {
      const value = html`
        <p>
          <iframe src="https://hatenablog-parts.com/embed" title="Page title" class="embed-card"></iframe>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined when the iframe src cannot be parsed', async () => {
      const value = html`
        <p>
          <iframe src="http://[" title="Page title" class="embed-card"></iframe>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // Every Hatena blog also serves the card from its own host, and a custom domain does too, so
    // no host list reaches it. The citation beside it names the same host, which is the blog
    // citing its own entry.
    it('should read a card the blog serves from its own host', async () => {
      const value = html`
        <p>
          <iframe
            src="http://nogutyo.hatenablog.com/embed/2013/09/07/004036"
            title="An entry"
            class="embed-card embed-blogcard"
          ></iframe>
          <cite class="hatena-citation">
            <a href="http://nogutyo.hatenablog.com/entry/2013/09/07/004036">nogutyo.hatenablog.com</a>
          </cite>
        </p>
      `
      const expected: CiteResolverResult = {
        provider: 'hatena',
        url: 'http://nogutyo.hatenablog.com/entry/2013/09/07/004036',
        title: 'An entry',
        publisher: 'nogutyo.hatenablog.com',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The citation on its own is not enough: a foreign player beside one names a different host,
    // so the pair is what separates a blog citing itself from a player that happens to sit next
    // to a citation.
    it('should ignore a foreign player beside a citation naming another host', async () => {
      const value = html`
        <p>
          <iframe
            src="https://cdn.other.test/player?url=https%3A%2F%2Fexample.com%2Fvideo"
            title="A video"
            class="embed-card"
          ></iframe>
          <cite class="hatena-citation">
            <a href="http://nogutyo.hatenablog.com/entry/2013/09/07/004036">nogutyo.hatenablog.com</a>
          </cite>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign player carrying the card class', async () => {
      const value = html`
        <p>
          <iframe
            src="https://cdn.other.test/player?url=https%3A%2F%2Fexample.com%2Fvideo"
            title="A video"
            class="embed-card"
          ></iframe>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the card renderer in its path', async () => {
      const value = html`
        <p>
          <iframe
            src="https://evil.test/hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fvideo"
            title="A video"
          ></iframe>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined when the iframe states no src', async () => {
      const value = html`
        <p>
          <iframe
            title="Page title"
            class="embed-card"
          ></iframe>
          <cite class="hatena-citation">
            <a href="https://example.com/entry">example.com</a>
          </cite>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should not match a paragraph without an embed card', async () => {
      const value = html`
        <p>
          <cite class="hatena-citation">
            <a href="https://example.com/a">example.com</a>
          </cite>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The iframe is what the cite replaces, so the paragraph around it keeps whatever else the author
// wrote there, and the citation that follows the card goes with it.
describeForEachParser('hatena cards beside the prose they sit in', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the prose written beside the card', async () => {
    const value = html`
      <p>Read this first: <iframe
          src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fentry"
          title="Page title"
          class="embed-card embed-webcard"
        ></iframe>
        <cite class="hatena-citation">
          <a href="https://example.com/entry">example.com</a>
        </cite>
      </p>
    `
    const expected = html`
      <p>Read this first: </p>
      <div
        data-cite-title="Page title"
        data-cite-url="https://example.com/entry"
        data-cite-publisher="example.com"
        data-cite-provider="hatena"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should drop the citation with the card it follows', async () => {
    const value = html`
      <p>Intro.</p>
      <iframe
        src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fexample.com%2Fentry"
        title="Page title"
      ></iframe>
      <cite class="hatena-citation">
        <a href="https://example.com/entry">example.com</a>
      </cite>
    `
    const expected = html`
      <p>Intro.</p>
      <div
        data-cite-title="Page title"
        data-cite-url="https://example.com/entry"
        data-cite-publisher="example.com"
        data-cite-provider="hatena"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave the citation beside a player it does not claim', async () => {
    const value = html`
      <p>
        <iframe
          src="https://cdn.other.test/player?url=https%3A%2F%2Fexample.com%2Fvideo"
          title="A video"
          class="embed-card"
        ></iframe>
        <cite class="hatena-citation">
          <a href="https://example.com/entry">example.com</a>
        </cite>
      </p>
    `
    const expected = html`
      <div data-embed-src="https://cdn.other.test/player?url=https%3A%2F%2Fexample.com%2Fvideo"></div>
      <p>
        <cite class="hatena-citation"><a href="https://example.com/entry">example.com</a></cite>
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
