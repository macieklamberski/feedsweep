import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { amebaEmbedResolver, amebaReblogCardEmbedResolver, amebaResolveEmbed } from './ameba.js'

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

    it('should ignore a video id outside its alphabet', () => {
      const value = 'https://static.blog-video.jp/?v=../output'

      expect(amebaResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('amebaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, amebaEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5"
          width="640"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ameba',
        id: 'MCLP3ViBJRfW3clSWW5saxnjA5',
        src: 'https://static.blog-video.jp/?v=MCLP3ViBJRfW3clSWW5saxnjA5',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the player host in its path', async () => {
      const value = '<iframe src="https://evil.test/static.blog-video.jp/?v=MCLP3ViB"></iframe>'

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
        src: 'https://ameblo.jp/s/embed/reblog-card/ncbar/entry-12423195042.html?reblogAmebaId=clay-harb',
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
  })

  describe('sad paths', () => {
    it('should ignore a foreign host serving the card path', async () => {
      const value = html`
        <iframe src="https://evil.test/s/embed/reblog-card/ncbar/entry-12423195042.html"></iframe>
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
  })

  describe('edge cases', () => {
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
        src: 'https://ameblo.jp/s/embed/reblog-card/ncbar/entry-latest.html',
        url: 'https://ameblo.jp/ncbar/entry-12423195042.html',
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
