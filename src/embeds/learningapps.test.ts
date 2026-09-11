import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { learningappsEmbedResolver, learningappsResolveEmbed } from './learningapps.js'

describe('learningappsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the icon for a numeric exercise', () => {
      const value = 'https://learningapps.org/watch?app=12554379'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: '12554379',
        src: 'https://learningapps.org/watch?app=12554379',
        thumbnail: 'https://learningapps.org/appicons/1/12554379.png',
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })

    it('should map the retired route onto the current one', () => {
      const value = 'https://learningapps.org/show?id=e1j0yk0c'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: 'e1j0yk0c',
        src: 'https://learningapps.org/watch?app=e1j0yk0c',
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route naming no exercise', () => {
      const value = 'https://learningapps.org/watch'

      expect(learningappsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another page of the site naming an id', () => {
      const value = 'https://learningapps.org/index.php?id=12554379'

      expect(learningappsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the exercise parameter on the retired route', () => {
      const value = 'https://learningapps.org/show?app=12554379'

      expect(learningappsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an exercise id carrying a separator', () => {
      const value = 'https://learningapps.org/watch?app=../appicons'

      expect(learningappsResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should leave an alphanumeric exercise without an icon', () => {
      const value = 'https://learningapps.org/watch?app=pwr40fwzn22'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: 'pwr40fwzn22',
        src: 'https://learningapps.org/watch?app=pwr40fwzn22',
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the icon for a numeric id on the retired route', () => {
      const value = 'https://learningapps.org/show?id=12554379'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: '12554379',
        src: 'https://learningapps.org/watch?app=12554379',
        thumbnail: 'https://learningapps.org/appicons/1/12554379.png',
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('learningappsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, learningappsEmbedResolver)

  describe('happy paths', () => {
    it('should keep the height the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://learningapps.org/watch?app=12554379"
          width="100%"
          height="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: '12554379',
        src: 'https://learningapps.org/watch?app=12554379',
        thumbnail: 'https://learningapps.org/appicons/1/12554379.png',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the watch route in its path', async () => {
      const value = '<iframe src="https://evil.test/learningapps.org/watch?app=12554379"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
