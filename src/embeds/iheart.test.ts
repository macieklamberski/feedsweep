import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { iheartEmbedResolver, iheartResolveEmbed } from './iheart.js'

describe('iheartResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the episode player from the bare ids', () => {
      const value = 'https://www.iheart.com/podcast/84297824/episode/87767164/?embed=true'
      const expected: EmbedResolverResult = {
        provider: 'iheart',
        id: '84297824/87767164',
        src: 'https://www.iheart.com/podcast/84297824/episode/87767164/?embed=true',
        url: 'https://www.iheart.com/podcast/84297824/episode/87767164/',
        height: 200,
      }

      expect(iheartResolveEmbed(value)).toEqual(expected)
    })

    it('should take the ids out of the slugged segments', () => {
      const value =
        'https://www.iheart.com/podcast/1119-people-every-day-76003809/episode/linda-evangelistas-cosmetic-procedure-nightmare-92987656/?embed=true'
      const expected: EmbedResolverResult = {
        provider: 'iheart',
        id: '76003809/92987656',
        src: 'https://www.iheart.com/podcast/76003809/episode/92987656/?embed=true',
        url: 'https://www.iheart.com/podcast/76003809/episode/92987656/',
        height: 200,
      }

      expect(iheartResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the attribution the publisher wrote', () => {
      const value =
        'https://www.iheart.com/podcast/24837940/episode/337745026/?embed=true&pname=newstalkzb_web&sc=podcast_episode_embed'
      const expected: EmbedResolverResult = {
        provider: 'iheart',
        id: '24837940/337745026',
        src: 'https://www.iheart.com/podcast/24837940/episode/337745026/?embed=true',
        url: 'https://www.iheart.com/podcast/24837940/episode/337745026/',
        height: 200,
      }

      expect(iheartResolveEmbed(value)).toEqual(expected)
    })

    it('should move the beta host onto www', () => {
      const value =
        'https://beta.iheart.com/podcast/24837940/episode/305951801/?embed=true&pname=newstalkzb_web&sc=podcast_episode_embed'
      const expected: EmbedResolverResult = {
        provider: 'iheart',
        id: '24837940/305951801',
        src: 'https://www.iheart.com/podcast/24837940/episode/305951801/?embed=true',
        url: 'https://www.iheart.com/podcast/24837940/episode/305951801/',
        height: 200,
      }

      expect(iheartResolveEmbed(value)).toEqual(expected)
    })

    it('should read the route words in any case', () => {
      const value = 'https://www.iheart.com/PODCAST/84297824/EPISODE/87767164/?embed=true'
      const expected: EmbedResolverResult = {
        provider: 'iheart',
        id: '84297824/87767164',
        src: 'https://www.iheart.com/podcast/84297824/episode/87767164/?embed=true',
        url: 'https://www.iheart.com/podcast/84297824/episode/87767164/',
        height: 200,
      }

      expect(iheartResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the show player at its own height', () => {
      const value =
        'https://www.iheart.com/podcast/211-heather-du-plessis-allan-24837940/?embed=true'
      const expected: EmbedResolverResult = {
        provider: 'iheart',
        id: '24837940',
        src: 'https://www.iheart.com/podcast/24837940/?embed=true',
        url: 'https://www.iheart.com/podcast/24837940/',
        height: 300,
      }

      expect(iheartResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the episode route behind another segment', () => {
      const value = 'https://www.iheart.com/x/podcast/84297824/episode/87767164/?embed=true'

      expect(iheartResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the episode route followed by another segment', () => {
      const value = 'https://www.iheart.com/podcast/84297824/episode/87767164/extra'

      expect(iheartResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the show route behind another segment', () => {
      const value = 'https://www.iheart.com/x/podcast/84297824/?embed=true'

      expect(iheartResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the show route followed by another segment', () => {
      const value = 'https://www.iheart.com/podcast/84297824/extra'

      expect(iheartResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a podcast category page', () => {
      const value = 'https://www.iheart.com/podcast/category/news-and-politics-106/'

      expect(iheartResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a segment with no id after the slug', () => {
      const value = 'https://www.iheart.com/podcast/the-woj-pod/?embed=true'

      expect(iheartResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a live station player', () => {
      const value = 'https://www.iheart.com/live/kfi-am-640-177/?embed=true'

      expect(iheartResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the retired widget route', () => {
      const value = 'https://www.iheart.com/widget/?showId=25229902&episodeId=27347420'

      expect(iheartResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('iheartEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, iheartEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the episode iframe the publisher pasted', async () => {
      const value = html`
        <iframe
          title=""
          height="200"
          width="100%"
          src="https://www.iheart.com/podcast/24837940/episode/337745026/?embed=true&pname=newstalkzb_web&sc=podcast_episode_embed"
          allow="autoplay"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'iheart',
        id: '24837940/337745026',
        src: 'https://www.iheart.com/podcast/24837940/episode/337745026/?embed=true',
        url: 'https://www.iheart.com/podcast/24837940/episode/337745026/',
        height: 200,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the episode name the oEmbed snippet states', async () => {
      const value = html`
        <iframe
          title="Friday Faceoff: CID Director Josie Pagani and former MP Peter Dunne - Wellington Mornings with Nick Mills"
          height="200"
          width="100%"
          src="https://www.iheart.com/podcast/84297824/episode/87767164/?embed=true&cid=oembed&keyid%5B0%5D=Wellington%20Mornings%20with%20Nick%20Mills&sc=podcast_episode_widget"
          allow="autoplay"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'iheart',
        id: '84297824/87767164',
        src: 'https://www.iheart.com/podcast/84297824/episode/87767164/?embed=true',
        url: 'https://www.iheart.com/podcast/84297824/episode/87767164/',
        height: 200,
        title:
          'Friday Faceoff: CID Director Josie Pagani and former MP Peter Dunne - Wellington Mornings with Nick Mills',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should give a narrower carrier the platform height', async () => {
      const value = html`
        <iframe
          allow="autoplay"
          width="420"
          height="150"
          src="https://www.iheart.com/podcast/274-the-woj-27977436/episode/bobby-marks-on-trade-deadline-in-56902288/?embed=true"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'iheart',
        id: '27977436/56902288',
        src: 'https://www.iheart.com/podcast/27977436/episode/56902288/?embed=true',
        url: 'https://www.iheart.com/podcast/27977436/episode/56902288/',
        height: 200,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/podcast/84297824/episode/87767164/?embed=true"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('iheart through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the episode iframe into a placeholder', async () => {
    const value = html`
      <iframe
        title=""
        height="200"
        width="100%"
        src="https://beta.iheart.com/podcast/24837940/episode/304420715/?embed=true&pname=newstalkzb_web&sc=podcast_episode_embed"
        allow="autoplay"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-id="24837940/304420715"
        data-embed-provider="iheart"
        data-embed-src="https://www.iheart.com/podcast/24837940/episode/304420715/?embed=true"
        data-embed-url="https://www.iheart.com/podcast/24837940/episode/304420715/"
        data-embed-height="200"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
