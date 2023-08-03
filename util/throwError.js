const throwError = (err, httpStatusCode, next) => {
  console.log(err.message);
  const error = new Error(err); // it will be a problem for already thrown err?
  error.httpStatusCode = httpStatusCode;
  return error;
};

module.exports = throwError;
