import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  dailymotionEmbedResolver,
  dailymotionRenderHint,
  dailymotionResolveEmbed,
  extractDailymotionId,
  readDailymotionEmbedSrc,
} from './dailymotion.js'

// Every url spelling that names a single video. All extract the same id, so a deleted row is a
// format that silently lost support.
const videoUrls = [
  'https://www.dailymotion.com/video/x7tgad0',
  'https://dai.ly/x7tgad0',
  'https://www.dailymotion.com/embed/video/x7tgad0',
  // A page builder keeps the url inside a JSON payload that no url pass rewrites, so the
  // protocol-relative spelling arrives exactly as the publisher wrote it.
  '//www.dailymotion.com/video/x7tgad0',
  // Both forms the Flash player shipped.
  'http://www.dailymotion.com/swf/x7tgad0',
  'http://www.dailymotion.com/swf/video/x7tgad0',
  // The Flash player took its parameters with `&` and no `?`, so they land in the path segment.
  'http://www.dailymotion.com/swf/x7tgad0&colors=background:000000;glow:000000',
  'http://www.dailymotion.com/swf/video/x7tgad0&colors=background:000000',
  'https://geo.dailymotion.com/player.html?video=x7tgad0',
  // Share urls append a title slug to the id.
  'https://www.dailymotion.com/video/x7tgad0_some-title',
  // The locale Dailymotion writes into the path, on the embed route and on the watch page.
  'https://www.dailymotion.com/embed/fr/video/x7tgad0',
  'https://www.dailymotion.com/es/video/x7tgad0',
]

// Every spelling that names a playlist rather than one video. None may yield a video id, and all
// resolve to the playlist player.
const playlistUrls = [
  'https://www.dailymotion.com/embed/playlist/x6zqmk',
  'https://www.dailymotion.com/playlist/x6zqmk',
  'https://geo.dailymotion.com/player.html?playlist=x6zqmk',
  // The locale form loads an empty player, so the id is repaired onto the plain playlist route.
  'https://www.dailymotion.com/embed/fr/playlist/x6zqmk',
  'https://www.dailymotion.com/fr/playlist/x6zqmk',
  // Share urls append a title slug here too, and every route spelling can carry one.
  'https://www.dailymotion.com/playlist/x6zqmk_some-playlist',
  'https://www.dailymotion.com/embed/playlist/x6zqmk_some-playlist',
  'https://www.dailymotion.com/embed/fr/playlist/x6zqmk_some-playlist',
  'https://geo.dailymotion.com/player.html?playlist=x6zqmk_some-playlist',
]

// The kinds Dailymotion's embed route serves besides a video. Probed 2026-09-07: each of these
// answers with an empty `video=` player or redirects to a landing page, while every word outside
// the set answers a real 404, so the segment is a route word and never an id.
const routeWordUrls = [
  'https://www.dailymotion.com/embed/user/x7tgad0',
  'https://www.dailymotion.com/embed/channel/x7tgad0',
  'https://www.dailymotion.com/embed/group/x7tgad0',
  'https://www.dailymotion.com/embed/tag/x7tgad0',
  'https://www.dailymotion.com/embed/search/x7tgad0',
  'https://www.dailymotion.com/embed/topic/x7tgad0',
  'https://www.dailymotion.com/embed/collection/x7tgad0',
  'https://www.dailymotion.com/embed/feed/x7tgad0',
  'https://www.dailymotion.com/embed/videos',
  'https://www.dailymotion.com/embed/live',
]

