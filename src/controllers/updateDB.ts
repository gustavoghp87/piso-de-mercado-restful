import { TradingViewAPI } from "tradingview-scraper"
import { client, db, collecPanel } from './database'
import { ObjectId } from 'mongodb'


export const updateDB = async () => {
    const tv = new TradingViewAPI()
    const tickets:string[] = [
        'BCBA:AGRO', 'BCBA:AUSO', 'BCBA:BHIP', 'BCBA:BOLT', 'BCBA:BPAT', 'CBA:BRIO',
        'BCBA:BRIO6', 'BCBA:CADO', 'BCBA:CAPX', 'BCBA:CARC', 'BCBA:CECO2',
        'BCBA:CELU', 'BCBA:CEPU', 'BCBA:CGPA2', 'BCBA:CTIO', 'BCBA:DGCU2', 'BCBA:DOME',
        'BCBA:DYCA', 'BCBA:EDLH', 'BCBA:EMDE', 'BCBA:FERR', 'BCBA:FIPL',
        'BCBA:GAMI', 'BCBA:GARO', 'BCBA:GBAN', 'BCBA:GCLA', 'BCBA:GRIM', 'BCBA:HAVA',
        'BCBA:INAG', 'BCBA:INTR', 'BCBA:INVJ', 'BCBA:IRCP', 'BCBA:IRSA', 'BCBA:LEDE',
        'BCBA:LONG', 'BCBA:MERA', 'BCBA:METR', 'BCBA:MOLA', 'BCBA:MOLI', 'BCBA:MORI',
        'BCBA:MTR', 'BCBA:OEST', 'BCBA:PATA', 'BCBA:PGR', 'BCBA:POLL', 'BCBA:RICH',
        'BCBA:RIGO', 'BCBA:ROSE'
    ]
    let ticketsObj = []
    let i = 0
    while (i<tickets.length) {
        console.log("Buscando", tickets[i])
        try {
            const ticket = await tv.getTicker(tickets[i])
            ticketsObj.push(ticket)
        } catch (error) {console.error(error)}
        i++
    }
    try {
        await client.db(db).collection(collecPanel).updateOne({_id: new ObjectId('60046963c5b8c928f43d962a')}, {$set: {ticketsObj}})
        console.log(ticketsObj.length, ", actualizado ", new Date(Date.now()-1000*60*60*3).toLocaleString("es-AR", {timeZone: "UTC"}))
    } catch (error) {
        console.log(error)
    }

}
