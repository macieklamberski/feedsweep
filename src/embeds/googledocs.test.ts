import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { googledocsEmbedResolver, googledocsResolveEmbed } from './googledocs.js'

describe('googledocsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should keep the embedded flag of a published doc', () => {
      const value =
        'https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub?embedded=true'
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN',
        src: 'https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub?embedded=true',
        url: 'https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub',
        height: 500,
      }

      expect(googledocsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the embedded flag of a doc framed by its file id', () => {
      const value =
        'https://docs.google.com/document/d/1VEG0aH5kQ19Aq3I0honkir-8m9wTfZoWCyLPMOQIypQ/pub?embedded=true'
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '1VEG0aH5kQ19Aq3I0honkir-8m9wTfZoWCyLPMOQIypQ',
        src: 'https://docs.google.com/document/d/1VEG0aH5kQ19Aq3I0honkir-8m9wTfZoWCyLPMOQIypQ/pub?embedded=true',
        url: 'https://docs.google.com/document/d/1VEG0aH5kQ19Aq3I0honkir-8m9wTfZoWCyLPMOQIypQ/pub',
        height: 500,
      }

      expect(googledocsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the published-by header of a doc framed with no flag', () => {
      const value =
        'https://docs.google.com/document/d/1EGGXTAWRu4FZf52irbG1FIe5WDRR0CMJetklcTOytwM/pub'
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '1EGGXTAWRu4FZf52irbG1FIe5WDRR0CMJetklcTOytwM',
        src: 'https://docs.google.com/document/d/1EGGXTAWRu4FZf52irbG1FIe5WDRR0CMJetklcTOytwM/pub',
        url: 'https://docs.google.com/document/d/1EGGXTAWRu4FZf52irbG1FIe5WDRR0CMJetklcTOytwM/pub',
        height: 500,
      }

      expect(googledocsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the minimal toolbar flag, which draws the same doc', () => {
      const value =
        'https://docs.google.com/document/d/e/2PACX-1vRM0eCZusGQ8hIwm36PXoIubWG2jp_Xj4Kjz7mdf8uuMfWqVdiZ8D3TghKAQOE2jnAU-bDPict6NzN4/pub?embedded=true&rm=minimal'
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '2PACX-1vRM0eCZusGQ8hIwm36PXoIubWG2jp_Xj4Kjz7mdf8uuMfWqVdiZ8D3TghKAQOE2jnAU-bDPict6NzN4',
        src: 'https://docs.google.com/document/d/e/2PACX-1vRM0eCZusGQ8hIwm36PXoIubWG2jp_Xj4Kjz7mdf8uuMfWqVdiZ8D3TghKAQOE2jnAU-bDPict6NzN4/pub?embedded=true',
        url: 'https://docs.google.com/document/d/e/2PACX-1vRM0eCZusGQ8hIwm36PXoIubWG2jp_Xj4Kjz7mdf8uuMfWqVdiZ8D3TghKAQOE2jnAU-bDPict6NzN4/pub',
        height: 500,
      }

      expect(googledocsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a parameter it does not know as written', () => {
      const value =
        'https://docs.google.com/document/d/14GKnVuWvZTOvUg_NCe6_7ahqiEogrmYCzrqQVyQjDNU/pub?embedded?start=false&loop=false&delayms=3000'
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '14GKnVuWvZTOvUg_NCe6_7ahqiEogrmYCzrqQVyQjDNU',
        src: 'https://docs.google.com/document/d/14GKnVuWvZTOvUg_NCe6_7ahqiEogrmYCzrqQVyQjDNU/pub?embedded?start=false&loop=false&delayms=3000',
        url: 'https://docs.google.com/document/d/14GKnVuWvZTOvUg_NCe6_7ahqiEogrmYCzrqQVyQjDNU/pub',
        height: 500,
      }

      expect(googledocsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a doc framed on its edit page', () => {
      const value =
        'https://docs.google.com/document/d/1C0UmfyMqwNmMowwhwHcvGVwiYHaS0L-uofsz894nUds/edit?usp=sharing'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a doc framed on its preview page', () => {
      const value =
        'https://docs.google.com/document/d/1GIR49vBdsNekn4YIIAi1AvC84yirCwdoqBgqA8UKPWI/preview'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a doc framed by its file id with no route', () => {
      const value =
        'https://docs.google.com/document/d/17EzTWqEAgy02oqEgKphdbjiUAo7BuDWCkmKpSp9qbzk'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a doc exported as a file', () => {
      const value =
        'https://docs.google.com/document/d/1VEG0aH5kQ19Aq3I0honkir-8m9wTfZoWCyLPMOQIypQ/export?format=pdf'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the legacy published doc', () => {
      const value =
        'https://docs.google.com/document/pub?id=13ZuzQMVth64Ak2_K6UITf6NvmtGETJZQObbaTsHwhAs&embedded=true'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a published doc whose token the carrier wrote twice', () => {
      const value =
        'https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a publish route followed by another segment', () => {
      const value =
        'https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub/extra'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a doc route with a foreign word before the id', () => {
      const value =
        'https://docs.google.com/document/x/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a doc route behind a foreign segment', () => {
      const value =
        'https://docs.google.com/x/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a doc route that names no id', () => {
      const value = 'https://docs.google.com/document/d/'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a published deck on the same leaf', () => {
      const value =
        'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pub'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a publish route written with a doubled slash', () => {
      const value =
        'https://docs.google.com/document/d/1rv6jOzKF6j6KV-faPE_xC6Z8-1EaEbCSJ7lIAyh5BuE//pub?embedded=true'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a published doc behind a Workspace prefix', () => {
      const value =
        'https://docs.google.com/a/example.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub?embedded=true'

      expect(googledocsResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should drop an empty query', () => {
      const value =
        'https://docs.google.com/document/d/1cpdr_CQUf8w7QaeKJBFaYT8bTQXtlrA2rzSqbp2r7Mw/pub?'
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '1cpdr_CQUf8w7QaeKJBFaYT8bTQXtlrA2rzSqbp2r7Mw',
        src: 'https://docs.google.com/document/d/1cpdr_CQUf8w7QaeKJBFaYT8bTQXtlrA2rzSqbp2r7Mw/pub',
        url: 'https://docs.google.com/document/d/1cpdr_CQUf8w7QaeKJBFaYT8bTQXtlrA2rzSqbp2r7Mw/pub',
        height: 500,
      }

      expect(googledocsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the fragment', () => {
      const value =
        'https://docs.google.com/document/d/1dpkp6WjVQZfWoh1CaQi3BNFCLf8aTDVW9CHnJmI8snY/pub?embedded=true#heading=h.4wc4j0r1vee5'
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '1dpkp6WjVQZfWoh1CaQi3BNFCLf8aTDVW9CHnJmI8snY',
        src: 'https://docs.google.com/document/d/1dpkp6WjVQZfWoh1CaQi3BNFCLf8aTDVW9CHnJmI8snY/pub?embedded=true',
        url: 'https://docs.google.com/document/d/1dpkp6WjVQZfWoh1CaQi3BNFCLf8aTDVW9CHnJmI8snY/pub',
        height: 500,
      }

      expect(googledocsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a pair with no name', () => {
      const value =
        'https://docs.google.com/document/d/e/2PACX-1vSKVUN-U2sNVLmOh79E0Z0aSMpRxHIAFOlj4P42aB6fkdo0bk15Pvq8XJkRjVqhvpgYxxA6mNDH9lt0/pub?=true'
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '2PACX-1vSKVUN-U2sNVLmOh79E0Z0aSMpRxHIAFOlj4P42aB6fkdo0bk15Pvq8XJkRjVqhvpgYxxA6mNDH9lt0',
        src: 'https://docs.google.com/document/d/e/2PACX-1vSKVUN-U2sNVLmOh79E0Z0aSMpRxHIAFOlj4P42aB6fkdo0bk15Pvq8XJkRjVqhvpgYxxA6mNDH9lt0/pub',
        url: 'https://docs.google.com/document/d/e/2PACX-1vSKVUN-U2sNVLmOh79E0Z0aSMpRxHIAFOlj4P42aB6fkdo0bk15Pvq8XJkRjVqhvpgYxxA6mNDH9lt0/pub',
        height: 500,
      }

      expect(googledocsResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed published id as written, even if the player answers an error', () => {
      const value = 'https://docs.google.com/document/d/e/2PACX-1v%2F..%2Fx/pub'
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '2PACX-1v%2F..%2Fx',
        src: 'https://docs.google.com/document/d/e/2PACX-1v%2F..%2Fx/pub',
        url: 'https://docs.google.com/document/d/e/2PACX-1v%2F..%2Fx/pub',
        height: 500,
      }

      expect(googledocsResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('googledocsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, googledocsEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub?embedded=true"
          width="100%"
          height="1000"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN',
        src: 'https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub?embedded=true',
        url: 'https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title the carrier states', async () => {
      const value = html`
        <iframe
          src="https://docs.google.com/document/d/e/2PACX-1vQW3iYIW4L0w6xry6RUhynyWSb-VeEgSQl5q3mzR0335n7RA-EUvVJSiCQbISewyqE2CNP9mVAivM4G/pub?embedded=true"
          title="Atonement and Sacrament: That I Might Draw All Unto Me"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googledocs',
        id: '2PACX-1vQW3iYIW4L0w6xry6RUhynyWSb-VeEgSQl5q3mzR0335n7RA-EUvVJSiCQbISewyqE2CNP9mVAivM4G',
        src: 'https://docs.google.com/document/d/e/2PACX-1vQW3iYIW4L0w6xry6RUhynyWSb-VeEgSQl5q3mzR0335n7RA-EUvVJSiCQbISewyqE2CNP9mVAivM4G/pub?embedded=true',
        url: 'https://docs.google.com/document/d/e/2PACX-1vQW3iYIW4L0w6xry6RUhynyWSb-VeEgSQl5q3mzR0335n7RA-EUvVJSiCQbISewyqE2CNP9mVAivM4G/pub',
        height: 500,
        title: 'Atonement and Sacrament: That I Might Draw All Unto Me',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('googledocs through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should turn a published doc frame into a placeholder at the platform size', async () => {
    const value = html`
      <iframe
        src="https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub?embedded=true"
        width="100%"
        height="1000"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="500"
        data-embed-url="https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub"
        data-embed-id="2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN"
        data-embed-provider="googledocs"
        data-embed-src="https://docs.google.com/document/d/e/2PACX-1vTFVCyuSBO_oiFX_EoEkx9HLbSuWPBaxbQYfKgCNcmRS4MsEmo4YL8K_nm3G6tphPubYB0fgz1bboGN/pub?embedded=true"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a doc exported as a file downloadable', async () => {
    const enclosures = [
      {
        url: 'https://docs.google.com/document/d/1VEG0aH5kQ19Aq3I0honkir-8m9wTfZoWCyLPMOQIypQ/export?format=pdf',
        type: 'application/pdf',
      },
    ]

    const expected = html`
      <p>Body</p>
      <div
        data-enclosure=""
        data-file-type="application/pdf"
        data-file-name="export"
        data-file-url="https://docs.google.com/document/d/1VEG0aH5kQ19Aq3I0honkir-8m9wTfZoWCyLPMOQIypQ/export?format=pdf"
      ></div>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
