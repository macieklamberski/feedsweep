import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  cloudflarestreamIframeEmbedResolver,
  cloudflarestreamResolveEmbed,
  cloudflarestreamScriptEmbedResolver,
} from './cloudflarestream.js'

describe('cloudflarestreamResolveEmbed', () => {
  describe('happy paths', () => {
    it('should take the poster as the thumbnail and keep only the loop in the src', () => {
      const value =
        'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/beb50392b3f14f49b01fb75b20d4cef7/iframe?controls=false&muted=true&preload=metadata&loop=true&autoplay=true&poster=https%3A%2F%2Fcustomer-qz3v4c7e4vfly110.cloudflarestream.com%2Fbeb50392b3f14f49b01fb75b20d4cef7%2Fthumbnails%2Fthumbnail.jpg%3Fheight%3D600'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'beb50392b3f14f49b01fb75b20d4cef7',
        src: 'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/beb50392b3f14f49b01fb75b20d4cef7/iframe?loop=true',
        thumbnail:
          'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/beb50392b3f14f49b01fb75b20d4cef7/thumbnails/thumbnail.jpg?height=600',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the loop and drop the muting and preload', () => {
      const value =
        'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/b0f6489638fab333b9767877fbf92a8c/iframe?muted=true&preload=metadata&loop=true'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'b0f6489638fab333b9767877fbf92a8c',
        src: 'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/b0f6489638fab333b9767877fbf92a8c/iframe?loop=true',
        thumbnail:
          'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/b0f6489638fab333b9767877fbf92a8c/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should take a poster stating its frame time as the thumbnail', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe?poster=https%3A%2F%2Fcustomer-2haawx7cuvbfttcn.cloudflarestream.com%2F35d8788a685e8cd8db81e6f3e2269e2a%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '35d8788a685e8cd8db81e6f3e2269e2a',
        src: 'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe',
        thumbnail:
          'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/thumbnails/thumbnail.jpg?time=&height=600',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should compose the thumbnail on the account host when no poster is stated', () => {
      const value =
        'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/12d9fb47f8bf1560187d3b57c26816f1/iframe?preload=metadata'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '12d9fb47f8bf1560187d3b57c26816f1',
        src: 'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/12d9fb47f8bf1560187d3b57c26816f1/iframe',
        thumbnail:
          'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/12d9fb47f8bf1560187d3b57c26816f1/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position', () => {
      const value =
        'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/12d9fb47f8bf1560187d3b57c26816f1/iframe?preload=metadata&startTime=90'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '12d9fb47f8bf1560187d3b57c26816f1',
        src: 'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/12d9fb47f8bf1560187d3b57c26816f1/iframe?startTime=90',
        thumbnail:
          'https://customer-qz3v4c7e4vfly110.cloudflarestream.com/12d9fb47f8bf1560187d3b57c26816f1/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should take the thumbnail off the bare host for the shared player', () => {
      const value = 'https://iframe.videodelivery.net/5653cfd537db1edbed98c5c0119f390c'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '5653cfd537db1edbed98c5c0119f390c',
        src: 'https://iframe.videodelivery.net/5653cfd537db1edbed98c5c0119f390c',
        thumbnail:
          'https://videodelivery.net/5653cfd537db1edbed98c5c0119f390c/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should read the iframe route on the bare shared host', () => {
      const value = 'https://videodelivery.net/5653cfd537db1edbed98c5c0119f390c/iframe'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '5653cfd537db1edbed98c5c0119f390c',
        src: 'https://videodelivery.net/5653cfd537db1edbed98c5c0119f390c/iframe',
        thumbnail:
          'https://videodelivery.net/5653cfd537db1edbed98c5c0119f390c/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', () => {
      const value = 'https://evil.test/35d8788a685e8cd8db81e6f3e2269e2a/iframe'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com.evil.test/35d8788a685e8cd8db81e6f3e2269e2a/iframe'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed video id as written, even if the player answers an error', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35D8788A685E8CD8DB81E6F3E2269E2A/iframe'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '35D8788A685E8CD8DB81E6F3E2269E2A',
        src: 'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35D8788A685E8CD8DB81E6F3E2269E2A/iframe',
        thumbnail:
          'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35D8788A685E8CD8DB81E6F3E2269E2A/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore the account host without the iframe route', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the shared host outside its iframe subdomain', () => {
      const value = 'https://videodelivery.net/5653cfd537db1edbed98c5c0119f390c'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the thumbnail route', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/thumbnails/thumbnail.jpg'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should use a signed token on the account host as written', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI5YzJlNDFhNyJ9.c2lnbmF0dXJl/iframe'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI5YzJlNDFhNyJ9.c2lnbmF0dXJl',
        src: 'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI5YzJlNDFhNyJ9.c2lnbmF0dXJl/iframe',
        thumbnail:
          'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI5YzJlNDFhNyJ9.c2lnbmF0dXJl/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should use a signed token on the shared player host as written', () => {
      const value =
        'https://iframe.videodelivery.net/eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI0ZjdiMGM4ZSJ9.c2lnbmF0dXJl'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI0ZjdiMGM4ZSJ9.c2lnbmF0dXJl',
        src: 'https://iframe.videodelivery.net/eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI0ZjdiMGM4ZSJ9.c2lnbmF0dXJl',
        thumbnail:
          'https://videodelivery.net/eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI0ZjdiMGM4ZSJ9.c2lnbmF0dXJl/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore the shared path on another delivery subdomain', () => {
      const value = 'https://embed.videodelivery.net/5653cfd537db1edbed98c5c0119f390c'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the iframe route under a prefix', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/embed/35d8788a685e8cd8db81e6f3e2269e2a/iframe'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the iframe route followed by another segment', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe/embed'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the shared player path under a prefix', () => {
      const value = 'https://iframe.videodelivery.net/embed/5653cfd537db1edbed98c5c0119f390c'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the iframe route with a trailing slash', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe/'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '35d8788a685e8cd8db81e6f3e2269e2a',
        src: 'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe',
        thumbnail:
          'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should compose the thumbnail when the poster parameter is empty', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe?poster='
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '35d8788a685e8cd8db81e6f3e2269e2a',
        src: 'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe',
        thumbnail:
          'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should compose the thumbnail when the poster is relative', () => {
      const value =
        'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe?poster=%2Fthumb.jpg'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '35d8788a685e8cd8db81e6f3e2269e2a',
        src: 'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe',
        thumbnail:
          'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('cloudflarestreamIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, cloudflarestreamIframeEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the player iframe', async () => {
      const value =
        '<iframe src="https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '35d8788a685e8cd8db81e6f3e2269e2a',
        src: 'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe',
        thumbnail:
          'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an iframe on a lookalike host', async () => {
      const value =
        '<iframe src="https://customer-2haawx7cuvbfttcn.cloudflarestream.com.evil.test/35d8788a685e8cd8db81e6f3e2269e2a/iframe"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should leave the stated title unread', async () => {
      const value = html`
        <iframe
          src="https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe"
          title="Stream video"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '35d8788a685e8cd8db81e6f3e2269e2a',
        src: 'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/iframe',
        thumbnail:
          'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('cloudflarestreamScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, cloudflarestreamScriptEmbedResolver)

  describe('happy paths', () => {
    it('should rebuild the player from the loader query', async () => {
      const value = html`
        <script
          data-cfasync="false"
          defer
          type="text/javascript"
          src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js?video=5653cfd537db1edbed98c5c0119f390c"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '5653cfd537db1edbed98c5c0119f390c',
        src: 'https://iframe.videodelivery.net/5653cfd537db1edbed98c5c0119f390c',
        thumbnail:
          'https://videodelivery.net/5653cfd537db1edbed98c5c0119f390c/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the loader served from the cloudflarestream host', async () => {
      const value =
        '<script src="https://embed.cloudflarestream.com/embed/r4xu.fla9.latest.js?video=5653cfd537db1edbed98c5c0119f390c"></script>'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '5653cfd537db1edbed98c5c0119f390c',
        src: 'https://iframe.videodelivery.net/5653cfd537db1edbed98c5c0119f390c',
        thumbnail:
          'https://videodelivery.net/5653cfd537db1edbed98c5c0119f390c/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the loader path', async () => {
      const value =
        '<script src="https://evil.test/embed/r4xu.fla9.latest.js?video=5653cfd537db1edbed98c5c0119f390c&embed.videodelivery.net/embed/"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader naming no video', async () => {
      const value =
        '<script src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed video id as written, even if the player answers an error', async () => {
      const value =
        '<script src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js?video=..%2F..%2F35d8788a685e8cd8db81e6f3e2269e2a"></script>'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '../../35d8788a685e8cd8db81e6f3e2269e2a',
        src: 'https://iframe.videodelivery.net/..%2F..%2F35d8788a685e8cd8db81e6f3e2269e2a',
        thumbnail:
          'https://videodelivery.net/..%2F..%2F35d8788a685e8cd8db81e6f3e2269e2a/thumbnails/thumbnail.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('the empty div the loader script writes into', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should leave one player where the wrapper held a script and an empty div', async () => {
    const value = html`
      <p>Watch the run.</p>
      <div class="cloudflare-stream">
        <div class="target"></div>
        <script
          data-cfasync="false"
          defer
          type="text/javascript"
          src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js?video=5653cfd537db1edbed98c5c0119f390c"
        ></script>
      </div>
    `
    const expected = html`
      <p>Watch the run.</p>
      <div
        data-embed-provider="cloudflarestream"
        data-embed-id="5653cfd537db1edbed98c5c0119f390c"
        data-embed-ratio="16/9"
        data-embed-src="https://iframe.videodelivery.net/5653cfd537db1edbed98c5c0119f390c"
        data-embed-thumbnail="https://videodelivery.net/5653cfd537db1edbed98c5c0119f390c/thumbnails/thumbnail.jpg"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should read a loader script standing on its own', async () => {
    const value = html`
      <p>Watch the run.</p>
      <script
        data-cfasync="false"
        defer
        type="text/javascript"
        src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js?video=5653cfd537db1edbed98c5c0119f390c"
      ></script>
    `
    const expected = html`
      <p>Watch the run.</p>
      <div
        data-embed-provider="cloudflarestream"
        data-embed-id="5653cfd537db1edbed98c5c0119f390c"
        data-embed-ratio="16/9"
        data-embed-src="https://iframe.videodelivery.net/5653cfd537db1edbed98c5c0119f390c"
        data-embed-thumbnail="https://videodelivery.net/5653cfd537db1edbed98c5c0119f390c/thumbnails/thumbnail.jpg"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})

// injectEnclosures offers every attachment to every url-keyed resolver, and Cloudflare Stream
// serves the download from the same hosts as the players, so only an enclosure test reaches the
// path where claiming a media url would cost a reader a playable element.
describeForEachParser('the download files the player hosts also serve', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a download enclosure on the account host playable', async () => {
    const enclosures = [
      {
        url: 'https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/downloads/default.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://customer-2haawx7cuvbfttcn.cloudflarestream.com/35d8788a685e8cd8db81e6f3e2269e2a/downloads/default.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  it('should leave a download enclosure on the delivery host playable', async () => {
    const enclosures = [
      {
        url: 'https://iframe.videodelivery.net/5653cfd537db1edbed98c5c0119f390c/downloads/default.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://iframe.videodelivery.net/5653cfd537db1edbed98c5c0119f390c/downloads/default.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
