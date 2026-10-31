import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { imgflipEmbedResolver } from './imgflip.js'

describeForEachParser('imgflipEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, imgflipEmbedResolver)

  describe('happy paths', () => {
    it('should build the GIF frame from the embed dialog frame at its own box', async () => {
      const value = html`
        <iframe
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          src="https://imgflip.com/embed/5ns8ip"
          width="360"
          height="202"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'imgflip',
        id: '5ns8ip',
        src: 'https://imgflip.com/embed/5ns8ip',
        url: 'https://imgflip.com/gif/5ns8ip',
        thumbnail: 'https://i.imgflip.com/2/5ns8ip.jpg',
        width: 360,
        height: 202,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the box of a square GIF', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="398"
          src="https://imgflip.com/embed/5gh77x"
          style="height: 100%; left: 0; position: absolute; top: 0; width: 100%;"
          width="398"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'imgflip',
        id: '5gh77x',
        src: 'https://imgflip.com/embed/5gh77x',
        url: 'https://imgflip.com/gif/5gh77x',
        thumbnail: 'https://i.imgflip.com/2/5gh77x.jpg',
        width: 398,
        height: 398,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state 16:9 for a frame that declares no box', async () => {
      const value = '<iframe src="https://imgflip.com/embed/1dp0s5"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'imgflip',
        id: '1dp0s5',
        src: 'https://imgflip.com/embed/1dp0s5',
        url: 'https://imgflip.com/gif/1dp0s5',
        thumbnail: 'https://i.imgflip.com/2/1dp0s5.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should accept a trailing slash', async () => {
      const value = '<iframe src="https://imgflip.com/embed/1dp0s5/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'imgflip',
        id: '1dp0s5',
        src: 'https://imgflip.com/embed/1dp0s5',
        url: 'https://imgflip.com/gif/1dp0s5',
        thumbnail: 'https://i.imgflip.com/2/1dp0s5.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass an id as written', async () => {
      const value = '<iframe src="https://imgflip.com/embed/1DP0S5x"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'imgflip',
        id: '1DP0S5x',
        src: 'https://imgflip.com/embed/1DP0S5x',
        url: 'https://imgflip.com/gif/1DP0S5x',
        thumbnail: 'https://i.imgflip.com/2/1DP0S5x.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/1dp0s5"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed path under another prefix', async () => {
      const value = '<iframe src="https://imgflip.com/x/embed/1dp0s5"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed path with a trailing segment', async () => {
      const value = '<iframe src="https://imgflip.com/embed/1dp0s5/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another route word', async () => {
      const value = '<iframe src="https://imgflip.com/clip/1dp0s5"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('imgflip snippets through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should replace the embed dialog snippet and keep its credit link', async () => {
    const value = html`
      <div style="max-width: 100%; width: 398px;">
        <div style="height: 0px; padding-bottom: 100%; position: relative;">
          <iframe frameborder="0" height="398" src="https://imgflip.com/embed/5gh77x" style="height: 100%; left: 0; position: absolute; top: 0; width: 100%;" width="398"></iframe>
        </div>
        <p><a href="https://imgflip.com/gif/5gh77x">via Imgflip</a></p>
      </div>
    `
    const expected = html`
      <div
        data-embed-height="398"
        data-embed-width="398"
        data-embed-thumbnail="https://i.imgflip.com/2/5gh77x.jpg"
        data-embed-url="https://imgflip.com/gif/5gh77x"
        data-embed-id="5gh77x"
        data-embed-provider="imgflip"
        data-embed-src="https://imgflip.com/embed/5gh77x"
      ></div>
      <p><a href="https://imgflip.com/gif/5gh77x">via Imgflip</a></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave an imgflip video enclosure playable', async () => {
    const enclosures = [{ url: 'https://i.imgflip.com/1dp0s5.mp4', type: 'video/mp4' }]

    const expected = html`
      <video data-enclosure="" controls src="https://i.imgflip.com/1dp0s5.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
