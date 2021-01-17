import { client, db, collecMsg, collecUsers } from '../controllers/database'
import { typeGroup, UserDataTemplate } from '../models/UserDataTemplate'
import * as functions from '../controllers/functions'
import { verifyAuth, verifyAdmin } from './verify'


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


module.exports = router
