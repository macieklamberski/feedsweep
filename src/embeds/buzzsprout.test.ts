import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  buzzsproutIframeEmbedResolver,
  buzzsproutResolveEmbed,
  buzzsproutScriptEmbedResolver,
} from './buzzsprout.js'

describe('buzzsproutResolveEmbed', () => {
  it('should build the placeholder from an episode player url', () => {
    const value =
      'https://www.buzzsprout.com/1735722/episodes/8166676-mahler-symphony?client_source=small_player&iframe=true'
    const expected: EmbedResolverResult = {
      provider: 'buzzsprout',
      id: '1735722/8166676',
      src: 'https://www.buzzsprout.com/1735722/8166676?iframe=true',
      url: 'https://www.buzzsprout.com/1735722/episodes/8166676',
      height: 200,
    }

    expect(buzzsproutResolveEmbed(new URL(value))).toEqual(expected)
  })

  it('should mint the show player for a show page framed without its player flag', () => {
    const value = 'https://www.buzzsprout.com/1735722'
    const expected: EmbedResolverResult = {
      provider: 'buzzsprout',
      id: '1735722',
      src: 'https://www.buzzsprout.com/1735722?iframe=true',
      url: 'https://www.buzzsprout.com/1735722',
      height: 375,
    }

    expect(buzzsproutResolveEmbed(new URL(value))).toEqual(expected)
  })

  it('should return undefined for a show path under another segment', () => {
    const value = 'https://www.buzzsprout.com/x/1735722?iframe=true'

    expect(buzzsproutResolveEmbed(new URL(value))).toBeUndefined()
  })

  it('should return undefined for a show path that is not a number', () => {
    const value = 'https://www.buzzsprout.com/help?iframe=true'

    expect(buzzsproutResolveEmbed(new URL(value))).toBeUndefined()
  })

  it('should return undefined for a show path with a segment after it', () => {
    const value = 'https://www.buzzsprout.com/1735722/podcast?iframe=true'

    expect(buzzsproutResolveEmbed(new URL(value))).toBeUndefined()
  })

  it('should return undefined for an episode path under another segment', () => {
    const value = 'https://www.buzzsprout.com/x/1735722/8166676'

    expect(buzzsproutResolveEmbed(new URL(value))).toBeUndefined()
  })
})

