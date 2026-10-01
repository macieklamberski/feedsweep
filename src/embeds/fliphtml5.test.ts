import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  fliphtml5IframeEmbedResolver,
  fliphtml5LightBoxEmbedResolver,
  fliphtml5ResolveEmbed,
} from './fliphtml5.js'

describe('fliphtml5ResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the cover and the book page from the account and the book', () => {
      const value = 'https://online.fliphtml5.com/mzsro/jvuq/'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mzsro/jvuq',
        src: 'https://online.fliphtml5.com/mzsro/jvuq/',
        url: 'https://online.fliphtml5.com/mzsro/jvuq/',
        thumbnail: 'https://online.fliphtml5.com/mzsro/jvuq/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the secret WordPress stamps on the frame', () => {
      const value = 'https://online.fliphtml5.com/mzsro/jvuq/#?secret=t5CbQCavWG'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mzsro/jvuq',
        src: 'https://online.fliphtml5.com/mzsro/jvuq/',
        url: 'https://online.fliphtml5.com/mzsro/jvuq/',
        thumbnail: 'https://online.fliphtml5.com/mzsro/jvuq/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the page the reader is sent to', () => {
      const value = 'https://online.fliphtml5.com/mnzqa/bbjl/#p=1'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mnzqa/bbjl',
        src: 'https://online.fliphtml5.com/mnzqa/bbjl/#p=1',
        url: 'https://online.fliphtml5.com/mnzqa/bbjl/',
        thumbnail: 'https://online.fliphtml5.com/mnzqa/bbjl/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker from the query', () => {
      const value = 'https://online.fliphtml5.com/mzsro/jvuq/?utm_source=x&utm_medium=y#p=1'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mzsro/jvuq',
        src: 'https://online.fliphtml5.com/mzsro/jvuq/#p=1',
        url: 'https://online.fliphtml5.com/mzsro/jvuq/',
        thumbnail: 'https://online.fliphtml5.com/mzsro/jvuq/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the https viewer from an http carrier', () => {
      const value = 'http://online.fliphtml5.com/mzsro/jvuq/'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mzsro/jvuq',
        src: 'https://online.fliphtml5.com/mzsro/jvuq/',
        url: 'https://online.fliphtml5.com/mzsro/jvuq/',
        thumbnail: 'https://online.fliphtml5.com/mzsro/jvuq/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the case and the hyphens of a custom book slug', () => {
      const value = 'https://online.fliphtml5.com/revku/JUNIO-2026-EDICION-224/'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'revku/JUNIO-2026-EDICION-224',
        src: 'https://online.fliphtml5.com/revku/JUNIO-2026-EDICION-224/',
        url: 'https://online.fliphtml5.com/revku/JUNIO-2026-EDICION-224/',
        thumbnail: 'https://online.fliphtml5.com/revku/JUNIO-2026-EDICION-224/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the case of an account', () => {
      const value = 'https://online.fliphtml5.com/ActuSF/wgas/'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'ActuSF/wgas',
        src: 'https://online.fliphtml5.com/ActuSF/wgas/',
        url: 'https://online.fliphtml5.com/ActuSF/wgas/',
        thumbnail: 'https://online.fliphtml5.com/ActuSF/wgas/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the underscores of a custom book slug', () => {
      const value = 'https://online.fliphtml5.com/revku/MARZO_2026_EDICION_221/'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'revku/MARZO_2026_EDICION_221',
        src: 'https://online.fliphtml5.com/revku/MARZO_2026_EDICION_221/',
        url: 'https://online.fliphtml5.com/revku/MARZO_2026_EDICION_221/',
        thumbnail: 'https://online.fliphtml5.com/revku/MARZO_2026_EDICION_221/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an account with no book, which the viewer 404s', () => {
      const value = 'https://online.fliphtml5.com/mzsro/'

      expect(fliphtml5ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a per-page asset under the book', () => {
      const value = 'https://online.fliphtml5.com/kgxw/wknu/files/large/2.jpg'

      expect(fliphtml5ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a file under the account, which the book segment never is', () => {
      const value = 'https://online.fliphtml5.com/mzsro/jvuq.pdf'

      expect(fliphtml5ResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed account as written, even if the player answers an error', () => {
      const value = 'https://online.fliphtml5.com/mz%2Fsro/jvuq/'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mz%2Fsro/jvuq',
        src: 'https://online.fliphtml5.com/mz%2Fsro/jvuq/',
        url: 'https://online.fliphtml5.com/mz%2Fsro/jvuq/',
        thumbnail: 'https://online.fliphtml5.com/mz%2Fsro/jvuq/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed book as written, even if the player answers an error', () => {
      const value = 'https://online.fliphtml5.com/mzsro/jv%2Fuq/'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mzsro/jv%2Fuq',
        src: 'https://online.fliphtml5.com/mzsro/jv%2Fuq/',
        url: 'https://online.fliphtml5.com/mzsro/jv%2Fuq/',
        thumbnail: 'https://online.fliphtml5.com/mzsro/jv%2Fuq/files/shot.jpg',
        ratio: '4/3',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore the shelf on the apex host', () => {
      const value = 'https://fliphtml5.com/homepage/mzsro/'

      expect(fliphtml5ResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('fliphtml5IframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, fliphtml5IframeEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the embed block declares', async () => {
      const value = html`
        <iframe
          src="https://online.fliphtml5.com/mzsro/jvuq/#?secret=t5CbQCavWG"
          width="640"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mzsro/jvuq',
        src: 'https://online.fliphtml5.com/mzsro/jvuq/',
        url: 'https://online.fliphtml5.com/mzsro/jvuq/',
        thumbnail: 'https://online.fliphtml5.com/mzsro/jvuq/files/shot.jpg',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the account and book path on a foreign host', async () => {
      const value = '<iframe src="https://evil.test/mzsro/jvuq/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('fliphtml5LightBoxEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, fliphtml5LightBoxEmbedResolver)

  describe('happy paths', () => {
    it('should open the book the cover links to in the viewer ratio over the declared box', async () => {
      const value = html`
        <img
          data-height="600"
          data-href="https://online.fliphtml5.com/nasgwb/smle/"
          data-rel="fh5-light-box-demo"
          data-title=""
          data-width="800"
          src="https://online.fliphtml5.com/nasgwb/smle/files/shot.jpg"
          width="100%"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'nasgwb/smle',
        src: 'https://online.fliphtml5.com/nasgwb/smle/',
        url: 'https://online.fliphtml5.com/nasgwb/smle/',
        thumbnail: 'https://online.fliphtml5.com/nasgwb/smle/files/shot.jpg',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an image linking to a book with no LightBox marker', async () => {
      const value = html`
        <img
          data-href="https://online.fliphtml5.com/nasgwb/smle/"
          src="https://online.fliphtml5.com/nasgwb/smle/files/shot.jpg"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a cover linking to a book on a foreign host', async () => {
      const value = html`
        <img
          data-href="https://evil.test/nasgwb/smle/"
          data-rel="fh5-light-box-demo"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should open the book in the viewer ratio over the cover image box', async () => {
      const value = html`
        <img
          data-href="https://online.fliphtml5.com/nasgwb/smle/"
          data-rel="fh5-light-box-demo"
          width="300"
          height="400"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'nasgwb/smle',
        src: 'https://online.fliphtml5.com/nasgwb/smle/',
        url: 'https://online.fliphtml5.com/nasgwb/smle/',
        thumbnail: 'https://online.fliphtml5.com/nasgwb/smle/files/shot.jpg',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// Only the pipeline shows what the host's enclosures become, since injectEnclosures offers each
// one to every url-keyed resolver.
describeForEachParser('fliphtml5 enclosures', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim a book page attached as an enclosure', async () => {
    const enclosures = [{ url: 'https://online.fliphtml5.com/mzsro/jvuq/', type: 'text/html' }]
    const expected = html`
      <div
        data-embed-src="https://online.fliphtml5.com/mzsro/jvuq/"
        data-embed-provider="fliphtml5"
        data-embed-id="mzsro/jvuq"
        data-embed-url="https://online.fliphtml5.com/mzsro/jvuq/"
        data-embed-thumbnail="https://online.fliphtml5.com/mzsro/jvuq/files/shot.jpg"
        data-enclosure=""
        data-embed-ratio="4/3"
      ></div>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  it('should leave a page image under the book an image', async () => {
    const enclosures = [
      { url: 'https://online.fliphtml5.com/kgxw/wknu/files/large/2.jpg', type: 'image/jpeg' },
    ]
    const expected = html`
      <img
        src="https://online.fliphtml5.com/kgxw/wknu/files/large/2.jpg"
        data-enclosure=""
      />
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
