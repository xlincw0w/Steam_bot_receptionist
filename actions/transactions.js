const { constants } = require('../utilities')
const { GetCurrencies } = require('../utilities')
const { GetBalance } = require('./userdata')
const { find } = require('lodash')

module.exports.HandlePurchase = async function HandlePurchase(steamID, params) {
    if (params.length !== 3) return { purchase: false, msg: 'Invalid parameters\n\nPlease make sure you type !buy <key amount> <cryptocurrency>.' }
    if (!constants.num_rg.test(params[1])) return { purchase: false, msg: 'Invalid parameters\n\n<key amount> should be a number' }
    if (!constants.alph_rg.test(params[2])) return { purchase: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0] }

    const currencies = await GetCurrencies()
    if (!find(currencies, { code: params[2].toUpperCase() })) return { purchase: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0] }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)
    const balance = await GetBalance(steamID)

    return { purchase: true, msg: `Your purchase was validated.\n\n An offer has been sent to you account.\n\n${balance}` }
}

module.exports.HandleSell = async function HandleSell(steamID, params) {
    if (params.length !== 3) return { pending: false, msg: 'Invalid parameters\n\nPlease make sure you type !sell <key amount> <cryptocurrency>.' }
    if (!constants.num_rg.test(params[1])) return { pending: false, msg: 'Invalid parameters\n\n<key amount> should be a number' }
    if (!constants.alph_rg.test(params[2])) return { pending: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0] }

    const currencies = await GetCurrencies()
    if (!find(currencies, { code: params[2].toUpperCase() })) return { pending: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0] }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)
    const balance = await GetBalance(steamID)

    return { pending: true, msg: `Your sell is in pending state.\n\nPlease send a trade offert with ${amount} keys.\n\n${balance}` }
}

module.exports.HandleDeposit = async function HandleSell(steamID, params) {
    if (params.length !== 3) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !withdraw <crypto amount> <cryptocurrency>.' }
    if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n<crypto amount> should be a real' }
    if (!constants.alph_rg.test(params[2])) return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0] }

    const currencies = await GetCurrencies()
    if (!find(currencies, { code: params[2].toUpperCase() })) return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0] }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)

    const balance = await GetBalance(steamID)

    return { withdraw: true, msg: `Your deposit request has been executed.\n\n${balance}` }
}

module.exports.HandleWithdraw = async function HandleSell(steamID, params) {
    let address_or_email = null

    if (params.length !== 4) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !withdraw <crypto amount> <cryptocurrency> <address/coinbase email>.' }
    if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n<crypto amount> should be a real' }
    if (!constants.alph_rg.test(params[2])) return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0] }

    constants.email_rg.test(params[3]) ? (address_or_email = 'coinbase_email') : (address_or_email = 'address')

    const currencies = await GetCurrencies()
    if (!find(currencies, { code: params[2].toUpperCase() })) return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0] }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(address_or_email)
    console.log(currency, amount)

    const balance = await GetBalance(steamID)

    return { withdraw: true, msg: `Your withdraw request has been executed.\n\n${balance}` }
}
