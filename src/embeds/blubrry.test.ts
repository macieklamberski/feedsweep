import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { CleanUrlFn, EmbedResolverResult } from '../types.js'
import {
  type BlubrryPlayer,
  blubrryEmbedResolver,
  blubrryPowerpressEmbedResolver,
  blubrryResolveEmbed,
  extractBlubrryEmbed,
} from './blubrry.js'

describe('extractBlubrryEmbed', () => {
  it('should read an episode id', () => {
    const value = 'https://player.blubrry.com/id/12345678/'
    const expected: BlubrryPlayer = { kind: 'episode', id: '12345678' }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should read a media url', () => {
    const value =
      'https://player.blubrry.com/?media_url=https%3A%2F%2Fmedia.blubrry.com%2Fshow%2Fep.mp3'
    const expected: BlubrryPlayer = { kind: 'media', id: 'https://media.blubrry.com/show/ep.mp3' }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should read an episode id that is not digits by its route', () => {
    const value = 'https://player.blubrry.com/id/abc123x/'
    const expected: BlubrryPlayer = { kind: 'episode', id: 'abc123x' }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a blubrry url naming nothing', () => {
    const value = 'https://blubrry.com/pricing'

    expect(extractBlubrryEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(extractBlubrryEmbed(value)).toBeUndefined()
  })
})

describe('blubrryResolveEmbed', () => {
  it('should state the player height for an episode id', () => {
    const value = 'https://player.blubrry.com/id/12345678/'
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: '12345678',
      src: 'https://player.blubrry.com/id/12345678/',
      height: 164,
    }

    expect(blubrryResolveEmbed(value)).toEqual(expected)
  })

  // The raw file stays inside the player url: form fidelity keeps a provider's player an embed.
  it('should keep a media url as a player rather than a native audio element', () => {
    const value =
      'https://player.blubrry.com/?media_url=https%3A%2F%2Fmedia.blubrry.com%2Fshow%2Fep.mp3'
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: 'https://media.blubrry.com/show/ep.mp3',
      src: 'https://player.blubrry.com/?media_url=https%3A%2F%2Fmedia.blubrry.com%2Fshow%2Fep.mp3',
      height: 164,
    }

    expect(blubrryResolveEmbed(value)).toEqual(expected)
  })

  it('should use an episode id that is not digits as written, even if the player answers an error', () => {
    const value = 'https://player.blubrry.com/id/abc123x/'
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: 'abc123x',
      src: 'https://player.blubrry.com/id/abc123x/',
      height: 164,
    }

    expect(blubrryResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a blubrry url naming no episode', () => {
    const value = 'https://blubrry.com/about'

    expect(blubrryResolveEmbed(value)).toBeUndefined()
  })
})

