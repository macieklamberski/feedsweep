import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { podomaticFlashMediaResolver, podomaticIframeMediaResolver } from './podomatic.js'

const venitcuentoFrames: Array<[string, string]> = [
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2014-12-17T19_59_07-08_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2014-12-17T19_59_07-08_00.mp3',
  ],
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2014-12-10T19_25_34-08_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2014-12-10T19_25_34-08_00.mp3',
  ],
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2014-04-29T20_59_21-07_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2014-04-29T20_59_21-07_00.mp3',
  ],
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2014-04-09T22_59_43-07_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2014-04-09T22_59_43-07_00.mp3',
  ],
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2014-04-06T21_47_29-07_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2014-04-06T21_47_29-07_00.mp3',
  ],
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2014-01-30T13_24_02-08_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2014-01-30T13_24_02-08_00.mp3',
  ],
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2013-11-27T07_16_00-08_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2013-11-27T07_16_00-08_00.mp3',
  ],
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2013-11-08T08_00_01-08_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2013-11-08T08_00_01-08_00.mp3',
  ],
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2013-10-28T15_55_17-07_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2013-10-28T15_55_17-07_00.mp3',
  ],
  [
    'minicast=false&jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2013-10-10T14_33_17-07_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0',
    'https://venitcuento.podomatic.com/enclosure/2013-10-10T14_33_17-07_00.mp3',
  ],
]

describeForEachParser('podomaticFlashMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, podomaticFlashMediaResolver)

  describe('happy paths', () => {
    it.each(venitcuentoFrames)(
      'should play the enclosure the jsonLocation names: %s',
      async (flashvars, src) => {
        const value = html`
        <embed
          src="http://venitcuento.podomatic.com/swf/joeplayer_v20.swf"
          flashvars="${flashvars}"
          type="application/x-shockwave-flash"
        >
      `
        const expected: MediaResolverResult = {
          tag: 'audio',
          src,
        }

        expect(await extract(value)).toEqual(expected)
      },
    )

    it('should play the enclosure an object names in its flashvars param', async () => {
      const value = html`
        <object data="http://venitcuento.podomatic.com/swf/joeplayer_v20.swf">
          <param
            name="flashvars"
            value="minicast=false&amp;jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2014-12-17T19_59_07-08_00"
          >
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'https://venitcuento.podomatic.com/enclosure/2014-12-17T19_59_07-08_00.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a jsonLocation on another host', async () => {
      const value = html`
        <embed
          src="http://venitcuento.podomatic.com/swf/joeplayer_v20.swf"
          flashvars="jsonLocation=http%3A%2F%2Fevil.test%2Fentry%2Fembed_params%2F2014-12-17T19_59_07-08_00"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a jsonLocation with no timestamp', async () => {
      const value = html`
        <embed
          src="http://venitcuento.podomatic.com/swf/joeplayer_v20.swf"
          flashvars="jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a jsonLocation on another route', async () => {
      const value = html`
        <embed
          src="http://venitcuento.podomatic.com/swf/joeplayer_v20.swf"
          flashvars="jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fzz_params%2F2014-12-17T19_59_07-08_00"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a jsonLocation outside the entry route', async () => {
      const value = html`
        <embed
          src="http://venitcuento.podomatic.com/swf/joeplayer_v20.swf"
          flashvars="jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fzz%2Fembed_params%2F2014-12-17T19_59_07-08_00"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player with no jsonLocation', async () => {
      const value = html`
        <embed
          src="http://venitcuento.podomatic.com/swf/joeplayer_v20.swf"
          flashvars="minicast=false"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the player path', async () => {
      const value = html`
        <embed
          src="http://evil.test/swf/joeplayer_v20.swf?r=podomatic.com/swf/joeplayer"
          flashvars="jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2014-12-17T19_59_07-08_00"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another route on the podomatic host', async () => {
      const value = html`
        <embed
          src="http://venitcuento.podomatic.com/x/joeplayer_v20.swf?r=podomatic.com/swf/joeplayer"
          flashvars="jsonLocation=http%3A%2F%2Fvenitcuento.podomatic.com%2Fentry%2Fembed_params%2F2014-12-17T19_59_07-08_00"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('podomaticIframeMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, podomaticIframeMediaResolver)

  describe('happy paths', () => {
    it('should play the enclosure the posting frame names', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="85"
          marginheight="0"
          marginwidth="0"
          scrolling="no"
          src="http://vol-907.podomatic.com/embed/frame/posting/2011-01-30T14_42_53-08_00?json_url=http%3A%2F%2Fvol-907.podomatic.com%2Fentry%2Fembed_params%2F2011-01-30T14_42_53-08_00%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26width%3D440%26height%3D85%26objembed%3D0"
          width="440"
        ></iframe>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'https://vol-907.podomatic.com/enclosure/2011-01-30T14_42_53-08_00.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should write a timestamp that only an escape keeps in its slot', async () => {
      const value = '<iframe src="http://vol-907.podomatic.com/embed/frame/posting/a%3Fb"></iframe>'
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'https://vol-907.podomatic.com/enclosure/a%3Fb.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a posting frame with no timestamp', async () => {
      const value = '<iframe src="http://vol-907.podomatic.com/embed/frame/posting/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a frame route that is not the posting frame', async () => {
      const value =
        '<iframe src="http://vol-907.podomatic.com/embed/frame/player/2011-01-30T14_42_53-08_00?r=podomatic.com/embed/frame/posting/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the posting route below a leading segment', async () => {
      const value =
        '<iframe src="http://vol-907.podomatic.com/x/embed/frame/posting/2011-01-30T14_42_53-08_00"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the posting path', async () => {
      const value =
        '<iframe src="https://evil.test/embed/frame/posting/2011-01-30T14_42_53-08_00?r=podomatic.com/embed/frame/posting/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
