import express from 'express'
import path from 'path'
import { client } from './controllers/database'
require('dotenv').config()

export const jwtKey = process.env.jwtKey || ''

const app = express()

app.use(require('cors')())
app.use(express.json())

app.use('/images', express.static(path.resolve(__dirname, '..', 'src', 'images')))
app.use('/api/user', require('./routes/user.routes'))
app.use('/api', require('./routes/index.routes'))
app.use('/tv', require('./routes/tv'))

const port = process.env.PORT || 3000
export const server = require('http').createServer(app)

client.connect().then((conn:any) => {
    if (conn) console.log(`\nConnected successfully to 'piso-restful' database in Atlas MongoDB`)
    server.listen(port, () => {
        console.log(`Server started on port: ${port}\n`)
        require('./routes/socket')
    })
})
