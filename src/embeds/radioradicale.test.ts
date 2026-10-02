import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { radioradicaleEmbedResolver, radioradicaleResolveEmbed } from './radioradicale.js'

describe('radioradicaleResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player the embed snippet writes and its page', () => {
      const value = '//www.radioradicale.it/scheda/542812/iframe'
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '542812',
        src: 'https://www.radioradicale.it/scheda/542812/iframe',
        url: 'https://www.radioradicale.it/scheda/542812',
        ratio: '16/9',
      }

      expect(radioradicaleResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the canonical host from the apex', () => {
      const value = 'https://radioradicale.it/scheda/761070/iframe'
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '761070',
        src: 'https://www.radioradicale.it/scheda/761070/iframe',
        url: 'https://www.radioradicale.it/scheda/761070',
        ratio: '16/9',
      }

      expect(radioradicaleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep every playback parameter the player reads', () => {
      const value = 'https://www.radioradicale.it/scheda/638609/iframe?f=1&i=251937&p=0&s=120&t=600'
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '638609',
        src: 'https://www.radioradicale.it/scheda/638609/iframe?f=1&i=251937&p=0&s=120&t=600',
        url: 'https://www.radioradicale.it/scheda/638609',
        ratio: '16/9',
      }

      expect(radioradicaleResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the autoplay, branding and tracking parameters', () => {
      const value =
        'https://www.radioradicale.it/scheda/523655/iframe?s=120&a=1&m=1&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '523655',
        src: 'https://www.radioradicale.it/scheda/523655/iframe?s=120',
        url: 'https://www.radioradicale.it/scheda/523655',
        ratio: '16/9',
      }

      expect(radioradicaleResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the date and hour the player does not read', () => {
      const value = 'https://www.radioradicale.it/scheda/638609/iframe?d=2021-06-10&o=10:30&s=120'
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '638609',
        src: 'https://www.radioradicale.it/scheda/638609/iframe?s=120',
        url: 'https://www.radioradicale.it/scheda/638609',
        ratio: '16/9',
      }

      expect(radioradicaleResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the Flash player onto the whole recording', () => {
      const value =
        'http://www.radioradicale.it/swf/fp/flowplayer-3.2.7.swf?30207f&config=http://www.radioradicale.it/scheda/embedcfg/401265/2838705'
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '401265',
        src: 'https://www.radioradicale.it/scheda/401265/iframe',
        url: 'https://www.radioradicale.it/scheda/401265',
        ratio: '16/9',
      }

      expect(radioradicaleResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/scheda/542812/iframe'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route below another segment', () => {
      const value = 'https://www.radioradicale.it/x/scheda/542812/iframe'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a route word the player does not serve', () => {
      const value = 'https://www.radioradicale.it/video/542812/iframe'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the page', () => {
      const value = 'https://www.radioradicale.it/scheda/542812'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the player', () => {
      const value = 'https://www.radioradicale.it/scheda/542812/iframe/extra'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player word in capitals, which lands on the page', () => {
      const value = 'https://www.radioradicale.it/scheda/542812/IFRAME'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the Flash player configuration', () => {
      const value = 'http://www.radioradicale.it/scheda/embedcfg/401265/2838705'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a Flash configuration on a foreign host', () => {
      const value =
        'http://www.radioradicale.it/swf/fp/flowplayer-3.2.7.swf?config=https://evil.test/scheda/embedcfg/401265/2838705'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a Flash configuration below another segment', () => {
      const value =
        'http://www.radioradicale.it/swf/fp/flowplayer-3.2.7.swf?config=http://www.radioradicale.it/x/embedcfg/401265/2838705'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a Flash configuration route word the server does not serve', () => {
      const value =
        'http://www.radioradicale.it/swf/fp/flowplayer-3.2.7.swf?config=http://www.radioradicale.it/scheda/playlist/401265/2838705'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a Flash configuration with a segment after the clip', () => {
      const value =
        'http://www.radioradicale.it/swf/fp/flowplayer-3.2.7.swf?config=http://www.radioradicale.it/scheda/embedcfg/401265/2838705/extra'

      expect(radioradicaleResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the route with a trailing slash', () => {
      const value = 'https://www.radioradicale.it/scheda/542812/iframe/'
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '542812',
        src: 'https://www.radioradicale.it/scheda/542812/iframe',
        url: 'https://www.radioradicale.it/scheda/542812',
        ratio: '16/9',
      }

      expect(radioradicaleResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an id that is not a number as written', () => {
      const value = 'https://www.radioradicale.it/scheda/542812a/iframe'
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '542812a',
        src: 'https://www.radioradicale.it/scheda/542812a/iframe',
        url: 'https://www.radioradicale.it/scheda/542812a',
        ratio: '16/9',
      }

      expect(radioradicaleResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('radioradicaleEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, radioradicaleEmbedResolver)

  describe('happy paths', () => {
    it('should take the platform size over the declared box', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://www.radioradicale.it/scheda/542812/iframe"
          width="560"
          height="355"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '542812',
        src: 'https://www.radioradicale.it/scheda/542812/iframe',
        url: 'https://www.radioradicale.it/scheda/542812',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the Flash object onto the whole recording', async () => {
      const value = html`
        <object
          data="http://www.radioradicale.it/swf/fp/flowplayer-3.2.7.swf?30207f&amp;config=http://www.radioradicale.it/scheda/embedcfg/401265/2838705"
          height="330"
          type="application/x-shockwave-flash"
          width="400"
        ></object>
      `
      const expected: EmbedResolverResult = {
        provider: 'radioradicale',
        id: '401265',
        src: 'https://www.radioradicale.it/scheda/401265/iframe',
        url: 'https://www.radioradicale.it/scheda/401265',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/scheda/542812/iframe"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('radioradicale player through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should state the player ratio over the declared box', async () => {
    const value = html`
      <iframe
        width="560"
        height="355"
        src="//www.radioradicale.it/scheda/761070/iframe"
        frameborder="0"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://www.radioradicale.it/scheda/761070"
        data-embed-id="761070"
        data-embed-provider="radioradicale"
        data-embed-src="https://www.radioradicale.it/scheda/761070/iframe"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should rebuild the Flash object and its params onto the whole recording', async () => {
    const value = html`
      <object
        data="http://www.radioradicale.it/swf/fp/flowplayer-3.2.7.swf?30207f&amp;config=http://www.radioradicale.it/scheda/embedcfg/401265/2838705"
        height="330"
        type="application/x-shockwave-flash"
        width="400"
      >
        <param
          name="movie"
          value="http://www.radioradicale.it/swf/fp/flowplayer-3.2.7.swf?30207f&amp;config=http://www.radioradicale.it/scheda/embedcfg/401265/2838705"
        />
        <param
          name="allowFullScreen"
          value="true"
        />
      </object>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://www.radioradicale.it/scheda/401265"
        data-embed-id="401265"
        data-embed-provider="radioradicale"
        data-embed-src="https://www.radioradicale.it/scheda/401265/iframe"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
