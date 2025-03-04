const Link = require('../models/Link');
const { trackClick } = require('./analyticsController');

exports.getLinks = async (req, res) => {
  try {
    const links = await Link.find({ user: req.user.id }).sort({ order: 1 });
    res.json(links);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createLink = async (req, res) => {
  try {
    const { title, url, description, icon, order } = req.body;
    let linkOrder = order;
    if (linkOrder === undefined) {
      const lastLink = await Link.findOne({ user: req.user.id }).sort({ order: -1 });
      linkOrder = lastLink ? lastLink.order + 1 : 0;
    }
    
    const newLink = new Link({
      user: req.user.id,
      title,
      url,
      description,
      icon,
      order: linkOrder
    });
    
    await newLink.save();
    res.json(newLink);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLink = async (req, res) => {
  try {
    const { title, url, description, icon, isActive, order } = req.body;
    const link = await Link.findOne({ _id: req.params.id, user: req.user.id });
    if (!link) return res.status(404).json({ message: 'Link not found' });
    
    if (title !== undefined) link.title = title;
    if (url !== undefined) link.url = url;
    if (description !== undefined) link.description = description;
    if (icon !== undefined) link.icon = icon;
    if (isActive !== undefined) link.isActive = isActive;
    if (order !== undefined) link.order = order;
    
    await link.save();
    res.json(link);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteLink = async (req, res) => {
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user.id });
    if (!link) return res.status(404).json({ message: 'Link not found' });
    await link.remove();
    res.json({ message: 'Link removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reorderLinks = async (req, res) => {
  try {
    const { links } = req.body;
    if (!Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ message: 'Invalid links array' });
    }
    
    const session = await Link.startSession();
    session.startTransaction();
    try {
      for (const item of links) {
        await Link.findOneAndUpdate(
          { _id: item.id, user: req.user.id },
          { $set: { order: item.order } }
        );
      }
      await session.commitTransaction();
      session.endSession();
      
      const updatedLinks = await Link.find({ user: req.user.id }).sort({ order: 1 });
      res.json(updatedLinks);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRedirect = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link || !link.isActive) return res.status(404).json({ message: 'Link not found or inactive' });
    await trackClick(link.user, link._id, req);
    return res.redirect(link.url);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRedirectByShortUrl = async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const link = await Link.findOne({ shortUrl });
    if (!link || !link.isActive) return res.status(404).json({ message: 'Link not found or inactive' });
    await trackClick(link.user, link._id, req);
    return res.redirect(link.url);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
