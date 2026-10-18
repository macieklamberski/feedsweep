import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { lividIframeEmbedResolver, lividResolveEmbed, lividWidgetEmbedResolver } from './livid.js'

describe('lividResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from a player url', () => {
      const value = 'https://livid.com/embed/IoMGtM7uIDai'
      const expected: EmbedResolverResult = {
        provider: 'livid',
        id: 'IoMGtM7uIDai',
        src: 'https://livid.com/embed/IoMGtM7uIDai',
        url: 'https://livid.com/watch/IoMGtM7uIDai',
        ratio: '16/9',
      }

      expect(lividResolveEmbed(value)).toEqual(expected)
    })

    it('should build the placeholder from a video page url', () => {
      const value = 'https://livid.com/watch/IoMGtM7uIDai'
      const expected: EmbedResolverResult = {
        provider: 'livid',
        id: 'IoMGtM7uIDai',
        src: 'https://livid.com/embed/IoMGtM7uIDai',
        url: 'https://livid.com/watch/IoMGtM7uIDai',
        ratio: '16/9',
      }

      expect(lividResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a path with no video route', () => {
      const value = 'https://api.livid.com/v1/thumbnails/IoMGtM7uIDai.jpg'

      expect(lividResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the home page', () => {
      const value = 'https://livid.com/'

      expect(lividResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video route behind another segment', () => {
      const value = 'https://livid.com/channel/watch/IoMGtM7uIDai'

      expect(lividResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video route with no id', () => {
      const value = 'https://livid.com/watch/'

      expect(lividResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read a route word in any case and keep the id as written', () => {
      const value = 'https://livid.com/EMBED/IoMGtM7uIDai'
      const expected: EmbedResolverResult = {
        provider: 'livid',
        id: 'IoMGtM7uIDai',
        src: 'https://livid.com/embed/IoMGtM7uIDai',
        url: 'https://livid.com/watch/IoMGtM7uIDai',
        ratio: '16/9',
      }

      expect(lividResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the player query', () => {
      const value = 'https://livid.com/embed/IoMGtM7uIDai?dnt=true&loop=true&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'livid',
        id: 'IoMGtM7uIDai',
        src: 'https://livid.com/embed/IoMGtM7uIDai',
        url: 'https://livid.com/watch/IoMGtM7uIDai',
        ratio: '16/9',
      }

      expect(lividResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('lividIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, lividIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve a player iframe and keep its title', async () => {
      const value = html`
        <iframe
          src="https://livid.com/embed/Z1a8F0inFzve"
          title="announcements__june_28,_2026_v1 (1080p)"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'livid',
        id: 'Z1a8F0inFzve',
        src: 'https://livid.com/embed/Z1a8F0inFzve',
        url: 'https://livid.com/watch/Z1a8F0inFzve',
        ratio: '16/9',
        title: 'announcements__june_28,_2026_v1 (1080p)',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the platform ratio over the carrier box', async () => {
      const value = html`
        <iframe
          src="https://livid.com/embed/mqNzsMyf_ORs"
          width="640"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'livid',
        id: 'mqNzsMyf_ORs',
        src: 'https://livid.com/embed/mqNzsMyf_ORs',
        url: 'https://livid.com/watch/mqNzsMyf_ORs',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/IoMGtM7uIDai"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should drop the player label of a MetaSlider eager slide', async () => {
      const value = html`
        <li class="slide-61 ms-livid ">
          <div class="ms-img-inner">
            <div class="livid">
              <div
                class="ms-livid-eager"
                style="position:absolute;top:0;left:0;width:100%;height:100%;"
              >
                <iframe
                  src="https://livid.com/embed/IoMGtM7uIDai?dnt=true"
                  style="width:100%;height:100%;border:0;"
                  frameborder="0"
                  allowfullscreen
                  title="Livid video player"
                ></iframe>
              </div>
            </div>
          </div>
        </li>
      `
      const expected: EmbedResolverResult = {
        provider: 'livid',
        id: 'IoMGtM7uIDai',
        src: 'https://livid.com/embed/IoMGtM7uIDai',
        url: 'https://livid.com/watch/IoMGtM7uIDai',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('lividWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, lividWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the MetaSlider lazy slide and keep its poster', async () => {
      const value = html`
        <li
          style="display: none; width: 100%;"
          class="slide-61 ms-livid "
          aria-roledescription="slide"
          data-slide-type="livid"
        >
          <div class="ms-img-inner">
            <div
              class="livid"
              style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;"
            >
              <div style="position:absolute;top:0;left:0;width:100%;height:100%;">
                <div
                  class="ms-livid-lazy-wrap"
                  style="display:block;width:100%;height:100%;"
                  data-embed="&lt;iframe src=&quot;https://livid.com/embed/IoMGtM7uIDai?dnt=true&quot; style=&quot;width:100%;height:100%;border:0;&quot; frameborder=&quot;0&quot; allow=&quot;autoplay; fullscreen; picture-in-picture; encrypted-media&quot; allowfullscreen title=&quot;Livid video player&quot;&gt;&lt;/iframe&gt;"
                >
                  <div
                    class="ms-livid-lazy"
                    style="position:relative;width:100%;height:100%;"
                  >
                    <img
                      src="https://example.com/wp-content/uploads/2026/10/livid-poster-1024x576.jpg"
                      alt=""
                      class="msDefaultImage"
                    />
                    <button
                      type="button"
                      class="ms-livid-play-button"
                      aria-label="Play video"
                    ></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      `
      const expected: EmbedResolverResult = {
        provider: 'livid',
        id: 'IoMGtM7uIDai',
        src: 'https://livid.com/embed/IoMGtM7uIDai',
        url: 'https://livid.com/watch/IoMGtM7uIDai',
        ratio: '16/9',
        thumbnail: 'https://example.com/wp-content/uploads/2026/10/livid-poster-1024x576.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lazy wrap outside a MetaSlider Livid slide', async () => {
      const value = html`
        <li class="slide-61 ms-image">
          <div
            class="ms-livid-lazy-wrap"
            data-embed="&lt;iframe src=&quot;https://livid.com/embed/IoMGtM7uIDai&quot;&gt;&lt;/iframe&gt;"
          ></div>
        </li>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed on a foreign host carrying the same path', async () => {
      const value = html`
        <li class="ms-livid">
          <div
            class="ms-livid-lazy-wrap"
            data-embed="&lt;iframe src=&quot;https://evil.test/embed/IoMGtM7uIDai&quot;&gt;&lt;/iframe&gt;"
          ></div>
        </li>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed with no iframe', async () => {
      const value = html`
        <li class="ms-livid">
          <div
            class="ms-livid-lazy-wrap"
            data-embed="https://livid.com/embed/IoMGtM7uIDai"
          ></div>
        </li>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an embed whose iframe names no video', async () => {
      const value = html`
        <li class="ms-livid">
          <div
            class="ms-livid-lazy-wrap"
            data-embed="&lt;iframe src=&quot;https://livid.com/pricing&quot;&gt;&lt;/iframe&gt;"
          ></div>
        </li>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
