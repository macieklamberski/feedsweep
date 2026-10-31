import { expect, it } from 'bun:test'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { cleanAnchorUrls } from './cleanAnchorUrls.js'

const stripQueryFn = (url: string) => {
  const cleanedUrls: Record<string, string> = {
    'https://example.com/a?utm_source=feed': 'https://example.com/a',
    'https://example.com/b?utm_medium=email': 'https://example.com/b',
    'https://example.com/page?utm_source=feed': 'https://example.com/page',
  }

  return cleanedUrls[url] ?? url
}

describeForEachParser('cleanAnchorUrls', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [cleanAnchorUrls(context)])
  }

  it('should rewrite hrefs with the provided cleanUrlFn', async () => {
    const value = '<a href="https://example.com/page?utm_source=feed">link</a>'
    const context = {
      ...baseContext,
      cleanUrlFn: stripQueryFn,
    }
    const expected = '<a href="https://example.com/page">link</a>'

    expect(await transform(value, context)).toEqualHtml(expected)
  })

  it('should repair a query glued onto the path before the cleaner reads it', async () => {
    const value =
      '<a href="https://example.bandcamp.com/album/title&source=gmail&ust=1781964728672000">link</a>'
    const context = {
      ...baseContext,
      cleanUrlFn: (url: string) => url,
    }
    const expected =
      '<a href="https://example.bandcamp.com/album/title?source=gmail&amp;ust=1781964728672000">link</a>'

    expect(await transform(value, context)).toEqualHtml(expected)
  })

  it('should leave a broken href as written when there is no cleanUrlFn', async () => {
    const value = '<a href="https://example.bandcamp.com/album/title&source=gmail">link</a>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should clean every anchor in the document', async () => {
    const value = html`
      <a href="https://example.com/a?utm_source=feed">first</a>
      <a href="https://example.com/b?utm_medium=email">second</a>
    `
    const context = {
      ...baseContext,
      cleanUrlFn: stripQueryFn,
    }
    const expected = html`
      <a href="https://example.com/a">first</a>
      <a href="https://example.com/b">second</a>
    `

    expect(await transform(value, context)).toEqualHtml(expected)
  })

  it('should leave hrefs untouched when cleanUrlFn returns the same value', async () => {
    const value = '<a href="https://example.com/page">link</a>'
    const context = {
      ...baseContext,
      cleanUrlFn: stripQueryFn,
    }

    expect(await transform(value, context)).toEqualHtml(value)
  })

  it('should do nothing when cleanUrlFn is not provided', async () => {
    const value = '<a href="https://example.com/page?utm_source=feed">link</a>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should ignore anchors without hrefs', async () => {
    const value = '<a id="top">anchor</a>'
    const context = {
      ...baseContext,
      cleanUrlFn: stripQueryFn,
    }

    expect(await transform(value, context)).toEqualHtml(value)
  })

  it.todo('should surface errors when cleanUrlFn throws', () => {
    // cleanUrlFn throwing mid-document currently propagates out of the transform and rejects the
    // whole pipeline. Whether it should propagate or skip the offending anchor is an open design
    // question, so the contract is not pinned yet.
  })

  it('should be idempotent', async () => {
    const value = '<a href="https://example.com/page?utm_source=feed">link</a>'
    const context = {
      ...baseContext,
      cleanUrlFn: stripQueryFn,
    }
    const once = await transform(value, context)
    const twice = await transform(once, context)

    expect(twice).toEqualHtml(once)
  })
})
