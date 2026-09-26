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

  it('should replace the kiki emoticon by its code', async () => {
    const value = '<p><span class="emoticon emoticon_kiki" title="^_^"></span></p>'
    const expected = '<p>😊</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a code no table resolves as fallback text', async () => {
    const value = '<p><span class="emoticon emoticon_penguin" title="&lt;(&quot;)"></span></p>'
    const expected = '<p><span data-emoji="">&lt;(")</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep an unmapped name as fallback text', async () => {
    const value = '<p><span class="emoticon emoticon_shocked"></span></p>'
    const expected = '<p><span data-emoji="">shocked</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave the emoticon to its sibling holding the code as text', async () => {
    const value = html`
      <p>Ok<span
          class="emoticon_text"
          aria-hidden="true"
        >:)</span><span
          class="emoticon emoticon_smile"
          title=":)"
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
})
