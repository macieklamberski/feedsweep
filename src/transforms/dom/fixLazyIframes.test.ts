import { expect, it } from 'bun:test'
import { defaultLazyIframeAttributes } from '../../defaults.js'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { fixLazyIframes } from './fixLazyIframes.js'

describeForEachParser('fixLazyIframes', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [fixLazyIframes(context)])
  }

  // Iterates the real default list, so every entry is exercised and a new entry
  // is covered automatically.
  it.each(defaultLazyIframeAttributes)('should promote %s into src', async (attribute) => {
    const value = `<iframe src="" ${attribute}="https://example.com/embed/x"></iframe>`
    const expected = `<iframe src="https://example.com/embed/x" ${attribute}="https://example.com/embed/x"></iframe>`

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should promote a lazy attribute into an iframe with no src', async () => {
    const value = '<iframe id="_ytid_27860" data-orig="https://www.youtube.com/embed/x"></iframe>'
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/x"
        id="_ytid_27860"
        data-orig="https://www.youtube.com/embed/x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // Real Cookie Banner parks the plain URL and an autoplay=1 variant on the same iframe. The
  // list order makes the plain one win even when the click variant comes first in the markup.
  it('should prefer the non-autoplay URL when both consent attributes are parked', async () => {
    const value = html`
      <iframe
        consent-click-original-src-_="https://www.youtube.com/embed/x?feature=oembed&autoplay=1"
        consent-original-src-_="https://www.youtube.com/embed/x?feature=oembed"
        width="750"
        height="422"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/x?feature=oembed"
        consent-click-original-src-_="https://www.youtube.com/embed/x?feature=oembed&autoplay=1"
        consent-original-src-_="https://www.youtube.com/embed/x?feature=oembed"
        width="750"
        height="422"
        allowfullscreen
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should promote over the Invision interface placeholder src', async () => {
    const value = html`
      <iframe
        src="https://forum.example.com/applications/core/interface/index.html"
        data-embed-src="https://www.youtube.com/embed/x?feature=oembed"
      ></iframe>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/x?feature=oembed"
        data-embed-src="https://www.youtube.com/embed/x?feature=oembed"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should promote over the Invision spacer image src', async () => {
    const value = html`
      <iframe
        width="480"
        height="270"
        src="https://forum.example.com/applications/core/interface/js/spacer.png"
        data-embed-src="https://www.youtube.com/embed/x?feature=oembed"
      ></iframe>
    `
    const expected = html`
      <iframe
        width="480"
        height="270"
        src="https://www.youtube.com/embed/x?feature=oembed"
        data-embed-src="https://www.youtube.com/embed/x?feature=oembed"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should promote over the Complianz placeholder video src', async () => {
    const value = html`
      <iframe
        src="https://site.example/wp-content/plugins/complianz-gdpr/assets/video/youtube-placeholder.mp4?cmplz=1"
        data-src-cmplz="https://www.youtube.com/embed/x?feature=oembed"
      ></iframe>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/x?feature=oembed"
        data-src-cmplz="https://www.youtube.com/embed/x?feature=oembed"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should promote over a bLazy transparent gif src', async () => {
    const value = html`
      <iframe
        class="b-lazy"
        data-src="https://www.youtube-nocookie.com/embed/x"
        src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      ></iframe>
    `
    const expected = html`
      <iframe
        class="b-lazy"
        data-src="https://www.youtube-nocookie.com/embed/x"
        src="https://www.youtube-nocookie.com/embed/x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a data src that holds the document itself', async () => {
    const value = html`
      <iframe
        src="data:text/html,%3Cp%3EHello%3C%2Fp%3E"
        data-src="https://example.com/embed/x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not overwrite a src that only mentions a data image', async () => {
    const value = html`
      <iframe
        src="https://example.com/embed?poster=data:image/gif;base64,R0lGOD"
        data-src="https://example.com/embed/x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should promote over the consentmanager blank src', async () => {
    const value = html`
      <iframe
        class="cmplazyload"
        src="blank"
        data-cmp-src="https://www.youtube-nocookie.com/embed/x"
      ></iframe>
    `
    const expected = html`
      <iframe
        class="cmplazyload"
        src="https://www.youtube-nocookie.com/embed/x"
        data-cmp-src="https://www.youtube-nocookie.com/embed/x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should promote over a blank src resolved against the page', async () => {
    const value = html`
      <iframe
        class="cmplazyload"
        src="https://example.com/post/blank"
        data-cmp-src="https://www.youtube-nocookie.com/embed/x"
      ></iframe>
    `
    const expected = html`
      <iframe
        class="cmplazyload"
        src="https://www.youtube-nocookie.com/embed/x"
        data-cmp-src="https://www.youtube-nocookie.com/embed/x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should promote over an about:blank src resolved against the page', async () => {
    const value = html`
      <iframe
        src="https://example.com/media/1421321/about:blank"
        data-rocket-lazyload="fitvidscompatible"
        data-lazy-src="https://player.glomex.com/integration/1/iframe-player.html?integrationId=x"
      ></iframe>
    `
    const expected = html`
      <iframe
        src="https://player.glomex.com/integration/1/iframe-player.html?integrationId=x"
        data-rocket-lazyload="fitvidscompatible"
        data-lazy-src="https://player.glomex.com/integration/1/iframe-player.html?integrationId=x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should not overwrite a src whose last segment only ends in blank', async () => {
    const value = html`
      <iframe
        src="https://example.com/forms/notblank"
        data-src="https://example.com/embed/x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not overwrite a src with a segment after blank', async () => {
    const value = html`
      <iframe
        src="https://example.com/forms/blank/embed"
        data-src="https://example.com/embed/x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  // The parked url never went through resolveRelativeUrls, so it is resolved here instead.
  it('should give a protocol-relative parked url its scheme', async () => {
    const value = html`
      <iframe
        class="cmplz-placeholder-element cmplz-iframe cmplz-video cmplz-hidden"
        data-src-cmplz="//player.vimeo.com/video/41629603"
        src="about:blank"
        width="1280"
        height="720"
      ></iframe>
    `
    const expected = html`
      <iframe
        class="cmplz-placeholder-element cmplz-iframe cmplz-video cmplz-hidden"
        data-src-cmplz="//player.vimeo.com/video/41629603"
        src="https://player.vimeo.com/video/41629603"
        width="1280"
        height="720"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should resolve a feed-relative parked url against the base', async () => {
    const value = '<iframe src="about:blank" data-src="/embed/x"></iframe>'
    const context: TransformContext = { ...baseContext, baseUrl: 'https://example.com/post' }
    const expected = html`
      <iframe
        src="https://example.com/embed/x"
        data-src="/embed/x"
      ></iframe>
    `

    expect(await transform(value, context)).toEqualHtml(expected)
  })

  it('should promote a relative parked url as written when there is no base', async () => {
    const value = '<iframe src="about:blank" data-src="/embed/x"></iframe>'
    const expected = html`
      <iframe
        src="/embed/x"
        data-src="/embed/x"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave the Invision placeholder src when nothing is parked', async () => {
    const value = html`
      <iframe src="https://forum.example.com/applications/core/interface/index.html"></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not overwrite a usable src', async () => {
    const value = html`
      <iframe src="https://example.com/real" data-src="https://example.com/lazy"></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave an empty iframe with no recoverable attribute', async () => {
    const value = '<iframe src="about:blank"></iframe>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should ignore flag-style values that are not URL-shaped', async () => {
    const value = '<iframe src="about:blank" data-src="loaded"></iframe>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = '<iframe src="about:blank" data-src="https://example.com/embed/x"></iframe>'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

// The parked url only reaches a provider's resolver once it carries a host, which is what the
// pipeline proves: the same Complianz carrier used to end as a provider-less placeholder.
describeForEachParser('fixLazyIframes through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should let the provider claim a protocol-relative parked url', async () => {
    const value = html`
      <iframe
        class="cmplz-placeholder-element cmplz-iframe cmplz-video cmplz-hidden"
        data-src-cmplz="//player.vimeo.com/video/41629603"
        src="about:blank"
        width="1280"
        height="720"
      ></iframe>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
    const expected = html`
      <div
        data-embed-src="https://player.vimeo.com/video/41629603"
        data-embed-provider="vimeo"
        data-embed-id="41629603"
        data-embed-ratio="16/9"
        data-embed-url="https://vimeo.com/41629603"
      ></div>
    `

    expect(result).toEqualHtml(expected)
  })

  it('should resolve a bLazy iframe whose src is a transparent gif', async () => {
    const value = html`
      <iframe
        title="YouTube video player"
        frameborder="0"
        allowfullscreen
        class="b-lazy"
        data-src="https://www.youtube-nocookie.com/embed/HdcLyhNo3C4?si=PWRSXjFiFN9e6p8T&amp;controls=0"
        src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/HdcLyhNo3C4"
        data-embed-provider="youtube"
        data-embed-id="HdcLyhNo3C4"
        data-embed-thumbnail="https://i.ytimg.com/vi/HdcLyhNo3C4/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=HdcLyhNo3C4"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a consentmanager iframe whose src is blank', async () => {
    const value = html`
      <iframe
        loading="lazy"
        class="cmplazyload"
        height="320"
        src="blank"
        width="660"
        data-cmp-src="https://www.youtube-nocookie.com/embed/xBgWac94O2o"
        data-cmp-vendor="s30"
        data-cmp-purpose="c8"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/xBgWac94O2o"
        data-embed-provider="youtube"
        data-embed-id="xBgWac94O2o"
        data-embed-thumbnail="https://i.ytimg.com/vi/xBgWac94O2o/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=xBgWac94O2o"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a consentmanager iframe with no src', async () => {
    const value = html`
      <iframe
        type="text/plain"
        class="cmplazyload"
        data-cmp-vendor="s30"
        data-cmp-purpose="c52"
        data-cmp-type="text/plain"
        data-cmp-src="https://www.youtube.com/embed/9UuJRhTiM-s?feature=oembed"
        frameborder="0"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/9UuJRhTiM-s"
        data-embed-provider="youtube"
        data-embed-id="9UuJRhTiM-s"
        data-embed-thumbnail="https://i.ytimg.com/vi/9UuJRhTiM-s/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=9UuJRhTiM-s"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a FAZ Cookie Manager iframe', async () => {
    const value = html`
      <iframe
        class="faz-hidden"
        data-faz-category="marketing"
        title="Autenticazione a Due Fattori WordPress"
        data-faz-src="https://www.youtube.com/embed/4h5tSoljuGk?feature=oembed"
        frameborder="0"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-title="Autenticazione a Due Fattori WordPress"
        data-embed-src="https://www.youtube.com/embed/4h5tSoljuGk"
        data-embed-provider="youtube"
        data-embed-id="4h5tSoljuGk"
        data-embed-thumbnail="https://i.ytimg.com/vi/4h5tSoljuGk/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=4h5tSoljuGk"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a Themify lazy iframe', async () => {
    const value = html`
      <iframe
        loading="lazy"
        data-lazy="1"
        src="about:blank"
        class="tf_iframe_lazy"
        title="Korg multi/poly"
        data-tf-src="https://www.youtube.com/embed/KD-P3OVJ4eg?feature=oembed"
        frameborder="0"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-title="Korg multi/poly"
        data-embed-src="https://www.youtube.com/embed/KD-P3OVJ4eg"
        data-embed-provider="youtube"
        data-embed-id="KD-P3OVJ4eg"
        data-embed-thumbnail="https://i.ytimg.com/vi/KD-P3OVJ4eg/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=KD-P3OVJ4eg"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a ThemeREX lazy iframe', async () => {
    const value = html`
      <iframe
        title="Miss Keti Koti 2026"
        data-trx-lazyload-src="https://www.youtube.com/embed/PWjULSzhwtA?feature=oembed"
        frameborder="0"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-title="Miss Keti Koti 2026"
        data-embed-src="https://www.youtube.com/embed/PWjULSzhwtA"
        data-embed-provider="youtube"
        data-embed-id="PWjULSzhwtA"
        data-embed-thumbnail="https://i.ytimg.com/vi/PWjULSzhwtA/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=PWjULSzhwtA"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a data-src1 lazy iframe', async () => {
    const value = html`
      <iframe
        data-src1="https://www.youtube.com/embed/LKM0TztQ_gI?si=ZbVGTZO2BAib7t0Q"
        title=""
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/LKM0TztQ_gI"
        data-embed-provider="youtube"
        data-embed-id="LKM0TztQ_gI"
        data-embed-thumbnail="https://i.ytimg.com/vi/LKM0TztQ_gI/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=LKM0TztQ_gI"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a WP Video Popup iframe', async () => {
    const value = html`
      <iframe
        class="wp-video-popup-video is-hosted is-landscape is-resizable"
        src=""
        data-wp-video-popup-url="https://www.youtube.com/embed/j7OAm_J4ve0?autoplay=1&amp;modestbranding=1"
        frameborder="0"
        allowfullscreen
        allow="autoplay"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/j7OAm_J4ve0"
        data-embed-provider="youtube"
        data-embed-id="j7OAm_J4ve0"
        data-embed-thumbnail="https://i.ytimg.com/vi/j7OAm_J4ve0/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=j7OAm_J4ve0"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a WP Rocket iframe whose about:blank src was resolved against the page', async () => {
    const value = html`
      <iframe
        loading="lazy"
        src="https://example.com/media/1421321/about:blank"
        frameborder="0"
        allowfullscreen="allowfullscreen"
        data-rocket-lazyload="fitvidscompatible"
        data-lazy-src="https://player.glomex.com/integration/1/iframe-player.html?integrationId=40599x1hkcenoro7&amp;playlistId=v-ctkuga3iqbyh"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://player.glomex.com/integration/1/integration.html?integrationId=40599x1hkcenoro7&playlistId=v-ctkuga3iqbyh"
        data-embed-provider="glomex"
        data-embed-id="40599x1hkcenoro7/v-ctkuga3iqbyh"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
