import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { podomaticFlashMediaResolver } from './podomatic.js'

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
