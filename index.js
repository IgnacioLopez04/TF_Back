import express from 'express'

import { patientRouter } from './src/routes/patient.routes.js'
import { errorHandler } from './src/middlewares/errors.middleware.js'
import { PORT } from './src/configs/config.js'

const app = express()

app.use(express.json())
app.disable('x-powered-by')

app.use('/api/patient', patientRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log('El servidor corre en el puerto: ', PORT)
})
