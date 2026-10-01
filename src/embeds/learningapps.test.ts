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
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })

    it('should map the retired route onto the current one', () => {
      const value = 'https://learningapps.org/show?id=e1j0yk0c'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: 'e1j0yk0c',
        src: 'https://learningapps.org/watch?app=e1j0yk0c',
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })

    it('should read the exercise from the video parameter', () => {
      const value = 'http://LearningApps.org/watch?v=pg9hvgqr522'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: 'pg9hvgqr522',
        src: 'https://learningapps.org/watch?app=pg9hvgqr522',
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })

    it('should read the exercise parameter on the retired route', () => {
      const value = 'https://learningapps.org/show?app=12554379'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: '12554379',
        src: 'https://learningapps.org/watch?app=12554379',
        thumbnail: 'https://learningapps.org/appicons/1/12554379.png',
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route naming no exercise', () => {
      const value = 'https://learningapps.org/watch'

      expect(learningappsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another page of the site naming an exercise', () => {
      const value = 'https://learningapps.org/index.php?app=12554379'

      expect(learningappsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a numeric id on the retired parameter', () => {
      const value = 'https://learningapps.org/show?id=12554379'

      expect(learningappsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a numeric id on the video parameter', () => {
      const value = 'https://learningapps.org/watch?v=12554379'

      expect(learningappsResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed exercise id as written, even if the player answers an error', () => {
      const value = 'https://learningapps.org/watch?app=../appicons'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: '../appicons',
        src: 'https://learningapps.org/watch?app=..%2Fappicons',
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep an exercise id carrying an encoded separator as one parameter', () => {
      const value = 'https://learningapps.org/watch?app=abc%26v%3D1'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: 'abc&v=1',
        src: 'https://learningapps.org/watch?app=abc%26v%3D1',
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should leave an alphanumeric exercise without an icon', () => {
      const value = 'https://learningapps.org/watch?app=pwr40fwzn22'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: 'pwr40fwzn22',
        src: 'https://learningapps.org/watch?app=pwr40fwzn22',
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })

    it('should leave a mixed exercise id starting with a digit without an icon', () => {
      const value = 'https://learningapps.org/watch?app=123abc'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: '123abc',
        src: 'https://learningapps.org/watch?app=123abc',
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep an uppercase exercise id as written', () => {
      const value = 'https://learningapps.org/watch?app=PWR40FWZN22'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: 'PWR40FWZN22',
        src: 'https://learningapps.org/watch?app=PWR40FWZN22',
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild a subdomain on the apex, which alone serves the exercise', () => {
      const value = 'https://www.learningapps.org/watch?app=12554379'
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: '12554379',
        src: 'https://learningapps.org/watch?app=12554379',
        thumbnail: 'https://learningapps.org/appicons/1/12554379.png',
        height: 500,
      }

      expect(learningappsResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('learningappsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, learningappsEmbedResolver)

  describe('happy paths', () => {
    it('should keep the height the carrier states in its style', async () => {
      const value = html`
        <iframe
          allowfullscreen="true"
          mozallowfullscreen="true"
          src="https://learningapps.org/watch?v=pnrtbszia17"
          style="border: 0px; height: 500px; width: 100%;"
          webkitallowfullscreen="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: 'pnrtbszia17',
        src: 'https://learningapps.org/watch?app=pnrtbszia17',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the WordPress embed of the retired parameter', async () => {
      const value = html`
        <iframe
          class="wp-embedded-content"
          sandbox="allow-scripts"
          security="restricted"
          title="Empareja a los compositores."
          src="https://LearningApps.org/watch?id=pxg4kgd2a23#?secret=qFkLewnZQq"
          data-secret="qFkLewnZQq"
          frameborder="0"
          width="950"
          height="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'learningapps',
        id: 'pxg4kgd2a23',
        src: 'https://learningapps.org/watch?app=pxg4kgd2a23',
        width: 950,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the watch route', async () => {
      const value = '<iframe src="https://evil.test/watch?app=12554379"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
