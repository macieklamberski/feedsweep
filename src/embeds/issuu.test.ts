import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { issuuIframeEmbedResolver, issuuWidgetEmbedResolver } from './issuu.js'

describeForEachParser('issuuWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, issuuWidgetEmbedResolver)

  describe('the config id div', () => {
    // The shape 481 corpus feeds lose, copied from ecosistemaurbano.org (2026-08-14). The inline
    // style's size is not read.
    it('should mint the reader url from the config id', async () => {
      const value = html`
        <div
          class="issuuembed"
          style="width: 640px; height: 452px;"
          data-configid="1016421/47623369"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: '1016421/47623369',
        src: 'https://e.issuu.com/embed.html#1016421/47623369',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a div that states no size', async () => {
      const value = html`
        <div
          class="issuuembed"
          data-configid="1016421/47623369"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: '1016421/47623369',
        src: 'https://e.issuu.com/embed.html#1016421/47623369',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the document url div', () => {
    it('should mint the reader url and the canonical page from data-url', async () => {
      const value = html`
        <div
          class="issuuembed"
          style="width: 525px; height: 340px;"
          data-url="https://issuu.com/ecosistemaurbano/docs/paisaje_transversal"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'ecosistemaurbano/paisaje_transversal',
        src: 'https://e.issuu.com/embed.html?u=ecosistemaurbano&d=paisaje_transversal',
        url: 'https://issuu.com/ecosistemaurbano/docs/paisaje_transversal',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should encode a document name carrying an encoded slash once', async () => {
      const value = '<div class="issuuembed" data-url="https://issuu.com/pub/docs/do%2Fc"></div>'
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'pub/do/c',
        src: 'https://e.issuu.com/embed.html?u=pub&d=do%2Fc',
        url: 'https://issuu.com/pub/docs/do%2Fc',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry a page number from the reader url into the query', async () => {
      const value = html`
        <div
          class="issuuembed"
          data-url="https://issuu.com/ecosistemaurbano/docs/paisaje_transversal/12"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'ecosistemaurbano/paisaje_transversal',
        src: 'https://e.issuu.com/embed.html?u=ecosistemaurbano&d=paisaje_transversal&p=12',
        url: 'https://issuu.com/ecosistemaurbano/docs/paisaje_transversal',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take a malformed config id over data-url, even if the player answers an error', async () => {
      const value = html`
        <div
          class="issuuembed"
          data-configid="not-a-config-id"
          data-url="https://issuu.com/ecosistemaurbano/docs/paisaje_transversal"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'not-a-config-id',
        src: 'https://e.issuu.com/embed.html#not-a-config-id',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should use a malformed config id as written, even if the player answers an error', async () => {
      const value = html`
        <div
          class="issuuembed"
          data-configid="../evil/1"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: '../evil/1',
        src: 'https://e.issuu.com/embed.html#../evil/1',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for an empty config id', async () => {
      const value = html`
        <div
          class="issuuembed"
          data-configid=""
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a data-url on another host', async () => {
      const value = html`
        <div class="issuuembed" data-url="https://evil.test/ecosistemaurbano/docs/paisaje_transversal"></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for an issuu url that names no document', async () => {
      const value = html`
        <div class="issuuembed" data-url="https://issuu.com/ecosistemaurbano"></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should not match a div carrying neither attribute', async () => {
      const value = '<div class="issuuembed"></div>'

      expect(await extract(value)).toBeUndefined()
    })

    // The bare attribute is not the platform: the class is the other half of the guard.
    it('should not match a data-configid div without the issuu class', async () => {
      const value = '<div data-configid="1016421/47623369"></div>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('issuuIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, issuuIframeEmbedResolver)

  describe('the reader iframe', () => {
    // Publishers write the hash form by hand, which is where the config id url can be read off
    // besides the loader (ecosistemaurbano.org, 2026-08-14).
    it('should claim the hash form', async () => {
      const value = html`
        <iframe
          style="border: none; width: 620px; height: 439px;"
          src="https://e.issuu.com/embed.html#1016421/67761615"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: '1016421/67761615',
        src: 'https://e.issuu.com/embed.html#1016421/67761615',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should claim the query form and drop the display parameters', async () => {
      const value = html`
        <iframe
          src="https://e.issuu.com/embed.html?backgroundColor=%23ffffff&u=ecosistemaurbano&d=paisaje_transversal&hideIssuuLogo=true"
          width="525"
          height="340"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'ecosistemaurbano/paisaje_transversal',
        src: 'https://e.issuu.com/embed.html?u=ecosistemaurbano&d=paisaje_transversal',
        url: 'https://issuu.com/ecosistemaurbano/docs/paisaje_transversal',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the page the query names', async () => {
      const value = html`
        <iframe
          src="https://e.issuu.com/embed.html?u=ecosistemaurbano&d=paisaje_transversal&p=7"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'ecosistemaurbano/paisaje_transversal',
        src: 'https://e.issuu.com/embed.html?u=ecosistemaurbano&d=paisaje_transversal&p=7',
        url: 'https://issuu.com/ecosistemaurbano/docs/paisaje_transversal',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed page as written, even if the player answers an error', async () => {
      const value = html`
        <iframe
          src="https://e.issuu.com/embed.html?u=ecosistemaurbano&d=paisaje_transversal&p=cover"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'ecosistemaurbano/paisaje_transversal',
        src: 'https://e.issuu.com/embed.html?u=ecosistemaurbano&d=paisaje_transversal&p=cover',
        url: 'https://issuu.com/ecosistemaurbano/docs/paisaje_transversal',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // anonymous-embed.html answers 403 for every request, so these 31 feeds render nothing until
    // the query moves onto the path that still serves the reader.
    it('should repair the dead anonymous embed path', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://e.issuu.com/anonymous-embed.html?u=ecosistemaurbano&d=180309-idea_hermosillo"
          width="620"
          height="400"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'ecosistemaurbano/180309-idea_hermosillo',
        src: 'https://e.issuu.com/embed.html?u=ecosistemaurbano&d=180309-idea_hermosillo',
        url: 'https://issuu.com/ecosistemaurbano/docs/180309-idea_hermosillo',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should claim a publisher name carrying a dot', async () => {
      const value = html`
        <iframe src="https://e.issuu.com/embed.html?u=swissgolf.ch&d=swiss_golf_02-26_de"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'swissgolf.ch/swiss_golf_02-26_de',
        src: 'https://e.issuu.com/embed.html?u=swissgolf.ch&d=swiss_golf_02-26_de',
        url: 'https://issuu.com/swissgolf.ch/docs/swiss_golf_02-26_de',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for an issuu url naming no document', async () => {
      const value = '<iframe src="https://e.issuu.com/embed.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a query missing the document', async () => {
      const value = '<iframe src="https://e.issuu.com/embed.html?u=ecosistemaurbano"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed publisher name as written, even if the player answers an error', async () => {
      const value = html`
        <iframe src="https://e.issuu.com/embed.html?u=..&d=paisaje_transversal"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: '../paisaje_transversal',
        src: 'https://e.issuu.com/embed.html?u=..&d=paisaje_transversal',
        url: 'https://issuu.com/../docs/paisaje_transversal',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for a query missing the publisher', async () => {
      const value = html`
        <iframe src="https://e.issuu.com/embed.html?d=paisaje_transversal"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed document name as written, even if the player answers an error', async () => {
      const value = html`
        <iframe src="https://e.issuu.com/embed.html?u=ecosistemaurbano&d=../../evil"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'ecosistemaurbano/../../evil',
        src: 'https://e.issuu.com/embed.html?u=ecosistemaurbano&d=..%2F..%2Fevil',
        url: 'https://issuu.com/ecosistemaurbano/docs/..%2F..%2Fevil',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not claim another host spelling the embed path', async () => {
      const value = html`
        <iframe src="https://evil.test/embed.html?u=ecosistemaurbano&d=paisaje_transversal"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should not claim an issuu path that is not the reader', async () => {
      const value = html`
        <iframe src="https://static.issuu.com/widgets/shelf/index.html?u=ecosistemaurbano"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the publication name the snippet states', () => {
    it('should carry the title across from a query-form iframe', async () => {
      const value = html`
        <iframe
          title="The Beast - July 2026"
          src="https://e.issuu.com/embed.html?d=the_beast_-_july_2026&u=thebeastmag"
          allowfullscreen="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'thebeastmag/the_beast_-_july_2026',
        src: 'https://e.issuu.com/embed.html?u=thebeastmag&d=the_beast_-_july_2026',
        url: 'https://issuu.com/thebeastmag/docs/the_beast_-_july_2026',
        ratio: '5/3',
        title: 'The Beast - July 2026',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry the title across from a hash-form iframe', async () => {
      const value = html`
        <iframe
          title="Vermont Cynic Drug Issue 2026"
          src="https://e.issuu.com/embed.html#1016421/47623369"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: '1016421/47623369',
        src: 'https://e.issuu.com/embed.html#1016421/47623369',
        ratio: '5/3',
        title: 'Vermont Cynic Drug Issue 2026',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no title when the attribute holds only whitespace', async () => {
      const value = html`
        <iframe
          title="   "
          src="https://e.issuu.com/embed.html?d=the_beast_-_july_2026&u=thebeastmag"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'thebeastmag/the_beast_-_july_2026',
        src: 'https://e.issuu.com/embed.html?u=thebeastmag&d=the_beast_-_july_2026',
        url: 'https://issuu.com/thebeastmag/docs/the_beast_-_july_2026',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // A carrier framing the reader page rather than the embed, which is what a publisher pastes
  // from the address bar. The document is named the same way the widget div's `data-url` names
  // it, so both go through one reader.
  describe('the reader page', () => {
    it('should mint the embed url from a reader page', async () => {
      const value =
        '<iframe title="The Beast" src="https://issuu.com/basilikimetatroulou/docs/xyz_9_1_final"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'basilikimetatroulou/xyz_9_1_final',
        src: 'https://e.issuu.com/embed.html?u=basilikimetatroulou&d=xyz_9_1_final',
        url: 'https://issuu.com/basilikimetatroulou/docs/xyz_9_1_final',
        ratio: '5/3',
        title: 'The Beast',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry the page number a reader page states', async () => {
      const value =
        '<iframe src="https://issuu.com/basilikimetatroulou/docs/xyz_9_1_final/1"></iframe>'

      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'basilikimetatroulou/xyz_9_1_final',
        src: 'https://e.issuu.com/embed.html?u=basilikimetatroulou&d=xyz_9_1_final&p=1',
        url: 'https://issuu.com/basilikimetatroulou/docs/xyz_9_1_final',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not read the story route as a page', async () => {
      const value =
        '<iframe src="https://issuu.com/basilikimetatroulou/docs/xyz_9_1_final/s/12345"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'basilikimetatroulou/xyz_9_1_final',
        src: 'https://e.issuu.com/embed.html?u=basilikimetatroulou&d=xyz_9_1_final',
        url: 'https://issuu.com/basilikimetatroulou/docs/xyz_9_1_final',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The enclosure probe offers every attachment a feed carries to each url resolver, so a
    // document name that is a filename would take the place of a playable or downloadable file.
    const filenameDocumentFrames: Array<string> = [
      '<iframe src="https://issuu.com/pub/docs/report.pdf"></iframe>',
      '<iframe src="https://issuu.com/pub/docs/episode.mp3"></iframe>',
      '<iframe src="https://issuu.com/pub/docs/cover.jpg"></iframe>',
    ]

    it.each(filenameDocumentFrames)('should return undefined for %s', async (value) => {
      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for an issuu path naming no document', async () => {
      const publisher = '<iframe src="https://issuu.com/basilikimetatroulou"></iframe>'
      const stack = '<iframe src="https://issuu.com/basilikimetatroulou/stacks/abc"></iframe>'

      expect(await extract(publisher)).toBeUndefined()
      expect(await extract(stack)).toBeUndefined()
    })
  })

  describe('the retired Flash reader', () => {
    it('should mint the reader from the document the embed flashvars name', async () => {
      const value = html`
        <embed
          align="middle"
          allowfullscreen="true"
          flashvars="mode=embed&amp;viewMode=presentation&amp;layout=http%3A%2F%2Fskin.issuu.com%2Fv%2Flight%2Flayout.xml&amp;showFlipBtn=true&amp;documentId=110816120820-f676251f4d3248fc88309117acd22140&amp;docName=linescatalogue&amp;username=HughMcEwen&amp;loadingInfoText=LINES%20Exhibition%20Catalogue&amp;et=1314032557338&amp;er=74"
          menu="false"
          name="flashticker"
          quality="high"
          salign="l"
          scale="noscale"
          src="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf"
          style="height: 852px; width: 600px;"
          type="application/x-shockwave-flash"
        ></embed>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'HughMcEwen/linescatalogue',
        src: 'https://e.issuu.com/embed.html?u=HughMcEwen&d=linescatalogue',
        url: 'https://issuu.com/HughMcEwen/docs/linescatalogue',
        ratio: '5/3',
        title: 'LINES Exhibition Catalogue',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the flashvars param of an object carrier', async () => {
      const value = html`
        <object
          style="width: 420px; height: 298px;"
          width="320"
          height="240"
          data="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf"
          type="application/x-shockwave-flash"
        >
          <param
            name="allowfullscreen"
            value="true"
          />
          <param
            name="flashvars"
            value="mode=embed&amp;layout=http%3A%2F%2Fskin.issuu.com%2Fv%2Flight%2Flayout.xml&amp;showFlipBtn=true&amp;documentId=110426204313-cf3e2afe82b6403f92a46aaaa77cc7d3&amp;docName=tuga_magazine_n.16_-_maio_2011&amp;username=Tuga-magazine&amp;loadingInfoText=Tuga%20Magazine%20N.16%20-%20Maio%202011&amp;et=1303920345426&amp;er=43"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'Tuga-magazine/tuga_magazine_n.16_-_maio_2011',
        src: 'https://e.issuu.com/embed.html?u=Tuga-magazine&d=tuga_magazine_n.16_-_maio_2011',
        url: 'https://issuu.com/Tuga-magazine/docs/tuga_magazine_n.16_-_maio_2011',
        ratio: '5/3',
        title: 'Tuga Magazine N.16 - Maio 2011',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the document named in the swf query', async () => {
      const value = html`
        <embed
          style="width: 420px; height: 162px;"
          height="100"
          width="100"
          src="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf?mode=embed&amp;layout=http%3A%2F%2Fskin.issuu.com%2Fv%2Flight%2Flayout.xml&amp;showFlipBtn=true&amp;documentId=090125161001-a262d3aab00840f9ab472e4ed70b11a5&amp;docName=kaleed-e-jannat&amp;username=With_Hu_Presenter&amp;loadingInfoText=Kaleed-e-Jannat&amp;et=1250427221601&amp;er=15"
          menu="false"
          allowfullscreen="true"
          type="application/x-shockwave-flash"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'With_Hu_Presenter/kaleed-e-jannat',
        src: 'https://e.issuu.com/embed.html?u=With_Hu_Presenter&d=kaleed-e-jannat',
        url: 'https://issuu.com/With_Hu_Presenter/docs/kaleed-e-jannat',
        ratio: '5/3',
        title: 'Kaleed-e-Jannat',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the older documentUsername and documentName spelling', async () => {
      const value = html`
        <object>
          <param
            name="movie"
            value="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf?mode=embed&amp;documentId=100628200840-d0bf016690554bf68c34ce4ee86a96c0&amp;documentUsername=uppercaseyyc&amp;documentName=issue6&amp;layout=http%3A%2F%2Fskin.issuu.com%2Fv%2Fcolor%2Flayout.xml&amp;backgroundColor=FFFFFF&amp;showFlipBtn=true"
          />
          <param
            name="allowFullScreen"
            value="true"
          />
          <embed
            src="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf"
            type="application/x-shockwave-flash"
            allowFullScreen="true"
            style="width:600;height:450"
            flashvars="mode=embed&amp;documentId=100628200840-d0bf016690554bf68c34ce4ee86a96c0&amp;documentUsername=uppercaseyyc&amp;documentName=issue6&amp;layout=http%3A%2F%2Fskin.issuu.com%2Fv%2Fcolor%2Flayout.xml&amp;backgroundColor=FFFFFF&amp;showFlipBtn=true"
          ></embed>
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'uppercaseyyc/issue6',
        src: 'https://e.issuu.com/embed.html?u=uppercaseyyc&d=issue6',
        url: 'https://issuu.com/uppercaseyyc/docs/issue6',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the document in the swf query over the flashvars', async () => {
      const value = html`
        <object
          data="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf?documentId=120926203054-c87c187fb5ae4a5696ea7dbce53cf0d5&amp;docName=100knig2012&amp;username=biblio_romantic"
          type="application/x-shockwave-flash"
        >
          <param
            name="flashvars"
            value="documentId=110426204313-cf3e2afe82b6403f92a46aaaa77cc7d3&amp;docName=tuga_magazine_n.16_-_maio_2011&amp;username=Tuga-magazine"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'biblio_romantic/100knig2012',
        src: 'https://e.issuu.com/embed.html?u=biblio_romantic&d=100knig2012',
        url: 'https://issuu.com/biblio_romantic/docs/100knig2012',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry the page the reader opened on', async () => {
      const value = html`
        <object
          width="500"
          height="351"
          data="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf?mode=embed&amp;layout=http%3A%2F%2Fskin.issuu.com%2Fv%2Flight%2Flayout.xml&amp;showFlipBtn=true&amp;pageNumber=4&amp;documentId=100220001505-897e84d3e21746c6ab48365e90842fd8&amp;docName=budilnikxxiivek2_2010&amp;username=kopcheto&amp;loadingInfoText=%D0%91%D1%83%D0%B4%D0%B8%D0%BB%D0%BD%D0%B8%D0%BA%20%D0%BD%D0%B0%20XXII%20%D0%B2%D0%B5%D0%BA%20%D0%B1%D1%80.2%202010%20%D0%B3%D0%BE%D0%B4%D0%B8%D0%BD%D0%B0&amp;et=1268599055661&amp;er=59"
          type="application/x-shockwave-flash"
        ></object>
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'kopcheto/budilnikxxiivek2_2010',
        src: 'https://e.issuu.com/embed.html?u=kopcheto&d=budilnikxxiivek2_2010&p=4',
        url: 'https://issuu.com/kopcheto/docs/budilnikxxiivek2_2010',
        ratio: '5/3',
        title: 'Будилник на XXII век бр.2 2010 година',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no title when the flashvars carry no loading text', async () => {
      const value = html`
        <embed
          src="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf"
          type="application/x-shockwave-flash"
          flashvars="mode=embed&amp;documentId=110816120820-f676251f4d3248fc88309117acd22140&amp;docName=linescatalogue&amp;username=HughMcEwen"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'issuu',
        id: 'HughMcEwen/linescatalogue',
        src: 'https://e.issuu.com/embed.html?u=HughMcEwen&d=linescatalogue',
        url: 'https://issuu.com/HughMcEwen/docs/linescatalogue',
        ratio: '5/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined when the flashvars name no document', async () => {
      const value = html`
        <embed
          src="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf"
          type="application/x-shockwave-flash"
          flashvars="mode=embed&amp;documentId=110816120820-f676251f4d3248fc88309117acd22140&amp;username=HughMcEwen"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should not read flashvars off an issuu path that is not the Flash reader', async () => {
      const value = html`
        <embed
          src="http://static.issuu.com/viewers/webembed/style1/v1/IssuuViewer.swf"
          type="application/x-shockwave-flash"
          flashvars="mode=embed&amp;docName=linescatalogue&amp;username=HughMcEwen"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('deliberate non-resolutions', () => {
    // The `documentId` flashvar is a third id space, and neither the hash form nor the query form
    // accepts it.
    it('should leave a Flash reader naming only a document id to the generic fallback', async () => {
      const value = html`
        <embed
          src="https://static.issuu.com/webembed/viewers/style1/v2/IssuuReader.swf"
          type="application/x-shockwave-flash"
          flashvars="mode=mini&documentId=110303235823-c6b8b4bc1d1a4dd0"
          width="420"
          height="272"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('issuuIframeEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, issuuIframeEmbedResolver)

  it('should drop the site name the snippet writes in place of the document name', async () => {
    const value = html`
      <iframe src="https://e.issuu.com/embed.html#1016421/47623369" title="issuu.com"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'issuu',
      id: '1016421/47623369',
      src: 'https://e.issuu.com/embed.html#1016421/47623369',
      ratio: '5/3',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should read the name the carrier states', async () => {
    const value = html`
      <iframe src="https://e.issuu.com/embed.html#1016421/47623369" title="Cathedral News 07.06.26"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'issuu',
      id: '1016421/47623369',
      src: 'https://e.issuu.com/embed.html#1016421/47623369',
      ratio: '5/3',
      title: 'Cathedral News 07.06.26',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

describeForEachParser('the Flash reader through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the object and its nested embed into one placeholder', async () => {
    const value = html`
      <object style="height: 277px; width: 420px;">
        <param
          name="movie"
          value="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf?mode=embed&amp;layout=http%3A%2F%2Fskin.issuu.com%2Fv%2Flight%2Flayout.xml&amp;showFlipBtn=true&amp;documentId=130208104305-eee188207cfb4860b483660ee05cdb63&amp;docName=ramarromosca&amp;username=giuseppepalumbo&amp;loadingInfoText=Ramarro%2C%20supermasohero%2C%20in%20Moscow&amp;et=1360322490658&amp;er=34"
        />
        <param
          name="allowfullscreen"
          value="true"
        />
        <embed
          src="http://static.issuu.com/webembed/viewers/style1/v1/IssuuViewer.swf"
          type="application/x-shockwave-flash"
          allowfullscreen="true"
          style="width:420px;height:277px"
          flashvars="mode=embed&amp;layout=http%3A%2F%2Fskin.issuu.com%2Fv%2Flight%2Flayout.xml&amp;showFlipBtn=true&amp;documentId=130208104305-eee188207cfb4860b483660ee05cdb63&amp;docName=ramarromosca&amp;username=giuseppepalumbo&amp;loadingInfoText=Ramarro%2C%20supermasohero%2C%20in%20Moscow&amp;et=1360322490658&amp;er=34"
        />
      </object>
    `
    const expected = html`
      <div
        data-embed-title="Ramarro, supermasohero, in Moscow"
        data-embed-ratio="5/3"
        data-embed-url="https://issuu.com/giuseppepalumbo/docs/ramarromosca"
        data-embed-id="giuseppepalumbo/ramarromosca"
        data-embed-provider="issuu"
        data-embed-src="https://e.issuu.com/embed.html?u=giuseppepalumbo&amp;d=ramarromosca"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
