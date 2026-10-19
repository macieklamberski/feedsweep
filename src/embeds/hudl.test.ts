import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { hudlIframeEmbedResolver, hudlResolveEmbed, hudlWidgetEmbedResolver } from './hudl.js'

describe('hudlResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the video embed route', () => {
      const value = '//www.hudl.com/embed/video/3/6929219/5858bdefff0d1a25e4a19c68'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/3/6929219/5858bdefff0d1a25e4a19c68',
        src: 'https://www.hudl.com/embed/video/3/6929219/5858bdefff0d1a25e4a19c68',
        url: 'https://www.hudl.com/video/3/6929219/5858bdefff0d1a25e4a19c68',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the video kind through as written', () => {
      const value = '//www.hudl.com/embed/video/2/406080/60860fcc02b1891750b467cb'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/2/406080/60860fcc02b1891750b467cb',
        src: 'https://www.hudl.com/embed/video/2/406080/60860fcc02b1891750b467cb',
        url: 'https://www.hudl.com/video/2/406080/60860fcc02b1891750b467cb',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the video page, which refuses framing, onto the embed route', () => {
      const value = 'http://www.hudl.com/video/3/5290399/57e98e2d842eb2648c8f2338'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/3/5290399/57e98e2d842eb2648c8f2338',
        src: 'https://www.hudl.com/embed/video/3/5290399/57e98e2d842eb2648c8f2338',
        url: 'https://www.hudl.com/video/3/5290399/57e98e2d842eb2648c8f2338',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the video page of a bare id onto the embed route', () => {
      const value = 'http://www.hudl.com/video/58407c8402b1c80ee42b7112'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/58407c8402b1c80ee42b7112',
        src: 'https://www.hudl.com/embed/video/58407c8402b1c80ee42b7112',
        url: 'https://www.hudl.com/video/58407c8402b1c80ee42b7112',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should read the athlete highlights route', () => {
      const value = '//www.hudl.com/embed/athlete/3949971/highlights/207852394'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'athlete/3949971/207852394',
        src: 'https://www.hudl.com/embed/athlete/3949971/highlights/207852394',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an athlete reel id through as written', () => {
      const value = '//www.hudl.com/embed/athlete/15370417/highlights/5fdd6cc8b3d2ee108cc3709f'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'athlete/15370417/5fdd6cc8b3d2ee108cc3709f',
        src: 'https://www.hudl.com/embed/athlete/15370417/highlights/5fdd6cc8b3d2ee108cc3709f',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should pass a video id through in its own case', () => {
      const value = 'https://www.hudl.com/embed/video/3/6929219/5858BDEFFF0D1A25E4A19C68'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/3/6929219/5858BDEFFF0D1A25E4A19C68',
        src: 'https://www.hudl.com/embed/video/3/6929219/5858BDEFFF0D1A25E4A19C68',
        url: 'https://www.hudl.com/video/3/6929219/5858BDEFFF0D1A25E4A19C68',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should read the video route words in capitals', () => {
      const value = 'https://www.hudl.com/EMBED/VIDEO/3/6929219/5858bdefff0d1a25e4a19c68'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/3/6929219/5858bdefff0d1a25e4a19c68',
        src: 'https://www.hudl.com/embed/video/3/6929219/5858bdefff0d1a25e4a19c68',
        url: 'https://www.hudl.com/video/3/6929219/5858bdefff0d1a25e4a19c68',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should read the athlete route words in capitals', () => {
      const value = 'https://www.hudl.com/EMBED/ATHLETE/3949971/HIGHLIGHTS/207852394'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'athlete/3949971/207852394',
        src: 'https://www.hudl.com/embed/athlete/3949971/highlights/207852394',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should read the video route with a trailing slash', () => {
      const value = 'https://www.hudl.com/embed/video/3/6929219/5858bdefff0d1a25e4a19c68/'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/3/6929219/5858bdefff0d1a25e4a19c68',
        src: 'https://www.hudl.com/embed/video/3/6929219/5858bdefff0d1a25e4a19c68',
        url: 'https://www.hudl.com/video/3/6929219/5858bdefff0d1a25e4a19c68',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should read the athlete route with a trailing slash', () => {
      const value = 'https://www.hudl.com/embed/athlete/3949971/highlights/207852394/'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'athlete/3949971/207852394',
        src: 'https://www.hudl.com/embed/athlete/3949971/highlights/207852394',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the query', () => {
      const value =
        'https://www.hudl.com/embed/video/3/6929219/5858bdefff0d1a25e4a19c68?autoplay=true&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/3/6929219/5858bdefff0d1a25e4a19c68',
        src: 'https://www.hudl.com/embed/video/3/6929219/5858bdefff0d1a25e4a19c68',
        url: 'https://www.hudl.com/video/3/6929219/5858bdefff0d1a25e4a19c68',
        ratio: '16/9',
      }

      expect(hudlResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/embed/video/3/6929219/5858bdefff0d1a25e4a19c68'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the video route below another segment', () => {
      const value = 'https://www.hudl.com/x/embed/video/3/6929219/5858bdefff0d1a25e4a19c68'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the video', () => {
      const value = 'https://www.hudl.com/embed/video/3/6929219/5858bdefff0d1a25e4a19c68/extra'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a video route with two segments, which answers 404', () => {
      const value = 'https://www.hudl.com/embed/video/6929219/5858bdefff0d1a25e4a19c68'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the gt.hudl.com host, whose certificate does not match', () => {
      const value = 'http://www.gt.hudl.com/video/3/5398614/5a209cecd45e2a267c46e61b'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the athlete route below another segment', () => {
      const value = 'https://www.hudl.com/x/embed/athlete/3949971/highlights/207852394'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the reel', () => {
      const value = 'https://www.hudl.com/embed/athlete/3949971/highlights/207852394/extra'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for an athlete route with another route word', () => {
      const value = 'https://www.hudl.com/embed/athlete/3949971/clips/207852394'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a short link, which redirects to the fan site home', () => {
      const value = 'http://www.hudl.com/v/13TVBJ'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the technique player, which answers 404', () => {
      const value = '//www.hudl.com/technique/video/embed/gsX6IvOM'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the broadcast player on its own host', () => {
      const value = 'https://vcloud.hudl.com/broadcast/embed/4047725?autoplay=0&volume=100'

      expect(hudlResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('hudlIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, hudlIframeEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform ratio for the video frame', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://www.hudl.com/embed/video/3/19761882/69609f4ae166c81cc232f5b9"
          width="640"
          height="360"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/3/19761882/69609f4ae166c81cc232f5b9',
        src: 'https://www.hudl.com/embed/video/3/19761882/69609f4ae166c81cc232f5b9',
        url: 'https://www.hudl.com/video/3/19761882/69609f4ae166c81cc232f5b9',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/embed/athlete/3949971/highlights/207852394"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('hudlWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, hudlWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should read the video page linked from the hudl-embed snippet', async () => {
      const value = html`
        <div class="hudl-embed">
          <a
            href="http://www.hudl.com/video/3/5290399/57e98e2d842eb2648c8f2338"
            target="_blank"
            rel="noopener noreferrer"
          >View Link</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/3/5290399/57e98e2d842eb2648c8f2338',
        src: 'https://www.hudl.com/embed/video/3/5290399/57e98e2d842eb2648c8f2338',
        url: 'https://www.hudl.com/video/3/5290399/57e98e2d842eb2648c8f2338',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the embed route linked from the hudl-highlights-embed snippet', async () => {
      const value = html`
        <div class="hudl-highlights-embed">
          <a
            href="https://www.hudl.com/embed/video/3/18002661/68db485e8b01162e4062b2f1"
            target="_blank"
            rel="noopener noreferrer"
          >View Link</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'hudl',
        id: 'video/3/18002661/68db485e8b01162e4062b2f1',
        src: 'https://www.hudl.com/embed/video/3/18002661/68db485e8b01162e4062b2f1',
        url: 'https://www.hudl.com/video/3/18002661/68db485e8b01162e4062b2f1',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a snippet linking a short link', async () => {
      const value = html`
        <div class="hudl-embed">
          <a
            href="http://www.hudl.com/v/13TVBJ"
            target="_blank"
            rel="noopener noreferrer"
          >View Link</a>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('hudl through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should turn the protocol-relative athlete frame into a placeholder', async () => {
    const value = html`
      <iframe
        src="//www.hudl.com/embed/athlete/3949971/highlights/207852394"
        width="640"
        height="360"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="athlete/3949971/207852394"
        data-embed-provider="hudl"
        data-embed-src="https://www.hudl.com/embed/athlete/3949971/highlights/207852394"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn the hudl-embed snippet into a placeholder', async () => {
    const value = html`
      <div class="hudl-embed">
        <a
          href="http://www.hudl.com/video/3/5290399/57e98e2d842eb2648c8f2338"
          target="_blank"
          rel="noopener noreferrer"
        >View Link</a>
      </div>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://www.hudl.com/video/3/5290399/57e98e2d842eb2648c8f2338"
        data-embed-id="video/3/5290399/57e98e2d842eb2648c8f2338"
        data-embed-provider="hudl"
        data-embed-src="https://www.hudl.com/embed/video/3/5290399/57e98e2d842eb2648c8f2338"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a hudl video enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://vi.hudl.com/p-highlights/User/6929219/5858bdefff0d1a25e4a19c68/b990cea5_720.mp4',
        type: 'video/mp4',
      },
    ]
    const expected = html`
      <video data-enclosure="" controls src="https://vi.hudl.com/p-highlights/User/6929219/5858bdefff0d1a25e4a19c68/b990cea5_720.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
