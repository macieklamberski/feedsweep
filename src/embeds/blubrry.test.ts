import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  type BlubrryPlayer,
  blubrryEmbedResolver,
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

  it('should read the media url over the podcast id beside it', () => {
    const value =
      'https://player.blubrry.com/?podcast_id=154118283&media_url=https%3A%2F%2Fmedia.blubrry.com%2Fshow%2Fep.mp3&modern=1'
    const expected: BlubrryPlayer = { kind: 'media', id: 'https://media.blubrry.com/show/ep.mp3' }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should read the episode id of a player naming no media url', () => {
    const value = 'https://player.blubrry.com/?podcast_id=96123983&modern=1'
    const expected: BlubrryPlayer = { kind: 'episode', id: '96123983' }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a podcast id that is not digits', () => {
    const value = 'https://player.blubrry.com/?podcast_id=..%2Fpricing&modern=1'

    expect(extractBlubrryEmbed(value)).toBeUndefined()
  })

  it('should read an episode id that is not digits by its route', () => {
    const value = 'https://player.blubrry.com/id/abc123x/'
    const expected: BlubrryPlayer = { kind: 'episode', id: 'abc123x' }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should read the show of a latest episode player', () => {
    const value = 'https://player.blubrry.com/3954807/latest/'
    const expected: BlubrryPlayer = { kind: 'latest', id: '3954807', position: '' }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should read a show named by its program keyword', () => {
    const value = 'https://player.blubrry.com/the_posecon_podcast/latest/'
    const expected: BlubrryPlayer = { kind: 'latest', id: 'the_posecon_podcast', position: '' }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should read the show of a playlist with the episode it opens on', () => {
    const value =
      'https://player.blubrry.com/3739323/playlist/?episodes=5&scroll=0&selectedId=132994802'
    const expected: BlubrryPlayer = {
      kind: 'playlist',
      id: '3739323',
      position: '?selectedId=132994802',
    }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should read a show route word in any case', () => {
    const value = 'https://player.blubrry.com/3954807/LATEST/'
    const expected: BlubrryPlayer = { kind: 'latest', id: '3954807', position: '' }

    expect(extractBlubrryEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a show path with a word that names no player', () => {
    const value = 'https://player.blubrry.com/3954807/archive/'

    expect(extractBlubrryEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a show route below another segment', () => {
    const value = 'https://player.blubrry.com/embed/3954807/latest/'

    expect(extractBlubrryEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a show route followed by another segment', () => {
    const value = 'https://player.blubrry.com/3954807/latest/extra/'

    expect(extractBlubrryEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a program keyword that climbs to the parent path', () => {
    const value = 'https://player.blubrry.com/..%2Fpricing/latest/'

    expect(extractBlubrryEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a program keyword holding an escaped slash', () => {
    const value = 'https://player.blubrry.com/3954807%2Fpricing/latest/'

    expect(extractBlubrryEmbed(value)).toBeUndefined()
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

  it('should key a latest episode player by the show, not an episode', () => {
    const value = 'https://player.blubrry.com/3954807/latest/'
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: '3954807/latest',
      src: 'https://player.blubrry.com/3954807/latest/',
      height: 164,
    }

    expect(blubrryResolveEmbed(value)).toEqual(expected)
  })

  it('should write a show route word in the case the player serves', () => {
    const value = 'https://player.blubrry.com/3954807/Latest/'
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: '3954807/latest',
      src: 'https://player.blubrry.com/3954807/latest/',
      height: 164,
    }

    expect(blubrryResolveEmbed(value)).toEqual(expected)
  })

  it('should state the playlist height for a playlist', () => {
    const value = 'https://player.blubrry.com/3739323/playlist/'
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: '3739323/playlist',
      src: 'https://player.blubrry.com/3739323/playlist/',
      height: 568,
    }

    expect(blubrryResolveEmbed(value)).toEqual(expected)
  })

  it('should keep the episode a playlist opens on and drop a tracker', () => {
    const value =
      'https://player.blubrry.com/3739323/playlist/?utm_source=feed&selectedId=132994802'
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: '3739323/playlist',
      src: 'https://player.blubrry.com/3739323/playlist/?selectedId=132994802',
      height: 568,
    }

    expect(blubrryResolveEmbed(value)).toEqual(expected)
  })

  it('should not carry a playlist position onto a latest episode player', () => {
    const value = 'https://player.blubrry.com/3954807/latest/?selectedId=132994802'
    const expected: EmbedResolverResult = {
      provider: 'blubrry',
      id: '3954807/latest',
      src: 'https://player.blubrry.com/3954807/latest/',
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

    it('should key a player naming a media url and a podcast id by the media url', async () => {
      const value = html`
        <iframe
          src="https://player.blubrry.com/?podcast_id=132906693&amp;media_url=https%3A%2F%2Fmedia.blubrry.com%2Fthe_shaman_podcast%2Fcontent.blubrry.com%2Fthe_shaman_podcast%2F04_May_2026.mp3&amp;modern=1#mode-Light&amp;border-000000&amp;progress-000000"
          scrolling="no"
          width="100%"
          height="165"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'https://media.blubrry.com/the_shaman_podcast/content.blubrry.com/the_shaman_podcast/04_May_2026.mp3',
        src: 'https://player.blubrry.com/?media_url=https%3A%2F%2Fmedia.blubrry.com%2Fthe_shaman_podcast%2Fcontent.blubrry.com%2Fthe_shaman_podcast%2F04_May_2026.mp3',
        height: 164,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should key a player naming only a podcast id by the episode', async () => {
      const value = html`
        <iframe
          src="https://player.blubrry.com?podcast_id=19453169"
          width="100%"
          height="138px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: '19453169',
        src: 'https://player.blubrry.com/id/19453169/',
        height: 164,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should key a latest episode player by the show', async () => {
      const value = html`
        <iframe
          src="https://player.blubrry.com/3954807/latest/#mode-Light&amp;border-000000&amp;progress-000000"
          title="Blubrry Podcast Player"
          scrolling="no"
          width="100%"
          height="165px;"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: '3954807/latest',
        src: 'https://player.blubrry.com/3954807/latest/',
        height: 164,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should key a latest episode player by the program keyword', async () => {
      const value = html`
        <iframe
          src="https://player.blubrry.com/the_posecon_podcast/latest/"
          title="Blubrry Podcast Player"
          scrolling="no"
          width="100%"
          height="230px;"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: 'the_posecon_podcast/latest',
        src: 'https://player.blubrry.com/the_posecon_podcast/latest/',
        height: 164,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should key a playlist by the show and open it on the selected episode', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://player.blubrry.com/3739323/playlist/?episodes=5&#038;scroll=0&#038;selectedId=132994802#mode-Light&#038;border-000000&#038;progress-000000"
          title="Blubrry Podcast Player"
          scrolling="no"
          width="100%"
          height="415"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'blubrry',
        id: '3739323/playlist',
        src: 'https://player.blubrry.com/3739323/playlist/?selectedId=132994802',
        height: 568,
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
