import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  nprFlashEmbedResolver,
  nprFlashResolveEmbed,
  nprIframeEmbedResolver,
  nprResolveEmbed,
} from './npr.js'

describe('nprResolveEmbed', () => {
  describe('happy paths', () => {
    it('should carry the story and the media as one id', () => {
      const value = 'https://www.npr.org/player/embed/550179668/551339989'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '550179668/551339989',
        src: 'https://www.npr.org/player/embed/550179668/551339989',
        height: 290,
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })

    it('should carry a pair in the current id format', () => {
      const value = 'https://www.npr.org/player/embed/nx-s1-5349649/nx-s1-5412080-1'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'nx-s1-5349649/nx-s1-5412080-1',
        src: 'https://www.npr.org/player/embed/nx-s1-5349649/nx-s1-5412080-1',
        height: 290,
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })

    it('should carry a media id in the current uuid format', () => {
      const value =
        'https://www.npr.org/player/embed/nx-s1-4998608/nx-s1-0ba1ec94-a86d-43fb-a29e-759dbf514ed2'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'nx-s1-4998608/nx-s1-0ba1ec94-a86d-43fb-a29e-759dbf514ed2',
        src: 'https://www.npr.org/player/embed/nx-s1-4998608/nx-s1-0ba1ec94-a86d-43fb-a29e-759dbf514ed2',
        height: 290,
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })

    it('should carry a pair off the video player without the media type', () => {
      const value =
        'https://www.npr.org/embedded-video?storyId=g-s1-74060&mediaId=g-s1-74060-100&jwMediaType=music'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'video/g-s1-74060/g-s1-74060-100',
        src: 'https://www.npr.org/embedded-video?storyId=g-s1-74060&mediaId=g-s1-74060-100',
        ratio: '16/9',
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })

    it('should repair the retired video template onto the video player', () => {
      const value =
        'http://www.npr.org/templates/event/embeddedVideo.php?storyId=191047262&mediaId=191050756'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'video/191047262/191050756',
        src: 'https://www.npr.org/embedded-video?storyId=191047262&mediaId=191050756',
        ratio: '16/9',
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })

    it('should repair the dead video player page onto the video player', () => {
      const value =
        'https://www.npr.org/player/embeddable/video/player.html?i=141331825&m=141398010'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'video/141331825/141398010',
        src: 'https://www.npr.org/embedded-video?storyId=141331825&mediaId=141398010',
        ratio: '16/9',
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a story page', () => {
      const value = 'https://www.npr.org/sections/thetwo-way/2017/01/01/500000000/a-story'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player naming one id only', () => {
      const value = 'https://www.npr.org/player/embed/550179668'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a pair on a route other than the player', () => {
      const value = 'https://www.npr.org/foo/bar/1/2'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a pair under the player on a route other than embed', () => {
      const value = 'https://www.npr.org/player/foo/340005056/340005057'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a pair under embed on a route other than the player', () => {
      const value = 'https://www.npr.org/foo/embed/340005056/340005057'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player naming a third segment', () => {
      const value = 'https://www.npr.org/player/embed/1/2/3'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player path on a foreign host', () => {
      const value = 'https://evil.test/player/embed/1/2'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player path on the file host', () => {
      const value = 'https://ondemand.npr.org/player/embed/550179668/551339989'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an episode file', () => {
      const value = 'https://ondemand.npr.org/anon.npr-mp3/npr/me/2026/09/20260928_me_01.mp3'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video player naming no media', () => {
      const value = 'https://www.npr.org/embedded-video?storyId=141331825'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video player naming no story', () => {
      const value = 'https://www.npr.org/embedded-video?mediaId=141398010'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the video player below another path', () => {
      const value = 'https://www.npr.org/x/embedded-video?storyId=141331825&mediaId=141398010'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path below the video player', () => {
      const value = 'https://www.npr.org/embedded-video/extra?storyId=141331825&mediaId=141398010'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route other than the video player', () => {
      const value = 'https://www.npr.org/embedded-foo?storyId=141331825&mediaId=141398010'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the video player path on a foreign host', () => {
      const value = 'https://evil.test/embedded-video?storyId=141331825&mediaId=141398010'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed media id as written, even if the player answers an error', () => {
      const value = 'https://www.npr.org/player/embed/550179668/551339989%3Fautoplay%3D1'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '550179668/551339989%3Fautoplay%3D1',
        src: 'https://www.npr.org/player/embed/550179668/551339989%3Fautoplay%3D1',
        height: 290,
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed video media id as written, even if the player answers an error', () => {
      const value = 'https://www.npr.org/embedded-video?storyId=141331825&mediaId=141398010%26x%3D1'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'video/141331825/141398010&x=1',
        src: 'https://www.npr.org/embedded-video?storyId=141331825&mediaId=141398010%26x%3D1',
        ratio: '16/9',
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })
  })
})

