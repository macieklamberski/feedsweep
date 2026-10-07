import { getPathSegments, isPlainObject } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { readPixels } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'gofundme'

const gofundmeHosts = ['gofundme.com']

// The share dialog's embed code writes `/f/{slug}/widget/{size}?sharesheet=…`, with Large checked
// by default, and every size frames the same campaign.
export const composeGofundmeWidgetUrl = (slug: string): string => {
  return `https://www.gofundme.com/f/${slug}/widget/large`
}

export const readGofundmeSlug = (url: string | undefined): string | undefined => {
  const parsed = parseUrlOnHosts(url, gofundmeHosts)
  const [route, slug] = parsed ? getPathSegments(parsed) : []

  if (route !== 'f' || !slug) {
    return
  }

  return slug
}

export const gofundmeResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, gofundmeHosts)
  const [route, slug, kind] = parsed ? getPathSegments(parsed) : []

  // The campaign page itself sits at `/f/{slug}` and is not a widget.
  if (route !== 'f' || !slug || kind !== 'widget') {
    return
  }

  return {
    provider,
    id: slug,
    src: composeGofundmeWidgetUrl(slug),
    url: `https://www.gofundme.com/f/${slug}`,
  }
}

// GoFundMe's campaign widget frame, which the loader script or `rebuildGofundmeEmbeds` writes.
export const gofundmeEmbedResolver = createUrlEmbedResolver(gofundmeHosts, gofundmeResolveEmbed)

// The widget posts `{ type: 'gfm-embed-widget-resize', offsetHeight, offsetWidth }` unasked.
export const readGofundmeHeight = (data: unknown): number | undefined => {
  if (!isPlainObject(data) || data.type !== 'gfm-embed-widget-resize') {
    return
  }

  return readPixels(data.offsetHeight)
}

export const gofundmeRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://www.gofundme.com',
  readHeight: readGofundmeHeight,
}
