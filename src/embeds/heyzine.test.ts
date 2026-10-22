import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { heyzineEmbedResolver, heyzineResolveEmbed } from './heyzine.js'

describe('heyzineResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the flipbook id off the viewer url', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should read the spelling without the extension', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should carry the page the fragment opens on', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c.html#page/4'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html#page/4',
        url: 'https://heyzine.com/flip-book/4db16f598c.html#page/4',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should lowercase the key of an uppercase id and keep its case in the url', () => {
      const value = 'https://heyzine.com/flip-book/4DB16F598C.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4DB16F598C.html',
        url: 'https://heyzine.com/flip-book/4DB16F598C.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should lowercase the key of a custom slug and keep its case in the url', () => {
      const value = 'https://heyzine.com/flip-book/ThroughThePrism'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'throughtheprism',
        src: 'https://heyzine.com/flip-book/ThroughThePrism',
        url: 'https://heyzine.com/flip-book/ThroughThePrism',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the apex host for the viewer on the www host', () => {
      const value = 'https://www.heyzine.com/flip-book/695b82b89c.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '695b82b89c',
        src: 'https://heyzine.com/flip-book/695b82b89c.html',
        url: 'https://heyzine.com/flip-book/695b82b89c.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the apex host for the viewer on the cdn host', () => {
      const value = 'https://cdn.heyzine.com/flip-book/695b82b89c.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '695b82b89c',
        src: 'https://heyzine.com/flip-book/695b82b89c.html',
        url: 'https://heyzine.com/flip-book/695b82b89c.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route that is not a flipbook', () => {
      const value = 'https://heyzine.com/pricing/4db16f598c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id outside the hexadecimal the viewer writes', () => {
      const value = 'https://heyzine.com/flip-book/zzzzzzzzzz.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id carrying a query separator', () => {
      const value = 'https://heyzine.com/flip-book/4db16f59=c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id longer than the ten characters the viewer writes', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c5.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id shorter than the ten characters the viewer writes', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a name that only ends in a hexadecimal id', () => {
      const value = 'https://heyzine.com/flip-book/x4db16f598c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the file host, where the flipbook PDF itself lives', () => {
      const value = 'https://cdnm.heyzine.com/files/uploaded/4db16f598c5a1f41c91c75d099f41ea4.pdf'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the PDF route that shares the flipbook segment', () => {
      const value =
        'https://cdn.heyzine.com/flip-book/pdf/4db16f598c5a1f41c91c75d099f41ea4b2c3d4e5.pdf'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a custom slug with the extension, which not every slug is served with', () => {
      const value = 'https://heyzine.com/flip-book/ThroughThePrism.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the flipbook route on a foreign host', () => {
      const value = 'https://evil.test/flip-book/695b82b89c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the flipbook route on a file host', () => {
      const value = 'https://cdnm.heyzine.com/flip-book/695b82b89c.html'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deeper path under the flipbook', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c/page/2'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read a custom slug that starts and ends in hexadecimal characters', () => {
      const value = 'https://heyzine.com/flip-book/Brochure2026'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'brochure2026',
        src: 'https://heyzine.com/flip-book/Brochure2026',
        url: 'https://heyzine.com/flip-book/Brochure2026',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should build a longer bare hexadecimal name as a slug, as written', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c5'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c5',
        src: 'https://heyzine.com/flip-book/4db16f598c5',
        url: 'https://heyzine.com/flip-book/4db16f598c5',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed slug as written, even if the player answers an error', () => {
      const value = 'https://heyzine.com/flip-book/Through%2FThePrism'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'through%2ftheprism',
        src: 'https://heyzine.com/flip-book/Through%2FThePrism',
        url: 'https://heyzine.com/flip-book/Through%2FThePrism',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a fragment that names no page', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c.html#comments'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed page as written, even if the player answers an error', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c.html#page/cover'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html#page/cover',
        url: 'https://heyzine.com/flip-book/4db16f598c.html#page/cover',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracking query', () => {
      const value = 'https://heyzine.com/flip-book/4db16f598c.html?utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('the custom domains of a paid account', () => {
    it('should read a hexadecimal id on an aflip.in account', () => {
      const value = 'https://arcandtype.aflip.in/1f38c904b4.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '1f38c904b4',
        src: 'https://arcandtype.aflip.in/1f38c904b4.html',
        url: 'https://arcandtype.aflip.in/1f38c904b4.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should read a custom slug on an aflip.in account', () => {
      const value = 'https://avon-rep.aflip.in/avon-campaign-14-brochure'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'avon-campaign-14-brochure',
        src: 'https://avon-rep.aflip.in/avon-campaign-14-brochure',
        url: 'https://avon-rep.aflip.in/avon-campaign-14-brochure',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the extension a custom slug was written with and drop it from the key', () => {
      const value = 'https://paigeweber.aflip.in/sisept25.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'sisept25',
        src: 'https://paigeweber.aflip.in/sisept25.html',
        url: 'https://paigeweber.aflip.in/sisept25.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the custom domain host for a book the apex does not serve', () => {
      const value = 'https://draftcraft.hflip.co/IFFInity-January-2026'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'iffinity-january-2026',
        src: 'https://draftcraft.hflip.co/IFFInity-January-2026',
        url: 'https://draftcraft.hflip.co/IFFInity-January-2026',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should read a custom slug on an hflip.co account', () => {
      const value = 'https://thegreatbubblebarrier.hflip.co/white-paper-plastic-recycling.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'white-paper-plastic-recycling',
        src: 'https://thegreatbubblebarrier.hflip.co/white-paper-plastic-recycling.html',
        url: 'https://thegreatbubblebarrier.hflip.co/white-paper-plastic-recycling.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should carry the page the fragment opens on', () => {
      const value = 'https://mcneelmiami.hflip.co/e31020cf2b.html#page/10'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'e31020cf2b',
        src: 'https://mcneelmiami.hflip.co/e31020cf2b.html#page/10',
        url: 'https://mcneelmiami.hflip.co/e31020cf2b.html#page/10',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the secret fragment a WordPress embed frame appends', () => {
      const value = 'https://eccsleurolinkmagazine.aflip.in/eurolinkeccsl#?secret=ur5igZCLXs'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'eurolinkeccsl',
        src: 'https://eccsleurolinkmagazine.aflip.in/eurolinkeccsl',
        url: 'https://eccsleurolinkmagazine.aflip.in/eurolinkeccsl',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracking query', () => {
      const value =
        'https://biggertable.aflip.in/4e86b7e3ab.html?utm_source=biggertable.blue&utm_medium=newsletter&utm_campaign=why-writing-to-your-elected-official-still-matters-in-2025'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4e86b7e3ab',
        src: 'https://biggertable.aflip.in/4e86b7e3ab.html',
        url: 'https://biggertable.aflip.in/4e86b7e3ab.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should mint https for an http carrier', () => {
      const value = 'http://sacommuter.aflip.in/breakmag4.html'
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'breakmag4',
        src: 'https://sacommuter.aflip.in/breakmag4.html',
        url: 'https://sacommuter.aflip.in/breakmag4.html',
        ratio: '490/600',
      }

      expect(heyzineResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore the account root, which holds no book', () => {
      const value = 'https://biggertable.aflip.in/'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deeper path under a book', () => {
      const value = 'https://paigeweber.aflip.in/sisept25.html/extra'

      expect(heyzineResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('heyzineEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, heyzineEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the height the snippet states in its style', async () => {
      const value = html`
        <iframe
          src="https://heyzine.com/flip-book/4db16f598c.html"
          class="fp-iframe"
          style="border: 1px solid lightgray; width: 100%; height: 400px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '4db16f598c',
        src: 'https://heyzine.com/flip-book/4db16f598c.html',
        url: 'https://heyzine.com/flip-book/4db16f598c.html',
        ratio: '490/600',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the custom slug carrier', async () => {
      const value = html`
        <iframe
          allowfullscreen="allowfullscreen"
          allow="clipboard-write"
          scrolling="no"
          class="fp-iframe"
          style="border: 1px solid lightgray; width: 100%; height: 600px;"
          src="https://heyzine.com/flip-book/ThroughThePrism"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'throughtheprism',
        src: 'https://heyzine.com/flip-book/ThroughThePrism',
        url: 'https://heyzine.com/flip-book/ThroughThePrism',
        ratio: '490/600',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the platform size over the box a custom domain carrier declares', async () => {
      const value = html`
        <iframe
          allowfullscreen="allowfullscreen"
          allow="clipboard-write"
          scrolling="no"
          class="fp-iframe"
          style="border: 1px solid lightgray; width: 100%; height: 600px;"
          src="https://sacommuter.aflip.in/breakmag4.html"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'breakmag4',
        src: 'https://sacommuter.aflip.in/breakmag4.html',
        url: 'https://sacommuter.aflip.in/breakmag4.html',
        ratio: '490/600',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the hflip.co carrier', async () => {
      const value = html`
        <iframe
          allow="clipboard-write"
          allowfullscreen="allowfullscreen"
          class="fp-iframe"
          scrolling="no"
          src="https://draftcraft.hflip.co/IFFInity-January-2026"
          style="border: 1px solid lightgray; height: 400px; width: 100%;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'iffinity-january-2026',
        src: 'https://draftcraft.hflip.co/IFFInity-January-2026',
        url: 'https://draftcraft.hflip.co/IFFInity-January-2026',
        ratio: '490/600',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the book title a WordPress embed frame writes', async () => {
      const value = html`
        <iframe
          class="wp-embedded-content"
          sandbox="allow-scripts"
          security="restricted"
          title="KEJOHANAN OLAHRAGA"
          scrolling="no"
          src="https://heyzine.com/flip-book/332f319f1d.html#?secret=RPscMMbaYl"
          data-secret="RPscMMbaYl"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: '332f319f1d',
        src: 'https://heyzine.com/flip-book/332f319f1d.html',
        url: 'https://heyzine.com/flip-book/332f319f1d.html',
        ratio: '490/600',
        title: 'KEJOHANAN OLAHRAGA',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the book title a WordPress embed frame writes on a custom domain', async () => {
      const value = html`
        <iframe
          class="wp-embedded-content"
          sandbox="allow-scripts"
          security="restricted"
          title="EUROLINK JUNE EDITION 2026"
          scrolling="no"
          src="https://eccsleurolinkmagazine.aflip.in/eurolinkeccsl#?secret=ur5igZCLXs"
          data-secret="ur5igZCLXs"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'eurolinkeccsl',
        src: 'https://eccsleurolinkmagazine.aflip.in/eurolinkeccsl',
        url: 'https://eccsleurolinkmagazine.aflip.in/eurolinkeccsl',
        ratio: '490/600',
        title: 'EUROLINK JUNE EDITION 2026',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the book title a hand-written frame states', async () => {
      const value = html`
        <iframe
          style="border: none; display: block;"
          title="AWDF Malawi Impact Story"
          src="https://heyzine.com/flip-book/AWDF_Malawi_Impact_Story"
          width="100%"
          height="600"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'heyzine',
        id: 'awdf_malawi_impact_story',
        src: 'https://heyzine.com/flip-book/AWDF_Malawi_Impact_Story',
        url: 'https://heyzine.com/flip-book/AWDF_Malawi_Impact_Story',
        ratio: '490/600',
        title: 'AWDF Malawi Impact Story',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://heyzine.com.evil.test/flip-book/4db16f598c.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the flipbook route on a foreign host', async () => {
      const value = '<iframe src="https://evil.test/flip-book/4db16f598c.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a custom domain path on a foreign host', async () => {
      const value = '<iframe src="https://evil.test/breakmag4.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('heyzine through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a flipbook PDF enclosure a file', async () => {
    const enclosures = [
      {
        url: 'https://cdn.heyzine.com/flip-book/pdf/4db16f598c5a1f41c91c75d099f41ea4b2c3d4e5.pdf',
        type: 'application/pdf',
      },
    ]
    const expected = html`
      <p>Body</p>
      <div
        data-enclosure=""
        data-file-type="application/pdf"
        data-file-name="4db16f598c5a1f41c91c75d099f41ea4b2c3d4e5.pdf"
        data-file-url="https://cdn.heyzine.com/flip-book/pdf/4db16f598c5a1f41c91c75d099f41ea4b2c3d4e5.pdf"
      ></div>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})

describeForEachParser('heyzineEmbedResolver in any case', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, heyzineEmbedResolver)

  it('should read the route word `flip-book` in capitals', async () => {
    const value = '<iframe src="https://heyzine.com/FLIP-BOOK/4db16f598c.html"></iframe>'
    const expected = {
      provider: 'heyzine',
      id: '4db16f598c',
      src: 'https://heyzine.com/flip-book/4db16f598c.html',
      url: 'https://heyzine.com/flip-book/4db16f598c.html',
      ratio: '490/600',
    }

    expect(await extract(value)).toEqual(expected)
  })
})
