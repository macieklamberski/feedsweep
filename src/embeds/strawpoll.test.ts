import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  readStrawpollHeight,
  strawpollIframeEmbedResolver,
  strawpollMountEmbedResolver,
  strawpollResolveEmbed,
} from './strawpoll.js'

describe('strawpollResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the poll frame', () => {
      const value = 'https://strawpoll.com/embed/e7ZJaM1BPg3'
      const expected: EmbedResolverResult = {
        provider: 'strawpoll',
        id: 'e7ZJaM1BPg3',
        src: 'https://strawpoll.com/embed/e7ZJaM1BPg3',
        url: 'https://strawpoll.com/e7ZJaM1BPg3',
        thumbnail: 'https://cdn.strawpoll.com/images/polls/previews/e7ZJaM1BPg3-c.png',
      }

      expect(strawpollResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the current frame from the older polls route', () => {
      const value = 'https://strawpoll.com/embed/polls/XOgONJpzrn3'
      const expected: EmbedResolverResult = {
        provider: 'strawpoll',
        id: 'XOgONJpzrn3',
        src: 'https://strawpoll.com/embed/XOgONJpzrn3',
        url: 'https://strawpoll.com/XOgONJpzrn3',
        thumbnail: 'https://cdn.strawpoll.com/images/polls/previews/XOgONJpzrn3-c.png',
      }

      expect(strawpollResolveEmbed(value)).toEqual(expected)
    })

    it('should read the poll frame written with a trailing slash', () => {
      const value = 'https://strawpoll.com/embed/e7ZJaM1BPg3/'
      const expected: EmbedResolverResult = {
        provider: 'strawpoll',
        id: 'e7ZJaM1BPg3',
        src: 'https://strawpoll.com/embed/e7ZJaM1BPg3',
        url: 'https://strawpoll.com/e7ZJaM1BPg3',
        thumbnail: 'https://cdn.strawpoll.com/images/polls/previews/e7ZJaM1BPg3-c.png',
      }

      expect(strawpollResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the embed route with no poll', () => {
      const value = 'https://strawpoll.com/embed'

      expect(strawpollResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the embed route under a leading segment', () => {
      const value = 'https://strawpoll.com/x/embed/e7ZJaM1BPg3'

      expect(strawpollResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a trailing segment after the poll', () => {
      const value = 'https://strawpoll.com/embed/e7ZJaM1BPg3/results'

      expect(strawpollResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the embed route in uppercase', () => {
      const value = 'https://strawpoll.com/EMBED/e7ZJaM1BPg3'

      expect(strawpollResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the poll page, which refuses framing', () => {
      const value = 'https://strawpoll.com/e7ZJaM1BPg3'

      expect(strawpollResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the embed route on the file subdomain', () => {
      const value = 'https://cdn.strawpoll.com/embed/e7ZJaM1BPg3'

      expect(strawpollResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/embed/e7ZJaM1BPg3'

      expect(strawpollResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use an id as written, even if the poll is gone', () => {
      const value = 'https://strawpoll.com/embed/zzzzzzzzzzz'
      const expected: EmbedResolverResult = {
        provider: 'strawpoll',
        id: 'zzzzzzzzzzz',
        src: 'https://strawpoll.com/embed/zzzzzzzzzzz',
        url: 'https://strawpoll.com/zzzzzzzzzzz',
        thumbnail: 'https://cdn.strawpoll.com/images/polls/previews/zzzzzzzzzzz-c.png',
      }

      expect(strawpollResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a query the frame does not need', () => {
      const value = 'https://strawpoll.com/embed/e7ZJaM1BPg3?utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'strawpoll',
        id: 'e7ZJaM1BPg3',
        src: 'https://strawpoll.com/embed/e7ZJaM1BPg3',
        url: 'https://strawpoll.com/e7ZJaM1BPg3',
        thumbnail: 'https://cdn.strawpoll.com/images/polls/previews/e7ZJaM1BPg3-c.png',
      }

      expect(strawpollResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('strawpollIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, strawpollIframeEmbedResolver)

  describe('happy paths', () => {
    it('should read the frame the snippet writes', async () => {
      const value = html`
        <iframe
          title="StrawPoll Embed"
          id="strawpoll_iframe_7rnzVXEeLnO"
          src="https://strawpoll.com/embed/7rnzVXEeLnO"
          style="position: static; visibility: visible; display: block; width: 100%; flex-grow: 1;"
          frameborder="0"
          allowfullscreen
          allowtransparency
          loading="lazy"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'strawpoll',
        id: '7rnzVXEeLnO',
        src: 'https://strawpoll.com/embed/7rnzVXEeLnO',
        url: 'https://strawpoll.com/7rnzVXEeLnO',
        thumbnail: 'https://cdn.strawpoll.com/images/polls/previews/7rnzVXEeLnO-c.png',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no size over the box the snippet declares', async () => {
      const value = html`
        <iframe
          src="https://strawpoll.com/embed/e7ZJaM1BPg3"
          width="640"
          height="544"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'strawpoll',
        id: 'e7ZJaM1BPg3',
        src: 'https://strawpoll.com/embed/e7ZJaM1BPg3',
        url: 'https://strawpoll.com/e7ZJaM1BPg3',
        thumbnail: 'https://cdn.strawpoll.com/images/polls/previews/e7ZJaM1BPg3-c.png',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value = '<iframe src="https://strawpoll.com.evil.test/embed/e7ZJaM1BPg3"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('strawpollMountEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, strawpollMountEmbedResolver)

  describe('happy paths', () => {
    it('should read the poll out of the empty wrapper', async () => {
      const value = html`
        <div
          id="strawpoll_kjn1DJlNxyQ"
          class="strawpoll-embed"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'strawpoll',
        id: 'kjn1DJlNxyQ',
        src: 'https://strawpoll.com/embed/kjn1DJlNxyQ',
        url: 'https://strawpoll.com/kjn1DJlNxyQ',
        thumbnail: 'https://cdn.strawpoll.com/images/polls/previews/kjn1DJlNxyQ-c.png',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a wrapper whose id names no poll', async () => {
      const value = html`
        <div
          id="strawpoll_"
          class="strawpoll-embed"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a wrapper without the snippet id', async () => {
      const value = html`
        <div
          id="poll_kjn1DJlNxyQ"
          class="strawpoll-embed"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the snippet id on another class', async () => {
      const value = html`
        <div
          id="strawpoll_kjn1DJlNxyQ"
          class="poll-embed"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('readStrawpollHeight', () => {
  // What the poll posts on its own after rendering, at 640 wide.
  it('should read the height out of a resize message', () => {
    const value = { type: 'strawpoll_resize', id: 'e7ZJaM1BPg3', value: 690 }

    expect(readStrawpollHeight(value)).toBe(690)
  })

  it('should read nothing from the session token request', () => {
    const value = { type: 'strawpoll_request_session_token', id: 'e7ZJaM1BPg3', value: 690 }

    expect(readStrawpollHeight(value)).toBeUndefined()
  })

  it('should read nothing from a message that is not an object', () => {
    const value = 'strawpoll_resize'

    expect(readStrawpollHeight(value)).toBeUndefined()
  })
})

describeForEachParser('strawpoll snippets through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should build the placeholder from a frame with no wrapper', async () => {
    const value = html`
      <iframe
        title="StrawPoll Embed"
        id="strawpoll_iframe_ajnE1v35xnW"
        src="https://strawpoll.com/embed/ajnE1v35xnW"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-thumbnail="https://cdn.strawpoll.com/images/polls/previews/ajnE1v35xnW-c.png"
        data-embed-url="https://strawpoll.com/ajnE1v35xnW"
        data-embed-id="ajnE1v35xnW"
        data-embed-provider="strawpoll"
        data-embed-src="https://strawpoll.com/embed/ajnE1v35xnW"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should build the placeholder from a wrapper the feed emptied', async () => {
    const value = html`
      <p>Votez</p>
      <div
        id="strawpoll_kjn1DJlNxyQ"
        class="strawpoll-embed"
      ></div>
    `
    const expected = html`
      <p>Votez</p>
      <div
        data-embed-thumbnail="https://cdn.strawpoll.com/images/polls/previews/kjn1DJlNxyQ-c.png"
        data-embed-url="https://strawpoll.com/kjn1DJlNxyQ"
        data-embed-id="kjn1DJlNxyQ"
        data-embed-provider="strawpoll"
        data-embed-src="https://strawpoll.com/embed/kjn1DJlNxyQ"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should build one placeholder from the wrapper holding the frame', async () => {
    const value = html`
      <div
        class="strawpoll-embed"
        id="strawpoll_e7ZJajkxMg3"
        style="height: 544px; max-width: 640px; width: 100%; margin: 0 auto; display: flex; flex-direction: column;"
      >
        <iframe
          title="StrawPoll Embed"
          id="strawpoll_iframe_e7ZJajkxMg3"
          src="https://strawpoll.com/embed/e7ZJajkxMg3"
          style="position: static; visibility: visible; display: block; width: 100%; flex-grow: 1;"
          frameborder="0"
          allowfullscreen
          allowtransparency=""
          name="strawpoll_iframe_e7ZJajkxMg3"
        >Loading...</iframe>
      </div>
      <script
        async
        src="https://cdn.strawpoll.com/dist/widgets.js"
        charset="utf-8"
      ></script>
    `
    const expected = html`
      <div
        data-embed-thumbnail="https://cdn.strawpoll.com/images/polls/previews/e7ZJajkxMg3-c.png"
        data-embed-url="https://strawpoll.com/e7ZJajkxMg3"
        data-embed-id="e7ZJajkxMg3"
        data-embed-provider="strawpoll"
        data-embed-src="https://strawpoll.com/embed/e7ZJajkxMg3"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should build no second placeholder from a repeated wrapper', async () => {
    const value = html`
      <div
        class="strawpoll-embed"
        id="strawpoll_XOgONJpzrn3"
      >
        <iframe
          id="strawpoll_iframe_XOgONJpzrn3"
          src="https://strawpoll.com/embed/polls/XOgONJpzrn3"
          title="StrawPoll Embed"
        >Loading...</iframe>
      </div>
      <br />
      <div
        class="strawpoll-embed"
        id="strawpoll_XOgONJpzrn3"
      ><br /></div>
    `
    const expected = html`
      <div
        data-embed-thumbnail="https://cdn.strawpoll.com/images/polls/previews/XOgONJpzrn3-c.png"
        data-embed-url="https://strawpoll.com/XOgONJpzrn3"
        data-embed-id="XOgONJpzrn3"
        data-embed-provider="strawpoll"
        data-embed-src="https://strawpoll.com/embed/XOgONJpzrn3"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
