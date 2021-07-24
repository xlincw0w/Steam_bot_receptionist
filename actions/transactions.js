const { constants } = require('../utilities')
const { GetCurrencies } = require('../utilities')
const { GetBalance } = require('./userdata')
const { find } = require('lodash')

const { KEY_PRICE_BUY, KEY_PRICE_SELL, WITHDRAWAL_FEES, WITHDRAWAL_MIN } = require('../config')

module.exports.HandlePurchase = async function HandlePurchase(steamID, params) {
    if (params.length !== 3) return { purchase: false, msg: 'Invalid parameters\n\nPlease make sure you type !buy <key amount> <cryptocurrency>.' }
    if (!constants.num_rg.test(params[1])) return { purchase: false, msg: 'Invalid parameters\n\n<key amount> should be a number' }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return { purchase: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code }
    if (!find(currencies, { code: params[2].toUpperCase() }))
        return { purchase: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)
    const balance = await GetBalance(steamID)

    return { purchase: true, msg: `Your purchase was validated.\n\n An offer has been sent to you account.\n\n${balance}` }
}

module.exports.HandleSell = async function HandleSell(steamID, params) {
    if (params.length !== 3) return { pending: false, msg: 'Invalid parameters\n\nPlease make sure you type !sell <key amount> <cryptocurrency>.' }
    if (!constants.num_rg.test(params[1])) return { pending: false, msg: 'Invalid parameters\n\n<key amount> should be a number' }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return { pending: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code }
    if (!find(currencies, { code: params[2].toUpperCase() })) return { pending: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)
    const balance = await GetBalance(steamID)

    return { pending: true, msg: `Your sell is in pending state.\n\nPlease send a trade offert with ${amount} keys.\n\n${balance}` }
}

module.exports.HandleDeposit = async function HandleSell(steamID, params) {
    if (params.length !== 3) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !withdraw <crypto amount> <cryptocurrency>.' }
    if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n<crypto amount> should be a real' }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code }
    if (!find(currencies, { code: params[2].toUpperCase() }))
        return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)

    const balance = await GetBalance(steamID)

    return {
        withdraw: true,
        msg: `Your deposit request has been executed.\n\n${balance} \n\n to autorize please click on this link : https://www.coinbase.com/oauth/authorize?account=&client_id=43926b5bbe08d3739da3e9b7fb3503536100b6318bfc668a1cc01f306bdeeabb&redirect_uri=http%3A%2F%2F41.109.103.182%3A3000%2FuserTokenFetch&response_type=code&scope=wallet:transactions:send&meta[${amount}]=1&state=SECURE_RANDOM`,
    }
}

module.exports.HandleWithdraw = async function HandleSell(steamID, params) {
    let address_or_email = null

    if (params.length !== 4) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !withdraw <crypto amount> <cryptocurrency> <address/coinbase email>.' }
    if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n<crypto amount> should be a real' }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code }

    constants.email_rg.test(params[3]) ? (address_or_email = 'coinbase_email') : (address_or_email = 'address')

    if (!find(currencies, { code: params[2].toUpperCase() }))
        return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(address_or_email)
    console.log(currency, amount)

    const balance = await GetBalance(steamID)

    return { withdraw: true, msg: `Your withdraw request has been executed.\n\n${balance}` }
}

module.exports.SetBuyPrice = async function SetBuyPrice(params) {
    if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setsellprice <price>.' }
    if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

    KEY_PRICE_BUY = parseFloat(params[1])

    return `Admin : \n\n✹ Buy price updated to ${KEY_PRICE_BUY}`
}

module.exports.SetSellPrice = async function SetBuyPrice(params) {
    if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setsellprice <price>.' }
    if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

    KEY_PRICE_SELL = parseFloat(params[1])

    return `Admin : \n\n✹ Sell price updated to ${KEY_PRICE_SELL}`
}
