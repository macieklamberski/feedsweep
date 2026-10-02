import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { convertUcozSpoilerButtons } from './convertUcozSpoilerButtons.js'

describeForEachParser('convertUcozSpoilerButtons', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [convertUcozSpoilerButtons(baseContext)])
  }

  it('should replace a titled spoiler button with its title in bold', async () => {
    const value = html`
      <div class="uSpoilerButBl">
        <input
          type="button"
          class="uSpoilerButton"
          onclick="if($('#uSpoilerc5sN9l')[0]){$('.uSpoilerText',$('#uSpoilerc5sN9l'))[0].style.display='';}"
          value="[+] Обложка"
        >
      </div>
    `
    const expected = html`
      <div class="uSpoilerButBl">
        <strong>Обложка</strong>
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep markup characters in the title as text', async () => {
    const value = '<input type="button" class="uSpoilerButton" value="[+] Tom &amp; <Jerry>">'
    const expected = '<strong>Tom &amp; &lt;Jerry&gt;</strong>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an untitled spoiler button to the strip selector', async () => {
    const value = '<input type="button" class="uSpoilerButton" value="Открыть спойлер">'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a button of another class that reads [+]', async () => {
    const value = '<input type="button" class="toggle" value="[+] Details">'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = '<input type="button" class="uSpoilerButton" value="[+] Обложка">'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('convertUcozSpoilerButtons through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  describe('a spoiler whose button names it', () => {
    it('should put the title above the revealed text', async () => {
      const value = html`
        <div
          class="uSpoilerClosed"
          id="uSpoilerc5sN9l"
        >
          <div class="uSpoilerButBl">
            <input
              type="button"
              class="uSpoilerButton"
              onclick="if($('#uSpoilerc5sN9l')[0]){$('.uSpoilerText',$('#uSpoilerc5sN9l'))[0].style.display='';}"
              value="[+] Звуковые коды"
            >
          </div>
          <div
            class="uSpoilerText"
            style="display:none;"
          >1 короткий: ошибка таймера.</div>
        </div>
      `
      const expected = '<p><strong>Звуковые коды</strong></p><p>1 короткий: ошибка таймера.</p>'

      expect(await convert(value)).toEqualHtml(expected)
    })
  })

  describe('a spoiler whose button reads only "open spoiler"', () => {
    it('should drop the button and keep the revealed text', async () => {
      const value = html`
        <div
          class="uSpoilerClosed"
          id="uSpoiler13Cu30"
        >
          <div class="uSpoilerButBl">
            <input
              type="button"
              class="uSpoilerButton"
              onclick="if($('#uSpoiler13Cu30')[0]){$('.uSpoilerText',$('#uSpoiler13Cu30'))[0].style.display='';}"
              value="Открыть спойлер"
            >
          </div>
          <div
            class="uSpoilerText"
            style="display:none;"
          >За обложку большое спасибо.</div>
        </div>
      `
      const expected = '<p>За обложку большое спасибо.</p>'

      expect(await convert(value)).toEqualHtml(expected)
    })
  })
})
