import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { washingtonpostEmbedResolver, washingtonpostResolveEmbed } from './washingtonpost.js'

describe('washingtonpostResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the embed route', () => {
      const value =
        'https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b'
      const expected: EmbedResolverResult = {
        provider: 'washingtonpost',
        id: '6c688908-1e4f-4130-b5ca-e371afc1c78b',
        src: 'https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b',
        ratio: '16/9',
      }

      expect(washingtonpostResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild an inline player whose id is a uuid onto the embed route', () => {
      const value =
        'http://www.washingtonpost.com/opinions/dana-milbank-political-sketch-an-oasis-at-the-dnc/2012/09/05/609cbc68-f753-11e1-8253-3f495ae70650_inline.html'
      const expected: EmbedResolverResult = {
        provider: 'washingtonpost',
        id: '609cbc68-f753-11e1-8253-3f495ae70650',
        src: 'https://www.washingtonpost.com/video/c/embed/609cbc68-f753-11e1-8253-3f495ae70650',
        ratio: '16/9',
      }

      expect(washingtonpostResolveEmbed(value)).toEqual(expected)
    })

    it('should read the embed route with a trailing slash', () => {
      const value =
        'https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b/'
      const expected: EmbedResolverResult = {
        provider: 'washingtonpost',
        id: '6c688908-1e4f-4130-b5ca-e371afc1c78b',
        src: 'https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b',
        ratio: '16/9',
      }

      expect(washingtonpostResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an id through as written', () => {
      const value =
        'https://www.washingtonpost.com/video/c/embed/6C688908-1E4F-4130-B5CA-E371AFC1C78B'
      const expected: EmbedResolverResult = {
        provider: 'washingtonpost',
        id: '6C688908-1E4F-4130-B5CA-E371AFC1C78B',
        src: 'https://www.washingtonpost.com/video/c/embed/6C688908-1E4F-4130-B5CA-E371AFC1C78B',
        ratio: '16/9',
      }

      expect(washingtonpostResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the query', () => {
      const value =
        'https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b?autoplay=true&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'washingtonpost',
        id: '6c688908-1e4f-4130-b5ca-e371afc1c78b',
        src: 'https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b',
        ratio: '16/9',
      }

      expect(washingtonpostResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b'

      expect(washingtonpostResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the embed route below another segment', () => {
      const value =
        'https://www.washingtonpost.com/x/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b'

      expect(washingtonpostResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the video', () => {
      const value =
        'https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b/extra'

      expect(washingtonpostResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route in capitals, which the server answers 404', () => {
      const value =
        'https://www.washingtonpost.com/VIDEO/C/EMBED/6c688908-1e4f-4130-b5ca-e371afc1c78b'

      expect(washingtonpostResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for an inline player whose id is not a uuid', () => {
      const value =
        'http://www.washingtonpost.com/national/raw-video-storms-rip-through-east-coast/2012/06/30/gJQA0E1tEW_inline.html'

      expect(washingtonpostResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the inline player', () => {
      const value =
        'http://www.washingtonpost.com/opinions/dana-milbank-political-sketch-an-oasis-at-the-dnc/2012/09/05/609cbc68-f753-11e1-8253-3f495ae70650_inline.html/extra'

      expect(washingtonpostResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the video page, which refuses framing', () => {
      const value =
        'https://www.washingtonpost.com/video/politics/we-have-reached-a-deal-trump-says-shutdown-will-end/2019/01/25/6c688908-1e4f-4130-b5ca-e371afc1c78b_video.html'

      expect(washingtonpostResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the Flash campaign ad player', () => {
      const value =
        'http://www.washingtonpost.com/wp-srv/special/politics/track-presidential-campaign-ads-2012/video-embed/?flvURL=%2Fmedia%2Fcmag%2Fpresrestoreourfuture-saved.m4v&width=480&height=270'

      expect(washingtonpostResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('washingtonpostEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, washingtonpostEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform ratio over the box the frame declares', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="290"
          mozallowfullscreen=""
          scrolling="no"
          src="https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b"
          webkitallowfullscreen=""
          width="480"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'washingtonpost',
        id: '6c688908-1e4f-4130-b5ca-e371afc1c78b',
        src: 'https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('washingtonpost through the pipeline', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the embed frame into a placeholder', async () => {
    const value = html`
      <iframe
        frameborder="0"
        height="290"
        scrolling="no"
        src="https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b"
        width="480"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="6c688908-1e4f-4130-b5ca-e371afc1c78b"
        data-embed-provider="washingtonpost"
        data-embed-src="https://www.washingtonpost.com/video/c/embed/6c688908-1e4f-4130-b5ca-e371afc1c78b"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should rebuild the dead inline player into a placeholder', async () => {
    const value = html`
      <iframe
        frameborder="0"
        height="255"
        scrolling="no"
        src="http://www.washingtonpost.com/opinions/dana-milbank-political-sketch-an-oasis-at-the-dnc/2012/09/05/609cbc68-f753-11e1-8253-3f495ae70650_inline.html"
        width="454"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="609cbc68-f753-11e1-8253-3f495ae70650"
        data-embed-provider="washingtonpost"
        data-embed-src="https://www.washingtonpost.com/video/c/embed/609cbc68-f753-11e1-8253-3f495ae70650"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
