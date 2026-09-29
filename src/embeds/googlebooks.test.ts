import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { googlebooksEmbedResolver } from './googlebooks.js'

const malformedLocales = ['en%26output%3Dtext', 'e%2Fn', 'en-a%2Fb']

describeForEachParser('googlebooksEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, googlebooksEmbedResolver)

  describe('happy paths', () => {
    it('should keep the page the publisher anchored the volume on', async () => {
      const value = html`
        <iframe
          frameborder="0"
          scrolling="no"
          style="border:0px"
          src="https://books.google.com/books?id=Fp1ct-bKYdcC&lpg=PA433&pg=PA433&output=embed"
          width="500"
          height="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'Fp1ct-bKYdcC',
        src: 'https://books.google.com/books?id=Fp1ct-bKYdcC&pg=PA433&lpg=PA433&output=embed',
        url: 'https://books.google.com/books?id=Fp1ct-bKYdcC&pg=PA433&lpg=PA433',
        thumbnail:
          'https://books.google.com/books/content?id=Fp1ct-bKYdcC&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a volume framed with no page anchor', async () => {
      const value = html`
        <iframe
          src="https://books.google.com/books?id=pz5KDwAAQBAJ&output=embed"
          width="900"
          height="700"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'pz5KDwAAQBAJ',
        src: 'https://books.google.com/books?id=pz5KDwAAQBAJ&output=embed',
        url: 'https://books.google.com/books?id=pz5KDwAAQBAJ',
        thumbnail:
          'https://books.google.com/books/content?id=pz5KDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
        width: 900,
        height: 700,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value = html`
        <iframe src="https://books.google.com.evil.test/books?id=Fp1ct-bKYdcC&output=embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a host that only ends in the viewer host', async () => {
      const value = html`
        <iframe src="https://xbooks.google.com/books?id=Fp1ct-bKYdcC&output=embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the viewer host in its query', async () => {
      const value = html`
        <iframe src="https://evil.test/books?id=Fp1ct-bKYdcC&output=embed&books.google."></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a src that does not parse as a url', async () => {
      const value = html`
        <iframe src="https://books.google.com:99999/books?id=Fp1ct-bKYdcC&output=embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a frame naming no volume', async () => {
      const value = html`<iframe src="https://books.google.com/books?output=embed"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should keep the search terms the viewer highlights and drop the tracking', async () => {
      const value = html`
        <iframe src="https://books.google.com/books?id=IpNDAQAAMAAJ&lpg=PA4&ots=PuqcFEggzv&dq=Loyalsock%20Boom%20Company&pg=PA4&output=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'IpNDAQAAMAAJ',
        src: 'https://books.google.com/books?id=IpNDAQAAMAAJ&pg=PA4&lpg=PA4&dq=Loyalsock+Boom+Company&output=embed',
        url: 'https://books.google.com/books?id=IpNDAQAAMAAJ&pg=PA4&lpg=PA4',
        thumbnail:
          'https://books.google.com/books/content?id=IpNDAQAAMAAJ&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the terms of an in-volume search', async () => {
      const value = html`
        <iframe src="https://books.google.com/books?id=ELieXMxR1h4C&amp;lpg=PA154&amp;vq=antirival&amp;dq=Weber%2C%20S.%20(2004)%2C%20The%20Success%20of%20Open%20Source%2C&amp;hl=es&amp;pg=PP1&amp;output=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'ELieXMxR1h4C',
        src: 'https://books.google.com/books?id=ELieXMxR1h4C&pg=PP1&lpg=PA154&hl=es&dq=Weber%2C+S.+%282004%29%2C+The+Success+of+Open+Source%2C&vq=antirival&output=embed',
        url: 'https://books.google.com/books?id=ELieXMxR1h4C&pg=PP1&lpg=PA154&hl=es',
        thumbnail:
          'https://books.google.com/books/content?id=ELieXMxR1h4C&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the terms of a plain search', async () => {
      const value = html`
        <iframe src="https://books.google.com/books?id=IpNDAQAAMAAJ&pg=PA4&q=Loyalsock&output=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'IpNDAQAAMAAJ',
        src: 'https://books.google.com/books?id=IpNDAQAAMAAJ&pg=PA4&q=Loyalsock&output=embed',
        url: 'https://books.google.com/books?id=IpNDAQAAMAAJ&pg=PA4',
        thumbnail:
          'https://books.google.com/books/content?id=IpNDAQAAMAAJ&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a locale that differs from the country domain', async () => {
      const value = html`
        <iframe src="https://books.google.fr/books?id=Fp1ct-bKYdcC&hl=pt-BR&output=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'Fp1ct-bKYdcC',
        src: 'https://books.google.fr/books?id=Fp1ct-bKYdcC&hl=pt-BR&output=embed',
        url: 'https://books.google.fr/books?id=Fp1ct-bKYdcC&hl=pt-BR',
        thumbnail:
          'https://books.google.fr/books/content?id=Fp1ct-bKYdcC&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a locale naming a numeric region', async () => {
      const value = html`
        <iframe src="https://books.google.com/books?id=Fp1ct-bKYdcC&hl=es-419&output=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'Fp1ct-bKYdcC',
        src: 'https://books.google.com/books?id=Fp1ct-bKYdcC&hl=es-419&output=embed',
        url: 'https://books.google.com/books?id=Fp1ct-bKYdcC&hl=es-419',
        thumbnail:
          'https://books.google.com/books/content?id=Fp1ct-bKYdcC&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it.each(malformedLocales)(
      'should drop a locale that is not a language tag: %s',
      async (locale) => {
        const value = html`
        <iframe src="https://books.google.com/books?id=Fp1ct-bKYdcC&hl=${locale}&output=embed"></iframe>
      `
        const expected: EmbedResolverResult = {
          provider: 'googlebooks',
          id: 'Fp1ct-bKYdcC',
          src: 'https://books.google.com/books?id=Fp1ct-bKYdcC&output=embed',
          url: 'https://books.google.com/books?id=Fp1ct-bKYdcC',
          thumbnail:
            'https://books.google.com/books/content?id=Fp1ct-bKYdcC&printsec=frontcover&img=1&zoom=1',
          width: 500,
          height: 500,
        }

        expect(await extract(value)).toEqual(expected)
      },
    )

    it('should resolve a carrier spelling the host in uppercase', async () => {
      const value = html`
        <iframe src="https://BOOKS.GOOGLE.COM/books?id=Fp1ct-bKYdcC&output=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'Fp1ct-bKYdcC',
        src: 'https://books.google.com/books?id=Fp1ct-bKYdcC&output=embed',
        url: 'https://books.google.com/books?id=Fp1ct-bKYdcC',
        thumbnail:
          'https://books.google.com/books/content?id=Fp1ct-bKYdcC&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a volume id carrying a path separator', async () => {
      const value = html`
        <iframe src="https://books.google.com/books?id=3bm6g7DHDjAC%2Fstolen&output=embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the country domains Google serves the viewer from', () => {
    it('should resolve a volume on books.google.de', async () => {
      const value = html`
        <iframe src="https://books.google.de/books?id=WZdCAwAAQBAJ&pg=PA12&output=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'WZdCAwAAQBAJ',
        src: 'https://books.google.de/books?id=WZdCAwAAQBAJ&pg=PA12&output=embed',
        url: 'https://books.google.de/books?id=WZdCAwAAQBAJ&pg=PA12',
        thumbnail:
          'https://books.google.de/books/content?id=WZdCAwAAQBAJ&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a volume on books.google.co.uk', async () => {
      const value = html`
        <iframe src="https://books.google.co.uk/books?id=Fp1ct-bKYdcC&output=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: 'Fp1ct-bKYdcC',
        src: 'https://books.google.co.uk/books?id=Fp1ct-bKYdcC&output=embed',
        url: 'https://books.google.co.uk/books?id=Fp1ct-bKYdcC',
        thumbnail:
          'https://books.google.co.uk/books/content?id=Fp1ct-bKYdcC&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a volume on books.google.com.au', async () => {
      const value = html`
        <iframe src="https://books.google.com.au/books?id=3bm6g7DHDjAC&output=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlebooks',
        id: '3bm6g7DHDjAC',
        src: 'https://books.google.com.au/books?id=3bm6g7DHDjAC&output=embed',
        url: 'https://books.google.com.au/books?id=3bm6g7DHDjAC',
        thumbnail:
          'https://books.google.com.au/books/content?id=3bm6g7DHDjAC&printsec=frontcover&img=1&zoom=1',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('shapes on the host that are not a volume', () => {
    it('should leave the Ngram chart unresolved', async () => {
      const value = html`
        <iframe
          src="https://books.google.com/ngrams/interactive_chart?content=big+data&year_start=1900&year_end=2008&corpus=15&smoothing=2"
          width="900"
          height="500"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the cover endpoint unresolved', async () => {
      const value = html`
        <iframe src="https://books.google.com/books/content?id=Fp1ct-bKYdcC&printsec=frontcover&img=1&zoom=1"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the store redirect unresolved', async () => {
      const value = html`
        <iframe src="https://books.google.com/ebooks?id=Fp1ct-bKYdcC"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('googlebooks carriers the resolver never claims', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should drop the previewlib loader and leave the button call behind', async () => {
    const value = html`
      <p>Book.</p>
      <p>
        <script src="//books.google.com/books/previewlib.js"></script>
        <script type="text/javascript">
          GBS_insertPreviewButtonPopup('ISBN:9781773491899');
        </script>
      </p>
    `
    const expected = html`
      <p>Book.</p>
      <p>
        <script type="text/javascript">
          GBS_insertPreviewButtonPopup('ISBN:9781773491899');
        </script>
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})

describeForEachParser('googlebooks enclosures', (parseHtml) => {
  const convert = (value: string, enclosures: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a cover image enclosure an image', async () => {
    const enclosures = [
      {
        url: 'https://books.google.com/books/content?id=Fp1ct-bKYdcC&printsec=frontcover&img=1&zoom=1',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <img
        data-enclosure=""
        src="https://books.google.com/books/content?id=Fp1ct-bKYdcC&printsec=frontcover&img=1&zoom=1"
      >
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
