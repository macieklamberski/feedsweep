import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildLyteEmbeds } from './rebuildLyteEmbeds.js'

describeForEachParser('rebuildLyteEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildLyteEmbeds(baseContext)])
  }

  it('should rebuild an iframe from a WYL_ wrapper', async () => {
    const value = html`
      <div
        id="WYL_dQw4w9WgXcQ"
        class="lyMe"
      ></div>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should rebuild an iframe from a standalone lyte_ node', async () => {
    const value = html`
      <div
        id="lyte_dQw4w9WgXcQ"
        class="pL"
      ></div>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should produce a single iframe for the nested WYL_ / lyte_ pair', async () => {
    const value = html`
      <div
        id="WYL_dQw4w9WgXcQ"
        class="lyMe"
      ><div
          id="lyte_dQw4w9WgXcQ"
          class="pL"
        ></div>
      </div>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep an underscore-bearing video id intact', async () => {
    const value = html`
      <div
        id="WYL_a_b-c123def"
        class="lyMe"
      ></div>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/a_b-c123def"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a lyte_ element without the plugin class', async () => {
    const value = '<div id="lyte_dQw4w9WgXcQ"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a WYL_ element without the plugin class', async () => {
    const value = '<div id="WYL_dQw4w9WgXcQ"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should use a malformed video id as written, even if the player answers an error', async () => {
    const value = html`
      <div
        id="WYL_dQw4w9WgXcQ?list=x"
        class="lyMe"
      ></div>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?list=x"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a playlist facade, whose id names a playlist', async () => {
    const value = html`
      <div
        id="WYL_PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG"
        class="lyMe playlist"
      ><div
          id="lyte_PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG"
          class="pL"
        ></div>
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should rebuild the feed thumbnail and drop the label that follows it', async () => {
    const value = html`
      <p><a href="http://www.klausgerber.info/blog/2013/11/18/buchtrailer/"><img
            decoding="async"
            src="//i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
            alt="YouTube Video"
          ></a><br /> <a
          href="http://youtu.be/XpMGiFb1488"
          target="_blank"
        >Dieses Video auf YouTube ansehen</a>.<br /></p>
    `
    const expected = '<p><iframe src="https://www.youtube.com/embed/XpMGiFb1488"></iframe><br></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should rebuild the feed thumbnail served through lyteCache.php', async () => {
    const value = html`
      <figure class="wp-block-embed-youtube wp-block-embed"><a href="https://charisma-magazin.eu/2026/05/25/trainingstage/"><img
            decoding="async"
            src="https://charisma-magazin.eu/wp-content/plugins/wp-youtube-lyte/lyteCache.php?origThumbUrl=https%3A%2F%2Fi.ytimg.com%2Fvi%2FOEkcwVBWh-4%2Fhqdefault.jpg"
            alt="YouTube Video"
          ></a><br /> <a
          href="https://youtu.be/OEkcwVBWh-4"
          target="_blank"
          rel="noopener"
        >Dieses Video auf YouTube ansehen</a>.<br /><figcaption></figcaption></figure>
    `
    const expected = html`
      <figure class="wp-block-embed-youtube wp-block-embed"><iframe src="https://www.youtube.com/embed/OEkcwVBWh-4"></iframe><br><figcaption></figcaption></figure>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should rebuild the feed thumbnail written without a label', async () => {
    const value = html`
      <p><a
          href="https://www.kirstymaccoll.com/billy-bragg-in-leicester/"
          data-wpel-link="internal"
        ><img
            decoding="async"
            src="https://i.ytimg.com/vi/OUn89XOsJG0/hqdefault.jpg"
            alt="YouTube Video"
          ></a><br /><br /></p>
    `
    const expected =
      '<p><iframe src="https://www.youtube.com/embed/OUn89XOsJG0"></iframe><br><br></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should strip whitespace after the video id in the thumbnail url', async () => {
    const value = html`
      <p><a href="https://example.com/post/"><img
            src="https://i.ytimg.com/vi/OUn89XOsJG0%20/hqdefault.jpg"
            alt="YouTube Video"
          ></a></p>
    `
    const expected = '<p><iframe src="https://www.youtube.com/embed/OUn89XOsJG0"></iframe></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the text the author wrote after the label', async () => {
    const value = html`
      <p><a href="https://example.com/post/"><img
            src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
            alt="YouTube Video"
          ></a><br /> <a href="https://youtu.be/XpMGiFb1488">Watch this video on YouTube</a>. More below.</p>
    `
    const expected =
      '<p><iframe src="https://www.youtube.com/embed/XpMGiFb1488"></iframe> More below.</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a label that names another video', async () => {
    const value = html`
      <p><a href="https://example.com/post/"><img
            src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
            alt="YouTube Video"
          ></a><br /> <a href="https://youtu.be/OEkcwVBWh-4">Watch this video on YouTube</a>.</p>
    `
    const expected = html`
      <p><iframe src="https://www.youtube.com/embed/XpMGiFb1488"></iframe><br /> <a href="https://youtu.be/OEkcwVBWh-4">Watch this video on YouTube</a>.</p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a label link on a foreign host', async () => {
    const value = html`
      <p><a href="https://example.com/post/"><img
            src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
            alt="YouTube Video"
          ></a><br /> <a href="https://evil.test/watch?v=XpMGiFb1488">Watch this video on YouTube</a>.</p>
    `
    const expected = html`
      <p><iframe src="https://www.youtube.com/embed/XpMGiFb1488"></iframe><br /> <a href="https://evil.test/watch?v=XpMGiFb1488">Watch this video on YouTube</a>.</p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a label separated from the thumbnail by text', async () => {
    const value = html`
      <p><a href="https://example.com/post/"><img
            src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
            alt="YouTube Video"
          ></a> Or <a href="https://youtu.be/XpMGiFb1488">watch this video on YouTube</a>.</p>
    `
    const expected = html`
      <p><iframe src="https://www.youtube.com/embed/XpMGiFb1488"></iframe> Or <a href="https://youtu.be/XpMGiFb1488">watch this video on YouTube</a>.</p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a label written before the thumbnail', async () => {
    const value = html`
      <p><a href="https://youtu.be/XpMGiFb1488">Watch this video on YouTube</a>. <a href="https://example.com/post/"><img
            src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
            alt="YouTube Video"
          ></a></p>
    `
    const expected = html`
      <p><a href="https://youtu.be/XpMGiFb1488">Watch this video on YouTube</a>. <iframe src="https://www.youtube.com/embed/XpMGiFb1488"></iframe></p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a thumbnail whose alt is not the plugin literal', async () => {
    const value = html`
      <a href="https://example.com/post/"><img
          src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
          alt="YouTube Video player"
        ></a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a thumbnail link that holds another element', async () => {
    const value = html`
      <a href="https://example.com/post/"><img
          src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
          alt="YouTube Video"
        ><span>Play</span></a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a thumbnail link that holds text', async () => {
    const value = html`
      <a href="https://example.com/post/"><img
          src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
          alt="YouTube Video"
        > Play</a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a thumbnail on a foreign host carrying the same path', async () => {
    const value = html`
      <a href="https://example.com/post/"><img
          src="https://evil.test/vi/XpMGiFb1488/hqdefault.jpg"
          alt="YouTube Video"
        ></a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a thumbnail outside the vi route', async () => {
    const value = html`
      <a href="https://example.com/post/"><img
          src="https://i.ytimg.com/an/XpMGiFb1488/hqdefault.jpg"
          alt="YouTube Video"
        ></a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  // With no API key the plugin writes a playlist's id into the thumbnail path a video id takes.
  it('should leave the thumbnail of a playlist', async () => {
    const value = html`
      <a href="https://example.com/post/"><img
          src="https://i.ytimg.com/vi/PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG/hqdefault.jpg"
          alt="YouTube Video"
        ></a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave an origThumbUrl param outside lyteCache.php', async () => {
    const value = html`
      <a href="https://example.com/post/"><img
          src="https://example.com/proxy.php?origThumbUrl=https%3A%2F%2Fi.ytimg.com%2Fvi%2FXpMGiFb1488%2Fhqdefault.jpg"
          alt="YouTube Video"
        ></a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a thumbnail the author linked to the video itself', async () => {
    const value = html`
      <a href="https://www.youtube.com/watch?v=XpMGiFb1488"><img
          src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
          alt="YouTube Video"
        ></a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a thumbnail with no video id linked to a video', async () => {
    const value = html`
      <a href="https://www.youtube.com/watch?v=XpMGiFb1488"><img
          src="https://example.com/thumbnail.jpg"
          alt="YouTube Video"
        ></a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a thumbnail whose src is not a url', async () => {
    const value = html`
      <a href="https://example.com/post/"><img
          src="http://[::1"
          alt="YouTube Video"
        ></a>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should produce a youtube placeholder from the feed thumbnail end to end', async () => {
    const value = html`
      <figure class="wp-block-embed-youtube wp-block-embed is-type-video is-provider-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><a href="https://jellewieringa.com/2026/05/25/stoicism-as-a-philosophy-for-an-ordinary-life/"><img
            decoding="async"
            src="https://i.ytimg.com/vi/Yhn1Fe8cT0Q/hqdefault.jpg"
            alt="YouTube Video"
          ></a><br /> <a
          href="https://youtu.be/Yhn1Fe8cT0Q"
          target="_blank"
        >Watch this video on YouTube</a>.<br /><figcaption></figcaption></figure>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/Yhn1Fe8cT0Q"
        data-embed-provider="youtube"
        data-embed-id="Yhn1Fe8cT0Q"
        data-embed-url="https://www.youtube.com/watch?v=Yhn1Fe8cT0Q"
        data-embed-thumbnail="https://i.ytimg.com/vi/Yhn1Fe8cT0Q/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com',
    })

    expect(result).toEqualHtml(expected)
  })

  it('should produce a youtube placeholder end to end', async () => {
    const value = html`
      <div
        id="WYL_dQw4w9WgXcQ"
        class="lyMe"
      ></div>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        data-embed-provider="youtube"
        data-embed-id="dQw4w9WgXcQ"
        data-embed-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com',
    })

    expect(result).toEqualHtml(expected)
  })

  it('should be idempotent', async () => {
    const value = html`
      <div
        id="WYL_dQw4w9WgXcQ"
        class="lyMe"
      ><div id="lyte_dQw4w9WgXcQ"></div>
      </div>
      <p><a href="https://example.com/post/"><img
            src="https://i.ytimg.com/vi/XpMGiFb1488/hqdefault.jpg"
            alt="YouTube Video"
          ></a><br /> <a href="https://youtu.be/XpMGiFb1488">Watch this video on YouTube</a>.<br /></p>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
