import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { art19EmbedResolver, art19ResolveEmbed } from './art19.js'

describe('art19ResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the episode player the oEmbed answer writes', () => {
      const value =
        'https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd/embed'
      const expected: EmbedResolverResult = {
        provider: 'art19',
        id: 'broadcast-dialogue/949de556-7d25-406a-8a27-9823364183bd',
        src: 'https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd/embed',
        url: 'https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd',
        height: 200,
      }

      expect(art19ResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the show player', () => {
      const value = 'https://art19.com/shows/broadcast-dialogue/embed'
      const expected: EmbedResolverResult = {
        provider: 'art19',
        id: 'broadcast-dialogue',
        src: 'https://art19.com/shows/broadcast-dialogue/embed',
        url: 'https://art19.com/shows/broadcast-dialogue',
        height: 505,
      }

      expect(art19ResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the apex for the www host and drop the micro layout', () => {
      const value =
        'https://www.art19.com/shows/58dacbdc-646e-4585-9914-19c3de11d1ba/episodes/667d066a-45eb-4526-9338-1e5a9f6aa180/embed?type=micro'
      const expected: EmbedResolverResult = {
        provider: 'art19',
        id: '58dacbdc-646e-4585-9914-19c3de11d1ba/667d066a-45eb-4526-9338-1e5a9f6aa180',
        src: 'https://art19.com/shows/58dacbdc-646e-4585-9914-19c3de11d1ba/episodes/667d066a-45eb-4526-9338-1e5a9f6aa180/embed',
        url: 'https://art19.com/shows/58dacbdc-646e-4585-9914-19c3de11d1ba/episodes/667d066a-45eb-4526-9338-1e5a9f6aa180',
        height: 200,
      }

      expect(art19ResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the theme and the trailing slash', () => {
      const value =
        'https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd/embed/?theme=dark-blue'
      const expected: EmbedResolverResult = {
        provider: 'art19',
        id: 'broadcast-dialogue/949de556-7d25-406a-8a27-9823364183bd',
        src: 'https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd/embed',
        url: 'https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd',
        height: 200,
      }

      expect(art19ResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the episode as written and fold its case in the key', () => {
      const value =
        'https://art19.com/shows/broadcast-dialogue/episodes/949DE556-7D25-406A-8A27-9823364183BD/embed'
      const expected: EmbedResolverResult = {
        provider: 'art19',
        id: 'broadcast-dialogue/949de556-7d25-406a-8a27-9823364183bd',
        src: 'https://art19.com/shows/broadcast-dialogue/episodes/949DE556-7D25-406A-8A27-9823364183BD/embed',
        url: 'https://art19.com/shows/broadcast-dialogue/episodes/949DE556-7D25-406A-8A27-9823364183BD',
        height: 200,
      }

      expect(art19ResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the episode page, which refuses framing', () => {
      const value =
        'https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd'

      expect(art19ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://art19.com/x/shows/broadcast-dialogue/embed'

      expect(art19ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://art19.com/shows/broadcast-dialogue/embed/extra'

      expect(art19ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the route words in another case, which the server answers with 404', () => {
      const value =
        'https://art19.com/SHOWS/broadcast-dialogue/EPISODES/949de556-7d25-406a-8a27-9823364183bd/EMBED'

      expect(art19ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an episode path under another route word', () => {
      const value =
        'https://art19.com/shows/broadcast-dialogue/x/949de556-7d25-406a-8a27-9823364183bd/embed'

      expect(art19ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an episode audio file', () => {
      const value = 'https://rss.art19.com/episodes/949de556-7d25-406a-8a27-9823364183bd.mp3'

      expect(art19ResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('art19EmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, art19EmbedResolver)

  describe('happy paths', () => {
    it('should resolve the episode iframe, without the box it states', async () => {
      const value = html`
        <iframe
          style="width: 100%; height: 200px; border: 0 none;"
          src="https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd/embed?theme=dark-blue"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'art19',
        id: 'broadcast-dialogue/949de556-7d25-406a-8a27-9823364183bd',
        src: 'https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd/embed',
        url: 'https://art19.com/shows/broadcast-dialogue/episodes/949de556-7d25-406a-8a27-9823364183bd',
        height: 200,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should give the micro layout the episode player height', async () => {
      const value = html`
        <iframe
          src="https://www.art19.com/shows/58dacbdc-646e-4585-9914-19c3de11d1ba/episodes/667d066a-45eb-4526-9338-1e5a9f6aa180/embed?type=micro"
          style="width: 100%; height: 30px; border: 0 none;"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'art19',
        id: '58dacbdc-646e-4585-9914-19c3de11d1ba/667d066a-45eb-4526-9338-1e5a9f6aa180',
        src: 'https://art19.com/shows/58dacbdc-646e-4585-9914-19c3de11d1ba/episodes/667d066a-45eb-4526-9338-1e5a9f6aa180/embed',
        url: 'https://art19.com/shows/58dacbdc-646e-4585-9914-19c3de11d1ba/episodes/667d066a-45eb-4526-9338-1e5a9f6aa180',
        height: 200,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title and drop the secret of a WordPress auto-embed', async () => {
      const value = html`
        <iframe
          class="wp-embedded-content"
          sandbox="allow-scripts"
          security="restricted"
          title="Kim and Ket Stay Alive... Maybe"
          src="https://art19.com/shows/kim-and-ket-stay-alive-maybe/embed#?secret=34IEnr2HDC"
          width="500"
          height="505"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'art19',
        id: 'kim-and-ket-stay-alive-maybe',
        src: 'https://art19.com/shows/kim-and-ket-stay-alive-maybe/embed',
        url: 'https://art19.com/shows/kim-and-ket-stay-alive-maybe',
        height: 505,
        title: 'Kim and Ket Stay Alive... Maybe',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/shows/broadcast-dialogue/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('art19 through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave an episode audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://rss.art19.com/episodes/949de556-7d25-406a-8a27-9823364183bd.mp3',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio data-enclosure="" controls src="https://rss.art19.com/episodes/949de556-7d25-406a-8a27-9823364183bd.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
