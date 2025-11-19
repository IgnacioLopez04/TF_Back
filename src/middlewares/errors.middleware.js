export const errorHandler = (error, req, res, next) => {
   const statusCode = error.statusCode || 500;
   res.status(statusCode).json({
     status: statusCode,
     message: error.message || 'Internal Server Error',
     stack: process.env.NODE_ENV === 'production' ? '' : error.stack,
   });
};
