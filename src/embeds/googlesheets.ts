import {
  composeFragment,
  composeQuery,
  getAnyOf,
  getFragmentParams,
  getPathSegments,
  getQueryParams,
  isAnyOf,
} from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr, getElementDimensions } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'
import { composeDriveThumbnail } from './googledrive.js'

const provider = 'googlesheets'

// The publish routes, each minted as the carrier names it. A sheet that is published but not
// shared answers 401 on `/edit` and `/preview`.
const sheetRoutes = ['pubhtml', 'pubhtml/sheet']
const chartRoute = 'pubchart'
// Frames a sheet shared by link, by its file id. A sheet that is shared but not published
// answers 401 on `pubhtml`. An `/edit` carrier is a pasted share link that draws the editor's
// chrome, so it is framed on `/preview` too, as is a bare `/spreadsheets/d/{id}`, which redirects
// to `/edit`.
const sharedRoutes = ['', 'edit', 'preview']

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

const sizes = {
  sheet: { height: 500 },
  chart: { height: 371 },
}

// A frame can name the tab it opens on in the fragment, as `#gid={id}`.
const tabFragmentParams = ['gid']

// `/spreadsheets/d/e/{token}` names a sheet published to the web and `/spreadsheets/d/{id}` names
// it by its Drive file id. An account index, `/u/{n}/`, only picks the sign-in and serves the
// same sheet.
export const googlesheetsResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const [app, ...appSegments] = getPathSegments(url)

  if (!isAnyOf(app, 'spreadsheets')) {
    return
  }

  const [accountRoute] = appSegments
  const segments = isAnyOf(accountRoute, 'u') ? appSegments.slice(2) : appSegments
  const [fileRoute, ...fileSegments] = segments

  if (!isAnyOf(fileRoute, 'd')) {
    return
  }

  const [publishedRoute] = fileSegments
  const isPublished = isAnyOf(publishedRoute, 'e')
  const [sheetId, ...routeSegments] = isPublished ? fileSegments.slice(1) : fileSegments
  const route = routeSegments.join('/')
  const isChart = isAnyOf(route, chartRoute)
  // A publish token answers 404 on `/edit` and `/preview`.
  const isShared = !isPublished && isAnyOf(route, sharedRoutes)
  const publishRoute = isChart ? chartRoute : getAnyOf(route, sheetRoutes)

  if (!sheetId) {
    return
  }

  if (!isShared && !publishRoute) {
    return
  }

  const sheetPath = isPublished ? `e/${sheetId}` : sheetId
  const frameRoute = isShared ? 'preview' : publishRoute
  const query = composeQuery(getQueryParams(url, isChart ? chartParams : sheetParams))
  const fragment = composeFragment(getFragmentParams(url, tabFragmentParams))
  // A chart draws at its own pixel size and never scales, and its carrier declares that size.
  const declaredHeight = element ? getElementDimensions(element).height : undefined
  let size = isChart ? sizes.chart : sizes.sheet

  if (isChart && declaredHeight !== undefined) {
    size = { height: declaredHeight }
  }

  return {
    provider,
    id: sheetId,
    src: `https://docs.google.com/spreadsheets/d/${sheetPath}/${frameRoute}${query}${fragment}`,
    url: `https://docs.google.com/spreadsheets/d/${sheetPath}/${isShared ? 'edit' : 'pubhtml'}`,
    thumbnail: isShared ? composeDriveThumbnail(sheetId) : undefined,
    ...size,
    title: attr(element, 'title'),
  }
}

export const googlesheetsEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com'],
  googlesheetsResolveEmbed,
)
