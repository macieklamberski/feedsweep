import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { videaEmbedResolver, videaResolveEmbed } from './videa.js'

describe('videaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player the oEmbed answer writes', () => {
      const value = 'https://videa.hu/player?v=SHLXcKsORfejnD1a'
      const expected: EmbedResolverResult = {
        provider: 'videa',
        id: 'shlxcksorfejnd1a',
        src: 'https://videa.hu/player?v=SHLXcKsORfejnD1a',
        ratio: '16/9',
      }

      expect(videaResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the current player for the retired Flash player', () => {
      const value = 'http://videa.hu/flvplayer.swf?v=C6rvO1ZfIkfLILrI'
      const expected: EmbedResolverResult = {
        provider: 'videa',
        id: 'c6rvo1zfikflilri',
        src: 'https://videa.hu/player?v=C6rvO1ZfIkfLILrI',
        ratio: '16/9',
      }

      expect(videaResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the apex for the www host', () => {
      const value = 'https://www.videa.hu/player?v=RJiqVlMkla4Ckqf3'
      const expected: EmbedResolverResult = {
        provider: 'videa',
        id: 'rjiqvlmkla4ckqf3',
        src: 'https://videa.hu/player?v=RJiqVlMkla4Ckqf3',
        ratio: '16/9',
      }

      expect(videaResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position and drop a tracker and the autoplay', () => {
      const value =
        'https://videa.hu/player?v=RJiqVlMkla4Ckqf3&start=120&autoplay=1&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'videa',
        id: 'rjiqvlmkla4ckqf3',
        src: 'https://videa.hu/player?v=RJiqVlMkla4Ckqf3&start=120',
        ratio: '16/9',
      }

      expect(videaResolveEmbed(value)).toEqual(expected)
    })

    it('should use the id as written in the player and fold its case in the key', () => {
      const value = 'https://videa.hu/player?v=rjiqvlmkla4ckqf3'
      const expected: EmbedResolverResult = {
        provider: 'videa',
        id: 'rjiqvlmkla4ckqf3',
        src: 'https://videa.hu/player?v=rjiqvlmkla4ckqf3',
        ratio: '16/9',
      }

      expect(videaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the player with no video', () => {
      const value = 'https://videa.hu/player?start=120'

      expect(videaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route in another case, which the server answers with 404', () => {
      const value = 'https://videa.hu/PLAYER?v=RJiqVlMkla4Ckqf3'

      expect(videaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://videa.hu/x/player?v=RJiqVlMkla4Ckqf3'

      expect(videaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing slash, which the server answers with 404', () => {
      const value = 'https://videa.hu/player/?v=RJiqVlMkla4Ckqf3'

      expect(videaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the watch page', () => {
      const value =
        'https://videa.hu/videok/vilaggazdasag/az-emberiseg-meg-fel-sem-RJiqVlMkla4Ckqf3'

      expect(videaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video file', () => {
      const value =
        'https://video5.videa.hu/static/w480p/8.3805899.2579076.1.0.385.385?md5=9o58npU0Q'

      expect(videaResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('videaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, videaEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the iframe, without the box it states', async () => {
      const value = html`
        <iframe
          width="666"
          height="375"
          src="http://videa.hu/player?v=cIfy8E3IH3INf2Nx"
          allowfullscreen="allowfullscreen"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'videa',
        id: 'cify8e3ih3inf2nx',
        src: 'https://videa.hu/player?v=cIfy8E3IH3INf2Nx',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the Flash object that names the player in data', async () => {
      const value = html`
        <object
          width="600"
          height="400"
          data="http://videa.hu/flvplayer.swf?v=ra62eMa3CTjrjmYm"
          type="application/x-shockwave-flash"
        ></object>
      `
      const expected: EmbedResolverResult = {
        provider: 'videa',
        id: 'ra62ema3ctjrjmym',
        src: 'https://videa.hu/player?v=ra62eMa3CTjrjmYm',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/player?v=RJiqVlMkla4Ckqf3"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('videa through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should turn the Flash object and embed pair into one placeholder', async () => {
    const value = html`
      <object height="366" width="448">
        <param value="http://videa.hu/flvplayer.swf?v=C6rvO1ZfIkfLILrI">
        <embed type="application/x-shockwave-flash" height="366" width="448" src="http://videa.hu/flvplayer.swf?v=C6rvO1ZfIkfLILrI">
      </object>
    `
    const expected = html`
      <div
        data-embed-id="c6rvo1zfikflilri"
        data-embed-provider="videa"
        data-embed-src="https://videa.hu/player?v=C6rvO1ZfIkfLILrI"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should read the iframe written without a scheme', async () => {
    const value = html`
      <iframe
        width="640"
        height="480"
        src="//videa.hu/player?v=qgjdl0tABo6homHV"
        allowfullscreen="allowfullscreen"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-id="qgjdl0tabo6homhv"
        data-embed-provider="videa"
        data-embed-src="https://videa.hu/player?v=qgjdl0tABo6homHV"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a video enclosure on a videa host playable', async () => {
    const enclosures = [
      {
        url: 'https://video5.videa.hu/static/w480p/8.3805899.2579076.1.0.385.385.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://video5.videa.hu/static/w480p/8.3805899.2579076.1.0.385.385.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
