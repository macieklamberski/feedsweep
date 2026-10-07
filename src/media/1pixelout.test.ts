import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { onePixelOutFlashMediaResolver, onePixelOutWidgetMediaResolver } from './1pixelout.js'

describeForEachParser('onePixelOutFlashMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, onePixelOutFlashMediaResolver)

  describe('happy paths', () => {
    it('should play the file the FlashVars param names', async () => {
      const value = html`
        <object
          height="24"
          width="290"
          id="audioplayer1"
          data="http://example.com/wp-content/plugins/podpress/players/player.swf"
          type="application/x-shockwave-flash"
        >
          <param
            value="http://example.com/wp-content/plugins/podpress/players/player.swf"
            name="movie"
          />
          <param
            value="playerID=1&bg=0xF8F8F8&leftbg=0xEEEEEE&soundFile=http://example.com/media/episode_22.mp3"
            name="FlashVars"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/media/episode_22.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should play the file a flashvars attribute names', async () => {
      const value = html`
        <embed
          width="290"
          height="24"
          quality="high"
          allowscriptaccess="always"
          flashvars="soundFile=http://example.com/Trancemix_389.mp3"
          type="application/x-shockwave-flash"
          src="http://example.com/player.swf"
          wmode="transparent"
        >
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/Trancemix_389.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should play the file the swf url query names', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="http://huffduffer.com/flash/player.swf?soundFile=http://example.com/2010/podcast/talk.mp3"
          width="290"
          height="24"
        ></object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/2010/podcast/talk.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title from titles', async () => {
      const value = html`
        <object
          data="http://example.com/sites/example.com/modules/mp3player/mp3player/player.swf"
          height="24"
          type="application/x-shockwave-flash"
          width="100%"
        >
          <param
            name="flashvars"
            value="noinfo=yes&initialvolume=75&soundFile=http://example.com/files/28-10-12- Ivan de Carvalho_0.mp3&titles=28-10-12- Ivan de Carvalho.mp3&playerID=mp3player_1"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/files/28-10-12- Ivan de Carvalho_0.mp3',
        title: '28-10-12- Ivan de Carvalho.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave the Weebly copy to its own resolver', async () => {
      const value = html`
        <embed
          src="http://www.weebly.com/weebly/apps/audioPlayer2.swf"
          flashvars="soundFile=http://example.com/uploads/track.mp3"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the copy an archive.org item hosts to its own resolver', async () => {
      const value = html`
        <embed
          src="https://archive.org/download/example-item/player.swf"
          flashvars="soundFile=https://archive.org/download/example-item/episode.mp3"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a swf naming its file in another flashvar', async () => {
      const value = html`
        <embed
          src="https://media.libsyn.com/_static/play/player-licensed.swf"
          flashvars="file=http://example.com/episode.mp3"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a soundFile left as the snippet placeholder', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="http://example.com/info/plugins/ap_player.swf?autoPlay=off&soundFile=AUDIO URL HERE"
        ></object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a relative soundFile', async () => {
      const value = html`
        <embed
          src="http://example.com/player.swf"
          flashvars="soundFile=/pts/redirect/http://example.com/audio/episode.mp3"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a carrier naming a swf only in its query', async () => {
      const value = html`
        <embed
          src="http://example.com/player.php?movie=player.swf"
          flashvars="soundFile=http://example.com/audio/episode.mp3"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should decode a percent-encoded soundFile', async () => {
      const value = html`
        <object
          id="audioplayer1"
          data="http://assets.libsyn.com/images/hcg/player.swf"
          type="application/x-shockwave-flash"
          width="290"
          height="24"
        >
          <param
            name="FlashVars"
            value="playerID=1&&bg=0xF8F8F8&leftbg=0xffb400&soundFile=http%3A%2F%2Fexample.com%2Fmedia%2Fhcg%2FHCG_2013.03.10_404.mp3"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/media/hcg/HCG_2013.03.10_404.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should decode a soundFile the plugin wrote with encodeSource', async () => {
      const value = html`
        <object
          id="audioplayer_1"
          data="http://example.com/wp-content/plugins/audio-player/assets/player.swf?ver=20080825040617"
          name="audioplayer_1"
          type="application/x-shockwave-flash"
          width="500"
          height="24"
        >
          <param
            value="animation=yes&encode=yes&soundFile=aHR0cDovL2V4YW1wbGUuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDEwLzA1L2VwaXNvZGUtMS5tcDM&playerID=audioplayer_1"
            name="flashvars"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/wp-content/uploads/2010/05/episode-1.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the stray character encodeSource adds to a whole number of groups', async () => {
      const value = html`
        <object
          id="audioplayer_1"
          data="http://example.com/wp-content/plugins/audio-player/assets/player.swf?ver=20080825040617"
          name="audioplayer_1"
          type="application/x-shockwave-flash"
          width="500"
          height="24"
        >
          <param
            value="animation=yes&encode=yes&soundFile=aHR0cDovL2V4YW1wbGUuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDEwLzA1L2VwaXNvZGUubXAzA&playerID=audioplayer_1"
            name="flashvars"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/wp-content/uploads/2010/05/episode.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should decode an encoded file name outside ASCII as UTF-8', async () => {
      const value = html`
        <object
          id="audioplayer_1"
          data="http://example.com/wp-content/plugins/audio-player/assets/player.swf?ver=20080825040617"
          type="application/x-shockwave-flash"
        >
          <param
            value="encode=yes&soundFile=aHR0cDovL2V4YW1wbGUuY29tL2F1ZGlvL0VwaXPDs2Rpby5tcDM&playerID=audioplayer_1"
            name="flashvars"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/audio/Episódio.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a swf named by a relative path', async () => {
      const value = html`
        <embed
          src="/sites/all/modules/audio/players/1pixelout.swf"
          flashvars="soundFile=https%3A%2F%2Fexample.com%2Faudio%2Fplay%2F1456"
          width="290"
          height="24"
        />
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'https://example.com/audio/play/1456',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the swf copies publishers host', () => {
    it('should read the copy WordPress.com serves', async () => {
      const value = html`
        <object
          id="wp-as-668_1-flash"
          type="application/x-shockwave-flash"
          data="http://s0.wp.com/wp-content/plugins/audio-player/player.swf"
          width="290"
          height="24"
        >
          <param
            name="movie"
            value="http://s0.wp.com/wp-content/plugins/audio-player/player.swf"
          />
          <param
            name="FlashVars"
            value="bg=0xF8F8F8&leftbg=0xEEEEEE&soundFile=http%3A%2F%2Fexample.com%2Fdownload%2Fphotography.mp3"
          />
          Download: <a href="http://example.com/download/photography.mp3">photography.mp3</a><br />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/download/photography.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the copy unblog.fr ships as a must-use plugin', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="http://example.unblog.fr/wp-content/mu-plugins/player.swf"
          width="290"
          height="24"
          id="audioplayer1"
        >
          <param
            name="FlashVars"
            value="playerID=1&bg=0xdedede&autostart=yes&loop=yes&soundFile=http://example.unblog.fr/files/2007/07/song.mp3"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.unblog.fr/files/2007/07/song.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a renamed copy on Google Sites', async () => {
      const value = html`
        <object
          height="24"
          width="300"
          data="https://sites.google.com/site/example/b/blJReprodujtE.swf"
          type="application/x-shockwave-flash"
          id="audio2"
        >
          <param
            value="playerID=1&soundFile=http://example.com/u/8955473/Els%20vuit%20globus.mp3"
            name="FlashVars"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/u/8955473/Els vuit globus.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('onePixelOutWidgetMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, onePixelOutWidgetMediaResolver)

  describe('happy paths', () => {
    it('should play the file the embed call names for the mount', async () => {
      const value = html`
        <p id="audioplayer_1">Если у вас не воспроизводится, проверьте версию своего Flash</p>
        <script type="text/javascript">
          <!--//--><![CDATA[// ><!--
          AudioPlayer.embed("audioplayer_1", {soundFile: "http://example.com/audio/mayak/2014/08-05-2014.mp3",
          titles: "Гуру Кен на Радио Маяк 08.05.2014",
          artists: "Гуру Кен",
          animation: "no",
          });
          //--><!]]>
        </script>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/audio/mayak/2014/08-05-2014.mp3',
        title: 'Гуру Кен на Радио Маяк 08.05.2014',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should find the call beside a wrapper around the mount', async () => {
      const value = html`
        <div class="imagecenter">
          <p id="audioplayer_1">[audio player]</p>
        </div>
        <script type="text/javascript">AudioPlayer.embed("audioplayer_1", { soundFile: "http://example.com/audio/files/interview.mp3", animation: "no", transparentpagebg: "yes" });</script>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/audio/files/interview.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a mount that already holds a native player', async () => {
      const value = html`
        <p id="audioplayer_1585">
          <audio controls>
            <source
              src="http://example.com/wp-content/uploads/2010/08/Hyperballad.mp3"
              type="audio/mpeg"
            >
          </audio>
        </p>
        <p>
          <script type="text/javascript">AudioPlayer.embed("audioplayer_1585", {soundFile: "http://example.com/wp-content/uploads/2010/08/Hyperballad.mp3", titles: "liner notes", autostart: "no", loop: "no"});</script>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a call naming another mount', async () => {
      const value = html`
        <p id="audioplayer_1">[audio player]</p>
        <script type="text/javascript">AudioPlayer.embed("audioplayer_2", { soundFile: "http://example.com/audio/files/interview.mp3" });</script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should play the first file of a list', async () => {
      const value = html`
        <p id="audioplayer_1">[audio player]</p>
        <script type="text/javascript">AudioPlayer.embed("audioplayer_1", {soundFile: "http://example.com/audio/one.mp3,http://example.com/audio/two.mp3", titles: "One,Two"});</script>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/audio/one.mp3',
        title: 'One',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('1 pixel out shapes the pipeline places', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the mount with the file and its title', async () => {
    const value = html`
      <p id="audioplayer_1">[audio player]</p>
      <script type="text/javascript">AudioPlayer.embed("audioplayer_1", { soundFile: "http://example.com/audio/files/interview.mp3", titles: "Interview" });</script>
    `
    const expected = html`
      <figure>
        <audio controls src="http://example.com/audio/files/interview.mp3"></audio>
        <figcaption>Interview</figcaption>
      </figure>
      <p><script type="text/javascript">AudioPlayer.embed("audioplayer_1", { soundFile: "http://example.com/audio/files/interview.mp3", titles: "Interview" });</script></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // Once the plugin's script has run, the mount is the swf object and the call still sits beside it.
  it('should play the file once when the script already swapped the mount for the swf', async () => {
    const value = html`
      <p class="audioplayer_container">
        <object
          id="audioplayer_1"
          data="http://example.com/wp-content/plugins/audio-player/assets/player.swf?ver=20080825040617"
          name="audioplayer_1"
          type="application/x-shockwave-flash"
          width="500"
          height="24"
        >
          <param
            value="animation=yes&encode=yes&soundFile=aHR0cDovL2V4YW1wbGUuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDEwLzA1L2VwaXNvZGUtMS5tcDM&playerID=audioplayer_1"
            name="flashvars"
          >
        </object>
        <script type="text/javascript">AudioPlayer.embed("audioplayer_1", {soundFile:"aHR0cDovL2V4YW1wbGUuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDEwLzA1L2VwaXNvZGUtMS5tcDM"});</script>
      </p>
    `
    const expected = html`
      <p class="audioplayer_container">
        <audio controls src="http://example.com/wp-content/uploads/2010/05/episode-1.mp3"></audio>
        <script type="text/javascript">AudioPlayer.embed("audioplayer_1", {soundFile:"aHR0cDovL2V4YW1wbGUuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDEwLzA1L2VwaXNvZGUtMS5tcDM"});</script>
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
