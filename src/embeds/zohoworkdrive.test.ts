import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { zohoworkdriveEmbedResolver } from './zohoworkdrive.js'

describeForEachParser('zohoworkdriveEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, zohoworkdriveEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from a share link frame', async () => {
      const value = html`
        <iframe
          src="https://workdrive.zohoexternal.com/external/b8c94010215e9f50b3809aa3171a89ced5a60318b6c73663eca74e7ffae86d81"
          width="1440"
          height="1109"
          frameborder="0"
          scrolling="no"
          allowfullscreen=""
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'external/b8c94010215e9f50b3809aa3171a89ced5a60318b6c73663eca74e7ffae86d81',
        src: 'https://workdrive.zohoexternal.com/external/b8c94010215e9f50b3809aa3171a89ced5a60318b6c73663eca74e7ffae86d81',
        url: 'https://workdrive.zohoexternal.com/external/b8c94010215e9f50b3809aa3171a89ced5a60318b6c73663eca74e7ffae86d81',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the placeholder from an embed frame and drop its display settings', async () => {
      const value = html`
        <iframe
          class="zpiframe "
          src="https://workdrive.zohoexternal.com/embed/ltzse3c88230e6abf4698ade713b8f0c69178?toolbar=false&amp;appearance=light&amp;themecolor=green"
          width="800"
          height="450"
          align="center"
          allowfullscreen
          frameBorder="0"
          scrolling="no"
          title="Embed code"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'embed/ltzse3c88230e6abf4698ade713b8f0c69178',
        src: 'https://workdrive.zohoexternal.com/embed/ltzse3c88230e6abf4698ade713b8f0c69178',
        url: 'https://workdrive.zohoexternal.com/embed/ltzse3c88230e6abf4698ade713b8f0c69178',
        thumbnail:
          'https://previewengine.zohoexternal.com/thumbnail/WD/ltzse3c88230e6abf4698ade713b8f0c69178?size=l',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state a video ratio for a frame the dialog marks as a video', async () => {
      const value = html`
        <iframe
          class="zpvideo "
          width="800"
          height="450"
          src="https://workdrive.zohopublic.eu/embed/cp48bb8302fb39e9d4e65b0e31dc6f6de9fd9?toolbar=false&amp;appearance=light&amp;themecolor=green"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'embed/cp48bb8302fb39e9d4e65b0e31dc6f6de9fd9',
        src: 'https://workdrive.zohopublic.eu/embed/cp48bb8302fb39e9d4e65b0e31dc6f6de9fd9',
        url: 'https://workdrive.zohopublic.eu/embed/cp48bb8302fb39e9d4e65b0e31dc6f6de9fd9',
        thumbnail:
          'https://previewengine.zohopublic.eu/thumbnail/WD/cp48bb8302fb39e9d4e65b0e31dc6f6de9fd9?size=l',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the loop and drop the autoplay on the app host', async () => {
      const value = html`
        <iframe
          class="zpvideo "
          width="800"
          height="450"
          src="https://workdrive.zoho.com/embed/nyn890d57781aad364bac82edd53e2a1d6b36?loop=true&amp;autoplay=true&amp;toolbar=false&amp;appearance=light&amp;themecolor=green"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'embed/nyn890d57781aad364bac82edd53e2a1d6b36',
        src: 'https://workdrive.zohoexternal.com/embed/nyn890d57781aad364bac82edd53e2a1d6b36?loop=true',
        url: 'https://workdrive.zohoexternal.com/embed/nyn890d57781aad364bac82edd53e2a1d6b36',
        thumbnail:
          'https://previewengine.zohoexternal.com/thumbnail/WD/nyn890d57781aad364bac82edd53e2a1d6b36?size=l',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the Indian external domain and state a document ratio', async () => {
      const value = html`
        <iframe
          class="zpiframe "
          src="https://workdrive.zohoexternal.in/embed/4dz5i6485a1dc2f854e80b9d45431c268cab1?toolbar=true&amp;appearance=light&amp;themecolor=green"
          width="800"
          height="520"
          align="center"
          allowfullscreen
          frameBorder="0"
          scrolling="no"
          title="Embed code"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'embed/4dz5i6485a1dc2f854e80b9d45431c268cab1',
        src: 'https://workdrive.zohoexternal.in/embed/4dz5i6485a1dc2f854e80b9d45431c268cab1',
        url: 'https://workdrive.zohoexternal.in/embed/4dz5i6485a1dc2f854e80b9d45431c268cab1',
        thumbnail:
          'https://previewengine.zohoexternal.in/thumbnail/WD/4dz5i6485a1dc2f854e80b9d45431c268cab1?size=l',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a share link frame on the public host without its embed suffix', async () => {
      const value = html`
        <iframe
          src="https://workdrive.zohopublic.com/external/0f61d112fbf1cac326130a3a1e186a3d2f519307b5d9a8abf4cc8a85a0c3a35a/embed"
          width="1440"
          height="1109"
          frameborder="0"
          scrolling="no"
          allowfullscreen=""
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'external/0f61d112fbf1cac326130a3a1e186a3d2f519307b5d9a8abf4cc8a85a0c3a35a',
        src: 'https://workdrive.zohoexternal.com/external/0f61d112fbf1cac326130a3a1e186a3d2f519307b5d9a8abf4cc8a85a0c3a35a',
        url: 'https://workdrive.zohoexternal.com/external/0f61d112fbf1cac326130a3a1e186a3d2f519307b5d9a8abf4cc8a85a0c3a35a',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fold the case of a link id in the key only', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D81"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'external/b8c94010215e9f50b3809aa3171a89ced5a60318b6c73663eca74e7ffae86d81',
        src: 'https://workdrive.zohoexternal.com/external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D81',
        url: 'https://workdrive.zohoexternal.com/external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D81',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the case of a link id that is not 64 hex digits', async () => {
      const value = '<iframe src="https://workdrive.zohoexternal.com/external/AbC123"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'external/AbC123',
        src: 'https://workdrive.zohoexternal.com/external/AbC123',
        url: 'https://workdrive.zohoexternal.com/external/AbC123',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the case of a link id one digit longer than 64', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D810"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D810',
        src: 'https://workdrive.zohoexternal.com/external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D810',
        url: 'https://workdrive.zohoexternal.com/external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D810',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the case of a link id with a prefix before 64 hex digits', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/external/XB8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D81"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'external/XB8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D81',
        src: 'https://workdrive.zohoexternal.com/external/XB8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D81',
        url: 'https://workdrive.zohoexternal.com/external/XB8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D81',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the case of a link id with a separator among its digits', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D8="></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D8=',
        src: 'https://workdrive.zohoexternal.com/external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D8=',
        url: 'https://workdrive.zohoexternal.com/external/B8C94010215E9F50B3809AA3171A89CED5A60318B6C73663ECA74E7FFAE86D8=',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the case of a file id in the key', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/embed/JANRP2D360F279B9F47B5AC474C09B88B6A81"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'embed/JANRP2D360F279B9F47B5AC474C09B88B6A81',
        src: 'https://workdrive.zohoexternal.com/embed/JANRP2D360F279B9F47B5AC474C09B88B6A81',
        url: 'https://workdrive.zohoexternal.com/embed/JANRP2D360F279B9F47B5AC474C09B88B6A81',
        thumbnail:
          'https://previewengine.zohoexternal.com/thumbnail/WD/JANRP2D360F279B9F47B5AC474C09B88B6A81?size=l',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker on the query', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/embed/janrp2d360f279b9f47b5ac474c09b88b6a81?utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'zohoworkdrive',
        id: 'embed/janrp2d360f279b9f47b5ac474c09b88b6a81',
        src: 'https://workdrive.zohoexternal.com/embed/janrp2d360f279b9f47b5ac474c09b88b6a81',
        url: 'https://workdrive.zohoexternal.com/embed/janrp2d360f279b9f47b5ac474c09b88b6a81',
        thumbnail:
          'https://previewengine.zohoexternal.com/thumbnail/WD/janrp2d360f279b9f47b5ac474c09b88b6a81?size=l',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the embed path', async () => {
      const value =
        '<iframe src="https://evil.test/embed/janrp2d360f279b9f47b5ac474c09b88b6a81"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a subdomain of a claimed host', async () => {
      const value =
        '<iframe src="https://x.workdrive.zohoexternal.com/embed/janrp2d360f279b9f47b5ac474c09b88b6a81"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route below another segment', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/x/embed/janrp2d360f279b9f47b5ac474c09b88b6a81"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment past the file id', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/embed/janrp2d360f279b9f47b5ac474c09b88b6a81/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the share route below another segment', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/x/external/b8c94010215e9f50b3809aa3171a89ced5a60318b6c73663eca74e7ffae86d81"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment past the link id other than embed', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/external/b8c94010215e9f50b3809aa3171a89ced5a60318b6c73663eca74e7ffae86d81/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an unknown route word', async () => {
      const value =
        '<iframe src="https://workdrive.zohoexternal.com/embedz/janrp2d360f279b9f47b5ac474c09b88b6a81"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route with no file id', async () => {
      const value = '<iframe src="https://workdrive.zohoexternal.com/embed/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('zohoworkdrive through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the embed frame with the placeholder', async () => {
    const value = html`
      <iframe
        class="zpvideo "
        width="800"
        height="450"
        src="https://workdrive.zoho.com/embed/nyn890d57781aad364bac82edd53e2a1d6b36?loop=true&amp;autoplay=true&amp;toolbar=false&amp;appearance=light&amp;themecolor=green"
        frameborder="0"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-thumbnail="https://previewengine.zohoexternal.com/thumbnail/WD/nyn890d57781aad364bac82edd53e2a1d6b36?size=l"
        data-embed-url="https://workdrive.zohoexternal.com/embed/nyn890d57781aad364bac82edd53e2a1d6b36"
        data-embed-id="embed/nyn890d57781aad364bac82edd53e2a1d6b36"
        data-embed-provider="zohoworkdrive"
        data-embed-src="https://workdrive.zohoexternal.com/embed/nyn890d57781aad364bac82edd53e2a1d6b36?loop=true"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
