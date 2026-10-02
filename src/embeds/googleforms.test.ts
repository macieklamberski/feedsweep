import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { googleformsEmbedResolver, googleformsResolveEmbed } from './googleforms.js'

describe('googleformsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should frame a published form on its embedded view', () => {
      const value =
        'https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform?embedded=true'
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg',
        src: 'https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform?embedded=true',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform',
        height: 600,
      }

      expect(googleformsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a form named by its Drive file id on that id', () => {
      const value =
        'https://docs.google.com/forms/d/10N9xJBPqhfOlC7OQN-6NXRoI0CXJpZxjkwQ_YF0H4m0/viewform?embedded=true'
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '10N9xJBPqhfOlC7OQN-6NXRoI0CXJpZxjkwQ_YF0H4m0',
        src: 'https://docs.google.com/forms/d/10N9xJBPqhfOlC7OQN-6NXRoI0CXJpZxjkwQ_YF0H4m0/viewform?embedded=true',
        url: 'https://docs.google.com/forms/d/10N9xJBPqhfOlC7OQN-6NXRoI0CXJpZxjkwQ_YF0H4m0/viewform',
        height: 600,
      }

      expect(googleformsResolveEmbed(value)).toEqual(expected)
    })

    it('should add the embedded view to a share link and drop its trackers', () => {
      const value =
        'https://docs.google.com/forms/d/e/1FAIpQLSeRQfoqlU89dTkXX6r8aprQ9GMrwI3T6JQ7Rw1oFmpNOnV88Q/viewform?usp=sharing&ouid=104067553983310287128'
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '1FAIpQLSeRQfoqlU89dTkXX6r8aprQ9GMrwI3T6JQ7Rw1oFmpNOnV88Q',
        src: 'https://docs.google.com/forms/d/e/1FAIpQLSeRQfoqlU89dTkXX6r8aprQ9GMrwI3T6JQ7Rw1oFmpNOnV88Q/viewform?embedded=true',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSeRQfoqlU89dTkXX6r8aprQ9GMrwI3T6JQ7Rw1oFmpNOnV88Q/viewform',
        height: 600,
      }

      expect(googleformsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the prefilled answers and drop the prefill flag', () => {
      const value =
        'https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform?usp=pp_url&entry.553414390=SMA+Negeri+1&hl=en'
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg',
        src: 'https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform?embedded=true&entry.553414390=SMA+Negeri+1',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform',
        height: 600,
      }

      expect(googleformsResolveEmbed(value)).toEqual(expected)
    })

    it('should frame a short link as written', () => {
      const value = 'https://forms.gle/3mfiVWiFzt6E1hhx6'
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '3mfiVWiFzt6E1hhx6',
        src: 'https://forms.gle/3mfiVWiFzt6E1hhx6',
        url: 'https://forms.gle/3mfiVWiFzt6E1hhx6',
        height: 600,
      }

      expect(googleformsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route the form does not serve', () => {
      const value =
        'https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/notaroute'

      expect(googleformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deck on the same host', () => {
      const value =
        'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed'

      expect(googleformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a forms path under another first segment', () => {
      const value =
        'https://docs.google.com/x/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform'

      expect(googleformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another file kind on the form route', () => {
      const value =
        'https://docs.google.com/notaform/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform'

      expect(googleformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a forms path that names no form', () => {
      const value = 'https://docs.google.com/forms/x/e/1FAIpQLSc2TjIaI6kPtQDHE7/viewform'

      expect(googleformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a short link with a second segment', () => {
      const value = 'https://forms.gle/3mfiVWiFzt6E1hhx6/extra'

      expect(googleformsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the short link host on its own', () => {
      const value = 'https://forms.gle/'

      expect(googleformsResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('the prefixes that pick the sign-in', () => {
    it('should drop the account prefix', () => {
      const value =
        'https://docs.google.com/forms/u/0/d/e/1FAIpQLSc9Bh47TQpW0PDuM-5NcoQjgDp_T2wV8xrX7SsXTLGMQwUdqA/viewform?embedded=true'
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '1FAIpQLSc9Bh47TQpW0PDuM-5NcoQjgDp_T2wV8xrX7SsXTLGMQwUdqA',
        src: 'https://docs.google.com/forms/d/e/1FAIpQLSc9Bh47TQpW0PDuM-5NcoQjgDp_T2wV8xrX7SsXTLGMQwUdqA/viewform?embedded=true',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSc9Bh47TQpW0PDuM-5NcoQjgDp_T2wV8xrX7SsXTLGMQwUdqA/viewform',
        height: 600,
      }

      expect(googleformsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the Workspace prefix', () => {
      const value =
        'https://docs.google.com/a/ncps-k12.org/forms/d/e/1FAIpQLScUhhDYrYWJvD3byNVXHufauKYWXEeBp6U29PVGoSElSXBLrQ/viewform?embedded=true'
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '1FAIpQLScUhhDYrYWJvD3byNVXHufauKYWXEeBp6U29PVGoSElSXBLrQ',
        src: 'https://docs.google.com/forms/d/e/1FAIpQLScUhhDYrYWJvD3byNVXHufauKYWXEeBp6U29PVGoSElSXBLrQ/viewform?embedded=true',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLScUhhDYrYWJvD3byNVXHufauKYWXEeBp6U29PVGoSElSXBLrQ/viewform',
        height: 600,
      }

      expect(googleformsResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('googleformsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, googleformsEmbedResolver)

  describe('happy paths', () => {
    it('should state the form size whatever box the carrier declares', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="500"
          marginheight="0"
          marginwidth="0"
          src="https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform?embedded=true"
          width="760"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg',
        src: 'https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform?embedded=true',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the form name from the carrier title', async () => {
      const value = html`
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSeRQfoqlU89dTkXX6r8aprQ9GMrwI3T6JQ7Rw1oFmpNOnV88Q/viewform?usp=sharing&#038;ouid=104067553983310287128"
          width="100%"
          height="2000px"
          title="Dumpling Bracket Round 2 voting "
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '1FAIpQLSeRQfoqlU89dTkXX6r8aprQ9GMrwI3T6JQ7Rw1oFmpNOnV88Q',
        src: 'https://docs.google.com/forms/d/e/1FAIpQLSeRQfoqlU89dTkXX6r8aprQ9GMrwI3T6JQ7Rw1oFmpNOnV88Q/viewform?embedded=true',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSeRQfoqlU89dTkXX6r8aprQ9GMrwI3T6JQ7Rw1oFmpNOnV88Q/viewform',
        height: 600,
        title: 'Dumpling Bracket Round 2 voting',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should frame a short link carrier', async () => {
      const value = html`
        <iframe
          src="https://forms.gle/3mfiVWiFzt6E1hhx6"
          height="3422"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '3mfiVWiFzt6E1hhx6',
        src: 'https://forms.gle/3mfiVWiFzt6E1hhx6',
        url: 'https://forms.gle/3mfiVWiFzt6E1hhx6',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform?embedded=true"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying a short code', async () => {
      const value = '<iframe src="https://evil.test/3mfiVWiFzt6E1hhx6"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the labels a plugin writes as the title', () => {
    it('should drop the Embed Any Document label', async () => {
      const value = html`
        <iframe
          src="https://docs.google.com/forms/d/1fmi1Jzlo6RpnTuqx-6xlft9pdFvUvY8f1cdjkhESnEI/viewform?embedded=true&#038;usp=drive_web"
          title="Embedded Document"
          class="ead-iframe"
          style="width: 100%;height: 500px;border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googleforms',
        id: '1fmi1Jzlo6RpnTuqx-6xlft9pdFvUvY8f1cdjkhESnEI',
        src: 'https://docs.google.com/forms/d/1fmi1Jzlo6RpnTuqx-6xlft9pdFvUvY8f1cdjkhESnEI/viewform?embedded=true',
        url: 'https://docs.google.com/forms/d/1fmi1Jzlo6RpnTuqx-6xlft9pdFvUvY8f1cdjkhESnEI/viewform',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('googleforms through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the share dialog snippet into a form placeholder', async () => {
    const value = html`
      <iframe
        frameborder="0"
        height="500"
        marginheight="0"
        marginwidth="0"
        src="https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform?embedded=true"
        width="760"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="600"
        data-embed-url="https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform"
        data-embed-id="1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg"
        data-embed-provider="googleforms"
        data-embed-src="https://docs.google.com/forms/d/e/1FAIpQLSc2TjIaI6kPtQDHE7_KCXChPePHjJMdQosR52U1SdPWM_v4eg/viewform?embedded=true"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
