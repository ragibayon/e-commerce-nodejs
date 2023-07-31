const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
  });
};

exports.postAddProduct = async (req, res, next) => {
  try {
    const title = req.body.title;
    const price = req.body.price;
    const imageUrl = req.body.imageUrl;
    const description = req.body.description;

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
      product: product,
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

    const product = await Product.findById(prodId);

    product.title = updatedTitle;
    product.price = updatedPrice;
    product.imageUrl = updatedImageUrl;
    product.description = updatedDesc;
    const result = await product.save();

    console.log('UPDATED PRODUCT!');
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
    await Product.findByIdAndRemove(prodId);
    console.log('DESTROYED PRODUCT');
    res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
  }
};
