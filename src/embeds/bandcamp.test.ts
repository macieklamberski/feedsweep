import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { bandcampEmbedResolver, extractBandcampRelease } from './bandcamp.js'

describe('extractBandcampRelease', () => {
  it('should read an album from the player path', () => {
    const value =
      'https://bandcamp.com/EmbeddedPlayer/album=3373381116/size=large/bgcol=ffffff/transparent=true/'
    const expected = 'album/3373381116'

    expect(extractBandcampRelease(value)).toBe(expected)
  })

  it('should read a track from the player path', () => {
    const value = 'https://bandcamp.com/EmbeddedPlayer/track=42/size=small/'
    const expected = 'track/42'

    expect(extractBandcampRelease(value)).toBe(expected)
  })

  // The video player spells its options as a query string instead.
  it('should read a track from the video query', () => {
    const value = 'https://bandcamp.com/VideoEmbed?track=1959185434&bgcol=ffffff&linkcol=7137dc'
    const expected = 'track/1959185434'

    expect(extractBandcampRelease(value)).toBe(expected)
  })

  // A player pointing into an album names both, and whichever kind the url spells first is the
  // one the id keeps.
  it('should read the track from a track-within-album path', () => {
    const value =
      'https://bandcamp.com/EmbeddedPlayer/album=1578579597/size=large/artwork=small/track=1637967854/'
    const expected = 'track/1637967854'

    expect(extractBandcampRelease(value)).toBe(expected)
  })

  it('should read the track from the legacy path that names the album second', () => {
    const value =
      'https://bandcamp.com/EmbeddedPlayer/v=2/track=2747530839/album=2568747696/size=large/'
    const expected = 'track/2747530839'

    expect(extractBandcampRelease(value)).toBe(expected)
  })

  it('should read the one track a signed carrier names', () => {
    const value =
      'https://bandcamp.com/EmbeddedPlayer/album=3807347294/size=large/tracklist=false/tracks=2464352004/esig=76671557f3fab5a5a868dbbabaa73d70/'
    const expected = 'track/2464352004'

    expect(extractBandcampRelease(value)).toBe(expected)
  })

  it('should use a signed track id that does not decode as written', () => {
    const value = 'https://bandcamp.com/EmbeddedPlayer/album=42/tracks=7%E0%A4/esig=abc/'
    const expected = 'track/7%E0%A4'

    expect(extractBandcampRelease(value)).toBe(expected)
  })

  it('should return undefined when no release is named', () => {
    const value = 'https://bandcamp.com/EmbeddedPlayer/size=small/bgcol=ffffff/'

    expect(extractBandcampRelease(value)).toBeUndefined()
  })

  it('should return undefined for a release option behind a prefix', () => {
    const value = 'https://bandcamp.com/EmbeddedPlayer/xalbum=42/size=small/'

    expect(extractBandcampRelease(value)).toBeUndefined()
  })

  it('should use a malformed release id as written, even if the player answers an error', () => {
    const value = 'https://bandcamp.com/EmbeddedPlayer/album=42x/size=small/'
    const expected = 'album/42x'

    expect(extractBandcampRelease(value)).toEqual(expected)
  })

  it('should use a malformed query id as written, even if the player answers an error', () => {
    const value = 'https://bandcamp.com/VideoEmbed?track=abc'
    const expected = 'track/abc'

    expect(extractBandcampRelease(value)).toEqual(expected)
  })

  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(extractBandcampRelease(value)).toBeUndefined()
  })
})

// Presets the lab's carriers wrote, each in the box its layout draws. Each row is
// [preset, height].
const presetCases: Array<[string, number]> = [
  ['small', 42],
  ['medium', 120],
  ['venti', 100],
  ['grande2', 355],
  ['tall', 295],
]

