const deleteProduct = async btn => {
  try {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;

    const productArticle = btn.closest('article');

    console.log('productID: ', prodId, csrfToken);

    const result = await fetch(`/admin/product/${prodId}`, {
      method: 'DELETE',
      headers: {
        'csrf-token': csrfToken,
      },
    });
    // const data = await result.json();
    productArticle.parentNode.removeChild(productArticle);
  } catch (err) {
    console.log(err);
  }
};
