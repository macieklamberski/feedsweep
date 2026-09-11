import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { brEmbedResolver } from './br.js'

describeForEachParser('brEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, brEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from a bare media token', async () => {
      const value = html`<iframe src="https://www.br.de/mediathek/embed/av:5dc03b7808e85c001af059a0"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'br',
        id: 'av:5dc03b7808e85c001af059a0',
        src: 'https://www.br.de/mediathek/embed/av:5dc03b7808e85c001af059a0',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the token past the slug written in front of it', async () => {
      const value = html`
        <iframe
          style="left:0;right:0;bottom:0;top:0;border:0;height:100%;width:100%;"
          src="https://www.br.de/mediathek/embed/kampf-ums-wasserloch-sind-wir-der-hitze-gewachsen-av:5d3a1510906784001320f781"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'br',
        id: 'av:5d3a1510906784001320f781',
        src: 'https://www.br.de/mediathek/embed/av:5d3a1510906784001320f781',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the playback options the publisher wrote on the frame', async () => {
      const value = html`
        <iframe
          frameborder="0"
          allow="autoplay; fullscreen"
          allowfullscreen
          src="https://www.br.de/mediathek/embed/av:5dc03b7808e85c001af059a0?autoplay=true&muted=false"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'br',
        id: 'av:5dc03b7808e85c001af059a0',
        src: 'https://www.br.de/mediathek/embed/av:5dc03b7808e85c001af059a0',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the embed path', async () => {
      const value = html`<iframe src="https://evil.test/mediathek/embed/av:5dc03b7808e85c001af059a0"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host that only ends in the br.de labels', async () => {
      const value = html`<iframe src="https://br.de.evil.test/mediathek/embed/av:5dc03b7808e85c001af059a0"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed path carrying no media token', async () => {
      const value = html`<iframe src="https://www.br.de/mediathek/embed/kampf-ums-wasserloch"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a Mediathek page that is not the embed route', async () => {
      const value = html`<iframe src="https://www.br.de/mediathek/video/av:5dc03b7808e85c001af059a0"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should take the token from a subdomain serving the same route', async () => {
      const value = html`<iframe src="https://br.de/mediathek/embed/av:5d2cb1e4ca9c9700134580d2"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'br',
        id: 'av:5d2cb1e4ca9c9700134580d2',
        src: 'https://www.br.de/mediathek/embed/av:5d2cb1e4ca9c9700134580d2',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the podcast route BR retired', () => {
    it('should leave the podcast player unresolved', async () => {
      const value = html`
        <iframe
          height="130px"
          src="https://www.br.de/mediathek/podcast/embed?episode=1365100"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
