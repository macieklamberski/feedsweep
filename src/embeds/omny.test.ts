import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { extractOmnyClip, omnyEmbedResolver, omnyResolveEmbed } from './omny.js'

describe('extractOmnyClip', () => {
  it('should read a clip', () => {
    const value = 'https://omny.fm/shows/the-show/an-episode-title/embed?style=cover'
    const expected = 'the-show/an-episode-title'

    expect(extractOmnyClip(value)).toBe(expected)
  })

  it('should read a playlist', () => {
    const value = 'https://omny.fm/shows/the-show/playlists/highlights/embed'
    const expected = 'the-show/playlists/highlights'

    expect(extractOmnyClip(value)).toBe(expected)
  })

  it('should read a clip whose slug carries digits', () => {
    const value =
      'https://omny.fm/shows/today-fm/could-2023-see-the-end-of-the-russia-ukraine-war/embed'
    const expected = 'today-fm/could-2023-see-the-end-of-the-russia-ukraine-war'

    expect(extractOmnyClip(value)).toBe(expected)
  })

  // Omny's own slugs are lowercase, and the player serves the same clip under a capitalised one.
  it('should read a clip whose slug carries capitals', () => {
    const value = 'https://omny.fm/shows/101-3-kdwb-clips/6AM-Hour-Holiday-Awkward/embed'
    const expected = '101-3-kdwb-clips/6AM-Hour-Holiday-Awkward'

    expect(extractOmnyClip(value)).toBe(expected)
  })

  it('should return undefined for a show page that is not an embed', () => {
    const value = 'https://omny.fm/shows/the-show'

    expect(extractOmnyClip(value)).toBeUndefined()
  })

  it('should return undefined for a playlist page that is not an embed', () => {
    const value = 'https://omny.fm/shows/the-show/playlists/highlights'

    expect(extractOmnyClip(value)).toBeUndefined()
  })

  it('should return undefined for the clip path under another segment', () => {
    const value = 'https://omny.fm/x/shows/the-show/an-episode/embed'

    expect(extractOmnyClip(value)).toBeUndefined()
  })

  it('should use a malformed slug as written, even if the player answers an error', () => {
    const value = 'https://omny.fm/shows/the-show/an%2Fepisode/embed'
    const expected = 'the-show/an%2Fepisode'

    expect(extractOmnyClip(value)).toEqual(expected)
  })

  // The player answers 404 for both where the hyphenated slug answers 200.
  const malformedSlugUrls: Array<[string, string]> = [
    [
      'https://omny.fm/shows/101-3-kdwb-clips/6AM.Hour-Holiday-Awkward/embed',
      '101-3-kdwb-clips/6AM.Hour-Holiday-Awkward',
    ],
    [
      'https://omny.fm/shows/101-3-kdwb-clips/6AM_Hour-Holiday-Awkward/embed',
      '101-3-kdwb-clips/6AM_Hour-Holiday-Awkward',
    ],
  ]

  it.each(malformedSlugUrls)(
    'should use the malformed slug in %s as written, even if the player answers an error',
    (value, expected) => {
      expect(extractOmnyClip(value)).toEqual(expected)
    },
  )

  it('should return undefined when no clip is named', () => {
    const value = 'https://omny.fm/shows/embed'

    expect(extractOmnyClip(value)).toBeUndefined()
  })

  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(extractOmnyClip(value)).toBeUndefined()
  })
})

