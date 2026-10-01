import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const figshareHosts = ['figshare.com']
const widgetPathRegex = /^\/articles\/([^/]+)\/embed\/?$/

// The widget host answers the same shell for any article id. `api.figshare.com/v2/articles/{id}`
// answers 200 with the title, the authors, the files and a poster for a real id and 404 for a
// fabricated one, with no key.
const figshareResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, figshareHosts)
  const articleId = parsed?.pathname.match(widgetPathRegex)?.[1]

  if (!parsed || !articleId) {
    return
  }

  // No `url`: the article page lives on its institutional portal, which only the API names.
  return {
    provider: 'figshare',
    id: articleId,
    src: `https://widgets.figshare.com/articles/${articleId}/embed`,
    ratio: '568/351',
  }
}

// figshare's article widget iframe at /articles/{id}/embed.
export const figshareEmbedResolver = createUrlEmbedResolver(figshareHosts, figshareResolveEmbed)
