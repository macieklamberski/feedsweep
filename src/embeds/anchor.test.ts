import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { anchorEmbedResolver, anchorResolveEmbed, extractAnchorEpisode } from './anchor.js'

describe('extractAnchorEpisode', () => {
  it('should read the original anchor.fm form', () => {
    const value = 'https://anchor.fm/myshow/embed/episodes/my-title-e123'
    const expected = 'myshow/my-title-e123'

    expect(extractAnchorEpisode(value)).toBe(expected)
  })

  it('should read the podcasters.spotify.com form', () => {
    const value = 'https://podcasters.spotify.com/pod/show/myshow/embed/episodes/my-title-e123'
    const expected = 'myshow/my-title-e123'

    expect(extractAnchorEpisode(value)).toBe(expected)
  })

  it('should read the creators.spotify.com form', () => {
    const value = 'https://creators.spotify.com/pod/profile/me/embed/episodes/my-title-e1/a-abc'
    const expected = 'me/my-title-e1'

    expect(extractAnchorEpisode(value)).toBe(expected)
  })

  it('should return undefined for a show page rather than an embed', () => {
    const value = 'https://anchor.fm/myshow'

    expect(extractAnchorEpisode(value)).toBeUndefined()
  })

  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(extractAnchorEpisode(value)).toBeUndefined()
  })

  it('should return undefined for a anchor url naming no episode', () => {
    const value = 'https://anchor.fm/pricing'

    expect(extractAnchorEpisode(value)).toBeUndefined()
  })

  // The marker is present but the episode segment is not, which is a different guard from a
  // url that never mentions `embed/episodes` at all.
  it('should return undefined when the embed marker names no episode', () => {
    const value = 'https://anchor.fm/myshow/embed/episodes'

    expect(extractAnchorEpisode(value)).toBeUndefined()
  })

  it('should return undefined when no show precedes the embed marker', () => {
    const value = 'https://anchor.fm/embed/episodes/my-title-e123'

    expect(extractAnchorEpisode(value)).toBeUndefined()
  })
})

describe('anchorResolveEmbed', () => {
  it('should state the player height', () => {
    const value = 'https://anchor.fm/myshow/embed/episodes/my-title-e123'
    const expected: EmbedResolverResult = {
      provider: 'anchor',
      id: 'myshow/my-title-e123',
      src: 'https://anchor.fm/myshow/embed/episodes/my-title-e123',
      height: 100,
    }

    expect(anchorResolveEmbed(value)).toEqual(expected)
  })

  // The three hosts redirect to one player, so the newest generation gets the same height.
  it('should state the same height for the creators host', () => {
    const value = 'https://creators.spotify.com/pod/profile/me/embed/episodes/my-title-e1/a-abc'
    const expected: EmbedResolverResult = {
      provider: 'anchor',
      id: 'me/my-title-e1',
      src: 'https://creators.spotify.com/pod/profile/me/embed/episodes/my-title-e1/a-abc',
      height: 100,
    }

    expect(anchorResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a anchor url naming no episode', () => {
    const value = 'https://anchor.fm/pricing'

    expect(anchorResolveEmbed(value)).toBeUndefined()
  })
})

describeForEachParser('anchorEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, anchorEmbedResolver)

  describe('happy paths', () => {
    it('should state the player height for a carrier declaring none', async () => {
      const value = html`
        <iframe
          src="https://anchor.fm/myshow/embed/episodes/my-title-e123"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'anchor',
        id: 'myshow/my-title-e123',
        src: 'https://anchor.fm/myshow/embed/episodes/my-title-e123',
        height: 100,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The height the publisher pasted is the one their player was measured against, so the
    // 102 Spotify's own snippet writes stands over the resolver's 100.
    it('should keep the size the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://creators.spotify.com/pod/profile/me/embed/episodes/my-title-e1/a-abc"
          width="400"
          height="102"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'anchor',
        id: 'me/my-title-e1',
        src: 'https://creators.spotify.com/pod/profile/me/embed/episodes/my-title-e1/a-abc',
        width: 400,
        height: 102,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the podcasters.spotify.com player', async () => {
      const value = html`
        <iframe
          src="https://podcasters.spotify.com/pod/show/myshow/embed/episodes/my-title-e123/a-abgv8jg"
          width="400px"
          height="102px"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'anchor',
        id: 'myshow/my-title-e123',
        src: 'https://podcasters.spotify.com/pod/show/myshow/embed/episodes/my-title-e123/a-abgv8jg',
        width: 400,
        height: 102,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/myshow/embed/episodes/my-title-e123"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed route other than episodes', async () => {
      const value = '<iframe src="https://anchor.fm/myshow/embed/clips/my-title-e123"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an anchor url naming no episode', async () => {
      const value = '<iframe src="https://anchor.fm/pricing"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// anchor.fm serves the episode files too, and an enclosure is offered to every url resolver.
describeForEachParser('anchor through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim an episode player', async () => {
    const value = '<iframe src="https://anchor.fm/myshow/embed/episodes/my-title-e123"></iframe>'
    const expected = html`
      <div
        data-embed-id="myshow/my-title-e123"
        data-embed-provider="anchor"
        data-embed-src="https://anchor.fm/myshow/embed/episodes/my-title-e123"
        data-embed-height="100"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave an anchor.fm audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://anchor.fm/s/3a943b28/podcast/play/102562919/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-4-12%2Ffe615040-de2c-fee0-fa00-979874f6cb3d.mp3',
        type: 'audio/mpeg',
      },
    ]
    const expected = html`
      <audio
        data-enclosure=""
        controls
        src="https://anchor.fm/s/3a943b28/podcast/play/102562919/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-4-12%2Ffe615040-de2c-fee0-fa00-979874f6cb3d.mp3"
      ></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
