import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { rsscomEmbedResolver, rsscomRenderHint, rsscomResolveEmbed } from './rsscom.js'

describe('rsscomResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the episode player from the embed dialog url', () => {
      const value = 'https://player.rss.com/allouttabubblegum/2949933?theme=dark&v=2'
      const expected: EmbedResolverResult = {
        provider: 'rsscom',
        id: 'allouttabubblegum/2949933',
        src: 'https://player.rss.com/allouttabubblegum/2949933?v=2',
        url: 'https://rss.com/podcasts/allouttabubblegum/2949933/',
      }

      expect(rsscomResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the older player onto the current one', () => {
      const value = 'https://player.rss.com/annotations/1590822?theme=light'
      const expected: EmbedResolverResult = {
        provider: 'rsscom',
        id: 'annotations/1590822',
        src: 'https://player.rss.com/annotations/1590822?v=2',
        url: 'https://rss.com/podcasts/annotations/1590822/',
      }

      expect(rsscomResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the show player with its episode list', () => {
      const value = 'https://player.rss.com/duckrabbits-talk-back?theme=light&v=2&hl=aGlkZV9sb2dv'
      const expected: EmbedResolverResult = {
        provider: 'rsscom',
        id: 'duckrabbits-talk-back',
        src: 'https://player.rss.com/duckrabbits-talk-back?v=2',
        url: 'https://rss.com/podcasts/duckrabbits-talk-back/',
      }

      expect(rsscomResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position', () => {
      const value = 'https://player.rss.com/thecosafashow/2909608?theme=color&v=2&time=90'
      const expected: EmbedResolverResult = {
        provider: 'rsscom',
        id: 'thecosafashow/2909608',
        src: 'https://player.rss.com/thecosafashow/2909608?v=2&time=90',
        url: 'https://rss.com/podcasts/thecosafashow/2909608/',
      }

      expect(rsscomResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a trailing slash', () => {
      const value = 'https://player.rss.com/duckrabbits-talk-back/2882683/?v=2'
      const expected: EmbedResolverResult = {
        provider: 'rsscom',
        id: 'duckrabbits-talk-back/2882683',
        src: 'https://player.rss.com/duckrabbits-talk-back/2882683?v=2',
        url: 'https://rss.com/podcasts/duckrabbits-talk-back/2882683/',
      }

      expect(rsscomResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the slug on as written', () => {
      const value = 'https://player.rss.com/AllOuttaBubbleGum/2949933?v=2'
      const expected: EmbedResolverResult = {
        provider: 'rsscom',
        id: 'AllOuttaBubbleGum/2949933',
        src: 'https://player.rss.com/AllOuttaBubbleGum/2949933?v=2',
        url: 'https://rss.com/podcasts/AllOuttaBubbleGum/2949933/',
      }

      expect(rsscomResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a second segment that is not an episode id', () => {
      const value = 'https://player.rss.com/allouttabubblegum/episodes?v=2'

      expect(rsscomResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an episode id with a prefix', () => {
      const value = 'https://player.rss.com/allouttabubblegum/x2949933?v=2'

      expect(rsscomResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an episode id with a suffix', () => {
      const value = 'https://player.rss.com/allouttabubblegum/2949933x?v=2'

      expect(rsscomResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an episode path with a trailing segment', () => {
      const value = 'https://player.rss.com/allouttabubblegum/2949933/extra?v=2'

      expect(rsscomResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player root', () => {
      const value = 'https://player.rss.com/?v=2'

      expect(rsscomResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/allouttabubblegum/2949933?theme=dark&v=2'

      expect(rsscomResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('rsscomEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, rsscomEmbedResolver)

  describe('happy paths', () => {
    it('should take the episode name from the carrier title', async () => {
      const value = html`
        <iframe
          src="https://player.rss.com/annotations/1590822?theme=light"
          style="width: 100%; height: 150px;"
          title="Body Count"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'rsscom',
        id: 'annotations/1590822',
        src: 'https://player.rss.com/annotations/1590822?v=2',
        url: 'https://rss.com/podcasts/annotations/1590822/',
        title: 'Body Count',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/annotations/1590822?theme=light"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('rsscom player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should leave the declared height off the placeholder', async () => {
    const value = html`
      <iframe
        src="https://player.rss.com/allouttabubblegum/2949933?theme=dark&#038;v=2"
        width="100%"
        height="202px"
        title="Above &#038; Beyond the Law episode 10 - Fire Down Belo"
        frameBorder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="rsscom"
        data-embed-id="allouttabubblegum/2949933"
        data-embed-src="https://player.rss.com/allouttabubblegum/2949933?v=2"
        data-embed-url="https://rss.com/podcasts/allouttabubblegum/2949933/"
        data-embed-title="Above &amp; Beyond the Law episode 10 - Fire Down Belo"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})

describe('rsscomRenderHint', () => {
  it('should read the height the player posts once it renders', () => {
    const value = { height: 198 }

    expect(rsscomRenderHint.readHeight?.(value)).toBe(198)
  })
})
