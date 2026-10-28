import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { filterUrlQuery, isFileName, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'stackblitz'

// `blog.stackblitz.com` and `developer.stackblitz.com` are prose, and a project's running preview
// lives on `*.stackblitz.io`, so only the bare host and its `www.` spelling name a project.
const hosts = ['stackblitz.com', 'www.stackblitz.com']

const sizes = {
  // What the share dialog writes beside `width="100%"`.
  project: { height: 500 },
}

// The options that pick where the project opens and what it runs, looked up in any case as current
// instances do: the open file, which may repeat once per tab, the path the preview loads, and the
// npm script the project starts.
// See: https://developer.stackblitz.com/guides/integration/embedding.
const stackblitzEmbedParams = ['file', 'initialpath', 'startScript']

type StackblitzTarget = {
  id: string
  project: string
  query: string
}

// A project's path: `edit/{slug}`, whose retired `run/{slug}` spelling answers 404 while `edit`
// serves, or a GitHub repository's `github/{owner}/{repo}` with any ref and folder after it.
const readProject = (parsed: URL): Omit<StackblitzTarget, 'query'> | undefined => {
  const segments = getPathSegments(parsed)
  const [route, slug, repo] = segments

  if (isAnyOf(route, 'github') && slug && repo) {
    const path = segments.join('/')

    return { id: path, project: `https://stackblitz.com/${path}` }
  }

  if (!isAnyOf(route, ['edit', 'run']) || !slug) {
    return
  }

  // The enclosure probe offers every attachment on this host, and a file's name reads as a slug.
  if (isFileName(slug)) {
    return
  }

  return { id: slug, project: `https://stackblitz.com/edit/${slug}` }
}

const parseTarget = (value: URL | undefined): StackblitzTarget | undefined => {
  const parsed = parseUrlOnHosts(value, hosts, isHostOf)

  if (!parsed) {
    return
  }

  const project = readProject(parsed)

  if (!project) {
    return
  }

  const options = filterUrlQuery(parsed, (name) => isAnyOf(name, stackblitzEmbedParams))

  // `embed=1` is what the share dialog writes, and it opens the embed view at any width.
  return { ...project, query: `?embed=1${options.replace('?', '&')}` }
}

// StackBlitz's editor iframe, for a project or a GitHub repository.
export const stackblitzResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const target = parseTarget(url)

  if (!target) {
    return
  }

  return {
    provider,
    id: target.id,
    src: `${target.project}${target.query}`,
    url: target.project,
    ...sizes.project,
    title: attr(element, 'title'),
  }
}

export const stackblitzIframeEmbedResolver = createUrlEmbedResolver(hosts, stackblitzResolveEmbed)
