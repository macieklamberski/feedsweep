import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { pinecastEmbedResolver, pinecastResolveEmbed } from './pinecast.js'

describe('pinecastResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player from the episode uuid', () => {
      const value = 'https://pinecast.com/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471'
      const expected: EmbedResolverResult = {
        provider: 'pinecast',
        id: 'fd8fd547-b572-4ff7-ae71-b8c944b7a471',
        src: 'https://pinecast.com/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471',
        height: 60,
      }

      expect(pinecastResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the theme the publisher picked', () => {
      const value = 'https://pinecast.com/player/3bd03284-caa4-49c3-9f6c-c2e65a269b73?theme=thick'
      const expected: EmbedResolverResult = {
        provider: 'pinecast',
        id: '3bd03284-caa4-49c3-9f6c-c2e65a269b73',
        src: 'https://pinecast.com/player/3bd03284-caa4-49c3-9f6c-c2e65a269b73',
        height: 60,
      }

      expect(pinecastResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker on the query', () => {
      const value =
        'https://pinecast.com/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471?utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'pinecast',
        id: 'fd8fd547-b572-4ff7-ae71-b8c944b7a471',
        src: 'https://pinecast.com/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471',
        height: 60,
      }

      expect(pinecastResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a trailing slash', () => {
      const value = 'https://pinecast.com/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471/'
      const expected: EmbedResolverResult = {
        provider: 'pinecast',
        id: 'fd8fd547-b572-4ff7-ae71-b8c944b7a471',
        src: 'https://pinecast.com/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471',
        height: 60,
      }

      expect(pinecastResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the id on as written', () => {
      const value = 'https://pinecast.com/player/FD8FD547-B572-4FF7-AE71-B8C944B7A471'
      const expected: EmbedResolverResult = {
        provider: 'pinecast',
        id: 'FD8FD547-B572-4FF7-AE71-B8C944B7A471',
        src: 'https://pinecast.com/player/FD8FD547-B572-4FF7-AE71-B8C944B7A471',
        height: 60,
      }

      expect(pinecastResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the player route behind another segment', () => {
      const value = 'https://pinecast.com/x/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471'

      expect(pinecastResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route followed by another segment', () => {
      const value = 'https://pinecast.com/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471/extra'

      expect(pinecastResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route with no id', () => {
      const value = 'https://pinecast.com/player/'

      expect(pinecastResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the episode audio file', () => {
      const value =
        'https://pinecast.com/listen/463fa99c-b84c-464e-95fe-d679dd91c938.mp3?source=rss&ext=asset.mp3'

      expect(pinecastResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the podcast playlist player', () => {
      const value = 'https://pinecast.com/embed/player_playlist/testcast'

      expect(pinecastResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pinecastEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pinecastEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the minimal player the publisher pasted', async () => {
      const value = html`
        <iframe
          class="pinecast-embed"
          frameborder="0"
          height="60"
          seamless=""
          src="https://pinecast.com/player/463fa99c-b84c-464e-95fe-d679dd91c938?theme=minimal"
          style="border: 0;"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pinecast',
        id: '463fa99c-b84c-464e-95fe-d679dd91c938',
        src: 'https://pinecast.com/player/463fa99c-b84c-464e-95fe-d679dd91c938',
        height: 60,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should give a taller themed carrier the platform height', async () => {
      const value = html`
        <iframe
          src="https://pinecast.com/player/3bd03284-caa4-49c3-9f6c-c2e65a269b73?theme=thick"
          seamless
          height="200"
          style="border:0"
          class="pinecast-embed"
          frameborder="0"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pinecast',
        id: '3bd03284-caa4-49c3-9f6c-c2e65a269b73',
        src: 'https://pinecast.com/player/3bd03284-caa4-49c3-9f6c-c2e65a269b73',
        height: 60,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the episode name a carrier states', async () => {
      const value = html`
        <iframe
          title="Episode 4: Sister Not Mister"
          src="https://pinecast.com/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471"
          height="60"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pinecast',
        id: 'fd8fd547-b572-4ff7-ae71-b8c944b7a471',
        src: 'https://pinecast.com/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471',
        height: 60,
        title: 'Episode 4: Sister Not Mister',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/player/fd8fd547-b572-4ff7-ae71-b8c944b7a471"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Only the pipeline offers an enclosure to the resolver, and the episode audio lives on the
// player's host.
describeForEachParser('pinecast through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should turn the player iframe into a placeholder', async () => {
    const value = html`
      <iframe
        class="pinecast-embed"
        frameborder="0"
        height="60"
        seamless=""
        src="https://pinecast.com/player/463fa99c-b84c-464e-95fe-d679dd91c938?theme=minimal"
        style="border: 0;"
        width="100%"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-id="463fa99c-b84c-464e-95fe-d679dd91c938"
        data-embed-provider="pinecast"
        data-embed-src="https://pinecast.com/player/463fa99c-b84c-464e-95fe-d679dd91c938"
        data-embed-height="60"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a pinecast audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://pinecast.com/listen/463fa99c-b84c-464e-95fe-d679dd91c938.mp3?source=rss&ext=asset.mp3',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio
        data-enclosure=""
        controls
        src="https://pinecast.com/listen/463fa99c-b84c-464e-95fe-d679dd91c938.mp3?source=rss&amp;ext=asset.mp3"
      ></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
