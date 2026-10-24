import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildWordpressEmbeds } from './rebuildWordpressEmbeds.js'

describeForEachParser('rebuildWordpressEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildWordpressEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild the frame from a url held as text', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-4-3 wp-has-aspect-ratio">
          <div class="wp-block-embed__wrapper">
            https://youtu.be/xfdNWD6Xrjw
          </div>
        </figure>
      `
      const expected = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-4-3 wp-has-aspect-ratio">
          <div class="wp-block-embed__wrapper">
            <iframe src="https://youtu.be/xfdNWD6Xrjw"></iframe>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the frame from a url autolinked onto itself', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
          <div class="wp-block-embed__wrapper">
            <a href="https://www.youtube.com/watch?v=KFbeFLLJbWo">https://www.youtube.com/watch?v=KFbeFLLJbWo</a>
          </div>
        </figure>
      `
      const expected = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
          <div class="wp-block-embed__wrapper">
            <iframe src="https://www.youtube.com/watch?v=KFbeFLLJbWo"></iframe>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the frame from a url between line breaks', async () => {
      const value = html`
        <figure class="wp-block-embed-youtube wp-block-embed is-type-video is-provider-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
          <div class="wp-block-embed__wrapper">
            <br />
            https://www.youtube.com/watch?v=j1D6V29cdpQ<br />
          </div>
        </figure>
      `
      const expected = html`
        <figure class="wp-block-embed-youtube wp-block-embed is-type-video is-provider-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
          <div class="wp-block-embed__wrapper">
            <iframe src="https://www.youtube.com/watch?v=j1D6V29cdpQ"></iframe>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the frame from a url whose query the feed escaped', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-rich is-provider-twitter wp-block-embed-twitter">
          <div class="wp-block-embed__wrapper">
            https://twitter.com/Toronto99News/status/1515180201172475907?s=20&#038;t=_znOm4LGsMgAptgfL46oUQ
          </div>
        </figure>
      `
      const expected = html`
        <figure class="wp-block-embed is-type-rich is-provider-twitter wp-block-embed-twitter">
          <div class="wp-block-embed__wrapper">
            <iframe src="https://twitter.com/Toronto99News/status/1515180201172475907?s=20&amp;t=_znOm4LGsMgAptgfL46oUQ"></iframe>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the caption beside the rebuilt frame', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-vimeo wp-block-embed-vimeo">
          <div class="wp-block-embed__wrapper">
            https://vimeo.com/687007193
          </div>
          <figcaption>The keynote</figcaption>
        </figure>
      `
      const expected = html`
        <figure class="wp-block-embed is-type-video is-provider-vimeo wp-block-embed-vimeo">
          <div class="wp-block-embed__wrapper">
            <iframe src="https://vimeo.com/687007193"></iframe>
          </div>
          <figcaption>The keynote</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
    it('should rebuild a self-linked url inside a paragraph', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube">
          <div class="wp-block-embed__wrapper">
            <p style="text-align: center;"><a href="https://www.youtube.com/shorts/sVRLFmjyg5k">https://www.youtube.com/shorts/sVRLFmjyg5k </a></p>
          </div>
        </figure>
      `
      const expected = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube">
          <div class="wp-block-embed__wrapper">
            <iframe src="https://www.youtube.com/shorts/sVRLFmjyg5k"></iframe>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should keep a url no resolver claims as it is', async () => {
      const value = html`
        <figure class="wp-block-embed">
          <div class="wp-block-embed__wrapper">
            https://example.com/proposals/031-statefulset-removal.md
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a url the publisher followed with prose', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
          <div class="wp-block-embed__wrapper">
            https://www.youtube.com/watch?v=qkx_qDtQxJc&amp;list=PLV0vRxqFKHymOe3jkTCIMXkPAwb-dfk3n&amp;index=4 Nevruzun içinde bir ağaç gördüm
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a link whose text runs past its href', async () => {
      const value = html`
        <figure class="wp-block-embed">
          <div class="wp-block-embed__wrapper">
            <a
              href="https://open.spotify.com/artist/4tZwfgrHOc3mvqYlEYSvVi"
              rel="nofollow"
            >https://open.spotify.com/artist/4tZwfgrHOc3mvqYlEYSvVi</a>;
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a wrapper that holds an image beside the url', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube">
          <div class="wp-block-embed__wrapper">
            <img
              src="https://example.com/wp-content/uploads/2026/01/bazuinen-2025.jpg"
              width="512"
              height="640"
            />
            <a href="https://youtu.be/lbRJWSwA2_I">https://youtu.be/lbRJWSwA2_I</a>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a native audio player whose fallback link a resolver claims', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-rich is-provider-embed wp-block-embed-embed">
          <div class="wp-block-embed__wrapper">
            <audio controls>
              <source
                type="audio/mpeg"
                src="https://feeds.soundcloud.com/stream/2350814102-cold-slither-comic-book-chronicles-ep-678.mp3?_=1"
              />
              <a href="https://feeds.soundcloud.com/stream/2350814102-cold-slither-comic-book-chronicles-ep-678.mp3">https://feeds.soundcloud.com/stream/2350814102-cold-slither-comic-book-chronicles-ep-678.mp3</a>
            </audio>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep an Instagram blockquote around the url', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-rich is-provider-instagram wp-block-embed-instagram">
          <div class="wp-block-embed__wrapper">
            <blockquote
              class="instagram-media metro-instagram"
              data-instgrm-captioned
              data-instgrm-version="12"
              data-instgrm-permalink="https://www.instagram.com/p/DZsKxhUOtvr/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="
            ><a href="https://www.instagram.com/p/DZsKxhUOtvr/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==">https://www.instagram.com/p/DZsKxhUOtvr/?utm_source=ig_web_copy_link&amp;igsh=MzRlODBiNWFlZA==</a></blockquote>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a wrapper that already holds its frame', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube">
          <div class="wp-block-embed__wrapper">
            <iframe src="https://www.youtube.com/embed/xfdNWD6Xrjw"></iframe>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should rebuild a url autolinked onto itself with a trailing space', async () => {
      const value = html`
        <figure class="wp-block-embed alignfull is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
          <div class="wp-block-embed__wrapper">
            <a href="https://www.youtube.com/watch?v=UEOxDfHoRPA">https://www.youtube.com/watch?v=UEOxDfHoRPA</a>&nbsp;
          </div>
        </figure>
      `
      const expected = html`
        <figure class="wp-block-embed alignfull is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
          <div class="wp-block-embed__wrapper">
            <iframe src="https://www.youtube.com/watch?v=UEOxDfHoRPA"></iframe>
          </div>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube">
          <div class="wp-block-embed__wrapper">
            https://youtu.be/xfdNWD6Xrjw
          </div>
        </figure>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('rebuildWordpressEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn a url held as text into the player', async () => {
    const value = html`
      <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-4-3 wp-has-aspect-ratio">
        <div class="wp-block-embed__wrapper">
          https://youtu.be/xfdNWD6Xrjw
        </div>
      </figure>
    `
    const expected =
      '<div data-embed-ratio="16/9" data-embed-thumbnail="https://i.ytimg.com/vi/xfdNWD6Xrjw/hqdefault.jpg" data-embed-url="https://www.youtube.com/watch?v=xfdNWD6Xrjw" data-embed-id="xfdNWD6Xrjw" data-embed-provider="youtube" data-embed-src="https://www.youtube.com/embed/xfdNWD6Xrjw"></div>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn an Instagram blockquote around the url into its captioned player', async () => {
    const value = html`
      <figure class="wp-block-embed is-type-rich is-provider-instagram wp-block-embed-instagram">
        <div class="wp-block-embed__wrapper">
          <blockquote
            class="instagram-media metro-instagram"
            data-instgrm-captioned
            data-instgrm-version="12"
            data-instgrm-permalink="https://www.instagram.com/p/DZsKxhUOtvr/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="
          ><a href="https://www.instagram.com/p/DZsKxhUOtvr/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==">https://www.instagram.com/p/DZsKxhUOtvr/?utm_source=ig_web_copy_link&amp;igsh=MzRlODBiNWFlZA==</a></blockquote>
        </div>
      </figure>
    `
    const expected =
      '<div data-embed-url="https://www.instagram.com/p/DZsKxhUOtvr/" data-embed-id="p/DZsKxhUOtvr" data-embed-provider="instagram" data-embed-src="https://www.instagram.com/p/DZsKxhUOtvr/embed/captioned/"></div>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a url no resolver claims as a link', async () => {
    const value = html`
      <figure class="wp-block-embed">
        <div class="wp-block-embed__wrapper">
          https://example.com/proposals/031-statefulset-removal.md
        </div>
      </figure>
    `
    const expected =
      '<p> <a href="https://example.com/proposals/031-statefulset-removal.md">https://example.com/proposals/031-statefulset-removal.md</a> </p>'

    expect(await convert(value)).toEqualHtml(expected)
  })
})
