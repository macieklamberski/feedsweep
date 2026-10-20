import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr, getElementDimensions } from '../utils/dom.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'googlesheets'

// The publish routes, each minted as the carrier names it. A sheet that is published but not
// shared answers 401 on `/edit` and `/preview`.
const sheetRoutes = ['pubhtml', 'pubhtml/sheet']
const chartRoute = 'pubchart'

// The parameters a sheet's frame keeps. Every other one is dropped.
const sheetParams = [
  'gid', // The tab that shows
  'single', // Only that tab
  'range', // The cells that show
]

// The parameters a chart's frame keeps. Every other one is dropped.
const chartParams = [
  'oid', // The chart
]

const sheetHeight = 500
const chartHeight = 371

// `/spreadsheets/d/e/{token}` names a sheet published to the web and `/spreadsheets/d/{id}` names
// it by its Drive file id. An account index, `/u/{n}/`, only picks the sign-in and serves the
// same sheet.
export const googlesheetsResolveEmbed: ResolveEmbed = (url, element) => {
  const pathSegments = getPathSegments(url)

  if (pathSegments[0] !== 'spreadsheets') {
    return
  }

  const segments = pathSegments[1] === 'u' ? pathSegments.slice(3) : pathSegments.slice(1)

  if (segments[0] !== 'd') {
    return
  }

  const isPublished = segments[1] === 'e'
  const sheetId = segments[isPublished ? 2 : 1]
  const route = segments.slice(isPublished ? 3 : 2).join('/')
  const isChart = route === chartRoute

  if (!isChart && !sheetRoutes.includes(route)) {
    return
  }

  const sheetPath = isPublished ? `e/${sheetId}` : sheetId
  const query = pickUrlParams(url, isChart ? chartParams : sheetParams)
  // A chart draws at its own pixel size and never scales, and its carrier declares that size.
  const declaredHeight = element ? getElementDimensions(element).height : undefined
  const height = isChart ? (declaredHeight ?? chartHeight) : sheetHeight

  return {
    provider,
    id: sheetId,
    src: `https://docs.google.com/spreadsheets/d/${sheetPath}/${route}${query}`,
    url: `https://docs.google.com/spreadsheets/d/${sheetPath}/pubhtml`,
    height,
    title: attr(element, 'title'),
  }
}

export const googlesheetsEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com'],
  googlesheetsResolveEmbed,
)
