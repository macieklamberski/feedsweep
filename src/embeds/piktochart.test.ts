import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { piktochartIframeEmbedResolver } from './piktochart.js'

describeForEachParser('piktochartIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, piktochartIframeEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the embed frame', async () => {
      const value = html`
        <iframe
          width="824"
          height="1156"
          frameborder="0"
          scrolling="no"
          style="overflow-y:hidden;"
          src="https://create.piktochart.com/embed/30289406-new-piktochart-copy"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '30289406-new-piktochart-copy',
        src: 'https://create.piktochart.com/embed/30289406-new-piktochart-copy',
        url: 'https://create.piktochart.com/output/30289406-new-piktochart-copy',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the retired host onto the current one', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="1302"
          scrolling="no"
          src="https://magic.piktochart.com/embed/22263200-media"
          style="overflow-y:hidden;"
          width="800"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '22263200-media',
        src: 'https://create.piktochart.com/embed/22263200-media',
        url: 'https://create.piktochart.com/output/22263200-media',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a uid with a hexadecimal id', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="3414"
          scrolling="no"
          src="https://create.piktochart.com/embed/9b2a880f31c9-quantitative-balancing"
          style="overflow-y: hidden;"
          width="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '9b2a880f31c9-quantitative-balancing',
        src: 'https://create.piktochart.com/embed/9b2a880f31c9-quantitative-balancing',
        url: 'https://create.piktochart.com/output/9b2a880f31c9-quantitative-balancing',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the name from the stated title', async () => {
      const value = html`
        <iframe
          src="https://create.piktochart.com/embed/66210838-2024-december-fvr"
          title="2024 December FVR"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '66210838-2024-december-fvr',
        src: 'https://create.piktochart.com/embed/66210838-2024-december-fvr',
        url: 'https://create.piktochart.com/output/66210838-2024-december-fvr',
        ratio: '1/2',
        title: '2024 December FVR',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fold the case of the uid in the key only', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embed/30289406-NEW-PIKTOCHART-COPY"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '30289406-new-piktochart-copy',
        src: 'https://create.piktochart.com/embed/30289406-NEW-PIKTOCHART-COPY',
        url: 'https://create.piktochart.com/output/30289406-NEW-PIKTOCHART-COPY',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a trailing slash', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embed/30289406-new-piktochart-copy/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '30289406-new-piktochart-copy',
        src: 'https://create.piktochart.com/embed/30289406-new-piktochart-copy',
        url: 'https://create.piktochart.com/output/30289406-new-piktochart-copy',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker on the query', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embed/30289406-new-piktochart-copy?utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '30289406-new-piktochart-copy',
        src: 'https://create.piktochart.com/embed/30289406-new-piktochart-copy',
        url: 'https://create.piktochart.com/output/30289406-new-piktochart-copy',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/30289406-new-piktochart-copy"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route below another segment', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/x/embed/30289406-new-piktochart-copy"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment past the uid', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embed/30289406-new-piktochart-copy/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an unknown route word', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embedz/30289406-new-piktochart-copy"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route with no uid', async () => {
      const value = '<iframe src="https://create.piktochart.com/embed/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('piktochart through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should rebuild the frame on the retired host onto the current one', async () => {
    const value = html`
      <iframe
        frameborder="0"
        height="1023"
        scrolling="no"
        src="https://magic.piktochart.com/embed/22324966-santos-imperiet"
        style="overflow-y:hidden;"
        width="800"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="1/2"
        data-embed-url="https://create.piktochart.com/output/22324966-santos-imperiet"
        data-embed-id="22324966-santos-imperiet"
        data-embed-provider="piktochart"
        data-embed-src="https://create.piktochart.com/embed/22324966-santos-imperiet"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
