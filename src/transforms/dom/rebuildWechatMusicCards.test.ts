import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildWechatMusicCards } from './rebuildWechatMusicCards.js'

describeForEachParser('rebuildWechatMusicCards', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildWechatMusicCards(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild the card into its cover captioned with the song and singer', async () => {
      const value = html`
        <mp-common-clmusic
          class="res_iframe clmusic_iframe js_uneditable custom_select_card"
          data-pluginname="insertaudio"
          type="1"
          music_name="我的纸飞机 (治愈版)"
          albumurl="http://wx.y.gtimg.cn/music/photo_new/T002R500x500M000004UFus23ktG6p_2.jpg"
          singer="李怡然同学"
          count="0"
          is_vip="1"
          duration="170000"
          music_source="1"
          listenid="78301936548815496"
        ></mp-common-clmusic>
      `
      const expected = html`
        <figure>
          <img src="http://wx.y.gtimg.cn/music/photo_new/T002R500x500M000004UFus23ktG6p_2.jpg">
          <figcaption>我的纸飞机 (治愈版) – 李怡然同学</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the card through the default pipeline', async () => {
      const value = html`
        <p>Intro</p>
        <mp-common-clmusic
          music_name="Golden"
          albumurl="http://wx.y.gtimg.cn/music/photo_new/T002R500x500M000002t4VNW26kFjU_2.jpg"
          singer="HUNTR/X"
          listenid="78353599694914508"
        ></mp-common-clmusic>
      `
      const expected = html`
        <p>Intro</p>
        <figure>
          <img src="http://wx.y.gtimg.cn/music/photo_new/T002R500x500M000002t4VNW26kFjU_2.jpg">
          <figcaption>Golden – HUNTR/X</figcaption>
        </figure>
      `

      expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a card naming neither a cover nor a song', async () => {
      const value = '<mp-common-clmusic listenid="78301936548815496"></mp-common-clmusic>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should caption a card with no singer by the song alone', async () => {
      const value = html`
        <mp-common-clmusic
          music_name="Golden"
          albumurl="http://wx.y.gtimg.cn/music/photo_new/T002R500x500M000002t4VNW26kFjU_2.jpg"
        ></mp-common-clmusic>
      `
      const expected = html`
        <figure>
          <img src="http://wx.y.gtimg.cn/music/photo_new/T002R500x500M000002t4VNW26kFjU_2.jpg">
          <figcaption>Golden</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the caption of a card with no cover', async () => {
      const value = '<mp-common-clmusic music_name="Golden" singer="HUNTR/X"></mp-common-clmusic>'
      const expected = '<figure><figcaption>Golden – HUNTR/X</figcaption></figure>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = html`
        <mp-common-clmusic
          music_name="Golden"
          albumurl="http://wx.y.gtimg.cn/music/photo_new/T002R500x500M000002t4VNW26kFjU_2.jpg"
          singer="HUNTR/X"
        ></mp-common-clmusic>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})
