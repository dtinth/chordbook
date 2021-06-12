/* global Vue VueYouTubeEmbed sharp11 App */
Vue.use(VueYouTubeEmbed.default)

var isDevMode = location.host !== 'dtinth-chordbook.netlify.com'

var source = document.querySelector('#src').textContent
document.querySelector('#src').remove()

/**
 * A singleton that manages the synchronization state with the playing YouTube video.
 */
const videoState = {
  callbacks: new Set(),
  currentTime: 0,
  playing: false,
  reconcile() {
    for (const cb of videoState.callbacks) cb()
  },
  register(callback) {
    videoState.callbacks.add(callback)
  },
  unregister(callback) {
    videoState.callbacks.delete(callback)
  },
  seekTo(t) {},
}

/**
 * Parses the chordchart source.
 */
function parseData(source) {
  const lines = source.split('\n').map((l) => l.trim())
  let scale
  let currentScale = sharp11.scale.create('C', 'major')
  const rows = []
  let blockId = 0
  let youtubeId = null
  let bpm = 60
  let offset = 0
  let currentTime = 0
  let lastBlock
  let title
  let lastChord
  const makeBlock = (chord, blockIndex, size = 1) => {
    const start = currentTime
    if (lastBlock) lastBlock.end = start
    currentTime += (60 / bpm) * size
    const block = {
      size,
      chord,
      sustainedChord: chord || lastChord,
      blockId: blockId++,
      blockIndex,
      start,
      end: Infinity,
    }
    lastBlock = block
    lastChord = chord || lastChord
    return block
  }
  for (const line of lines) {
    const tokens = line.match(/\S+/g) || []
    if (tokens.length === 0) {
      if (rows.length > 0 && rows[rows.length - 1].type !== 'blank') {
        rows.push({ type: 'blank' })
      }
    } else if (tokens[0] === ';') {
      const text = tokens.slice(1).join(' ')
      rows.push({ type: 'lyrics', text })
    } else if (tokens[0] === 'scale') {
      currentScale = sharp11.scale.create(tokens[1], tokens[2] || 'major')
      if (!scale) scale = currentScale
    } else if (tokens[0] === 'youtube') {
      youtubeId = tokens[1]
    } else if (tokens[0] === 'title') {
      title = tokens.slice(1).join(' ')
    } else if (tokens[0] === 'offset') {
      offset = +tokens[1]
      currentTime += +tokens[1]
    } else if (tokens.length === 1 && /:$/.test(tokens[0])) {
      rows.push({ type: 'section', name: tokens[0].slice(0, -1) })
    } else {
      const blocks = []
      let buf = null
      let size = 1
      for (const t of tokens) {
        if (t === 'bpm') {
          buf = 'bpm'
        } else if (buf === 'bpm') {
          buf = null
          bpm = +t
        } else if (t.substr(0, 1) === '*') {
          const [num, den] = t.substr(1).split('/')
          size = +num / (+den || 1)
        } else if (t === '/') {
          blocks.push(makeBlock(null, blocks.length, size))
        } else {
          const m = t.match(/^([b#]?)(\d)(.*?)(\/([b#]?)(\d))?$/)
          if (m) {
            blocks.push(
              makeBlock(
                {
                  scale: currentScale,
                  root: [m[1], m[2]],
                  bass: m[4] && [m[5], m[6]],
                  extra: m[3],
                },
                blocks.length,
                size
              )
            )
          } else {
            console.warn('Cannot parse token:', t)
          }
        }
      }
      if (blocks.length) {
        rows.push({ type: 'chord', blocks })
      }
    }
  }
  if (!scale) scale = currentScale
  return { rows, youtubeId, bpm, offset, title, scale }
}

Vue.component('chordbook-app', {
  props: ['song'],
  data() {
    const data = this.song
    return {
      selectedKey: data.scale.key.name,
      devMode: isDevMode,
      availableKeys: [
        'C',
        'Db',
        'D',
        'Eb',
        'E',
        'F',
        'Gb',
        'G',
        'Ab',
        'A',
        'Bb',
        'B',
      ],
      options: {
        autoScroll: false,
        autoScrollRate: 10,
      },
    }
  },
  mounted() {
    let bufferedScroll = 0
    let lastTime
    const getNominalRate = () => {
      if (this.options.autoScrollRate === 10 && videoState.playing) {
        const target = autoScroller.getScrollingPositionAtTime(
          videoState.currentTime
        )
        if (target !== null) return (target - window.scrollY) * 0.25
      }
      return autoScroller.getScrollingRateAtScrollingPosition(
        Math.floor(window.scrollY)
      )
    }
    const frame = () => {
      requestAnimationFrame(frame)
      const now = Date.now()
      if (lastTime) {
        if (this.options.autoScroll) {
          const nominalRate = getNominalRate()
          bufferedScroll +=
            ((now - lastTime) / 1000) *
            (this.options.autoScrollRate / 10) *
            nominalRate
          if (bufferedScroll >= 1) {
            const y = Math.floor(bufferedScroll)
            bufferedScroll -= y
            window.scrollBy(0, y)
          } else if (bufferedScroll <= -1) {
            const y = -Math.floor(Math.abs(bufferedScroll))
            bufferedScroll -= y
            window.scrollBy(0, y)
          }
        }
      }
      lastTime = now
    }
    this.$watch(
      () => this.song.title,
      (title) => (document.title = `${title} — dtinth’s interactive chordbook`),
      { immediate: true }
    )
    requestAnimationFrame(frame)
  },
  methods: {
    onReady() {
      const player = this.$refs.youtube.player
      videoState.seekTo = (t) => player.seekTo(t, true)
      const frame = () => {
        requestAnimationFrame(frame)
        videoState.currentTime = player.getCurrentTime()
        videoState.playing = player.getPlayerState() === 1
        videoState.reconcile()
      }
      requestAnimationFrame(frame)
    },
  },
  computed: {
    transposeInterval() {
      const selectedKey = this.selectedKey
      const nativeKey = this.song.scale.key.name
      return sharp11.note.create(nativeKey).getInterval(selectedKey)
    },
    transpose() {
      const hs = this.transposeInterval.halfSteps()
      const val = hs > 6 ? hs - 12 : hs
      return val === 0 ? '' : ` (transpose ${val > 0 ? '+' : ''}${val})`
    },
  },
  template: `<div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <span class="navbar-brand">dtinth’s interactive chordbook <small class="text-muted" v-if="devMode">dev mode</small></span>
    </nav>
    <div class="container py-4">
      <h1 class="h4">{{ song.title }}</h1>
      <p>Key: <select v-model="selectedKey" class="custom-select d-inline-block" style="width: 5em;">
        <option v-for="key of availableKeys" :value="key">{{key}} {{ song.scale.key.name === key ? '[*]' : '' }}</option>
      </select> {{ song.scale.name }} <span class="text-muted">{{ transpose }}</span></p>
      <template v-if="song.youtubeId">
        <div class="video-player">
          <youtube :video-id="song.youtubeId" ref="youtube" @ready="onReady" player-width="320" player-height="180"></youtube>
        </div>
      </template>
      <div v-for="row, index of song.rows" :key="index">
        <template v-if="row.type === 'section'">
          <h3 class="text-muted h6">{{row.name}}</h3>
        </template>
        <template v-if="row.type === 'blank'">
          <div class="mb-3"></div>
        </template>
        <template v-if="row.type === 'lyrics'">
          <div class="blockquote mb-0">{{row.text}}</div>
        </template>
        <template v-if="row.type === 'chord'">
          <div class="d-flex">
            <chord-block :key="block.blockId" v-for="block of row.blocks" :block="block" :transpose-interval="transposeInterval">
            </chord-block>
          </div>
        </template>
      </div>
    </div>
    <options-panel :options="options"></options-panel>
  </div>`,
})

Vue.component('options-panel', {
  props: ['options'],
  data() {
    return {
      open: false,
    }
  },
  methods: {
    toggle() {
      this.open = !this.open
    },
    updateAutoScroll(t) {
      this.options.autoScrollRate += t
    },
  },
  template: `<div style="position:fixed;top:0;right:20px;background:#ccc;" class="p-2">
    <div class="text-right">
      <button class="btn btn-outline-secondary" @click="toggle">🛠</button>
    </div>
    <div v-if="open" class="bg-white p-2 mt-2">
      <div class="custom-control custom-checkbox">
        <input type="checkbox" class="custom-control-input" id="autoScroll" v-model="options.autoScroll">
        <label class="custom-control-label" for="autoScroll">Auto-scroll</label>
      </div>
      speed
      <button type="button" class="btn btn-link" @click="updateAutoScroll(-5)">-</button>
      {{options.autoScrollRate}}
      <button type="button" class="btn btn-link" @click="updateAutoScroll(5)">+</button>
    </div>
  </div>`,
})

const autoScroller = (() => {
  let dirty = true
  let segments
  const elements = new Map()
  const CurveInterpolator = window['curve-interpolator'].CurveInterpolator
  function ensureSegmentsUpToDate() {
    if (dirty) {
      const basicPoints = []
      let maxTime = 0
      let lastY = 0
      for (const [element, { time }] of elements) {
        basicPoints.push([time, lastY - 64])
        lastY = element.offsetTop
        if (time > maxTime) maxTime = time
      }
      const basicInterpolator = new CurveInterpolator(basicPoints, 1)
      const extrapolatedPoints = []
      maxTime = Math.ceil(maxTime)
      for (let i = 0; i <= maxTime; i++) {
        let sum = 0,
          count = 0
        for (let j = -5; j <= 5; j++) {
          for (const y of basicInterpolator.y(i + j)) {
            sum += y
            count++
          }
        }
        if (count) {
          extrapolatedPoints.push([i, sum / count])
        }
      }
      segments = new CurveInterpolator(extrapolatedPoints, 1)
      dirty = false
    }
  }
  window.addEventListener('resize', () => {
    dirty = true
  })
  return {
    register(element, time) {
      elements.set(element, { time })
      dirty = true
    },
    getScrollingRateAtScrollingPosition(scrollingPosition) {
      ensureSegmentsUpToDate()
      const { y1: minScroll } = segments.getBoundingBox()
      if (scrollingPosition < minScroll) return 100
      const a = segments.x(scrollingPosition)
      const b = segments.x(scrollingPosition + 1)
      if (a.length === 1 && b.length === 1 && b[0] > a[0]) {
        const time = b[0] - a[0]
        return 1 / time
      }
      return 0
    },
    getScrollingPositionAtTime(time) {
      ensureSegmentsUpToDate()
      const a = segments.y(time)
      if (a.length === 1) return a[0]
      return null
    },
  }
})()

let audioContext

function mtof(m) {
  return 440 * Math.pow(2, (m - 69) / 12)
}

function startPlayingChord(name) {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  const ctx = audioContext
  let chord = sharp11.chord.create(name, 5)
  if (chord.chord[chord.chord.length - 1].octave > 5)
    chord = chord.inOctave(chord.octave - 1)
  const play = (value, delay = 0) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const t = ctx.currentTime + delay
    const st = t + 0.1
    const baseVolume = 0.15
    o.frequency.value = mtof(value)
    o.connect(g)
    g.connect(ctx.destination)
    g.gain.setValueAtTime(baseVolume, t)
    g.gain.linearRampToValueAtTime(baseVolume * 0.8, st)
    o.start(t)
    return {
      stop() {
        const l = 0.1
        const t = Math.max(st, ctx.currentTime + delay)
        g.gain.setValueAtTime(baseVolume * 0.8, t)
        g.gain.linearRampToValueAtTime(0, t + l)
        o.stop(t + l)
      },
    }
  }
  const instances = [
    play(chord.chord[0].value() - 24),
    ...chord.chord.map((note, index) => play(note.value(), index * 0.05)),
  ]
  return {
    stop() {
      instances.forEach((i) => i.stop())
    },
  }
}

Vue.component('chord-block', {
  props: ['block', 'transposeInterval'],
  data() {
    return { active: false }
  },
  template: `<button
    class="chord-block"
    :class="{'is-active':active,'is-empty':empty}"
    :data-interval="halfStepsFromTonic"
    :style="{'--size':block.size}"
    @click="seek"
    @mouseenter="previewChord($event)"
    @mouseleave="stopPreviewingChord($event)"
  >
    {{text}}
  </button>`,
  mounted() {
    this.cb = () => {
      const t = videoState.currentTime
      this.active = this.block.start <= t && t < this.block.end
    }
    if (this.block.blockIndex === 0) {
      autoScroller.register(this.$el, this.block.start)
    }
    videoState.register(this.cb)
  },
  beforeDestroy() {
    videoState.unregister(this.cb)
  },
  methods: {
    seek() {
      videoState.seekTo(this.block.start)
    },
    previewChord(e) {
      if (!this.chordText) return
      if (!e.altKey) return
      this.currentlyPlayingChord = startPlayingChord(this.chordText)
    },
    stopPreviewingChord(e) {
      if (this.currentlyPlayingChord) {
        this.currentlyPlayingChord.stop()
        this.currentlyPlayingChord = null
      }
    },
  },
  computed: {
    chordText() {
      const chord = this.block.chord
      if (!chord) return ''
      const transposeScale = (scale, interval) => {
        if (interval.halfSteps() === 0) return scale
        let key = scale.key.transpose(interval)
        if (key.acc === '#') key = key.toggleAccidental()
        return sharp11.scale.create(key, scale.name)
      }
      const currentScale = transposeScale(chord.scale, this.transposeInterval)
      const getNote = (accidental, number) => {
        let note = currentScale.scale[number - 1]
        if (accidental === '#') note = note.sharp()
        if (accidental === 'b') note = note.flat()
        return note.clean()
      }
      const root = getNote(...chord.root)
      const bass = chord.bass && getNote(...chord.bass)
      const chordText = root.name + chord.extra + (bass ? `/${bass.name}` : '')
      return chordText
    },
    halfStepsFromTonic() {
      const chord = this.block.sustainedChord
      if (!chord) return ''
      const currentScale = chord.scale
      const getNote = (accidental, number) => {
        let note = currentScale.scale[number - 1]
        if (accidental === '#') note = note.sharp()
        if (accidental === 'b') note = note.flat()
        return note.clean()
      }
      const root = getNote(...chord.root)
      const bass = chord.bass && getNote(...chord.bass)
      const tonic = getNote('', 1)
      const interval = tonic.getInterval(bass || root).halfSteps()
      return interval
    },
    text() {
      return this.chordText || String.fromCharCode(160)
    },
    empty() {
      return !this.chordText
    },
  },
})

if (window.location.search.match(/postToParent/) && window.parent) {
  window.parent.postMessage(
    {
      type: 'postToParent',
      source,
    },
    '*'
  )
  new Vue({
    el: '#app',
    template: `<div>Sent new source!</div>`,
  })
} else {
  var data = parseData(source)
  const reloadIframeSet = new Set()
  App = new Vue({
    el: '#app',
    data: { song: data },
    template: `<chordbook-app :song="song"></chordbook-app>`,
  })
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'postToParent') {
      try {
        const data = parseData(e.data.source)
        App.song = data
      } catch (e) {
        console.error(e)
        alert(e)
      } finally {
        for (const iframe of [...reloadIframeSet]) {
          iframe.remove()
        }
      }
    }
  })
  if (isDevMode) {
    window.addEventListener('keydown', (e) => {
      if (
        e.keyCode === 'R'.charCodeAt(0) &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault()
        const iframe = document.createElement('iframe')
        iframe.setAttribute('style', 'position: fixed; top: 0; left: 0')
        iframe.src = location.href.replace(
          /\?[^]*|$/,
          '?postToParent=' + Date.now()
        )
        document.body.appendChild(iframe)
        reloadIframeSet.add(iframe)
      }
    })
  }
}
