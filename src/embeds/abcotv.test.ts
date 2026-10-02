import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { abcotvEmbedResolver, abcotvResolveEmbed } from './abcotv.js'

describe('abcotvResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player the share button writes', () => {
      const value = 'https://abc7.com/video/embed/?pid=5740386'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '5740386',
        src: 'https://abc7.com/video/embed?pid=5740386',
        url: 'https://abc7.com/videoClip/5740386/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should drop everything in the query but the pid', () => {
      const value = 'https://abc11.com/video/embed/?pid=10066461&autoplay=true&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '10066461',
        src: 'https://abc11.com/video/embed?pid=10066461',
        url: 'https://abc11.com/videoClip/10066461/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should mint https for a carrier written on http', () => {
      const value = 'http://abc13.com/video/embed/?pid=2465723'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '2465723',
        src: 'https://abc13.com/video/embed?pid=2465723',
        url: 'https://abc13.com/videoClip/2465723/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/video/embed/?pid=5740386'

      expect(abcotvResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a player url with no pid', () => {
      const value = 'https://abc7.com/video/embed/'

      expect(abcotvResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route below another segment', () => {
      const value = 'https://abc7.com/archive/video/embed/?pid=5740386'

      expect(abcotvResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the route', () => {
      const value = 'https://abc7.com/video/embed/clip/?pid=5740386'

      expect(abcotvResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a pid under an uppercase name, which the player refuses', () => {
      const value = 'https://abc7.com/video/embed/?PID=5740386'

      expect(abcotvResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the clip page', () => {
      const value = 'https://abc7.com/videoClip/5740386/'

      expect(abcotvResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the route words in any case', () => {
      const value = 'https://abc7.com/VIDEO/EMBED/?pid=5740386'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '5740386',
        src: 'https://abc7.com/video/embed?pid=5740386',
        url: 'https://abc7.com/videoClip/5740386/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should read the route without the trailing slash', () => {
      const value = 'https://abc7.com/video/embed?pid=5740386'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '5740386',
        src: 'https://abc7.com/video/embed?pid=5740386',
        url: 'https://abc7.com/videoClip/5740386/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should pass a pid that is not a number as written', () => {
      const value = 'https://abc7.com/video/embed/?pid=5740386a'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '5740386a',
        src: 'https://abc7.com/video/embed?pid=5740386a',
        url: 'https://abc7.com/videoClip/5740386a/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('the eight station hosts', () => {
    // Each host keeps its own branding, so the mint stays on the host the publisher wrote.
    it('should keep 6abc.com', () => {
      const value = 'https://6abc.com/video/embed/?pid=4708646'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '4708646',
        src: 'https://6abc.com/video/embed?pid=4708646',
        url: 'https://6abc.com/videoClip/4708646/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should keep abc11.com', () => {
      const value = 'https://abc11.com/video/embed/?pid=4549963'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '4549963',
        src: 'https://abc11.com/video/embed?pid=4549963',
        url: 'https://abc11.com/videoClip/4549963/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should keep abc13.com', () => {
      const value = 'https://abc13.com/video/embed/?pid=2465723'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '2465723',
        src: 'https://abc13.com/video/embed?pid=2465723',
        url: 'https://abc13.com/videoClip/2465723/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should keep abc30.com', () => {
      const value = 'http://abc30.com/video/embed/?pid=1731156'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '1731156',
        src: 'https://abc30.com/video/embed?pid=1731156',
        url: 'https://abc30.com/videoClip/1731156/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should keep abc7.com', () => {
      const value = 'http://abc7.com/video/embed/?pid=2708943'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '2708943',
        src: 'https://abc7.com/video/embed?pid=2708943',
        url: 'https://abc7.com/videoClip/2708943/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should keep abc7chicago.com', () => {
      const value = 'http://abc7chicago.com/video/embed/?pid=1005204'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '1005204',
        src: 'https://abc7chicago.com/video/embed?pid=1005204',
        url: 'https://abc7chicago.com/videoClip/1005204/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should keep abc7news.com', () => {
      const value = 'https://abc7news.com/video/embed/?pid=5860677'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '5860677',
        src: 'https://abc7news.com/video/embed?pid=5860677',
        url: 'https://abc7news.com/videoClip/5860677/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })

    it('should keep abc7ny.com', () => {
      const value = 'https://abc7ny.com/video/embed/?pid=5740386'
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '5740386',
        src: 'https://abc7ny.com/video/embed?pid=5740386',
        url: 'https://abc7ny.com/videoClip/5740386/',
        ratio: '16/9',
      }

      expect(abcotvResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('players that are not a station clip', () => {
    it('should return undefined for the ABC News player', () => {
      const value = 'https://abcnews.go.com/video/embed?id=39415146'

      expect(abcotvResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('abcotvEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, abcotvEmbedResolver)

  describe('happy paths', () => {
    it('should take the platform size over the declared box', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://abc7.com/video/embed/?pid=5740386"
          width="650"
          height="366"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'abcotv',
        id: '5740386',
        src: 'https://abc7.com/video/embed?pid=5740386',
        url: 'https://abc7.com/videoClip/5740386/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/video/embed/?pid=5740386"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('abcotv player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should state the player ratio over a square box', async () => {
    const value = html`
      <iframe
        width="315"
        height="315"
        src="https://abc7news.com/video/embed/?pid=5860677"
        frameborder="0"
        allowfullscreen=""
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://abc7news.com/videoClip/5860677/"
        data-embed-id="5860677"
        data-embed-provider="abcotv"
        data-embed-src="https://abc7news.com/video/embed?pid=5860677"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
