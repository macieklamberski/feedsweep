import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { googledriveEmbedResolver, googledriveResolveEmbed } from './googledrive.js'

describe('googledriveResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the preview frame url', () => {
      const value = 'https://drive.google.com/file/d/1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r/preview'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r',
        src: 'https://drive.google.com/file/d/1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r/preview',
        url: 'https://drive.google.com/file/d/1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r/view',
        thumbnail:
          'https://drive.google.com/thumbnail?id=1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r&sz=w640',
        ratio: '4/3',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })

    it('should frame a file page the same way as its preview', () => {
      const value =
        'https://drive.google.com/file/d/1sefYqtj-3TfSZEq2qvoiPY16_F0jAk6G/view?usp=sharing'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1sefYqtj-3TfSZEq2qvoiPY16_F0jAk6G',
        src: 'https://drive.google.com/file/d/1sefYqtj-3TfSZEq2qvoiPY16_F0jAk6G/preview',
        url: 'https://drive.google.com/file/d/1sefYqtj-3TfSZEq2qvoiPY16_F0jAk6G/view',
        thumbnail:
          'https://drive.google.com/thumbnail?id=1sefYqtj-3TfSZEq2qvoiPY16_F0jAk6G&sz=w640',
        ratio: '4/3',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the drive spelling from a legacy docs frame', () => {
      const value = 'https://docs.google.com/file/d/0ByrtauTmPYKtR3dPN0lxY2hwdFE/preview'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '0ByrtauTmPYKtR3dPN0lxY2hwdFE',
        src: 'https://drive.google.com/file/d/0ByrtauTmPYKtR3dPN0lxY2hwdFE/preview',
        url: 'https://drive.google.com/file/d/0ByrtauTmPYKtR3dPN0lxY2hwdFE/view',
        thumbnail: 'https://drive.google.com/thumbnail?id=0ByrtauTmPYKtR3dPN0lxY2hwdFE&sz=w640',
        ratio: '4/3',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a resource key in the frame alone', () => {
      const value =
        'https://drive.google.com/file/d/0Bzq4uXIf8dNTVS1wQl9sME5FcFE/preview?resourcekey=0-aeSGEHR1GEcB98yGmsP_XA'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '0Bzq4uXIf8dNTVS1wQl9sME5FcFE',
        src: 'https://drive.google.com/file/d/0Bzq4uXIf8dNTVS1wQl9sME5FcFE/preview?resourcekey=0-aeSGEHR1GEcB98yGmsP_XA',
        ratio: '4/3',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a google doc on the legacy host', () => {
      const value = 'https://docs.google.com/document/d/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R/edit'

      expect(googledriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a file route with an account segment before the id', () => {
      const value = 'https://drive.google.com/file/u/0/d/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R/preview'

      expect(googledriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a folder listing', () => {
      const value =
        'https://drive.google.com/embeddedfolderview?id=1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R'

      expect(googledriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a folder page', () => {
      const value = 'https://drive.google.com/drive/folders/1UVR7LiwlrKoff6cJI32-H6zWrwyu4-4R'

      expect(googledriveResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed file id as written, even if the player answers an error', () => {
      const value = 'https://drive.google.com/file/d/1UVR7Liw%2F..%2Fother/preview'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1UVR7Liw%2F..%2Fother',
        src: 'https://drive.google.com/file/d/1UVR7Liw%2F..%2Fother/preview',
        url: 'https://drive.google.com/file/d/1UVR7Liw%2F..%2Fother/view',
        thumbnail: 'https://drive.google.com/thumbnail?id=1UVR7Liw%2F..%2Fother&sz=w640',
        ratio: '4/3',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed file id carrying a query separator as written, even if the player answers an error', () => {
      const value = 'https://drive.google.com/file/d/1UVR7Liw&sz=w1/preview'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1UVR7Liw&sz=w1',
        src: 'https://drive.google.com/file/d/1UVR7Liw&sz=w1/preview',
        url: 'https://drive.google.com/file/d/1UVR7Liw&sz=w1/view',
        thumbnail: 'https://drive.google.com/thumbnail?id=1UVR7Liw%26sz%3Dw1&sz=w640',
        ratio: '4/3',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('googledriveEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, googledriveEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/file/d/1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r/preview"
          width="640"
          height="480"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r',
        src: 'https://drive.google.com/file/d/1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r/preview',
        url: 'https://drive.google.com/file/d/1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r/view',
        thumbnail:
          'https://drive.google.com/thumbnail?id=1y5iOrW7Epj-cNdscnRAVDzUCKaMjjo6r&sz=w640',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should claim the legacy docs frame', async () => {
      const value = html`
        <iframe
          height="480"
          src="https://docs.google.com/file/d/0ByrtauTmPYKtR3dPN0lxY2hwdFE/preview"
          width="520"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '0ByrtauTmPYKtR3dPN0lxY2hwdFE',
        src: 'https://drive.google.com/file/d/0ByrtauTmPYKtR3dPN0lxY2hwdFE/preview',
        url: 'https://drive.google.com/file/d/0ByrtauTmPYKtR3dPN0lxY2hwdFE/view',
        thumbnail: 'https://drive.google.com/thumbnail?id=0ByrtauTmPYKtR3dPN0lxY2hwdFE&sz=w640',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the file route', async () => {
      const value = html`
        <iframe src="https://evil.test/file/d/1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q/preview"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another google host carrying the file route', async () => {
      const value = html`
        <iframe src="https://sites.google.com/file/d/1bCH3PkxgHe32KzhMFq9SDhsDHgkuZk6Q/preview"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Drive also serves a file's bytes on `/uc`, which a feed can carry as an enclosure, and the
// resolver reaches that path only through the registered default list.
describeForEachParser('drive downloads offered as enclosures', (parseHtml) => {
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

// An <audio> naming the file's page, which no browser plays, reaches the resolver only through the
// pipeline.
describeForEachParser('drive file pages in a media element', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should frame an audio source naming a file page', async () => {
    const value = html`
      <p>
        <audio controls>
          <source
            src="https://drive.google.com/file/d/1GRb_urzw2vn0JGKamTE70NIoELiXbAJA/view?usp=sharing"
            type="audio/mpeg"
          >
          Tu navegador no soporta la etiqueta de audio.
        </audio>
      </p>
    `
    const expected = html`
      <div
        data-embed-ratio="4/3"
        data-embed-thumbnail="https://drive.google.com/thumbnail?id=1GRb_urzw2vn0JGKamTE70NIoELiXbAJA&sz=w640"
        data-embed-url="https://drive.google.com/file/d/1GRb_urzw2vn0JGKamTE70NIoELiXbAJA/view"
        data-embed-id="1GRb_urzw2vn0JGKamTE70NIoELiXbAJA"
        data-embed-provider="googledrive"
        data-embed-src="https://drive.google.com/file/d/1GRb_urzw2vn0JGKamTE70NIoELiXbAJA/preview"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
