import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { pixivScriptEmbedResolver } from './pixiv.js'

describeForEachParser('pixivScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pixivScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the frame at the size the loader names, with the credits', async () => {
      const value = html`
        <script
          src="http://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="small"
          data-border="on"
          charset="utf-8"
        ></script>
        <noscript>
          <p>
            <a href="http://www.pixiv.net/member_illust.php?mode=medium&illust_id=45958594">A work</a>
            by <a href="http://www.pixiv.net/member.php?id=463194">An artist</a>
            on <a href="http://www.pixiv.net/">pixiv</a>
          </p>
        </noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 220,
        height: 250,
        title: 'A work',
        author: 'An artist',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build a borderless medium frame without credits', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="medium"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=medium&border=off',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 360,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should take the smallest frame when the loader names no size', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=off',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 190,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave another publishers block beside the loader alone', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
        ></script>
        <noscript><p><a href="https://example.com/a">Enable scripts</a></p></noscript>
      `
      const expected: EmbedResolverResult = {
        provider: 'pixiv',
        id: '45958594_2a40c2e14793e84b2a7d7d6ecc7cde12',
        src: 'https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=off',
        url: 'https://www.pixiv.net/artworks/45958594',
        width: 190,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a work id outside its alphabet', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="../other"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a size the loader does not know', async () => {
      const value = html`
        <script
          src="https://source.pixiv.net/source/embed.js"
          data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
          data-size="huge"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The loader is a script the whole run drops and the credits sit in a noscript, so only the
// pipeline shows the two folding into one placeholder.
describeForEachParser('pixivScriptEmbedResolver through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should fold the loader and its credits into one placeholder', async () => {
    const value = html`
      <p>before</p>
      <script
        src="http://source.pixiv.net/source/embed.js"
        data-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
        data-size="small"
        data-border="on"
      ></script>
      <noscript><p><a href="http://www.pixiv.net/member_illust.php?mode=medium&illust_id=45958594">A work</a> by <a href="http://www.pixiv.net/member.php?id=463194">An artist</a> on <a href="http://www.pixiv.net/">pixiv</a></p></noscript>
    `
    const expected = html`
      <p>before</p>
      <div
        data-embed-provider="pixiv"
        data-embed-id="45958594_2a40c2e14793e84b2a7d7d6ecc7cde12"
        data-embed-src="https://embed.pixiv.net/embed_mk2.php?id=45958594_2a40c2e14793e84b2a7d7d6ecc7cde12&size=small&border=on"
        data-embed-url="https://www.pixiv.net/artworks/45958594"
        data-embed-width="220"
        data-embed-height="250"
        data-embed-title="A work"
        data-embed-author="An artist"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
