import { client, db, collecPanel } from "../controllers/database"
import { ObjectId } from 'mongodb'
import { TradingViewAPI } from "tradingview-scraper"


const router = require('express').Router()
const tv = new TradingViewAPI()

router.get('/', (req:any, res:any) => {
    const ticket = req.query.ticket
    console.log("TICKET:", ticket)
    tv.getTicker(ticket).then((ticket:Object) => {
        console.log(ticket)
        res.json(ticket)
    })
})

router.post('/', async (req:any, res:any) => {
    try {console.log("POST REQUEST  ...  /api/panel", req.body.username)} catch (error) {console.log(error)}
    const obj = await client.db(db).collection(collecPanel).findOne({_id: new ObjectId('60046963c5b8c928f43d962a')})
    const ticketsObj = obj.ticketsObj
    const ticketsLeadersObj = obj.ticketsLeadersObj
    console.log(ticketsObj.length, ticketsLeadersObj.length)
    res.json({success:true, ticketsObj, ticketsLeadersObj})
})


module.exports = router



// let i = 0
// while (i<tickets.length) {
//     console.log(tickets[i])
//     try {
//         const ticket = await tv.getTicker(tickets[i])
//         ticketsObj.push(ticket)
//     } catch (error) {console.error(error)}
//     i++
// }
