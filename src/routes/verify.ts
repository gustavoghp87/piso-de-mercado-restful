import { client, db, collecUsers } from '../controllers/database'
import { jwtKey } from '../index'
import jwt from 'jsonwebtoken'


export const verifyAuth = async (req:any, res:any, next:any) => {
    let { username, token } = req.body
    console.log(`Verificando Auth(${username}, ${token})`)
    if (!username || !token) return res.json({auth:false})
    if (token.includes('token=')) token = token.split('oken=')[1]
    try {
        jwt.verify(token, jwtKey, (error:any, result:any) => {
            if (error) console.log("error", error)
            if (result) {
                console.log("result", result.iat)
                const tokenTimestamp = result.iat * 1000
                const actualTimestamp = Date.now()
                console.log(`Fue ${tokenTimestamp} y es ${actualTimestamp}, da ${actualTimestamp-tokenTimestamp} que es ${(actualTimestamp-tokenTimestamp)/1000/60/60/24} días`);
                
            }
        })
        // { username: 'Super', iat: 1610984781 }
    } catch (error) {
        console.log(error)
    }
    const user = await client.db(db).collection(collecUsers).findOne({username})
    if (user && user.token===token) {console.log(`Verificado ${username}`); return next()}
    console.log(`Falló verifAuth de ${username}`)
    res.json({auth:false})
}

export const verifyAdmin = async (req:any, res:any, next:any) => {
    let { username, token } = req.body
    console.log(`Verificando Auth(${username}, ${token})`);
    if (!username || !token) return res.json({auth:false})
    if (token.includes('token=')) token = token.split('oken=')[1]
    const user = await client.db(db).collection(collecUsers).findOne({username})
    if (user && user.token===token && user.superAdmin)  {console.log(`Verificado admin ${username}`); return next()}
    console.log(`Falló verifAdmin de ${username}`)
    res.json({auth:false})
}
