import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
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

    it('should build the player from an embed url on the www host', () => {
      const value = 'https://www.tenor.com/embed/16892698'
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
    it('should ignore the embed path on the host that serves the files', () => {
      const value = 'https://media.tenor.com/embed/16892698'

      expect(tenorResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the view page, which is not a frame', () => {
      const value = 'https://tenor.com/view/madam-cj-walker-gif-16892698'

      expect(tenorResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the view page addressed by its bare post id', () => {
      const value = 'https://tenor.com/view/16892698'

      expect(tenorResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a search page', () => {
      const value = 'https://tenor.com/search/cats-gifs'

      expect(tenorResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed post id as written, even if the player answers an error', () => {
      const value = 'https://tenor.com/embed/embed.js'
      const expected: EmbedResolverResult = {
        provider: 'tenor',
        id: 'embed.js',
        src: 'https://tenor.com/embed/embed.js',
        url: 'https://tenor.com/view/embed.js',
      }

      expect(tenorResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('tenorWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tenorWidgetEmbedResolver)

  describe('happy paths', () => {
    // `data-aspect-ratio` is the carrier's, which shallow handling does not read.
    it('should read the post and the name off the share snippet over its ratio', async () => {
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
        ratio: '1.33/1',
        title: 'Madam Cj Walker GIF',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it("should state the loader's default ratio for a snippet with no ratio", async () => {
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
        ratio: '1.33/1',
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
        ratio: '1.33/1',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should use a malformed post id as written, even if the player answers an error', async () => {
      const value = html`
        <div
          class="tenor-gif-embed"
          data-postid="../../search/cats"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tenor',
        id: '../../search/cats',
        src: 'https://tenor.com/embed/../../search/cats',
        url: 'https://tenor.com/view/../../search/cats',
        ratio: '1.33/1',
      }

      expect(await extract(value)).toEqual(expected)
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
    it('should ignore the embed path on a foreign host', async () => {
      const value = html`
        <iframe src="https://evil.test/embed/16892698"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Tenor serves the GIF's files from subdomains of tenor.com, which the frame resolver refuses
// by host, so a claimed file would cost a reader the GIF.
describeForEachParser('tenor files through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a tenor video enclosure playable', async () => {
    const enclosures = [
      { url: 'https://media.tenor.com/6KBpCAEUnoAAAAPo/madam-cj-walker.mp4', type: 'video/mp4' },
    ]
    const expected = html`
      <video data-enclosure="" controls src="https://media.tenor.com/6KBpCAEUnoAAAAPo/madam-cj-walker.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  it('should leave a tenor image enclosure showing', async () => {
    const enclosures = [
      { url: 'https://media1.tenor.com/m/6KBpCAEUnoAAAAAC/madam-cj-walker.gif', type: 'image/gif' },
    ]
    const expected = html`
      <img data-enclosure="" src="https://media1.tenor.com/m/6KBpCAEUnoAAAAAC/madam-cj-walker.gif">
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