describeForEachParser('buzzsproutScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, buzzsproutScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the plain script form', async () => {
      const value = html`
        <script
          src="https://www.buzzsprout.com/231452/19565923.js?container_id=buzzsprout-player-19565923&player=small"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'buzzsprout',
        id: '231452/19565923',
        src: 'https://www.buzzsprout.com/231452/19565923?iframe=true',
        url: 'https://www.buzzsprout.com/231452/episodes/19565923',
        height: 200,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the placeholder from the episodes-slug form', async () => {
      const value = html`
        <script
          charset="utf-8"
          src="https://www.buzzsprout.com/42610/episodes/19141080-dreampod-150-mike-tucker.js?container_id=buzzsprout-player-19141080"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'buzzsprout',
        id: '42610/19141080',
        src: 'https://www.buzzsprout.com/42610/19141080?iframe=true',
        url: 'https://www.buzzsprout.com/42610/episodes/19141080',
        height: 200,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('happy paths, show player', () => {
    // The div this script fills is empty, so refusing it deletes the player outright rather than
    // leaving a generic placeholder the way the url-keyed resolver does.
    it('should build the show placeholder from a script naming the podcast alone', async () => {
      const value = html`
        <script
          src="https://www.buzzsprout.com/231452.js?container_id=buzzsprout-large-player&player=large"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'buzzsprout',
        id: '231452',
        src: 'https://www.buzzsprout.com/231452?iframe=true',
        url: 'https://www.buzzsprout.com/231452',
        height: 375,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the tag filter on the show player and drop the rest', async () => {
      const value = html`
        <script
          src="https://www.buzzsprout.com/784577.js?artist=&amp;container_id=buzzsprout-large-player-tags-season-10&amp;player=large&amp;tags=season+10"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'buzzsprout',
        id: '784577',
        src: 'https://www.buzzsprout.com/784577?iframe=true&tags=season%2010',
        url: 'https://www.buzzsprout.com/784577',
        height: 375,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should return undefined for a lookalike host', async () => {
      const value = '<script src="https://buzzsprout.com.evil.test/231452/19565923.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a non-numeric episode segment', async () => {
      const value = '<script src="https://www.buzzsprout.com/231452/about.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for an episode script under another segment', async () => {
      const value = '<script src="https://www.buzzsprout.com/x/231452/19565923.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for an episode path ending in another extension', async () => {
      const value = '<script src="https://www.buzzsprout.com/231452/19565923.json"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a show script under another segment', async () => {
      const value = '<script src="https://www.buzzsprout.com/x/231452.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a show path ending in another extension', async () => {
      const value = '<script src="https://www.buzzsprout.com/231452.json"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('buzzsproutIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, buzzsproutIframeEmbedResolver)

  it('should resolve a direct player iframe to the same placeholder', async () => {
    const value = html`
      <iframe
        src="https://www.buzzsprout.com/1735722/episodes/8166676-mahler-symphony?client_source=small_player&iframe=true"
        width="100%"
        height="200"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'buzzsprout',
      id: '1735722/8166676',
      src: 'https://www.buzzsprout.com/1735722/8166676?iframe=true',
      url: 'https://www.buzzsprout.com/1735722/episodes/8166676',
      height: 200,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should take the episode name off the stated title', async () => {
    const value = html`
      <iframe
        src="https://www.buzzsprout.com/1735722/episodes/8166676-mahler-symphony?client_source=small_player&iframe=true"
        title="How Producers Keep Live Events on Track"
        scrolling="no"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'buzzsprout',
      id: '1735722/8166676',
      src: 'https://www.buzzsprout.com/1735722/8166676?iframe=true',
      url: 'https://www.buzzsprout.com/1735722/episodes/8166676',
      height: 200,
      title: 'How Producers Keep Live Events on Track',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

describeForEachParser('buzzsproutIframeEmbedResolver, show player', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, buzzsproutIframeEmbedResolver)

  it('should resolve the iframe the show script writes', async () => {
    const value = html`
      <iframe
        id="player_iframe"
        src="https://www.buzzsprout.com/2435915?client_source=large_player&iframe=true&referrer=https%3A%2F%2Fwww.buzzsprout.com%2F2435915%2Fpodcast%2Fembed"
        loading="lazy"
        width="100%"
        height="375"
        frameborder="0"
        scrolling="no"
        title="Dermatologist Debriefs"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'buzzsprout',
      id: '2435915',
      src: 'https://www.buzzsprout.com/2435915?iframe=true',
      url: 'https://www.buzzsprout.com/2435915',
      height: 375,
      title: 'Dermatologist Debriefs',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should keep the tag filter of a show iframe and drop the rest', async () => {
    const value = html`
      <iframe
        class="buzz"
        scrolling="no"
        src="https://www.buzzsprout.com/1742444?artist=Gailey+Road+Productions&amp;client_source=large_player&amp;iframe=true&amp;tags=LB"
        title="Gailey Road Productions podcast"
        loading="lazy"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'buzzsprout',
      id: '1742444',
      src: 'https://www.buzzsprout.com/1742444?iframe=true&tags=LB',
      url: 'https://www.buzzsprout.com/1742444',
      height: 375,
      title: 'Gailey Road Productions podcast',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

// The url resolver is offered every enclosure a feed carries, and Buzzsprout serves the episode
// audio on the same host as the episode page, one extension apart.
describeForEachParser('buzzsprout through the pipeline', (parseHtml) => {
  const convert = (enclosures: Array<{ url: string; type: string }>) => {
    return transformContent('<p>Body</p>', {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a buzzsprout audio enclosure playable', async () => {
    const enclosures = [
      { url: 'https://www.buzzsprout.com/231452/9876543-my-episode-title.mp3', type: 'audio/mpeg' },
    ]

    const expected = html`
      <audio
        data-enclosure=""
        controls
        src="https://www.buzzsprout.com/231452/9876543-my-episode-title.mp3"
      ></audio>
      <p>Body</p>
    `

    expect(await convert(enclosures)).toEqualHtml(expected)
  })

  it('should leave the episodes spelling of the enclosure playable too', async () => {
    const enclosures = [
      {
        url: 'https://www.buzzsprout.com/231452/episodes/9876543-my-episode-title.mp3',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio
        data-enclosure=""
        controls
        src="https://www.buzzsprout.com/231452/episodes/9876543-my-episode-title.mp3"
      ></audio>
      <p>Body</p>
    `

    expect(await convert(enclosures)).toEqualHtml(expected)
  })
})
