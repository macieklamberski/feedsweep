import { describe, expect, it } from 'bun:test'
import {
  isPlayerJsReady,
  playerJsPlayRequest,
  readIframeResizeHeight,
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
