import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  captivateEmbedResolver,
  captivateResolveEmbed,
  extractCaptivateEmbed,
} from './captivate.js'

describe('extractCaptivateEmbed', () => {
  it('should read an episode player', () => {
    const value = 'https://player.captivate.fm/episode/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6/'
    const expected = { kind: 'episode', id: 'db5bc483-785d-4c8c-9f7b-c0ff2fab72e6' }

    expect(extractCaptivateEmbed(value)).toEqual(expected)
  })

  it('should read a show player', () => {
    const value = 'https://player.captivate.fm/show/7fa2e8ef-c3e0-4d27-aad0-35dad879c65c'
    const expected = { kind: 'show', id: '7fa2e8ef-c3e0-4d27-aad0-35dad879c65c' }

    expect(extractCaptivateEmbed(value)).toEqual(expected)
  })

  // Nothing downstream reads which kind it is, so a kind Captivate adds later reaches the same
  // player instead of falling through to a carrier that has lost its height.
  it('should read a kind the platform has not published yet', () => {
    const value = 'https://player.captivate.fm/clip/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6'
    const expected = { kind: 'clip', id: 'db5bc483-785d-4c8c-9f7b-c0ff2fab72e6' }

    expect(extractCaptivateEmbed(value)).toEqual(expected)
  })

  it('should return undefined for an id that is not a uuid', () => {
    const value = 'https://player.captivate.fm/episode/12345'

    expect(extractCaptivateEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a captivate url that is not a player', () => {
    const value = 'https://captivate.fm/pricing'

    expect(extractCaptivateEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a kind with a digit after the word', () => {
    const value = 'https://player.captivate.fm/episode1/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6'

    expect(extractCaptivateEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a kind with a digit before the word', () => {
    const value = 'https://player.captivate.fm/1episode/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6'

    expect(extractCaptivateEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a first segment that is not a route word', () => {
    const value = 'https://player.captivate.fm/2024/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6'

    expect(extractCaptivateEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(extractCaptivateEmbed(value)).toBeUndefined()
  })
})

describe('captivateResolveEmbed', () => {
  it('should state the fixed player height', () => {
    const value = 'https://player.captivate.fm/episode/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6/'
    const expected: EmbedResolverResult = {
      provider: 'captivate',
      id: 'episode/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6',
      src: 'https://player.captivate.fm/episode/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6',
      height: 200,
    }

    expect(captivateResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a captivate url naming no episode', () => {
    const value = 'https://player.captivate.fm/about'

    expect(captivateResolveEmbed(value)).toBeUndefined()
  })
})

describeForEachParser('captivateEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, captivateEmbedResolver)

  describe('happy paths', () => {
    it('should claim a player iframe and state the fixed height', async () => {
      const value = html`
        <iframe
          src="https://player.captivate.fm/episode/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6/"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'captivate',
        id: 'episode/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6',
        src: 'https://player.captivate.fm/episode/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6',
        height: 200,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // `captivate.fm` admits every subdomain, so a lookalike suffixing the whole domain is what
    // the host gate has to refuse. The path is a real player path, so nothing else can refuse it.
    it('should ignore a lookalike host suffixing the player domain', async () => {
      const value =
        '<iframe src="https://player.captivate.fm.evil.test/episode/db5bc483-785d-4c8c-9f7b-c0ff2fab72e6"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the size a publisher states', () => {
    // The 200 the resolver states is the corpus-typical box, and the publisher's own choice
    // outranks it: they sized the player they actually embedded.
    it('should let the carrier height win over the stated one', async () => {
      const value = html`
        <iframe
          src="https://player.captivate.fm/show/7fa2e8ef-c3e0-4d27-aad0-35dad879c65c"
          width="100%"
          height="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'captivate',
        id: 'show/7fa2e8ef-c3e0-4d27-aad0-35dad879c65c',
        src: 'https://player.captivate.fm/show/7fa2e8ef-c3e0-4d27-aad0-35dad879c65c',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// The url resolver reaches every enclosure a feed carries, and Captivate's episode files sit on
// the same domain as its player one segment deeper, so only the segment count keeps them playable.
describeForEachParser('captivate through the pipeline', (parseHtml) => {
  it('should leave a captivate audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://podcasts.captivate.fm/media/1d2e3f40-aaaa-bbbb-cccc-1234567890ab/episode.mp3',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio
        data-enclosure=""
        controls
        src="https://podcasts.captivate.fm/media/1d2e3f40-aaaa-bbbb-cccc-1234567890ab/episode.mp3"
      ></audio>
      <p>Body</p>
    `

    expect(
      await transformContent('<p>Body</p>', {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com/post',
        enclosures,
      }),
    ).toEqualHtml(expected)
  })
})
