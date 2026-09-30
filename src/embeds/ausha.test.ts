import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { aushaEmbedResolver, aushaResolveEmbed } from './ausha.js'

describe('aushaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should take the episode and the measured height off the player without its colour', () => {
      const value = 'https://player.ausha.co/?podcastId=BGKwJUJG8D9m&color=%23001B2D&v=3'
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/BGKwJUJG8D9m',
        src: 'https://player.ausha.co/?podcastId=BGKwJUJG8D9m&v=3',
        height: 220,
      }

      expect(aushaResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the bare root for the player spelled as index.html', () => {
      const value = 'https://player.ausha.co/index.html?podcastId=b3GxmHMGPEaQ&v=3'
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/b3GxmHMGPEaQ',
        src: 'https://player.ausha.co/?podcastId=b3GxmHMGPEaQ&v=3',
        height: 220,
      }

      expect(aushaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/?podcastId=BGKwJUJG8D9m'

      expect(aushaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an ausha host that is not a player', () => {
      const value = 'https://podcast.ausha.co/comicsdiscovery?podcastId=BGKwJUJG8D9m'

      expect(aushaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an ausha host that is not a player at the root', () => {
      const value = 'https://www.ausha.co/?podcastId=BGKwJUJG8D9m'

      expect(aushaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player url naming nothing', () => {
      const value = 'https://player.ausha.co/?color=%23001B2D&v=3'

      expect(aushaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a url that cannot be parsed', () => {
      const value = 'https://['

      expect(aushaResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed id as written, even if the player answers an error', () => {
      const value = 'https://player.ausha.co/?podcastId=podcast/BGKwJUJG8D9m&v=3'
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/podcast/BGKwJUJG8D9m',
        src: 'https://player.ausha.co/?podcastId=podcast%2FBGKwJUJG8D9m&v=3',
        height: 220,
      }

      expect(aushaResolveEmbed(value)).toEqual(expected)
    })

    it('should read an id longer than the twelve characters minted today', () => {
      const value = 'https://player.ausha.co/?podcastId=BGKwJUJG8D9mX&v=3'
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/BGKwJUJG8D9mX',
        src: 'https://player.ausha.co/?podcastId=BGKwJUJG8D9mX&v=3',
        height: 220,
      }

      expect(aushaResolveEmbed(value)).toEqual(expected)
    })

    it('should refuse a path on the player host that is not the player', () => {
      const value = 'https://player.ausha.co/ausha-player.js?podcastId=BGKwJUJG8D9m'

      expect(aushaResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('what the frame names, when it names two things', () => {
    it('should take the episode over the show it belongs to', () => {
      const value =
        'https://player.ausha.co/?showId=4qgQzfO219p2&podcastId=YK049s1DdWXX&t=0&v=3&playerId=ausha-vZGt'
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/YK049s1DdWXX',
        src: 'https://player.ausha.co/?podcastId=YK049s1DdWXX&v=3&t=0',
        height: 220,
      }

      expect(aushaResolveEmbed(value)).toEqual(expected)
    })

    it('should fall back to the show where no episode is named', () => {
      const value = 'https://player.ausha.co/?showId=4qgQzfO219p2&multishow=false&v=3'
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'show/4qgQzfO219p2',
        src: 'https://player.ausha.co/?showId=4qgQzfO219p2&v=3',
        height: 220,
      }

      expect(aushaResolveEmbed(value)).toEqual(expected)
    })
  })

  // The vertical layout is the same episode drawn with its cover, 501 tall. The standard player
  // is minted in its place.
  describe('the vertical layout', () => {
    it('should mint the standard player at its height', () => {
      const value =
        'https://player.ausha.co/?podcastId=yknWu4dagvGo&display=vertical&showId=yXGrf5edXR3o&v=3'
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/yknWu4dagvGo',
        src: 'https://player.ausha.co/?podcastId=yknWu4dagvGo&v=3',
        height: 220,
      }

      expect(aushaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('the v2 widget, rebuilt as the v3 player', () => {
    it('should mint the v3 player for the episode the widget names', () => {
      const value =
        'https://widget.ausha.co/index.html?chanId=y8wm8Tlwvv5L&showId=b7z8KuEkzXPd&color=%23D0021B&display=horizontal&v=2&height=200px&autonext=1&podcastId=BGA94HJRGq7R'
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/BGA94HJRGq7R',
        src: 'https://player.ausha.co/?podcastId=BGA94HJRGq7R&v=3',
        height: 220,
      }

      expect(aushaResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the v3 player for a widget naming only its show', () => {
      const value =
        'https://widget.ausha.co/index.html?chanId=y8wm8Tlwvv5L&showId=b7z8KuEkzXPd&display=horizontal&v=2&height=200px&mode=latest'
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'show/b7z8KuEkzXPd',
        src: 'https://player.ausha.co/?showId=b7z8KuEkzXPd&v=3',
        height: 220,
      }

      expect(aushaResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('aushaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, aushaEmbedResolver)

  describe('happy paths', () => {
    it('should take the player out of an iframe', async () => {
      const value = html`
        <iframe
          name="Ausha Podcast Player"
          src="https://player.ausha.co/?podcastId=BGKwJUJG8D9m&amp;v=3"
          height="220"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/BGKwJUJG8D9m',
        src: 'https://player.ausha.co/?podcastId=BGKwJUJG8D9m&v=3',
        height: 220,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // 74 of the 263 player frames in the corpus declare no height at all and size themselves from
    // an inline style, which is what makes the measurement worth carrying.
    it('should supply the height a frame with no box does not state', async () => {
      const value = html`
        <iframe
          src="https://player.ausha.co/?podcastId=BGKwJUJG8D9m&amp;v=3"
          style="border: none; width:100%; height:220px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/BGKwJUJG8D9m',
        src: 'https://player.ausha.co/?podcastId=BGKwJUJG8D9m&v=3',
        height: 220,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/?podcastId=BGKwJUJG8D9m"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  // What Ausha's share dialog writes: the look the publisher picked, the start and the frame id
  // its loader script resizes.
  describe('the query the share dialog wrote', () => {
    it('should keep the start and drop the look', async () => {
      const value = html`
        <iframe
          src="https://player.ausha.co/?showId=b7XnHvGNO9OB&amp;color=%233a7bc7&amp;display=vertical&amp;multishow=false&amp;playlist=false&amp;dark=false&amp;t=0&amp;podcastId=dBDjWc7Y6Pny&amp;v=3&amp;playerId=ausha-Lfpz"
          style="border: none; width: 100%; height: 500px;"
          width=""
          height=""
          frameborder="0"
          name="Ausha Podcast Player"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/dBDjWc7Y6Pny',
        src: 'https://player.ausha.co/?podcastId=dBDjWc7Y6Pny&v=3&t=0',
        height: 220,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the size a publisher states', () => {
    it("should state the player's own height over the carrier box", async () => {
      const value = html`
        <iframe
          src="https://player.ausha.co/?podcastId=BGKwJUJG8D9m&amp;display=vertical&amp;v=3"
          width="100%"
          height="420"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ausha',
        id: 'podcast/BGKwJUJG8D9m',
        src: 'https://player.ausha.co/?podcastId=BGKwJUJG8D9m&v=3',
        height: 220,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// The resolver only reaches a feed through the registered default list, and only an enclosure
// test reaches the path where claiming a media url would cost a reader the audio.
describeForEachParser('ausha through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  // `audio.ausha.co` is where every Ausha feed's episode audio sits, and the file is named with
  // the same twelve characters the player takes as its `podcastId`. Listing `ausha.co` claims
  // that host, so only the check that the frame sits on the player itself keeps the audio.
  it('should claim a player frame the default list reaches', async () => {
    const value = '<iframe src="https://player.ausha.co/?podcastId=BGKwJUJG8D9m&amp;v=3"></iframe>'
    const expected = html`
      <div
        data-embed-id="podcast/BGKwJUJG8D9m"
        data-embed-provider="ausha"
        data-embed-src="https://player.ausha.co/?podcastId=BGKwJUJG8D9m&amp;v=3"
        data-embed-height="220"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave an ausha audio enclosure playable', async () => {
    const enclosures = [{ url: 'https://audio.ausha.co/BGKwJUJG8D9m.mp3?t=1', type: 'audio/mpeg' }]

    const expected = html`
      <audio data-enclosure="" controls src="https://audio.ausha.co/BGKwJUJG8D9m.mp3?t=1"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
