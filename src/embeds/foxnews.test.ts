import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  foxnewsIframeEmbedResolver,
  foxnewsResolveEmbed,
  foxnewsScriptEmbedResolver,
} from './foxnews.js'

describe('foxnewsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the script url', () => {
      const value = 'https://video.foxnews.com/v/embed.js?id=5406119088001&w=466&h=263'
      const expected: EmbedResolverResult = {
        provider: 'foxnews',
        id: '5406119088001',
        src: 'https://video.foxnews.com/v/video-embed.html?video_id=5406119088001',
        url: 'https://www.foxnews.com/video/5406119088001',
        ratio: '16/9',
      }

      expect(foxnewsResolveEmbed(value)).toEqual(expected)
    })

    // The embedding page's location and referrer ride along in the pasted iframe and are
    // dropped with the rest of the query.
    it('should build the placeholder from the embed page url', () => {
      const value =
        'https://video.foxnews.com/v/video-embed.html?video_id=6178327154001&loc=example.com&ref=https%3A%2F%2Fexample.com%2Fpost%2F&_xcf='
      const expected: EmbedResolverResult = {
        provider: 'foxnews',
        id: '6178327154001',
        src: 'https://video.foxnews.com/v/video-embed.html?video_id=6178327154001',
        url: 'https://www.foxnews.com/video/6178327154001',
        ratio: '16/9',
      }

      expect(foxnewsResolveEmbed(value)).toEqual(expected)
    })

    it('should build the Fox Business placeholder from the Fox Business script url', () => {
      const value = 'https://video.foxbusiness.com/v/embed.js?id=6355436296112&w=466&h=263'
      const expected: EmbedResolverResult = {
        provider: 'foxbusiness',
        id: '6355436296112',
        src: 'https://video.foxbusiness.com/v/video-embed.html?video_id=6355436296112',
        url: 'https://www.foxbusiness.com/video/6355436296112',
        ratio: '16/9',
      }

      expect(foxnewsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for the video page itself', () => {
      const value = 'https://video.foxnews.com/v/5406119088001/'

      expect(foxnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a script carrying no id', () => {
      const value = 'https://video.foxnews.com/v/embed.js?w=466&h=263'

      expect(foxnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for an id that is not numeric', () => {
      const value = 'https://video.foxnews.com/v/embed.js?id=latest'

      expect(foxnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a lookalike host', () => {
      const value = 'https://video.foxnews.com.evil.test/v/embed.js?id=5406119088001'

      expect(foxnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a subdomain of the Fox News player host', () => {
      const value = 'https://cdn.video.foxnews.com/v/embed.js?id=5406119088001'

      expect(foxnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a subdomain of the Fox Business player host', () => {
      const value = 'https://cdn.video.foxbusiness.com/v/embed.js?id=6355436296112'

      expect(foxnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the retired root embed.js route', () => {
      const value = 'https://video.foxnews.com/embed.js?id=11896855&w=432&h=266'

      expect(foxnewsResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a Fox Business video page linked in prose', () => {
      const value = 'https://video.foxbusiness.com/v/6297488565001#sp=show-clips'

      expect(foxnewsResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('foxnewsScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, foxnewsScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the scheme-relative snippet', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="//video.foxnews.com/v/embed.js?id=5406119088001&#038;w=466&#038;h=263"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'foxnews',
        id: '5406119088001',
        src: 'https://video.foxnews.com/v/video-embed.html?video_id=5406119088001',
        url: 'https://www.foxnews.com/video/5406119088001',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the placeholder from the Fox Business snippet', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="https://video.foxbusiness.com/v/embed.js?id=6355436296112&#038;w=466&#038;h=263"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'foxbusiness',
        id: '6355436296112',
        src: 'https://video.foxbusiness.com/v/video-embed.html?video_id=6355436296112',
        url: 'https://www.foxbusiness.com/video/6355436296112',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<script src="https://evil.test/video.foxnews.com/v/embed.js?id=5406119088001"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('foxnewsIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, foxnewsIframeEmbedResolver)

  // The pasted iframe states 640 by 360, which is the carrier's size and wins over the ratio.
  it('should resolve the pasted player iframe', async () => {
    const value = html`
      <iframe
        src="https://video.foxnews.com/v/video-embed.html?video_id=6178327154001&loc=example.com"
        width="640"
        height="360"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'foxnews',
      id: '6178327154001',
      src: 'https://video.foxnews.com/v/video-embed.html?video_id=6178327154001',
      url: 'https://www.foxnews.com/video/6178327154001',
      width: 640,
      height: 360,
    }

    expect(await extract(value)).toEqual(expected)
  })

  // The snippet states no size, so the player's own ratio is what the placeholder carries.
  it('should resolve the Fox Business player iframe', async () => {
    const value =
      '<iframe src="https://video.foxbusiness.com/v/video-embed.html?video_id=6355436296112"></iframe>'
    const expected: EmbedResolverResult = {
      provider: 'foxbusiness',
      id: '6355436296112',
      src: 'https://video.foxbusiness.com/v/video-embed.html?video_id=6355436296112',
      url: 'https://www.foxbusiness.com/video/6355436296112',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should ignore an iframe framing the video page', async () => {
    const value = '<iframe src="https://video.foxnews.com/v/5406119088001/"></iframe>'

    expect(await extract(value)).toBeUndefined()
  })
})

describeForEachParser('fox through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the noscript line the snippet ships with', async () => {
    const value = html`
      <script
        type="text/javascript"
        src="https://video.foxbusiness.com/v/embed.js?id=6355436296112&#038;w=466&#038;h=263"
      ></script>
      <noscript>Watch the latest video at <a href="https://www.foxbusiness.com">foxbusiness.com</a></noscript>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://www.foxbusiness.com/video/6355436296112"
        data-embed-id="6355436296112"
        data-embed-provider="foxbusiness"
        data-embed-src="https://video.foxbusiness.com/v/video-embed.html?video_id=6355436296112"
      ></div>
      <p><noscript>Watch the latest video at <a href="https://www.foxbusiness.com">foxbusiness.com</a></noscript></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a Fox Business video link in prose alone', async () => {
    const value = html`
      <p>
        Watch the clip at
        <a href="https://video.foxbusiness.com/v/6297488565001/will-obamacare-hurt-productivity/"
          >video.foxbusiness.com</a
        >.
      </p>
    `

    expect(await convert(value)).toEqualHtml(value)
  })
})
