const router = require('express').Router()
const { TradingViewAPI } = require("tradingview-scraper")
const tv = new TradingViewAPI()

router.get('/', (req, res) => {
    const ticket = req.query.ticket
    console.log("TICKET:", ticket)
    tv.getTicker(ticket).then((ticket) => {
        console.log(ticket)
        res.json(ticket)
    })
})


module.exports = router


// const ticket = {
//     last_retrieved: 2020-11-30T21:04:33.099Z,
//     ch: -236.23,
//     chp: -3.05,
//     current_session: 'market',
//     description: 'Bitcoin / U.S. dollar',
//     exchange: 'BITSTAMP',
//     fractional: false,
//     high_price: 781523,
//     is_tradable: true,
//     low_price: 745221.08,
//     lp: 751727.46,
//     minmov: 1,
//     minmove2: 0,
//     open_price: 775321.69,
//     original_name: 'BITSTAMP:BTCUSD',
//     prev_close_price: 775321.69,
//     pricescale: 100,
//     pro_name: 'BITSTAMP:BTCUSD',
//     short_name: 'BTCUSD',
//     type: 'bitcoin',
//     update_mode: 'streaming',
//     volume: 5167.07349537,
//     s: 'ok',
//     last_update: 2020-11-30T21:04:21.842Z,
//     ask: 752026.56,
//     bid: 751628.22
// }
