import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildDeferredIframes } from './rebuildDeferredIframes.js'

describeForEachParser('rebuildDeferredIframes', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildDeferredIframes(baseContext)])
  }

  it('should rebuild an iframe from a Pym.js data-pym-src div', async () => {
    const value = html`
      <div
        id="chart"
        data-pym-src="https://apps.npr.org/chart/"
      >Loading…</div>
    `
    const expected = '<iframe src="https://apps.npr.org/chart/"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should rebuild an iframe from a @newswire/frames data-frame-src div', async () => {
    const value = '<div data-frame-src="https://embed.example.org/graphic/"></div>'
    const expected = '<iframe src="https://embed.example.org/graphic/"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should skip an already-initialized Pym node', async () => {
    const value = html`
      <div
        data-pym-src="https://apps.npr.org/chart/"
        data-pym-auto-initialized="true"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a div whose attribute is not a URL untouched', async () => {
    const value = '<div data-frame-src="not a url"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave an unrelated div untouched', async () => {
    const value = '<div class="content">Hello</div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should surface a deferred embed into a placeholder end to end', async () => {
    const value = '<div data-frame-src="https://embed.example.org/graphic/"></div>'
    const expected = '<div data-embed-src="https://embed.example.org/graphic/"></div>'
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com',
    })

    expect(result).toEqualHtml(expected)
  })

  // The Drupal/CKEditor convention. Its value is a watch page rather than a player url, which
  // the resolvers turn into a player downstream.
  it('should rebuild an iframe from data-oembed-url', async () => {
    const value = '<div data-oembed-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></div>'
    const expected = '<iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // ARVE's lazyload play button. Its widget holds no image, so without this the reader is left
  // with an empty box: 155 of the 276 corpus feeds carrying it have no YouTube player anywhere.
  it('should rebuild an iframe from an ARVE play button', async () => {
    const value = html`
      <button
        class="arve-play-btn arve-play-btn--youtube"
        data-iframe="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
      ></button>
    `
    const expected =
      '<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // `data-iframe` is a name anyone could pick, so the class is what says this is ARVE.
  it('should leave a data-iframe attribute that ARVE did not write', async () => {
    const value = '<div data-iframe="https://example.com/player"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  // 566 of the 624 corpus wrappers already hold the iframe, and this transform replaces what it
  // matches, so acting on those would discard a working player and the size it states.
  it('should leave a data-oembed-url wrapper that already holds a player', async () => {
    const value = html`
      <div data-oembed-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
        <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="640" height="360"></iframe>
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  // Some Enfold carriers hold the publisher's own iframes, several of them in one wrapper.
  it('should leave an Enfold video wrapper that already holds a player', async () => {
    const value = html`
      <div class="avia-video avia-video-16-9 av-lazyload-immediate av-lazyload-video-embed" data-original_url="https://www.youtube.com/watch?v=NbX1dbtL380">
        <iframe src="https://www.youtube.com/embed/NbX1dbtL380?feature=oembed" width="1500" height="844"></iframe>
        <iframe src="https://www.youtube.com/embed/Jiz2xU-aeuk?feature=oembed" width="1500" height="844"></iframe>
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave an Enfold video wrapper that holds a self-hosted video', async () => {
    const value = html`
      <div class="avia-video avia-video-16-9 av-no-preview-image avia-video-load-always avia-video-html5" data-original_url="http://example.com//Dokumente/Tagesliste.mp4">
        <video class="avia_video" preload="auto" controls>
          <source src="http://example.com//Dokumente/Tagesliste.mp4" type="video/mp4">
        </video>
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a lazyframe wrapper that already holds a player', async () => {
    const value = html`
      <div class="lazyframe lazyframe--loaded" data-ratio="16:9" data-src="https://www.youtube.com/embed/ZT6anIWi_6Q">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/ZT6anIWi_6Q" allowfullscreen></iframe>
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave an Elementor playlist tab that holds the publisher description', async () => {
    const value = html`
      <div class="e-tab-content elementor-clearfix" data-tab="1" role="tabpanel" data-video-url="https://youtu.be/G4wcQ2NV0hU" data-video-type="youtube">
        <div>
          <p>Add some content for each one of your videos, like a description, transcript or external links.</p>
        </div>
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  // Themify's share module carries the post url on the same `.module[data-url]` GemPages uses.
  it('should leave a share module that names a page', async () => {
    const value = html`
      <div
        class="module module-social-share tb_ss_size_normal"
        data-lazy="1"
        data-title="Consent in Crisis"
        data-url="https://example.com/consent-in-crisis/"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = '<div data-frame-src="https://embed.example.org/graphic/"></div>'
    const once = await transform(value)
    const twice = await applyDomTransforms(parseHtml(once), [rebuildDeferredIframes(baseContext)])

    expect(twice).toEqualHtml(once)
  })
})

// Each case is a carrier copied from a corpus feed, which renders no player without the entry.
describeForEachParser('video blocks rebuildDeferredIframes hands to the resolvers', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should resolve an Enfold video whose iframe waits in a text/html script', async () => {
    const value = html`
      <div class="avia-video avia-video-16-9 av-lazyload-immediate av-lazyload-video-embed" data-original_url="https://www.youtube.com/watch?v=9iWH4j-1TTY">
        <script type="text/html" class="av-video-tmpl">
          <div class="avia-iframe-wrap"><iframe width="1333" height="1000" src="https://www.youtube.com/embed/9iWH4j-1TTY?feature=oembed" allowfullscreen></iframe></div>
        </script>
        <div class="av-click-to-play-overlay"><div class="avia_playpause_icon"></div></div>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="9iWH4j-1TTY"
        data-embed-src="https://www.youtube.com/embed/9iWH4j-1TTY"
        data-embed-url="https://www.youtube.com/watch?v=9iWH4j-1TTY"
        data-embed-thumbnail="https://i.ytimg.com/vi/9iWH4j-1TTY/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve an Enfold video naming a youtu.be url', async () => {
    const value = html`
      <div class="avia-video avia-video-16-9 av-lazyload-immediate av-lazyload-video-embed" data-original_url="https://youtu.be/45HOVQLhgWg">
        <script type="text/html" class="av-video-tmpl">
          <div class="avia-iframe-wrap"><iframe width="1500" height="844" src="https://www.youtube.com/embed/45HOVQLhgWg?feature=oembed" allowfullscreen></iframe></div>
        </script>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="45HOVQLhgWg"
        data-embed-src="https://www.youtube.com/embed/45HOVQLhgWg"
        data-embed-url="https://www.youtube.com/watch?v=45HOVQLhgWg"
        data-embed-thumbnail="https://i.ytimg.com/vi/45HOVQLhgWg/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve an Enfold video naming a Shorts url', async () => {
    const value = html`
      <div class="avia-video avia-video-16-9 av-lazyload-immediate av-lazyload-video-embed" data-original_url="https://youtube.com/shorts/ENOYNqiQD2M?feature=share">
        <script type="text/html" class="av-video-tmpl">
          <div class="avia-iframe-wrap"><iframe width="563" height="1000" src="https://www.youtube.com/embed/ENOYNqiQD2M?feature=oembed" allowfullscreen></iframe></div>
        </script>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="ENOYNqiQD2M"
        data-embed-src="https://www.youtube.com/embed/ENOYNqiQD2M"
        data-embed-url="https://www.youtube.com/watch?v=ENOYNqiQD2M"
        data-embed-thumbnail="https://i.ytimg.com/vi/ENOYNqiQD2M/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve an Enfold Vimeo video whose script is empty', async () => {
    const value = html`
      <div class="avia-video avia-video-16-9 av-lazyload-immediate av-lazyload-video-embed" data-original_url="https://vimeo.com/1107690407">
        <script type="text/html" class="av-video-tmpl"></script>
        <div class="av-click-to-play-overlay"><div class="avia_playpause_icon"></div></div>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="vimeo"
        data-embed-id="1107690407"
        data-embed-src="https://player.vimeo.com/video/1107690407"
        data-embed-url="https://vimeo.com/1107690407"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a GemPages YouTube module', async () => {
    const value = html`
      <div
        class="module gf_module- "
        data-url="https://www.youtube.com/watch?v=beabrgKhxN4"
        data-responsive="1"
        data-controls="1"
      ></div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="beabrgKhxN4"
        data-embed-src="https://www.youtube.com/embed/beabrgKhxN4"
        data-embed-url="https://www.youtube.com/watch?v=beabrgKhxN4"
        data-embed-thumbnail="https://i.ytimg.com/vi/beabrgKhxN4/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a GemPages Vimeo module', async () => {
    const value = html`
      <div class="module " data-url="https://vimeo.com/1007824975" data-autopause="1" data-videoloop="0">
        <div class="vimeo_video videoFullScreen"></div>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="vimeo"
        data-embed-id="1007824975"
        data-embed-src="https://player.vimeo.com/video/1007824975"
        data-embed-url="https://vimeo.com/1007824975"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a Kioken video box', async () => {
    const value = html`
      <div class="wp-block-kioken-videobox" data-video-type="yt_vm_video" data-video="https://youtu.be/0wDDxAqZdW0" data-video-aspect-ratio="16:9">
        <div class="kioken-video-play-icon"><svg viewBox="0 0 512 512"><path d="M256 8z"></path></svg></div>
        <div class="kioken-video-loading-icon"><span class="kioken-video-spinner"></span></div>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="0wDDxAqZdW0"
        data-embed-src="https://www.youtube.com/embed/0wDDxAqZdW0"
        data-embed-url="https://www.youtube.com/watch?v=0wDDxAqZdW0"
        data-embed-thumbnail="https://i.ytimg.com/vi/0wDDxAqZdW0/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve an Elementor playlist tab', async () => {
    const value = html`
      <div class="e-tab-content elementor-clearfix" data-tab="1" role="tabpanel" data-video-url="https://youtu.be/vPXPk8WYAUQ?si=LCLjNuHMle-VDQ5b" data-video-type="youtube">
        <div></div>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="vPXPk8WYAUQ"
        data-embed-src="https://www.youtube.com/embed/vPXPk8WYAUQ"
        data-embed-url="https://www.youtube.com/watch?v=vPXPk8WYAUQ"
        data-embed-thumbnail="https://i.ytimg.com/vi/vPXPk8WYAUQ/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a GreenShift video block', async () => {
    const value = html`
      <div
        class="gs-video-element"
        data-src="https://vimeo.com/1089120689"
        data-provider="vimeo"
      ></div>
    `
    const expected = html`
      <div
        data-embed-provider="vimeo"
        data-embed-id="1089120689"
        data-embed-src="https://player.vimeo.com/video/1089120689"
        data-embed-url="https://vimeo.com/1089120689"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a lazyframe YouTube player', async () => {
    const value = html`
      <div
        class="lazyframe"
        data-vendor="youtube"
        data-thumbnail="https://i.ytimg.com/vi/zq_gmhkQYz0/hqdefault.jpg"
        data-src="https://www.youtube.com/embed/zq_gmhkQYz0?feature=oembed"
        data-ratio="16:9"
      ></div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="zq_gmhkQYz0"
        data-embed-src="https://www.youtube.com/embed/zq_gmhkQYz0"
        data-embed-url="https://www.youtube.com/watch?v=zq_gmhkQYz0"
        data-embed-thumbnail="https://i.ytimg.com/vi/zq_gmhkQYz0/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a lazyframe naming the YouTube Flash url', async () => {
    const value = html`
      <div
        class="lazyframe"
        data-vendor="youtube"
        data-thumbnail="http://i.ytimg.com/vi/fyMhvkC3A84/0.jpg"
        data-src="http://www.youtube.com/v/fyMhvkC3A84?f=videos&amp;app=youtube_gdata"
        data-ratio="16:9"
      ></div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="fyMhvkC3A84"
        data-embed-src="https://www.youtube.com/embed/fyMhvkC3A84"
        data-embed-url="https://www.youtube.com/watch?v=fyMhvkC3A84"
        data-embed-thumbnail="https://i.ytimg.com/vi/fyMhvkC3A84/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a lazyframe Dailymotion player', async () => {
    const value = html`
      <div
        class="lazyframe"
        data-vendor="dailymotion"
        data-thumbnail="https://s1.dmcdn.net/v/TxKc01YXIitFZ7Gu0/x720"
        data-src="https://www.dailymotion.com/embed/video/x8axj7k"
        data-ratio="16:9"
      ></div>
    `
    const expected = html`
      <div
        data-embed-provider="dailymotion"
        data-embed-id="x8axj7k"
        data-embed-src="https://geo.dailymotion.com/player/xpiw2.html?video=x8axj7k"
        data-embed-url="https://www.dailymotion.com/video/x8axj7k"
        data-embed-thumbnail="https://www.dailymotion.com/thumbnail/video/x8axj7k"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve an LMPixels lazy video', async () => {
    const value = html`
      <div class="embed-video embed-responsive embed-responsive-16by9 embed-vimeo-video embed-lazy-video" data-embed="https://player.vimeo.com/video/158284739">
        <div class="play-button"></div>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="vimeo"
        data-embed-id="158284739"
        data-embed-src="https://player.vimeo.com/video/158284739"
        data-embed-url="https://vimeo.com/158284739"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a KingComposer video', async () => {
    const value = html`
      <div
        class="kc-elm kc_shortcode kc_video_play kc_video_wrapper"
        data-video="https://www.youtube.com/watch?v=aWmfSLee14k"
        data-width="800"
        data-height="451.97740112994"
      ></div>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="aWmfSLee14k"
        data-embed-src="https://www.youtube.com/embed/aWmfSLee14k"
        data-embed-url="https://www.youtube.com/watch?v=aWmfSLee14k"
        data-embed-thumbnail="https://i.ytimg.com/vi/aWmfSLee14k/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve a United Themes video link', async () => {
    const value = html`
      <a class="ut-load-video" data-location="inline" data-video="https://vimeo.com/474971009" href="#">
        <img src="https://i.vimeocdn.com/video/987340169-250ce0928d749193be26f994696505f08950945d212fb3771a07b4df1aca7162-d_640">
      </a>
    `
    const expected = html`
      <div
        data-embed-provider="vimeo"
        data-embed-id="474971009"
        data-embed-src="https://player.vimeo.com/video/474971009"
        data-embed-url="https://vimeo.com/474971009"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
