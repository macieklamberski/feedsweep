import { describe, expect, it } from 'bun:test'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type {
  CiteResolverResult,
  EmbedResolverResult,
  IsSafeUrlFn,
  TransformContext,
} from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import {
  createCitePlaceholder,
  createEmbedPlaceholder,
  normalizeCiteFields,
  normalizeEmbedFields,
  prepareCiteMetadata,
  prepareEmbedMetadata,
} from '../../utils/widgets.js'
import { neutralizeUnsafeUrls } from './neutralizeUnsafeUrls.js'

describeForEachParser('neutralizeUnsafeUrls', (parseHtml) => {
  const blockHost = (host: string): IsSafeUrlFn => {
    return (url) => {
      return !url.includes(host)
    }
  }

  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [neutralizeUnsafeUrls(context)])
  }

  describe('dangerous-scheme floor (no isSafeUrlFn)', () => {
    it('should neutralize a javascript: link to the link sentinel', async () => {
      const value = '<a href="javascript:alert(1)">x</a>'
      const expected = '<a href="#unsafe-link">x</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a vbscript: link', async () => {
      const value = '<a href="vbscript:msgbox(1)">x</a>'
      const expected = '<a href="#unsafe-link">x</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a data:text/html link', async () => {
      const value = '<a href="data:text/html,hello">x</a>'
      const expected = '<a href="#unsafe-link">x</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: image map area to the link sentinel', async () => {
      const value = '<map name="m"><area href="javascript:alert(1)" alt="x"></map>'
      const expected = '<map name="m"><area href="#unsafe-link" alt="x"></map>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: image to the media sentinel', async () => {
      const value = '<img src="javascript:alert(1)">'
      const expected = '<img src="about:blank">'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should see through leading whitespace and control chars in the scheme', async () => {
      const value = '<a href="  java\tscript:alert(1)">x</a>'
      const expected = '<a href="#unsafe-link">x</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should see through a leading C0 control byte', async () => {
      const value = '<a href="\x01javascript:alert(1)">x</a>'
      const expected = '<a href="#unsafe-link">x</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should match the scheme case-insensitively', async () => {
      const value = '<a href="JaVaScRiPt:alert(1)">x</a>'
      const expected = '<a href="#unsafe-link">x</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Each href's scheme as `new URL(href, 'https://a.test/').protocol` reads it in Bun.
    const hiddenSchemeHrefs: Array<[string, string]> = [
      ['a newline inside javascript:', 'java\nscript:alert(1)'],
      ['a carriage return inside javascript:', 'java\rscript:alert(1)'],
      ['a leading space before javascript:', ' javascript:alert(1)'],
      ['a tab inside uppercase JAVASCRIPT:', 'JAVA\tSCRIPT:alert(1)'],
      ['a leading control before VBScript:', '\x1fVBScript:msgbox(1)'],
      ['a newline inside vbscript:', 'vb\nscript:msgbox(1)'],
      ['a leading space before uppercase DATA:text/html', ' DATA:text/html,hello'],
      ['a tab inside data:text/html', 'da\tta:text/html,hello'],
    ]

    it.each(hiddenSchemeHrefs)('should neutralize a link with %s', async (_name, href) => {
      const value = `<a href="${href}">x</a>`
      const expected = '<a href="#unsafe-link">x</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // A browser resolves each of these as a relative path, not as a javascript: url.
    const relativeLookalikeHrefs: Array<[string, string]> = [
      ['a space inside javascript:', 'java script:x'],
      ['a no-break space inside javascript:', 'java script:x'],
      ['a leading no-break space before javascript:', ' javascript:x'],
      ['a control inside javascript:', 'java\x01script:x'],
    ]

    it.each(relativeLookalikeHrefs)('should leave a link with %s', async (_name, href) => {
      const value = `<a href="${href}">x</a>`

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a safe http link untouched', async () => {
      const value = '<a href="https://example.com/page">x</a>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave mailto, tel and fragment links untouched', async () => {
      const value = html`
        <a href="mailto:a@b.com">mail</a>
        <a href="tel:+123">call</a>
        <a href="#section">jump</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave template-shielded URLs alone, like querySelectorAll does', async () => {
      const value = '<template><a href="javascript:alert(1)">x</a></template><p>keep</p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a data:image url untouched', async () => {
      const value = '<img src="data:image/png;base64,iVBORw0KGgo=">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not neutralize data:image/svg+xml at the floor', async () => {
      const value = '<img src="data:image/svg+xml;base64,PHN2Zy8+">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should neutralize a data:image/svg+xml link', async () => {
      const value = '<a href="data:image/svg+xml;base64,PHN2Zy8+">x</a>'
      const expected = '<a href="#unsafe-link">x</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: xlink:href on an svg anchor', async () => {
      const value = '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>'
      const expected = '<svg><a xlink:href="#unsafe-link"><text>x</text></a></svg>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: href on an svg anchor', async () => {
      const value = '<svg><a href="javascript:alert(1)"><text>x</text></a></svg>'
      const expected = '<svg><a href="#unsafe-link"><text>x</text></a></svg>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: formaction', async () => {
      const value = '<button formaction="javascript:alert(1)">go</button>'
      const expected = '<button formaction="#unsafe-link">go</button>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: form action', async () => {
      const value = '<form action="javascript:alert(1)"><button>go</button></form>'
      const expected = '<form action="#unsafe-link"><button>go</button></form>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a safe form action untouched', async () => {
      const value = '<form action="https://ok.test/submit"><button>go</button></form>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should neutralize a data:text/html embed to the media sentinel', async () => {
      const value = '<embed src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">'
      const expected = '<embed src="about:blank">'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: embed src to the media sentinel', async () => {
      const value = '<embed src="javascript:alert(1)">'
      const expected = '<embed src="about:blank">'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: object data to the media sentinel', async () => {
      const value = '<object data="javascript:alert(1)"></object>'
      const expected = '<object data="about:blank"></object>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: video src to the media sentinel', async () => {
      const value = '<video src="javascript:alert(1)"></video>'
      const expected = '<video src="about:blank"></video>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: audio src to the media sentinel', async () => {
      const value = '<audio src="javascript:alert(1)"></audio>'
      const expected = '<audio src="about:blank"></audio>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: source src to the media sentinel', async () => {
      const value = '<video><source src="javascript:alert(1)"></video>'
      const expected = '<video><source src="about:blank"></video>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: track src to the media sentinel', async () => {
      const value = '<video><track src="javascript:alert(1)"></video>'
      const expected = '<video><track src="about:blank"></video>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // A scheme is dangerous only at the start: this lab url carries one inside a mangled id.
    it('should keep a url that carries a scheme word past its start', async () => {
      const value =
        '<iframe src="https://www.youtube.com/embed/mmRtQ4javascript:void(0)tHSug"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('with a caller isSafeUrlFn', () => {
    it('should neutralize a link the policy rejects', async () => {
      const context: TransformContext = { ...baseContext, isSafeUrlFn: blockHost('evil.test') }
      const value = '<a href="https://evil.test/x">x</a>'
      const expected = '<a href="#unsafe-link">x</a>'

      expect(await transform(value, context)).toEqualHtml(expected)
    })

    it('should neutralize an image the policy rejects', async () => {
      const context: TransformContext = { ...baseContext, isSafeUrlFn: blockHost('evil.test') }
      const value = '<img src="https://evil.test/p.jpg">'
      const expected = '<img src="about:blank">'

      expect(await transform(value, context)).toEqualHtml(expected)
    })

    it('should keep a url the policy allows', async () => {
      const context: TransformContext = { ...baseContext, isSafeUrlFn: blockHost('evil.test') }
      const value = '<a href="https://ok.test/x">x</a>'

      expect(await transform(value, context)).toEqualHtml(value)
    })

    it('should pass the url role to the policy', async () => {
      const seen: Array<[string, string]> = []
      const isSafeUrlFn: IsSafeUrlFn = (url, type) => {
        seen.push([url, type])
        return true
      }
      const context: TransformContext = { ...baseContext, isSafeUrlFn }
      const value = '<a href="https://a.test"></a><img src="https://b.test">'
      const expected: Array<[string, string]> = [
        ['https://a.test', 'link'],
        ['https://b.test', 'media'],
      ]
      await transform(value, context)

      expect(seen).toEqual(expected)
    })
  })

  describe('srcset', () => {
    it('should drop only the unsafe candidates', async () => {
      const context: TransformContext = { ...baseContext, isSafeUrlFn: blockHost('evil.test') }
      const value = '<img srcset="https://ok.test/a.jpg 1x, https://evil.test/b.jpg 2x">'
      const expected = '<img srcset="https://ok.test/a.jpg 1x">'

      expect(await transform(value, context)).toEqualHtml(expected)
    })

    it('should fall back to the media sentinel when every candidate is unsafe', async () => {
      const value = '<img srcset="javascript:a 1x, javascript:b 2x">'
      const expected = '<img srcset="about:blank">'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an empty srcset untouched', async () => {
      const value = '<img srcset="">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('coverage', () => {
    it('should neutralize across iframe, poster, embed data-* and cite attributes', async () => {
      const context: TransformContext = {
        ...baseContext,
        isSafeUrlFn: (url) => !url.includes('evil.test'),
      }
      const value = html`
        <iframe src="https://evil.test/e"></iframe>
        <video poster="https://evil.test/p.jpg"></video>
        <div data-embed-thumbnail="https://evil.test/t.jpg"></div>
        <div data-cite-icon="https://evil.test/i.ico"></div>
      `
      const expected = html`
        <iframe src="about:blank"></iframe>
        <video poster="about:blank"></video>
        <div data-embed-thumbnail="about:blank"></div>
        <div data-cite-icon="about:blank"></div>
      `

      expect(await transform(value, context)).toEqualHtml(expected)
    })

    it('should neutralize unsafe embed, cite and file target urls with the link sentinel', async () => {
      const value = html`
        <div data-embed-url="javascript:alert(1)"></div>
        <div data-cite-url="javascript:alert(1)"></div>
        <div data-file-url="javascript:alert(1)"></div>
      `
      const expected = html`
        <div data-embed-url="#unsafe-link"></div>
        <div data-cite-url="#unsafe-link"></div>
        <div data-file-url="#unsafe-link"></div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a safe embed target url untouched', async () => {
      const value = '<div data-embed-url="https://example.com/watch"></div>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a document with no url attributes untouched', async () => {
      const value = '<p>text</p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    // Every element is walked and its tag name looked up in the url attribute table, so a feed
    // naming a tag after a member every object inherits reaches that lookup with it. It has to answer the
    // way it answers a tag it does not know.
    it('should leave an element named after an inherited member untouched', async () => {
      const value = '<constructor href="javascript:alert(1)">text</constructor>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an element with an unknown tag name untouched', async () => {
      const value = '<sunset href="javascript:alert(1)">text</sunset>'

      expect(await transform(value)).toEqualHtml(value)
    })

    // A url field added to utils/widgets.ts and missing from urlAttributes fails the next two.
    // Every field gets a non-url marker and the resolver answers with the unsafe url, so any
    // attribute still carrying it after the pass is a url the pass never saw.
    const unsafeUrl = 'javascript:alert(1)'
    const mintContext: TransformContext = { ...baseContext, resolveUrlFn: () => unsafeUrl }

    // Stands in for a result with every field populated. The point is to fill each field the mint
    // path knows, not to be a valid result, so the declared field types are asserted away.
    const markerFields = <Type>(names: Array<string>): Type => {
      return Object.fromEntries(names.map((name) => [name, 'not-a-url'])) as Type
    }

    const unchecked = async (document: Document, placeholder: Element): Promise<Array<string>> => {
      document.body.appendChild(placeholder)
      await neutralizeUnsafeUrls(mintContext)(document)

      return placeholder
        .getAttributeNames()
        .filter((name) => placeholder.getAttribute(name) === unsafeUrl)
    }

    it('should check every url an embed placeholder can mint', async () => {
      const document = parseHtml('')
      const metadata = markerFields<EmbedResolverResult>(Object.keys(normalizeEmbedFields({})))
      const placeholder = createEmbedPlaceholder(
        document,
        prepareEmbedMetadata(metadata, mintContext) as EmbedResolverResult,
      )

      expect(await unchecked(document, placeholder)).toEqual([])
    })

    it('should check every url a cite placeholder can mint', async () => {
      const document = parseHtml('')
      const metadata = markerFields<CiteResolverResult>(Object.keys(normalizeCiteFields({})))
      const placeholder = createCitePlaceholder(
        document,
        prepareCiteMetadata(metadata, mintContext) as CiteResolverResult,
      )

      expect(await unchecked(document, placeholder)).toEqual([])
    })
  })

  describe('svg image', () => {
    it('should neutralize a javascript: href on an svg image', async () => {
      const value = '<svg><image href="javascript:alert(1)"></image></svg>'
      const expected = '<svg><image href="about:blank"></image></svg>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize a javascript: xlink:href on an svg image', async () => {
      const value = '<svg><image xlink:href="javascript:alert(1)"></image></svg>'
      const expected = '<svg><image xlink:href="about:blank"></image></svg>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should neutralize an svg image the policy rejects', async () => {
      const context: TransformContext = {
        ...baseContext,
        isSafeUrlFn: (url) => !url.includes('evil.test'),
      }
      const value = '<svg><image href="https://evil.test/a.png"></image></svg>'
      const expected = '<svg><image href="about:blank"></image></svg>'

      expect(await transform(value, context)).toEqualHtml(expected)
    })

    it('should keep a safe svg image href', async () => {
      const value = '<svg><image href="https://ok.test/a.png"></image></svg>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value = '<a href="javascript:alert(1)">x</a><img src="javascript:alert(1)">'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
