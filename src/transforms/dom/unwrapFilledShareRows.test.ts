import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { unwrapFilledShareRows } from './unwrapFilledShareRows.js'

describeForEachParser('unwrapFilledShareRows', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [unwrapFilledShareRows(baseContext)])
  }

  describe('happy paths', () => {
    it('should keep the paragraphs written into the row container', async () => {
      const value = html`
        <div class="ya-share2 ya-share2_inited" data-services="vkontakte,facebook,odnoklassniki,moimir,twitter,lj">
          <div class="ya-share2__container ya-share2__container_size_m ya-share2__container_color-scheme_normal ya-share2__container_shape_normal">
            <p>При спазмах пищеварительного тракта альтернативой Но-Шпе может стать отвар листьев мяты.</p>
            <p>Для путешествий фитосредство лучше приобретать в фильтр-пакетиках.</p>
          </div>
        </div>
      `
      const expected = html`
        <p>При спазмах пищеварительного тракта альтернативой Но-Шпе может стать отвар листьев мяты.</p>
        <p>Для путешествий фитосредство лучше приобретать в фильтр-пакетиках.</p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the text written straight into the row', async () => {
      const value = html`
        <div class="ya-share2 ya-share2_inited" style="text-align: justify;" data-curtain="" data-shape="round" data-services="vkontakte,facebook,odnoklassniki,telegram,twitter,whatsapp"><strong>Сухум. 1 сентября 2023. Апсныпресс</strong>. Спикер Парламента Лаша Ашуба поздравил школьников.</div>
      `
      const expected =
        '<strong>Сухум. 1 сентября 2023. Апсныпресс</strong>. Спикер Парламента Лаша Ашуба поздравил школьников.'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the text written into a button item of the row', async () => {
      const value = html`
        <div class="ya-share2 ya-share2_inited">
          <div class="ya-share2__container ya-share2__container_size_m">
            <ul class="ya-share2__list ya-share2__list_direction_horizontal">
              <li class="ya-share2__item ya-share2__item_service_collections">Мне,как гражданке Беларуси,сертификат не нужен.</li>
            </ul>
          </div>
        </div>
      `
      const expected = 'Мне,как гражданке Беларуси,сертификат не нужен.'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a row of bare buttons to the strip', async () => {
      const value = html`
        <div class="ya-share2 ya-share2_inited">
          <div class="ya-share2__container ya-share2__container_size_m">
            <ul class="ya-share2__list ya-share2__list_direction_horizontal">
              <li class="ya-share2__item ya-share2__item_service_vkontakte">
                <a class="ya-share2__link" href="https://example.com/share.php?url=https%3A%2F%2Fexample.com%2Fpost">
                  <span class="ya-share2__badge"><span class="ya-share2__icon"></span></span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a row of titled buttons to the strip', async () => {
      const value = html`
        <div class="ya-share2 ya-share2_inited">
          <div class="ya-share2__container ya-share2__container_size_m">
            <ul class="ya-share2__list ya-share2__list_direction_horizontal">
              <li class="ya-share2__item ya-share2__item_service_vkontakte">
                <a class="ya-share2__link" href="https://example.com/share.php?url=https%3A%2F%2Fexample.com%2Fpost">
                  <span class="ya-share2__badge"><span class="ya-share2__icon"></span></span>
                  <span class="ya-share2__title">ВКонтакте</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = html`
        <div class="ya-share2 ya-share2_inited" data-services="vkontakte,facebook,odnoklassniki,moimir,twitter,lj">
          <div class="ya-share2__container ya-share2__container_size_m ya-share2__container_color-scheme_normal ya-share2__container_shape_normal">
            <p>Для путешествий фитосредство лучше приобретать в фильтр-пакетиках.</p>
          </div>
        </div>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('unwrapFilledShareRows through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the text and drop the row with its data-image', async () => {
    const value = html`
      <div class="ya-share2 ya-share2_inited" data-curtain="" data-size="l" data-shape="round" data-image="https://example.com/_ld/80/38897179.jpg" data-services="facebook,odnoklassniki,vkontakte,twitter,telegram,whatsapp">
        <div class="ya-share2__container ya-share2__container_size_l ya-share2__container_color-scheme_normal ya-share2__container_shape_round">
          <p><strong>«Привет, я Алиса и я ищу новую работу.</strong></p>
        </div>
      </div>
    `
    const expected = '<p><strong>«Привет, я Алиса и я ищу новую работу.</strong></p>'

    expect(await convert(value)).toEqualHtml(expected)
  })
})
