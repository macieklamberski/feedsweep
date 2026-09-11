import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { convertAsciinemaEmbeds } from './convertAsciinemaEmbeds.js'

describeForEachParser('convertAsciinemaEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [convertAsciinemaEmbeds(baseContext)])
  }

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

  it('should drop the noscript fallback naming the same render', async () => {
    const value = html`
      <script src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.js"></script>
      <noscript>
        <a href="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc">
          <img
            style="width: 100%"
            src="https://asciinema.org/a/BPHdyM6hxcqK0smZc4sq2MxOc.svg"
          />
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

  it('should leave a script on the host that names no cast alone', async () => {
    const value = '<script src="https://asciinema.org/a.js"></script>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = '<script src="https://asciinema.org/a/RfVtJfuoplCMZd50vESXbOAFR.js"></script>'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
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
})
