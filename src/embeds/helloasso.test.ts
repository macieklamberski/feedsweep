import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { helloassoEmbedResolver, helloassoResolveEmbed } from './helloasso.js'

describe('helloassoResolveEmbed', () => {
  describe('happy paths', () => {
    it('should size the donate button', () => {
      const value =
        'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget-bouton'
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/formulaires/1',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget-bouton',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1',
        height: 70,
      }

      expect(helloassoResolveEmbed(value)).toEqual(expected)
    })

    it('should size the full form', () => {
      const value =
        'https://www.helloasso.com/associations/cine-club-du-quartier/evenements/nuit-du-court-metrage/widget'
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/evenements/nuit-du-court-metrage',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/evenements/nuit-du-court-metrage/widget',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/evenements/nuit-du-court-metrage',
        height: 750,
      }

      expect(helloassoResolveEmbed(value)).toEqual(expected)
    })

    it('should size the card', () => {
      const value =
        'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur/widget-vignette'
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/collectes/nouveau-projecteur',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur/widget-vignette',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur',
        width: 350,
        height: 450,
      }

      expect(helloassoResolveEmbed(value)).toEqual(expected)
    })

    it('should resolve a kind with no known size and state none', () => {
      const value =
        'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur/widget-compteur'
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/collectes/nouveau-projecteur',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur/widget-compteur',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur',
      }

      expect(helloassoResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the form page, which is a link and not a widget', () => {
      const value = 'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1'

      expect(helloassoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a form page whose last segment is not a widget kind', () => {
      const value = 'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/en'

      expect(helloassoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget path with a trailing segment', () => {
      const value =
        'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget/x'

      expect(helloassoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget-shaped path outside the associations route', () => {
      const value = 'https://www.helloasso.com/blog/cine-club-du-quartier/formulaires/1/widget'

      expect(helloassoResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/associations/cine-club-du-quartier/formulaires/1/widget'

      expect(helloassoResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('helloassoEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, helloassoEmbedResolver)

  describe('happy paths', () => {
    it('should keep the height the snippet states', async () => {
      const value = html`
        <iframe
          id="haWidget"
          allowtransparency="true"
          src="https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget-bouton"
          style="width: 100%; height: 70px; border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/formulaires/1',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget-bouton',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1',
        height: 70,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the height a publisher raised on the full form', async () => {
      const value = html`
        <iframe
          id="haWidget"
          allowtransparency="true"
          scrolling="auto"
          src="https://www.helloasso.com/associations/cine-club-du-quartier/adhesions/adhesion-2025/widget"
          style="width: 100%; height: 1200px; border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/adhesions/adhesion-2025',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/adhesions/adhesion-2025/widget',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/adhesions/adhesion-2025',
        height: 1200,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should size a button whose style states no height', async () => {
      const value = html`
        <iframe
          id="haWidgetButton"
          sandbox=""
          src="https://www.helloasso.com/associations/cine-club-du-quartier/paiements/album-du-festival/widget-bouton"
          style="border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/paiements/album-du-festival',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/paiements/album-du-festival/widget-bouton',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/paiements/album-du-festival',
        height: 70,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <iframe
          src="https://evil.test/www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('helloasso full form sized by its own messages', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  // The newer snippet drops the style height and sizes the frame from the form's messages, which
  // leaves the carrier stating only its width.
  it('should reserve the full form height for a frame that states only a width', async () => {
    const value = html`
      <iframe
        id="haWidget"
        allowtransparency="true"
        src="https://www.helloasso.com/associations/cine-club-du-quartier/evenements/nuit-du-court-metrage/widget"
        style="width: 100%; border: none;"
        onload="window.addEventListener('message', function(e) { document.getElementById('haWidget').height = e.data.height + 'px'; })"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="helloasso"
        data-embed-id="cine-club-du-quartier/evenements/nuit-du-court-metrage"
        data-embed-src="https://www.helloasso.com/associations/cine-club-du-quartier/evenements/nuit-du-court-metrage/widget"
        data-embed-url="https://www.helloasso.com/associations/cine-club-du-quartier/evenements/nuit-du-court-metrage"
        data-embed-height="750"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
