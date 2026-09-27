import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('facebookEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('Facebook (embedded posts)', () => {
    it('should replace Facebook emoji image', async () => {
      const value = html`
        <p>
          <img
            height="16"
            width="16"
            alt="🙂"
            referrerpolicy="origin-when-cross-origin"
            src="https://static.xx.fbcdn.net/images/emoji.php/v9/t4c/1/16/1f642.png"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should decode the filename when the alt is empty', async () => {
      const value = html`
        <p>
          <img
            alt=""
            src="https://static.xx.fbcdn.net/images/emoji.php/v9/t4c/1/16/1f642.png"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('hosts', () => {
    const hosts = ['fbcdn.net/images/emoji.php/', 'www.facebook.com/images/emoji.php/']

    it.each(hosts)('should replace an emoji image from %s', async (host) => {
      const value = `<p>Hi <img src="https://${host}1f642.png" alt="🙂"></p>`
      const expected = '<p>Hi 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})

describeForEachParser('facebookElementEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  it('should decode the codepoint filename of a painted span', async () => {
    const value = html`
      <p>Congrats
        <span
          class="_6qdm"
          style="background-image: url(&quot;https://static.xx.fbcdn.net/images/emoji.php/v9/fe5/1.5/16/1f389.png&quot;); height: 16px; width: 16px;"
        ></span>
      </p>
    `
    const expected = '<p>Congrats 🎉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode a joined sequence on a span marked as an emoji', async () => {
    const value = html`
      <p>
        <span
          class="x1xsqp64 xiy17q3 x1o6pynw x19co3pv xdj266r xjn30re xat24cr x1hb08if x2b8uid"
          data-emoji-size="20"
          data-testid="emoji"
          style="background-image: url(&quot;https://static.xx.fbcdn.net/images/emoji.php/v9/t24/2/20/1f64b_200d_2642.png&quot;); background-size: 20px 20px;"
        ></span>
      </p>
    `
    const expected = '<p>🙋‍♂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode a keycap', async () => {
    const value = html`
      <p>
        <span
          data-testid="emoji"
          style="background-image: url(&quot;https://static.xx.fbcdn.net/images/emoji.php/v9/tf6/1/16/35_20e3.png&quot;); background-size: 16px 16px;"
        ></span>
      </p>
    `
    const expected = '<p>5⃣</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode a painted i element from the main host', async () => {
    const value = html`
      <p>
        <i
          class="_3kkw _4-k1"
          style="background-image: url(https://www.facebook.com/images/emoji.php/v5/u87/1/16/1f340.png);"
        ></i>
      </p>
    `
    const expected = '<p>🍀</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a span holding its own glyph as text', async () => {
    const value = html`
      <p>
        <span
          class="_6qdm"
          style="height: 16px; width: 16px; background-image: url('https://static.xx.fbcdn.net/images/emoji.php/v9/tb9/1/16/1f919.png')"
        >🤙</span>
      </p>
    `
    const expected = '<p>🤙</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the picture as an image when the filename names no emoji', async () => {
    const value = html`
      <p>
        <span
          class="_6qdm"
          style="background-image: url(https://static.xx.fbcdn.net/images/emoji.php/v9/t1/1/16/2019.png);"
        ></span>
      </p>
    `
    const expected = html`
      <p>
        <img
          src="https://static.xx.fbcdn.net/images/emoji.php/v9/t1/1/16/2019.png"
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a span holding text other than an emoji untouched', async () => {
    const value = html`
      <p>
        <span
          data-testid="emoji"
          style="background-image: url(&quot;https://static.xx.fbcdn.net/images/emoji.php/v9/t4c/1/16/1f642.png&quot;);"
        >....</span>
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a background from another host untouched', async () => {
    const value = html`
      <p>
        <span
          class="_6qdm"
          style="background-image: url(https://example.com/images/emoji.php/v9/t1/1/16/1f642.png);"
        ></span>
      </p>
    `

    expect(await transformKeeping(value)).toEqualHtml(value)
  })

  it('should leave an emoji span with no background to the image it wraps', async () => {
    const value = html`
      <p>
        <span data-testid="emoji">
          <img
            src="https://static.xx.fbcdn.net/images/emoji.php/v9/t4/1/16/1f600.png"
            alt="😀"
          >
        </span>
      </p>
    `
    const expected = '<p><span data-testid="emoji">😀</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})

describeForEachParser('facebookClassicEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an emoticon by the code in its title', async () => {
    const value = html`
      <p>Hello
        <span
          class="emoticon emoticon_wink"
          style="background-image: url(https://static.example.com/rsrc.php/v2/yO/r/rfFO0dqI-dD.png);"
          title=";)"
        ></span>
      </p>
    `
    const expected = '<p>Hello 😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an emoticon with no title by its class', async () => {
    const value = '<p>Hello <span class="emoticon emoticon_frown"></span></p>'
    const expected = '<p>Hello 🙁</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an emoticon whose title is its name by its class', async () => {
    const value = html`
      <p>
        <span
          class="_1ty6 emoticon_grin"
          title="grin"
        ><span class="_5ukz"><span data-text="true">　</span></span></span>
      </p>
    `
    const expected = '<p>😁</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an emoticon holding its own code as text', async () => {
    const value = '<p><span class="emoticon emoticon_tongue" title=":p">:p</span></p>'
    const expected = '<p>😛</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace the heart emoticon by its code', async () => {
    const value = '<p><span class="emoticon emoticon_heart" title="&lt;3"></span></p>'
    const expected = '<p>❤️</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the kiki emoticon as its code, which engines draw as different faces', async () => {
    const value = '<p><span class="emoticon emoticon_kiki" title="^_^"></span></p>'
    const expected = '<p><span data-emoji="">^_^</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a code no table resolves as fallback text', async () => {
    const value = '<p><span class="emoticon emoticon_penguin" title="&lt;(&quot;)"></span></p>'
    const expected = '<p><span data-emoji="">&lt;(")</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a code no glyph maps as fallback text', async () => {
    const value = '<p><span class="emoticon emoticon_robot"></span></p>'
    const expected = '<p><span data-emoji="">:|]</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a span whose class names no Facebook emoticon untouched', async () => {
    const value = '<p><span class="emoticon_wrapper"></span></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a wrapper around a picture untouched', async () => {
    const value = html`
      <p><span class="emoticon_box"><img
          src="https://example.com/photo.jpg"
          alt="A photo"
        ></span></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave an emoticon class wrapping a picture untouched', async () => {
    const value = html`
      <p><span class="emoticon emoticon_smile"><img
          src="https://example.com/photo.jpg"
          alt="A photo"
        ></span></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should replace the emoticon and its sibling holding the code with the glyph', async () => {
    const value = html`
      <p>Ok<span
          class="emoticon_text"
          aria-hidden="true"
        >:)</span><span
          class="emoticon emoticon_smile"
          title=":)"
        ></span></p>
    `
    const expected = '<p>Ok🙂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace the emoticon and its sibling separated by whitespace', async () => {
    const value = html`
      <p>Ok <span class="emoticon_text" aria-hidden="true">:)</span> <span
          class="emoticon emoticon_smile"
          title=":)"
        ></span></p>
    `
    const expected = '<p>Ok  🙂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a sibling code padded with non-breaking spaces', async () => {
    const value = html`
      <p>Ok<span
          class="emoticon_text"
          aria-hidden="true"
        >&nbsp;;)&nbsp;</span><span
          class="emoticon emoticon_wink"
          title=";)"
        ></span></p>
    `
    const expected = '<p>Ok😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace the emoticon and its sibling holding a localized label with the glyph', async () => {
    const value = html`
      <p>Ok<span
          class="emoticon_text"
          aria-hidden="true"
        >winkhymiö</span><span
          class="emoticon emoticon_wink"
          title=";)"
        ></span></p>
    `
    const expected = '<p>Ok😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a sibling holding another code untouched', async () => {
    const value = html`
      <p>Ok<span
          class="emoticon_text"
          aria-hidden="true"
        >:(</span><span class="emoticon emoticon_smile" title=":)"></span></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a sibling holding prose untouched', async () => {
    const value = html`
      <p><span
          class="emoticon_text"
        >er jeg å fornøyd med :D</span><span class="emoticon emoticon_grin" title=":D"></span></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a sibling holding short prose that names the emoticon untouched', async () => {
    const value = html`
      <p><span
          class="emoticon_text"
        >Big heart for you</span><span
          class="emoticon emoticon_heart"
          title="&lt;3"
        ></span></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a sibling holding short prose that starts with the name untouched', async () => {
    const value = html`
      <p><span
          class="emoticon_text"
        >I smile a lot</span><span
          class="emoticon emoticon_smile"
          title=":)"
        ></span></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should replace the emoticon and its sibling holding an English label', async () => {
    const value = html`
      <p>Ok<span
          class="emoticon_text"
          aria-hidden="true"
        >smile emoticon</span><span
          class="emoticon emoticon_smile"
          title=":)"
        ></span></p>
    `
    const expected = '<p>Ok🙂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace the emoticon and its sibling holding a label with the name last', async () => {
    const value = html`
      <p>Ok<span
          class="emoticon_text"
          aria-hidden="true"
        >Uttrykksikonet heart</span><span
          class="emoticon emoticon_heart"
          title="&lt;3"
        ></span></p>
    `
    const expected = '<p>Ok❤️</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a sibling longer than a label untouched', async () => {
    const value = html`
      <p><span
          class="emoticon_text"
        >We could not stop to smile at the whole thing</span><span
          class="emoticon emoticon_smile"
          title=":)"
        ></span></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should keep a fallback span that text separates from the emoticon', async () => {
    const value = html`
      <p><span class="emoticon_text">:)</span> Ok<span
          class="emoticon emoticon_smile"
          title=":)"
        ></span></p>
    `
    const expected = '<p><span class="emoticon_text">:)</span> Ok🙂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a sibling holding a code no table resolves untouched', async () => {
    const value = html`
      <p>Ok<span
          class="emoticon_text"
          aria-hidden="true"
        >&lt;(")</span><span
          class="emoticon emoticon_penguin"
          title="&lt;(&quot;)"
        ></span></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should replace an emoticon whose sibling is empty', async () => {
    const value = html`
      <p>Ok<span class="emoticon_text"></span><span
          class="emoticon emoticon_smile"
          title=":)"
        ></span></p>
    `
    const expected = '<p>Ok<span class="emoticon_text"></span>🙂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a paragraph pasted inside the emoticon class untouched', async () => {
    const value = html`
      <p><span
          class="emoticon emoticon_smile"
          title=":)"
        >Sorry this is blurry!</span></p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  // Outlook prefixes every class in forwarded markup with `x_`.
  it('should leave a span whose emoticon class is part of another class untouched', async () => {
    const value = '<p>Hi <span class="x_emoticon_smile" title=":)"></span></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
