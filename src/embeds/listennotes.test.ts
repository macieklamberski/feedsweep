import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { listennotesEmbedResolver, listennotesResolveEmbed } from './listennotes.js'

describe('listennotesResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the podcast player from the podcast embed url', () => {
      const value =
        'https://www.listennotes.com/podcasts/song-exploder-hrishikesh-hirway-Ut3fuw2xdYv/embed/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'podcast/Ut3fuw2xdYv',
        src: 'https://www.listennotes.com/podcasts/song-exploder-hrishikesh-hirway-Ut3fuw2xdYv/embed/',
        url: 'https://www.listennotes.com/podcasts/song-exploder-hrishikesh-hirway-Ut3fuw2xdYv/',
        height: 600,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the episode player from the episode embed url', () => {
      const value =
        'https://www.listennotes.com/podcasts/nokia-chronicles/david-wood-symbian-psion-XGD3Cq8pn9j/embed/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'episode/XGD3Cq8pn9j',
        src: 'https://www.listennotes.com/podcasts/nokia-chronicles/david-wood-symbian-psion-XGD3Cq8pn9j/embed/',
        url: 'https://www.listennotes.com/podcasts/nokia-chronicles/david-wood-symbian-psion-XGD3Cq8pn9j/',
        height: 180,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the episode player on the hex id route', () => {
      const value = 'https://www.listennotes.com/embedded/e/698f97a6d5eb47e0a2ebbfa52b008065/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'episode/698f97a6d5eb47e0a2ebbfa52b008065',
        src: 'https://www.listennotes.com/embedded/e/698f97a6d5eb47e0a2ebbfa52b008065/',
        url: 'https://www.listennotes.com/e/698f97a6d5eb47e0a2ebbfa52b008065/',
        height: 180,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the clip player from the clip embed url', () => {
      const value =
        'https://www.listennotes.com/podcast-clips/cm-113-priya-parker-on-designing-better-meetings--QRZ_agez1A/embed/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'clip/-QRZ_agez1A',
        src: 'https://www.listennotes.com/podcast-clips/cm-113-priya-parker-on-designing-better-meetings--QRZ_agez1A/embed/',
        url: 'https://www.listennotes.com/podcast-clips/cm-113-priya-parker-on-designing-better-meetings--QRZ_agez1A/',
        height: 300,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should move a clip on the older route onto the current one', () => {
      const value =
        'https://www.listennotes.com/clips/cm-113-priya-parker-on-designing-better-meetings--QRZ_agez1A/embed/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'clip/-QRZ_agez1A',
        src: 'https://www.listennotes.com/podcast-clips/cm-113-priya-parker-on-designing-better-meetings--QRZ_agez1A/embed/',
        url: 'https://www.listennotes.com/podcast-clips/cm-113-priya-parker-on-designing-better-meetings--QRZ_agez1A/',
        height: 300,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the playlist player listing podcasts without its sort order', () => {
      const value =
        'https://www.listennotes.com/listen/ukraine-war-podcasts-tHhD6dlXSo8/podcasts/embed/?sort_type=recent_published_first'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'playlist/tHhD6dlXSo8',
        src: 'https://www.listennotes.com/listen/ukraine-war-podcasts-tHhD6dlXSo8/podcasts/embed/',
        url: 'https://www.listennotes.com/playlists/ukraine-war-podcasts-tHhD6dlXSo8/podcasts/',
        height: 600,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the playlist player listing episodes', () => {
      const value =
        'https://www.listennotes.com/listen/%E5%99%A2%E5%A6%88%E5%A6%88-2021%E5%B9%B4%E7%9A%84%E5%8D%81%E6%9C%AC%E5%A5%B3%E6%80%A7%E4%B9%A6%E7%B1%8D-Samdc4RzxX3/episodes/embed/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'playlist/Samdc4RzxX3',
        src: 'https://www.listennotes.com/listen/%E5%99%A2%E5%A6%88%E5%A6%88-2021%E5%B9%B4%E7%9A%84%E5%8D%81%E6%9C%AC%E5%A5%B3%E6%80%A7%E4%B9%A6%E7%B1%8D-Samdc4RzxX3/episodes/embed/',
        url: 'https://www.listennotes.com/playlists/%E5%99%A2%E5%A6%88%E5%A6%88-2021%E5%B9%B4%E7%9A%84%E5%8D%81%E6%9C%AC%E5%A5%B3%E6%80%A7%E4%B9%A6%E7%B1%8D-Samdc4RzxX3/episodes/',
        height: 600,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the podcast route', () => {
      const value = 'https://evil.test/podcasts/song-exploder-hrishikesh-hirway-Ut3fuw2xdYv/embed/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a podcast page', () => {
      const value = 'https://www.listennotes.com/podcasts/switched-on-pop-vulture-YAyMJOkLo-7/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for an episode page', () => {
      const value =
        'https://www.listennotes.com/podcasts/nokia-chronicles/david-wood-symbian-psion-XGD3Cq8pn9j/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a playlist page', () => {
      const value = 'https://www.listennotes.com/listen/altacities-ulimv5yN7ZW/podcasts/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the hex route naming no episode', () => {
      const value = 'https://www.listennotes.com/embedded/e/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a hex id under another route word', () => {
      const value = 'https://www.listennotes.com/embedded/x/698f97a6d5eb47e0a2ebbfa52b008065/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the hex id under another first route word', () => {
      const value = 'https://www.listennotes.com/shared/e/698f97a6d5eb47e0a2ebbfa52b008065/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player segments under a route word that is not a player', () => {
      const value =
        'https://www.listennotes.com/channels/switched-on-pop-vulture-YAyMJOkLo-7/embed/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment with no short id after a hyphen', () => {
      const value = 'https://www.listennotes.com/podcasts/songexploder/embed/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a route word in another case, which the server answers 404', () => {
      const value =
        'https://www.listennotes.com/PODCASTS/nokia-chronicles/david-wood-symbian-psion-XGD3Cq8pn9j/embed/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a leading segment that is not a locale', () => {
      const value =
        'https://www.listennotes.com/abc/podcasts/nokia-chronicles/david-wood-symbian-psion-XGD3Cq8pn9j/embed/'

      expect(listennotesResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should drop the locale opening the episode route', () => {
      const value =
        'https://www.listennotes.com/fr/podcasts/le-bulleur/le-bulleur-pr%C3%A9sente-l7X8Jt3oiZ1/embed/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'episode/l7X8Jt3oiZ1',
        src: 'https://www.listennotes.com/podcasts/le-bulleur/le-bulleur-pr%C3%A9sente-l7X8Jt3oiZ1/embed/',
        url: 'https://www.listennotes.com/podcasts/le-bulleur/le-bulleur-pr%C3%A9sente-l7X8Jt3oiZ1/',
        height: 180,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a locale with a script subtag opening the hex route', () => {
      const value =
        'https://www.listennotes.com/zh-hant/embedded/e/77b8e0f907f945a29a64f0ef7c43c822/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'episode/77b8e0f907f945a29a64f0ef7c43c822',
        src: 'https://www.listennotes.com/embedded/e/77b8e0f907f945a29a64f0ef7c43c822/',
        url: 'https://www.listennotes.com/e/77b8e0f907f945a29a64f0ef7c43c822/',
        height: 180,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should read a short id holding a hyphen of its own', () => {
      const value = 'https://www.listennotes.com/podcasts/chayil-boss-preye-ombu-8-Y3d15vBA2/embed/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'podcast/8-Y3d15vBA2',
        src: 'https://www.listennotes.com/podcasts/chayil-boss-preye-ombu-8-Y3d15vBA2/embed/',
        url: 'https://www.listennotes.com/podcasts/chayil-boss-preye-ombu-8-Y3d15vBA2/',
        height: 600,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the tracking parameter a publisher appended', () => {
      const value =
        'https://www.listennotes.com/podcasts/the-brighton-parkast/jj-allaire-open-source-JyKXirZS4nc/embed/?ref=paradoxpairs.com'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'episode/JyKXirZS4nc',
        src: 'https://www.listennotes.com/podcasts/the-brighton-parkast/jj-allaire-open-source-JyKXirZS4nc/embed/',
        url: 'https://www.listennotes.com/podcasts/the-brighton-parkast/jj-allaire-open-source-JyKXirZS4nc/',
        height: 180,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the secret hash a WordPress oEmbed iframe carries', () => {
      const value =
        'https://www.listennotes.com/podcasts/na-het-applaus/rijnmond-big-band-show-maar-7rAmdhfoxbl/embed/#?secret=sGUUoUmeUf'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'episode/7rAmdhfoxbl',
        src: 'https://www.listennotes.com/podcasts/na-het-applaus/rijnmond-big-band-show-maar-7rAmdhfoxbl/embed/',
        url: 'https://www.listennotes.com/podcasts/na-het-applaus/rijnmond-big-band-show-maar-7rAmdhfoxbl/',
        height: 180,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })

    it('should pass a short id the platform never issued through as written', () => {
      const value = 'https://www.listennotes.com/podcasts/x/y-ZZZZZZZZZZZ/embed/'
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'episode/ZZZZZZZZZZZ',
        src: 'https://www.listennotes.com/podcasts/x/y-ZZZZZZZZZZZ/embed/',
        url: 'https://www.listennotes.com/podcasts/x/y-ZZZZZZZZZZZ/',
        height: 180,
      }

      expect(listennotesResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('listennotesEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, listennotesEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the podcast iframe the embed dialog writes at the platform height', async () => {
      const value = html`
        <iframe
          src="https://www.listennotes.com/podcasts/switched-on-pop-vulture-YAyMJOkLo-7/embed/"
          height="600px"
          width="100%"
          style="width: 1px; min-width: 100%;"
          loading="lazy"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'podcast/YAyMJOkLo-7',
        src: 'https://www.listennotes.com/podcasts/switched-on-pop-vulture-YAyMJOkLo-7/embed/',
        url: 'https://www.listennotes.com/podcasts/switched-on-pop-vulture-YAyMJOkLo-7/',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the hex episode iframe at the episode height, not its stated 140', async () => {
      const value = html`
        <iframe
          loading="lazy"
          style="width: 1px; min-width: 100%;"
          src="https://www.listennotes.com/embedded/e/a78f04d48e2f45fcbd4b6b41af4aff35/"
          width="100%"
          height="140px"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'episode/a78f04d48e2f45fcbd4b6b41af4aff35',
        src: 'https://www.listennotes.com/embedded/e/a78f04d48e2f45fcbd4b6b41af4aff35/',
        url: 'https://www.listennotes.com/e/a78f04d48e2f45fcbd4b6b41af4aff35/',
        height: 180,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title a WordPress oEmbed iframe states', async () => {
      const value = html`
        <iframe
          class="wp-embedded-content"
          title="Rijnmond Big Band Show"
          src="https://www.listennotes.com/podcasts/na-het-applaus/rijnmond-big-band-show-maar-7rAmdhfoxbl/embed/#?secret=sGUUoUmeUf"
          width="400"
          height="180"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'listennotes',
        id: 'episode/7rAmdhfoxbl',
        src: 'https://www.listennotes.com/podcasts/na-het-applaus/rijnmond-big-band-show-maar-7rAmdhfoxbl/embed/',
        url: 'https://www.listennotes.com/podcasts/na-het-applaus/rijnmond-big-band-show-maar-7rAmdhfoxbl/',
        height: 180,
        title: 'Rijnmond Big Band Show',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the episode route', async () => {
      const value =
        '<iframe src="https://evil.test/podcasts/nokia-chronicles/david-wood-symbian-psion-XGD3Cq8pn9j/embed/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('listennotes through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim the hex episode iframe at the episode height', async () => {
    const value = html`
      <iframe
        src="https://www.listennotes.com/embedded/e/a78f04d48e2f45fcbd4b6b41af4aff35/"
        width="100%"
        height="140px"
        frameborder="0"
        scrolling="no"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="180"
        data-embed-url="https://www.listennotes.com/e/a78f04d48e2f45fcbd4b6b41af4aff35/"
        data-embed-id="episode/a78f04d48e2f45fcbd4b6b41af4aff35"
        data-embed-provider="listennotes"
        data-embed-src="https://www.listennotes.com/embedded/e/a78f04d48e2f45fcbd4b6b41af4aff35/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a listennotes audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://audio.listennotes.com/e/p/0447ec4ff1c346c4962c0e5098281b68/',
        type: 'audio/mpeg',
      },
    ]
    const expected = html`
      <audio data-enclosure="" controls src="https://audio.listennotes.com/e/p/0447ec4ff1c346c4962c0e5098281b68/"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
