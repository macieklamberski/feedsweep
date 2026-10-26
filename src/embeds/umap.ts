import { parseUrl } from 'trousse'
import { attr } from '../utils/dom.js'
import { pickUrlParams, readOrigin } from '../utils/urls.js'
import { createMarkupEmbedResolver, readRepairedCarrierUrl } from '../utils/widgets.js'

const provider = 'umap'

const sizes = {
  map: { height: 300 },
}

// A map page, `/{lang}/map/{slug}_{id}`, under the interface language uMap prefixes every page
// with. The shape is the whole guard, since uMap runs on many instances and there is no host to
// key on: loosened, it claims any site's `/map/` page.
const mapPathRegex = /^\/([a-z]{2,3}(?:-[a-z]+)?)\/map\/([^/]+)_(\d+)$/

// The layers shown and the feature opened on load. The rest of the query sets the map's controls
// and panels, which are the reader's to choose.
const umapEmbedParams = ['datalayers', 'feature']

// A uMap map framed from any instance. The hash, `#{zoom}/{lat}/{lng}`, is the view the map opens
// on, so it travels with the src.
export const umapEmbedResolver = createMarkupEmbedResolver('iframe[src*="/map/"]', (element) => {
  const link = readRepairedCarrierUrl(element)
  const url = parseUrl(link)

  if (!url || !readOrigin(url)) {
    return
  }

  const match = mapPathRegex.exec(url.pathname)

  if (!match) {
    return
  }

  const [, lang, slug, mapId] = match
  // Every instance 301s `http:` to `https:`, and an https page blocks an `http:` frame.
  const page = `https://${url.hostname}/${lang}/map/${slug}_${mapId}`

  return {
    provider,
    // A map id is unique only within its instance, so the host travels in the id.
    id: `${url.hostname}/${mapId}`,
    src: `${page}${pickUrlParams(url, umapEmbedParams)}${url.hash}`,
    url: page,
    ...sizes.map,
    title: attr(element, 'title'),
  }
})
