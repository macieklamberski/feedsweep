import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { convertAsciinemaEmbeds } from './convertAsciinemaEmbeds.js'

describeForEachParser('convertAsciinemaEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [convertAsciinemaEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should replace the loader with the linked static render', async () => {
      const value = html`
        <script
          id="asciicast-RfVtJfuoplCMZd50vESXbOAFR"
          src="https://asciinema.org/a/RfVtJfuoplCMZd50vESXbOAFR.js"
          async
        ></script>
      `
      const expected = html`
        <a href="https://asciinema.org/a/RfVtJfuoplCMZd50vESXbOAFR">
          <img src="https://asciinema.org/a/RfVtJfuoplCMZd50vESXbOAFR.svg" />
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read a loader url carrying a query', async () => {
      const value = '<script src="https://asciinema.org/a/14.js?autoplay=1"></script>'
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a loader on a lookalike host alone', async () => {
      const value = '<script src="https://notasciinema.org/a/abc123.js"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a foreign host carrying the asciinema path alone', async () => {
      const value = '<script src="https://evil.test/asciinema.org/a/abc123.js"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cast file that is not the loader alone', async () => {
      const value = '<script src="https://asciinema.org/a/14.json"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a loader path nested under another path alone', async () => {
      const value = '<script src="https://asciinema.org/a/x/a/abc123.js"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should use a malformed cast id as written, even if the image answers an error', async () => {
      const value = '<script src="https://asciinema.org/a/..%2Fsettings.js"></script>'
      const expected =
        '<a href="https://asciinema.org/a/..%2Fsettings"><img src="https://asciinema.org/a/..%2Fsettings.svg"></a>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the publisher fallback beside the loader', () => {
    it('should drop a noscript fallback after the loader', async () => {
      const value = html`
        <script src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.js"></script>
        <noscript>
          <a href="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc">
            <img src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg" />
          </a>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc">
          <img src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg" />
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop a noscript fallback before the loader', async () => {
      const value = html`
        <noscript>
          <a href="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc">
            <img src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg" />
          </a>
        </noscript>
        <script
          id="asciicast-BPHdyM6hxcqK0smZc4sq2MxOc"
          src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.js"
        ></script>
      `
      const expected = html`
        <a href="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc">
          <img src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg" />
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop a bare linked render after the loader', async () => {
      const value = html`
        <script src="https://asciinema.org/a/oKB78YxZxggoyl2ruKPJcY1zO.js" async></script>
        <a href="https://asciinema.org/a/oKB78YxZxggoyl2ruKPJcY1zO" target="_blank">
          <img src="https://asciinema.org/a/oKB78YxZxggoyl2ruKPJcY1zO.svg" />
        </a>
      `
      const expected = html`
        <a href="https://asciinema.org/a/oKB78YxZxggoyl2ruKPJcY1zO">
          <img src="https://asciinema.org/a/oKB78YxZxggoyl2ruKPJcY1zO.svg" />
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop a fallback naming the older png render', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <a href="https://asciinema.org/a/14"><img src="https://asciinema.org/a/14.png" /></a>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should carry the fallback image alt across', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <a href="https://asciinema.org/a/14">
            <img
              src="https://asciinema.org/a/14.svg"
              alt="Building the project from a clean checkout"
            />
          </a>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img
            src="https://asciinema.org/a/14.svg"
            alt="Building the project from a clean checkout"
          />
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a noscript showing a different image', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <img
            src="https://example.com/chart.png"
            width="140"
            height="300"
            alt="Sales"
          />
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <noscript>
          <img
            src="https://example.com/chart.png"
            width="140"
            height="300"
            alt="Sales"
          />
        </noscript>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a noscript showing a different cast', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <a href="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc">
            <img
              src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg"
              alt="Another session"
            />
          </a>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <noscript>
          <a href="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc">
            <img
              src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg"
              alt="Another session"
            />
          </a>
        </noscript>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep an unlinked noscript render of a different cast', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <img
            src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg"
            alt="Another session"
          />
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <noscript>
          <img
            src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg"
            alt="Another session"
          />
        </noscript>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a fallback carrying its own text', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <a href="https://asciinema.org/a/14">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
          <p>Recorded while building the project from a clean checkout.</p>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <noscript>
          <a href="https://asciinema.org/a/14">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
          <p>Recorded while building the project from a clean checkout.</p>
        </noscript>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a fallback linking the render elsewhere', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <a href="https://example.com/demo">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <noscript>
          <a href="https://example.com/demo">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
        </noscript>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a bare link taking the render elsewhere', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <a href="https://example.com/demo">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <a href="https://example.com/demo">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a fallback with a second link elsewhere', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <a href="https://asciinema.org/a/14">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
          <a href="https://example.com/">
            <img src="https://example.com/badge.svg" />
          </a>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <noscript>
          <a href="https://asciinema.org/a/14">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
          <a href="https://example.com/">
            <img src="https://example.com/badge.svg" />
          </a>
        </noscript>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a fallback linking a foreign host carrying the cast path', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <a href="https://evil.test/a/14">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <noscript>
          <a href="https://evil.test/a/14">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
        </noscript>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a fallback linking a cast path nested under another path', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <a href="https://asciinema.org/x/a/14">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <noscript>
          <a href="https://asciinema.org/x/a/14">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
        </noscript>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a fallback linking a page below the cast', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <noscript>
          <a href="https://asciinema.org/a/14/comments">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
        </noscript>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <noscript>
          <a href="https://asciinema.org/a/14/comments">
            <img src="https://asciinema.org/a/14.svg" />
          </a>
        </noscript>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the render of the loader before it', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <script src="https://asciinema.org/a/oKB78YxZxggoyl2ruKPJcY1zO.js"></script>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <a href="https://asciinema.org/a/oKB78YxZxggoyl2ruKPJcY1zO">
          <img src="https://asciinema.org/a/oKB78YxZxggoyl2ruKPJcY1zO.svg" />
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a paragraph showing the same render', async () => {
      const value = html`
        <script src="https://asciinema.org/a/14.js"></script>
        <p>The session: <img src="https://asciinema.org/a/14.svg" /></p>
      `
      const expected = html`
        <a href="https://asciinema.org/a/14">
          <img src="https://asciinema.org/a/14.svg" />
        </a>
        <p>The session: <img src="https://asciinema.org/a/14.svg" /></p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = '<script src="https://asciinema.org/a/RfVtJfuoplCMZd50vESXbOAFR.js"></script>'
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('convertAsciinemaEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the recording as its linked render', async () => {
    const value = html`
      <p>Watch:</p>
      <script
        id="asciicast-RfVtJfuoplCMZd50vESXbOAFR"
        src="https://asciinema.org/a/RfVtJfuoplCMZd50vESXbOAFR.js"
        async
      ></script>
    `
    const expected = html`
      <p>Watch:</p>
      <a href="https://asciinema.org/a/RfVtJfuoplCMZd50vESXbOAFR">
        <img src="https://asciinema.org/a/RfVtJfuoplCMZd50vESXbOAFR.svg" />
      </a>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should show the render once when the noscript fallback comes first', async () => {
    const value = html`
      <noscript>
        <a href="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc">
          <img src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg" />
        </a>
      </noscript>
      <script
        id="asciicast-BPHdyM6hxcqK0smZc4sq2MxOc"
        src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.js"
      ></script>
    `
    const expected = html`
      <a href="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc">
        <img src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg" />
      </a>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
