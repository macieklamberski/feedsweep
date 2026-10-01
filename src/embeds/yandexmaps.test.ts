import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { yandexMapsIframeEmbedResolver, yandexMapsScriptEmbedResolver } from './yandexmaps.js'

describeForEachParser('yandexMapsScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, yandexMapsScriptEmbedResolver)

  describe('happy paths', () => {
    it('should rebuild the constructor script onto the map widget frame without its locale or size', async () => {
      const value = html`
        <script
          type="text/javascript"
          charset="utf-8"
          async
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A669755b2ef0f5d7045582d539cdbb5a036d042af257453807f832e99a561f2f6&width=1280&height=720&lang=ru_RU&scroll=true"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:669755b2ef0f5d7045582d539cdbb5a036d042af257453807f832e99a561f2f6',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3A669755b2ef0f5d7045582d539cdbb5a036d042af257453807f832e99a561f2f6&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A669755b2ef0f5d7045582d539cdbb5a036d042af257453807f832e99a561f2f6&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a protocol-relative sid script onto the constructor space', async () => {
      const value = html`
        <script
          type="text/javascript"
          charset="utf-8"
          src="//api-maps.yandex.ru/services/constructor/1.0/js/?sid=omUAJBOvuV6_W7wN2pfyzwWVFfVY_688&width=500&height=450"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:omUAJBOvuV6_W7wN2pfyzwWVFfVY_688',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3AomUAJBOvuV6_W7wN2pfyzwWVFfVY_688&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3AomUAJBOvuV6_W7wN2pfyzwWVFfVY_688&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a url-safe constructor id', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3AT-nTLncOvg4Imm-DPwvRpeKBNo5j9f7j&width=100%25&height=320&lang=ru_RU&scroll=true"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:T-nTLncOvg4Imm-DPwvRpeKBNo5j9f7j',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3AT-nTLncOvg4Imm-DPwvRpeKBNo5j9f7j&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3AT-nTLncOvg4Imm-DPwvRpeKBNo5j9f7j&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a locale other than Russian from the frame and the thumbnail', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&width=700&height=450&lang=en_US"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the wheel zoom the publisher turned off', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A04ec63940a1621326b58c09d746fda091ebb98dd0702004681ee23e278348d6d&width=100%25&height=250&lang=ru_RU&scroll=false"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:04ec63940a1621326b58c09d746fda091ebb98dd0702004681ee23e278348d6d',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3A04ec63940a1621326b58c09d746fda091ebb98dd0702004681ee23e278348d6d&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A04ec63940a1621326b58c09d746fda091ebb98dd0702004681ee23e278348d6d&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the source type the constructor adds to a sid script', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?sid=KuFkL5um1Q8O6zD79_lWgD7kyj2EPZeQ&width=100%&height=400&lang=ru_RU&sourceType=constructor&scroll=true"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:KuFkL5um1Q8O6zD79_lWgD7kyj2EPZeQ',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3AKuFkL5um1Q8O6zD79_lWgD7kyj2EPZeQ&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3AKuFkL5um1Q8O6zD79_lWgD7kyj2EPZeQ&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the query of a script whose question mark became a space', async () => {
      const value = html`
        <script
          charset="utf-8"
          async="async"
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/ um=constructor%3A855da93025cc3bfe3d4b608b50d21825a24fe350250f46898de7e9fb3fcc894f&amp;width=100%25&amp;height=570&amp;lang=ru_RU&amp;scroll=true"
          type="text/javascript"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:855da93025cc3bfe3d4b608b50d21825a24fe350250f46898de7e9fb3fcc894f',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3A855da93025cc3bfe3d4b608b50d21825a24fe350250f46898de7e9fb3fcc894f&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A855da93025cc3bfe3d4b608b50d21825a24fe350250f46898de7e9fb3fcc894f&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<script src="https://evil.test/services/constructor/1.0/js/?sid=XrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD&width=600&height=450&api-maps.yandex.ru/services/constructor/"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a script naming no map', async () => {
      const value =
        '<script src="https://api-maps.yandex.ru/services/constructor/1.0/js/?width=600&height=450"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a mymaps map unclaimed', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=mymaps%3AqEHy4cZYI-R3HiM5ZochZj1G-VHYfrts&width=700&height=480&lang=ru_RU&scroll=true"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a mymaps map whose id starts with the constructor prefix unclaimed', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=mymaps%3Aconstructor%3AqEHy4cZYI-R3HiM5ZochZj1G-VHYfrts&width=700&height=480&lang=ru_RU&scroll=true"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a space written anywhere but after the script route', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/%20um=constructor%3A855da93025cc3bfe3d4b608b50d21825a24fe350250f46898de7e9fb3fcc894f&amp;width=100%25&amp;height=570"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should keep the stated query over one written after a space in the path', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/%20um=constructor%3A855da93025cc3bfe3d4b608b50d21825a24fe350250f46898de7e9fb3fcc894f?sid=XrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:XrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3AXrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3AXrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a um value whose colon arrived unescaped', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor:ddca94115ee827d1f17a37eef3b95c46025b7747fb74c35ca4165b13f365c9b0&width=500&height=400&lang=ru_RU&scroll=true"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:ddca94115ee827d1f17a37eef3b95c46025b7747fb74c35ca4165b13f365c9b0',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3Addca94115ee827d1f17a37eef3b95c46025b7747fb74c35ca4165b13f365c9b0&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Addca94115ee827d1f17a37eef3b95c46025b7747fb74c35ca4165b13f365c9b0&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the um id over a sid stated before it', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?sid=XrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD&um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&width=700&height=450&lang=ru_RU&scroll=true"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should encode a um id holding a path into the query', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A..%2FT-nTLncOvg4Imm-DPwvRpeKBNo5j9f7j&width=500&height=400"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:../T-nTLncOvg4Imm-DPwvRpeKBNo5j9f7j',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3A..%2FT-nTLncOvg4Imm-DPwvRpeKBNo5j9f7j&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A..%2FT-nTLncOvg4Imm-DPwvRpeKBNo5j9f7j&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should encode a sid holding a path into the query', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?sid=..%2FXrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD&width=500&height=400"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:../XrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3A..%2FXrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A..%2FXrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('a carrier that states only a height', () => {
    it('should give a percent-width constructor script the map height over its own', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3Afdfc0ac3ce8c3f2938c3c6b90160ef0ab0512304559d955f27f1a4563fce05c2&width=100%25&height=400&lang=ru_RU&scroll=true"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:fdfc0ac3ce8c3f2938c3c6b90160ef0ab0512304559d955f27f1a4563fce05c2',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3Afdfc0ac3ce8c3f2938c3c6b90160ef0ab0512304559d955f27f1a4563fce05c2&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Afdfc0ac3ce8c3f2938c3c6b90160ef0ab0512304559d955f27f1a4563fce05c2&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should give a percent-width sid script the map height over its own', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?sid=bwarJ0QnXXZ8tRsuRCHBn1AOVA2J3HnX&width=100%&height=473"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:bwarJ0QnXXZ8tRsuRCHBn1AOVA2J3HnX',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3AbwarJ0QnXXZ8tRsuRCHBn1AOVA2J3HnX&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3AbwarJ0QnXXZ8tRsuRCHBn1AOVA2J3HnX&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('a carrier that states no height', () => {
    it('should give a constructor script the map height and thumbnail', async () => {
      const value = html`
        <script
          src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3Aca3315e5d07d03182ee19c793734854b4b2b5cb671b548b014e3bea687d8240f&width=500&lang=ru_RU&scroll=true"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:ca3315e5d07d03182ee19c793734854b4b2b5cb671b548b014e3bea687d8240f',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3Aca3315e5d07d03182ee19c793734854b4b2b5cb671b548b014e3bea687d8240f&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Aca3315e5d07d03182ee19c793734854b4b2b5cb671b548b014e3bea687d8240f&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should give a sid script the map height and thumbnail', async () => {
      const value =
        '<script src="https://api-maps.yandex.ru/services/constructor/1.0/js/?sid=XrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD"></script>'
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:XrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3AXrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3AXrE3bAUZf88xO0B6nFH3wQbCoNJFhYBD&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('yandexMapsIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, yandexMapsIframeEmbedResolver)

  describe('happy paths', () => {
    it('should claim the constructor frame and draw its thumbnail at the map height', async () => {
      const value = html`
        <iframe
          src="https://yandex.ru/map-widget/v1/?um=constructor%3Ae4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde&amp;source=constructor"
          width="616"
          height="589"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:e4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3Ae4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Ae4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the height of a percent-width constructor frame', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="400"
          src="https://yandex.ru/map-widget/v1/?um=constructor%3A2687ed7b49f95f67cee2850b711837012d76c504c87c0ecf7614a3a1c02609f4&source=constructor"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmaps',
        id: 'constructor:2687ed7b49f95f67cee2850b711837012d76c504c87c0ecf7614a3a1c02609f4',
        src: 'https://yandex.ru/map-widget/v1/?um=constructor%3A2687ed7b49f95f67cee2850b711837012d76c504c87c0ecf7614a3a1c02609f4&source=constructor',
        thumbnail:
          'https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A2687ed7b49f95f67cee2850b711837012d76c504c87c0ecf7614a3a1c02609f4&width=650&height=400',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/map-widget/v1/?um=constructor%3Ae4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde&source=constructor"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a short link frame', async () => {
      const value = '<iframe src="https://yandex.ru/map-widget/v1/-/CHA0YA-W"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a frame placed by coordinates', async () => {
      const value =
        '<iframe src="https://yandex.ru/map-widget/v1/?ll=37.612000%2C55.752000&z=13&l=map"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the widget path under another route', async () => {
      const value =
        '<iframe src="https://yandex.ru/x/map-widget/v1/?um=constructor%3Ae4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde&source=constructor"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('yandexmaps through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should claim the constructor script the default list reaches', async () => {
    const value = html`
      <p>Text</p>
      <script
        async
        src="https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&width=700&height=450&lang=ru_RU&scroll=true"
      ></script>
    `
    const expected = html`
      <p>Text</p>
      <div
        data-embed-height="400"
        data-embed-thumbnail="https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&amp;width=650&amp;height=400"
        data-embed-id="constructor:0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10"
        data-embed-provider="yandexmaps"
        data-embed-src="https://yandex.ru/map-widget/v1/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&amp;source=constructor"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should claim the constructor frame the default list reaches', async () => {
    const value = html`
      <iframe
        src="https://yandex.ru/map-widget/v1/?um=constructor%3Ae4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde&amp;source=constructor"
        width="616"
        height="589"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="400"
        data-embed-thumbnail="https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3Ae4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde&amp;width=650&amp;height=400"
        data-embed-id="constructor:e4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde"
        data-embed-provider="yandexmaps"
        data-embed-src="https://yandex.ru/map-widget/v1/?um=constructor%3Ae4b22aa7bfb87876b4821a8ea1ec86773f720ba6a4818bb58e0e073c50bc9dde&amp;source=constructor"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should claim the script uCoz prefixed with the site host', async () => {
    const value = html`
      <p>Text</p>
      <script
        type="text/javascript"
        charset="utf-8"
        src="https://needlework.ucoz.ua//api-maps.yandex.ru/services/constructor/1.0/js/?sid=qMkqdbHN9XKYsSEKaL6LC8peZRpEzqo7&width=800&height=550"
      ></script>
    `
    const expected = html`
      <p>Text</p>
      <div
        data-embed-height="400"
        data-embed-thumbnail="https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3AqMkqdbHN9XKYsSEKaL6LC8peZRpEzqo7&amp;width=650&amp;height=400"
        data-embed-id="constructor:qMkqdbHN9XKYsSEKaL6LC8peZRpEzqo7"
        data-embed-provider="yandexmaps"
        data-embed-src="https://yandex.ru/map-widget/v1/?um=constructor%3AqMkqdbHN9XKYsSEKaL6LC8peZRpEzqo7&amp;source=constructor"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave the static image carrier as the image it already is', async () => {
    const value = html`
      <img
        src="https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&width=550&height=450&lang=ru_RU"
        style="border: 0;"
      />
    `
    const expected = html`
      <img
        height="450"
        width="550"
        src="https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A0bdc5302cc22f4161a42bca393a443877882d9635d96fa30ee7dc6617ef95c10&amp;width=550&amp;height=450&amp;lang=ru_RU"
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
