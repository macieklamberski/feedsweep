import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { airtableEmbedResolver, airtableResolveEmbed, readAirtableHeight } from './airtable.js'

describe('airtableResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from a shared view under its base', () => {
      const value = 'https://airtable.com/embed/appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT'
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT',
        src: 'https://airtable.com/embed/appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT',
        url: 'https://airtable.com/appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT',
        height: 533,
      }

      expect(airtableResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should build the placeholder from a bare shared view', () => {
      const value = 'https://airtable.com/embed/shrIBFxXbBGxNv8at'
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'shrIBFxXbBGxNv8at',
        src: 'https://airtable.com/embed/shrIBFxXbBGxNv8at',
        url: 'https://airtable.com/shrIBFxXbBGxNv8at',
        height: 533,
      }

      expect(airtableResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should drop the colour, the view controls and a tracker', () => {
      const value =
        'https://airtable.com/embed/shrIBFxXbBGxNv8at?backgroundColor=red&viewControls=on&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'shrIBFxXbBGxNv8at',
        src: 'https://airtable.com/embed/shrIBFxXbBGxNv8at',
        url: 'https://airtable.com/shrIBFxXbBGxNv8at',
        height: 533,
      }

      expect(airtableResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should drop the card layout', () => {
      const value = 'https://airtable.com/embed/shrE7dlveXvI2pz1S?backgroundColor=gray&layout=card'
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'shrE7dlveXvI2pz1S',
        src: 'https://airtable.com/embed/shrE7dlveXvI2pz1S',
        url: 'https://airtable.com/shrE7dlveXvI2pz1S',
        height: 533,
      }

      expect(airtableResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should build the placeholder from an interface form', () => {
      const value = 'https://airtable.com/embed/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/form'
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'appomwbUakbe7zbhp/pagEufaCpgI8znFlq',
        src: 'https://airtable.com/embed/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/form',
        url: 'https://airtable.com/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/form',
        height: 533,
      }

      expect(airtableResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should drop the responsive layout of an interface form', () => {
      const value =
        'https://airtable.com/embed/appWPTGqZmUcs3NWu/pagZEn4i6lgq9wnwh/form?layout=responsive'
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'appWPTGqZmUcs3NWu/pagZEn4i6lgq9wnwh',
        src: 'https://airtable.com/embed/appWPTGqZmUcs3NWu/pagZEn4i6lgq9wnwh/form',
        url: 'https://airtable.com/appWPTGqZmUcs3NWu/pagZEn4i6lgq9wnwh/form',
        height: 533,
      }

      expect(airtableResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should read the form route in upper case and keep it as written', () => {
      const value = 'https://airtable.com/embed/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/FORM'
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'appomwbUakbe7zbhp/pagEufaCpgI8znFlq',
        src: 'https://airtable.com/embed/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/FORM',
        url: 'https://airtable.com/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/FORM',
        height: 533,
      }

      expect(airtableResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should read the embed route in upper case and mint it in lowercase', () => {
      const value = 'https://airtable.com/EMBED/shrIBFxXbBGxNv8at'
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'shrIBFxXbBGxNv8at',
        src: 'https://airtable.com/embed/shrIBFxXbBGxNv8at',
        url: 'https://airtable.com/shrIBFxXbBGxNv8at',
        height: 533,
      }

      expect(airtableResolveEmbed(new URL(value))).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route word that is not the embed route', () => {
      const value = 'https://airtable.com/frame/shrIBFxXbBGxNv8at'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore the embed route below a leading segment', () => {
      const value = 'https://airtable.com/x/embed/shrIBFxXbBGxNv8at'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore the embed route naming no share', () => {
      expect(airtableResolveEmbed(new URL('https://airtable.com/embed'))).toBeUndefined()
    })

    it('should ignore a shared view with a trailing segment', () => {
      const value = 'https://airtable.com/embed/appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT/extra'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore an interface page, which is not a shared view', () => {
      const value = 'https://airtable.com/embed/appNrensvKp1phKGL/pag2pXXhhCSeiIsNS'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore an interface page whose id holds the share prefix inside it', () => {
      const value = 'https://airtable.com/embed/appNrensvKp1phKGL/pag2pXshrSeiIsNS'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore an interface form under a segment that is not a base', () => {
      const value = 'https://airtable.com/embed/xppomwbUakbe7zbhp/pagEufaCpgI8znFlq/form'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a form under a page whose id holds the page prefix inside it', () => {
      const value = 'https://airtable.com/embed/appomwbUakbe7zbhp/xpagEufaCpgI8znFlq/form'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a form under a shared view, which is not an interface page', () => {
      const value = 'https://airtable.com/embed/appomwbUakbe7zbhp/shrEufaCpgI8znFlq/form'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore an interface page with a view that is not a form', () => {
      const value = 'https://airtable.com/embed/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/grid'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore an interface form with a trailing segment', () => {
      const value = 'https://airtable.com/embed/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/form/extra'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a table below a bare share', () => {
      const value = 'https://airtable.com/embed/shr4cqFL8GrgRs3bw/tblintCULGzj4AyEW?blocks=hide'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a bare base, which names no share', () => {
      const value = 'https://airtable.com/embed/appmHSMnV4Q1S4cWh'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a share id in upper case, which the server answers 404', () => {
      const value = 'https://airtable.com/embed/SHRIBFxXbBGxNv8at'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a share under a segment that is not a base', () => {
      const value = 'https://airtable.com/embed/tblintCULGzj4AyEW/shrMnUTYyzmsdX8JT'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a share under a segment that holds the base prefix inside it', () => {
      const value = 'https://airtable.com/embed/tblappCULGzj4AyEW/shrMnUTYyzmsdX8JT'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a share under two segments', () => {
      const value =
        'https://airtable.com/embed/appmHSMnV4Q1S4cWh/appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a base in upper case, which the server answers 404', () => {
      const value = 'https://airtable.com/embed/APPpn49lnv0PpxG1q/shrXmb9QweRXyZEx5'

      expect(airtableResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should use a malformed share id as written, even if the frame answers an error', () => {
      const value = 'https://airtable.com/embed/shrIBFxXbBGxNv8at%2F..'
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'shrIBFxXbBGxNv8at%2F..',
        src: 'https://airtable.com/embed/shrIBFxXbBGxNv8at%2F..',
        url: 'https://airtable.com/shrIBFxXbBGxNv8at%2F..',
        height: 533,
      }

      expect(airtableResolveEmbed(new URL(value))).toEqual(expected)
    })
  })
})

