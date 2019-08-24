Page({
  data: {
    nextTimeHC: "",
    nextTimeBMC: "",
  },

  // TODO: cutoff
  // TODO: corner case: after last event in the week, should return next week
  onLoad: function() {
    // current relative timestamp in this week
    const now = new Date()
    // const timestamp = timestamp(now.getDay(), now.getHours(), now.getMinutes()
    const nowTimestamp = timestamp(1,8,0)

    // init db
    wx.cloud.init()
    const db = wx.cloud.database()
    const _ = db.command
    var _this = this // for accessing `this` within `success()`

    // next event for hc
    db.collection("hc").where({
      timestamp: _.gt(nowTimestamp)
    }).limit(1).get({
      success: function(res) {
        _this.setData({ nextTimeHC: formatTime(res.data[0]) })
      }
    })

    // next event for bmc
    db.collection("bmc").where({
      timestamp: _.gt(nowTimestamp)
    }).limit(1).get({
      success: function (res) {
        _this.setData({ nextTimeBMC: formatTime(res.data[0]) })
      }
    })
  },
})

// relative timestamp in this week
function timestamp(day, hour, minute) {
  let timestamp = day*24*60 + hour*60 + minute
}

// format output of a time record in db
function formatTime(time) {
  let day
  if (time.day == 1) day = "Mon"
  else if (time.day == 2) day = "Tue"
  else if (time.day == 3) day = "Wed"
  else if (time.day == 4) day = "Thu"
  else if (time.day == 5) day = "Fri"
  else if (time.day == 6) day = "Sat"
  else if (time.day == 7) day = "Sun"

  return day + " " + time.hour + ":" + time.minute
}