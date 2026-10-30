import { getQueryParam, isAnyOf, parseUrl, webImageExtensions } from 'trousse'
import type { DomTransform } from '../../types.js'
import {
  getElementDimensions,
  hasZeroOpacity,
  isElementHidden,
  pixelDimensionLimit,
} from '../../utils/dom.js'
import { matchesUrlPattern, placeholderBaseUrl } from '../../utils/urls.js'

const isPixelDimension = (value: number | undefined): boolean => {
  return value !== undefined && value <= pixelDimensionLimit
}

const isPixelSized = (dimensions: { width?: number; height?: number }): boolean => {
  return isPixelDimension(dimensions.width) || isPixelDimension(dimensions.height)
}

// A stated size above a pixel is content whatever serves it: newsletter platforms on the host
// list serve their posts' images from subdomains of the host that serves their beacons.
const isContentSized = (dimensions: { width?: number; height?: number }): boolean => {
  const { width = 0, height = 0 } = dimensions

  return width > pixelDimensionLimit || height > pixelDimensionLimit
}

// gif and svg are the spacer, pixel and badge formats.
const spacerExtensions = ['gif', 'svg']
const rasterExtensions = webImageExtensions.filter((extension) => {
  return !spacerExtensions.includes(extension)
})
const rasterExtensionRegex = new RegExp(`\\.(?:${rasterExtensions.join('|')})(?:$|[?#])`, 'i')
const formatQueryParams = ['format', 'fm', 'output']

// A format value can name several formats, such as `webp,auto`.
const hasRasterFormatQuery = (src: string): boolean => {
  const url = parseUrl(src, placeholderBaseUrl)

  return formatQueryParams.some((name) => {
    const formats = getQueryParam(url, name)?.split(',') ?? []

    return formats.some((format) => isAnyOf(format.trim(), rasterExtensions))
  })
}

// A raster src clears a 0x0 lazy placeholder only: raster beacons ship at 1x1 as well.
// A non-empty srcset is a content signal at any size.
// A 0x0 image still fires its request, and 0 or unset is the lazy-load placeholder convention.
const hasContentImageSignal = (
  image: Element,
  dimensions: { width?: number; height?: number },
): boolean => {
  const srcset = image.getAttribute('srcset')

  if (srcset && srcset.trim().length > 0) {
    return true
  }

  if (dimensions.width !== 0 && dimensions.height !== 0) {
    return false
  }

  const src = image.getAttribute('src')

  return !!src && (rasterExtensionRegex.test(src) || hasRasterFormatQuery(src))
}

// A tracking pixel: a hidden or pixel-sized <img> whose only job is to fire a request.
export const removeTrackingPixels: DomTransform = (context) => {
  const entries = context.trackingUrls

  return (document) => {
    const images = document.querySelectorAll('img')

    for (const image of images) {
      if (isElementHidden(image) || hasZeroOpacity(image)) {
        image.remove()
        continue
      }

      const dimensions = getElementDimensions(image)

      if (isPixelSized(dimensions) && !hasContentImageSignal(image, dimensions)) {
        image.remove()
        continue
      }

      if (!isContentSized(dimensions)) {
        const src = image.getAttribute('src')

        if (src && matchesUrlPattern(src, entries)) {
          image.remove()
        }
      }
    }
  }
}
