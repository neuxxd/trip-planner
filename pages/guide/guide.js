// pages/guide/guide.js
Page({
  data: {
    guide: {
      id: 1,
      title: '北京3日游完美攻略',
      cover: '/images/guide1.jpg',
      views: 12580,
      likes: 892,
      date: '2024-03-15',
      isLiked: false,
      isCollected: false,
      author: {
        name: '旅行达人小王',
        avatar: '/images/avatar1.jpg',
        desc: '专注分享国内外旅行攻略',
        isFollowing: false
      },
      sections: [
        {
          title: '行程概览',
          content: [
            { type: 'text', text: '北京，中国的首都，一座拥有三千多年历史的古都。这里有世界闻名的故宫、长城，也有现代化的CBD和奥运场馆。3天时间，带你领略古今交融的魅力。' },
            { type: 'tip', title: '最佳旅行时间', text: '春秋两季是北京最佳旅行时间，4-5月和9-10月气候宜人，适合户外活动。' }
          ]
        },
        {
          title: 'Day 1 - 皇城根下',
          content: [
            { type: 'text', text: '第一天从故宫博物院开始，这是世界上现存规模最大、保存最完整的木质结构古建筑群。建议早上8:30开馆就进入，避开人流高峰。' },
            { type: 'image', url: '/images/spot1.jpg' },
            { type: 'text', text: '下午前往天坛公园，这里是明清两代皇帝祭天的场所。圜丘坛、祈年殿都是必看的建筑。傍晚时分，可以在回音壁前体验声学奇迹。' },
            { type: 'tip', title: '用餐推荐', text: '午餐推荐故宫附近的四季民福烤鸭店，晚餐可以去前门大街品尝各种北京小吃。' }
          ]
        },
        {
          title: 'Day 2 - 长城雄姿',
          content: [
            { type: 'text', text: '第二天安排八达岭长城。建议早起，乘坐S2线火车或877路公交车前往。长城上台阶较多，一定要穿舒适的鞋子，带足水和防晒用品。' },
            { type: 'image', url: '/images/spot2.jpg' },
            { type: 'tip', title: '登长城建议', text: '可以选择缆车上下，节省体力。如果想徒步，建议从北一楼爬到北八楼，这是长城最精华的部分。' }
          ]
        },
        {
          title: 'Day 3 - 皇家园林',
          content: [
            { type: 'text', text: '第三天上午游览颐和园，这是中国现存规模最大、保存最完整的皇家园林。昆明湖、万寿山、长廊都是不可错过的景点。可以租一艘小船在湖上泛舟。' },
            { type: 'image', url: '/images/spot3.jpg' },
            { type: 'text', text: '下午参观圆明园遗址公园，了解这段屈辱的历史。西洋楼遗址是拍照的好地方，也是对孩子进行爱国主义教育的场所。' }
          ]
        },
        {
          title: '实用信息',
          content: [
            { type: 'tip', title: '交通', text: '北京地铁非常发达，建议购买一卡通或使用支付宝乘车码。机场到市区可以乘坐机场快轨。' },
            { type: 'tip', title: '住宿', text: '建议住在东城区或西城区，靠近地铁的地方。王府井、前门、鼓楼附近都是不错的选择。' },
            { type: 'tip', title: '门票预订', text: '故宫、长城等热门景点建议提前在官网或微信公众号预订，避免现场排队。' }
          ]
        }
      ],
      recommends: [
        { id: 2, title: '上海迪士尼2日游攻略', cover: '/images/guide2.jpg', views: 8920 },
        { id: 3, title: '成都美食之旅', cover: '/images/guide3.jpg', views: 7560 },
        { id: 4, title: '西安历史文化游', cover: '/images/guide4.jpg', views: 6230 }
      ]
    }
  },

  onLoad: function(options) {
    // 如果有传入攻略ID，可以加载对应数据
    if (options.id) {
      console.log('加载攻略ID:', options.id);
    }
  },

  // 关注作者
  onFollow: function() {
    const guide = this.data.guide;
    guide.author.isFollowing = !guide.author.isFollowing;
    
    this.setData({ guide });
    
    wx.showToast({
      title: guide.author.isFollowing ? '关注成功' : '已取消关注',
      icon: 'none'
    });
  },

  // 点赞
  onLike: function() {
    const guide = this.data.guide;
    guide.isLiked = !guide.isLiked;
    guide.likes += guide.isLiked ? 1 : -1;
    
    this.setData({ guide });
    
    wx.showToast({
      title: guide.isLiked ? '点赞成功' : '取消点赞',
      icon: 'none'
    });
  },

  // 收藏
  onCollect: function() {
    const guide = this.data.guide;
    guide.isCollected = !guide.isCollected;
    
    this.setData({ guide });
    
    wx.showToast({
      title: guide.isCollected ? '收藏成功' : '取消收藏',
      icon: 'none'
    });

    // 保存到本地收藏列表
    if (guide.isCollected) {
      const collections = wx.getStorageSync('collections') || [];
      collections.unshift({
        id: guide.id,
        title: guide.title,
        cover: guide.cover,
        date: new Date().toISOString().split('T')[0]
      });
      wx.setStorageSync('collections', collections);
    }
  },

  // 分享
  onShare: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 使用此行程
  onUsePlan: function() {
    wx.showModal({
      title: '使用此行程',
      content: '将此攻略导入我的行程规划？',
      confirmText: '导入',
      success: (res) => {
        if (res.confirm) {
          // 保存到当前行程
          const planData = {
            destination: '北京',
            days: 3,
            travelers: 2,
            budget: 'medium'
          };
          wx.setStorageSync('currentTrip', planData);
          
          wx.showToast({
            title: '导入成功',
            icon: 'success'
          });
          
          // 跳转到规划页
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/plan/plan'
            });
          }, 1500);
        }
      }
    });
  },

  // 点击推荐
  onRecommendTap: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/guide/guide?id=' + id
    });
  },

  onShareAppMessage: function() {
    return {
      title: this.data.guide.title,
      path: '/pages/guide/guide?id=' + this.data.guide.id,
      imageUrl: this.data.guide.cover
    };
  }
});
