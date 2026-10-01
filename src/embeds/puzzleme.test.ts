import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { puzzlemeEmbedResolver, puzzlemeWidgetEmbedResolver } from './puzzleme.js'

describeForEachParser('puzzlemeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, puzzlemeEmbedResolver)

  describe('happy paths', () => {
    it('should rebuild the apex host player onto the puzzleme host', async () => {
      const value = html`
        <iframe
          allowfullscreen="true"
          height="700px"
          name="66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7"
          src="https://amuselabs.com/pmm/crossword?id=e9f5e4db&amp;set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&amp;embed=1"
          style="border: none; display: block !important; margin: 0 !important; position: static; width: 100% !important;"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'puzzleme',
        id: '66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7/e9f5e4db',
        src: 'https://puzzleme.amuselabs.com/pmm/crossword?id=e9f5e4db&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&embed=1',
        url: 'https://puzzleme.amuselabs.com/pmm/crossword?id=e9f5e4db&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the placeholder from the puzzleme host player', async () => {
      const value = html`
        <iframe
          height="700px"
          width="100%"
          allow="web-share; fullscreen"
          style="border:none; width: 100% !important; position: static;display: block !important; margin: 0 !important;"
          src="https://puzzleme.amuselabs.com/pmm/crossword?id=f6f7f0ec&set=e96c1f278ea571cf05ab39a49b24c30f8353cc617eeef60291299f8abe19d07a&embed=1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'puzzleme',
        id: 'e96c1f278ea571cf05ab39a49b24c30f8353cc617eeef60291299f8abe19d07a/f6f7f0ec',
        src: 'https://puzzleme.amuselabs.com/pmm/crossword?id=f6f7f0ec&set=e96c1f278ea571cf05ab39a49b24c30f8353cc617eeef60291299f8abe19d07a&embed=1',
        url: 'https://puzzleme.amuselabs.com/pmm/crossword?id=f6f7f0ec&set=e96c1f278ea571cf05ab39a49b24c30f8353cc617eeef60291299f8abe19d07a',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the kind the feed wrote', async () => {
      const value = html`
        <iframe
          allowfullscreen="true"
          height="1000"
          src="https://amuselabs.com/pmm/wordsearch?id=e6a595e2&amp;set=49ddb4785d8a7ccce44bf0bed910cb3b7a6381e27d9d9b450000ad33e7dc1593&amp;embed=1"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'puzzleme',
        id: '49ddb4785d8a7ccce44bf0bed910cb3b7a6381e27d9d9b450000ad33e7dc1593/e6a595e2',
        src: 'https://puzzleme.amuselabs.com/pmm/wordsearch?id=e6a595e2&set=49ddb4785d8a7ccce44bf0bed910cb3b7a6381e27d9d9b450000ad33e7dc1593&embed=1',
        url: 'https://puzzleme.amuselabs.com/pmm/wordsearch?id=e6a595e2&set=49ddb4785d8a7ccce44bf0bed910cb3b7a6381e27d9d9b450000ad33e7dc1593',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the display options and a tracker', async () => {
      const value = html`
        <iframe
          allowfullscreen="true"
          height="700"
          src="https://amuselabs.com/pmm/crossword?id=5b2817d0&amp;set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&amp;embed=1&amp;compact=1&amp;maxCols=2&amp;utm_source=blog"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'puzzleme',
        id: '66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7/5b2817d0',
        src: 'https://puzzleme.amuselabs.com/pmm/crossword?id=5b2817d0&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&embed=1',
        url: 'https://puzzleme.amuselabs.com/pmm/crossword?id=5b2817d0&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should add the embed flag a player url left out', async () => {
      const value =
        '<iframe src="https://puzzleme.amuselabs.com/pmm/crossword?id=e9f5e4db&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'puzzleme',
        id: '66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7/e9f5e4db',
        src: 'https://puzzleme.amuselabs.com/pmm/crossword?id=e9f5e4db&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&embed=1',
        url: 'https://puzzleme.amuselabs.com/pmm/crossword?id=e9f5e4db&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', async () => {
      const value =
        '<iframe src="https://evil.test/pmm/crossword?id=e9f5e4db&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&embed=1"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player with no set', async () => {
      const value =
        '<iframe src="https://puzzleme.amuselabs.com/pmm/crossword?id=e9f5e4db&embed=1"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player with no id', async () => {
      const value =
        '<iframe src="https://puzzleme.amuselabs.com/pmm/crossword?set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&embed=1"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player path under another segment', async () => {
      const value =
        '<iframe src="https://puzzleme.amuselabs.com/x/pmm/crossword?id=e9f5e4db&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&embed=1"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player path with a trailing segment', async () => {
      const value =
        '<iframe src="https://puzzleme.amuselabs.com/pmm/crossword/extra?id=e9f5e4db&set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&embed=1"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a subdomain that serves its own sets under the player path', async () => {
      const value =
        '<iframe src="https://cdn3.amuselabs.com/pmm/crossword?id=e9f5e4db&set=atlantic&embed=1"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the separate app player, whose ids the puzzleme host does not serve', async () => {
      const value = html`
        <iframe
          height="700px"
          width="100%"
          allow="web-share; fullscreen"
          src="https://app.amuselabs.com/app/crossword?id=557ec78f&set=postcall-x&embed=1"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('puzzlemeWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, puzzlemeWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the loader mount', async () => {
      const value = html`
        <div
          class="pm-embed-div"
          data-id="54602d16"
          data-set="5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48"
          data-puzzletype="crossword"
          data-height="700px"
          data-mobilemargin="10px"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'puzzleme',
        id: '5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48/54602d16',
        src: 'https://puzzleme.amuselabs.com/pmm/crossword?id=54602d16&set=5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48&embed=1',
        url: 'https://puzzleme.amuselabs.com/pmm/crossword?id=54602d16&set=5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48',
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a mount with no puzzle type', async () => {
      const value = html`
        <div
          class="pm-embed-div"
          data-id="54602d16"
          data-set="5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a mount with no id', async () => {
      const value = html`
        <div
          class="pm-embed-div"
          data-set="5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48"
          data-puzzletype="crossword"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a mount with no set', async () => {
      const value = html`
        <div
          class="pm-embed-div"
          data-id="54602d16"
          data-puzzletype="crossword"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('puzzleme through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace a scheme-relative apex host player with a placeholder', async () => {
    const value = html`
      <iframe
        allowfullscreen="true"
        height="700px"
        name="66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7"
        src="//amuselabs.com/pmm/crossword?id=ef03f959&amp;set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&amp;embed=1"
        style="border: none; display: block !important; margin: 0 !important; position: static; width: 100% !important;"
        width="100%"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="700"
        data-embed-id="66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7/ef03f959"
        data-embed-provider="puzzleme"
        data-embed-src="https://puzzleme.amuselabs.com/pmm/crossword?id=ef03f959&amp;set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7&amp;embed=1"
        data-embed-url="https://puzzleme.amuselabs.com/pmm/crossword?id=ef03f959&amp;set=66ec9635ecbe3d3edf3a74bfe0bdbefbd90f7186bb71b1a7f9adb80dda3a06c7"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
  it('should replace the loader mount and keep the prose around it', async () => {
    const value = html`
      <p><code><br />
      <script id="pm-script" src="https://puzzleme.amuselabs.com/pmm/js/puzzleme-embed.js"></script><br />
      <!-- Specifies the puzzle to be embedded on the page. --></p>
      <div class="pm-embed-div" data-id="54602d16" data-set="5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48" data-puzzletype="crossword" data-height="700px" data-mobilemargin="10px"></div>
      <p></code></p>
      <p>Today's mini crossword.</p>
    `
    const expected = html`
      <p><code><script id="pm-script" src="https://puzzleme.amuselabs.com/pmm/js/puzzleme-embed.js"></script></code></p>
      <div
        data-embed-height="700"
        data-embed-id="5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48/54602d16"
        data-embed-provider="puzzleme"
        data-embed-src="https://puzzleme.amuselabs.com/pmm/crossword?id=54602d16&amp;set=5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48&amp;embed=1"
        data-embed-url="https://puzzleme.amuselabs.com/pmm/crossword?id=54602d16&amp;set=5af39ea5bb2b35a56ac4bd3ce390f334711dcd7db2135f17dcababdeae256d48"
      ></div>
      <p>Today's mini crossword.</p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
