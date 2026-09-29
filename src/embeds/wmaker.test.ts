import { describe, expect, it } from 'bun:test'
import { composeEmbedUrl, isFlashPlayerUrl } from './wmaker.js'

describe('isFlashPlayerUrl', () => {
  it('should accept the player path holding a sha1', () => {
    const value = 'https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba'

    expect(isFlashPlayerUrl(value)).toBe(true)
  })

  it('should accept a player url carrying a query', () => {
    const value = 'https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba?autoplay=1'

    expect(isFlashPlayerUrl(value)).toBe(true)
  })

  it('should refuse a sha1 that is the wrong length', () => {
    const value = 'https://www.hospitalia.fr/v/633ed090acc56dbee0'

    expect(isFlashPlayerUrl(value)).toBe(false)
  })

  it('should refuse a Flash url that is not a WMaker player', () => {
    const value = 'https://example.com/player/movie.swf'

    expect(isFlashPlayerUrl(value)).toBe(false)
  })

  it('should refuse a missing url', () => {
    expect(isFlashPlayerUrl(undefined)).toBe(false)
  })
})

describe('composeEmbedUrl', () => {
  it('should mint the embed route from the article id in the permalink', () => {
    const value = 'https://www.hospitalia.fr/Soiree-debat-Softway-Medical_a4183.html'

    expect(composeEmbedUrl(value)).toBe('https://www.hospitalia.fr/embed/4183/')
  })

  it('should read the article id from a permalink carrying a query', () => {
    const value = 'https://www.hospitalia.fr/Soiree-debat-Softway-Medical_a4183.html?xtor=RSS-1'

    expect(composeEmbedUrl(value)).toBe('https://www.hospitalia.fr/embed/4183/')
  })

  it('should read the article id from a permalink carrying a fragment', () => {
    const value = 'https://www.hospitalia.fr/Soiree-debat-Softway-Medical_a4183.html#xtor=RSS-1'

    expect(composeEmbedUrl(value)).toBe('https://www.hospitalia.fr/embed/4183/')
  })

  it('should return undefined for a permalink stating no article id', () => {
    const value = 'https://www.hospitalia.fr/index.html'

    expect(composeEmbedUrl(value)).toBeUndefined()
  })

  // The embed route lives on the publisher's own origin, which a relative permalink does not name.
  it('should return undefined for a relative permalink', () => {
    const value = '/Soiree-debat-Softway-Medical_a4183.html'

    expect(composeEmbedUrl(value)).toBeUndefined()
  })

  it('should return undefined when there is no permalink', () => {
    expect(composeEmbedUrl(undefined)).toBeUndefined()
  })
})
