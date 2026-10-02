import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { dailymailEmbedResolver, dailymailResolveEmbed } from './dailymail.js'

describe('dailymailResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player the embed snippet writes', () => {
      const value = 'https://www.dailymail.co.uk/embed/video/1763642.html'
      const expected: EmbedResolverResult = {
        provider: 'dailymail',
        id: '1763642',
        src: 'https://www.dailymail.co.uk/embed/video/1763642.html',
        ratio: '9/10',
      }

      expect(dailymailResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the edition host as written', () => {
      const value = 'https://www.dailymail.com/embed/video/2685575.html'
      const expected: EmbedResolverResult = {
        provider: 'dailymail',
        id: '2685575',
        src: 'https://www.dailymail.com/embed/video/2685575.html',
        ratio: '9/10',
      }

      expect(dailymailResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a query the player does not read', () => {
      const value =
        'https://www.dailymail.co.uk/embed/video/2076534.html?autoplay=true&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'dailymail',
        id: '2076534',
        src: 'https://www.dailymail.co.uk/embed/video/2076534.html',
        ratio: '9/10',
      }

      expect(dailymailResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/embed/video/1763642.html'

      expect(dailymailResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route below another segment', () => {
      const value = 'https://www.dailymail.co.uk/news/embed/video/1763642.html'

      expect(dailymailResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the id', () => {
      const value = 'https://www.dailymail.co.uk/embed/video/1763642.html/related'

      expect(dailymailResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route in capitals, which the player answers 404', () => {
      const value = 'https://www.dailymail.co.uk/EMBED/VIDEO/1763642.html'

      expect(dailymailResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the id without its extension, which the player answers 404', () => {
      const value = 'https://www.dailymail.co.uk/embed/video/1763642'

      expect(dailymailResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should pass an id that is not a number as written', () => {
      const value = 'https://www.dailymail.co.uk/embed/video/1763642a.html'
      const expected: EmbedResolverResult = {
        provider: 'dailymail',
        id: '1763642a',
        src: 'https://www.dailymail.co.uk/embed/video/1763642a.html',
        ratio: '9/10',
      }

      expect(dailymailResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('files and pages that are not the player', () => {
    it('should return undefined for a video file', () => {
      const value =
        'https://videos.dailymail.co.uk/video/mol/2019/04/03/1763642/1024x576_MP4_1763642.mp4'

      expect(dailymailResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the video page', () => {
      const value =
        'https://www.dailymail.co.uk/video/tvshowbiz/video-1763642/Video-look-Joaquin-Phoenix-playing-supervillain-Joker.html'

      expect(dailymailResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('dailymailEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, dailymailEmbedResolver)

  describe('happy paths', () => {
    it('should drop the label the snippet writes in place of the name', async () => {
      const value = html`
        <iframe
          src="https://www.dailymail.co.uk/embed/video/1763642.html"
          frameborder="0"
          scrolling="no"
          width="698"
          height="573"
          allowfullscreen="allowfullscreen"
          id="molvideoplayer"
          title="MailOnline Embed Player"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'dailymail',
        id: '1763642',
        src: 'https://www.dailymail.co.uk/embed/video/1763642.html',
        ratio: '9/10',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a title the publisher wrote', async () => {
      const value = html`
        <iframe
          src="https://www.dailymail.co.uk/embed/video/1763642.html"
          title="First look at Joaquin Phoenix playing a supervillain in Joker"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'dailymail',
        id: '1763642',
        src: 'https://www.dailymail.co.uk/embed/video/1763642.html',
        ratio: '9/10',
        title: 'First look at Joaquin Phoenix playing a supervillain in Joker',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/video/1763642.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('dailymail player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should state the player ratio over the declared box and drop the label', async () => {
    const value = html`
      <iframe
        loading="lazy"
        id="molvideoplayer"
        title="MailOnline Embed Player"
        src="https://www.dailymail.co.uk/embed/video/2685575.html"
        width="698"
        height="573"
        frameborder="0"
        scrolling="no"
        allowfullscreen="allowfullscreen"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="9/10"
        data-embed-id="2685575"
        data-embed-provider="dailymail"
        data-embed-src="https://www.dailymail.co.uk/embed/video/2685575.html"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
