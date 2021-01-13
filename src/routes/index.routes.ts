import { client, db, collecMsg, collecUsers } from '../controllers/database'
import { typeGroup, UserDataTemplate } from '../models/UserDataTemplate'
import * as functions from '../controllers/functions'
import { verifyAuth, verifyAdmin } from './verify'


export const router = require('express').Router()


router.get('/channel/messages', verifyAuth, async (req:any, res:any) => {
    console.log('GET request at /api/channel/messages')
    const { groupName, channelName } = req.query
    const q = await client.db(db).collection(collecMsg).find({groupName,channelName}).toArray()
    res.send(q)
})



router.get('/groups', (req:any, res:any) => {
    console.log('GET request at /api/groups')
    functions.getGroups(res)
})



router.post('/email', verifyAuth, (req:any, res:any) => {
    console.log('POST request at /api/email')
    const { username, email } = req.body
    client.db(db).collection(collecUsers).updateOne(username, {$set: {email}}, (err, result) => {
        if (err) return res.json({success:false})
        res.send({success:true})
    })
})




router.post('/createGroup', verifyAdmin, (req:any, res:any) => {
    console.log('POST request at /api/createGroup')
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

        // update the user's groups list
        collection.updateOne({username}, {$set: {groups}}, (err, result) => {
            
            // wait for a little time and then fetch the document
            setTimeout( () => {
                collection.find({username}).toArray( (err, result) => {
                    functions.getGroups(res)
                })
            }, 200)
        })
    })
})


router.delete('/removeGroup/:groupName', verifyAdmin, (req:any, res:any) => {
    console.log('DELETE request at /api/removeGroup')
    const groupName = req.params.groupName

    functions.retrieveUsers((users:UserDataTemplate[]) => {
        for(let i = 0; i < users.length; i++) {
            // console.log(users[i].username)
            users[i].groups.forEach( (group)=> {
                // console.log(group.name)
                if (group.name === groupName) {
                    users[i].groups.splice(users[i].groups.indexOf(groupName), 1)
                }
            })
        }
        // write to file the new changes
        functions.writeUsers(users, () => {
            let groups:string[] = []
            for(let i = 0; i < users.length; i++) {
                users[i].groups.forEach( group => {
                    if (!groups.includes(group.name)) groups.push(group.name)
                })
            }
            res.send(groups)
        })
    })
})



