import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { convertBloggerCaptionTables } from './convertBloggerCaptionTables.js'

describeForEachParser('convertBloggerCaptionTables', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [convertBloggerCaptionTables(baseContext)])
  }

  describe('Variant #1: a linked image over one caption cell', () => {
    it('should convert the table into a figure holding the link and the caption', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" imageanchor="1" style="margin-left: auto; margin-right: auto;">
                  <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" height="426" width="640">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Cardigan Marlon Garçon García</td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" imageanchor="1" style="margin-left: auto; margin-right: auto;">
            <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" height="426" width="640">
          </a>
          <figcaption>Cardigan Marlon Garçon García</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #2: a bare image over one caption cell', () => {
    it('should convert the table into a figure holding the image and the caption', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <img border="0" height="400" src="https://example.org/2009/02/flaming-hot-antarctic-penguin.jpg" style="margin-left: auto; margin-right: auto;" width="369">
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Combusting emperor penguin breathing fire on a &nbsp;Stevenson screen</td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <img border="0" height="400" src="https://example.org/2009/02/flaming-hot-antarctic-penguin.jpg" style="margin-left: auto; margin-right: auto;" width="369">
          <figcaption>Combusting emperor penguin breathing fire on a &nbsp;Stevenson screen</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #3: a link around a span around the image', () => {
    it('should keep the link with the span it holds', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="https://example.com/watch/ZSj7QsHRxHQ" target="_blank">
                  <span style="margin-left: auto; margin-right: auto;">
                    <img border="0" data-original-height="1023" data-original-width="1610" height="406" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7tO7cRBidRhxtQhFaKLUXvoJv3QcXfxXws_tNO-EJ0frWt5z7g-yZtl3LRWpBoEFmpGPqxyzBOqDNAMrDTMHJKCyVjXjvf7sEd7WoacxxsmLJSstjQQjRWuJTgKojzr1GUtTaPT7KlbL4NEC4Q6V_qasHHdINQBGqgiQZnOXmQ1LJX6y5z8YKoLrWzw/w640-h406/Clipboard03.jpg" width="640">
                  </span>
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">
                <a href="https://example.com/watch/ZSj7QsHRxHQ" target="_blank">
                  <span style="font-size: small;">David Grusch</span>
                  <br>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <a href="https://example.com/watch/ZSj7QsHRxHQ" target="_blank">
            <span style="margin-left: auto; margin-right: auto;">
              <img border="0" data-original-height="1023" data-original-width="1610" height="406" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7tO7cRBidRhxtQhFaKLUXvoJv3QcXfxXws_tNO-EJ0frWt5z7g-yZtl3LRWpBoEFmpGPqxyzBOqDNAMrDTMHJKCyVjXjvf7sEd7WoacxxsmLJSstjQQjRWuJTgKojzr1GUtTaPT7KlbL4NEC4Q6V_qasHHdINQBGqgiQZnOXmQ1LJX6y5z8YKoLrWzw/w640-h406/Clipboard03.jpg" width="640">
            </span>
          </a>
          <figcaption>
            <a href="https://example.com/watch/ZSj7QsHRxHQ" target="_blank">
              <span style="font-size: small;">David Grusch</span>
              <br>
            </a>
          </figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #4: a span around the linked image', () => {
    it('should drop the span and keep the inline markup of the caption', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <span style="margin-left: auto; margin-right: auto;">
                  <a href="https://example.com/product/jo-lankester-chatter/" target="_blank">
                    <img border="0" data-original-height="1761" data-original-width="2000" height="565" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgVOVMEWmpTfPPv_YzcAKvnUiNgxfM5JMsa32n01BB5_bCXBLaJmqoNu5gAajSS2iIqaXoob7uiFiK60seeSHI6kF9rWIbR3equIoSj89TzVxGvF0Q-liN6MFC67ZApeT9dkg264_LaCMnAieQtMvXWobJ-jbdhgvyQMFAQwz58MMnuiymkhLrsuIaHnBUW/w640-h565/Lankester_Jo_(image-Louis_Lim)1.jpg" width="640">
                  </a>
                </span>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">
                <a href="https://example.com/product/jo-lankester-chatter/" target="_blank">
                  Jo Lankester<br><i><b>Chatter</b></i>, 2025<br>Image: Louis Lim. Courtesy of the artist
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <a href="https://example.com/product/jo-lankester-chatter/" target="_blank">
            <img border="0" data-original-height="1761" data-original-width="2000" height="565" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgVOVMEWmpTfPPv_YzcAKvnUiNgxfM5JMsa32n01BB5_bCXBLaJmqoNu5gAajSS2iIqaXoob7uiFiK60seeSHI6kF9rWIbR3equIoSj89TzVxGvF0Q-liN6MFC67ZApeT9dkg264_LaCMnAieQtMvXWobJ-jbdhgvyQMFAQwz58MMnuiymkhLrsuIaHnBUW/w640-h565/Lankester_Jo_(image-Louis_Lim)1.jpg" width="640">
          </a>
          <figcaption>
            <a href="https://example.com/product/jo-lankester-chatter/" target="_blank">
              Jo Lankester<br><i><b>Chatter</b></i>, 2025<br>Image: Louis Lim. Courtesy of the artist
            </a>
          </figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #5: line breaks before the image', () => {
    it('should drop the line breaks', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <br>
                <a href="https://1.bp.blogspot.com/-6MbBg68AKag/XfjTyaqtjwI/AAAAAAAAAF4/JU5mmtsQI4suxbPncrNsw8dhH_DrKsmEgCEwYBhgL/s1600/Kartik-Aryaan-Biography%2B%25284%2529.jpg" imageanchor="1" style="margin-left: auto; margin-right: auto;">
                  <img alt="Kartik-Aryaan-Biography" border="0" data-original-height="400" data-original-width="640" src="https://1.bp.blogspot.com/-6MbBg68AKag/XfjTyaqtjwI/AAAAAAAAAF4/JU5mmtsQI4suxbPncrNsw8dhH_DrKsmEgCEwYBhgL/s1600/Kartik-Aryaan-Biography%2B%25284%2529.jpg" title="Kartik-Aryaan-Biography">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Kartik Aryaan Biography</td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <a href="https://1.bp.blogspot.com/-6MbBg68AKag/XfjTyaqtjwI/AAAAAAAAAF4/JU5mmtsQI4suxbPncrNsw8dhH_DrKsmEgCEwYBhgL/s1600/Kartik-Aryaan-Biography%2B%25284%2529.jpg" imageanchor="1" style="margin-left: auto; margin-right: auto;">
            <img alt="Kartik-Aryaan-Biography" border="0" data-original-height="400" data-original-width="640" src="https://1.bp.blogspot.com/-6MbBg68AKag/XfjTyaqtjwI/AAAAAAAAAF4/JU5mmtsQI4suxbPncrNsw8dhH_DrKsmEgCEwYBhgL/s1600/Kartik-Aryaan-Biography%2B%25284%2529.jpg" title="Kartik-Aryaan-Biography">
          </a>
          <figcaption>Kartik Aryaan Biography</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop the newline after the line break', async () => {
      const value =
        '<table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: right;"><tbody>\n<tr><td style="text-align: center;"><br>\n<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_1vfZmgwlXQZUOQhvlpi3koTUpdN5BnF4ZEVqX6w3dNLe8nGFbOgH8I4R1keKn1c4LU5_gDPA7ENKpnttjCYScVrM53JntqTzDYLrtKOrIptpW_5bkihwMHpbww4-0oKPEi9rsh6wh8yk/s1600/Comanche+Song.jpg" imageanchor="1" style="clear: right; margin-bottom: 1em; margin-left: auto; margin-right: auto;"><img border="0" height="200" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_1vfZmgwlXQZUOQhvlpi3koTUpdN5BnF4ZEVqX6w3dNLe8nGFbOgH8I4R1keKn1c4LU5_gDPA7ENKpnttjCYScVrM53JntqTzDYLrtKOrIptpW_5bkihwMHpbww4-0oKPEi9rsh6wh8yk/s1600/Comanche+Song.jpg" width="131"></a></td></tr>\n<tr><td class="tr-caption" style="text-align: center;">Cover art by Tom Shefelman</td></tr>\n</tbody></table>'
      const expected = html`
        <figure>
          <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_1vfZmgwlXQZUOQhvlpi3koTUpdN5BnF4ZEVqX6w3dNLe8nGFbOgH8I4R1keKn1c4LU5_gDPA7ENKpnttjCYScVrM53JntqTzDYLrtKOrIptpW_5bkihwMHpbww4-0oKPEi9rsh6wh8yk/s1600/Comanche+Song.jpg" imageanchor="1" style="clear: right; margin-bottom: 1em; margin-left: auto; margin-right: auto;">
            <img border="0" height="200" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_1vfZmgwlXQZUOQhvlpi3koTUpdN5BnF4ZEVqX6w3dNLe8nGFbOgH8I4R1keKn1c4LU5_gDPA7ENKpnttjCYScVrM53JntqTzDYLrtKOrIptpW_5bkihwMHpbww4-0oKPEi9rsh6wh8yk/s1600/Comanche+Song.jpg" width="131">
          </a>
          <figcaption>Cover art by Tom Shefelman</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #6: further caption cells left empty', () => {
    it('should drop the empty cells', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgxnoy8y9ArUI3SykY2cJRc1AI1FkMa-Kj3_MAlgtsD67j92iQlgFfVBx_p1hsyA7mdIIt-WjVavc8g9us_U9989nq_X7kZidEWAt3Ut6Ssew3mFEE3dQlCw4gXafjxqVRQGDbTTcqBRcQ/s1600/blog-3569.jpg" style="margin-left: auto; margin-right: auto;">
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Bonus picture</td>
              <td class="tr-caption" style="text-align: center;"><br></td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgxnoy8y9ArUI3SykY2cJRc1AI1FkMa-Kj3_MAlgtsD67j92iQlgFfVBx_p1hsyA7mdIIt-WjVavc8g9us_U9989nq_X7kZidEWAt3Ut6Ssew3mFEE3dQlCw4gXafjxqVRQGDbTTcqBRcQ/s1600/blog-3569.jpg" style="margin-left: auto; margin-right: auto;">
          <figcaption>Bonus picture</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #7: an empty caption cell', () => {
    it('should replace the table with the linked image alone', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto;">
          <tbody>
            <tr>
              <td>
                <a href="https://lh3.googleusercontent.com/d/1h_aCeqcI5-P2AB9iUCTtCaky4VNR217e" style="margin-left: auto; margin-right: auto;">
                  <img border="0" data-original-height="750" data-original-width="1000" height="300" src="https://lh3.googleusercontent.com/d/1h_aCeqcI5-P2AB9iUCTtCaky4VNR217e=w400-h300" width="400">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption"><br></td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <a href="https://lh3.googleusercontent.com/d/1h_aCeqcI5-P2AB9iUCTtCaky4VNR217e" style="margin-left: auto; margin-right: auto;">
          <img border="0" data-original-height="750" data-original-width="1000" height="300" src="https://lh3.googleusercontent.com/d/1h_aCeqcI5-P2AB9iUCTtCaky4VNR217e=w400-h300" width="400">
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #8: a caption table inside a layout table', () => {
    it('should convert the caption table and keep the layout table', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" style="color: red;">
          <tbody>
            <tr>
              <td>
                <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
                  <tbody>
                    <tr>
                      <td>
                        <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgypHjMDLqRWh7CIyRvdvIj_TzpzbjAGSsWnI4nZRBXLS1IYuiWH3T6pbtF9D7hAVN4TJW4jaAYOuy8E8Pr1K0CwJkoJ6YKPiFCfb2hPpVpwtfX5BNYvv5MPtFhZK22MrR1t_N8i7s_epWi/s1600/Fraisse+fake+calder.jpg" style="margin-left: auto; margin-right: auto;">
                          <img alt="Black Elephant" border="0" height="464" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgypHjMDLqRWh7CIyRvdvIj_TzpzbjAGSsWnI4nZRBXLS1IYuiWH3T6pbtF9D7hAVN4TJW4jaAYOuy8E8Pr1K0CwJkoJ6YKPiFCfb2hPpVpwtfX5BNYvv5MPtFhZK22MrR1t_N8i7s_epWi/s640/Fraisse+fake+calder.jpg" width="640">
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td class="tr-caption"><span style="font-size: x-small;">After Alexander Calder Black Elephant</span></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <table align="center" cellpadding="0" cellspacing="0" style="color: red;">
          <tbody>
            <tr>
              <td>
                <figure>
                  <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgypHjMDLqRWh7CIyRvdvIj_TzpzbjAGSsWnI4nZRBXLS1IYuiWH3T6pbtF9D7hAVN4TJW4jaAYOuy8E8Pr1K0CwJkoJ6YKPiFCfb2hPpVpwtfX5BNYvv5MPtFhZK22MrR1t_N8i7s_epWi/s1600/Fraisse+fake+calder.jpg" style="margin-left: auto; margin-right: auto;">
                    <img alt="Black Elephant" border="0" height="464" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgypHjMDLqRWh7CIyRvdvIj_TzpzbjAGSsWnI4nZRBXLS1IYuiWH3T6pbtF9D7hAVN4TJW4jaAYOuy8E8Pr1K0CwJkoJ6YKPiFCfb2hPpVpwtfX5BNYvv5MPtFhZK22MrR1t_N8i7s_epWi/s640/Fraisse+fake+calder.jpg" width="640">
                  </a>
                  <figcaption><span style="font-size: x-small;">After Alexander Calder Black Elephant</span></figcaption>
                </figure>
              </td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #9: a caption table in a WordPress post', () => {
    it('should convert the table the same way', async () => {
      const value = html`
        <table class="tr-caption-container" cellspacing="0" cellpadding="0" align="center">
          <tbody>
            <tr>
              <td>
                <a href="https://example.org/wp-content/uploads/2020/01/5b277-portrait.jpg">
                  <img loading="lazy" src="https://example.org/wp-content/uploads/2020/01/5b277-portrait.jpg?w=239&amp;h=320" width="239" height="320" border="0">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption">Three guests at the dinner.</td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <a href="https://example.org/wp-content/uploads/2020/01/5b277-portrait.jpg">
            <img loading="lazy" src="https://example.org/wp-content/uploads/2020/01/5b277-portrait.jpg?w=239&amp;h=320" width="239" height="320" border="0">
          </a>
          <figcaption>Three guests at the dinner.</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #10: a caption table inside a link', () => {
    it('should convert the table and keep the outer link', async () => {
      const value = html`
        <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgu88SWY8u5G2dSTjJnqVFN0OSLKlbxaWh8Dv1AIWNcTrMVoMskYpjHIL-82J3RUl4zedjKbkg-AuSE4igAONzU2LJJfnPi-QCskcffoISf5vKChx77JXUqJJtQZWpfnJVBTuayCvGN7j7YLEvxk4KEj289Te8px8f64naoj9x-ZJTfmPGY31EkHCDphIZ5/s4032/IMG_0372.jpeg" style="margin-left: 1em; margin-right: 1em;">
          <div class="separator" style="clear: both; text-align: center;">
            <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto;">
              <tbody>
                <tr>
                  <td style="text-align: center;">
                    <img border="0" data-original-height="4032" data-original-width="3024" height="320" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgu88SWY8u5G2dSTjJnqVFN0OSLKlbxaWh8Dv1AIWNcTrMVoMskYpjHIL-82J3RUl4zedjKbkg-AuSE4igAONzU2LJJfnPi-QCskcffoISf5vKChx77JXUqJJtQZWpfnJVBTuayCvGN7j7YLEvxk4KEj289Te8px8f64naoj9x-ZJTfmPGY31EkHCDphIZ5/s320/IMG_0372.jpeg" style="margin-left: auto; margin-right: auto;" width="240">
                  </td>
                </tr>
                <tr>
                  <td class="tr-caption" style="text-align: center;">Ready for the off.</td>
                </tr>
              </tbody>
            </table>
            <br>
          </div>
        </a>
      `
      const expected = html`
        <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgu88SWY8u5G2dSTjJnqVFN0OSLKlbxaWh8Dv1AIWNcTrMVoMskYpjHIL-82J3RUl4zedjKbkg-AuSE4igAONzU2LJJfnPi-QCskcffoISf5vKChx77JXUqJJtQZWpfnJVBTuayCvGN7j7YLEvxk4KEj289Te8px8f64naoj9x-ZJTfmPGY31EkHCDphIZ5/s4032/IMG_0372.jpeg" style="margin-left: 1em; margin-right: 1em;">
          <div class="separator" style="clear: both; text-align: center;">
            <figure>
              <img border="0" data-original-height="4032" data-original-width="3024" height="320" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgu88SWY8u5G2dSTjJnqVFN0OSLKlbxaWh8Dv1AIWNcTrMVoMskYpjHIL-82J3RUl4zedjKbkg-AuSE4igAONzU2LJJfnPi-QCskcffoISf5vKChx77JXUqJJtQZWpfnJVBTuayCvGN7j7YLEvxk4KEj289Te8px8f64naoj9x-ZJTfmPGY31EkHCDphIZ5/s320/IMG_0372.jpeg" style="margin-left: auto; margin-right: auto;" width="240">
              <figcaption>Ready for the off.</figcaption>
            </figure>
            <br>
          </div>
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Variant #11: an empty element beside the image', () => {
    it('should drop an empty link inside the wrapper around the image', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <span style="font-size: x-small;">
                  <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjGBMza8KWCkxZSP51eL0ohuExGbqnfnZS0Faw7EASbP6v1-JcTWRQ8ekFOUWQn2sucPayPKyBBBsi1p97rMxycUDiJw_ErDwUyUkmr0RzIUK0-CBoR3HFyy6z0DmDbp4I3ulNSjslBn_f5/s3264/8707B9A0-9DC3-48FB-A294-CDACB6996C74.jpeg" style="margin-left: auto; margin-right: auto;">
                    <img border="0" data-original-height="2448" data-original-width="3264" height="480" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjGBMza8KWCkxZSP51eL0ohuExGbqnfnZS0Faw7EASbP6v1-JcTWRQ8ekFOUWQn2sucPayPKyBBBsi1p97rMxycUDiJw_ErDwUyUkmr0RzIUK0-CBoR3HFyy6z0DmDbp4I3ulNSjslBn_f5/w640-h480/8707B9A0-9DC3-48FB-A294-CDACB6996C74.jpeg" width="640">
                  </a>
                  <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjGBMza8KWCkxZSP51eL0ohuExGbqnfnZS0Faw7EASbP6v1-JcTWRQ8ekFOUWQn2sucPayPKyBBBsi1p97rMxycUDiJw_ErDwUyUkmr0RzIUK0-CBoR3HFyy6z0DmDbp4I3ulNSjslBn_f5/s3264/8707B9A0-9DC3-48FB-A294-CDACB6996C74.jpeg" style="margin-left: auto; margin-right: auto;"></a>
                </span>
              </td>
            </tr>
            <tr align="right">
              <td class="tr-caption"><span style="font-size: x-small;"><span style="font-family: arial;">“How we Touch One Another” Laser Cut Sculptural Book A4, September 2020</span><br></span></td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjGBMza8KWCkxZSP51eL0ohuExGbqnfnZS0Faw7EASbP6v1-JcTWRQ8ekFOUWQn2sucPayPKyBBBsi1p97rMxycUDiJw_ErDwUyUkmr0RzIUK0-CBoR3HFyy6z0DmDbp4I3ulNSjslBn_f5/s3264/8707B9A0-9DC3-48FB-A294-CDACB6996C74.jpeg" style="margin-left: auto; margin-right: auto;">
            <img border="0" data-original-height="2448" data-original-width="3264" height="480" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjGBMza8KWCkxZSP51eL0ohuExGbqnfnZS0Faw7EASbP6v1-JcTWRQ8ekFOUWQn2sucPayPKyBBBsi1p97rMxycUDiJw_ErDwUyUkmr0RzIUK0-CBoR3HFyy6z0DmDbp4I3ulNSjslBn_f5/w640-h480/8707B9A0-9DC3-48FB-A294-CDACB6996C74.jpeg" width="640">
          </a>
          <figcaption><span style="font-size: x-small;"><span style="font-family: arial;">“How we Touch One Another” Laser Cut Sculptural Book A4, September 2020</span><br></span></figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop an empty link beside a bare image', async () => {
      const value = html`
        <table cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <br>
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhYofzCgv_aJptrlrVrl6fYrTtVzv7VIpVp-PnX1fQ9-UXkTSYMN39AWimF5Peo3kwUphaJIFkViyA1W9ecap55hbn37K90cC_QwBcijkutn1y-tXVGiPkO2P5Iec4IeEuyq_KlfzFBCq4/s1600/Badger_painted_tinted+_wall.jpg" imageanchor="1" style="clear: right; float: right; margin-bottom: 1em; margin-left: 1em;"></a>
                <img border="0" height="320" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhYofzCgv_aJptrlrVrl6fYrTtVzv7VIpVp-PnX1fQ9-UXkTSYMN39AWimF5Peo3kwUphaJIFkViyA1W9ecap55hbn37K90cC_QwBcijkutn1y-tXVGiPkO2P5Iec4IeEuyq_KlfzFBCq4/s320/Badger_painted_tinted+_wall.jpg" width="244">
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">
                <div>Badger Sketch finished illustration</div>
                <div><br></div>
                <div style="text-align: left;"><br></div>
              </td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <img border="0" height="320" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhYofzCgv_aJptrlrVrl6fYrTtVzv7VIpVp-PnX1fQ9-UXkTSYMN39AWimF5Peo3kwUphaJIFkViyA1W9ecap55hbn37K90cC_QwBcijkutn1y-tXVGiPkO2P5Iec4IeEuyq_KlfzFBCq4/s320/Badger_painted_tinted+_wall.jpg" width="244">
          <figcaption>
            <div>Badger Sketch finished illustration</div>
            <div><br></div>
            <div style="text-align: left;"><br></div>
          </figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop a div holding only a line break', async () => {
      const value = html`
        <table cellpadding="0" cellspacing="0" class="tr-caption-container" style="clear: right; cssfloat: right; float: right; margin-bottom: 1em; text-align: right;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <div style="border-bottom: medium none; border-left: medium none; border-right: medium none; border-top: medium none; text-align: center;"><br></div>
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj0qPuhxcmtU444rhpGVXdMD2N0FISO0YeRqrCcvidBepXimsB2ZqrHDRbJSLa_CmqfPu-yxePbhXiJEQJ_Ew1SNvcTzudNGfd-OhzlxZ8zZYSNHkijTaFL32ER0hcFn5j3MwazF1OEpoj6/s1600/Ruth+letter+inside.JPG" imageanchor="1" style="clear: right; cssfloat: right; margin-bottom: 1em; margin-left: auto; margin-right: auto;">
                  <img border="0" height="320" sca="true" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj0qPuhxcmtU444rhpGVXdMD2N0FISO0YeRqrCcvidBepXimsB2ZqrHDRbJSLa_CmqfPu-yxePbhXiJEQJ_Ew1SNvcTzudNGfd-OhzlxZ8zZYSNHkijTaFL32ER0hcFn5j3MwazF1OEpoj6/s320/Ruth+letter+inside.JPG" width="240">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;"></td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj0qPuhxcmtU444rhpGVXdMD2N0FISO0YeRqrCcvidBepXimsB2ZqrHDRbJSLa_CmqfPu-yxePbhXiJEQJ_Ew1SNvcTzudNGfd-OhzlxZ8zZYSNHkijTaFL32ER0hcFn5j3MwazF1OEpoj6/s1600/Ruth+letter+inside.JPG" imageanchor="1" style="clear: right; cssfloat: right; margin-bottom: 1em; margin-left: auto; margin-right: auto;">
          <img border="0" height="320" sca="true" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj0qPuhxcmtU444rhpGVXdMD2N0FISO0YeRqrCcvidBepXimsB2ZqrHDRbJSLa_CmqfPu-yxePbhXiJEQJ_Ew1SNvcTzudNGfd-OhzlxZ8zZYSNHkijTaFL32ER0hcFn5j3MwazF1OEpoj6/s320/Ruth+letter+inside.JPG" width="240">
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop a div holding a line break in a span', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <div class="separator" style="clear: both;"><span style="font-family: georgia, serif;"><br></span></div>
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjnhH3nCn043pzCCAGCUpRklP7nEPCJw023fXcir6yj_yYwAByVBOFaL-RA_qaSnF5Yag3FKeO9SmwKEyNpNPqjBPa5zYEYwHThZs7G3KRe-Q1n6S2oQfWWNzTROLI0FQCy0tdk3kZYSQmb/s1600/IMG_1726.jpg" style="margin-left: auto; margin-right: auto;">
                  <span style="font-family: georgia, serif;">
                    <img border="0" data-original-height="1200" data-original-width="1600" height="480" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjnhH3nCn043pzCCAGCUpRklP7nEPCJw023fXcir6yj_yYwAByVBOFaL-RA_qaSnF5Yag3FKeO9SmwKEyNpNPqjBPa5zYEYwHThZs7G3KRe-Q1n6S2oQfWWNzTROLI0FQCy0tdk3kZYSQmb/s640/IMG_1726.jpg" width="640">
                  </span>
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="font-size: 12.8px;"><span style="font-family: georgia, serif; font-size: small;">The villagers playing croquet.</span><br></td>
            </tr>
          </tbody>
        </table>
      `
      const expected = html`
        <figure>
          <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjnhH3nCn043pzCCAGCUpRklP7nEPCJw023fXcir6yj_yYwAByVBOFaL-RA_qaSnF5Yag3FKeO9SmwKEyNpNPqjBPa5zYEYwHThZs7G3KRe-Q1n6S2oQfWWNzTROLI0FQCy0tdk3kZYSQmb/s1600/IMG_1726.jpg" style="margin-left: auto; margin-right: auto;">
            <span style="font-family: georgia, serif;">
              <img border="0" data-original-height="1200" data-original-width="1600" height="480" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjnhH3nCn043pzCCAGCUpRklP7nEPCJw023fXcir6yj_yYwAByVBOFaL-RA_qaSnF5Yag3FKeO9SmwKEyNpNPqjBPa5zYEYwHThZs7G3KRe-Q1n6S2oQfWWNzTROLI0FQCy0tdk3kZYSQmb/s640/IMG_1726.jpg" width="640">
            </span>
          </a>
          <figcaption><span style="font-family: georgia, serif; font-size: small;">The villagers playing croquet.</span><br></figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('tables left as written', () => {
    it('should leave a table whose image cell holds the read-more marker', async () => {
      const value = html`
        <table cellpadding="0" cellspacing="0" class="tr-caption-container" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em; text-align: left;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEihola_tnXiztHfVb76IN1masLfMnB7RG090atTwBRTXAkXl7zH4NxDO1KizuN3n5hJxTvgJTCaazirxskE6goHd4f8Gw3yO0-a43JzxC0hlt8e0PHiosq4x8GINHoGnAVxDVHIjsLbeXQ/s1600/IMG_8307.JPG" imageanchor="1" style="clear: left; margin-bottom: 1em; margin-left: auto; margin-right: auto;"></a>
                <br>
                <a name="more"></a>
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEihola_tnXiztHfVb76IN1masLfMnB7RG090atTwBRTXAkXl7zH4NxDO1KizuN3n5hJxTvgJTCaazirxskE6goHd4f8Gw3yO0-a43JzxC0hlt8e0PHiosq4x8GINHoGnAVxDVHIjsLbeXQ/s1600/IMG_8307.JPG" imageanchor="1" style="clear: left; margin-bottom: 1em; margin-left: auto; margin-right: auto;">
                  <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEihola_tnXiztHfVb76IN1masLfMnB7RG090atTwBRTXAkXl7zH4NxDO1KizuN3n5hJxTvgJTCaazirxskE6goHd4f8Gw3yO0-a43JzxC0hlt8e0PHiosq4x8GINHoGnAVxDVHIjsLbeXQ/s1600/IMG_8307.JPG" height="426" width="640">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Serhij Zhadan, Dichter aus Charkiw: "Die Ukraine durchlebt jetzt die dramatischsten Zeiten in ihrer Geschichte." Interview miz Zhadan (auf Russisch): https://example.com/p/1BQ51</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: the read-more specimen above with its marker inside an empty div.
    it('should leave a table whose image cell holds the read-more marker in a div', async () => {
      const value = html`
        <table class="tr-caption-container">
          <tbody>
            <tr>
              <td>
                <div><a name="more"></a></div>
                <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEihola_tnXiztHfVb76IN1masLfMnB7RG090atTwBRTXAkXl7zH4NxDO1KizuN3n5hJxTvgJTCaazirxskE6goHd4f8Gw3yO0-a43JzxC0hlt8e0PHiosq4x8GINHoGnAVxDVHIjsLbeXQ/s1600/IMG_8307.JPG">
              </td>
            </tr>
            <tr>
              <td class="tr-caption">Serhij Zhadan, Dichter aus Charkiw</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: an empty element with an id is a jump target, as stripEmptyTags treats it.
    it('should leave a table whose image cell holds an empty element with an id', async () => {
      const value = html`
        <table class="tr-caption-container">
          <tbody>
            <tr>
              <td>
                <span id="more"></span>
                <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEihola_tnXiztHfVb76IN1masLfMnB7RG090atTwBRTXAkXl7zH4NxDO1KizuN3n5hJxTvgJTCaazirxskE6goHd4f8Gw3yO0-a43JzxC0hlt8e0PHiosq4x8GINHoGnAVxDVHIjsLbeXQ/s1600/IMG_8307.JPG">
              </td>
            </tr>
            <tr>
              <td class="tr-caption">Serhij Zhadan, Dichter aus Charkiw</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: the sampled frames beside an image all sit in a wrapper div.
    it('should leave a table whose image cell holds a bare frame beside the image', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <iframe allowfullscreen="allowfullscreen" width="320" height="266" src="https://www.blogger.com/video.g?token=AD6v5dxaK-0dyVnYxCt3oGjoNO3WgoKrZrRNNSMVBAIKqL4sJ-vlSXAng8_-f_6u3fsWxDnDf5URw1eInCS8yiNfxg" class="b-hbp-video b-uploaded" frameborder="0"></iframe>
                <img border="0" height="640" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5nyQYABNgQGm8FO22aKrt2iYx50jnNOZDl3xdlk-5hdpRB34Oz4B-k808VisN-fMwKYKbbbpHxGuJOf6KUR6uVnZzYlVoAp4dyahAV6fQWYS9K0zeWYbNcWypdscaT6yXWojRlzz9Zirb/s640/IMG_2656+-+Copy.JPG" style="margin-left: auto; margin-right: auto;" width="480">
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">And a RICK *^* !</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table holding several captioned images', async () => {
      const value = html`
        <table cellpadding="0" cellspacing="0" class="tr-caption-container" style="float: right; text-align: right;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjUrotenMiGW6jRiAraiAe2k2ragCvRADLtCBsUMn_ZnYFOAzHfhL5Gz7FSd8Owq0JmXyzYUoJOo1I-_dZa2VfTJ_J3jsinCKXkRGCi4O3gxsDYnUbj2wbs1AtqKmDCY9gb6mAc/s1600/Fritz+follow+thru.jpg" style="clear: right; margin-bottom: 1em; margin-left: auto; margin-right: auto;">
                  <img border="0" height="125" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjUrotenMiGW6jRiAraiAe2k2ragCvRADLtCBsUMn_ZnYFOAzHfhL5Gz7FSd8Owq0JmXyzYUoJOo1I-_dZa2VfTJ_J3jsinCKXkRGCi4O3gxsDYnUbj2wbs1AtqKmDCY9gb6mAc/s200/Fritz+follow+thru.jpg" width="200">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Taylor Fritz</td>
            </tr>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhzMQ6jDozWDTC98uwOs0p8hXGM8Nz54BEBMGURNvLR5SGAoLqAHjY5r5IQkyQpRKD_S7gvQ51aapd7IpWiV1EC6DbvT7sNq3AHA5kReEvFvLsoTA5F4j5m6azCF1G4nTxTmXIp/s1600/Denis+Kudla+%25282%2529.JPG" style="margin-left: auto; margin-right: auto;">
                  <img border="0" height="132" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhzMQ6jDozWDTC98uwOs0p8hXGM8Nz54BEBMGURNvLR5SGAoLqAHjY5r5IQkyQpRKD_S7gvQ51aapd7IpWiV1EC6DbvT7sNq3AHA5kReEvFvLsoTA5F4j5m6azCF1G4nTxTmXIp/s200/Denis+Kudla+%25282%2529.JPG" width="200">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Denis Kudla</td>
            </tr>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5zTqpIpHHfiQBFpNZU0HsJWwzU2VoUP33rVk1xo3JTb2C0uSiI0cph27pQtTW17vN2jOu_U5qBzv34B_5Ag3BamtsBAm0ELdaD0L7efnd9iQ1VbGTV1rr-AEf2n_ejx1tb49x/s1600/Mannarino+BH.jpg" style="margin-left: auto; margin-right: auto;">
                  <img border="0" height="200" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5zTqpIpHHfiQBFpNZU0HsJWwzU2VoUP33rVk1xo3JTb2C0uSiI0cph27pQtTW17vN2jOu_U5qBzv34B_5Ag3BamtsBAm0ELdaD0L7efnd9iQ1VbGTV1rr-AEf2n_ejx1tb49x/s200/Mannarino+BH.jpg" width="184">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Adrian Mannarino</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table with no caption row', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: 1em; margin-right: 1em;">
          <tbody>
            <tr>
              <td>
                <span style="margin-left: auto; margin-right: auto;">
                  <a href="https://example.com/blog/start_each_day/" target="_blank">
                    <img border="0" data-original-height="155" data-original-width="288" height="106" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiXBg6ta-ijH5DvIElgjfH1OtE9u3R8V0yAPEKYqxudtOT9VWWSyaeEIvIML2eBDY-KSQI5lIhouBRviaibs5j8rwvgMCn6S_-eHZICbPg2Ba5IECZuKMh5ygmEsT5P4oPc_r8_jfbWylg/s200/download.png" width="200">
                  </a>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose second row holds no caption cell', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhzJxxEG4iPtyRmHWM9X66ROhrcUTfFIU4ajj3kRoihRkxcvLXJP2KBVJvUtl6G-aPSzeYs5MrXIg6LeLqray6epVLM9x4cKS43nV8fvuhhMNOGQudTjRsdLV9AdtBkui6Mykdqf0tOLGuMWiW_rpTKlFENn-PKcO1dfW9gk_um55pcDse-gCmZwDNnQY4M/s1440/1.jpg" style="margin-left: auto; margin-right: auto;">
                  <img border="0" data-original-height="1440" data-original-width="1417" height="640" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhzJxxEG4iPtyRmHWM9X66ROhrcUTfFIU4ajj3kRoihRkxcvLXJP2KBVJvUtl6G-aPSzeYs5MrXIg6LeLqray6epVLM9x4cKS43nV8fvuhhMNOGQudTjRsdLV9AdtBkui6Mykdqf0tOLGuMWiW_rpTKlFENn-PKcO1dfW9gk_um55pcDse-gCmZwDNnQY4M/w630-h640/1.jpg" width="630">
                </a>
              </td>
            </tr>
            <tr></tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose image row holds a second cell', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="http://4.bp.blogspot.com/-tj_iTOIAFfY/U_TIdIH_r3I/AAAAAAAAAy8/fJy79iLp92M/s1600/ceremony25.JPG" imageanchor="1" style="margin-left: auto; margin-right: auto;">
                  <img border="0" src="http://4.bp.blogspot.com/-tj_iTOIAFfY/U_TIdIH_r3I/AAAAAAAAAy8/fJy79iLp92M/s1600/ceremony25.JPG" height="320" width="234">&nbsp;
                </a>
              </td>
              <td style="text-align: center;">&nbsp;</td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;"> </td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose image row holds no image', async () => {
      const value = html`
        <table cellpadding="0" cellspacing="0" class="tr-caption-container" style="float: left; margin-right: 1em; text-align: left;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgX99m3WzXGM3EHtCcgqZyzz0LPVHPUP_vR0b0Bj3RM2Jn2F_ty57k7CKI8RGgFfDe3XFpqRyRVqs7GgCNICNIT_4-0UKiGAg6QWwl1Dn3d-NPQYaffkGfeMHxHPOt7_Mia5G6brqDa1WKL/s1600/Farm+%2526+Haustiere+010.JPG" imageanchor="1" style="clear: left; margin-bottom: 1em; margin-left: auto; margin-right: auto;"><br></a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;"></td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose image cell holds two images', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbAdKr3AmNm8CprGGrU_IqihyAYO0pcpGutuBMOVj5fahiU5z3z4WUrNihPMsSHG_5fB7ikcpAtQTJZvAr2eNFheQVgEW3nhduI12WoYOEFdPFiZTHvqCAIUIUW38ptkhS0Leugw/s1600/Screen+Shot+2015-12-25+at+2.04.26+PM.png" imageanchor="1" style="clear: right; float: right; margin-bottom: 1em; margin-left: 1em;">
                  <img border="0" height="313" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbAdKr3AmNm8CprGGrU_IqihyAYO0pcpGutuBMOVj5fahiU5z3z4WUrNihPMsSHG_5fB7ikcpAtQTJZvAr2eNFheQVgEW3nhduI12WoYOEFdPFiZTHvqCAIUIUW38ptkhS0Leugw/s320/Screen+Shot+2015-12-25+at+2.04.26+PM.png" width="320">
                </a>
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiRJxsfD06dnZf2-0SQGwfVGY5eO1emM-QNkE61jcfUaFMCBkHok__ijjkRyCqJFeKz9CIWAAt-TRfKhGdJhSIveK2e8aozwDsk5z5z-r151556wgIvhLRPX0olPiE1PvPU4rx_rA/s1600/Screen+Shot+2015-12-25+at+2.04.00+PM.png" imageanchor="1" style="margin-left: auto; margin-right: auto;">
                  <img border="0" height="200" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiRJxsfD06dnZf2-0SQGwfVGY5eO1emM-QNkE61jcfUaFMCBkHok__ijjkRyCqJFeKz9CIWAAt-TRfKhGdJhSIveK2e8aozwDsk5z5z-r151556wgIvhLRPX0olPiE1PvPU4rx_rA/s320/Screen+Shot+2015-12-25+at+2.04.00+PM.png" width="320">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">בוזי הרצוג</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose image cell holds text beside the image', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg0Xf2VzpORokjeUUzh7bIGMSsH3aIM3g81zKAbZ4GI0nJAIxErtoKBkzeiPTNbMN35DSHKHqArqOhHhzkImVrXpUkDSRjwlO-lgIuJ81tDNfhyR3SurCBUSUVuNgGuJWbJgswNmm1aqh8/s1600/blog-9152.jpg" style="margin-left: auto; margin-right: auto;">'
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">The ''P'' is for ''Princess'' for sure XP</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose image cell holds a frame beside the image', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <div class="separator" style="clear: both; text-align: center;">
                  <iframe allowfullscreen="allowfullscreen" width="320" height="266" src="https://www.blogger.com/video.g?token=AD6v5dxaK-0dyVnYxCt3oGjoNO3WgoKrZrRNNSMVBAIKqL4sJ-vlSXAng8_-f_6u3fsWxDnDf5URw1eInCS8yiNfxg" class="b-hbp-video b-uploaded" frameborder="0"></iframe>
                </div>
                <img border="0" height="640" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5nyQYABNgQGm8FO22aKrt2iYx50jnNOZDl3xdlk-5hdpRB34Oz4B-k808VisN-fMwKYKbbbpHxGuJOf6KUR6uVnZzYlVoAp4dyahAV6fQWYS9K0zeWYbNcWypdscaT6yXWojRlzz9Zirb/s640/IMG_2656+-+Copy.JPG" style="margin-left: auto; margin-right: auto;" width="480">
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">And a RICK *^* !</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose image sits inside a heading with text', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <h2 style="text-align: left;">
                  A Kansas Country Garden
                  <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjfHvL2K6NMcbFYZG4MaVfa1R-u-6KPcBRhypfw3I4iPBI6mEbbQodp2VTeCzL30gnlSVbmnPNZvSjgy8rq-KNxs7MwrFdzXynXYQRCvWRsxnR3-4cxexeGleDXyNgoZbunKWkbyabTVPY/s1600/IMG_8629.JPG" imageanchor="1" style="margin-left: auto; margin-right: auto;">
                    <img border="0" data-original-height="1200" data-original-width="1600" height="480" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjfHvL2K6NMcbFYZG4MaVfa1R-u-6KPcBRhypfw3I4iPBI6mEbbQodp2VTeCzL30gnlSVbmnPNZvSjgy8rq-KNxs7MwrFdzXynXYQRCvWRsxnR3-4cxexeGleDXyNgoZbunKWkbyabTVPY/s640/IMG_8629.JPG" width="640">
                  </a>
                </h2>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">This brilliant red day lily has been exceptionally floriferous this year.</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: the one sampled table with an image in a further caption cell has none above.
    it('should leave a table whose further caption cell holds an image', async () => {
      const value = html`
        <table cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: left;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgxnoy8y9ArUI3SykY2cJRc1AI1FkMa-Kj3_MAlgtsD67j92iQlgFfVBx_p1hsyA7mdIIt-WjVavc8g9us_U9989nq_X7kZidEWAt3Ut6Ssew3mFEE3dQlCw4gXafjxqVRQGDbTTcqBRcQ/s1600/blog-3569.jpg">
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;"><span style="font-size: small;"><b>e</b></span></td>
              <td class="tr-caption" style="text-align: center;"><br><img src="https://example.org/4123/4876902265_7883d582c4_b.jpg"></td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose caption holds a frame', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiaxX-P3ol4Oqcj_QYufxSu0tUjVv8Yvjx4RJ2qkYXPI_HZrnk1F1K7lvO6kcE5xv4xksjYKNT5_AbXtpKi71bhvoMDQ6ChLiDSFqQZXFa3P9eqeQnseanp2isCj6EcBVWf73dxwzR6gCdj/s1600/Ultimate+Revenge+2.jpg" imageanchor="1" style="margin-left: auto; margin-right: auto;">
                  <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiaxX-P3ol4Oqcj_QYufxSu0tUjVv8Yvjx4RJ2qkYXPI_HZrnk1F1K7lvO6kcE5xv4xksjYKNT5_AbXtpKi71bhvoMDQ6ChLiDSFqQZXFa3P9eqeQnseanp2isCj6EcBVWf73dxwzR6gCdj/s1600/Ultimate+Revenge+2.jpg" height="305" width="320">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">
                <i>Ultimate Revenge 2</i> in all its analog glory, on VHS and Cassette.
                <div class="separator" style="clear: both; text-align: center;">
                  <iframe allowfullscreen="allowfullscreen" width="320" height="266" src="https://www.youtube.com/embed/H1GFtXKTWNY?feature=player_embedded" frameborder="0"></iframe>
                </div>
                "Forgotten Past" from the Ultimate Revenge 2
              </td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose caption holds another caption table', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <span style="margin-left: auto; margin-right: auto;">
                  <a href="https://example.net/img/corduene_39ju6f.png">
                    <img border="0" height="633" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_4qsOT9aRXisfK0kTH2Gn9ezirFSy-VmQz48eROJqANMzudJj5rsMajETbGC4WMUaZRgqxoHIY0JeAhwFsY-jC563iVG94lqh1TJZ14sYU4C6rE8Ko46aEKBJMQA-dYDEhxy0lmBBaGqE/s1600/Corduene_3.png" width="640">
                  </a>
                </span>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">
                <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
                  <tbody>
                    <tr>
                      <td class="tr-caption" style="font-size: 13px;"><a href="https://example.net/img/corduene_39ju6f.png">Click image to expand</a></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a table whose caption runs on into a second cell', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="http://2.bp.blogspot.com/_K-wlnlFiE8I/S-LchZXR6FI/AAAAAAAAAsA/ssMm-72ESsY/s1600/Tabasco%20and%20Lake%20Charles%205%20May%20018.JPG" imageanchor="1" style="margin-left: auto; margin-right: auto;">
                  <img border="0" height="163" src="http://2.bp.blogspot.com/_K-wlnlFiE8I/S-LchZXR6FI/AAAAAAAAAsA/ssMm-72ESsY/s320/Tabasco%20and%20Lake%20Charles%205%20May%20018.JPG" width="320">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Grain store .... dotted everywhere they are huge ... like most things</td>
              <td class="tr-caption" style="text-align: center;">in the US</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a layout table without the caption class', async () => {
      const value = html`
        <table align="center" cellpadding="0" cellspacing="0" style="margin-left: auto; margin-right: auto; text-align: center;">
          <tbody>
            <tr>
              <td style="text-align: center;">
                <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" imageanchor="1" style="margin-left: auto; margin-right: auto;">
                  <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" height="426" width="640">
                </a>
              </td>
            </tr>
            <tr>
              <td class="tr-caption" style="text-align: center;">Cardigan Marlon Garçon García</td>
            </tr>
          </tbody>
        </table>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
        <tbody>
          <tr>
            <td style="text-align: center;">
              <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgxnoy8y9ArUI3SykY2cJRc1AI1FkMa-Kj3_MAlgtsD67j92iQlgFfVBx_p1hsyA7mdIIt-WjVavc8g9us_U9989nq_X7kZidEWAt3Ut6Ssew3mFEE3dQlCw4gXafjxqVRQGDbTTcqBRcQ/s1600/blog-3569.jpg">
            </td>
          </tr>
          <tr>
            <td class="tr-caption" style="text-align: center;">Bonus picture</td>
          </tr>
        </tbody>
      </table>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('convertBloggerCaptionTables in the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should hand the image passes a figure in place of a scrolling data table', async () => {
    const value = html`
      <table align="center" cellpadding="0" cellspacing="0" class="tr-caption-container" style="margin-left: auto; margin-right: auto; text-align: center;">
        <tbody>
          <tr>
            <td style="text-align: center;">
              <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" imageanchor="1" style="margin-left: auto; margin-right: auto;">
                <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" height="426" width="640">
              </a>
            </td>
          </tr>
          <tr>
            <td class="tr-caption" style="text-align: center;">Cardigan Marlon Garçon García</td>
          </tr>
        </tbody>
      </table>
    `
    const expected = html`
      <figure>
        <a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" imageanchor="1" style="margin-left: auto; margin-right: auto;">
          <img border="0" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2eQY2YS2siunbsaX3Y0p8GUhuFwk2QPukzzT3W2QH_ZXu66r1HuplTmmqX8lQf-4rt-Wy3hu6l1PAVrrAp3yiLeN8nGTfJF8xh9h56Q2MPrTFCk_Ntmip2YOaL88VhQGdUWGNQ8uBQkFM/s1600/SAM_0271.JPG" height="426" width="640">
        </a>
        <figcaption>Cardigan Marlon Garçon García</figcaption>
      </figure>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
