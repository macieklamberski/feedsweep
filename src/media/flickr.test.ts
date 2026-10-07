import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { flickrMediaResolver } from './flickr.js'

describeForEachParser('flickrMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, flickrMediaResolver)

  describe('happy paths', () => {
    it('should move the retired iphone_wifi route onto 360p', async () => {
      const value = html`
        <video
          src="https://www.flickr.com/photos/jbury/2596355511/play/iphone_wifi/9d99048374/"
          controls
        />
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'https://www.flickr.com/photos/jbury/2596355511/play/360p/9d99048374/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep an NSID owner as written', async () => {
      const value = html`
        <video
          src="https://www.flickr.com/photos/54847721@N00/4364741366/play/iphone_wifi/c510f33749/"
          controls
        />
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'https://www.flickr.com/photos/54847721@N00/4364741366/play/360p/c510f33749/',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <video
          src="https://evil.test/photos/jbury/2596355511/play/iphone_wifi/9d99048374/"
          controls
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the route under a prefixed path', async () => {
      const value = html`
        <video
          src="https://www.flickr.com/x/photos/jbury/2596355511/play/iphone_wifi/9d99048374/"
          controls
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the route with a trailing segment', async () => {
      const value = html`
        <video
          src="https://www.flickr.com/photos/jbury/2596355511/play/iphone_wifi/9d99048374/extra/"
          controls
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('qualities that still play as written', () => {
    it('should leave appletv alone', async () => {
      const value = html`
        <video
          src="https://www.flickr.com/photos/paulav/5182695495/play/appletv/f1b4c13e1d/"
          controls
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave 360p alone', async () => {
      const value = html`
        <video
          src="https://www.flickr.com/photos/naturewoman/14392168940/play/360p/61d915cc45/"
          controls
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave site alone', async () => {
      const value = html`
        <video
          src="https://www.flickr.com/photos/itsff/48644530408/play/site/61926d4b53/"
          controls
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave mobile alone', async () => {
      const value = html`
        <video
          src="https://www.flickr.com/photos/barryhowardstudio/34221758441/play/mobile/19ff1d5195/"
          controls
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('the WordPress Flickr video shortcode', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should move the shortcode video onto 360p through the pipeline', async () => {
    const value = html`
      <div
        class="flick_video"
        style="max-width: 100%;width: 260px;height: 195px;"
      >
        <video
          src="https://www.flickr.com/photos/54847721@N00/4364741366/play/iphone_wifi/c510f33749/"
          controls
        />
      </div>
    `
    const expected =
      '<video controls src="https://www.flickr.com/photos/54847721@N00/4364741366/play/360p/c510f33749/"></video>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a mobile source child as main leaves it', async () => {
    const value = html`
      <video
        width="480"
        height="360"
        style="background-size: 32px; text-align: center;"
        controls="controls"
      >
        <source
          src="https://www.flickr.com/photos/barryhowardstudio/34221758441/play/mobile/19ff1d5195/"
          type="video/mp4"
        />Your browser does not support the video tag.</video>
    `
    const expected =
      '<p><video data-align="center" width="480" height="360" style="background-size: 32px; text-align: center;" controls="controls"><source src="https://www.flickr.com/photos/barryhowardstudio/34221758441/play/mobile/19ff1d5195/" type="video/mp4">Your browser does not support the video tag.</video></p>'

    expect(await convert(value)).toEqualHtml(expected)
  })
})
