import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { videopressFlashEmbedResolver, videopressIframeEmbedResolver } from './videopress.js'

describeForEachParser('videopressIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, videopressIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the block editor embed and drop its rendition and styling query', async () => {
      const value = html`
        <iframe
          title="VideoPress Video Player"
          aria-label="VideoPress Video Player"
          width="800"
          height="450"
          src="https://video.wordpress.com/embed/FLEAXUMB?cover=1&preloadContent=metadata&useAverageColor=1&hd=0"
          frameborder="0"
          allowfullscreen
          data-resize-to-parent="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'FLEAXUMB',
        src: 'https://video.wordpress.com/embed/FLEAXUMB',
        url: 'https://videopress.com/v/FLEAXUMB',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the documented player host for the shortcode iframe on the videopress host', async () => {
      const value = html`
        <iframe
          width="640"
          height="360"
          src="https://videopress.com/embed/bDC13L49?hd=1&autoPlay=0"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'bDC13L49',
        src: 'https://video.wordpress.com/embed/bDC13L49',
        url: 'https://videopress.com/v/bDC13L49',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the loop flag and drop the rendition and styling the block editor writes', async () => {
      const value = html`
        <iframe
          loading="lazy"
          title="VideoPress Video Player"
          aria-label="VideoPress Video Player"
          width="500"
          height="375"
          src="https://videopress.com/embed/xcCfesgJ?cover=1&amp;autoPlay=0&amp;controls=1&amp;loop=1&amp;muted=1&amp;persistVolume=0&amp;playsinline=0&amp;preloadContent=metadata&amp;useAverageColor=1&amp;hd=0"
          frameborder="0"
          allowfullscreen
          data-resize-to-parent="true"
          allow="clipboard-write"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'xcCfesgJ',
        src: 'https://video.wordpress.com/embed/xcCfesgJ?loop=1',
        url: 'https://videopress.com/v/xcCfesgJ',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the start offset and the loop flag', async () => {
      const value = html`
        <iframe src="https://videopress.com/embed/FLEAXUMB?at=42&loop=1&muted=1"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'FLEAXUMB',
        src: 'https://video.wordpress.com/embed/FLEAXUMB?at=42&loop=1',
        url: 'https://videopress.com/v/FLEAXUMB',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a guid longer than the eight characters minted so far', async () => {
      const value = '<iframe src="https://videopress.com/embed/bDC13L49x"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'bDC13L49x',
        src: 'https://video.wordpress.com/embed/bDC13L49x',
        url: 'https://videopress.com/v/bDC13L49x',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the page url a page builder frames as the player', async () => {
      const value = '<iframe src="https://videopress.com/v/FLEAXUMB"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'FLEAXUMB',
        src: 'https://video.wordpress.com/embed/FLEAXUMB',
        url: 'https://videopress.com/v/FLEAXUMB',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should use a malformed guid as written, even if the player answers an error', async () => {
      const value = '<iframe src="https://videopress.com/embed/FLEAXUMB-extra"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'FLEAXUMB-extra',
        src: 'https://video.wordpress.com/embed/FLEAXUMB-extra',
        url: 'https://videopress.com/v/FLEAXUMB-extra',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a videopress path that is not the player or the page', async () => {
      const value = '<iframe src="https://videopress.com/pricing/FLEAXUMB"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a wordpress.com blog framing its own post', async () => {
      const value = html`
        <iframe src="https://example.wordpress.com/2024/01/01/embed/FLEAXUMB/embed/"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/FLEAXUMB"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the title the carrier states', () => {
    it('should not take the player label Jetpack writes as the video title', async () => {
      const value = html`
        <iframe
          title="VideoPress Video Player"
          src="https://video.wordpress.com/embed/FLEAXUMB"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'FLEAXUMB',
        src: 'https://video.wordpress.com/embed/FLEAXUMB',
        url: 'https://videopress.com/v/FLEAXUMB',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('videopressFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, videopressFlashEmbedResolver)

  describe('happy paths', () => {
    it('should read the guid out of the flashvars on the embed', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://s0.videopress.com/player.swf?v=1"
          width="450"
          height="274"
          wmode="transparent"
          seamlesstabbing="true"
          allowfullscreen="true"
          allowscriptaccess="always"
          overstretch="true"
          flashvars="guid=TxdSIdpO&isDynamicSeeking=false"
        ></embed>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'TxdSIdpO',
        src: 'https://video.wordpress.com/embed/TxdSIdpO',
        url: 'https://videopress.com/v/TxdSIdpO',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the guid the snippet inlined on the player query', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://v0.wordpress.com/player.swf?v=1.03&guid=TxdSIdpO&isDynamicSeeking=true"
          width="400"
          height="224"
        ></embed>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'TxdSIdpO',
        src: 'https://video.wordpress.com/embed/TxdSIdpO',
        url: 'https://videopress.com/v/TxdSIdpO',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the flashvars param when the object carries the player', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="http://s0.videopress.com/player.swf?v=1"
          width="450"
          height="274"
        >
          <param name="movie" value="http://s0.videopress.com/player.swf?v=1" />
          <param name="flashvars" value="guid=TxdSIdpO&isDynamicSeeking=false" />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'TxdSIdpO',
        src: 'https://video.wordpress.com/embed/TxdSIdpO',
        url: 'https://videopress.com/v/TxdSIdpO',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the player when nothing names a guid', async () => {
      const value = '<embed src="http://s0.videopress.com/player.swf?v=1"></embed>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed flashvars guid as written over the src guid, even if the player answers an error', async () => {
      const value = html`
        <embed
          src="http://s0.videopress.com/player.swf?guid=kUJmAcSf&v=1"
          flashvars="guid=../etc&isDynamicSeeking=false"
        ></embed>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: '../etc',
        src: 'https://video.wordpress.com/embed/../etc',
        url: 'https://videopress.com/v/../etc',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the flashvars guid when the src names a different one', async () => {
      const value = html`
        <embed
          src="http://s0.videopress.com/player.swf?guid=kUJmAcSf&v=1"
          flashvars="guid=TxdSIdpO&isDynamicSeeking=false"
        ></embed>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'TxdSIdpO',
        src: 'https://video.wordpress.com/embed/TxdSIdpO',
        url: 'https://videopress.com/v/TxdSIdpO',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a path that only starts with the player file', async () => {
      const value = html`
        <embed
          src="http://s0.videopress.com/player.swf/extra"
          flashvars="guid=TxdSIdpO"
        ></embed>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a swf that is not the player', async () => {
      const value = html`
        <embed
          src="http://s0.videopress.com/other.swf"
          flashvars="guid=TxdSIdpO"
        ></embed>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the first WordPress.com snippet on v.wordpress.com', () => {
    it('should read the guid that is the whole path', async () => {
      const value = html`
        <embed
          src="http://v.wordpress.com/hrPKeL5t"
          type="application/x-shockwave-flash"
          width="500"
          height="281"
          allowscriptaccess="always"
          allowfullscreen="true"
          wmode="transparent"
        ></embed>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'hrPKeL5t',
        src: 'https://video.wordpress.com/embed/hrPKeL5t',
        url: 'https://videopress.com/v/hrPKeL5t',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the guid path when the object carries the player', async () => {
      const value = html`
        <object
          width="400"
          height="224"
          data="http://v.wordpress.com/hFr8Nyar"
          type="application/x-shockwave-flash"
        >
          <param name="src" value="http://v.wordpress.com/hFr8Nyar" />
          <param name="allowfullscreen" value="true" />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'hFr8Nyar',
        src: 'https://video.wordpress.com/embed/hFr8Nyar',
        url: 'https://videopress.com/v/hFr8Nyar',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the guid out of the flashvars on the video plugin player', async () => {
      const value = html`
        <embed
          src="http://v.wordpress.com/wp-content/plugins/video/flvplayer.swf?ver=1.21"
          type="application/x-shockwave-flash"
          width="500"
          height="280"
          wmode="transparent"
          seamlesstabbing="true"
          allowfullscreen="true"
          allowscriptaccess="always"
          overstretch="true"
          flashvars="guid=BQtfIEY1&width=500&height=280&locksize=no&dynamicseek=false&qc_publisherId=p-18-mFEk4J448M"
        ></embed>
      `
      const expected: EmbedResolverResult = {
        provider: 'videopress',
        id: 'BQtfIEY1',
        src: 'https://video.wordpress.com/embed/BQtfIEY1',
        url: 'https://videopress.com/v/BQtfIEY1',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the host root, which names no guid', async () => {
      const value = html`
        <embed
          src="http://v.wordpress.com/"
          type="application/x-shockwave-flash"
        ></embed>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a deeper path that is not the player', async () => {
      const value = '<embed src="http://v.wordpress.com/hrPKeL5t/extra"></embed>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a bare guid path on a host that never served one', async () => {
      const value = '<embed src="http://v0.wordpress.com/hrPKeL5t"></embed>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('videopressIframeEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, videopressIframeEmbedResolver)

  it('should drop the label in the languages Jetpack ships it in', async () => {
    const value = html`
      <iframe src="https://videopress.com/embed/TxdSIdpO" title="Reproductor de vídeo VideoPress"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'videopress',
      id: 'TxdSIdpO',
      src: 'https://video.wordpress.com/embed/TxdSIdpO',
      url: 'https://videopress.com/v/TxdSIdpO',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should read the name the carrier states', async () => {
    const value = html`
      <iframe src="https://videopress.com/embed/TxdSIdpO" title="WordPress Category Hierarchy"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'videopress',
      id: 'TxdSIdpO',
      src: 'https://video.wordpress.com/embed/TxdSIdpO',
      url: 'https://videopress.com/v/TxdSIdpO',
      ratio: '16/9',
      title: 'WordPress Category Hierarchy',
    }

    expect(await extract(value)).toEqual(expected)
  })
})
