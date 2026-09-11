import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { channel9EmbedResolver } from './channel9.js'

describeForEachParser('channel9EmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, channel9EmbedResolver)

  describe('happy paths', () => {
    it('should mint the embed page from a show episode and keep the stated box', async () => {
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
        url: 'https://learn.microsoft.com/en-us/shows/azure-friday/introducing-azure-analysis-services',
        width: 560,
        height: 315,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint a blog episode onto the same show query', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com/Blogs/one-dev-minute/what-is-mlops--one-dev-question/player"
      ></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'one-dev-minute/what-is-mlops--one-dev-question',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=one-dev-minute&ep=what-is-mlops--one-dev-question',
        url: 'https://learn.microsoft.com/en-us/shows/one-dev-minute/what-is-mlops--one-dev-question',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint a series episode', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com/Series/Tuesdays-With-Corey/Tuesdays-with-Corey-Whats-New/player"
      ></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'tuesdays-with-corey/tuesdays-with-corey-whats-new',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=tuesdays-with-corey&ep=tuesdays-with-corey-whats-new',
        url: 'https://learn.microsoft.com/en-us/shows/tuesdays-with-corey/tuesdays-with-corey-whats-new',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint a posts episode', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com/posts/Erik-Meijer/Going-Deep-with-Erik/player"
      ></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'erik-meijer/going-deep-with-erik',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=erik-meijer&ep=going-deep-with-erik',
        url: 'https://learn.microsoft.com/en-us/shows/erik-meijer/going-deep-with-erik',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', async () => {
      const value = html`<iframe
        src="https://evil.test/channel9.msdn.com/Shows/Azure-Friday/An-Episode/player"
      ></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com.evil.test/Shows/Azure-Friday/An-Episode/player"
      ></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a section outside the retired route words', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com/Feeds/Azure-Friday/An-Episode/player"
      ></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a show page that names no episode', async () => {
      const value = '<iframe src="https://channel9.msdn.com/Shows/Azure-Friday/player"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an episode page that is not the player route', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com/Shows/Azure-Friday/An-Episode/discussion"
      ></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should lowercase the two names and leave every other character as the server does', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com/Shows/Going+Deep/Inside-Windows-8/player"
      ></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'going+deep/inside-windows-8',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=going+deep&ep=inside-windows-8',
        url: 'https://learn.microsoft.com/en-us/shows/going+deep/inside-windows-8',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the section whatever case the publisher wrote it in', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com/SHOWS/Azure-Friday/An-Episode/PLAYER"
      ></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'channel9',
        id: 'azure-friday/an-episode',
        src: 'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html?show=azure-friday&ep=an-episode',
        url: 'https://learn.microsoft.com/en-us/shows/azure-friday/an-episode',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should refuse a name that would add its own parameter to the query', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com/Shows/Azure-Friday/ep&show=stolen/player"
      ></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the Events route, which composes differently', () => {
    it('should leave an event unresolved even in the two-segment shape', async () => {
      const value = '<iframe src="https://channel9.msdn.com/Events/Build/T6064/player"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a three-segment event unresolved', async () => {
      const value =
        '<iframe src="https://channel9.msdn.com/Events/Build/2017/T6064/player"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a four-segment event unresolved', async () => {
      const value = html`<iframe
        src="https://channel9.msdn.com/Events/Microsoft-Azure/AzureCon-2015/ACON305/player"
      ></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('channel9 urls that stay prose', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should leave an event page link as a link', async () => {
    const value = '<p><a href="https://channel9.msdn.com/events/Build/2017">Build 2017</a></p>'

    expect(await convert(value)).toEqualHtml(value)
  })

  it('should leave a showpost link as a link', async () => {
    const value = html`<p>
      <a href="https://channel9.msdn.com/showpost.aspx?postid=104290">A post</a>
    </p>`

    expect(await convert(value)).toEqualHtml(value)
  })
})
