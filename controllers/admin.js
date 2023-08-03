const {validationResult} = require('express-validator');
const Product = require('../models/product');
const throwError = require('../util/throwError.js');
const {deleteFile} = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  try {
    res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMessage: null,
      hasError: false,
      validationErrors: [],
    });
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};

exports.postAddProduct = async (req, res, next) => {
  try {
    const {title, price, description} = req.body;
    const image = req.file;
    if (!image) {
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/edit-product',
        editing: false,
        hasError: true,
        product: {
          title,
          price,
          description,
        },
        errorMessage: 'attached file is not an image',
        validationErrors: [],
      });
    }

    // validation error
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/edit-product',
        editing: false,
        hasError: true,
        product: {
          title,
          price,
          description,
        },
        errorMessage: valErrors.array()[0].msg,
        validationErrors: valErrors.array(),
      });
    }
    const imageUrl = '/' + image.path;
    const product = new Product({
      title,
      imageUrl,
      price,
      description,
      userId: req.user._id,
    });

    await product.save();
    res.status(201).redirect('/admin/products');
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
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
      throw new Error('product not found');
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
    const error = throwError(err, 500);
    next(error);
  }
};

exports.postEditProduct = async (req, res, next) => {
  try {
    const {
      productId,
      title: updatedTitle,
      price: updatedPrice,
      description: updatedDesc,
    } = req.body;
    const image = req.file;

    const errors = validationResult(req);
    // validation error
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product/',
        editing: true, // error here as the render is not having the address in params
        hasError: true,
        product: {
          title: updatedTitle,
          price: updatedPrice,
          description: updatedDesc,
          _id: productId,
        },
        validationErrors: errors.array(),
        errorMessage: errors.array()[0].msg,
      });
    }
    const product = await Product.findById(productId);

    // user authentication
    if (product.userId.toString() !== req.session.user._id.toString()) {
      throw new Error('Authorization Failed');
    }

    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;

    if (image) {
      const imagePath = product.imageUrl.substring(1);
      console.log(imagePath);
      await deleteFile(imagePath);
      product.imageUrl = '/' + image.path;
    }

    await product.save();

    res.redirect('/admin/products');
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
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
    const error = throwError(err, 500);
    next(error);
  }
};

exports.postDeleteProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const product = await Product.findById(prodId);

    if (!product) {
      throw new Error('Product not found');
    }

    const imagePath = product.imageUrl.substring(1);
    console.log(imagePath);
    await deleteFile(imagePath);

    // await Product.deleteOne({_id: prodId, userId: req.session.user._id});
    console.log('DESTROYED PRODUCT');
    res.redirect('/admin/products');
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
};
