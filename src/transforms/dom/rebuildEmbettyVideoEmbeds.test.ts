import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildEmbettyVideoEmbeds } from './rebuildEmbettyVideoEmbeds.js'

describeForEachParser('rebuildEmbettyVideoEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildEmbettyVideoEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild a youtube iframe from a youtube type', async () => {
      const value = html`
        <embetty-video
          video-id="4BVmeh0pNnQ"
          type="youtube"
        ></embetty-video>
      `
      const expected = '<iframe src="https://www.youtube.com/embed/4BVmeh0pNnQ"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a vimeo iframe from a vimeo type', async () => {
      const value = html`
        <embetty-video
          type="vimeo"
          video-id="232524527"
        ></embetty-video>
      `
      const expected = '<iframe src="https://player.vimeo.com/video/232524527"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should carry a youtube start-at into the start param', async () => {
      const value = html`
        <embetty-video
          type="youtube"
          video-id="77V-7LzMBY8"
          start-at="90"
        ></embetty-video>
      `
      const expected = '<iframe src="https://www.youtube.com/embed/77V-7LzMBY8?start=90"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should carry a vimeo start-at into the time fragment as written', async () => {
      const value = html`
        <embetty-video
          type="vimeo"
          video-id="232524527"
          start-at="90"
        ></embetty-video>
      `
      const expected = '<iframe src="https://player.vimeo.com/video/232524527#t=90"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a facebook video plugin from a facebook type', async () => {
      const value = html`
        <embetty-video
          type="facebook"
          video-id="10153231379946729"
        ></embetty-video>
      `
      const expected =
        '<iframe src="https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=10153231379946729"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('poster-image', () => {
    it('should carry the poster onto the iframe as its thumbnail', async () => {
      const value = html`
        <embetty-video
          type="vimeo"
          video-id="232524527"
          poster-image="https://example.com/poster.jpg"
        ></embetty-video>
      `
      const expected = html`
        <iframe
          src="https://player.vimeo.com/video/232524527"
          data-thumbnail="https://example.com/poster.jpg"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should carry no thumbnail from an empty poster-image', async () => {
      const value = html`
        <embetty-video
          type="vimeo"
          video-id="232524527"
          poster-image=""
        ></embetty-video>
      `
      const expected = '<iframe src="https://player.vimeo.com/video/232524527"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave an empty video-id alone', async () => {
      const value = html`
        <embetty-video
          type="youtube"
          video-id=""
        ></embetty-video>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an element with no type alone', async () => {
      const value = '<embetty-video video-id="4BVmeh0pNnQ"></embetty-video>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should read the type in any case', async () => {
      const value = html`
        <embetty-video
          type="YouTube"
          video-id="4BVmeh0pNnQ"
        ></embetty-video>
      `
      const expected = '<iframe src="https://www.youtube.com/embed/4BVmeh0pNnQ"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a start-at of zero as written', async () => {
      const value = html`
        <embetty-video
          type="youtube"
          video-id="4BVmeh0pNnQ"
          start-at="0"
        ></embetty-video>
      `
      const expected = '<iframe src="https://www.youtube.com/embed/4BVmeh0pNnQ?start=0"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop a facebook start-at, which its player takes no start from', async () => {
      const value = html`
        <embetty-video
          type="facebook"
          video-id="10153231379946729"
          start-at="90"
        ></embetty-video>
      `
      const expected =
        '<iframe src="https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=10153231379946729"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should build the player from a video-id as written, without checking it', async () => {
      const value = html`
        <embetty-video
          type="youtube"
          video-id="not-a-video"
        ></embetty-video>
      `
      const expected = '<iframe src="https://www.youtube.com/embed/not-a-video"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a video-id holding a slash inside one path segment', async () => {
      const value = html`
        <embetty-video
          type="vimeo"
          video-id="../232524527"
        ></embetty-video>
      `
      const expected = '<iframe src="https://player.vimeo.com/video/..%2F232524527"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the default pipeline', () => {
    it('should produce a youtube placeholder end to end', async () => {
      const value = html`
        <embetty-video
          video-id="4BVmeh0pNnQ"
          type="youtube"
        ></embetty-video>
      `
      const expected = html`
        <div
          data-embed-thumbnail="https://i.ytimg.com/vi/4BVmeh0pNnQ/hqdefault.jpg"
          data-embed-ratio="16/9"
          data-embed-url="https://www.youtube.com/watch?v=4BVmeh0pNnQ"
          data-embed-id="4BVmeh0pNnQ"
          data-embed-provider="youtube"
          data-embed-src="https://www.youtube.com/embed/4BVmeh0pNnQ"
        >
        </div>
      `
      const result = await transformContent(value, {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com',
      })

      expect(result).toEqualHtml(expected)
    })

    it('should produce a vimeo placeholder end to end', async () => {
      const value = html`
        <embetty-video
          type="vimeo"
          video-id="232524527"
        ></embetty-video>
      `
      const expected = html`
        <div
          data-embed-url="https://vimeo.com/232524527"
          data-embed-src="https://player.vimeo.com/video/232524527"
          data-embed-ratio="16/9"
          data-embed-provider="vimeo"
          data-embed-id="232524527"
        >
        </div>
      `
      const result = await transformContent(value, {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com',
      })

      expect(result).toEqualHtml(expected)
    })

    it('should produce a facebook placeholder end to end', async () => {
      const value = html`
        <embetty-video
          type="facebook"
          video-id="10153231379946729"
        ></embetty-video>
      `
      const expected = html`
        <div
          data-embed-ratio="16/9"
          data-embed-url="https://www.facebook.com/watch/?v=10153231379946729"
          data-embed-id="https://www.facebook.com/video.php?v=10153231379946729"
          data-embed-provider="facebook"
          data-embed-src="https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=10153231379946729"
        >
        </div>
      `
      const result = await transformContent(value, {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com',
      })

      expect(result).toEqualHtml(expected)
    })

    it('should put the poster over the youtube thumbnail end to end', async () => {
      const value = html`
        <embetty-video
          type="youtube"
          video-id="4BVmeh0pNnQ"
          poster-image="/images/poster.jpg"
        ></embetty-video>
      `
      const expected = html`
        <div
          data-embed-ratio="16/9"
          data-embed-thumbnail="https://example.com/images/poster.jpg"
          data-embed-url="https://www.youtube.com/watch?v=4BVmeh0pNnQ"
          data-embed-id="4BVmeh0pNnQ"
          data-embed-provider="youtube"
          data-embed-src="https://www.youtube.com/embed/4BVmeh0pNnQ"
        >
        </div>
      `
      const result = await transformContent(value, {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com/post',
      })

      expect(result).toEqualHtml(expected)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <embetty-video
        type="youtube"
        video-id="4BVmeh0pNnQ"
      ></embetty-video>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
