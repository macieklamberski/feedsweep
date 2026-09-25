import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  crowdsignalIframeEmbedResolver,
  crowdsignalResolveEmbed,
  crowdsignalScriptEmbedResolver,
} from './crowdsignal.js'

describe('crowdsignalResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the poll frame', () => {
      const value = 'https://poll.fm/17125374/embed'
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '17125374',
        src: 'https://poll.fm/17125374/embed',
        url: 'https://poll.fm/17125374',
      }

      expect(crowdsignalResolveEmbed(value)).toEqual(expected)
    })

    it('should frame the poll page the same way', () => {
      const value = 'https://poll.fm/13332507'
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '13332507',
        src: 'https://poll.fm/13332507/embed',
        url: 'https://poll.fm/13332507',
      }

      expect(crowdsignalResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a path that is not a poll', () => {
      const value = 'https://poll.fm/about'

      expect(crowdsignalResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the poll results page', () => {
      const value = 'https://poll.fm/17125374/results'

      expect(crowdsignalResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('crowdsignalIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, crowdsignalIframeEmbedResolver)

  describe('happy paths', () => {
    it('should read the frame the snippet keeps in its noscript', async () => {
      const value = html`
        <iframe
          title="A question?"
          src="https://poll.fm/17125374/embed"
          frameborder="0"
          class="cs-iframe-embed"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '17125374',
        src: 'https://poll.fm/17125374/embed',
        url: 'https://poll.fm/17125374',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the poll route in its path', async () => {
      const value = '<iframe src="https://evil.test/poll.fm/17125374/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('crowdsignalScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, crowdsignalScriptEmbedResolver)

  describe('happy paths', () => {
    it('should read the poll id out of the loader path', async () => {
      const value = html`
        <script
          type="text/javascript"
          charset="utf-8"
          src="https://secure.polldaddy.com/p/13332507.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '13332507',
        src: 'https://poll.fm/13332507/embed',
        url: 'https://poll.fm/13332507',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a loader naming no poll', async () => {
      const value = '<script src="https://secure.polldaddy.com/p/embed.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the loader in its path', async () => {
      const value = '<script src="https://evil.test/secure.polldaddy.com/p/13332507.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Both snippet shapes leave the poll inside a <noscript> a reader hides, and only the whole run
// shows what each comes out as.
describeForEachParser('crowdsignal snippets through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the loader and its noscript link into one placeholder', async () => {
    const value = html`
      <div class="mrf-polldaddy">
        <script
          type="text/javascript"
          charset="utf-8"
          src="https://secure.polldaddy.com/p/13332507.js"
        ></script>
        <noscript><a href="https://poll.fm/13332507">POLL: A question?</a></noscript>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="13332507"
        data-embed-src="https://poll.fm/13332507/embed"
        data-embed-url="https://poll.fm/13332507"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a link to the poll an author wrote in the body', async () => {
    const value = html`
      <p>Vote in <a href="https://poll.fm/13332507">our poll</a> before Friday.</p>
      <div class="mrf-polldaddy">
        <script
          type="text/javascript"
          charset="utf-8"
          src="https://secure.polldaddy.com/p/13332507.js"
        ></script>
      </div>
    `
    const expected = html`
      <p>Vote in <a href="https://poll.fm/13332507">our poll</a> before Friday.</p>
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="13332507"
        data-embed-src="https://poll.fm/13332507/embed"
        data-embed-url="https://poll.fm/13332507"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn the loader and its noscript frame into one placeholder', async () => {
    const value = html`
      <figure class="wp-block-embed is-provider-crowdsignal">
        <div class="wp-block-embed__wrapper">
          <script>var pd_tags = new Array;pd_tags["17125374-src"]="poll-oembed-simple";</script>
          <script
            type="text/javascript"
            charset="utf-8"
            src="https://secure.polldaddy.com/p/17125374.js"
          ></script>
          <noscript>
            <iframe
              title="A question?"
              src="https://poll.fm/17125374/embed"
              frameborder="0"
              class="cs-iframe-embed"
            ></iframe>
          </noscript>
        </div>
      </figure>
    `
    const expected = html`
      <figure class="wp-block-embed is-provider-crowdsignal">
        <p><script>var pd_tags = new Array;pd_tags["17125374-src"]="poll-oembed-simple";</script></p>
        <div
          data-embed-provider="crowdsignal"
          data-embed-id="17125374"
          data-embed-src="https://poll.fm/17125374/embed"
          data-embed-url="https://poll.fm/17125374"
        ></div>
      </figure>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
