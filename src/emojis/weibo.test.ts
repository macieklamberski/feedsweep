import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('weiboEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('Weibo (sinaimg emoticon path)', () => {
    it('should mark an emoticon with a bracketed localized alt', async () => {
      const value = html`
        <p>
          <span class="url-icon">
            <img alt="[围观]" src="https://h5.sinaimg.cn/m/emoticon/icon/others/o_weiguan.png">
          </span>
        </p>
      `
      const expected = html`
        <p>
          <span class="url-icon">
            <img
              alt="[围观]"
              src="https://h5.sinaimg.cn/m/emoticon/icon/others/o_weiguan.png"
              data-emoji=""
            >
          </span>
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
