import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { canaluEmbedResolver, canaluResolveEmbed } from './canalu.js'

describe('canaluResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player the embed dialog writes', () => {
      const value = 'https://www.canal-u.tv/chaines/univ-bordeaux/embed/150235?t=0'
      const expected: EmbedResolverResult = {
        provider: 'canalu',
        id: '150235',
        src: 'https://www.canal-u.tv/chaines/univ-bordeaux/embed/150235?t=0',
        ratio: '16/9',
      }

      expect(canaluResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position and drop a tracker', () => {
      const value = 'https://www.canal-u.tv/chaines/riate/embed/178629?t=120&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'canalu',
        id: '178629',
        src: 'https://www.canal-u.tv/chaines/riate/embed/178629?t=120',
        ratio: '16/9',
      }

      expect(canaluResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a start position the publisher wrote with the size glued on', () => {
      const value =
        'https://www.canal-u.tv/chaines/ut2j/embed/177362?t=0width=100%&ampampheight=100%'
      const expected: EmbedResolverResult = {
        provider: 'canalu',
        id: '177362',
        src: 'https://www.canal-u.tv/chaines/ut2j/embed/177362?t=0width%3D100%25',
        ratio: '16/9',
      }

      expect(canaluResolveEmbed(value)).toEqual(expected)
    })

    it('should mint no query when the carrier has none', () => {
      const value = 'https://www.canal-u.tv/chaines/carrefours-innovation-inrae/embed/177369'
      const expected: EmbedResolverResult = {
        provider: 'canalu',
        id: '177369',
        src: 'https://www.canal-u.tv/chaines/carrefours-innovation-inrae/embed/177369',
        ratio: '16/9',
      }

      expect(canaluResolveEmbed(value)).toEqual(expected)
    })

    it('should read the route words in any case and keep the channel as written', () => {
      const value = 'https://www.canal-u.tv/CHAINES/univ-bordeaux/EMBED/150235?t=0'
      const expected: EmbedResolverResult = {
        provider: 'canalu',
        id: '150235',
        src: 'https://www.canal-u.tv/chaines/univ-bordeaux/embed/150235?t=0',
        ratio: '16/9',
      }

      expect(canaluResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/chaines/ut2j/embed/170208?t=0'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the video host', () => {
      const value = 'https://vod.canal-u.tv/chaines/ut2j/embed/170208'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://www.canal-u.tv/x/chaines/ut2j/embed/170208'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://www.canal-u.tv/chaines/ut2j/embed/170208/extra'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an embed path under another first route word', () => {
      const value = 'https://www.canal-u.tv/x/ut2j/embed/170208'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a channel path that is not an embed', () => {
      const value = 'https://www.canal-u.tv/chaines/ut2j/x/170208'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('shapes left to the generic fallback', () => {
    it('should ignore the video page', () => {
      const value =
        'https://www.canal-u.tv/chaines/univ-bordeaux/externalisation-de-l-activite-dans-l-agriculture-de-l-opportunite-migratoire'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route with no channel', () => {
      const value = 'https://www.canal-u.tv/embed/117403?t=0'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the legacy player, whose id is not the node id', () => {
      const value =
        'https://www.canal-u.tv/video/eduscol/embed.1/ouverture_du_pnf_numerique_14_15_octobre_2015.19758?width=100%&height=100%'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the audio file of a video', () => {
      const value = 'https://www.canal-u.tv/media/95844/ressource/podcast'

      expect(canaluResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('canaluEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, canaluEmbedResolver)

  describe('happy paths', () => {
    it('should claim the iframe the embed dialog writes', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://www.canal-u.tv/chaines/univ-bordeaux/embed/150235?t=0"
          width="560"
          height="315"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'canalu',
        id: '150235',
        src: 'https://www.canal-u.tv/chaines/univ-bordeaux/embed/150235?t=0',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/chaines/ut2j/embed/170208?t=0"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('canalu player through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should state the player ratio over the declared box', async () => {
    const value = html`
      <iframe
        loading="lazy"
        width="1000"
        height="562"
        src="https://www.canal-u.tv/chaines/ut2j/embed/177362?t=0width=100%&amp;ampampheight=100%"
        frameborder="0"
        scrolling="no"
        allowfullscreen="allowfullscreen"
        data-aspectratio="0.5625"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="177362"
        data-embed-provider="canalu"
        data-embed-src="https://www.canal-u.tv/chaines/ut2j/embed/177362?t=0width%3D100%25"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a canal-u audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://www.canal-u.tv/media/95844/ressource/podcast',
        type: 'audio/mpeg',
      },
    ]
    const expected = html`
      <audio data-enclosure="" controls src="https://www.canal-u.tv/media/95844/ressource/podcast"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
