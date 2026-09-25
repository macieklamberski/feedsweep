import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { vidyardIframeEmbedResolver, vidyardImageEmbedResolver } from './vidyard.js'

describeForEachParser('vidyardIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vidyardIframeEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from a player url', async () => {
      const value = '<iframe src="https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.html"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'vidyard',
        id: 'gdoa8386mue3jppdkpZc9A',
        src: 'https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.html',
        url: 'https://share.vidyard.com/watch/gdoa8386mue3jppdkpZc9A',
        thumbnail: 'https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the empty query the share snippet writes', async () => {
      const value = html`
        <iframe
          class="vidyard_iframe"
          src="https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.html?"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'vidyard',
        id: 'gdoa8386mue3jppdkpZc9A',
        src: 'https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.html',
        url: 'https://share.vidyard.com/watch/gdoa8386mue3jppdkpZc9A',
        thumbnail: 'https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a player path served by a foreign host', async () => {
      const value = '<iframe src="https://evil.test/gdoa8386mue3jppdkpZc9A.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the player host in its path', async () => {
      const value =
        '<iframe src="https://evil.test/play.vidyard.com/gdoa8386mue3jppdkpZc9A.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://play.vidyard.com.evil.test/gdoa8386mue3jppdkpZc9A.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the loader script url', async () => {
      const value = '<iframe src="https://play.vidyard.com/embed/v4.js"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the thumbnail url', async () => {
      const value = '<iframe src="https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.jpg"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should ignore a player page nested under another path', async () => {
      const value =
        '<iframe src="https://play.vidyard.com/embed/gdoa8386mue3jppdkpZc9A.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the carrier title Vidyard has no verdict on', () => {
    it('should leave the stated title unread', async () => {
      const value = html`
        <iframe
          class="vidyard_iframe"
          title="Leica iCON CC180 Field Controller"
          src="https://play.vidyard.com/E7rMoLPPjKbkLhggEQYkLi.html?"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'vidyard',
        id: 'E7rMoLPPjKbkLhggEQYkLi',
        src: 'https://play.vidyard.com/E7rMoLPPjKbkLhggEQYkLi.html',
        url: 'https://share.vidyard.com/watch/E7rMoLPPjKbkLhggEQYkLi',
        thumbnail: 'https://play.vidyard.com/E7rMoLPPjKbkLhggEQYkLi.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('vidyardImageEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vidyardImageEmbedResolver)

  describe('happy paths', () => {
    it('should take the poster the publisher already wrote', async () => {
      const value = html`
        <img
          class="vidyard-player-embed"
          style="display:block;margin:auto;width:100%;"
          src="https://play.vidyard.com/mbaLFAg2MYJXZtKtHPY2sH.jpg"
          data-uuid="mbaLFAg2MYJXZtKtHPY2sH"
          data-v="4"
          data-type="inline"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'vidyard',
        id: 'mbaLFAg2MYJXZtKtHPY2sH',
        src: 'https://play.vidyard.com/mbaLFAg2MYJXZtKtHPY2sH.html',
        url: 'https://share.vidyard.com/watch/mbaLFAg2MYJXZtKtHPY2sH',
        thumbnail: 'https://play.vidyard.com/mbaLFAg2MYJXZtKtHPY2sH.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should compose the poster when the image states none', async () => {
      const value = html`
        <img
          class="vidyard-player-embed"
          data-uuid="usZcdjA3ec9sxvixST7xKf"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'vidyard',
        id: 'usZcdjA3ec9sxvixST7xKf',
        src: 'https://play.vidyard.com/usZcdjA3ec9sxvixST7xKf.html',
        url: 'https://share.vidyard.com/watch/usZcdjA3ec9sxvixST7xKf',
        thumbnail: 'https://play.vidyard.com/usZcdjA3ec9sxvixST7xKf.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an image that is not a Vidyard player', async () => {
      const value = html`
        <img
          class="wp-image-1024"
          src="https://play.vidyard.com/mbaLFAg2MYJXZtKtHPY2sH.jpg"
          data-uuid="mbaLFAg2MYJXZtKtHPY2sH"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a uuid carrying a path of its own', async () => {
      const value = html`
        <img
          class="vidyard-player-embed"
          data-uuid="../../stolen"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should take a uuid the markup pads with whitespace', async () => {
      const value = html`
        <img
          class="vidyard-player-embed"
          data-uuid=" usZcdjA3ec9sxvixST7xKf "
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'vidyard',
        id: 'usZcdjA3ec9sxvixST7xKf',
        src: 'https://play.vidyard.com/usZcdjA3ec9sxvixST7xKf.html',
        url: 'https://share.vidyard.com/watch/usZcdjA3ec9sxvixST7xKf',
        thumbnail: 'https://play.vidyard.com/usZcdjA3ec9sxvixST7xKf.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the carrier title Vidyard has no verdict on', () => {
    it('should leave the stated title unread', async () => {
      const value = html`
        <img
          class="vidyard-player-embed"
          title="Leica iCON CC180 Field Controller"
          data-uuid="E7rMoLPPjKbkLhggEQYkLi"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'vidyard',
        id: 'E7rMoLPPjKbkLhggEQYkLi',
        src: 'https://play.vidyard.com/E7rMoLPPjKbkLhggEQYkLi.html',
        url: 'https://share.vidyard.com/watch/E7rMoLPPjKbkLhggEQYkLi',
        thumbnail: 'https://play.vidyard.com/E7rMoLPPjKbkLhggEQYkLi.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('vidyard shapes the pipeline repairs first', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should resolve a protocol-relative player url', async () => {
    const value = '<p><iframe src="//play.vidyard.com/gdoa8386mue3jppdkpZc9A.html?"></iframe></p>'
    const expected = html`
      <div
        data-embed-thumbnail="https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.jpg"
        data-embed-url="https://share.vidyard.com/watch/gdoa8386mue3jppdkpZc9A"
        data-embed-id="gdoa8386mue3jppdkpZc9A"
        data-embed-provider="vidyard"
        data-embed-src="https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.html"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace the still frame the dropped loader script leaves behind', async () => {
    const value = html`
      <p>Watch the walkthrough:</p>
      <p>
        <script
          type="text/javascript"
          async
          src="https://play.vidyard.com/embed/v4.js"
        ></script>
        <img
          class="vidyard-player-embed"
          src="https://play.vidyard.com/usZcdjA3ec9sxvixST7xKf.jpg"
          data-uuid="usZcdjA3ec9sxvixST7xKf"
          data-v="4"
          data-type="inline"
        />
      </p>
    `
    const expected = html`
      <p>Watch the walkthrough:</p>
      <div
        data-embed-thumbnail="https://play.vidyard.com/usZcdjA3ec9sxvixST7xKf.jpg"
        data-embed-url="https://share.vidyard.com/watch/usZcdjA3ec9sxvixST7xKf"
        data-embed-id="usZcdjA3ec9sxvixST7xKf"
        data-embed-provider="vidyard"
        data-embed-src="https://play.vidyard.com/usZcdjA3ec9sxvixST7xKf.html"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a playable file on the player host alone', async () => {
    const enclosures = [
      { url: 'https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.mp4', type: 'video/mp4' },
    ]
    const expected = html`
      <video data-enclosure="" controls src="https://play.vidyard.com/gdoa8386mue3jppdkpZc9A.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
