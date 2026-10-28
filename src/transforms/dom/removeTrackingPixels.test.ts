import { describe, expect, it } from 'bun:test'
import { defaultTrackingUrls } from '../../defaults.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { removeTrackingPixels } from './removeTrackingPixels.js'

const pxPathRegex = /^\/px(\/|$)/

const hostTrackingUrls = defaultTrackingUrls.filter((entry) => !entry.path)

describeForEachParser('removeTrackingPixels', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [removeTrackingPixels(context)])
  }

  describe('size-based detection', () => {
    it('should remove 1x1 pixel images', async () => {
      const value = html`
        <p>Text</p>
        <img src="tracker.gif" width="1" height="1">
      `
      const expected = '<p>Text</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove 2x2 pixel images', async () => {
      const value = '<img src="pixel.png" width="2" height="2">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove image when only width=1 is set', async () => {
      const value = '<img src="icon.png" width="1">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove image when only height=1 is set', async () => {
      const value = '<img src="icon.png" height="1">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove image when only width=0 is set and src is not a real image', async () => {
      const value = '<img src="https://example.com/track?id=1" width="0">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should not remove normal-sized images', async () => {
      const value = '<img src="photo.jpg" width="800" height="600">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not remove image with non-numeric dimensions', async () => {
      const value = '<img src="photo.jpg" width="auto" height="auto">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not remove 3x3 image', async () => {
      const value = '<img src="small.png" width="3" height="3">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('content-image guard', () => {
    it('should keep a 0x0 image whose src is a real raster file', async () => {
      const value = html`
        <img src="https://img.cdn.example.com/abc.jpg" width="0" height="0" alt="Photo">
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a 0x0 image whose raster src carries a query', async () => {
      const value = html`
        <img src="https://img.cdn.example.com/abc.jpg?w=800" width="0" height="0">
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a 0x0 image whose raster src carries a fragment', async () => {
      const value = html`
        <img src="https://img.cdn.example.com/abc.jpg#main" width="0" height="0">
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a 0x0 image whose src carries a raster format query', async () => {
      const value = html`
        <img src="https://img.cdn.example.com/abc?width=1300&format=jpeg" width="0" height="0">
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a 0x0 image whose raster format query comes first', async () => {
      const value = html`
        <img src="https://img.cdn.example.com/abc?format=png" width="0" height="0">
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a tiny image that declares a srcset at any size', async () => {
      const value = '<img src="placeholder.gif" srcset="real.jpg 800w" width="1" height="1">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should still remove a 0x0 beacon whose src is not a real image', async () => {
      const value = html`
        <img src="https://stat.example.com/piwik.php?idsite=1&rec=1" width="0" height="0">
      `

      expect(await transform(value)).toEqualHtml('')
    })

    it('should still remove a 0x0 gif spacer', async () => {
      const value = '<img src="spacer.gif" width="0" height="0">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should still remove a 1x1 raster pixel without a srcset', async () => {
      const value = '<img src="https://example.com/p.png" width="1" height="1">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should still remove an opacity:0 image even with a real raster src', async () => {
      const value = html`
        <img src="https://example.com/photo.jpg" style="opacity:0" width="0" height="0">
      `

      expect(await transform(value)).toEqualHtml('')
    })

    it('should still remove a tracking-host image even with a real raster src', async () => {
      const value = '<img src="https://stats.wordpress.com/b.png" width="0" height="0">'

      expect(await transform(value)).toEqualHtml('')
    })
  })

  describe('inline-style detection', () => {
    it('should remove img with style width:1px;height:1px and no attrs', async () => {
      const value = '<img src="track.gif" style="width:1px;height:1px">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove img with only style width:1px', async () => {
      const value = '<img src="bug.gif" style="width:1px">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove img with only style height:0', async () => {
      const value = '<img src="zero.gif" style="height:0">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove img with spaces in style declaration', async () => {
      const value = '<img src="spaced.gif" style="width: 1px ; height: 1px">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should not remove img with style width:600px;height:400px', async () => {
      const value = '<img src="hero.jpg" style="width:600px;height:400px">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not remove img with non-px width:50%', async () => {
      const value = '<img src="responsive.jpg" style="width:50%">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should detect dimension from style when attribute is auto', async () => {
      const value = '<img src="mixed.gif" width="auto" height="auto" style="width:1px;height:1px">'

      expect(await transform(value)).toEqualHtml('')
    })
  })

  describe('hidden-image detection', () => {
    // stripHiddenElements removes these upstream in the default pipeline, but
    // removeTrackingPixels rechecks via the shared isElementHidden so it stays
    // correct when composed on its own. opacity:0 is image-specific and stays here.
    it('should remove an image hidden via display:none', async () => {
      const value = '<img src="invis.gif" style="display:none">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove an image hidden via visibility:hidden', async () => {
      const value = '<img src="invis.gif" style="visibility:hidden">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove an image carrying the hidden attribute', async () => {
      const value = '<img src="invis.gif" hidden>'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should not remove img with style display:block', async () => {
      const value = '<img src="visible.jpg" style="display:block">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not remove img solely on aria-hidden=true', async () => {
      const value = '<img src="decorative.jpg" aria-hidden="true">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('host-based detection', () => {
    // Iterates the real default list, so every entry is exercised and a new entry
    // is covered automatically.
    it.each(hostTrackingUrls)('should remove images from $host', async ({ host }) => {
      const value = `<img src="https://${host}/t.gif?id=abc">`

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove images from tracking-host subdomains', async () => {
      const value = '<img src="https://da.feedsportal.com/c/12345/abc.gif">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should not remove The Conversation content images on other subdomains', async () => {
      const value = '<img src="https://images.theconversation.com/files/1/photo.jpg" alt="Photo">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should remove an unsized Newsvoir release pixel', async () => {
      const value = '<img src="https://reports.newsvoir.com/images/pixel.gif?newsid=36688" alt="">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should keep an unsized Newsvoir release photo', async () => {
      const value =
        '<img src="https://www.newsvoir.com/images/article/image1/36688_equitas.jpg" alt="">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should remove a page-view counter badge from counter.blakedrumm.com', async () => {
      const value = html`
        <img src="https://counter.blakedrumm.com/count/tag.svg?url=blakedrumm.com/blog/clear-teams-cache/" alt="Page Views">
      `

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove an unsized AdSense for Feeds image ad', async () => {
      const value = html`
        <img
          usemap="#google_ad_map_517_74ab9b1e764918ae"
          border="0"
          src="http://imageads.googleadservices.com/pagead/ads?format=468x30_aff_img&amp;client=&amp;channel=&amp;output=png&amp;cuid=517&amp;url=http%3A%2F%2Fexample.com%2Fblog%2F2011%2F03%2F09%2Fpython-bindings%2F"
        >
      `

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove a FeedBurner AdSense for Feeds image from its click anchor', async () => {
      const value = html`
        <a href="http://feedads.googleadservices.com/~a/kQrgB9LhQ-dEE2vToFFWEbAVOus/a">
          <img src="http://feedads.googleadservices.com/~a/kQrgB9LhQ-dEE2vToFFWEbAVOus/i" border="0" ismap="true">
        </a>
      `
      const expected =
        '<a href="http://feedads.googleadservices.com/~a/kQrgB9LhQ-dEE2vToFFWEbAVOus/a"></a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a content-sized image on a tracking-host subdomain', async () => {
      const value = html`
        <img src="https://media.beehiiv.com/cdn-cgi/image/fit=scale-down/uploads/photo.png" width="1200" height="800">
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a tracking-host image with only one content-sized dimension', async () => {
      const value = '<img src="https://www.hubspot.com/hubfs/chart.png" width="640">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a tracking-host image sized by inline style', async () => {
      const value = '<img src="https://media.beehiiv.com/uploads/photo.png" style="width:800px">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not remove images from look-alike hosts', async () => {
      const value = '<img src="https://notfeedsportal.com/photo.jpg">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('tracking url entries', () => {
    const pathContext: TransformContext = {
      ...baseContext,
      trackingUrls: [{ host: 'example.com', path: pxPathRegex }],
    }

    it('should remove an image on a subdomain whose path matches', async () => {
      const value = '<img src="https://www.example.com/px?id=1">'

      expect(await transform(value, pathContext)).toEqualHtml('')
    })

    it('should remove an image whose path matches with a trailing slash', async () => {
      const value = '<img src="https://cdn.example.com/px/">'

      expect(await transform(value, pathContext)).toEqualHtml('')
    })

    it('should keep an image whose path only starts with the same letters', async () => {
      const value = '<img src="https://example.com/pxl.gif">'

      expect(await transform(value, pathContext)).toEqualHtml(value)
    })

    it('should keep an image whose path does not match', async () => {
      const value = '<img src="https://example.com/img/a.jpg">'

      expect(await transform(value, pathContext)).toEqualHtml(value)
    })

    it('should keep a content-sized image whose path matches', async () => {
      const value = html`
        <img
          src="https://example.com/px/banner.png"
          width="600"
          height="400"
        >
      `

      expect(await transform(value, pathContext)).toEqualHtml(value)
    })

    it('should remove an image from a host given only in trackingHosts', async () => {
      const context: TransformContext = {
        ...baseContext,
        trackingHosts: ['example.com'],
        trackingUrls: undefined,
      }
      const value = '<img src="https://example.com/open.gif">'

      expect(await transform(value, context)).toEqualHtml('')
    })

    it('should remove images from hosts in both trackingHosts and trackingUrls', async () => {
      const context: TransformContext = {
        ...baseContext,
        trackingHosts: ['example.org'],
        trackingUrls: [{ host: 'example.com' }],
      }
      const value = html`
        <p>Text</p>
        <img src="https://example.org/open.gif">
        <img src="https://example.com/open.gif">
      `

      expect(await transform(value, context)).toEqualHtml('<p>Text</p>')
    })
  })

  describe('Meta Pixel image', () => {
    it('should remove the image', async () => {
      const value =
        '<img src="https://www.facebook.com/tr?id=1845363462352797&ev=PageView&noscript=1">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove the image whose path ends in a slash', async () => {
      const value = html`
        <img
          border="0"
          src="https://www.facebook.com/tr/?ev=6021483112529&amp;if=false&amp;ts=1453362988164&amp;v=2.0"
        >
      `

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove the image on the mobile subdomain', async () => {
      const value = '<img src="https://m.facebook.com/tr?id=1845363462352797&ev=PageView">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should keep an unsized logo elsewhere on facebook.com', async () => {
      const value = '<img src="http://www.facebook.com/images/fb_logo_small.png" alt="Facebook">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep an image on a page path that starts with tr', async () => {
      const value = '<img src="https://www.facebook.com/treatibles/photos/1.jpg" alt="Treats">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('EmailWire release pixel', () => {
    it('should remove the image', async () => {
      const value = html`
        <img
          src="https://www.emailwire.com/tracker/track.php?ID=39021"
          border="0"
        >
      `

      expect(await transform(value)).toEqualHtml('')
    })

    it('should keep an unsized release image', async () => {
      const value = '<img src="https://www.emailwire.com/files/39021/product.jpg" alt="Product">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('path words', () => {
    it('should keep an unsized image whose file is named pixel', async () => {
      const value = '<img src="https://example.com/pixel.gif?id=abc">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep an unsized image in a folder named pixel', async () => {
      const value = '<img src="https://example.com/pixel/abc.png">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep an unsized page-view counter in a folder named count', async () => {
      const value = '<img src="https://counter.example.com/count/tag.svg?url=example.com/post/">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep an unsized photo in a folder named Beacon', async () => {
      const value = '<img src="https://example.com/Image/newsImages/Beacon/STEAM-night.JPG">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('combined behavior', () => {
    it('should preserve non-tracking images', async () => {
      const value = '<img src="https://example.com/photo.jpg" alt="Nice photo">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should remove pixel even when src is missing host signal', async () => {
      const value = '<img src="https://cdn.example.com/img.jpg" width="1" height="1">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove tracker-host even when no width/height set', async () => {
      const value = '<img src="https://stats.wordpress.com/b.gif">'

      expect(await transform(value)).toEqualHtml('')
    })

    it('should handle html with no images', async () => {
      const value = '<p>No images</p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should handle img with malformed src gracefully', async () => {
      const value = '<img src="://broken">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should handle img with src that throws on URL parse gracefully', async () => {
      // `http://[invalid` (unclosed IPv6 bracket) makes `new URL()` throw.
      const value = '<img src="http://[invalid">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <p>Text</p>
      <img src="tracker.gif" width="1" height="1">
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
