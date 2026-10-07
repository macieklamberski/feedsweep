import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  cognitoformsIframeEmbedResolver,
  cognitoformsResolveEmbed,
  cognitoformsScriptEmbedResolver,
  cognitoformsWidgetEmbedResolver,
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

describeForEachParser('cognitoformsWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, cognitoformsWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should build the form from the loader on the older embed host', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://services.cognitoforms.com/s/Lt1_lEG75k-lbJUheZ0tSg"></script>
          <script>Cognito.load("forms", { id: "2" });</script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'Lt1_lEG75k-lbJUheZ0tSg/2',
        src: 'https://www.cognitoforms.com/f/Lt1_lEG75k-lbJUheZ0tSg/2',
        url: 'https://www.cognitoforms.com/f/Lt1_lEG75k-lbJUheZ0tSg/2',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the form from the loader on the form host', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://www.cognitoforms.com/s/qbWubOFqmUeZOkRwtR-KYw"></script>
          <br>
          <script>Cognito.load("forms", { id: "12" });</script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'qbWubOFqmUeZOkRwtR-KYw/12',
        src: 'https://www.cognitoforms.com/f/qbWubOFqmUeZOkRwtR-KYw/12',
        url: 'https://www.cognitoforms.com/f/qbWubOFqmUeZOkRwtR-KYw/12',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the load call inside the comment wrapper Drupal adds', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://services.cognitoforms.com/s/yN7RjhEjnkujE280ybIhjQ"></script>
          <script>
<!--//--><![CDATA[// ><!--
Cognito.load("forms", { id: "41" });
//--><!]]></script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'yN7RjhEjnkujE280ybIhjQ/41',
        src: 'https://www.cognitoforms.com/f/yN7RjhEjnkujE280ybIhjQ/41',
        url: 'https://www.cognitoforms.com/f/yN7RjhEjnkujE280ybIhjQ/41',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the loader route word in any case, as the platform does', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://services.cognitoforms.com/S/Lt1_lEG75k-lbJUheZ0tSg"></script>
          <script>Cognito.load("forms", { id: "2" });</script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'Lt1_lEG75k-lbJUheZ0tSg/2',
        src: 'https://www.cognitoforms.com/f/Lt1_lEG75k-lbJUheZ0tSg/2',
        url: 'https://www.cognitoforms.com/f/Lt1_lEG75k-lbJUheZ0tSg/2',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://evil.test/s/Lt1_lEG75k-lbJUheZ0tSg"></script>
          <script>Cognito.load("forms", { id: "2" });</script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another route on the host', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://services.cognitoforms.com/notaroute/Lt1_lEG75k-lbJUheZ0tSg"></script>
          <script>Cognito.load("forms", { id: "2" });</script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the loader route with no organisation', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://services.cognitoforms.com/s/"></script>
          <script>Cognito.load("forms", { id: "2" });</script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route below the loader', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://services.cognitoforms.com/s/Lt1_lEG75k-lbJUheZ0tSg/extra"></script>
          <script>Cognito.load("forms", { id: "2" });</script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a load call for another kind', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://services.cognitoforms.com/s/Lt1_lEG75k-lbJUheZ0tSg"></script>
          <script>Cognito.load("notakind", { id: "2" });</script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader with no load call', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://services.cognitoforms.com/s/Lt1_lEG75k-lbJUheZ0tSg"></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should pass the form number to the form page as written', async () => {
      const value = html`
        <div class="cognito">
          <script src="https://services.cognitoforms.com/s/Lt1_lEG75k-lbJUheZ0tSg"></script>
          <script>Cognito.load("forms", { id: "2a" });</script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'cognitoforms',
        id: 'Lt1_lEG75k-lbJUheZ0tSg/2a',
        src: 'https://www.cognitoforms.com/f/Lt1_lEG75k-lbJUheZ0tSg/2a',
        url: 'https://www.cognitoforms.com/f/Lt1_lEG75k-lbJUheZ0tSg/2a',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('cognitoforms through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should turn the seamless embed into a form placeholder', async () => {
    const value = html`
      <script
        src="https://www.cognitoforms.com/f/seamless.js"
        data-key="IW7SzJYLPEa96K8jyNcDaw"
        data-form="346"
      ></script>
    `
    const expected = html`
      <div
        data-embed-height="600"
        data-embed-url="https://www.cognitoforms.com/f/IW7SzJYLPEa96K8jyNcDaw/346"
        data-embed-id="IW7SzJYLPEa96K8jyNcDaw/346"
        data-embed-provider="cognitoforms"
        data-embed-src="https://www.cognitoforms.com/f/IW7SzJYLPEa96K8jyNcDaw/346"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn the loader embed into a form placeholder', async () => {
    const value = html`
      <div class="cognito">
        <script src="https://services.cognitoforms.com/s/BVNBapeyfkKw9J10BiObEQ"></script>
        <br>
        <script>Cognito.load("forms", { id: "462" });</script>
      </div>
    `
    const expected = html`
      <div
        data-embed-height="600"
        data-embed-url="https://www.cognitoforms.com/f/BVNBapeyfkKw9J10BiObEQ/462"
        data-embed-id="BVNBapeyfkKw9J10BiObEQ/462"
        data-embed-provider="cognitoforms"
        data-embed-src="https://www.cognitoforms.com/f/BVNBapeyfkKw9J10BiObEQ/462"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should give each loader embed in one item its own form', async () => {
    const value = html`
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      <div class="cognito">
        <script src="https://services.cognitoforms.com/s/BVNBapeyfkKw9J10BiObEQ"></script>
        <br>
        <script>Cognito.load("forms", { id: "459" });</script>
      </div>
      <div class="cognito">
        <script src="https://services.cognitoforms.com/s/BVNBapeyfkKw9J10BiObEQ"></script>
        <br>
        <script>Cognito.load("forms", { id: "462" });</script>
      </div>
    `
    const expected = html`
      <p><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></p>
      <div
        data-embed-height="600"
        data-embed-url="https://www.cognitoforms.com/f/BVNBapeyfkKw9J10BiObEQ/459"
        data-embed-id="BVNBapeyfkKw9J10BiObEQ/459"
        data-embed-provider="cognitoforms"
        data-embed-src="https://www.cognitoforms.com/f/BVNBapeyfkKw9J10BiObEQ/459"
      ></div>
      <div
        data-embed-height="600"
        data-embed-url="https://www.cognitoforms.com/f/BVNBapeyfkKw9J10BiObEQ/462"
        data-embed-id="BVNBapeyfkKw9J10BiObEQ/462"
        data-embed-provider="cognitoforms"
        data-embed-src="https://www.cognitoforms.com/f/BVNBapeyfkKw9J10BiObEQ/462"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep the prose beside a loader embed in a wrapper', async () => {
    const value = html`
      <div class="K2FeedIntroText">
        <p>Want help building your volunteer program?</p>
        <div class="cognito">
          <script src="https://www.cognitoforms.com/s/n54Zqftbdk2-_K7h6oGZlg" type="text/javascript"></script>
          <script type="text/javascript">Cognito.load("forms", { id: "79" });</script>
        </div>
      </div>
    `
    const expected = html`
      <p>Want help building your volunteer program?</p>
      <div
        data-embed-height="600"
        data-embed-url="https://www.cognitoforms.com/f/n54Zqftbdk2-_K7h6oGZlg/79"
        data-embed-id="n54Zqftbdk2-_K7h6oGZlg/79"
        data-embed-provider="cognitoforms"
        data-embed-src="https://www.cognitoforms.com/f/n54Zqftbdk2-_K7h6oGZlg/79"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn the older embed iframe into a form placeholder', async () => {
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
    const expected = html`
      <div
        data-embed-height="600"
        data-embed-url="https://www.cognitoforms.com/f/udBVZe3Z5EWT79cmnukmOA/2"
        data-embed-id="udBVZe3Z5EWT79cmnukmOA/2"
        data-embed-provider="cognitoforms"
        data-embed-src="https://www.cognitoforms.com/f/udBVZe3Z5EWT79cmnukmOA/2"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
