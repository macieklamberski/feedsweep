import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { googledriveEmbedResolver, googledriveResolveEmbed } from './googledrive.js'

describe('googledriveResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the preview frame url', () => {
      const value = 'https://drive.google.com/file/d/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R/preview'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R',
        src: 'https://drive.google.com/file/d/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R/preview',
        url: 'https://drive.google.com/file/d/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R/view',
        thumbnail:
          'https://drive.google.com/thumbnail?id=1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R&sz=w640',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })

    it('should frame a file page the same way as its preview', () => {
      const value =
        'https://drive.google.com/file/d/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R/view?usp=sharing'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R',
        src: 'https://drive.google.com/file/d/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R/preview',
        url: 'https://drive.google.com/file/d/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R/view',
        thumbnail:
          'https://drive.google.com/thumbnail?id=1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R&sz=w640',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a folder listing', () => {
      const value =
        'https://drive.google.com/embeddedfolderview?id=1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R'

      expect(googledriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a folder page', () => {
      const value = 'https://drive.google.com/drive/folders/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R'

      expect(googledriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a file id carrying a separator', () => {
      const value = 'https://drive.google.com/file/d/1UVR7Liw%2F..%2Fother/preview'

      expect(googledriveResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('googledriveEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, googledriveEmbedResolver)

  describe('happy paths', () => {
    it('should take the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/file/d/1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q/preview"
          width="840"
          height="1600"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q',
        src: 'https://drive.google.com/file/d/1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q/preview',
        url: 'https://drive.google.com/file/d/1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q/view',
        thumbnail:
          'https://drive.google.com/thumbnail?id=1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q&sz=w640',
        width: 840,
        height: 1600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the file route in its path', async () => {
      const value = html`
        <iframe src="https://evil.test/drive.google.com/file/d/1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q/preview"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Drive also serves a file's bytes on `/uc`, which a feed can carry as an enclosure, and the
// resolver reaches that path only through the registered default list.
describeForEachParser('google drive through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a drive download enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://drive.google.com/uc?export=download&id=1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q',
        type: 'audio/mpeg',
      },
    ]
    const expected = html`
      <audio
        data-enclosure
        controls
        src="https://drive.google.com/uc?export=download&id=1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q"
      ></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
