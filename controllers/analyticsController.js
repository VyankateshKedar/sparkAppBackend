// controllers/analyticsController.js - Analytics controller
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const useragent = require('express-useragent');
const requestIp = require('request-ip');
const geoip = require('geoip-lite');

// Helper to determine device type from user agent
const getDeviceType = (userAgent) => {
  if (userAgent.isMobile) return 'mobile';
  if (userAgent.isTablet) return 'tablet';
  if (userAgent.isDesktop) return 'desktop';
  return 'unknown';
};

// Helper to get location data from IP
const getLocationFromIp = (ip) => {
  const geo = geoip.lookup(ip);
  if (!geo) return { country: 'unknown', city: 'unknown' };
  return {
    country: geo.country || 'unknown',
    city: geo.city || 'unknown'
  };
};

// Track profile view (exported for use in user controller)
exports.trackProfileView = async (userId, req) => {
  try {
    // Extract visitor information
    const ip = requestIp.getClientIp(req);
    const ua = useragent.parse(req.headers['user-agent']);
    const device = getDeviceType(ua);
    const location = getLocationFromIp(ip);
    const referrer = req.headers.referer || 'direct';
    
    // Check if this is a unique visitor (not seen in last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const existingView = await Analytics.findOne({
      user: userId,
      isProfileView: true,
      date: { $gte: yesterday },
      'uniqueVisitors.ip': ip,
    });
    
    const visitor = {
      ip,
      userAgent: req.headers['user-agent'],
      device,
      location,
      referrer,
      timestamp: new Date()
    };
    
    if (existingView) {
      // Update existing analytics record
      await Analytics.findByIdAndUpdate(existingView._id, {
        $inc: { totalViews: 1 }
      });
    } else {
      // Create new analytics record with a unique visitor
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      await Analytics.findOneAndUpdate(
        { 
          user: userId, 
          isProfileView: true,
          date: todayDate
        },
        {
          $inc: { totalViews: 1 },
          $push: { uniqueVisitors: visitor },
          $setOnInsert: { user: userId, isProfileView: true, date: todayDate }
        },
        { upsert: true, new: true }
      );
    }
    
    return true;
  } catch (err) {
    console.error('Error tracking profile view:', err);
    return false;
  }
};

// Track link click (exported for use in link controller)
exports.trackClick = async (userId, linkId, req) => {
  try {
    // Extract visitor information
    const ip = requestIp.getClientIp(req);
    const ua = useragent.parse(req.headers['user-agent']);
    const device = getDeviceType(ua);
    const location = getLocationFromIp(ip);
    const referrer = req.headers.referer || 'direct';
    
    // Check if this is a unique visitor (not seen in last 24 hours for this link)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const existingClick = await Analytics.findOne({
      user: userId,
      link: linkId,
      date: { $gte: yesterday },
      'uniqueVisitors.ip': ip,
    });
    
    const visitor = {
      ip,
      userAgent: req.headers['user-agent'],
      device,
      location,
      referrer,
      timestamp: new Date()
    };
    
    if (existingClick) {
      // Update existing analytics record
      await Analytics.findByIdAndUpdate(existingClick._id, {
        $inc: { totalClicks: 1 }
      });
    } else {
      // Create new analytics record with a unique visitor
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      await Analytics.findOneAndUpdate(
        { 
          user: userId, 
          link: linkId,
          date: todayDate
        },
        {
          $inc: { totalClicks: 1 },
          $push: { uniqueVisitors: visitor },
          $setOnInsert: { user: userId, link: linkId, date: todayDate }
        },
        { upsert: true, new: true }
      );
    }
    
    return true;
  } catch (err) {
    console.error('Error tracking link click:', err);
    return false;
  }
};

