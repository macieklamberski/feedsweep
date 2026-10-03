import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { assignVideoPosters } from './assignVideoPosters.js'

describeForEachParser('assignVideoPosters', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [assignVideoPosters(baseContext)])
  }

  it('should replace the resolver thumbnail with the publisher inline poster', async () => {
    const value = html`
      <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg">
      <div data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ" data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"></div>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        data-embed-thumbnail="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a feed-defined thumbnail over an inline poster', async () => {
    const value = html`
      <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg">
      <div data-enclosure data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ" data-embed-thumbnail="https://feed.example.com/thumb.jpg"></div>
    `
    const expected = html`
      <div
        data-enclosure=""
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        data-embed-thumbnail="https://feed.example.com/thumb.jpg"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should move an inline poster onto an embed that has no thumbnail', async () => {
    const value = html`
      <img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg">
      <div data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"></div>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should move an image enclosure onto the embed on a video-led item', async () => {
    const value = html`
      <img src="https://media.beehiiv.com/uploads/poster.png" data-enclosure="">
      <div data-embed-src="https://cdn.jwplayer.com/players/abc123.html"></div>
    `
    const expected = html`
      <div
        data-embed-src="https://cdn.jwplayer.com/players/abc123.html"
        data-embed-thumbnail="https://media.beehiiv.com/uploads/poster.png"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // Each host a video-led item's placeholder can point at, from a lab player url.
  const videoHostSrcs = [
    'https://www.youtube.com/embed/SeDnERmDjms',
    'https://www.dailymotion.com/embed/video/x4mo9k5',
    'https://fast.wistia.net/embed/iframe/y2oc2r9hkp',
    'https://videopress.com/embed/gRb7trlt',
    'https://players.brightcove.net/6178286496001/default_default/index.html?videoId=6278923408001',
    'https://streamable.com/e/qun2ij',
  ]

  it.each(videoHostSrcs)('should move an image enclosure onto a player on %s', async (src) => {
    const value = html`
      <img src="https://media.beehiiv.com/uploads/poster.png" data-enclosure="">
      <div data-embed-src="${src}"></div>
    `
    const expected = html`
      <div
        data-embed-src="${src}"
        data-embed-thumbnail="https://media.beehiiv.com/uploads/poster.png"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // Lab YouTube ids carry both punctuation marks the id alphabet allows.
  const punctuatedVideoIds = ['Ld9q4HFv-2w', 'h41Rrk_6rzs']

  it.each(punctuatedVideoIds)('should move an inline poster onto the embed of %s', async (id) => {
    const value = html`
      <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg">
      <div data-embed-id="${id}" data-embed-src="https://www.youtube.com/embed/${id}"></div>
    `
    const expected = html`
      <div
        data-embed-id="${id}"
        data-embed-src="https://www.youtube.com/embed/${id}"
        data-embed-thumbnail="https://i.ytimg.com/vi/${id}/hqdefault.jpg"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep an image enclosure when the item has an inline image of its own', async () => {
    const value = html`
      <img src="https://example.com/poster.png" data-enclosure="">
      <img src="https://example.com/content.jpg">
      <div data-embed-src="https://cdn.jwplayer.com/players/abc123.html"></div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a standalone enclosure image when there is no video', async () => {
    const value = html`
      <img src="https://example.com/poster.png" data-enclosure="">
      <p>Just text.</p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should remove the figure of a captioned enclosure image it matches to an embed', async () => {
    const value = html`
      <figure>
        <img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg" data-enclosure="">
        <figcaption>The harbour at dawn.</figcaption>
      </figure>
      <div data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"></div>
    `
    const expected = html`
      <div
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should remove the figure of a captioned enclosure image it moves to the poster', async () => {
    const value = html`
      <figure>
        <img src="https://example.com/poster.png" data-enclosure="">
        <figcaption>The harbour at dawn.</figcaption>
      </figure>
      <video>
        <source src="https://example.com/clip.mp4">
      </video>
    `
    const expected = html`
      <video poster="https://example.com/poster.png">
        <source src="https://example.com/clip.mp4">
      </video>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should set the poster on a native video and remove the enclosure image', async () => {
    const value = html`
      <img src="https://example.com/poster.png" data-enclosure="">
      <video>
        <source src="https://example.com/clip.mp4">
      </video>
    `
    const expected = html`
      <video poster="https://example.com/poster.png">
        <source src="https://example.com/clip.mp4">
      </video>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should move only the first image enclosure onto the poster and keep the rest', async () => {
    const value = html`
      <video
        data-enclosure=""
        controls
        src="https://example.org/files/original/3804f8c681d45a5bc6e8fbfab6c0a2cc.mp4"
      ></video>
      <img
        data-enclosure=""
        src="https://example.org/files/original/44bc4331f3f615ae446637439c0fb89c.png"
      >
      <img
        data-enclosure=""
        src="https://example.org/files/original/5ac6d68ad69a2ad0012d9e1175520c22.JPG"
      >
      <img
        data-enclosure=""
        src="https://example.org/files/original/160ab58125cf1443da70aeaa1a53e93a.JPG"
      >
    `
    const expected = html`
      <video
        data-enclosure=""
        controls
        src="https://example.org/files/original/3804f8c681d45a5bc6e8fbfab6c0a2cc.mp4"
        poster="https://example.org/files/original/44bc4331f3f615ae446637439c0fb89c.png"
      ></video>
      <img src="https://example.org/files/original/5ac6d68ad69a2ad0012d9e1175520c22.JPG">
      <img src="https://example.org/files/original/160ab58125cf1443da70aeaa1a53e93a.JPG">
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should move no remaining image enclosure onto the poster on a repeat run', async () => {
    const value = html`
      <video
        data-enclosure=""
        controls
        src="https://example.org/files/original/3804f8c681d45a5bc6e8fbfab6c0a2cc.mp4"
      ></video>
      <img
        data-enclosure=""
        src="https://example.org/files/original/44bc4331f3f615ae446637439c0fb89c.png"
      >
      <img
        data-enclosure=""
        src="https://example.org/files/original/5ac6d68ad69a2ad0012d9e1175520c22.JPG"
      >
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })

  it('should keep an unrelated image that is not a video poster', async () => {
    const value = html`
      <img src="https://example.com/photo.jpg">
      <div data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"></div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = html`
      <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg">
      <div data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ" data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"></div>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('assignVideoPosters under heuristics', (parseHtml) => {
  const convert = (value: string, enclosures: Array<{ url: string; type?: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.org/post',
      enclosures,
      heuristics: true,
    })
  }

  it('should keep every photo of an archive item beside its video', async () => {
    const value = '<p>The Lesbian Avengers Eat Fire, Too</p>'
    const enclosures = [
      {
        url: 'https://example.org/files/original/44bc4331f3f615ae446637439c0fb89c.png',
        type: 'image/png',
      },
      {
        url: 'https://example.org/files/original/3804f8c681d45a5bc6e8fbfab6c0a2cc.mp4',
        type: 'video/mp4',
      },
      {
        url: 'https://example.org/files/original/5ac6d68ad69a2ad0012d9e1175520c22.JPG',
        type: 'image/jpeg',
      },
      {
        url: 'https://example.org/files/original/160ab58125cf1443da70aeaa1a53e93a.JPG',
        type: 'image/jpeg',
      },
      {
        url: 'https://example.org/files/original/fe42a004954a215dccceec2ad6371459.JPG',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <video
        poster="https://example.org/files/original/44bc4331f3f615ae446637439c0fb89c.png"
        controls
        src="https://example.org/files/original/3804f8c681d45a5bc6e8fbfab6c0a2cc.mp4"
      ></video>
      <img src="https://example.org/files/original/5ac6d68ad69a2ad0012d9e1175520c22.JPG">
      <img src="https://example.org/files/original/160ab58125cf1443da70aeaa1a53e93a.JPG">
      <img src="https://example.org/files/original/fe42a004954a215dccceec2ad6371459.JPG">
      <p>The Lesbian Avengers Eat Fire, Too</p>
    `

    expect(await convert(value, enclosures)).toEqualHtml(expected)
  })

  it('should keep an image enclosure listed after the video in its place', async () => {
    const value = '<p>Antonello Colonna, chef alle Olimpiadi.</p>'
    const enclosures = [
      { url: 'https://example.org/pictures/2025/11/27/162638436-f0210e19.jpg', type: 'image/jpeg' },
      { url: 'https://example.org/pictures/2025/11/27/162638437-dca5ca4a.jpg', type: 'image/jpeg' },
      {
        url: 'https://example.org/1/273/cf1af260-ae33-4fb5-91d8-71418391765b.mp4',
        type: 'video/mp4',
      },
      {
        url: 'https://example.org/pictures/kolumbus/2025/11/27/a82710ec_thumb_1764260796233.jpg',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <img src="https://example.org/pictures/2025/11/27/162638437-dca5ca4a.jpg">
      <video
        poster="https://example.org/pictures/2025/11/27/162638436-f0210e19.jpg"
        controls
        src="https://example.org/1/273/cf1af260-ae33-4fb5-91d8-71418391765b.mp4"
      ></video>
      <img src="https://example.org/pictures/kolumbus/2025/11/27/a82710ec_thumb_1764260796233.jpg">
      <p>Antonello Colonna, chef alle Olimpiadi.</p>
    `

    expect(await convert(value, enclosures)).toEqualHtml(expected)
  })

  it('should drop a YouTube thumbnail enclosure on its YouTube video', async () => {
    const value = '<p>You can see the interview below.</p>'
    const enclosures = [
      { url: 'https://img.youtube.com/vi/UaVU95gsXW8/0.jpg', type: 'image/jpeg' },
      { url: 'https://www.youtube.com/embed/UaVU95gsXW8' },
    ]
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-thumbnail="https://i.ytimg.com/vi/UaVU95gsXW8/hqdefault.jpg"
        data-embed-url="https://www.youtube.com/watch?v=UaVU95gsXW8"
        data-embed-id="UaVU95gsXW8"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/UaVU95gsXW8"
      ></div>
      <p>You can see the interview below.</p>
    `

    expect(await convert(value, enclosures)).toEqualHtml(expected)
  })

  it('should drop a single image enclosure when the embed already has a thumbnail', async () => {
    const value = '<p>All is set for the premiere.</p>'
    const enclosures = [
      {
        url: 'https://example.org/downloads/698/download/premiere.jpg?cb=3d7c6da47266c12d',
        type: 'image/jpeg',
      },
      { url: 'http://www.youtube.com/watch?v=-GraOPPwGfA' },
    ]
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-thumbnail="https://i.ytimg.com/vi/-GraOPPwGfA/hqdefault.jpg"
        data-embed-url="https://www.youtube.com/watch?v=-GraOPPwGfA"
        data-embed-id="-GraOPPwGfA"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/-GraOPPwGfA"
      ></div>
      <p>All is set for the premiere.</p>
    `

    expect(await convert(value, enclosures)).toEqualHtml(expected)
  })
})
