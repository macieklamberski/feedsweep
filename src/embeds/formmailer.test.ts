import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  formmailerIframeEmbedResolver,
  formmailerResolveEmbed,
  formmailerWidgetEmbedResolver,
  readFormmailerHeight,
} from './formmailer.js'

describe('formmailerResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the form on the ssl host', () => {
      const value = 'https://ssl.form-mailer.jp/fms/6662b06a268383'
      const expected: EmbedResolverResult = {
        provider: 'formmailer',
        id: '6662b06a268383',
        src: 'https://ssl.form-mailer.jp/fms/6662b06a268383',
        url: 'https://ssl.form-mailer.jp/fms/6662b06a268383',
      }

      expect(formmailerResolveEmbed(value)).toEqual(expected)
    })

    it('should build the form on the pro host', () => {
      const value = 'https://pro.form-mailer.jp/fms/d47fd8f1163544'
      const expected: EmbedResolverResult = {
        provider: 'formmailer',
        id: 'd47fd8f1163544',
        src: 'https://pro.form-mailer.jp/fms/d47fd8f1163544',
        url: 'https://pro.form-mailer.jp/fms/d47fd8f1163544',
      }

      expect(formmailerResolveEmbed(value)).toEqual(expected)
    })

    it('should carry a prefill over in the frame only', () => {
      const value =
        'https://ssl.form-mailer.jp/fms/00db3f63809293?%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%5B0%5D=10%E6%9C%88'
      const expected: EmbedResolverResult = {
        provider: 'formmailer',
        id: '00db3f63809293',
        src: 'https://ssl.form-mailer.jp/fms/00db3f63809293?%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%5B0%5D=10%E6%9C%88',
        url: 'https://ssl.form-mailer.jp/fms/00db3f63809293',
      }

      expect(formmailerResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the loader display setting', () => {
      const value = 'https://ssl.form-mailer.jp/fms/6662b06a268383?errorScroll=0'
      const expected: EmbedResolverResult = {
        provider: 'formmailer',
        id: '6662b06a268383',
        src: 'https://ssl.form-mailer.jp/fms/6662b06a268383',
        url: 'https://ssl.form-mailer.jp/fms/6662b06a268383',
      }

      expect(formmailerResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore another route on the host', () => {
      const value = 'https://ssl.form-mailer.jp/notaroute/6662b06a268383'

      expect(formmailerResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the form route with no hash', () => {
      const value = 'https://ssl.form-mailer.jp/fms/'

      expect(formmailerResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route below the form', () => {
      const value = 'https://ssl.form-mailer.jp/fms/6662b06a268383/extra'

      expect(formmailerResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the form path on another host of the domain', () => {
      const value = 'https://www.form-mailer.jp/fms/6662b06a268383'

      expect(formmailerResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('formmailerWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, formmailerWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should build the form from the inline embed', async () => {
      const value = html`
        <div
          class="formmailer-embed"
          data-form-hash="44a9f70e243271"
          data-form-host="pro.form-mailer.jp"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'formmailer',
        id: '44a9f70e243271',
        src: 'https://pro.form-mailer.jp/fms/44a9f70e243271',
        url: 'https://pro.form-mailer.jp/fms/44a9f70e243271',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the form from the inline embed on the ssl host', async () => {
      const value = html`
        <div
          data-form-host="ssl.form-mailer.jp"
          data-form-hash="001d8134819680"
          class="formmailer-embed"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'formmailer',
        id: '001d8134819680',
        src: 'https://ssl.form-mailer.jp/fms/001d8134819680',
        url: 'https://ssl.form-mailer.jp/fms/001d8134819680',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry over a prefill written into the hash', async () => {
      const value = html`
        <div
          class="formmailer-embed"
          data-form-hash="9f273042809537?タイトル[0]=12月2日&amp;"
          data-form-host="ssl.form-mailer.jp"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'formmailer',
        id: '9f273042809537',
        src: 'https://ssl.form-mailer.jp/fms/9f273042809537?%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB[0]=12%E6%9C%882%E6%97%A5',
        url: 'https://ssl.form-mailer.jp/fms/9f273042809537',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a host that is not a form host', async () => {
      const value = html`
        <div
          class="formmailer-embed"
          data-form-hash="44a9f70e243271"
          data-form-host="evil.test"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an empty hash', async () => {
      const value = html`
        <div
          class="formmailer-embed"
          data-form-hash=""
          data-form-host="pro.form-mailer.jp"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('formmailerIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, formmailerIframeEmbedResolver)

  describe('happy paths', () => {
    it('should build the form from the embed code iframe', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="100%"
          scrolling="auto"
          src="https://ssl.form-mailer.jp/fms/6662b06a268383"
          title="HTML Form"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'formmailer',
        id: '6662b06a268383',
        src: 'https://ssl.form-mailer.jp/fms/6662b06a268383',
        url: 'https://ssl.form-mailer.jp/fms/6662b06a268383',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/fms/6662b06a268383"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('readFormmailerHeight', () => {
  it('should read the height out of the form message', () => {
    const value = { app: 'formmailer', message: 'heightChanged', params: { height: 1443 } }

    expect(readFormmailerHeight(value)).toBe(1443)
  })

  it('should ignore a message from another app', () => {
    const value = { app: 'other', message: 'heightChanged', params: { height: 1443 } }

    expect(readFormmailerHeight(value)).toBeUndefined()
  })

  it('should ignore the error scroll message', () => {
    const value = { app: 'formmailer', message: 'errorScroll', params: { height: 1443 } }

    expect(readFormmailerHeight(value)).toBeUndefined()
  })

  it('should ignore a message with no params', () => {
    const value = { app: 'formmailer', message: 'heightChanged', height: 1443 }

    expect(readFormmailerHeight(value)).toBeUndefined()
  })

  it('should ignore a message that is not an object', () => {
    const value = 'heightChanged'

    expect(readFormmailerHeight(value)).toBeUndefined()
  })
})

describeForEachParser('formmailer through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should turn the inline embed and its loader into a form placeholder', async () => {
    const value = html`
      <div
        class="formmailer-embed"
        data-form-hash="44a9f70e243271"
        data-form-host="pro.form-mailer.jp"
      ></div>
      <script src="https://pro.form-mailer.jp/formfiles/js/embed.js"></script>
    `
    const expected = html`
      <div
        data-embed-url="https://pro.form-mailer.jp/fms/44a9f70e243271"
        data-embed-id="44a9f70e243271"
        data-embed-provider="formmailer"
        data-embed-src="https://pro.form-mailer.jp/fms/44a9f70e243271"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn the embed code iframe into a form placeholder', async () => {
    const value = html`
      <iframe
        frameborder="0"
        height="100%"
        scrolling="auto"
        src="https://ssl.form-mailer.jp/fms/6662b06a268383"
        title="HTML Form"
        width="100%"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-url="https://ssl.form-mailer.jp/fms/6662b06a268383"
        data-embed-id="6662b06a268383"
        data-embed-provider="formmailer"
        data-embed-src="https://ssl.form-mailer.jp/fms/6662b06a268383"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
