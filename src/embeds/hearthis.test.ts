import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { hearthisEmbedResolver, hearthisResolveEmbed } from './hearthis.js'

describe('hearthisResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the track player from the embed dialog url without its display settings', () => {
      const value =
        'https://app.hearthis.at/embed/14462056/transparent/?hcolor=&color=&style=2&block_size=2&block_space=1&background=1&waveform=0&cover=0&autoplay=0&css='
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'track/14462056',
        src: 'https://app.hearthis.at/embed/14462056/',
        height: 150,
      }

      expect(hearthisResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the track player from the dark theme on the main host', () => {
      const value = 'https://hearthis.at/embed/43067/transparent_black/'
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'track/43067',
        src: 'https://app.hearthis.at/embed/43067/',
        height: 150,
      }

      expect(hearthisResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the track player from a url with no theme segment', () => {
      const value = 'https://hearthis.at/embed/43067/'
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'track/43067',
        src: 'https://app.hearthis.at/embed/43067/',
        height: 150,
      }

      expect(hearthisResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the autoplay the publisher switched on', () => {
      const value = 'https://app.hearthis.at/embed/14462056/transparent/?autoplay=1'
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'track/14462056',
        src: 'https://app.hearthis.at/embed/14462056/',
        height: 150,
      }

      expect(hearthisResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the set player from the set and user pair', () => {
      const value =
        'https://app.hearthis.at/set/102394-9149715/embed/?hcolor=12e84b&autoplay=0&css='
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'set/102394',
        src: 'https://app.hearthis.at/set/102394/embed/',
        height: 350,
      }

      expect(hearthisResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the set player from the bare set id the embed dialog writes', () => {
      const value = 'https://hearthis.at/set/418439/embed/'
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'set/418439',
        src: 'https://app.hearthis.at/set/418439/embed/',
        height: 350,
      }

      expect(hearthisResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the track route', () => {
      const value = 'https://evil.test/embed/43067/transparent/'

      expect(hearthisResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a track page', () => {
      const value =
        'https://hearthis.at/conrad.mildner/die-abspanner-8-godzilla-edge-of-tomorrow-xmen/'

      expect(hearthisResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the track route below another segment', () => {
      const value = 'https://hearthis.at/conrad.mildner/embed/43067/'

      expect(hearthisResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the embed route naming no track', () => {
      const value = 'https://hearthis.at/embed/'

      expect(hearthisResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the set route naming no set', () => {
      const value = 'https://hearthis.at/set/'

      expect(hearthisResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player segments under a route word that is not set', () => {
      const value = 'https://hearthis.at/playlist/418439/embed/'

      expect(hearthisResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a set route that is not the player', () => {
      const value = 'https://hearthis.at/set/418439-8790044/'

      expect(hearthisResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a set player going on past the embed segment', () => {
      const value = 'https://hearthis.at/set/418439-8790044/embed/oAj31/'

      expect(hearthisResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the route words in any case, as the server does', () => {
      const value = 'https://app.hearthis.at/EMBED/43067/'
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'track/43067',
        src: 'https://app.hearthis.at/embed/43067/',
        height: 150,
      }

      expect(hearthisResolveEmbed(value)).toEqual(expected)
    })

    it('should read the set route word in any case', () => {
      const value = 'https://app.hearthis.at/SET/418439/EMBED/'
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'set/418439',
        src: 'https://app.hearthis.at/set/418439/embed/',
        height: 350,
      }

      expect(hearthisResolveEmbed(value)).toEqual(expected)
    })

    it('should pass a track id through as written', () => {
      const value = 'https://hearthis.at/embed/abc_43067/'
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'track/abc_43067',
        src: 'https://app.hearthis.at/embed/abc_43067/',
        height: 150,
      }

      expect(hearthisResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('hearthisEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, hearthisEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the track iframe the embed dialog writes', async () => {
      const value = html`
        <iframe
          allowtransparency=""
          frameborder="0"
          height="130"
          id="hearthis_at_track_609376"
          scrolling="no"
          src="https://hearthis.at/embed/609376/transparent/?hcolor=&amp;color=&amp;style=2&amp;block_size=1&amp;block_space=1&amp;background=0&amp;waveform=0&amp;cover=0&amp;autoplay=0&amp;css="
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'hearthis',
        id: 'track/609376',
        src: 'https://app.hearthis.at/embed/609376/',
        height: 150,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the track route', async () => {
      const value = '<iframe src="https://evil.test/embed/43067/transparent/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('hearthis through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should resolve a protocol-relative track iframe once the pipeline absolutises it', async () => {
    const value = '<iframe src="//hearthis.at/embed/43067/transparent_black/"></iframe>'
    const expected = html`
      <div
        data-embed-id="track/43067"
        data-embed-provider="hearthis"
        data-embed-src="https://app.hearthis.at/embed/43067/"
        data-embed-height="150"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a hearthis audio enclosure playable', async () => {
    const enclosures = [
      { url: 'https://hearthis.at/waxsnacks/lgwep8/stream.mp3', type: 'audio/mpeg' },
    ]
    const expected = html`
      <audio data-enclosure="" controls src="https://hearthis.at/waxsnacks/lgwep8/stream.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
