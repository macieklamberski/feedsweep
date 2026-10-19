import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  archiveAudioEmbedResolver,
  archiveFlashEmbedResolver,
  archiveIframeEmbedResolver,
  archiveResolveEmbed,
  extractArchiveIdentifier,
} from './archive.js'

describe('extractArchiveIdentifier', () => {
  it('should read the identifier from an embed url', () => {
    const value = 'https://archive.org/embed/gov.archives.arc.1257628'
    const expected = 'gov.archives.arc.1257628'

    expect(extractArchiveIdentifier(value)).toBe(expected)
  })

  // The details page is the same item by the same name.
  it('should read the identifier from a details url', () => {
    const value = 'https://archive.org/details/nasa_hubble'
    const expected = 'nasa_hubble'

    expect(extractArchiveIdentifier(value)).toBe(expected)
  })

  // The retired BookReader route names the same item, with the book's own file after it.
  it('should read the identifier from a stream url', () => {
    const value = 'https://archive.org/stream/hoursofdevotionb00neudrich'
    const expected = 'hoursofdevotionb00neudrich'

    expect(extractArchiveIdentifier(value)).toBe(expected)
  })

  it('should read the identifier from a stream url naming a file inside the item', () => {
    const value = 'https://archive.org/stream/westandunitedand006948mbp/westandunitedand006948mbp'
    const expected = 'westandunitedand006948mbp'

    expect(extractArchiveIdentifier(value)).toBe(expected)
  })

  // `download` serves the item's files rather than a viewer of them, so an enclosure on the
  // same host must not be read as an item.
  it('should return undefined for a download url', () => {
    const value = 'https://archive.org/download/nasa_hubble/nasa_hubble.mp3'

    expect(extractArchiveIdentifier(value)).toBeUndefined()
  })

  it('should return undefined for an archive url naming no item', () => {
    const value = 'https://archive.org/about'

    expect(extractArchiveIdentifier(value)).toBeUndefined()
  })

  it('should return undefined for a traversal that folds out of the item route', () => {
    const value = 'https://archive.org/embed/../../etc'

    expect(extractArchiveIdentifier(value)).toBeUndefined()
  })

  it('should use a malformed identifier as written, even if the url answers an error', () => {
    const value = 'https://archive.org/embed/..%2Fsome_album'
    const expected = '..%2Fsome_album'

    expect(extractArchiveIdentifier(value)).toEqual(expected)
  })

  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(extractArchiveIdentifier(value)).toBeUndefined()
  })
})

