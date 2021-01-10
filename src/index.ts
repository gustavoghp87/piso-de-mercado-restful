import express from 'express'
import path from 'path'
import { client } from './controllers/database'
const app = express()


app.use(require('cors')())
app.use(express.json())

app.use('/images', express.static(path.resolve(__dirname, '..', 'src', 'images')))
app.use('/api', require('./routes/index.routes'))
app.use('/tv', require('./routes/tv'))

const port = process.env.PORT || 3000
export const server = require('http').createServer(app)

client.connect().then((conn:any) => {
    if (conn) console.log(`Connected successfully to 'chatencio' database in Atlas MongoDB`)
    server.listen(port, () => {
        console.log(`Server started on port: ${port}`)
        require('./routes/socket')
    })
})
