const client = require('../controllers/database')
const collectionName = 'users'


// retrieve all the users in the database
function retrieveUsers(callback) {
    const collection = client.db('chatencio').collection(collectionName)
    collection.find().toArray( (err, result) => {
        callback(result)
    })
}

// retrieve the user data for a specific user
function retrieveUserData(username, callback) {
    let userData
    retrieveUsers((users) => {
        for (let i = 0; i < users.length; i++) {
            if (users[i].username === username) userData = users[i]
        }
        callback(userData)
    })
}

// Add a new user to the system.
function addUser(userData) {
    console.log(userData)
    const collection = client.db('chatencio').collection(collectionName)
    collection.find().toArray( (err, result) => {
        let exists = true
        for (user of result) {
            if(user.username === userData.username) exists = true
        }
        if(!exists) {
            collection.insertOne(userData, (err, result) => {

            })
        }
    })
}


// get all the groups for admins
function getGroups(res) {
    retrieveUsers( (users) => {
        let groups = []
        for(let i = 0; i < users.length; i++) {
            let userGroup = users[i].groups
            for(let j = 0; j < userGroup.length; j++) {
                if(!groups.includes(userGroup[j].name)) {
                    groups.push(userGroup[j].name)
                }
            }
        }
        res.send(groups)
    })
}


// get all the users in the group
function getAllUsersInGroup(groupName, res) {
    let allUsers = []
    retrieveUsers((users) => {
        for (let i = 0; i < users.length; i++) {
            users[i].groups.forEach( (group) => {
                if (group.name === groupName) {
                    if (!allUsers.includes(users[i].username)) allUsers.push(users[i].username)
                }
            })
        }
        console.log(`\tResponding back with all users ${allUsers}`)
        res.send(allUsers)
    })
}

// write to the database updating all the users
function writeUsers(users, callback) {
    const collection = client.db('chatencio').collection(collectionName)
    
    for (let i = 0; i < users.length; i++) {
        collection.updateOne({"username": users[i].username}, {$set: users[i]}, (err, result) => {})
    }
    callback()
}


function createUser(username, password, email) {
    const collection = client.db('chatencio').collection(collectionName)
    collection.insertOne(
        {
            "username": username,
            "password": password,
            "email": email,
            "superAdmin": false,
            "groupAdmin": false,
            "profileImage": "profile.gif",
            "groups": [
                {
                    "name": "newbies",
                    "channels": [
                        "general",
                        "help"
                    ]
                },
                {
                    "name": "general",
                    "channels": [
                        "general",
                        "chitchat",
                        "topic of the day"
                    ]
                }
            ]
        }, (err, result) => {

        }
    )
}


// create the super user
// not actively used, purpose is for use on fresh MongoDB installation
function createSuperUser() {
    const collection = client.db('chatencio').collection(collectionName)
    collection.insertOne(
        {
            "username": "Super",
            "password": "password",
            "email": "super@admin.com",
            "superAdmin": true,
            "groupAdmin": true,
            "profileImage": "profile.gif",
            "groups": [
                {
                    "name": "newbies",
                    "channels": [
                        "general",
                        "help"
                    ]
                },
                {
                    "name": "general",
                    "channels": [
                        "general",
                        "chitchat",
                        "topic of the day"
                    ]
                }
            ]
        }, (err, result) => {
        }
    )
}


module.exports = {
    retrieveUsers, retrieveUserData, addUser, getGroups,
    getAllUsersInGroup, writeUsers, createUser, createSuperUser
}
