export const errorHandler = (error, req, res, next) => {
   res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? '' : error.stack,
   });
};
