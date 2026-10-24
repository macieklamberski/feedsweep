import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { kickstarterEmbedResolver, kickstarterResolveEmbed } from './kickstarter.js'

describe('kickstarterResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the project card from the card widget url', () => {
      const value = 'https://www.kickstarter.com/projects/78929588/cthulhu-dark/widget/card.html'
      const expected: EmbedResolverResult = {
        provider: 'kickstarter',
        id: '78929588/cthulhu-dark',
        src: 'https://www.kickstarter.com/projects/78929588/cthulhu-dark/widget/card.html',
        url: 'https://www.kickstarter.com/projects/78929588/cthulhu-dark',
        height: 420,
      }

      expect(kickstarterResolveEmbed(value)).toEqual(expected)
    })

    it('should build the pitch video from the video widget url', () => {
      const value =
        'https://www.kickstarter.com/projects/larianstudios/divinity-original-sin-2/widget/video.html'
      const expected: EmbedResolverResult = {
        provider: 'kickstarter',
        id: 'larianstudios/divinity-original-sin-2',
        src: 'https://www.kickstarter.com/projects/larianstudios/divinity-original-sin-2/widget/video.html',
        url: 'https://www.kickstarter.com/projects/larianstudios/divinity-original-sin-2',
        ratio: '16/9',
      }

      expect(kickstarterResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the version the card embed code writes', () => {
      const value =
        'https://www.kickstarter.com/projects/78929588/cthulhu-dark/widget/card.html?v=2'
      const expected: EmbedResolverResult = {
        provider: 'kickstarter',
        id: '78929588/cthulhu-dark',
        src: 'https://www.kickstarter.com/projects/78929588/cthulhu-dark/widget/card.html',
        url: 'https://www.kickstarter.com/projects/78929588/cthulhu-dark',
        height: 420,
      }

      expect(kickstarterResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the creator and the slug as written', () => {
      const value =
        'https://www.kickstarter.com/projects/ConflictRPG/combat-description-cards-for-storytellers-and-gms/widget/video.html'
      const expected: EmbedResolverResult = {
        provider: 'kickstarter',
        id: 'ConflictRPG/combat-description-cards-for-storytellers-and-gms',
        src: 'https://www.kickstarter.com/projects/ConflictRPG/combat-description-cards-for-storytellers-and-gms/widget/video.html',
        url: 'https://www.kickstarter.com/projects/ConflictRPG/combat-description-cards-for-storytellers-and-gms',
        ratio: '16/9',
      }

      expect(kickstarterResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the project page itself', () => {
      const value = 'https://www.kickstarter.com/projects/78929588/cthulhu-dark'

      expect(kickstarterResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the card script, which is not a frame', () => {
      const value = 'https://www.kickstarter.com/projects/78929588/cthulhu-dark/widget/card.js'

      expect(kickstarterResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video widget url cut off before its extension', () => {
      const value =
        'https://www.kickstarter.com/projects/dumbingofage/dumbing-of-age-twelfth-book-collection/widget/video.'

      expect(kickstarterResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget under another route word', () => {
      const value = 'https://www.kickstarter.com/projects/78929588/cthulhu-dark/embed/video.html'

      expect(kickstarterResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget path under another first route word', () => {
      const value = 'https://www.kickstarter.com/creators/78929588/cthulhu-dark/widget/video.html'

      expect(kickstarterResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a segment after the widget', () => {
      const value =
        'https://www.kickstarter.com/projects/78929588/cthulhu-dark/widget/video.html/extra'

      expect(kickstarterResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('kickstarterEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, kickstarterEmbedResolver)

  describe('happy paths', () => {
    it('should take the project name from the video frame title over its declared box', async () => {
      const value = html`
        <iframe
          title="Divinity: Original Sin 2"
          width="480"
          height="360"
          src="https://www.kickstarter.com/projects/larianstudios/divinity-original-sin-2/widget/video.html"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kickstarter',
        id: 'larianstudios/divinity-original-sin-2',
        src: 'https://www.kickstarter.com/projects/larianstudios/divinity-original-sin-2/widget/video.html',
        url: 'https://www.kickstarter.com/projects/larianstudios/divinity-original-sin-2',
        ratio: '16/9',
        title: 'Divinity: Original Sin 2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the card height over its declared box', async () => {
      const value = html`
        <iframe
          width="220"
          height="380"
          src="https://www.kickstarter.com/projects/2081578473/pillars-of-eternity-lords-of-the-eastern-reach-car/widget/card.html?v=2"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kickstarter',
        id: '2081578473/pillars-of-eternity-lords-of-the-eastern-reach-car',
        src: 'https://www.kickstarter.com/projects/2081578473/pillars-of-eternity-lords-of-the-eastern-reach-car/widget/card.html',
        url: 'https://www.kickstarter.com/projects/2081578473/pillars-of-eternity-lords-of-the-eastern-reach-car',
        height: 420,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host serving the widget route', async () => {
      const value =
        '<iframe src="https://evil.test/projects/78929588/cthulhu-dark/widget/video.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read a card url with a doubled slash before the widget', async () => {
      const value =
        '<iframe src="https://www.kickstarter.com/projects/claralehenaff/child-of-the-pyre//widget/card.html?v=2"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'kickstarter',
        id: 'claralehenaff/child-of-the-pyre',
        src: 'https://www.kickstarter.com/projects/claralehenaff/child-of-the-pyre/widget/card.html',
        url: 'https://www.kickstarter.com/projects/claralehenaff/child-of-the-pyre',
        height: 420,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('kickstarter frames the pipeline resolves first', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should resolve a protocol-relative video frame', async () => {
    const value =
      '<iframe src="//www.kickstarter.com/projects/845108579/thanks-to-hank/widget/video.html"></iframe>'
    const expected = html`
      <div
        data-embed-provider="kickstarter"
        data-embed-id="845108579/thanks-to-hank"
        data-embed-url="https://www.kickstarter.com/projects/845108579/thanks-to-hank"
        data-embed-ratio="16/9"
        data-embed-src="https://www.kickstarter.com/projects/845108579/thanks-to-hank/widget/video.html"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
