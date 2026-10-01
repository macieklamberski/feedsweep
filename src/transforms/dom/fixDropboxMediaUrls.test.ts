import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { fixDropboxMediaUrls } from './fixDropboxMediaUrls.js'

describeForEachParser('fixDropboxMediaUrls', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [fixDropboxMediaUrls(context)])
  }

  it('should drop the download flag and ask for the raw file', async () => {
    const value = '<audio src="https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?dl=1"></audio>'
    const expected = '<audio src="https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?raw=1"></audio>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should drop the preview flag as well', async () => {
    const value = '<audio src="https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?dl=0"></audio>'
    const expected = '<audio src="https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?raw=1"></audio>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the share key on the current route', async () => {
    const value = html`
      <source src="https://www.dropbox.com/scl/fi/cw5wkz/Marcha.mp3?rlkey=ts97wmy3xk">
    `
    const expected = html`
      <source src="https://www.dropbox.com/scl/fi/cw5wkz/Marcha.mp3?rlkey=ts97wmy3xk&raw=1">
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should repair a bare share url with no query at all', async () => {
    const value = '<video src="https://www.dropbox.com/s/4x6qs14/clip.mp4"></video>'
    const expected = '<video src="https://www.dropbox.com/s/4x6qs14/clip.mp4?raw=1"></video>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a download anchor alone, where the flag is the right one', async () => {
    const value = html`
      <p><a href="https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?dl=1">Download</a></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave the direct file host alone, which already serves the bytes', async () => {
    const value = '<audio src="https://dl.dropboxusercontent.com/s/3xkz/01.wav"></audio>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a route that is not a share alone', async () => {
    const value = '<audio src="https://www.dropbox.com/home/Music/01.wav"></audio>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a lookalike host alone', async () => {
    const value = '<audio src="https://dropbox.com.evil.test/s/3xkz/01.wav"></audio>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a foreign host naming the share route in its path alone', async () => {
    const value = '<audio src="https://evil.test/www.dropbox.com/s/3xkz/01.wav"></audio>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = '<audio src="https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?dl=1"></audio>'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('dropbox media through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
      heuristics: true,
    })
  }

  it('should repair the enclosure the feed carries, not only the body', async () => {
    const value = '<p>Body text</p>'
    const enclosures = [
      { url: 'https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?dl=1', type: 'audio/mpeg' },
    ]
    const expected = html`
      <audio
        controls
        src="https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?raw=1"
      ></audio>
      <p>Body text</p>
    `

    expect(await convert(value, enclosures)).toEqualHtml(expected)
  })

  it('should still fold an enclosure the body already carries', async () => {
    const value = '<audio src="https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?dl=1"></audio>'
    const enclosures = [
      { url: 'https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?dl=1', type: 'audio/mpeg' },
    ]
    const expected = '<audio src="https://www.dropbox.com/s/3xkzmaf5ws3142v/01.wav?raw=1"></audio>'

    expect(await convert(value, enclosures)).toEqualHtml(expected)
  })
})
