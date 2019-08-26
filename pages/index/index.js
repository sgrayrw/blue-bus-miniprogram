const util = require('../../utils/util.js')

Page({
  data: {
    nextTimeHC: "",
    nextTimeBMC: "",
    colorHC: "",
    colorBMC: "",
    hintHC: "",
    hintBMC: "",
  },

  onLoad: function() {
    // init wxcloud
    wx.cloud.init()
  },

  onShow: function() {
    wx.stopPullDownRefresh()
    setNextTime(this, "hc")
    setNextTime(this, "bmc")    
  },
  
  // disabled for now
  onPullDownRefresh: function() {
    this.onShow()
  },
})

// TODO: cutoff
// TODO: Sat daytime HC stokes/south lot difference
function setNextTime(page, campus) {
  // current relative timestamp in this week
  const now = new Date()
  const nowTimestamp = timestamp(now.getDay(), now.getHours(), now.getMinutes())

  // get db reference
  const db = wx.cloud.database()
  const _ = db.command

  // next event for campus
  db.collection(campus).where({
    timestamp: _.gt(nowTimestamp)
  }).limit(1).get({
    success: res => {
      const nextTime = res.data[0]
      // set time and color
      if (campus == "hc") {
        page.setData({
          nextTimeHC: formatTime(nextTime),
          colorHC: getColor(nowTimestamp, nextTime.timestamp),
          hintHC: getHint(nowTimestamp, nextTime.timestamp),
        })
      } else {
        page.setData({
          nextTimeBMC: formatTime(nextTime),
          colorBMC: getColor(nowTimestamp, nextTime.timestamp),
          hintBMC: getHint(nowTimestamp, nextTime.timestamp),
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

  let day
  if      (time.day == 0) day = "Sun"
  else if (time.day == 1) day = "Mon"
  else if (time.day == 2) day = "Tue"
  else if (time.day == 3) day = "Wed"
  else if (time.day == 4) day = "Thu"
  else if (time.day == 5) day = "Fri"
  else if (time.day == 6) day = "Sat"

  return day + " " + hour + ":" + minute + " " + apm
}

function getColor(fromTimestamp, toTimestamp) {
  const diff = toTimestamp - fromTimestamp
  if      (diff < 10) return "red"
  else if (diff < 15) return "orange"
  else                return "green"
}

function getHint(fromTimestamp, toTimestamp) {
  const diff = toTimestamp - fromTimestamp
  if (diff < 10) return "还有" + diff + "分钟，gkd"
  else           return ""
}