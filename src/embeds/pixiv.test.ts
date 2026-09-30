import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { pixivIframeEmbedResolver, pixivScriptEmbedResolver } from './pixiv.js'

describeForEachParser('pixivScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pixivScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the frame at the size the loader names, with the credits', async () => {
      const value = html`
        <script
          src="https://s.pximg.net/source/embed.js"
          data-id="68454421_3242fa3dae02423915c3de740a31d501"
          data-size="small"
          data-border="on"
          charset="utf-8"
        ></script>
        <noscript>
          <p>
            <a href="https://www.pixiv.net/member_illust.php?mode=medium&amp;illust_id=68454421" target="_blank">コミティア124　新刊サンプル</a>
            by <a href="https://www.pixiv.net/member.php?id=4026769" target="_blank">みなづき忍</a>
            on <a href="https://www.pixiv.net/" target="_blank">pixiv</a>
          </p>
        </noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '68454421_3242fa3dae02423915c3de740a31d501',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=68454421_3242fa3dae02423915c3de740a31d501&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/68454421',
        width: 220,
        height: 250,
        title: 'コミティア124　新刊サンプル',
        author: 'みなづき忍',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the medium bordered frame from the loader on source.pixiv.net', async () => {
      const value = html`
        <script
          src="http://source.pixiv.net/source/embed.js"
          data-id="32104226_e6e76f8a0e345d37e9ae9f92d4bdc6cf"
          data-size="medium"
          data-border="on"
          charset="utf-8"
        ></script>
        <noscript>
          <p>
            <a href="http://www.pixiv.net/member_illust.php?mode=medium&amp;illust_id=32104226" target="_blank">C83新刊 まんまるドロップ</a>
            by <a href="http://www.pixiv.net/member.php?id=5931" target="_blank">空木次葉@31日東H-10b</a>
            on <a href="http://www.pixiv.net/" target="_blank">pixiv</a>
          </p>
        </noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '32104226_e6e76f8a0e345d37e9ae9f92d4bdc6cf',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=32104226_e6e76f8a0e345d37e9ae9f92d4bdc6cf&size=medium&border=on',
        url: 'https://www.pixiv.net/artworks/32104226',
        width: 390,
        height: 300,
        title: 'C83新刊 まんまるドロップ',
        author: '空木次葉@31日東H-10b',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no size for a borderless frame', async () => {
      const value = html`
        <script
          charset="utf-8"
          src="http://source.pixiv.net/source/embed.js"
          data-border="off"
          data-size="medium"
          data-id="23640843_aed3b4ace6e9e5064dc2b234a588ab61"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '23640843_aed3b4ace6e9e5064dc2b234a588ab61',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=23640843_aed3b4ace6e9e5064dc2b234a588ab61&size=medium&border=off',
        url: 'https://www.pixiv.net/artworks/23640843',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // No large bordered loader is on record, so this is the large specimen with its border on.
    it('should build the large bordered frame', async () => {
      const value = html`
        <script
          src="http://source.pixiv.net/source/embed.js"
          data-id="15697702_45428a6a134cff27a403d86973c3baf2"
          data-size="large"
          data-border="on"
          charset="utf-8"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '15697702_45428a6a134cff27a403d86973c3baf2',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=15697702_45428a6a134cff27a403d86973c3baf2&size=large&border=on',
        url: 'https://www.pixiv.net/artworks/15697702',
        width: 700,
        height: 550,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the loader path', async () => {
      const value = html`
        <script
          src="https://evil.test/source/embed.js?source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed work id as written, even if the player answers an error', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="../other"
          data-size="small"
          data-border="on"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '../other',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=..%2Fother&size=small&border=on',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed work id carrying a query as written, even if the player answers an error', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40&amp;size=large"
          data-size="small"
          data-border="on"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40&size=large',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40%26size%3Dlarge&size=small&border=on',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a work id carrying a quote as written, beside a filled mount', async () => {
      const value = html`
        <div
          class="pixiv-embed"
          data-id="45958594"
          data-done="1"
        ></div>
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594&quot;]"
          data-size="small"
          data-border="on"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594"]',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594%22%5D&size=small&border=on',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a size the loader does not know', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="huge"
          data-border="on"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader naming no size', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-border="on"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader naming no border', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should not read a block holding an anchor off pixiv', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
        ></script>
        <noscript>
          <p>
            <a href="https://www.pixiv.net/artworks/45958594">A work</a>
            <a href="https://evil.test/a">Enable scripts</a>
          </p>
        </noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not read the pixiv home link as the title', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
        ></script>
        <noscript><p>on <a href="http://www.pixiv.net/">pixiv</a></p></noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not read the work as the author when the block names no artist', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
        ></script>
        <noscript><p><a href="https://www.pixiv.net/artworks/45958594">A work</a></p></noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 220,
        height: 250,
        title: 'A work',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not read a work link under a prefixed path', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
        ></script>
        <noscript><p><a href="https://www.pixiv.net/x/artworks/45958594">A work</a></p></noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not read a work link with a trailing segment', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
        ></script>
        <noscript><p><a href="https://www.pixiv.net/artworks/45958594/extra">A work</a></p></noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not read an artist link under a prefixed path', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
        ></script>
        <noscript><p><a href="https://www.pixiv.net/x/users/463194">An artist</a></p></noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not read an artist link with a trailing segment', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
        ></script>
        <noscript><p><a href="https://www.pixiv.net/users/463194/extra">An artist</a></p></noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not read credits outside a noscript', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
        ></script>
        <p><a href="https://www.pixiv.net/artworks/45958594">A work</a></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the mount the loader filled before the page was saved', () => {
    it('should leave the work to the filled mount', async () => {
      const value = html`
        <div
          class="pixiv-embed"
          data-border="on"
          data-done="1"
          data-id="20876902_3eb1f86c6564f3f6b250710fc5f386e0"
          data-size="small"
        >
          <iframe
            frameborder="0"
            height="269"
            id="pixiv-embed-0.38705899635850915"
            name="pixiv-embed-0.38705899635850915"
            src="http://embed.pixiv.net/embed_mk2.php?id=20876902_3eb1f86c6564f3f6b250710fc5f386e0&amp;size=small&amp;border=on&amp;done=null"
            width="220"
          ></iframe>
        </div>
        <script
          charset="utf-8"
          src="http://source.pixiv.net/source/embed.js"
          data-id="20876902_3eb1f86c6564f3f6b250710fc5f386e0"
          data-size="small"
          data-border="on"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should resolve a loader beside a filled mount of another work', async () => {
      const value = html`
        <div
          class="pixiv-embed"
          data-border="on"
          data-done="1"
          data-id="20951994_0f2fd6ec8b90333b6cba48386f4b0313"
          data-size="small"
        ></div>
        <script
          charset="utf-8"
          src="http://source.pixiv.net/source/embed.js"
          data-id="20876902_3eb1f86c6564f3f6b250710fc5f386e0"
          data-size="small"
          data-border="on"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '20876902_3eb1f86c6564f3f6b250710fc5f386e0',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=20876902_3eb1f86c6564f3f6b250710fc5f386e0&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/20876902',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a loader beside a mount the loader has not filled', async () => {
      const value = html`
        <div
          class="pixiv-embed"
          data-id="20876902_3eb1f86c6564f3f6b250710fc5f386e0"
          data-size="small"
          data-border="on"
        ></div>
        <script
          charset="utf-8"
          src="http://source.pixiv.net/source/embed.js"
          data-id="20876902_3eb1f86c6564f3f6b250710fc5f386e0"
          data-size="small"
          data-border="on"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '20876902_3eb1f86c6564f3f6b250710fc5f386e0',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=20876902_3eb1f86c6564f3f6b250710fc5f386e0&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/20876902',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a loader beside a filled div of another class', async () => {
      const value = html`
        <div
          class="pixiv-embed-illust"
          data-done="1"
          data-id="20876902_3eb1f86c6564f3f6b250710fc5f386e0"
        ></div>
        <script
          charset="utf-8"
          src="http://source.pixiv.net/source/embed.js"
          data-id="20876902_3eb1f86c6564f3f6b250710fc5f386e0"
          data-size="small"
          data-border="on"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '20876902_3eb1f86c6564f3f6b250710fc5f386e0',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=20876902_3eb1f86c6564f3f6b250710fc5f386e0&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/20876902',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('pixivIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pixivIframeEmbedResolver)

  describe('happy paths', () => {
    it('should read the frame the loader wrote, at the height it measured', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="347"
          id="pixiv-embed-0.7085032705717353"
          name="pixiv-embed-0.7085032705717353"
          src="http://embed.pixiv.net/embed_mk2.php?id=21083839_8595a4d2c55cbfd73b6d1bcd386bde6e&amp;size=medium&amp;border=on&amp;done=null"
          style="border: currentColor;"
          width="390"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '21083839_8595a4d2c55cbfd73b6d1bcd386bde6e',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=21083839_8595a4d2c55cbfd73b6d1bcd386bde6e&size=medium&border=on',
        url: 'https://www.pixiv.net/artworks/21083839',
        width: 390,
        height: 347,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the older card on the current frame and its box', async () => {
      const value = html`
        <iframe
          style="background:transparent;"
          width="380"
          height="168"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
          scrolling="no"
          src="http://embed.pixiv.net/code.php?id=12233044_207713685a42a25dbbc43c976b610482"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '12233044_207713685a42a25dbbc43c976b610482',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=12233044_207713685a42a25dbbc43c976b610482',
        url: 'https://www.pixiv.net/artworks/12233044',
        width: 220,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the Hatena Blog frame', async () => {
      const value = html`
        <iframe
          src="https://embed.pixiv.net/fixed.php?id=149288339"
          width="400"
          height="350"
          frameborder="0"
          marginwidth="0"
          marginheight="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '149288339',
        src: 'https://embed.pixiv.net/fixed.php?id=149288339',
        url: 'https://www.pixiv.net/artworks/149288339',
        width: 400,
        height: 350,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the oEmbed frame of an illustration', async () => {
      const value = html`
        <iframe
          width="600"
          height="315"
          src="https://embed.pixiv.net/oembed_iframe.php?type=illust&amp;id=93349282"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '93349282',
        src: 'https://embed.pixiv.net/oembed_iframe.php?type=illust&id=93349282',
        url: 'https://www.pixiv.net/artworks/93349282',
        width: 600,
        height: 315,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the frame path', async () => {
      const value = '<iframe src="https://evil.test/fixed.php?id=149288339"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route pixiv does not serve', async () => {
      const value =
        '<iframe src="https://embed.pixiv.net/framed.php?type=illust&id=93349282"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a frame route under a prefixed path', async () => {
      const value = '<iframe src="https://embed.pixiv.net/x/fixed.php?id=149288339"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a frame route with a trailing segment', async () => {
      const value = '<iframe src="https://embed.pixiv.net/fixed.php/extra?id=149288339"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a frame naming no work', async () => {
      const value = '<iframe src="https://embed.pixiv.net/fixed.php"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed work id as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://embed.pixiv.net/fixed.php?id=149288339%2F..%2Fx"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '149288339/../x',
        src: 'https://embed.pixiv.net/fixed.php?id=149288339%2F..%2Fx',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the oEmbed frame of a novel', async () => {
      const value = html`
        <iframe
          width="600"
          height="315"
          src="https://embed.pixiv.net/oembed_iframe.php?type=novel&amp;id=93349282"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the blog parts widget', async () => {
      const value = html`
        <iframe
          style="background:transparent;"
          width="170"
          height="200"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
          scrolling="no"
          src="http://embed.pixiv.net/blogparts.php?md=m&amp;id=yamico_98746e0132b8076f5f2c9b7c299d5706&amp;logoColor=0x258FB8&amp;bgColor=0xFFFFFF"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The loader is a script the whole run drops and the credits sit in a noscript, so only the
// pipeline shows the two folding into one placeholder. Only the pipeline offers enclosures.
describeForEachParser('pixiv through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should fold the loader and its credits into one placeholder', async () => {
    const value = html`
      <p>before</p>
      <script
        src="http://source.pixiv.net/source/embed.js"
        data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
        data-size="small"
        data-border="on"
      ></script>
      <noscript><p><a href="http://www.pixiv.net/member_illust.php?mode=medium&illust_id=45958594">A work</a> by <a href="http://www.pixiv.net/member.php?id=463194">An artist</a> on <a href="http://www.pixiv.net/">pixiv</a></p></noscript>
    `
    const expected = html`
      <p>before</p>
      <div
        data-embed-provider="pixiv"
        data-embed-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
        data-embed-src="https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on"
        data-embed-url="https://www.pixiv.net/artworks/45958594"
        data-embed-width="220"
        data-embed-height="250"
        data-embed-title="A work"
        data-embed-author="An artist"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep credits that name no work', async () => {
    const value = html`
      <p>before</p>
      <script
        src="http://source.pixiv.net/source/embed.js"
        data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
        data-size="small"
        data-border="on"
      ></script>
      <noscript><p>on <a href="http://www.pixiv.net/">pixiv</a></p></noscript>
    `
    const expected = html`
      <p>before</p>
      <div
        data-embed-provider="pixiv"
        data-embed-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
        data-embed-src="https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on"
        data-embed-url="https://www.pixiv.net/artworks/45958594"
        data-embed-width="220"
        data-embed-height="250"
      ></div>
      <p>on <a href="http://www.pixiv.net/">pixiv</a></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should draw a filled mount and its loader once', async () => {
    const value = html`
      <div
        class="pixiv-embed"
        data-border="on"
        data-done="1"
        data-id="21083839_8595a4d2c55cbfd73b6d1bcd386bde6e"
        data-size="medium"
      >
        <iframe
          frameborder="0"
          height="347"
          id="pixiv-embed-0.7085032705717353"
          name="pixiv-embed-0.7085032705717353"
          src="http://embed.pixiv.net/embed_mk2.php?id=21083839_8595a4d2c55cbfd73b6d1bcd386bde6e&amp;size=medium&amp;border=on&amp;done=null"
          style="border: currentColor;"
          width="390"
        ></iframe>
      </div>
      <script
        charset="utf-8"
        src="http://source.pixiv.net/source/embed.js"
        data-id="21083839_8595a4d2c55cbfd73b6d1bcd386bde6e"
        data-size="medium"
        data-border="on"
      ></script>
    `
    const expected = html`
      <div
        data-embed-provider="pixiv"
        data-embed-id="21083839_8595a4d2c55cbfd73b6d1bcd386bde6e"
        data-embed-src="https://embed.pixiv.net/embed_mk2.php?id=21083839_8595a4d2c55cbfd73b6d1bcd386bde6e&size=medium&border=on"
        data-embed-url="https://www.pixiv.net/artworks/21083839"
        data-embed-width="390"
        data-embed-height="347"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should claim a frame page offered as an enclosure', async () => {
    const enclosures = [
      {
        url: 'https://embed.pixiv.net/embed_mk2.php?id=21083839_8595a4d2c55cbfd73b6d1bcd386bde6e&size=medium&border=on',
        type: 'text/html',
      },
    ]

    const expected = html`
      <div
        data-enclosure=""
        data-embed-provider="pixiv"
        data-embed-id="21083839_8595a4d2c55cbfd73b6d1bcd386bde6e"
        data-embed-src="https://embed.pixiv.net/embed_mk2.php?id=21083839_8595a4d2c55cbfd73b6d1bcd386bde6e&size=medium&border=on"
        data-embed-url="https://www.pixiv.net/artworks/21083839"
      ></div>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  it('should leave an image enclosure on the frame host an image', async () => {
    const enclosures = [
      {
        url: 'https://embed.pixiv.net/decorate.php?illust_id=93349282&mdate=1633843881',
        type: 'image/png',
      },
    ]

    const expected = html`
      <img data-enclosure="" src="https://embed.pixiv.net/decorate.php?illust_id=93349282&mdate=1633843881">
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
