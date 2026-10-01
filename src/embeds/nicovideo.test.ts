import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  extractNicovideoId,
  isNicovideoReady,
  nicovideoIframeEmbedResolver,
  nicovideoResolveEmbed,
  nicovideoScriptEmbedResolver,
} from './nicovideo.js'

// Every `data-embed-*` field the placeholder carries, so a test can assert the whole set
// rather than the one field it happens to care about.
const readPlaceholder = (
  result: string,
  parseHtml: (value: string) => Document,
): Record<string, string> => {
  const element = parseHtml(result).querySelector('[data-embed-src]')
  const fields: Record<string, string> = {}

  for (const name of element?.getAttributeNames() ?? []) {
    const value = element?.getAttribute(name)

    if (name.startsWith('data-embed-') && value) {
      fields[name.replace('data-embed-', '')] = value
    }
  }

  return fields
}

describe('extractNicovideoId', () => {
  it('should read the video id from the thumb_watch path', () => {
    const value = 'https://ext.nicovideo.jp/thumb_watch/sm9?w=490&h=307'
    const expected = 'sm9'

    expect(extractNicovideoId(value)).toBe(expected)
  })

  it('should read the other id prefixes', () => {
    expect(extractNicovideoId('https://ext.nicovideo.jp/thumb_watch/nm12345')).toBe('nm12345')
    expect(extractNicovideoId('https://ext.nicovideo.jp/thumb_watch/so67890')).toBe('so67890')
  })

  // A channel upload is addressed by a bare thread number, with no kind in front of it.
  it('should read a bare numeric id', () => {
    const value = 'https://embed.nicovideo.jp/watch/1576909203/script?w=640&h=360'
    const expected = '1576909203'

    expect(extractNicovideoId(value)).toBe(expected)
  })

  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(extractNicovideoId(value)).toBeUndefined()
  })

  it('should return undefined for a nicovideo url naming no video', () => {
    const value = 'https://ext.nicovideo.jp/thumb_watch/'

    expect(extractNicovideoId(value)).toBeUndefined()
  })

  it('should return undefined for a marker deeper in the path', () => {
    const value = 'https://www.nicovideo.jp/api/watch/v3_guest/sm9'

    expect(extractNicovideoId(value)).toBeUndefined()
  })

  // Every spelling a broadcast arrives in, including the live host's own embed route.
  const broadcastUrls: Array<string> = [
    'https://live.nicovideo.jp/watch/lv346883570',
    'https://live.nicovideo.jp/embed/lv346883570',
    'https://www.nicovideo.jp/watch/lv346883570',
  ]

  it.each(broadcastUrls)('should read the broadcast id from %s', (value) => {
    expect(extractNicovideoId(value)).toBe('lv346883570')
  })

  // The illustration, manga and news sites sit on the same domain and write the same route words
  // and id grammar, so their ids pass the video id test on shape alone. Each addresses something
  // the video player answers 500 for, so none is read as a video.
  const nonVideoCardUrls: Array<string> = [
    'https://ext.seiga.nicovideo.jp/thumb/im4572423',
    'https://ext.seiga.nicovideo.jp/thumb/mg316785',
    'https://seiga.nicovideo.jp/seiga/im4572423',
    'https://ext.manga.nicovideo.jp/thumb/mg316785',
    'https://manga.nicovideo.jp/watch/mg316785',
    'https://news.nicovideo.jp/watch/nw15391705',
  ]

  it.each(nonVideoCardUrls)(
    'should refuse the illustration, manga and news card at %s',
    (value) => {
      expect(extractNicovideoId(value)).toBeUndefined()
    },
  )
})

