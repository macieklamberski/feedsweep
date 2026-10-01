import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { ardmediathekEmbedResolver } from './ardmediathek.js'

describeForEachParser('ardmediathekEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, ardmediathekEmbedResolver)

  describe('happy paths', () => {
    it('should read the base64 id the share dialog writes', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ardmediathek',
        id: 'Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
        src: 'https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
        url: 'https://www.ardmediathek.de/video/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read an id that encodes a uuid rather than a crid', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/embed/NjVmZWU0NjQtYTE1Mi00NjBkLTk5ODAtZmIwYmE5NDAwYjU4"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ardmediathek',
        id: 'NjVmZWU0NjQtYTE1Mi00NjBkLTk5ODAtZmIwYmE5NDAwYjU4',
        src: 'https://www.ardmediathek.de/embed/NjVmZWU0NjQtYTE1Mi00NjBkLTk5ODAtZmIwYmE5NDAwYjU4',
        url: 'https://www.ardmediathek.de/video/NjVmZWU0NjQtYTE1Mi00NjBkLTk5ODAtZmIwYmE5NDAwYjU4',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the url-safe base64 characters an id can carry', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9h-ZXgv_bzIzMjIwOTc"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ardmediathek',
        id: 'Y3JpZDovL3N3ci5kZS9h-ZXgv_bzIzMjIwOTc',
        src: 'https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9h-ZXgv_bzIzMjIwOTc',
        url: 'https://www.ardmediathek.de/video/Y3JpZDovL3N3ci5kZS9h-ZXgv_bzIzMjIwOTc',
      }

      expect(await extract(value)).toEqual(expected)
    })
    it('should repair the legacy embed route under a channel segment', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/ard/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ardmediathek',
        id: 'Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
        src: 'https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
        url: 'https://www.ardmediathek.de/video/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same route', async () => {
      const value = html`<iframe src="https://evil.test/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host that only ends on the name', async () => {
      const value = html`<iframe src="https://ardmediathek.de.evil.test/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the watch page, which is not the framed route', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/video/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route under two leading segments', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/x/ard/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed id as written, even if the player answers an error', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/embed/Beitrag%20sophora.mp3"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ardmediathek',
        id: 'Beitrag%20sophora.mp3',
        src: 'https://www.ardmediathek.de/embed/Beitrag%20sophora.mp3',
        url: 'https://www.ardmediathek.de/video/Beitrag%20sophora.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should drop the trailing slash after the id', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc/"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ardmediathek',
        id: 'Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
        src: 'https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
        url: 'https://www.ardmediathek.de/video/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the embed route with no id behind it', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/embed/"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed path that carries a second segment', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc/section"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the query on the embed route', () => {
    it('should keep the start offset the share dialog writes', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc?startTime=831.00"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ardmediathek',
        id: 'Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
        src: 'https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc?startTime=831.00',
        url: 'https://www.ardmediathek.de/video/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the child content flag the web app appends to its own routes', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc?isChildContent"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ardmediathek',
        id: 'Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
        src: 'https://www.ardmediathek.de/embed/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
        url: 'https://www.ardmediathek.de/video/Y3JpZDovL3N3ci5kZS9hZXgvbzIzMjIwOTc',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// The resolver accepts every ardmediathek.de subdomain, and the img. and api. subdomains serve
// the images a feed attaches as enclosures.
describeForEachParser('ardmediathek enclosures through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave an image enclosure on the img subdomain an image', async () => {
    const enclosures = [
      {
        url: 'https://img.ardmediathek.de/standard/00/59/47/33/24/-1899550789/16x9/960',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <img data-enclosure="" src="https://img.ardmediathek.de/standard/00/59/47/33/24/-1899550789/16x9/960">
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  it('should leave an image enclosure on the api subdomain an image', async () => {
    const enclosures = [
      {
        url: 'https://api.ardmediathek.de/image-service/image-collections/urn:ard:image-collection:2213972a8d101de1/16x9?w=960',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <img data-enclosure="" src="https://api.ardmediathek.de/image-service/image-collections/urn:ard:image-collection:2213972a8d101de1/16x9?w=960">
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
