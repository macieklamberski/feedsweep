import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { matterportEmbedResolver } from './matterport.js'

describeForEachParser('matterportEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, matterportEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the showcase the share snippet writes', async () => {
      const value = html`
        <iframe
          loading="lazy"
          width="853"
          height="480"
          src="https://my.matterport.com/show/?m=m3tgB1ogWSE"
          frameborder="0"
          allowfullscreen=""
          allow="xr-spatial-tracking"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'matterport',
        id: 'm3tgB1ogWSE',
        src: 'https://my.matterport.com/show/?m=m3tgB1ogWSE',
        url: 'https://my.matterport.com/show/?m=m3tgB1ogWSE',
        thumbnail: 'https://my.matterport.com/api/v2/player/models/m3tgB1ogWSE/thumb/',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the platform ratio over a full-width box', async () => {
      const value = html`
        <iframe
          src="https://my.matterport.com/show/?m=BcjnMUreh6A"
          seamless="1"
          allowfullscreen="1"
          frameborder="0"
          width="100%"
          height="600"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'matterport',
        id: 'BcjnMUreh6A',
        src: 'https://my.matterport.com/show/?m=BcjnMUreh6A',
        url: 'https://my.matterport.com/show/?m=BcjnMUreh6A',
        thumbnail: 'https://my.matterport.com/api/v2/player/models/BcjnMUreh6A/thumb/',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the name the carrier states', async () => {
      const value = html`
        <iframe
          src="https://my.matterport.com/show/?m=BcjnMUreh6A"
          title="Eagle's Rest #10"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'matterport',
        id: 'BcjnMUreh6A',
        src: 'https://my.matterport.com/show/?m=BcjnMUreh6A',
        url: 'https://my.matterport.com/show/?m=BcjnMUreh6A',
        thumbnail: 'https://my.matterport.com/api/v2/player/models/BcjnMUreh6A/thumb/',
        ratio: '4/3',
        title: "Eagle's Rest #10",
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the route without its trailing slash', async () => {
      const value = '<iframe src="https://my.matterport.com/show?m=BcjnMUreh6A"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'matterport',
        id: 'BcjnMUreh6A',
        src: 'https://my.matterport.com/show/?m=BcjnMUreh6A',
        url: 'https://my.matterport.com/show/?m=BcjnMUreh6A',
        thumbnail: 'https://my.matterport.com/api/v2/player/models/BcjnMUreh6A/thumb/',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the start pose and drop the autoplay, display flags and trackers', async () => {
      const value = html`
        <iframe
          src="https://my.matterport.com/show/?m=BcjnMUreh6A&play=1&qs=1&brand=0&ss=29&sr=-.05,1.5&utm_source=feed"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'matterport',
        id: 'BcjnMUreh6A',
        src: 'https://my.matterport.com/show/?m=BcjnMUreh6A&sr=-.05%2C1.5&ss=29',
        url: 'https://my.matterport.com/show/?m=BcjnMUreh6A',
        thumbnail: 'https://my.matterport.com/api/v2/player/models/BcjnMUreh6A/thumb/',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/show/?m=BcjnMUreh6A"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a showcase naming no model', async () => {
      const value = '<iframe src="https://my.matterport.com/show/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route ending in the show word', async () => {
      const value = '<iframe src="https://my.matterport.com/embed/show/?m=BcjnMUreh6A"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route below the show word', async () => {
      const value = '<iframe src="https://my.matterport.com/show/embed/?m=BcjnMUreh6A"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should keep the model id case as written', async () => {
      const value = '<iframe src="https://my.matterport.com/show/?m=BCJNMUREH6A"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'matterport',
        id: 'BCJNMUREH6A',
        src: 'https://my.matterport.com/show/?m=BCJNMUREH6A',
        url: 'https://my.matterport.com/show/?m=BCJNMUREH6A',
        thumbnail: 'https://my.matterport.com/api/v2/player/models/BCJNMUREH6A/thumb/',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed model id as written, even if the showcase answers an error', async () => {
      const value = '<iframe src="https://my.matterport.com/show/?m=../thumb"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'matterport',
        id: '../thumb',
        src: 'https://my.matterport.com/show/?m=..%2Fthumb',
        url: 'https://my.matterport.com/show/?m=..%2Fthumb',
        thumbnail: 'https://my.matterport.com/api/v2/player/models/..%2Fthumb/thumb/',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
