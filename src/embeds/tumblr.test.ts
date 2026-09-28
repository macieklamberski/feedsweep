import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { readTumblrHeight, tumblrIframeEmbedResolver, tumblrPostEmbedResolver } from './tumblr.js'

describeForEachParser('tumblrIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tumblrIframeEmbedResolver)

  describe('happy paths', () => {
    it('should read the post out of the frame the loader hydrated', async () => {
      const value = html`
        <iframe
          class="tumblr-embed tumblr-embed-loaded"
          src="https://embed.tumblr.com/embed/post/t:AbCdEfGhIjKlMnOpQrStUv/123456789012345678/v2?width=542&language=en_US&did=f089eab98efb5ed4e0ba7e0485e22c1e707fd8e8"
          height="1391"
          title="Tumblr post"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tumblr',
        id: 'AbCdEfGhIjKlMnOpQrStUv/123456789012345678',
        src: 'https://embed.tumblr.com/embed/post/t:AbCdEfGhIjKlMnOpQrStUv/123456789012345678/v2?width=542&language=en_US&did=f089eab98efb5ed4e0ba7e0485e22c1e707fd8e8',
        height: 1391,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the embed route on a foreign host', async () => {
      const value = html`
        <iframe
          src="https://evil.test/embed/post/t:AbCd/123456789012345678/v2"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('tumblrPostEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tumblrPostEmbedResolver)

  describe('happy paths', () => {
    it('should take the frame and the post page out of the inert div', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/t:AbCdEfGhIjKlMnOpQrStUv/123456789012345678/v2"
          data-did="f089eab98efb5ed4e0ba7e0485e22c1e707fd8e8"
        >
          <a href="https://www.tumblr.com/exampleblog/123456789012345678"
            >https://www.tumblr.com/exampleblog/123456789012345678</a
          >
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tumblr',
        id: 'AbCdEfGhIjKlMnOpQrStUv/123456789012345678',
        src: 'https://embed.tumblr.com/embed/post/t:AbCdEfGhIjKlMnOpQrStUv/123456789012345678/v2',
        url: 'https://www.tumblr.com/exampleblog/123456789012345678',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the older route, which names the blog key bare', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/AbCdEfGhIjKlMnOpQrStUv/123456789012345678"
        >
          <a href="https://exampleblog.tumblr.com/post/123456789012345678">A post</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tumblr',
        id: 'AbCdEfGhIjKlMnOpQrStUv/123456789012345678',
        src: 'https://embed.tumblr.com/embed/post/AbCdEfGhIjKlMnOpQrStUv/123456789012345678',
        url: 'https://exampleblog.tumblr.com/post/123456789012345678',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a protocol-relative frame url, which nothing resolves for it', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="//embed.tumblr.com/embed/post/t:AbCd/123456789012345678/v2"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tumblr',
        id: 'AbCd/123456789012345678',
        src: 'https://embed.tumblr.com/embed/post/t:AbCd/123456789012345678/v2',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a frame url on a foreign host', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://evil.test/embed/post/t:AbCd/123456789012345678/v2"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a post path outside the embed route', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/share/post/t:AbCd/123456789012345678/v2"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a blog key carrying a separator', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/t:AbCd%2FEfGh/123456789012345678/v2"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a frame url that stops at the blog key', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/t:AbCdEfGhIjKlMnOpQrStUv"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a post id that is not a number', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/t:AbCd/latest/v2"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route word in place of the post id', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/t:AbCd/v2"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a post id with letters after its digits', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/t:AbCd/123456789012345678abc/v2"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route that is not a post', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/blog/t:AbCd/123456789012345678"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should name no page when the div carries no anchor', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/t:AbCd/123456789012345678/v2"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tumblr',
        id: 'AbCd/123456789012345678',
        src: 'https://embed.tumblr.com/embed/post/t:AbCd/123456789012345678/v2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should name no page when the anchor leaves tumblr', async () => {
      const value = html`
        <div
          class="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/t:AbCd/123456789012345678/v2"
        >
          <a href="https://evil.test/exampleblog/123456789012345678">A post</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tumblr',
        id: 'AbCd/123456789012345678',
        src: 'https://embed.tumblr.com/embed/post/t:AbCd/123456789012345678/v2',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describe('readTumblrHeight', () => {
  // What the post frame posts at 300 wide, as the JSON string its script builds.
  it('should read the height out of a size change', () => {
    const value = JSON.stringify({ method: 'tumblr-post:sizeChange', args: [669] })

    expect(readTumblrHeight(value)).toBe(669)
  })

  it('should read nothing from another method', () => {
    const value = JSON.stringify({ method: 'tumblr-post:_method_callback_responder', args: [669] })

    expect(readTumblrHeight(value)).toBeUndefined()
  })

  it('should read nothing from a zero height', () => {
    const value = JSON.stringify({ method: 'tumblr-post:sizeChange', args: [0] })

    expect(readTumblrHeight(value)).toBeUndefined()
  })

  it('should read nothing from a height that is not a number', () => {
    const value = JSON.stringify({ method: 'tumblr-post:sizeChange', args: ['tall'] })

    expect(readTumblrHeight(value)).toBeUndefined()
  })

  it('should read nothing when the arguments are not a list', () => {
    const value = JSON.stringify({ method: 'tumblr-post:sizeChange', args: '669' })

    expect(readTumblrHeight(value)).toBeUndefined()
  })

  it('should read nothing from a string that is not JSON', () => {
    expect(readTumblrHeight('tumblr-post:sizeChange')).toBeUndefined()
  })
})
