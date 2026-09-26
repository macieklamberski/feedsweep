import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { patroniteEmbedResolver, patroniteResolveEmbed } from './patronite.js'

describe('patroniteResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from a widget url', () => {
      const value = 'https://patronite.pl/widget/strajk/114344/small/FF3E3E/FEFFF8'
      const expected: EmbedResolverResult = {
        provider: 'patronite',
        id: '114344',
        src: 'https://patronite.pl/widget/strajk/114344/small/FF3E3E/FEFFF8',
        url: 'https://patronite.pl/strajk',
        height: 306,
      }

      expect(patroniteResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the theme and description the publisher chose', () => {
      const value =
        'https://patronite.pl/widget/czlowiekplus/667937/small/light/colorful?description=Dzi%C4%99kuj%C4%99%20za%20Twoje%20wsparcie!'
      const expected: EmbedResolverResult = {
        provider: 'patronite',
        id: '667937',
        src: 'https://patronite.pl/widget/czlowiekplus/667937/small/light/colorful?description=Dzi%C4%99kuj%C4%99%20za%20Twoje%20wsparcie!',
        url: 'https://patronite.pl/czlowiekplus',
        height: 306,
      }

      expect(patroniteResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a category listing, which is not a widget', () => {
      const value = 'https://patronite.pl/kategoria/34/podcast'

      expect(patroniteResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget url naming no id', () => {
      const value = 'https://patronite.pl/widget/strajk'

      expect(patroniteResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', () => {
      const value = 'https://patronite.pl.evil.test/widget/strajk/114344/small/FF3E3E/FEFFF8'

      expect(patroniteResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('patroniteEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, patroniteEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the snippet states', async () => {
      const value = html`
        <iframe
          src="https://patronite.pl/widget/strajk/114344/small/FF3E3E/FEFFF8"
          width="300"
          height="450"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'patronite',
        id: '114344',
        src: 'https://patronite.pl/widget/strajk/114344/small/FF3E3E/FEFFF8',
        url: 'https://patronite.pl/strajk',
        width: 300,
        height: 450,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the widget height for a frame that states no size', async () => {
      const value =
        '<iframe src="https://patronite.pl/widget/strajk/114344/small/FF3E3E/FEFFF8"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'patronite',
        id: '114344',
        src: 'https://patronite.pl/widget/strajk/114344/small/FF3E3E/FEFFF8',
        url: 'https://patronite.pl/strajk',
        height: 306,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/patronite.pl/widget/strajk/114344/small/FF3E3E/FEFFF8"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('patronite widget through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should surface the widget as a placeholder naming the creator page', async () => {
    const value = html`
      <p>
        <iframe
          src="https://patronite.pl/widget/strajk/114344/small/FF3E3E/FEFFF8"
          width="300"
          height="450"
          frameborder="0"
          scrolling="no"
        ></iframe>
      </p>
    `
    const expected = html`
      <div
        data-embed-provider="patronite"
        data-embed-id="114344"
        data-embed-src="https://patronite.pl/widget/strajk/114344/small/FF3E3E/FEFFF8"
        data-embed-url="https://patronite.pl/strajk"
        data-embed-width="300"
        data-embed-height="450"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
