import { describe, expect, it } from 'bun:test'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { fixConcatenatedUrls } from './fixConcatenatedUrls.js'

describeForEachParser('fixConcatenatedUrls', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [fixConcatenatedUrls(baseContext)])
  }

  describe('happy paths', () => {
    it('should strip the origin concatenated onto a player url', async () => {
      const value = html`
        <iframe
          width="560"
          height="315"
          src="https://example.com//www.youtube.com/embed/klM_7OkW3Y8"
        ></iframe>
      `
      const expected = html`
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/klM_7OkW3Y8"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the query and the fragment past a tripled slash', async () => {
      const value = html`
        <iframe src="https://www.example.com///e.issuu.com/embed.html?rel=0&wmode=opaque#25168044/57899016"></iframe>
      `
      const expected = html`
        <iframe src="https://e.issuu.com/embed.html?rel=0&wmode=opaque#25168044/57899016"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the scheme the publisher served', async () => {
      const value = html`
        <iframe src="http://www.example.com//www.dailymotion.com/embed/video/x53664j"></iframe>
      `
      const expected = html`
        <iframe src="http://www.dailymotion.com/embed/video/x53664j"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should repair a script and an anchor the same way', async () => {
      const value = html`
        <script async src="http://www.example.com///pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
        <a href="https://example.com//www.youtube.com/watch?v=klM_7OkW3Y8">Watch</a>
      `
      const expected = html`
        <script async src="http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
        <a href="https://www.youtube.com/watch?v=klM_7OkW3Y8">Watch</a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a doubled slash before a plain directory alone', async () => {
      const value = '<img src="https://example.com//images/photo.jpg">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a dotted file name after a doubled slash alone', async () => {
      const value = '<img src="https://example.com//photo.jpg">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a bare host with no path of its own alone', async () => {
      const value = '<a href="https://example.com//www.youtube.com">Watch</a>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a url that is not absolute alone', async () => {
      const value = '<iframe src="//www.youtube.com/embed/klM_7OkW3Y8"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an ordinary url alone', async () => {
      const value = '<iframe src="https://www.youtube.com/embed/klM_7OkW3Y8"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = html`
        <iframe src="https://example.com///www.youtube.com/embed/klM_7OkW3Y8?rel=0"></iframe>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})
