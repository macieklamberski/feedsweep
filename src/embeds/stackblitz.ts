import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { filterUrlQuery, isFileName, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `blog.stackblitz.com` and `developer.stackblitz.com` are prose, and a project's running preview
// lives on `*.stackblitz.io`, so only the bare host and its `www.` spelling name a project.
const stackblitzHosts = ['stackblitz.com', 'www.stackblitz.com']

// What the share dialog writes beside `width="100%"`.
const defaultProjectHeight = 500

// The options that pick where the project opens, looked up in any case as current instances do:
// the open file, which may repeat once per tab, and the path the preview loads.
// See: https://developer.stackblitz.com/guides/integration/embedding.
const stackblitzEmbedParams = ['file', 'initialpath']

type StackblitzTarget = {
  id: string
  query: string
}

const parseTarget = (value: string | undefined): StackblitzTarget | undefined => {
  const parsed = parseUrl(value ?? '', placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, stackblitzHosts)) {
    return
  }

  const [first, second] = getPathSegments(parsed)

  // /github/{owner}/{repo} renders, but its id is a key the oEmbed endpoint answers 404 on.
  if ((first !== 'edit' && first !== 'run') || !second) {
    return
  }

  // The enclosure probe offers every attachment on this host, and a file's name reads as a slug.
  if (isFileName(second)) {
    return
  }

  const options = filterUrlQuery(parsed, (name) => isAnyOf(name, stackblitzEmbedParams))

  // `embed=1` is what the share dialog writes, and it opens the embed view at any width.
  return { id: second, query: `?embed=1${options.replace('?', '&')}` }
}

// StackBlitz's editor iframe, whose retired /run/{slug} route answers 404 while /edit/ serves.
export const stackblitzResolveEmbed: ResolveEmbed = (url, element) => {
  const target = parseTarget(url)

  if (!target) {
    return
  }

  const title = attr(element, 'title')
  const project = `https://stackblitz.com/edit/${target.id}`

  return {
    provider: 'stackblitz',
    id: target.id,
    src: `${project}${target.query}`,
    url: project,
    height: defaultProjectHeight,
    title,
  }
}

export const stackblitzIframeEmbedResolver = createUrlEmbedResolver(
  ['stackblitz.com'],
  stackblitzResolveEmbed,
)
