import { TradingViewAPI } from "tradingview-scraper"
import { client, db, collecPanel } from './database'
import { ObjectId } from 'mongodb'
import { typeTicket } from '../models/typeTicket'


const ToLocaleTime = (last_update:string) => {
    try {
        const time = new Date(last_update).toLocaleString("es-AR", {timeZone:'America/Argentina/Buenos_Aires'}).slice(0, 15)
        console.log(last_update, " ... ", new Date(last_update), "...", new Date(last_update).toLocaleString("es-AR", {timeZone:'America/Argentina/Buenos_Aires'}), "...", time)
        return time
    } catch (error) {return "error"}
}

export const updateDB = async () => {
    const tv = new TradingViewAPI()
    let ticketsObj = []
    let ticketsLeadersObj = []
    let i = 0
    let j = 0
    const tickets:string[] = [
        'BCBA:AGRO', 'BCBA:AUSO', 'BCBA:BHIP', 'BCBA:BOLT', 'BCBA:BPAT', 'CBA:BRIO',
        'BCBA:BRIO6', 'BCBA:CADO', 'BCBA:CAPX', 'BCBA:CARC', 'BCBA:CECO2', 'BCBA:CELU',
        'BCBA:CEPU', 'BCBA:CGPA2', 'BCBA:CTIO', 'BCBA:DGCU2', 'BCBA:DOME', 'BCBA:DYCA',
        'BCBA:EDLH', 'BCBA:EMDE', 'BCBA:FERR', 'BCBA:FIPL', 'BCBA:GAMI', 'BCBA:GARO',
        'BCBA:GBAN', 'BCBA:GCLA', 'BCBA:GRIM', 'BCBA:HAVA', 'BCBA:INAG', 'BCBA:INTR',
        'BCBA:INVJ', 'BCBA:IRCP', 'BCBA:IRSA', 'BCBA:LEDE', 'BCBA:LONG', 'BCBA:MERA',
        'BCBA:METR', 'BCBA:MOLA', 'BCBA:MOLI', 'BCBA:MORI', 'BCBA:MTR', 'BCBA:OEST',
        'BCBA:PATA', 'BCBA:PGR', 'BCBA:POLL', 'BCBA:RICH', 'BCBA:RIGO', 'BCBA:ROSE'
    ]
    const ticketsLeaders:string[] = [
        'BCBA:ALUA', 'BCBA:BBAR', 'BCBA:BMA', 'BCBA:BYMA', 'BCBA:CEPU', 'BCBA:COME',
        'BCBA:CRES', 'BCBA:CVH', 'BCBA:EDN', 'BCBA:GGAL', 'BCBA:HARG', 'BCBA:LOMA',
        'BCBA:MIRG', 'BCBA:PAMP', 'BCBA:SUPV', 'BCBA:TECO2', 'BCBA:TGNO4', 'BCBA:TGSU2',
        'BCBA:TRAN', 'BCBA:TXAR', 'BCBA:VALO', 'BCBA:YPFD'
    ]
    
    console.log("General panel:")
    while (i<tickets.length) {
        console.log("\nBuscando", tickets[i])
        try {
            const ticket = await tv.getTicker(tickets[i])
            ticket.my_last_update = ToLocaleTime(ticket.last_update.toString())
            console.log("CHANGED TIME:", ticket.my_last_update)
            ticketsObj.push(ticket)
        } catch (error) {console.error(error)}
        i++
    }
    
    console.log("Leader panel:")
    while (j<ticketsLeaders.length) {
        console.log("Buscando", ticketsLeaders[j])
        try {
            const ticket:typeTicket = await tv.getTicker(ticketsLeaders[j])
            ticket.my_last_update = ToLocaleTime(ticket.last_update.toString()).toString()
            console.log("CHANGED TIME:", ticket.my_last_update)
            ticketsLeadersObj.push(ticket)
        } catch (error) {console.error(error)}
        j++
    }
    
    try {
        await client.db(db).collection(collecPanel).updateOne({_id: new ObjectId('60046963c5b8c928f43d962a')}, {$set: {ticketsObj, ticketsLeadersObj}})
        console.log(ticketsObj.length, ", actualizado ", new Date(Date.now()-1000*60*60*3).toLocaleString("es-AR", {timeZone: "UTC"}))
    } catch (error) {
        console.log(error)
    }

}
