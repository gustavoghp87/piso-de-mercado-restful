import { client, db, collecMsg, collecUsers } from '../controllers/database'
import { typeGroup, UserDataTemplate } from '../models/UserDataTemplate'
import * as functions from '../controllers/functions'
import { verifyAuth, verifyAdmin } from './verify'


export const router = require('express').Router()


// add new user to a channel in a group TODO: duplicate key issue when creating new user
router.post('/add-user', verifyAdmin, async (req:any, res:any) => {
    const { usernameToAdd, groupName, channelName } = req.body
    console.log('POST request at /api/channels/add-user', usernameToAdd, groupName, channelName)
    // console.log(req.body)
    const users:UserDataTemplate[] = await functions.retrieveUsers()
    users.forEach(user => {
        let exists = false

        if (user.username === usernameToAdd) exists = true
        
        if (!exists) {
            console.log('Creating user')
            let user = new UserDataTemplate()
            user.username = usernameToAdd
            user.groups.push(
                {
                    name: groupName,
                    channels: ["general", channelName]
                }
            )
            console.log(user)
            users.push(user)
            // functions.addUser(user)
        } else { // if they do exist
            exists = false // now use it to check if group exists
            for (let user of users) {
                if (user.username === usernameToAdd) {
                    for (let group of user.groups) {
                        if (group.name === groupName) {
                            exists = true
                            group.channels.push(channelName)
                            break
                        }
                    }
                }
            }
            if (!exists) {
                for (let user of users) {
                    if (user.username === usernameToAdd) {
                        user.groups.push(
                            {
                                name: groupName,
                                channels: ["general", channelName]
                            }
                        )
                    }
                }
            }
            console.log('WRITING USERS TO DB')
            functions.writeUsers(users)
        }
        // setTimeout(()=> {
            res.send(users)
        // },100)
    })
})



router.get('/messages', verifyAuth, async (req:any, res:any) => {
    console.log('GET request at /api/channel/messages')
    const { groupName, channelName } = req.query
    const q = await client.db(db).collection(collecMsg).find({groupName,channelName}).toArray()
    res.send(q)
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

router.post('/remove-user', async (req:any, res:any) => {
    console.log('DELETE request at /api/remove-user')
    const { username, groupName, channelName } = req.body
    const users:UserDataTemplate[] = await functions.retrieveUsers()
    users.forEach(user => {
        if (user.username === username) {
            for (let group of user.groups) {
                if (group.name === groupName) {
                    group.channels.splice(group.channels.indexOf(channelName), 1)
                }
            }
        }
    })
        // for(group of users[username].groups) {
        //     if(group.name === groupName) {
        //         console.log(group.channels)
        //         console.log(group.channels.indexOf(channelName))
        //         group.channels.splice(group.channels.indexOf(channelName), 1)
        //     }
        // }
    functions.writeUsers(users)
    
    res.send(users)
})



module.exports = router
