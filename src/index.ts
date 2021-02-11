import express from 'express'
import path from 'path'
import { client } from './controllers/database'
require('dotenv').config()

export const jwtKey = process.env.jwtKey || ''

const app = express()

app.use(require('cors')())
app.use(express.json())

app.use('/images', express.static(path.resolve(__dirname, '..', 'src', 'images')))
app.use('/api/users', require('./routes/users.routes'))
app.use('/api/groups', require('./routes/groups.routes'))
app.use('/api/channels', require('./routes/channels.routes'))
app.use('/api/panel', require('./routes/panel'))
app.use('/api/update', require('./routes/update'))

const port = process.env.PORT || 3000
export const server = require('http').createServer(app)

client.connect().then((conn:any) => {
    if (conn) console.log(`\nConnected successfully to 'piso-restful' database in Atlas MongoDB`)
    server.listen(port, () => {
        console.log(`Server started on port: ${port}\n`)
        require('./routes/socket')
    })
    
    
    const time = new Date("2021-02-11T13:08:53.654Z").toLocaleString().slice(0, 15)
    console.log(time)
})
