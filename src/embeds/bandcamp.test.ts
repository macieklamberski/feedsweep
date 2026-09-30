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

// Presets the lab's carriers wrote, each drawn by the publisher in a box of its own.
const presetCases: Array<string> = ['small', 'medium', 'venti', 'grande2', 'tall']

describeForEachParser('bandcampEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, bandcampEmbedResolver)

  describe('path values', () => {
    it('should encode a path release value once', async () => {
      const value =
        '<iframe src="https://bandcamp.com/EmbeddedPlayer/track=%20235369944/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'track/ 235369944',
        src: 'https://bandcamp.com/EmbeddedPlayer/track=%20235369944/',
        height: 100,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a start track as written', async () => {
      const value = '<iframe src="https://bandcamp.com/EmbeddedPlayer/album=42/t=07x/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/42',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/t=07x/',
        height: 100,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=3373381116/',
        url: 'http://myexpansiveawareness.bandcamp.com/album/do-you-wanna-be-rich',
        height: 100,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=1578579597/track=1637967854/',
        height: 100,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // `t=` is the track number the album player opens on, the other way the embed dialog
    // spells a picked track.
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=2182110545/t=38/',
        height: 100,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=2568747696/track=2747530839/',
        height: 100,
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
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The video player is not the audio strip, so the box the publisher drew for it stays.
    it('should keep the box a video embed declares', async () => {
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
        width: 400,
        height: 225,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=2545703459/',
        height: 100,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/',
        height: 100,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/t=3/',
        height: 100,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // Every preset and option is a layout of the same release. The player with no `size`
  // segment, Bandcamp's own default, is minted in its place at its own height.
  describe('the layout the carrier wrote', () => {
    // The commonest carrier: the large player with small artwork, drawn as a 120 tall strip.
    it('should mint the default player in place of the small artwork strip', async () => {
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=1196866932/',
        height: 100,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the default player in place of the large preset box', async () => {
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=4173511610/',
        height: 100,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it.each(presetCases)(
      'should mint the default player in place of the %s preset',
      async (preset) => {
        const value = html`
          <iframe
            style="border: 0; width: 100%; height: 42px;"
            src="https://bandcamp.com/EmbeddedPlayer/album=42/size=${preset}/bgcol=ffffff/linkcol=0687f5/transparent=true/"
            seamless
          ></iframe>
        `
        const expected: EmbedResolverResult = {
          provider: 'bandcamp',
          id: 'album/42',
          src: 'https://bandcamp.com/EmbeddedPlayer/album=42/',
          height: 100,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=506020072/',
        height: 100,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The player sends `esig` to its stream api for an exclusive track. The lab's signatures
    // answer "not available" in a browser, and the same release plays without them.
    it('should drop an exclusive track signature', async () => {
      const value = html`
        <iframe
          src="https://bandcamp.com/EmbeddedPlayer/album=3807347294/size=large/bgcol=ffffff/linkcol=0687f5/artwork=small/transparent=true/tracklist=false/tracks=139951092/esig=d16fcc7028af72f6597fb5bdf57c95e7/"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bandcamp',
        id: 'album/3807347294',
        src: 'https://bandcamp.com/EmbeddedPlayer/album=3807347294/',
        height: 100,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/',
        height: 100,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=123%2F..%2Fx/',
        height: 100,
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
        src: 'https://bandcamp.com/EmbeddedPlayer/album=42/',
        height: 100,
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
      src: 'https://bandcamp.com/EmbeddedPlayer/track=42/',
      height: 100,
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
      src: 'https://bandcamp.com/EmbeddedPlayer/track=42/',
      height: 100,
      title: 'River Shook by Shook Ones',
    }

    expect(await extract(value)).toEqual(expected)
  })
})
