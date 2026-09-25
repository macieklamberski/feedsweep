// A cast id is base62, and nothing else may reach a minted path.
const castIdRegex = /asciinema\.org\/a\/([A-Za-z0-9]+)(?:\.(?:js|svg))?(?:[?#]|$)/

export const extractCastId = (url: string | undefined): string | undefined => {
  return url?.match(castIdRegex)?.[1]
}

// asciinema publishes a static SVG render of every cast beside the recording's page, and a
// fabricated id answers 404 on both.
export const composeCastImageUrl = (castId: string): string => {
  return `https://asciinema.org/a/${castId}.svg`
}

export const composeCastUrl = (castId: string): string => {
  return `https://asciinema.org/a/${castId}`
}
