import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { anyflipEmbedResolver, anyflipResolveEmbed } from './anyflip.js'

describe('anyflipResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the viewer, the book page and the cover from the user and the book', () => {
      const value = 'https://online.anyflip.com/zruyy/qaan/index.html'
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'zruyy/qaan',
        src: 'https://online.anyflip.com/zruyy/qaan/index.html',
        url: 'https://anyflip.com/zruyy/qaan',
        thumbnail: 'https://online.anyflip.com/zruyy/qaan/files/shot.jpg',
        ratio: '550/350',
      }

      expect(anyflipResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the dialog url from the book folder', () => {
      const value = 'https://online.anyflip.com/vkip/uwqv/'
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'vkip/uwqv',
        src: 'https://online.anyflip.com/vkip/uwqv/index.html',
        url: 'https://anyflip.com/vkip/uwqv',
        thumbnail: 'https://online.anyflip.com/vkip/uwqv/files/shot.jpg',
        ratio: '550/350',
      }

      expect(anyflipResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the dialog url from the mobile viewer it redirects to', () => {
      const value = 'https://online.anyflip.com/krqw/byjr/mobile/index.html'
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'krqw/byjr',
        src: 'https://online.anyflip.com/krqw/byjr/index.html',
        url: 'https://anyflip.com/krqw/byjr',
        thumbnail: 'https://online.anyflip.com/krqw/byjr/files/shot.jpg',
        ratio: '550/350',
      }

      expect(anyflipResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the viewer host from the path-style S3 bucket', () => {
      const value = 'https://s3.amazonaws.com/online.anyflip.com/ffht/adhw/index.html'
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'ffht/adhw',
        src: 'https://online.anyflip.com/ffht/adhw/index.html',
        url: 'https://anyflip.com/ffht/adhw',
        thumbnail: 'https://online.anyflip.com/ffht/adhw/files/shot.jpg',
        ratio: '550/350',
      }

      expect(anyflipResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the page the dialog sends the reader to', () => {
      const value = 'https://online.anyflip.com/zruyy/qaan/index.html#p=5'
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'zruyy/qaan',
        src: 'https://online.anyflip.com/zruyy/qaan/index.html#p=5',
        url: 'https://anyflip.com/zruyy/qaan',
        thumbnail: 'https://online.anyflip.com/zruyy/qaan/files/shot.jpg',
        ratio: '550/350',
      }

      expect(anyflipResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker from the query', () => {
      const value = 'https://online.anyflip.com/zruyy/qaan/index.html?utm_source=x#p=5'
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'zruyy/qaan',
        src: 'https://online.anyflip.com/zruyy/qaan/index.html#p=5',
        url: 'https://anyflip.com/zruyy/qaan',
        thumbnail: 'https://online.anyflip.com/zruyy/qaan/files/shot.jpg',
        ratio: '550/350',
      }

      expect(anyflipResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the https viewer from an http carrier', () => {
      const value = 'http://online.anyflip.com/zruyy/qaan/index.html'
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'zruyy/qaan',
        src: 'https://online.anyflip.com/zruyy/qaan/index.html',
        url: 'https://anyflip.com/zruyy/qaan',
        thumbnail: 'https://online.anyflip.com/zruyy/qaan/files/shot.jpg',
        ratio: '550/350',
      }

      expect(anyflipResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed user and book as written, even if the viewer answers an error', () => {
      const value = 'https://online.anyflip.com/zr%2Fuyy/QAAN/index.html'
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'zr%2Fuyy/QAAN',
        src: 'https://online.anyflip.com/zr%2Fuyy/QAAN/index.html',
        url: 'https://anyflip.com/zr%2Fuyy/QAAN',
        thumbnail: 'https://online.anyflip.com/zr%2Fuyy/QAAN/files/shot.jpg',
        ratio: '550/350',
      }

      expect(anyflipResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a user with no book, which the viewer host refuses', () => {
      const value = 'https://online.anyflip.com/zruyy/'

      expect(anyflipResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the cover under the book', () => {
      const value = 'https://online.anyflip.com/zruyy/qaan/files/shot.jpg'

      expect(anyflipResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another bucket served path-style from S3', () => {
      const value = 'https://s3.amazonaws.com/evil.test/zruyy/qaan/index.html'

      expect(anyflipResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another bucket served from an S3 subdomain', () => {
      const value = 'https://evil.s3.amazonaws.com/zruyy/qaan/index.html'

      expect(anyflipResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the user and book path on a foreign host', () => {
      const value = 'https://evil.test/zruyy/qaan/index.html'

      expect(anyflipResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the book page on the apex host', () => {
      const value = 'https://anyflip.com/zruyy/qaan'

      expect(anyflipResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('anyflipEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, anyflipEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the embed dialog declares', async () => {
      const value = html`
        <iframe
          style="width: 550px; height: 350px;"
          src="https://online.anyflip.com/zruyy/qaan/index.html"
          seamless="seamless"
          scrolling="no"
          frameborder="0"
          allowtransparency="true"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'zruyy/qaan',
        src: 'https://online.anyflip.com/zruyy/qaan/index.html',
        url: 'https://anyflip.com/zruyy/qaan',
        thumbnail: 'https://online.anyflip.com/zruyy/qaan/files/shot.jpg',
        ratio: '550/350',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the book name from the stated title', async () => {
      const value = html`
        <iframe
          allowfullscreen="true"
          frameborder="0"
          height="210"
          scrolling="no"
          src="https://online.anyflip.com/krqw/byjr/mobile/index.html"
          title="Waterway Explorer Magazine 2018"
          width="240"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'anyflip',
        id: 'krqw/byjr',
        src: 'https://online.anyflip.com/krqw/byjr/index.html',
        url: 'https://anyflip.com/krqw/byjr',
        thumbnail: 'https://online.anyflip.com/krqw/byjr/files/shot.jpg',
        ratio: '550/350',
        title: 'Waterway Explorer Magazine 2018',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the user and book path on a foreign host', async () => {
      const value = '<iframe src="https://evil.test/zruyy/qaan/index.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a bookcase, a shelf of books', async () => {
      const value = html`
        <iframe
          allowfullscreen="true"
          src="https://anyflip.com/bookcase/tqmn"
          style="height: 425px; width: 700px;"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('anyflip pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should turn the embed dialog frame into the viewer placeholder', async () => {
    const value = html`
      <iframe
        style="width: 550px; height: 350px;"
        src="https://online.anyflip.com/zruyy/qaan/index.html"
        seamless="seamless"
        scrolling="no"
        frameborder="0"
        allowtransparency="true"
        allowfullscreen="allowfullscreen"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://online.anyflip.com/zruyy/qaan/index.html"
        data-embed-provider="anyflip"
        data-embed-id="zruyy/qaan"
        data-embed-url="https://anyflip.com/zruyy/qaan"
        data-embed-thumbnail="https://online.anyflip.com/zruyy/qaan/files/shot.jpg"
        data-embed-ratio="550/350"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // Only the pipeline shows what the host's enclosures become, since injectEnclosures offers each
  // one to every url-keyed resolver.
  it('should claim a book attached as an enclosure', async () => {
    const enclosures = [
      { url: 'https://online.anyflip.com/zruyy/qaan/index.html', type: 'text/html' },
    ]
    const expected = html`
      <div
        data-embed-src="https://online.anyflip.com/zruyy/qaan/index.html"
        data-embed-provider="anyflip"
        data-embed-id="zruyy/qaan"
        data-embed-url="https://anyflip.com/zruyy/qaan"
        data-embed-thumbnail="https://online.anyflip.com/zruyy/qaan/files/shot.jpg"
        data-enclosure=""
        data-embed-ratio="550/350"
      ></div>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  it('should leave a page image under the book an image', async () => {
    const enclosures = [
      { url: 'https://online.anyflip.com/zruyy/qaan/files/mobile/1.jpg', type: 'image/jpeg' },
    ]
    const expected = html`
      <img
        src="https://online.anyflip.com/zruyy/qaan/files/mobile/1.jpg"
        data-enclosure=""
      />
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
