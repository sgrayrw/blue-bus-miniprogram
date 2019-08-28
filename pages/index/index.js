const util = require('../../utils/util.js')
const app = getApp()
const menuButton = wx.getMenuButtonBoundingClientRect()
const sysInfo = wx.getSystemInfoSync()

Page({
  data: {
    // setting icon related
    settingIconTop: menuButton.top + 2.5,
    settingIconLeft: sysInfo.screenWidth - menuButton.right,
    settingIconHeight: 27,
    
    showSetting: false, // setting menu displayed or not

    // container (main area) related
    containerHeight: sysInfo.screenHeight - menuButton.bottom - 2.5,
    containerColor: "white",

    // swiper related
    numRuns: 3, // num of runs displayed in the swiper
    indicatorDotsHC: true,
    indicatorDotsBMC: true,
    swiperIndex: 0,

    // data displayed related
    isColor: true,
    timesHC: [],
    timesBMC: [],
    colorsHC: [],
    colorsBMC: [],
  },

  // called when this page is shown
  onShow: function() {
    // stop refresh animation
    wx.stopPullDownRefresh()
    // update times
    setNextTimes(this, "hc")
    setNextTimes(this, "bmc")
  },
  
  // disabled for now
  onPullDownRefresh: function() {
    this.onShow()
  },

  // toggle setting menu
  toggleSetting: function() {
    if (this.data.showSetting) {
      this.setData({
        showSetting: false,
        containerColor: "white",
      })
    } else {
      this.setData({
        showSetting: true,
        containerColor: "#eee",
      })
    }
  },

  // hide setting menu if user touches elsewhere
  hideSetting: function() {
    this.setData({
      showSetting: false,
      containerColor: "white",
    })
  },

  // setting: listen slider events
  slideNumRuns: function(e) {
    const newNumRuns = e.detail.value
    // reset swiper index if `numRuns` is decreased
    if (newNumRuns < this.data.numRuns) {
      this.setData({ swiperIndex: 0 })
    }
    // set new data
    this.setData({ numRuns: newNumRuns })
    // refresh page
    this.onShow()
  },

  // setting: listen switch events
  switchColor: function(e) {
    // set new data
    this.setData({ isColor: !this.data.isColor })
    // refresh page
    this.onShow()
  },
})

// TODO: Sat daytime HC stokes/south lot difference
function setNextTimes(page, campus) {
  // current relative timestamp in this week
  const now = new Date()
  const nowTimestamp = timestamp(now.getDay(), now.getHours(), now.getMinutes())

  // get db reference
  const db = wx.cloud.database()
  const _ = db.command

  // next runs for campus
  db.collection(campus).where({
    timestamp: _.gt(nowTimestamp)
  }).limit(page.data.numRuns).get({
    success: res => {
      // format each time and get color
      let times = [], colors = []
      for (const time of res.data) {
        times.push(formatTime(time))

        if (page.data.isColor) {
          colors.push(getColor(nowTimestamp, time.timestamp))
        } else {
          colors.push("black")
        }
      }

      // set data
      if (campus == "hc") {
        page.setData({
          timesHC: times,
          colorsHC: colors,
          indicatorDotsHC: times.length > 1,
        })
      } else {
        page.setData({
          timesBMC: times,
          colorsBMC: colors,
          indicatorDotsBMC: times.length > 1,
        })
      }
    }
  })
}

// relative timestamp in this week
function timestamp(day, hour, minute) {
  return day*24*60 + hour*60 + minute
}

// format output of a time record in db
function formatTime(time) {
  let hour, apm
  if (time.hour < 12) {
    hour = "" + time.hour
    apm = "am"
  } else if (time.hour < 24) {
    if (time.hour == 12) hour = "" + time.hour
    else                 hour = "" + (time.hour - 12)
    apm = "pm"
  } else {
    // if hour >= 24, display it as on the next day
    hour = "" + (time.hour - 24)
    apm = "am"
    time.day = (time.day + 1) % 7
  }

  let minute = "" + time.minute
  if (time.minute < 10) minute = "0" + minute

  // let day
  // if      (time.day == 0) day = "Sun"
  // else if (time.day == 1) day = "Mon"
  // else if (time.day == 2) day = "Tue"
  // else if (time.day == 3) day = "Wed"
  // else if (time.day == 4) day = "Thu"
  // else if (time.day == 5) day = "Fri"
  // else if (time.day == 6) day = "Sat"

  return hour + ":" + minute + " " + apm
}

function getColor(fromTimestamp, toTimestamp) {
  const diff = toTimestamp - fromTimestamp
  if      (diff < 10) return "red"
  else if (diff < 15) return "orange"
  else                return "green"
}