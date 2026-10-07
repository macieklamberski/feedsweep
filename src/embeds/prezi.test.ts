import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { preziEmbedResolver, preziResolveEmbed } from './prezi.js'

describe('preziResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the legacy embed route', () => {
      const value =
        'https://prezi.com/embed/n3rtkeyhvckt/?bgcolor=ffffff&lock_to_path=0&autoplay=0&autohide_ctrls=0#'
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'n3rtkeyhvckt',
        src: 'https://prezi.com/p/n3rtkeyhvckt/embed',
        url: 'https://prezi.com/p/n3rtkeyhvckt/',
        ratio: '550/400',
      }

      expect(preziResolveEmbed(value)).toEqual(expected)
    })

    it('should read the current embed route the same way', () => {
      const value = 'https://prezi.com/p/07fqanglwhcw/embed'
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: '07fqanglwhcw',
        src: 'https://prezi.com/p/07fqanglwhcw/embed',
        url: 'https://prezi.com/p/07fqanglwhcw/',
        ratio: '550/400',
      }

      expect(preziResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the login-gated embed route onto the current one', () => {
      const value = 'https://prezi.com/p/embed/07fqanglwhcw'
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: '07fqanglwhcw',
        src: 'https://prezi.com/p/07fqanglwhcw/embed',
        url: 'https://prezi.com/p/07fqanglwhcw/',
        ratio: '550/400',
      }

      expect(preziResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the landing tracker and keep a classic id carrying an underscore', () => {
      const value =
        'https://prezi.com/embed/px__0uiyxndk/?bgcolor=ffffff&lock_to_path=1&autoplay=0&autohide_ctrls=0&landing_data=bHVZZmNaNDBIWnNjdEVENDRhZDFNZGNIUE43MHdLNWpsdFJLb2ZHanI0VTc1Y2pLT3pOc2RSeDlVUFQ0ZnR3Z2hnPT0&landing_sign=8-HOxN9kXZboQoSlJ7kVGcZX0UeXISxTBof7yjNPi48'
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'px__0uiyxndk',
        src: 'https://prezi.com/p/px__0uiyxndk/embed',
        url: 'https://prezi.com/p/px__0uiyxndk/',
        ratio: '550/400',
      }

      expect(preziResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the view route of a share token as written', () => {
      const value = 'https://prezi.com/view/AmsY8GrnVuyJbYDH8QXI/embed'
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'AmsY8GrnVuyJbYDH8QXI',
        src: 'https://prezi.com/view/AmsY8GrnVuyJbYDH8QXI/embed',
        url: 'https://prezi.com/view/AmsY8GrnVuyJbYDH8QXI/',
        ratio: '550/400',
      }

      expect(preziResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the view page that is not the embed', () => {
      const value = 'https://prezi.com/view/AmsY8GrnVuyJbYDH8QXI/'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an embed word after a token under a route other than view', () => {
      const value = 'https://prezi.com/x/AmsY8GrnVuyJbYDH8QXI/embed'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the embed route', () => {
      const value = 'https://evil.test/embed/testonly0001/'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed presentation id as written, even if the player answers an error', () => {
      const value = 'https://prezi.com/p/embed/..%2Fx/'
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: '..%2Fx',
        src: 'https://prezi.com/p/..%2Fx/embed',
        url: 'https://prezi.com/p/..%2Fx/',
        ratio: '550/400',
      }

      expect(preziResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore an embed word under a route other than the presentation one', () => {
      const value = 'https://prezi.com/x/embed/07fqanglwhcw/'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the presentation page itself', () => {
      const value = 'https://prezi.com/p/testonly0001/'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Flash loader with nothing naming a presentation', () => {
      const value = 'http://prezi.com/bin/preziloader.swf'

      expect(preziResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('preziEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, preziEmbedResolver)

  describe('happy paths', () => {
    it('should read the presentation out of the Flash loader flashvars', async () => {
      const value = html`
        <object
          id="prezi_wfqsr9xleno5"
          name="prezi_wfqsr9xleno5"
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          width="500"
          height="400"
        >
          <param
            name="movie"
            value="http://prezi.com/bin/preziloader.swf"
          />
          <param
            name="flashvars"
            value="prezi_id=wfqsr9xleno5&amp;lock_to_path=0&amp;color=ffffff&amp;autoplay=no&amp;autohide_ctrls=0"
          />
          <embed
            id="preziEmbed_wfqsr9xleno5"
            name="preziEmbed_wfqsr9xleno5"
            src="http://prezi.com/bin/preziloader.swf"
            type="application/x-shockwave-flash"
            allowfullscreen="true"
            allowscriptaccess="always"
            width="500"
            height="400"
            bgcolor="#ffffff"
            flashvars="prezi_id=wfqsr9xleno5&amp;lock_to_path=0&amp;color=ffffff&amp;autoplay=no&amp;autohide_ctrls=0"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'wfqsr9xleno5',
        src: 'https://prezi.com/p/wfqsr9xleno5/embed',
        url: 'https://prezi.com/p/wfqsr9xleno5/',
        ratio: '550/400',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the element id when the flashvars are gone', async () => {
      const value = html`
        <object
          width="440"
          height="325"
        >
          <param
            name="movie"
            value="http://prezi.com/bin/preziloader.swf"
          />
          <embed
            id="preziEmbed_wfqsr9xleno5"
            src="http://prezi.com/bin/preziloader.swf"
            type="application/x-shockwave-flash"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'wfqsr9xleno5',
        src: 'https://prezi.com/p/wfqsr9xleno5/embed',
        url: 'https://prezi.com/p/wfqsr9xleno5/',
        ratio: '550/400',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a flashvars id carrying a dash', async () => {
      const value = html`
        <embed
          src="http://prezi.com/bin/preziloader.swf"
          type="application/x-shockwave-flash"
          allowfullscreen="true"
          allowscriptaccess="always"
          width="550"
          height="400"
          bgcolor="#ffffff"
          flashvars="prezi_id=y-d6h8h4rpox&amp;lock_to_path=1&amp;color=ffffff&amp;autoplay=no"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'y-d6h8h4rpox',
        src: 'https://prezi.com/p/y-d6h8h4rpox/embed',
        url: 'https://prezi.com/p/y-d6h8h4rpox/',
        ratio: '550/400',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the login-gated embed frame onto the current route', async () => {
      const value = html`
        <iframe
          src="https://prezi.com/p/embed/07fqanglwhcw"
          id="iframe_container"
          frameborder="0"
          webkitallowfullscreen=""
          mozallowfullscreen=""
          allowfullscreen=""
          allow="autoplay; fullscreen"
          height="315"
          width="560"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: '07fqanglwhcw',
        src: 'https://prezi.com/p/07fqanglwhcw/embed',
        url: 'https://prezi.com/p/07fqanglwhcw/',
        ratio: '550/400',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the view frame the share dialog writes', async () => {
      const value = html`
        <iframe
          width="650"
          height="400"
          src="https://prezi.com/view/ltVmUWho9CT4ywsuHZn3/embed"
          webkitallowfullscreen="1"
          mozallowfullscreen="1"
          allowfullscreen="1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'ltVmUWho9CT4ywsuHZn3',
        src: 'https://prezi.com/view/ltVmUWho9CT4ywsuHZn3/embed',
        url: 'https://prezi.com/view/ltVmUWho9CT4ywsuHZn3/',
        ratio: '550/400',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should use a malformed presentation id as written, even if the player answers an error', async () => {
      const value = html`
        <embed
          src="http://prezi.com/bin/preziloader.swf"
          flashvars="prezi_id=testonly0001/x"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'prezi',
        id: 'testonly0001%2Fx',
        src: 'https://prezi.com/p/testonly0001%2Fx/embed',
        url: 'https://prezi.com/p/testonly0001%2Fx/',
        ratio: '550/400',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a path that runs on past the loader', async () => {
      const value = html`
        <embed
          src="http://prezi.com/bin/preziloader.swf/testonly0001"
          flashvars="prezi_id=testonly0001"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader whose element id carries no prezi prefix', async () => {
      const value = html`
        <embed
          src="http://prezi.com/bin/preziloader.swf"
          id="player"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a loader whose element id only ends in the prezi prefix', async () => {
      const value = html`
        <embed
          src="http://prezi.com/bin/preziloader.swf"
          id="notprezi_testonly0001"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the loader path', async () => {
      const value = html`
        <embed
          src="https://evil.test/bin/preziloader.swf"
          flashvars="prezi_id=testonly0001"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('the Flash object other Flash readers could claim first', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the Flash player into a placeholder onto the current embed route', async () => {
    const value = html`
      <div class="prezi-player">
        <object
          id="prezi_bsno4idxinyc"
          name="prezi_bsno4idxinyc"
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          width="550"
          height="400"
        >
          <param
            name="movie"
            value="http://prezi.com/bin/preziloader.swf"
          />
          <param
            name="flashvars"
            value="prezi_id=bsno4idxinyc&amp;lock_to_path=0&amp;color=ffffff&amp;autoplay=no&amp;autohide_ctrls=0"
          />
          <embed
            id="preziEmbed_bsno4idxinyc"
            name="preziEmbed_bsno4idxinyc"
            src="http://prezi.com/bin/preziloader.swf"
            type="application/x-shockwave-flash"
            allowfullscreen="true"
            allowscriptaccess="always"
            width="550"
            height="400"
            bgcolor="#ffffff"
            flashvars="prezi_id=bsno4idxinyc&amp;lock_to_path=0&amp;color=ffffff&amp;autoplay=no&amp;autohide_ctrls=0"
          />
        </object>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="prezi"
        data-embed-id="bsno4idxinyc"
        data-embed-ratio="550/400"
        data-embed-src="https://prezi.com/p/bsno4idxinyc/embed"
        data-embed-url="https://prezi.com/p/bsno4idxinyc/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
