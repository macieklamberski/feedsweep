import { decodeSegment, getPathSegments } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { composeQuery, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'googledrive'

// A link-shared file from before 2021 answers only with its resource key.
const accessParams = ['resourcekey']

const googledriveHosts = [
  'docs.google.com', // Legacy spelling of the same file frame
  'drive.google.com',
]

// `/file/d/{id}/preview` frames the file and `/file/d/{id}/view` is its page. A folder on
// `/drive/folders` or `/embeddedfolderview` is a listing, not a file, and stays unclaimed.
export const googledriveResolveEmbed: ResolveEmbed = (url) => {
  const segments = getPathSegments(url)
  const fileId = segments[0] === 'file' && segments[1] === 'd' ? segments[2] : undefined

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
      ratio: '4/3',
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
