import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { canvaEmbedResolver, canvaResolveEmbed } from './canva.js'

describe('canvaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should carry the design id and its share token as one id', () => {
      const value = 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAG0TestOnly/vdojTestTokenOnly00000',
        src: 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view?embed',
        url: 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the watch route of a video design', () => {
      const value = 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/watch?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAG0TestOnly/vdojTestTokenOnly00000',
        src: 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/watch?embed',
        url: 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/watch',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should read the older snippet that names no share token', () => {
      const value = 'https://www.canva.com/design/DAG0TestOnly/view?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAG0TestOnly',
        src: 'https://www.canva.com/design/DAG0TestOnly/view?embed',
        url: 'https://www.canva.com/design/DAG0TestOnly/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should frame the design page the same way as its embed', () => {
      const value =
        'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view?utm_content=DAG0TestOnly&utm_campaign=designshare'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAG0TestOnly/vdojTestTokenOnly00000',
        src: 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view?embed',
        url: 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a design url with no view route', () => {
      const value = 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/edit'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with more segments than a design and its token', () => {
      const value =
        'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/extra/view?embed'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a share token carrying a dot', () => {
      const value = 'https://www.canva.com/design/DAG0TestOnly/token.with.dots/view?embed'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a marketing page', () => {
      const value = 'https://www.canva.com/templates/view'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('canvaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, canvaEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the viewer iframe', async () => {
      const value = html`
        <iframe
          loading="lazy"
          style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none;"
          src="https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view?embed"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAG0TestOnly/vdojTestTokenOnly00000',
        src: 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view?embed',
        url: 'https://www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the design route in its path', async () => {
      const value = html`
        <iframe src="https://evil.test/www.canva.com/design/DAG0TestOnly/vdojTestTokenOnly00000/view?embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
