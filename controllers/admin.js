const {validationResult} = require('express-validator');
const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMessage: null,
    hasError: false,
    validationErrors: [],
  });
};

exports.postAddProduct = async (req, res, next) => {
  try {
    const title = req.body.title;
    const price = req.body.price;
    const imageUrl = req.body.imageUrl;
    const description = req.body.description;

    // if there are errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/edit-product',
        editing: false,
        hasError: true,
        product: {
          title: title,
          price: price,
          imageUrl: imageUrl,
          description: description,
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array(),
      });
    }

    const product = new Product({
      title: title,
      imageUrl: imageUrl,
      price: price,
      description: description,
      userId: req.user._id,
    });

    const result = await product.save();
    console.log('Created Product');
    res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
  }
};

exports.getEditProduct = async (req, res, next) => {
  try {
    const editMode = req.query.edit;
    if (!editMode) {
      return res.redirect('/');
    }
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);
    if (!product) {
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      hasError: false,
      errorMessage: null,
      product: product,
      validationErrors: [],
    });
  } catch (err) {
    console.log(err);
  }
};

exports.postEditProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;

    const errors = validationResult(req);
    // if error occurs
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product/',
        editing: true, // error here as the render is not having the address in params
        hasError: true,
        product: {
          title: updatedTitle,
          price: updatedPrice,
          imageUrl: updatedImageUrl,
          description: updatedDesc,
          _id: prodId,
        },
        validationErrors: errors.array(),
        errorMessage: errors.array()[0].msg,
      });
    }
    const product = await Product.findById(prodId);

    // user authentication
    if (product.userId.toString() !== req.session.user._id.toString()) {
      return res.redirect('/');
    }

    product.title = updatedTitle;
    product.price = updatedPrice;
    product.imageUrl = updatedImageUrl;
    product.description = updatedDesc;
    await product.save();

    res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({userId: req.session.user._id});

    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
    });
  } catch (err) {
    console.log(err);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    await Product.deleteOne({_id: prodId, userId: req.session.user._id});
    console.log('DESTROYED PRODUCT');
    res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
  }
};
