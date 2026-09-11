import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// A file id is url-safe base64, and nothing else may reach a minted path.
const fileIdRegex = /^[\w-]+$/

// `/file/d/{id}/preview` frames the file and `/file/d/{id}/view` is its page. A folder on
// `/drive/folders` or `/embeddedfolderview` is a listing, not a file, and stays unclaimed.
export const googledriveResolveEmbed: ResolveEmbed = (url) => {
  const segments = getPathSegments(url)
  const fileId = segments[0] === 'file' && segments[1] === 'd' ? segments[2] : undefined

  if (!fileId || !fileIdRegex.test(fileId)) {
    return
  }

  return {
    provider: 'googledrive',
    id: fileId,
    src: `https://drive.google.com/file/d/${fileId}/preview`,
    url: `https://drive.google.com/file/d/${fileId}/view`,
    thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w640`,
  }
}

export const googledriveEmbedResolver = createUrlEmbedResolver(
  ['drive.google.com'],
  googledriveResolveEmbed,
)
