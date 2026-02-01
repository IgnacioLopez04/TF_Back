export const errorHandler = (error, req, res, next) => {
   console.error('[ERROR]', error.message);
   if (process.env.NODE_ENV !== 'production') {
     console.error(error.stack);
   }
   const statusCode = error.statusCode || 500;
   res.status(statusCode).json({
     status: statusCode,
     message: error.message || 'Internal Server Error',
     stack: process.env.NODE_ENV === 'production' ? '' : error.stack,
   });
};
