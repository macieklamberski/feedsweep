import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { odyseeEmbedResolver } from './odysee.js'

describeForEachParser('odyseeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, odyseeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the channel and claim path and keep the referral token', async () => {
      const value = html`
        <iframe
          id="odysee-iframe"
          style="width:100%; aspect-ratio:16 / 9;"
          src="https://odysee.com/$/embed/@corbettreport:0/webb-repersoning:7?r=J5ihtDQcPiJPQjEXGJApJU1nEbzqhToy"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: '@corbettreport:0/webb-repersoning:7',
        src: 'https://odysee.com/$/embed/@corbettreport:0/webb-repersoning:7?r=J5ihtDQcPiJPQjEXGJApJU1nEbzqhToy',
        url: 'https://odysee.com/@corbettreport:0/webb-repersoning:7',
        ratio: '16/9',
        author: '@corbettreport',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should decode the path the current share code percent-encodes', async () => {
      const value = html`
        <iframe
          class="arve-iframe fitvidsignore"
          height="675"
          src="https://odysee.com/%24/embed/%40OsasunaLibertad%3A9%2FComo-Proteger-a-los-Menores%3A9?r=8rkFbaDF7G7TfiGmu6r8gNe9ShX86rJ8&autoplay=true"
          width="1200"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: '@OsasunaLibertad:9/Como-Proteger-a-los-Menores:9',
        src: 'https://odysee.com/%24/embed/%40OsasunaLibertad%3A9%2FComo-Proteger-a-los-Menores%3A9?r=8rkFbaDF7G7TfiGmu6r8gNe9ShX86rJ8&autoplay=true',
        url: 'https://odysee.com/@OsasunaLibertad:9/Como-Proteger-a-los-Menores:9',
        ratio: '16/9',
        author: '@OsasunaLibertad',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve claim ids spelled with hex letters', async () => {
      const value = html`
        <iframe
          id="odysee-iframe"
          width="853"
          height="480"
          src="https://odysee.com/$/embed/@AldebaranVideo:b/Jorge-Katar-Race-and-Reason:f?r=3C8TK1mXmpDyhxa88xE22aLhsdpQwK49"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: '@AldebaranVideo:b/Jorge-Katar-Race-and-Reason:f',
        src: 'https://odysee.com/$/embed/@AldebaranVideo:b/Jorge-Katar-Race-and-Reason:f?r=3C8TK1mXmpDyhxa88xE22aLhsdpQwK49',
        url: 'https://odysee.com/@AldebaranVideo:b/Jorge-Katar-Race-and-Reason:f',
        ratio: '16/9',
        author: '@AldebaranVideo',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should not read the title the carrier states', async () => {
      const value = html`
        <iframe
          src="https://odysee.com/$/embed/@Impfschaden.info:0/spirit-of-health-2015-impfen,-ja-oder:0?r=GqtYDFe44PSjFLQNJr5pB38T7AKLg2Tu"
          width="560"
          height="315"
          id="odysee-iframe"
          title="Spirit of Health 2015"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: '@Impfschaden.info:0/spirit-of-health-2015-impfen,-ja-oder:0',
        src: 'https://odysee.com/$/embed/@Impfschaden.info:0/spirit-of-health-2015-impfen,-ja-oder:0?r=GqtYDFe44PSjFLQNJr5pB38T7AKLg2Tu',
        url: 'https://odysee.com/@Impfschaden.info:0/spirit-of-health-2015-impfen,-ja-oder:0',
        ratio: '16/9',
        author: '@Impfschaden.info',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an odysee path that is not the player', async () => {
      const value = '<iframe src="https://odysee.com/$/signin"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route under a segment that is not the marker', async () => {
      const value = '<iframe src="https://odysee.com/x/embed/webb-repersoning:7"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the download route, which serves the file', async () => {
      const value = html`
        <iframe src="https://odysee.com/$/download/vinnie-paz-on-the-rockefellers/7"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a claim id carrying an encoded query', async () => {
      const value = html`
        <iframe src="https://odysee.com/%24%2Fembed%2Fwebb-repersoning%3A7%3Fad%3D1"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a claim without a hex id', async () => {
      const value = html`
        <iframe src="https://odysee.com/$/embed/@corbettreport:0/webb-repersoning:zz"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore two claims where the first is not a channel', async () => {
      const value = html`
        <iframe src="https://odysee.com/$/embed/corbettreport:0/webb-repersoning:7"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path with more segments than a channel and a claim', async () => {
      const value = html`
        <iframe
          src="https://odysee.com/$/embed/@corbettreport:0/webb-repersoning:7/extra:1"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path that does not decode', async () => {
      const value = '<iframe src="https://odysee.com/$/embed/%E0%A4%A/webb-repersoning:7"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <iframe
          src="https://evil.test/$/embed/@corbettreport:0/webb-repersoning:7"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed claim as written, even if the player answers an error', async () => {
      const value = '<iframe src="https://odysee.com/%24%2Fembed%2F.."></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: '..',
        src: 'https://odysee.com/$/embed/..',
        url: 'https://odysee.com/..',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the older spellings of a claim', () => {
    it('should keep a legacy pair player as written and join its page path', async () => {
      const value = html`
        <iframe src="https://odysee.com/$/embed/webb-repersoning/7?sunset=lbrytv"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: 'webb-repersoning:7',
        src: 'https://odysee.com/$/embed/webb-repersoning/7?sunset=lbrytv',
        url: 'https://odysee.com/webb-repersoning:7',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a claim without its channel', async () => {
      const value = '<iframe src="https://odysee.com/$/embed/webb-repersoning:7"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: 'webb-repersoning:7',
        src: 'https://odysee.com/$/embed/webb-repersoning:7',
        url: 'https://odysee.com/webb-repersoning:7',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a player on the lbry.tv host as written', async () => {
      const value = html`
        <iframe
          id="lbry-iframe"
          width="560"
          height="315"
          src="https://lbry.tv/$/embed/webb-repersoning/7"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: 'webb-repersoning:7',
        src: 'https://lbry.tv/$/embed/webb-repersoning/7',
        url: 'https://odysee.com/webb-repersoning:7',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The host redirects to odysee.com with the path kept, like lbry.tv.
    it('should keep a player on the open.lbry.com host as written', async () => {
      const value = html`
        <iframe src="https://open.lbry.com/$/embed/webb-repersoning/7"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: 'webb-repersoning:7',
        src: 'https://open.lbry.com/$/embed/webb-repersoning/7',
        url: 'https://odysee.com/webb-repersoning:7',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('a claim named without its id', () => {
    // A name with no claim id addresses the winning claim for that name, which is what the
    // share dialog writes when nothing needs disambiguating.
    it('should resolve a claim named without its id', async () => {
      const value = '<iframe src="https://odysee.com/$/embed/webb-repersoning"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: 'webb-repersoning',
        src: 'https://odysee.com/$/embed/webb-repersoning',
        url: 'https://odysee.com/webb-repersoning',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a channel named without its id', async () => {
      const value = '<iframe src="https://odysee.com/$/embed/@corbettreport"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: '@corbettreport',
        src: 'https://odysee.com/$/embed/@corbettreport',
        url: 'https://odysee.com/@corbettreport',
        ratio: '16/9',
        author: '@corbettreport',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a channel-scoped claim named without its id', async () => {
      const value = html`
        <iframe src="https://odysee.com/$/embed/@corbettreport:0/webb-repersoning"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: '@corbettreport:0/webb-repersoning',
        src: 'https://odysee.com/$/embed/@corbettreport:0/webb-repersoning',
        url: 'https://odysee.com/@corbettreport:0/webb-repersoning',
        ratio: '16/9',
        author: '@corbettreport',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The channel and the claim inside it, both named without ids, which Odysee serves as the
    // real video. The `@` is what separates this from the legacy name-and-id pair.
    it('should resolve a channel and claim pair named without ids', async () => {
      const value = html`
        <iframe src="https://odysee.com/$/embed/@corbettreport/webb-repersoning"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'odysee',
        id: '@corbettreport/webb-repersoning',
        src: 'https://odysee.com/$/embed/@corbettreport/webb-repersoning',
        url: 'https://odysee.com/@corbettreport/webb-repersoning',
        ratio: '16/9',
        author: '@corbettreport',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Two bare segments stay the legacy name-and-id pair rather than becoming two claims, so
    // the fully slash-separated spelling Odysee does not serve is still refused.
    it('should ignore two bare segments that are not a name and a hex id', async () => {
      const value = html`
        <iframe src="https://odysee.com/$/embed/corbettreport/webb-repersoning"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// odysee.com serves the file on the same host as the player, and injectEnclosures offers every
// attachment to every url-keyed resolver.
describeForEachParser('odysee through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave an odysee audio enclosure playable', async () => {
    const enclosures = [
      { url: 'https://odysee.com/$/download/vinnie-paz-on-the-rockefellers/7', type: 'audio/mpeg' },
    ]

    const expected = html`
      <audio data-enclosure="" controls src="https://odysee.com/$/download/vinnie-paz-on-the-rockefellers/7"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