describe('archiveResolveEmbed', () => {
  describe('happy paths', () => {
    // Every item has a thumbnail derivable from the identifier, which is the whole case here.
    it('should carry the poster and the item page', () => {
      const value = 'https://archive.org/embed/gov.archives.arc.1257628'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'gov.archives.arc.1257628',
        src: 'https://archive.org/embed/gov.archives.arc.1257628',
        url: 'https://archive.org/details/gov.archives.arc.1257628',
        thumbnail: 'https://archive.org/services/img/gov.archives.arc.1257628',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    // The query says which of the item's files play and which part of them.
    it('should keep the parameters that say what plays', () => {
      const value = 'https://archive.org/embed/some_album?playlist=1&start=42'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'some_album',
        src: 'https://archive.org/embed/some_album?playlist=1&start=42',
        url: 'https://archive.org/details/some_album',
        thumbnail: 'https://archive.org/services/img/some_album',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the end of the span that plays', () => {
      const value = 'https://archive.org/embed/commute?start=60&end=90'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'commute',
        src: 'https://archive.org/embed/commute?start=60&end=90',
        url: 'https://archive.org/details/commute',
        thumbnail: 'https://archive.org/services/img/commute',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    // Publishers spelled the query with a leading ampersand, and that url answers 404 today
    // while the `?` spelling answers 200.
    it('should repair a query the ampersand form stranded in the path', () => {
      const value = 'https://archive.org/embed/some_album&playlist=1'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'some_album',
        src: 'https://archive.org/embed/some_album?playlist=1',
        url: 'https://archive.org/details/some_album',
        thumbnail: 'https://archive.org/services/img/some_album',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    it('should keep every stranded parameter, not just the first', () => {
      const value = 'https://archive.org/embed/some_album&playlist=1&list_height=150'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'some_album',
        src: 'https://archive.org/embed/some_album?playlist=1&list_height=150',
        url: 'https://archive.org/details/some_album',
        thumbnail: 'https://archive.org/services/img/some_album',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    // Autoplay is the reader's call and the render hint carries it, so a publisher who asked for
    // it does not get to ask on every consumer's behalf. Eleven carriers spell it in the stranded
    // form, which is why it is filtered after the rejoining rather than before.
    it('should drop autoplay the publisher stranded in the path', () => {
      const value = 'https://archive.org/embed/some_album&playlist=1&autoplay=1'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'some_album',
        src: 'https://archive.org/embed/some_album?playlist=1',
        url: 'https://archive.org/details/some_album',
        thumbnail: 'https://archive.org/services/img/some_album',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    // `ui`, `wrapper` and `view` describe the details page, and this mints the embed route, so
    // they say nothing about the player the reader gets.
    it('should drop the details-page options from a stream url', () => {
      const value = 'https://archive.org/embed/minitel_follies?ui=embed&wrapper=false&view=theater'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'minitel_follies',
        src: 'https://archive.org/embed/minitel_follies',
        url: 'https://archive.org/details/minitel_follies',
        thumbnail: 'https://archive.org/services/img/minitel_follies',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the embed url from a details url', () => {
      const value = 'https://archive.org/details/nasa_hubble'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'nasa_hubble',
        src: 'https://archive.org/embed/nasa_hubble',
        url: 'https://archive.org/details/nasa_hubble',
        thumbnail: 'https://archive.org/services/img/nasa_hubble',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    it('should send a BookReader stream url to the modern player', () => {
      const value = 'https://archive.org/stream/hoursofdevotionb00neudrich?ui=embed'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'hoursofdevotionb00neudrich',
        src: 'https://archive.org/embed/hoursofdevotionb00neudrich',
        url: 'https://archive.org/details/hoursofdevotionb00neudrich',
        thumbnail: 'https://archive.org/services/img/hoursofdevotionb00neudrich',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    // `embed/{identifier}` plays the item's first file, so dropping the file plays another one.
    it('should keep the file an embed url names', () => {
      const value = 'http://archive.org/embed/CmmonsBaby2011-now/cmmonsbaby070.mp3'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'CmmonsBaby2011-now',
        src: 'https://archive.org/embed/CmmonsBaby2011-now/cmmonsbaby070.mp3',
        url: 'https://archive.org/details/CmmonsBaby2011-now/cmmonsbaby070.mp3',
        thumbnail: 'https://archive.org/services/img/CmmonsBaby2011-now',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a file a details url names inside a folder of the item', () => {
      const value = 'https://archive.org/details/TeleElxVidaSana/2011/Mes01/11.04.12.VidaSana.flv'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'TeleElxVidaSana',
        src: 'https://archive.org/embed/TeleElxVidaSana/2011/Mes01/11.04.12.VidaSana.flv',
        url: 'https://archive.org/details/TeleElxVidaSana/2011/Mes01/11.04.12.VidaSana.flv',
        thumbnail: 'https://archive.org/services/img/TeleElxVidaSana',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })

    // The stream route names the book's own file, which the embed route does not take.
    it('should drop the book file a stream url names', () => {
      const value = 'https://archive.org/stream/westandunitedand006948mbp/westandunitedand006948mbp'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'westandunitedand006948mbp',
        src: 'https://archive.org/embed/westandunitedand006948mbp',
        url: 'https://archive.org/details/westandunitedand006948mbp',
        thumbnail: 'https://archive.org/services/img/westandunitedand006948mbp',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for an archive url naming no item', () => {
      const value = 'https://archive.org/about'

      expect(archiveResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a url that cannot be parsed', () => {
      const value = 'https://['

      expect(archiveResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed identifier as written, even if the player answers an error', () => {
      const value = 'https://archive.org/embed/..&playlist=1'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: '..',
        src: 'https://archive.org/embed/..?playlist=1',
        url: 'https://archive.org/details/..',
        thumbnail: 'https://archive.org/services/img/..',
        ratio: '16/9',
      }

      expect(archiveResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('archiveIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, archiveIframeEmbedResolver)

  // `embed/{identifier}` serves audio and video alike, so the carrier's height is the only thing
  // that says which one this is. The bar is 30 tall at every width, so its width goes: kept, the
  // frontend would read the pair as a ratio and grow the box with the column.
  it('should keep the audio bar height alone when the carrier states it', async () => {
    const value = html`
      <iframe src="https://archive.org/embed/pcast400" width="350" height="30"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'pcast400',
      src: 'https://archive.org/embed/pcast400',
      url: 'https://archive.org/details/pcast400',
      thumbnail: 'https://archive.org/services/img/pcast400',
      height: 30,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the audio bar height over a carrier sized for the 40 tall bar', async () => {
    const value = html`
      <iframe
        src="https://archive.org/embed/afc1938009_2004B"
        width="500"
        height="40"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'afc1938009_2004B',
      src: 'https://archive.org/embed/afc1938009_2004B',
      url: 'https://archive.org/details/afc1938009_2004B',
      thumbnail: 'https://archive.org/services/img/afc1938009_2004B',
      height: 30,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the audio bar height over a carrier sized for the 60 tall bar', async () => {
    const value = html`
      <iframe
        src="https://archive.org/embed/u_20231130"
        width="400"
        height="60"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'u_20231130',
      src: 'https://archive.org/embed/u_20231130',
      url: 'https://archive.org/details/u_20231130',
      thumbnail: 'https://archive.org/services/img/u_20231130',
      height: 30,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the audio bar height over a carrier declared just under 100 tall', async () => {
    const value = html`
      <iframe
        src="https://archive.org/embed/em-transe-de-13-de-maio-de-2026"
        width="500"
        height="94"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'em-transe-de-13-de-maio-de-2026',
      src: 'https://archive.org/embed/em-transe-de-13-de-maio-de-2026',
      url: 'https://archive.org/details/em-transe-de-13-de-maio-de-2026',
      thumbnail: 'https://archive.org/services/img/em-transe-de-13-de-maio-de-2026',
      height: 30,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the audio bar height over a carrier sized for the 140 tall player', async () => {
    const value = html`
      <iframe
        src="https://archive.org/embed/rocknrollrampage255"
        width="500"
        height="140"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'rocknrollrampage255',
      src: 'https://archive.org/embed/rocknrollrampage255',
      url: 'https://archive.org/details/rocknrollrampage255',
      thumbnail: 'https://archive.org/services/img/rocknrollrampage255',
      height: 30,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the audio bar height over a playlist carrier 150 tall', async () => {
    const value = html`
      <iframe
        src="https://archive.org/embed/cmmonsbaby090_alternate&amp;playlist=1&amp;list_height=150"
        width="100%"
        height="150"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'cmmonsbaby090_alternate',
      src: 'https://archive.org/embed/cmmonsbaby090_alternate?playlist=1&list_height=150',
      url: 'https://archive.org/details/cmmonsbaby090_alternate',
      thumbnail: 'https://archive.org/services/img/cmmonsbaby090_alternate',
      height: 30,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the audio bar height over a playlist carrier 180 tall', async () => {
    const value = html`
      <iframe
        src="http://archive.org/embed/hand_that_rocks_librivox&amp;playlist=1"
        width="520"
        height="180"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'hand_that_rocks_librivox',
      src: 'https://archive.org/embed/hand_that_rocks_librivox?playlist=1',
      url: 'https://archive.org/details/hand_that_rocks_librivox',
      thumbnail: 'https://archive.org/services/img/hand_that_rocks_librivox',
      height: 30,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the video ratio over a video carrier 270 tall', async () => {
    const value = html`
      <iframe
        src="https://archive.org/embed/Muppet_Family_Christmas_ABC_WOC_1988-12-02"
        width="480"
        height="270"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'Muppet_Family_Christmas_ABC_WOC_1988-12-02',
      src: 'https://archive.org/embed/Muppet_Family_Christmas_ABC_WOC_1988-12-02',
      url: 'https://archive.org/details/Muppet_Family_Christmas_ABC_WOC_1988-12-02',
      thumbnail: 'https://archive.org/services/img/Muppet_Family_Christmas_ABC_WOC_1988-12-02',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the video ratio over a video carrier box', async () => {
    const value = html`
      <iframe src="https://archive.org/embed/TheGoodOldGasMask" width="560" height="384"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'TheGoodOldGasMask',
      src: 'https://archive.org/embed/TheGoodOldGasMask',
      url: 'https://archive.org/details/TheGoodOldGasMask',
      thumbnail: 'https://archive.org/services/img/TheGoodOldGasMask',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

describeForEachParser('archiveAudioEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, archiveAudioEmbedResolver)

  describe('happy paths', () => {
    it('should frame the file an audio element names by its details page', async () => {
      const value = html`
        <audio
          controls
          src="https://archive.org/details/MickeyMouseTheateroftheAir/MMToA_38-03-13_ep11-The_Pied_Piper.mp3"
        ></audio>
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'MickeyMouseTheateroftheAir',
        src: 'https://archive.org/embed/MickeyMouseTheateroftheAir/MMToA_38-03-13_ep11-The_Pied_Piper.mp3',
        url: 'https://archive.org/details/MickeyMouseTheateroftheAir/MMToA_38-03-13_ep11-The_Pied_Piper.mp3',
        thumbnail: 'https://archive.org/services/img/MickeyMouseTheateroftheAir',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should frame the page a source names', async () => {
      const value = html`
        <audio controls>
          <source
            src="https://archive.org/details/tkl-1-06-v-2/TKL1-00_v2.mp3"
            type="audio/mpeg"
          >
        </audio>
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'tkl-1-06-v-2',
        src: 'https://archive.org/embed/tkl-1-06-v-2/TKL1-00_v2.mp3',
        url: 'https://archive.org/details/tkl-1-06-v-2/TKL1-00_v2.mp3',
        thumbnail: 'https://archive.org/services/img/tkl-1-06-v-2',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should frame the whole item a details page names', async () => {
      const value = '<audio controls src="https://archive.org/details/joh-18-mp-3"></audio>'
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'joh-18-mp-3',
        src: 'https://archive.org/embed/joh-18-mp-3',
        url: 'https://archive.org/details/joh-18-mp-3',
        thumbnail: 'https://archive.org/services/img/joh-18-mp-3',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The player takes `+` for a space, as the page does.
    it('should drop the counter WordPress appends and keep the file as written', async () => {
      const value = html`
        <audio
          class="wp-audio-shortcode"
          id="audio-1083-4"
          preload="none"
          controls="controls"
        >
          <source
            type="audio/mpeg"
            src="https://archive.org/details/10radioshow/Ep+2+Oscar+Noms+and+Marvel+Com(ics)+Feat+Dalton.mp3?_=4"
          />
        </audio>
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: '10radioshow',
        src: 'https://archive.org/embed/10radioshow/Ep+2+Oscar+Noms+and+Marvel+Com(ics)+Feat+Dalton.mp3',
        url: 'https://archive.org/details/10radioshow/Ep+2+Oscar+Noms+and+Marvel+Com(ics)+Feat+Dalton.mp3',
        thumbnail: 'https://archive.org/services/img/10radioshow',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a file under download playing', async () => {
      const value = html`
        <audio
          src="http://archive.org/download/music_from_all_around_the_world/13._music_from_all_around_the_world_-_b-ju_-_philly_run.mp3"
        ></audio>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a file on a storage host playing', async () => {
      const value = html`
        <audio src="https://ia601903.us.archive.org/31/items/newcasa-final/newcasa%20final.mp3"></audio>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave an element that also names a file playing', async () => {
      const value = html`
        <audio controls>
          <source src="https://archive.org/details/tkl-1-06-v-2/TKL1-00_v2.mp3">
          <source src="https://archive.org/download/tkl-1-06-v-2/TKL1-00_v2.mp3">
        </audio>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<audio src="https://evil.test/details/tkl-1-06-v-2/TKL1-00_v2.mp3"></audio>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an element naming no url', async () => {
      const value = '<audio controls></audio>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('archiveFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, archiveFlashEmbedResolver)

  describe('happy paths', () => {
    it('should read the identifier from a playlist url', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.archive.org/flow/flowplayer.commercial-3.0.3.swf"
          flashvars='config={"key":"#$b6eb72a0f2f1e29f3d4","playlist":[{"url":"http://www.archive.org/download/TheGoodOldGasMask/TheGoodOldGasMask_512kb.mp4","autoPlay":false}]}'
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'TheGoodOldGasMask',
        src: 'https://archive.org/embed/TheGoodOldGasMask',
        url: 'https://archive.org/details/TheGoodOldGasMask',
        thumbnail: 'https://archive.org/services/img/TheGoodOldGasMask',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The audio player names the file on its own and puts the item on the clip instead. An
    // audio item takes the modern bar's height, since the bar the carrier was sized for is gone.
    it('should read the identifier from the clip base url', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.archive.org/flow/flowplayer.commercial-3.2.1.swf"
          flashvars="config={'playlist':[{'url':'EndCameTooSoon-Mixtape.mp3'}],'clip':{'baseUrl':'http://www.archive.org/download/EndCameTooSoon/'}}"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'EndCameTooSoon',
        src: 'https://archive.org/embed/EndCameTooSoon',
        url: 'https://archive.org/details/EndCameTooSoon',
        thumbnail: 'https://archive.org/services/img/EndCameTooSoon',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read an audio file from a config written with double quotes', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.archive.org/flow/flowplayer.commercial-3.0.3.swf"
          flashvars='config={"key":"#$b6eb72a0f2f1e29f3d4","playlist":[{"url":"http://www.archive.org/download/RayDangerTributeToDeeDeeRamone2/TributeToDeeDeeRamone.mp3","autoPlay":false}]}'
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'RayDangerTributeToDeeDeeRamone2',
        src: 'https://archive.org/embed/RayDangerTributeToDeeDeeRamone2',
        url: 'https://archive.org/details/RayDangerTributeToDeeDeeRamone2',
        thumbnail: 'https://archive.org/services/img/RayDangerTributeToDeeDeeRamone2',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The carrier states the 26 pixels of the Flash bar, and the modern bar measures 30.
    it('should replace the audio bar height with the modern player height', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="https://www.archive.org/flow/flowplayer.commercial-3.2.1.swf"
          flashvars="config={'playlist':[{'url':'EndCameTooSoon-Mixtape.mp3','autoPlay':false}],'clip':{'autoPlay':true,'baseUrl':'https://www.archive.org/download/EndCameTooSoon/'},'plugins':{'audio':{'url':'https://www.archive.org/flow/flowplayer.audio-3.2.1-dev.swf'}}}"
          width="640"
          height="26"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'EndCameTooSoon',
        src: 'https://archive.org/embed/EndCameTooSoon',
        url: 'https://archive.org/details/EndCameTooSoon',
        thumbnail: 'https://archive.org/services/img/EndCameTooSoon',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the video ratio over the declared size of a video item', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.archive.org/flow/flowplayer.commercial-3.0.3.swf"
          flashvars='config={"playlist":[{"url":"http://www.archive.org/download/TheGoodOldGasMask/TheGoodOldGasMask_512kb.mp4"}]}'
          width="640"
          height="504"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'TheGoodOldGasMask',
        src: 'https://archive.org/embed/TheGoodOldGasMask',
        url: 'https://archive.org/details/TheGoodOldGasMask',
        thumbnail: 'https://archive.org/services/img/TheGoodOldGasMask',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The archive serves the file itself from whichever storage node holds the item.
    it('should read the identifier from a download url on a storage node', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.archive.org/flow/flowplayer.commercial-3.2.1.swf"
          flashvars='config={"playlist":[{"url":"http://ia801234.us.archive.org/download/nasa_hubble/clip.mp4"}]}'
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'nasa_hubble',
        src: 'https://archive.org/embed/nasa_hubble',
        url: 'https://archive.org/details/nasa_hubble',
        thumbnail: 'https://archive.org/services/img/nasa_hubble',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The player that predates flashvars took the same config as a query parameter.
    it('should read the config from the player query', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/flow/FlowPlayerLight.swf?config=%7BplayList%3A%5B%7Burl%3A%27http%3A%2F%2Fwww.archive.org%2Fdownload%2Fmarkofzorro-1920%2Fmarkofzorro.flv%27%7D%5D%7D"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'markofzorro-1920',
        src: 'https://archive.org/embed/markofzorro-1920',
        url: 'https://archive.org/details/markofzorro-1920',
        thumbnail: 'https://archive.org/services/img/markofzorro-1920',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the identifier from the video file of the flv player', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          id="FlowPlayer"
          data="http://www.archive.org/flv/FlowPlayerWhite.swf"
          height="263"
          width="320"
        >
          <param name="movie" value="http://www.archive.org/flv/FlowPlayerWhite.swf">
          <param name="flashvars" value="config={loop: false, autoPlay:false, initialScale: 'fit', videoFile: 'http://www.archive.org/download/StartingANewWebProjectWithTheParancoeWebMeta-frameworkAndNetbeans6.1/StartAnApplicationWithParancoe.flv'}">
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'StartingANewWebProjectWithTheParancoeWebMeta-frameworkAndNetbeans6.1',
        src: 'https://archive.org/embed/StartingANewWebProjectWithTheParancoeWebMeta-frameworkAndNetbeans6.1',
        url: 'https://archive.org/details/StartingANewWebProjectWithTheParancoeWebMeta-frameworkAndNetbeans6.1',
        thumbnail:
          'https://archive.org/services/img/StartingANewWebProjectWithTheParancoeWebMeta-frameworkAndNetbeans6.1',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the item the XSPF player loads as a playlist', async () => {
      const value = html`
        <embed
          quality="high"
          src="http://www.archive.org/audio/xspf_player.swf?autoload=true&amp;playlist_url=http%3A%2F%2Fwww.archive.org%2Faudio%2Fxspf-maker.php%3Fidentifier%3DWeezyAndTheSwish%26playlist%3Dhttp%253A%252F%252Fwww.archive.org%252Fdownload%252FWeezyAndTheSwish%252Fformat%253DVBR%2BM3U"
          type="application/x-shockwave-flash"
          width="400"
          height="40"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'WeezyAndTheSwish',
        src: 'https://archive.org/embed/WeezyAndTheSwish',
        url: 'https://archive.org/details/WeezyAndTheSwish',
        thumbnail: 'https://archive.org/services/img/WeezyAndTheSwish',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the file the audio player an item hosts names', async () => {
      const value = html`
        <object
          data="http://www.archive.org/download/7meNiebo/files/player.swf"
          height="24"
          id="715"
          type="application/x-shockwave-flash"
          width="400"
        >
          <param name="movie" value="http://www.archive.org/download/7meNiebo/files/player.swf">
          <param name="FlashVars" value="playerID=715&amp;soundFile=http://www.archive.org/download/7meNiebo/7n265_Roznice_miedzy_kobietami_a_mezczyznami.mp3">
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: '7meNiebo',
        src: 'https://archive.org/embed/7meNiebo/7n265_Roznice_miedzy_kobietami_a_mezczyznami.mp3',
        url: 'https://archive.org/details/7meNiebo/7n265_Roznice_miedzy_kobietami_a_mezczyznami.mp3',
        thumbnail: 'https://archive.org/services/img/7meNiebo',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the file the audio player names on a storage host', async () => {
      const value = html`
        <object
          data="http://www.archive.org/download/7meNiebo/files/player.swf"
          type="application/x-shockwave-flash"
        >
          <param name="FlashVars" value="playerID=715&amp;soundFile=http://ia700807.us.archive.org/9/items/7meNiebo/7n199_Psycholog_na_temat_gender.mp3">
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: '7meNiebo',
        src: 'https://archive.org/embed/7meNiebo/7n199_Psycholog_na_temat_gender.mp3',
        url: 'https://archive.org/details/7meNiebo/7n199_Psycholog_na_temat_gender.mp3',
        thumbnail: 'https://archive.org/services/img/7meNiebo',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The player swf sits in an item of its own, and the file names the item that plays.
    it('should read the item from the file, not from the item hosting the player', async () => {
      const value = html`
        <object
          data="http://www.archive.org/download/player.swf_43/player.swf"
          type="application/x-shockwave-flash"
        >
          <param name="FlashVars" value="playerID=audioplayer1&amp;soundFile=http://www.archive.org/download/Ephesians425-52/3July201156.mp3">
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: 'Ephesians425-52',
        src: 'https://archive.org/embed/Ephesians425-52/3July201156.mp3',
        url: 'https://archive.org/details/Ephesians425-52/3July201156.mp3',
        thumbnail: 'https://archive.org/services/img/Ephesians425-52',
        height: 30,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // The archive's player will play anybody's file, and somebody else's file is not an item.
    it('should ignore a config pointing at a file the archive does not host', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/flow/FlowPlayerLight.swf?config=%7BplayList%3A%5B%7Burl%3A%27http%3A%2F%2Ftrailers.labutaca.net%2Fplanet-51-clip-4.flv%27%7D%5D%7D"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    // A host that only ends in the archive's name is somebody else's host.
    it('should ignore a config whose download host merely looks like the archive', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/flow/flowplayer.commercial-3.2.1.swf"
          flashvars='config={"playlist":[{"url":"http://example-archive.org/download/nasa_hubble/clip.mp4"}]}'
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player on another host that names an archive file', async () => {
      const value = html`
        <embed
          src="http://evil.test/flow/flowplayer.commercial-3.2.1.swf"
          flashvars='config={"playlist":[{"url":"http://www.archive.org/download/nasa_hubble/clip.mp4"}]}'
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an archive url that is not the flash player', async () => {
      const value = '<embed src="https://archive.org/embed/nasa_hubble">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the flash player path behind a prefix', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/x/flow/flowplayer.commercial-3.2.1.swf"
          flashvars='config={"playlist":[{"url":"http://www.archive.org/download/nasa_hubble/clip.mp4"}]}'
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player carrying no config', async () => {
      const value = '<embed src="http://www.archive.org/flow/flowplayer.commercial-3.2.1.swf">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed config identifier as written, even if the player answers an error', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/flow/flowplayer.commercial-3.2.1.swf"
          flashvars='config={"playlist":[{"url":"http://www.archive.org/download/../clip.mp4"}]}'
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'archive',
        id: '..',
        src: 'https://archive.org/embed/..',
        url: 'https://archive.org/details/..',
        thumbnail: 'https://archive.org/services/img/..',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A base url on its own names the download endpoint rather than any item under it.
    it('should ignore a config whose only download url names no item', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/flow/FlowPlayerLight.swf"
          flashvars="config={'baseURL':'http://www.archive.org/download/'}"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The XSPF player plays any playlist, and one served elsewhere names no item.
    it('should ignore an XSPF player loading a playlist from another host', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/audio/xspf_player.swf?autoload=true&amp;playlist_url=http%3A%2F%2Fevil.test%2Faudio%2Fxspf-maker.php%3Fidentifier%3DWeezyAndTheSwish"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an XSPF playlist naming no item', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/audio/xspf_player.swf?autoload=true&amp;playlist_url=http%3A%2F%2Fwww.archive.org%2Faudio%2Fxspf-maker.php"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the XSPF player path behind a prefix', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/x/audio/xspf_player.swf?autoload=true&amp;playlist_url=http%3A%2F%2Fwww.archive.org%2Faudio%2Fxspf-maker.php%3Fidentifier%3DWeezyAndTheSwish"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path that runs on past the XSPF player', async () => {
      const value = html`
        <embed
          src="http://www.archive.org/audio/xspf_player.swf/extra?autoload=true&amp;playlist_url=http%3A%2F%2Fwww.archive.org%2Faudio%2Fxspf-maker.php%3Fidentifier%3DWeezyAndTheSwish"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an audio player whose file another host serves', async () => {
      const value = html`
        <object
          data="http://www.archive.org/download/7meNiebo/files/player.swf"
          type="application/x-shockwave-flash"
        >
          <param name="FlashVars" value="playerID=715&amp;soundFile=http://evil.test/download/7meNiebo/7n265.mp3">
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an audio player whose file sits behind a prefix', async () => {
      const value = html`
        <object
          data="http://www.archive.org/download/7meNiebo/files/player.swf"
          type="application/x-shockwave-flash"
        >
          <param name="FlashVars" value="playerID=715&amp;soundFile=http://www.archive.org/x/download/7meNiebo/7n265.mp3">
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the item audio player path behind a prefix', async () => {
      const value = html`
        <object
          data="http://www.archive.org/x/download/7meNiebo/files/player.swf"
          type="application/x-shockwave-flash"
        >
          <param name="FlashVars" value="playerID=715&amp;soundFile=http://www.archive.org/download/7meNiebo/7n265.mp3">
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a path that runs on past the item audio player', async () => {
      const value = html`
        <object
          data="http://www.archive.org/download/7meNiebo/files/player.swf/extra"
          type="application/x-shockwave-flash"
        >
          <param name="FlashVars" value="playerID=715&amp;soundFile=http://www.archive.org/download/7meNiebo/7n265.mp3">
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The placeholder's src is what every consumer of the feed gets, so what the query carries has
// to be asserted where it lands rather than one step earlier.
describeForEachParser('archive iframe embeds through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should place the audio item without the autoplay the publisher wrote', async () => {
    const value = html`
      <iframe
        src="https://archive.org/embed/some_album?playlist=1&autoplay=1&utm_source=news"
        width="500"
        height="140"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://archive.org/embed/some_album?playlist=1"
        data-embed-provider="archive"
        data-embed-id="some_album"
        data-embed-height="30"
        data-embed-url="https://archive.org/details/some_album"
        data-embed-thumbnail="https://archive.org/services/img/some_album"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // An enclosure is offered to every url resolver, and the archive serves the item's files too.
  it('should leave an archive audio enclosure playable', async () => {
    const enclosures = [
      { url: 'https://archive.org/download/nasa_hubble/nasa_hubble.mp3', type: 'audio/mpeg' },
    ]
    const expected = html`
      <audio data-enclosure="" controls src="https://archive.org/download/nasa_hubble/nasa_hubble.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})

// Without the resolver the pipeline reads the swf as the destination, so the placeholder points
// at the dead player and names no item. This is the whole of what the change buys.
describeForEachParser('archive flash embed through the pipeline', (parseHtml) => {
  it('should become a placeholder naming the item rather than the player', async () => {
    const value = html`
      <object width="640" height="504">
        <param name="movie" value="http://www.archive.org/flow/flowplayer.commercial-3.0.3.swf" />
        <embed
          type="application/x-shockwave-flash"
          width="640"
          height="504"
          src="http://www.archive.org/flow/flowplayer.commercial-3.0.3.swf"
          flashvars='config={"playlist":[{"url":"http://www.archive.org/download/nasa_hubble/nasa_hubble_512kb.mp4"}]}'
        />
      </object>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })

    const expected = html`
      <div
        data-embed-src="https://archive.org/embed/nasa_hubble"
        data-embed-provider="archive"
        data-embed-id="nasa_hubble"
        data-embed-ratio="16/9"
        data-embed-url="https://archive.org/details/nasa_hubble"
        data-embed-thumbnail="https://archive.org/services/img/nasa_hubble"
      ></div>
    `

    expect(result).toEqualHtml(expected)
  })

  it('should frame the item the flv player names', async () => {
    const value = html`
      <object
        type="application/x-shockwave-flash"
        width="320"
        height="263"
        id="FlowPlayer"
        data="http://www.archive.org/flv/FlowPlayerWhite.swf"
      >
        <param name="movie" value="http://www.archive.org/flv/FlowPlayerWhite.swf" />
        <param name="flashvars" value="config={ loop: false, autoPlay:false, videoFile: 'http://www.archive.org/download/Eecc_twistedVideo/Twisted.flv', splashImageFile: 'http://www.archive.org/download/Eecc_twistedVideo/Eecc_twistedVideo.thumbs/Twisted_00000003.jpg' }" />
      </object>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })

    const expected = html`
      <div
        data-embed-src="https://archive.org/embed/Eecc_twistedVideo"
        data-embed-provider="archive"
        data-embed-id="Eecc_twistedVideo"
        data-embed-ratio="16/9"
        data-embed-url="https://archive.org/details/Eecc_twistedVideo"
        data-embed-thumbnail="https://archive.org/services/img/Eecc_twistedVideo"
      ></div>
    `

    expect(result).toEqualHtml(expected)
  })

  // The object holds only params and the embed, so the pair becomes one placeholder.
  it('should frame the item the XSPF player pair names once', async () => {
    const value = html`
      <object
        classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
        id="xspf_player"
        width="400"
        height="40"
      >
        <param name="quality" value="high">
        <param name="movie" value="http://www.archive.org/audio/xspf_player.swf?autoload=true&amp;playlist_url=http%3A%2F%2Fwww.archive.org%2Faudio%2Fxspf-maker.php%3Fidentifier%3DWeezyAndTheSwish%26playlist%3Dhttp%253A%252F%252Fwww.archive.org%252Fdownload%252FWeezyAndTheSwish%252Fformat%253DVBR%2BM3U">
        <embed
          quality="high"
          src="http://www.archive.org/audio/xspf_player.swf?autoload=true&amp;playlist_url=http%3A%2F%2Fwww.archive.org%2Faudio%2Fxspf-maker.php%3Fidentifier%3DWeezyAndTheSwish%26playlist%3Dhttp%253A%252F%252Fwww.archive.org%252Fdownload%252FWeezyAndTheSwish%252Fformat%253DVBR%2BM3U"
          type="application/x-shockwave-flash"
          width="400"
          height="40"
        >
      </object>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })

    const expected = html`
      <div
        data-embed-src="https://archive.org/embed/WeezyAndTheSwish"
        data-embed-provider="archive"
        data-embed-id="WeezyAndTheSwish"
        data-embed-height="30"
        data-embed-url="https://archive.org/details/WeezyAndTheSwish"
        data-embed-thumbnail="https://archive.org/services/img/WeezyAndTheSwish"
      ></div>
    `

    expect(result).toEqualHtml(expected)
  })

  it('should frame the file the audio player an item hosts names', async () => {
    const value = html`
      <object
        data="http://www.archive.org/download/7meNiebo/files/player.swf"
        height="24"
        id="715"
        type="application/x-shockwave-flash"
        width="400"
      >
        <param name="movie" value="http://www.archive.org/download/7meNiebo/files/player.swf">
        <param name="FlashVars" value="playerID=715&amp;soundFile=http://www.archive.org/download/7meNiebo/7n265_Roznice_miedzy_kobietami_a_mezczyznami.mp3">
      </object>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })

    const expected = html`
      <div
        data-embed-src="https://archive.org/embed/7meNiebo/7n265_Roznice_miedzy_kobietami_a_mezczyznami.mp3"
        data-embed-provider="archive"
        data-embed-id="7meNiebo"
        data-embed-height="30"
        data-embed-url="https://archive.org/details/7meNiebo/7n265_Roznice_miedzy_kobietami_a_mezczyznami.mp3"
        data-embed-thumbnail="https://archive.org/services/img/7meNiebo"
      ></div>
    `

    expect(result).toEqualHtml(expected)
  })
})

// A browser plays a details page as nothing, so these elements render an empty player today.
describeForEachParser('archive audio elements through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should frame the file a WordPress audio block names by its page', async () => {
    const value = html`
      <figure class="wp-block-audio">
        <audio
          controls
          src="https://archive.org/details/MickeyMouseTheateroftheAir/MMToA_38-03-13_ep11-The_Pied_Piper.mp3"
        ></audio>
      </figure>
    `
    const expected = html`
      <div
        data-embed-src="https://archive.org/embed/MickeyMouseTheateroftheAir/MMToA_38-03-13_ep11-The_Pied_Piper.mp3"
        data-embed-provider="archive"
        data-embed-id="MickeyMouseTheateroftheAir"
        data-embed-height="30"
        data-embed-url="https://archive.org/details/MickeyMouseTheateroftheAir/MMToA_38-03-13_ep11-The_Pied_Piper.mp3"
        data-embed-thumbnail="https://archive.org/services/img/MickeyMouseTheateroftheAir"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should frame the page a source names', async () => {
    const value = html`
      <audio controls>
        <source
          src="https://archive.org/details/tkl-1-06-v-2/TKL1-00_v2.mp3"
          type="audio/mpeg"
        >
      </audio>
    `
    const expected = html`
      <div
        data-embed-src="https://archive.org/embed/tkl-1-06-v-2/TKL1-00_v2.mp3"
        data-embed-provider="archive"
        data-embed-id="tkl-1-06-v-2"
        data-embed-height="30"
        data-embed-url="https://archive.org/details/tkl-1-06-v-2/TKL1-00_v2.mp3"
        data-embed-thumbnail="https://archive.org/services/img/tkl-1-06-v-2"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // An `<audio>` picks the audio bar, which a frame made of the same url would not.
  it('should frame the whole item a details page names as the audio bar', async () => {
    const value = html`
      <figure class="wp-block-audio">
        <audio controls src="https://archive.org/details/joh-18-mp-3"></audio>
      </figure>
    `
    const expected = html`
      <div
        data-embed-src="https://archive.org/embed/joh-18-mp-3"
        data-embed-provider="archive"
        data-embed-id="joh-18-mp-3"
        data-embed-height="30"
        data-embed-url="https://archive.org/details/joh-18-mp-3"
        data-embed-thumbnail="https://archive.org/services/img/joh-18-mp-3"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a file under download playing', async () => {
    const value = html`
      <audio
        src="http://archive.org/download/music_from_all_around_the_world/13._music_from_all_around_the_world_-_b-ju_-_philly_run.mp3"
      ></audio>
    `

    expect(await convert(value)).toEqualHtml(value)
  })

  it('should keep the element when the post also frames the same item', async () => {
    const value = html`
      <iframe
        title="Archive.org"
        src="https://archive.org/embed/alexyz"
        width="640"
        height="140"
      ></iframe>
      <figure class="wp-block-audio">
        <audio controls src="https://archive.org/details/alexyz"></audio>
      </figure>
    `
    const expected = html`
      <div
        data-embed-src="https://archive.org/embed/alexyz"
        data-embed-provider="archive"
        data-embed-id="alexyz"
        data-embed-height="30"
        data-embed-url="https://archive.org/details/alexyz"
        data-embed-thumbnail="https://archive.org/services/img/alexyz"
      ></div>
      <figure class="wp-block-audio">
        <audio controls src="https://archive.org/details/alexyz"></audio>
      </figure>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave an audio enclosure on a storage host playable', async () => {
    const enclosures = [
      {
        url: 'https://ia601903.us.archive.org/31/items/newcasa-final/newcasa%20final.mp3',
        type: 'audio/mpeg',
      },
    ]
    const expected = html`
      <audio data-enclosure="" controls src="https://ia601903.us.archive.org/31/items/newcasa-final/newcasa%20final.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})

describeForEachParser('archiveIframeEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, archiveIframeEmbedResolver)

  it('should drop the label the share dialog writes in place of the name', async () => {
    const value = html`
      <iframe src="https://archive.org/embed/TheGoodOldGasMask" title="Embedded digital audio resource"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'TheGoodOldGasMask',
      src: 'https://archive.org/embed/TheGoodOldGasMask',
      url: 'https://archive.org/details/TheGoodOldGasMask',
      thumbnail: 'https://archive.org/services/img/TheGoodOldGasMask',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should drop the site name the carrier writes in place of the name', async () => {
    const value = html`
      <iframe
        src="https://archive.org/embed/TheGoodOldGasMask"
        title="Archive.org"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'TheGoodOldGasMask',
      src: 'https://archive.org/embed/TheGoodOldGasMask',
      url: 'https://archive.org/details/TheGoodOldGasMask',
      thumbnail: 'https://archive.org/services/img/TheGoodOldGasMask',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should drop the label a copied YouTube snippet writes', async () => {
    const value = html`
      <iframe
        src="https://archive.org/embed/TheGoodOldGasMask"
        title="YouTube video player"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'TheGoodOldGasMask',
      src: 'https://archive.org/embed/TheGoodOldGasMask',
      url: 'https://archive.org/details/TheGoodOldGasMask',
      thumbnail: 'https://archive.org/services/img/TheGoodOldGasMask',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should read the name the carrier states', async () => {
    const value = html`
      <iframe src="https://archive.org/embed/TheGoodOldGasMask" title="The Good Old Gas Mask"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'archive',
      id: 'TheGoodOldGasMask',
      src: 'https://archive.org/embed/TheGoodOldGasMask',
      url: 'https://archive.org/details/TheGoodOldGasMask',
      thumbnail: 'https://archive.org/services/img/TheGoodOldGasMask',
      ratio: '16/9',
      title: 'The Good Old Gas Mask',
    }

    expect(await extract(value)).toEqual(expected)
  })
})
