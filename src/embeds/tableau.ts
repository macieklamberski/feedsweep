import { decodeSegment } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, paramValue, text } from '../utils/dom.js'
import { readPixels } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

type View = {
  workbook: string
  sheet: string
}

type SizeMessage = {
  'api.commandData'?: string
}

type SizeCommand = {
  sizeConstraints?: {
    maxHeight?: unknown
    minHeight?: unknown
  }
  chromeHeight?: unknown
}

const provider = 'tableau'

const tableauHosts = [
  'public.tableau.com',
  'public.tableausoftware.com', // The retired domain, whose `/views/` redirects to a gallery page
]

const staticImageHosts = [
  ...tableauHosts,
  'publicrevizit.tableausoftware.com', // A retired image host older snippets name
]

const viewPathRegex = /^\/views\/([^/]+)\/([^/]+)$/
const viewNameRegex = /^([^/]+)\/([^/]+)$/
// `/static/images/{first two letters}/{workbook}/{sheet}/{file}`. A shared viz has no workbook
// and writes `/static/images/{first two letters}/{key}/{file}`.
const staticImagePathRegex = /^\/static\/images\/[^/]+\/([^/]+)\/([^/]+)\/[^/]+$/
// Blogger escapes the `<noscript>` content to text and doubles the `&` of each `&#47;` it holds.
const escapedSlashRegex = /&(?:amp;)*#47;/g
const imageUrlRegex = /https?:\/\/[^\s"'<>]+/
const sizeMessageRegex = /^api\.FirstVizSizeKnownEvent,[^,]*,[^,]*,(.*)/s

// `viz_v1.js` loads `views/{workbook}/{sheet}` with `:embed=y` and `:showVizHome=no`. Without
// `:showVizHome=no` the route redirects to the viz page on the author's profile.
const composeTableauEmbed = (
  workbook: string,
  sheet: string,
  title: string | undefined,
): EmbedResolverResult => {
  return {
    provider,
    id: workbook,
    src: `https://public.tableau.com/views/${workbook}/${sheet}?:embed=y&:showVizHome=no`,
    url: `https://public.tableau.com/views/${workbook}/${sheet}`,
    title,
  }
}

// The snippet's image of the viz, written from the same workbook and sheet as the viz. Its
// public.tableau.com copy is a blank 1x1 png for most workbooks that still exist.
const readStaticImage = (url: string | undefined): View | undefined => {
  const match = parseUrlOnHosts(url, staticImageHosts)?.pathname.match(staticImagePathRegex)

  if (!match) {
    return
  }

  return {
    workbook: match[1],
    sheet: match[2],
  }
}

// The share dialog's snippet: a div holding a `<noscript>` image and a hidden `<object>` whose
// params `viz_v1.js` reads. stripHiddenElements removes the hidden object first, which leaves the
// image.
export const tableauWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.tableauPlaceholder',
  (element) => {
    const noscript = element.querySelector('noscript')
    const image = noscript?.querySelector('img')
    const escapedSrc = text(noscript)?.replace(escapedSlashRegex, '/').match(imageUrlRegex)?.[0]
    const view = readStaticImage(attr(image, 'src') ?? escapedSrc)

    if (!view) {
      return
    }

    return composeTableauEmbed(view.workbook, view.sheet, attr(image, 'alt'))
  },
)

// The snippet's object on its own, not hidden, so its params reach the widget pass.
export const tableauObjectEmbedResolver = createMarkupEmbedResolver(
  'object.tableauViz',
  (element) => {
    // `viz_v1.js` decodes `host_url` before it builds the frame url on it.
    const hostUrl = decodeSegment(paramValue(element, 'host_url'))
    const match = paramValue(element, 'name')?.match(viewNameRegex)

    if (!parseUrlOnHosts(hostUrl, tableauHosts) || !match) {
      return
    }

    return composeTableauEmbed(match[1], match[2], undefined)
  },
)

const tableauResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, tableauHosts)
  const match = parsed?.pathname.match(viewPathRegex)

  if (!match) {
    return
  }

  return composeTableauEmbed(match[1], match[2], attr(element, 'title'))
}

export const tableauIframeEmbedResolver = createUrlEmbedResolver(tableauHosts, tableauResolveEmbed)

// The viz posts its size once it is known, unasked, as a comma-joined string whose last part is
// JSON holding JSON. A dashboard with a fixed size states it as both bounds, one sized by its
// container states zeros, and the toolbar under the viz adds `chromeHeight`.
export const readTableauHeight = (data: unknown): number | undefined => {
  if (typeof data !== 'string') {
    return
  }

  try {
    const message: SizeMessage = JSON.parse(data.match(sizeMessageRegex)?.[1] ?? '')
    const command: SizeCommand = JSON.parse(message['api.commandData'] ?? '')
    const constraints = command.sizeConstraints
    const vizHeight = readPixels(constraints?.maxHeight) ?? readPixels(constraints?.minHeight)

    if (!vizHeight) {
      return
    }

    return vizHeight + (readPixels(command.chromeHeight) ?? 0)
  } catch {}
}

export const tableauRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://public.tableau.com',
  readHeight: readTableauHeight,
}
