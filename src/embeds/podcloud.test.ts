import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedRenderHint, EmbedResolverResult } from '../types.js'
import { readIframeResizeHeight } from '../utils/hints.js'
import {
  podcloudIframeEmbedResolver,
  podcloudRenderHint,
  podcloudResolveEmbed,
  podcloudWidgetEmbedResolver,
} from './podcloud.js'

describe('podcloudResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the episode player and page', () => {
      const value =
        'https://podcloud.fr/podcast/danslajungledunumerique/episode/plaider-pour-un-numerique-plus-responsable/player'
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'danslajungledunumerique/plaider-pour-un-numerique-plus-responsable',
        src: 'https://podcloud.fr/podcast/danslajungledunumerique/episode/plaider-pour-un-numerique-plus-responsable/player',
        url: 'https://podcloud.fr/podcast/danslajungledunumerique/episode/plaider-pour-un-numerique-plus-responsable',
      }

      expect(podcloudResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the show player and page', () => {
      const value = 'https://podcloud.fr/podcast/oxymut/player'
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'oxymut',
        src: 'https://podcloud.fr/podcast/oxymut/player',
        url: 'https://podcloud.fr/podcast/oxymut',
      }

      expect(podcloudResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an encoded slug through as written', () => {
      const value = 'https://podcloud.fr/podcast/oxymut/episode/caf%C3%A9-du-matin/player'
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'oxymut/caf%C3%A9-du-matin',
        src: 'https://podcloud.fr/podcast/oxymut/episode/caf%C3%A9-du-matin/player',
        url: 'https://podcloud.fr/podcast/oxymut/episode/caf%C3%A9-du-matin',
      }

      expect(podcloudResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/podcast/oxymut/player'

      expect(podcloudResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a show subdomain, which answers 404 to the player path', () => {
      const value = 'https://oec.podcloud.fr/podcast/oxymut/player'

      expect(podcloudResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route other than podcast', () => {
      const value = 'https://podcloud.fr/zzzword/oxymut/player'

      expect(podcloudResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the show page', () => {
      const value = 'https://podcloud.fr/podcast/oxymut'

      expect(podcloudResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the episode page', () => {
      const value = 'https://podcloud.fr/podcast/oxymut/episode/oxymut-appel-au-casting'

      expect(podcloudResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player under a segment other than episode', () => {
      const value = 'https://podcloud.fr/podcast/oxymut/zzzword/oxymut-appel-au-casting/player'

      expect(podcloudResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('what the mint drops: display options and query', () => {
    it('should fold the fixed-size option onto the player', () => {
      const value =
        'https://podcloud.fr/podcast/danslajungledunumerique/episode/plaider-pour-un-numerique-plus-responsable/player/fixed-size'
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'danslajungledunumerique/plaider-pour-un-numerique-plus-responsable',
        src: 'https://podcloud.fr/podcast/danslajungledunumerique/episode/plaider-pour-un-numerique-plus-responsable/player',
        url: 'https://podcloud.fr/podcast/danslajungledunumerique/episode/plaider-pour-un-numerique-plus-responsable',
      }

      expect(podcloudResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the opened list option onto the show player', () => {
      const value = 'https://podcloud.fr/podcast/backseat/player/list:opened'
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'backseat',
        src: 'https://podcloud.fr/podcast/backseat/player',
        url: 'https://podcloud.fr/podcast/backseat',
      }

      expect(podcloudResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker in the query', () => {
      const value = 'https://podcloud.fr/podcast/oxymut/player?utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'oxymut',
        src: 'https://podcloud.fr/podcast/oxymut/player',
        url: 'https://podcloud.fr/podcast/oxymut',
      }

      expect(podcloudResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('podcloudIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, podcloudIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the episode iframe the embed dialog writes, without its box', async () => {
      const value = html`
        <iframe
          width="100%"
          height="320"
          src="https://podcloud.fr/podcast/les-nuits-de-france-culture/episode/kant-et-la-raison-pure/player"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'les-nuits-de-france-culture/kant-et-la-raison-pure',
        src: 'https://podcloud.fr/podcast/les-nuits-de-france-culture/episode/kant-et-la-raison-pure/player',
        url: 'https://podcloud.fr/podcast/les-nuits-de-france-culture/episode/kant-et-la-raison-pure',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the show name from the title', async () => {
      const value = html`
        <iframe
          title="Oxymut"
          width="100%"
          height="380"
          src="https://podcloud.fr/podcast/oxymut/player"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'oxymut',
        src: 'https://podcloud.fr/podcast/oxymut/player',
        url: 'https://podcloud.fr/podcast/oxymut',
        title: 'Oxymut',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave the help site embed alone', async () => {
      const value = html`
        <iframe
          title="Intégrer un lecteur de podcast sur mon site"
          src="https://aide.podcloud.fr/question/integrer-un-lecteur-de-podcast-sur-mon-site/embed/#?secret=8VkBiaP4i9"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the iframe WordPress writes from an oEmbed discovery', () => {
    it('should drop the secret and keep the episode title', async () => {
      const value = html`
        <iframe
          class="wp-embedded-content"
          sandbox="allow-scripts"
          security="restricted"
          title="Bizarroïd - Saison 1, épisode 1 : Chloé Saffy"
          width="100%"
          height="380"
          src="https://podcloud.fr/podcast/leblogducinema/episode/bizarroid-saison-1-episode-1-chloe-saffy/player#?secret=9UC704JOum"
          data-secret="9UC704JOum"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'leblogducinema/bizarroid-saison-1-episode-1-chloe-saffy',
        src: 'https://podcloud.fr/podcast/leblogducinema/episode/bizarroid-saison-1-episode-1-chloe-saffy/player',
        url: 'https://podcloud.fr/podcast/leblogducinema/episode/bizarroid-saison-1-episode-1-chloe-saffy',
        title: 'Bizarroïd - Saison 1, épisode 1 : Chloé Saffy',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('podcloudWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, podcloudWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should mint the episode player from the show and episode the div names', async () => {
      const value = html`
        <div
          data-podcloud="player"
          data-feed="xv-bras-xv-jambes"
          data-item="festival-rugbimages-colloque-la-melee-au-coeur-du-jeu-et-des-debats"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'podcloud',
        id: 'xv-bras-xv-jambes/festival-rugbimages-colloque-la-melee-au-coeur-du-jeu-et-des-debats',
        src: 'https://podcloud.fr/podcast/xv-bras-xv-jambes/episode/festival-rugbimages-colloque-la-melee-au-coeur-du-jeu-et-des-debats/player',
        url: 'https://podcloud.fr/podcast/xv-bras-xv-jambes/episode/festival-rugbimages-colloque-la-melee-au-coeur-du-jeu-et-des-debats',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a div with a blank show', async () => {
      const value = html`
        <div
          data-podcloud="player"
          data-feed=""
          data-item="festival-rugbimages-colloque-la-melee-au-coeur-du-jeu-et-des-debats"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a div with a blank episode', async () => {
      const value = html`
        <div
          data-podcloud="player"
          data-feed="xv-bras-xv-jambes"
          data-item=""
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the subscribe button alone', async () => {
      const value = html`
        <div
          data-podcloud="subscribe"
          data-feed="xv-bras-xv-jambes"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('podcloudRenderHint', () => {
  it('should read the height the player posts from podcloud.fr', () => {
    const expected: EmbedRenderHint = {
      provider: 'podcloud',
      origin: 'https://podcloud.fr',
      readHeight: readIframeResizeHeight,
    }

    expect(podcloudRenderHint).toEqual(expected)
  })

  // Captured in Chrome from an episode player framed 300 pixels wide on a foreign origin.
  it('should read the height out of the resize message the player posts', () => {
    const value =
      '{"src":"https://podcloud.fr/podcast/danslajungledunumerique/episode/plaider-pour-un-numerique-plus-responsable/player","context":"iframe.resize","height":420}'

    expect(podcloudRenderHint.readHeight?.(value)).toBe(420)
  })
})

describeForEachParser('podcloud through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should drop the declared box and the resize helper beside the episode player', async () => {
    const value = html`
      <iframe
        width="100%"
        height="320"
        src="https://podcloud.fr/podcast/les-nuits-de-france-culture/episode/kant-et-la-raison-pure/player"
        frameborder="0"
      ></iframe>
      <script src="https://podcloud.fr/player-embed/helper.js"></script>
    `
    const expected = html`
      <div
        data-embed-url="https://podcloud.fr/podcast/les-nuits-de-france-culture/episode/kant-et-la-raison-pure"
        data-embed-id="les-nuits-de-france-culture/kant-et-la-raison-pure"
        data-embed-provider="podcloud"
        data-embed-src="https://podcloud.fr/podcast/les-nuits-de-france-culture/episode/kant-et-la-raison-pure/player"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn the div platform.js would fill into the player', async () => {
    const value = html`
      <p>Avant</p>
      <script src="https://podcloud.fr/api/v1/platform.js"></script>
      <div
        data-podcloud="player"
        data-feed="xv-bras-xv-jambes"
        data-item="festival-rugbimages"
      ></div>
    `
    const expected = html`
      <p>Avant</p>
      <div
        data-embed-url="https://podcloud.fr/podcast/xv-bras-xv-jambes/episode/festival-rugbimages"
        data-embed-id="xv-bras-xv-jambes/festival-rugbimages"
        data-embed-provider="podcloud"
        data-embed-src="https://podcloud.fr/podcast/xv-bras-xv-jambes/episode/festival-rugbimages/player"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a podcloud audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://stats.podcloud.fr/oxymut/oxymut-appel-au-casting/enclosure.3d7b655e.mp3?p=f',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio
        data-enclosure=""
        controls
        src="https://stats.podcloud.fr/oxymut/oxymut-appel-au-casting/enclosure.3d7b655e.mp3?p=f"
      ></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
