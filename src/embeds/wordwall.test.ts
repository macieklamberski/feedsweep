import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { wordwallEmbedResolver } from './wordwall.js'

describeForEachParser('wordwallEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, wordwallEmbedResolver)

  describe('happy paths', () => {
    it('should keep the template a player states and drop its theme', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="380"
          src="https://wordwall.net/embed/79f873e001b84886aba4cb63e7c9f6e4?themeId=1&amp;templateId=3"
          width="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: '79f873e001b84886aba4cb63e7c9f6e4',
        src: 'https://wordwall.net/embed/79f873e001b84886aba4cb63e7c9f6e4?templateId=3',
        width: 500,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the font stack a player states', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="380"
          src="https://wordwall.net/embed/4d9be8cbd5034225b49395cb39e62982?themeId=1&amp;templateId=3&amp;fontStackId=0"
          style="max-width: 100%;"
          width="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: '4d9be8cbd5034225b49395cb39e62982',
        src: 'https://wordwall.net/embed/4d9be8cbd5034225b49395cb39e62982?templateId=3',
        width: 500,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the locale prefix from the player url and keep it out of the id', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="380"
          src="https://wordwall.net/pl/embed/4f37d8201dea4a218f20e24bf5a6b622?themeId=52&amp;templateId=8"
          width="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: '4f37d8201dea4a218f20e24bf5a6b622',
        src: 'https://wordwall.net/embed/4f37d8201dea4a218f20e24bf5a6b622?templateId=8',
        width: 500,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the wordwall path', async () => {
      const value = html`<iframe src="https://evil.test/embed/d4e3c25ffe7545a19a8b0cd802f68f4d"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the image cdn host carrying the player path', async () => {
      const value = html`<iframe src="https://screens.cdn.wordwall.net/embed/play/65121/614/434"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an id carrying a query separator', async () => {
      const value = html`<iframe src="https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d&a=1"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a locale carrying a query separator', async () => {
      const value = html`<iframe src="https://wordwall.net/es&x=b/embed/d4e3c25ffe7545a19a8b0cd802f68f4d"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a locale region carrying a query separator', async () => {
      const value = html`<iframe src="https://wordwall.net/es-mx&x=b/embed/d4e3c25ffe7545a19a8b0cd802f68f4d"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a wordwall url outside the embed route', async () => {
      const value = html`<iframe src="https://wordwall.net/play/d4e3c25ffe7545a19a8b0cd802f68f4d"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a numeric id under a locale prefix outside the embed route', async () => {
      const value = html`<iframe src="https://wordwall.net/es/resource/3251143/english/what-are-they-doing-now"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a locale prefix that is not a language code', async () => {
      const value = html`<iframe src="https://wordwall.net/e5s/embed/d4e3c25ffe7545a19a8b0cd802f68f4d"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an id segment with a non-hex letter inside it', async () => {
      const value = html`<iframe src="https://wordwall.net/embed/deadzone"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed route naming no activity id', async () => {
      const value = html`<iframe src="https://wordwall.net/embed/preview"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should state no size and no thumbnail of its own', async () => {
      const value = html`<iframe src="https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'd4e3c25ffe7545a19a8b0cd802f68f4d',
        src: 'https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d',
        ratio: '500/380',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the www spelling onto the bare page host', async () => {
      const value = html`<iframe src="https://www.wordwall.net/embed/play/65121/614/434"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'play/65121/614/434',
        src: 'https://wordwall.net/embed/play/65121/614/434',
        ratio: '500/380',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker beside the template', async () => {
      const value = html`
        <iframe
          src="https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d?templateId=22&utm_source=lesson"
          height="380"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'd4e3c25ffe7545a19a8b0cd802f68f4d',
        src: 'https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d?templateId=22',
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the legacy numeric play route', () => {
    it('should keep all three numbers as the id and in the player url', async () => {
      const value = html`
        <iframe
          style="max-width:100%"
          src="https://wordwall.net/embed/play/65121/614/434"
          width="500"
          height="380"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'play/65121/614/434',
        src: 'https://wordwall.net/embed/play/65121/614/434',
        width: 500,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a play route missing its check number', async () => {
      const value = html`<iframe src="https://wordwall.net/embed/play/65121/614"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed check number as written, even if the player answers an error', async () => {
      const value = html`<iframe src="https://wordwall.net/embed/play/65121/614/x434"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'play/65121/614/x434',
        src: 'https://wordwall.net/embed/play/65121/614/x434',
        ratio: '500/380',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a play route outside the embed route', async () => {
      const value = html`<iframe src="https://wordwall.net/de/play/65121/614/434"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a locale prefix, which the play route does not serve', async () => {
      const value = html`<iframe src="https://wordwall.net/de/embed/play/65121/614/434"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the fields the resolver leaves to enrichment', () => {
    // Whether Wordwall writes the activity's name or a player label here is unmeasured.
    it('should not take the name the carrier title states', async () => {
      const value = html`
        <iframe
          title="Inside the house (rooms) - Labelled diagram"
          src="https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wordwall',
        id: 'd4e3c25ffe7545a19a8b0cd802f68f4d',
        src: 'https://wordwall.net/embed/d4e3c25ffe7545a19a8b0cd802f68f4d',
        ratio: '500/380',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('wordwall through the pipeline', (parseHtml) => {
  it('should leave an activity image enclosure as an image', async () => {
    const enclosures = [
      {
        url: 'https://screens.cdn.wordwall.net/800/51a2b39355314290be5b0e908a65c6fa_54',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <img data-enclosure="" src="https://screens.cdn.wordwall.net/800/51a2b39355314290be5b0e908a65c6fa_54">
      <p>Body</p>
    `
    const result = await transformContent('<p>Body</p>', {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })

    expect(result).toEqualHtml(expected)
  })
})