// Get all analytics for logged in user
exports.getUserAnalytics = async (req, res) => {
    try {
      const { period, startDate, endDate } = req.query;
      
      // Determine date range
      let dateFilter = {};
      const now = new Date();
      
      if (period === 'today') {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        dateFilter = { date: { $gte: today } };
      } else if (period === 'week') {
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        dateFilter = { date: { $gte: lastWeek } };
      } else if (period === 'month') {
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        dateFilter = { date: { $gte: lastMonth } };
      } else if (period === 'custom' && startDate && endDate) {
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        dateFilter = { date: { $gte: startDateObj, $lte: endDateObj } };
      } else {
        // Default to last 30 days if no valid period specified
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        dateFilter = { date: { $gte: lastMonth } };
      }
      
      // Get profile views analytics
      const profileViewsData = await Analytics.find({
        user: req.user.id,
        isProfileView: true,
        ...dateFilter
      }).sort({ date: 1 });
      
      // Get link clicks analytics
      const linkClicksData = await Analytics.find({
        user: req.user.id,
        isProfileView: false,
        ...dateFilter
      }).populate('link', 'title url').sort({ date: 1 });
      
      // Calculate total unique visitors
      const uniqueIps = new Set();
      [...profileViewsData, ...linkClicksData].forEach(record => {
        record.uniqueVisitors.forEach(visitor => {
          uniqueIps.add(visitor.ip);
        });
      });
      
      // Calculate device distribution
      const deviceStats = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
      const allVisitors = [];
      
      [...profileViewsData, ...linkClicksData].forEach(record => {
        record.uniqueVisitors.forEach(visitor => {
          allVisitors.push(visitor);
          deviceStats[visitor.device]++;
        });
      });
      
      // Calculate location distribution
      const countryStats = {};
      allVisitors.forEach(visitor => {
        const country = visitor.location.country;
        countryStats[country] = (countryStats[country] || 0) + 1;
      });
      
      // Calculate referrer distribution
      const referrerStats = {};
      allVisitors.forEach(visitor => {
        const referrer = visitor.referrer;
        referrerStats[referrer] = (referrerStats[referrer] || 0) + 1;
      });
      
      // Prepare time series data for charts
      const timeSeriesData = {};
      
      // Group by day for time series
      [...profileViewsData, ...linkClicksData].forEach(record => {
        const dateKey = record.date.toISOString().split('T')[0];
        
        if (!timeSeriesData[dateKey]) {
          timeSeriesData[dateKey] = {
            views: 0,
            clicks: 0,
            uniqueVisitors: new Set()
          };
        }
        
        if (record.isProfileView) {
          timeSeriesData[dateKey].views += record.totalViews;
        } else {
          timeSeriesData[dateKey].clicks += record.totalClicks;
        }
        
        record.uniqueVisitors.forEach(visitor => {
          timeSeriesData[dateKey].uniqueVisitors.add(visitor.ip);
        });
      });
      
      // Format time series for response
      const formattedTimeSeries = Object.keys(timeSeriesData).map(date => ({
        date,
        views: timeSeriesData[date].views,
        clicks: timeSeriesData[date].clicks,
        uniqueVisitors: timeSeriesData[date].uniqueVisitors.size
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Format link performance data
      const linkPerformance = {};
      linkClicksData.forEach(record => {
        if (record.link) {
          const linkId = record.link._id.toString();
          
          if (!linkPerformance[linkId]) {
            linkPerformance[linkId] = {
              id: linkId,
              title: record.link.title,
              url: record.link.url,
              clicks: 0,
              uniqueClicks: new Set()
            };
          }
          
          linkPerformance[linkId].clicks += record.totalClicks;
          record.uniqueVisitors.forEach(visitor => {
            linkPerformance[linkId].uniqueClicks.add(visitor.ip);
          });
        }
      });
      
      // Format link performance for response
      const formattedLinkPerformance = Object.values(linkPerformance).map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        clicks: link.clicks,
        uniqueClicks: link.uniqueClicks.size
      })).sort((a, b) => b.clicks - a.clicks);
      
      res.json({
        totalProfileViews: profileViewsData.reduce((sum, record) => sum + record.totalViews, 0),
        totalLinkClicks: linkClicksData.reduce((sum, record) => sum + record.totalClicks, 0),
        uniqueVisitors: uniqueIps.size,
        deviceStats,
        countryStats,
        referrerStats,
        timeSeries: formattedTimeSeries,
        linkPerformance: formattedLinkPerformance
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };
  
  // Get analytics for a specific link
  exports.getLinkAnalytics = async (req, res) => {
    try {
      const { linkId } = req.params;
      const { period, startDate, endDate } = req.query;
      
      // Verify link belongs to user
      const linkExists = await Link.exists({ 
        _id: linkId, 
        user: req.user.id 
      });
      
      if (!linkExists) {
        return res.status(404).json({ message: 'Link not found' });
      }
      
      // Determine date range
      let dateFilter = {};
      const now = new Date();
      
      if (period === 'today') {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        dateFilter = { date: { $gte: today } };
      } else if (period === 'week') {
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        dateFilter = { date: { $gte: lastWeek } };
      } else if (period === 'month') {
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        dateFilter = { date: { $gte: lastMonth } };
      } else if (period === 'custom' && startDate && endDate) {
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        dateFilter = { date: { $gte: startDateObj, $lte: endDateObj } };
      } else {
        // Default to last 30 days if no valid period specified
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        dateFilter = { date: { $gte: lastMonth } };
      }
      
      // Get link analytics
      const linkData = await Analytics.find({
        user: req.user.id,
        link: linkId,
        ...dateFilter
      }).sort({ date: 1 });
      
      // Process analytics data
      const uniqueClicks = new Set();
      
      linkData.forEach(record => {
        record.uniqueVisitors.forEach(visitor => {
          uniqueClicks.add(visitor.ip);
        });
      });
      
      // Calculate device distribution
      const deviceStats = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
      const allVisitors = [];
      
      linkData.forEach(record => {
        record.uniqueVisitors.forEach(visitor => {
          allVisitors.push(visitor);
          deviceStats[visitor.device]++;
        });
      });
      
      // Calculate location distribution
      const countryStats = {};
      allVisitors.forEach(visitor => {
        const country = visitor.location.country;
        countryStats[country] = (countryStats[country] || 0) + 1;
      });
      
      // Calculate referrer distribution
      const referrerStats = {};
      allVisitors.forEach(visitor => {
        const referrer = visitor.referrer;
        referrerStats[referrer] = (referrerStats[referrer] || 0) + 1;
      });
      
      // Prepare time series data
      const timeSeriesData = {};
      
      // Group by day for time series
      linkData.forEach(record => {
        const dateKey = record.date.toISOString().split('T')[0];
        
        if (!timeSeriesData[dateKey]) {
          timeSeriesData[dateKey] = {
            clicks: 0,
            uniqueVisitors: new Set()
          };
        }
        
        timeSeriesData[dateKey].clicks += record.totalClicks;
        
        record.uniqueVisitors.forEach(visitor => {
          timeSeriesData[dateKey].uniqueVisitors.add(visitor.ip);
        });
      });
      
      // Format time series for response
      const formattedTimeSeries = Object.keys(timeSeriesData).map(date => ({
        date,
        clicks: timeSeriesData[date].clicks,
        uniqueClicks: timeSeriesData[date].uniqueVisitors.size
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      res.json({
        totalClicks: linkData.reduce((sum, record) => sum + record.totalClicks, 0),
        uniqueClicks: uniqueClicks.size,
        deviceStats,
        countryStats,
        referrerStats,
        timeSeries: formattedTimeSeries
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };