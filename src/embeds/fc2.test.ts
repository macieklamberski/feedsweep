import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  fc2BlogScriptEmbedResolver,
  fc2FlashEmbedResolver,
  fc2IframeEmbedResolver,
  fc2PlayerScriptEmbedResolver,
} from './fc2.js'

describeForEachParser('fc2PlayerScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, fc2PlayerScriptEmbedResolver)

  describe('happy paths', () => {
    it('should read the content, the language, the tag, the title, the duration and the box off the loader', async () => {
      const value = html`
        <script
          src="http://static.fc2.com/video/js/outerplayer.min.js"
          url="http://video.fc2.com/ja/content/20130822huqehDnu/"
          tk="TWpjNE1ESTFNVFk9"
          tl="下肢麻痺娘の奇跡②"
          sj="7"
          d="25"
          w="448"
          h="284"
          charset="UTF-8"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20130822huqehDnu',
        src: 'https://video.fc2.com/embed/player/20130822huqehDnu/?tg=TWpjNE1ESTFNVFk9',
        url: 'https://video.fc2.com/ja/content/20130822huqehDnu/',
        width: 448,
        height: 284,
        title: '下肢麻痺娘の奇跡②',
        duration: 25,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry the suggestions switched off into the player', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="http://video.fc2.com/ja/content/20210528p7G2xWt4/"
          tk="TWpFek1ETTBOVEE9"
          tl="こ"
          d="12"
          w="446"
          h="380"
          charset="UTF-8"
          suggest="off"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20210528p7G2xWt4',
        src: 'https://video.fc2.com/embed/player/20210528p7G2xWt4/?tg=TWpFek1ETTBOVEE9&sg=0',
        url: 'https://video.fc2.com/ja/content/20210528p7G2xWt4/',
        width: 446,
        height: 380,
        title: 'こ',
        duration: 12,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the bare player when the tag is empty and the suggestions are on', async () => {
      const value = html`
        <script
          src="http://static.fc2.com/video/js/outerplayer.min.js"
          url="http://video.fc2.com/ja/content/20150807UyE5pthu/"
          tk=""
          tl="石原さとみ、『サントリー ドリームマッチ 2015』始球式で“マサカリ投法” 本家・村田兆治が伝授"
          sj="29000"
          d="153"
          w="680"
          h="392"
          suggest="on"
          charset="UTF-8"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20150807UyE5pthu',
        src: 'https://video.fc2.com/embed/player/20150807UyE5pthu/',
        url: 'https://video.fc2.com/ja/content/20150807UyE5pthu/',
        width: 680,
        height: 392,
        title:
          '石原さとみ、『サントリー ドリームマッチ 2015』始球式で“マサカリ投法” 本家・村田兆治が伝授',
        duration: 153,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the box the loader draws when it states none', async () => {
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
        width: 512,
        height: 288,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the content id off data-id when the loader states no url', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          data-id="20190922FrnqLhsk"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20190922FrnqLhsk',
        src: 'https://video.fc2.com/embed/player/20190922FrnqLhsk/',
        url: 'https://video.fc2.com/content/20190922FrnqLhsk/',
        width: 512,
        height: 288,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a loader whose url names another host', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://evil.test/content/20190922FrnqLhsk/"
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

    it('should ignore a loader whose url names a page off the content route', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/a/mypage/"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader whose url runs past the content id', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/20190922FrnqLhsk/extra"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader for the adult site', async () => {
      const value = html`
        <script
          src="http://static.fc2.com/video/js/outerplayer.min.js"
          url="http://video.fc2.com/ja/a/content/20151003wWtW4JTt/"
          tk=""
          tl="上戸彩　見事な巨乳がユッサユッサの乳揺れダッシュ"
          sj="45000"
          d="35"
          w="680"
          h="392"
          suggest="on"
          charset="UTF-8"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader for the adult site with no language', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/a/content/20151003wWtW4JTt/"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a language that carries a url separator', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/ja&x=1/content/20190922FrnqLhsk/"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a two-character language that carries a url separator', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/j&/content/20190922FrnqLhsk/"
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

    it('should ignore a data-id outside its alphabet beside a valid url', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/20190922FrnqLhsk/"
          data-id="../20190922FrnqLhsk"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a data-id that carries a url separator', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/20190922FrnqLhsk/"
          data-id="2019/0922FrnqLhsk"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The selector carries the host as a substring, so a foreign host holding it in the query
    // still matches and only the host check in extract can turn it away.
    it('should ignore a loader served from another host', async () => {
      const value = html`
        <script
          src="https://evil.test/video/js/outerplayer.min.js?static.fc2.com/video/js/outerplayer"
          url="https://video.fc2.com/content/20190922FrnqLhsk/"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should play data-id over the id the url names, and keep the url language', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/ja/content/20190922FrnqLhsk/"
          data-id="20210528p7G2xWt4"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20210528p7G2xWt4',
        src: 'https://video.fc2.com/embed/player/20210528p7G2xWt4/',
        url: 'https://video.fc2.com/ja/content/20210528p7G2xWt4/',
        width: 512,
        height: 288,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the url language when data-id supplies the id the url refuses', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/ja/content/2019.09.22/"
          data-id="20210528p7G2xWt4"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20210528p7G2xWt4',
        src: 'https://video.fc2.com/embed/player/20210528p7G2xWt4/',
        url: 'https://video.fc2.com/ja/content/20210528p7G2xWt4/',
        width: 512,
        height: 288,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a language in digits', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/12/content/20190922FrnqLhsk/"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20190922FrnqLhsk',
        src: 'https://video.fc2.com/embed/player/20190922FrnqLhsk/',
        url: 'https://video.fc2.com/12/content/20190922FrnqLhsk/',
        width: 512,
        height: 288,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a language in underscores', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/__/content/20190922FrnqLhsk/"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20190922FrnqLhsk',
        src: 'https://video.fc2.com/embed/player/20190922FrnqLhsk/',
        url: 'https://video.fc2.com/__/content/20190922FrnqLhsk/',
        width: 512,
        height: 288,
      }

      expect(await extract(value)).toEqual(expected)
    })

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
        width: 512,
        height: 288,
        title: 'A title',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should draw the default box over sizes the loader treats as too small', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/20190922FrnqLhsk/"
          w="192"
          h="108"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20190922FrnqLhsk',
        src: 'https://video.fc2.com/embed/player/20190922FrnqLhsk/',
        url: 'https://video.fc2.com/content/20190922FrnqLhsk/',
        width: 512,
        height: 288,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should derive a height the loader treats as too small from the stated width', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/20190922FrnqLhsk/"
          w="448"
          h="100"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20190922FrnqLhsk',
        src: 'https://video.fc2.com/embed/player/20190922FrnqLhsk/',
        url: 'https://video.fc2.com/content/20190922FrnqLhsk/',
        width: 448,
        height: 252,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should round a derived height down as the loader does', async () => {
      const value = html`
        <script
          src="https://static.fc2.com/video/js/outerplayer.min.js"
          url="https://video.fc2.com/content/20210528p7G2xWt4/"
          w="446"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20210528p7G2xWt4',
        src: 'https://video.fc2.com/embed/player/20210528p7G2xWt4/',
        url: 'https://video.fc2.com/content/20210528p7G2xWt4/',
        width: 446,
        height: 250,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('fc2BlogScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, fc2BlogScriptEmbedResolver)

  describe('happy paths', () => {
    it('should switch the suggestions off for a shim with no rel', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="https://admin.blog.fc2.com/fc2video2.php?id=20230116F3WJd7kn&uno=12879754"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20230116F3WJd7kn',
        src: 'https://video.fc2.com/embed/player/20230116F3WJd7kn/?sg=0',
        url: 'https://video.fc2.com/ja/content/20230116F3WJd7kn/',
        width: 446,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the suggestions on for a shim with rel=1', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="http://admin.blog.fc2.com/fc2video2.php?id=20150612T5yKXfrt&rel=1&uno=2136975"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20150612T5yKXfrt',
        src: 'https://video.fc2.com/embed/player/20150612T5yKXfrt/',
        url: 'https://video.fc2.com/ja/content/20150612T5yKXfrt/',
        width: 446,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the smaller box for a shim carrying s', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="https://admin.blog.fc2.com/fc2video2.php?id=20101012GXMya76M&s=1&rel=1&uno=7288880"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20101012GXMya76M',
        src: 'https://video.fc2.com/embed/player/20101012GXMya76M/',
        url: 'https://video.fc2.com/ja/content/20101012GXMya76M/',
        width: 320,
        height: 273,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a shim written protocol-relative', async () => {
      const value = html`
        <script src="//admin.blog.fc2.com/fc2video2.php?id=20180204VvaeWBM9&rel=1&uno=7551266"></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20180204VvaeWBM9',
        src: 'https://video.fc2.com/embed/player/20180204VvaeWBM9/',
        url: 'https://video.fc2.com/ja/content/20180204VvaeWBM9/',
        width: 446,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a shim served from another host', async () => {
      const value = html`
        <script src="https://evil.test/fc2video2.php?admin.blog.fc2.com/fc2video2.php&id=20230116F3WJd7kn"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a shim that names no video', async () => {
      const value = html`
        <script src="https://admin.blog.fc2.com/fc2video2.php?uno=12879754"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a content id outside its alphabet', async () => {
      const value = html`
        <script src="https://admin.blog.fc2.com/fc2video2.php?id=2023-01-16&uno=12879754"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a content id that carries an encoded slash', async () => {
      const value = html`
        <script src="https://admin.blog.fc2.com/fc2video2.php?id=2023%2F0116&uno=12879754"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should switch the suggestions off for a rel other than 1', async () => {
      const value = html`
        <script src="https://admin.blog.fc2.com/fc2video2.php?id=20230116F3WJd7kn&rel=0&uno=12879754"></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20230116F3WJd7kn',
        src: 'https://video.fc2.com/embed/player/20230116F3WJd7kn/?sg=0',
        url: 'https://video.fc2.com/ja/content/20230116F3WJd7kn/',
        width: 446,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the smaller box for an empty s', async () => {
      const value = html`
        <script src="https://admin.blog.fc2.com/fc2video2.php?id=20230116F3WJd7kn&s=&rel=1&uno=12879754"></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20230116F3WJd7kn',
        src: 'https://video.fc2.com/embed/player/20230116F3WJd7kn/',
        url: 'https://video.fc2.com/ja/content/20230116F3WJd7kn/',
        width: 320,
        height: 273,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('fc2IframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, fc2IframeEmbedResolver)

  describe('happy paths', () => {
    it('should read the content id off the embed player', async () => {
      const value = html`
        <iframe
          src="https://video.fc2.com/embed/player/20200926MmXGa7y7/"
          width="560"
          height="315"
          frameborder="0"
          allowfullscreen="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20200926MmXGa7y7',
        src: 'https://video.fc2.com/embed/player/20200926MmXGa7y7/',
        url: 'https://video.fc2.com/content/20200926MmXGa7y7/',
        width: 560,
        height: 315,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read an embed player written with a doubled slash', async () => {
      const value = html`
        <iframe
          src="https://video.fc2.com//embed/player/20201116TN305VJr/"
          width="560"
          height="315"
          frameborder="0"
          allowfullscreen="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20201116TN305VJr',
        src: 'https://video.fc2.com/embed/player/20201116TN305VJr/',
        url: 'https://video.fc2.com/content/20201116TN305VJr/',
        width: 560,
        height: 315,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the tag and the suggestion switch and drop a tracker', async () => {
      const value = html`
        <iframe
          src="https://video.fc2.com/embed/player/20210528p7G2xWt4/?tg=TWpFek1ETTBOVEE9&sg=0&utm_source=feed"
          width="446"
          height="380"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20210528p7G2xWt4',
        src: 'https://video.fc2.com/embed/player/20210528p7G2xWt4/?tg=TWpFek1ETTBOVEE9&sg=0',
        url: 'https://video.fc2.com/content/20210528p7G2xWt4/',
        width: 446,
        height: 380,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/player/20200926MmXGa7y7/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the player route under another segment', async () => {
      const value = '<iframe src="https://video.fc2.com/x/embed/player/20200926MmXGa7y7/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path that runs past the content id', async () => {
      const value =
        '<iframe src="https://video.fc2.com/embed/player/20200926MmXGa7y7/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a content id outside its alphabet', async () => {
      const value = '<iframe src="https://video.fc2.com/embed/player/2020.09.26/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a content id that carries a url separator', async () => {
      const value = '<iframe src="https://video.fc2.com/embed/player/2020&x=0926/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route that is not the player', async () => {
      const value = '<iframe src="https://video.fc2.com/embed/widget/20200926MmXGa7y7/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the player route in any case', async () => {
      const value = '<iframe src="https://video.fc2.com/Embed/Player/20200926MmXGa7y7/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20200926MmXGa7y7',
        src: 'https://video.fc2.com/embed/player/20200926MmXGa7y7/',
        url: 'https://video.fc2.com/content/20200926MmXGa7y7/',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('fc2FlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, fc2FlashEmbedResolver)

  describe('happy paths', () => {
    it('should repair the Flash player onto the embed player', async () => {
      const value = html`
        <embed
          src="http://video.fc2.com/flv2.swf?i=20120101QN5FVkv4&d=4942&movie_stop=off&no_progressive=1&otag=1&sj=31&rel=1&tk=TXpBNE9ERTVOVFU9"
          quality="high"
          bgcolor="#ffffff"
          wmode="transparent"
          width="448"
          height="284"
          name="flv2"
          align="middle"
          allowScriptAccess="sameDomain"
          type="application/x-shockwave-flash"
          pluginspage="http://www.macromedia.com/go/getflashplayer"
          allowFullScreen="true"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20120101QN5FVkv4',
        src: 'https://video.fc2.com/embed/player/20120101QN5FVkv4/?tg=TXpBNE9ERTVOVFU9',
        url: 'https://video.fc2.com/content/20120101QN5FVkv4/',
        width: 448,
        height: 284,
        duration: 4942,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the title the Flash player states', async () => {
      const value = html`
        <embed
          id="flv2"
          width="448"
          height="284"
          type="application/x-shockwave-flash"
          src="http://video.fc2.com/flv2.swf?t=20140107100144&amp;i=20140101rnmrPW9W&amp;d=5774&amp;sj=34&amp;tk=T1RVMk1UZzJNVEE9&amp;lang=ja&amp;rel=1&amp;tl=ガキの使いじゃあらへんで 　大晦日SP―②"
          allowScriptAccess="sameDomain"
          quality="high"
          allowFullScreen="true"
          wmode="transparent"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20140101rnmrPW9W',
        src: 'https://video.fc2.com/embed/player/20140101rnmrPW9W/?tg=T1RVMk1UZzJNVEE9',
        url: 'https://video.fc2.com/ja/content/20140101rnmrPW9W/',
        width: 448,
        height: 284,
        title: 'ガキの使いじゃあらへんで 　大晦日SP―②',
        duration: 5774,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<embed src="https://evil.test/flv2.swf?i=20120101QN5FVkv4" />'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the player file under another segment', async () => {
      const value = '<embed src="http://video.fc2.com/x/flv2.swf?i=20120101QN5FVkv4" />'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path that runs past the player file', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf/extra?i=20120101QN5FVkv4" />'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a Flash player that names no video', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?d=4942&rel=1" />'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a content id outside its alphabet', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?i=../20120101QN5FVkv4" />'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a content id that carries an encoded slash', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?i=2012%2F0101QN5FVkv4" />'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should state no duration when the Flash player states none', async () => {
      const value = html`
        <embed
          src="http://video.fc2.com/flv2.swf?i=20120101QN5FVkv4&rel=1"
          width="448"
          height="284"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20120101QN5FVkv4',
        src: 'https://video.fc2.com/embed/player/20120101QN5FVkv4/',
        url: 'https://video.fc2.com/content/20120101QN5FVkv4/',
        width: 448,
        height: 284,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a language the content page does not link', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?i=20120101QN5FVkv4&lang=zh" />'
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20120101QN5FVkv4',
        src: 'https://video.fc2.com/embed/player/20120101QN5FVkv4/',
        url: 'https://video.fc2.com/zh/content/20120101QN5FVkv4/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a language in uppercase', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?i=20120101QN5FVkv4&lang=JA" />'
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20120101QN5FVkv4',
        src: 'https://video.fc2.com/embed/player/20120101QN5FVkv4/',
        url: 'https://video.fc2.com/JA/content/20120101QN5FVkv4/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a language in digits', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?i=20120101QN5FVkv4&lang=12" />'
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20120101QN5FVkv4',
        src: 'https://video.fc2.com/embed/player/20120101QN5FVkv4/',
        url: 'https://video.fc2.com/12/content/20120101QN5FVkv4/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a language in underscores', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?i=20120101QN5FVkv4&lang=__" />'
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20120101QN5FVkv4',
        src: 'https://video.fc2.com/embed/player/20120101QN5FVkv4/',
        url: 'https://video.fc2.com/__/content/20120101QN5FVkv4/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave out a language carrying a url separator', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?i=20120101QN5FVkv4&lang=ja%2F.." />'
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20120101QN5FVkv4',
        src: 'https://video.fc2.com/embed/player/20120101QN5FVkv4/',
        url: 'https://video.fc2.com/content/20120101QN5FVkv4/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave out a language longer than two characters', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?i=20120101QN5FVkv4&lang=jpn" />'
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20120101QN5FVkv4',
        src: 'https://video.fc2.com/embed/player/20120101QN5FVkv4/',
        url: 'https://video.fc2.com/content/20120101QN5FVkv4/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave out a two-character language carrying a url separator', async () => {
      const value = '<embed src="http://video.fc2.com/flv2.swf?i=20120101QN5FVkv4&lang=j%2F" />'
      const expected: EmbedResolverResult = {
        provider: 'fc2',
        id: '20120101QN5FVkv4',
        src: 'https://video.fc2.com/embed/player/20120101QN5FVkv4/',
        url: 'https://video.fc2.com/content/20120101QN5FVkv4/',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
