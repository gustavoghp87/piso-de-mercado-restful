import { client, db, collecPanel } from "../controllers/database"
import { ObjectId } from 'mongodb'
import { verifyAuth } from "./verify"


const router = require('express').Router()
const { TradingViewAPI } = require("tradingview-scraper")
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
    const obj = await client.db(db).collection(collecPanel).findOne({_id: new ObjectId('60046963c5b8c928f43d962a')})
    const ticketsObj = obj.ticketsObj
    console.log(ticketsObj.length)
    res.json({success:true, ticketsObj})
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

    // ticketsObj.push({
    //     last_retrieved: "2021-01-10T16:36:08.632Z",
    //     rtc: 1719.26,
    //     rchp: 0.02,
    //     rch: 0.26,
    //     s: "ok",
    //     last_update: "2021-01-10T16:36:08.626Z",
    //     volume: 737457,
    //     update_mode: "streaming",
    //     type: "stock",
    //     short_name: "MELI",
    //     pro_name: "NASDAQ:MELI",
    //     pricescale: 100,
    //     prev_close_price: 1597.97,
    //     original_name: "BATS:MELI",
    //     open_price: 1623.84,
    //     minmove2: 0,
    //     minmov: 1,
    //     lp: 1719,
    //     low_price: 1612.8291,
    //     local_description: "MERCADOLIBRE INC",
    //     language: "en",
    //     is_tradable: true,
    //     high_price: 1719.26,
    //     fractional: false,
    //     exchange: "Cboe BZX",
    //     description: "MERCADOLIBRE INC",
    //     current_session: "out_of_session",
    //     chp: 7.57,
    //     ch: 121.03,
    //     bid: 1600,
    //     ask: 1728,
    //     sector: "Technology Services",
    //     market_cap_basic: 85726014300,
    //     industry: "Internet Software/Services",
    //     earnings_per_share_basic_ttm: -0.083,
    //     dividends_yield: 0,
    //     beta_1_year: 1.269188,
    //     basic_eps_net_income: -3.5323
    // })
