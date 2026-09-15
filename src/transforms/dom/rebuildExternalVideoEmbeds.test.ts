import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildExternalVideoEmbeds } from './rebuildExternalVideoEmbeds.js'

describeForEachParser('rebuildExternalVideoEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildExternalVideoEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild a YouTube config as the player frame at its stated size', async () => {
      const value = html`
        <div style="text-align:center;">
          <script type="text/javascript">extVideoConfig = {"width":"480","height":"320","url":"http://www.youtube.com/watch?feature=youtube_gdata&v=yoOT0NiydEA"};</script>
          <script
            type="text/javascript"
            src="https://blog.seesaa.jp/contents/js/external_video.js"
          ></script>
        </div>
      `
      const expected = html`
        <div style="text-align:center;">
          <iframe
            src="https://www.youtube.com/embed/yoOT0NiydEA"
            width="480"
            height="320"
          ></iframe>
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a Nicovideo config onto its embed route', async () => {
      const value = html`
        <script type="text/javascript">extVideoConfig = {"width":"480","url":"https://www.nicovideo.jp/watch/sm9","height":"320"};</script>
        <script
          type="text/javascript"
          src="http://blog.sakura.ne.jp/contents/js/external_video.js"
        ></script>
      `
      const expected = html`
        <iframe
          src="https://embed.nicovideo.jp/watch/sm9"
          width="480"
          height="320"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should pair each loader with the config written before it', async () => {
      const value = html`
        <script>extVideoConfig = {"url":"https://www.youtube.com/watch?v=yoOT0NiydEA"};</script>
        <script src="https://blog.seesaa.jp/contents/js/external_video.js"></script>
        <p>Between</p>
        <script>extVideoConfig = {"url":"https://www.youtube.com/watch?v=bG39BBff10E"};</script>
        <script src="https://blog.seesaa.jp/contents/js/external_video.js"></script>
      `
      const expected = html`
        <iframe src="https://www.youtube.com/embed/yoOT0NiydEA"></iframe>
        <p>Between</p>
        <iframe src="https://www.youtube.com/embed/bG39BBff10E"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a loader with no config before it alone', async () => {
      const value = '<script src="https://blog.seesaa.jp/contents/js/external_video.js"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a config naming a host neither module claims alone', async () => {
      const value = html`
        <script>extVideoConfig = {"url":"https://example.com/watch?v=yoOT0NiydEA"};</script>
        <script src="https://blog.seesaa.jp/contents/js/external_video.js"></script>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a config that is not JSON alone', async () => {
      const value = html`
        <script>extVideoConfig = {width: 480, url: "https://www.youtube.com/watch?v=yoOT0NiydEA"};</script>
        <script src="https://blog.seesaa.jp/contents/js/external_video.js"></script>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = html`
        <script>extVideoConfig = {"width":"480","height":"320","url":"https://www.youtube.com/watch?v=yoOT0NiydEA"};</script>
        <script src="https://blog.seesaa.jp/contents/js/external_video.js"></script>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

// The rebuilt frame is only worth its place once the YouTube resolver has claimed it, which is
// what the lost video comes back as.
describeForEachParser('rebuildExternalVideoEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should bring the video back as a YouTube placeholder', async () => {
    const value = html`
      <p>こちらが動画での田んぼの様子です。<script type="text/javascript">extVideoConfig = {"width":"480","url":"https://www.youtube.com/watch?v=bG39BBff10E","height":"320"};</script>
        <script
          type="text/javascript"
          src="http://blog.sakura.ne.jp/contents/js/external_video.js"
        ></script>
        <br /><br />新米のおにぎりが待ちどおしいです</p>
    `
    const expected = html`
      <p>こちらが動画での田んぼの様子です。</p>
      <div
        data-embed-ratio="16/9"
        data-embed-thumbnail="https://i.ytimg.com/vi/bG39BBff10E/hqdefault.jpg"
        data-embed-url="https://www.youtube.com/watch?v=bG39BBff10E"
        data-embed-id="bG39BBff10E"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/bG39BBff10E"
      ></div>
      <p>新米のおにぎりが待ちどおしいです</p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
