import { isHttpUrl, parseUrl } from 'trousse'
import { attr } from '../utils/dom.js'
import { pickUrlParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, readCarrierUrl } from '../utils/widgets.js'

const provider = 'umap'

// A map page, `/{lang}/map/{slug}_{id}`, under the interface language uMap prefixes every page
// with. The shape is the whole guard, since uMap runs on many instances and there is no host to
// key on: loosened, it claims any site's `/map/` page.
const mapPathRegex = /^\/([a-z]{2,3}(?:-[a-z]+)?)\/map\/([^/]+)_(\d+)$/

// The layers shown and the feature opened on load. The rest of the query sets the map's controls
// and panels, which are the reader's to choose.
const umapEmbedParams = ['datalayers', 'feature']

const mapHeight = 300

// A uMap map framed from any instance. The hash, `#{zoom}/{lat}/{lng}`, is the view the map opens
// on, so it travels with the src.
export const umapEmbedResolver = createMarkupEmbedResolver('iframe[src*="/map/"]', (element) => {
  const link = readCarrierUrl(element)
  const url = parseUrl(link)

  // A javascript: url parses with a matching pathname, and its origin is the string null.
  if (!url || !isHttpUrl(url)) {
    return
  }

  const match = mapPathRegex.exec(url.pathname)

  if (!match) {
    return
  }

  const [, lang, slug, mapId] = match
  const page = `${url.origin}/${lang}/map/${slug}_${mapId}`

  return {
    provider,
    // A map id is unique only within its instance, so the host travels in the id.
    id: `${url.host}/${mapId}`,
    src: `${page}${pickUrlParams(link, umapEmbedParams)}${url.hash}`,
    url: page,
    height: mapHeight,
    title: attr(element, 'title'),
  }
})
