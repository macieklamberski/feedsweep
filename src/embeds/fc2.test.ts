import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { fc2BlogScriptEmbedResolver, fc2PlayerScriptEmbedResolver } from './fc2.js'

describeForEachParser('fc2PlayerScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, fc2PlayerScriptEmbedResolver)

  describe('happy paths', () => {
    it('should read the content, the title, the duration and the box off the loader', async () => {
      const value = html`
        <script
          src="http://static.fc2.com/video/js/outerplayer.min.js"
          url="http://video.fc2.com/ja/content/20140511sTWHEuNd/"
          tk="TlRjNU1qa3dOemM9"
          tl="A title"
          sj="37000"
          d="1709"
          w="448"
          h="368"
          suggest="on"
          charset="UTF-8"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20140511sTWHEuNd',
        src: 'https://video.fc2.com/embed/player/20140511sTWHEuNd/',
        url: 'https://video.fc2.com/content/20140511sTWHEuNd/',
        width: 448,
        height: 368,
        title: 'A title',
        duration: 1709,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a content page spelled without a language', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/20190922FrnqLhsk/"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20190922FrnqLhsk',
        src: 'https://video.fc2.com/embed/player/20190922FrnqLhsk/',
        url: 'https://video.fc2.com/content/20190922FrnqLhsk/',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a loader whose url names another host', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://evil.test/video.fc2.com/content/20190922FrnqLhsk/"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader whose url names no content page', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/a/login.php"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a content id outside its alphabet', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/2019.09.22/"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The selector carries the host as a substring, so a foreign host holding it in the path
    // still matches and only the host check in extract can turn it away.
    it('should ignore a loader served from another host', async () => {
      const value = html`
        <script
          src="https://evil.test/static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/20190922FrnqLhsk/"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should drop a duration the loader states as zero', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/20190922FrnqLhsk/"
          tl="A title"
          d="0"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20190922FrnqLhsk',
        src: 'https://video.fc2.com/embed/player/20190922FrnqLhsk/',
        url: 'https://video.fc2.com/content/20190922FrnqLhsk/',
        title: 'A title',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('fc2BlogScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, fc2BlogScriptEmbedResolver)

  describe('happy paths', () => {
    it('should read the content id off the blog shim', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="https://admin.blog.fc2.com/fc2video2.php?id=20210528p7G2xWt4&uno=7551266"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20210528p7G2xWt4',
        src: 'https://video.fc2.com/embed/player/20210528p7G2xWt4/',
        url: 'https://video.fc2.com/content/20210528p7G2xWt4/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a shim written protocol-relative', async () => {
      const value = html`
        <script src="//admin.blog.fc2.com/fc2video2.php?id=20180204VvaeWBM9&uno=7551266"></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20180204VvaeWBM9',
        src: 'https://video.fc2.com/embed/player/20180204VvaeWBM9/',
        url: 'https://video.fc2.com/content/20180204VvaeWBM9/',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a shim served from another host', async () => {
      const value = html`
        <script src="https://evil.test/admin.blog.fc2.com/fc2video2.php?id=20210528p7G2xWt4"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a shim that names no video', async () => {
      const value = html`
        <script src="https://admin.blog.fc2.com/fc2video2.php?uno=7551266"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a content id outside its alphabet', async () => {
      const value = html`
        <script src="https://admin.blog.fc2.com/fc2video2.php?id=2021-05-28&uno=7551266"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
