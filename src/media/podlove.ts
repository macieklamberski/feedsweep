import { isAnyOf } from 'trousse'
import type { MediaResolver } from '../types.js'
import { findConfigScript } from '../utils/dom.js'

// The script inlines the config as podlovePlayerCache.add([{data: {audio: [{url, mimeType}]}}]).
const configRegex = /^podlovePlayerCache\.add\(\s*(\[[\s\S]*?\])\s*\)/

// The Web Player plugin passes the episode itself, podlovePlayer(el, {audio, title}, "https://…"),
// and caches null in its place. The spelling podlovePlayer('#el', 'https://…/wp-json/…') inlines
// no episode.
const episodeRegex = /^podlovePlayer\(\s*\w+\s*,\s*(\{[\s\S]*\})\s*,\s*"[^"]*"\s*\)/

// Podlove offers the same episode in several formats and the order is the publisher's, not a
// ranking. Safari plays neither ogg nor opus, so a config that lists those first would hand
// some readers a file they cannot play while an mp3 sat second in the same array.
const preferredMimeTypes = ['audio/mpeg', 'audio/mp4']

// The episode also names an episode and a show poster, which an <audio> has no attribute for.
type PodloveEpisode = {
  audio?: Array<{ url?: string; mimeType?: string }>
  title?: string
}

type PodloveConfig = Array<{ data?: PodloveEpisode } | null>

const parseJson = <T>(raw: string | undefined): T | undefined => {
  if (!raw) {
    return
  }

  try {
    return JSON.parse(raw)
  } catch {}
}

// Each regex is anchored to the first call, since trying it from every call in a script with
// thousands of them and no closing bracket takes seconds.
const matchFirstCall = (text: string, call: string, regex: RegExp): string | undefined => {
  const start = text.indexOf(call)

  if (start === -1) {
    return
  }

  return text.slice(start).match(regex)?.[1]
}

const readEpisode = (script: Element): PodloveEpisode | undefined => {
  const text = script.textContent ?? ''
  const config = parseJson<PodloveConfig>(
    matchFirstCall(text, 'podlovePlayerCache.add(', configRegex),
  )
  const cached = config?.[0]?.data

  if (cached) {
    return cached
  }

  return parseJson<PodloveEpisode>(matchFirstCall(text, 'podlovePlayer(', episodeRegex))
}

// Podlove Publisher ships an episode as custom elements a sibling script builds into a player.
export const podloveMediaResolver: MediaResolver = {
  kind: 'media',
  selector: 'div.podlove-web-player',
  extract: (element) => {
    const script = findConfigScript(element)
    const data = script ? readEpisode(script) : undefined

    if (!data) {
      return
    }

    const files = data.audio?.filter(
      (audio): audio is { url: string; mimeType: string } =>
        audio.url !== undefined && audio.mimeType?.startsWith('audio/') === true,
    )
    const file = files?.find((audio) => isAnyOf(audio.mimeType, preferredMimeTypes)) ?? files?.[0]
    const source = file?.url

    if (!source) {
      return
    }

    return {
      tag: 'audio',
      src: source,
      title: data.title,
    }
  },
}
