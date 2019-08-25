Page({
  data: {
    nextTimeHC: "",
    nextTimeBMC: "",
  },

  // TODO: cutoff
  // TODO: Sat daytime HC stokes/south lot difference
  onLoad: function() {
    // current relative timestamp in this week
    const now = new Date()
    const nowTimestamp = timestamp(now.getDay(), now.getHours(), now.getMinutes())

    // init db
    wx.cloud.init()
    const db = wx.cloud.database()
    const _ = db.command

    // next event for hc
    db.collection("hc").where({
      timestamp: _.gt(nowTimestamp)
    }).limit(1).get({
      success: res => {
        this.setData({ nextTimeHC: formatTime(res.data[0]) })
      }
    })

    // next event for bmc
    db.collection("bmc").where({
      timestamp: _.gt(nowTimestamp)
    }).limit(1).get({
      success: res => {
        this.setData({ nextTimeBMC: formatTime(res.data[0]) })
      }
    })
  },
})

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
    hour = "" + (time.hour - 12)
    apm = "pm"
  } else {
    // if hour >= 24, display it as on the next day
    hour = "" + (time.hour - 24)
    apm = "am"
    time.day = (time.day + 1) % 7
  }

  let minute = "" + time.minute
  if (time.minute == 0) minute = "00"

  let day
  if (time.day == 0) day = "Sun"
  else if (time.day == 1) day = "Mon"
  else if (time.day == 2) day = "Tue"
  else if (time.day == 3) day = "Wed"
  else if (time.day == 4) day = "Thu"
  else if (time.day == 5) day = "Fri"
  else if (time.day == 6) day = "Sat"

  return day + " " + hour + ":" + minute + " " + apm
}