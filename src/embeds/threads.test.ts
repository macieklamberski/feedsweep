import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedRenderHint, EmbedResolverResult } from '../types.js'
import { readPixels } from '../utils/hints.js'
import { threadsBlockquoteEmbedResolver, threadsRenderHint } from './threads.js'

describeForEachParser('threadsBlockquoteEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, threadsBlockquoteEmbedResolver)

  describe('happy paths', () => {
    it('should mint the frame from the dialog quote on threads.com', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.com/@jeremyburge/post/DM1953uN6IJ"
          data-text-post-version="0"
          id="ig-tp-DM1953uN6IJ"
          style=" background:#FFF; border-radius: 16px; max-width:540px; min-width:270px; padding:0;"
        >
          <a
            href="https://www.threads.com/@jeremyburge/post/DM1953uN6IJ?ref=example.com"
            target="_blank"
          >
            <div style=" padding: 40px; display: flex;">
              <div style=" font-size: 15px; font-weight: 600; ">View on Threads</div>
            </div>
          </a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'threads',
        id: 'DM1953uN6IJ',
        src: 'https://www.threads.com/@jeremyburge/post/DM1953uN6IJ/embed/',
        url: 'https://www.threads.com/@jeremyburge/post/DM1953uN6IJ',
        author: '@jeremyburge',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the threads.com frame from a threads.net permalink', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.net/@nevillehobson/post/C_KYbQ2CraN"
          data-text-post-version="0"
          id="ig-tp-C_KYbQ2CraN"
        >
          <a
            href="https://www.threads.net/@nevillehobson/post/C_KYbQ2CraN"
            target="_blank"
            rel="noopener"
          >
            <div>Post by @nevillehobson</div>
            <div>View on Threads</div>
          </a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'threads',
        id: 'C_KYbQ2CraN',
        src: 'https://www.threads.com/@nevillehobson/post/C_KYbQ2CraN/embed/',
        url: 'https://www.threads.com/@nevillehobson/post/C_KYbQ2CraN',
        author: '@nevillehobson',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the author of a short permalink from the quote text', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.net/t/Cu0kxb8vjmv"
          data-text-post-version="0"
          id="ig-tp-Cu0kxb8vjmv"
        >
          <a
            href="https://www.threads.net/t/Cu0kxb8vjmv?ref=example.com"
            target="_blank"
          >
            <div>Post by @jeremyburge</div> <div>View on Threads</div>
          </a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'threads',
        id: 'Cu0kxb8vjmv',
        src: 'https://www.threads.com/t/Cu0kxb8vjmv/embed/',
        url: 'https://www.threads.com/t/Cu0kxb8vjmv',
        author: '@jeremyburge',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the author of a short permalink from a minified dialog', async () => {
      // Constructed: 26de7f46's minified dialog with its permalink moved to the short route.
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.net/t/DBzlzJwvAAK"
        >
          <a
            href="https://www.threads.net/t/DBzlzJwvAAK"
            target="_blank"
          >
            <div><div>Post by @steelydoz</div><div>View on Threads</div></div>
          </a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'threads',
        id: 'DBzlzJwvAAK',
        src: 'https://www.threads.com/t/DBzlzJwvAAK/embed/',
        url: 'https://www.threads.com/t/DBzlzJwvAAK',
        author: '@steelydoz',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the permalink query and state no author when nothing names one', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.com/t/DUYfcCwDVYj?utm_source=th_embed&amp;utm_campaign=threads_api"
          data-text-post-version="0"
          id="ig-tp-DUYfcCwDVYj"
        >
          <a href="https://www.threads.com/t/DUYfcCwDVYj">View on Threads</a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'threads',
        id: 'DUYfcCwDVYj',
        src: 'https://www.threads.com/t/DUYfcCwDVYj/embed/',
        url: 'https://www.threads.com/t/DUYfcCwDVYj',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the post from the anchor of a copy with no permalink attribute', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          id="ig-tp-C3ajwbiu4LX"
        >
          <a
            href="https://www.threads.net/@angelo.stavrow/post/C3ajwbiu4LX?utm_source=droppedbits&amp;utm_medium=email"
            target="_blank"
          >
            <div>Post by @angelo.stavrow</div>
            <div>View on Threads</div>
          </a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'threads',
        id: 'C3ajwbiu4LX',
        src: 'https://www.threads.com/@angelo.stavrow/post/C3ajwbiu4LX/embed/',
        url: 'https://www.threads.com/@angelo.stavrow/post/C3ajwbiu4LX',
        author: '@angelo.stavrow',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the permalink attribute over the anchor', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.com/@manindrapandey/post/DXmlOTVH4bT?xmt=AQF09CHgJ5soX_eAx9cQptztCEnU3H-eEpMXjatLuhWiOg"
          data-text-post-version="0"
          id="ig-tp-C9EFD0pohZl"
        >
          <a
            href="https://www.threads.com/@weddiary_1/post/C9EFD0pohZl"
            target="_blank"
          >
            <div>View on Threads</div>
          </a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'threads',
        id: 'DXmlOTVH4bT',
        src: 'https://www.threads.com/@manindrapandey/post/DXmlOTVH4bT/embed/',
        url: 'https://www.threads.com/@manindrapandey/post/DXmlOTVH4bT',
        author: '@manindrapandey',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass a shortcode through as written', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.com/@someone/post/any.code~here"
        ></blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'threads',
        id: 'any.code~here',
        src: 'https://www.threads.com/@someone/post/any.code~here/embed/',
        url: 'https://www.threads.com/@someone/post/any.code~here',
        author: '@someone',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read an uppercase route word and mint it in lowercase', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.com/T/Cu0kxb8vjmv"
        ></blockquote>
      `
      const expected = {
        provider: 'threads',
        id: 'Cu0kxb8vjmv',
        src: 'https://www.threads.com/t/Cu0kxb8vjmv/embed/',
        url: 'https://www.threads.com/t/Cu0kxb8vjmv',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://evil.test/@jeremyburge/post/DM1953uN6IJ"
        ></blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the post route behind another segment', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.com/x/@jeremyburge/post/DM1953uN6IJ"
        ></blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route word that is not a post', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.com/@jeremyburge/reply/DM1953uN6IJ"
        ></blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a profile link', async () => {
      const value = html`
        <blockquote
          class="text-post-media"
          data-text-post-permalink="https://www.threads.com/@jeremyburge"
        ></blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a copy that names no post', async () => {
      const value = html`
        <blockquote class="wp-block-quote text-post-media is-layout-flow wp-block-quote-is-layout-flow">
          <p class="wp-block-paragraph">&nbsp;</p>
          <div style="font-size: 15px; line-height: 21px;">View on Threads</div>
        </blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a copy whose only anchor links a profile', async () => {
      const value = html`
        <blockquote class="text-post-media">
          <a href="https://www.threads.com/@jeremyburge">View on Threads</a>
        </blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('threadsRenderHint', () => {
  it('should read the bare height the frame posts', () => {
    const expected: EmbedRenderHint = {
      provider: 'threads',
      origin: 'https://www.threads.com',
      readHeight: readPixels,
    }

    expect(threadsRenderHint).toEqual(expected)
  })
})

describeForEachParser('threads through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should build the placeholder from the dialog quote and drop the loader', async () => {
    const value = html`
      <blockquote
        class="text-post-media"
        data-text-post-permalink="https://www.threads.com/@jeremyburge/post/DM1953uN6IJ"
        data-text-post-version="0"
        id="ig-tp-DM1953uN6IJ"
      >
        <a
          href="https://www.threads.com/@jeremyburge/post/DM1953uN6IJ?ref=example.com"
          target="_blank"
        >
          View on Threads
        </a>
      </blockquote>
      <script async src="https://www.threads.com/embed.js"></script>
    `
    const expected = html`
      <div
        data-embed-author="@jeremyburge"
        data-embed-url="https://www.threads.com/@jeremyburge/post/DM1953uN6IJ"
        data-embed-id="DM1953uN6IJ"
        data-embed-provider="threads"
        data-embed-src="https://www.threads.com/@jeremyburge/post/DM1953uN6IJ/embed/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
