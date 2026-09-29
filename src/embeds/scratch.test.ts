import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { scratchEmbedResolver, scratchResolveEmbed } from './scratch.js'

describe('scratchResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the player, the page and the poster from the project id', () => {
      const value = 'https://scratch.mit.edu/projects/1308798589/embed'
      const expected: EmbedResolverResult = {
        provider: 'scratch',
        id: '1308798589',
        src: 'https://scratch.mit.edu/projects/1308798589/embed',
        url: 'https://scratch.mit.edu/projects/1308798589/',
        thumbnail: 'https://cdn2.scratch.mit.edu/get_image/project/1308798589_480x360.png',
        width: 485,
        height: 402,
      }

      expect(scratchResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the legacy spelling onto the current one', () => {
      const value = 'https://scratch.mit.edu/projects/embed/10107550/?autostart=false'
      const expected: EmbedResolverResult = {
        provider: 'scratch',
        id: '10107550',
        src: 'https://scratch.mit.edu/projects/10107550/embed',
        url: 'https://scratch.mit.edu/projects/10107550/',
        thumbnail: 'https://cdn2.scratch.mit.edu/get_image/project/10107550_480x360.png',
        width: 485,
        height: 402,
      }

      expect(scratchResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the project page, which is not the player', () => {
      const value = 'https://scratch.mit.edu/projects/115786700/'

      expect(scratchResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the editor, which names the same project', () => {
      const value = 'https://scratch.mit.edu/projects/115786700/editor'

      expect(scratchResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a studio, which names its own id space', () => {
      const value = 'https://scratch.mit.edu/studios/115786700/embed'

      expect(scratchResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a project id that is not a number', () => {
      const value = 'https://scratch.mit.edu/projects/latest/embed'

      expect(scratchResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a legacy project id that is not a number', () => {
      const value = 'https://scratch.mit.edu/projects/embed/latest/'

      expect(scratchResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a file host, which answers the player route with an image', () => {
      const value = 'https://assets.scratch.mit.edu/projects/1308798589/embed'

      expect(scratchResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the project route below another segment', () => {
      const value = 'https://scratch.mit.edu/x/projects/1/embed'

      expect(scratchResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a segment after the player', () => {
      const value = 'https://scratch.mit.edu/projects/1/embed/extra'

      expect(scratchResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('scratchEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, scratchEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the legacy spelling the share snippet writes', async () => {
      const value = html`
        <iframe
          src="https://scratch.mit.edu/projects/embed/10107550/?autostart=false"
          width="485"
          height="402"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'scratch',
        id: '10107550',
        src: 'https://scratch.mit.edu/projects/10107550/embed',
        url: 'https://scratch.mit.edu/projects/10107550/',
        thumbnail: 'https://cdn2.scratch.mit.edu/get_image/project/10107550_480x360.png',
        width: 485,
        height: 402,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the share snippet box when the carrier declares none', async () => {
      const value = '<iframe src="https://scratch.mit.edu/projects/1308798589/embed"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'scratch',
        id: '1308798589',
        src: 'https://scratch.mit.edu/projects/1308798589/embed',
        url: 'https://scratch.mit.edu/projects/1308798589/',
        thumbnail: 'https://cdn2.scratch.mit.edu/get_image/project/1308798589_480x360.png',
        width: 485,
        height: 402,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the retired alpha host onto the live player', async () => {
      const value = html`
        <iframe
          src="http://alpha.scratch.mit.edu/projects/embed/10007053/?auto_start=0"
          width="602"
          height="502"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'scratch',
        id: '10007053',
        src: 'https://scratch.mit.edu/projects/10007053/embed',
        url: 'https://scratch.mit.edu/projects/10007053/',
        thumbnail: 'https://cdn2.scratch.mit.edu/get_image/project/10007053_480x360.png',
        width: 602,
        height: 502,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value = '<iframe src="https://scratch.mit.edu.evil.test/projects/1/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the player route', async () => {
      const value = '<iframe src="https://evil.test/projects/1/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
