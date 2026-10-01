import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { symbalooEmbedResolver, symbalooResolveEmbed } from './symbaloo.js'

describe('symbalooResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read a published webmix', () => {
      const value = 'https://www.symbaloo.com/embed/tic-tacbasicos-edu'
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        id: 'tic-tacbasicos-edu',
        src: 'https://www.symbaloo.com/embed/tic-tacbasicos-edu',
        url: 'https://www.symbaloo.com/mix/tic-tacbasicos-edu',
        height: 500,
      }

      expect(symbalooResolveEmbed(value)).toEqual(expected)
    })

    it('should read a webmix shared by link without a key or a page', () => {
      const value = 'https://www.symbaloo.com/embed/shared/AAAAAtohsPUAA41_HDPALA=='
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        src: 'https://www.symbaloo.com/embed/shared/AAAAAtohsPUAA41_HDPALA==',
        height: 500,
      }

      expect(symbalooResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the www host for a webmix on the edu webspace', () => {
      const value = 'https://edu.symbaloo.com/embed/shared/AAAABQyBRAMAA41_0SJplg=='
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        src: 'https://www.symbaloo.com/embed/shared/AAAABQyBRAMAA41_0SJplg==',
        height: 500,
      }

      expect(symbalooResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the www host for a webmix on the bare host', () => {
      const value = 'https://symbaloo.com/embed/tic-tacbasicos-edu'
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        id: 'tic-tacbasicos-edu',
        src: 'https://www.symbaloo.com/embed/tic-tacbasicos-edu',
        url: 'https://www.symbaloo.com/mix/tic-tacbasicos-edu',
        height: 500,
      }

      expect(symbalooResolveEmbed(value)).toEqual(expected)
    })

    it('should read the webmix whose slug is the shared route word', () => {
      const value = 'https://www.symbaloo.com/embed/shared'
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        id: 'shared',
        src: 'https://www.symbaloo.com/embed/shared',
        url: 'https://www.symbaloo.com/mix/shared',
        height: 500,
      }

      expect(symbalooResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the case of the slug in the key only', () => {
      const value = 'https://www.symbaloo.com/embed/TIC-TACBASICOS-EDU'
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        id: 'tic-tacbasicos-edu',
        src: 'https://www.symbaloo.com/embed/TIC-TACBASICOS-EDU',
        url: 'https://www.symbaloo.com/mix/TIC-TACBASICOS-EDU',
        height: 500,
      }

      expect(symbalooResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the embed route with no webmix', () => {
      const value = 'https://www.symbaloo.com/embed'

      expect(symbalooResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a webmix under another route word', () => {
      const value = 'https://www.symbaloo.com/x/tic-tacbasicos-edu'

      expect(symbalooResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the embed route under a leading segment', () => {
      const value = 'https://www.symbaloo.com/x/embed/tic-tacbasicos-edu'

      expect(symbalooResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the embed route in uppercase', () => {
      const value = 'https://www.symbaloo.com/EMBED/tic-tacbasicos-edu'

      expect(symbalooResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a trailing segment after a published webmix', () => {
      const value = 'https://www.symbaloo.com/embed/tic-tacbasicos-edu/extra'

      expect(symbalooResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the shared route word in uppercase', () => {
      const value = 'https://www.symbaloo.com/embed/SHARED/AAAAAtohsPUAA41_HDPALA=='

      expect(symbalooResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a trailing segment after a shared webmix', () => {
      const value = 'https://www.symbaloo.com/embed/shared/AAAAAtohsPUAA41_HDPALA==/extra'

      expect(symbalooResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/embed/tic-tacbasicos-edu'

      expect(symbalooResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a slug as written, even if the webmix is gone', () => {
      const value = 'https://edu.symbaloo.com/embed/моизакладки9'
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        id: '%d0%bc%d0%be%d0%b8%d0%b7%d0%b0%d0%ba%d0%bb%d0%b0%d0%b4%d0%ba%d0%b89',
        src: 'https://www.symbaloo.com/embed/%D0%BC%D0%BE%D0%B8%D0%B7%D0%B0%D0%BA%D0%BB%D0%B0%D0%B4%D0%BA%D0%B89',
        url: 'https://www.symbaloo.com/mix/%D0%BC%D0%BE%D0%B8%D0%B7%D0%B0%D0%BA%D0%BB%D0%B0%D0%B4%D0%BA%D0%B89',
        height: 500,
      }

      expect(symbalooResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the background color and a tracking query', () => {
      const value =
        'https://www.symbaloo.com/embed/tic-tacbasicos-edu?bgcolor=%23ff0000&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        id: 'tic-tacbasicos-edu',
        src: 'https://www.symbaloo.com/embed/tic-tacbasicos-edu',
        url: 'https://www.symbaloo.com/mix/tic-tacbasicos-edu',
        height: 500,
      }

      expect(symbalooResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('symbalooEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, symbalooEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the snippet declares', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="600px"
          name="_symFrame"
          noresize="noresize"
          src="https://www.symbaloo.com/embed/tic-tacbasicos-edu?"
          width="560px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        id: 'tic-tacbasicos-edu',
        src: 'https://www.symbaloo.com/embed/tic-tacbasicos-edu',
        url: 'https://www.symbaloo.com/mix/tic-tacbasicos-edu',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the older http snippet of a shared webmix', async () => {
      const value = html`
        <iframe
          frameborder="0"
          noresize="noresize"
          src="http://www.symbaloo.com/embed/shared/AAAAAtohsPUAA41_HDPALA=="
          name="_symFrame"
          width="920px"
          height="600px"
          id="_symFrame"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'symbaloo',
        src: 'https://www.symbaloo.com/embed/shared/AAAAAtohsPUAA41_HDPALA==',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://symbaloo.com.evil.test/embed/tic-tacbasicos-edu"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route on a foreign host', async () => {
      const value = '<iframe src="https://evil.test/embed/tic-tacbasicos-edu"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('symbaloo through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should build the placeholder from the lazy shared snippet', async () => {
    const value = html`
      <iframe
        loading="lazy"
        src="https://www.symbaloo.com/embed/shared/AAAABQyBRAMAA41_0SJplg==?"
        width="960px"
        height="640px"
        name="_symFrame"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="symbaloo"
        data-embed-src="https://www.symbaloo.com/embed/shared/AAAABQyBRAMAA41_0SJplg=="
        data-embed-height="500"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
