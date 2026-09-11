import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { observableEmbedResolver } from './observable.js'

describeForEachParser('observableEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, observableEmbedResolver)

  describe('happy paths', () => {
    it('should keep the cells the publisher chose in the src', async () => {
      const value =
        '<iframe src="https://observablehq.com/embed/@jakecoppinger/25t-1151-tfnsw-cbd-pedestrian-times-review-2017-11-24?cells=data1"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@jakecoppinger/25t-1151-tfnsw-cbd-pedestrian-times-review-2017-11-24',
        src: 'https://observablehq.com/embed/@jakecoppinger/25t-1151-tfnsw-cbd-pedestrian-times-review-2017-11-24?cells=data1',
        url: 'https://observablehq.com/@jakecoppinger/25t-1151-tfnsw-cbd-pedestrian-times-review-2017-11-24',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the height the carrier states', async () => {
      const value = html`
        <iframe
          loading="lazy"
          width="100%"
          height="492.03125"
          frameborder="0"
          src="https://observablehq.com/embed/@jakecoppinger/25t-1151-tfnsw-cbd-pedestrian-times-review-2017-11-24?cells=data1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@jakecoppinger/25t-1151-tfnsw-cbd-pedestrian-times-review-2017-11-24',
        src: 'https://observablehq.com/embed/@jakecoppinger/25t-1151-tfnsw-cbd-pedestrian-times-review-2017-11-24?cells=data1',
        url: 'https://observablehq.com/@jakecoppinger/25t-1151-tfnsw-cbd-pedestrian-times-review-2017-11-24',
        height: 492.03125,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host carrying the real path', async () => {
      const value =
        '<iframe src="https://observablehq.com.evil.test/embed/@neocartocnrs/borders?cells=map"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/observablehq.com/embed/@neocartocnrs/borders?cells=map"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a collection page, which frames no notebook', async () => {
      const value =
        '<iframe src="https://observablehq.com/collection/@neocartocnrs/cartography"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave an embed url that names no notebook', async () => {
      const value = '<iframe src="https://observablehq.com/embed/@neocartocnrs"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read a handle the feed percent-encoded', async () => {
      const value =
        '<iframe src="https://observablehq.com/embed/%40neocartocnrs/borders?cells=map"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@neocartocnrs/borders',
        src: 'https://observablehq.com/embed/%40neocartocnrs/borders?cells=map',
        url: 'https://observablehq.com/@neocartocnrs/borders',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should refuse a notebook segment that decodes to a second path', async () => {
      const value =
        '<iframe src="https://observablehq.com/embed/@neocartocnrs/borders%2Fmap?cells=map"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the unlisted notebook route', () => {
    // `d/{id}` names a notebook that has no handle and no slug, so the document endpoint the id
    // addresses answers for nothing built out of it.
    it('should leave the unlisted route to the generic placeholder', async () => {
      const value = '<iframe src="https://observablehq.com/embed/d/abc123?cells=map"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the version a carrier pins', () => {
    it('should keep a numbered version in the src and out of the id', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://observablehq.com/embed/@neocartocnrs/borders@406?cells=viewof+val%2Cmap"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@neocartocnrs/borders',
        src: 'https://observablehq.com/embed/@neocartocnrs/borders@406?cells=viewof+val%2Cmap',
        url: 'https://observablehq.com/@neocartocnrs/borders',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the latest marker in the src and out of the id', async () => {
      const value = html`
        <iframe
          width="100%"
          height="514"
          src="https://observablehq.com/embed/@duckdb-projects/public-cloud-provider-ip-ranges@latest?cells=Overall"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@duckdb-projects/public-cloud-provider-ip-ranges',
        src: 'https://observablehq.com/embed/@duckdb-projects/public-cloud-provider-ip-ranges@latest?cells=Overall',
        url: 'https://observablehq.com/@duckdb-projects/public-cloud-provider-ip-ranges',
        height: 514,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
