const jsRofex = require("rofexjs")
const fes = new jsRofex("reMarkets")
require('dotenv').config()


fes.login(user=process.env.REMARKETS_USER, password=process.env.REMARKETS_PSW, (rta) => {
    if (rta.status == "OK") {
        console.log("Connected Successfully !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    } else {
        console.log("Error in login process")
        console.log(rta)
    }
})

module.exports = fes
