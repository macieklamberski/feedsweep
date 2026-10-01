import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { figmaEmbedResolver } from './figma.js'

describeForEachParser('figmaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, figmaEmbedResolver)

  describe('happy paths', () => {
    it('should name the file the wrapper hides in its url parameter', async () => {
      const value =
        '<iframe src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725%3Fnode-id%3D0%253A2"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'design/UBVMSTz7mhvYogjfdeKcIB',
        src: 'https://embed.figma.com/file/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725?node-id=0%3A2&embed-host=share',
        url: 'https://www.figma.com/file/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725?node-id=0%3A2',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the view type the wrapped url carries', async () => {
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

    it('should keep the page and frame and drop the viewport, scaling and share token', async () => {
      const value = html`
        <iframe
          width="800"
          height="450"
          src="https://www.figma.com/embed?embed_host=share&amp;url=https%3A%2F%2Fwww.figma.com%2Fproto%2FLBH1O9AxQLxp0ixZBd1Pxk%2FUntitled%3Fpage-id%3D0%253A1%26type%3Ddesign%26node-id%3D4-144%26viewport%3D899%252C596%252C0.21%26t%3DpevRWzyXC3YRDvuj-1%26scaling%3Dcontain%26mode%3Ddesign"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'proto/LBH1O9AxQLxp0ixZBd1Pxk',
        src: 'https://embed.figma.com/proto/LBH1O9AxQLxp0ixZBd1Pxk/Untitled?node-id=4-144&page-id=0%3A1&embed-host=share',
        url: 'https://www.figma.com/proto/LBH1O9AxQLxp0ixZBd1Pxk/Untitled?node-id=4-144&page-id=0%3A1',
        width: 800,
        height: 450,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a wrapped url the publisher left unencoded', async () => {
      const value =
        '<iframe src="https://www.figma.com/embed?embed_host=oembed&url=https://www.figma.com/file/dU9A1ZzvtHiirRTBxtADnC/Lighting-Beetle-Figma-Fun?node-id=1:217"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'design/dU9A1ZzvtHiirRTBxtADnC',
        src: 'https://embed.figma.com/file/dU9A1ZzvtHiirRTBxtADnC/Lighting-Beetle-Figma-Fun?node-id=1%3A217&embed-host=share',
        url: 'https://www.figma.com/file/dU9A1ZzvtHiirRTBxtADnC/Lighting-Beetle-Figma-Fun?node-id=1%3A217',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a deck without its scaling', async () => {
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

    it('should keep the node that starts the prototype flow', async () => {
      const value =
        '<iframe src="https://embed.figma.com/proto/zMOWWSHAvmHWuk5UqiOchl/Kelpwatch.org?node-id=1-754&starting-point-node-id=1%3A754&embed-host=share"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'proto/zMOWWSHAvmHWuk5UqiOchl',
        src: 'https://embed.figma.com/proto/zMOWWSHAvmHWuk5UqiOchl/Kelpwatch.org?node-id=1-754&starting-point-node-id=1%3A754&embed-host=share',
        url: 'https://www.figma.com/proto/zMOWWSHAvmHWuk5UqiOchl/Kelpwatch.org?node-id=1-754&starting-point-node-id=1%3A754',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the version a prototype names', async () => {
      const value =
        '<iframe src="https://embed.figma.com/proto/zMOWWSHAvmHWuk5UqiOchl/Kelpwatch.org?node-id=1-754&version-id=2215931418&embed-host=share"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'proto/zMOWWSHAvmHWuk5UqiOchl',
        src: 'https://embed.figma.com/proto/zMOWWSHAvmHWuk5UqiOchl/Kelpwatch.org?node-id=1-754&version-id=2215931418&embed-host=share',
        url: 'https://www.figma.com/proto/zMOWWSHAvmHWuk5UqiOchl/Kelpwatch.org?node-id=1-754&version-id=2215931418',
        ratio: '16/9',
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
        ratio: '16/9',
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
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the wrapper path', async () => {
      const value =
        '<iframe src="https://evil.test/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725"></iframe>'

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

    it('should refuse a wrapper whose url parameter names another figma subdomain', async () => {
      const value =
        '<iframe src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fhelp.figma.com%2Fhc%2Farticles%2F360039827134"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a one-segment figma route that is not the wrapper', async () => {
      const value =
        '<iframe src="https://www.figma.com/login?url=https%3A%2F%2Fwww.figma.com%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path that only starts with the wrapper route', async () => {
      const value =
        '<iframe src="https://www.figma.com/embed/recent?url=https%3A%2F%2Fwww.figma.com%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a file page framed outside the embed host', async () => {
      const value =
        '<iframe src="https://www.figma.com/file/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the embed path', async () => {
      const value = '<iframe src="https://evil.test/deck/0txckPBPI1OqFNEa9VaKLP/TacTik"></iframe>'

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

    it('should refuse a branch path whose segments begin like a file url', async () => {
      const value =
        '<iframe src="https://embed.figma.com/design/UBVMSTz7mhvYogjfdeKcIB/branch/Hm4TCZ7yXNpgP2kD8vLq1e/Red_System_Color-0725?embed-host=share"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a community path carrying its name', async () => {
      const value =
        '<iframe src="https://embed.figma.com/community/file/1035203688168086460/Material-3-Design-Kit"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a community path whose three segments read as a file url', async () => {
      const value =
        '<iframe src="https://embed.figma.com/community/file/1035203688168086460"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should read a wrapped url on the bare figma host', async () => {
      const value =
        '<iframe src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Ffigma.com%2Ffile%2FUBVMSTz7mhvYogjfdeKcIB%2FRed_System_Color-0725"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'figma',
        id: 'design/UBVMSTz7mhvYogjfdeKcIB',
        src: 'https://embed.figma.com/file/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725?embed-host=share',
        url: 'https://www.figma.com/file/UBVMSTz7mhvYogjfdeKcIB/Red_System_Color-0725',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
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
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
