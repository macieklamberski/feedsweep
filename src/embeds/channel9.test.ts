import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { channel9EmbedResolver } from './channel9.js'

describeForEachParser('channel9EmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, channel9EmbedResolver)

  describe('happy paths', () => {
    it('should mint the embed page from a show episode at the video ratio', async () => {
      const value = html`
        <iframe
          src="https://channel9.msdn.com/Shows/Azure-Friday/Introducing-Azure-Analysis-Services/player"
          width="560"
          height="315"
          allowFullScreen
          frameBorder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'azure-friday/introducing-azure-analysis-services',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=azure-friday&ep=introducing-azure-analysis-services',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint a blog episode onto the same show query', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Blogs/one-dev-minute/what-is-mlops--one-dev-question/player"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'one-dev-minute/what-is-mlops--one-dev-question',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=one-dev-minute&ep=what-is-mlops--one-dev-question',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint a series episode', async () => {
      const value = html`
        <iframe
          src="https://channel9.msdn.com/Series/aspnetmonsters/ASPNET-Monsters-78-Azure-Functions-with-Chris-Anderson/player"
          width="640"
          height="360"
          allowfullscreen
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'aspnetmonsters/aspnet-monsters-78-azure-functions-with-chris-anderson',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=aspnetmonsters&ep=aspnet-monsters-78-azure-functions-with-chris-anderson',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint an event session onto the event query', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Events/Build/2017/T6064/player"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'events/build-2017/t6064',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?ev=build-2017&session=t6064',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', async () => {
      const value = html`<iframe src="https://evil.test/Shows/Azure-Friday/An-Episode/player"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', async () => {
      const value = html`<iframe src="https://channel9.msdn.com.evil.test/Shows/Azure-Friday/An-Episode/player"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a section outside the retired route words', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Feeds/Azure-Friday/An-Episode/player"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a posts episode unresolved', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/posts/Erik-Meijer/Going-Deep-with-Erik/player"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a show page that names no episode', async () => {
      const value = '<iframe src="https://channel9.msdn.com/Shows/Azure-Friday/player"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a show episode with a segment before the player route', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Shows/Azure-Friday/An-Episode/extra/player"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an episode page that is not the player route', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Shows/Azure-Friday/An-Episode/discussion"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should lowercase the two names and compose each as one parameter', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Shows/Going+Deep/Inside-Windows-8/player"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'going+deep/inside-windows-8',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=going%2Bdeep&ep=inside-windows-8',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the section whatever case the publisher wrote it in', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/SHOWS/Azure-Friday/An-Episode/PLAYER"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'azure-friday/an-episode',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=azure-friday&ep=an-episode',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a player route with a trailing slash', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Shows/Azure-Friday/An-Episode/player/"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'azure-friday/an-episode',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=azure-friday&ep=an-episode',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a player route with a format query', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Shows/Azure-Friday/An-Episode/player?format=html5"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'azure-friday/an-episode',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=azure-friday&ep=an-episode',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a show name carrying an ampersand as one parameter', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Shows/Azure&Friends/An-Episode/player"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'azure&friends/an-episode',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=azure%26friends&ep=an-episode',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep an event session carrying a separator as one parameter', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Events/Build/2017/T6064&ev=stolen/player"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'events/build-2017/t6064&ev=stolen',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?ev=build-2017&session=t6064%26ev%3Dstolen',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the Events route', () => {
    it('should leave the event shape unresolved under another section', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Shows/Build/2017/T6064/player"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave an event session with two names unresolved', async () => {
      const value = '<iframe src="https://channel9.msdn.com/Events/Build/T6064/player"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should mint a sub-event in place of the year onto the event query', async () => {
      const value = html`
        <iframe
          src="https://channel9.msdn.com/Events/NET-Fringe/NET-Fringe-2016/NET-Fringe-2016/player"
          width="560"
          height="315"
          allowFullScreen
          frameBorder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'events/net-fringe-net-fringe-2016/net-fringe-2016',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?ev=net-fringe-net-fringe-2016&session=net-fringe-2016',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave an event with a segment before the player route unresolved', async () => {
      const value = html`<iframe src="https://channel9.msdn.com/Events/Build/2017/T6064/extra/player"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('channel9 shapes the pipeline resolves first', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should resolve a protocol-relative player url', async () => {
    const value = html`<iframe src="//channel9.msdn.com/Shows/Azure-Friday/An-Episode/player"></iframe>`
    const expected = html`
      <div
        data-embed-src="https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=azure-friday&ep=an-episode"
        data-embed-provider="channel9"
        data-embed-id="azure-friday/an-episode"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
