import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { channelOneEmbedResolver, channelOneResolveEmbed } from './1tv.js'

describe('channelOneResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player of a video', () => {
      const value = 'https://www.1tv.ru/embed/80103:12'
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '80103:12',
        src: 'https://www.1tv.ru/embed/80103:12',
        ratio: '16/9',
      }

      expect(channelOneResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the type of a news item in the key', () => {
      const value = 'https://www.1tv.ru/embed/554646:11'
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '554646:11',
        src: 'https://www.1tv.ru/embed/554646:11',
        ratio: '16/9',
      }

      expect(channelOneResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position and drop the autostart', () => {
      const value = 'https://www.1tv.ru/embed/147417:12?start=auto&t=30&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '147417:12',
        src: 'https://www.1tv.ru/embed/147417:12?t=30',
        ratio: '16/9',
      }

      expect(channelOneResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the Flash news player onto the legacy news type', () => {
      const value = 'http://www.1tv.ru/newsvideo/173017'
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '173017:1',
        src: 'https://www.1tv.ru/embed/173017:1',
        ratio: '16/9',
      }

      expect(channelOneResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the Flash promo player onto the legacy video type', () => {
      const value = 'http://www.1tv.ru/promoovideo/56965'
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '56965:15',
        src: 'https://www.1tv.ru/embed/56965:15',
        ratio: '16/9',
      }

      expect(channelOneResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the framed video route onto the legacy video type', () => {
      const value = 'http://www.1tv.ru/i_video/92965'
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '92965:15',
        src: 'https://www.1tv.ru/embed/92965:15',
        ratio: '16/9',
      }

      expect(channelOneResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the framed news route onto its legacy news type', () => {
      const value = 'https://www.1tv.ru/i_newsvideo/281258'
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '281258:17',
        src: 'https://www.1tv.ru/embed/281258:17',
        ratio: '16/9',
      }

      expect(channelOneResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the www host from the bare one', () => {
      const value = 'https://1tv.ru/embed/34890:12'
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '34890:12',
        src: 'https://www.1tv.ru/embed/34890:12',
        ratio: '16/9',
      }

      expect(channelOneResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the id through as written', () => {
      const value = 'https://www.1tv.ru/embed/x34890_y:99'
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: 'x34890_y:99',
        src: 'https://www.1tv.ru/embed/x34890_y:99',
        ratio: '16/9',
      }

      expect(channelOneResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/embed/147417:12'

      expect(channelOneResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://www.1tv.ru/x/embed/147417:12'

      expect(channelOneResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://www.1tv.ru/embed/147417:12/extra'

      expect(channelOneResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another route word', () => {
      const value = 'https://www.1tv.ru/embeds/147417:12'

      expect(channelOneResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route word that only contains the Flash news route', () => {
      const value = 'http://www.1tv.ru/oldnewsvideo/173017'

      expect(channelOneResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the route with no id', () => {
      const value = 'https://www.1tv.ru/embed/'

      expect(channelOneResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id with no type', () => {
      const value = 'https://www.1tv.ru/embed/147417'

      expect(channelOneResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('channelOneEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, channelOneEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the declared box', async () => {
      const value = html`
        <iframe
          src="https://www.1tv.ru/embed/80103:12"
          style="width:640px;height:360px"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '80103:12',
        src: 'https://www.1tv.ru/embed/80103:12',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the Flash news player inside its object', async () => {
      const value = html`
        <object>
          <embed
            width="460"
            height="353"
            align="middle"
            flashvars="stats=http://www.1tv.ru/addclick/"
            allowscriptaccess="always"
            swliveconnect="true"
            wmode="window"
            allowfullscreen="true"
            quality="high"
            bgcolor="white"
            name="videoportal"
            id="videoportal"
            src="http://www.1tv.ru/newsvideo/173017"
            type="application/x-shockwave-flash"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '173017:1',
        src: 'https://www.1tv.ru/embed/173017:1',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
    it('should mint the Flash promo player inside its embed', async () => {
      const value = html`
        <embed
          align="middle"
          allowfullscreen="true"
          allowscriptaccess="always"
          bgcolor="white"
          flashvars="stats=http://www.1tv.ru/addclick/"
          height="368"
          id="videoportal"
          name="videoportal"
          quality="high"
          src="http://www.1tv.ru/promoovideo/56965"
          swliveconnect="true"
          type="application/x-shockwave-flash"
          width="640"
          wmode="window"
        >
      `
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '56965:15',
        src: 'https://www.1tv.ru/embed/56965:15',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the framed news route inside its iframe', async () => {
      const value = html`
        <iframe
          width="500"
          height="281"
          src="https://www.1tv.ru/i_newsvideo/281258"
          frameborder="2"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: '1tv',
        id: '281258:17',
        src: 'https://www.1tv.ru/embed/281258:17',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/147417:12"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('1tv players through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should resolve a protocol-relative player', async () => {
    const value = html`
      <iframe
        allow="encrypted-media"
        allowfullscreen=""
        frameborder="0"
        height="315"
        src="//www.1tv.ru/embed/147417:12"
        width="560"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="147417:12"
        data-embed-provider="1tv"
        data-embed-src="https://www.1tv.ru/embed/147417:12"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a 1tv video enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://static.1tv.ru/uploads/video/material/2019/09/07/544522.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://static.1tv.ru/uploads/video/material/2019/09/07/544522.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
