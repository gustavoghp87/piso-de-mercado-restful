import { updateDB } from '../controllers/updateDB'


export const router = require('express').Router()

router.post('/', (req:any, res:any) => {
    console.log(req.body.psw)
    updateDB()
    res.json({success:true})
})


module.exports = router
