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

    it('should ignore an open link that states no type', () => {
      const value = 'https://drive.google.com/open?id=1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_'

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

  describe('the Workspace domain prefix', () => {
    it('should drop the Workspace prefix from a drive frame', () => {
      const value =
        'https://drive.google.com/a/example.com/file/d/0B9tSCABkwqlyRzNlZGNaZ0hIYU0/preview'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '0B9tSCABkwqlyRzNlZGNaZ0hIYU0',
        src: 'https://drive.google.com/file/d/0B9tSCABkwqlyRzNlZGNaZ0hIYU0/preview',
        url: 'https://drive.google.com/file/d/0B9tSCABkwqlyRzNlZGNaZ0hIYU0/view',
        thumbnail: 'https://drive.google.com/thumbnail?id=0B9tSCABkwqlyRzNlZGNaZ0hIYU0&sz=w640',
        ratio: '4/3',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the Workspace prefix from a legacy docs frame', () => {
      const value =
        'https://docs.google.com/a/example.com/file/d/0B-8Pql3xY9VERE1yaTRxaXAwcXc/preview'
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '0B-8Pql3xY9VERE1yaTRxaXAwcXc',
        src: 'https://drive.google.com/file/d/0B-8Pql3xY9VERE1yaTRxaXAwcXc/preview',
        url: 'https://drive.google.com/file/d/0B-8Pql3xY9VERE1yaTRxaXAwcXc/view',
        thumbnail: 'https://drive.google.com/thumbnail?id=0B-8Pql3xY9VERE1yaTRxaXAwcXc&sz=w640',
        ratio: '4/3',
      }

      expect(googledriveResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore a file behind a prefix that is not a Workspace domain', () => {
      const value =
        'https://drive.google.com/x/example.com/file/d/0B9tSCABkwqlyRzNlZGNaZ0hIYU0/preview'

      expect(googledriveResolveEmbed(value)).toBeUndefined()
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

    it('should claim a drive frame behind a Workspace prefix', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/a/example.com/file/d/0B9tSCABkwqlyRzNlZGNaZ0hIYU0/preview"
          width="640"
          height="480"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '0B9tSCABkwqlyRzNlZGNaZ0hIYU0',
        src: 'https://drive.google.com/file/d/0B9tSCABkwqlyRzNlZGNaZ0hIYU0/preview',
        url: 'https://drive.google.com/file/d/0B9tSCABkwqlyRzNlZGNaZ0hIYU0/view',
        thumbnail: 'https://drive.google.com/thumbnail?id=0B9tSCABkwqlyRzNlZGNaZ0hIYU0&sz=w640',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('files typed audio', () => {
    it('should state the audio player height for a file typed audio', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/file/d/11xQxXUWu4JWxuhQkGH2FUGWPCh0Ow1aw/view"
          type="audio/x-m4a"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '11xQxXUWu4JWxuhQkGH2FUGWPCh0Ow1aw',
        src: 'https://drive.google.com/file/d/11xQxXUWu4JWxuhQkGH2FUGWPCh0Ow1aw/preview',
        url: 'https://drive.google.com/file/d/11xQxXUWu4JWxuhQkGH2FUGWPCh0Ow1aw/view',
        height: 252,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the audio player height for a keyed file typed audio', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/file/d/0Bzq4uXIf8dNTVS1wQl9sME5FcFE/view?resourcekey=0-aeSGEHR1GEcB98yGmsP_XA"
          type="audio/mpeg"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '0Bzq4uXIf8dNTVS1wQl9sME5FcFE',
        src: 'https://drive.google.com/file/d/0Bzq4uXIf8dNTVS1wQl9sME5FcFE/preview?resourcekey=0-aeSGEHR1GEcB98yGmsP_XA',
        height: 252,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should frame an open link typed audio', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/open?id=1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_"
          type="audio/mpeg"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_',
        src: 'https://drive.google.com/file/d/1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_/preview',
        url: 'https://drive.google.com/file/d/1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_/view',
        height: 252,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the file ratio for a file typed video', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/file/d/1RUUW3OB7guzN-pKAApUEr-iV408omtIK/view?usp=sharing"
          type="video/mpeg"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledrive',
        id: '1RUUW3OB7guzN-pKAApUEr-iV408omtIK',
        src: 'https://drive.google.com/file/d/1RUUW3OB7guzN-pKAApUEr-iV408omtIK/preview',
        url: 'https://drive.google.com/file/d/1RUUW3OB7guzN-pKAApUEr-iV408omtIK/view',
        thumbnail:
          'https://drive.google.com/thumbnail?id=1RUUW3OB7guzN-pKAApUEr-iV408omtIK&sz=w640',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an open link typed as something other than audio', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/open?id=0B0LxOmlUZ59zdEF1MjhleU1ZdnM"
          type="mp3"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route below the open link', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/open/view?id=1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_"
          type="audio/mpeg"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an open link on the legacy docs host', async () => {
      const value = html`
        <iframe
          src="https://docs.google.com/open?id=1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_"
          type="audio/mpeg"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an open link with no file id', async () => {
      const value = html`
        <iframe
          src="https://drive.google.com/open?usp=sharing"
          type="audio/mpeg"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
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
describeForEachParser('drive files offered as enclosures', (parseHtml) => {
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

  it('should frame an audio file enclosure at the audio player height', async () => {
    const enclosures = [
      {
        url: 'https://drive.google.com/file/d/11xQxXUWu4JWxuhQkGH2FUGWPCh0Ow1aw/view',
        type: 'audio/x-m4a',
      },
    ]
    const expected = html`
      <div
        data-enclosure
        data-embed-height="252"
        data-embed-url="https://drive.google.com/file/d/11xQxXUWu4JWxuhQkGH2FUGWPCh0Ow1aw/view"
        data-embed-id="11xQxXUWu4JWxuhQkGH2FUGWPCh0Ow1aw"
        data-embed-provider="googledrive"
        data-embed-src="https://drive.google.com/file/d/11xQxXUWu4JWxuhQkGH2FUGWPCh0Ow1aw/preview"
      ></div>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  it('should frame an audio open link enclosure', async () => {
    const enclosures = [
      {
        url: 'https://drive.google.com/open?id=1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_',
        type: 'audio/mpeg',
      },
    ]
    const expected = html`
      <div
        data-enclosure
        data-embed-height="252"
        data-embed-url="https://drive.google.com/file/d/1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_/view"
        data-embed-id="1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_"
        data-embed-provider="googledrive"
        data-embed-src="https://drive.google.com/file/d/1-Y-8cPyGXZKDSo4wl4HgZ6-t2c1pH10_/preview"
      ></div>
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

  it('should frame an audio source naming a file page at the audio player height', async () => {
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
        data-embed-height="252"
        data-embed-url="https://drive.google.com/file/d/1GRb_urzw2vn0JGKamTE70NIoELiXbAJA/view"
        data-embed-id="1GRb_urzw2vn0JGKamTE70NIoELiXbAJA"
        data-embed-provider="googledrive"
        data-embed-src="https://drive.google.com/file/d/1GRb_urzw2vn0JGKamTE70NIoELiXbAJA/preview"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should frame an audio element naming a file page at the audio player height', async () => {
    const value = html`
      <audio
        controls="controls"
        src="https://drive.google.com/file/d/1mfIjYMk3XStUeBh5Wo3GTofVdqVbEK1f/view?usp=drive_link"
      ></audio>
    `
    const expected = html`
      <div
        data-embed-height="252"
        data-embed-url="https://drive.google.com/file/d/1mfIjYMk3XStUeBh5Wo3GTofVdqVbEK1f/view"
        data-embed-id="1mfIjYMk3XStUeBh5Wo3GTofVdqVbEK1f"
        data-embed-provider="googledrive"
        data-embed-src="https://drive.google.com/file/d/1mfIjYMk3XStUeBh5Wo3GTofVdqVbEK1f/preview"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should frame an untyped source in an audio element at the audio player height', async () => {
    const value = html`
      <audio controls>
        <source src="https://drive.google.com/file/d/1tveioycFCl8gqz4Z0B3ZW_RORdZkMHWA/view?usp=sharing">
      </audio>
    `
    const expected = html`
      <div
        data-embed-height="252"
        data-embed-url="https://drive.google.com/file/d/1tveioycFCl8gqz4Z0B3ZW_RORdZkMHWA/view"
        data-embed-id="1tveioycFCl8gqz4Z0B3ZW_RORdZkMHWA"
        data-embed-provider="googledrive"
        data-embed-src="https://drive.google.com/file/d/1tveioycFCl8gqz4Z0B3ZW_RORdZkMHWA/preview"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep the file ratio for a video element naming a file page', async () => {
    const value = html`
      <video
        controls
        src="https://drive.google.com/file/d/1VZerjwInNuY8lCcXuPA-mnKWIyIIVrYK/view?usp=drivesdk"
      ></video>
    `
    const expected = html`
      <div
        data-embed-ratio="4/3"
        data-embed-thumbnail="https://drive.google.com/thumbnail?id=1VZerjwInNuY8lCcXuPA-mnKWIyIIVrYK&sz=w640"
        data-embed-url="https://drive.google.com/file/d/1VZerjwInNuY8lCcXuPA-mnKWIyIIVrYK/view"
        data-embed-id="1VZerjwInNuY8lCcXuPA-mnKWIyIIVrYK"
        data-embed-provider="googledrive"
        data-embed-src="https://drive.google.com/file/d/1VZerjwInNuY8lCcXuPA-mnKWIyIIVrYK/preview"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
