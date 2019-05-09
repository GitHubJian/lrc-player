;(function(global, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory()
  } else if (typeof define === 'function' && define.amd) {
    define([], factory())
  } else if (typeof exports === 'object') {
    exports['LrcPlayer'] = factory()
  } else {
    global['LrcPlayer'] = factory()
  }
})(this, function() {
  function removeClass(element, value) {
    if (!value) {
      return
    }

    if (element.classList) {
      element.classList.remove(value)
      return
    }

    if (element.className.indexOf(value) >= 0) {
      element.className = element.className.replace(value, '')
    }
  }

  function addClass(element, value) {
    if (!value) {
      return
    }

    if (element.classList) {
      element.classList.add(value)
      return
    }

    let className = element.className.trim()

    if (!className) {
      element.className = value
    } else if (className.indexOf(value) < 0) {
      element.className = className + ' ' + value
    }
  }

  function hasClass(element, value) {
    return element.classList
      ? element.classList.contains(value)
      : element.className.indexOf(value) > -1
  }

  function isNumber(value) {
    return typeof value === 'number' && !isNaN(value)
  }

  var REGEXP_SUFFIX = /^(?:width|height|left|top|marginLeft|marginTop)$/
  function setStyle(element, styles) {
    let style = element.style
    Object.keys(styles).forEach(property => {
      let value = styles[property]
      if (REGEXP_SUFFIX.test(property) && isNumber(value)) {
        value += 'px'
        style[property] = value
      }
    })
  }

  const CLASS_PLAY_WRAPPER = 'u-play__wrapper'
  const CLASS_LRC_CONTAINER = 'u-lrc__container'
  const CLASS_LRC_CONTENT = 'u-lrc__content'
  const CLASS_AUDIO_WRAPPER = 'u-audio__wrapper'
  const CLASS_CURRENT_LRC = 'u-lrc__line-current'
  const CLASS_HIDDEN = 'u-lrc__hidden'

  const TEMPLATE = `
  <div class="u-lrc__container">
    <div class="u-lrc__content"></div>
  </div>
  <div class="u-audio__wrapper"></div>
`
  /**
   * Lrc 滚动
   *
   */
  class LrcPlayer {
    constructor(
      element,
      audioSrc,
      lrcText,
      options = { initTop: 130, isScroll: true }
    ) {
      this.element = element
      this.lrcText = lrcText
      this.audioSrc = audioSrc
      this.options = options

      this.lyric = null

      this.audioCanPlay = false
      this.audioPlayer = null

      this.render()
      this.parseLyric()
      this.appendLyric()

      this.renderAudioWrapper()
      this.renderAudioControls()
    }

    render() {
      let that = this,
        element = this.element

      let template = document.createElement('div')
      addClass(template, CLASS_PLAY_WRAPPER)
      template.innerHTML = TEMPLATE

      let lryWrapper = template.querySelector(`.${CLASS_LRC_CONTENT}`),
        audioWrapper = template.querySelector(`.${CLASS_AUDIO_WRAPPER}`)

      this.audioWrapper = audioWrapper
      this.lryWrapper = lryWrapper

      this.options.isScroll &&
        setStyle(this.lryWrapper, { top: this.options.initTop })

      element.appendChild(template)
    }

    parseLyric() {
      let lines = this.lrcText.split('\n'),
        pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
        result = []

      let offset = this.getOffset(this.lrcText)

      while (!pattern.test(lines[0])) {
        lines = lines.slice(1)
      }

      lines[lines.length - 1].length === 0 && lines.pop()

      lines.forEach(function(v) {
        let time = v.match(pattern),
          value = v.replace(pattern, '')

        time.forEach(function(v1) {
          let t = v1.slice(1, -1).split(':')

          result.push([
            parseInt(t[0], 10) * 60 +
              parseFloat(t[1]) +
              parseInt(offset) / 1000,
            value
          ])
        })
      })

      result.sort((a, b) => {
        return a[0] - b[0]
      })

      this.lyric = result

      return result
    }

    appendLyric() {
      let lryWrapper = this.lryWrapper,
        lyric = this.lyric,
        fragment = document.createDocumentFragment()
      lryWrapper.innerHTML = ''

      lyric.forEach(function(v, i) {
        let line = document.createElement('p')
        line.id = `line-${i}`
        line.textContent = v[1].trim()
        fragment.appendChild(line)
      })

      lryWrapper.appendChild(fragment)
    }

    getOffset(lrcText) {
      try {
        let offsetPattern = /\[offset:\-?\+?\d+\]/g,
          offsetLine = lrcText.match(offsetPattern)[0],
          { 1: offsetStr } = offsetLine.split(':'),
          offset = parseInt(offsetStr)

        return offset
      } catch (err) {
        return 0
      }
    }

    renderAudioWrapper() {
      let that = this,
        audio = document.createElement('audio')
      addClass(audio, CLASS_HIDDEN)
      audio.volume = 0.5
      audio.setAttribute('controls', 'controls')
      let audioSource = document.createElement('source')
      audioSource.src = this.audioSrc
      audio.appendChild(audioSource)
      audio.addEventListener('canplay', function(e) {
        that.audioCanPlay = true

        removeClass(that.audioPlayer, CLASS_HIDDEN)
      })

      audio.addEventListener('timeupdate', function(e) {
        for (let i = 0, l = that.lyric.length; i < l; i++) {
          if (this.currentTime > that.lyric[i][0] - 0.5) {
            let line = document.getElementById(`line-${i}`),
              prevLine = document.getElementById(`line-${i > 0 ? i - 1 : i}`)

            hasClass(prevLine, CLASS_CURRENT_LRC) &&
              removeClass(prevLine, CLASS_CURRENT_LRC)
            addClass(line, CLASS_CURRENT_LRC)

            that.options.isScroll &&
              setStyle(that.lryWrapper, {
                top: that.options.initTop - line.offsetTop || 0
              })
          }
        }
      })

      this.audio = audio
      this.audioWrapper.appendChild(audio)

      return audio
    }

    // 播放按钮
    renderAudioControls() {
      let that = this
      this.audioPlayer = document.createElement('button')
      this.audioPlayer.innerHTML = 'Play'
      this.audioPlayer.addEventListener('click', function() {
        that.onPlay()
      })
      addClass(this.audioPlayer, CLASS_HIDDEN)
      this.audioWrapper.appendChild(this.audioPlayer)

      return this.audioPlayer
    }

    toggleAudio() {}

    // 播放
    onPlay() {
      debugger
      this.audioCanPlay && this.audio.play()
    }

    onPause() {
      this.audioCanPlay && this.audio.pause()
    }

    onVolumeUp() {
      if (this.audioCanPlay && this.audio.volume < 1) {
        this.audioCanPlay && (this.audio.volume += 0.1)
      }
    }

    onVolumeDown() {
      if (this.audioCanPlay && this.audio.volume > 0) {
        this.audioCanPlay && (this.audio.volume -= 0.1)
      }
    }
  }

  return LrcPlayer
})
