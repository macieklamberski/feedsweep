import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { linkifyPaypalDonateForms } from './linkifyPaypalDonateForms.js'

describeForEachParser('linkifyPaypalDonateForms', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [linkifyPaypalDonateForms(baseContext)])
  }
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  describe('happy paths', () => {
    it('should link a hosted donate button to the donate page', async () => {
      const value = html`
        <form
          action="https://www.paypal.com/cgi-bin/webscr"
          method="post"
          target="_top"
        >
          <input
            name="cmd"
            type="hidden"
            value="_s-xclick"
          >
          <input
            name="hosted_button_id"
            type="hidden"
            value="2BXZQLFUKNZ3Y"
          >
          <input
            name="submit"
            type="image"
            src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
            alt="Donate with PayPal button"
          >
          <img
            src="https://www.paypal.com/en_US/i/scr/pixel.gif"
            alt=""
            width="1"
            height="1"
          >
        </form>
      `
      const expected = html`
        <a href="https://www.paypal.com/donate/?hosted_button_id=2BXZQLFUKNZ3Y">
          <img
            src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
            alt="Donate with PayPal button"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should link a button the publisher drew themselves', async () => {
      const value = html`
        <form action="https://www.paypal.com/cgi-bin/webscr">
          <input
            name="hosted_button_id"
            type="hidden"
            value="F46QGYK6JYN5E"
          >
          <input
            type="image"
            src="https://example.com/wp-content/uploads/donate-with-paypal.jpg"
          >
        </form>
      `
      const expected = html`
        <a href="https://www.paypal.com/donate/?hosted_button_id=F46QGYK6JYN5E">
          <img src="https://example.com/wp-content/uploads/donate-with-paypal.jpg">
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should link a form posting to the donate page whatever its button says', async () => {
      const value = html`
        <form action="https://www.paypal.com/donate">
          <input
            name="hosted_button_id"
            type="hidden"
            value="2BXZQLFUKNZ3Y"
          >
          <input
            type="image"
            src="https://example.com/support-us.png"
            alt="Support us"
          >
        </form>
      `
      const expected = html`
        <a href="https://www.paypal.com/donate/?hosted_button_id=2BXZQLFUKNZ3Y">
          <img
            src="https://example.com/support-us.png"
            alt="Support us"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a buy now button, which the donate page cannot open', async () => {
      const value = html`
        <form action="https://www.paypal.com/cgi-bin/webscr">
          <input
            name="hosted_button_id"
            type="hidden"
            value="MZL77SBP55PX8"
          >
          <input
            type="image"
            src="https://www.paypalobjects.com/fr_FR/i/btn/btn_buynow_SM.gif"
            alt="Acheter"
          >
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a donate form the feed stripped of its hidden inputs', async () => {
      const value = html`
        <form action="https://www.paypal.com/cgi-bin/webscr">
          <input
            type="image"
            src="https://www.paypal.com/en_US/i/btn/btn_donateCC_LG.gif"
            alt="Donate"
          >
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a donate form with no button image', async () => {
      const value = html`
        <form action="https://www.paypal.com/donate">
          <input
            name="hosted_button_id"
            type="hidden"
            value="2BXZQLFUKNZ3Y"
          >
          <input
            type="submit"
            value="Donate"
          >
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a foreign host carrying the same path', async () => {
      const value = html`
        <form action="https://evil.test/www.paypal.com/cgi-bin/webscr">
          <input
            name="hosted_button_id"
            type="hidden"
            value="2BXZQLFUKNZ3Y"
          >
          <input
            type="image"
            src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
          >
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should encode a button id carrying a query separator', async () => {
      const value = html`
        <form action="https://www.paypal.com/donate">
          <input
            name="hosted_button_id"
            type="hidden"
            value="2BXZQLFUKNZ3Y&business=evil@example.com"
          >
          <input
            type="image"
            src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif"
          >
        </form>
      `
      const expected = html`
        <a href="https://www.paypal.com/donate/?hosted_button_id=2BXZQLFUKNZ3Y%26business%3Devil%40example.com">
          <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif">
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the pipeline the button reaches a reader through', () => {
    it('should keep the linked button and drop the tracking pixel', async () => {
      const value = html`
        <form
          action="https://www.paypal.com/cgi-bin/webscr"
          method="post"
        >
          <input
            type="hidden"
            name="cmd"
            value="_s-xclick"
          >
          <input
            type="hidden"
            name="hosted_button_id"
            value="1564769"
          >
          <input
            type="image"
            src="https://www.paypal.com/en_US/i/btn/btn_donate_SM.gif"
            name="submit"
            alt=""
          >
          <img
            alt=""
            src="https://www.paypal.com/en_US/i/scr/pixel.gif"
            width="1"
            height="1"
          >
        </form>
      `
      const expected = html`
        <a href="https://www.paypal.com/donate/?hosted_button_id=1564769">
          <img src="https://www.paypal.com/en_US/i/btn/btn_donate_SM.gif">
        </a>
      `

      expect(await convert(value)).toEqualHtml(expected)
    })

    it('should strip a buy now form', async () => {
      const value = html`
        <p>Our album is out.</p>
        <form action="https://www.paypal.com/cgi-bin/webscr">
          <input
            name="hosted_button_id"
            type="hidden"
            value="MZL77SBP55PX8"
          >
          <input
            type="image"
            src="https://www.paypalobjects.com/fr_FR/i/btn/btn_buynow_SM.gif"
          >
        </form>
      `
      const expected = '<p>Our album is out.</p>'

      expect(await convert(value)).toEqualHtml(expected)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <form action="https://www.paypal.com/cgi-bin/webscr">
        <input
          name="hosted_button_id"
          type="hidden"
          value="2BXZQLFUKNZ3Y"
        >
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
        >
      </form>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
