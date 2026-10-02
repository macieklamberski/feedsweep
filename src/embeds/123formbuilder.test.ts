import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedRenderHint, EmbedResolverResult } from '../types.js'
import { iframeResizerHeightRequest, readIframeResizerHeight } from '../utils/hints.js'
import {
  oneTwoThreeFormBuilderIframeEmbedResolver,
  oneTwoThreeFormBuilderRenderHint,
  oneTwoThreeFormBuilderResolveEmbed,
  oneTwoThreeFormBuilderScriptEmbedResolver,
} from './123formbuilder.js'

describe('oneTwoThreeFormBuilderResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the form from the form page', () => {
      const value = 'https://form.123formbuilder.com/5013627'
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '5013627',
        src: 'https://form.123formbuilder.com/5013627',
        url: 'https://form.123formbuilder.com/5013627',
      }

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toEqual(expected)
    })

    it('should build the form from the form page with a trailing slash', () => {
      const value = 'https://form.123formbuilder.com/5013627/'
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '5013627',
        src: 'https://form.123formbuilder.com/5013627',
        url: 'https://form.123formbuilder.com/5013627',
      }

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the older iframe snippet onto the form page', () => {
      const value = 'https://www.123formbuilder.com/my-contact-form-4733692.html'
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '4733692',
        src: 'https://form.123formbuilder.com/4733692',
        url: 'https://form.123formbuilder.com/4733692',
      }

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the older iframe snippet that names the account', () => {
      const value = 'http://www.123contactform.com/my-contact-form-a6441661074-783097.html'
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '783097',
        src: 'https://form.123formbuilder.com/783097',
        url: 'https://form.123formbuilder.com/783097',
      }

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the query the form page is given', () => {
      const value = 'https://form.123formbuilder.com/5013627?utm_source=post&hasEmbedFormStyle=1'
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '5013627',
        src: 'https://form.123formbuilder.com/5013627',
        url: 'https://form.123formbuilder.com/5013627',
      }

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route word in the id position', () => {
      const value = 'https://form.123formbuilder.com/notaform'

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a form page below another segment', () => {
      const value = 'https://form.123formbuilder.com/x/5013627'

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route below the form page', () => {
      const value = 'https://form.123formbuilder.com/5013627/extra'

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an older snippet page below another segment', () => {
      const value = 'https://www.123formbuilder.com/x/my-contact-form-4733692.html'

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an older snippet page with a trailing segment', () => {
      const value = 'https://www.123formbuilder.com/my-contact-form-4733692.html/extra'

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an older snippet page whose account part is not the account id', () => {
      const value = 'https://www.123formbuilder.com/my-contact-form-b6441661074-783097.html'

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the loader script', () => {
      const value = 'https://form.123formbuilder.com/embed/5013627.js'

      expect(oneTwoThreeFormBuilderResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('oneTwoThreeFormBuilderScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, oneTwoThreeFormBuilderScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the form from the loader on the form host', async () => {
      const value = html`
        <script
          type="text/javascript"
          defer
          src="https://form.123formbuilder.com/embed/4743251.js"
          data-role="form"
          data-default-width="650px"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '4743251',
        src: 'https://form.123formbuilder.com/4743251',
        url: 'https://form.123formbuilder.com/4743251',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the form from the loader on the www host', async () => {
      const value = html`
        <script
          type="text/javascript"
          defer
          src="//www.123formbuilder.com/embed/5013627.js"
          data-role="form"
          data-default-width="650px"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '5013627',
        src: 'https://form.123formbuilder.com/5013627',
        url: 'https://form.123formbuilder.com/5013627',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the form from the loader on the former 123ContactForm host', async () => {
      const value = html`
        <script
          data-role="form"
          defer=""
          src="//www.123contactform.com/embed/3072130.js"
          type="text/javascript"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '3072130',
        src: 'https://form.123formbuilder.com/3072130',
        url: 'https://form.123formbuilder.com/3072130',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the custom vars the loader passes as styling', async () => {
      const value = html`
        <script
          data-custom-vars="hasEmbedFormStyle=1"
          data-default-width="800px"
          data-role="form"
          defer=""
          src="https://form.123formbuilder.com/embed/6453710.js"
          type="text/javascript"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '6453710',
        src: 'https://form.123formbuilder.com/6453710',
        url: 'https://form.123formbuilder.com/6453710',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass the form id through as written', async () => {
      const value = html`
        <script
          data-role="form"
          src="https://form.123formbuilder.com/embed/abc_123.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: 'abc_123',
        src: 'https://form.123formbuilder.com/abc_123',
        url: 'https://form.123formbuilder.com/abc_123',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the lightbox loader, which opens the form from a text link', async () => {
      const value = html`
        <script
          data-default-width="650px"
          data-embed-text-link="contact us"
          data-embed-type="lightbox-text-link"
          data-role="form"
          defer=""
          src="https://form.123formbuilder.com/embed/5944415.js?type=lightbox"
          type="text/javascript"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader with no form role', async () => {
      const value = '<script src="https://form.123formbuilder.com/embed/5013627.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <script
          data-role="form"
          src="https://evil.test/embed/5013627.js?123formbuilder.com/embed/"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader path below another segment', async () => {
      const value = html`
        <script
          data-role="form"
          src="https://form.123formbuilder.com/embed/x/embed/5013627.js"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader path with a trailing segment', async () => {
      const value = html`
        <script
          data-role="form"
          src="https://form.123formbuilder.com/embed/5013627.js/extra"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('oneTwoThreeFormBuilderIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, oneTwoThreeFormBuilderIframeEmbedResolver)

  describe('happy paths', () => {
    it('should rebuild the older iframe snippet onto the form page', async () => {
      const value = html`
        <iframe
          allowtransparency="true"
          frameborder="0"
          id="contactform123"
          name="contactform123"
          src="http://www.123contactform.com/my-contact-form-a6441661074-783097.html"
          style="height: inherit; min-height: 580px; overflow: auto;"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: '123formbuilder',
        id: '783097',
        src: 'https://form.123formbuilder.com/783097',
        url: 'https://form.123formbuilder.com/783097',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/my-contact-form-4733692.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('oneTwoThreeFormBuilderRenderHint', () => {
  it('should start iframe-resizer and read the height the form answers with', () => {
    const expected: EmbedRenderHint = {
      provider: '123formbuilder',
      origin: 'https://form.123formbuilder.com',
      requestHeight: iframeResizerHeightRequest,
      readHeight: readIframeResizerHeight,
    }

    expect(oneTwoThreeFormBuilderRenderHint).toEqual(expected)
  })
})
