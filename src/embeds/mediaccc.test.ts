import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { mediacccEmbedResolver, mediacccResolveEmbed } from './mediaccc.js'

describe('mediacccResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player the oEmbed answer writes', () => {
      const value =
        'https://media.ccc.de/v/38c3-going-long-sending-weird-signals-over-long-haul-optical-networks/oembed'
      const expected: EmbedResolverResult = {
        provider: 'mediaccc',
        id: '38c3-going-long-sending-weird-signals-over-long-haul-optical-networks',
        src: 'https://media.ccc.de/v/38c3-going-long-sending-weird-signals-over-long-haul-optical-networks/oembed',
        url: 'https://media.ccc.de/v/38c3-going-long-sending-weird-signals-over-long-haul-optical-networks',
        ratio: '16/9',
      }

      expect(mediacccResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the main host for the app host', () => {
      const value =
        'https://app.media.ccc.de/v/39c3-die-kanguru-rebellion-digital-independence-day/oembed'
      const expected: EmbedResolverResult = {
        provider: 'mediaccc',
        id: '39c3-die-kanguru-rebellion-digital-independence-day',
        src: 'https://media.ccc.de/v/39c3-die-kanguru-rebellion-digital-independence-day/oembed',
        url: 'https://media.ccc.de/v/39c3-die-kanguru-rebellion-digital-independence-day',
        ratio: '16/9',
      }

      expect(mediacccResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the trailing slash', () => {
      const value = 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed/'
      const expected: EmbedResolverResult = {
        provider: 'mediaccc',
        id: 'why2025-23-tic-80-byte-jam',
        src: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed',
        url: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam',
        ratio: '16/9',
      }

      expect(mediacccResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the slug in the case it was written', () => {
      const value =
        'https://media.ccc.de/v/MRMCD2014_-_6034_-__-_grossbaustelle_ber_-_201409051730_-_keynote_-_dodger/oembed'
      const expected: EmbedResolverResult = {
        provider: 'mediaccc',
        id: 'MRMCD2014_-_6034_-__-_grossbaustelle_ber_-_201409051730_-_keynote_-_dodger',
        src: 'https://media.ccc.de/v/MRMCD2014_-_6034_-__-_grossbaustelle_ber_-_201409051730_-_keynote_-_dodger/oembed',
        url: 'https://media.ccc.de/v/MRMCD2014_-_6034_-__-_grossbaustelle_ber_-_201409051730_-_keynote_-_dodger',
        ratio: '16/9',
      }

      expect(mediacccResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position', () => {
      const value = 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed#t=754'
      const expected: EmbedResolverResult = {
        provider: 'mediaccc',
        id: 'why2025-23-tic-80-byte-jam',
        src: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed#t=754',
        url: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam',
        ratio: '16/9',
      }

      expect(mediacccResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the language and subtitle picks beside the start position', () => {
      const value = 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed#t=754&l=deu&s=eng'
      const expected: EmbedResolverResult = {
        provider: 'mediaccc',
        id: 'why2025-23-tic-80-byte-jam',
        src: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed#t=754',
        url: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam',
        ratio: '16/9',
      }

      expect(mediacccResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a query on the player', () => {
      const value = 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed?utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'mediaccc',
        id: 'why2025-23-tic-80-byte-jam',
        src: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed',
        url: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam',
        ratio: '16/9',
      }

      expect(mediacccResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the talk page, which refuses framing', () => {
      const value = 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam'

      expect(mediacccResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://media.ccc.de/x/v/why2025-23-tic-80-byte-jam/oembed'

      expect(mediacccResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed/extra'

      expect(mediacccResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the route words in another case, which the server answers with 404', () => {
      const value = 'https://media.ccc.de/V/why2025-23-tic-80-byte-jam/OEMBED'

      expect(mediacccResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a conference listing', () => {
      const value = 'https://media.ccc.de/c/38c3'

      expect(mediacccResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a recording file', () => {
      const value =
        'https://cdn.media.ccc.de/congress/2024/h264-hd/38c3-276-eng-Going_Long_Sending_weird_signals_over_long_haul_optical_networks.mp4'

      expect(mediacccResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('mediacccEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, mediacccEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the iframe the oEmbed answer writes, without the box it states', async () => {
      const value = html`
        <iframe
          width="70%"
          height="470"
          src="https://media.ccc.de/v/38c3-going-long-sending-weird-signals-over-long-haul-optical-networks/oembed"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'mediaccc',
        id: '38c3-going-long-sending-weird-signals-over-long-haul-optical-networks',
        src: 'https://media.ccc.de/v/38c3-going-long-sending-weird-signals-over-long-haul-optical-networks/oembed',
        url: 'https://media.ccc.de/v/38c3-going-long-sending-weird-signals-over-long-haul-optical-networks',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title and drop the secret of a WordPress auto-embed', async () => {
      const value = html`
        <iframe
          class="wp-embedded-content"
          sandbox="allow-scripts"
          security="restricted"
          title="TIC-80 byte jam"
          src="https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed#?secret=nTvR0u4cAk"
          data-secret="nTvR0u4cAk"
          width="600"
          height="720"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'mediaccc',
        id: 'why2025-23-tic-80-byte-jam',
        src: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam/oembed',
        url: 'https://media.ccc.de/v/why2025-23-tic-80-byte-jam',
        ratio: '16/9',
        title: 'TIC-80 byte jam',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/v/why2025-23-tic-80-byte-jam/oembed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// A podcast feed of media.ccc.de attaches the recording, and only an enclosure test reaches the
// path where claiming a file url would cost a reader the video.
describeForEachParser('mediaccc through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a recording enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://cdn.media.ccc.de/congress/2024/h264-hd/38c3-276-eng-Going_Long.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://cdn.media.ccc.de/congress/2024/h264-hd/38c3-276-eng-Going_Long.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
