const fs = require('fs');
const util = require('util');
const path = require('path');
const PDFDocument = require('pdfkit');
const Product = require('../models/product');
const Order = require('../models/orders');
const User = require('../models/user');
const throwError = require('../util/throwError');
const {generateInvoice} = require('../util/createInvoice');

const {ITEMS_PER_PAGE} = require('../constants');

exports.getProducts = async (req, res, next) => {
  try {
    let page = +req.query.page || 1;
    const totalProducts = await Product.find().countDocuments();
    const pageCount = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    if (page > pageCount) {
      page = 1;
    }

    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
      pageCount: pageCount,
      currentPage: page,
    });
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);

    res.render('shop/product-detail', {
      product: product,
      pageTitle: product.title,
      path: '/products',
    });
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};

exports.getIndex = async (req, res, next) => {
  try {
    let page = +req.query.page || 1;

    const totalProducts = await Product.find().countDocuments();
    const pageCount = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    if (page > pageCount) {
      page = 1;
    }

    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      pageCount: pageCount,
      currentPage: page,
    });
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const populatedUser = await req.user.populate('cart.items.productId');
    const products = populatedUser.cart.items;
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products,
    });
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};

exports.postCart = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const product = await Product.findById(prodId);
    await req.user.addToCart(product);
    res.redirect('/cart');
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};

exports.postCartDeleteProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    await req.user.removeFromCart(prodId);
    res.redirect('/cart');
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id);
    const populatedUser = await user.populate('cart.items.productId');

    const products = populatedUser.cart.items.map(i => {
      return {quantity: i.quantity, product: {...i.productId._doc}};
    });

    const order = new Order({
      user: {
        userId: req.session.user._id,
        email: req.session.user.email,
      },
      products: products,
    });

    await order.save();
    await req.user.clearCart();
    res.redirect('/orders');
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({'user.userId': req.user._id});
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders,
    });
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order Id not found');
    }

    if (order.user.userId.toString() !== req.session.user._id.toString()) {
      throw new Error('unauthorized');
    }

    const invoicePath = await generateInvoice(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=${path.basename(invoicePath)}`
    );
    const readStream = fs.createReadStream(invoicePath);
    readStream.pipe(res);
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};
