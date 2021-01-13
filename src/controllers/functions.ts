import { typeGroup, UserDataTemplate } from "../models/UserDataTemplate"
import { client, db, collecUsers } from './database'
import { jwtKey } from '../index'
import jwt from 'jsonwebtoken'


export const verifyToken = (token:string) => {
    const verify = jwt.verify(token, jwtKey)
    if (verify) return true
    return false
}

export const retrieveUsers = (callback:any) => {
    client.db(db).collection(collecUsers).find().toArray((err:any, result:any) => {
        callback(result)
    })
}

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


export const createUser = async (username:string, password:string, email:string) => {

    const user:UserDataTemplate = {
        username,
        password,
        email,
        superAdmin: false,
        groupAdmin: false,
        profileImage: "profile.gif",
        token: "",
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
    }
    await client.db(db).collection(collecUsers).insertOne(user)
    const newUser = await client.db(db).collection(collecUsers).findOne({username:user.username})
    if (!newUser) return false
    return true
}

