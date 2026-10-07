import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { extractGeniallyViewId, geniallyEmbedResolver, geniallyResolveEmbed } from './genially.js'

const viewId = '60294f8b2ec856159ae0baa5'

describe('extractGeniallyViewId', () => {
  it('should read the id from the modern host', () => {
    const value = `https://view.genially.com/${viewId}`

    expect(extractGeniallyViewId(value)).toBe(viewId)
  })

  it('should read the id from the legacy host', () => {
    const value = `https://view.genial.ly/${viewId}`

    expect(extractGeniallyViewId(value)).toBe(viewId)
  })

  // WordPress embeds it with the fragment its own embed handler adds.
  it('should read the id from a url carrying a secret fragment', () => {
    const value = `https://view.genial.ly/${viewId}#?secret=5n2fsT8hDN`

    expect(extractGeniallyViewId(value)).toBe(viewId)
  })

  it('should read the id from a /view/ path', () => {
    const value = `https://genially.com/view/${viewId}`

    expect(extractGeniallyViewId(value)).toBe(viewId)
  })

  it('should read the id from the retired View/Index route', () => {
    const value = 'https://www.genial.ly/View/Index/59cc0e1689ef4914f441596a'

    expect(extractGeniallyViewId(value)).toBe('59cc0e1689ef4914f441596a')
  })

  it('should return undefined for a View/Index route spelled in mixed case', () => {
    const value = 'https://www.genial.ly/View/index/59cc0e1689ef4914f441596a'

    expect(extractGeniallyViewId(value)).toBeUndefined()
  })

  it('should return undefined for a View route with another second word', () => {
    const value = 'https://www.genial.ly/View/Embed/59cc0e1689ef4914f441596a'

    expect(extractGeniallyViewId(value)).toBeUndefined()
  })

  it('should return undefined for an Index route under another first word', () => {
    const value = 'https://www.genial.ly/Vista/Index/59cc0e1689ef4914f441596a'

    expect(extractGeniallyViewId(value)).toBeUndefined()
  })

  it('should return undefined for a genially url naming no view', () => {
    const value = 'https://genially.com/pricing'

    expect(extractGeniallyViewId(value)).toBeUndefined()
  })

  it('should return undefined for an id that is not the documented shape', () => {
    const value = 'https://view.genially.com/not-a-view-id'

    expect(extractGeniallyViewId(value)).toBeUndefined()
  })

  it('should return undefined for a hex segment with a leading extra character', () => {
    const value = `https://view.genially.com/0${viewId}`

    expect(extractGeniallyViewId(value)).toBeUndefined()
  })

  it('should return undefined for a hex segment with a trailing extra character', () => {
    const value = `https://view.genially.com/${viewId}0`

    expect(extractGeniallyViewId(value)).toBeUndefined()
  })

  it('should return undefined for a view id carrying an encoded slash', () => {
    const value = 'https://view.genially.com/60294f8b2ec8%2f59ae0baa5'

    expect(extractGeniallyViewId(value)).toBeUndefined()
  })

  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(extractGeniallyViewId(value)).toBeUndefined()
  })
})

describe('geniallyResolveEmbed', () => {
  // The legacy host 301s to the modern one carrying the same id, so the hop is skippable.
  it('should mint the modern host from a legacy url', () => {
    const value = `https://view.genial.ly/${viewId}`
    const expected: EmbedResolverResult = {
      provider: 'genially',
      id: viewId,
      src: `https://view.genially.com/${viewId}`,
      ratio: '16/9',
    }

    expect(geniallyResolveEmbed(value)).toEqual(expected)
  })

  it('should leave a modern url on its own host', () => {
    const value = `https://view.genially.com/${viewId}`
    const expected: EmbedResolverResult = {
      provider: 'genially',
      id: viewId,
      src: `https://view.genially.com/${viewId}`,
      ratio: '16/9',
    }

    expect(geniallyResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a genially url naming no view', () => {
    const value = 'https://genially.com/pricing'

    expect(geniallyResolveEmbed(value)).toBeUndefined()
  })
})

describeForEachParser('geniallyEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, geniallyEmbedResolver)

  describe('happy paths', () => {
    it('should claim a view iframe on the modern host', async () => {
      const value = html`
        <iframe
          src="https://view.genially.com/60294f8b2ec856159ae0baa5"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'genially',
        id: '60294f8b2ec856159ae0baa5',
        src: 'https://view.genially.com/60294f8b2ec856159ae0baa5',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Neither exported function checks the host, so the legacy domain reaching the resolver at
    // all is what the second host list entry buys.
    it('should claim a view iframe on the legacy host', async () => {
      const value = html`
        <iframe
          src="https://view.genial.ly/60294f8b2ec856159ae0baa5"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'genially',
        id: '60294f8b2ec856159ae0baa5',
        src: 'https://view.genially.com/60294f8b2ec856159ae0baa5',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should claim a view iframe on the retired View/Index route', async () => {
      const value = html`
        <iframe
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          src="https://www.genial.ly/View/Index/59cc0e1689ef4914f441596a"
          width="1600"
          height="900"
          frameborder="0"
          scrolling="yes"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'genially',
        id: '59cc0e1689ef4914f441596a',
        src: 'https://view.genially.com/59cc0e1689ef4914f441596a',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the deck name off the stated title', async () => {
      const value = html`
        <iframe
          title="Raisonnement argumenté"
          src="https://view.genially.com/60294f8b2ec856159ae0baa5"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'genially',
        id: '60294f8b2ec856159ae0baa5',
        src: 'https://view.genially.com/60294f8b2ec856159ae0baa5',
        ratio: '16/9',
        title: 'Raisonnement argumenté',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // The id is read off the path with no host check of its own, so the host list is the only
    // thing between a lookalike domain and a minted Genially url.
    it('should ignore a lookalike host suffixing the view domain', async () => {
      const value =
        '<iframe src="https://view.genially.com.evil.test/60294f8b2ec856159ae0baa5"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the size a publisher states', () => {
    // Genially presentations are authored at whatever canvas the author picked, and the carrier's
    // box is not read, so every presentation states 16:9.
    it('should state the platform size over the box the carrier states', async () => {
      const value = html`
        <iframe
          src="https://view.genially.com/60294f8b2ec856159ae0baa5"
          width="1200"
          height="675"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'genially',
        id: '60294f8b2ec856159ae0baa5',
        src: 'https://view.genially.com/60294f8b2ec856159ae0baa5',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
