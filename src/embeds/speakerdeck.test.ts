import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  speakerdeckIframeEmbedResolver,
  speakerdeckLegacyScriptEmbedResolver,
  speakerdeckResolveEmbed,
  speakerdeckScriptEmbedResolver,
} from './speakerdeck.js'

describeForEachParser('speakerdeckScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, speakerdeckScriptEmbedResolver)

  // Measured 2026-08-11: 36 corpus feeds carry a 24-char Mongo ObjectId from 2011-2012 and
  // every sampled one still plays. The old 32-char-only rule dropped all of them.
  describe('legacy ids and slides', () => {
    it('should accept a legacy 24-char deck id', async () => {
      const value = html`
        <script
          class="speakerdeck-embed"
          data-id="4f2b3c1d5e6a7b8c9d0e1f2a"
          src="//speakerdeck.com/assets/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '4f2b3c1d5e6a7b8c9d0e1f2a',
        src: 'https://speakerdeck.com/player/4f2b3c1d5e6a7b8c9d0e1f2a',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A feed can embed one deck at many slides. Without this they collapse into identical
    // placeholders.
    it('should carry data-slide into the player url', async () => {
      const value = html`
        <script
          class="speakerdeck-embed"
          data-id="40746bbd65b944eb848e90ab1be552c0"
          data-slide="21"
          src="//speakerdeck.com/assets/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '40746bbd65b944eb848e90ab1be552c0/21',
        src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=21',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a slide written inside the id attribute', async () => {
      const value = html`
        <script
          class="speakerdeck-embed"
          data-id="40746bbd65b944eb848e90ab1be552c0?slide=69"
          src="//speakerdeck.com/assets/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '40746bbd65b944eb848e90ab1be552c0/69',
        src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=69',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed slide as written, even if the player answers an error', async () => {
      const value = html`
        <script
          class="speakerdeck-embed"
          data-id="40746bbd65b944eb848e90ab1be552c0"
          data-slide="last"
          src="//speakerdeck.com/assets/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '40746bbd65b944eb848e90ab1be552c0/last',
        src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=last',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('happy paths', () => {
    it('should mint the player url from the deck id', async () => {
      const value = html`
        <script
          async
          class="speakerdeck-embed"
          data-id="40746bbd65b944eb848e90ab1be552c0"
          data-ratio="1.77777777777778"
          src="//speakerdeck.com/assets/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '40746bbd65b944eb848e90ab1be552c0',
        src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should give the deck the player ratio over a taller one the script states', async () => {
      const value = html`
        <script
          class="speakerdeck-embed"
          data-id="198d4fae73df442e89b76766b54e4773"
          data-ratio="1.33333333333333"
          src="https://speakerdeck.com/assets/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '198d4fae73df442e89b76766b54e4773',
        src: 'https://speakerdeck.com/player/198d4fae73df442e89b76766b54e4773',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should give the default ratio to a script carrying none', async () => {
      const value = html`
        <script
          class="speakerdeck-embed"
          data-id="198d4fae73df442e89b76766b54e4773"
          src="//speakerdeck.com/assets/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '198d4fae73df442e89b76766b54e4773',
        src: 'https://speakerdeck.com/player/198d4fae73df442e89b76766b54e4773',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should use a malformed deck id as written, even if the player answers an error', async () => {
      const value = html`
        <script
          class="speakerdeck-embed"
          data-id="../decks/evil"
          src="//speakerdeck.com/assets/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '../decks/evil',
        src: 'https://speakerdeck.com/player/../decks/evil',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed slide suffix as written, even if the player answers an error', async () => {
      const value = html`
        <script
          class="speakerdeck-embed"
          data-id="40746bbd65b944eb848e90ab1be552c0?slide=69a"
          src="//speakerdeck.com/assets/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '40746bbd65b944eb848e90ab1be552c0/69a',
        src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=69a',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for an empty id', async () => {
      const value = html`
        <script class="speakerdeck-embed" data-id="" src="//speakerdeck.com/assets/embed.js"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should not match a script without the embed class', async () => {
      const value = html`
        <script data-id="40746bbd65b944eb848e90ab1be552c0" src="//speakerdeck.com/assets/embed.js"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('speakerdeckLegacyScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, speakerdeckLegacyScriptEmbedResolver)

  describe('happy paths', () => {
    it('should mint the player url from the deck id in the script path', async () => {
      const value = html`
        <script src="http://speakerdeck.com/embed/4ee19eec04357e0050004017.js"></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '4ee19eec04357e0050004017',
        src: 'https://speakerdeck.com/player/4ee19eec04357e0050004017',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the size preset the script url names', async () => {
      const value = html`
        <script src="https://speakerdeck.com/embed/4e80df6a55e59a0063001d32.js?size=preview"></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'speakerdeck',
        id: '4e80df6a55e59a0063001d32',
        src: 'https://speakerdeck.com/player/4e80df6a55e59a0063001d32',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the script path', async () => {
      const value = html`
        <script src="https://evil.test/embed/4ee19eec04357e0050004017.js?speakerdeck.com/embed/"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the script path under another route', async () => {
      const value = html`
        <script src="https://speakerdeck.com/x/embed/4ee19eec04357e0050004017.js?speakerdeck.com/embed/"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment after the script name', async () => {
      const value = html`
        <script src="https://speakerdeck.com/embed/4ee19eec04357e0050004017.js/extra"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('speakerdeckResolveEmbed', () => {
  it('should give a size-less player the default deck ratio', () => {
    const value = 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0'
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '40746bbd65b944eb848e90ab1be552c0',
      src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0',
      ratio: '16/9',
    }

    expect(speakerdeckResolveEmbed(value)).toEqual(expected)
  })

  // Speaker Deck has minted 24 and 32 character ids, and the length is not what names a deck.
  it('should resolve a deck id longer than the ones minted so far', () => {
    const value = 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0abcdef'
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '40746bbd65b944eb848e90ab1be552c0abcdef',
      src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0abcdef',
      ratio: '16/9',
    }

    expect(speakerdeckResolveEmbed(value)).toEqual(expected)
  })

  // The script form has always kept the slide, so the same deck at two slides collapsed into
  // one placeholder when it arrived as an iframe instead.
  it('should carry the slide the player url states', () => {
    const value = 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=21'
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '40746bbd65b944eb848e90ab1be552c0/21',
      src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=21',
      ratio: '16/9',
    }

    expect(speakerdeckResolveEmbed(value)).toEqual(expected)
  })

  it('should use a malformed slide as written, even if the player answers an error', () => {
    const value = 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=last'
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '40746bbd65b944eb848e90ab1be552c0/last',
      src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=last',
      ratio: '16/9',
    }

    expect(speakerdeckResolveEmbed(value)).toEqual(expected)
  })

  it('should ignore a deck page rather than a player', () => {
    const value = 'https://speakerdeck.com/user/some-deck'

    expect(speakerdeckResolveEmbed(value)).toBeUndefined()
  })

  it('should ignore a player route with no deck id', () => {
    const value = 'https://speakerdeck.com/embed/'

    expect(speakerdeckResolveEmbed(value)).toBeUndefined()
  })

  it('should use a malformed deck id as written, even if the player answers an error', () => {
    const value = 'https://speakerdeck.com/player/not-a-deck'
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: 'not-a-deck',
      src: 'https://speakerdeck.com/player/not-a-deck',
      ratio: '16/9',
    }

    expect(speakerdeckResolveEmbed(value)).toEqual(expected)
  })
})

describeForEachParser('speakerdeckIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, speakerdeckIframeEmbedResolver)

  // The player carrier states no ratio of its own, so a size-less one takes the deck default.
  it('should give a size-less player the default deck ratio', async () => {
    const value = html`
      <iframe src="https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '40746bbd65b944eb848e90ab1be552c0',
      src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  // The script form has always kept the slide, so the same deck at two slides collapsed into
  // one placeholder when it arrived as an iframe instead.
  it('should carry the slide the player url states', async () => {
    const value = html`
      <iframe src="https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=21"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '40746bbd65b944eb848e90ab1be552c0/21',
      src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=21',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should use a malformed slide as written, even if the player answers an error', async () => {
    const value = html`
      <iframe src="https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=last"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '40746bbd65b944eb848e90ab1be552c0/last',
      src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0?slide=last',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should mint the player url from the legacy embed iframe', async () => {
    const value = html`
      <iframe
        src="https://speakerdeck.com/embed/4e79b461c9bdcb003f00331d?size=preview"
        frameborder="0"
        style="height: 563.65625px;"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '4e79b461c9bdcb003f00331d',
      src: 'https://speakerdeck.com/player/4e79b461c9bdcb003f00331d',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should ignore a deck page rather than a player', async () => {
    const value = '<iframe src="https://speakerdeck.com/user/some-deck"></iframe>'

    expect(await extract(value)).toBeUndefined()
  })

  it('should use a malformed deck id as written, even if the player answers an error', async () => {
    const value = '<iframe src="https://speakerdeck.com/player/not-a-deck"></iframe>'
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: 'not-a-deck',
      src: 'https://speakerdeck.com/player/not-a-deck',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should ignore a foreign host carrying the player path', async () => {
    const value =
      '<iframe src="https://evil.test/player/40746bbd65b944eb848e90ab1be552c0"></iframe>'

    expect(await extract(value)).toBeUndefined()
  })

  it('should carry the deck title the carrier states', async () => {
    const value = html`
      <iframe
        src="https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0"
        title="Designing for the unexpected"
        width="710"
        height="399"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '40746bbd65b944eb848e90ab1be552c0',
      src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0',
      ratio: '16/9',
      title: 'Designing for the unexpected',
    }

    expect(await extract(value)).toEqual(expected)
  })

  // The snippet writes the four-character string rather than omitting the attribute.
  it('should treat a literal null title as absent', async () => {
    const value = html`
      <iframe
        src="https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0"
        title="null"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'speakerdeck',
      id: '40746bbd65b944eb848e90ab1be552c0',
      src: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

// The enclosure probe offers every attachment a feed carries to this resolver, and the deck
// route is on Speaker Deck's own host, so the file-name check is what keeps a file playable.
describeForEachParser('speakerdeck through the pipeline', (parseHtml) => {
  it('should turn the legacy script into a deck placeholder', async () => {
    const value = html`
      <p>Slides:</p>
      <script src="http://speakerdeck.com/embed/4ee19eec04357e0050004017.js"></script>
    `
    const expected = html`
      <p>Slides:</p>
      <div
        data-embed-ratio="16/9"
        data-embed-id="4ee19eec04357e0050004017"
        data-embed-provider="speakerdeck"
        data-embed-src="https://speakerdeck.com/player/4ee19eec04357e0050004017"
      ></div>
    `

    expect(
      await transformContent(value, {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com/post',
      }),
    ).toEqualHtml(expected)
  })

  it('should leave a video enclosure on the speakerdeck host playable', async () => {
    const enclosures = [
      {
        url: 'https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://speakerdeck.com/player/40746bbd65b944eb848e90ab1be552c0.mp4"></video>
      <p>Body</p>
    `

    expect(
      await transformContent('<p>Body</p>', {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com/post',
        enclosures,
      }),
    ).toEqualHtml(expected)
  })
})
