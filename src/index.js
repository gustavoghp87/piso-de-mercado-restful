const express = require('express')
const app = express()
const path = require('path')
const client = require('./controllers/database')


app.use(require('cors')())
app.use(express.json())

app.use('/images', express.static(path.resolve(__dirname, 'images')))
app.use('/', require('./routes/index.routes'))
app.use('/tv', require('./controllers/tv'))

const port = process.env.PORT || 3000
const server = require('http').createServer(app)
module.exports = server

client.connect().then(conn => {
    if (conn) console.log(`Connected successfully to 'chatencio' database in Atlas MongoDB`)
    server.listen(port, () => {
        console.log(`Server started on port: ${port}`)
        require('./routes/socket')
        require('./controllers/tv')
    })
})
