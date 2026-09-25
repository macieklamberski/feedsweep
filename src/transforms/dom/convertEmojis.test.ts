import { describe, expect, it } from 'bun:test'
import { baseContext, describeForEachParser, emojiConverters, html } from '../../tests.js'
import type { EmojiResolver } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { convertEmojis } from './convertEmojis.js'

describeForEachParser('convertEmojis', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  const transformWith = (value: string, emojiResolvers: Array<EmojiResolver>) => {
    return applyDomTransforms(parseHtml(value), [convertEmojis({ ...baseContext, emojiResolvers })])
  }

  const winkResolver: EmojiResolver = {
    kind: 'emoji',
    selector: 'img',
    extract: () => {
      return { glyph: '😉' }
    },
  }

  const smileResolver: EmojiResolver = {
    kind: 'emoji',
    selector: 'img',
    extract: () => {
      return { glyph: '🙂' }
    },
  }

  const passingResolver: EmojiResolver = {
    kind: 'emoji',
    selector: 'img',
    extract: () => {},
  }

  describe('precedence', () => {
    it('should let the first resolver with a result claim the image', async () => {
      const value = '<p><img src="/a.png"></p>'
      const expected = '<p>😉</p>'

      expect(await transformWith(value, [winkResolver, smileResolver])).toEqualHtml(expected)
    })

    it('should pass an image a resolver has no answer for to the next one', async () => {
      const value = '<p><img src="/a.png"></p>'
      const expected = '<p>🙂</p>'

      expect(await transformWith(value, [passingResolver, smileResolver])).toEqualHtml(expected)
    })

    it('should leave an image no resolver answers for untouched', async () => {
      const value = '<p><img src="/a.png"></p>'

      expect(await transformWith(value, [passingResolver])).toEqualHtml(value)
    })

    it('should leave the document untouched when no resolvers are registered', async () => {
      const value = '<p><img class="wp-smiley" alt="🙂"></p>'

      expect(await transformWith(value, [])).toEqualHtml(value)
    })

    // jsdom's selector engine refuses a selector over 2048 characters, which the registered
    // selectors pass once joined.
    it('should match an image when the joined selectors pass the engine limit', async () => {
      const longSelector = `img[alt="${'x'.repeat(1100)}"]`
      const resolvers: Array<EmojiResolver> = [
        { ...passingResolver, selector: longSelector },
        { ...winkResolver, selector: `${longSelector}, img` },
      ]
      const value = '<p><img src="/a.png"></p>'
      const expected = '<p>😉</p>'

      expect(await transformWith(value, resolvers)).toEqualHtml(expected)
    })
  })

  describe('data-emoji marker', () => {
    // Custom sets have no glyph to become, so the marker is the only thing a reader can act on.
    const markedCases: Array<[string, string, string]> = [
      [
        'Mastodon custom emoji',
        '<img class="emojione" alt=":catjam:" src="https://files.mastodon.social/custom_emojis/images/000/224/097/d9c.gif">',
        '<img data-emoji="" class="emojione" alt=":catjam:" src="https://files.mastodon.social/custom_emojis/images/000/224/097/d9c.gif">',
      ],
      [
        'Weibo emoticon',
        '<img alt="[微笑]" src="https://h5.sinaimg.cn/m/emoticon/icon/default/d_weixiao.png">',
        '<img data-emoji="" alt="[微笑]" src="https://h5.sinaimg.cn/m/emoticon/icon/default/d_weixiao.png">',
      ],
      [
        'phpBB smilie with no mapping',
        '<img class="smilies" src="/images/smilies/x.gif" alt=":mrgreen:">',
        '<img data-emoji="" class="smilies" src="/images/smilies/x.gif" alt=":mrgreen:">',
      ],
      [
        'IPS emoticon with no mapping',
        '<img data-emoticon="" src="/uploads/emoticons/yahoo.png" alt=":yahoo:">',
        '<img data-emoji="" data-emoticon="" src="/uploads/emoticons/yahoo.png" alt=":yahoo:">',
      ],
      [
        'GitHub custom emoji with no Unicode counterpart',
        '<img src="https://github.githubassets.com/images/icons/emoji/octocat.png" alt=":octocat:">',
        '<img data-emoji="" src="https://github.githubassets.com/images/icons/emoji/octocat.png" alt=":octocat:">',
      ],
      [
        'Ameba built-in char image',
        '<img src="https://stat100.ameba.jp/blog/ucs/img/char/char3/004.png" alt="ウインク" width="24" height="24">',
        '<img data-emoji="" src="https://stat100.ameba.jp/blog/ucs/img/char/char3/004.png" alt="ウインク" width="24" height="24">',
      ],
      [
        'Ameba author-uploaded emoji',
        '<img src="https://emoji.ameba.jp/img/user/sa/sayu74/118238.gif" alt="カナダ" border="0">',
        '<img data-emoji="" src="https://emoji.ameba.jp/img/user/sa/sayu74/118238.gif" alt="カナダ" border="0">',
      ],
    ]

    it.each(markedCases)('should mark a %s', async (_label, tag, marked) => {
      const value = `<p>${tag}</p>`
      const expected = `<p>${marked}</p>`

      expect(await transform(value)).toEqualHtml(expected)
    })

    // A smilie directory is matched loosely, so evidence that rests only on the path is not
    // enough to call something an emoji once it fails to resolve.
    const unmarkedCases: Array<[string, string]> = [
      [
        'banner in a smilies folder',
        '<img src="https://example.com/images/smilies/banner.png" alt="Banner">',
      ],
      [
        'ordinary photograph',
        '<img src="https://cdn.example.com/photo-1920.jpg" alt="A photograph">',
      ],
    ]

    it.each(unmarkedCases)('should not mark a %s', async (_label, tag) => {
      const value = `<p>${tag}</p>`

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not mark an image it converted', async () => {
      const value = '<p><img class="wp-smiley" alt="\u{1F642}"></p>'
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Marking a glyph would style two identical emoji differently in one sentence, since an
    // author who typed theirs directly never had an image for us to mark.
    it('should leave a converted emoji indistinguishable from one the author typed', async () => {
      const value = html`
        <p>Nice 😉 work
          <img class="wp-smiley" src="https://s.w.org/images/core/emoji/14/72x72/1f609.png" alt="😉">
        </p>
      `
      const expected = '<p>Nice 😉 work 😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = '<p><img class="smilies" src="/images/smilies/x.gif" alt=":mrgreen:"></p>'
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })

    it('should be idempotent over fallback text it wrapped', async () => {
      const value = html`
        <p>
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            data-shortname=":sk21_d1:"
          >
        </p>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })

  describe('alt-shape guard', () => {
    it('should preserve multi-codepoint alt (ZWJ sequence)', async () => {
      const value = '<p><img alt="👨‍👩‍👧" class="wp-smiley"></p>'
      const expected = '<p>👨‍👩‍👧</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should preserve skin-tone modifier alt', async () => {
      const value = '<p><img alt="👋🏽" class="wp-smiley"></p>'
      const expected = '<p>👋🏽</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should preserve BMP-only emoji (length 1 in JS)', async () => {
      const value = '<p><img class="wp-smiley" alt="✔"></p>'
      const expected = '<p>✔</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // These are real alts from localized boards. The old guard accepted anything non-ASCII
    // without ASCII letters, so each was injected into the text in place of its image.
    const localizedWords: Array<string> = ['壞笑', 'улыбка', '笑顔', 'χαμόγελο']

    it.each(localizedWords)(
      'should leave image untouched when alt is the localized word %s',
      async (alt) => {
        const value = `<p><img src="emoji.png" alt="${alt}" class="wp-smiley"></p>`

        expect(await transformKeeping(value)).toEqualHtml(value)
      },
    )

    // A subdivision flag is a base flag plus tag characters spelling the region code, so the
    // guard has to accept a class of character that appears in nothing else.
    const subdivisionFlags: Array<string> = ['🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿']

    it.each(subdivisionFlags)(
      'should replace image when alt is the subdivision flag %s',
      async (flag) => {
        const value = `<p><img class="wp-smiley" src="/f.png" alt="${flag}"></p>`

        expect(await transform(value)).toEqualHtml(`<p>${flag}</p>`)
      },
    )

    it('should leave image untouched when alt is a lone digit without a keycap', async () => {
      const value = '<p><img src="emoji.png" alt="7" class="wp-smiley"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should replace image when alt is several emoji separated by a space', async () => {
      const value = '<p><img src="emoji.png" alt="🙂 🎉" class="wp-smiley"></p>'
      const expected = '<p>🙂 🎉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave image untouched when alt has mixed text', async () => {
      const value = '<p><img class="emoji" alt="hello 🐱"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should leave image untouched when alt is empty', async () => {
      const value = '<p><img src="emoji.png" alt="" class="wp-smiley"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should leave image untouched when alt is ASCII-only', async () => {
      const value = '<p><img src="emoji.png" alt="x" class="wp-smiley"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should never emit a "?" fallback alt as text', async () => {
      const value = '<p><img src="smilies/broken.png" alt="?" class="wp-smiley"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should leave image untouched when alt attribute is missing', async () => {
      const value = '<p><img src="emoji.png" class="wp-smiley"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should leave non-emoji images untouched', async () => {
      const value = '<p><img src="photo.jpg" alt="cat photo"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })

  describe('positional preservation', () => {
    it('should preserve position when emoji is nested inside an anchor', async () => {
      const value = '<p><a href="/x">click <img alt="🚀" class="wp-smiley"> here</a></p>'
      const expected = '<p><a href="/x">click 🚀 here</a></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should preserve position when emoji is nested inside strong', async () => {
      const value = '<p><strong>wow <img alt="🎉" class="wp-smiley"></strong></p>'
      const expected = '<p><strong>wow 🎉</strong></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <p>Hello
        <img
          src="https://s.w.org/images/core/emoji/17.0.2/72x72/1f609.png"
          alt="😉"
          class="wp-smiley"
        >
      </p>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
