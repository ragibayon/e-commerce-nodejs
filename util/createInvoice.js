// invoiceGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateInvoice = async order => {
  return new Promise((resolve, reject) => {
    try {
      const orderId = order._id;
      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join('data', 'invoices', invoiceName);

      // creating a pdf
      const pdfDoc = new PDFDocument({size: 'A4', margin: 50});
      pdfDoc.pipe(fs.createWriteStream(invoicePath));

      pdfDoc.fontSize(18);
      pdfDoc.font('Helvetica').text('Invoice of E-commerce');

      let totalPrice = 0;
      order.products.forEach(p => {
        totalPrice += p.product.price * p.quantity;
        pdfDoc.text(
          p.product.title +
            ' - ' +
            p.quantity +
            ' x $' +
            p.product.price +
            '= $' +
            p.product.price * p.quantity
        );
      });
      pdfDoc.text('Total = $' + `${totalPrice.toFixed(2)}`);
      pdfDoc.end();

      resolve(invoicePath);
    } catch (err) {
      reject(err);
    }
  });
};
