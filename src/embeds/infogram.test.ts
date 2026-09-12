import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { infogramEmbedResolver } from './infogram.js'

describeForEachParser('infogramEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, infogramEmbedResolver)

  describe('happy paths', () => {
    it('should build the chart frame and read the title off the mount', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
          data-type="interactive"
          data-title="NHC Data 2018-2019"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: 'e8eda814-7ea2-4d8f-b8ab-1010d45de70e',
        src: 'https://e.infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e?src=embed',
        url: 'https://infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e',
        title: 'NHC Data 2018-2019',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should build a chart whose mount names no title', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="c712e3f3-ba64-4c78-b340-f323883a2c8a"
          data-type="interactive"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: 'c712e3f3-ba64-4c78-b340-f323883a2c8a',
        src: 'https://e.infogram.com/c712e3f3-ba64-4c78-b340-f323883a2c8a?src=embed',
        url: 'https://infogram.com/c712e3f3-ba64-4c78-b340-f323883a2c8a',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a mount naming an empty chart id', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id=""
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a chart id carrying a separator', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="../other"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The mount is an empty div, which stripEmptyTags deletes, so only the whole run shows the chart
// surviving at all.
describeForEachParser('infogram charts through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the mount with a placeholder naming the chart frame', async () => {
    const value = html`
      <p>Before</p>
      <div
        class="infogram-embed"
        data-id="e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
        data-type="interactive"
        data-title="NHC Data 2018-2019"
      ></div>
    `
    const expected = html`
      <p>Before</p>
      <div
        data-embed-provider="infogram"
        data-embed-id="e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
        data-embed-src="https://e.infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e?src=embed"
        data-embed-url="https://infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
        data-embed-title="NHC Data 2018-2019"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
