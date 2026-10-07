import { describe, expect, it } from 'bun:test'
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

    it('should claim the query form and keep its display parameters', async () => {
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
        src: 'https://e.issuu.com/embed.html?backgroundColor=%23ffffff&u=ecosistemaurbano&d=paisaje_transversal&hideIssuuLogo=true',
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
        src: 'https://e.issuu.com/embed.html?d=the_beast_-_july_2026&u=thebeastmag',
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
        src: 'https://e.issuu.com/embed.html?d=the_beast_-_july_2026&u=thebeastmag',
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

  describe('deliberate non-resolutions', () => {
    // 364 corpus feeds carry the Flash viewer and 353 of them have no companion iframe, so those
    // documents are lost. They stay lost: the `documentId` flashvar is a third id space, and
    // neither the hash form nor the query form accepts it. `IssuuReader.swf` is still served,
    // which changes nothing because no browser plays it.
    it('should leave the Flash viewer to the generic fallback', async () => {
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
