import { client, db, collecUsers } from '../controllers/database'
import { typeGroup, UserDataTemplate } from '../models/UserDataTemplate'
import * as functions from '../controllers/functions'
import { verifyAuth, verifyAdmin } from './verify'


export const router = require('express').Router()

router.post('/', verifyAuth, async (req:any, res:any) => {
    console.log('GET request at /api/groups')
    const users:UserDataTemplate[] = await client.db(db).collection(collecUsers).find().toArray()
    const allGroups = functions.getGroupsArray(users)
    res.json({success:true, allGroups})
})

router.post('/channels', verifyAdmin, async (req:any, res:any) => {
    const { groupName } = req.body
    console.log(`... /api/groups/channels   Collating all channels for group ${groupName}`)
    let channels:string[] = []
    const users:UserDataTemplate[] = await functions.retrieveUsers()
    users.forEach(user => {
        user.groups.forEach((group:typeGroup) => {
            if (group.name===groupName) {
                for (let channel of group.channels) if (!channels.includes(channel)) channels.push(channel)
            }
        })
    })
    console.log(`Finished collating channels for group ${groupName}, ${channels}`)
    res.json({channels})
})

router.post('/users', verifyAuth, async (req:any, res:any) => {
    const { groupName } = req.body
    console.log(`GET request at /api/groups/users, ${groupName}`)
    const allUsers = await functions.getAllUsersInGroup(groupName)
    console.log("Envía", allUsers)
    res.json({allUsers})
})

router.post('/create', verifyAdmin, async (req:any, res:any) => {
    console.log('POST request at /api/groups/create')
    const { username, groupName } = req.body
    console.log(`\tCreating new group ${groupName} for user ${username}`)

    const user = await client.db(db).collection(collecUsers).findOne({username})
    let exists = false
    user.groups.forEach((group:typeGroup) => {if (group.name===groupName) exists = true})
    if (!exists) {
        let groups:typeGroup[] = user.groups.push({
            name: groupName,
            channels: ["general"]
        })
        await client.db(db).collection(collecUsers).updateOne({username}, {$set: {groups}})
    }
    const users:UserDataTemplate[] = await client.db(db).collection(collecUsers).find().toArray()
    const allGroups = functions.getGroupsArray(users)
    res.json({success:true, allGroups})
})

router.post('/remove-group', verifyAdmin, async (req:any, res:any) => {
    console.log('DELETE request at /api/groups/remove-group')
    const { groupName } = req.body
    const users1:UserDataTemplate[] = await client.db(db).collection(collecUsers).find().toArray()
    users1.forEach(user => {
        let groups = user.groups.filter((group:typeGroup) => group.name!==groupName)
        client.db(db).collection(collecUsers).updateOne({username:user.username}, {$set: {groups}})
    })
    const users:UserDataTemplate[] = await client.db(db).collection(collecUsers).find().toArray()
    const allGroups = functions.getGroupsArray(users)
    res.json({success:true, allGroups})
})

router.post('/add-user', verifyAdmin, async (req:any, res:any) => {
    const { usernameToAdd, groupName } = req.body
    console.log('POST request at /api/groups/add', usernameToAdd, groupName)
    const user = await client.db(db).collection(collecUsers).findOne({username:usernameToAdd}) 
    if (!user) return res.json({success:false, exists:true})
    let groups:typeGroup[] = user.groups
    let exists = false
    groups.forEach(group => {if (group.name===groupName) exists = true})
    if (!exists) groups.push({name: groupName, channels: ["general"]})
    const allUsers = await functions.getAllUsersInGroup(groupName)
    res.json({success:true, allUsers})
})

router.post('/remove-user', verifyAdmin, async (req:any, res:any) => {
    let { usernameToRemove, groupName } = req.body
    console.log('POST request at /api/groups/remove-user', usernameToRemove, groupName)
    if (groupName==='newbies' || groupName==='general') return res.json({success:false, cannot:true})
    const user = await client.db(db).collection(collecUsers).findOne({username:usernameToRemove})
    if (!user || user.superAdmin) return res.json({success:false, isAdmin:true})
    await client.db(db).collection(collecUsers).updateOne({username:usernameToRemove}, {$pull: {groups:groupName}})
    const allUsers = await functions.getAllUsersInGroup(groupName)
    res.json({success:true, allUsers})
})

router.post('/make-user-group-admin', verifyAdmin, async (req:any, res:any) => {
    const { usernameToAdmin } = req.body
    console.log('POST request at /api/groups/make-user-group-admin', usernameToAdmin)
    try {
        await client.db(db).collection(collecUsers).updateOne({username:usernameToAdmin}, {$set: {groupAdmin:true, superAdmin:true}})
        res.json({success:true})
    } catch (error) {
        console.log(error)
        res.json({success:false})
    }
})


module.exports = router
