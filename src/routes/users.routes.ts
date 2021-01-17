import { client, db, collecUsers } from '../controllers/database'
import { UserDataTemplate } from '../models/UserDataTemplate'
import * as functions from '../controllers/functions'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { jwtKey } from '../index'
import { verifyAdmin, verifyAuth } from './verify'
import formidable from 'formidable'
import path from 'path'


export const router = require('express').Router();

router.post('/get-one', verifyAuth, async (req:any, res:any) => {
    console.log(`Fetching user data .../api/users/get-one for: ${req.body.username}`)
    try {
        const userData = await client.db(db).collection(collecUsers).findOne({username:req.body.username})
        res.json({success:true, userData})
    } catch (error) {
        res.json({success:false})
    }
})

router.post('/get-all', verifyAdmin, async (req:any, res:any) => {
    console.log('GET request at /api/users/all #####################################################')
    const users = await functions.retrieveUsers()
    res.json({success:true, users})
})


router.post('/login', async (req:any, res:any) => {
    console.log("POST request at /api/user/login", req.body)
    const { usernameToLogin, password } = req.body
    const user = await client.db(db).collection(collecUsers).findOne({username:usernameToLogin})
    if (user) {
        console.log(user.username, user.password)
        const verif = await bcrypt.compare(password, user.password)
        console.log("Compare password and hash", verif)        
        if (verif) {
            const newToken = jwt.sign({username:usernameToLogin}, jwtKey)
            client.db(db).collection(collecUsers).updateOne({username:usernameToLogin}, {$set: {token:newToken}})
            res.json({success:true, user, newToken})
        }
        else res.json({success:false})
    } else {
        res.json({success:false})
    }
})

router.post('/verify-token', verifyAuth, async (req:any, res:any) => {
    console.log("POST request at /api/user/verify-token", req.body)
    res.json({success:true})
})

router.post('/create', async (req:any, res:any) => {
    console.log('/user/create')
    const user = req.body
    const preUser = await client.db(db).collection(collecUsers).findOne({username:user.usernameToCreate})
    if (preUser) return res.json({success:false, exists:true})
    if (user.password.length<10) return res.json({success:false, characters:true})
    const cryptedPassword = await bcrypt.hash(user.password, 11)
    const createUser = await functions.createUser(user.usernameToCreate, cryptedPassword, user.email)
    if (createUser) res.json({success:true})
    else res.json({success:false})
})

router.post('/update-email', verifyAuth, (req:any, res:any) => {
    console.log('POST request at /api/email')
    const { username, email } = req.body
    client.db(db).collection(collecUsers).updateOne({username}, {$set: {email}}, (err, result) => {
        if (err) return res.json({success:false})
        res.json({success:true})
    })
})

router.post('/logout', verifyAuth, async (req:any, res:any) => {
    console.log("LOGOUT....", req.body)
    const { username } = req.body
    try {
        await client.db(db).collection(collecUsers).updateOne({username}, {$set: {token:''}})
        res.json({success:true})
    } catch (error) {
        console.error(error)
        res.json({success:false})
    }
})

router.post('/remove-user-from-system', verifyAdmin, async (req:any, res:any) => {
    const { usernameToRemove } = req.body
    console.log('DELETE request at /api/remove-user-from-system', usernameToRemove)
    const user = await client.db(db).collection(collecUsers).findOne({username:usernameToRemove})
    if (!user || user.superAdmin) return res.json({success:false, isAdmin:true})
    client.db(db).collection(collecUsers).deleteOne({username:usernameToRemove}, async (err, result) => {
        const users:UserDataTemplate[] = await functions.retrieveUsers()
        res.json({success:true, users})
    })
})

router.post('/make-user-super-admin', verifyAdmin, async (req:any, res:any) => {
    const { usernameToAdmin } = req.body
    console.log('POST request at /api/make-user-super-admin', usernameToAdmin)
    const user = await client.db(db).collection(collecUsers).findOne({username:usernameToAdmin})
    if (!user || user.superAdmin) return res.json({success:false})
    await client.db(db).collection(collecUsers).updateOne({username:usernameToAdmin}, {$set: {superAdmin:true, groupAdmin:true}})
    res.json({success:true})
})

router.post('/upload-image', (req:any, res:any) => {
    console.log('POST request at /api/user/upload-image', 'resolve:', path.resolve(__dirname, '..', '..', 'src', 'images'))
    let form = new formidable.IncomingForm()
    form.keepExtensions = true

    form.on('error', (err) => {
        console.log('error uploading fiel')
        res.json({
            result: "failed",
            data: {},
            numberOfImages: 0,
            message: "Cannot upload images. Error: " + err
        })
    })

    form.on('fileBegin', (name, file) => {
        file.path = path.resolve(__dirname, '..', '..', 'src', 'images', file.name)
        console.log('File path: ' + file.path)
    })

    
    form.on('file', (field, file) => {
        console.log('woo, uploaded file')
        res.json({
            success: true,
            data: {'filename': file.name, 'size': file.size},
            numberOfImages: 1,
            message: 'upload successful',
            path: file.path
        })
    })
    
    form.parse(req)
})

router.post('/update-image', verifyAuth, (req:any, res:any) => {
    console.log("req.body de /api/users/update-image", req.body)
    const { username, profileImage } = req.body
    console.log('POST request at /api/user/update', username, profileImage)
    try {
        client.db(db).collection(collecUsers).updateOne({username}, {$set: {profileImage}})
        res.json({success:true})
    } catch (e) {console.error(e); return res.json({success:false})}
})


module.exports = router