describeForEachParser('airtableEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, airtableEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the snippet frame and ignore its stated height', async () => {
      const value = html`
        <iframe
          class="airtable-embed"
          src="https://airtable.com/embed/appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT?backgroundColor=orange&amp;viewControls=on"
          frameborder="0"
          onmousewheel=""
          width="100%"
          height="866"
          style="background: transparent; border: 1px solid #ccc;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT',
        src: 'https://airtable.com/embed/appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT',
        url: 'https://airtable.com/appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT',
        height: 533,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the bare snippet frame', async () => {
      const value = html`
        <iframe
          class="airtable-embed"
          src="https://airtable.com/embed/shrIBFxXbBGxNv8at?backgroundColor=red&amp;viewControls=on"
          frameborder="0"
          onmousewheel=""
          width="100%"
          height="533"
          style="background: transparent; border: 1px solid #ccc;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'shrIBFxXbBGxNv8at',
        src: 'https://airtable.com/embed/shrIBFxXbBGxNv8at',
        url: 'https://airtable.com/shrIBFxXbBGxNv8at',
        height: 533,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the dynamic height frame of a form view', async () => {
      const value = html`
        <iframe
          class="airtable-embed airtable-dynamic-height"
          src="https://airtable.com/embed/appZWIllXaHfQd358/shr5JKusayTTNplHC"
          frameborder="0"
          onmousewheel=""
          width="100%"
          height="2763"
          style="background: transparent; border: 1px solid #ccc;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'appZWIllXaHfQd358/shr5JKusayTTNplHC',
        src: 'https://airtable.com/embed/appZWIllXaHfQd358/shr5JKusayTTNplHC',
        url: 'https://airtable.com/appZWIllXaHfQd358/shr5JKusayTTNplHC',
        height: 533,
      }

      expect(await extract(value)).toEqual(expected)
    })
    it('should resolve the interface form frame', async () => {
      const value = html`
        <iframe
          loading="lazy"
          class="airtable-embed"
          src="https://airtable.com/embed/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/form"
          frameborder="0"
          onmousewheel=""
          width="100%"
          height="533"
          style="background: transparent; border: 1px solid #ccc;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'airtable',
        id: 'appomwbUakbe7zbhp/pagEufaCpgI8znFlq',
        src: 'https://airtable.com/embed/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/form',
        url: 'https://airtable.com/appomwbUakbe7zbhp/pagEufaCpgI8znFlq/form',
        height: 533,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/embed/appmHSMnV4Q1S4cWh/shrMnUTYyzmsdX8JT"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the static subdomain, which serves files', async () => {
      const value = '<iframe src="https://static.airtable.com/embed/shrIBFxXbBGxNv8at"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('readAirtableHeight', () => {
  it('should read the height a form view posts', () => {
    const value = {
      key: 'airtableEmbedContentDidResize',
      height: 888,
    }

    expect(readAirtableHeight(value)).toBe(888)
  })

  it('should ignore another Airtable message', () => {
    const value = {
      key: 'airtableUrlDidChange',
      height: 888,
    }

    expect(readAirtableHeight(value)).toBeUndefined()
  })

  it('should ignore a message that is not an object', () => {
    expect(readAirtableHeight('airtableEmbedContentDidResize')).toBeUndefined()
  })
})
