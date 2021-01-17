import { client, db, collecMsg, collecUsers } from '../controllers/database'
import { typeGroup, UserDataTemplate } from '../models/UserDataTemplate'
import * as functions from '../controllers/functions'
import { verifyAuth, verifyAdmin } from './verify'
import formidable from 'formidable'
import path from 'path'


export const router = require('express').Router()

router.post('/messages', verifyAuth, async (req:any, res:any) => {
    const { groupName, channelName } = req.body
    console.log('GET request at /api/channel/messages', groupName, channelName)
    const q = await client.db(db).collection(collecMsg).find({groupName, channelName}).toArray()
    res.json({q})
})

router.post('/create', verifyAdmin, async (req:any, res:any) => {
    console.log(req.body)
    const { groupName, channelName } = req.body
    console.log(`POST request at /api/channel/create ${groupName}, ${channelName}`)
    try {
        let users = await functions.retrieveUsers()
        users.forEach((user:UserDataTemplate) => {
            let groups = user.groups
            let changed = false
            groups.forEach((group:typeGroup) => {
                if (group.name===groupName && !group.channels.includes(channelName)) {group.channels.push(channelName); changed = true}
            })
            if (changed) client.db(db).collection(collecUsers).updateOne({username:user.username}, {$set: {groups}})
        })
        users = await functions.retrieveUsers()
        res.json({success:true, users})
    } catch (error) {console.log(error); res.json({success:false})}
})

router.post('/remove-channel', verifyAdmin, async (req:any, res:any) => {
    const { groupName, channelName } = req.body
    console.log('DELETE request at /api/channels/remove-user', groupName, channelName)
    let users:UserDataTemplate[] = await functions.retrieveUsers()
    users.forEach(user => {
        let changed = false
        let groups = user.groups
        groups.forEach(group => {
            if (group.name === groupName && group.channels.includes(channelName)) {
                group.channels = group.channels.filter((channel) => channel != channelName)
                changed = true
            }
        })
        if (changed) client.db(db).collection(collecUsers).updateOne({username:user.username}, {$set: {groups}})
    })
    users = await functions.retrieveUsers()
    res.json({success:true, users})
})

router.post('/add-user', verifyAdmin, async (req:any, res:any) => {
    const { usernameToAdd, groupName, channelName } = req.body
    console.log('POST request at /api/channels/add-user', usernameToAdd, groupName, channelName)
    const user = await client.db(db).collection(collecUsers).findOne({username:usernameToAdd})
    let groups = user.groups
    groups.forEach((group:typeGroup) => {
        if (group.name===groupName && !group.channels.includes(channelName))
            group.channels.push(channelName)
    })
    await client.db(db).collection(collecUsers).updateOne({username:usernameToAdd}, {$set: {groups}})
    const users:UserDataTemplate[] = await functions.retrieveUsers()    
    res.json({success:true, users})
})

router.post('/remove-user', async (req:any, res:any) => {
    console.log('DELETE request at /api/channels/remove-user')
    const { usernameToRemove, groupName, channelName } = req.body
    const user = await client.db(db).collection(collecUsers).findOne({username:usernameToRemove})
    let groups = user.groups
    groups.forEach((group:typeGroup) => {
        if (group.name===groupName)
         group.channels = group.channels.filter((channel) => channel!==channelName)            
    })
    await client.db(db).collection(collecUsers).updateOne({username:usernameToRemove}, {$set: {groups}})
    const users:UserDataTemplate[] = await functions.retrieveUsers()
    res.json({success:true, users})
})

router.post('/upload-image', (req:any, res:any) => {
    console.log('POST request at /api/user/upload-image', 'resolve:', path.resolve(__dirname, '..', '..', 'src', 'images'))
    let form = new formidable.IncomingForm()
    form.keepExtensions = true

    form.on('error', (err) => {
        console.log('error uploading fiel')
        res.json({
            result: "failed",
            data: {},
            numberOfImages: 0,
            message: "Cannot upload images. Error: " + err
        })
    })

    form.on('fileBegin', (name, file) => {
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", file)
        
        if (file.size<10000 && (file.name.includes('.jpg') || file.name.includes('.png') || file.name.includes('.jpeg'))) {
            file.name = Date.now().toString() + "." + file.name.split('.')[file.name.split('.').length-1]
            file.path = path.resolve(__dirname, '..', '..', 'src', 'images', file.name)
            console.log('File path: ' + file.path)
        } else res.json({success:false})
    })

    form.on('file', (field, file) => {
        console.log('woo, uploaded file', file.size)
        try {
            res.json({
                success: true,
                data: {
                    filename: file.name,
                    size: file.size
                },
                numberOfImages: 1,
                message: 'upload successful',
                path: file.path
            })
        } catch (error) {
            console.log("Ya enviado el res false")
        }
    })
    
    form.parse(req)
})


const name = Date.now().toString()


module.exports = router