describe('omnyResolveEmbed', () => {
  it('should drop the default audio rendering with the display options', () => {
    const value =
      'https://omny.fm/shows/the-show/an-episode/embed?media=audio&size=wide&style=cover'
    const expected: EmbedResolverResult = {
      provider: 'omny',
      id: 'the-show/an-episode',
      src: 'https://omny.fm/shows/the-show/an-episode/embed',
      height: 180,
    }

    expect(omnyResolveEmbed(value)).toEqual(expected)
  })

  it('should give the video rendering its own shape', () => {
    const value = 'https://omny.fm/shows/the-show/an-episode/embed?media=Video'
    const expected: EmbedResolverResult = {
      provider: 'omny',
      id: 'the-show/an-episode',
      src: 'https://omny.fm/shows/the-show/an-episode/embed?media=Video',
      ratio: '16/9',
    }

    expect(omnyResolveEmbed(value)).toEqual(expected)
  })

  it('should read the video rendering in any case', () => {
    const value = 'https://omny.fm/shows/the-show/an-episode/embed?media=video'
    const expected: EmbedResolverResult = {
      provider: 'omny',
      id: 'the-show/an-episode',
      src: 'https://omny.fm/shows/the-show/an-episode/embed?media=video',
      ratio: '16/9',
    }

    expect(omnyResolveEmbed(value)).toEqual(expected)
  })

  it('should drop the square layout and the artwork style', () => {
    const value = 'https://omny.fm/shows/the-show/an-episode/embed?style=artwork&size=Square'
    const expected: EmbedResolverResult = {
      provider: 'omny',
      id: 'the-show/an-episode',
      src: 'https://omny.fm/shows/the-show/an-episode/embed',
      height: 180,
    }

    expect(omnyResolveEmbed(value)).toEqual(expected)
  })

  // The list under the player grows with the playlist, so no height fits it.
  it('should state no size for a playlist', () => {
    const value = 'https://omny.fm/shows/the-show/playlists/highlights/embed?style=cover'
    const expected: EmbedResolverResult = {
      provider: 'omny',
      id: 'the-show/playlists/highlights',
      src: 'https://omny.fm/shows/the-show/playlists/highlights/embed',
    }

    expect(omnyResolveEmbed(value)).toEqual(expected)
  })

  it('should size a clip whose slug is the playlists word', () => {
    const value = 'https://omny.fm/shows/the-show/playlists/embed'
    const expected: EmbedResolverResult = {
      provider: 'omny',
      id: 'the-show/playlists',
      src: 'https://omny.fm/shows/the-show/playlists/embed',
      height: 180,
    }

    expect(omnyResolveEmbed(value)).toEqual(expected)
  })

  it('should keep a start offset', () => {
    const value = 'https://omny.fm/shows/the-show/an-episode/embed?t=70m40s'
    const expected: EmbedResolverResult = {
      provider: 'omny',
      id: 'the-show/an-episode',
      src: 'https://omny.fm/shows/the-show/an-episode/embed?t=70m40s',
      height: 180,
    }

    expect(omnyResolveEmbed(value)).toEqual(expected)
  })

  // Autoplay is the render hint's to offer on the click that loads the player, and tracking
  // parameters name nothing about the episode, so neither reaches the url every consumer gets.
  it('should drop autoplay and tracking parameters', () => {
    const value =
      'https://omny.fm/shows/the-show/an-episode/embed?style=cover&autoplay=1&utm_source=news'
    const expected: EmbedResolverResult = {
      provider: 'omny',
      id: 'the-show/an-episode',
      src: 'https://omny.fm/shows/the-show/an-episode/embed',
      height: 180,
    }

    expect(omnyResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a omny url naming no clip', () => {
    const value = 'https://omny.fm/about'

    expect(omnyResolveEmbed(value)).toBeUndefined()
  })
})

describeForEachParser('omnyEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, omnyEmbedResolver)

  describe('happy paths', () => {
    it('should read the player off an iframe carrier', async () => {
      const value =
        '<iframe src="https://omny.fm/shows/the-show/an-episode/embed?style=cover"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'omny',
        id: 'the-show/an-episode',
        src: 'https://omny.fm/shows/the-show/an-episode/embed',
        height: 180,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the clip name off the stated title', async () => {
      const value = html`
        <iframe
          src="https://omny.fm/shows/the-show/an-episode/embed"
          title="S5E10 Christmas Waltz"
          allow="autoplay; clipboard-write"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'omny',
        id: 'the-show/an-episode',
        src: 'https://omny.fm/shows/the-show/an-episode/embed',
        height: 180,
        title: 'S5E10 Christmas Waltz',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('playlists', () => {
    it('should keep the box the carrier states', async () => {
      const value = html`
        <iframe
          src="https://omny.fm/shows/the-show/playlists/highlights/embed"
          width="100%"
          height="600"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'omny',
        id: 'the-show/playlists/highlights',
        src: 'https://omny.fm/shows/the-show/playlists/highlights/embed',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the snippets publishers wrote', () => {
    it('should keep the start and drop a width the player does not take', async () => {
      const value = html`
        <iframe
          class="zpiframe "
          src="https://omny.fm/shows/the-shift/chris-parry-ceo-of-equity-guru-talks-to-us-about-a/embed?t=41m45s"
          width="320"
          height="180"
          align="left"
          frameBorder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'omny',
        id: 'the-shift/chris-parry-ceo-of-equity-guru-talks-to-us-about-a',
        src: 'https://omny.fm/shows/the-shift/chris-parry-ceo-of-equity-guru-talks-to-us-about-a/embed?t=41m45s',
        height: 180,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the style the dialog wrote', async () => {
      const value = html`
        <iframe
          loading="lazy"
          allow="autoplay; clipboard-write"
          frameborder="0"
          height="180"
          src="https://omny.fm/shows/cjad-800/mulcair-what-was-going-on-with-bernard-drainville/embed?style=Cover"
          title="Mulcair: what was going on with Bernard Drainville?"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'omny',
        id: 'cjad-800/mulcair-what-was-going-on-with-bernard-drainville',
        src: 'https://omny.fm/shows/cjad-800/mulcair-what-was-going-on-with-bernard-drainville/embed',
        height: 180,
        title: 'Mulcair: what was going on with Bernard Drainville?',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // The carrier selector matches every iframe, so the host gate is the only thing that turns
    // this away, and a lookalike is the specimen that reaches it: host matching admits subdomains.
    it('should ignore a lookalike host carrying the clip path', async () => {
      const value =
        '<iframe src="https://omny.fm.evil.test/shows/the-show/an-episode/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    // A box the publisher stated was drawn for a layout the mint may have dropped.
    it("should give the player its own height over the carrier's box", async () => {
      const value = html`
        <iframe
          src="https://omny.fm/shows/the-show/an-episode/embed"
          width="640"
          height="200"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'omny',
        id: 'the-show/an-episode',
        src: 'https://omny.fm/shows/the-show/an-episode/embed',
        height: 180,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// The placeholder's src is what every consumer of the feed gets, so what the query carries has to
// be asserted where it lands. The enclosure case is here for a different reason: injectEnclosures
// offers every attachment to every url-keyed resolver, and omny serves the episode audio from the
// same domain as the players, so only that path reaches the point where claiming a media url
// would cost a reader a playable element.
describeForEachParser('omny through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should place the clip without the style and autoplay the publisher wrote', async () => {
    const value = html`
      <iframe
        src="https://omny.fm/shows/the-show/an-episode/embed?style=cover&autoplay=1"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://omny.fm/shows/the-show/an-episode/embed"
        data-embed-provider="omny"
        data-embed-id="the-show/an-episode"
        data-embed-height="180"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave an omny audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://traffic.omny.fm/d/clips/05c002e0/8d774780/085556fd/audio.mp3',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio data-enclosure="" controls src="https://traffic.omny.fm/d/clips/05c002e0/8d774780/085556fd/audio.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
