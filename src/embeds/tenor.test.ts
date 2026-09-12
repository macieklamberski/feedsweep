import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { tenorIframeEmbedResolver, tenorResolveEmbed, tenorWidgetEmbedResolver } from './tenor.js'

describe('tenorResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the player from an embed url', () => {
      const value = 'https://tenor.com/embed/16892698'
      const expected: EmbedResolverResult = {
        provider: 'tenor',
        id: '16892698',
        src: 'https://tenor.com/embed/16892698',
        url: 'https://tenor.com/view/16892698',
      }

      expect(tenorResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the view page, which is not a frame', () => {
      const value = 'https://tenor.com/view/madam-cj-walker-gif-16892698'

      expect(tenorResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a search page', () => {
      const value = 'https://tenor.com/search/cats-gifs'

      expect(tenorResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a post id that is not digits', () => {
      const value = 'https://tenor.com/embed/embed.js'

      expect(tenorResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('tenorWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tenorWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should read the post, the name and the shape off the share snippet', async () => {
      const value = html`
        <div
          class="tenor-gif-embed"
          data-postid="16892698"
          data-share-method="host"
          data-aspect-ratio="1.77778"
          data-width="100%"
        >
          <a href="https://tenor.com/view/madam-cj-walker-gif-16892698">Madam Cj Walker GIF</a>
          from
          <a href="https://tenor.com/search/madam-cj-walker-gifs">Madam Cj Walker GIFs</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tenor',
        id: '16892698',
        src: 'https://tenor.com/embed/16892698',
        url: 'https://tenor.com/view/16892698',
        ratio: '1.77778/1',
        title: 'Madam Cj Walker GIF',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a snippet that states no shape and no name', async () => {
      const value = html`
        <div
          class="tenor-gif-embed"
          data-postid="16892698"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tenor',
        id: '16892698',
        src: 'https://tenor.com/embed/16892698',
        url: 'https://tenor.com/view/16892698',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The search link names a query, so it is never the GIF's name.
    it('should not take the name off the search link', async () => {
      const value = html`
        <div
          class="tenor-gif-embed"
          data-postid="16892698"
        >
          <a href="https://tenor.com/search/madam-cj-walker-gifs">Madam Cj Walker GIFs</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tenor',
        id: '16892698',
        src: 'https://tenor.com/embed/16892698',
        url: 'https://tenor.com/view/16892698',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a post id that is not digits', async () => {
      const value = html`
        <div
          class="tenor-gif-embed"
          data-postid="../../search/cats"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('tenorIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tenorIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the frame a publisher pasted', async () => {
      const value = html`
        <iframe src="https://tenor.com/embed/16892698"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tenor',
        id: '16892698',
        src: 'https://tenor.com/embed/16892698',
        url: 'https://tenor.com/view/16892698',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the path', async () => {
      const value = html`
        <iframe src="https://evil.test/tenor.com/embed/16892698"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
