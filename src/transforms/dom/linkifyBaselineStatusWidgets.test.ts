import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { linkifyBaselineStatusWidgets } from './linkifyBaselineStatusWidgets.js'

describeForEachParser('linkifyBaselineStatusWidgets', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [linkifyBaselineStatusWidgets(baseContext)])
  }

  describe('happy paths', () => {
    it('should link the widget to its feature page', async () => {
      const value = '<baseline-status featureid="custom-properties"></baseline-status>'
      const expected =
        '<a href="https://webstatus.dev/features/custom-properties">custom-properties</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read the id the widget takes as feature-id', async () => {
      const value = '<baseline-status feature-id="anchor-positioning"></baseline-status>'
      const expected =
        '<a href="https://webstatus.dev/features/anchor-positioning">anchor-positioning</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the link through the default pipeline', async () => {
      const value = html`
        <p>Native accordions are widely available.</p>
        <baseline-status featureid="details"></baseline-status>
      `
      const expected = html`
        <p>Native accordions are widely available.</p>
        <p><a href="https://webstatus.dev/features/details">details</a></p>
      `

      expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a widget naming no feature', async () => {
      const value = '<baseline-status></baseline-status>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should keep a feature id holding a slash inside one path segment', async () => {
      const value = '<baseline-status featureid="../details"></baseline-status>'
      const expected = '<a href="https://webstatus.dev/features/..%2Fdetails">../details</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = '<baseline-status featureid="nesting"></baseline-status>'
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})
