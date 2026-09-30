import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { helloassoEmbedResolver, helloassoResolveEmbed } from './helloasso.js'

describe('helloassoResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the full form in place of the donate button', () => {
      const value =
        'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget-bouton'
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/formulaires/1',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1',
        height: 750,
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

    it('should mint the full form in place of the card', () => {
      const value =
        'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur/widget-vignette'
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/collectes/nouveau-projecteur',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur/widget',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur',
        height: 750,
      }

      expect(helloassoResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the full form in place of any other variant', () => {
      const value =
        'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur/widget-compteur'
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/collectes/nouveau-projecteur',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur/widget',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/collectes/nouveau-projecteur',
        height: 750,
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
    it("should give the form its own height over the button's box", async () => {
      const value = html`
        <iframe
          id="haWidgetButton"
          allowtransparency="true"
          src="https://www.helloasso.com/associations/passion-vtt-venelles/collectes/le-peloton-des-partenaires/widget-bouton"
          style="width: 100%; height: 70px; border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'passion-vtt-venelles/collectes/le-peloton-des-partenaires',
        src: 'https://www.helloasso.com/associations/passion-vtt-venelles/collectes/le-peloton-des-partenaires/widget',
        url: 'https://www.helloasso.com/associations/passion-vtt-venelles/collectes/le-peloton-des-partenaires',
        height: 750,
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

    it("should give the form its own height over the card's box", async () => {
      const value = html`
        <iframe
          src="https://www.helloasso.com/associations/frane/adhesions/devenez-adherent-individuel-a-la-frane-3/widget-vignette"
          id="haWidget"
          style="width: 350px; height: 450px; border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'frane/adhesions/devenez-adherent-individuel-a-la-frane-3',
        src: 'https://www.helloasso.com/associations/frane/adhesions/devenez-adherent-individuel-a-la-frane-3/widget',
        url: 'https://www.helloasso.com/associations/frane/adhesions/devenez-adherent-individuel-a-la-frane-3',
        height: 750,
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
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/paiements/album-du-festival/widget',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/paiements/album-du-festival',
        height: 750,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should size a full form whose style states only a width', async () => {
      const value = html`
        <iframe
          id="haWidget"
          allowtransparency="true"
          src="https://www.helloasso.com/associations/cine-club-du-quartier/evenements/nuit-du-court-metrage/widget"
          style="width: 100%; border: none;"
          onload="window.addEventListener('message', function(e) { document.getElementById('haWidget').height = e.data.height + 'px'; })"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'helloasso',
        id: 'cine-club-du-quartier/evenements/nuit-du-court-metrage',
        src: 'https://www.helloasso.com/associations/cine-club-du-quartier/evenements/nuit-du-court-metrage/widget',
        url: 'https://www.helloasso.com/associations/cine-club-du-quartier/evenements/nuit-du-court-metrage',
        height: 750,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/associations/cine-club-du-quartier/formulaires/1/widget"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('helloasso widget through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should drop the query the carrier wrote', async () => {
    const value = html`
      <iframe
        id="haWidget"
        allowtransparency="true"
        src="https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget-bouton?utm_source=newsletter"
        style="width: 100%; height: 70px; border: none;"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="helloasso"
        data-embed-id="cine-club-du-quartier/formulaires/1"
        data-embed-src="https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1/widget"
        data-embed-url="https://www.helloasso.com/associations/cine-club-du-quartier/formulaires/1"
        data-embed-height="750"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
