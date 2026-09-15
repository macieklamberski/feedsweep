import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  jotformIframeEmbedResolver,
  jotformResolveEmbed,
  jotformScriptEmbedResolver,
} from './jotform.js'

describe('jotformResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the form from the bare id url', () => {
      const value = 'https://form.jotform.com/260493476454061'
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
      }

      expect(jotformResolveEmbed(value)).toEqual(expected)
    })

    it('should build the form from the longer route the platform also serves', () => {
      const value = 'https://form.jotform.com/form/260493476454061'
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
      }

      expect(jotformResolveEmbed(value)).toEqual(expected)
    })

    // Any parameter name is a prefill on this platform, so nothing tells one from a tracking
    // parameter and the whole query goes.
    it('should drop the query the publisher wrote', () => {
      const value = 'https://form.jotform.com/260493476454061?name=Jane&utm_source=post'
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
      }

      expect(jotformResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an account page', () => {
      const value = 'https://form.jotform.com/anaccount/a-form-slug'

      expect(jotformResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route below the form', () => {
      const value = 'https://form.jotform.com/260493476454061/edit'

      expect(jotformResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the site root', () => {
      const value = 'https://form.jotform.com/'

      expect(jotformResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('jotformScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, jotformScriptEmbedResolver)

  describe('happy paths', () => {
    it('should read the form id off the inline loader', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="https://form.jotform.com/jsform/260493476454061"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // The selector carries the host as a substring, so a foreign host holding it in the path
    // still matches and only the host check in extract can turn it away.
    it('should ignore a loader served from another host', async () => {
      const value = html`<script src="https://evil.test/form.jotform.com/jsform/2604934"></script>`

      expect(await extract(value)).toBeUndefined()
    })

    // The launcher carries its form id in an inline config beside this loader, and neither is
    // read.
    it('should ignore the launcher button loader', async () => {
      const value = html`<script src="https://form.jotform.com/static/feedback2.js"></script>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a form id that is not digits', async () => {
      const value = html`<script src="https://form.jotform.com/jsform/my-form"></script>`

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('jotformIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, jotformIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve a form frame', async () => {
      const value = html`<iframe src="https://form.jotform.com/260493476454061"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the path', async () => {
      const value = html`<iframe src="https://evil.test/form.jotform.com/260493476454061"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })
})
