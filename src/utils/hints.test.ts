import { describe, expect, it } from 'bun:test'
import {
  isPlayerJsReady,
  playerJsPlayRequest,
  readIframeResizeHeight,
  readIframeResizerHeight,
  readObjectHeight,
  readPixels,
} from './hints.js'

describe('readPixels', () => {
  it('should keep a positive number', () => {
    expect(readPixels(321)).toBe(321)
    expect(readPixels(687.125)).toBe(687.125)
  })

  it('should drop what is not a rendered height', () => {
    expect(readPixels(0)).toBeUndefined()
    expect(readPixels(null)).toBeUndefined()
    expect(readPixels(undefined)).toBeUndefined()
    expect(readPixels('tall')).toBeUndefined()
  })
})

describe('isPlayerJsReady', () => {
  it('should recognise the ready event the receiver posts', () => {
    const value = JSON.stringify({
      context: 'player.js',
      version: '0.0.11',
      event: 'ready',
      value: { src: 'https://embed.acast.com/show/episode', events: ['ready', 'play'] },
    })

    expect(isPlayerJsReady(value)).toBe(true)
  })

  it('should ignore the other events and anything that is not player.js', () => {
    expect(isPlayerJsReady(JSON.stringify({ context: 'player.js', event: 'play' }))).toBe(false)
    expect(isPlayerJsReady({ context: 'player.js', event: 'ready' })).toBe(false)
    expect(isPlayerJsReady('{"eventName":"postmessage:do:init"}')).toBe(false)
    expect(isPlayerJsReady('not json')).toBe(false)
  })
})

describe('playerJsPlayRequest', () => {
  it('should be the play method as the string the receiver parses', () => {
    expect(JSON.parse(playerJsPlayRequest)).toEqual({
      context: 'player.js',
      version: '0.0.11',
      method: 'play',
    })
  })
})

describe('readIframeResizeHeight', () => {
  // Captured from `codesandbox.io/embed/1-uncontrolled-components-qhm6t?autoresize=1` in Chrome.
  it('should read the height out of a resize message posted as a string', () => {
    const value =
      '{"src":"https://codesandbox.io/embed/1-uncontrolled-components-qhm6t?autoresize=1","context":"iframe.resize","height":612}'

    expect(readIframeResizeHeight(value)).toBe(612)
  })

  it('should read nothing from a string that is not JSON', () => {
    expect(readIframeResizeHeight('{"context":"iframe.resize",')).toBeUndefined()
  })

  it('should read nothing from a resize message posted as an object', () => {
    const value = { context: 'iframe.resize', height: 664 }

    expect(readIframeResizeHeight(value)).toBeUndefined()
  })

  it('should read nothing from another message or an unrendered player', () => {
    expect(readIframeResizeHeight('{"context":"iframe.resize","height":0}')).toBeUndefined()
    expect(readIframeResizeHeight('{"context":"iframe.ready","height":500}')).toBeUndefined()
    expect(readIframeResizeHeight('iframe.resize')).toBeUndefined()
  })
})

describe('readIframeResizerHeight', () => {
  // Captured from `form.123formbuilder.com/5013627` framed on a cross-origin page in Chrome.
  it('should read the height out of the answer to the start message', () => {
    expect(readIframeResizerHeight('[iFrameSizer]f0:884.96875:640:init')).toBe(884.96875)
  })

  it('should read the height out of a resize the frame posts later', () => {
    expect(readIframeResizerHeight('[iFrameSizer]f0:1203:640:resize')).toBe(1203)
  })

  it('should read nothing from a message without the iframe-resizer prefix', () => {
    expect(readIframeResizerHeight('f0:884:640:init')).toBeUndefined()
  })

  it('should read nothing from a message with text before the prefix', () => {
    expect(readIframeResizerHeight('x[iFrameSizer]f0:884:640:init')).toBeUndefined()
  })

  it('should read nothing from an unrendered frame', () => {
    expect(readIframeResizerHeight('[iFrameSizer]f0:0:640:init')).toBeUndefined()
  })

  it('should read nothing from a message posted as an object', () => {
    expect(readIframeResizerHeight({ height: 884 })).toBeUndefined()
  })

  // The form scrolls a field into view with `parentIFrame.scrollToOffset(0, y)`.
  it('should read nothing from a scroll event, whose number is an offset', () => {
    expect(readIframeResizerHeight('[iFrameSizer]f0:420:0:scrollToOffset')).toBeUndefined()
  })
})

describe('readObjectHeight', () => {
  // Captured from a Bluesky post frame in Chrome.
  it('should read the height out of the message a Bluesky post posts', () => {
    expect(readObjectHeight({ height: 687.125, id: '1' })).toBe(687.125)
  })

  // Captured from `embed.documentcloud.org/documents/28200073/pages/1/?embed=1` in Chrome.
  it('should read the height out of the message a DocumentCloud page posts', () => {
    const value = {
      width: 600,
      height: 882,
      updateStyleProps: false,
      href: 'https://embed.documentcloud.org/documents/28200073/pages/1/?embed=1',
    }

    expect(readObjectHeight(value)).toBe(882)
  })

  // Captured from a HelloAsso event form framed on a cross-origin page in Chrome.
  it('should read the height out of the message a HelloAsso form posts', () => {
    expect(readObjectHeight({ height: 604 })).toBe(604)
  })

  it('should read nothing out of a message without a height', () => {
    expect(readObjectHeight({ id: '1' })).toBeUndefined()
  })

  it('should read nothing from a message posted as a string', () => {
    expect(readObjectHeight('{"height":604}')).toBeUndefined()
  })

  it('should read nothing from a frame that has not rendered', () => {
    expect(readObjectHeight({ height: 0 })).toBeUndefined()
  })
})
