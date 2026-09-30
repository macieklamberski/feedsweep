import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  crowdsignalFlashEmbedResolver,
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

    it('should read the poll frame written with a trailing slash', () => {
      const value = 'https://poll.fm/17125374/embed/'
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '17125374',
        src: 'https://poll.fm/17125374/embed',
        url: 'https://poll.fm/17125374',
      }

      expect(crowdsignalResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the font size the snippet writes into the frame query', () => {
      const value = 'https://poll.fm/15364010/embed?fontsize=medium'
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '15364010',
        src: 'https://poll.fm/15364010/embed',
        url: 'https://poll.fm/15364010',
      }

      expect(crowdsignalResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker from the frame query', () => {
      const value = 'https://poll.fm/17125374/embed?utm_source=twitter'
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '17125374',
        src: 'https://poll.fm/17125374/embed',
        url: 'https://poll.fm/17125374',
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

    it('should ignore a poll id under another route', () => {
      const value = 'https://poll.fm/x/17125374/embed'

      expect(crowdsignalResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a segment past the frame route', () => {
      const value = 'https://poll.fm/17125374/embed/extra'

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
      const value = '<iframe src="https://evil.test/17125374/embed"></iframe>'

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

    it('should read the loader on the static host, written protocol-relative', async () => {
      const value = '<script src="//static.polldaddy.com/p/17342754.js"></script>'
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '17342754',
        src: 'https://poll.fm/17342754/embed',
        url: 'https://poll.fm/17342754',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the loader on the www host', async () => {
      const value = html`
        <script
          language="javascript"
          src="http://www.polldaddy.com/p/63575.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '63575',
        src: 'https://poll.fm/63575/embed',
        url: 'https://poll.fm/63575',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should use a malformed poll id as written, even if the player answers an error', async () => {
      const value = '<script src="https://secure.polldaddy.com/p/1333a.js"></script>'
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '1333a',
        src: 'https://poll.fm/1333a/embed',
        url: 'https://poll.fm/1333a',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should use a loader naming no poll as written, even if the player answers an error', async () => {
      const value = '<script src="https://secure.polldaddy.com/p/embed.js"></script>'
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: 'embed',
        src: 'https://poll.fm/embed/embed',
        url: 'https://poll.fm/embed',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a foreign host serving the loader path', async () => {
      const value = '<script src="https://evil.test/p/13332507.js?polldaddy.com/p/"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader path nested under the loader directory', async () => {
      const value = '<script src="https://secure.polldaddy.com/p/x/p/13332507.js"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a file that only starts like the loader', async () => {
      const value = '<script src="https://secure.polldaddy.com/p/13332507.jsx"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  // The pipeline surfaces a poll.fm frame out of its <noscript> before the loader is read, so
  // only the resolver alone reaches a <noscript> that still holds the frame.
  describe('the noscript after the loader', () => {
    it('should remove a noscript holding the same poll frame', async () => {
      const value = html`
        <div>
          <script src="https://secure.polldaddy.com/p/17125374.js"></script>
          <noscript><iframe src="https://poll.fm/17125374/embed"></iframe></noscript>
        </div>
      `
      const document = parseHtml(value)
      const loader = document.querySelector('script') as Element

      await crowdsignalScriptEmbedResolver.extract(loader)

      expect(document.querySelector('noscript')).toBeNull()
    })

    it('should keep a noscript holding another poll frame', async () => {
      const value = html`
        <div>
          <script src="https://secure.polldaddy.com/p/17125374.js"></script>
          <noscript><iframe src="https://poll.fm/13332507/embed"></iframe></noscript>
        </div>
      `
      const document = parseHtml(value)
      const loader = document.querySelector('script') as Element

      await crowdsignalScriptEmbedResolver.extract(loader)

      expect(document.querySelector('noscript')).not.toBeNull()
    })

    it('should remove a noscript linking the same malformed poll on the retired page', async () => {
      const value = html`
        <div>
          <script src="https://secure.polldaddy.com/p/1333a.js"></script>
          <noscript><a href="https://polldaddy.com/poll/1333a/">Take the poll</a></noscript>
        </div>
      `
      const document = parseHtml(value)
      const loader = document.querySelector('script') as Element

      await crowdsignalScriptEmbedResolver.extract(loader)

      expect(document.querySelector('noscript')).toBeNull()
    })
  })
})

describeForEachParser('crowdsignalFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, crowdsignalFlashEmbedResolver)

  describe('happy paths', () => {
    it('should state the live poll height over the Flash box', async () => {
      const value = html`
        <embed
          allowscriptaccess="never"
          saveembedtags="true"
          src="http://www.polldaddy.com/poll.swf"
          flashvars="p=132074"
          quality="high"
          wmode="transparent"
          bgcolor="#ffffff"
          name="beta3"
          salign="tl"
          scale="autoscale"
          type="application/x-shockwave-flash"
          pluginspage="http://www.macromedia.com/go/getflashplayer"
          height="609"
          width="252"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '132074',
        src: 'https://poll.fm/132074/embed',
        url: 'https://poll.fm/132074',
        height: 473,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host serving the player path', async () => {
      const value = html`
        <embed
          src="https://evil.test/poll.swf"
          flashvars="p=132074"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the player path nested under another directory', async () => {
      const value = html`
        <embed
          src="http://www.polldaddy.com/x/poll.swf"
          flashvars="p=132074"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment past the player path', async () => {
      const value = html`
        <embed
          src="http://www.polldaddy.com/poll.swf/extra"
          flashvars="p=132074"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed poll id as written, even if the player answers an error', async () => {
      const value = html`
        <embed
          src="http://www.polldaddy.com/poll.swf"
          flashvars="p=poll132074"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: 'poll132074',
        src: 'https://poll.fm/poll132074/embed',
        url: 'https://poll.fm/poll132074',
        height: 473,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed poll id carrying a path separator as written, even if the player answers an error', async () => {
      const value = html`
        <embed
          src="http://www.polldaddy.com/poll.swf"
          flashvars="p=132074%2Fresults"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'crowdsignal',
        id: '132074/results',
        src: 'https://poll.fm/132074%2Fresults/embed',
        url: 'https://poll.fm/132074%2Fresults',
        height: 473,
      }

      expect(await extract(value)).toEqual(expected)
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

  it('should keep an author paragraph linking the poll after a loader at the top level', async () => {
    const value = html`
      <p>Intro.</p>
      <script src="https://secure.polldaddy.com/p/13332507.js"></script>
      <p>Last week's <a href="https://poll.fm/13332507">poll</a> said yes.</p>
    `
    const expected = html`
      <p>Intro.</p>
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="13332507"
        data-embed-src="https://poll.fm/13332507/embed"
        data-embed-url="https://poll.fm/13332507"
      ></div>
      <p>Last week's <a href="https://poll.fm/13332507">poll</a> said yes.</p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a paragraph linking a poll whose id starts with the loader id', async () => {
    const value = html`
      <div>
        <script src="https://secure.polldaddy.com/p/1333.js"></script>
        <p>Last week's <a href="https://poll.fm/13332507">poll</a> said yes.</p>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="1333"
        data-embed-src="https://poll.fm/1333/embed"
        data-embed-url="https://poll.fm/1333"
      ></div>
      <p>Last week's <a href="https://poll.fm/13332507">poll</a> said yes.</p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should drop a noscript link to the retired Polldaddy poll page', async () => {
    const value = html`
      <div>
        <script src="https://static.polldaddy.com/p/1804433.js"></script>
        <noscript><a href="https://polldaddy.com/poll/1804433/">View This Poll</a></noscript>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="1804433"
        data-embed-src="https://poll.fm/1804433/embed"
        data-embed-url="https://poll.fm/1804433"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a noscript naming something other than a poll', async () => {
    const value = html`
      <div>
        <script src="https://secure.polldaddy.com/p/13332507.js"></script>
        <noscript>
          <p>Enable JS to see <a href="https://example.org/other">our other survey</a>.</p>
        </noscript>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="13332507"
        data-embed-src="https://poll.fm/13332507/embed"
        data-embed-url="https://poll.fm/13332507"
      ></div>
      <p>Enable JS to see <a href="https://example.org/other">our other survey</a>.</p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a noscript link to another poll', async () => {
    const value = html`
      <div>
        <script src="https://secure.polldaddy.com/p/13332507.js"></script>
        <noscript><a href="https://poll.fm/13332508">POLL: Another question?</a></noscript>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="13332507"
        data-embed-src="https://poll.fm/13332507/embed"
        data-embed-url="https://poll.fm/13332507"
      ></div>
      <p><noscript><a href="https://poll.fm/13332508">POLL: Another question?</a></noscript></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a noscript link to the poll results page', async () => {
    const value = html`
      <div>
        <script src="https://secure.polldaddy.com/p/13332507.js"></script>
        <noscript><a href="https://poll.fm/13332507/results">View Results</a></noscript>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="13332507"
        data-embed-src="https://poll.fm/13332507/embed"
        data-embed-url="https://poll.fm/13332507"
      ></div>
      <p><noscript><a href="https://poll.fm/13332507/results">View Results</a></noscript></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a noscript link to another retired Polldaddy poll page', async () => {
    const value = html`
      <div>
        <script src="https://static.polldaddy.com/p/1804433.js"></script>
        <noscript><a href="https://polldaddy.com/poll/1804434/">View This Poll</a></noscript>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="1804433"
        data-embed-src="https://poll.fm/1804433/embed"
        data-embed-url="https://poll.fm/1804433"
      ></div>
      <p><noscript><a href="https://polldaddy.com/poll/1804434/">View This Poll</a></noscript></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a noscript link to the poll id under another retired route', async () => {
    const value = html`
      <div>
        <script src="https://static.polldaddy.com/p/1804433.js"></script>
        <noscript><a href="https://polldaddy.com/x/poll/1804433/">View This Poll</a></noscript>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="1804433"
        data-embed-src="https://poll.fm/1804433/embed"
        data-embed-url="https://poll.fm/1804433"
      ></div>
      <p><noscript><a href="https://polldaddy.com/x/poll/1804433/">View This Poll</a></noscript></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a noscript link to a page past the retired poll page', async () => {
    const value = html`
      <div>
        <script src="https://static.polldaddy.com/p/1804433.js"></script>
        <noscript><a href="https://polldaddy.com/poll/1804433/extra">View This Poll</a></noscript>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="crowdsignal"
        data-embed-id="1804433"
        data-embed-src="https://poll.fm/1804433/embed"
        data-embed-url="https://poll.fm/1804433"
      ></div>
      <p><noscript><a href="https://polldaddy.com/poll/1804433/extra">View This Poll</a></noscript></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep the poll beside another provider placeholder with the same id', async () => {
    const value = html`
      <iframe src="https://embeds.audioboom.com/posts/13332507/embed/v4"></iframe>
      <script src="https://secure.polldaddy.com/p/13332507.js"></script>
    `

    expect(await convert(value)).toContain('data-embed-provider="crowdsignal"')
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
