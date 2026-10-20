import { decodeSegment, getPathSegments } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'googledrive'

// A link-shared file from before 2021 answers only with its resource key.
const accessParams = ['resourcekey']

// The audio preview draws a card 206 tall at every width, and the virus-scan dialog it shows
// for a file over 100 MB is 252 tall.
const audioPlayerHeight = 252

// `/open?id={id}` redirects a file to its page and a folder to its listing, so only an audio
// type says the id is a file.
const readFileId = (
  segments: Array<string>,
  url: string,
  isAudio?: boolean,
): string | undefined => {
  if (segments[0] === 'file' && segments[1] === 'd') {
    return segments[2]
  }

  if (isAudio && segments.length === 1 && segments[0] === 'open') {
    return parseUrlOnHosts(url, 'drive.google.com')?.searchParams.get('id') ?? undefined
  }
}

const googledriveHosts = [
  'docs.google.com', // Legacy spelling of the same file frame
  'drive.google.com',
]

// `/file/d/{id}/preview` frames the file and `/file/d/{id}/view` is its page. A folder on
// `/drive/folders` or `/embeddedfolderview` is a listing, not a file, and stays unclaimed.
// A Workspace prefix, `/a/{domain}/`, only picks the sign-in and serves the same file.
export const googledriveResolveEmbed: ResolveEmbed = (url, element) => {
  const pathSegments = getPathSegments(url)
  const segments = pathSegments[0] === 'a' ? pathSegments.slice(2) : pathSegments
  const isAudio = attr(element, 'type')?.startsWith('audio/')
  const fileId = readFileId(segments, url, isAudio)

  if (!fileId) {
    return
  }

  const src = `https://drive.google.com/file/d/${fileId}/preview`
  const accessQuery = pickUrlParams(url, accessParams)

  // The page and the thumbnail refuse a keyed file without its key, which stays in `src` alone.
  if (accessQuery) {
    return {
      provider,
      id: fileId,
      src: `${src}${accessQuery}`,
      height: isAudio ? audioPlayerHeight : undefined,
      ratio: isAudio ? undefined : '4/3',
    }
  }

  // Drive renders no thumbnail for an audio file.
  if (isAudio) {
    return {
      provider,
      id: fileId,
      src,
      url: `https://drive.google.com/file/d/${fileId}/view`,
      height: audioPlayerHeight,
    }
  }

  return {
    provider,
    id: fileId,
    src,
    url: `https://drive.google.com/file/d/${fileId}/view`,
    thumbnail: `https://drive.google.com/thumbnail${composeQuery({ id: decodeSegment(fileId) ?? fileId, sz: 'w640' })}`,
    ratio: '4/3',
  }
}

export const googledriveEmbedResolver = createUrlEmbedResolver(
  googledriveHosts,
  googledriveResolveEmbed,
)

export const googledriveRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
