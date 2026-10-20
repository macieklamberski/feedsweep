import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedRenderHint, EmbedResolverResult } from '../types.js'
import {
  streamableIframeEmbedResolver,
  streamableMlbEmbedResolver,
  streamableRenderHint,
  streamableResolveEmbed,
  streamableWidgetEmbedResolver,
} from './streamable.js'

describe('streamableResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the embed route', () => {
      const value = 'https://streamable.com/e/qun2ij'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'qun2ij',
        src: 'https://streamable.com/e/qun2ij',
        url: 'https://streamable.com/qun2ij',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the oEmbed frame onto the embed route', () => {
      const value = 'https://streamable.com/o/0qn9bq#?secret=Rc7Ozk2Zaa'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: '0qn9bq',
        src: 'https://streamable.com/e/0qn9bq',
        url: 'https://streamable.com/0qn9bq',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the share route onto the embed route and drop its token', () => {
      const value = 'https://streamable.com/s/55miv/pnbzup'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: '55miv',
        src: 'https://streamable.com/e/55miv',
        url: 'https://streamable.com/55miv',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the watch page onto the embed route', () => {
      const value = 'https://streamable.com/hb7ie'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'hb7ie',
        src: 'https://streamable.com/e/hb7ie',
        url: 'https://streamable.com/hb7ie',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })

    it('should read an MLB clip by its slug, with no page url', () => {
      const value =
        'https://streamable.com/m/andy-pages-covers-121-ft-to-send-game-7-to-extras?partnerId=web_video-playback-page_video-share'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'm/andy-pages-covers-121-ft-to-send-game-7-to-extras',
        src: 'https://streamable.com/m/andy-pages-covers-121-ft-to-send-game-7-to-extras',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })

    it('should read the www host', () => {
      const value = 'https://www.streamable.com/e/3qufhz'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: '3qufhz',
        src: 'https://streamable.com/e/3qufhz',
        url: 'https://streamable.com/3qufhz',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })

    it('should read a protocol-relative url', () => {
      const value = '//streamable.com/e/n2run'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'n2run',
        src: 'https://streamable.com/e/n2run',
        url: 'https://streamable.com/n2run',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/e/qun2ij'

      expect(streamableResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a file host of the platform', () => {
      const value = 'https://cdn-cf-east.streamable.com/qun2ij'

      expect(streamableResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route word in another case, which the server does not serve', () => {
      const value = 'https://streamable.com/E/qun2ij'

      expect(streamableResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route nested under another segment', () => {
      const value = 'https://streamable.com/x/e/qun2ij'

      expect(streamableResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a segment after the embed id', () => {
      const value = 'https://streamable.com/e/qun2ij/extra'

      expect(streamableResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a share route with no token', () => {
      const value = 'https://streamable.com/s/55miv'

      expect(streamableResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a segment after the share token', () => {
      const value = 'https://streamable.com/s/55miv/pnbzup/extra'

      expect(streamableResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a segment after the MLB slug', () => {
      const value = 'https://streamable.com/m/andy-pages-covers-121-ft-to-send-game-7-to-extras/x'

      expect(streamableResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the bare host', () => {
      const value = 'https://streamable.com/'

      expect(streamableResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('the query', () => {
    it('should keep loop and drop a tracker', () => {
      const value = 'https://streamable.com/e/p2jw4u?loop=0&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'p2jw4u',
        src: 'https://streamable.com/e/p2jw4u?loop=0',
        url: 'https://streamable.com/p2jw4u',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })

    it("should drop the publisher's autoplay and the player flags", () => {
      const value = 'https://streamable.com/e/wata?autoplay=1&logo=0&hd=1'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'wata',
        src: 'https://streamable.com/e/wata',
        url: 'https://streamable.com/wata',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an id through as written', () => {
      const value = 'https://streamable.com/e/QUN2IJ'
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'QUN2IJ',
        src: 'https://streamable.com/e/QUN2IJ',
        url: 'https://streamable.com/QUN2IJ',
        ratio: '16/9',
      }

      expect(streamableResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('streamableIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, streamableIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the embed code and leave its declared box behind', async () => {
      const value = html`
        <iframe
          loading="lazy"
          style="width: 100%; height: 100%; position: absolute;"
          src="https://streamable.com/e/qun2ij"
          width="100%"
          height="100%"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'qun2ij',
        src: 'https://streamable.com/e/qun2ij',
        url: 'https://streamable.com/qun2ij',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title the WordPress embed states', async () => {
      const value = html`
        <iframe
          loading="lazy"
          class="wp-embedded-content"
          sandbox="allow-scripts"
          security="restricted"
          title="joe fortson 40 yarder chiefs chargers 2022"
          src="https://streamable.com/o/2xzzq4#?secret=dgzwqv1zlv"
          data-secret="dgzwqv1zlv"
          frameborder="0"
          scrolling="no"
          width="1280"
          height="718"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: '2xzzq4',
        src: 'https://streamable.com/e/2xzzq4',
        url: 'https://streamable.com/2xzzq4',
        ratio: '16/9',
        title: 'joe fortson 40 yarder chiefs chargers 2022',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the share route a sports site frames', async () => {
      const value = html`
        <iframe
          loading="lazy"
          style="width: 100%; height: 100%; position: absolute;"
          src="https://streamable.com/s/55miv/pnbzup"
          width="100%"
          height="100%"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: '55miv',
        src: 'https://streamable.com/e/55miv',
        url: 'https://streamable.com/55miv',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/e/qun2ij"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the MLB film room route alone', async () => {
      const value = html`
        <iframe
          src="https://streamable.com/mlbfilmroom/00u91h9ad3Lty1uCX356/genosotochado?partnerId=web_multimedia-search_video-share"
          width="560"
          height="315"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('streamableMlbEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, streamableMlbEmbedResolver)

  describe('happy paths', () => {
    it('should read the clip out of the SB Nation MLB snippet', async () => {
      const value = html`
        <div class="mlb.com-embed">
          <a
            href="https://www.mlb.com/video/josh-rojas-homers-8-on-a-fly-ball-to-left-field"
            target="_blank"
            rel="noopener noreferrer"
          >View Link</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'm/josh-rojas-homers-8-on-a-fly-ball-to-left-field',
        src: 'https://streamable.com/m/josh-rojas-homers-8-on-a-fly-ball-to-left-field',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the snippet spelled with a hyphen and drop the page query', async () => {
      const value = html`
        <div class="mlb-com-embed">
          <a
            href="https://www.mlb.com/video/junior-caminero-crushes-463-foot-home-run?q=Junior%20Caminero&amp;cp=CMS_FIRST&amp;qt=FREETEXT&amp;p=0"
            target="_blank"
            rel="noopener noreferrer"
          >View Link</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'm/junior-caminero-crushes-463-foot-home-run',
        src: 'https://streamable.com/m/junior-caminero-crushes-463-foot-home-run',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it("should read a clip on a club's page", async () => {
      const value = html`
        <div class="mlb.com-embed">
          <a
            href="https://www.mlb.com/rockies/video/daniel-bard-in-play-out-s-to-will-smith?partnerId=web_video-playback-page_video-share"
            target="_blank"
            rel="noopener noreferrer"
          >View Link</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: 'm/daniel-bard-in-play-out-s-to-will-smith',
        src: 'https://streamable.com/m/daniel-bard-in-play-out-s-to-will-smith',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <div class="mlb.com-embed">
          <a href="https://evil.test/video/josh-rojas-homers-8-on-a-fly-ball-to-left-field">View Link</a>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a legacy page whose slug the frame does not use', async () => {
      const value = html`
        <div class="mlb.com-embed">
          <a href="https://www.mlb.com/video/happs-leaping-catch-into-ivy/c-2388489783?tid=51231442">View Link</a>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a fan reel, which has no frame', async () => {
      const value = html`
        <div class="mlb.com-embed">
          <a href="https://www.mlb.com/video/00u7mjff3NboqTTTt356/reels/christian-walker-defense">View Link</a>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a clip path nested under two segments', async () => {
      const value = html`
        <div class="mlb.com-embed">
          <a href="https://www.mlb.com/rockies/fans/video/daniel-bard-in-play-out-s-to-will-smith">View Link</a>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a page that is not a clip', async () => {
      const value = html`
        <div class="mlb.com-embed">
          <a href="https://www.mlb.com/news/dodgers-roster-moves">View Link</a>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a snippet with no link', async () => {
      const value = '<div class="mlb.com-embed"></div>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('streamableWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, streamableWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should read the video out of the SB Nation snippet', async () => {
      const value = html`
        <div class="streamable-embed">
          <a
            href="https://streamable.com/0891o"
            target="_blank"
            rel="noopener noreferrer"
          >View Link</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'streamable',
        id: '0891o',
        src: 'https://streamable.com/e/0891o',
        url: 'https://streamable.com/0891o',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a snippet linking off the platform', async () => {
      const value = html`
        <div class="streamable-embed">
          <a
            href="https://t.co/JzsAcE73w9"
            target="_blank"
            rel="noopener noreferrer"
          >View Link</a>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a snippet with no link', async () => {
      const value = '<div class="streamable-embed"></div>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('streamable through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should replace the SB Nation snippet and keep the prose around it', async () => {
    const value = html`
      <p>Before</p>
      <div class="streamable-embed">
        <a
          href="https://streamable.com/0891o"
          target="_blank"
          rel="noopener noreferrer"
        >View Link</a>
      </div>
      <p>After</p>
    `
    const expected = html`
      <p>Before</p>
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://streamable.com/0891o"
        data-embed-id="0891o"
        data-embed-provider="streamable"
        data-embed-src="https://streamable.com/e/0891o"
      ></div>
      <p>After</p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace the SB Nation MLB snippet and keep the prose around it', async () => {
    const value = html`
      <p>Before</p>
      <div class="mlb.com-embed">
        <a
          href="https://www.mlb.com/video/josh-rojas-homers-8-on-a-fly-ball-to-left-field"
          target="_blank"
          rel="noopener noreferrer"
        >View Link</a>
      </div>
      <p>After</p>
    `
    const expected = html`
      <p>Before</p>
      <div
        data-embed-ratio="16/9"
        data-embed-id="m/josh-rojas-homers-8-on-a-fly-ball-to-left-field"
        data-embed-provider="streamable"
        data-embed-src="https://streamable.com/m/josh-rojas-homers-8-on-a-fly-ball-to-left-field"
      ></div>
      <p>After</p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve the iframe inside an s9e span', async () => {
    const value = html`
      <span data-s9e-mediaembed="streamable">
        <span>
          <iframe
            allowfullscreen=""
            scrolling="no"
            src="//streamable.com/e/n2run"
          ></iframe>
        </span>
      </span>
    `
    const expected = html`
      <span data-s9e-mediaembed="streamable">
        <span>
          <div
            data-embed-ratio="16/9"
            data-embed-url="https://streamable.com/n2run"
            data-embed-id="n2run"
            data-embed-provider="streamable"
            data-embed-src="https://streamable.com/e/n2run"
          ></div>
        </span>
      </span>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should drop the player label a theme writes as the title', async () => {
    const value = html`
      <iframe
        class="video"
        src="https://www.streamable.com/e/3qufhz"
        title="streamable video player"
        frameborder="0"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://streamable.com/3qufhz"
        data-embed-id="3qufhz"
        data-embed-provider="streamable"
        data-embed-src="https://streamable.com/e/3qufhz"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a Streamable video enclosure playable', async () => {
    const enclosures = [
      { url: 'https://cdn-cf-east.streamable.com/video/mp4/qun2ij.mp4', type: 'video/mp4' },
    ]
    const expected = html`
      <video data-enclosure="" controls src="https://cdn-cf-east.streamable.com/video/mp4/qun2ij.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})

describe('streamableRenderHint', () => {
  it('should start the video with the autoplay flag', () => {
    const expected: EmbedRenderHint = { provider: 'streamable', autoplayParams: { autoplay: '1' } }

    expect(streamableRenderHint).toEqual(expected)
  })
})
