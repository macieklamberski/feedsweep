import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildEmbedPrivacyLinks } from './rebuildEmbedPrivacyLinks.js'

describeForEachParser('rebuildEmbedPrivacyLinks', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildEmbedPrivacyLinks(baseContext)])
  }

  describe('happy paths', () => {
    it('should turn a link onto a video into its frame inside the embed block', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube">
          <div class="wp-block-embed__wrapper">
            <span class="embed-privacy-url"><a href="https://www.youtube.com/watch?v=QzYozbNneVc">Eingebetteten Inhalt von YouTube öffnen</a></span>
          </div>
        </figure>
      `
      const expected = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube">
          <div class="wp-block-embed__wrapper">
            <iframe src="https://www.youtube.com/watch?v=QzYozbNneVc"></iframe>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should turn a link onto a post into its frame inside a paragraph', async () => {
      const value = html`
        <p>
          <span class="embed-privacy-url"><a href="https://twitter.com/WCEurope/status/2063297554855399562">Eingebetteten Inhalt von X öffnen</a></span>
        </p>
      `
      const expected = html`
        <p>
          <iframe src="https://twitter.com/WCEurope/status/2063297554855399562"></iframe>
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a link onto a url no resolver claims', async () => {
      const value = html`
        <p>
          <span class="embed-privacy-url"><a href="https://example.com/2020/11/09/a-talk/">Open embedded content from example.com</a></span>
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a link with an empty href', async () => {
      const value = html`
        <p>
          <span class="embed-privacy-url"><a href="">Open embedded content from Bluesky</a></span>
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave the same link outside the plugin wrapper', async () => {
      const value = html`
        <p>
          <span><a href="https://www.youtube.com/watch?v=QzYozbNneVc">Open embedded content from YouTube</a></span>
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = html`
        <p>
          <span class="embed-privacy-url"><a href="https://www.youtube.com/watch?v=QzYozbNneVc">Open embedded content from YouTube</a></span>
        </p>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('Embed Privacy links the pipeline rebuilds', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should bring an embed block back as the YouTube placeholder', async () => {
    const value = html`
      <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
        <div class="wp-block-embed__wrapper">
          <span class="embed-privacy-url"><a href="https://www.youtube.com/watch?v=QzYozbNneVc">Eingebetteten Inhalt von YouTube öffnen</a></span>
        </div>
      </figure>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-thumbnail="https://i.ytimg.com/vi/QzYozbNneVc/hqdefault.jpg"
        data-embed-url="https://www.youtube.com/watch?v=QzYozbNneVc"
        data-embed-id="QzYozbNneVc"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/QzYozbNneVc"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // Resolvers read a url resolved, so the rebuild runs after the relative urls are.
  it('should bring a protocol-relative link back as the YouTube placeholder', async () => {
    const value = html`
      <p><center><span class="embed-privacy-url"><a href="//www.youtube.com/embed/FL3184o-TgQ">Eingebetteten Inhalt von YouTube öffnen</a></span></center></p>
    `
    const expected = html`
      <center><div
        data-embed-ratio="16/9"
        data-embed-thumbnail="https://i.ytimg.com/vi/FL3184o-TgQ/hqdefault.jpg"
        data-embed-url="https://www.youtube.com/watch?v=FL3184o-TgQ"
        data-embed-id="FL3184o-TgQ"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/FL3184o-TgQ"
      ></div></center>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
