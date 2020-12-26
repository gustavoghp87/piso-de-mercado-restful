const formidable = require('formidable')
const router = require('express').Router()
const client = require('../controllers/database')
//const db = client.db('chatencio')
const collectionName = 'users'
const UserDataTemplate = require('../controllers/UserDataTemplate')
const functions = require('./functions')
const path = require('path')


// get messages for particular channel in a group
router.get('/api/channel/messages', async (req, res) => {
    console.log('GET request at /api/channel/messages')
    const groupName = req.query.groupName
    const channelName = req.query.channelName
    const q = await client.db('chatencio').collection("messages").find({groupName,channelName}).toArray()
    res.send(q)
})

// upload image
router.post('/api/image/upload', (req, res) => {
    console.log('POST request at /api/image/upload')
    let form = new formidable.IncomingForm({uploadDir: path.resolve(__dirname, '..', 'images')})
    form.keepExtensions = true

    form.on('error', (err) => {
        console.log('error uploading fiel')
        res.send({
            result: "failed",
            data: {},
            numberOfImages: 0,
            message: "Cannot upload images. Error: " + err
        })
    })

    form.on('fileBegin', (name, file) => {
        file.path = form.uploadDir + "/" + file.name
        console.log('File path: ' + file.path)
    })

    form.on('file', (field, file) => {
        console.log('woo, uploaded file')
        res.send({
            result: 'OK',
            data: {'filename': file.name, 'size': file.size},
            numberOfImages: 1,
            message: 'upload successful',
            path: file.path
        })
    })

    form.parse(req)
})


// update user profile image
router.post('/api/user/update', (req, res) => {
    const collection = client.db('chatencio').collection(collectionName)
    console.log("req.body de /user/update", req.body)
    const imagePath = req.body.profileImage
    console.log('POST request at /api/user/update', req.body.username, imagePath)
    collection.updateOne({username: req.body.username}, {$set: {profileImage: imagePath}})
    res.send({success:true})
})


// Return user data back to client
router.get('/api/user', (req, res) => {
    // createSuperUser()
    const username = req.query.username
    console.log('GET request at /api/user')
    console.log(`\tFetching user data for: ${username}`)
    functions.retrieveUserData(username, (userData => {
        if (userData) {
            console.log(`\tResponding with data on user: ${username}`)
            res.send(userData)
        } else {
            console.log(`\tUser ${username} was not found.`)
            console.log(`\tCreating user ${username} and saving to file`)
            userData = new UserDataTemplate()
            userData.username = username
            functions.addUser(userData)
            console.log(`\tResponding with data on user: ${username}`)
            setTimeout(() => {res.send(userData)}, 100)
        }
    }))
})

// // return an array of group names as strings for admin users
router.get('/api/groups', (req, res) => {
    console.log('GET request at /api/groups')
    functions.getGroups(res)
})

// // Update email of client
router.post('/api/email', (req, res) => {
    console.log('POST request at /api/email')
    const username = req.body.username
    const email = req.body.email
    
    // mongo updateOne user by username and update its email 
    const collection = client.db('chatencio').collection(collectionName)
    collection.updateOne({username}, {$set: {email}}, (err, result) => {
        res.send({"success": true})
    })
})

// // admin creates a group
router.post('/api/createGroup', (req, res) => {
    console.log('POST request at /api/createGroup')
    let username = req.body.username
    let groupName = req.body.groupName
    console.log(`\tCreating new group ${groupName} for user ${username}`)

    // retrieve the user's info
    const collection = client.db('chatencio').collection(collectionName)
    collection.find({"username": username}).toArray( (err, result) => {
        let groups = result[0].groups

        // check if the group exists, if not, add it
        let exists = false
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].name === groupName) exists = true
        }
        if (!exists) {
            groups.push({
                "name": groupName,
                "channels": ["general"]
            })
        }

        // update the user's groups list
        collection.updateOne({"username": username}, {$set: {"groups": groups}}, (err, result) => {
            
            // wait for a little time and then fetch the document
            setTimeout( () => {
                collection.find({"username": username}).toArray( (err, result) => {
                    functions.getGroups(res)
                })
            }, 200)
        })
    })
})

