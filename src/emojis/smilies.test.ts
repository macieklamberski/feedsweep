import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('smiliesEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('phpBB (smilies class + /images/smilies/ path)', () => {
    it('should mark a smilie despite its universal code alt', async () => {
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
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="smilies"
            src="https://example.com/images/smilies/icon_e_smile.gif"
            width="15"
            height="17"
            alt=":)"
            title="Smile"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Without the class, the directory alone is weak, so only a stock name is marked.
    it('should mark a stock filename when the alt is empty', async () => {
      const value = '<p><img src="/images/smilies/icon_wink.gif" alt=""></p>'
      const expected = '<p><img data-emoji="" src="/images/smilies/icon_wink.gif" alt=""></p>'

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
    const themeSmiliePathCases: Array<string> = [
      '/themes/default/smilies/smile.png',
      '/dc2themes/mrvb6_sobre/smilies/smile.png',
      '/plxeditor/smilies/smile.png',
      '/style/BlueSky/smilies/smile.png',
    ]

    it.each(themeSmiliePathCases)(
      'should mark a smilie served from the theme directory %s',
      async (path) => {
        const value = `<p><img src="https://example.com${path}" alt=""></p>`
        const expected = `<p><img data-emoji="" src="https://example.com${path}" alt=""></p>`

        expect(await transform(value)).toEqualHtml(expected)
      },
    )

    const singularSmilieClassCases: Array<string> = ['smiley', 'smilie', 'mceSmilie']

    // The class alone marks a file no table knows, outside any smilie directory.
    it.each(singularSmilieClassCases)(
      'should recognize the singular %s class other engines use',
      async (className) => {
        const value = `<p><img src="/x/images/hug.png" alt="hug" class="${className}"></p>`
        const expected = `<p><img data-emoji="" src="/x/images/hug.png" alt="hug" class="${className}"></p>`

        expect(await transform(value)).toEqualHtml(expected)
      },
    )

    it('should leave a non-smilie image served from the smilies folder untouched', async () => {
      const value = '<p><img src="https://example.com/images/smilies/banner.png" alt="Banner"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    // The board shipped the template variable unsubstituted, so the src is a placeholder no host
    // serves, and the code stands in for the picture.
    it('should give the code of a smilie whose path is the raw placeholder', async () => {
      const value = `<p><img src="{SMILIES_PATH}/teeth_smile.gif" alt=":D" title="Very Happy"></p>`
      const expected = '<p><span data-emoji="">:D</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should give the code of a smilie whose placeholder arrived percent-encoded', async () => {
      const value = `<p><img src="%7BSMILIES_PATH%7D/wink_smile.gif" alt=";)"></p>`
      const expected = '<p><span data-emoji="">;)</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should give the code of a placeholder smilie no table knows', async () => {
      const value = `<p><img src="%7BSMILIES_PATH%7D/borracho.gif" alt="(borracho)" title="Borracho"></p>`
      const expected = '<p><span data-emoji="">(borracho)</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('FluxBB / PunBB (/img/smilies/ path with word names)', () => {
    it('should mark a smilie named by a word rather than a shortcode', async () => {
      const value = html`
        <p>Compare the files
          <img src="https://example.com/forum/img/smilies/wink.png" width="15" height="15" alt="wink">
        </p>
      `
      const expected = html`
        <p>Compare the files
          <img
            data-emoji=""
            src="https://example.com/forum/img/smilies/wink.png"
            width="15"
            height="15"
            alt="wink"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Forums translate the alt but keep the stock English filename, so a localized board
    // is known through the filename and the table needs no translations of its own.
    it('should mark a smilie whose alt is localized but filename is not', async () => {
      const value = '<p><img src="https://example.com/forum/img/smilies/cool.png" alt="Häftig"></p>'
      const expected =
        '<p><img data-emoji="" src="https://example.com/forum/img/smilies/cool.png" alt="Häftig"></p>'

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
    const pathCases: Array<string> = [
      'http://example.com/templates/default/img/emoticons/wink.png',
      'http://example.com/templates/schluetersde/img/emoticons/smile.png',
      'http://example.com/misc/smileys/smile.png',
      'http://example.com/images/smileys/big_smile.gif',
      'http://example.com/media/kunena/emoticons/smile.png',
      'http://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-smile.gif',
    ]

    it.each(pathCases)('should mark the stock smilie at %s', async (source) => {
      const value = `<p><img src="${source}" alt=""></p>`
      const expected = `<p><img data-emoji="" src="${source}" alt=""></p>`

      expect(await transform(value)).toEqualHtml(expected)
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

    it('should mark the Serendipity anger smilie', async () => {
      const value = html`
        <p>
          <img src="http://example.com/templates/default/img/emoticons/anger.png" alt="">
        </p>
      `
      const expected = html`
        <p>
          <img data-emoji="" src="http://example.com/templates/default/img/emoticons/anger.png" alt="">
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

    it('should mark a site-custom smilie despite its <3 alt', async () => {
      const value = '<p><img src="http://example.com/smilies/yahoo_love.gif" alt="&lt;3"></p>'
      const expected =
        '<p><img data-emoji="" src="http://example.com/smilies/yahoo_love.gif" alt="&lt;3"></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('code-shaped alt under a smilie directory', () => {
    const codeAltCases: Array<[string, string]> = [
      ['https://example.com/images/smilies/fresse.gif', ':fresse:'],
      ['https://example.com/uploads/emoticons/default_true.gif', ':тру:'],
      ['https://example.com/smileys/ohwell.png', ':-/'],
      ['https://example.com/wcf/images/smilies/scared.png', '=O'],
    ]

    it.each(codeAltCases)('should mark %s by its %s alt', async (source, alt) => {
      const value = `<p><img src="${source}" alt="${alt}"></p>`
      const expected = `<p><img data-emoji="" src="${source}" alt="${alt}"></p>`

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a smilie with a bracketed alt untouched', async () => {
      const value = '<p><img src="https://example.com/img/smilies/blahblah.gif" alt="[image]"></p>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('emoticon class', () => {
    const codeAltCases: Array<string> = [':eheh:', '(LOL)', '[emo155]', ':-))']

    it.each(codeAltCases)(
      'should mark an emoticon with no declared size by its %s alt',
      async (alt) => {
        const value = html`
          <p>
            <img
              class="emoticon"
              src="https://example.com/albums/hug.gif"
              alt="${alt}"
            >
          </p>
        `
        const expected = html`
          <p>
            <img
              data-emoji=""
              class="emoticon"
              src="https://example.com/albums/hug.gif"
              alt="${alt}"
            >
          </p>
        `

        expect(await transform(value)).toEqualHtml(expected)
      },
    )

    it('should mark an emoticon with no declared size in a smilie directory', async () => {
      const value =
        '<p><img class="emoticon" src="https://example.com/smilies/custom/hug.gif" alt=""></p>'
      const expected =
        '<p><img data-emoji="" class="emoticon" src="https://example.com/smilies/custom/hug.gif" alt=""></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an emoticon with no declared size and no other hint untouched', async () => {
      const value = html`
        <p>
          <img
            class="emoticon"
            src="https://example.com/photos/beach-party.jpg"
            alt="beach party"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should mark an emoticon declared at 20 pixels with no other hint', async () => {
      const value = html`
        <p>
          <img
            class="emoticon"
            src="https://example.com/albums/hug.gif"
            width="20"
            height="20"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="emoticon"
            src="https://example.com/albums/hug.gif"
            width="20"
            height="20"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark an emoticon declared at 48 pixels', async () => {
      const value = html`
        <p>
          <img
            class="emoticon"
            src="https://example.com/emoticons/hug_w48_h48.gif"
            width="48"
            height="48"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="emoticon"
            src="https://example.com/emoticons/hug_w48_h48.gif"
            width="48"
            height="48"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    const largeCases: Array<[string, string, string]> = [
      ['49 by 49', '49', '49'],
      ['259 by 111', '259', '111'],
    ]

    it.each(largeCases)('should leave a %s emoticon untouched', async (_size, width, height) => {
      const value = html`
        <p>
          <img
            class="emoticon"
            src="https://example.com/reactions/facepalm.gif"
            width="${width}"
            height="${height}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an emoticon sized over 48 pixels by its style untouched', async () => {
      const value = html`
        <p>
          <img
            class="emoticon"
            src="https://example.com/reactions/facepalm.gif"
            style="width: 120px; height: 90px"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a Windows Live Writer emoticon untouched', async () => {
      const value = html`
        <p>
          <img
            class="wlEmoticon wlEmoticon-smile"
            src="https://example.com/wp-content/uploads/wlEmoticon-smile.png"
            alt="Smile"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should replace an emoticon by its emoji alt', async () => {
      const value = html`
        <p>
          <img
            class="emoticon"
            src="https://example.com/albums/hug.gif"
            alt="😀"
          >
        </p>
      `
      const expected = '<p>😀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('smiles directory', () => {
    it('should mark a phpBB smilie served from a renamed directory', async () => {
      const value = '<p><img src="https://example.com/smiles/icon_smile.gif" alt="Smile"></p>'
      const expected =
        '<p><img data-emoji="" src="https://example.com/smiles/icon_smile.gif" alt="Smile"></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // A board's own art, numbered or named in-house, with nothing a table can map.
    it('should leave a smilie with no known name untouched', async () => {
      const value = '<p><img src="https://example.com/smiles/diver1.gif" alt="diver"></p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should mark a Kolobok smilie whose name looks like the codepoint of ®', async () => {
      const value = '<p><img src="https://example.com/smiles/ae.gif" alt="Amd Razzing"></p>'
      const expected =
        '<p><img data-emoji="" src="https://example.com/smiles/ae.gif" alt="Amd Razzing"></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a board image named like the codepoint of © without decoding it', async () => {
      const value = '<p><img src="https://example.com/board/emoticons/a9.jpg" alt=":a9:"></p>'
      const expected =
        '<p><img data-emoji="" src="https://example.com/board/emoticons/a9.jpg" alt=":a9:"></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a Kolobok smilie by its two-letter name', async () => {
      const value = '<p><img src="https://example.com/smiles/ag.gif" alt="Amd Green"></p>'
      const expected =
        '<p><img data-emoji="" src="https://example.com/smiles/ag.gif" alt="Amd Green"></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('engines with a single distinguishing case', () => {
    // Each entry is markup as the engine actually emits it into feed content, so the awkward
    // parts are deliberate: MyBB's alt is an English name, vBulletin's is empty, FCKeditor
    // ships neither alt nor class, and IPB 2 puts the filename in the alt.
    const engineCases: Array<[string, string]> = [
      [
        'SMF',
        'src="https://example.com/forum/Smileys/default/wink.gif" alt=";)" title="Wink" class="smiley"',
      ],
      [
        'MyBB',
        'src="https://example.com/images/smilies/angry.gif" alt="Angry" title="Angry" class="smilie smilie_26"',
      ],
      [
        'vBulletin',
        'src="https://example.com/images/smilies/smile.gif" border="0" alt="" title="Smile" class="inlineimg"',
      ],
      [
        'DokuWiki',
        'src="https://example.com/lib/images/smileys/smile.svg" class="icon smiley" alt=":-)"',
      ],
      [
        'CKEditor',
        'src="/ckeditor/plugins/smiley/images/regular_smile.gif" title="smiley" alt="smiley"',
      ],
      ['FCKeditor', 'src="/editor/images/smiley/msn/wink_smile.gif"'],
      // Both spellings ship in the wild, and the corrected one is the commoner of the two.
      [
        'CKEditor corrected tongue',
        'src="/ckeditor/plugins/smiley/images/tongue_smile.png" alt="cheeky" title="cheeky"',
      ],
      ['TinyMCE 4', 'src="/tinymce/plugins/emoticons/img/smiley-cool.gif" alt="cool"'],
      [
        'Invision Power Board 3',
        'src="/public/style_emoticons/default/smile.png" class="bbc_emoticon" alt=":)"',
      ],
      [
        'Invision Power Board 2',
        'src="/style_emoticons/default/smile.gif" emoid=":)" alt="smile.gif"',
      ],
      [
        'Simple:Press',
        'src="/wp-content/forum-smileys/sf-wink.gif" width="15" class="sfimageleft" title="wink" alt="wink"',
      ],
      // From the engines' own default sets, not from corpus tokens, so these cover boards the
      // corpus never sampled.
      ['phpBB sad', 'class="smilies" src="/images/smilies/icon_e_sad.svg" alt="" title="Sad"'],
      [
        'SMF sealed lips',
        'src="/Smileys/fugue/lipsrsealed.png" alt="" title="Lips sealed" class="smiley"',
      ],
    ]

    it.each(engineCases)('should mark a %s smilie', async (_engine, attributes) => {
      const value = `<p><img ${attributes}></p>`
      const expected = `<p><img data-emoji="" ${attributes}></p>`

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

    const markedCodeCases: Array<string> = [
      ':angry:',
      ':wub:',
      ':blink:',
      ':wacko:',
      ':ph34r:',
      ':whistle:',
      ':mellow:',
      ':huh:',
    ]

    it.each(markedCodeCases)('should mark the %s code', async (code) => {
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

    // Stock codes each engine draws as its own face.
    const markedAliasCases: Array<string> = [
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

    it.each(markedAliasCases)('should mark the %s code', async (code) => {
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

  describe('an exact hint in a set that keeps its pictures', () => {
    it('should mark a file named for no glyph despite its universal code', async () => {
      const value = '<p><img src="https://example.com/images/smilies/happy.gif" alt=":)"></p>'
      const expected =
        '<p><img data-emoji="" src="https://example.com/images/smilies/happy.gif" alt=":)"></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a codepoint file by its filename when its alt is a false code', async () => {
      const value = '<p><img src="https://example.com/images/smilies/1f608.png" alt=":evil:"></p>'
      const expected = '<p>😈</p>'

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

    const engineNameSourceCases: Array<string> = [
      'https://illiweb.com/fa/i/smiles/icon_cheers.png',
      'https://example.com/media/kunena/emoticons/cheerful.png',
      'https://example.com/uploads/emoticons/default_yahoo.gif',
      'https://example.com/public/style_emoticons/default/drool.gif',
      'https://example.com/styles/default/xenforo/smilies/banghead.gif',
      'https://example.com/images/smilies/gruebel.gif',
    ]

    it.each(engineNameSourceCases)('should mark the name a board added at %s', async (src) => {
      const value = `<p><img src="${src}" alt=""></p>`
      const expected = `<p><img data-emoji="" src="${src}" alt=""></p>`

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('platform filename tables', () => {
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

  it('should mark a CKEditor smiley copied into a theme folder', async () => {
    const value =
      '<p><img alt="wink" src="https://example.com/themes/default/ck_smiley/wink_smile.png" width="23"></p>'
    const expected =
      '<p><img data-emoji="" alt="wink" src="https://example.com/themes/default/ck_smiley/wink_smile.png" width="23"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
