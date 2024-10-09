export const errorHandler = (error, req, res, next) => {
  res.json({
    status: res.statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '' : error.stack,
  })
}
