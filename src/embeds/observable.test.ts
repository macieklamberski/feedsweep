import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { observableEmbedResolver } from './observable.js'

describeForEachParser('observableEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, observableEmbedResolver)

  describe('happy paths', () => {
    it('should keep the cells the publisher chose in the src', async () => {
      const value =
        '<iframe loading="lazy" width="100%" height="492.03125" src="https://observablehq.com/embed/@jakecoppinger/25t-1151-tfnsw-cbd-pedestrian-times-review-2017-11-24?cells=data1"></iframe>'
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
        '<iframe src="https://evil.test/embed/@neocartocnrs/borders?cells=map"></iframe>'

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
        url: 'https://observablehq.com/%40neocartocnrs/borders',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a notebook segment that decodes to a second path as written', async () => {
      const value =
        '<iframe src="https://observablehq.com/embed/@neocartocnrs/borders%2Fmap?cells=map"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@neocartocnrs/borders/map',
        src: 'https://observablehq.com/embed/@neocartocnrs/borders%2Fmap?cells=map',
        url: 'https://observablehq.com/@neocartocnrs/borders%2Fmap',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a notebook segment carrying a malformed escape as written', async () => {
      const value =
        '<iframe src="https://observablehq.com/embed/@neocartocnrs/borders%E0%A4%A?cells=map"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@neocartocnrs/borders%E0%A4%A',
        src: 'https://observablehq.com/embed/@neocartocnrs/borders%E0%A4%A?cells=map',
        url: 'https://observablehq.com/@neocartocnrs/borders%E0%A4%A',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('routes without a handle', () => {
    // Observable answers `embed/d/{id}` with a 404 for a real id.
    it('should leave the unlisted route to the generic placeholder', async () => {
      const value = '<iframe src="https://observablehq.com/embed/d/abc123?cells=map"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a first segment that holds an @ past its start', async () => {
      const value = '<iframe src="https://observablehq.com/embed/x@y/borders?cells=map"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the notebook a carrier names by its hex id', () => {
    it('should key the notebook by its hex id', async () => {
      const value = html`
        <iframe
          title="Percentage of female execs"
          frameBorder="0"
          src="https://observablehq.com/embed/9ef3034e9ee8b8c1?cells=chart"
          width="100%"
          style="height:400px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '9ef3034e9ee8b8c1',
        src: 'https://observablehq.com/embed/9ef3034e9ee8b8c1?cells=chart',
        url: 'https://observablehq.com/d/9ef3034e9ee8b8c1',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a numbered version in the src and out of the id', async () => {
      const value = html`
        <iframe
          title="RuPaul&#x27;s Drag Queens "
          frameBorder="0"
          src="https://observablehq.com/embed/3ac7dfcbdcb1dd2a@248?cells=map,css"
          width="100%"
          style="height:400px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '3ac7dfcbdcb1dd2a',
        src: 'https://observablehq.com/embed/3ac7dfcbdcb1dd2a@248?cells=map,css',
        url: 'https://observablehq.com/d/3ac7dfcbdcb1dd2a',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the latest marker in the src and out of the id', async () => {
      const value = html`
        <iframe
          width="100%"
          height="500"
          frameborder="0"
          src="https://observablehq.com/embed/4e1ffd6d2df015f9@latest?cell=*"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '4e1ffd6d2df015f9',
        src: 'https://observablehq.com/embed/4e1ffd6d2df015f9@latest?cell=*',
        url: 'https://observablehq.com/d/4e1ffd6d2df015f9',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Observable answers 404 to each of these spellings of a real id.
    it('should refuse an uppercase hex id', async () => {
      const value =
        '<iframe src="https://observablehq.com/embed/3AC7DFCBDCB1DD2A@248?cells=map,css"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a hex id with a character before it', async () => {
      const value =
        '<iframe src="https://observablehq.com/embed/x3ac7dfcbdcb1dd2a@248?cells=map,css"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a hex id with a character after it', async () => {
      const value =
        '<iframe src="https://observablehq.com/embed/3ac7dfcbdcb1dd2a0@248?cells=map,css"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the cells a carrier names', () => {
    it('should keep a repeated cell parameter in the src', async () => {
      const value = html`
        <iframe
          width="75%"
          height="535"
          frameborder="0"
          src="https://observablehq.com/embed/@d3/sortable-bar-chart?cell=viewof+order&cell=chart"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@d3/sortable-bar-chart',
        src: 'https://observablehq.com/embed/@d3/sortable-bar-chart?cell=viewof+order&cell=chart',
        url: 'https://observablehq.com/@d3/sortable-bar-chart',
        height: 535,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the cells and drop the trackers from the src', async () => {
      const value = html`
        <iframe
          width="75%"
          height="535"
          frameborder="0"
          src="https://observablehq.com/embed/@d3/sortable-bar-chart?cell=viewof+order&utm_source=feed&cell=chart&fbclid=IwAR0abc"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@d3/sortable-bar-chart',
        src: 'https://observablehq.com/embed/@d3/sortable-bar-chart?cell=viewof+order&cell=chart',
        url: 'https://observablehq.com/@d3/sortable-bar-chart',
        height: 535,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a campaign tag outside the standard set from the src', async () => {
      const value = html`
        <iframe
          width="75%"
          height="535"
          frameborder="0"
          src="https://observablehq.com/embed/@d3/sortable-bar-chart?utm_name=feed&cell=chart"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'observable',
        id: '@d3/sortable-bar-chart',
        src: 'https://observablehq.com/embed/@d3/sortable-bar-chart?cell=chart',
        url: 'https://observablehq.com/@d3/sortable-bar-chart',
        height: 535,
      }

      expect(await extract(value)).toEqual(expected)
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
