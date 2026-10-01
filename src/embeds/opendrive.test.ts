import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { opendriveEmbedResolver, opendriveResolveEmbed } from './opendrive.js'

describe('opendriveResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player from the embed url', () => {
      const value = 'https://www.opendrive.com/player/NDZfOTg5NzkzOF9iYXhEWQ'
      const expected: EmbedResolverResult = {
        provider: 'opendrive',
        id: 'NDZfOTg5NzkzOF9iYXhEWQ',
        src: 'https://www.opendrive.com/player/NDZfOTg5NzkzOF9iYXhEWQ',
        url: 'https://od.lk/f/NDZfOTg5NzkzOF9iYXhEWQ',
        height: 25,
      }

      expect(opendriveResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the older unencoded file id on as written', () => {
      const value = 'https://www.opendrive.com/player/244922425_vL40Z'
      const expected: EmbedResolverResult = {
        provider: 'opendrive',
        id: '244922425_vL40Z',
        src: 'https://www.opendrive.com/player/244922425_vL40Z',
        url: 'https://od.lk/f/244922425_vL40Z',
        height: 25,
      }

      expect(opendriveResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the listen route onto the player', () => {
      const value = 'https://www.opendrive.com/listen/NF8xMDAwNzE0MDdfM2dnQ20'
      const expected: EmbedResolverResult = {
        provider: 'opendrive',
        id: 'NF8xMDAwNzE0MDdfM2dnQ20',
        src: 'https://www.opendrive.com/player/NF8xMDAwNzE0MDdfM2dnQ20',
        url: 'https://od.lk/f/NF8xMDAwNzE0MDdfM2dnQ20',
        height: 25,
      }

      expect(opendriveResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the publisher autoplay and tracking', () => {
      const value =
        'https://www.opendrive.com/player/NDZfOTg5NzkzOF9iYXhEWQ?autoplay=1&utm_source=x'
      const expected: EmbedResolverResult = {
        provider: 'opendrive',
        id: 'NDZfOTg5NzkzOF9iYXhEWQ',
        src: 'https://www.opendrive.com/player/NDZfOTg5NzkzOF9iYXhEWQ',
        url: 'https://od.lk/f/NDZfOTg5NzkzOF9iYXhEWQ',
        height: 25,
      }

      expect(opendriveResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a trailing slash', () => {
      const value = 'https://www.opendrive.com/player/NDZfOTg5NzkzOF9iYXhEWQ/'
      const expected: EmbedResolverResult = {
        provider: 'opendrive',
        id: 'NDZfOTg5NzkzOF9iYXhEWQ',
        src: 'https://www.opendrive.com/player/NDZfOTg5NzkzOF9iYXhEWQ',
        url: 'https://od.lk/f/NDZfOTg5NzkzOF9iYXhEWQ',
        height: 25,
      }

      expect(opendriveResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route that is not a player', () => {
      const value = 'https://www.opendrive.com/clip/NDZfOTg5NzkzOF9iYXhEWQ'

      expect(opendriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the download page', () => {
      const value =
        'https://www.opendrive.com/download/OTdfODE2MDkxODJfaFZ0d20?folder_id=OTdfNzA1NjM3NF9zOTJnOA'

      expect(opendriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the route word in another case', () => {
      const value = 'https://www.opendrive.com/PLAYER/NDZfOTg5NzkzOF9iYXhEWQ'

      expect(opendriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route with no file id', () => {
      const value = 'https://www.opendrive.com/player'

      expect(opendriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player path with a trailing segment', () => {
      const value = 'https://www.opendrive.com/player/NDZfOTg5NzkzOF9iYXhEWQ/extra'

      expect(opendriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the file host', () => {
      const value =
        'https://web.opendrive.com/api/v1/download/file.json/NDZfOTg5NzkzOF9iYXhEWQ?inline=1'

      expect(opendriveResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/player/NDZfOTg5NzkzOF9iYXhEWQ'

      expect(opendriveResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('opendriveEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, opendriveEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the audio bar the embed dialog writes', async () => {
      const value = html`
        <iframe
          allowtransparency="true"
          frameborder="0"
          height="25"
          scrolling="no"
          src="https://www.opendrive.com/player/NDZfMjc4OTU5MTVfRTB5SUE"
          style="border: 0;"
          width="297"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'opendrive',
        id: 'NDZfMjc4OTU5MTVfRTB5SUE',
        src: 'https://www.opendrive.com/player/NDZfMjc4OTU5MTVfRTB5SUE',
        url: 'https://od.lk/f/NDZfMjc4OTU5MTVfRTB5SUE',
        height: 25,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the bar height on a carrier with no box', async () => {
      const value = html`
        <iframe src="https://www.opendrive.com/player/NF8xMTIwMzE5OTFfU0pYaWs"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'opendrive',
        id: 'NF8xMTIwMzE5OTFfU0pYaWs',
        src: 'https://www.opendrive.com/player/NF8xMTIwMzE5OTFfU0pYaWs',
        url: 'https://od.lk/f/NF8xMTIwMzE5OTFfU0pYaWs',
        height: 25,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/player/NDZfMjc4OTU5MTVfRTB5SUE"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('opendrive through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave the declared width off the placeholder', async () => {
    const value = html`
      <iframe
        allowtransparency="true"
        frameborder="0"
        height="25"
        scrolling="no"
        src="https://www.opendrive.com/player/NDZfOTI5OTI4OTFfTEdQSGE"
        style="border: 0;"
        width="297"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="opendrive"
        data-embed-id="NDZfOTI5OTI4OTFfTEdQSGE"
        data-embed-src="https://www.opendrive.com/player/NDZfOTI5OTI4OTFfTEdQSGE"
        data-embed-url="https://od.lk/f/NDZfOTI5OTI4OTFfTEdQSGE"
        data-embed-height="25"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave an OpenDrive audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://web.opendrive.com/api/v1/download/file.json/NDZfOTg5NzkzOF9iYXhEWQ?inline=1',
        type: 'audio/mpeg',
      },
    ]
    const expected = html`
      <audio data-enclosure="" controls src="https://web.opendrive.com/api/v1/download/file.json/NDZfOTg5NzkzOF9iYXhEWQ?inline=1"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
