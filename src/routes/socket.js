const client = require('../controllers/database')


const io = require('socket.io')(require('../index'), {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {

    console.log("Socket on", socket.id)
    // join room
    socket.on('join', (content) => {
        console.log('someone joined')
        console.log(content)
        const collection = client.db('chatencio').collection("messages")
        collection.insertOne(content)
        let room = content.groupName + content.channelName
        socket.join(room)
        // socket.broadcast.in(room).emit(content)
        io.sockets.in(room).emit('message', content)
    })
    
    socket.on('leave', (content) => {
        console.log('Someone left')
        console.log(content)
        const collection = client.db('chatencio').collection("messages")
        collection.insertOne(content)
        let room = content.groupName + content.channelName
        socket.leave(room)
        // socket.broadcast.in(room).emit(content)
        io.sockets.in(room).emit('message', content)
    })
    
    socket.on('new-message', (content) => {
        console.log('NEW MESSAGE:')
        console.log(content)
        const collection = client.db('chatencio').collection("messages")
        collection.insertOne(content)
        let room = content.groupName + content.channelName
        // io.emit('message', content)
        io.sockets.in(room).emit('message', content)
    })  
})


module.exports = io