// admin removes a group
router.delete('/api/removeGroup/:groupName', (req, res) => {
    console.log('DELETE request at /api/removeGroup')
    const groupName = req.params.groupName

    functions.retrieveUsers((users) => {
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
            let groups = []
            for(let i = 0; i < users.length; i++) {
                users[i].groups.forEach( group => {
                    if (!groups.includes(group.name)) groups.push(group.name)
                })
            }
            res.send(groups)
        })
    })
})


// get all channels in a group
router.get('/api/:group/channels', (req, res) => {
    console.log('GET request at /api/:group/channels')
    const groupName = req.params.group
    console.log(`\tCollating all channels for group ${groupName}`)
    let channels = []
    functions.retrieveUsers((users) => {
        for(let user in users) {
            if (users.hasOwnProperty(user)) {
                users[user].groups.forEach(group => {
                    if (group.name === groupName) {  // found the group
                        // if channel is not in channel list, add it
                        for (channel of group.channels) {
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

// get all the users in a group
router.get('/api/:groupName/users', (req, res) => {
    console.log('GET request at /api/:groupName/users')
    const groupName = req.params.groupName
    console.log(`\tReceived groupName: ${groupName}`)
    functions.getAllUsersInGroup(groupName, res)
})


// create new channel in a group
router.post('/api/channel/create', (req, res) => {
    console.log(`POST request at /api/channel/create`)
    console.log(req.body)
    const username = req.body.username
    const groupName = req.body.groupName
    const channelName = req.body.channelName
    let channels = []

    console.log('\tLoading data...')
    functions.retrieveUsers((users) => {
        console.log(`\tAdding channel ${channelName} to group ${groupName}`)
        for (user in users) {
            if (users.hasOwnProperty(user)) {
                if (users[user].groupAdmin) {
                    for (group of users[user].groups) {
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
                functions.retrieveUsers((users) => { // send back a list of all channels for the group
                    for (let user in users) {
                        if (users.hasOwnProperty(user)) {
                            users[user].groups.forEach(group => {
                                if(group.name === groupName) {  // found the group
                                    // if channel is not in channel list, add it
                                    for (channel of group.channels) {
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

// remove channel of a group
router.delete('/api/channel/remove/:username.:groupName.:channelName', (req, res) => {
    console.log('DELETE request at /api/channel/remove:groupName.:channelName')
    console.log(req.params)
    const username = req.params.username
    const groupName = req.params.groupName
    const channelName = req.params.channelName
    let channels = []

    functions.retrieveUsers( (users) => {
        for (let user in users) { // loop over the users object's properties
            if (users.hasOwnProperty(user)) {
                for (group of users[user].groups) {
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
        for (user in users) {
            if (users.hasOwnProperty(user)) {
                for (group of users[user].groups) {
                    if (group.name === groupName) {
                        for (channel of group.channels) {
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

// get all users and their data
router.get('/api/users/all', (req, res) => {
    console.log('GET request at /api/users/all')
    functions.retrieveUsers((users) => {
        // console.log(users)
        res.send(users)
    })
})

// remove user from a group
router.delete('/api/remove/:groupName.:username', (req, res) => {
    console.log('DELETE request at /api/:groupName/:username/remove')
    let username = req.params.username
    let groupName = req.params.groupName
    console.log(username, groupName)
    functions.retrieveUsers((users) => {
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

// add user to a group
router.post('/api/groups/add', (req, res) => {
    console.log('POST request at /api/groups/add')
    const username = req.body.username
    const groupName = req.body.groupName
    functions.retrieveUsers((users) => {
        // check if the user exists
        let exists = false
        for (let i = 0; i < users.length; i++) {
            if (users[i].username === username) {
                users[i].groups.forEach(group => {
                    if (group.name === groupName) exists = true
                })
                if (!exists) {
                    users[i].groups.push(
                        {name: groupName, channels: ["general"] }
                    )
                    exists = true
                }
            }
        }
        if (!exists) {
            let user = new UserDataTemplate()
            user.username = username
            user.groups.push(
                {name: groupName, channels: ["general"]}
            )
            functions.addUser(user)
        }
        functions.writeUsers(users, () => {
            console.log(users)
            // getAllUsersInGroup(groupName, res)
            setTimeout(() => {
                functions.retrieveUsers((users) => {
                    res.send(users)
                })
            }, 100)
            
        })
    })
})

// add new user to a channel in a group TODO: duplicate key issue when creating new user
router.post('/api/group/channel/add', (req, res) => {
    console.log('POST request at /api/group/channel/add')
    // console.log(req.body)
    const username = req.body.username
    const groupName = req.body.groupName
    const channelName = req.body.channelName
    functions.retrieveUsers((users) => {
        let exists = false
        for(let user of users) {
            if(user.username === username) {
                exists = true
                break
            }
        }
        if(!exists) {
            console.log('Creating user')
            let user = new UserDataTemplate()
            user.username = username
            user.groups.push(
                {
                    "name": groupName,
                    "channels": ["general", channelName]
                }
            )
            console.log(user)
            users.push(user)
            functions.addUser(user)
        }
        else { // if they do exist
            exists = false // now use it to check if group exists
            for(let user of users) {
                if(user.username === username) {
                    for(let group of user.groups) {
                        if(group.name === groupName) {
                            exists = true
                            group.channels.push(channelName)
                            break
                        }
                    }
                }
            }
            if(!exists) {
                for(let user of users) {
                    if(user.username === username) {
                        user.groups.push(
                            {
                                "name": groupName,
                                "channels": ["general", channelName]
                            }
                        )
                    }
                }
            }
            console.log('WERITING USERS TSO SLETSI')
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
router.delete('/api/removeUserFromSystem/:username', (req, res) => {
    console.log('DELETE request at /api/removeUserFromSystem/:username')
    const username = req.params.username
    functions.retrieveUsers((users) => {
        const collection = client.db('chatencio').collection(collectionName)
        collection.deleteOne({"username": username}, (err, result) => {
            functions.retrieveUsers( (data) => {
                res.send(data)
            })
        })
        // users[username] = undefined
        
    })
})

// remove user from channel
router.delete('/api/removeUserFromChannel/:groupName.:channelName.:username', (req, res) => {
    console.log('DELETE request at /api/remove/:groupName.:channelName.:username')
    const username = req.params.username
    const groupName = req.params.groupName
    const channelName = req.params.channelName
    functions.retrieveUsers((users) => {
        for(user of users) {
            if(user.username === username) {
                for(group of user.groups) {
                    if(group.name === groupName) {
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
router.post('/api/makeUserGroupAdmin', (req, res) => {
    console.log('POST request at /api/makeUserGroupAdmin')
    const username = req.body.username
    console.log(username)
    functions.retrieveUsers((users) => {
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
router.post('/api/makeUserSuperAdmin', (req, res) => {
    console.log('POST request at /api/makeUserSuperAdmin')
    const username = req.body.username
    console.log(username)
    functions.retrieveUsers((users) => {
        // users[username].superAdmin = true
        // users[username].groupAdmin = true

        for(let user of users) {
            if(user.username === username) {
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

router.post('/api/user/validate', (req, res) => {
    console.log("POST request at /api/user/validate", req.body)
    let username = req.body.username
    let password = req.body.password

    console.log(username, password)
    const collection = client.db('chatencio').collection(collectionName)
    collection.find({"username": username}).toArray( (err, result) => {

        console.log(result)

        // no user found
        if (result.length === 0) res.send({"success":true})
        else {
            // user found, check for password
            let storedPassword = result[0].password
            if (password === storedPassword) res.send({"success": true})
            else res.send({"success": false})
        }
    })
})

router.post('/api/user/create', (req, res) => {
    console.log('/api/user/create')
    let user = req.body
    console.log(user)
    functions.createUser(user.username, user.password, user.email)
    res.send({success:true})
})


router.post('/api/super/user/create', (req,res) => {
    functions.createSuperUser()
    res.json({success:true})
})


module.exports = router
