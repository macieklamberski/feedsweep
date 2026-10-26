import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'figshare'

const sizes = { article: { ratio: '568/351' } }

const figshareHosts = ['figshare.com']
const widgetPathRegex = /^\/articles\/([^/]+)\/embed\/?$/i

// The widget host answers the same shell for any article id. `api.figshare.com/v2/articles/{id}`
// answers 200 with the title, the authors, the files and a poster for a real id and 404 for a
// fabricated one, with no key.
const figshareResolveEmbed: ResolveUrlEmbed = (url) => {
  const articleId = url.pathname.match(widgetPathRegex)?.[1]

  if (!articleId) {
    return
  }

  // No `url`: the article page lives on its institutional portal, which only the API names.
  return {
    provider,
    id: articleId,
    src: `https://widgets.figshare.com/articles/${articleId}/embed`,
    ...sizes.article,
  }
}

// figshare's article widget iframe at /articles/{id}/embed.
export const figshareEmbedResolver = createUrlEmbedResolver(figshareHosts, figshareResolveEmbed)