describe('extractDailymotionId', () => {
  it.each(videoUrls)('should extract the id from %s', (value) => {
    expect(extractDailymotionId(value)).toBe('x7tgad0')
  })

  it.each(playlistUrls)('should extract no video id from %s', (value) => {
    expect(extractDailymotionId(value)).toBeUndefined()
  })

  // The geo player states the video in its query, and a publisher who kept the path prefix
  // leaves a route word with nothing after it, so the query still has to be read.
  it('should read the query id when the path names no video', () => {
    const value = 'https://www.dailymotion.com/video/?video=x7tgad0'

    expect(extractDailymotionId(value)).toBe('x7tgad0')
  })

  // The oldest videos on the platform carry four characters, so an id test with a length floor
  // refused them: `x13i` was uploaded in 2005 and still answers with a title, a player and a
  // thumbnail.
  const fourCharacterIdUrls: Array<string> = [
    'https://www.dailymotion.com/video/x13i',
    'https://www.dailymotion.com/embed/video/x13i',
    'https://dai.ly/x13i',
  ]

  it.each(fourCharacterIdUrls)('should extract a four-character id from %s', (value) => {
    expect(extractDailymotionId(value)).toBe('x13i')
  })

  // A locale is only stepped over where a route word follows it. Dailymotion's own account
  // pages sit at the head of the path, so a two-letter handle there names no video.
  const accountPageUrls: Array<string> = [
    'https://www.dailymotion.com/fr/dailymotion',
    'https://www.dailymotion.com/embed/fr/user/dailymotion',
  ]

  it.each(accountPageUrls)('should extract no id from %s', (value) => {
    expect(extractDailymotionId(value)).toBeUndefined()
  })

  it('should use a malformed id with an encoded slash after it as written, even if the player answers an error', () => {
    const value = 'https://www.dailymotion.com/video/x7tgad0%2F'
    const expected = 'x7tgad0/'

    expect(extractDailymotionId(value)).toEqual(expected)
  })

  it('should use a malformed id with an encoded slash before it as written, even if the player answers an error', () => {
    const value = 'https://www.dailymotion.com/video/%2Fx7tgad0'
    const expected = '/x7tgad0'

    expect(extractDailymotionId(value)).toEqual(expected)
  })

  it('should extract no id behind a three-letter segment where the locale sits', () => {
    const value = 'https://www.dailymotion.com/fra/video/x7tgad0'

    expect(extractDailymotionId(value)).toBeUndefined()
  })

  it('should return undefined for an invalid url', () => {
    const value = 'not a url'

    expect(extractDailymotionId(value)).toBeUndefined()
  })
})

