import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  cognitoformsIframeEmbedResolver,
  cognitoformsResolveEmbed,
  cognitoformsScriptEmbedResolver,
} from './cognitoforms.js'

describe('cognitoformsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the form from the form page', () => {
      const value = 'https://www.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48'
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'yExCAh1c_E2nq69zMpV9RA/48',
        src: 'https://www.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48',
        url: 'https://www.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48',
        height: 600,
      }

      expect(cognitoformsResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the older embed host onto the form page', () => {
      const value = 'https://services.cognitoforms.com/f/udBVZe3Z5EWT79cmnukmOA?id=2'
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'udBVZe3Z5EWT79cmnukmOA/2',
        src: 'https://www.cognitoforms.com/f/udBVZe3Z5EWT79cmnukmOA/2',
        url: 'https://www.cognitoforms.com/f/udBVZe3Z5EWT79cmnukmOA/2',
        height: 600,
      }

      expect(cognitoformsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the prefill entry in the frame only', () => {
      const value =
        'https://www.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48?entry=%7B%22Name%22%3A%22Jane%22%7D&utm_source=post'
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'yExCAh1c_E2nq69zMpV9RA/48',
        src: 'https://www.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48?entry=%7B%22Name%22%3A%22Jane%22%7D',
        url: 'https://www.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48',
        height: 600,
      }

      expect(cognitoformsResolveEmbed(value)).toEqual(expected)
    })

    it('should take the form route word in any case, as the platform does', () => {
      const value = 'https://www.cognitoforms.com/F/yExCAh1c_E2nq69zMpV9RA/48'
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'yExCAh1c_E2nq69zMpV9RA/48',
        src: 'https://www.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48',
        url: 'https://www.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48',
        height: 600,
      }

      expect(cognitoformsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore another route on the host', () => {
      const value = 'https://www.cognitoforms.com/notaroute/yExCAh1c_E2nq69zMpV9RA/48'

      expect(cognitoformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the form route with no organisation', () => {
      const value = 'https://services.cognitoforms.com/f/?id=2'

      expect(cognitoformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an organisation with no form', () => {
      const value = 'https://services.cognitoforms.com/f/udBVZe3Z5EWT79cmnukmOA'

      expect(cognitoformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route below the form', () => {
      const value = 'https://www.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48/extra'

      expect(cognitoformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the form path on another subdomain', () => {
      const value = 'https://files.cognitoforms.com/f/yExCAh1c_E2nq69zMpV9RA/48'

      expect(cognitoformsResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('cognitoformsScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, cognitoformsScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the form from the seamless embed', async () => {
      const value = html`
        <script
          src="https://www.cognitoforms.com/f/seamless.js"
          data-key="IW7SzJYLPEa96K8jyNcDaw"
          data-form="346"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'IW7SzJYLPEa96K8jyNcDaw/346',
        src: 'https://www.cognitoforms.com/f/IW7SzJYLPEa96K8jyNcDaw/346',
        url: 'https://www.cognitoforms.com/f/IW7SzJYLPEa96K8jyNcDaw/346',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <script
          src="https://evil.test/f/seamless.js?cognitoforms.com/f/seamless.js"
          data-key="IW7SzJYLPEa96K8jyNcDaw"
          data-form="346"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another script on the host', async () => {
      const value = html`
        <script
          src="https://www.cognitoforms.com/f/iframe.js?cognitoforms.com/f/seamless.js"
          data-key="IW7SzJYLPEa96K8jyNcDaw"
          data-form="346"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the seamless path below another segment', async () => {
      const value = html`
        <script
          src="https://www.cognitoforms.com/x/f/seamless.js?cognitoforms.com/f/seamless.js"
          data-key="IW7SzJYLPEa96K8jyNcDaw"
          data-form="346"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the seamless path with a trailing segment', async () => {
      const value = html`
        <script
          src="https://www.cognitoforms.com/f/seamless.js/extra?cognitoforms.com/f/seamless.js"
          data-key="IW7SzJYLPEa96K8jyNcDaw"
          data-form="346"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an empty organisation key', async () => {
      const value = html`
        <script
          src="https://www.cognitoforms.com/f/seamless.js"
          data-key=""
          data-form="346"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an empty form number', async () => {
      const value = html`
        <script
          src="https://www.cognitoforms.com/f/seamless.js"
          data-key="IW7SzJYLPEa96K8jyNcDaw"
          data-form=""
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('cognitoformsIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, cognitoformsIframeEmbedResolver)

  it('should rebuild the older embed iframe onto the form page', async () => {
    const value = html`
      <iframe
        src="https://services.cognitoforms.com/f/udBVZe3Z5EWT79cmnukmOA?id=2"
        style="position:relative;width:1px;min-width:100%;*width:100%;"
        frameborder="0"
        scrolling="yes"
        seamless="seamless"
        height="503"
        width="100%"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'cognitoforms',
      id: 'udBVZe3Z5EWT79cmnukmOA/2',
      src: 'https://www.cognitoforms.com/f/udBVZe3Z5EWT79cmnukmOA/2',
      url: 'https://www.cognitoforms.com/f/udBVZe3Z5EWT79cmnukmOA/2',
      height: 600,
    }

    expect(await extract(value)).toEqual(expected)
  })
})
