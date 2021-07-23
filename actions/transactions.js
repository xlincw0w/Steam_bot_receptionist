const { constants } = require('../utilities')
const { currencies } = require('../utilities')

module.exports.HandlePurchase = function HandlePurchase(steamID, params) {
    if (params.length !== 3) return { purchase: false, msg: 'Invalid parameters\n\nPlease make sure you type !buy <key amount> <cryptocurrency>.' }
    if (!constants.num_rg.test(params[1])) return { purchase: false, msg: 'Invalid parameters\n\n<key amount> should be a number' }
    if (!constants.alph_rg.test(params[2])) return { purchase: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0] }
    if (!currencies.includes(params[2].toUpperCase())) return { purchase: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0] }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)

    return { purchase: true, msg: 'Your purchase was validated.\n An offer has been sent to you account.' }
}

module.exports.HandleSell = function HandleSell(steamID, params) {
    if (params.length !== 3) return { pending: false, msg: 'Invalid parameters\n\nPlease make sure you type !sell <key amount> <cryptocurrency>.' }
    if (!constants.num_rg.test(params[1])) return { pending: false, msg: 'Invalid parameters\n\n<key amount> should be a number' }
    if (!constants.alph_rg.test(params[2])) return { pending: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0] }
    if (!currencies.includes(params[2].toUpperCase())) return { pending: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0] }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)

    return { pending: true, msg: `Your sell is in pending state.\n\nPlease send a trade offert with ${amount} of keys.` }
}
