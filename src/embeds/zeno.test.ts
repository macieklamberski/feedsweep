import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { zenoEmbedResolver, zenoResolveEmbed } from './zeno.js'

describe('zenoResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the station widget and page', () => {
      const value = 'https://zeno.fm/player/halshack'
      const expected: EmbedResolverResult = {
        provider: 'zeno',
        id: 'halshack',
        src: 'https://zeno.fm/player/halshack',
        url: 'https://zeno.fm/radio/halshack/',
        height: 250,
      }

      expect(zenoResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the www host onto the one the widget dialog writes', () => {
      const value = 'https://www.zeno.fm/player/radio-panamericana-bolivia'
      const expected: EmbedResolverResult = {
        provider: 'zeno',
        id: 'radio-panamericana-bolivia',
        src: 'https://zeno.fm/player/radio-panamericana-bolivia',
        url: 'https://zeno.fm/radio/radio-panamericana-bolivia/',
        height: 250,
      }

      expect(zenoResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the slug on as written, case included', () => {
      const value = 'https://www.zeno.fm/player/StraightTalkRadio'
      const expected: EmbedResolverResult = {
        provider: 'zeno',
        id: 'StraightTalkRadio',
        src: 'https://zeno.fm/player/StraightTalkRadio',
        url: 'https://zeno.fm/radio/StraightTalkRadio/',
        height: 250,
      }

      expect(zenoResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a segment after the slug, which the widget ignores', () => {
      const value = 'https://zeno.fm/player/halshack/extra'
      const expected: EmbedResolverResult = {
        provider: 'zeno',
        id: 'halshack',
        src: 'https://zeno.fm/player/halshack',
        url: 'https://zeno.fm/radio/halshack/',
        height: 250,
      }

      expect(zenoResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/player/halshack'

      expect(zenoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the station page', () => {
      const value = 'https://zeno.fm/radio/halshack/'

      expect(zenoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route with no slug', () => {
      const value = 'https://zeno.fm/player/'

      expect(zenoResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('zenoEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, zenoEmbedResolver)

  describe('happy paths', () => {
    it('should state the default widget height over the box the snippet declares', async () => {
      const value = html`
        <iframe
          src="https://zeno.fm/player/247-edm-radio"
          width="575"
          height="250"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'zeno',
        id: '247-edm-radio',
        src: 'https://zeno.fm/player/247-edm-radio',
        url: 'https://zeno.fm/radio/247-edm-radio/',
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the default widget height over a larger preset', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="600"
          scrolling="no"
          src="https://zeno.fm/player/radio-mercury-remembered"
          width="768"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'zeno',
        id: 'radio-mercury-remembered',
        src: 'https://zeno.fm/player/radio-mercury-remembered',
        url: 'https://zeno.fm/radio/radio-mercury-remembered/',
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title the publisher states', async () => {
      const value = html`
        <iframe
          src="https://zeno.fm/player/halshack"
          title="Halshack Indie Rockcast"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'zeno',
        id: 'halshack',
        src: 'https://zeno.fm/player/halshack',
        url: 'https://zeno.fm/radio/halshack/',
        height: 250,
        title: 'Halshack Indie Rockcast',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/player/halshack"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The older snippet writes a protocol-relative url, which only the pipeline makes absolute, and
// the station's stream on `stream.zeno.fm` reaches the resolver as an enclosure.
describeForEachParser('zeno through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim the protocol-relative widget the older snippet writes', async () => {
    const value = html`
      <iframe
        frameborder="0"
        height="240"
        scrolling="no"
        src="//www.zeno.fm/player/radio-panamericana-bolivia"
        width="768"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="250"
        data-embed-url="https://zeno.fm/radio/radio-panamericana-bolivia/"
        data-embed-id="radio-panamericana-bolivia"
        data-embed-provider="zeno"
        data-embed-src="https://zeno.fm/player/radio-panamericana-bolivia"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a station stream enclosure playable', async () => {
    const enclosures = [{ url: 'https://stream.zeno.fm/qta420v62d0uv', type: 'audio/mpeg' }]
    const expected = html`
      <audio data-enclosure="" controls src="https://stream.zeno.fm/qta420v62d0uv"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