describe('nprFlashResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the pair off the retired Flash player', () => {
      const value = 'http://www.npr.org/v2/?i=340005056&m=340005057&t=audio'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '340005056/340005057',
        src: 'https://www.npr.org/player/embed/340005056/340005057',
        height: 290,
      }

      expect(nprFlashResolveEmbed(value)).toEqual(expected)
    })

    it('should read a Flash player spelled without its trailing slash', () => {
      const value = 'http://www.npr.org/v2?i=340005056&m=340005057&t=audio'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '340005056/340005057',
        src: 'https://www.npr.org/player/embed/340005056/340005057',
        height: 290,
      }

      expect(nprFlashResolveEmbed(value)).toEqual(expected)
    })

    it('should read a Flash query joined with semicolons', () => {
      const value = 'http://www.npr.org/v2/?i=365994454&m=365995120;t=audio'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '365994454/365995120',
        src: 'https://www.npr.org/player/embed/365994454/365995120',
        height: 290,
      }

      expect(nprFlashResolveEmbed(value)).toEqual(expected)
    })

    it('should mint a video pair onto the video player', () => {
      const value = 'http://www.npr.org/v2/?i=131050832&m=131389645&t=video'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'video/131050832/131389645',
        src: 'https://www.npr.org/embedded-video?storyId=131050832&mediaId=131389645',
        ratio: '16/9',
      }

      expect(nprFlashResolveEmbed(value)).toEqual(expected)
    })

    it('should mint a video pair joined with semicolons onto the video player', () => {
      const value = 'http://www.npr.org/v2/?i=131050832&m=131389645;t=video'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'video/131050832/131389645',
        src: 'https://www.npr.org/embedded-video?storyId=131050832&mediaId=131389645',
        ratio: '16/9',
      }

      expect(nprFlashResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a Flash player naming no media', () => {
      const value = 'http://www.npr.org/v2/?i=340005056&t=audio'

      expect(nprFlashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video pair naming no media', () => {
      const value = 'http://www.npr.org/v2/?i=131050832&t=video'

      expect(nprFlashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path other than the Flash player', () => {
      const value = 'http://www.npr.org/v3/?i=340005056&m=340005057&t=audio'

      expect(nprFlashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path below the Flash player', () => {
      const value = 'http://www.npr.org/v2/player/?i=340005056&m=340005057&t=audio'

      expect(nprFlashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Flash path on a foreign host', () => {
      const value = 'http://evil.test/v2/?i=340005056&m=340005057&t=audio'

      expect(nprFlashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the story player', () => {
      const value = 'https://www.npr.org/player/embed/550179668/551339989'

      expect(nprFlashResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed Flash media id as written, even if the player answers an error', () => {
      const value = 'http://www.npr.org/v2/?i=340005056&m=340005057/../../stolen&t=audio'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '340005056/340005057/../../stolen',
        src: 'https://www.npr.org/player/embed/340005056/340005057/../../stolen',
        height: 290,
      }

      expect(nprFlashResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('nprFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, nprFlashEmbedResolver)

  describe('happy paths', () => {
    it('should state the player height over the box the Flash carrier declared', async () => {
      const value = html`
        <embed
          allowfullscreen="true"
          base="http://www.npr.org"
          height="386"
          src="http://www.npr.org/v2/?i=340005056&m=340005057&t=audio"
          type="application/x-shockwave-flash"
          width="400"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '340005056/340005057',
        src: 'https://www.npr.org/player/embed/340005056/340005057',
        height: 290,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the video ratio over the box the Flash carrier declared', async () => {
      const value = html`
        <embed
          allowfullscreen="true"
          base="http://www.npr.org"
          height="386"
          src="http://www.npr.org/v2/?i=131050832&#38;m=131389645&#38;t=video"
          type="application/x-shockwave-flash"
          width="400"
          wmode="opaque"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'video/131050832/131389645',
        src: 'https://www.npr.org/embedded-video?storyId=131050832&mediaId=131389645',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the Flash player path', async () => {
      const value = '<embed src="https://evil.test/v2/?i=340005056&m=340005057&t=audio" />'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('nprIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, nprIframeEmbedResolver)

  describe('happy paths', () => {
    it('should read the player iframe NPR generates', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="290"
          scrolling="no"
          src="https://www.npr.org/player/embed/550179668/551339989"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '550179668/551339989',
        src: 'https://www.npr.org/player/embed/550179668/551339989',
        height: 290,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the box of the retired video template iframe', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="338"
          scrolling="no"
          src="https://www.npr.org/templates/event/embeddedVideo.php?storyId=673291531&mediaId=673300770"
          width="600"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'video/673291531/673300770',
        src: 'https://www.npr.org/embedded-video?storyId=673291531&mediaId=673300770',
        width: 600,
        height: 338,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the video ratio for a video iframe declaring none', async () => {
      const value =
        '<iframe src="https://www.npr.org/embedded-video?storyId=141331825&mediaId=141398010"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: 'video/141331825/141398010',
        src: 'https://www.npr.org/embedded-video?storyId=141331825&mediaId=141398010',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the player height for an iframe declaring none', async () => {
      const value = '<iframe src="https://www.npr.org/player/embed/550179668/551339989"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '550179668/551339989',
        src: 'https://www.npr.org/player/embed/550179668/551339989',
        height: 290,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', async () => {
      const value = '<iframe src="https://evil.test/player/embed/550179668/551339989"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('npr through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave an NPR audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://ondemand.npr.org/anon.npr-mp3/npr/me/2026/09/20260928_me_01.mp3',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio data-enclosure="" controls src="https://ondemand.npr.org/anon.npr-mp3/npr/me/2026/09/20260928_me_01.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
