import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { unwrapDrupalOembedIframes } from './unwrapDrupalOembedIframes.js'

describeForEachParser('unwrapDrupalOembedIframes', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [unwrapDrupalOembedIframes(baseContext)])
  }

  it('should point the iframe at the page url the route wraps', async () => {
    const value = html`
      <iframe
        width="800"
        height="450"
        class="media-oembed-content"
        loading="eager"
        title="Best of the show"
        src="https://www.example.com/media/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D2dEj10uaqAs%26pp%3DygUebWluZHk&amp;max_width=0&amp;max_height=0&amp;hash=sy5_ZDQX3OKGpwRbTfis9dI444vDFvAHyhc7Lyzsy_Q"
      ></iframe>
    `
    const expected = html`
      <iframe
        width="800"
        height="450"
        class="media-oembed-content"
        loading="eager"
        title="Best of the show"
        src="https://www.youtube.com/watch?v=2dEj10uaqAs&amp;pp=ygUebWluZHk"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep an unencoded query inside the page url', async () => {
    const value = html`
      <iframe src="https://www.example.com/media/oembed?url=https://www.youtube.com/watch?v=2dEj10uaqAs&amp;hash=abc"></iframe>
    `
    const expected = html`
      <iframe src="https://www.youtube.com/watch?v=2dEj10uaqAs"></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a route whose url parameter is not url-shaped', async () => {
    const value = html`
      <iframe src="https://www.example.com/media/oembed?url=just some words&amp;hash=abc"></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  // A scheme is not tested here, because `neutralizeUnsafeUrls` is what refuses one and it runs
  // over every url in the document rather than this one attribute. The pipeline case below shows
  // where a dangerous scheme actually lands.
  it('should point the iframe at a protocol-relative page url', async () => {
    const value = html`
      <iframe src="https://www.example.com/media/oembed?url=%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D2dEj10uaqAs&amp;hash=abc"></iframe>
    `
    const expected = html`
      <iframe src="//www.youtube.com/watch?v=2dEj10uaqAs"></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should point the iframe at a site-relative page url', async () => {
    const value = html`
      <iframe src="https://www.example.com/media/oembed?url=%2Fnode%2F12&amp;hash=abc"></iframe>
    `
    const expected = html`
      <iframe src="/node/12"></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a route naming no url', async () => {
    const value = html`
      <iframe src="https://www.example.com/media/oembed?max_width=0&amp;hash=abc"></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave an iframe on another path carrying a url parameter', async () => {
    const value = html`
      <iframe src="https://www.example.com/player?url=https%3A//www.youtube.com/watch%3Fv%3D2dEj10uaqAs"></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should point a lazy iframe at the page url its data-src route wraps', async () => {
    const value = html`
      <iframe
        width="800"
        height="450"
        class="media-oembed-content optanon-category-C0004"
        loading="eager"
        title="Trigger Point Series 2 | Coming soon | ITV"
        data-src="https://www.example.com/media/oembed?url=https%3A//www.youtube.com/watch%3Fv%3DfKXGDRnkljI%26pp%3DygUWdHJpZ2dlciBwb2ludCBzZXJpZXMgMg%253D%253D&amp;max_width=0&amp;max_height=0&amp;hash=1SGMUJoPM5uf4jNDdqa4A1Hljmhe0uqi-pj41irQ_6Y"
      ></iframe>
    `
    const expected = html`
      <iframe
        width="800"
        height="450"
        class="media-oembed-content optanon-category-C0004"
        loading="eager"
        title="Trigger Point Series 2 | Coming soon | ITV"
        data-src="https://www.example.com/media/oembed?url=https%3A//www.youtube.com/watch%3Fv%3DfKXGDRnkljI%26pp%3DygUWdHJpZ2dlciBwb2ludCBzZXJpZXMgMg%253D%253D&amp;max_width=0&amp;max_height=0&amp;hash=1SGMUJoPM5uf4jNDdqa4A1Hljmhe0uqi-pj41irQ_6Y"
        src="https://www.youtube.com/watch?v=fKXGDRnkljI&amp;pp=ygUWdHJpZ2dlciBwb2ludCBzZXJpZXMgMg%3D%3D"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should point a cookie-gated iframe at the page url its data-cookieblock-src route wraps', async () => {
    const value = html`
      <iframe
        width="560"
        height="315"
        class="media-oembed-content"
        loading="lazy"
        title="jy030 27403 20270336 JY030 UBCTIRG Video V1"
        data-cookieblock-src="https://www.example.com/media/oembed?url=https%3A//www.youtube.com/watch%3Fv%3Do8ZG_rBzwL4&amp;max_width=560&amp;max_height=316&amp;hash=cqu9Tsa-j_I25KS2TyGzQa6efE__pSdi3kRjJg6YZUo"
        data-cookieconsent="marketing"
      ></iframe>
    `
    const expected = html`
      <iframe
        width="560"
        height="315"
        class="media-oembed-content"
        loading="lazy"
        title="jy030 27403 20270336 JY030 UBCTIRG Video V1"
        data-cookieblock-src="https://www.example.com/media/oembed?url=https%3A//www.youtube.com/watch%3Fv%3Do8ZG_rBzwL4&amp;max_width=560&amp;max_height=316&amp;hash=cqu9Tsa-j_I25KS2TyGzQa6efE__pSdi3kRjJg6YZUo"
        data-cookieconsent="marketing"
        src="https://www.youtube.com/watch?v=o8ZG_rBzwL4"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a lazy iframe whose data-src is not the oEmbed route', async () => {
    const value = html`
      <iframe data-src="https://www.example.com/player?url=https%3A//www.youtube.com/watch%3Fv%3D2dEj10uaqAs"></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = html`
      <iframe src="https://www.example.com/media/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D2dEj10uaqAs&amp;hash=abc"></iframe>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

// The unwrapped url is a watch page, which only the provider resolver turns into a player, so
// the pipeline is what shows the frame ending up as a YouTube placeholder with its poster.
describeForEachParser('unwrapDrupalOembedIframes through the pipeline', (parseHtml) => {
  it('should let the provider claim the wrapped page', async () => {
    const value = html`
      <iframe
        width="800"
        height="450"
        class="media-oembed-content"
        src="https://www.example.com/media/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D2dEj10uaqAs&amp;max_width=0&amp;max_height=0&amp;hash=sy5_ZDQX3OKGpwRbTfis9dI444vDFvAHyhc7Lyzsy_Q"
      ></iframe>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/2dEj10uaqAs"
        data-embed-provider="youtube"
        data-embed-id="2dEj10uaqAs"
        data-embed-url="https://www.youtube.com/watch?v=2dEj10uaqAs"
        data-embed-thumbnail="https://i.ytimg.com/vi/2dEj10uaqAs/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(result).toEqualHtml(expected)
  })

  it('should let the provider claim the page a lazy route wraps', async () => {
    const value = html`
      <iframe
        width="800"
        height="450"
        class="media-oembed-content optanon-category-C0004"
        loading="eager"
        title="Trigger Point Series 2 | Coming soon | ITV"
        data-src="https://www.example.com/media/oembed?url=https%3A//www.youtube.com/watch%3Fv%3DfKXGDRnkljI%26pp%3DygUWdHJpZ2dlciBwb2ludCBzZXJpZXMgMg%253D%253D&amp;max_width=0&amp;max_height=0&amp;hash=1SGMUJoPM5uf4jNDdqa4A1Hljmhe0uqi-pj41irQ_6Y"
      ></iframe>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/fKXGDRnkljI"
        data-embed-provider="youtube"
        data-embed-id="fKXGDRnkljI"
        data-embed-url="https://www.youtube.com/watch?v=fKXGDRnkljI"
        data-embed-thumbnail="https://i.ytimg.com/vi/fKXGDRnkljI/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-title="Trigger Point Series 2 | Coming soon | ITV"
      ></div>
    `

    expect(result).toEqualHtml(expected)
  })

  // The scheme guard this transform used to carry is the pipeline's job, and doing it here would
  // have refused the two relative shapes above as well.
  it('should leave a dangerous scheme to the pipeline, which neutralises it', async () => {
    const value = html`
      <iframe src="https://www.example.com/media/oembed?url=javascript%3Aalert(1)&amp;hash=abc"></iframe>
    `
    const expected = html`<iframe src="about:blank"></iframe>`

    expect(
      await transformContent(value, {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com/post',
      }),
    ).toEqualHtml(expected)
  })
})
