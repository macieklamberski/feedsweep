import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { heyzineEmbedResolver, heyzineResolveEmbed } from './heyzine.js'

describe('heyzineResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the flipbook id off the viewer url', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should read the spelling without the extension', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route that is not a flipbook', () => {
      const value = 'https://heyzine.com/pricing/4db16f598c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id outside the hexadecimal the viewer writes', () => {
      const value = 'https://heyzine.com/flip-book/zzzzzzzzzz.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the file host, where the flipbook PDF itself lives', () => {
      const value = 'https://cdnm.heyzine.com/files/uploaded/4db16f598c5a1f41c91c75d099f41ea4.pdf'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deeper path under the flipbook', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c/page/2'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('heyzineEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, heyzineEmbedResolver)

  describe('happy paths', () => {
    it('should keep the height the snippet states in its style', async () => {
      const value = html`
        <iframe
          src="https://heyzine.com/flip-book/4db16f598c.html"
          class="fp-iframe"
          style="border: 1px solid lightgray; width: 100%; height: 400px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://heyzine.com.evil.test/flip-book/4db16f598c.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the flipbook route in its path', async () => {
      const value =
        '<iframe src="https://evil.test/heyzine.com/flip-book/4db16f598c.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
