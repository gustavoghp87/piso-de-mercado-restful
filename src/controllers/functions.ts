import { typeGroup, UserDataTemplate } from "../models/UserDataTemplate"
import { client, db, collecUsers } from './database'


// retrieve all the users in the database
export const retrieveUsers = (callback:any) => {
    const collection = client.db(db).collection(collecUsers)
    collection.find().toArray( (err:any, result:any) => {
        callback(result)
    })
}

// retrieve the user data for a specific user
export const retrieveUserData = (username:string, callback:any) => {
    let userData:UserDataTemplate
    retrieveUsers((users:UserDataTemplate[]) => {
        for (let i = 0; i < users.length; i++) {
            if (users[i].username === username) userData = users[i]
        }
        callback(userData)
    })
}

// Add a new user to the system.
export const addUser = (userData:UserDataTemplate) => {
    console.log(userData)
    const collection = client.db(db).collection(collecUsers)
    collection.find().toArray( (err:any, result:UserDataTemplate[]) => {
        let exists = true
        for (let user of result) {
            if (user.username === userData.username) exists = true
        }
        if (!exists) {
            collection.insertOne(userData, (err:any, result:any) => {})
        }
    })
}


// get all the groups for admins
export const getGroups = (res:any) => {
    retrieveUsers((users:UserDataTemplate[]) => {
        let groups:Object[] = []
        for (let i = 0; i < users.length; i++) {
            let userGroup = users[i].groups
            for (let j = 0; j < userGroup.length; j++) {
                if (!groups.includes(userGroup[j].name)) {
                    groups.push(userGroup[j].name)
                }
            }
        }
        res.send(groups)
    })
}


// get all the users in the group
export const getAllUsersInGroup = (groupName:string, res:any) => {
    let allUsers:string[] = []
    retrieveUsers((users:UserDataTemplate[]) => {
        for (let i = 0; i < users.length; i++) {
            users[i].groups.forEach((group:typeGroup) => {
                if (group.name === groupName) {
                    if (!allUsers.includes(users[i].username)) allUsers.push(users[i].username)
                }
            })
        }
        console.log(`\tResponding back with all users ${allUsers}`)
        return allUsers
    })
}

// write to the database updating all the users
export const writeUsers = (users:UserDataTemplate[], callback:any) => {
    const collection = client.db(db).collection(collecUsers)
    
    for (let i = 0; i < users.length; i++) {
        collection.updateOne({username: users[i].username}, {$set: users[i]},
        (err:any, result:any) => {})
    }
    callback()
}


export const createUser = (username:string, password:string, email:string) => {
    const collection = client.db(db).collection(collecUsers)
    collection.insertOne(
        {
            username,
            password,
            email,
            superAdmin: false,
            groupAdmin: false,
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

        }
    )
}


// create the super user
// not actively used, purpose is for use on fresh MongoDB installation
export const createSuperUser = () => {
    const collection = client.db(db).collection(collecUsers)
    collection.insertOne(
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
}
