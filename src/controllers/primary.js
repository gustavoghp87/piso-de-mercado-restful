const router = require('express').Router()
const fes = require('./primaryLogin')


router.get('/api/primary/1', async (req, res) => {
    fes.get_accounts(async (data_get) => {
        data_get = await JSON.parse(data_get)
        // if (data_get.status == "OK") {}
        console.log("RESP:", data_get)        
        res.json(data_get)
    })
})

router.get('/api/primary/2', async (req, res) => {
    fes.get_instruments(type_request="segments", sec_detailed = false, async (data_get) => {
        data_get = await JSON.parse(data_get)
        // if (data_get.status == "OK") {}
        console.log("RESP:", data_get)        
        res.json({title:"Segmentos disponibles", data_get})
    })
})

router.get('/api/primary/3', async (req, res) => {
    fes.get_instruments(type_request = "securities", sec_detailed = false, async (data_get) => {
        data_get = await JSON.parse(data_get)
        // if (data_get.status == "OK") {}
        console.log("RESP:", data_get)        
        res.json({title:"Lista de instrumentos disponibles", data_get})
    })
})

router.get('/api/primary/4', async (req, res) => {
    fes.get_instruments(type_request = "securities", sec_detailed = true, async (data_get) => {
        data_get = await JSON.parse(data_get)
        // if (data_get.status == "OK") {}
        console.log("RESP:", data_get)        
        res.json({title:"Lista detallada de los instrumentos disponibles", data_get})
    })
})

router.get('/api/primary/5', async (req, res) => {
    fes.get_market_data(
        market_id = "ROFX",
        symbol = "RFX20Dic19",
        entries = ["BI", "OF", "LA"],
        depth = 1,
    async (data_get) => {
        data_get = await JSON.parse(data_get)
        // if (data_get.status == "OK") {}
        console.log("RESP:", data_get)        
        res.json({title:"Datos del mercado en tiempo real", data_get})
    })
})

router.get('/api/primary/6', async (req, res) => {
    fes.get_trade_history(
        market_id = "ROFX",
        symbol = "USD BROU CAJA",
        date_query = "",
        date_from = "2020-01-01",
        date_to = "2020-12-20",
    async (data_get) => {
        data_get = await JSON.parse(data_get)
        // if (data_get.status == "OK") {}
        console.log("RESP:", data_get)        
        res.json({title:`Operaciones históricas para un instrumento dado (${date_from} - ${date_to}, ${date_query}, ${symbol})`, data_get})
    })
})


module.exports = router
