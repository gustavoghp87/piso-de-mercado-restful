import { client } from '../controllers/database'
import { server } from '../index'


export type typeMessage = {
    username: string
    groupName: string
    channelName: string
    message: string
    profileImage: string
    isFile: boolean
    timestamp: number
}

export const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket:any) => {

    console.log("Socket on", socket.id)
    
    socket.on('join', (content:typeMessage) => {
        console.log('someone joined', content)
        client.db('chatencio').collection("messages").insertOne(content)
        const room = content.groupName + content.channelName
        socket.join(room)
        // socket.broadcast.in(room).emit(content)
        socket.to(room).emit('message', content)
    })
    
    socket.on('leave', (content:typeMessage) => {
        console.log('Someone left', content)
        client.db('chatencio').collection("messages").insertOne(content)
        const room = content.groupName + content.channelName
        socket.leave(room)
        // socket.broadcast.in(room).emit(content)
        socket.to(room).emit('message', content)
    })
    
    socket.on('new-message', (content:typeMessage) => {
        console.log('NEW MESSAGE:', content)
        client.db('chatencio').collection("messages").insertOne(content)
        const room = content.groupName + content.channelName
        // io.emit('message', content)
        socket.to(room).emit('message', content)
    })

})
