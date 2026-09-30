import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { podigeeResolveEmbed, podigeeScriptEmbedResolver, readPodigeeHeight } from './podigee.js'

describeForEachParser('podigeeScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, podigeeScriptEmbedResolver)

  const script = (configuration: string) =>
    `<script class="podigee-podcast-player" src="https://player.podigee-cdn.net/podcast-player/javascripts/podigee-podcast-player.js" data-configuration="${configuration}"></script>`

  describe('happy paths', () => {
    // The loader's data-configuration is the player url itself, so nothing needs executing.
    it('should take the player url from data-configuration', async () => {
      const value = script('https://theshow.podigee.io/42-an-episode/embed?context=external')
      const expected: EmbedResolverResult = {
        provider: 'podigee',
        id: 'theshow/42-an-episode',
        src: 'https://theshow.podigee.io/42-an-episode/embed?context=external',
        height: 145,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the token the embed code carries', async () => {
      const value = script(
        'https://redfield.podigee.io/183-r-183-mit-michaela-schneider-ceo-von-allgaeu-concerts/embed?context=external&amp;token=j0d6cKXw8sAaSGMikUmG5A',
      )
      const expected: EmbedResolverResult = {
        provider: 'podigee',
        id: 'redfield/183-r-183-mit-michaela-schneider-ceo-von-allgaeu-concerts',
        src: 'https://redfield.podigee.io/183-r-183-mit-michaela-schneider-ceo-von-allgaeu-concerts/embed?context=external&token=j0d6cKXw8sAaSGMikUmG5A',
        height: 145,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the campaign source from the player url', async () => {
      const value = script(
        'https://theshow.podigee.io/42-an-episode/embed?context=external&amp;source=spring-campaign',
      )
      const expected: EmbedResolverResult = {
        provider: 'podigee',
        id: 'theshow/42-an-episode',
        src: 'https://theshow.podigee.io/42-an-episode/embed?context=external',
        height: 145,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a podigee url naming no episode', async () => {
      const value = script('https://theshow.podigee.io/')

      expect(await extract(value)).toBeUndefined()
    })

    // 14 of 100 corpus feeds point the attribute at an inline config object instead of a url.
    it('should ignore an inline configuration reference', async () => {
      expect(await extract(script('podigee'))).toBeUndefined()
      expect(await extract(script('playerConfiguration'))).toBeUndefined()
    })

    it('should ignore a foreign host carrying the player path', async () => {
      const value = script('https://evil.test/42-an-episode/embed?context=external')

      expect(await extract(value)).toBeUndefined()
    })

    // Neither host serves a player: a show subdomain on either has no DNS record, and the
    // player path answers 404 on www.podigee.com and player.podigee-cdn.net.
    const nonPlayerHostUrls: Array<string> = [
      'https://www.podigee.com/72-an-episode/embed',
      'https://player.podigee-cdn.net/72-an-episode/embed',
    ]

    it.each(nonPlayerHostUrls)('should ignore %s', async (value) => {
      expect(await extract(script(value))).toBeUndefined()
    })
  })
})

describe('podigeeResolveEmbed', () => {
  // The episode page is not the player: it redirects to the show's own site, so a carrier
  // framing it shows an article. `/embed` under the same path names the player.
  const episodePageUrls: Array<string> = [
    'https://cloudonaut.podigee.io/72-serverless-and-devops-a-match',
    'https://cloudonaut.podigee.io/72-serverless-and-devops-a-match/embed',
  ]

  it.each(episodePageUrls)('should mint the player url from %s', (value) => {
    const expected: EmbedResolverResult = {
      provider: 'podigee',
      id: 'cloudonaut/72-serverless-and-devops-a-match',
      src: 'https://cloudonaut.podigee.io/72-serverless-and-devops-a-match/embed?context=external',
      height: 145,
    }

    expect(podigeeResolveEmbed(value)).toEqual(expected)
  })

  it('should read a show whose subdomain carries digits', () => {
    const value = 'https://diepresse1848.podigee.io/100-neue-episode'
    const expected: EmbedResolverResult = {
      provider: 'podigee',
      id: 'diepresse1848/100-neue-episode',
      src: 'https://diepresse1848.podigee.io/100-neue-episode/embed?context=external',
      height: 145,
    }

    expect(podigeeResolveEmbed(value)).toEqual(expected)
  })

  it('should read a show whose subdomain carries hyphens', () => {
    const value =
      'https://digitalisierung-erfolgreich-gestalten.podigee.io/28-digitalisierung-in-der-finanzwirtschaft-mit-sascha-rabe/embed?context=external'
    const expected: EmbedResolverResult = {
      provider: 'podigee',
      id: 'digitalisierung-erfolgreich-gestalten/28-digitalisierung-in-der-finanzwirtschaft-mit-sascha-rabe',
      src: value,
      height: 145,
    }

    expect(podigeeResolveEmbed(value)).toEqual(expected)
  })

  // The company site sits on the show domain under www, and its paths can open with a number.
  it('should return undefined for the www host', () => {
    const value = 'https://www.podigee.io/2024-pricing-update'

    expect(podigeeResolveEmbed(value)).toBeUndefined()
  })

  it('should return undefined for an unnumbered episode with a number inside its slug', () => {
    const value = 'https://cloudonaut.podigee.io/season-2-trailer'

    expect(podigeeResolveEmbed(value)).toBeUndefined()
  })

  it('should mint the embed code url over a player url carrying other parameters', () => {
    const value =
      'https://cloudonaut.podigee.io/72-an-episode/embed?context=external&utm_source=feed'
    const expected: EmbedResolverResult = {
      provider: 'podigee',
      id: 'cloudonaut/72-an-episode',
      src: 'https://cloudonaut.podigee.io/72-an-episode/embed?context=external',
      height: 145,
    }

    expect(podigeeResolveEmbed(value)).toEqual(expected)
  })

  // A `/embed` suffix names the player outright, so the episode needs no number.
  it('should accept an unnumbered episode that already names the player', () => {
    const value = 'https://cloudonaut.podigee.io/an-unnumbered-episode/embed'
    const expected: EmbedResolverResult = {
      provider: 'podigee',
      id: 'cloudonaut/an-unnumbered-episode',
      src: 'https://cloudonaut.podigee.io/an-unnumbered-episode/embed?context=external',
      height: 145,
    }

    expect(podigeeResolveEmbed(value)).toEqual(expected)
  })

  // With anything after `embed` the show serves its website page rather than the player, and the
  // leading segment here is unnumbered, so there is nothing to mint from either.
  it('should return undefined when embed is not the last segment', () => {
    const value = 'https://cloudonaut.podigee.io/an-episode/embed/extra'

    expect(podigeeResolveEmbed(value)).toBeUndefined()
  })

  // A numbered episode still resolves: the trailing junk is dropped with the rebuilt src.
  it('should rebuild the player when a numbered episode carries segments after embed', () => {
    const value = 'https://cloudonaut.podigee.io/72-an-episode/embed/extra'
    const expected: EmbedResolverResult = {
      provider: 'podigee',
      id: 'cloudonaut/72-an-episode',
      src: 'https://cloudonaut.podigee.io/72-an-episode/embed?context=external',
      height: 145,
    }

    expect(podigeeResolveEmbed(value)).toEqual(expected)
  })

  describe('hosts that are not a show', () => {
    // The CDN hosts serve the player's assets and the episode audio. An enclosure read as an
    // episode would replace a playable audio element with a placeholder pointing at nothing.
    const cdnAndCompanyUrls: Array<string> = [
      'https://audio.podigee-cdn.net/2445300-m-a549c8ece885f4e7f31909676891fae8.mp3?source=feed',
      'https://main.podigee-cdn.net/uploads/u123/456-episode.mp3',
      'https://player.podigee-cdn.net/podcast-player/podigee-podcast-player.html',
      'https://www.podigee.com/2024-pricing-update',
    ]

    it.each(cdnAndCompanyUrls)('should return undefined for %s', (value) => {
      expect(podigeeResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('sad paths', () => {
    // The other two paths a show serves. Every episode segment carries its number and neither
    // of these does, which is what separates them.
    const nonEpisodeUrls: Array<string> = [
      'https://cloudonaut.podigee.io/feed/mp3',
      'https://cloudonaut.podigee.io/',
      'https://cloudonaut.podigee.io/about-the-show',
      'https://example.com/72-not-podigee',
    ]

    it.each(nonEpisodeUrls)('should return undefined for %s', (value) => {
      expect(podigeeResolveEmbed(value)).toBeUndefined()
    })
  })
})

// The resolver only reaches a feed through the registered default list, and only an enclosure
// test reaches the path where claiming a media url would cost a reader the audio.
describeForEachParser('podigee through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim an episode page framed as an embed', async () => {
    const value = '<iframe src="https://cloudonaut.podigee.io/72-an-episode"></iframe>'

    const expected = html`
      <div
        data-embed-id="cloudonaut/72-an-episode"
        data-embed-provider="podigee"
        data-embed-src="https://cloudonaut.podigee.io/72-an-episode/embed?context=external"
        data-embed-height="145"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a podigee audio enclosure playable', async () => {
    const enclosures = [
      { url: 'https://audio.podigee-cdn.net/2445300-m-a549c8ece.mp3', type: 'audio/mpeg' },
    ]

    const expected = html`
      <audio data-enclosure="" controls src="https://audio.podigee-cdn.net/2445300-m-a549c8ece.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})

describe('readPodigeeHeight', () => {
  it('should read the height out of the player configuration', () => {
    const value = {
      listenTo: 'configurePlayer',
      height: 144.812,
      title: 'Podcast player for episode "Scheiden tut weh - entscheiden auch".',
    }

    expect(readPodigeeHeight(value)).toBe(144.812)
  })

  it('should read nothing before the player has rendered', () => {
    const value = { listenTo: 'configurePlayer', height: 0, title: 'Podcast player' }

    expect(readPodigeeHeight(value)).toBeUndefined()
    expect(readPodigeeHeight({ listenTo: 'loadSubscribeButton' })).toBeUndefined()
  })
})
