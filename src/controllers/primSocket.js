let socketRofex
const request = require('request')
const WebSocket = require('ws')
const base_url = "http://api.remarkets.primary.com.ar/"
require('dotenv').config()


function rofex_iniciarWS(pUsuario, pClave, pCallback) {
    try {
        request.post(
            base_url + "j_spring_security_check?j_username=" + pUsuario + "&j_password=" + pClave, { form: { key: 'value' } },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {} else {
                    if (!response || typeof(response) == "undefined") {
                        pCallback("error");
                    } else {
                        if (typeof(response.headers) == "undefined" || typeof(response.headers['set-cookie']) == "undefined" || !response.headers['set-cookie']) {
                            pCallback("error");
                        } else {
                            var token = response.headers['set-cookie'].toString().split(";")[0];
                            pCallback(token);
                        }}}});
    } catch (error) {
        pCallback("error");
    }
}

function suscribir(datos) {
    if (socketRofex && socketRofex.readyState == 1) {
        socketRofex.send(JSON.stringify(datos));
        console.log("Conectado con socketRofex", JSON.stringify(datos), socketRofex.readyState)
    }
}

var simbolosProd = [{ symbol: "RFX20Dic19", marketId: "ROFX" },{ symbol: "DODic19", marketId: "ROFX" }];

var pedido = {"type": "smd", "level": 1, "entries": ["BI", "OF", "LA", "IV","NV","OI"],
    "products": simbolosProd, "depth": 10 };


rofex_iniciarWS(user=process.env.REMARKETS_USER, password=process.env.REMARKETS_PSW, (pTk) => {
    if (pTk != "error") {
        socketRofex = new WebSocket("ws://api.remarkets.primary.com.ar/", null, { headers: { Cookie:   pTk } });
        socketRofex.on('open', function open() {
            suscribir(pedido);});
        socketRofex.on('error', function(e) {
            console.log("error de scoket", e);
        });
        socketRofex.on('message', function(data, flags) {
            try {
                var p = JSON.parse(data);
                console.log("socketRofex on message", p);
            } catch (error) {
                console.log(error);}
        });
    } else {
        console.log("Error in login process");
        //console.log(pLogin);
    }
})
