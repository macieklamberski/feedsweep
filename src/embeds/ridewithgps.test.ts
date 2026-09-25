import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { ridewithgpsEmbedResolver } from './ridewithgps.js'

// Every `data-embed-*` field the placeholder carries, for the shapes that only resolve once the
// pipeline has repaired them and so cannot be asserted on the resolver alone.
const readPlaceholder = (
  result: string,
  parseHtml: (value: string) => Document,
): Record<string, string> => {
  const element = parseHtml(result).querySelector('[data-embed-src]')
  const fields: Record<string, string> = {}

  for (const name of element?.getAttributeNames() ?? []) {
    const value = element?.getAttribute(name)

    if (name.startsWith('data-embed-') && value) {
      fields[name.replace('data-embed-', '')] = value
    }
  }

  return fields
}

describeForEachParser('ridewithgpsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, ridewithgpsEmbedResolver)

  describe('happy paths', () => {
    it('should read a route and take the size from the carrier', async () => {
      const value = html`
        <iframe
          src="https://ridewithgps.com/embeds?type=route&id=38984773&metricUnits=true&sampleGraph=true"
          style="width: 1px; min-width: 100%; height: 700px; border: none;"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/38984773',
        src: 'https://ridewithgps.com/embeds?type=route&id=38984773',
        url: 'https://ridewithgps.com/routes/38984773',
        thumbnail: 'https://ridewithgps.com/routes/38984773/thumb.png',
        width: 1,
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a trip and keep its privacy code', async () => {
      const value = html`<iframe src="https://ridewithgps.com/embeds?type=trip&id=372416891&privacyCode=Kq7WdN2hPzVmT4rYbXs9LcFj6gAe3uQn"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'trip/372416891',
        src: 'https://ridewithgps.com/embeds?type=trip&id=372416891&privacyCode=Kq7WdN2hPzVmT4rYbXs9LcFj6gAe3uQn',
        url: 'https://ridewithgps.com/trips/372416891',
        thumbnail: 'https://ridewithgps.com/trips/372416891/thumb.png',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/ridewithgps.com/embeds?type=route&id=38984773"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a kind the embed route does not serve', async () => {
      const value = '<iframe src="https://ridewithgps.com/embeds?type=club&id=38984773"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed that names no id', async () => {
      const value = '<iframe src="https://ridewithgps.com/embeds?type=route"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should ignore a kind that is only a property of Object.prototype', async () => {
      const value =
        '<iframe src="https://ridewithgps.com/embeds?type=constructor&undefined=38984773"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an id carrying a path separator', async () => {
      const value =
        '<iframe src="https://ridewithgps.com/embeds?type=route&id=1%2F..%2F9"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route whose id sits in eventId', async () => {
      const value =
        '<iframe src="https://ridewithgps.com/embeds?type=route&eventId=215602"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the event kind, which names its id in eventId', () => {
    it('should read the id out of eventId and mint no thumbnail', async () => {
      const value = html`<iframe src="https://ridewithgps.com/embeds?type=event&eventId=215602&sampleGraph=true&privacyCode=H3vQ7mRt2XpKz9Ld"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'event/215602',
        src: 'https://ridewithgps.com/embeds?type=event&eventId=215602&privacyCode=H3vQ7mRt2XpKz9Ld',
        url: 'https://ridewithgps.com/events/215602',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an event whose id sits in id', async () => {
      const value = '<iframe src="https://ridewithgps.com/embeds?type=event&id=215602"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the older per-resource embed path', () => {
    it('should read a route and hand its url on as written', async () => {
      const value = html`
        <iframe
          src="https://ridewithgps.com/routes/10953871/embed"
          width="100%"
          height="500px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/10953871',
        src: 'https://ridewithgps.com/routes/10953871/embed',
        url: 'https://ridewithgps.com/routes/10953871',
        thumbnail: 'https://ridewithgps.com/routes/10953871/thumb.png',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a trip', async () => {
      const value = '<iframe src="https://ridewithgps.com/trips/372416891/embed"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'trip/372416891',
        src: 'https://ridewithgps.com/trips/372416891/embed',
        url: 'https://ridewithgps.com/trips/372416891',
        thumbnail: 'https://ridewithgps.com/trips/372416891/thumb.png',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a resource page framed without the embed marker', async () => {
      const value = '<iframe src="https://ridewithgps.com/routes/10953871"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a club framed as an embed', async () => {
      const value = '<iframe src="https://ridewithgps.com/clubs/2147/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('ridewithgps shapes the pipeline repairs first', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }
  const placeholder = async (value: string) => {
    return readPlaceholder(await convert(value), parseHtml)
  }

  it('should read the embed path once the src has a scheme', async () => {
    const value = html`
      <iframe
        loading="lazy"
        src="//ridewithgps.com/routes/10953871/embed"
        width="100%"
        height="500px"
        frameborder="0"
      ></iframe>
    `
    const expected: Record<string, string> = {
      provider: 'ridewithgps',
      id: 'route/10953871',
      src: 'https://ridewithgps.com/routes/10953871/embed',
      url: 'https://ridewithgps.com/routes/10953871',
      thumbnail: 'https://ridewithgps.com/routes/10953871/thumb.png',
      height: '500',
    }

    expect(await placeholder(value)).toEqual(expected)
  })

  it('should leave a bare route link in prose as a link', async () => {
    const value = '<p>See <a href="https://ridewithgps.com/routes/38984773">the route</a>.</p>'

    expect(await convert(value)).toBe(value)
  })
})
