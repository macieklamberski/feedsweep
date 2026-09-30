import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedRenderHint, EmbedResolverResult } from '../types.js'
import { inaEmbedResolver, inaRenderHint, inaResolveEmbed, inaScriptEmbedResolver } from './ina.js'

describe('inaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should keep the player as written and name the archive page', () => {
      const value =
        'http://player.ina.fr/player/embed/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I04224962',
        src: 'https://player.ina.fr/embed/I04224962?pid=1&key=1b0bd203fbcd702f9bc9b10ac3d0fc21',
        url: 'https://www.ina.fr/video/I04224962',
        width: 460,
        height: 259,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })

    it('should read the archive route of the same player', () => {
      const value =
        'http://www.ina.fr/video/embed/CPC82053053/1019544/f6d4ef1e5d2a7f5359b350d693da3394/425/319/0'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'CPC82053053',
        src: 'https://player.ina.fr/embed/CPC82053053?pid=1019544&key=f6d4ef1e5d2a7f5359b350d693da3394',
        url: 'https://www.ina.fr/video/CPC82053053',
        width: 425,
        height: 319,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })

    it('should read a numeric id the same way', () => {
      const value =
        'https://player.ina.fr/player/embed/2478477001020/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: '2478477001020',
        src: 'https://player.ina.fr/embed/2478477001020?pid=1&key=1b0bd203fbcd702f9bc9b10ac3d0fc21',
        url: 'https://www.ina.fr/video/2478477001020',
        width: 460,
        height: 259,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })

    it('should repair the dead Flash ticket route', () => {
      const value =
        'http://www.ina.fr/video/ticket/CPC89000193/1019544/f6d4ef1e5d2a7f5359b350d693da3394'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'CPC89000193',
        src: 'https://player.ina.fr/embed/CPC89000193?pid=1019544&key=f6d4ef1e5d2a7f5359b350d693da3394',
        url: 'https://www.ina.fr/video/CPC89000193',
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the archive page itself', () => {
      const value = 'https://www.ina.fr/video/I04224962'

      expect(inaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another route on the player host', () => {
      const value =
        'https://player.ina.fr/player/watch/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259'

      expect(inaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another route under the archive video path', () => {
      const value =
        'https://www.ina.fr/video/watch/CPC82053053/1019544/f6d4ef1e5d2a7f5359b350d693da3394/425/319/0'

      expect(inaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an embed route under another first segment', () => {
      const value =
        'https://www.ina.fr/audio/embed/CPC82053053/1019544/f6d4ef1e5d2a7f5359b350d693da3394/425/319/0'

      expect(inaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player url naming no player id or key', () => {
      const value = 'https://player.ina.fr/player/embed/I04224962'

      expect(inaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the player path', () => {
      const value =
        'https://evil.test/player/embed/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259'

      expect(inaResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed id as written, even if the player answers an error', () => {
      const value =
        'https://player.ina.fr/player/embed/..%2Fother/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: '..%2Fother',
        src: 'https://player.ina.fr/embed/..%2Fother?pid=1&key=1b0bd203fbcd702f9bc9b10ac3d0fc21',
        url: 'https://www.ina.fr/video/..%2Fother',
        width: 460,
        height: 259,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed id carrying a query separator as written, even if the player answers an error', () => {
      const value =
        'https://player.ina.fr/player/embed/I04224962&a=1/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I04224962&a=1',
        src: 'https://player.ina.fr/embed/I04224962&a=1?pid=1&key=1b0bd203fbcd702f9bc9b10ac3d0fc21',
        url: 'https://www.ina.fr/video/I04224962&a=1',
        width: 460,
        height: 259,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed player id as written, even if the player answers an error', () => {
      const value =
        'https://player.ina.fr/player/embed/I04224962/1&autoplay=1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I04224962',
        src: 'https://player.ina.fr/embed/I04224962?pid=1%26autoplay%3D1&key=1b0bd203fbcd702f9bc9b10ac3d0fc21',
        url: 'https://www.ina.fr/video/I04224962',
        width: 460,
        height: 259,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed key as written, even if the player answers an error', () => {
      const value =
        'https://player.ina.fr/player/embed/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21&0=1/460/259'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I04224962',
        src: 'https://player.ina.fr/embed/I04224962?pid=1&key=1b0bd203fbcd702f9bc9b10ac3d0fc21%260%3D1',
        url: 'https://www.ina.fr/video/I04224962',
        width: 460,
        height: 259,
      }

      expect(inaResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('inaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, inaEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://player.ina.fr/player/embed/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259"
          width="460"
          height="259"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I04224962',
        src: 'https://player.ina.fr/embed/I04224962?pid=1&key=1b0bd203fbcd702f9bc9b10ac3d0fc21',
        url: 'https://www.ina.fr/video/I04224962',
        width: 460,
        height: 259,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the Flash embed and keep its box', async () => {
      const value = html`
        <embed
          width="512"
          height="384"
          align="middle"
          flashvars=""
          pluginspage="http://www.adobe.com/go/getflashplayer"
          type="application/x-shockwave-flash"
          allowfullscreen="true"
          allowscriptaccess="always"
          name="Visionneuse"
          bgcolor="#FFFFFF"
          quality="high"
          src="http://www.ina.fr/video/ticket/CAA8100705501/931283/f8770ed3512822b3bf031b7b2b17050f"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'CAA8100705501',
        src: 'https://player.ina.fr/embed/CAA8100705501?pid=931283&key=f8770ed3512822b3bf031b7b2b17050f',
        url: 'https://www.ina.fr/video/CAA8100705501',
        width: 512,
        height: 384,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a player url naming a layout word where the box would be', async () => {
      const value = html`
        <iframe
          src="https://player.ina.fr/player/embed/CPC7505456905/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/wide/1"
          width="100%"
          height="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'CPC7505456905',
        src: 'https://player.ina.fr/embed/CPC7505456905?pid=1&key=1b0bd203fbcd702f9bc9b10ac3d0fc21',
        url: 'https://www.ina.fr/video/CPC7505456905',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a player url carrying segments past the box', async () => {
      const value = html`
        <iframe
          src="http://player.ina.fr/player/embed/00034548/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/560/315/0/148db8"
          width="560"
          height="315"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: '00034548',
        src: 'https://player.ina.fr/embed/00034548?pid=1&key=1b0bd203fbcd702f9bc9b10ac3d0fc21',
        url: 'https://www.ina.fr/video/00034548',
        width: 560,
        height: 315,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', async () => {
      const value =
        '<iframe src="https://evil.test/player/embed/I04224962/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/460/259"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('inaScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, inaScriptEmbedResolver)

  describe('happy paths', () => {
    it('should repair the retired script loader and keep the box it names', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="http://www.ina.fr/player/embed/w/320/h/240/id_notice/I00017198/id_utilisateur/935300/hash/b048361c1bcc0386715136cebd84f8f1"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I00017198',
        src: 'https://player.ina.fr/embed/I00017198?pid=935300&key=b048361c1bcc0386715136cebd84f8f1',
        url: 'https://www.ina.fr/video/I00017198',
        width: 320,
        height: 240,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the loader path', async () => {
      const value =
        '<script src="https://evil.test/player/embed/w/320/h/240/id_notice/I00017198/id_utilisateur/935300/hash/b048361c1bcc0386715136cebd84f8f1?ina.fr/player/embed/"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the loader path under another prefix', async () => {
      const value =
        '<script src="https://www.ina.fr/player/embed/x/player/embed/w/320/h/240/id_notice/I00017198/id_utilisateur/935300/hash/b048361c1bcc0386715136cebd84f8f1"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader path with a trailing segment', async () => {
      const value =
        '<script src="https://www.ina.fr/player/embed/w/320/h/240/id_notice/I00017198/id_utilisateur/935300/hash/b048361c1bcc0386715136cebd84f8f1/extra"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed id as written, even if the player answers an error', async () => {
      const value =
        '<script src="https://www.ina.fr/player/embed/w/320/h/240/id_notice/I00017198&a=1/id_utilisateur/935300/hash/b048361c1bcc0386715136cebd84f8f1"></script>'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I00017198&a=1',
        src: 'https://player.ina.fr/embed/I00017198&a=1?pid=935300&key=b048361c1bcc0386715136cebd84f8f1',
        url: 'https://www.ina.fr/video/I00017198&a=1',
        width: 320,
        height: 240,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed player id as written, even if the player answers an error', async () => {
      const value =
        '<script src="https://www.ina.fr/player/embed/w/320/h/240/id_notice/I00017198/id_utilisateur/935300&autoplay=1/hash/b048361c1bcc0386715136cebd84f8f1"></script>'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I00017198',
        src: 'https://player.ina.fr/embed/I00017198?pid=935300%26autoplay%3D1&key=b048361c1bcc0386715136cebd84f8f1',
        url: 'https://www.ina.fr/video/I00017198',
        width: 320,
        height: 240,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should decode a loader key before it moves into the query', async () => {
      const value =
        '<script src="https://www.ina.fr/player/embed/w/320/h/240/id_notice/I00017198/id_utilisateur/935300/hash/b048%2F361c"></script>'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I00017198',
        src: 'https://player.ina.fr/embed/I00017198?pid=935300&key=b048%2F361c',
        url: 'https://www.ina.fr/video/I00017198',
        width: 320,
        height: 240,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed key as written, even if the player answers an error', async () => {
      const value =
        '<script src="https://www.ina.fr/player/embed/w/320/h/240/id_notice/I00017198/id_utilisateur/935300/hash/b048361c1bcc0386715136cebd84f8f1&0=1"></script>'
      const expected: EmbedResolverResult = {
        provider: 'ina',
        id: 'I00017198',
        src: 'https://player.ina.fr/embed/I00017198?pid=935300&key=b048361c1bcc0386715136cebd84f8f1%260%3D1',
        url: 'https://www.ina.fr/video/I00017198',
        width: 320,
        height: 240,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describe('inaRenderHint', () => {
  it('should start the player with the flag the INA redirect appends', () => {
    const expected: EmbedRenderHint = { provider: 'ina', autoplayParams: { autoplay: '1' } }

    expect(inaRenderHint).toEqual(expected)
  })
})
