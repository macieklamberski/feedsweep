import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedRenderHint, EmbedResolverResult } from '../types.js'
import { iframeResizerHeightRequest, readIframeResizerHeight } from '../utils/hints.js'
import { tickettailorRenderHint, tickettailorScriptEmbedResolver } from './tickettailor.js'

describeForEachParser('tickettailorScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tickettailorScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the box widget and drop its display settings', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/all-tickets/rivalthereimaginingvalueactionlab/?ref=website_widget&#038;show_search_filter=true&#038;show_date_filter=true&#038;show_sort=true"
            data-type="inline"
            data-inline-minimal="true"
            data-inline-show-logo="false"
            data-inline-bg-fill="false"
            data-inline-inherit-ref-from-url-param=""
            data-inline-ref="website_widget"
          ></script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tickettailor',
        id: 'rivalthereimaginingvalueactionlab',
        src: 'https://www.tickettailor.com/all-tickets/rivalthereimaginingvalueactionlab/?widget=true',
        url: 'https://www.tickettailor.com/all-tickets/rivalthereimaginingvalueactionlab/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the widget of one event', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/events/aneti/2443115/select-date?ref=website_widget&#038;show_event_filter=false"
            data-type="inline"
            data-inline-minimal="true"
          ></script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tickettailor',
        id: 'aneti/2443115',
        src: 'https://www.tickettailor.com/events/aneti/2443115/select-date?widget=true',
        url: 'https://www.tickettailor.com/events/aneti/2443115/select-date',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the checkout widget with no page url, since it needs its checksum', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/checkout/new-session/id/8625469/chk/410ded8446b6a1390609c46a1bbf7462/?ref=website_widget&#038;show_event_filter=false"
            data-type="inline"
            data-inline-minimal="true"
          ></script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tickettailor',
        id: 'checkout/8625469',
        src: 'https://www.tickettailor.com/checkout/new-session/id/8625469/chk/410ded8446b6a1390609c46a1bbf7462/?widget=true',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the widget from the older loader on the Rackspace cdn', async () => {
      const value = html`
        <script
          src="https://dc161a0a89fedd6639c9-03787a0970cd749432e2a6d3b34c55df.ssl.cf3.rackcdn.com/tt-widget.js"
          data-url="https://www.tickettailor.com/events/witneyconservativesassociation/2143010/select-date"
          data-type="inline"
          data-inline-minimal="true"
          data-inline-show-logo="false"
          data-inline-bg-fill="true"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'tickettailor',
        id: 'witneyconservativesassociation/2143010',
        src: 'https://www.tickettailor.com/events/witneyconservativesassociation/2143010/select-date?widget=true',
        url: 'https://www.tickettailor.com/events/witneyconservativesassociation/2143010/select-date',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the widget of a loader inside the snippet div with no inline type', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/all-tickets/aneti/"
          ></script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tickettailor',
        id: 'aneti',
        src: 'https://www.tickettailor.com/all-tickets/aneti/?widget=true',
        url: 'https://www.tickettailor.com/all-tickets/aneti/',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a loader that is neither inline nor inside the snippet div', async () => {
      const value = html`
        <script
          src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
          data-url="https://www.tickettailor.com/all-tickets/aneti/"
          data-type="popup"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the current loader marked inline only by data-type, which it does not read', async () => {
      const value = html`
        <script
          src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
          data-url="https://www.tickettailor.com/all-tickets/rivalthereimaginingvalueactionlab/?ref=website_widget"
          data-type="inline"
          data-inline-minimal="true"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the current loader wrapped in a paragraph inside the snippet div', async () => {
      const value = html`
        <div class="tt-widget">
          <div class="tt-widget-fallback">
            <p>
              <a href="https://www.tickettailor.com/all-tickets/taddingtonbramwellinstitute/?ref=website_widget">Click here to buy tickets</a>
            </p>
          </div>
          <p>
            <script
              src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
              data-url="https://www.tickettailor.com/all-tickets/taddingtonbramwellinstitute/?ref=website_widget"
              data-type="inline"
              data-inline-minimal="true"
            ></script>
          </p>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the current loader in a div with another class beside tt-widget', async () => {
      const value = html`
        <div class="tt-widget tt-widget-wide">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/all-tickets/aneti/"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the older loader inside the snippet div with no inline type', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://dc161a0a89fedd6639c9-03787a0970cd749432e2a6d3b34c55df.ssl.cf3.rackcdn.com/tt-widget.js"
            data-url="https://www.tickettailor.com/events/witneyconservativesassociation/2143010/select-date"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a page on a foreign host', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://evil.test/all-tickets/aneti/"
            data-type="inline"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route that is not a box, an event or a checkout', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/notaroute/aneti/"
            data-type="inline"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the box route with no box', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/all-tickets/"
            data-type="inline"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an event route with no event', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/events/aneti/"
            data-type="inline"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a checkout with no checksum', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/checkout/new-session/id/8625469/chk/"
            data-type="inline"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a checkout route other than a new session', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/checkout/view-cart/id/8625469/chk/410ded84"
            data-type="inline"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a checkout that names no event id', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/checkout/new-session/key/8625469/chk/410ded84"
            data-type="inline"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a checkout that names no checksum', async () => {
      const value = html`
        <div class="tt-widget">
          <script
            src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
            data-url="https://www.tickettailor.com/checkout/new-session/id/8625469/sum/410ded84"
            data-type="inline"
          ></script>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('the fallback the Ticket Tailor snippet carries', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should remove the fallback that links to the same page', async () => {
    const value = html`
      <div class="tt-widget">
        <div class="tt-widget-fallback">
          <p>
            <a href="https://www.tickettailor.com/all-tickets/aneti/?ref=website_widget">Click here to buy tickets</a>
          </p>
        </div>
        <script
          src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
          data-url="https://www.tickettailor.com/all-tickets/aneti/"
          data-type="inline"
        ></script>
      </div>
    `
    const expected =
      '<div data-embed-url="https://www.tickettailor.com/all-tickets/aneti/" data-embed-id="aneti" data-embed-provider="tickettailor" data-embed-src="https://www.tickettailor.com/all-tickets/aneti/?widget=true"></div>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep the fallback of a widget that does not resolve', async () => {
    const value = html`
      <div class="tt-widget">
        <div class="tt-widget-fallback">
          <p>
            <a href="https://www.tickettailor.com/notaroute/aneti/">Click here to buy tickets</a>
          </p>
        </div>
        <script
          src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
          data-url="https://www.tickettailor.com/notaroute/aneti/"
          data-type="inline"
        ></script>
      </div>
    `
    const expected =
      '<p><a href="https://www.tickettailor.com/notaroute/aneti/">Click here to buy tickets</a></p>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a fallback that links to another page', async () => {
    const value = html`
      <div class="tt-widget">
        <div class="tt-widget-fallback">
          <p>
            <a href="https://www.tickettailor.com/all-tickets/otherbox/">Click here to buy tickets</a>
          </p>
        </div>
        <script
          src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
          data-url="https://www.tickettailor.com/all-tickets/aneti/"
          data-type="inline"
        ></script>
      </div>
    `
    const expected =
      '<p><a href="https://www.tickettailor.com/all-tickets/otherbox/">Click here to buy tickets</a></p><div data-embed-url="https://www.tickettailor.com/all-tickets/aneti/" data-embed-id="aneti" data-embed-provider="tickettailor" data-embed-src="https://www.tickettailor.com/all-tickets/aneti/?widget=true"></div>'

    expect(await convert(value)).toEqualHtml(expected)
  })
})