describeForEachParser('blubrryEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, blubrryEmbedResolver)

  describe('happy paths', () => {
    it('should claim a player iframe and state the measured height', async () => {
      const value = html`
        <iframe
          src="https://player.blubrry.com/id/153989314/"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: '153989314',
        src: 'https://player.blubrry.com/id/153989314/',
        height: 164,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // `blubrry.com` admits every subdomain, including the two media hosts, so the gate has to
    // refuse a lookalike suffixing the whole domain. The path here is a real player path.
    it('should ignore a lookalike host suffixing the player domain', async () => {
      const value = '<iframe src="https://player.blubrry.com.evil.test/id/153989314/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the size a publisher states', () => {
    // 13,001 of 13,604 corpus iframes state 165, one more than the player measures, and the
    // measured 164 replaces it.
    it('should keep the measured height over the carrier height', async () => {
      const value = html`
        <iframe
          src="https://player.blubrry.com/id/153989314/"
          width="100%"
          height="165"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: '153989314',
        src: 'https://player.blubrry.com/id/153989314/',
        height: 164,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// The resolver only reaches a feed through the registered default list, and only an enclosure
// test reaches the path where claiming a media url would cost a reader the audio.
describeForEachParser('blubrry through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim a player url framed as an embed', async () => {
    const value = '<iframe src="https://player.blubrry.com/id/153989314/"></iframe>'

    const expected = html`
      <div
        data-embed-id="153989314"
        data-embed-provider="blubrry"
        data-embed-src="https://player.blubrry.com/id/153989314/"
        data-embed-height="164"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // `media.blubrry.com` is Blubrry's download-tracking prefix and carries the real file url in
  // its own path. The host list admits it, so only the `/id/` route check keeps it playable.
  it('should leave a media.blubrry.com audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://media.blubrry.com/theshow/cdn.example.com/media/episode-500.mp3',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio
        data-enclosure=""
        controls
        src="https://media.blubrry.com/theshow/cdn.example.com/media/episode-500.mp3"
      ></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  // The other media host, where Blubrry hosts the file itself rather than redirecting to it.
  it('should leave a content.blubrry.com audio enclosure playable', async () => {
    const enclosures = [
      { url: 'https://content.blubrry.com/theshow/ep-42.mp3', type: 'audio/mpeg' },
    ]

    const expected = html`
      <audio
        data-enclosure=""
        controls
        src="https://content.blubrry.com/theshow/ep-42.mp3"
      ></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})

describeForEachParser('blubrryEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, blubrryEmbedResolver)

  it('should drop the label the player writes in place of the name', async () => {
    const value = html`
      <iframe src="https://player.blubrry.com/id/153989314/" title="Blubrry Podcast Player"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: '153989314',
      src: 'https://player.blubrry.com/id/153989314/',
      height: 164,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should read the name the carrier states', async () => {
    const value = html`
      <iframe src="https://player.blubrry.com/id/153989314/" title="Discerning Hearts: Episode 4"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: '153989314',
      src: 'https://player.blubrry.com/id/153989314/',
      height: 164,
      title: 'Discerning Hearts: Episode 4',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

describeForEachParser('blubrryPowerpressEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, blubrryPowerpressEmbedResolver)

  describe('happy paths', () => {
    it('should pass an audio frame through at the measured bar height', async () => {
      const value = html`
        <iframe
          width="320"
          height="30"
          src="https://joy.org.au/bentnotes/?powerpress_embed=3443-podcast&amp;powerpress_player=mediaelement-audio"
          title="Blubrry Podcast Player"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'joy.org.au/bentnotes/3443-podcast',
        src: 'https://joy.org.au/bentnotes/?powerpress_embed=3443-podcast&powerpress_player=mediaelement-audio',
        height: 40,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass a default player frame through at the measured bar height', async () => {
      const value = html`
        <iframe
          width="320"
          height="24"
          src="https://nynjbengali.com/?powerpress_embed=1784-podcast&amp;powerpress_player=default"
          title="Blubrry Podcast Player"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'nynjbengali.com/1784-podcast',
        src: 'https://nynjbengali.com/?powerpress_embed=1784-podcast&powerpress_player=default',
        height: 40,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state a 16:9 ratio for a video frame', async () => {
      const value = html`
        <iframe
          width="825"
          height="825"
          src="https://grrotary.org/?powerpress_embed=61144-podcast&amp;powerpress_player=html5video"
          title="Blubrry Podcast Player"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'grrotary.org/61144-podcast',
        src: 'https://grrotary.org/?powerpress_embed=61144-podcast&powerpress_player=html5video',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a feed slug other than podcast as written', async () => {
      const value =
        '<iframe src="https://example.com/?powerpress_embed=618-timbernook-tips&amp;powerpress_player=mediaelement-audio"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'example.com/618-timbernook-tips',
        src: 'https://example.com/?powerpress_embed=618-timbernook-tips&powerpress_player=mediaelement-audio',
        height: 40,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the name the carrier states', async () => {
      const value =
        '<iframe src="https://example.com/?powerpress_embed=618-podcast" title="Episode 618"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'example.com/618-podcast',
        src: 'https://example.com/?powerpress_embed=618-podcast',
        height: 40,
        title: 'Episode 618',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the name inside another parameter', async () => {
      const value = '<iframe src="https://example.com/?q=powerpress_embed=3443-podcast"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a url that cannot be parsed', async () => {
      const value = '<iframe src="https://[/?powerpress_embed=3443-podcast"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the player of a video frame the feed escaped twice', async () => {
      const value = html`
        <iframe
          width="825"
          height="825"
          src="https://grrotary.org/?powerpress_embed=61144-podcast&amp;amp;powerpress_player=html5video"
          title="Blubrry Podcast Player"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'grrotary.org/61144-podcast',
        src: 'https://grrotary.org/?powerpress_embed=61144-podcast&powerpress_player=html5video',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the audio height for a frame naming no player', async () => {
      const value = '<iframe src="https://example.com/?powerpress_embed=3443-podcast"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'example.com/3443-podcast',
        src: 'https://example.com/?powerpress_embed=3443-podcast',
        height: 40,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass through a value naming no feed as written', async () => {
      const value = '<iframe src="https://example.com/?powerpress_embed=3443"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'example.com/3443',
        src: 'https://example.com/?powerpress_embed=3443',
        height: 40,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('blubrryPowerpressEmbedResolver through the pipeline', (parseHtml) => {
  const convert = (value: string, cleanUrlFn?: CleanUrlFn) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      cleanUrlFn,
    })
  }

  it('should claim a PowerPress frame the generic fallback took before', async () => {
    const value = html`
      <iframe
        width="320"
        height="30"
        src="https://joy.org.au/bentnotes/?powerpress_embed=3443-podcast&amp;powerpress_player=mediaelement-audio"
        title="Blubrry Podcast Player"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-id="joy.org.au/bentnotes/3443-podcast"
        data-embed-provider="blubrry"
        data-embed-src="https://joy.org.au/bentnotes/?powerpress_embed=3443-podcast&amp;powerpress_player=mediaelement-audio"
        data-embed-height="40"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it("should hand the carrier src to the caller's cleaner", async () => {
    const value = html`
      <iframe
        src="https://joy.org.au/bentnotes/?powerpress_embed=3443-podcast&amp;powerpress_player=mediaelement-audio&amp;utm_source=feed"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-id="joy.org.au/bentnotes/3443-podcast"
        data-embed-provider="blubrry"
        data-embed-src="https://joy.org.au/bentnotes/?powerpress_embed=3443-podcast&amp;powerpress_player=mediaelement-audio"
        data-embed-height="40"
      ></div>
    `
    const cleanUrlFn = (url: string) => url.replace(/&utm_\w+=\w+/g, '')

    expect(await convert(value, cleanUrlFn)).toEqualHtml(expected)
  })
})
