import { parseUrlOnHosts } from '../utils/urls.js'

// A cast id is base62, and nothing else may reach a minted path.
const loaderPathRegex = /^\/a\/([A-Za-z0-9]+)\.js$/
const pagePathRegex = /^\/a\/([A-Za-z0-9]+)$/

// Older casts render as a .png rather than an .svg.
const renderPathRegex = /\/a\/([A-Za-z0-9]+)\.(?:svg|png)/

const readCastId = (url: string | undefined, regex: RegExp): string | undefined => {
  return parseUrlOnHosts(url, 'asciinema.org')?.pathname.match(regex)?.[1]
}

export const extractLoaderCastId = (url: string | undefined): string | undefined => {
  return readCastId(url, loaderPathRegex)
}

export const extractPageCastId = (url: string | undefined): string | undefined => {
  return readCastId(url, pagePathRegex)
}

export const extractRenderCastId = (url: string | undefined): string | undefined => {
  return readCastId(url, renderPathRegex)
}

// asciinema publishes a static SVG render of every cast beside the recording's page, and a
// fabricated id answers 404 on both.
export const composeCastImageUrl = (castId: string): string => {
  return `https://asciinema.org/a/${castId}.svg`
}

export const composeCastUrl = (castId: string): string => {
  return `https://asciinema.org/a/${castId}`
}
