import { client, db, collecUsers } from '../controllers/database'
import { jwtKey } from '../index'
import jwt from 'jsonwebtoken'


export const verifyAuth = async (req:any, res:any, next:any) => {
    let { username, token } = req.body
    console.log(`Verificando Auth(${username}, ${token})`)
    if (!username || !token) return res.json({auth:false})
    if (token.includes('token=')) token = token.split('oken=')[1]
    const verif2 = await jwt.verify(token, jwtKey)
    console.log("VERIFICANDO TOKEN...", verif2)
    
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
