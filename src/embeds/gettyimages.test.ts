import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { composeWidgetEmbedUrl, gettyImagesEmbedResolver, readWidgetConfig } from './gettyimages.js'

// The config is a JavaScript object literal rather than JSON, so it is read key by key. No
// element is involved, so there is no parser to vary.
describe('readWidgetConfig', () => {
  describe('happy paths', () => {
    it('should read every field the player url needs', () => {
      const value = `gie.widgets.load({id:'iPo3qjCKSVJU-bRwLBwNoQ',sig:'OOM9B40xxpnASE4yukj6V63Qa909rgGMxHZzru08p0c=',w:'594px',h:'395px',items:'491183014',caption: true ,tld:'com',is360: false })`
      const expected = {
        items: '491183014',
        et: 'iPo3qjCKSVJU-bRwLBwNoQ',
        sig: 'OOM9B40xxpnASE4yukj6V63Qa909rgGMxHZzru08p0c=',
        tld: 'com',
        caption: 'true',
        width: 594,
        height: 395,
      }

      expect(readWidgetConfig(value)).toEqual(expected)
    })

    it('should fall back to the com domain and no caption when neither is stated', () => {
      const value = `gie.widgets.load({id:'abc',sig:'def=',w:'480px',h:'320px',items:'123456789'})`
      const expected = {
        items: '123456789',
        et: 'abc',
        sig: 'def=',
        tld: 'com',
        caption: 'false',
        width: 480,
        height: 320,
      }

      expect(readWidgetConfig(value)).toEqual(expected)
    })

    it('should keep a regional domain', () => {
      const value = `gie.widgets.load({id:'abc',sig:'def=',items:'123456789',tld:'co.uk'})`
      const expected = {
        items: '123456789',
        et: 'abc',
        sig: 'def=',
        tld: 'co.uk',
        caption: 'false',
        width: undefined,
        height: undefined,
      }

      expect(readWidgetConfig(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should refuse a config with no signature, which the player rejects with a 400', () => {
      const value = `gie.widgets.load({id:'abc',w:'594px',h:'395px',items:'491183014'})`

      expect(readWidgetConfig(value)).toBeUndefined()
    })

    it('should refuse a config with no embed token, which the player rejects with a 400', () => {
      const value = `gie.widgets.load({sig:'def=',w:'594px',h:'395px',items:'491183014'})`

      expect(readWidgetConfig(value)).toBeUndefined()
    })

    it('should use a malformed item id as written, even if the player answers an error', () => {
      const value = `gie.widgets.load({id:'abc',sig:'def=',items:'not-an-id'})`
      const expected = {
        items: 'not-an-id',
        et: 'abc',
        sig: 'def=',
        tld: 'com',
        caption: 'false',
      }

      expect(readWidgetConfig(value)).toEqual(expected)
    })
  })
})

describe('composeWidgetEmbedUrl', () => {
  describe('happy paths', () => {
    it('should build the player url the pre-hydrated iframe carries', () => {
      const value = {
        items: '491183014',
        et: 'iPo3qjCKSVJU-bRwLBwNoQ',
        sig: 'OOM9B40x=',
        tld: 'com',
        caption: 'true',
      }
      const expected =
        'https://embed.gettyimages.com/embed/491183014?et=iPo3qjCKSVJU-bRwLBwNoQ&tld=com&sig=OOM9B40x%3D&caption=true'

      expect(composeWidgetEmbedUrl(value)).toBe(expected)
    })
  })
})

describeForEachParser('gettyImagesEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, gettyImagesEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the player iframe and keep its signed query whole', async () => {
      const value =
        '<iframe src="https://embed.gettyimages.com/embed/492381322?et=cDxg5NFcRMx1XLFxZDgc0w&tld=com&viewMoreLink=on&sig=VHEk4Nmc0V832P7TTYFTGYLHOid_pXnO05LCJzLgVIY=&caption=true" width="594" height="395"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'gettyimages',
        id: '492381322',
        src: 'https://embed.gettyimages.com/embed/492381322?et=cDxg5NFcRMx1XLFxZDgc0w&tld=com&viewMoreLink=on&sig=VHEk4Nmc0V832P7TTYFTGYLHOid_pXnO05LCJzLgVIY=&caption=true',
        url: 'https://www.gettyimages.com/detail/492381322',
        width: 594,
        height: 395,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve an item id shorter than the ones Getty mints today', async () => {
      const value =
        '<iframe src="https://embed.gettyimages.com/embed/83621?et=cDxg5NFcRMx1XLFxZDgc0w&tld=com&sig=VHEk4Nmc0V832P7TTYFTGYLHOid_pXnO05LCJzLgVIY=&caption=true"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'gettyimages',
        id: '83621',
        src: 'https://embed.gettyimages.com/embed/83621?et=cDxg5NFcRMx1XLFxZDgc0w&tld=com&sig=VHEk4Nmc0V832P7TTYFTGYLHOid_pXnO05LCJzLgVIY=&caption=true',
        url: 'https://www.gettyimages.com/detail/83621',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the photo detail page', async () => {
      const value = '<iframe src="https://www.gettyimages.com/detail/491183014"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/491183014?sig=x"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the player route below a leading segment', async () => {
      const value = '<iframe src="https://embed.gettyimages.com/x/embed/491183014?sig=x"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the player route followed by a trailing segment', async () => {
      const value =
        '<iframe src="https://embed.gettyimages.com/embed/491183014/extra?sig=x"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Only the pipeline shows what the host's enclosures become, since injectEnclosures offers each
// one to every url-keyed resolver.
describeForEachParser('gettyimages enclosures', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a photo file on the media host an image', async () => {
    const enclosures = [
      {
        url: 'https://media.gettyimages.com/id/2207912631/photo/person-playing-slot-machines-in-a-vibrant-casino-environment.jpg?s=612x612&w=0&k=20&c=VfjZJAwq_UnkAmMXEyOyUs-HpLnX1d6OlN2khiRTTn4=',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <img
        src="https://media.gettyimages.com/id/2207912631/photo/person-playing-slot-machines-in-a-vibrant-casino-environment.jpg?s=612x612&amp;w=0&amp;k=20&amp;c=VfjZJAwq_UnkAmMXEyOyUs-HpLnX1d6OlN2khiRTTn4="
        data-enclosure=""
      />
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
