const throwError = (err, httpStatusCode, next) => {
  console.log(err.message);
  const error = new Error(err);
  error.httpStatusCode = httpStatusCode;
  return error;
};

module.exports = throwError;
