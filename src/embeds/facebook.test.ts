import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedRenderHint, EmbedResolverResult } from '../types.js'
import {
  facebookAmpEmbedResolver,
  facebookBlockquoteEmbedResolver,
  facebookFlashEmbedResolver,
  facebookIframeEmbedResolver,
  facebookRenderHint,
  facebookResolveEmbed,
  facebookS9eEmbedResolver,
  facebookWidgetEmbedResolver,
  facebookXfbmlEmbedResolver,
  readFacebookHeight,
} from './facebook.js'

describeForEachParser('facebookWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, facebookWidgetEmbedResolver)

  describe('the post div', () => {
    it('should mint the post plugin url from the data-href', async () => {
      const value = html`
        <div
          class="fb-post"
          data-href="https://www.facebook.com/BlowflyOfficial/posts/10153426898243990:0"
          data-width="466"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/BlowflyOfficial/posts/10153426898243990:0',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FBlowflyOfficial%2Fposts%2F10153426898243990%3A0',
        url: 'https://www.facebook.com/BlowflyOfficial/posts/10153426898243990:0',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the href query encoded in the plugin url', async () => {
      const value = html`
        <div
          class="fb-post"
          data-href="https://www.facebook.com/renodancecompany/photos/317243261734291/?type=1"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/renodancecompany/photos/317243261734291/?type=1',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Frenodancecompany%2Fphotos%2F317243261734291%2F%3Ftype%3D1',
        url: 'https://www.facebook.com/renodancecompany/photos/317243261734291/?type=1',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The id goes absolute alongside the plugin href, so it reads the same here as it does off a
    // plugin iframe. `url` is the one field left as written, because `resolveUrlFn` gives that
    // one its scheme on the way to the placeholder.
    it('should mint an absolute plugin href and id from a protocol-relative data-href', async () => {
      const value = html`
        <div
          class="fb-post"
          data-href="//www.facebook.com/PageName/posts/123"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: '//www.facebook.com/PageName/posts/123',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the video div', () => {
    it('should mint the video plugin url from the data-href', async () => {
      const value = html`
        <div
          class="fb-video"
          data-href="https://www.facebook.com/WillowbankRaceway/videos/732638203506014/"
          data-width="500"
          data-show-text="true"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/WillowbankRaceway/videos/732638203506014/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FWillowbankRaceway%2Fvideos%2F732638203506014%2F',
        url: 'https://www.facebook.com/WillowbankRaceway/videos/732638203506014/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The mobile app hands out fb.watch links and publishers paste them into the widget.
    it('should mint the plugin url from an fb.watch short link', async () => {
      const value = html`
        <div
          class="fb-video"
          data-href="https://fb.watch/abcDEF123/"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://fb.watch/abcDEF123/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Ffb.watch%2FabcDEF123%2F',
        url: 'https://fb.watch/abcDEF123/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the dialog fallback blockquote inside the div', () => {
    // The fallback is the only readable copy of the post, so replacing the widget without it
    // would lose the text outright.
    it('should lift the text, the page and the date out of it', async () => {
      const value = html`
        <div class="fb-post" data-href="https://www.facebook.com/PageName/posts/123">
          <div class="fb-xfbml-parse-ignore">
            <blockquote cite="https://www.facebook.com/PageName/posts/123">
              <p>Caption text about the thing.</p>
              Posted by <a href="https://www.facebook.com/PageName/">PageName</a> on
              <a href="https://www.facebook.com/PageName/posts/123">Tuesday, 3 June 2026</a>
            </blockquote>
          </div>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
        description: 'Caption text about the thing.',
        author: 'PageName',
        date: 'Tuesday, 3 June 2026',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // "Posted by {page} on {date}" is a fixed pair of anchors. Anything else is a hand-edited
    // fallback, so the text is kept and no author or date is invented from it.
    it('should keep the text and claim no author or date from another byline', async () => {
      const value = html`
        <div class="fb-post" data-href="https://www.facebook.com/PageName/posts/123">
          <div class="fb-xfbml-parse-ignore">
            <blockquote cite="https://www.facebook.com/PageName/posts/123">
              <p>Caption only, no byline anchors.</p>
            </blockquote>
          </div>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
        description: 'Caption only, no byline anchors.',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for an empty data-href', async () => {
      const value = html`
        <div
          class="fb-post"
          data-href=""
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should not match a post div without the data-href attribute', async () => {
      const value = html`
        <div
          class="fb-post"
          data-width="466"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a non-facebook href', async () => {
      const value = html`
        <div
          class="fb-post"
          data-href="https://evil.test/PageName/posts/123"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a lookalike host', async () => {
      const value = html`
        <div
          class="fb-video"
          data-href="https://facebook.com.evil.test/videos/732638203506014/"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The page-promo widgets are chrome rather than article content, the same family as the
    // share buttons, so the selector deliberately stops short of them.
    it('should not match a fb-like button', async () => {
      const value = html`
        <div
          class="fb-like"
          data-href="https://www.facebook.com/PageName"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should not match a fb-page timeline', async () => {
      const value = html`
        <div
          class="fb-page"
          data-href="https://www.facebook.com/PageName"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('facebookXfbmlEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, facebookXfbmlEmbedResolver)

  describe('happy paths', () => {
    it('should mint the post plugin url from the plain href', async () => {
      const value = '<fb:post href="https://www.facebook.com/PageName/posts/123"></fb:post>'
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a non-facebook href', async () => {
      const value = '<fb:post href="https://evil.test/PageName/posts/123"></fb:post>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('facebookAmpEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, facebookAmpEmbedResolver)

  describe('happy paths', () => {
    it('should resolve a post to the post plugin and ignore the declared size', async () => {
      const value = html`
        <amp-facebook
          width="552"
          height="303"
          data-href="https://www.facebook.com/PageName/posts/123"
        ></amp-facebook>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should follow data-embed-as to the video plugin', async () => {
      const value = html`
        <amp-facebook
          data-embed-as="video"
          data-href="https://www.facebook.com/PageName/videos/123/"
        ></amp-facebook>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/videos/123/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fvideos%2F123%2F',
        url: 'https://www.facebook.com/PageName/videos/123/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // A comment thread is page chrome, not the article's content.
    it('should leave a comment embed unresolved', async () => {
      const value = html`
        <amp-facebook
          data-embed-as="comment"
          data-href="https://www.facebook.com/PageName/posts/123"
        ></amp-facebook>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a non-facebook href', async () => {
      const value = html`
        <amp-facebook
          data-href="https://evil.test/PageName/posts/123"
        ></amp-facebook>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('facebookBlockquoteEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, facebookBlockquoteEmbedResolver)

  describe('happy paths', () => {
    // The publisher kept the dialog's fallback and dropped the widget div, so nothing names
    // the plugin and the path in `cite` decides which one it is.
    it('should read the video plugin and the text from the cite url alone', async () => {
      const value = html`
        <blockquote
          cite="https://www.facebook.com/PageName/videos/123/"
          class="fb-xfbml-parse-ignore"
        >
          <p>A video caption.</p>
          Posted by <a href="https://www.facebook.com/PageName/">PageName</a> on
          <a href="https://www.facebook.com/PageName/videos/123/">Wednesday, 4 June 2026</a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/videos/123/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fvideos%2F123%2F',
        url: 'https://www.facebook.com/PageName/videos/123/',
        ratio: '16/9',
        description: 'A video caption.',
        author: 'PageName',
        date: 'Wednesday, 4 June 2026',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the post plugin for any other path', async () => {
      const value = html`
        <blockquote
          cite="https://www.facebook.com/PageName/posts/123"
          class="fb-xfbml-parse-ignore"
        >
          <p>A post caption.</p>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
        description: 'A post caption.',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Nothing in the pipeline absolutises a `cite`, so a CMS that rewrites urls to `//` hands
    // the resolver one with no scheme.
    it('should read a protocol-relative cite', async () => {
      const value = html`
        <blockquote
          cite="//www.facebook.com/PageName/posts/123"
          class="fb-xfbml-parse-ignore"
        >
          <p>A post caption.</p>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: '//www.facebook.com/PageName/posts/123',
        description: 'A post caption.',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a cite pointing somewhere else entirely', async () => {
      const value = html`
        <blockquote
          cite="https://evil.test/PageName/posts/123"
          class="fb-xfbml-parse-ignore"
        >
          <p>Not a facebook post.</p>
        </blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a blockquote with no cite', async () => {
      const value = html`
        <blockquote class="fb-xfbml-parse-ignore">
          <p>No cite at all.</p>
        </blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('facebookIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, facebookIframeEmbedResolver)

  describe('happy paths', () => {
    it('should mint a plugin url from a facebook page that is not a plugin', async () => {
      const value = '<iframe src="https://www.facebook.com/PageName/posts/123"></iframe>'
      const expected = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a post plugin iframe around its href and drop the caption toggle and the width', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123&show_text=true&width=500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The href rides as a query value, which `resolveUrlFn` never descends into, so the resolver
    // is the only thing that can give it a scheme. Refused outright it took the whole embed with
    // it, since the plugin url is what names the provider. The rebuilt src spells it in full.
    it('should name a plugin iframe whose href carries no scheme', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/post.php?href=%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123&show_text=true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: '//www.facebook.com/PageName/posts/123',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep where a video starts and drop its size and app id', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/video.php?height=314&amp;href=https%3A%2F%2Fwww.facebook.com%2Fdale.ghent%2Fvideos%2F1547460739144960%2F&amp;show_text=false&amp;width=560&amp;t=1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/dale.ghent/videos/1547460739144960/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fdale.ghent%2Fvideos%2F1547460739144960%2F&t=1',
        url: 'https://www.facebook.com/dale.ghent/videos/1547460739144960/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a start at zero', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/video.php?height=314&amp;href=https%3A%2F%2Fwww.facebook.com%2Fnolimitblades%2Fvideos%2F835543906514182%2F&amp;show_text=false&amp;width=560&amp;t=0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/nolimitblades/videos/835543906514182/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fnolimitblades%2Fvideos%2F835543906514182%2F&t=0',
        url: 'https://www.facebook.com/nolimitblades/videos/835543906514182/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the app id the publisher wrote', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fseantierney%2Fvideos%2F10153391162780883%2F&amp;width=600&amp;show_text=false&amp;appId=1676624405903774&amp;height=336"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/seantierney/videos/10153391162780883/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fseantierney%2Fvideos%2F10153391162780883%2F',
        url: 'https://www.facebook.com/seantierney/videos/10153391162780883/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should name a video plugin iframe', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fvideos%2F123%2F"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/videos/123/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fvideos%2F123%2F',
        url: 'https://www.facebook.com/PageName/videos/123/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Older SDKs built the plugin url with their Graph API version in the path, and those
    // copies still serve the same plugin.
    it('should drop the Graph API version from a post plugin path', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/v2.5/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should accept the versioned video plugin path with a two-digit version', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/v17.0/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fvideos%2F123%2F"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/videos/123/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fvideos%2F123%2F',
        url: 'https://www.facebook.com/PageName/videos/123/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The pre-plugins endpoint from old posts, which names its video in `video_id` rather than
    // an encoded href, so the current plugin url has to be built from scratch.
    it('should rebuild a legacy video frame onto the current plugin', async () => {
      const value = '<iframe src="https://www.facebook.com/video/embed?video_id=123456"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: '123456',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D123456',
        url: 'https://www.facebook.com/watch/?v=123456',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a Flash video embed onto the current plugin', async () => {
      const value = html`
        <embed
          src="http://www.facebook.com/v/377994148950512"
          type="application/x-shockwave-flash"
          allowfullscreen="1"
          width="440"
          height="277"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: '377994148950512',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D377994148950512',
        url: 'https://www.facebook.com/watch/?v=377994148950512',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a Flash video object onto the current plugin', async () => {
      const value = html`
        <object
          data="http://www.facebook.com/v/203603585296"
          height="188"
          width="300"
          type="application/x-shockwave-flash"
        ></object>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: '203603585296',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D203603585296',
        url: 'https://www.facebook.com/watch/?v=203603585296',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // The size a Facebook embed gets depends on which shape it arrived as, so each one is
  // asserted separately.
  describe('size sources', () => {
    it('should ignore the size the element states', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123"
          width="500"
          height="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the video ratio over the size the plugin query names', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fvideos%2F123%2F&show_text=false&width=560"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/videos/123/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fvideos%2F123%2F',
        url: 'https://www.facebook.com/PageName/videos/123/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The query's 267x476 is the carrier's size, which shallow handling does not read, so a Reel
    // shows in the video player's box.
    it('should state the video ratio over the vertical size a Reel query names', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F123%2F&show_text=false&width=267"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/reel/123/',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F123%2F',
        url: 'https://www.facebook.com/reel/123/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no size for a post, whose frame reports its own height', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/PageName/posts/123',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123',
        url: 'https://www.facebook.com/PageName/posts/123',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a facebook url that names no content', async () => {
      const value =
        '<iframe src="https://www.facebook.com/sharer/sharer.php?u=https://a.test/x"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a plugin href on a lookalike host', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Ffacebook.com.evil.test%2Fposts%2F123"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a Flash video path on a foreign host', async () => {
      const value = '<embed src="https://evil.test/v/377994148950512">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a plugin url with no href', async () => {
      const value = '<iframe src="https://www.facebook.com/plugins/post.php?width=500"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    // A comment thread is page chrome, not the article's content.
    it('should return undefined for the comments plugin', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/comments.php?href=https%3A%2F%2Fexample.com%2Fpost"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The version segment widens the path match, not the plugin set: a like button and a page
    // timeline stay chrome whichever SDK era wrote them.
    it('should return undefined for a versioned like plugin', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/v2.5/plugins/like.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a versioned page plugin', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/v2.5/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('facebookFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, facebookFlashEmbedResolver)

  describe('happy paths', () => {
    it('should rebuild the player on static.ak.fbcdn.net onto the current plugin', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://static.ak.fbcdn.net/swf/mvp.swf?0:83575"
          style=""
          id="so_mvp_swf_48089b219dfdc0f88959988"
          name="so_mvp_swf_48089b219dfdc0f88959988"
          bgcolor="#000000"
          quality="high"
          allowscriptaccess="always"
          scale="showall"
          allowfullscreen="true"
          wmode="window"
          flashvars="video_src=http%3A%2F%2Fvideo-sf2p.facebook.com%2Fv91%2F110%2F81%2F17731186132_13102.flv&amp;stage_width=500&amp;stage_height=318&amp;motion_log=%2Fvideo%2Fmotion_log.php&amp;video_id=17731186132&amp;video_length=214200&amp;video_seconds=214&amp;video_category=2&amp;video_rotation=0&amp;video_href=%2Fvideo%2Fvideo.php%3Fv%3D17731186132&amp;video_player_type=video_player_permalink&amp;video_width=500&amp;video_height=318&amp;video_title=BADHDHALVUMUM+VEJJE+DHEEVAANA&amp;video_owner_name=Ismail+Wajeeh&amp;video_owner_href=http%3A%2F%2Fwww.facebook.com%2Fs.php%3Fk%3D100000080%26id%3D605061132&amp;video_timestamp=Uploaded+on+Thursday.&amp;next_video_url=%2Fvideo%2Fvideo.php%3Fv%3D16775446132%26oid%3D5573792853&amp;thumb_url=http%3A%2F%2Fvthumb.ak.facebook.com%2Fvthumb-ak-sf2p%2Fv221%2F106%2F27%2F605061132%2Fb605061132_17731186132_954.jpg&amp;slate_src=http%3A%2F%2Fstatic.ak.fbcdn.net%2Fswf%2Fmvp_slate.swf%3F0%3A81294&amp;tail_slate_src=http%3A%2F%2Fstatic.ak.fbcdn.net%2Fswf%2Fmvp_tail_slate.swf%3F0%3A74597&amp;string_table=/js_strings.php/t83925/en_US&amp;swf_id=so_mvp_swf_48089b219dfdc0f88959988"
          height="318"
          width="500"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: '17731186132',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D17731186132',
        url: 'https://www.facebook.com/watch/?v=17731186132',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the player on static.ak.facebook.com onto the current plugin', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://static.ak.facebook.com/swf/mvp.swf?51:74597"
          style=""
          id="so_mvp_swf_47910a8e92d19"
          name="so_mvp_swf_47910a8e92d19"
          bgcolor="#000000"
          quality="high"
          allowscriptaccess="always"
          scale="showall"
          allowfullscreen="true"
          wmode="window"
          flashvars="video_src=http%3A%2F%2Fvideo-sf2p.facebook.com%2Fv163%2F190%2F118%2F9169571469_21884.flv&amp;stage_width=646&amp;stage_height=334&amp;motion_log=%2Fvideo%2Fmotion_log.php&amp;video_id=9169571469&amp;video_length=361066&amp;video_seconds=361&amp;video_category=0&amp;video_rotation=0&amp;video_href=%2Fvideo%2Fvideo.php%3Fv%3D9169571469&amp;video_player_type=video_player_permalink&amp;video_width=400&amp;video_height=304&amp;video_title=janey+dhoovijaan&amp;video_owner_name=Mohamed+AZmeel&amp;video_owner_href=http%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D520181469&amp;video_timestamp=Uploaded+on+Wednesday&amp;next_video_url=%2Fvideo%2Fvideo.php%3Fv%3D10285056132%26oid%3D5573792853&amp;thumb_url=http%3A%2F%2Fvthumb.ak.facebook.com%2Fvthumb-ak-sf2p%2Fv93%2F195%2F90%2F520181469%2Fb520181469_9169571469_1524.jpg&amp;slate_src=http%3A%2F%2Fstatic.ak.facebook.com%2Fswf%2Fmvp_slate.swf%3F51%3A72422&amp;tail_slate_src=http%3A%2F%2Fstatic.ak.facebook.com%2Fswf%2Fmvp_tail_slate.swf%3F51%3A74597&amp;string_table=http://static.ak.facebook.com/js_strings.php/t83381/en_US&amp;swf_id=so_mvp_swf_47910a8e92d19"
          height="334"
          width="500"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: '9169571469',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D9169571469',
        url: 'https://www.facebook.com/watch/?v=9169571469',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for the share player, which names no video id', async () => {
      const value = html`
        <embed
          allowfullscreen="true"
          allowscriptaccess="always"
          bgcolor="#000000"
          flashvars="video_src=http%3A%2F%2Fvideo.ak.facebook.com%2Fvideo-ak-sf2p%2Fv1182%2F12%2F58%2F56928606326_38965.mp4&amp;stage_width=320&amp;stage_height=240&amp;video_length=36460&amp;video_seconds=36&amp;video_player_type=video_player_share&amp;video_width=320&amp;video_height=240&amp;thumb_url=http%3A%2F%2Fvthumb.ak.facebook.com%2Fvthumb-ak-sf2p%2Fv643%2F247%2F53%2F627456326%2Fb627456326_56928606326_973.jpg&amp;slate_src=http%3A%2F%2Fstatic.ak.fbcdn.net%2Fswf%2Fmvp_slate.swf%3F7%3A134155&amp;tail_slate_src=http%3A%2F%2Fstatic.ak.fbcdn.net%2Fswf%2Fmvp_tail_slate.swf%3F7%3A134155&amp;video_autoplay=0"
          height="240"
          id="so_video_497a4299c42878204503322"
          name="so_video_497a4299c42878204503322"
          quality="high"
          scale="showall"
          src="http://b.static.ak.fbcdn.net/swf/mvp.swf?7:136764"
          type="application/x-shockwave-flash"
          width="320"
          wmode="window"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for the player path on a foreign host', async () => {
      const value = '<embed src="https://evil.test/swf/mvp.swf" flashvars="video_id=17731186132">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for the player path under another segment', async () => {
      const value =
        '<embed src="http://static.ak.fbcdn.net/x/swf/mvp.swf" flashvars="video_id=17731186132">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a path below the player', async () => {
      const value =
        '<embed src="http://static.ak.fbcdn.net/swf/mvp.swf/extra" flashvars="video_id=17731186132">'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('facebookS9eEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, facebookS9eEmbedResolver)

  describe('happy paths', () => {
    it('should frame a bare post id under the placeholder page', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://s9e.github.io/iframe/2/facebook.min.html#1699244425543753"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/Bob/posts/1699244425543753',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FBob%2Fposts%2F1699244425543753',
        url: 'https://www.facebook.com/Bob/posts/1699244425543753',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a post id behind its kind prefix', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://s9e.github.io/iframe/2/facebook.min.html#p783697877354329"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/Bob/posts/783697877354329',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FBob%2Fposts%2F783697877354329',
        url: 'https://www.facebook.com/Bob/posts/783697877354329',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should send a video id to the watch page', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://s9e.github.io/iframe/facebook.min.html#video506931837457674"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/watch/?v=506931837457674',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D506931837457674',
        url: 'https://www.facebook.com/watch/?v=506931837457674',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the page a post fragment names', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://s9e.github.io/iframe/2/facebook.min.html#batterymooch/posts/2091705384452370"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/batterymooch/posts/2091705384452370',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fbatterymooch%2Fposts%2F2091705384452370',
        url: 'https://www.facebook.com/batterymooch/posts/2091705384452370',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a dotted page a post fragment names', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://s9e.github.io/iframe/2/facebook.min.html#john.doe/posts/2091705384452370"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/john.doe/posts/2091705384452370',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fjohn.doe%2Fposts%2F2091705384452370',
        url: 'https://www.facebook.com/john.doe/posts/2091705384452370',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should frame a page and id fragment as the page post', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://s9e.github.io/iframe/2/facebook.min.html#example/1699244425543753"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/example/posts/1699244425543753',
        src: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fexample%2Fposts%2F1699244425543753',
        url: 'https://www.facebook.com/example/posts/1699244425543753',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should send a page reel fragment to the watch page', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://s9e.github.io/iframe/2/facebook.min.html#example/reel/1574979536826284"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/watch/?v=1574979536826284',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D1574979536826284',
        url: 'https://www.facebook.com/watch/?v=1574979536826284',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should send a page video fragment to the watch page', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://s9e.github.io/iframe/2/facebook.min.html#supercars/videos/1574979536826284#theme=auto"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'facebook',
        id: 'https://www.facebook.com/watch/?v=1574979536826284',
        src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D1574979536826284',
        url: 'https://www.facebook.com/watch/?v=1574979536826284',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the helper path', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://evil.test/iframe/2/facebook.min.html#1699244425543753"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a fragment carrying a separator in its id', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="facebook"
          src="https://s9e.github.io/iframe/2/facebook.min.html#page/posts/1/../../evil"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('facebookResolveEmbed', () => {
  it('should return undefined for a url that does not parse', () => {
    const value = 'not a url'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a legacy video frame with no video_id', () => {
    const value = 'https://www.facebook.com/video/embed?autoplay=1'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should use a malformed legacy video id as written, even if the player answers an error', () => {
    const value = 'https://www.facebook.com/video/embed?video_id=../etc'
    const expected: EmbedResolverResult = {
      provider: 'facebook',
      id: '../etc',
      src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D..%252Fetc',
      url: 'https://www.facebook.com/watch/?v=..%2Fetc',
      ratio: '16/9',
    }

    expect(facebookResolveEmbed(value)).toEqual(expected)
  })

  it('should use a malformed watch id as written, even if the player answers an error', () => {
    const value = 'https://www.facebook.com/watch/?v=banana'
    const expected: EmbedResolverResult = {
      provider: 'facebook',
      id: 'https://www.facebook.com/watch/?v=banana',
      src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3Dbanana',
      url: 'https://www.facebook.com/watch/?v=banana',
      ratio: '16/9',
    }

    expect(facebookResolveEmbed(value)).toEqual(expected)
  })

  it('should use a malformed watch id of one space as written, even if the player answers an error', () => {
    const value = 'https://www.facebook.com/watch/?v=%20'
    const expected: EmbedResolverResult = {
      provider: 'facebook',
      id: 'https://www.facebook.com/watch/?v=%20',
      src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D%2520',
      url: 'https://www.facebook.com/watch/?v=%20',
      ratio: '16/9',
    }

    expect(facebookResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for the legacy video path under another segment', () => {
    const value = 'https://www.facebook.com/x/video/embed?video_id=123456'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a path below the legacy video frame', () => {
    const value = 'https://www.facebook.com/video/embed/extra?video_id=123456'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should use a malformed Flash video id as written, even if the player answers an error', () => {
    const value = 'https://www.facebook.com/v/banana'
    const expected: EmbedResolverResult = {
      provider: 'facebook',
      id: 'banana',
      src: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3Dbanana',
      url: 'https://www.facebook.com/watch/?v=banana',
      ratio: '16/9',
    }

    expect(facebookResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for the Flash video path under another segment', () => {
    const value = 'https://www.facebook.com/x/v/377994148950512'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should return undefined for an fb.watch short link under the Flash path', () => {
    const value = 'https://fb.watch/v/6Rhfg0Bzq'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a path below the Flash video', () => {
    const value = 'https://www.facebook.com/v/377994148950512/extra'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should return undefined for the plugin path under another segment', () => {
    const value =
      'https://www.facebook.com/x/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a path below the plugin', () => {
    const value =
      'https://www.facebook.com/plugins/post.php/extra?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should return undefined for the watch path under another segment', () => {
    const value = 'https://www.facebook.com/x/watch/?v=1010445561578533'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  it('should return undefined for a path below the watch page', () => {
    const value = 'https://www.facebook.com/watch/extra?v=1010445561578533'

    expect(facebookResolveEmbed(value)).toBeUndefined()
  })

  // A carrier framing the page itself, which is what a publisher pastes from the address bar.
  // Facebook refuses to be framed, so each of these has to become a plugin url or the reader
  // gets a blank frame. The path decides which plugin: the watch page, a page's video and a
  // reel are the player, a page's post is the post.
  const videoPageUrls = [
    'https://www.facebook.com/watch/?v=1010445561578533',
    'https://www.facebook.com/100067727304035/videos/797784661900446/',
    'https://www.facebook.com/balloonspider/videos/vb.609918550/10153047276/',
    'https://www.facebook.com/reel/873906321076441',
  ]

  it.each(videoPageUrls)('should mint the video plugin url from %s', (value) => {
    const expected = {
      provider: 'facebook',
      id: value,
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(value)}`,
      url: value,
      ratio: '16/9',
    }

    expect(facebookResolveEmbed(value)).toEqual(expected)
  })

  it('should mint the post plugin url from a page post', () => {
    const value = 'https://www.facebook.com/xyzcontagion/posts/pfbid02XbT4GZsmw5Azhi'
    const expected = {
      provider: 'facebook',
      id: value,
      src: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(value)}`,
      url: value,
    }

    expect(facebookResolveEmbed(value)).toEqual(expected)
  })

  // A page's vanity name may contain a route word. The plugin is chosen by the whole segment,
  // so these are posts rather than videos.
  const routeWordVanityUrls: Array<string> = [
    'https://www.facebook.com/reel-big-fish/posts/123/',
    'https://www.facebook.com/video.game.news/posts/123/',
  ]

  it.each(routeWordVanityUrls)('should mint the post plugin url from %s', (value) => {
    const expected: EmbedResolverResult = {
      provider: 'facebook',
      id: value,
      src: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(value)}`,
      url: value,
    }

    expect(facebookResolveEmbed(value)).toEqual(expected)
  })

  // Everything else the host serves. A share or like button is the publisher's own chrome, the
  // page box is a follow widget, and the photo, album and asset paths are not framed content.
  // None of them names a post or a video, so none may be minted into a plugin.
  const unmintableUrls: Array<string> = [
    // The boundary the guard draws: a page's Posts and Videos tabs are listings, and the bare
    // watch path is Facebook's video front page rather than one video.
    'https://www.facebook.com/nasa/posts/',
    'https://www.facebook.com/nasa/videos/',
    'https://www.facebook.com/watch',
    'https://www.facebook.com/watch/',
    // A group post is login-walled, so there is nothing a plugin could show an anonymous reader.
    'https://www.facebook.com/groups/743994612334347/posts/1854848817915582/',
    'https://www.facebook.com/help/videos/',
    'https://www.facebook.com/sharer/sharer.php?u=https://example.com/x',
    'https://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fexample.com',
    'https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fx',
    'https://www.facebook.com/photo.php?fbid=10153504300545348',
    'https://www.facebook.com/gaslampball/photos/a.10150461997624009.421181/1015/',
    'https://www.facebook.com/images/emoji.php/v6/f77/1/16/203c.png',
    'https://www.facebook.com/media/set/?set=a.969892526369760.1073741864',
  ]

  it.each(unmintableUrls)('should return undefined for %s', (value) => {
    expect(facebookResolveEmbed(value)).toBeUndefined()
  })
})

describe('readFacebookHeight', () => {
  it('should read the height out of the post plugin resize message', () => {
    expect(readFacebookHeight('type=resize&cb=&width=500&height=421')).toBe(421)
  })

  it('should read nothing out of the plugin ready message', () => {
    const value =
      'xd_action=plugin_ready&name=&cb=f1a2b3c4&domain=example.com&is_canvas=false&origin=https%3A%2F%2Fexample.com%2Ff5d6e7&relation=parent.parent'

    expect(readFacebookHeight(value)).toBeUndefined()
  })

  it('should read nothing out of a message that is not a string', () => {
    expect(readFacebookHeight({ type: 'resize', height: 421 })).toBeUndefined()
  })
})

describe('facebookRenderHint', () => {
  // Without both parameters the post plugin posts no height to the parent.
  it('should ask every load for the height the post renders at', () => {
    const expected: EmbedRenderHint = {
      provider: 'facebook',
      origin: 'https://www.facebook.com',
      params: {
        sdk: 'joey',
        channel: 'https://staticxx.facebook.com/x/connect/xd_arbiter/?version=46',
      },
      readHeight: readFacebookHeight,
    }

    expect(facebookRenderHint).toEqual(expected)
  })
})

// The three contracts no single resolver can state, because each one is a handoff between
// passes that know nothing about each other.
describeForEachParser('facebook through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  // `<fb:post>` is an empty element, so the widget pass has to claim it before the empty-tag
  // pass reaches it or the post disappears with the tag.
  it('should claim the empty fb:post tag before it is dropped as empty', async () => {
    const value = '<fb:post href="https://www.facebook.com/PageName/posts/123"></fb:post>'
    const expected = html`
      <div
        data-embed-src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123"
        data-embed-provider="facebook"
        data-embed-id="https://www.facebook.com/PageName/posts/123"
        data-embed-url="https://www.facebook.com/PageName/posts/123"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // The escaping is undone upstream by decodeDoubleEncodedTags, so the embed only becomes an
  // iframe partway through the run.
  it('should resolve an embed that arrives entity-escaped in an Atom payload', async () => {
    const value =
      '&lt;iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123"&gt;&lt;/iframe&gt;'
    const expected = html`
      <div
        data-embed-src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FPageName%2Fposts%2F123"
        data-embed-provider="facebook"
        data-embed-id="https://www.facebook.com/PageName/posts/123"
        data-embed-url="https://www.facebook.com/PageName/posts/123"
      ></div>
    `
    const result = await convert(value)

    expect(result).toEqualHtml(expected)
  })

  // The SDK loader is scaffolding no resolver looks at: the root div and the script have to be
  // gone by the end of the run, and the article text has to survive them.
  it('should leave nothing of the bare SDK loader behind', async () => {
    const value = html`
      <div id="fb-root"></div>
      <script async defer src="https://connect.facebook.net/en_US/sdk.js#xfbml=1"></script>
      <p>Article text.</p>
    `
    const expected = '<p>Article text.</p>'

    expect(await convert(value)).toEqualHtml(expected)
  })
})
