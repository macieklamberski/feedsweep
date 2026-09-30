import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { calameoEmbedResolver, calameoResolveEmbed } from './calameo.js'

describe('calameoResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the viewer url', () => {
      const value = 'https://v.calameo.com/?bkcode=0077756511c9c6e552299'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0077756511c9c6e552299',
        src: 'https://v.calameo.com/?bkcode=0077756511c9c6e552299',
        url: 'https://www.calameo.com/books/0077756511c9c6e552299',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should lift the code off the retired Flash viewer', () => {
      const value = 'http://v.calameo.com/2.3/cviewer.swf?bkcode=0077756511c9c6e552299&langid=pt'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0077756511c9c6e552299',
        src: 'https://v.calameo.com/?bkcode=0077756511c9c6e552299&langid=pt',
        url: 'https://www.calameo.com/books/0077756511c9c6e552299?langid=pt',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the access token of a private publication in the viewer url only', () => {
      const value = 'https://v.calameo.com/?bkcode=002574221fb7a74a40f7a&authid=WdhyTr98dSUk'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '002574221fb7a74a40f7a',
        src: 'https://v.calameo.com/?bkcode=002574221fb7a74a40f7a&authid=WdhyTr98dSUk',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should read the access token in any case', () => {
      const value = 'https://v.calameo.com/?bkcode=002574221fb7a74a40f7a&AuthID=WdhyTr98dSUk'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '002574221fb7a74a40f7a',
        src: 'https://v.calameo.com/?bkcode=002574221fb7a74a40f7a&authid=WdhyTr98dSUk',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the language of a private publication in the viewer url only', () => {
      const value =
        'https://v.calameo.com/?bkcode=002574221fb7a74a40f7a&authid=WdhyTr98dSUk&langid=fr'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '002574221fb7a74a40f7a',
        src: 'https://v.calameo.com/?bkcode=002574221fb7a74a40f7a&langid=fr&authid=WdhyTr98dSUk',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the share menu the publisher turned off', () => {
      const value =
        'https://v.calameo.com/?bkcode=00725978727c6763c01b0&mode=mini &mode=mini&view=slide&showsharemenu=false&clickto=view&clicktarget=_self'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '00725978727c6763c01b0',
        src: 'https://v.calameo.com/?bkcode=00725978727c6763c01b0&mode=mini+&view=slide&clickto=view&clicktarget=_self&showsharemenu=false',
        url: 'https://www.calameo.com/books/00725978727c6763c01b0',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a library shelf naming no publication', () => {
      const value = 'https://v.calameo.com/library?subscriptionid=123'

      expect(calameoResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed code as written, even if the player answers an error', () => {
      const value = 'https://v.calameo.com/?bkcode=../books'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '../books',
        src: 'https://v.calameo.com/?bkcode=..%2Fbooks',
        url: 'https://www.calameo.com/books/..%2Fbooks',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a language with a prefix in front of the two letters', () => {
      const value = 'https://v.calameo.com/?bkcode=0077756511c9c6e552299&langid=xpt'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0077756511c9c6e552299',
        src: 'https://v.calameo.com/?bkcode=0077756511c9c6e552299',
        url: 'https://www.calameo.com/books/0077756511c9c6e552299',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a language with an encoded ampersand beside a letter', () => {
      const value = 'https://v.calameo.com/?bkcode=0077756511c9c6e552299&langid=p%26'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0077756511c9c6e552299',
        src: 'https://v.calameo.com/?bkcode=0077756511c9c6e552299',
        url: 'https://www.calameo.com/books/0077756511c9c6e552299',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker beside the viewer options', () => {
      const value =
        'https://v.calameo.com/?bkcode=0047347972d89219ca0ff&mode=mini&utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0047347972d89219ca0ff',
        src: 'https://v.calameo.com/?bkcode=0047347972d89219ca0ff&mode=mini',
        url: 'https://www.calameo.com/books/0047347972d89219ca0ff',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a language with a suffix after the two letters', () => {
      const value = 'https://v.calameo.com/?bkcode=0077756511c9c6e552299&langid=pt/../x'
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0077756511c9c6e552299',
        src: 'https://v.calameo.com/?bkcode=0077756511c9c6e552299',
        url: 'https://www.calameo.com/books/0077756511c9c6e552299',
      }

      expect(calameoResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('calameoEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, calameoEmbedResolver)

  describe('happy paths', () => {
    it('should read the viewer iframe with its options at its declared box', async () => {
      const value = html`
        <iframe
          style="margin: 0 auto;"
          src="https://v.calameo.com/?bkcode=0047347972d89219ca0ff&amp;mode=mini&amp;view=book&amp;clickto=view&amp;clicktarget=_self"
          width="560"
          height="350"
          frameborder="0"
          scrolling="no"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0047347972d89219ca0ff',
        src: 'https://v.calameo.com/?bkcode=0047347972d89219ca0ff&mode=mini&view=book&clickto=view&clicktarget=_self',
        url: 'https://www.calameo.com/books/0047347972d89219ca0ff',
        width: 560,
        height: 350,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the code and its options from the flashvars of a bare mini player embed', async () => {
      const value = html`
        <embed
          src="http://v.calameo.com/2.0/cmini.swf"
          type="application/x-shockwave-flash"
          scale="noscale"
          allowscriptaccess="always"
          loop="false"
          salign="t"
          wmode="transparent"
          style="width:240px; height:147px"
          flashvars="bkcode=000108536974e8b083351&amp;langid=es&amp;clickTo=public&amp;clickTarget=_blank&amp;autoFlip=0&amp;showArrows=1&amp;page=1"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '000108536974e8b083351',
        src: 'https://v.calameo.com/?bkcode=000108536974e8b083351&langid=es&page=1&clickto=public&clicktarget=_blank',
        url: 'https://www.calameo.com/books/000108536974e8b083351?langid=es',
        width: 240,
        height: 147,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the Flash viewer object at its declared box', async () => {
      const value = html`
        <object
          id="calameo-viewer-0077756511c9c6e552299-1324375075"
          width="100%"
          height="500"
          data="http://v.calameo.com/2.3/cviewer.swf?bkcode=0077756511c9c6e552299&amp;langid=pt"
          type="application/x-shockwave-flash"
        >
          <param
            name="src"
            value="http://v.calameo.com/2.3/cviewer.swf?bkcode=0077756511c9c6e552299&amp;langid=pt"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0077756511c9c6e552299',
        src: 'https://v.calameo.com/?bkcode=0077756511c9c6e552299&langid=pt',
        url: 'https://www.calameo.com/books/0077756511c9c6e552299?langid=pt',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the Flash mini player embed', async () => {
      const value = html`
        <object
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          width="240"
          height="147"
        >
          <param
            name="movie"
            value="http://v.calameo.com/2.1/cmini.swf?bkcode=0077756511c9c6e552299&amp;langid=es"
          />
          <embed
            id="calameo-mini-inner-0077756511c9c6e552299"
            type="application/x-shockwave-flash"
            src="http://v.calameo.com/2.1/cmini.swf?bkcode=0077756511c9c6e552299&amp;langid=es"
            width="240"
            height="147"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0077756511c9c6e552299',
        src: 'https://v.calameo.com/?bkcode=0077756511c9c6e552299&langid=es',
        url: 'https://www.calameo.com/books/0077756511c9c6e552299?langid=es',
        width: 240,
        height: 147,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry the options the Flash mini player object wrote in camel case', async () => {
      const value = html`
        <object
          id="calameo-mini-000247364f239153fcb2f"
          width="240"
          height="147"
          data="http://v.calameo.com/2.1/cmini.swf?bkcode=000247364f239153fcb2f&amp;langid=fr&amp;clickTo=embed&amp;clickTarget=_blank&amp;autoFlip=0&amp;showArrows=1&amp;page=1"
          type="application/x-shockwave-flash"
        ></object>
      `
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '000247364f239153fcb2f',
        src: 'https://v.calameo.com/?bkcode=000247364f239153fcb2f&langid=fr&page=1&clickto=embed&clicktarget=_blank',
        url: 'https://www.calameo.com/books/000247364f239153fcb2f?langid=fr',
        width: 240,
        height: 147,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the viewer query', async () => {
      const value = '<iframe src="https://evil.test/?bkcode=0077756511c9c6e552299"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the reader route to the generic placeholder', async () => {
      const value = '<iframe src="https://www.calameo.com/read/0077756511c9c6e552299"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should take the code and its options from the url over disagreeing flashvars', async () => {
      const value = html`
        <object
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          width="240"
          height="147"
        >
          <embed
            src="http://v.calameo.com/2.1/cmini.swf?bkcode=0077756511c9c6e552299&amp;langid=es"
            flashvars="bkcode=1234567890abcdef12345&amp;langid=fr&amp;authid=Xy12AbCdEfGh"
            width="240"
            height="147"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'calameo',
        id: '0077756511c9c6e552299',
        src: 'https://v.calameo.com/?bkcode=0077756511c9c6e552299&langid=es',
        url: 'https://www.calameo.com/books/0077756511c9c6e552299?langid=es',
        width: 240,
        height: 147,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// Only the whole run proves the Flash object reaches this resolver ahead of every other reader
// of an object.
describeForEachParser('calameoEmbedResolver through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the Flash viewer into a placeholder onto the live viewer', async () => {
    const value = html`
      <p>Book below.</p>
      <object
        id="calameo-viewer-0077756511c9c6e552299-1332666616"
        width="100%"
        height="500"
        data="http://v.calameo.com/2.3/cviewer.swf?bkcode=0077756511c9c6e552299&amp;langid=pt"
        type="application/x-shockwave-flash"
      >
        <param
          name="wmode"
          value="transparent"
        />
      </object>
    `
    const expected = html`
      <p>Book below.</p>
      <div
        data-embed-provider="calameo"
        data-embed-id="0077756511c9c6e552299"
        data-embed-src="https://v.calameo.com/?bkcode=0077756511c9c6e552299&amp;langid=pt"
        data-embed-url="https://www.calameo.com/books/0077756511c9c6e552299?langid=pt"
        data-embed-height="500"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a private publication playing from a protocol-relative viewer iframe', async () => {
    const value = html`
      <iframe
        src="//v.calameo.com/?bkcode=002574221fb7a74a40f7a&amp;authid=WdhyTr98dSUk"
        width="300"
        height="194"
        frameborder="0"
        scrolling="no"
        allowtransparency=""
        allowfullscreen=""
        style="margin:0 auto;"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="calameo"
        data-embed-id="002574221fb7a74a40f7a"
        data-embed-src="https://v.calameo.com/?bkcode=002574221fb7a74a40f7a&amp;authid=WdhyTr98dSUk"
        data-embed-width="300"
        data-embed-height="194"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
