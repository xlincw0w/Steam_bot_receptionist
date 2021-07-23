const { constants } = require('../utilities')
const { GetCurrencies } = require('../utilities')
const { db } = require('../db/dbconfig')

module.exports.GetBalance = async function GetBalance(steamID) {
    let balances = await db('balances').select('*').where({ id_client: steamID.accountid }).leftJoin('currencies', 'currencies.id_currency', 'balances.id_currency')

    let response = 'Your balance is :\n\n'

    balances.map((elem, index) => {
        response += '✹ ' + (index + 1) + ' => ' + elem.designation + ' ' + elem.code + ' : ' + elem.balance + '\n'
    })

    return response
}
