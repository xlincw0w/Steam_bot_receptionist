const { constants } = require('../utilities')
const { GetCurrencies } = require('../utilities')
const { GetBalance } = require('./userdata')
const { find } = require('lodash')

const { GetConfigValues, SetConfigFile } = require('../utilities')

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
    if (params.length !== 3) return { deposit: false, msg: 'Invalid parameters\n\nPlease make sure you type !deposit <crypto amount> <cryptocurrency>.' }
    if (!constants.float_rg.test(params[1])) return { deposit: false, msg: 'Invalid parameters\n\n<crypto amount> should be a real' }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return { deposit: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code }
    if (!find(currencies, { code: params[2].toUpperCase() })) return { deposit: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)

    const balance = await GetBalance(steamID)
    const state = {
        amount: amount,
        steamID: steamID,
    }

    return {
        withdraw: true,
        msg: `Your deposit request has been executed.\n\n${balance} \n\n to autorize please click on this link : https://www.coinbase.com/oauth/authorize?account=&client_id=43926b5bbe08d3739da3e9b7fb3503536100b6318bfc668a1cc01f306bdeeabb&redirect_uri=http%3A%2F%2F41.109.103.182%3A3000%2FuserTokenFetch&response_type=code&scope=wallet:transactions:send,wallet:accounts:read,wallet:user:read,wallet:user:email&meta[send_limit_amount]=${amount}&meta[send_limit_currency]=USD&meta[send_limit_period]=day&state=SECURE_RANDOM&state=${state}`,
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

module.exports.SetBuyPrice = async function SetBuyPrice(steamID, params) {
    console.log(steamID)
    console.log('Admin', process.env.ADMIN_STEAMID64)
    if (steamID == process.env.ADMIN_STEAMID64) {
        if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setsellprice <price>.' }
        if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

        SetConfigFile(parseFloat(params[1]), 'KEY_PRICE_BUY')

        return `Admin : \n\n✹ Buy price updated to ${params[1]}`
    } else {
        return `Admin : \n\n✹ Operation not allowed !`
    }
}

module.exports.SetSellPrice = async function SetSellPrice(steamID, params) {
    if (steamID == process.env.ADMIN_STEAMID64) {
        if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setsellprice <price>.' }
        if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

        SetConfigFile(parseFloat(params[1]), 'KEY_PRICE_SELL')

        return `Admin : \n\n✹ Sell price updated to ${params[1]}`
    } else {
        return `Admin : \n\n✹ Operation not allowed !`
    }
}

module.exports.SetWithdrawalFees = async function SetWithdrawalFees(steamID, params) {
    if (steamID == process.env.ADMIN_STEAMID64) {
        if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setwithdrawalfees <price>.' }
        if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

        SetConfigFile(parseFloat(params[1]), 'WITHDRAWAL_FEES')

        return `Admin : \n\n✹ Buy price updated to ${params[1]}`
    } else {
        return `Admin : \n\n✹ Operation not allowed !`
    }
}

module.exports.SetWithdrawalMin = async function SetWithdrawalMin(steamID, params) {
    if (steamID == process.env.ADMIN_STEAMID64) {
        if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setwithdrawalmins <price>.' }
        if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

        SetConfigFile(parseFloat(params[1]), 'WITHDRAWAL_MINS')

        return `Admin : \n\n✹ Sell price updated to ${params[1]}`
    } else {
        return `Admin : \n\n✹ Operation not allowed !`
    }
}
