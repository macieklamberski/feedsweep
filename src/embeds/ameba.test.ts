import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  amebaImagePageEmbedResolver,
  amebaMoviePlayerEmbedResolver,
  amebaReblogCardEmbedResolver,
  amebaResolveEmbed,
} from './ameba.js'

describe('amebaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the player url', () => {
      const value = 'https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5'
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'MCLP3ViBJRfW3clSWW5saxnjA5',
        src: 'https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5',
      }

      expect(amebaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a player naming no video', () => {
      const value = 'https://static.blog-video.jp/'

      expect(amebaResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed video id as written, even if the player answers an error', () => {
      const value = 'https://static.blog-video.jp/?v=MCLP3ViB%26autoplay%3D1'
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'MCLP3ViB&autoplay=1',
        src: 'https://static.blog-video.jp/?v=MCLP3ViB%26autoplay%3D1',
      }

      expect(amebaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should mint https for a carrier on http', () => {
      const value = 'http://static.blog-video.jp/?v=t4RyJ77EsGURDnTBfbpkBe1P'
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 't4RyJ77EsGURDnTBfbpkBe1P',
        src: 'https://static.blog-video.jp/?v=t4RyJ77EsGURDnTBfbpkBe1P',
      }

      expect(amebaResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker from the carrier query', () => {
      const value = 'https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'MCLP3ViBJRfW3clSWW5saxnjA5',
        src: 'https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5',
      }

      expect(amebaResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('amebaMoviePlayerEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, amebaMoviePlayerEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5"
          width="276"
          height="276"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'MCLP3ViBJRfW3clSWW5saxnjA5',
        src: 'https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5',
        width: 276,
        height: 276,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same query', async () => {
      const value = '<iframe src="https://evil.test/?v=MCLP3ViB"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('amebaReblogCardEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, amebaReblogCardEmbedResolver)

  describe('happy paths', () => {
    it('should compose the reblogged post from the pair the card states', async () => {
      const value = html`
        <iframe
          class="reblogCard"
          src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html?reblogAmebaId=clay-harb"
          width="100%"
          height="234px"
          data-ameba-id="ncbar"
          data-entry-id="12423195042"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'ncbar/entry-12423195042',
        src: 'https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html',
        url: 'https://ameblo.jp/ncbar/entry-12423195042.html',
        height: 234,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the pair off the card path when the carrier states no attributes', async () => {
      const value = html`
        <iframe
          class="reblogCard"
          src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'ncbar/entry-12423195042',
        src: 'https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html',
        url: 'https://ameblo.jp/ncbar/entry-12423195042.html',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a blog id carrying a digit', async () => {
      const value = html`
        <iframe
          class="reblogCard"
          height="234px"
          width="100%"
          scrolling="no"
          frameborder="0"
          sandbox="allow-same-origin allow-scripts allow-top-navigation"
          src="https://ameblo.jp/s/embed/reblog-card/tony-9/entry-12854455300.html?reblogAmebaId=do5raelian"
          data-ameba-id="tony-9"
          data-entry-id="12854455300"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'tony-9/entry-12854455300',
        src: 'https://ameblo.jp/s/embed/reblog-card/tony-9/entry-12854455300.html',
        url: 'https://ameblo.jp/tony-9/entry-12854455300.html',
        height: 234,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host serving the card path', async () => {
      const value = html`
        <iframe src="https://evil.test/s/embed/reblog-card/ncbar/entry-12423195042.html"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the card path below another route', async () => {
      const value = html`
        <iframe src="https://ameblo.jp/ncbar/s/embed/reblog-card/ncbar/entry-12423195042.html"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a card path running past the page', async () => {
      const value = html`
        <iframe src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html/amp"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a card naming no entry id in either source', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-latest.html"
          data-ameba-id="ncbar"
          data-entry-id="latest"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a stated blog id carrying a path separator', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-latest.html"
          data-ameba-id="../hijacked"
          data-entry-id="12423195042"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a stated blog id trailed by a path separator', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-latest.html"
          data-ameba-id="ncbar/hijacked"
          data-entry-id="12423195042"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a stated blog id carrying an uppercase letter', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/s/embed/reblog-card/tony-9/entry-latest.html"
          data-ameba-id="TONY-9"
          data-entry-id="12854455300"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a stated blog id carrying an underscore', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/s/embed/reblog-card/tony-9/entry-latest.html"
          data-ameba-id="tony_9"
          data-entry-id="12854455300"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a stated entry id carrying a path separator', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-latest.html"
          data-ameba-id="ncbar"
          data-entry-id="12423195042/../1"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should prefer the stated pair over the card path when both are valid', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html"
          data-ameba-id="sd-milk"
          data-entry-id="12806733695"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'sd-milk/entry-12806733695',
        src: 'https://ameblo.jp/s/embed/reblog-card/sd-milk/entry-12806733695.html',
        url: 'https://ameblo.jp/sd-milk/entry-12806733695.html',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the card path when the stated pair is malformed', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html"
          data-ameba-id="../hijacked"
          data-entry-id="12423195042"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'ncbar/entry-12423195042',
        src: 'https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html',
        url: 'https://ameblo.jp/ncbar/entry-12423195042.html',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the stated pair when the card path names no numeric entry', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/s/embed/reblog-card/ncbar/entry-latest.html"
          data-ameba-id="ncbar"
          data-entry-id="12423195042"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'ncbar/entry-12423195042',
        src: 'https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html',
        url: 'https://ameblo.jp/ncbar/entry-12423195042.html',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the light preview flag from the card query', async () => {
      const value = html`
        <iframe
          class="reblogCard"
          data-ameba-id="laguna-tsuru"
          data-entry-id="12446025182"
          frameborder="0"
          height="234px"
          sandbox="allow-same-origin allow-scripts allow-top-navigation"
          scrolling="no"
          src="https://ameblo.jp/s/embed/reblog-card/laguna-tsuru/entry-12446025182.html?reblogAmebaId=laguna-tsuru&amp;isLightPreview=true"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'laguna-tsuru/entry-12446025182',
        src: 'https://ameblo.jp/s/embed/reblog-card/laguna-tsuru/entry-12446025182.html',
        url: 'https://ameblo.jp/laguna-tsuru/entry-12446025182.html',
        height: 234,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the Ameba routes that are not a reblog card', () => {
    it('should leave the in-article image page alone', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/p/embed/sd-milk/image-12806733695-15295885078.html"
          title="☆塩崎太智 の記事内画像 | M!LKオフィシャルブログ Powered by Ameba"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the ml.ameblo.jp embed alone', async () => {
      const value = html`
        <iframe
          class="ogpCard_root"
          src="https://ml.ameblo.jp/embed/"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('amebaImagePageEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, amebaImagePageEmbedResolver)

  describe('happy paths', () => {
    it('should compose the image page from the carrier path', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/p/embed/sd-milk/image-12806733695-15295885078.html"
          title="☆塩崎太智 の記事内画像 | M!LKオフィシャルブログ Powered by Ameba"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'sd-milk/image-12806733695-15295885078',
        src: 'https://ameblo.jp/p/embed/sd-milk/image-12806733695-15295885078.html',
        url: 'https://ameblo.jp/sd-milk/image-12806733695-15295885078.html',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a blog id carrying a digit', async () => {
      const value = html`
        <iframe src="https://ameblo.jp/p/embed/tony-9/image-12854455300-15446105444.html"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'tony-9/image-12854455300-15446105444',
        src: 'https://ameblo.jp/p/embed/tony-9/image-12854455300-15446105444.html',
        url: 'https://ameblo.jp/tony-9/image-12854455300-15446105444.html',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host serving the image page path', async () => {
      const value = '<iframe src="https://evil.test/p/embed/sd-milk/image-1-2.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed blog id as written, even if the player answers an error', async () => {
      const value = html`
        <iframe src="https://ameblo.jp/p/embed/sd%2Fmilk/image-1-2.html"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'sd%2Fmilk/image-1-2',
        src: 'https://ameblo.jp/p/embed/sd%2Fmilk/image-1-2.html',
        url: 'https://ameblo.jp/sd%2Fmilk/image-1-2.html',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a blog id carrying a path separator', async () => {
      const value = html`
        <iframe src="https://ameblo.jp/p/embed/sd/milk/image-12806733695-15295885078.html"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the image page path below another route', async () => {
      const value = html`
        <iframe src="https://ameblo.jp/sd-milk/p/embed/sd-milk/image-12806733695-15295885078.html"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an image page path running past the page', async () => {
      const value = html`
        <iframe src="https://ameblo.jp/p/embed/sd-milk/image-12806733695-15295885078.html/amp"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed image name as written, even if the player answers an error', async () => {
      const value = html`
        <iframe src="https://ameblo.jp/p/embed/sd-milk/image-latest-cover.html"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'sd-milk/image-latest-cover',
        src: 'https://ameblo.jp/p/embed/sd-milk/image-latest-cover.html',
        url: 'https://ameblo.jp/sd-milk/image-latest-cover.html',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an embed route that names no image', async () => {
      const value = html`
        <iframe src="https://ameblo.jp/p/embed/sd-milk/entry-12806733695.html"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should drop a tracker from the carrier query', async () => {
      const value = html`
        <iframe
          src="https://ameblo.jp/p/embed/sd-milk/image-12806733695-15295885078.html?utm_source=feed"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'sd-milk/image-12806733695-15295885078',
        src: 'https://ameblo.jp/p/embed/sd-milk/image-12806733695-15295885078.html',
        url: 'https://ameblo.jp/sd-milk/image-12806733695-15295885078.html',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('ameba through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a video file on the player host playable', async () => {
    const enclosures = [
      {
        url: 'https://static.blog-video.jp/output/seiichiro-shimono/MCLP3ViBJRfW3clSWW5saxnjA5/hq/MCLP3ViBJRfW3clSWW5saxnjA5.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://static.blog-video.jp/output/seiichiro-shimono/MCLP3ViBJRfW3clSWW5saxnjA5/hq/MCLP3ViBJRfW3clSWW5saxnjA5.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
