import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { figmaDirectEmbedResolver, figmaWrappedEmbedResolver } from './figma.js'

describeForEachParser('figmaWrappedEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, figmaWrappedEmbedResolver)

  describe('happy paths', () => {
    it('should name the file the wrapper hides in its url parameter', async () => {
      const value =
        '<iframe src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725%3Fnode-id%3D0%253A2"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'file/UBVMSTz7mhvYogjfdeKcIB',
        src: 'https://embed.figma.com/file/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725?node-id=0%3A2&embed-host=share',
        url: 'https://www.figma.com/file/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725?node-id=0%3A2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the frame the publisher chose and drop the rest of the inner query', async () => {
      const value = html`
        <iframe
          class="figma-embed"
          width="450"
          height="800"
          src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fproto%2FlGZklLSlFA2yjPxmcyykud%2FKarwaan%3Ftype%3Ddesign%26node-id%3D1-2318"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'proto/lGZklLSlFA2yjPxmcyykud',
        src: 'https://embed.figma.com/proto/lGZklLSlFA2yjPxmcyykud/Karwaan?node-id=1-2318&embed-host=share',
        url: 'https://www.figma.com/proto/lGZklLSlFA2yjPxmcyykud/Karwaan?node-id=1-2318',
        width: 450,
        height: 800,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the wrapper path', async () => {
      const value =
        '<iframe src="https://evil.test/www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a host that only looks like figma', async () => {
      const value =
        '<iframe src="https://www.figma.com.evil.test/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a wrapper whose url parameter names a host off figma', async () => {
      const value =
        '<iframe src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fevil.test%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a wrapper stating no url parameter', async () => {
      const value = '<iframe src="https://www.figma.com/embed?embed_host=share"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a figma url outside the wrapper route', async () => {
      const value =
        '<iframe src="https://www.figma.com/files/recent?url=https%3A%2F%2Fwww.figma.com%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('figmaDirectEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, figmaDirectEmbedResolver)

  describe('happy paths', () => {
    it('should rebuild a deck and drop the scaling the reader chooses', async () => {
      const value = html`
        <iframe
          width="800"
          height="450"
          src="https://embed.figma.com/deck/0txckPBPI1OqFNEa9VaKLP/TacTik?node-id=1-540&scaling=min-zoom&embed-host=share"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'deck/0txckPBPI1OqFNEa9VaKLP',
        src: 'https://embed.figma.com/deck/0txckPBPI1OqFNEa9VaKLP/TacTik?node-id=1-540&embed-host=share',
        url: 'https://www.figma.com/deck/0txckPBPI1OqFNEa9VaKLP/TacTik?node-id=1-540',
        width: 800,
        height: 450,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no box of its own for a prototype that declares none', async () => {
      const value =
        '<iframe src="https://embed.figma.com/proto/zMOWWSHAvmHWuk5UqiOchl/Kelpwatch.org?node-id=1-754&embed-host=share"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'proto/zMOWWSHAvmHWuk5UqiOchl',
        src: 'https://embed.figma.com/proto/zMOWWSHAvmHWuk5UqiOchl/Kelpwatch.org?node-id=1-754&embed-host=share',
        url: 'https://www.figma.com/proto/zMOWWSHAvmHWuk5UqiOchl/Kelpwatch.org?node-id=1-754',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a kind beyond the four the feeds carry', async () => {
      const value =
        '<iframe src="https://embed.figma.com/make/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725?embed-host=share"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'make/UBVMSTz7mhvYogjfdeKcIB',
        src: 'https://embed.figma.com/make/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725?embed-host=share',
        url: 'https://www.figma.com/make/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the embed path', async () => {
      const value =
        '<iframe src="https://evil.test/embed.figma.com/deck/0txckPBPI1OqFNEa9VaKLP/TacTik"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a host that only looks like the embed host', async () => {
      const value =
        '<iframe src="https://embed.figma.com.evil.test/deck/0txckPBPI1OqFNEa9VaKLP/TacTik"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should refuse a route word that is not a kind', async () => {
      const value =
        '<iframe src="https://embed.figma.com/best-practices/0txckPBPI1OqFNEa9VaKLP/TacTik"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a slug sitting where the file key belongs', async () => {
      const value = '<iframe src="https://embed.figma.com/deck/guide-to-decks/TacTik"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a community path, whose id space is not a file key', async () => {
      const value =
        '<iframe src="https://embed.figma.com/community/file/1035203688168086460/Material-3-Design-Kit"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the title to enrichment', async () => {
      const value = html`
        <iframe
          src="https://embed.figma.com/board/0txckPBPI1OqFNEa9VaKLP/TacTik?embed-host=share"
          title="TacTik"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'board/0txckPBPI1OqFNEa9VaKLP',
        src: 'https://embed.figma.com/board/0txckPBPI1OqFNEa9VaKLP/TacTik?embed-host=share',
        url: 'https://www.figma.com/board/0txckPBPI1OqFNEa9VaKLP/TacTik',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
