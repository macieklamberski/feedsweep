import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { indavideoEmbedResolver, indavideoResolveEmbed } from './indavideo.js'

describe('indavideoResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player url from the embed host the share dialog writes', () => {
      const value = 'https://embed.indavideo.hu/player/video/c75c95c854/'
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: 'c75c95c854',
        src: 'https://indavideo.hu/player/video/c75c95c854/',
        url: 'https://indavideo.hu/video/c75c95c854',
        ratio: '16/9',
      }

      expect(indavideoResolveEmbed(value)).toEqual(expected)
    })

    it('should read the player on the main host without a trailing slash', () => {
      const value = 'http://indavideo.hu/player/video/1485aa56be'
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: '1485aa56be',
        src: 'https://indavideo.hu/player/video/1485aa56be/',
        url: 'https://indavideo.hu/video/1485aa56be',
        ratio: '16/9',
      }

      expect(indavideoResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the display settings and the autostart the publisher wrote', () => {
      const value = 'https://embed.indavideo.hu/player/video/7867c1faef/?autostart=0&vol=1&static=1'
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: '7867c1faef',
        src: 'https://indavideo.hu/player/video/7867c1faef/',
        url: 'https://indavideo.hu/video/7867c1faef',
        ratio: '16/9',
      }

      expect(indavideoResolveEmbed(value)).toEqual(expected)
    })

    it('should move the Flash player whose query names the video onto the current player', () => {
      const value = 'http://files.indavideo.hu/player/vc_o.swf?vID=06aceb75c8'
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: '06aceb75c8',
        src: 'https://indavideo.hu/player/video/06aceb75c8/',
        url: 'https://indavideo.hu/video/06aceb75c8',
        ratio: '16/9',
      }

      expect(indavideoResolveEmbed(value)).toEqual(expected)
    })

    it('should use the id as written, even if the player answers an empty page', () => {
      const value = 'https://embed.indavideo.hu/player/video/C75C95C854/'
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: 'C75C95C854',
        src: 'https://indavideo.hu/player/video/C75C95C854/',
        url: 'https://indavideo.hu/video/C75C95C854',
        ratio: '16/9',
      }

      expect(indavideoResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/player/video/c75c95c854/'

      expect(indavideoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route behind another segment', () => {
      const value = 'https://indavideo.hu/x/player/video/c75c95c854/'

      expect(indavideoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route followed by another segment', () => {
      const value = 'https://indavideo.hu/player/video/c75c95c854/extra'

      expect(indavideoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route word that is not the video player', () => {
      const value = 'https://indavideo.hu/player/clip/c75c95c854/'

      expect(indavideoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a swf that is not one of the video players', () => {
      const value = 'http://files.indavideo.hu/player/other.swf?vID=06aceb75c8'

      expect(indavideoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the channel strip, which names a feed and no video', () => {
      const value =
        'http://files.indavideo.hu/player/indavideo_strip.swf?align=landscape&feed=http%3A%2F%2Fwww.indavideo.hu%2F%3Faction%3Drss%26profile%3D1%26user_name%3DChaoyang'

      expect(indavideoResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('indavideoEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, indavideoEmbedResolver)

  describe('happy paths', () => {
    it('should state the video ratio over the box the share dialog states', async () => {
      const value = html`
        <iframe
          title="indavideo video player"
          class="indavideo-player"
          id="player-835f3e91e5"
          type="text/html"
          src="https://embed.indavideo.hu/player/video/835f3e91e5/"
          frameborder="0"
          height="360"
          width="640"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: '835f3e91e5',
        src: 'https://indavideo.hu/player/video/835f3e91e5/',
        url: 'https://indavideo.hu/video/835f3e91e5',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the name the carrier states', async () => {
      const value = html`
        <iframe
          src="https://indavideo.hu/player/video/017c714d39/"
          title="Szurkolj Dél-Afrikának!"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: '017c714d39',
        src: 'https://indavideo.hu/player/video/017c714d39/',
        url: 'https://indavideo.hu/video/017c714d39',
        ratio: '16/9',
        title: 'Szurkolj Dél-Afrikának!',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/player/video/835f3e91e5/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash player whose flashvars name the video in another id space', async () => {
      const value = html`
        <embed
          flashvars="id=2/inda64833s0&autostart=false"
          src="http://assets.indavideo.hu/swf/player.swf?autostart=false&id=2/inda64833s0"
          type="application/x-shockwave-flash"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the Flash players that named the video in a vID flashvar', () => {
    it('should repair the gup player on the files host', async () => {
      const value = html`
        <embed
          height="384"
          width="460"
          flashvars="vID=abeb1bef82&autostart=false"
          src="http://files.indavideo.hu/player/gup.swf?b=1009"
          type="application/x-shockwave-flash"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: 'abeb1bef82',
        src: 'https://indavideo.hu/player/video/abeb1bef82/',
        url: 'https://indavideo.hu/video/abeb1bef82',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the player on the assets host', async () => {
      const value = html`
        <embed
          flashvars="vID=2d1548911c&autostart=false"
          src="http://assets.indavideo.hu/swf/player.swf"
          width="460"
          height="298"
          type="application/x-shockwave-flash"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: '2d1548911c',
        src: 'https://indavideo.hu/player/video/2d1548911c/',
        url: 'https://indavideo.hu/video/2d1548911c',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the video the query names over the flashvars', async () => {
      const value = html`
        <embed
          flashvars="vID=abeb1bef82"
          src="http://files.indavideo.hu/player/vc_o.swf?vID=06aceb75c8"
          type="application/x-shockwave-flash"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'indavideo',
        id: '06aceb75c8',
        src: 'https://indavideo.hu/player/video/06aceb75c8/',
        url: 'https://indavideo.hu/video/06aceb75c8',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('indavideo through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should turn the object and embed pair into one placeholder', async () => {
    const value = html`
      <object height="384" width="460" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000">
        <param value="vID=c75c95c854&autostart=false" name="flashvars">
        <param value="http://files.indavideo.hu/player/gup.swf?b=1009" name="src">
        <embed height="384" width="460" flashvars="vID=c75c95c854&autostart=false" src="http://files.indavideo.hu/player/gup.swf?b=1009" type="application/x-shockwave-flash">
      </object>
    `
    const expected = html`
      <div
        data-embed-id="c75c95c854"
        data-embed-provider="indavideo"
        data-embed-src="https://indavideo.hu/player/video/c75c95c854/"
        data-embed-url="https://indavideo.hu/video/c75c95c854"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should read the iframe written without a scheme', async () => {
    const value = html`
      <iframe
        title="indavideo video player"
        src="//embed.indavideo.hu/player/video/3ddcb61602"
        width="478"
        height="360"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-id="3ddcb61602"
        data-embed-provider="indavideo"
        data-embed-src="https://indavideo.hu/player/video/3ddcb61602/"
        data-embed-url="https://indavideo.hu/video/3ddcb61602"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a video enclosure on an indavideo host playable', async () => {
    const enclosures = [
      {
        url: 'https://index1-int.indavideo.hu/indexvideo/000/347/476/delafrika.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://index1-int.indavideo.hu/indexvideo/000/347/476/delafrika.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
