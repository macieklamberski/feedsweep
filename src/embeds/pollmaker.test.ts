import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  pollmakerFormEmbedResolver,
  pollmakerIframeEmbedResolver,
  pollmakerResolveEmbed,
} from './pollmaker.js'

describe('pollmakerResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the poll frame', () => {
      const value = 'https://poll-maker.com/frame4654868x583844A9-146'
      const expected: EmbedResolverResult = {
        provider: 'pollmaker',
        id: '4654868x583844A9-146',
        src: 'https://poll-maker.com/frame4654868x583844A9-146',
        url: 'https://poll-maker.com/poll4654868x583844A9-146',
        height: 372,
      }

      expect(pollmakerResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the poll frame from the framed poll page', () => {
      const value = 'https://poll-maker.com/poll5628566x03f27FD0-165'
      const expected: EmbedResolverResult = {
        provider: 'pollmaker',
        id: '5628566x03f27FD0-165',
        src: 'https://poll-maker.com/frame5628566x03f27FD0-165',
        url: 'https://poll-maker.com/poll5628566x03f27FD0-165',
        height: 372,
      }

      expect(pollmakerResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the poll frame from the results route on the www host', () => {
      const value = 'http://www.poll-maker.com/results51229xe38A54C7-3'
      const expected: EmbedResolverResult = {
        provider: 'pollmaker',
        id: '51229xe38A54C7-3',
        src: 'https://poll-maker.com/frame51229xe38A54C7-3',
        url: 'https://poll-maker.com/poll51229xe38A54C7-3',
        height: 372,
      }

      expect(pollmakerResolveEmbed(value)).toEqual(expected)
    })

    it('should read the route word in any case and keep the id as written', () => {
      const value = 'https://poll-maker.com/Frame4654868x583844A9-146'
      const expected: EmbedResolverResult = {
        provider: 'pollmaker',
        id: '4654868x583844A9-146',
        src: 'https://poll-maker.com/frame4654868x583844A9-146',
        url: 'https://poll-maker.com/poll4654868x583844A9-146',
        height: 372,
      }

      expect(pollmakerResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the query', () => {
      const value = 'https://poll-maker.com/frame4654868x583844A9-146?utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'pollmaker',
        id: '4654868x583844A9-146',
        src: 'https://poll-maker.com/frame4654868x583844A9-146',
        url: 'https://poll-maker.com/poll4654868x583844A9-146',
        height: 372,
      }

      expect(pollmakerResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/frame4654868x583844A9-146'

      expect(pollmakerResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the loader host', () => {
      const value = 'https://scripts.poll-maker.com/frame4654868x583844A9-146'

      expect(pollmakerResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a site page that starts with a route word', () => {
      const value = 'https://poll-maker.com/polls'

      expect(pollmakerResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an unknown route word', () => {
      const value = 'https://poll-maker.com/survey4654868x583844A9-146'

      expect(pollmakerResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the route under a prefix', () => {
      const value = 'https://poll-maker.com/x/frame4654868x583844A9-146'

      expect(pollmakerResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the route with a trailing segment', () => {
      const value = 'https://poll-maker.com/frame4654868x583844A9-146/extra'

      expect(pollmakerResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pollmakerIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pollmakerIframeEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the newer snippet iframe', async () => {
      const value = html`
        <iframe
          class="qp_iframe"
          src="https://poll-maker.com/frame4654868x583844A9-146"
          seamless="seamless"
          frameborder="no"
          style="border:0; background:transparent; width:100%; height:1000px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pollmaker',
        id: '4654868x583844A9-146',
        src: 'https://poll-maker.com/frame4654868x583844A9-146',
        url: 'https://poll-maker.com/poll4654868x583844A9-146',
        height: 372,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('pollmakerFormEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pollmakerFormEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the qp_main inside the qp_all wrapper', async () => {
      const value = html`
        <div id="qp_all1932527">
          <style>#qp_main1932527 .qp_btna:hover input {background: rgb(255,215,169)!important}</style>
          <br />
          <link
            href="//fonts.googleapis.com/css?family=Open+Sans"
            rel="stylesheet"
          />
          <div
            cmt="0"
            fp="9B3E41f8-53"
            id="qp_main1932527"
            results="0"
          >
            <div><div><div>Which book should I read?</div></div></div>
            <form
              action="//www.poll-maker.com/results1932527x9B3E41f8-53"
              id="qp_form1932527"
              method="post"
              target="_blank"
            >
              <div class="qp_a">
                <span>
                  <input
                    name="qp_v1932527"
                    type="radio"
                    value="1"
                  />
                </span>
                <div><span>Illusions of Fate by Kiersten White</span></div>
              </div>
              <input
                btype="v"
                name="qp_b1932527"
                type="submit"
                value="Vote"
              />
            </form>
          </div>
          <div><div>Created with <a href="http://pollmaker.vote/e/DGHLPKSM" id="qp_foot1932527">Survey Maker</a></div></div>
          <script language="javascript" src="//scripts.poll-maker.com/3012/scpolls.js"></script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'pollmaker',
        id: '1932527x9B3E41f8-53',
        src: 'https://poll-maker.com/frame1932527x9B3E41f8-53',
        url: 'https://poll-maker.com/poll1932527x9B3E41f8-53',
        height: 372,
        title: 'Which book should I read?',
        description: 'Illusions of Fate by Kiersten White',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the placeholder from the older snippet with qp_main alone', async () => {
      const value = html`
        <div id="qp_main51229">
          <div><div>Who will win the NFC North?</div></div>
          <form
            action="http://www.poll-maker.com/results51229xe38A54C7-3"
            id="qp_form51229"
            method="post"
            target="_blank"
          >
            <div>
              <span>
                <input
                  name="qp_v51229"
                  type="radio"
                  value="1"
                />The Green Bay Packers</span>
            </div>
            <div>
              <span>
                <input
                  name="qp_v51229"
                  type="radio"
                  value="2"
                />The Chicago Bears</span>
            </div>
            <a href="http://www.poll-maker.com/" id="qp_a51229">Poll Maker</a>
          </form>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'pollmaker',
        id: '51229xe38A54C7-3',
        src: 'https://poll-maker.com/frame51229xe38A54C7-3',
        url: 'https://poll-maker.com/poll51229xe38A54C7-3',
        height: 372,
        title: 'Who will win the NFC North?',
        description: 'The Green Bay Packers\nThe Chicago Bears',
      }

      expect(await extract(value)).toEqual(expected)
    })
    it('should read the options of a multiple-choice poll', async () => {
      const value = html`
        <div id="qp_all402569">
          <div id="qp_main402569">
            <div><div>Vote for the 2015 Murder, Monsters &amp; Mayhem Logo/Button!</div></div>
            <form
              id="qp_form402569"
              action="//www.poll-maker.com/results402569xf1d2442D-15"
              method="post"
              target="_blank"
            >
              <div class="qp_a">
                <span>
                  <input
                    name="qp_v402569"
                    type="checkbox"
                    value="1"
                  />
                </span>
                <div><span>Option A</span></div>
              </div>
            </form>
          </div>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'pollmaker',
        id: '402569xf1d2442D-15',
        src: 'https://poll-maker.com/frame402569xf1d2442D-15',
        url: 'https://poll-maker.com/poll402569xf1d2442D-15',
        height: 372,
        title: 'Vote for the 2015 Murder, Monsters & Mayhem Logo/Button!',
        description: 'Option A',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the same snippet from Quiz Maker', async () => {
      const value = html`
        <div id="qp_main2975771">
          <div><div>Should I post on my personal website projects made by other persons?</div></div>
          <form
            id="qp_form2975771"
            action="//www.quiz-maker.com/results2975771x50049d03-88"
            method="post"
            target="_blank"
          >
            <div class="qp_a">
              <span>
                <input
                  name="qp_v2975771"
                  type="radio"
                  value="1"
                />Post projects made by partners and indicate name / contact info of the author</span>
            </div>
          </form>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a qp_main with no form', async () => {
      const value = html`
        <div id="qp_main51229">
          <div><div>Who will win the NFC North?</div></div>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('poll maker snippets the pipeline replaces', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace qp_main and leave the rest of the qp_all wrapper', async () => {
    const value = html`
      <p>Vote below.</p>
      <div id="qp_all1932527">
        <div id="qp_main1932527">
          <div><div><div>Which book should I read?</div></div></div>
          <form
            action="//www.poll-maker.com/results1932527x9B3E41f8-53"
            id="qp_form1932527"
            method="post"
            target="_blank"
          >
            <div class="qp_a">
              <span>
                <input
                  name="qp_v1932527"
                  type="radio"
                  value="1"
                />
              </span>
              <div><span>Illusions of Fate by Kiersten White</span></div>
            </div>
          </form>
        </div>
        <div><div>Created with <a href="http://pollmaker.vote/e/DGHLPKSM" id="qp_foot1932527">Survey Maker</a></div></div>
        <script language="javascript" src="//scripts.poll-maker.com/3012/scpolls.js"></script>
      </div>
    `
    const expected = html`
      <p>Vote below.</p>
      <div
        data-embed-height="372"
        data-embed-title="Which book should I read?"
        data-embed-description="Illusions of Fate by Kiersten White"
        data-embed-url="https://poll-maker.com/poll1932527x9B3E41f8-53"
        data-embed-id="1932527x9B3E41f8-53"
        data-embed-provider="pollmaker"
        data-embed-src="https://poll-maker.com/frame1932527x9B3E41f8-53"
      ></div>
      <p>Created with <a id="qp_foot1932527" href="http://pollmaker.vote/e/DGHLPKSM">Survey Maker</a></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace the newer snippet iframe at the poll size', async () => {
    const value = html`
      <iframe
        class="qp_iframe"
        src="https://poll-maker.com/frame4654868x583844A9-146"
        seamless="seamless"
        frameborder="no"
        style="border:0; background:transparent; width:100%; height:1000px;"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="372"
        data-embed-url="https://poll-maker.com/poll4654868x583844A9-146"
        data-embed-id="4654868x583844A9-146"
        data-embed-provider="pollmaker"
        data-embed-src="https://poll-maker.com/frame4654868x583844A9-146"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep the prose and links a publisher typed into qp_all', async () => {
    const value = html`
      <div id="qp_all329271">
        <div>Οι πολίτες της Άνδρου έλαβαν μια σειρά ενημερώσεων για το ζήτημα ΧΥΤΥ.</div>
        <ol>
          <li><a href="http://www.kokoras.net/2015/05/blog-post_27.html">Οι αλήθειες για τα ΧΥΤΥ - Επιστημονική έρευνα</a></li>
        </ol>
        <div id="qp_main329271">
          <div><div>Τι θα απαντήσετε;</div></div>
          <form
            action="//www.poll-maker.com/results329271x6228421A-12"
            id="qp_form329271"
            method="post"
          >
            <div class="qp_a">
              <span>
                <input
                  name="qp_v329271"
                  type="radio"
                  value="1"
                />ΝΑΙ</span>
            </div>
          </form>
        </div>
      </div>
    `
    const expected = html`
      <p>Οι πολίτες της Άνδρου έλαβαν μια σειρά ενημερώσεων για το ζήτημα ΧΥΤΥ.</p>
      <ol>
        <li><a href="http://www.kokoras.net/2015/05/blog-post_27.html">Οι αλήθειες για τα ΧΥΤΥ - Επιστημονική έρευνα</a></li>
      </ol>
      <div
        data-embed-height="372"
        data-embed-title="Τι θα απαντήσετε;"
        data-embed-description="ΝΑΙ"
        data-embed-url="https://poll-maker.com/poll329271x6228421A-12"
        data-embed-id="329271x6228421A-12"
        data-embed-provider="pollmaker"
        data-embed-src="https://poll-maker.com/frame329271x6228421A-12"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a stale wrapper and claim only the poll nested in it', async () => {
    const value = html`
      <div id="qp_all434649">
        <div><span>When God made my family he gave us a double portion of competitiveness.</span></div>
        <div id="qp_main434649">
          <div>
            <div class="separator"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEimIdxU-ogb1uA_lG8i-qDT_TwOGSbF4tcY4RbN3Of2uNHrKp5xf6xCcUawbO5BfJXXzbS92UpGxnPRxqmflSvXqot1xIKlNIBUBjPJ0L82vH_srzxORNKLXnDZHkLbwWK3pbRduJ1EUFm8/s640/IMG_3999.jpg"></div>
            <div class="separator"><span>Wine Barrel</span></div>
            <div id="qp_all436149">
              <div id="qp_main436149">
                <div><div>My favorite pumpkin is:</div></div>
                <form
                  action="//www.poll-maker.com/results436149xE0B64CA5-17"
                  id="qp_form436149"
                  method="post"
                >
                  <div class="qp_a">
                    <span>
                      <input
                        name="qp_v436149"
                        type="radio"
                        value="1"
                      />
                    </span>
                    <div><span>Wine Barrel</span></div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const expected = html`
      <p><span>When God made my family he gave us a double portion of competitiveness.</span></p>
      <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEimIdxU-ogb1uA_lG8i-qDT_TwOGSbF4tcY4RbN3Of2uNHrKp5xf6xCcUawbO5BfJXXzbS92UpGxnPRxqmflSvXqot1xIKlNIBUBjPJ0L82vH_srzxORNKLXnDZHkLbwWK3pbRduJ1EUFm8/s640/IMG_3999.jpg">
      <p><span>Wine Barrel</span></p>
      <div
        data-embed-height="372"
        data-embed-title="My favorite pumpkin is:"
        data-embed-description="Wine Barrel"
        data-embed-url="https://poll-maker.com/poll436149xE0B64CA5-17"
        data-embed-id="436149xE0B64CA5-17"
        data-embed-provider="pollmaker"
        data-embed-src="https://poll-maker.com/frame436149xE0B64CA5-17"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
