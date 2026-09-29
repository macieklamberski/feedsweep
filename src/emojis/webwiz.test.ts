import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('webWizEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('Web Wiz Forums (numbered files under /smileys/)', () => {
    // Web Wiz's own drawings, known by number under its directory alone.
    const faceCases: Array<[string, string]> = [
      ['smiley1', 'Smile'],
      ['smiley2', 'Wink'],
      ['smiley3', 'Shocked'],
      ['smiley4', 'Big smile'],
      ['smiley5', 'Confused'],
      ['smiley6', 'Unhappy'],
      ['smiley7', 'Angry'],
      ['smiley8', 'Clown'],
      ['smiley9', 'Embarrassed'],
      ['smiley10', 'Star'],
      ['smiley11', 'Dead'],
      ['smiley12', 'Sleepy'],
      ['smiley13', 'Disapprove'],
      ['smiley14', 'Approve'],
      ['smiley15', 'Evil Smile'],
      ['smiley16', 'Cool'],
      ['smiley17', 'Tongue'],
      ['smiley18', 'Ouch'],
      ['smiley19', 'Cry'],
      ['smiley20', 'Thumbs Up'],
      ['smiley21', 'Thumbs Down'],
      ['smiley22', 'Stern Smile'],
      ['smiley23', 'Geek'],
      ['smiley24', 'Ermm'],
      ['smiley25', 'Question'],
      ['smiley26', 'Pinch'],
      ['smiley27', 'Heart'],
      ['smiley28', 'Broken Heart'],
      ['smiley29', 'Wacko'],
      ['smiley30', 'Pig'],
      ['smiley31', 'Hug'],
      ['smiley32', 'Clap'],
      ['smiley33', 'Ying Yang'],
      ['smiley34', 'Nuke'],
      ['smiley35', 'Censored'],
      ['smiley36', 'LOL'],
      ['smiley37', 'Exclamation'],
      ['smiley38', 'Lamp'],
      ['smiley39', 'Sick'],
      ['smiley40', 'Party'],
      ['smiley41', 'Beer'],
      ['smiley42', 'Handshake'],
    ]

    it.each(faceCases)('should mark the %s face', async (name, alt) => {
      const value = html`
        <p>
          <img
            src="https://example.com/forum/smileys/${name}.gif"
            border="0"
            alt="${alt}"
            title="${alt}"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/forum/smileys/${name}.gif"
            border="0"
            alt="${alt}"
            title="${alt}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a face linked relative to the forum root', async () => {
      const value = html`
        <p>
          <img
            src="smileys/smiley2.gif"
            border="0"
            alt="Wink"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="smileys/smiley2.gif"
            border="0"
            alt="Wink"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
