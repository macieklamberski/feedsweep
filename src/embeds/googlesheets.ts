import { getPathSegments, isAnyOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr, getElementDimensions } from '../utils/dom.js'
import { composeQuery, pickQueryParams, pickUrlParams } from '../utils/urls.js'
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

const sheetHeight = 500
const chartHeight = 371

// A frame can name the tab it opens on in the fragment, as `#gid={id}`.
const readTabFragment = (url: string): string => {
  const hash = parseUrl(url)?.hash ?? ''
  const query = composeQuery(pickQueryParams(hash.slice(1), ['gid']))

  return query.replace('?', '#')
}

// `/spreadsheets/d/e/{token}` names a sheet published to the web and `/spreadsheets/d/{id}` names
// it by its Drive file id. An account index, `/u/{n}/`, only picks the sign-in and serves the
// same sheet.
export const googlesheetsResolveEmbed: ResolveEmbed = (url, element) => {
  const pathSegments = getPathSegments(url)

  if (!isAnyOf(pathSegments[0], 'spreadsheets')) {
    return
  }

  const segments = isAnyOf(pathSegments[1], 'u') ? pathSegments.slice(3) : pathSegments.slice(1)

  if (!isAnyOf(segments[0], 'd')) {
    return
  }

  const isPublished = isAnyOf(segments[1], 'e')
  const sheetId = segments[isPublished ? 2 : 1]
  const route = segments
    .slice(isPublished ? 3 : 2)
    .join('/')
    .toLowerCase()
  const isChart = route === chartRoute
  // A publish token answers 404 on `/edit` and `/preview`.
  const isShared = !isPublished && sharedRoutes.includes(route)

  if (!sheetId) {
    return
  }

  if (!isChart && !isShared && !sheetRoutes.includes(route)) {
    return
  }

  const sheetPath = isPublished ? `e/${sheetId}` : sheetId
  const frameRoute = isShared ? 'preview' : route
  const query = pickUrlParams(url, isChart ? chartParams : sheetParams)
  const fragment = readTabFragment(url)
  // A chart draws at its own pixel size and never scales, and its carrier declares that size.
  const declaredHeight = element ? getElementDimensions(element).height : undefined
  const height = isChart ? (declaredHeight ?? chartHeight) : sheetHeight

  return {
    provider,
    id: sheetId,
    src: `https://docs.google.com/spreadsheets/d/${sheetPath}/${frameRoute}${query}${fragment}`,
    url: `https://docs.google.com/spreadsheets/d/${sheetPath}/${isShared ? 'edit' : 'pubhtml'}`,
    thumbnail: isShared ? composeDriveThumbnail(sheetId) : undefined,
    height,
    title: attr(element, 'title'),
  }
}

export const googlesheetsEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com'],
  googlesheetsResolveEmbed,
)