describe('dailymotionResolveEmbed', () => {
  it('should build the embed with a thumbnail', () => {
    const value = 'https://www.dailymotion.com/video/x7tgad0'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0',
      url: 'https://www.dailymotion.com/video/x7tgad0',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should encode a path id carrying an encoded slash once', () => {
    const value = 'https://www.dailymotion.com/embed/video/x8abc%2Fdef'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x8abc/def',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x8abc%2Fdef',
      url: 'https://www.dailymotion.com/video/x8abc%2Fdef',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x8abc%2Fdef',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should encode a playlist path id carrying an encoded slash once', () => {
    const value = 'https://www.dailymotion.com/embed/playlist/x6zq%2Fmk'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'playlist/x6zq/mk',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?playlist=x6zq%2Fmk',
      url: 'https://www.dailymotion.com/playlist/x6zq%2Fmk',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should preserve the start offset', () => {
    const value = 'https://www.dailymotion.com/embed/video/x8abcde?start=42'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x8abcde',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x8abcde&startTime=42',
      url: 'https://www.dailymotion.com/video/x8abcde',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x8abcde',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should read the start the player id form states', () => {
    const value = 'https://geo.dailymotion.com/player.html?video=x8abcde&startTime=42'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x8abcde',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x8abcde&startTime=42',
      url: 'https://www.dailymotion.com/video/x8abcde',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x8abcde',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should rebuild a player the publisher created on the player id', () => {
    const value = 'https://geo.dailymotion.com/player/xiqhk.html?video=x8pq78m'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x8pq78m',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x8pq78m',
      url: 'https://www.dailymotion.com/video/x8pq78m',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x8pq78m',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should keep the start and playlist of a player the publisher created', () => {
    const value =
      'https://geo.dailymotion.com/player/xe1o3.html?video=xak3lrq&startTime=0&playlist=x6zqmk'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'xak3lrq',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=xak3lrq&playlist=x6zqmk&startTime=0',
      url: 'https://www.dailymotion.com/video/xak3lrq',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/xak3lrq',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should keep the loop of a player the publisher created', () => {
    const value = 'https://geo.dailymotion.com/player/xiqhk.html?video=x8pq78m&loop=true'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x8pq78m',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x8pq78m&loop=true',
      url: 'https://www.dailymotion.com/video/x8pq78m',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x8pq78m',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should drop the settings of a player the publisher created', () => {
    const value = 'https://geo.dailymotion.com/player/x8zbz.html?video=x83gvxa&mute=true'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x83gvxa',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x83gvxa',
      url: 'https://www.dailymotion.com/video/x83gvxa',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x83gvxa',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should rebuild the generic player on the player id', () => {
    const value = 'https://geo.dailymotion.com/player.html?video=x8pq78m'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x8pq78m',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x8pq78m',
      url: 'https://www.dailymotion.com/video/x8pq78m',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x8pq78m',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should rebuild a player path behind another segment', () => {
    const value = 'https://geo.dailymotion.com/x/player/xiqhk.html?video=x8pq78m'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x8pq78m',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x8pq78m',
      url: 'https://www.dailymotion.com/video/x8pq78m',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x8pq78m',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should rebuild a player path with a segment after it', () => {
    const value = 'https://geo.dailymotion.com/player/xiqhk.html/extra?video=x8pq78m'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x8pq78m',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x8pq78m',
      url: 'https://www.dailymotion.com/video/x8pq78m',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x8pq78m',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should drop tracking parameters', () => {
    const value = 'https://www.dailymotion.com/embed/video/x8abcde?utm_source=feed'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x8abcde',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x8abcde',
      url: 'https://www.dailymotion.com/video/x8abcde',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x8abcde',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a dailymotion url naming no video', () => {
    const value = 'https://www.dailymotion.com/about'

    expect(dailymotionResolveEmbed(value)).toBeUndefined()
  })

  // Reaches the playlist reader's own parse guard: the video readers refuse first, so the
  // unparseable url arrives at the playlist branch too.
  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(dailymotionResolveEmbed(value)).toBeUndefined()
  })

  // The id is qualified because a playlist and a video share one grammar, and enrichment sees
  // the provider and the id alone. No thumbnail: `/thumbnail/playlist/{id}` answers 404.
  it.each(playlistUrls)('should build the playlist player from %s', (value) => {
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'playlist/x6zqmk',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?playlist=x6zqmk',
      url: 'https://www.dailymotion.com/playlist/x6zqmk',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  // The word only names a playlist where the route prefix ends. Scanning the whole path for it
  // read this search page, whose query is the word itself, as the playlist `videos`, which
  // `api.dailymotion.com/playlist/videos` answers 404 for.
  it('should refuse the playlist word sitting deeper in the path', () => {
    const value = 'https://www.dailymotion.com/search/playlist/videos'

    expect(dailymotionResolveEmbed(value)).toBeUndefined()
  })

  // Reading one of these as an id mints a player for whichever video happens to own the word:
  // `/embed/channel/{id}` yielded `channel` and pointed the placeholder at
  // `dailymotion.com/video/channel`.
  it.each(routeWordUrls)('should refuse the route word in %s', (value) => {
    expect(dailymotionResolveEmbed(value)).toBeUndefined()
  })

  // A video playing inside a playlist is still a video, so the playlist branch must not take it.
  it('should keep a video that names a playlist as a video', () => {
    const value = 'https://www.dailymotion.com/embed/video/x7tgad0?playlist=x6zqmk'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0&playlist=x6zqmk',
      url: 'https://www.dailymotion.com/video/x7tgad0',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should keep a decoded video id carrying a separator in one path segment', () => {
    const value = 'https://geo.dailymotion.com/player.html?video=x7tgad0%2F..%2Fx'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0/../x',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0%2F..%2Fx',
      url: 'https://www.dailymotion.com/video/x7tgad0%2F..%2Fx',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0%2F..%2Fx',
      ratio: '16/9',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })

  it('should keep a decoded playlist id carrying a separator in one path segment', () => {
    const value = 'https://geo.dailymotion.com/player.html?playlist=x6zqmk%2F..%2Fx'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'playlist/x6zqmk/../x',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?playlist=x6zqmk%2F..%2Fx',
      url: 'https://www.dailymotion.com/playlist/x6zqmk%2F..%2Fx',
    }

    expect(dailymotionResolveEmbed(value)).toEqual(expected)
  })
})

describe('readDailymotionEmbedSrc', () => {
  it('should build the player url from a pasted share link on the short domain', () => {
    const value = 'https://dai.ly/x7tgad0'
    const expected = 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0'

    expect(readDailymotionEmbedSrc(value)).toBe(expected)
  })
})

describeForEachParser('dailymotionEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, dailymotionEmbedResolver)

  it('should resolve a dailymotion iframe', async () => {
    const value = '<iframe src="https://www.dailymotion.com/embed/video/x7tgad0"></iframe>'
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0',
      url: 'https://www.dailymotion.com/video/x7tgad0',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should ignore a non-dailymotion iframe', async () => {
    const value = '<iframe src="https://example.com/video"></iframe>'

    expect(await extract(value)).toBeUndefined()
  })

  it('should ignore a foreign host carrying the same path', async () => {
    const value = '<iframe src="https://evil.test/embed/video/x7tgad0"></iframe>'

    expect(await extract(value)).toBeUndefined()
  })

  // The host check is what refused this, not the path reader. Each apex 301s straight to a
  // language landing page, dropping the video, so the id is worth more than the url the
  // publisher wrote.
  const countryApexUrls: Array<string> = [
    'https://www.dailymotion.fr/video/x7tgad0',
    'https://www.dailymotion.co.uk/video/x7tgad0',
    'https://www.dailymotion.es/video/x7tgad0',
    'https://www.dailymotion.it/video/x7tgad0',
  ]

  it.each(countryApexUrls)('should resolve a video on the %s apex', async (url) => {
    const value = `<iframe src="${url}"></iframe>`
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0',
      url: 'https://www.dailymotion.com/video/x7tgad0',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

// The probe offers every enclosure a feed carries to the url resolvers, and Dailymotion serves
// its own files under `/cdn/`. What leaves the media url alone is the route-word rule rather than
// the id test: `/cdn/` opens no route word, so no segment is read as an id at all.
describeForEachParser('dailymotion through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a dailymotion video enclosure playable', async () => {
    const enclosures = [
      { url: 'https://www.dailymotion.com/cdn/H264-320x240/video/x13i.mp4', type: 'video/mp4' },
    ]

    const expected = html`
      <video
        data-enclosure=""
        controls
        src="https://www.dailymotion.com/cdn/H264-320x240/video/x13i.mp4"
      ></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})

describeForEachParser('dailymotionEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, dailymotionEmbedResolver)

  it('should drop the label the snippet writes in place of the name', async () => {
    const value = html`
      <iframe src="https://www.dailymotion.com/embed/video/x7tgad0" title="Dailymotion Video Player"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0',
      url: 'https://www.dailymotion.com/video/x7tgad0',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should drop the French label the snippet writes in place of the name', async () => {
    const value = html`
      <iframe src="https://www.dailymotion.com/embed/video/x7tgad0" title="Lecteur vidéo Dailymotion"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0',
      url: 'https://www.dailymotion.com/video/x7tgad0',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should drop the powered-by label the snippet writes in place of the name', async () => {
    const value = html`
      <iframe src="https://www.dailymotion.com/embed/video/x7tgad0" title="Powered by Dailymotion"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0',
      url: 'https://www.dailymotion.com/video/x7tgad0',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should strip the label the snippet writes before the name', async () => {
    const value = html`
      <iframe src="https://www.dailymotion.com/embed/video/x7tgad0" title="Dailymotion video player – Zona Tec"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0',
      url: 'https://www.dailymotion.com/video/x7tgad0',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0',
      ratio: '16/9',
      title: 'Zona Tec',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should read the name the carrier states', async () => {
    const value = html`
      <iframe src="https://www.dailymotion.com/embed/video/x7tgad0" title="Le Grand Débat"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'dailymotion',
      id: 'x7tgad0',
      src: 'https://geo.dailymotion.com/player/xpiw2.html?video=x7tgad0',
      url: 'https://www.dailymotion.com/video/x7tgad0',
      thumbnail: 'https://www.dailymotion.com/thumbnail/video/x7tgad0',
      ratio: '16/9',
      title: 'Le Grand Débat',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

describe('dailymotionRenderHint', () => {
  it('should name the frame the way the player reads its message channel back', () => {
    const value = JSON.parse(decodeURIComponent(dailymotionRenderHint.frameName ?? ''))
    const expected = { dmInternalData: { iframeId: 'dm1' } }

    expect(value).toEqual(expected)
  })

  // Captured from `geo.dailymotion.com/player/xpiw2.html` framed with the hint's name.
  it('should recognise the ready event the player posts', () => {
    expect(dailymotionRenderHint.isReady?.('{"event":"apiready","id":"dm1"}')).toBe(true)
  })

  it('should ignore the ready event of a frame given another id', () => {
    expect(dailymotionRenderHint.isReady?.('{"event":"apiready","id":"dm2"}')).toBe(false)
  })

  it('should ignore the other events the player posts', () => {
    expect(dailymotionRenderHint.isReady?.('{"event":"playerstate","id":"dm1"}')).toBe(false)
  })

  it('should ignore a ready event posted as an object', () => {
    expect(dailymotionRenderHint.isReady?.({ event: 'apiready', id: 'dm1' })).toBe(false)
  })

  it('should ignore a string that is not JSON', () => {
    expect(dailymotionRenderHint.isReady?.('apiready')).toBe(false)
  })
})
