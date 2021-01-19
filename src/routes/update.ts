import { updateDB } from '../controllers/updateDB'


export const router = require('express').Router()

router.post('/', (req:any, res:any) => {
    try {console.log(req.body.psw)} catch (error) {console.log(error)}
    try {console.log(req.psw)} catch (error) {console.log(error)}
    try {console.log(req.data.psw)} catch (error) {console.log(error)}
    updateDB()
    res.json({success:true})
})


module.exports = router
