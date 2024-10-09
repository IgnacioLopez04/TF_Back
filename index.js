import express from 'express'
import { PORT } from './configs/config.js'
import { patientRouter } from './routes/patient.routes.js'
import { errorHandler } from './middlewares/errors.middleware.js'

const app = express()

app.use(express.json())
app.disable('x-powered-by')

app.use('/api/patient', patientRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log('El servidor corre en el puerto: ', PORT)
})