describeForEachParser('nicovideoIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, nicovideoIframeEmbedResolver)

  describe('happy paths', () => {
    it('should rewrite the thumb card at the video ratio', async () => {
      const value = html`
        <iframe
          scrolling="no"
          height="176"
          frameborder="0"
          width="312"
          style="border: 1px solid rgb(204, 204, 204);"
          src="http://ext.nicovideo.jp/thumb/sm12692698"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nicovideo',
        id: 'sm12692698',
        src: 'https://embed.nicovideo.jp/watch/sm12692698',
        url: 'https://www.nicovideo.jp/watch/sm12692698',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the query the player iframe carries', async () => {
      const value = html`
        <iframe
          width="640"
          height="360"
          src="http://embed.nicovideo.jp/watch/sm28553330?oldScript=1&amp;referer=http%3A%2F%2Fblog.livedoor.jp%2Fantijapanhunter%2F&amp;from=0&amp;allowProgrammaticFullScreen=1"
          allow="autoplay"
          style="max-width: 560px; word-break: break-all;"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nicovideo',
        id: 'sm28553330',
        src: 'https://embed.nicovideo.jp/watch/sm28553330',
        url: 'https://www.nicovideo.jp/watch/sm28553330',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the thumb card path', async () => {
      const value = '<iframe src="https://evil.test/thumb/sm12692698"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('nicovideoScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, nicovideoScriptEmbedResolver)

  describe('happy paths', () => {
    it('should mint the modern player and state the player ratio over the size the url names', async () => {
      const value = html`
        <script src="https://ext.nicovideo.jp/thumb_watch/sm9?w=490&amp;h=307"></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'nicovideo',
        id: 'sm9',
        src: 'https://embed.nicovideo.jp/watch/sm9',
        url: 'https://www.nicovideo.jp/watch/sm9',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The current spelling of the same loader.
    it('should read the modern script form', async () => {
      const value = '<script src="https://embed.nicovideo.jp/watch/sm9/script"></script>'
      const expected: EmbedResolverResult = {
        provider: 'nicovideo',
        id: 'sm9',
        src: 'https://embed.nicovideo.jp/watch/sm9',
        url: 'https://www.nicovideo.jp/watch/sm9',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a protocol-relative src', async () => {
      const value = '<script src="//ext.nicovideo.jp/thumb_watch/sm9"></script>'
      const expected: EmbedResolverResult = {
        provider: 'nicovideo',
        id: 'sm9',
        src: 'https://embed.nicovideo.jp/watch/sm9',
        url: 'https://www.nicovideo.jp/watch/sm9',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a nicovideo script naming no video', async () => {
      const value = '<script src="https://ext.nicovideo.jp/thumb_watch/"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a sized script naming no video', async () => {
      const value = html`
        <script src="https://ext.nicovideo.jp/thumb_watch/?w=490&amp;h=307"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The selector matches on a substring, so another host can carry the path and pass it.
    it('should return undefined for another host spelling the nicovideo path', async () => {
      const value = html`
        <script src="https://evil.test/thumb_watch/sm9?nicovideo.jp/thumb_watch"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('nicovideoResolveEmbed', () => {
  // The old card host answers 403 now, so this rewrite repairs an embed that renders nothing.
  it('should rewrite the dead thumb card to the modern player', () => {
    const value = 'https://ext.nicovideo.jp/thumb/sm9'
    const expected: EmbedResolverResult = {
      provider: 'nicovideo',
      id: 'sm9',
      src: 'https://embed.nicovideo.jp/watch/sm9',
      url: 'https://www.nicovideo.jp/watch/sm9',
      ratio: '16/9',
    }

    expect(nicovideoResolveEmbed(value)).toEqual(expected)
  })

  it('should leave a modern player url as it stands', () => {
    const value = 'https://embed.nicovideo.jp/watch/sm9'
    const expected: EmbedResolverResult = {
      provider: 'nicovideo',
      id: 'sm9',
      src: 'https://embed.nicovideo.jp/watch/sm9',
      url: 'https://www.nicovideo.jp/watch/sm9',
      ratio: '16/9',
    }

    expect(nicovideoResolveEmbed(value)).toEqual(expected)
  })

  it('should mint the player for a numeric channel upload id', () => {
    const value = 'https://embed.nicovideo.jp/watch/1576909203/script?w=640&h=360'
    const expected: EmbedResolverResult = {
      provider: 'nicovideo',
      id: '1576909203',
      src: 'https://embed.nicovideo.jp/watch/1576909203',
      url: 'https://www.nicovideo.jp/watch/1576909203',
      ratio: '16/9',
    }

    expect(nicovideoResolveEmbed(value)).toEqual(expected)
  })

  it('should use a malformed video id as written, even if the player answers an error', () => {
    const value = 'https://embed.nicovideo.jp/watch/s&9'
    const expected: EmbedResolverResult = {
      provider: 'nicovideo',
      id: 's&9',
      src: 'https://embed.nicovideo.jp/watch/s&9',
      url: 'https://www.nicovideo.jp/watch/s&9',
      ratio: '16/9',
    }

    expect(nicovideoResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a nicovideo url naming no video', () => {
    const value = 'https://www.nicovideo.jp/ranking'

    expect(nicovideoResolveEmbed(value)).toBeUndefined()
  })

  // The video player answers 500 for a broadcast, so the two kinds cannot share a player url.
  it('should build the live card for a broadcast rather than the video player', () => {
    const value = 'https://live.nicovideo.jp/watch/lv346883570'
    const expected: EmbedResolverResult = {
      provider: 'nicovideo',
      id: 'lv346883570',
      src: 'https://live.nicovideo.jp/embed/lv346883570',
      url: 'https://live.nicovideo.jp/watch/lv346883570',
      ratio: '16/9',
    }

    expect(nicovideoResolveEmbed(value)).toEqual(expected)
  })

  // A broadcast written under the video host still names a broadcast.
  it('should build the live card for a broadcast named on the main host', () => {
    const value = 'https://www.nicovideo.jp/watch/lv346883570'
    const expected: EmbedResolverResult = {
      provider: 'nicovideo',
      id: 'lv346883570',
      src: 'https://live.nicovideo.jp/embed/lv346883570',
      url: 'https://live.nicovideo.jp/watch/lv346883570',
      ratio: '16/9',
    }

    expect(nicovideoResolveEmbed(value)).toEqual(expected)
  })
})

// The script is what a reader actually receives, so this asserts the whole placeholder the
// pipeline emits from it rather than the resolver's return value alone.
describeForEachParser('nicovideo through the pipeline', (parseHtml) => {
  const placeholder = async (value: string): Promise<Record<string, string>> => {
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })

    return readPlaceholder(result, parseHtml)
  }

  it('should carry every field across', async () => {
    const value = '<script src="https://ext.nicovideo.jp/thumb_watch/sm9?w=490&amp;h=307"></script>'
    const expected: Record<string, string> = {
      provider: 'nicovideo',
      id: 'sm9',
      src: 'https://embed.nicovideo.jp/watch/sm9',
      url: 'https://www.nicovideo.jp/watch/sm9',
      ratio: '16/9',
    }

    expect(await placeholder(value)).toEqual(expected)
  })

  // A script alone is deleted as empty markup, so without the resolver the video vanishes.
  it('should leave nothing behind when the script names no video', async () => {
    const value = '<script src="https://ext.nicovideo.jp/thumb_watch/"></script>'
    const expected: Record<string, string> = {}

    expect(await placeholder(value)).toEqual(expected)
  })
})

describe('isNicovideoReady', () => {
  it('should accept the message the player posts once it has loaded', () => {
    const value = {
      sourceConnectorType: 0,
      playerId: '1',
      eventName: 'loadComplete',
      data: {
        videoInfo: {
          watchId: 'sm9',
          videoId: 'sm9',
          title: '新・豪血寺一族 -煩悩解放 - レッツゴー！陰陽師',
        },
      },
    }

    expect(isNicovideoReady(value)).toBe(true)
  })

  it('should refuse another player event', () => {
    const value = {
      sourceConnectorType: 0,
      playerId: '1',
      eventName: 'playerStatusChange',
      data: { playerStatus: 1 },
    }

    expect(isNicovideoReady(value)).toBe(false)
  })

  it('should refuse the event name posted as a string', () => {
    expect(isNicovideoReady('loadComplete')).toBe(false)
  })
})