describe('tickettailorRenderHint', () => {
  it('should start iframe-resizer and read the height the widget answers with', () => {
    const expected: EmbedRenderHint = {
      provider: 'tickettailor',
      origin: 'https://www.tickettailor.com',
      requestHeight: iframeResizerHeightRequest,
      readHeight: readIframeResizerHeight,
    }

    expect(tickettailorRenderHint).toEqual(expected)
  })
})

describeForEachParser('tickettailor through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should turn the current loader in the snippet div into a ticket placeholder', async () => {
    const value = html`
      <div class="tt-widget">
        <div class="tt-widget-fallback">
          <p>
            <a href="https://www.tickettailor.com/all-tickets/rivalthereimaginingvalueactionlab/?ref=website_widget&#038;show_search_filter=true&#038;show_date_filter=true&#038;show_sort=true">Click here to buy tickets</a>
          </p>
        </div>
        <script
          src="https://cdn.tickettailor.com/js/widgets/min/widget.js"
          data-url="https://www.tickettailor.com/all-tickets/rivalthereimaginingvalueactionlab/?ref=website_widget&#038;show_search_filter=true&#038;show_date_filter=true&#038;show_sort=true"
          data-type="inline"
          data-inline-minimal="true"
        ></script>
      </div>
    `
    const expected = html`
      <div
        data-embed-url="https://www.tickettailor.com/all-tickets/rivalthereimaginingvalueactionlab/"
        data-embed-id="rivalthereimaginingvalueactionlab"
        data-embed-provider="tickettailor"
        data-embed-src="https://www.tickettailor.com/all-tickets/rivalthereimaginingvalueactionlab/?widget=true"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn the older loader marked inline into a ticket placeholder', async () => {
    const value = html`
      <script
        src="https://dc161a0a89fedd6639c9-03787a0970cd749432e2a6d3b34c55df.ssl.cf3.rackcdn.com/tt-widget.js"
        data-url="https://www.tickettailor.com/events/witneyconservativesassociation/2143010/select-date"
        data-type="inline"
        data-inline-minimal="true"
        data-inline-show-logo="false"
        data-inline-bg-fill="true"
      ></script>
    `
    const expected = html`
      <div
        data-embed-url="https://www.tickettailor.com/events/witneyconservativesassociation/2143010/select-date"
        data-embed-id="witneyconservativesassociation/2143010"
        data-embed-provider="tickettailor"
        data-embed-src="https://www.tickettailor.com/events/witneyconservativesassociation/2143010/select-date?widget=true"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
