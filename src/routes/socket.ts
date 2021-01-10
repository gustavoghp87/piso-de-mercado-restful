import { client } from '../controllers/database'
import { server } from '../index'


export const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket:any) => {

    console.log("Socket on", socket.id)
    // join room
    socket.on('join', (content:any) => {
        console.log('someone joined')
        console.log(content)
        const collection = client.db('chatencio').collection("messages")
        collection.insertOne(content)
        let room = content.groupName + content.channelName
        socket.join(room)
        // socket.broadcast.in(room).emit(content)
        io.sockets.in(room).emit('message', content)
    })
    
    socket.on('leave', (content:any) => {
        console.log('Someone left')
        console.log(content)
        const collection = client.db('chatencio').collection("messages")
        collection.insertOne(content)
        let room = content.groupName + content.channelName
        socket.leave(room)
        // socket.broadcast.in(room).emit(content)
        io.sockets.in(room).emit('message', content)
    })
    
    socket.on('new-message', (content:any) => {
        console.log('NEW MESSAGE:', content)
        const collection = client.db('chatencio').collection("messages")
        collection.insertOne(content)
        let room = content.groupName + content.channelName
        // io.emit('message', content)
        io.sockets.in(room).emit('message', content)
    })
})
