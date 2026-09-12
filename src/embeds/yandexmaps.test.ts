import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { yandexMapsScriptEmbedResolver } from './yandexmaps.js'

describeForEachParser('yandexMapsScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, yandexMapsScriptEmbedResolver)

  describe('happy paths', () => {
    it('should rebuild the constructor script onto the map widget frame', async () => {
      const value = html`
        <script
          type="text/javascript"
          charset="utf-8"
          async
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&width=1280&height=720&lang=ru_RU&scroll=true"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:a3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&width=650&height=366',
        width: 1280,
        height: 720,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the static render for a protocol-relative sid script', async () => {
      const value = html`
        <script
          type="text/javascript"
          charset="utf-8"
          src="//api-maps.yandex.ru/services/constructor/1.0/js/?sid=Zk4mQp7vXr2LsN9aTbYc1WdEfGhJi3Uo&width=500&height=450"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'sid:Zk4mQp7vXr2LsN9aTbYc1WdEfGhJi3Uo',
        src: 'https://api-maps.yandex.ru/services/constructor/1.0/static/?sid=Zk4mQp7vXr2LsN9aTbYc1WdEfGhJi3Uo&width=500&height=450',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?sid=Zk4mQp7vXr2LsN9aTbYc1WdEfGhJi3Uo&width=500&height=450',
        width: 500,
        height: 450,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<script src="https://evil.test/api-maps.yandex.ru/services/constructor/1.0/js/?sid=Zk4mQp7vXr2LsN9aTbYc1WdEfGhJi3Uo&width=500&height=450"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a script naming no map', async () => {
      const value =
        '<script src="https://api-maps.yandex.ru/services/constructor/1.0/js/?width=500&height=450"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read a um value whose escape survived one round of decoding', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%253Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&width=600&height=450"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:a3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&width=600&height=450',
        width: 600,
        height: 450,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a um value whose colon arrived unescaped', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor:a3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&width=600&height=450"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:a3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&width=600&height=450',
        width: 600,
        height: 450,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // Neither id addresses the other's route: the static render 404s an id from the wrong space,
  // and the thumbnail a reader draws is where a wrong answer shows rather than hides.
  describe('the three id spaces the Constructor mints', () => {
    it('should refuse a sid-shaped value sitting in the um parameter', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3AZk4mQp7vXr2LsN9aTbYc1WdEfGhJi3Uo&width=600&height=450"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a short link sitting in the sid parameter', async () => {
      const value =
        '<script src="https://api-maps.yandex.ru/services/constructor/1.0/js/?sid=CVXW56JA&width=600&height=450"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  // The static render answers 400 without both dimensions, so the sid branch, whose whole result
  // is that image, has nothing to mint when the carrier states no size.
  describe('a carrier that states no size', () => {
    it('should leave the thumbnail off the constructor frame', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&width=600"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:a3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&source=constructor',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should refuse the sid carrier outright', async () => {
      const value =
        '<script src="https://api-maps.yandex.ru/services/constructor/1.0/js/?sid=Zk4mQp7vXr2LsN9aTbYc1WdEfGhJi3Uo"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The resolver only reaches a feed through the registered default list, and the other two
// carriers on this host render on their own, which is why only the script is claimed.
describeForEachParser('yandexmaps through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should claim the constructor script the default list reaches', async () => {
    const value = html`
      <p>Text</p>
      <script
        async
        src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&width=600&height=450"
      ></script>
    `
    const expected = html`
      <p>Text</p>
      <div
        data-embed-height="450"
        data-embed-width="600"
        data-embed-thumbnail="https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&amp;width=600&amp;height=450"
        data-embed-id="constructor:a3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38"
        data-embed-provider="yandexmaps"
        data-embed-src="https://yandex.ru/map-widget/v1/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&amp;source=constructor"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave the static image carrier as the image it already is', async () => {
    const value = html`
      <img
        src="https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&width=550&height=450&lang=ru_RU"
        style="border: 0;"
      />
    `
    const expected = html`
      <img
        height="450"
        width="550"
        src="https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Aa3f91c2d7e4b6085af12c9d3e7b40516c8a2f9d14e6b73c0a851df29e4c76b38&amp;width=550&amp;height=450&amp;lang=ru_RU"
        style="border: 0;"
      />
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave the short link frame to the generic placeholder', async () => {
    const value = html`
      <iframe
        src="https://api-maps.yandex.ru/frame/v1/-/CVXW56JA"
        width="100%"
        height="400"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="400"
        data-embed-src="https://api-maps.yandex.ru/frame/v1/-/CVXW56JA"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