router.get('/:group/channels', verifyAuth, (req:any, res:any) => {
    console.log('GET request at /api/:group/channels')
    const groupName = req.params.group
    console.log(`\tCollating all channels for group ${groupName}`)
    let channels:string[] = []
    functions.retrieveUsers((users:UserDataTemplate[]) => {
        for(let user in users) {
            if (users.hasOwnProperty(user)) {
                users[user].groups.forEach((group:typeGroup) => {
                    if (group.name === groupName) {  // found the group
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
})


router.get('/:groupName/users', verifyAuth, async (req:any, res:any) => {
    console.log('GET request at /api/:groupName/users')
    const { groupName } = req.params
    console.log(`\tReceived groupName: ${groupName}`)
    const allUsers = await functions.getAllUsersInGroup(groupName, res)
    res.send(allUsers)
})



router.post('/channel/create', verifyAdmin, (req:any, res:any) => {
    console.log(`POST request at /api/channel/create`)
    console.log(req.body)
    const { username, groupName, channelName } = req.body
    let channels:string[] = []

    console.log('\tLoading data...')
    functions.retrieveUsers((users:UserDataTemplate[]) => {
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
        functions.writeUsers(users, () => { // write to disk
            setTimeout(() => {
                functions.retrieveUsers((users:UserDataTemplate[]) => {
                    for (let user in users) {
                        if (users.hasOwnProperty(user)) {
                            users[user].groups.forEach(group => {
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
            }, 100)
        })
    })
})


router.delete('/channel/remove/:username.:groupName.:channelName', verifyAdmin, (req:any, res:any) => {
    console.log('DELETE request at /api/channel/remove:groupName.:channelName')
    console.log(req.params)
    const { username, groupName, channelName } = req.body
    let channels:string[] = []

    functions.retrieveUsers((users:UserDataTemplate[]) => {
        for (let user in users) { // loop over the users object's properties
            if (users.hasOwnProperty(user)) {
                for (let group of users[user].groups) {
                    if (group.name === groupName) {
                        if (group.channels.includes(channelName)) { // remove channel
                            group.channels.splice(group.channels.indexOf(channelName), 1)
                        }
                    }
                }
            }
        }
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


router.get('/users/all', verifyAuth, (req:any, res:any) => {
    console.log('GET request at /api/users/all')
    functions.retrieveUsers((users:UserDataTemplate[]) => {
        // console.log(users)
        res.send(users)
    })
})


router.delete('/remove/:groupName.:username', verifyAdmin, (req:any, res:any) => {
    console.log('DELETE request at /api/:groupName/:username/remove')
    let username = req.params.username
    let groupName = req.params.groupName
    console.log(username, groupName)
    functions.retrieveUsers((users:UserDataTemplate[]) => {
        // for(group of users[username].groups) {
        //     if(group.name === groupName) {
        //         users[username].groups.splice(users[username].groups.indexOf(group), 1)
        //         // console.log(users[username].groups.indexOf(group))
        //     }
        // }
        for (let i = 0; i < users.length; i++) {
            for (let j = 0; j < users[i].groups.length; j++) {
                if (users[i].username === username) {
                    if (users[i].groups[j].name === groupName) {
                        users[i].groups.splice(users[i].groups.indexOf(users[i].groups[j]), 1)
                    }
                }
            }
        }
        functions.writeUsers(users, () => { // get the new list of names in the group
            functions.getAllUsersInGroup(groupName, res)
        })
    })
})


router.post('/groups/add', verifyAdmin, (req:any, res:any) => {
    console.log('POST request at /api/groups/add')
    const username = req.body.username
    const groupName = req.body.groupName
    functions.retrieveUsers((users:UserDataTemplate[]) => {
        // check if the user exists
        let exists = false
        for (let i = 0; i < users.length; i++) {
            if (users[i].username === username) {
                users[i].groups.forEach(group => {
                    if (group.name === groupName) exists = true
                })
                if (!exists) {
                    users[i].groups.push({name: groupName, channels: ["general"] })
                    exists = true
                }
            }
        }
        if (!exists) {
            let user = new UserDataTemplate()
            user.username = username
            user.groups.push({name: groupName, channels: ["general"]})
            // functions.addUser(user)
        }
        functions.writeUsers(users, () => {
            console.log(users)
            // getAllUsersInGroup(groupName, res)
            setTimeout(() => {
                functions.retrieveUsers((users:UserDataTemplate[]) => {
                    res.send(users)
                })
            }, 100)
            
        })
    })
})


// add new user to a channel in a group TODO: duplicate key issue when creating new user
router.post('/group/channel/add', (req:any, res:any) => {
    console.log('POST request at /api/group/channel/add')
    // console.log(req.body)
    const username = req.body.username
    const groupName = req.body.groupName
    const channelName = req.body.channelName
    functions.retrieveUsers((users:UserDataTemplate[]) => {
        let exists = false
        for (let user of users) {
            if (user.username === username) {
                exists = true
                break
            }
        }
        if (!exists) {
            console.log('Creating user')
            let user = new UserDataTemplate()
            user.username = username
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
                if (user.username === username) {
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
                    if (user.username === username) {
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
        setTimeout(()=> {
            res.send(users)
        },100)
    })
})

// remove user from the system
router.delete('/removeUserFromSystem/:username', (req:any, res:any) => {
    console.log('DELETE request at /api/removeUserFromSystem/:username')
    const username = req.params.username
    functions.retrieveUsers((users:UserDataTemplate[]) => {
        const collection = client.db(db).collection(collecUsers)
        collection.deleteOne({username}, (err, result) => {
            functions.retrieveUsers((data:any) => {
                res.send(data)
            })
        })
        // users[username] = undefined
        
    })
})

// remove user from channel
router.delete('/removeUserFromChannel/:groupName.:channelName.:username', (req:any, res:any) => {
    console.log('DELETE request at /api/remove/:groupName.:channelName.:username')
    const { username, groupName, channelName } = req.params
    functions.retrieveUsers((users:UserDataTemplate[]) => {
        for (let user of users) {
            if (user.username === username) {
                for (let group of user.groups) {
                    if (group.name === groupName) {
                        group.channels.splice(group.channels.indexOf(channelName), 1)
                    }
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
            setTimeout(() => {
                res.send(users)
            }, 100)
        })
    })
})

// make a user a group admin // TODO: check if this works
router.post('/makeUserGroupAdmin', (req:any, res:any) => {
    console.log('POST request at /api/makeUserGroupAdmin')
    const { username } = req.body
    console.log(username)
    functions.retrieveUsers((users:UserDataTemplate[]) => {
        for(let user of users) {
            if(user.username === username) {
                user.groupAdmin = true
            }
        }
        functions.writeUsers(users, () => {
            setTimeout(() => {
                res.send(users)
            }, 100)
        })
    })
})

// make a user a super admin
router.post('/makeUserSuperAdmin', (req:any, res:any) => {
    console.log('POST request at /api/makeUserSuperAdmin')
    const username = req.body.username
    console.log(username)
    functions.retrieveUsers((users:UserDataTemplate[]) => {
        // users[username].superAdmin = true
        // users[username].groupAdmin = true

        for (let user of users) {
            if (user.username === username) {
                user.groupAdmin = true
                user.superAdmin = true
            }
        }
        functions.writeUsers(users, () => {
            setTimeout(() => {
                res.send(users)
            }, 100)
        })
    })
})


router.post('/super/user/create', verifyAdmin, (req:any, res:any) => {

    client.db(db).collection(collecUsers).insertOne(
        {
            username: "Super",
            password: "password",
            email: "super@admin.com",
            superAdmin: true,
            groupAdmin: true,
            profileImage: "profile.gif",
            groups: [
                {
                    name: "newbies",
                    channels: [
                        "general",
                        "help"
                    ]
                },
                {
                    name: "general",
                    channels: [
                        "general",
                        "chitchat",
                        "topic of the day"
                    ]
                }
            ]
        }, (err:any, result:any) => {
            if (err) console.log(err)
            else console.log(result)
                        
        }
    )
    res.json({success:true})
})


module.exports = router
