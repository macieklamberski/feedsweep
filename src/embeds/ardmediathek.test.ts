import { describe, expect, it } from 'bun:test'
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

    it('should ignore an id carrying a character no base64 id has', async () => {
      const value = html`<iframe src="https://www.ardmediathek.de/embed/Beitrag%20sophora.mp3"></iframe>`

      expect(await extract(value)).toBeUndefined()
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
