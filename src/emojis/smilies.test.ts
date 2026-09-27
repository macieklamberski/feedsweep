import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'
import { mergeEmojiNames } from '../utils/emojis.js'
import { smiliesEmojiNameTables } from './smilies.js'

const asciiLetterRegex = /[a-zA-Z]/

describeForEachParser('smiliesEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

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

    it('should leave the mrgreen smilie, which has no glyph, with its working image', async () => {
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
      const value = '<p><img src="https://example.com/forum/img/smilies/cool.png" alt="Häftig"></p>'
      const expected = '<p>😎</p>'

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
      ['Kunena emoticons directory', 'http://example.com/media/kunena/emoticons/smile.png', '🙂'],
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

    it('should mark the Serendipity whistle smilie', async () => {
      const value = html`
        <p>
          <img src="http://example.com/templates/default/img/emoticons/whistle.png" alt="">
        </p>
      `
      const expected = html`
        <p>
          <img data-emoji="" src="http://example.com/templates/default/img/emoticons/whistle.png" alt="">
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a site-custom smilie by its :)) alt', async () => {
      const value = '<p><img src="http://example.com/smilies/yahoo_laughloud.gif" alt=":))"></p>'
      const expected =
        '<p><img data-emoji="" src="http://example.com/smilies/yahoo_laughloud.gif" alt=":))"></p>'

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

    it('should mark the foot-in-mouth face', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-foot-in-mouth.gif"
            class="flag"
            alt="Foot in mouth"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-foot-in-mouth.gif"
            class="flag"
            alt="Foot in mouth"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
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
        'phpBB sad',
        '<img class="smilies" src="/images/smilies/icon_e_sad.svg" alt="" title="Sad">',
        '🙁',
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
    ]

    it.each(engineCases)('should replace a %s smilie', async (_engine, tag, expected) => {
      expect(await transform(`<p>${tag}</p>`)).toEqualHtml(`<p>${expected}</p>`)
    })
  })

  describe('marker classes', () => {
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

  describe('Invision Power Board and Kunena', () => {
    // Alts that boards wrote in place of the stock code, so only the filename names the face.
    const nameCases: Array<[string, string, string]> = [['sleep', ':zzz:', '😴']]

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

    // Faces whose names say nothing a glyph could, like `ph34r` for a ninja.
    const markedNameCases: Array<[string, string]> = [
      ['whistling', ':siffle:'],
      ['wub', 'wub.gif'],
      ['blink', '8|'],
      ['wacko', ':wasko:'],
      ['ph34r', 'ph34r.gif'],
      ['w00t', ':woohoo:'],
      ['doh', ':default_doh:'],
      ['dry', 'dry.gif'],
      ['mellow', 'mellow.gif'],
    ]

    it.each(markedNameCases)('should mark the %s face', async (name, alt) => {
      const value = html`
        <p>
          <img
            src="https://example.com/style_emoticons/default/${name}.gif"
            class="bbc_emoticon"
            alt="${alt}"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/style_emoticons/default/${name}.gif"
            class="bbc_emoticon"
            alt="${alt}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    const markedCodes: Array<string> = [
      ':angry:',
      ':wub:',
      ':blink:',
      ':wacko:',
      ':ph34r:',
      ':whistle:',
      ':mellow:',
      ':huh:',
    ]

    it.each(markedCodes)('should mark the %s code', async (code) => {
      const value = html`
        <p>
          <img
            src="https://example.com/uploads/emoticons/smily_8.gif"
            alt="${code}"
            data-emoticon=""
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/uploads/emoticons/smily_8.gif"
            alt="${code}"
            data-emoticon=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // IPB binds `-_-` to sleep.gif, and Facebook to a squint, so the filename names the face.
    it('should resolve a sleep smilie by its filename over its -_- code', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/uploads/emoticons/default_sleep.png"
            alt="-_-"
            data-emoticon=""
          >
        </p>
      `
      const expected = '<p>😴</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('NBBC (bbcode_smiley class, /smileys/ names)', () => {
    // NBBC writes its code as the alt, and these four mean another face in the shared table.
    const faceCases: Array<[string, string]> = [
      ['worry', ':s'],
      ['bigeyes', '8)'],
      ['bigwink', ';D'],
      ['lookleft', '&lt;_&lt;'],
    ]

    it.each(faceCases)('should mark the %s face', async (name, code) => {
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
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/nbbc/smileys/${name}.gif"
            width="15"
            height="15"
            alt="${code}"
            title="${code}"
            class="bbcode_smiley"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    const markedCodes: Array<string> = [
      '&gt;;)',
      'O:)',
      '^_^',
      '^^;',
      '&gt;_&gt;',
      '&lt;g&gt;',
      'o.O',
    ]

    it.each(markedCodes)('should mark the %s code on a renamed file', async (code) => {
      const value = html`
        <p>
          <img
            src="https://example.com/nbbc/smileys/custom/8.gif"
            alt="${code}"
            class="bbcode_smiley"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/nbbc/smileys/custom/8.gif"
            alt="${code}"
            class="bbcode_smiley"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
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

    // SMF binds `;D` to grin.gif and NBBC to a big wink, so the filename names the face.
    it('should resolve ;D by the grin filename', async () => {
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

    // phpBB draws an angry devil and WoltLab a grinning one.
    it('should mark :evil: on the icon_evil file', async () => {
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
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="smilies"
            src="https://example.com/images/smilies/icon_evil.gif"
            alt=":evil:"
            title="Evil or Very Mad"
          >
        </p>
      `

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
      [':smile:', '🙂'],
      [':sad:', '🙁'],
      [':-o', '😲'],
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

    // Stock codes each engine draws as its own face.
    const markedAliases: Array<string> = [
      ':-*',
      'O:-)',
      ':razz:',
      ':neutral:',
      ':-|',
      '&gt;:(',
      '???',
      '::)',
      ':-[',
      ':-\\',
      '&gt;:D',
      ':???:',
      ':-?',
      '8-O',
      ':ugeek:',
    ]

    it.each(markedAliases)('should mark the %s code', async (code) => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/8.gif"
            alt="${code}"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="smilies"
            src="https://example.com/images/smilies/8.gif"
            alt="${code}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('an exact hint beside a false one', () => {
    it('should replace a file named for no glyph by its universal code', async () => {
      const value = '<p><img src="https://example.com/images/smilies/happy.gif" alt=":)"></p>'
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a file named for no glyph by its emoji alt', async () => {
      const value = '<p><img src="https://example.com/images/smilies/icon_evil.gif" alt="😈"></p>'
      const expected = '<p>😈</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a codepoint file by its filename when its alt is a false code', async () => {
      const value = '<p><img src="https://example.com/images/smilies/1f608.png" alt=":evil:"></p>'
      const expected = '<p>😈</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace an engine drawing by its universal code', async () => {
      const value = '<p><img src="https://example.com/forum/smileys/smiley4.gif" alt=":D"></p>'
      const expected = '<p>😁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a stock file by its filename when its alt is a false code', async () => {
      const value = '<p><img src="https://example.com/smiles/yikes.gif" alt=":shock:"></p>'
      const expected = '<p>😱</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('names known to have no glyph', () => {
    it('should mark a file named for no glyph under a smilie directory alone', async () => {
      const value = '<p><img src="https://example.com/images/smilies/icon_evil.gif" alt=""></p>'
      const expected =
        '<p><img data-emoji="" src="https://example.com/images/smilies/icon_evil.gif" alt=""></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    const engineNameSources: Array<string> = [
      'https://illiweb.com/fa/i/smiles/icon_cheers.png',
      'https://example.com/media/kunena/emoticons/cheerful.png',
      'https://example.com/uploads/emoticons/default_yahoo.gif',
      'https://example.com/public/style_emoticons/default/drool.gif',
      'https://example.com/styles/default/xenforo/smilies/banghead.gif',
      'https://example.com/Smileys/default/thumb.gif',
      'https://example.com/images/smilies/gruebel.gif',
    ]

    it.each(engineNameSources)('should mark the name a board added at %s', async (src) => {
      const value = `<p><img src="${src}" alt=""></p>`
      const expected = `<p><img data-emoji="" src="${src}" alt=""></p>`

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('platform filename tables', () => {
    const nameEntries = smiliesEmojiNameTables.flatMap((platform) =>
      Object.entries(platform.names).map(([name, glyph]) => [platform.name, name, glyph] as const),
    )
    const glyphEntries = nameEntries.filter(([, , glyph]) => glyph)

    it.each(glyphEntries)(
      'should map the %s name %s to a bare glyph',
      (_platform, _name, glyph) => {
        expect(glyph).not.toBe('')
        expect(glyph).not.toMatch(asciiLetterRegex)
      },
    )

    it.each(nameEntries)(
      'should key the %s name %s in lower case, as getFileStem normalizes',
      (_platform, name) => {
        expect(name).toBe(name.toLowerCase())
      },
    )

    // Names boards add to several engines' sets, each with an alt the board made up.
    // Each board draws its own picture for these.
    const markedObservedCases: Array<[string, string]> = [
      ['crying', ':crying:'],
      ['santa', ':Mikołaj:'],
      ['popcorn', ':popcorn:'],
      ['thumbsup', '[doppel-daumen]'],
      ['clap', ''],
      ['yes', ':y'],
      ['ok', ':okay:'],
      ['good', ':good'],
      ['hi', '-hi-'],
      ['bye', ':Bye'],
      ['beer', ':ber:'],
      ['crazy', ':craz:'],
      ['cheers', ':95:'],
      ['bravo', ')))'],
      ['rofl', ''],
      ['rotfl', ''],
    ]

    it.each(markedObservedCases)('should mark the %s file', async (name, alt) => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/${name}.gif"
            alt="${alt}"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="smilies"
            src="https://example.com/images/smilies/${name}.gif"
            alt="${alt}"
          >
        </p>
      `

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
