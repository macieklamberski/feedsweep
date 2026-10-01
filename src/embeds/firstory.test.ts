import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { firstoryEmbedResolver, firstoryResolveEmbed } from './firstory.js'

describe('firstoryResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player from the story id', () => {
      const value = 'https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9'
      const expected: EmbedResolverResult = {
        provider: 'firstory',
        id: 'cmm2q46gw0o4d01y9g95lctm9',
        src: 'https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9',
        url: 'https://open.firstory.fm/story/cmm2q46gw0o4d01y9g95lctm9',
        height: 182,
      }

      expect(firstoryResolveEmbed(value)).toEqual(expected)
    })

    it('should move the old host onto the current one', () => {
      const value = 'https://open.firstory.me/embed/story/cmk1xu3df002q01s51t9h9tue'
      const expected: EmbedResolverResult = {
        provider: 'firstory',
        id: 'cmk1xu3df002q01s51t9h9tue',
        src: 'https://open.firstory.fm/embed/story/cmk1xu3df002q01s51t9h9tue',
        url: 'https://open.firstory.fm/story/cmk1xu3df002q01s51t9h9tue',
        height: 182,
      }

      expect(firstoryResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the description flag', () => {
      const value = 'https://open.firstory.me/embed/story/cmm2q46gw0o4d01y9g95lctm9?description=1'
      const expected: EmbedResolverResult = {
        provider: 'firstory',
        id: 'cmm2q46gw0o4d01y9g95lctm9',
        src: 'https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9',
        url: 'https://open.firstory.fm/story/cmm2q46gw0o4d01y9g95lctm9',
        height: 182,
      }

      expect(firstoryResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker on the query', () => {
      const value =
        'https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9?utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'firstory',
        id: 'cmm2q46gw0o4d01y9g95lctm9',
        src: 'https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9',
        url: 'https://open.firstory.fm/story/cmm2q46gw0o4d01y9g95lctm9',
        height: 182,
      }

      expect(firstoryResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a trailing slash', () => {
      const value = 'https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9/'
      const expected: EmbedResolverResult = {
        provider: 'firstory',
        id: 'cmm2q46gw0o4d01y9g95lctm9',
        src: 'https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9',
        url: 'https://open.firstory.fm/story/cmm2q46gw0o4d01y9g95lctm9',
        height: 182,
      }

      expect(firstoryResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the id on as written', () => {
      const value = 'https://open.firstory.fm/embed/story/CMM2Q46GW0O4D01Y9G95LCTM9'
      const expected: EmbedResolverResult = {
        provider: 'firstory',
        id: 'CMM2Q46GW0O4D01Y9G95LCTM9',
        src: 'https://open.firstory.fm/embed/story/CMM2Q46GW0O4D01Y9G95LCTM9',
        url: 'https://open.firstory.fm/story/CMM2Q46GW0O4D01Y9G95LCTM9',
        height: 182,
      }

      expect(firstoryResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the story route behind another segment', () => {
      const value = 'https://open.firstory.fm/x/embed/story/cmm2q46gw0o4d01y9g95lctm9'

      expect(firstoryResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the story route followed by another segment', () => {
      const value = 'https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9/extra'

      expect(firstoryResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the story route with no id', () => {
      const value = 'https://open.firstory.fm/embed/story/'

      expect(firstoryResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the story route in capitals', () => {
      const value = 'https://open.firstory.fm/EMBED/STORY/cmm2q46gw0o4d01y9g95lctm9'

      expect(firstoryResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an unknown route word', () => {
      const value = 'https://open.firstory.fm/embed/clip/cmm2q46gw0o4d01y9g95lctm9'

      expect(firstoryResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the show player', () => {
      const value = 'https://open.firstory.fm/embed/user/clr09edvi002601tzc2jy3cfi'

      expect(firstoryResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('firstoryEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, firstoryEmbedResolver)

  describe('happy paths', () => {
    it('should drop the brand name the snippet writes as the title', async () => {
      const value = html`
        <iframe
          loading="lazy"
          title="Firstory"
          src="https://open.firstory.me/embed/story/cmm2q46gw0o4d01y9g95lctm9?description=1"
          height="180"
          width="100%"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'firstory',
        id: 'cmm2q46gw0o4d01y9g95lctm9',
        src: 'https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9',
        url: 'https://open.firstory.fm/story/cmm2q46gw0o4d01y9g95lctm9',
        height: 182,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read an episode name a carrier states', async () => {
      const value = html`
        <iframe
          title="AIの隠れたコスト"
          src="https://open.firstory.fm/embed/story/cmk1xu3df002q01s51t9h9tue"
          height="182"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'firstory',
        id: 'cmk1xu3df002q01s51t9h9tue',
        src: 'https://open.firstory.fm/embed/story/cmk1xu3df002q01s51t9h9tue',
        url: 'https://open.firstory.fm/story/cmk1xu3df002q01s51t9h9tue',
        height: 182,
        title: 'AIの隠れたコスト',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/embed/story/cmm2q46gw0o4d01y9g95lctm9"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('firstory through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the player iframe into a placeholder', async () => {
    const value = html`
      <iframe
        loading="lazy"
        title="Firstory"
        src="https://open.firstory.me/embed/story/cmm2q46gw0o4d01y9g95lctm9?description=1"
        height="180"
        width="100%"
        frameborder="0"
        scrolling="no"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-id="cmm2q46gw0o4d01y9g95lctm9"
        data-embed-provider="firstory"
        data-embed-src="https://open.firstory.fm/embed/story/cmm2q46gw0o4d01y9g95lctm9"
        data-embed-url="https://open.firstory.fm/story/cmm2q46gw0o4d01y9g95lctm9"
        data-embed-height="182"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
