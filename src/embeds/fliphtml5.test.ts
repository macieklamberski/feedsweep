import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { fliphtml5EmbedResolver, fliphtml5ResolveEmbed } from './fliphtml5.js'

describe('fliphtml5ResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the cover and the book page from the account and the book', () => {
      const value = 'https://online.fliphtml5.com/mzsro/jvuq/'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mzsro/jvuq',
        src: 'https://online.fliphtml5.com/mzsro/jvuq/',
        url: 'https://online.fliphtml5.com/mzsro/jvuq/',
        thumbnail: 'https://online.fliphtml5.com/mzsro/jvuq/files/shot.jpg',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the secret the embed form issues', () => {
      const value = 'https://online.fliphtml5.com/mzsro/jvuq/#?secret=t5CbQCavWG'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mzsro/jvuq',
        src: 'https://online.fliphtml5.com/mzsro/jvuq/#?secret=t5CbQCavWG',
        url: 'https://online.fliphtml5.com/mzsro/jvuq/',
        thumbnail: 'https://online.fliphtml5.com/mzsro/jvuq/files/shot.jpg',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the page the reader is sent to', () => {
      const value = 'https://online.fliphtml5.com/mnzqa/bbjl/#p=1'
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mnzqa/bbjl',
        src: 'https://online.fliphtml5.com/mnzqa/bbjl/#p=1',
        url: 'https://online.fliphtml5.com/mnzqa/bbjl/',
        thumbnail: 'https://online.fliphtml5.com/mnzqa/bbjl/files/shot.jpg',
      }

      expect(fliphtml5ResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an account with no book, which the viewer 404s', () => {
      const value = 'https://online.fliphtml5.com/mzsro/'

      expect(fliphtml5ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a per-page asset under the book', () => {
      const value = 'https://online.fliphtml5.com/kgxw/wknu/files/large/2.jpg'

      expect(fliphtml5ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a file under the account, which the book segment never is', () => {
      const value = 'https://online.fliphtml5.com/mzsro/jvuq.pdf'

      expect(fliphtml5ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a separator hidden in the book segment', () => {
      const value = 'https://online.fliphtml5.com/mzsro/jv%2Fuq/'

      expect(fliphtml5ResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the shelf on the apex host', () => {
      const value = 'https://fliphtml5.com/homepage/mzsro/'

      expect(fliphtml5ResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('fliphtml5EmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, fliphtml5EmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the embed block declares', async () => {
      const value = html`
        <iframe
          src="https://online.fliphtml5.com/mzsro/jvuq/#?secret=t5CbQCavWG"
          width="640"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'fliphtml5',
        id: 'mzsro/jvuq',
        src: 'https://online.fliphtml5.com/mzsro/jvuq/#?secret=t5CbQCavWG',
        url: 'https://online.fliphtml5.com/mzsro/jvuq/',
        thumbnail: 'https://online.fliphtml5.com/mzsro/jvuq/files/shot.jpg',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the viewer in its path', async () => {
      const value = '<iframe src="https://evil.test/online.fliphtml5.com/mzsro/jvuq/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
