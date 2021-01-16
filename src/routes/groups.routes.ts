import { client, db, collecMsg, collecUsers } from '../controllers/database'
import { typeGroup, UserDataTemplate } from '../models/UserDataTemplate'
import * as functions from '../controllers/functions'
import { verifyAuth, verifyAdmin } from './verify'


export const router = require('express').Router()

router.post('/', verifyAuth, async (req:any, res:any) => {
    console.log('GET request at /api/groups')
    const users:UserDataTemplate[] = await client.db(db).collection(collecUsers).find().toArray()
    let groups:Object[] = []
    users.forEach(user => {
        let userGroup = user.groups
        for (let j = 0; j < userGroup.length; j++) {
            if (!groups.includes(userGroup[j].name)) groups.push(userGroup[j].name)
        }
    })
    res.send(groups)
})


router.post('/remove-group', verifyAdmin, async (req:any, res:any) => {
    console.log('DELETE request at /api/groups/remove-group')
    const { groupName } = req.body

    const users:UserDataTemplate[] = await client.db(db).collection(collecUsers).find().toArray()

    users.forEach(user => {
        user.groups.forEach(group => {if (group.name===groupName) user.groups.splice(user.groups.indexOf(groupName), 1)})
    })

    const writeUsers = await functions.writeUsers(users)
    if (!writeUsers) return res.json({success:false})
    
    let allGroups:string[] = []
    users.forEach(user => {
        user.groups.forEach(group => {if (!allGroups.includes(group.name)) allGroups.push(group.name)})
    })

    res.json({allGroups})
})


router.post('/channels', verifyAdmin, async (req:any, res:any) => {
    const { groupName } = req.body
    console.log(`... /api/groups/channels   Collating all channels for group ${groupName}`)
    let channels:string[] = []
    const users:UserDataTemplate[] = await functions.retrieveUsers()
    users.forEach(user => {
        // if (users.hasOwnProperty(user)) {
            user.groups.forEach((group:typeGroup) => {
                if (group.name === groupName) {  // found the group
                    // if channel is not in channel list, add it
                    for (let channel of group.channels) {
                        if (!channels.includes(channel)) channels.push(channel)
                    }
                }
            })
        // }
    })
    console.log(`Finished collating channels for group ${groupName}, ${channels}`)
    res.json(channels)
})


router.post('/users', verifyAuth, async (req:any, res:any) => {
    const { groupName } = req.body
    console.log(`GET request at /api/groups/users, ${groupName}`)
    const allUsers = await functions.getAllUsersInGroup(groupName)
    console.log("Envía", allUsers)
    res.json({allUsers})
})


router.post('/create', verifyAdmin, (req:any, res:any) => {
    console.log('POST request at /api/groups/create')
    const { username, groupName } = req.body
    console.log(`\tCreating new group ${groupName} for user ${username}`)

    // retrieve the user's info
    const collection = client.db(db).collection(collecUsers)
    collection.find({username}).toArray( (err, result) => {
        let groups = result[0].groups

        // check if the group exists, if not, add it
        let exists = false
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].name === groupName) exists = true
        }
        if (!exists) {
            groups.push({
                name: groupName,
                channels: ["general"]
            })
        }

        collection.updateOne({username}, {$set: {groups}}, async (err, result) => {            
            const users:UserDataTemplate[] = await client.db(db).collection(collecUsers).find().toArray()
            let groups:string[] = []
            users.forEach(user => {
                let userGroup = user.groups
                userGroup.forEach((group:typeGroup) => {
                    if (!groups.includes(group.name)) groups.push(group.name)
                })
            })
            console.log("Enviando array de grupos post crear grupo:", groups)
            res.json({groups})
        })
    })
})


router.post('/add-user', verifyAdmin, async (req:any, res:any) => {
    const { usernameToAdd, groupName } = req.body
    console.log('POST request at /api/groups/add', usernameToAdd, groupName)
    const users:UserDataTemplate[] = await functions.retrieveUsers()
    users.forEach(user => {
        // check if the user exists
        let exists = false

        if (user.username === usernameToAdd) {
            user.groups.forEach((group:any) => {
                if (group.name === groupName) exists = true
            })
            if (!exists) {
                user.groups.push({name: groupName, channels: ["general"] })
                exists = true
            }
        }
        
        if (!exists) {
            let user = new UserDataTemplate()
            user.username = usernameToAdd
            user.groups.push({name: groupName, channels: ["general"]})
            // functions.addUser(user)
        }

        // functions.writeUsers(users, async () => {
        //     console.log(users)
            // getAllUsersInGroup(groupName, res)
            // setTimeout(() => {
                // const users:UserDataTemplate[] = await functions.retrieveUsers()
                // users.forEach(user => {
                //     res.send(users)
                // })
            // }, 100)
            
        // })
    })
})



router.post('/remove-user', verifyAdmin, async (req:any, res:any) => {
    let { usernameToRemove, groupName } = req.body
    console.log('POST request at /api/groups/remove-user', usernameToRemove, groupName)
    let users2:UserDataTemplate[] = await functions.retrieveUsers()
    users2.forEach(user => {
        // for(group of users[username].groups) {
        //     if(group.name === groupName) {
        //         users[username].groups.splice(users[username].groups.indexOf(group), 1)
        //         // console.log(users[username].groups.indexOf(group))
        //     }
        // }

        user.groups.forEach((group) => {
            if (user.username===usernameToRemove) {
                if (group.name===groupName) user.groups.splice(user.groups.indexOf(group), 1)
            }
        })
    })

    functions.writeUsers(users2)
    
    const users = await functions.getAllUsersInGroup(groupName)
    res.json(users)
})


router.post('/make-user-group-admin', verifyAdmin, async (req:any, res:any) => {
    const { usernameToAdmin } = req.body
    console.log('POST request at /api/makeUserGroupAdmin', usernameToAdmin)
    const users:UserDataTemplate[] = await functions.retrieveUsers()
    users.forEach(user => {if (user.username===usernameToAdmin) user.groupAdmin = true})
    functions.writeUsers(users)
    res.json({users})
})


module.exports = router
