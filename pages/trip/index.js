// pages/trip/index.js - 快速开始入口，跳转到行程输入页
Page({
  onLoad() {
    // 直接跳转到行程输入页
    wx.redirectTo({
      url: '/pages/input/input'
    });
  }
});
