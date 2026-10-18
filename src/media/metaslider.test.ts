import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { metasliderMediaResolver } from './metaslider.js'

describeForEachParser('metasliderMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, metasliderMediaResolver)

  describe('happy paths', () => {
    it('should resolve the local video slide into a video', async () => {
      const value = html`
        <li
          class="slide-24090 ms-local-video "
          style="display: block; width: 100%;"
          data-slide-type="local_video"
          data-date="2026-03-03 21:59:41"
        >
          <div
            class="local-video video-js"
            data-id="24090"
            data-lazy-load="false"
            data-sources="[{&quot;type&quot;:&quot;video\\/mp4&quot;,&quot;src&quot;:&quot;https:\\/\\/example.com\\/wp-content\\/uploads\\/2026\\/03\\/Hotel-La-Colonia.mp4&quot;}]"
            data-controls="true"
            data-loop="false"
            data-poster=""
            data-autoplay="false"
            data-mute="false"
            style="position:relative;height:0;padding-bottom:148.15789473684%"
          ></div>
        </li>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'https://example.com/wp-content/uploads/2026/03/Hotel-La-Colonia.mp4',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the external video slide and keep its poster', async () => {
      const value = html`
        <li
          class="slide-51 ms-external-video "
          data-slide-type="external_video"
        >
          <div
            class="external-video video-js"
            data-sources="[{&quot;type&quot;:&quot;video\\/mp4&quot;,&quot;src&quot;:&quot;https:\\/\\/cdn.example.org\\/clip.mp4&quot;}]"
            data-poster="https://example.com/wp-content/uploads/2026/03/clip-poster.jpg"
          ></div>
        </li>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'https://cdn.example.org/clip.mp4',
        poster: 'https://example.com/wp-content/uploads/2026/03/clip-poster.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a video div outside a MetaSlider video slide', async () => {
      const value = html`
        <li class="slide-24090 ms-image">
          <div
            class="local-video video-js"
            data-sources="[{&quot;src&quot;:&quot;https:\\/\\/example.com\\/clip.mp4&quot;}]"
          ></div>
        </li>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a slide with no sources', async () => {
      const value = html`
        <li class="ms-local-video">
          <div
            class="local-video video-js"
            data-sources="[]"
          ></div>
        </li>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a slide whose sources are not a list', async () => {
      const value = html`
        <li class="ms-local-video">
          <div
            class="local-video video-js"
            data-sources="{&quot;src&quot;:&quot;https:\\/\\/example.com\\/clip.mp4&quot;}"
          ></div>
        </li>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a slide whose only source is a stream manifest', async () => {
      const value = html`
        <li class="ms-external-video">
          <div
            class="external-video video-js"
            data-sources="[{&quot;type&quot;:&quot;application\\/x-mpegURL&quot;,&quot;src&quot;:&quot;https:\\/\\/cdn.example.org\\/clip.m3u8&quot;}]"
          ></div>
        </li>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a slide whose sources are not JSON', async () => {
      const value = html`
        <li class="ms-local-video">
          <div
            class="local-video video-js"
            data-sources="[{src:"
          ></div>
        </li>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should skip a stream manifest for the next video file', async () => {
      const value = html`
        <li class="ms-external-video">
          <div
            class="external-video video-js"
            data-sources="[{&quot;type&quot;:&quot;application\\/x-mpegURL&quot;,&quot;src&quot;:&quot;https:\\/\\/cdn.example.org\\/clip.m3u8&quot;},{&quot;type&quot;:&quot;video\\/mp4&quot;,&quot;src&quot;:&quot;https:\\/\\/cdn.example.org\\/clip.mp4&quot;}]"
          ></div>
        </li>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'https://cdn.example.org/clip.mp4',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the first of several sources', async () => {
      const value = html`
        <li class="ms-local-video">
          <div
            class="local-video video-js"
            data-sources="[{&quot;type&quot;:&quot;video\\/webm&quot;,&quot;src&quot;:&quot;https:\\/\\/example.com\\/clip.webm&quot;},{&quot;type&quot;:&quot;video\\/mp4&quot;,&quot;src&quot;:&quot;https:\\/\\/example.com\\/clip.mp4&quot;}]"
          ></div>
        </li>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'https://example.com/clip.webm',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
