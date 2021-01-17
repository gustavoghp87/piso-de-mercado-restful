import { typeGroup, UserDataTemplate } from "../models/UserDataTemplate"
import { client, db, collecUsers } from './database'


export const retrieveUsers = async () => {
    return await client.db(db).collection(collecUsers).find().toArray()
}

export const getAllUsersInGroup = async (groupName:string) => {
    let allUsers:string[] = []
    const users:UserDataTemplate[] = await client.db(db).collection(collecUsers).find().toArray()
    users.forEach(user => {
        user.groups.forEach((group:typeGroup) => {
            if (group.name===groupName && !allUsers.includes(user.username)) allUsers.push(user.username)
        })
    })
    return allUsers
}

export const getGroupsArray = (users:UserDataTemplate[]) => {
    let allGroups:string[] = []
    users.forEach(user => {
        user.groups.forEach((group:typeGroup) => {
            if (!allGroups.includes(group.name)) allGroups.push(group.name)
        })
    })
    return allGroups
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
