const { constants } = require('../utilities')
const { GetCurrencies } = require('../utilities')
const { db } = require('../db/dbconfig')

module.exports.SetTradeLink = async function SetTradeLink(steamID, params, client) {
    if (params.length > 1) {
        db('clients')
            .update({
                trade_link: params[1],
            })
            .where({ steam_id: steamID })
            .then((response) => {
                let res = { msg: 'You can start trading now.' }
                client.chatMessage(steamID, res.msg)
            })
            .catch((err) => {
                console.log(err)
                let res = { msg: 'An error occured try again later.' }
                client.chatMessage(steamID, res.msg)
            })
    } else {
        let res = {
            msg: `Please provide a trade link.\n\n!settradelink <yourtradelink>\n\nWhere to find trade link\nhttps://steamcommunity.com/profiles/${steamID}/tradeoffers/privacy#trade_offer_access_url`,
        }
        client.chatMessage(steamID, res.msg)
    }
}

module.exports.GetBalance = async function GetBalance(steamID) {
    let balances = await db('balances').select('*').where({ id_client: steamID }).leftJoin('currencies', 'currencies.id_currency', 'balances.id_currency')

    let response = 'Your balance is :\n\n'

    balances.map((elem, index) => {
        response += '✹ ' + (index + 1) + ' => ' + elem.designation + ' ' + elem.code + ' : ' + elem.balance + '\n'
    })

    return { array: balances, response }
}

module.exports.provideToken = async (steamID, token) => {
    axios
        .post(`/token/${token}`, {
            steamID: steamID,
        })
        .catch((e) => console.log(e))
}
