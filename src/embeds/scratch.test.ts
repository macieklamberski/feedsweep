import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { scratchEmbedResolver, scratchResolveEmbed } from './scratch.js'

describe('scratchResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the player, the page and the poster from the project id', () => {
      const value = 'https://scratch.mit.edu/projects/115786700/embed'
      const expected: EmbedResolverResult = {
        provider: 'scratch',
        id: '115786700',
        src: 'https://scratch.mit.edu/projects/115786700/embed',
        url: 'https://scratch.mit.edu/projects/115786700/',
        thumbnail: 'https://cdn2.scratch.mit.edu/get_image/project/115786700_480x360.png',
      }

      expect(scratchResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the legacy spelling onto the current one', () => {
      const value = 'https://scratch.mit.edu/projects/embed/245126828/?autostart=false'
      const expected: EmbedResolverResult = {
        provider: 'scratch',
        id: '245126828',
        src: 'https://scratch.mit.edu/projects/245126828/embed',
        url: 'https://scratch.mit.edu/projects/245126828/',
        thumbnail: 'https://cdn2.scratch.mit.edu/get_image/project/245126828_480x360.png',
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
  })
})

describeForEachParser('scratchEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, scratchEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://scratch.mit.edu/projects/115786700/embed"
          width="485"
          height="402"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'scratch',
        id: '115786700',
        src: 'https://scratch.mit.edu/projects/115786700/embed',
        url: 'https://scratch.mit.edu/projects/115786700/',
        thumbnail: 'https://cdn2.scratch.mit.edu/get_image/project/115786700_480x360.png',
        width: 485,
        height: 402,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value = '<iframe src="https://scratch.mit.edu.evil.test/projects/1/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the project route in its path', async () => {
      const value = '<iframe src="https://evil.test/scratch.mit.edu/projects/1/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
