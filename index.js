import express from 'express'
import { PORT } from './configs/config.js'

const app = express()

app.use(express.json())
app.disable('x-powered-by')

app.listen(PORT, () => {
  console.log('El servidor corre en el puerto: ', PORT)
})
