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
            functions.writeUsers(users, () => {
                // console.log(users)
                // retrieveUsers((users) => {
                //     res.send(users)
                // })
            })
        }
        // setTimeout(()=> {
            res.send(users)
        // },100)
    })
})



router.get('/channel/messages', verifyAuth, async (req:any, res:any) => {
    console.log('GET request at /api/channel/messages')
    const { groupName, channelName } = req.query
    const q = await client.db(db).collection(collecMsg).find({groupName,channelName}).toArray()
    res.send(q)
})





router.post('/channel/create', verifyAdmin, async (req:any, res:any) => {
    console.log(`POST request at /api/channel/create`)
    console.log(req.body)
    const { username, groupName, channelName } = req.body
    let channels:string[] = []

    console.log('\tLoading data...')
    const users:UserDataTemplate[] = await functions.retrieveUsers()
    users.forEach(user => {
        console.log(`\tAdding channel ${channelName} to group ${groupName}`)
        for (let user in users) {
            if (users.hasOwnProperty(user)) {
                if (users[user].groupAdmin) {
                    for (let group of users[user].groups) {
                        // console.log(group.name)
                        if (group.name == groupName) {
                            if (!group.channels.includes(channelName)) group.channels.push(channelName)
                        }
                    }
                }
            }
        }
        functions.writeUsers(users, async () => { // write to disk
            // setTimeout(() => {
                const users:UserDataTemplate[] = await functions.retrieveUsers()
                users.forEach(user => {
                    for (let user in users) {
                        if (users.hasOwnProperty(user)) {
                            users[user].groups.forEach((group:any) => {
                                if(group.name === groupName) {  // found the group
                                    // if channel is not in channel list, add it
                                    for (let channel of group.channels) {
                                        if (!channels.includes(channel)) channels.push(channel)
                                    }
                                }
                            })
                        }
                    }
                    console.log(`\tFinished collating channels for group ${groupName}`)
                    console.log(channels)
                    res.send(channels)
                })
            // }, 100)
        })
    })
})


router.post('/remove-channel', verifyAdmin, async (req:any, res:any) => {
    const { groupName, channelName } = req.body
    console.log('DELETE request at /api/channels/remove-user', groupName, channelName)
    let channels:string[] = []

    const users:UserDataTemplate[] = await functions.retrieveUsers()
    users.forEach(user => {

        // if (users.hasOwnProperty(user)) {
            for (let group of user.groups) {
                if (group.name === groupName) {
                    if (group.channels.includes(channelName)) { // remove channel
                        group.channels.splice(group.channels.indexOf(channelName), 1)
                    }
                }
            }
        // }
        
        // write to file the new changes
        functions.writeUsers(users, () => {})
        for (let user in users) {
            if (users.hasOwnProperty(user)) {
                for (let group of users[user].groups) {
                    if (group.name === groupName) {
                        for (let channel of group.channels) {
                            if (!channels.includes(channel)) channels.push(channel)
                        }
                    }
                }
            }
        }
        console.log(`\tResponding with new list of channels ${channels}`)
        res.send(channels)
    })
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
        // for(group of users[username].groups) {
        //     if(group.name === groupName) {
        //         console.log(group.channels)
        //         console.log(group.channels.indexOf(channelName))
        //         group.channels.splice(group.channels.indexOf(channelName), 1)
        //     }
        // }
        functions.writeUsers(users, () => {
            // setTimeout(() => {
                res.send(users)
            // }, 100)
        })
    })
})



module.exports = router
