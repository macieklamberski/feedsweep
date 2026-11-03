import { describe, expect, it } from 'bun:test'
import { parseHtml } from '../../parsers/linkedom.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { linkifyUrls } from './linkifyUrls.js'

describeForEachParser('linkifyUrls', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [linkifyUrls(context)])
  }

  it('should link bare https URL', async () => {
    const value = '<p>Visit https://example.com for more</p>'
    const expected = '<p>Visit <a href="https://example.com">https://example.com</a> for more</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should link bare http URL', async () => {
    const value = '<p>Visit http://example.com for more</p>'
    const expected = html`
      <p>Visit <a href="http://example.com">http://example.com</a> for more</p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should repair a bare url before the cleaner and show the repaired one', async () => {
    const value = '<p>See https://example.com/album/title&source=gmail now</p>'
    const context = {
      ...baseContext,
      cleanUrlFn: (url: string) => url,
    }
    const expected = html`
      <p>See
        <a href="https://example.com/album/title?source=gmail">https://example.com/album/title?source=gmail</a>
        now</p>
    `

    expect(await transform(value, context)).toEqualHtml(expected)
  })

  it('should link URL with path and query', async () => {
    const value = '<p>See https://example.com/path?key=value&other=1#hash for details</p>'
    const expected = html`
      <p>See
        <a
          href="https://example.com/path?key=value&other=1#hash"
        >https://example.com/path?key=value&amp;other=1#hash</a>
        for details</p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should link multiple URLs in one paragraph', async () => {
    const value = '<p>See https://example.com and https://example.org</p>'
    const expected = html`
      <p>See <a href="https://example.com">https://example.com</a>
        and <a href="https://example.org">https://example.org</a>
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should link URLs across multiple paragraphs', async () => {
    const value = html`
      <p>See https://example.com</p>
      <p>And https://example.org</p>
    `
    const expected = html`
      <p>See <a href="https://example.com">https://example.com</a>
      </p>
      <p>And <a href="https://example.org">https://example.org</a>
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should link bare URL while preserving existing links', async () => {
    const value = '<p><a href="https://example.com">linked</a> and https://example.org</p>'
    const expected = html`
      <p>
        <a href="https://example.com">linked</a>
        and <a href="https://example.org">https://example.org</a>
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should preserve surrounding text when linkifying', async () => {
    const value = '<p>before https://example.com after</p>'
    const expected = '<p>before <a href="https://example.com">https://example.com</a> after</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should link URL in deeply nested content', async () => {
    const value = '<div><section><p><em>See https://example.com here</em></p></section></div>'
    const expected = html`
      <div>
        <section>
          <p>
            <em>See <a href="https://example.com">https://example.com</a> here</em>
          </p>
        </section>
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should handle URL at start of text node', async () => {
    const value = '<p>https://example.com is a URL</p>'
    const expected = '<p><a href="https://example.com">https://example.com</a> is a URL</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should handle URL at end of text node', async () => {
    const value = '<p>Visit https://example.com</p>'
    const expected = '<p>Visit <a href="https://example.com">https://example.com</a></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should not double-link already linked URL', async () => {
    const value = '<p><a href="https://example.com">https://example.com</a></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not link protocol-less URL', async () => {
    const value = '<p>Visit example.com for more</p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not link protocol-less URL beside a linked one', async () => {
    const value = '<p>Visit example.com or https://example.org</p>'
    const expected = html`
      <p>Visit example.com or <a href="https://example.org">https://example.org</a></p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should not link ftp URL', async () => {
    const value = '<p>Mirror at ftp://example.com/file.zip</p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not link email address', async () => {
    const value = '<p>Contact user@example.com</p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  const unlinkableTags: Array<string> = [
    'pre',
    'code',
    'kbd',
    'samp',
    'var',
    'noembed',
    'noframes',
    'noscript',
    'script',
    'textarea',
    'title',
    'xmp',
  ]

  it.each(unlinkableTags)('should not link URL inside %s tag', async (tag) => {
    const value = `<${tag}>https://example.com</${tag}>`

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not link URL inside style tag', async () => {
    // Valid CSS (a comment) so jsdom's stylesheet parser stays quiet.
    const value = '<style>/*\nhttps://example.com\n*/</style>'

    expect(await transform(value)).toEqualHtml(value)
  })

  // jsdom keeps an iframe's content as one text node holding the markup, so a link here would
  // nest an anchor inside the href of the one already written.
  it('should not link URL inside an iframe fallback', async () => {
    const value = html`
      <iframe src="https://example.com/player">Listen to <a href="https://example.com/track/1">a track</a></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not link URL inside nested code within pre', async () => {
    const value = '<pre><code>const url = "https://example.com"</code></pre>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not modify html with no URLs', async () => {
    const value = '<p>No links here</p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should handle whitespace-only text nodes', async () => {
    const value = '<p>   </p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should handle empty content', async () => {
    const value = ''

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should end a url at the closer of a bbcode url tag', async () => {
    const value = html`
      <p>Please [url=https://example.com/channel/UCOmwH7xVAhD-OOAqFWyTYTA?sub_confirmation=1]subscribe[/url]</p>
    `
    const expected = html`
      <p>Please [url=<a
        href="https://example.com/channel/UCOmwH7xVAhD-OOAqFWyTYTA?sub_confirmation=1"
      >https://example.com/channel/UCOmwH7xVAhD-OOAqFWyTYTA?sub_confirmation=1</a>]subscribe[/url]</p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should end a url at the closer of a markdown link text', async () => {
    const value = '<p>From [https://example.com/releases](https://example.com/releases)</p>'
    const expected = html`
      <p>From [<a href="https://example.com/releases">https://example.com/releases</a>](<a
        href="https://example.com/releases"
      >https://example.com/releases</a>)</p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should end a url at the closer of a bracketed url glued to a word', async () => {
    const value = '<p>on Instagram [https://example.com/shambonez/?hl=en]and</p>'
    const expected = html`
      <p>on Instagram [<a
        href="https://example.com/shambonez/?hl=en"
      >https://example.com/shambonez/?hl=en</a>]and</p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a bracket pair opened inside the url', async () => {
    const value = html`
      <p>2019: https://example.com/pressemitteilung?tx_ttnews[tt_news]=37983&cHash=91bc3a6dc5c6b9304555ab08df7da545</p>
    `
    const expected = html`
      <p>2019: <a
        href="https://example.com/pressemitteilung?tx_ttnews[tt_news]=37983&amp;cHash=91bc3a6dc5c6b9304555ab08df7da545"
      >https://example.com/pressemitteilung?tx_ttnews[tt_news]=37983&amp;cHash=91bc3a6dc5c6b9304555ab08df7da545</a></p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a bracket no earlier bracket opens', async () => {
    const value = '<p>See https://example.com/groups/?__tn__=-]K-R now</p>'
    const expected = html`
      <p>See <a href="https://example.com/groups/?__tn__=-]K-R">https://example.com/groups/?__tn__=-]K-R</a> now</p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should scan a long run of bracketed urls in linear time', async () => {
    const value = `<p>${'[https://example.com/a]b '.repeat(16000)}</p>`
    const start = performance.now()

    await transform(value)

    expect(performance.now() - start).toBeLessThan(1000)
  })

  it('should scan a long run of closers in linear time', async () => {
    const value = `<p>https://example.com/a ${']'.repeat(200000)}</p>`
    const start = performance.now()

    await transform(value)

    expect(performance.now() - start).toBeLessThan(1000)
  })

  describe('cleanUrlFn', () => {
    const withCleanUrlFn: TransformContext = {
      ...baseContext,
      cleanUrlFn: (url) => url.split('?')[0] ?? url,
    }

    it('should clean both the href and the link text of a linkified url', async () => {
      const value = '<p>See https://example.com/post?utm_source=feed for more</p>'
      const expected = html`
        <p>See <a href="https://example.com/post">https://example.com/post</a> for more</p>
      `

      expect(await transform(value, withCleanUrlFn)).toEqualHtml(expected)
    })

    it('should keep the url as written when cleaning changes nothing', async () => {
      const value = '<p>See https://example.com/post for more</p>'
      const expected = html`
        <p>See <a href="https://example.com/post">https://example.com/post</a> for more</p>
      `

      expect(await transform(value, withCleanUrlFn)).toEqualHtml(expected)
    })
  })

  it('should be idempotent', async () => {
    const value = '<p>Visit https://example.com for more</p>'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

// linkedom only: jsdom's serializer is itself superlinear in nesting depth, so it
// can't round-trip a document this deep regardless of the transform.
describe('linkifyUrls with deep nesting', () => {
  it('should not overflow the stack on a deeply nested document', async () => {
    const value = `${'<div>'.repeat(40000)}visit https://example.com${'</div>'.repeat(40000)}`
    const result = await applyDomTransforms(parseHtml(value), [linkifyUrls(baseContext)])

    expect(result).toContain('<a href="https://example.com">')
  })
})
