import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { flipsnackEmbedResolver } from './flipsnack.js'

describeForEachParser('flipsnackEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, flipsnackEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the widget', async () => {
      const value = html`
        <iframe
          src="https://cdn.flipsnack.com/widget/v2/widget.html?hash=fxn3qutra"
          width="100%"
          height="480"
          seamless="seamless"
          scrolling="no"
          frameBorder="0"
          allowFullScreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flipsnack',
        id: 'fxn3qutra',
        src: 'https://cdn.flipsnack.com/widget/v2/widget.html?hash=fxn3qutra',
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the item hash out of the player hash', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://player.flipsnack.com?hash=OURDRThEN0Q3NUUrZHhuc3VqMWd2dQ=="
          width="100%"
          height="480"
          seamless="seamless"
          scrolling="no"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-read; clipboard-write"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flipsnack',
        id: 'dxnsuj1gvu',
        src: 'https://cdn.flipsnack.com/widget/v2/widget.html?hash=dxnsuj1gvu',
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the blank Flash-era frame onto the widget', async () => {
      const value = html`
        <iframe
          allowtransparency="true"
          frameborder="0"
          height="385"
          scrolling="no"
          seamless="seamless"
          src="http://files.flipsnack.com/iframe/embed.html?hash=fu8a6imu&amp;wmode=window&amp;bgcolor=EEEEEE&amp;t=1336216266"
          width="640"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flipsnack',
        id: 'fu8a6imu',
        src: 'https://cdn.flipsnack.com/widget/v2/widget.html?hash=fu8a6imu',
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the old widget onto the current one', async () => {
      const value = html`
        <iframe
          src="https://cdn.flipsnack.com/widget/flipsnackwidget.html?hash=ftkldea3z&amp;bgcolor=EEEEEE&amp;t=1490487692"
          width="640"
          height="385"
          seamless="seamless"
          scrolling="no"
          frameborder="0"
          allowtransparency="true"
          allowfullscreen="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flipsnack',
        id: 'ftkldea3z',
        src: 'https://cdn.flipsnack.com/widget/v2/widget.html?hash=ftkldea3z',
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the old widget under v2 onto the current one', async () => {
      const value = html`
        <iframe
          src="https://cdn.flipsnack.com/widget/v2/flipsnackwidget.html?hash=ftmlwjntw&amp;bgcolor=EEEEEE&amp;t=1496756337"
          width="640"
          height="385"
          seamless="seamless"
          scrolling="no"
          frameborder="0"
          allowtransparency="true"
          allowfullscreen="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flipsnack',
        id: 'ftmlwjntw',
        src: 'https://cdn.flipsnack.com/widget/v2/widget.html?hash=ftmlwjntw',
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the name out of the stated title', async () => {
      const value = html`
        <iframe
          title="水源劇場109年3-5月季節目單"
          src="https://cdn.flipsnack.com/widget/v2/widget.html?hash=fu8wxsq8h"
          width="100%"
          height="480"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flipsnack',
        id: 'fu8wxsq8h',
        src: 'https://cdn.flipsnack.com/widget/v2/widget.html?hash=fu8wxsq8h',
        height: 480,
        title: '水源劇場109年3-5月季節目單',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker from the widget url', async () => {
      const value =
        '<iframe src="https://cdn.flipsnack.com/widget/v2/widget.html?hash=fxn3qutra&utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flipsnack',
        id: 'fxn3qutra',
        src: 'https://cdn.flipsnack.com/widget/v2/widget.html?hash=fxn3qutra',
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the widget path', async () => {
      const value = '<iframe src="https://evil.test/widget/v2/widget.html?hash=fxn3qutra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the player hash', async () => {
      const value =
        '<iframe src="https://evil.test/?hash=OURDRThEN0Q3NUUrZHhuc3VqMWd2dQ=="></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route that is not a widget', async () => {
      const value =
        '<iframe src="https://cdn.flipsnack.com/widget/v2/viewer.html?hash=fxn3qutra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a widget route spelled in uppercase', async () => {
      const value =
        '<iframe src="https://cdn.flipsnack.com/Widget/v2/Widget.html?hash=fxn3qutra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a widget with no item hash', async () => {
      const value = '<iframe src="https://cdn.flipsnack.com/widget/v2/widget.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player path other than the root', async () => {
      const value =
        '<iframe src="https://player.flipsnack.com/viewer?hash=OURDRThEN0Q3NUUrZHhuc3VqMWd2dQ=="></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player hash that is not base64', async () => {
      const value = '<iframe src="https://player.flipsnack.com?hash=dxnsuj1gvu"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player hash that names no item', async () => {
      const value = '<iframe src="https://player.flipsnack.com?hash=OURDRThEN0Q3NUU="></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should keep the item hash in the case the feed wrote', async () => {
      const value =
        '<iframe src="https://cdn.flipsnack.com/widget/v2/widget.html?hash=FXN3QUTRA"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flipsnack',
        id: 'FXN3QUTRA',
        src: 'https://cdn.flipsnack.com/widget/v2/widget.html?hash=FXN3QUTRA',
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('flipsnack through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should replace the blank Flash-era frame with a widget placeholder', async () => {
    const value = html`
      <iframe
        height="385"
        src="http://files.flipsnack.com/iframe/embed.html?hash=fu8a6imu&amp;wmode=window&amp;bgcolor=EEEEEE&amp;t=1336216266"
        width="640"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="480"
        data-embed-id="fu8a6imu"
        data-embed-provider="flipsnack"
        data-embed-src="https://cdn.flipsnack.com/widget/v2/widget.html?hash=fu8a6imu"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a video enclosure on the widget host playable', async () => {
    const enclosures = [
      { url: 'https://cdn.flipsnack.com/videos/fxn3qutra.mp4', type: 'video/mp4' },
    ]
    const expected = html`
      <video data-enclosure="" controls src="https://cdn.flipsnack.com/videos/fxn3qutra.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
