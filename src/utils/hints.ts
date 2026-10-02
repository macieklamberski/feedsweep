import { coerceNumber, isPlainObject } from 'trousse'

// A height a player reported, or nothing. A player says 0 before it has rendered and `null`
// for a post it could not load, and neither is a size to draw.
export const readPixels = (value: unknown): number | undefined => {
  const pixels = coerceNumber(value)

  return pixels !== undefined && pixels > 0 ? pixels : undefined
}

// player.js takes the message as a JSON string, not an object, and answers the same way.
// Several podcast players share it. The player drops a message whose origin differs from its
// `document.referrer`, so the frame has to be given one.
export const playerJsPlayRequest = JSON.stringify({
  context: 'player.js',
  version: '0.0.11',
  method: 'play',
})

export const isPlayerJsReady = (data: unknown): boolean => {
  if (typeof data !== 'string') {
    return false
  }

  try {
    const message: unknown = JSON.parse(data)

    return isPlainObject(message) && message.context === 'player.js' && message.event === 'ready'
  } catch {
    return false
  }
}

// The height several embeds post unasked as an object, `{ height }`, beside fields of their own.
export const readObjectHeight = (data: unknown): number | undefined => {
  return isPlainObject(data) ? readPixels(data.height) : undefined
}

// The resize message several embeds post unasked, `{ src, context: 'iframe.resize', height }`
// serialised to a JSON string.
export const readIframeResizeHeight = (data: unknown): number | undefined => {
  if (typeof data !== 'string') {
    return
  }

  try {
    const message: unknown = JSON.parse(data)

    if (isPlainObject(message) && message.context === 'iframe.resize') {
      return readPixels(message.height)
    }
  } catch {}
}

// iframe-resizer's start message. A frame running its child script reports no height until a
// parent sends it, then answers and posts again on every resize. `f0` is the frame id the
// answer echoes back.
export const iframeResizerHeightRequest =
  '[iFrameSizer]f0:8:false:false:32:true:true:null:bodyOffset:null:null:0:false:parent:scroll'

const iframeResizerMessageRegex = /^\[iFrameSizer\][^:]*:(\d+(?:\.\d+)?):/

// The height in iframe-resizer's answer, `[iFrameSizer]{id}:{height}:{width}:{event}`.
export const readIframeResizerHeight = (data: unknown): number | undefined => {
  if (typeof data !== 'string') {
    return
  }

  return readPixels(data.match(iframeResizerMessageRegex)?.[1])
}
