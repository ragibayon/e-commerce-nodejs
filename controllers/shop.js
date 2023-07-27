const Product = require('../models/product');
const Order = require('../models/orders');

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
      });
    })
    .catch(err => {
      console.log(err);
    });
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
    console.log(err);
  }
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  try {
    await req.user.removeFromCart(prodId);
    res.redirect('/cart');
  } catch (err) {
    console.log(err);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const populatedUser = await req.user.populate('cart.items.productId');
    const products = populatedUser.cart.items.map(i => {
      return {quantity: i.quantity, product: {...i.productId._doc}};
    });

    const order = new Order({
      user: {
        name: req.user.name,
        userId: req.user._id,
      },
      products: products,
    });
    order.save();
    await req.user.clearCart();
    res.redirect('/orders');
  } catch (err) {
    console.log(err);
  }
};

exports.getOrders = async (req, res, next) => {
  const orders = await Order.find({'user.userId': req.user._id});

  res.render('shop/orders', {
    path: '/orders',
    pageTitle: 'Your Orders',
    orders: orders,
  });
};
