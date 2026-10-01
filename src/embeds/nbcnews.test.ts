import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { nbcnewsEmbedResolver } from './nbcnews.js'

describeForEachParser('nbcnewsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, nbcnewsEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the embedded-video frame a block editor writes', async () => {
      const value = html`
        <iframe
          class="wp-block-embed is-type-video"
          src="https://www.nbcnews.com/news/embedded-video/mmvo265959493641"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo265959493641',
        src: 'https://www.nbcnews.com/news/embedded-video/mmvo265959493641',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the earlier widget frame and mint it over https', async () => {
      const value = html`
        <iframe src="http://www.nbcnews.com/widget/video-embed/713265731534"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo713265731534',
        src: 'https://www.nbcnews.com/widget/video-embed/713265731534',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the TODAY embedded-video frame onto the same key', async () => {
      const value = html`
        <iframe
          class="wp-block-embed is-type-video"
          src="https://www.today.com/today/embedded-video/mmvo265371205585"
          width="100%"
          height="100%"
          frameborder="0"
          allowfullscreen="yes"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo265371205585',
        src: 'https://www.today.com/today/embedded-video/mmvo265371205585',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the TODAY offsite frame onto the player it redirects to', async () => {
      const value = html`
        <iframe
          frameborder="0"
          scrolling="no"
          style="height: 100%; position: absolute; width: 100%;"
          src="https://www.today.com/offsite/jumbo-jumper-yard-pong-games-and-accessories-for-outdoor-fun-1244547139528"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo1244547139528',
        src: 'https://www.today.com/embedded-video/mmvo1244547139528',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the embedded-video path', async () => {
      const value = html`
        <iframe src="https://evil.test/news/embedded-video/mmvo265959493641"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host that only ends in the platform name', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com.evil.test/news/embedded-video/mmvo265959493641"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an article page that is not a player', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/politics/congress/rcna123456"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should drop the autoplay flag the carrier writes into its query', async () => {
      const value = html`
        <iframe
          src="https://www.nbcnews.com/news/embedded-video/mmvo265959493641?autoplay=true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo265959493641',
        src: 'https://www.nbcnews.com/news/embedded-video/mmvo265959493641',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should key an uppercase id to the lowercase id and src', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/news/embedded-video/MMVO265460805743"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo265460805743',
        src: 'https://www.nbcnews.com/news/embedded-video/mmvo265460805743',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should key uppercase route words to the lowercase id and src', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/NEWS/EMBEDDED-VIDEO/mmvo265460805743"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo265460805743',
        src: 'https://www.nbcnews.com/news/embedded-video/mmvo265460805743',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should key uppercase TODAY route words and id to the lowercase id and src', async () => {
      const value = html`
        <iframe src="https://www.today.com/TODAY/EMBEDDED-VIDEO/MMVO265460805743"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo265460805743',
        src: 'https://www.today.com/today/embedded-video/mmvo265460805743',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should refuse uppercase widget route words the platform does not serve', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/WIDGET/VIDEO-EMBED/265460805743"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse an uppercase offsite route word the platform does not serve', async () => {
      const value = html`
        <iframe src="https://www.today.com/OFFSITE/yard-pong-games-1244547139528"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a bare number on the embedded-video route', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/news/embedded-video/265959493641"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use an mmvo id on the widget route as written, even if the player answers an error', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/widget/video-embed/mmvo265959493641"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        src: 'https://www.nbcnews.com/widget/video-embed/mmvo265959493641',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed mmvo id as written, even if the player answers an error', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/news/embedded-video/mmvo265959493641abc"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo265959493641abc',
        src: 'https://www.nbcnews.com/news/embedded-video/mmvo265959493641abc',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should refuse an mmvo id with a leading prefix on the embedded-video route', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/news/embedded-video/xmmvo265959493641"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed widget id as written, even if the player answers an error', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/widget/video-embed/713265731534abc"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        src: 'https://www.nbcnews.com/widget/video-embed/713265731534abc',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should refuse an offsite slug whose digits are followed by more text', async () => {
      const value = html`
        <iframe src="https://www.today.com/offsite/yard-pong-games-1244547139528abc"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse an offsite slug with no trailing digits', async () => {
      const value = html`
        <iframe src="https://www.today.com/offsite/yard-pong-games-and-accessories"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a player path nested under another route', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/now/news/embedded-video/mmvo265959493641"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the retired Flash player on nbcnews.com/id', () => {
    it('should refuse the id route the Flash embed addresses', async () => {
      const value = html`
        <embed
          name="msnbc517611"
          src="http://www.nbcnews.com/id/32545640"
          width="420"
          height="245"
        ></embed>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
