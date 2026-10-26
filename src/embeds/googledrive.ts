import {
  composeQuery,
  decodeSegment,
  encodePathSegment,
  getPathSegments,
  getQueryParam,
  isAnyOf,
} from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'googledrive'

// A link-shared file from before 2021 answers only with its resource key.
const accessParams = ['resourcekey']

const sizes = {
  // The audio preview draws a card 206 tall at every width, and the virus-scan dialog it shows
  // for a file over 100 MB is 252 tall.
  audio: { height: 252 },
  file: { ratio: '4/3' },
}

// `/open?id={id}` redirects a file to its page and a folder to its listing, so only an audio
// type says the id is a file.
const readFileId = (segments: Array<string>, url: URL, isAudio?: boolean): string | undefined => {
  const [route, prefix, fileId] = segments

  if (isAnyOf(route, 'file') && isAnyOf(prefix, 'd')) {
    return fileId
  }

  // A query id comes out decoded, and it goes into a path beside a path id's raw spelling.
  if (isAudio && segments.length === 1 && isAnyOf(route, 'open')) {
    const drive = parseUrlOnHosts(url, 'drive.google.com')
    const queryId = getQueryParam(drive?.searchParams, 'id') ?? ''

    return encodePathSegment(queryId)
  }
}

const hosts = [
  'docs.google.com', // Legacy spelling of the same file frame
  'drive.google.com',
]

// The path segments of a Google Docs-family url past a Workspace prefix, `/a/{domain}/`, which
// only picks the sign-in and serves the same item.
export const getPathSegmentsWithoutWorkspace = (url: URL): Array<string> => {
  const pathSegments = getPathSegments(url)

  return isAnyOf(pathSegments[0], 'a') ? pathSegments.slice(2) : pathSegments
}

// The thumbnail of a link-shared Drive file, by its file id.
export const composeDriveThumbnail = (fileId: string): string => {
  return `https://drive.google.com/thumbnail${composeQuery({ id: decodeSegment(fileId) ?? fileId, sz: 'w640' })}`
}

// `/file/d/{id}/preview` frames the file and `/file/d/{id}/view` is its page. A folder on
// `/drive/folders` or `/embeddedfolderview` is a listing, not a file, and stays unclaimed.
export const googledriveResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const segments = getPathSegmentsWithoutWorkspace(url)
  const isAudio = attr(element, 'type')?.toLowerCase().startsWith('audio/')
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
      ...(isAudio ? sizes.audio : sizes.file),
    }
  }

  // Drive renders no thumbnail for an audio file.
  if (isAudio) {
    return {
      provider,
      id: fileId,
      src,
      url: `https://drive.google.com/file/d/${fileId}/view`,
      ...sizes.audio,
    }
  }

  return {
    provider,
    id: fileId,
    src,
    url: `https://drive.google.com/file/d/${fileId}/view`,
    thumbnail: composeDriveThumbnail(fileId),
    ...sizes.file,
  }
}

export const googledriveEmbedResolver = createUrlEmbedResolver(hosts, googledriveResolveEmbed)

export const googledriveRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