describeForEachParser('bandcampEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, bandcampEmbedResolver)

  describe('path values', () => {
    it('should encode a path release value once', async () => {
      const value =
        '<iframe src="https://bandcamp.com/EmbeddedPlayer/track=%20235369944/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'track/ 235369944',
        src: 'https://bandcamp.com/EmbeddedPlayer/track=%20235369944/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a start track as written', async () => {
      const value = '<iframe src="https://bandcamp.com/EmbeddedPlayer/album=42/t=07x/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/42',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/size=large/tracklist=false/artwork=small/t=07x/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('happy paths', () => {
    // Bandcamp's own snippet carries the release page and label in a fallback anchor, which is
    // the only place either appears: the player url names the release by number alone.
    it('should read the canonical url and title from the fallback anchor', async () => {
      const value = html`
        <iframe
          src="https://bandcamp.com/EmbeddedPlayer/album=3373381116/size=large/bgcol=ffffff/transparent=true/"
          seamless
        >
          <a href="http://myexpansiveawareness.bandcamp.com/album/do-you-wanna-be-rich">
            Do You Wanna Be Rich? by My Expansive Awareness
          </a>
        </iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/3373381116',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=3373381116/size=large/tracklist=false/artwork=small/',
        url: 'http://myexpansiveawareness.bandcamp.com/album/do-you-wanna-be-rich',
        height: 120,
        title: 'Do You Wanna Be Rich? by My Expansive Awareness',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Dropping the track leaves an album player, which opens on the album's first track rather
    // than the one the publisher linked.
    it('should keep the track a player opens an album at', async () => {
      const value = html`
        <iframe
          src="https://bandcamp.com/EmbeddedPlayer/album=1578579597/size=large/bgcol=333333/tracklist=false/artwork=small/track=1637967854/transparent=true/"
          seamless
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'track/1637967854',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=1578579597/size=large/tracklist=false/artwork=small/track=1637967854/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // `t=` is the track number the album player opens on: this specimen plays track 38.
    it('should keep the track number an album player opens on', async () => {
      const value = html`
        <iframe
          src="https://bandcamp.com/EmbeddedPlayer/album=2182110545/size=large/bgcol=333333/linkcol=4ec5ec/tracklist=false/artwork=small/t=38/transparent=true/"
          seamless
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/2182110545',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=2182110545/size=large/tracklist=false/artwork=small/t=38/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The legacy player spells the track before the album, and means the same thing.
    it('should keep both releases when the legacy path names the track first', async () => {
      const value = html`
        <iframe
          src="https://bandcamp.com/EmbeddedPlayer/v=2/track=2747530839/album=2568747696/size=large/bgcol=ffffff/"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'track/2747530839',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=2568747696/size=large/tracklist=false/artwork=small/track=2747530839/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the video player form for a video embed', async () => {
      const value = html`
        <iframe src="https://bandcamp.com/VideoEmbed?track=1959185434&bgcol=ffffff"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'track/1959185434',
        src: 'https://bandcamp.com/VideoEmbed?track=1959185434',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The video player is not the audio strip, so it gets the video ratio, not the strip's height.
    it('should state the video ratio over the box a video embed declares', async () => {
      const value = html`
        <iframe
          style="width: 400px; height: 225px;"
          src="https://bandcamp.com/VideoEmbed?track=2729551355&amp;bgcol=333333&amp;linkcol=e99708"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'track/2729551355',
        src: 'https://bandcamp.com/VideoEmbed?track=2729551355',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // `VideoEmbed?album={id}` answers 404. Bandcamp's own video embeds always name a track, so
    // this arrives from hand-edited markup, and the audio player does serve the release.
    it('should fall back to the audio player when a video embed names only an album', async () => {
      const value = html`
        <iframe src="https://bandcamp.com/VideoEmbed?album=2545703459"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/2545703459',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=2545703459/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should yield provider and id when no fallback anchor exists', async () => {
      const value = html`
        <iframe src="https://bandcamp.com/EmbeddedPlayer/album=42/"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/42',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker query on the player url', async () => {
      const value = html`
        <iframe src="https://bandcamp.com/EmbeddedPlayer/album=42/t=3/?utm_source=feed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/42',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/size=large/tracklist=false/artwork=small/t=3/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // Every preset and option is a layout of the same release. The small artwork strip is minted
  // in its place at its own height.
  describe('the layout the carrier wrote', () => {
    // The commonest carrier: the large player with small artwork, drawn as a 120 tall strip.
    it('should mint the small artwork strip without its colours', async () => {
      const value = html`
        <iframe
          style="border: 0; width: 100%; height: 120px;"
          src="https://bandcamp.com/EmbeddedPlayer/album=1196866932/size=large/bgcol=333333/linkcol=4ec5ec/tracklist=false/artwork=small/transparent=true/"
          seamless
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/1196866932',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=1196866932/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the small artwork strip in place of the large preset box', async () => {
      const value = html`
        <iframe
          style="border: 0; width: 350px; height: 470px;"
          src="https://bandcamp.com/EmbeddedPlayer/album=4173511610/size=large/bgcol=ffffff/linkcol=0687f5/minimal=true/transparent=true/"
          seamless
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/4173511610',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=4173511610/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it.each(presetCases)(
      'should mint the small artwork strip in place of the %s preset',
      async (preset, height) => {
        const value = html`
          <iframe
            style="border: 0; width: 100%; height: ${height}px;"
            src="https://bandcamp.com/EmbeddedPlayer/album=42/size=${preset}/bgcol=ffffff/linkcol=0687f5/transparent=true/"
            seamless
          ></iframe>
        `
        const expected: EmbedResolverResult = {
          provider: 'bandcamp',
          id: 'album/42',
          src: 'https://bandcamp.com/EmbeddedPlayer/album=42/size=large/tracklist=false/artwork=small/',
          height: 120,
        }

        expect(await extract(value)).toEqual(expected)
      },
    )

    it('should drop the merch package the large player shows', async () => {
      const value = html`
        <iframe
          src="https://bandcamp.com/EmbeddedPlayer/album=506020072/size=large/bgcol=333333/linkcol=4ec5ec/package=4229575847/transparent=true/"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/506020072',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=506020072/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // An exclusive embed names its tracks beside a signature. One named track is the track the
    // player plays, so it is kept as a track picked off the album and the signature is dropped.
    it('should keep the one track a signed carrier names', async () => {
      const value = html`
        <iframe
          src="https://bandcamp.com/EmbeddedPlayer/album=3807347294/size=large/bgcol=ffffff/linkcol=0687f5/artwork=small/transparent=true/tracklist=false/tracks=2464352004/esig=76671557f3fab5a5a868dbbabaa73d70/"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'track/2464352004',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=3807347294/size=large/tracklist=false/artwork=small/track=2464352004/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the bare album for a signed carrier naming several tracks', async () => {
      const value = html`
        <iframe
          src="https://bandcamp.com/EmbeddedPlayer/album=1866610573/size=large/bgcol=ffffff/linkcol=0687f5/transparent=true/tracklist=true/tracks=1112563518,682497575,1160362223,1285506387,4133464774/esig=7adbc523e32b7a4fee12470d506dc15a/"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/1866610573',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=1866610573/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a signed track option behind a prefix', async () => {
      const value = html`
        <iframe src="https://bandcamp.com/EmbeddedPlayer/album=42/xtracks=7/"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/42',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a start track option behind a prefix', async () => {
      const value = html`
        <iframe src="https://bandcamp.com/EmbeddedPlayer/album=42/xt=7/"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/42',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a player naming no release', async () => {
      const value = html`
        <iframe src="https://bandcamp.com/EmbeddedPlayer/size=small/bgcol=ffffff/"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should keep a decoded query id carrying a separator in one path segment', async () => {
      const value = html`
        <iframe src="https://bandcamp.com/EmbeddedPlayer/?album=123%2F..%2Fx"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/123/../x',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=123%2F..%2Fx/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a carrier pointing somewhere else', async () => {
      const value = '<iframe src="https://example.com/EmbeddedPlayer/album=42/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    // The href is the placeholder's click target, so the release page is taken from a Bandcamp
    // host only.
    it('should refuse a fallback anchor on a foreign host carrying the same path', async () => {
      const value = html`
        <iframe src="https://bandcamp.com/EmbeddedPlayer/album=42/size=large/" seamless>
          <a href="https://evil.test/album/do-you-wanna-be-rich">
            Do You Wanna Be Rich? by My Expansive Awareness
          </a>
        </iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/42',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/size=large/tracklist=false/artwork=small/',
        height: 120,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('bandcampEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, bandcampEmbedResolver)

  it('should drop the YouTube label a copied snippet carries', async () => {
    const value = html`
      <iframe src="https://bandcamp.com/EmbeddedPlayer/track=42/size=tall/" title="YouTube video player"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'bandcamp',
      id: 'track/42',
      src: 'https://bandcamp.com/EmbeddedPlayer/track=42/size=large/tracklist=false/artwork=small/',
      height: 120,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should read the name the carrier states when the anchor is gone', async () => {
    const value = html`
      <iframe src="https://bandcamp.com/EmbeddedPlayer/track=42/size=tall/" title="River Shook by Shook Ones"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'bandcamp',
      id: 'track/42',
      src: 'https://bandcamp.com/EmbeddedPlayer/track=42/size=large/tracklist=false/artwork=small/',
      height: 120,
      title: 'River Shook by Shook Ones',
    }

    expect(await extract(value)).toEqual(expected)
  })
})
