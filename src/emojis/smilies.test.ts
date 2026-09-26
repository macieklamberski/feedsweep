import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'
import { mergeEmojiNames } from '../utils/emojis.js'
import { smiliesEmojiNameTables } from './smilies.js'

const asciiLetterRegex = /[a-zA-Z]/

describeForEachParser('smiliesEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('XenForo (sprite smilies: data-URI src + data-shortname)', () => {
    // The src is the 1x1 transparent GIF XenForo paints its sprite sheet behind, so these
    // render as nothing in a reader. Kept verbatim from a real feed.
    const spriteSource =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

    it('should replace a mapped sprite smilie with its glyph', async () => {
      const value = html`
        <p>Eigenwerbung...
          <img
            src="${spriteSource}"
            class="smilie smilie--sprite smilie--sprite8"
            alt=":D"
            title="Big grin    :D"
            loading="lazy"
            data-shortname=":D"
          >
        </p>
      `
      const expected = '<p>Eigenwerbung... 😁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should match the shortname case-insensitively', async () => {
      const value = `<p><img src="${spriteSource}" data-shortname=":ROFLMAO:" alt=":ROFLMAO:"></p>`
      const expected = '<p>🤣</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // The shortname is not an emoji, so it is marked as fallback text and not left as prose.
    it('should replace an unmapped sprite smilie with its literal shortname', async () => {
      const value = `<p><img src="${spriteSource}" data-shortname=":sk21_d1:" alt=":sk21_d1:"></p>`
      const expected = '<p><span data-emoji="">:sk21_d1:</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should never emit the title, which pads the name onto the shortcode', async () => {
      const value = html`
        <p>
          <img
            src="${spriteSource}"
            data-shortname=":confused:"
            alt=":confused:"
            title="Confused    :confused:"
          >
        </p>
      `
      const expected = '<p>😕</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Pre-2.2 boards and modified templates omit data-shortname. The image still paints
    // nothing, so the smilie class plus a mapped alt is what rescues it.
    it('should replace a sprite smilie that has no data-shortname', async () => {
      const value = `<p><img src="${spriteSource}" class="smilie smilie--sprite" alt=":D"></p>`
      const expected = '<p>😁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a sprite smilie untouched when nothing names it', async () => {
      const value = `<p><img src="${spriteSource}" class="smilie smilie--sprite"></p>`

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should leave an inlined data-URI image untouched when it is too long to be a spacer', async () => {
      const value = `<p><img src="data:image/png;base64,${'A'.repeat(300)}" data-shortname=":D"></p>`

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    // 1.x numbers its sprites in the class and carries no data-shortname, and points src at a
    // shared transparent PNG, not a data URI.
    it('should replace a 1.x sprite named by its numbered class', async () => {
      const value = html`
        <p>
          <img
            src="styles/default/xenforo/clear.png"
            class="mceSmilieSprite mceSmilie7"
            alt=":p"
            title="Stick Out Tongue :p"
          >
        </p>
      `
      const expected = '<p>😛</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace an unmapped 1.x sprite with its literal alt', async () => {
      const value = html`
        <p>
          <img
            src="styles/default/xenforo/clear.png"
            class="mceSmilieSprite mceSmilie553"
            alt=":upyeah:"
            title="UpYeah    :upyeah:"
          >
        </p>
      `
      const expected = '<p><span data-emoji="">:upyeah:</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // The theme directory differs per board, so the `smilies` directory is what identifies a
    // self-hosted set. Converting these matches how phpBB's are already treated.
    it('should replace a self-hosted XenForo smilie from its theme directory', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/styles/default/xenforo/smilies/smile.png"
            class="smilie"
            alt=":)"
            data-shortname=":)"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should preserve position when the sprite is nested inside an anchor', async () => {
      const value = `<p><a href="/x">nice <img src="${spriteSource}" data-shortname=":)"> work</a></p>`
      const expected = '<p><a href="/x">nice 🙂 work</a></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = `<p>Hi <img src="${spriteSource}" data-shortname=":D" alt=":D"></p>`
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })

  describe('phpBB (smilies class + /images/smilies/ path)', () => {
    it('should replace a smilie whose alt is a shortcode', async () => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/icon_e_smile.gif"
            width="15"
            height="17"
            alt=":)"
            title="Smile"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace several smilies in one sentence', async () => {
      const value = html`
        <p>See
          <img class="smilies" src="/images/smilies/icon_arrow.gif" alt=":arrow:">
          and
          <img class="smilies" src="/images/smilies/icon_cool.gif" alt="8-)">
        </p>
      `
      const expected = '<p>See ➡️ and 😎</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should fall back to the filename when the alt is empty', async () => {
      const value = '<p><img class="smilies" src="/images/smilies/icon_wink.gif" alt=""></p>'
      const expected = '<p>😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an unmapped smilie with its working image', async () => {
      const value = html`
        <p>
          <img class="smilies" src="/images/smilies/icon_mrgreen.gif" alt=":mrgreen:">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    // The parent of the smilies directory is the theme name and differs per board, so these
    // are all the same set under different skins.
    const themeSmiliePaths: Array<string> = [
      '/themes/default/smilies/smile.png',
      '/dc2themes/mrvb6_sobre/smilies/smile.png',
      '/plxeditor/smilies/smile.png',
      '/style/BlueSky/smilies/smile.png',
    ]

    it.each(themeSmiliePaths)(
      'should replace a smilie served from the theme directory %s',
      async (path) => {
        const value = `<p><img src="https://example.com${path}" alt=":)" class="smiley"></p>`

        expect(await transform(value)).toEqualHtml('<p>🙂</p>')
      },
    )

    const singularSmilieClasses: Array<string> = ['smiley', 'smilie', 'mceSmilie']

    it.each(singularSmilieClasses)(
      'should recognize the singular %s class other engines use',
      async (className) => {
        const value = `<p><img src="/x/smilies/wink.png" alt=";)" class="${className}"></p>`

        expect(await transform(value)).toEqualHtml('<p>😉</p>')
      },
    )

    it('should leave a non-smilie image served from the smilies folder untouched', async () => {
      const value = '<p><img src="https://example.com/images/smilies/banner.png" alt="Banner"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    // The board shipped the template variable unsubstituted, so the src is a placeholder and the
    // image cannot load anywhere. Text beats a broken picture, unlike every case above.
    it('should replace a smilie whose path is the raw placeholder', async () => {
      const value = `<p><img src="{SMILIES_PATH}/teeth_smile.gif" alt=":D" title="Very Happy"></p>`
      const expected = '<p>😁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a smilie whose placeholder arrived percent-encoded', async () => {
      const value = `<p><img src="%7BSMILIES_PATH%7D/wink_smile.gif" alt=";)"></p>`
      const expected = '<p>😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should resolve a placeholder smilie by its alt when the filename carries no meaning', async () => {
      const value = `<p><img src="{SMILIES_PATH}/15.gif" alt=":cry:" title="Crying"></p>`
      const expected = '<p>😢</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // A placeholder src is a link the board failed to build, which is not this transform's to
    // repair. Unresolvable ones are left exactly as any other dead image would be.
    it('should leave a placeholder smilie that resolves to nothing alone', async () => {
      const value = `<p><img src="%7BSMILIES_PATH%7D/borracho.gif" alt="(borracho)" title="Borracho"></p>`

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })

  describe('IPS / Invision (data-emoticon + /uploads/emoticons/ path)', () => {
    it('should replace an emoticon whose alt is a shortcode', async () => {
      const value = html`
        <p>
          <img
            alt=":)"
            data-emoticon=""
            height="20"
            src="https://example.com/uploads/emoticons/default_smile.png"
            srcset="https://example.com/uploads/emoticons/smile@2x.png 2x"
            title=":)"
            width="20"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should resolve a stock filename once the default_ prefix is dropped', async () => {
      const value = html`
        <p>
          <img
            data-emoticon="true"
            src="https://example.com/uploads/emoticons/default_wink.png"
            alt=""
          >
        </p>
      `
      const expected = '<p>😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should resolve a filename carrying a resolution variant suffix', async () => {
      const value = html`
        <p>
          <img data-emoticon="" src="https://example.com/uploads/emoticons/biggrin@2x.png" alt="">
        </p>
      `
      const expected = '<p>😁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a site-custom emoticon with its working image', async () => {
      const value = html`
        <p>
          <img alt=":yahoo:" data-emoticon="" src="https://example.com/uploads/emoticons/yahoo.png">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })

  describe('FluxBB / PunBB (/img/smilies/ path with word names)', () => {
    it('should replace a smilie named by a word rather than a shortcode', async () => {
      const value = html`
        <p>Compare the files
          <img src="https://example.com/forum/img/smilies/wink.png" width="15" height="15" alt="wink">
        </p>
      `
      const expected = '<p>Compare the files 😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should resolve from the filename when the alt is empty', async () => {
      const value = '<p><img src="https://example.com/forum/img/smilies/big_smile.png" alt=""></p>'
      const expected = '<p>😁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Forums translate the alt but keep the stock English filename, so a localized board
    // resolves through the filename and the table needs no translations of its own.
    it('should replace a smilie whose alt is localized but filename is not', async () => {
      const value = '<p><img src="https://example.com/forum/img/smilies/love.gif" alt="Hjärta"></p>'
      const expected = '<p>😍</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a French-labelled smilie from its stock filename', async () => {
      const value = html`
        <p>
          <img src="https://example.com/img/smilies/big_smile.png" alt="fou" width="15">
        </p>
      `
      const expected = '<p>😁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // base64 may contain `/`, so a stem parsed out of a data URI is a slice of the payload.
    it('should not answer an unmapped sprite from its own base64 payload', async () => {
      const value = html`
        <p>
          <img src="data:image/gif;base64,AAA/smile" data-shortname=":totally_custom:">
        </p>
      `
      const expected = '<p><span data-emoji="">:totally_custom:</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a smilie from a custom theme pack with its working image', async () => {
      const value = html`
        <p>
          <img src="https://example.com/forum/img/smilies/haku/haku-smirk.svg" alt="壞笑">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })

  describe('engines named only by their smilie directory', () => {
    // None of these carry a usable class, so the smilie directory is the only signal. All three
    // spellings are in use in the wild.
    const pathCases: Array<[string, string, string]> = [
      ['Serendipity', 'http://example.com/templates/default/img/emoticons/wink.png', '😉'],
      [
        'Serendipity custom theme',
        'http://example.com/templates/schluetersde/img/emoticons/smile.png',
        '🙂',
      ],
      ['Drupal smileys module', 'http://example.com/misc/smileys/smile.png', '🙂'],
      ['blog smileys directory', 'http://example.com/images/smileys/big_smile.gif', '😁'],
      ['Kunena emoticons directory', 'http://example.com/media/kunena/emoticons/unsure.png', '😕'],
      ['FUDforum', 'http://example.com/forum/images/smiley_icons/icon_wink.gif', '😉'],
      [
        'TinyMCE 3',
        'http://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-smile.gif',
        '🙂',
      ],
    ]

    it.each(pathCases)('should replace a %s smilie', async (_engine, source, expected) => {
      const value = `<p><img src="${source}" alt=""></p>`

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    it('should replace the Serendipity whistle smilie', async () => {
      const value = html`
        <p>
          <img src="http://example.com/templates/default/img/emoticons/whistle.png" alt="">
        </p>
      `
      const expected = '<p>😗</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a site-custom smilie by its :)) alt', async () => {
      const value = '<p><img src="http://example.com/smilies/yahoo_laughloud.gif" alt=":))"></p>'
      const expected = '<p>🤣</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a site-custom smilie by its <3 alt', async () => {
      const value = '<p><img src="http://example.com/smilies/yahoo_love.gif" alt="&lt;3"></p>'
      const expected = '<p>❤️</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('TinyMCE 3 (/plugins/emotions/img/ names)', () => {
    const nameCases: Array<[string, string]> = [
      ['sealed', '🤐'],
      ['embarassed', '😳'],
      ['tongue-out', '😛'],
      ['money-mouth', '🤑'],
    ]

    it.each(nameCases)('should replace the %s face', async (name, expected) => {
      const value = html`
        <p>
          <img
            src="https://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-${name}.gif"
            class="flag"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    it('should leave the foot-in-mouth face untouched', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-foot-in-mouth.gif"
            class="flag"
            alt="Foot in mouth"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('smiles directory', () => {
    it('should replace a phpBB smilie served from a renamed directory', async () => {
      const value = '<p><img src="https://example.com/smiles/icon_smile.gif" alt="Smile"></p>'
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a uCoz smilie whose alt is a shortcode', async () => {
      const value = html`
        <p>
          <img
            rel="usm"
            src="https://example.com/smiles/smile.gif"
            align="absmiddle"
            alt=":)"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // A board's own art, numbered or named in-house, with nothing a table can map.
    it('should leave a smilie with no known name untouched', async () => {
      const value = '<p><img src="https://example.com/smiles/ag.gif" alt="Amd Green"></p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    // The alt is a truncated shortcode the board made up, and the stock filename wins over it.
    it('should resolve by the filename when the alt is an unknown shortcode', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/smiles/confused.gif"
            align="top"
            alt=":questio"
          >
        </p>
      `
      const expected = '<p>😕</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('engines with a single distinguishing case', () => {
    // Each entry is markup as the engine actually emits it into feed content, so the awkward
    // parts are deliberate: MyBB's alt is an English name, vBulletin's is empty, FCKeditor
    // ships neither alt nor class, and IPB 2 puts the filename in the alt.
    const engineCases: Array<[string, string, string]> = [
      [
        'SMF',
        '<img src="https://example.com/forum/Smileys/default/wink.gif" alt=";)" title="Wink" class="smiley">',
        '😉',
      ],
      [
        'MyBB',
        '<img src="https://example.com/images/smilies/angry.gif" alt="Angry" title="Angry" class="smilie smilie_26">',
        '😠',
      ],
      [
        'vBulletin',
        '<img src="https://example.com/images/smilies/smile.gif" border="0" alt="" title="Smile" class="inlineimg">',
        '🙂',
      ],
      [
        'DokuWiki',
        '<img src="https://example.com/lib/images/smileys/smile.svg" class="icon smiley" alt=":-)">',
        '🙂',
      ],
      [
        'CKEditor',
        '<img src="/ckeditor/plugins/smiley/images/regular_smile.gif" title="smiley" alt="smiley">',
        '🙂',
      ],
      ['FCKeditor', '<img src="/editor/images/smiley/msn/wink_smile.gif">', '😉'],
      // Both spellings ship in the wild, and the corrected one is the commoner of the two.
      [
        'CKEditor corrected tongue',
        '<img src="/ckeditor/plugins/smiley/images/tongue_smile.png" alt="cheeky" title="cheeky">',
        '😛',
      ],
      ['TinyMCE 4', '<img src="/tinymce/plugins/emoticons/img/smiley-cool.gif" alt="cool">', '😎'],
      [
        'Invision Power Board 3',
        '<img src="/public/style_emoticons/default/smile.png" class="bbc_emoticon" alt=":)">',
        '🙂',
      ],
      [
        'Invision Power Board 2',
        '<img src="/style_emoticons/default/smile.gif" emoid=":)" alt="smile.gif">',
        '🙂',
      ],
      [
        'e107',
        '<img class="e-emoticon" src="/e107_images/emotes/default/smile.png" alt="smile">',
        '🙂',
      ],
      [
        'Simple:Press',
        '<img src="/wp-content/forum-smileys/sf-wink.gif" width="15" class="sfimageleft" title="wink" alt="wink">',
        '😉',
      ],
      // From the engines' own default sets, not from corpus tokens, so these cover boards the
      // corpus never sampled. The last two are misspelled in the distributions.
      [
        'phpBB geek',
        '<img class="smilies" src="/images/smilies/icon_e_geek.svg" alt="" title="Geek">',
        '🤓',
      ],
      [
        'SMF sealed lips',
        '<img src="/Smileys/fugue/lipsrsealed.png" alt="" title="Lips sealed" class="smiley">',
        '🤐',
      ],
      [
        'e107 suprised',
        '<img class="e-emoticon" src="/e107_images/emotes/default/suprised.png" alt="">',
        '😲',
      ],
      [
        'e107 cheesey',
        '<img class="e-emoticon" src="/e107_images/emotes/default/cheesey.png" alt="">',
        '😁',
      ],
      // Boards add clap.gif to several engines' sets. The shortcode alt already resolved. This
      // is the localized-title case where only the filename says what the picture is.
      [
        'community-added clap',
        '<img class="smiley" src="https://example.com/images/smilies/clap.gif" alt="" title="Beifall">',
        '👏',
      ],
    ]

    it.each(engineCases)('should replace a %s smilie', async (_engine, tag, expected) => {
      expect(await transform(`<p>${tag}</p>`)).toEqualHtml(`<p>${expected}</p>`)
    })
  })

  describe('marker classes', () => {
    it('should mark an unmapped Kunena smilie by its bbcode_smiley class', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/media/kunena/emoticons/y32b4.png"
            alt=":y32b4:"
            class="bbcode_smiley"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/media/kunena/emoticons/y32b4.png"
            alt=":y32b4:"
            class="bbcode_smiley"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark an unmapped Simple:Press smilie by its spSmiley class', async () => {
      const value = html`
        <p>
          <img
            class="spSmiley"
            alt="rip"
            src="https://example.com/wp-content/sp-resources/forum-smileys/rip_zpsec10ede9.gif"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="spSmiley"
            alt="rip"
            src="https://example.com/wp-content/sp-resources/forum-smileys/rip_zpsec10ede9.gif"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark an unmapped Drupal smilie by its smiley-content class', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/modules/smileys/packs/Roving/flat.png"
            alt="Stare"
            class="smiley-content"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/modules/smileys/packs/Roving/flat.png"
            alt="Stare"
            class="smiley-content"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark an unmapped WP Monalisa smilie by its wpml_ico class', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/wp-content/plugins/wp-monalisa/icons/smiley_emoticons_nicken.gif"
            alt=":ja:"
            class="wpml_ico"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/wp-content/plugins/wp-monalisa/icons/smiley_emoticons_nicken.gif"
            alt=":ja:"
            class="wpml_ico"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark an unmapped Discuz smilie by its smilieid attribute', async () => {
      const value = html`
        <p>
          <img
            alt=""
            src="https://example.com/images/smilies/default/run.gif"
            smilieid="52"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            alt=""
            src="https://example.com/images/smilies/default/run.gif"
            smilieid="52"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace an EasyDiscuss smilie by its bb-smiley class', async () => {
      const value = html`
        <p>
          <img
            alt=":)"
            class="bb-smiley"
            src="https://example.com/media/com_easydiscuss/images/markitup/emoticon-smile.png"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace an IPS 4 emoji by its ipsEmoji class', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/uploads/emoji/1f602.png"
            class="ipsEmoji"
            alt="😂"
          >
        </p>
      `
      const expected = '<p>😂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('WoltLab (codepoint filenames under /smilies/)', () => {
    // The file is named after the codepoint, which names the picture more exactly than the alt.
    const shortcodeCases: Array<[string, string, string]> = [
      [':thumbup:', '1f44d', '👍'],
      [':saint:', '1f607', '😇'],
    ]

    it.each(shortcodeCases)(
      'should replace a %s smilie from its alt',
      async (shortcode, codepoint, expected) => {
        const value = html`
        <p>
          <img
            src="https://example.com/images/smilies/emojione/${codepoint}.png"
            alt="${shortcode}"
            title="${shortcode}"
            class="smiley"
            height="23"
          >
        </p>
      `

        expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
      },
    )

    // WoltLab binds `:evil:` to the grinning devil, where the shared table reads the angry one.
    it('should replace a smilie by its codepoint filename over its shortcode alt', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/images/smilies/emojione/1f608.png"
            alt=":evil:"
            title=":evil:"
            class="smiley"
            height="23"
          >
        </p>
      `
      const expected = '<p>😈</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // WoltLab numbers a board's own uploads, which Web Wiz's `smileyN` table must not read.
    it('should mark an uploaded smileyN smilie', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/wcf/images/smilies/smiley34.gif"
            alt=":spitze:"
            title="spitze"
            class="smiley"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/wcf/images/smilies/smiley34.gif"
            alt=":spitze:"
            title="spitze"
            class="smiley"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Web Wiz Forums (numbered files under /smileys/)', () => {
    const faceCases: Array<[string, string, string]> = [
      ['smiley1', 'Smile', '🙂'],
      ['smiley2', 'Wink', '😉'],
      ['smiley3', 'Shocked', '😲'],
      ['smiley4', 'Big smile', '😁'],
      ['smiley5', 'Confused', '😕'],
      ['smiley6', 'Unhappy', '🙁'],
      ['smiley7', 'Angry', '😡'],
      ['smiley8', 'Clown', '🤡'],
      ['smiley9', 'Embarrassed', '😳'],
      ['smiley10', 'Star', '⭐'],
      ['smiley11', 'Dead', '😵'],
      ['smiley12', 'Sleepy', '😴'],
      ['smiley13', 'Disapprove', '🤨'],
      ['smiley14', 'Approve', '🙂‍↕️'],
      ['smiley15', 'Evil Smile', '😈'],
      ['smiley16', 'Cool', '😎'],
      ['smiley17', 'Tongue', '😛'],
      ['smiley18', 'Ouch', '🤕'],
      ['smiley19', 'Cry', '😢'],
      ['smiley20', 'Thumbs Up', '👍'],
      ['smiley21', 'Thumbs Down', '👎'],
      ['smiley22', 'Stern Smile', '😐'],
      ['smiley23', 'Geek', '🤓'],
      ['smiley24', 'Ermm', '🫤'],
      ['smiley25', 'Question', '❓'],
      ['smiley26', 'Pinch', '😣'],
      ['smiley27', 'Heart', '❤️'],
      ['smiley28', 'Broken Heart', '💔'],
      ['smiley29', 'Wacko', '🤪'],
      ['smiley30', 'Pig', '🐷'],
      ['smiley31', 'Hug', '🤗'],
      ['smiley32', 'Clap', '👏'],
      ['smiley33', 'Ying Yang', '☯️'],
      ['smiley34', 'Nuke', '☢️'],
      ['smiley35', 'Censored', '🤬'],
      ['smiley36', 'LOL', '🤣'],
      ['smiley37', 'Exclamation', '⚠️'],
      ['smiley38', 'Lamp', '💡'],
      ['smiley39', 'Sick', '🤢'],
      ['smiley40', 'Party', '🥳'],
      ['smiley41', 'Beer', '🍻'],
      ['smiley42', 'Handshake', '🤝'],
    ]

    it.each(faceCases)('should replace the %s face', async (name, alt, expected) => {
      const value = html`
        <p>
          <img
            src="https://example.com/forum/smileys/${name}.gif"
            border="0"
            alt="${alt}"
            title="${alt}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })
  })

  describe('Invision Power Board and Kunena', () => {
    // Alts that boards wrote in place of the stock code, so only the filename names the face.
    const nameCases: Array<[string, string, string]> = [
      ['wub', 'wub.gif', '😍'],
      ['blink', '8|', '😯'],
      ['wacko', ':wasko:', '🤪'],
      ['ph34r', 'ph34r.gif', '🥷'],
      ['w00t', ':woohoo:', '🤩'],
      ['whistling', ':siffle:', '😗'],
      ['doh', ':default_doh:', '🤦'],
      ['dry', 'dry.gif', '😒'],
      ['mellow', 'mellow.gif', '😑'],
      ['sleep', ':zzz:', '😴'],
    ]

    it.each(nameCases)('should replace the %s face', async (name, alt, expected) => {
      const value = html`
        <p>
          <img
            src="https://example.com/style_emoticons/default/${name}.gif"
            class="bbc_emoticon"
            alt="${alt}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    const codeCases: Array<[string, string]> = [
      [':wub:', '😍'],
      [':blink:', '😯'],
      [':wacko:', '🤪'],
      [':ph34r:', '🥷'],
      [':whistle:', '😗'],
      [':mellow:', '😑'],
      [':huh:', '😕'],
      [':angry:', '😠'],
    ]

    it.each(codeCases)('should replace the %s code', async (code, expected) => {
      const value = html`
        <p>
          <img
            src="https://example.com/uploads/emoticons/smily_8.gif"
            alt="${code}"
            data-emoticon=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    // IPB binds `-_-` to sleep.gif, and the code is read before the filename.
    it('should replace a sleep smilie by its -_- code', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/uploads/emoticons/default_sleep.png"
            alt="-_-"
            data-emoticon=""
          >
        </p>
      `
      const expected = '<p>😑</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('XenForo 2 (sprite shortnames)', () => {
    const shortnameCases: Array<[string, string, string]> = [
      [':cautious:', 'Cautious', '😒'],
      [':censored:', 'Censored', '🤐'],
      [':sneaky:', 'Sneaky', '😏'],
      [':whistle:', 'Whistling', '😗'],
      [':giggle:', 'Giggle', '🤭'],
      [':devilish:', 'Devil', '😈'],
      ['o_O', 'Er... what?', '😵‍💫'],
    ]

    it.each(shortnameCases)('should replace the %s smilie', async (shortname, title, expected) => {
      const value = html`
        <p>
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            class="smilie smilie--sprite smilie--sprite9"
            alt="${shortname}"
            title="${title}    ${shortname}"
            loading="lazy"
            data-shortname="${shortname}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    // phpBB boards bind `O_o` to faces of their own, and only XenForo's is drawn dizzy.
    it('should mark an O_o smilie outside XenForo', async () => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/icon_goofy.gif"
            alt="O_o"
            title="Flipando"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="smilies"
            src="https://example.com/images/smilies/icon_goofy.gif"
            alt="O_o"
            title="Flipando"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('NBBC (bbcode_smiley class, /smileys/ names)', () => {
    // NBBC writes its code as the alt, and these four mean another face in the shared table.
    const faceCases: Array<[string, string, string]> = [
      ['worry', ':s', '😟'],
      ['bigeyes', '8)', '😳'],
      ['bigwink', ';D', '😜'],
      ['lookleft', '&lt;_&lt;', '👀'],
    ]

    it.each(faceCases)('should replace the %s face', async (name, code, expected) => {
      const value = html`
        <p>
          <img
            src="https://example.com/nbbc/smileys/${name}.gif"
            width="15"
            height="15"
            alt="${code}"
            title="${code}"
            class="bbcode_smiley"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    const codeCases: Array<[string, string]> = [
      ['&gt;;)', '😏'],
      ['O:)', '😇'],
      ['^_^', '😊'],
      ['^^;', '😅'],
      ['&gt;_&gt;', '👀'],
      ['&lt;g&gt;', '😁'],
      ['o.O', '🤨'],
    ]

    it.each(codeCases)('should replace the %s code on a renamed file', async (code, expected) => {
      const value = html`
        <p>
          <img
            src="https://example.com/nbbc/smileys/custom/8.gif"
            alt="${code}"
            class="bbcode_smiley"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    // A base64 payload can end in a slash and an NBBC name.
    it('should not read an NBBC name out of a sprite payload', async () => {
      const value = html`
        <p>
          <img
            src="data:image/gif;base64,AAA/worry"
            data-shortname=":totally_custom:"
          >
        </p>
      `
      const expected = '<p><span data-emoji="">:totally_custom:</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Discuz! (static/image/smiley/ names)', () => {
    const faceCases: Array<[string, string]> = [
      ['huffy', '😡'],
      ['titter', '🤭'],
      ['sweat', '😓'],
      ['loveliness', '🥰'],
      ['funk', '😨'],
      ['curse', '🤬'],
      ['shutup', '🤐'],
      ['hug', '🤗'],
      ['victory', '✌️'],
      ['time', '🕒'],
      ['handshake', '🤝'],
      ['call', '📞'],
    ]

    it.each(faceCases)('should replace the %s face', async (name, expected) => {
      const value = html`
        <p>
          <img
            src="https://example.com/static/image/smiley/default/${name}.gif"
            smilieid="14"
            border="0"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    it('should mark a phpBB smilie that shares a Discuz name', async () => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/time.gif"
            alt=""
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="smilies"
            src="https://example.com/images/smilies/time.gif"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Khoros / Lithium (/i/smilies/ stock faces)', () => {
    // The alt and title are translated per board, so the stock filename is the only stable key.
    const faceCases: Array<[string, string, string]> = [
      ['smiley-happy', 'Smiley heureux', '🙂'],
      ['smiley-wink', "Smiley clignant de l'œil", '😉'],
      ['smiley-very-happy', 'Smiley très heureux', '😁'],
      ['smiley-tongue', 'Emotikon: Język', '😛'],
      ['smiley-sad', 'Emotikon: Smutny', '🙁'],
      ['smiley-mad', 'Smiley Mad', '😠'],
      ['smiley-surprised', 'Emotikon: Zaskoczony', '😲'],
      ['smiley-lol', 'Smiley LOL', '🤣'],
      ['smiley-embarrassed', 'Smiley Embarrassed', '😳'],
      ['smiley-indifferent', 'Smiley Indifferent', '😐'],
      ['heart', 'Cœur', '❤️'],
      ['cat-happy', 'Chat heureux', '😺'],
      ['cat-very-happy', 'Chat très heureux', '😸'],
      ['cat-lol', 'Chat MDR', '😹'],
      ['smiley-frustrated', 'Smiley frustré', '😣'],
    ]

    it.each(faceCases)('should replace the %s face', async (name, alt, expected) => {
      const value = html`
        <p>
          <img
            id="${name}"
            class="emoticon emoticon-${name}"
            src="https://example.com/i/smilies/16x16_${name}.png"
            alt="${alt}"
            title="${alt}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    // The set also draws each expression on a cat, a man, a woman and a robot. Unicode's cat
    // faces cover the three smiles but not a winking or tongue-out one, so swapping those would
    // change the expression.
    const keptCases: Array<[string, string]> = [
      ['cat', '16x16_cat-wink'],
      ['woman', '16x16_woman-happy'],
      ['robot', '16x16_robot-lol'],
    ]

    it.each(keptCases)('should leave the %s variant with its picture', async (_species, name) => {
      const value = `<p><img class="emoticon" src="https://example.com/i/smilies/${name}.png" alt="Wink"></p>`

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    // Some boards replace the stock art with a licensed set whose files are numbered, leaving
    // nothing in the markup that names the picture.
    it('should leave a board-specific replacement set with its picture', async () => {
      const value = html`
        <p>
          <img
            class="emoticon emoticon-ClinDoeil"
            src="https://example.com/images/smilies/emoji_licence_46.png"
            alt=""
          >
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should mark a face with no counterpart by its emoticon- class', async () => {
      const value = html`
        <p>
          <img
            id="womanwink"
            class="emoticon emoticon-womanwink"
            src="https://example.com/i/smilies/16x16_woman-wink.png"
            alt="Woman Wink"
            title="Woman Wink"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            id="womanwink"
            class="emoticon emoticon-womanwink"
            src="https://example.com/i/smilies/16x16_woman-wink.png"
            alt="Woman Wink"
            title="Woman Wink"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Windows Live Writer's own emoticons, which have no name table.
    it('should leave a Windows Live Writer emoticon untouched', async () => {
      const value = html`
        <p>
          <img
            class="wlEmoticon wlEmoticon-winkingsmile"
            alt="Winking smile"
            src="https://example.com/wp-content/uploads/2019/03/1212.wlEmoticon-winkingsmile_63772F9B.png"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Vodafone's copy of the set is sized 15x15.
    it('should replace a face from the 15x15 set', async () => {
      const value = html`
        <p>
          <img
            id="smileywink"
            class="emoticon emoticon-smileywink"
            src="https://example.com/html/@929CB104E9842E64CFFA4DDBA9219E92/images/emoticons/15x15_smiley-wink.gif"
            alt=""
            title=""
          >
        </p>
      `
      const expected = '<p>😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a Samsung emoji by the codepoint in its numbered filename', async () => {
      const value = html`
        <p>
          <img
            class="lia-deferred-image lia-image-emoji"
            src="https://example.com/html/@1BBE730D66F6AF8A8EB16B462DAF441D/images/smilies/2.winking-face_1f609.png"
            alt=":winking-face:"
            title=":winking-face:"
          >
        </p>
      `
      const expected = '<p>😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a Samsung emoji with a skin tone by its full sequence', async () => {
      const value = html`
        <p>
          <img
            class="lia-deferred-image lia-image-emoji"
            src="https://example.com/html/@684C5748BA1AA2FD7E2E3E73F2D23AAF/images/smilies/10.thumbs-up-sign_emoji-modifier-fitzpatrick-type-1-2_1f44d-1f3fb_1f3fb.png"
            alt=":thumbs-up-sign-emoji-modifier-fitzpatrick-type:"
            title=":thumbs-up-sign-emoji-modifier-fitzpatrick-type:"
          >
        </p>
      `
      const expected = '<p>👍🏻</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Samsung's own smiling face is filed under the codepoint of 🃏.
    it('should replace the Samsung smiling face without decoding its filename', async () => {
      const value = html`
        <p>
          <img
            class="lia-deferred-image lia-image-emoji"
            src="https://example.com/html/@758C9CF82B69C1E7230907A98BEAE742/images/smilies/1.samsung_1f0cf.png"
            alt=":smiling-face:"
            title=":smiling-face:"
          >
        </p>
      `
      const expected = '<p>😀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = html`
        <p>Hi
          <img
            class="emoticon emoticon-smileywink"
            src="https://example.com/i/smilies/16x16_smiley-wink.png"
            alt="Smiley clignant"
          >
        </p>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })

  describe('codepoint filenames', () => {
    // Read for any engine the tables already cover. WoltLab names its whole default set this
    // way, across both the 1F plane and the BMP, but nothing here is specific to it.
    const codepointCases: Array<[string, string]> = [
      ['1f618', '😘'],
      ['1f62d', '😭'],
      ['2639', '☹️'],
      ['263a', '☺️'],
      ['1f1fa-1f1f8', '🇺🇸'],
    ]

    it.each(codepointCases)('should decode the filename %s', async (codepoint, expected) => {
      const value = html`
        <p>
          <img
            class="smiley"
            src="https://example.com/images/smilies/emojione/${codepoint}.png"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    it('should decode a filename carrying a resolution variant suffix', async () => {
      const value = html`
        <p>
          <img
            class="smiley"
            src="https://example.com/images/smilies/emojione/1f44d@2x.png"
            alt=""
          >
        </p>
      `
      const expected = '<p>👍</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Any engine, not one: this is a phpBB directory, not WoltLab's.
    it('should decode under any recognized smilie directory', async () => {
      const value = html`
        <p>
          <img class="smilies" src="https://example.com/images/smilies/1f604.png" alt="">
        </p>
      `
      const expected = '<p>😄</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Hex-shaped is not emoji-shaped, and each of these is a filename that really occurs:
    // e107 ships dead.png, and boards number their uploads.
    const hexShapedCases: Array<[string, string]> = [
      ['a sequential id, which decodes to a space', '2000'],
      ['a lone surrogate', 'dead'],
      ['a CJK ideograph', 'face'],
      ['a stem too long to be a codepoint', 'ffffff'],
    ]

    it.each(hexShapedCases)('should not decode %s', async (_reason, stem) => {
      const value = html`
        <p>
          <img class="smiley" src="https://example.com/images/smilies/${stem}.png" alt="">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })

  describe('shortcode table', () => {
    // An alt is free text, and `constructor` names a member every object inherits, so the table
    // has to refuse it the way it refuses any other word it does not carry.
    it('should keep a smilie whose alt names an inherited member', async () => {
      const value = html`
        <p>
          <img src="https://example.com/smilies/happy.png" class="smilie" alt="constructor">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    // SMF binds `;D` to grin.gif, and the alt is read before the filename.
    it('should replace ;D with a grin', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/Smileys/default/grin.gif"
            alt=";D"
            title="Grin"
            class="smiley"
          >
        </p>
      `
      const expected = '<p>😁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // A board's own set binds `;-D` to its wink, which the filename names.
    it('should resolve ;-D by the filename', async () => {
      const value = html`
        <p>
          <img src="https://example.com/board/smileys/cutemoticons/wink.png" alt=";-D">
        </p>
      `
      const expected = '<p>😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace :evil: with the angry devil its icon_evil file draws', async () => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/icon_evil.gif"
            alt=":evil:"
            title="Evil or Very Mad"
          >
        </p>
      `
      const expected = '<p>👿</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // `:x` is mad on phpBB and WordPress, and `:-X` is sealed lips on SMF, so only the filename
    // says which face it is.
    it('should resolve :x by the filename', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/images/smiles/icon_mad.gif"
            alt=":x"
            title="Mad"
          >
        </p>
      `
      const expected = '<p>😠</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should resolve :-X by the filename', async () => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/lipsrsealed.gif"
            alt=":-X"
            title="Lips Sealed"
          >
        </p>
      `
      const expected = '<p>🤐</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // The stock codes of SMF, WordPress and phpBB, on a board whose files are numbered.
    const aliasCases: Array<[string, string]> = [
      ['&gt;:(', '😠'],
      ['???', '😕'],
      ['::)', '🙄'],
      [':-[', '😳'],
      [':-\\', '🫤'],
      [':-*', '😘'],
      ['&gt;:D', '😈'],
      ['O:-)', '😇'],
      [':smile:', '🙂'],
      [':sad:', '🙁'],
      [':razz:', '😛'],
      [':???:', '😕'],
      [':neutral:', '😐'],
      [':-?', '😕'],
      [':-o', '😲'],
      [':-|', '😐'],
      ['8-O', '😲'],
      [':ugeek:', '🤓'],
      [':rofl:', '🤣'],
    ]

    it.each(aliasCases)('should replace the %s code', async (code, expected) => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/8.gif"
            alt="${code}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })
  })

  describe('platform filename tables', () => {
    const nameEntries = smiliesEmojiNameTables.flatMap((platform) =>
      Object.entries(platform.names).map(([name, glyph]) => [platform.name, name, glyph] as const),
    )

    it.each(nameEntries)('should map the %s name %s to a bare glyph', (_platform, _name, glyph) => {
      expect(glyph).not.toBe('')
      expect(glyph).not.toMatch(asciiLetterRegex)
    })

    it.each(nameEntries)(
      'should key the %s name %s in lower case, as getFileStem normalizes',
      (_platform, name) => {
        expect(name).toBe(name.toLowerCase())
      },
    )

    // Names boards add to several engines' sets, each with an alt the board made up.
    const observedCases: Array<[string, string, string]> = [
      ['yes', ':y', '🙂‍↕️'],
      ['ok', ':okay:', '👍'],
      ['good', ':good', '👍'],
      ['hi', '-hi-', '👋'],
      ['bye', ':Bye', '👋'],
      ['crying', ':crying:', '😭'],
      ['santa', ':Mikołaj:', '🎅'],
      ['popcorn', ':popcorn:', '🍿'],
      ['beer', ':ber:', '🍻'],
      ['thumbsup', '[doppel-daumen]', '👍'],
      ['crazy', ':craz:', '🤪'],
      ['cheers', ':95:', '🥂'],
      ['bravo', ')))', '👏'],
    ]

    it.each(observedCases)('should replace the %s file', async (name, alt, expected) => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/${name}.gif"
            alt="${alt}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    it.each(['rofl', 'rotfl'])('should replace the %s file', async (name) => {
      const value = html`
        <p>
          <img class="smilies" src="https://example.com/images/smilies/${name}.gif" alt="">
        </p>
      `
      const expected = '<p>🤣</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should merge the shipped platforms without conflict', () => {
      expect(() => mergeEmojiNames(smiliesEmojiNameTables)).not.toThrow()
    })

    // The stem is whatever the file is called, and `constructor` names a member every object
    // inherits, so the merged table has to refuse it the way it refuses any unmapped name.
    it('should keep a smilie whose filename names an inherited member', async () => {
      const value = html`
        <p>
          <img src="https://example.com/smilies/constructor.png" class="smilie" alt=":sk21_d1:">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })
})
