import { expect, it } from 'bun:test'
import { isPresent } from 'trousse'
import { describeForEachParser } from '../tests.js'
import { defaultDeferredIframeSources, defaultMediaSrcAttributes } from './attributes.js'

const attributeNameRegex = /^[a-z][a-z0-9_-]*$/
const scopedAttributes = [...defaultMediaSrcAttributes, ...defaultDeferredIframeSources]
const attributes = scopedAttributes.map((entry) => entry.attribute)
const selectors = scopedAttributes.map((entry) => entry.selector).filter(isPresent)

describeForEachParser('scoped attribute defaults', (parseHtml) => {
  it.each(attributes)('should name a valid attribute in %s', (attribute) => {
    expect(attributeNameRegex.test(attribute)).toBe(true)
  })

  it.each(selectors)('should parse the selector %s', (selector) => {
    const document = parseHtml('')
    const throwing = () => document.querySelector(selector)

    expect(throwing).not.toThrow()
  })
})
