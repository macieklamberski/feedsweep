import { getPathSegments, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { filterUrlQuery } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'googlesheets'

// The publish routes, each minted as the carrier names it. A sheet that is published but not
// shared answers 401 on `/edit` and `/preview`.
const sheetRoutes = ['pubhtml', 'pubhtml/sheet']
const chartRoute = 'pubchart'

// Each of these draws the same page whether present or not, unlike `gid`, `range`, `widget`,
// `headers` and `chrome`.
const unseenParams = [
  'embedded',
  'output',
  'rm',
  'usp', // Share link tracker
]

const sheetHeight = 500
const chartHeight = 371

// `/spreadsheets/d/e/{token}` names a sheet published to the web and `/spreadsheets/d/{id}` names
// it by its Drive file id. A Workspace prefix, `/a/{domain}/`, and an account index, `/u/{n}/`,
// only pick the sign-in and serve the same sheet.
export const googlesheetsResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url)
  const pathSegments = getPathSegments(url)
  const productSegments = pathSegments[0] === 'a' ? pathSegments.slice(2) : pathSegments

  if (!parsed || productSegments[0] !== 'spreadsheets') {
    return
  }

  const segments = productSegments[1] === 'u' ? productSegments.slice(3) : productSegments.slice(1)

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
  const query = filterUrlQuery(parsed, (name) => !unseenParams.includes(name))

  return {
    provider,
    id: sheetId,
    src: `https://docs.google.com/spreadsheets/d/${sheetPath}/${route}${query}`,
    url: `https://docs.google.com/spreadsheets/d/${sheetPath}/pubhtml`,
    height: isChart ? chartHeight : sheetHeight,
    title: attr(element, 'title'),
  }
}

export const googlesheetsEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com'],
  googlesheetsResolveEmbed,
)
