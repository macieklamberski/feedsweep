import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { bookcreatorEmbedResolver } from './bookcreator.js'

describeForEachParser('bookcreatorEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, bookcreatorEmbedResolver)

  describe('happy paths', () => {
    it('should build the reader from the frame WordPress writes', async () => {
      const value = html`
        <iframe
          loading="lazy"
          class="wp-embedded-content"
          sandbox="allow-scripts"
          security="restricted"
          title="Sam and the Ogres"
          width="675"
          height="675"
          src="https://read.bookcreator.com/i4ezNipKEjZsQyGcJDdU6xFivW13/2kdDcHfHSeCE_mbZW1JZ7w#?secret=6eMBTpxZ0f"
          data-secret="6eMBTpxZ0f"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bookcreator',
        id: 'i4ezNipKEjZsQyGcJDdU6xFivW13/2kdDcHfHSeCE_mbZW1JZ7w',
        src: 'https://read.bookcreator.com/i4ezNipKEjZsQyGcJDdU6xFivW13/2kdDcHfHSeCE_mbZW1JZ7w',
        url: 'https://read.bookcreator.com/i4ezNipKEjZsQyGcJDdU6xFivW13/2kdDcHfHSeCE_mbZW1JZ7w',
        thumbnail:
          'https://assets.api.bookcreator.com/i4ezNipKEjZsQyGcJDdU6xFivW13/books/2kdDcHfHSeCE_mbZW1JZ7w/cover/share',
        ratio: '900/675',
        title: 'Sam and the Ogres',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the reader from a frame pasted from the share dialog', async () => {
      const value = html`
        <iframe
          src="https://read.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg"
          width="660"
          height="440"
          frameborder="yes"
          scrolling="yes"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bookcreator',
        id: 'i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg',
        src: 'https://read.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg',
        url: 'https://read.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg',
        thumbnail:
          'https://assets.api.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63/books/JbtbBrj2S9O3iGlDIsSzrg/cover/share',
        ratio: '900/675',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the nopreview flag in the player url', async () => {
      const value = html`
        <iframe
          allow="clipboard-write self https://read.bookcreator.com"
          height="450"
          src="https://read.bookcreator.com/AVx0VbpcUWWuFRIyhhhDg841RaB3/TmxA4xZCRciSwFQI32MCIw?nopreview"
          width="700"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bookcreator',
        id: 'AVx0VbpcUWWuFRIyhhhDg841RaB3/TmxA4xZCRciSwFQI32MCIw',
        src: 'https://read.bookcreator.com/AVx0VbpcUWWuFRIyhhhDg841RaB3/TmxA4xZCRciSwFQI32MCIw?nopreview',
        url: 'https://read.bookcreator.com/AVx0VbpcUWWuFRIyhhhDg841RaB3/TmxA4xZCRciSwFQI32MCIw',
        thumbnail:
          'https://assets.api.bookcreator.com/AVx0VbpcUWWuFRIyhhhDg841RaB3/books/TmxA4xZCRciSwFQI32MCIw/cover/share',
        ratio: '900/675',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracking parameter', async () => {
      const value =
        '<iframe src="https://read.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg?utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'bookcreator',
        id: 'i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg',
        src: 'https://read.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg',
        url: 'https://read.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg',
        thumbnail:
          'https://assets.api.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63/books/JbtbBrj2S9O3iGlDIsSzrg/cover/share',
        ratio: '900/675',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the bare reader host', async () => {
      const value = '<iframe src="https://read.bookcreator.com/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a user with no book', async () => {
      const value =
        '<iframe src="https://read.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a frame opened on a page of the book', async () => {
      const value =
        '<iframe src="https://read.bookcreator.com/i7TKTVIHuTh4CBMseB6llwnuFI63/JbtbBrj2S9O3iGlDIsSzrg/uG4aIUj8QLO6UpiL3TSTXw-right"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a library framed as a page', async () => {
      const value = '<iframe src="https://read.bookcreator.com/library/-NaBcDeF123"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('bookcreator through the pipeline', (parseHtml) => {
  const convert = (
    value: string,
    enclosures?: Array<{ url: string; type: string }>,
  ): Promise<string> => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should build the reader from a protocol-relative frame', async () => {
    const value = html`
      <iframe
        loading="lazy"
        src="//read.bookcreator.com/xq2QEa6hORbVFbcsCM7OdISL8-vKvZyy5fnfCFrm1mo/sQxGHPTwQy-5AqpLG-77SA"
        frameborder="0"
        width="1920"
        height="600"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="bookcreator"
        data-embed-id="xq2QEa6hORbVFbcsCM7OdISL8-vKvZyy5fnfCFrm1mo/sQxGHPTwQy-5AqpLG-77SA"
        data-embed-src="https://read.bookcreator.com/xq2QEa6hORbVFbcsCM7OdISL8-vKvZyy5fnfCFrm1mo/sQxGHPTwQy-5AqpLG-77SA"
        data-embed-url="https://read.bookcreator.com/xq2QEa6hORbVFbcsCM7OdISL8-vKvZyy5fnfCFrm1mo/sQxGHPTwQy-5AqpLG-77SA"
        data-embed-thumbnail="https://assets.api.bookcreator.com/xq2QEa6hORbVFbcsCM7OdISL8-vKvZyy5fnfCFrm1mo/books/sQxGHPTwQy-5AqpLG-77SA/cover/share"
        data-embed-ratio="900/675"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a cover the reader host serves as a file', async () => {
    const enclosures = [
      {
        url: 'https://read.bookcreator.com/assets/Hzwv8sy7X6YkLJncNU8HbCaBuJP2/6XJpVcqFQDOu2Gvy9rh6rQ/cover',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <img
        data-enclosure=""
        src="https://read.bookcreator.com/assets/Hzwv8sy7X6YkLJncNU8HbCaBuJP2/6XJpVcqFQDOu2Gvy9rh6rQ/cover"
      />
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
