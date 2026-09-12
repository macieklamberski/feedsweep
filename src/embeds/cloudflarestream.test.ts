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
    it('should keep the poster and drop the playback parameters', () => {
      const value =
        'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe?muted=true&preload=true&loop=true&autoplay=true&poster=https%3A%2F%2Fcustomer-k3f9x2mq7t1bv8dw.cloudflarestream.com%2F9c2e41a7b3d5486fa0c17e93d2b6f05a%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'k3f9x2mq7t1bv8dw/9c2e41a7b3d5486fa0c17e93d2b6f05a',
        src: 'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe?poster=https%3A%2F%2Fcustomer-k3f9x2mq7t1bv8dw.cloudflarestream.com%2F9c2e41a7b3d5486fa0c17e93d2b6f05a%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600',
        thumbnail:
          'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/thumbnails/thumbnail.jpg?time=&height=600',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should compose the thumbnail on the account host when no poster is stated', () => {
      const value =
        'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'k3f9x2mq7t1bv8dw/9c2e41a7b3d5486fa0c17e93d2b6f05a',
        src: 'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe',
        thumbnail:
          'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/thumbnails/thumbnail.jpg',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should take the thumbnail off the bare host for the shared player', () => {
      const value = 'https://iframe.videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '4f7b0c8e15d94a63b28e7fa0d6c13e59',
        src: 'https://iframe.videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59',
        thumbnail:
          'https://videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59/thumbnails/thumbnail.jpg',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', () => {
      const value = 'https://evil.test/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', () => {
      const value =
        'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com.evil.test/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the account host without the iframe route', () => {
      const value =
        'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the shared host outside its iframe subdomain', () => {
      const value = 'https://videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the thumbnail route', () => {
      const value =
        'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/thumbnails/thumbnail.jpg'

      expect(cloudflarestreamResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the iframe route with a trailing slash', () => {
      const value =
        'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe/'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'k3f9x2mq7t1bv8dw/9c2e41a7b3d5486fa0c17e93d2b6f05a',
        src: 'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe',
        thumbnail:
          'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/thumbnails/thumbnail.jpg',
      }

      expect(cloudflarestreamResolveEmbed(value)).toEqual(expected)
    })

    it('should compose the thumbnail when the poster parameter is empty', () => {
      const value =
        'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe?poster='
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'k3f9x2mq7t1bv8dw/9c2e41a7b3d5486fa0c17e93d2b6f05a',
        src: 'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe',
        thumbnail:
          'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/thumbnails/thumbnail.jpg',
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
        '<iframe src="https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'k3f9x2mq7t1bv8dw/9c2e41a7b3d5486fa0c17e93d2b6f05a',
        src: 'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe',
        thumbnail:
          'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/thumbnails/thumbnail.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an iframe on a lookalike host', async () => {
      const value =
        '<iframe src="https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com.evil.test/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should leave the stated title unread', async () => {
      const value = html`
        <iframe
          src="https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe"
          title="Stream video"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: 'k3f9x2mq7t1bv8dw/9c2e41a7b3d5486fa0c17e93d2b6f05a',
        src: 'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/iframe',
        thumbnail:
          'https://customer-k3f9x2mq7t1bv8dw.cloudflarestream.com/9c2e41a7b3d5486fa0c17e93d2b6f05a/thumbnails/thumbnail.jpg',
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
          src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js?video=4f7b0c8e15d94a63b28e7fa0d6c13e59"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '4f7b0c8e15d94a63b28e7fa0d6c13e59',
        src: 'https://iframe.videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59',
        thumbnail:
          'https://videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59/thumbnails/thumbnail.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the loader served from the cloudflarestream host', async () => {
      const value =
        '<script src="https://embed.cloudflarestream.com/embed/r4xu.fla9.latest.js?video=4f7b0c8e15d94a63b28e7fa0d6c13e59"></script>'
      const expected: EmbedResolverResult = {
        provider: 'cloudflarestream',
        id: '4f7b0c8e15d94a63b28e7fa0d6c13e59',
        src: 'https://iframe.videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59',
        thumbnail:
          'https://videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59/thumbnails/thumbnail.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the loader path', async () => {
      const value =
        '<script src="https://evil.test/embed.videodelivery.net/embed/r4xu.fla9.latest.js?video=4f7b0c8e15d94a63b28e7fa0d6c13e59"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader naming no video', async () => {
      const value =
        '<script src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should refuse a video id carrying a path of its own', async () => {
      const value =
        '<script src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js?video=..%2F..%2F9c2e41a7b3d5486fa0c17e93d2b6f05a"></script>'

      expect(await extract(value)).toBeUndefined()
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
          src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js?video=4f7b0c8e15d94a63b28e7fa0d6c13e59"
        ></script>
      </div>
    `
    const expected = html`
      <p>Watch the run.</p>
      <div
        data-embed-provider="cloudflarestream"
        data-embed-id="4f7b0c8e15d94a63b28e7fa0d6c13e59"
        data-embed-src="https://iframe.videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59"
        data-embed-thumbnail="https://videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59/thumbnails/thumbnail.jpg"
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
        src="https://embed.videodelivery.net/embed/r4xu.fla9.latest.js?video=4f7b0c8e15d94a63b28e7fa0d6c13e59"
      ></script>
    `
    const expected = html`
      <p>Watch the run.</p>
      <div
        data-embed-provider="cloudflarestream"
        data-embed-id="4f7b0c8e15d94a63b28e7fa0d6c13e59"
        data-embed-src="https://iframe.videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59"
        data-embed-thumbnail="https://videodelivery.net/4f7b0c8e15d94a63b28e7fa0d6c13e59/thumbnails/thumbnail.jpg"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
