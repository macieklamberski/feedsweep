import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import {
  weeblyFlashMediaResolver,
  weeblyIframeMediaResolver,
  weeblyMediaResolver,
} from './weebly.js'

describeForEachParser('weeblyMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, weeblyMediaResolver)

  describe('happy paths', () => {
    // Weebly stores the video and its poster under the same name, so the poster carries both
    // the directory and the file name.
    it('should build the video url from the poster', async () => {
      const value = html`
        <div class="wsite-video-wrapper wsite-video-height-282">
          <div
            id="wsite-video-container-807467334470573958"
            class="wsite-video-container"
          >
            <iframe
              frameborder="0"
              id="video-iframe-807467334470573958"
              src="about:blank"
            ></iframe>
            <style>#wsite-video-container-807467334470573958{ background: url(//www.weebly.com/uploads/b/5005989-475656185621122208/delaware_behaving_badly_176.jpg); }</style>
          </div>
        </div>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: '//www.weebly.com/uploads/b/5005989-475656185621122208/delaware_behaving_badly_176.mp4',
        poster:
          '//www.weebly.com/uploads/b/5005989-475656185621122208/delaware_behaving_badly_176.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The play icon on Weebly's CDN sits in the same style block and is not the poster.
    it('should take the uploads url rather than the play icon', async () => {
      const value = html`
        <div class="wsite-video-wrapper wsite-video-height-282">
          <div
            id="wsite-video-container-807467334470573958"
            class="wsite-video-container"
          >
            <iframe
              frameborder="0"
              id="video-iframe-807467334470573958"
              src="about:blank"
            ></iframe>
            <style>#video-iframe-807467334470573958{ background: url(//cdn2.editmysite.com/images/util/videojs/play.png); } #wsite-video-container-807467334470573958{ background: url(//www.weebly.com/uploads/b/1/clip_176.jpg); }</style>
          </div>
        </div>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: '//www.weebly.com/uploads/b/1/clip_176.mp4',
        poster: '//www.weebly.com/uploads/b/1/clip_176.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the site origin concatenated onto the poster', async () => {
      const value = html`
        <div class="wsite-video-wrapper wsite-video-height-282">
          <div
            id="wsite-video-container-807467334470573958"
            class="wsite-video-container"
          >
            <iframe
              frameborder="0"
              id="video-iframe-807467334470573958"
              src="about:blank"
            ></iframe>
            <style>#wsite-video-container-807467334470573958{ background: url(//www.weebly.comhttp://sample.weebly.com/uploads/1/2/3/4/1234/dotday_772.jpg); }</style>
          </div>
        </div>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'http://sample.weebly.com/uploads/1/2/3/4/1234/dotday_772.mp4',
        poster: 'http://sample.weebly.com/uploads/1/2/3/4/1234/dotday_772.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a name whose size suffix looks like an extension', async () => {
      const value = html`
        <div class="wsite-video-wrapper wsite-video-height-282">
          <div
            id="wsite-video-container-807467334470573958"
            class="wsite-video-container"
          >
            <iframe
              frameborder="0"
              id="video-iframe-807467334470573958"
              src="about:blank"
            ></iframe>
            <style>#wsite-video-container-807467334470573958{ background: url(//www.weebly.com/uploads/b/1/03.05.2022_12.10.58_rec_649.jpg); }</style>
          </div>
        </div>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: '//www.weebly.com/uploads/b/1/03.05.2022_12.10.58_rec_649.mp4',
        poster: '//www.weebly.com/uploads/b/1/03.05.2022_12.10.58_rec_649.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The style block writes a cache-buster after the file name, and the video keeps it: the
    // extension is what changes between the two files and nothing else is the resolver's to edit.
    it('should build the video url from a poster carrying a cache-buster', async () => {
      const value = html`
        <div class="wsite-video-wrapper wsite-video-height-282">
          <div
            id="wsite-video-container-807467334470573958"
            class="wsite-video-container"
          >
            <iframe
              frameborder="0"
              id="video-iframe-807467334470573958"
              src="about:blank"
            ></iframe>
            <style>#wsite-video-container-807467334470573958{ background: url(//www.weebly.com/uploads/b/1/clip_176.jpg?1600); }</style>
          </div>
        </div>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: '//www.weebly.com/uploads/b/1/clip_176.mp4?1600',
        poster: '//www.weebly.com/uploads/b/1/clip_176.jpg?1600',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a facade carrying no poster', async () => {
      const value = html`
        <div class="wsite-video-wrapper wsite-video-height-282">
          <div
            id="wsite-video-container-807467334470573958"
            class="wsite-video-container"
          >
            <iframe
              frameborder="0"
              id="video-iframe-807467334470573958"
              src="about:blank"
            ></iframe>
            <style>#wsite-video-container-807467334470573958{ background: none; }</style>
          </div>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a poster that is not an upload', async () => {
      const value = html`
        <div class="wsite-video-wrapper wsite-video-height-282">
          <div
            id="wsite-video-container-807467334470573958"
            class="wsite-video-container"
          >
            <iframe
              frameborder="0"
              id="video-iframe-807467334470573958"
              src="about:blank"
            ></iframe>
            <style>#wsite-video-container-807467334470573958{ background: url(//cdn2.editmysite.com/images/util/videojs/play.png); }</style>
          </div>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a wrapper holding a live third-party iframe', async () => {
      const value = html`
        <div class="wsite-video-wrapper">
          <div class="wsite-video-container">
            <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
            <style>#wsite-video-container-1{ background: url(//www.weebly.com/uploads/b/1/clip.jpg); }</style>
          </div>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a wrapper another pass already resolved', async () => {
      const value = html`
        <div class="wsite-video-wrapper">
          <div data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"></div>
          <style>#wsite-video-container-1{ background: url(//www.weebly.com/uploads/b/1/clip.jpg); }</style>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('weeblyIframeMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, weeblyIframeMediaResolver)

  describe('happy paths', () => {
    it('should build the upload and its poster from the player page query', async () => {
      const value = html`
        <iframe
          allowtransparency="true"
          frameborder="0"
          scrolling="no"
          style="margin: 10px 0 10px 0; width: 100%; height: 480px;"
          src="http://www.weebly.com/weebly/apps/generateVideo.php?source=weebly&elementid=241484370837111095&ineditor=0&align=center&height=480&video=1/3/0/7/13078488/130228_roosmerelfilm_706.mp4&image=1/3/0/7/13078488/130228_roosmerelfilm_706.jpg"
        ></iframe>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'https://www.weebly.com/uploads/1/3/0/7/13078488/130228_roosmerelfilm_706.mp4',
        poster: 'https://www.weebly.com/uploads/1/3/0/7/13078488/130228_roosmerelfilm_706.jpg',
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the upload without a poster when the query names no image', async () => {
      const value = html`
        <iframe
          src="http://www.weebly.com/weebly/apps/generateVideo.php?source=weebly&video=1/3/0/7/13078488/clip_706.mp4"
        ></iframe>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'https://www.weebly.com/uploads/1/3/0/7/13078488/clip_706.mp4',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave the map block on the same route alone', async () => {
      const value = html`
        <iframe
          src="http://www.weebly.com/weebly/apps/generateMap.php?map=google&elementid=1&lat=1&lng=2&zoom=10&height=300"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the player page in its path', async () => {
      const value = html`
        <iframe
          src="https://evil.test/www.weebly.com/weebly/apps/generateVideo.php?video=1/3/0/7/13078488/clip_706.mp4"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a video path that is not a file', async () => {
      const value = html`
        <iframe src="http://www.weebly.com/weebly/apps/generateVideo.php?video=1/3/0/7/13078488"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a video path climbing out of the uploads directory', async () => {
      const value = html`
        <iframe src="http://www.weebly.com/weebly/apps/generateVideo.php?video=../../weebly/clip.mp4"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should keep the upload and drop a poster that is not an image', async () => {
      const value = html`
        <iframe
          src="http://www.weebly.com/weebly/apps/generateVideo.php?video=1/3/0/7/13078488/clip_706.mp4&image=1/3/0/7/13078488/clip_706.txt"
        ></iframe>
      `
      const expected: MediaResolverResult = {
        tag: 'video',
        src: 'https://www.weebly.com/uploads/1/3/0/7/13078488/clip_706.mp4',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('weeblyFlashMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, weeblyFlashMediaResolver)

  describe('happy paths', () => {
    it('should read the file and its label out of the object params', async () => {
      const value = html`
        <object
          width="290"
          height="24"
          data="http://www.weebly.com/weebly/apps/audioPlayer2.swf?user_id=4427146"
          type="application/x-shockwave-flash"
        >
          <param name="movie" value="http://www.weebly.com/weebly/apps/audioPlayer2.swf?user_id=4427146" />
          <param name="FlashVars" value="checkpolicy=yes&amp;soundFile=http://www.example.com/uploads/4/4/2/7/4427146/knowing_yourself.mp3&amp;titles=Knowing%20Yourself" />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://www.example.com/uploads/4/4/2/7/4427146/knowing_yourself.mp3',
        title: 'Knowing Yourself',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the same configuration off an embed attribute', async () => {
      const value = html`
        <embed
          src="http://www.weebly.com/weebly/apps/audioPlayer2.swf?user_id=4427146"
          flashvars="soundFile=http://www.example.com/uploads/4/4/2/7/4427146/knowing_yourself.mp3"
          width="290"
          height="24"
        />
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://www.example.com/uploads/4/4/2/7/4427146/knowing_yourself.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a player naming no file', async () => {
      const value = html`
        <object data="http://www.weebly.com/weebly/apps/audioPlayer2.swf?user_id=4427146">
          <param name="FlashVars" value="checkpolicy=yes&amp;titles=Knowing%20Yourself" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a file that is not audio', async () => {
      const value = html`
        <object data="http://www.weebly.com/weebly/apps/audioPlayer2.swf?user_id=4427146">
          <param name="FlashVars" value="soundFile=http://www.example.com/uploads/4/4/2/7/4427146/knowing_yourself.html" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the player in its path', async () => {
      const value = html`
        <object data="https://evil.test/www.weebly.com/weebly/apps/audioPlayer2.swf">
          <param name="FlashVars" value="soundFile=http://www.example.com/uploads/4/4/2/7/4427146/knowing_yourself.mp3" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The wrapper resolver hands on the protocol-relative url the style block states, so the scheme
// its fields come out with is the pipeline's answer. The legacy blocks are native elements only
// once the media pass has placed them.
describeForEachParser('weebly blocks through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml })
  }

  it('should give the video and its poster a scheme', async () => {
    const value = html`
      <div class="wsite-video-wrapper wsite-video-height-282">
        <div
          id="wsite-video-container-807467334470573958"
          class="wsite-video-container"
        >
          <iframe
            frameborder="0"
            id="video-iframe-807467334470573958"
            src="about:blank"
          ></iframe>
          <style>#wsite-video-container-807467334470573958{ background: url(//www.weebly.com/uploads/b/1/clip_176.jpg); }</style>
        </div>
      </div>
    `
    const expected = html`
      <video
        poster="https://www.weebly.com/uploads/b/1/clip_176.jpg"
        controls
        src="https://www.weebly.com/uploads/b/1/clip_176.mp4"
      ></video>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should play the legacy video block as the upload it names', async () => {
    const value = html`
      <div class="wsite-video">
        <iframe
          allowtransparency="true"
          frameborder="0"
          scrolling="no"
          style="margin: 10px 0 10px 0; width: 100%; height: 480px;"
          src="http://www.weebly.com/weebly/apps/generateVideo.php?source=weebly&elementid=241484370837111095&ineditor=0&align=center&height=480&video=1/3/0/7/13078488/clip_706.mp4&image=1/3/0/7/13078488/clip_706.jpg"
        ></iframe>
      </div>
    `
    const expected = html`
      <video
        height="480"
        poster="https://www.weebly.com/uploads/1/3/0/7/13078488/clip_706.jpg"
        controls
        src="https://www.weebly.com/uploads/1/3/0/7/13078488/clip_706.mp4"
      ></video>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should play the Flash audio block as the file it names', async () => {
    const value = html`
      <object
        width="290"
        height="24"
        data="http://www.weebly.com/weebly/apps/audioPlayer2.swf?user_id=4427146"
        type="application/x-shockwave-flash"
      >
        <param name="movie" value="http://www.weebly.com/weebly/apps/audioPlayer2.swf?user_id=4427146" />
        <param name="FlashVars" value="checkpolicy=yes&amp;soundFile=http://www.example.com/uploads/4/4/2/7/4427146/knowing_yourself.mp3&amp;titles=Knowing%20Yourself" />
      </object>
    `
    const expected = html`
      <figure>
        <audio controls src="http://www.example.com/uploads/4/4/2/7/4427146/knowing_yourself.mp3"></audio>
        <figcaption>Knowing Yourself</figcaption>
      </figure>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
