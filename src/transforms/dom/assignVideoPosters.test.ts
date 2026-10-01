import { expect, it } from 'bun:test'
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
