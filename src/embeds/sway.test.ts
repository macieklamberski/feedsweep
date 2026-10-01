import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { swayEmbedResolver, swayResolveEmbed } from './sway.js'

describe('swayResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the embed url on the current host', () => {
      const value = 'https://sway.cloud.microsoft/s/LOFHixZPMN68d3u8/embed'
      const expected: EmbedResolverResult = {
        provider: 'sway',
        id: 'LOFHixZPMN68d3u8',
        src: 'https://sway.cloud.microsoft/s/LOFHixZPMN68d3u8/embed',
        url: 'https://sway.cloud.microsoft/LOFHixZPMN68d3u8',
        height: 500,
      }

      expect(swayResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the current host for the embed url on sway.com', () => {
      const value = 'https://sway.com/s/s7OAd7CG19agnTuf/embed'
      const expected: EmbedResolverResult = {
        provider: 'sway',
        id: 's7OAd7CG19agnTuf',
        src: 'https://sway.cloud.microsoft/s/s7OAd7CG19agnTuf/embed',
        url: 'https://sway.cloud.microsoft/s7OAd7CG19agnTuf',
        height: 500,
      }

      expect(swayResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the current host for the embed url on sway.office.com', () => {
      const value = 'https://sway.office.com/s/s7OAd7CG19agnTuf/embed'
      const expected: EmbedResolverResult = {
        provider: 'sway',
        id: 's7OAd7CG19agnTuf',
        src: 'https://sway.cloud.microsoft/s/s7OAd7CG19agnTuf/embed',
        url: 'https://sway.cloud.microsoft/s7OAd7CG19agnTuf',
        height: 500,
      }

      expect(swayResolveEmbed(value)).toEqual(expected)
    })

    it('should read the route words in any case', () => {
      const value = 'https://sway.cloud.microsoft/S/s7OAd7CG19agnTuf/EMBED'
      const expected: EmbedResolverResult = {
        provider: 'sway',
        id: 's7OAd7CG19agnTuf',
        src: 'https://sway.cloud.microsoft/s/s7OAd7CG19agnTuf/embed',
        url: 'https://sway.cloud.microsoft/s7OAd7CG19agnTuf',
        height: 500,
      }

      expect(swayResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the route without the embed segment', () => {
      const value = 'https://sway.cloud.microsoft/s/s7OAd7CG19agnTuf'

      expect(swayResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an embed segment under another route word', () => {
      const value = 'https://sway.cloud.microsoft/x/s7OAd7CG19agnTuf/embed'

      expect(swayResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the embed route under a leading segment', () => {
      const value = 'https://sway.cloud.microsoft/x/s/s7OAd7CG19agnTuf/embed'

      expect(swayResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a trailing segment after the embed route', () => {
      const value = 'https://sway.cloud.microsoft/s/s7OAd7CG19agnTuf/embed/extra'

      expect(swayResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/s/s7OAd7CG19agnTuf/embed'

      expect(swayResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use an id as written, even if the player answers an error', () => {
      const value = 'https://sway.cloud.microsoft/s/s7oad7cg19agntuf/embed'
      const expected: EmbedResolverResult = {
        provider: 'sway',
        id: 's7oad7cg19agntuf',
        src: 'https://sway.cloud.microsoft/s/s7oad7cg19agntuf/embed',
        url: 'https://sway.cloud.microsoft/s7oad7cg19agntuf',
        height: 500,
      }

      expect(swayResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracking query', () => {
      const value = 'https://sway.cloud.microsoft/s/s7OAd7CG19agnTuf/embed?utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'sway',
        id: 's7OAd7CG19agnTuf',
        src: 'https://sway.cloud.microsoft/s/s7OAd7CG19agnTuf/embed',
        url: 'https://sway.cloud.microsoft/s7OAd7CG19agnTuf',
        height: 500,
      }

      expect(swayResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('swayEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, swayEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the snippet declares', async () => {
      const value = html`
        <iframe
          width="760px"
          height="500px"
          src="https://sway.cloud.microsoft/s/LOFHixZPMN68d3u8/embed"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
          max-width="100%"
          sandbox="allow-forms allow-modals allow-orientation-lock allow-popups allow-same-origin allow-scripts"
          scrolling="no"
          style="border: none; max-width: 100%; max-height: 100vh"
          allowfullscreen
          mozallowfullscreen
          msallowfullscreen
          webkitallowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sway',
        id: 'LOFHixZPMN68d3u8',
        src: 'https://sway.cloud.microsoft/s/LOFHixZPMN68d3u8/embed',
        url: 'https://sway.cloud.microsoft/LOFHixZPMN68d3u8',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the current host for the older sway.com snippet', async () => {
      const value = html`
        <iframe
          width="760px"
          height="500px"
          src="https://sway.com/s/7H3GVVffXtH1U4Wf/embed"
          frameborder="0"
          marginwidth="0"
          marginheight="0"
          scrolling="no"
          style="border: none; max-width:100%; max-height:100vh"
          allowfullscreen
          webkitallowfullscreen
          mozallowfullscreen
          msallowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sway',
        id: '7H3GVVffXtH1U4Wf',
        src: 'https://sway.cloud.microsoft/s/7H3GVVffXtH1U4Wf/embed',
        url: 'https://sway.cloud.microsoft/7H3GVVffXtH1U4Wf',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value = '<iframe src="https://sway.com.evil.test/s/s7OAd7CG19agnTuf/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route on a foreign host', async () => {
      const value = '<iframe src="https://evil.test/s/s7OAd7CG19agnTuf/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('sway through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should build the placeholder from the sway.com snippet', async () => {
    const value = html`
      <iframe
        width="760px"
        height="500px"
        src="https://sway.com/s/ddDE7MhNRKb8kqqi/embed"
        frameborder="0"
        scrolling="no"
        allowfullscreen=""
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="sway"
        data-embed-id="ddDE7MhNRKb8kqqi"
        data-embed-src="https://sway.cloud.microsoft/s/ddDE7MhNRKb8kqqi/embed"
        data-embed-url="https://sway.cloud.microsoft/ddDE7MhNRKb8kqqi"
        data-embed-height="500"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
