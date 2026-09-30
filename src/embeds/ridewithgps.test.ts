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
          src="https://ridewithgps.com/embeds?type=route&id=55848524&metricUnits=true&sampleGraph=true"
          style="width: 1px; min-width: 100%; height: 700px; border: none;"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/55848524',
        src: 'https://ridewithgps.com/embeds?type=route&id=55848524',
        url: 'https://ridewithgps.com/routes/55848524',
        thumbnail: 'https://ridewithgps.com/routes/55848524/thumb.png',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the heading the publisher named and drop the map layer', async () => {
      const value = html`
        <iframe
          style="width: 1px; min-width: 100%; height: 540px; border: none;"
          src="https://ridewithgps.com/embeds?type=route&amp;id=46929481&amp;title=2023%20Niseko%20Classic&amp;metricUnits=true&amp;sampleGraph=true&amp;overlay=terrain"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/46929481',
        src: 'https://ridewithgps.com/embeds?type=route&id=46929481&title=2023+Niseko+Classic',
        url: 'https://ridewithgps.com/routes/46929481',
        thumbnail: 'https://ridewithgps.com/routes/46929481/thumb.png',
        height: 540,
        title: '2023 Niseko Classic',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the distance markers the publisher turned on', async () => {
      const value = html`
        <iframe
          src="https://ridewithgps.com/embeds?type=route&id=54839074&metricUnits=true&sampleGraph=true&distanceMarkers=true"
          style="width: 1px; min-width: 100%; height: 700px; border: none;"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/54839074',
        src: 'https://ridewithgps.com/embeds?type=route&id=54839074',
        url: 'https://ridewithgps.com/routes/54839074',
        thumbnail: 'https://ridewithgps.com/routes/54839074/thumb.png',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the units and the elevation graph', async () => {
      const value = html`
        <iframe
          src="https://ridewithgps.com/embeds?type=route&amp;id=39144102&amp;metricUnits=true&amp;sampleGraph=true"
          style="width: 1px; min-width: 100%; height: 700px; border: none;"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/39144102',
        src: 'https://ridewithgps.com/embeds?type=route&id=39144102',
        url: 'https://ridewithgps.com/routes/39144102',
        thumbnail: 'https://ridewithgps.com/routes/39144102/thumb.png',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the privacy code a private route carries', async () => {
      const value = html`
        <iframe
          style="width: 1px; min-width: 100%; height: 700px; border: none;"
          src="https://ridewithgps.com/embeds?type=route&amp;id=38758142&amp;metricUnits=true&amp;sampleGraph=true&amp;privacyCode=gFIyoiFuxy3rYBFA"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/38758142',
        src: 'https://ridewithgps.com/embeds?type=route&id=38758142&privacyCode=gFIyoiFuxy3rYBFA',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker from the query', async () => {
      const value =
        '<iframe src="https://ridewithgps.com/embeds?type=trip&id=372416891&utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'trip/372416891',
        src: 'https://ridewithgps.com/embeds?type=trip&id=372416891',
        url: 'https://ridewithgps.com/trips/372416891',
        thumbnail: 'https://ridewithgps.com/trips/372416891/thumb.png',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a trip', async () => {
      const value = '<iframe src="https://ridewithgps.com/embeds?type=trip&id=372416891"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'trip/372416891',
        src: 'https://ridewithgps.com/embeds?type=trip&id=372416891',
        url: 'https://ridewithgps.com/trips/372416891',
        thumbnail: 'https://ridewithgps.com/trips/372416891/thumb.png',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the privacy code of a private route in the src and mint no page or thumbnail', async () => {
      const value = html`<iframe src="https://ridewithgps.com/embeds?type=route&id=34497677&privacyCode=Kq7WdN2hPzVmT4rY"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/34497677',
        src: 'https://ridewithgps.com/embeds?type=route&id=34497677&privacyCode=Kq7WdN2hPzVmT4rY',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the title of a private route beside its privacy code', async () => {
      const value = html`<iframe src="https://ridewithgps.com/embeds?type=route&id=34497677&title=Loop&privacyCode=Kq7WdN2hPzVmT4rY"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/34497677',
        src: 'https://ridewithgps.com/embeds?type=route&id=34497677&title=Loop&privacyCode=Kq7WdN2hPzVmT4rY',
        title: 'Loop',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embeds?type=route&id=38984773"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore embed parameters on a path other than the embed route', async () => {
      const value =
        '<iframe src="https://ridewithgps.com/routes/10953871?type=trip&id=372416891"></iframe>'

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

    it('should use a malformed route id as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://ridewithgps.com/embeds?type=route&id=1%2F..%2F9"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/1%2F..%2F9',
        src: 'https://ridewithgps.com/embeds?type=route&id=1%2F..%2F9',
        url: 'https://ridewithgps.com/routes/1%2F..%2F9',
        thumbnail: 'https://ridewithgps.com/routes/1%2F..%2F9/thumb.png',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a route whose id sits in eventId', async () => {
      const value =
        '<iframe src="https://ridewithgps.com/embeds?type=route&eventId=215602"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the event kind, which names its id in eventId', () => {
    it('should read the id out of eventId and mint no thumbnail', async () => {
      const value =
        '<iframe src="https://ridewithgps.com/embeds?type=event&eventId=215602&sampleGraph=true"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'event/215602',
        src: 'https://ridewithgps.com/embeds?type=event&eventId=215602',
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
    it('should mint the query spelling for a route', async () => {
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
        src: 'https://ridewithgps.com/embeds?type=route&id=10953871',
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
        src: 'https://ridewithgps.com/embeds?type=trip&id=372416891',
        url: 'https://ridewithgps.com/trips/372416891',
        thumbnail: 'https://ridewithgps.com/trips/372416891/thumb.png',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the resource out of the path when its query names another', async () => {
      const value =
        '<iframe src="https://ridewithgps.com/routes/10953871/embed?type=trip&id=372416891"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/10953871',
        src: 'https://ridewithgps.com/embeds?type=route&id=10953871',
        url: 'https://ridewithgps.com/routes/10953871',
        thumbnail: 'https://ridewithgps.com/routes/10953871/thumb.png',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a resource page framed without the embed marker', async () => {
      const value = '<iframe src="https://ridewithgps.com/routes/10953871"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route thumbnail framed in place of the embed', async () => {
      const value = '<iframe src="https://ridewithgps.com/routes/10953871/thumb.png"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path that runs on past the embed marker', async () => {
      const value = '<iframe src="https://ridewithgps.com/routes/10953871/embed/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed route id as written, even if the player answers an error', async () => {
      const value = '<iframe src="https://ridewithgps.com/routes/1%2F..%2F9/embed"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/1%2F..%2F9',
        src: 'https://ridewithgps.com/embeds?type=route&id=1%2F..%2F9',
        url: 'https://ridewithgps.com/routes/1%2F..%2F9',
        thumbnail: 'https://ridewithgps.com/routes/1%2F..%2F9/thumb.png',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry a stray percent sign in the path id as written', async () => {
      const value = '<iframe src="https://ridewithgps.com/routes/10953871%zz/embed"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ridewithgps',
        id: 'route/10953871%zz',
        src: 'https://ridewithgps.com/embeds?type=route&id=10953871%25zz',
        url: 'https://ridewithgps.com/routes/10953871%zz',
        thumbnail: 'https://ridewithgps.com/routes/10953871%zz/thumb.png',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an event framed on the embed path', async () => {
      const value = '<iframe src="https://ridewithgps.com/events/215602/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a club framed as an embed', async () => {
      const value = '<iframe src="https://ridewithgps.com/clubs/2147/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('ridewithgps shapes the pipeline repairs first', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
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
      src: 'https://ridewithgps.com/embeds?type=route&id=10953871',
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

  // ridewithgps.com serves the route thumbnail beside the embed, on the same route path.
  it('should leave a route thumbnail enclosure an image', async () => {
    const enclosures = [
      { url: 'https://ridewithgps.com/routes/10953871/thumb.png', type: 'image/png' },
    ]
    const expected = html`
      <img
        data-enclosure=""
        src="https://ridewithgps.com/routes/10953871/thumb.png"
      >
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
