import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { wakeletEmbedResolver } from './wakelet.js'

describeForEachParser('wakeletEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, wakeletEmbedResolver)

  describe('happy paths', () => {
    it('should build the collection frame from the embed dialog frame', async () => {
      const value = html`
        <iframe
          class="wakeletEmbed"
          width="100%"
          height="760px"
          src="https://embed.wakelet.com/wakes/NrquVwf7yTprpa6g_e3Dw/list?border=1"
          style="border: none"
          allow="autoplay"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wakelet',
        id: 'NrquVwf7yTprpa6g_e3Dw',
        src: 'https://embed.wakelet.com/wakes/NrquVwf7yTprpa6g_e3Dw/list',
        url: 'https://wakelet.com/wake/NrquVwf7yTprpa6g_e3Dw',
        height: 760,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move a grid frame onto the list', async () => {
      const value = html`
        <iframe
          class="wakeletEmbed"
          width="100%"
          height="460px"
          src="https://embed.wakelet.com/wakes/2fw7jVdgjW0VbgzjNr3Hf/grid"
          style="border: none"
          allow="autoplay"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wakelet',
        id: '2fw7jVdgjW0VbgzjNr3Hf',
        src: 'https://embed.wakelet.com/wakes/2fw7jVdgjW0VbgzjNr3Hf/list',
        url: 'https://wakelet.com/wake/2fw7jVdgjW0VbgzjNr3Hf',
        height: 760,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass a uuid id as written', async () => {
      const value = html`
        <iframe
          class="wakeletEmbed"
          data-autoresize="false"
          height="550px"
          src="https://embed.wakelet.com/wakes/6edc7e7a-dca5-4d23-8871-f0847f5cea1e/list?border=1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wakelet',
        id: '6edc7e7a-dca5-4d23-8871-f0847f5cea1e',
        src: 'https://embed.wakelet.com/wakes/6edc7e7a-dca5-4d23-8871-f0847f5cea1e/list',
        url: 'https://wakelet.com/wake/6edc7e7a-dca5-4d23-8871-f0847f5cea1e',
        height: 760,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/wakes/NrquVwf7yTprpa6g_e3Dw/list"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a wakes path under another prefix', async () => {
      const value =
        '<iframe src="https://embed.wakelet.com/x/wakes/NrquVwf7yTprpa6g_e3Dw/list"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a wakes path with a trailing segment', async () => {
      const value =
        '<iframe src="https://embed.wakelet.com/wakes/NrquVwf7yTprpa6g_e3Dw/list/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another route word', async () => {
      const value =
        '<iframe src="https://embed.wakelet.com/zines/NrquVwf7yTprpa6g_e3Dw/list"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('wakelet snippets through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the embed dialog frame and drop its loader', async () => {
    const value = html`
      <iframe
        class="wakeletEmbed"
        width="100%"
        height="760px"
        src="https://embed.wakelet.com/wakes/NrquVwf7yTprpa6g_e3Dw/list?border=1"
        style="border: none"
        allow="autoplay"
      ></iframe>
      <script
        src="https://embed-assets.wakelet.com/wakelet-embed.js"
        charset="UTF-8"
      ></script>
    `
    const expected = html`
      <div
        data-embed-provider="wakelet"
        data-embed-id="NrquVwf7yTprpa6g_e3Dw"
        data-embed-src="https://embed.wakelet.com/wakes/NrquVwf7yTprpa6g_e3Dw/list"
        data-embed-url="https://wakelet.com/wake/NrquVwf7yTprpa6g_e3Dw"
        data-embed-height="760"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
