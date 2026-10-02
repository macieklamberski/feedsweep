import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { vokiFlashEmbedResolver, vokiIframeEmbedResolver } from './voki.js'

describeForEachParser('vokiFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vokiFlashEmbedResolver)

  describe('happy paths', () => {
    it('should rebuild the Flash embed onto the share page', async () => {
      const value = html`
        <embed
          height="267"
          width="200"
          src="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm=631cce3b6b1bb63568035e9ad179caee%26sc=7715476"
          quality="high"
          wmode="transparent"
          type="application/x-shockwave-flash"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'voki',
        id: '7715476/631cce3b6b1bb63568035e9ad179caee',
        src: 'https://www.voki.com/site/pickup?scid=7715476&chsm=631cce3b6b1bb63568035e9ad179caee',
        url: 'https://www.voki.com/site/pickup?scid=7715476&chsm=631cce3b6b1bb63568035e9ad179caee',
        height: 547,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a scene url encoded whole', async () => {
      const value = html`
        <embed
          src="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm%3D2fb008c528e67dff89c71fa8537825c6%26sc%3D3050018"
          type="application/x-shockwave-flash"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'voki',
        id: '3050018/2fb008c528e67dff89c71fa8537825c6',
        src: 'https://www.voki.com/site/pickup?scid=3050018&chsm=2fb008c528e67dff89c71fa8537825c6',
        url: 'https://www.voki.com/site/pickup?scid=3050018&chsm=2fb008c528e67dff89c71fa8537825c6',
        height: 547,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the Flash object', async () => {
      const value = html`
        <object
          id="widget_name"
          width="200"
          height="267"
          data="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=http://vhss-d.oddcast.com/php/vhss_editors/getvoki/chsm=7b873d015a30077b744546719acf699f%26sc=3344629"
          type="application/x-shockwave-flash"
        >
          <param name="wmode" value="transparent">
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'voki',
        id: '3344629/7b873d015a30077b744546719acf699f',
        src: 'https://www.voki.com/site/pickup?scid=3344629&chsm=7b873d015a30077b744546719acf699f',
        url: 'https://www.voki.com/site/pickup?scid=3344629&chsm=7b873d015a30077b744546719acf699f',
        height: 547,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the player on vhss-a.oddcast.com', async () => {
      const value = html`
        <embed
          src="http://vhss-a.oddcast.com/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm%3D0832f9649b4a0dc9ecc5a64c8d44f60c%26sc%3D87897"
          type="application/x-shockwave-flash"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'voki',
        id: '87897/0832f9649b4a0dc9ecc5a64c8d44f60c',
        src: 'https://www.voki.com/site/pickup?scid=87897&chsm=0832f9649b4a0dc9ecc5a64c8d44f60c',
        url: 'https://www.voki.com/site/pickup?scid=87897&chsm=0832f9649b4a0dc9ecc5a64c8d44f60c',
        height: 547,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<embed src="https://evil.test/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm=631cce3b6b1bb63568035e9ad179caee%26sc=7715476">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another movie on the host', async () => {
      const value =
        '<embed src="http://vhss-d.oddcast.com/vhss_editors/other_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm=631cce3b6b1bb63568035e9ad179caee%26sc=7715476">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the player under another path', async () => {
      const value =
        '<embed src="http://vhss-d.oddcast.com/x/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm=631cce3b6b1bb63568035e9ad179caee%26sc=7715476">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path that runs past the player', async () => {
      const value =
        '<embed src="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf/extra?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm=631cce3b6b1bb63568035e9ad179caee%26sc=7715476">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player whose scene url is empty', async () => {
      const value = html`
        <embed
          src="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc="
          type="application/x-shockwave-flash"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a doc url outside the scene route', async () => {
      const value =
        '<embed src="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetother%2Fchsm=631cce3b6b1bb63568035e9ad179caee%26sc=7715476">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a scene url with no scene', async () => {
      const value =
        '<embed src="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm=631cce3b6b1bb63568035e9ad179caee">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a scene url with no checksum', async () => {
      const value =
        '<embed src="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fsc=7715476">'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should insert the scene as written', async () => {
      const value =
        '<embed src="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm=631CCE3B%26sc=77-15">'
      const expected: EmbedResolverResult = {
        provider: 'voki',
        id: '77-15/631CCE3B',
        src: 'https://www.voki.com/site/pickup?scid=77-15&chsm=631CCE3B',
        url: 'https://www.voki.com/site/pickup?scid=77-15&chsm=631CCE3B',
        height: 547,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('vokiIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vokiIframeEmbedResolver)

  describe('happy paths', () => {
    it('should read the share page in a frame', async () => {
      const value =
        '<iframe src="https://www.voki.com/site/pickup?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'voki',
        id: '2981757/007275daae1363c5599d3bae7e3ab08a',
        src: 'https://www.voki.com/site/pickup?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a',
        url: 'https://www.voki.com/site/pickup?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a',
        height: 547,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the route in any case, as the site does', async () => {
      const value =
        '<iframe src="https://www.voki.com/Site/Pickup/?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'voki',
        id: '2981757/007275daae1363c5599d3bae7e3ab08a',
        src: 'https://www.voki.com/site/pickup?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a',
        url: 'https://www.voki.com/site/pickup?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a',
        height: 547,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the scene and drop the rest of the query', async () => {
      const value =
        '<iframe src="https://www.voki.com/site/pickup?chsm=007275daae1363c5599d3bae7e3ab08a&utm_source=feed&scid=2981757"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'voki',
        id: '2981757/007275daae1363c5599d3bae7e3ab08a',
        src: 'https://www.voki.com/site/pickup?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a',
        url: 'https://www.voki.com/site/pickup?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a',
        height: 547,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/site/pickup?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the route under another path', async () => {
      const value =
        '<iframe src="https://www.voki.com/x/site/pickup?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path that runs past the route', async () => {
      const value =
        '<iframe src="https://www.voki.com/site/pickup/extra?scid=2981757&chsm=007275daae1363c5599d3bae7e3ab08a"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a share page with no scene', async () => {
      const value =
        '<iframe src="https://www.voki.com/site/pickup?chsm=007275daae1363c5599d3bae7e3ab08a"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a share page with no checksum', async () => {
      const value = '<iframe src="https://www.voki.com/site/pickup?scid=2981757"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('voki shapes the pipeline repairs first', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the Flash object that names the player only in its params', async () => {
    const value = html`
      <object
        classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        height="267"
        id="widget_name"
        width="200"
      >
        <param name="movie" value="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=http://vhss-d.oddcast.com/php/vhss_editors/getvoki/chsm=3edcf5f086b130f93d1406299863e1a4%26sc=6133078">
        <param name="quality" value="high">
        <embed
          height="267"
          width="200"
          src="http://vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=http%3A%2F%2Fvhss-d.oddcast.com%2Fphp%2Fvhss_editors%2Fgetvoki%2Fchsm=3edcf5f086b130f93d1406299863e1a4%26sc=6133078"
          type="application/x-shockwave-flash"
          name="widget_name"
        >
      </object>
    `
    const expected = html`
      <div
        data-embed-height="547"
        data-embed-url="https://www.voki.com/site/pickup?scid=6133078&chsm=3edcf5f086b130f93d1406299863e1a4"
        data-embed-id="6133078/3edcf5f086b130f93d1406299863e1a4"
        data-embed-provider="voki"
        data-embed-src="https://www.voki.com/site/pickup?scid=6133078&chsm=3edcf5f086b130f93d1406299863e1a4"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
