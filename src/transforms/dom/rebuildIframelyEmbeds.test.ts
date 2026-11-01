import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildIframelyEmbeds } from './rebuildIframelyEmbeds.js'

describeForEachParser('rebuildIframelyEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildIframelyEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should turn a facade onto an article into a link', async () => {
      const value = html`
        <div class="iframely-embed">
          <div
            class="iframely-responsive"
            style="padding-bottom: 56.2651%;"
          >
            <a
              href="https://example.com/article"
              data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle&amp;key=abc"
            ></a>
          </div>
        </div>
      `
      const expected = '<a href="https://example.com/article">https://example.com/article</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should turn a facade onto a platform a resolver knows into its frame', async () => {
      const value = html`
        <div class="iframely-embed">
          <div
            class="iframely-responsive"
            style="padding-bottom: 177.5%;"
          >
            <a
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&amp;key=abc"
            ></a>
          </div>
        </div>
      `
      const expected = '<iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a facade standing without its wrapper', async () => {
      const value = html`
        <a
          href="https://example.com/article"
          data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle"
        ></a>
      `
      const expected = '<a href="https://example.com/article">https://example.com/article</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the frame Iframely renders inside an oEmbed wrapper', () => {
    it('should point a Canva frame at the design the wrapper names', async () => {
      const value = html`
        <div data-oembed-url="https://www.canva.com/design/DAG1xDat1Ws/FP_KGaz1JYLKDQxMLY02AQ/view">
          <div>
            <div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 80%;">
              <iframe
                allow="fullscreen *;"
                allowfullscreen=""
                src="//if-cdn.com/hFqOL9kw"
                style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;"
                tabindex="-1"
              ></iframe>
            </div>
          </div>
        </div>
      `
      const expected = html`
        <div data-oembed-url="https://www.canva.com/design/DAG1xDat1Ws/FP_KGaz1JYLKDQxMLY02AQ/view">
          <div>
            <div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 80%;">
              <iframe src="https://www.canva.com/design/DAG1xDat1Ws/FP_KGaz1JYLKDQxMLY02AQ/view"></iframe>
            </div>
          </div>
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should point a frame inside an Instant Articles figure at the post', async () => {
      const value = html`
        <div data-oembed-url="https://t.me/vn20minut/59305">
          <div>
            <div>
              <figure class="op-interactive">
                <iframe
                  allowfullscreen=""
                  src="//if-cdn.com/OfwIfCzU?app=1"
                  tabindex="-1"
                ></iframe>
              </figure>
            </div>
          </div>
        </div>
      `
      const expected = html`
        <div data-oembed-url="https://t.me/vn20minut/59305">
          <div>
            <div>
              <figure class="op-interactive">
                <iframe src="https://t.me/vn20minut/59305"></iframe>
              </figure>
            </div>
          </div>
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the frame when no resolver claims the url the wrapper names', async () => {
      const value = html`
        <div data-oembed-url="https://tass.com/world/2132541">
          <div>
            <div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 63.6667%; padding-top: 120px;">
              <iframe
                allowfullscreen=""
                src="//if-cdn.com/4tZvAIdp?app=1"
                style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;"
                tabindex="-1"
              ></iframe>
            </div>
          </div>
          <script
            async=""
            charset="utf-8"
            src="//if-cdn.com/embed.js"
          ></script>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a frame on another host carrying the same path', async () => {
      const value = html`
        <div data-oembed-url="https://www.youtube.com/watch?v=wN_PqWOCCb4">
          <div>
            <iframe src="https://evil.test/tmPqyiAE"></iframe>
          </div>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a frame on a host that only ends in the Iframely host', async () => {
      const value = html`
        <div data-oembed-url="https://www.youtube.com/watch?v=wN_PqWOCCb4">
          <div>
            <iframe src="https://notif-cdn.com/tmPqyiAE"></iframe>
          </div>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('the iframe API frame', () => {
    it('should point a frame on cdn.iframe.ly at the YouTube video it names', async () => {
      const value = html`
        <iframe
          allow="autoplay *; encrypted-media *"
          allowfullscreen=""
          scrolling="no"
          src="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fyoutu.be%2FNObkWjQHNm8%3Fsi%3DucUQoghAP7K-_bgE&amp;v=1&amp;app=1&amp;key=57d2ec5998440ab74c7cf485bffd908c"
        ></iframe>
      `
      const expected = '<iframe src="https://youtu.be/NObkWjQHNm8?si=ucUQoghAP7K-_bgE"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should point a frame whose API route is in capitals at the video it names', async () => {
      const value = html`
        <iframe src="https://cdn.iframe.ly/API/IFRAME?url=https%3A%2F%2Fyoutu.be%2FNObkWjQHNm8&amp;key=57d2ec5998440ab74c7cf485bffd908c"></iframe>
      `
      const expected = '<iframe src="https://youtu.be/NObkWjQHNm8"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should point a frame on iframely.net at the TikTok video it names', async () => {
      const value = html`
        <iframe
          class="tiktok-iframe"
          src="https://iframely.net/api/iframe?media=1&amp;app=1&amp;url=https%3A%2F%2Fwww.tiktok.com%2F%40tamoorewrites%2Fvideo%2F7641692647203130646&amp;key=e27c740634285c9ddc20db64f73358dd"
          frameborder="0"
          allowfullscreen=""
          scrolling="no"
          loading="lazy"
        ></iframe>
      `
      const expected =
        '<iframe src="https://www.tiktok.com/@tamoorewrites/video/7641692647203130646"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should point a protocol-relative frame at the unencoded url it names', async () => {
      const value = html`
        <iframe
          src="//cdn.iframe.ly/api/iframe?app=1&amp;api_key=082915126879d5135eb7bb&amp;url=https://x.com/rion_eos/status/2043687804111380544"
          frameborder="0"
          allowfullscreen=""
        ></iframe>
      `
      const expected = '<iframe src="https://x.com/rion_eos/status/2043687804111380544"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the frame when no resolver claims the url it names', async () => {
      const value = html`
        <iframe
          src="https://cdn.iframe.ly/api/iframe?_layout=standard&amp;_playlist=false&amp;_theme=light&amp;app=1&amp;url=https%3A%2F%2Fdaily.bandcamp.com%2Ffeatures%2Fbeatnik-youth-interview&amp;key=e27c740634285c9ddc20db64f73358dd"
          frameborder="0"
          scrolling="no"
          allowfullscreen="true"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: the iframe API path on a host Iframely does not serve it from.
    it('should keep a frame on another host carrying the iframe API path', async () => {
      const value =
        '<iframe src="https://evil.test/api/iframe?url=https%3A%2F%2Fyoutu.be%2FNObkWjQHNm8"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: an iframe API frame naming no url.
    it('should keep a frame naming no url', async () => {
      const value =
        '<iframe src="https://cdn.iframe.ly/api/iframe?app=1&amp;key=57d2ec5998440ab74c7cf485bffd908c"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('sad paths', () => {
    it('should leave an anchor that already carries its own text alone', async () => {
      const value = html`
        <a
          href="https://example.com/article"
          data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle"
        >Read the article</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an anchor that already holds an image alone', async () => {
      const value = html`
        <a
          href="https://example.com/article"
          data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle"
        ><img src="https://example.com/cover.jpg" /></a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a facade whose href is not a url alone', async () => {
      const value = html`
        <a
          href="#top"
          data-iframely-url="https://cdn.iframe.ly/api/iframe?url=x"
        ></a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = html`
        <div class="iframely-embed">
          <div class="iframely-responsive">
            <a
              href="https://example.com/article"
              data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle"
            ></a>
          </div>
        </div>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })

    it('should be idempotent on an iframe API frame', async () => {
      const value =
        '<iframe src="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fyoutu.be%2FNObkWjQHNm8%3Fsi%3DucUQoghAP7K-_bgE&amp;v=1&amp;app=1&amp;key=57d2ec5998440ab74c7cf485bffd908c"></iframe>'
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })

    it('should be idempotent on an oEmbed wrapper', async () => {
      const value = html`
        <div data-oembed-url="https://www.canva.com/design/DAG1xDat1Ws/FP_KGaz1JYLKDQxMLY02AQ/view">
          <div>
            <iframe src="//if-cdn.com/hFqOL9kw"></iframe>
          </div>
        </div>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

// The whole run drops an empty anchor and every loader script, so only the pipeline shows the
// destination surviving.
describeForEachParser('rebuildIframelyEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the destination of an article facade as a link', async () => {
    const value = html`
      <div class="iframely-embed">
        <div
          class="iframely-responsive"
          style="padding-bottom: 56.2651%;"
        >
          <a
            href="https://example.com/article"
            data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle&amp;key=abc"
          ></a>
        </div>
      </div>
      <script
        async
        src="https://cdn.iframe.ly/embed.js"
        charset="utf-8"
      ></script>
    `
    const expected = '<p><a href="https://example.com/article">https://example.com/article</a></p>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should bring a platform facade back as that platform placeholder', async () => {
    const value = html`
      <div class="iframely-embed">
        <div class="iframely-responsive">
          <a
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ"
          ></a>
        </div>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="dQw4w9WgXcQ"
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        data-embed-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should bring a Canva frame inside an oEmbed wrapper back as the Canva placeholder', async () => {
    const value = html`
      <div data-oembed-url="https://www.canva.com/design/DAG1xDat1Ws/FP_KGaz1JYLKDQxMLY02AQ/view">
        <div>
          <div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 80%;">
            <iframe
              allow="fullscreen *;"
              allowfullscreen=""
              src="//if-cdn.com/hFqOL9kw"
              style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;"
              tabindex="-1"
            ></iframe>
          </div>
        </div>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="canva"
        data-embed-id="DAG1xDat1Ws/FP_KGaz1JYLKDQxMLY02AQ"
        data-embed-src="https://www.canva.com/design/DAG1xDat1Ws/FP_KGaz1JYLKDQxMLY02AQ/view?embed"
        data-embed-url="https://www.canva.com/design/DAG1xDat1Ws/FP_KGaz1JYLKDQxMLY02AQ/view"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should bring a YouTube frame inside an oEmbed wrapper back as the YouTube placeholder', async () => {
    const value = html`
      <div data-oembed-url="https://www.youtube.com/watch?v=wN_PqWOCCb4">
        <div>
          <div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
            <iframe
              allow="accelerometer *; clipboard-write *; encrypted-media *; gyroscope *; picture-in-picture *; web-share *;"
              allowfullscreen=""
              scrolling="no"
              src="//if-cdn.com/tmPqyiAE"
              style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;"
              tabindex="-1"
            ></iframe>
          </div>
        </div>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="wN_PqWOCCb4"
        data-embed-src="https://www.youtube.com/embed/wN_PqWOCCb4"
        data-embed-url="https://www.youtube.com/watch?v=wN_PqWOCCb4"
        data-embed-thumbnail="https://i.ytimg.com/vi/wN_PqWOCCb4/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should bring an iframe API frame back as the player of the url it names', async () => {
    const value = html`
      <iframe
        allow="autoplay *; encrypted-media *"
        allowfullscreen=""
        scrolling="no"
        src="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fyoutu.be%2FNObkWjQHNm8%3Fsi%3DucUQoghAP7K-_bgE&amp;v=1&amp;app=1&amp;key=57d2ec5998440ab74c7cf485bffd908c"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="NObkWjQHNm8"
        data-embed-src="https://www.youtube.com/embed/NObkWjQHNm8"
        data-embed-url="https://www.youtube.com/watch?v=NObkWjQHNm8"
        data-embed-thumbnail="https://i.ytimg.com/vi/NObkWjQHNm8/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should bring a lazy iframe API frame back as the player of the url it names', async () => {
    const value = html`
      <iframe
        data-img
        data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fyoutu.be%2FvkG0KkjPzfs&amp;key=a91f6c63822d2172297a7435cae7a9eb"
        style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
        allowfullscreen
        scrolling="no"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="vkG0KkjPzfs"
        data-embed-src="https://www.youtube.com/embed/vkG0KkjPzfs"
        data-embed-url="https://www.youtube.com/watch?v=vkG0KkjPzfs"
        data-embed-thumbnail="https://i.ytimg.com/vi/vkG0KkjPzfs/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should load a lazy iframe API frame no resolver claims through its own url', async () => {
    const value = html`
      <iframe
        data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fmassivesci.com%2Fvideos%2Fastronomy-einstein-eddington-eclipse-relativity%2F&amp;key=a91f6c63822d2172297a7435cae7a9eb&amp;app=1"
        style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
        allowfullscreen
        allow="encrypted-media *"
      ></iframe>
    `
    const expected =
      '<div data-embed-src="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fmassivesci.com%2Fvideos%2Fastronomy-einstein-eddington-eclipse-relativity%2F&amp;key=a91f6c63822d2172297a7435cae7a9eb&amp;app=1"></div>'

    expect(await convert(value)).toEqualHtml(expected)
  })
})
