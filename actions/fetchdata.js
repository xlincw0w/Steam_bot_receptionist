const { constants } = require('../utilities')
const { GetCurrencies } = require('../utilities')
const { db } = require('../db/dbconfig')
const { find } = require('lodash')
const axios = require('axios')

const { GetConfigValues, SetConfigFile } = require('../utilities')

require('dotenv').config()

async function GetExchanges() {
    let fetchapi = await axios.get('https://api.alternative.me/v2/ticker/')

    let myMap = new Map(Object.entries(fetchapi.data.data))
    let data = []

    for (const value of myMap.values()) {
        data.push(value)
    }

    return data
}

module.exports.GetExchanges = GetExchanges

module.exports.GetStock = async function GetStock() {
    let fetchapi = await axios.get(process.env.HACHI_STORE_API + '/stock')
    let response = 'Stock available : \n\n✹ Keys ' + fetchapi.data.keys

    return response
}

module.exports.GetPrices = async function GetPrices() {
    let { KEY_PRICE_BUY, KEY_PRICE_SELL } = GetConfigValues()

    let response = `Prices : \n\n✹ Buying [Team fortress 2] KEY => ${KEY_PRICE_BUY}$\n✹ Selling [Team fortress 2] KEY => ${KEY_PRICE_SELL}$\n\n`

    const balance = await GetCurrencies()
    const data = await GetExchanges()

    data.map((elem) => {
        if (find(balance, { code: elem.symbol })) {
            response += `✹ ${elem.name} 1.0${elem.symbol} = ${elem.quotes.USD.price}$\n`
        }
    })

    return response
}

module.exports.GetFees = async function GetFees() {
    let { WITHDRAWAL_FEES } = GetConfigValues()
    let response = `Fees : \n\n✹ Withdrawal fees => ${WITHDRAWAL_FEES}\n\n`
    return response
}

module.exports.GetMinWithdrawal = async function GetFees() {
    let { WITHDRAWAL_MIN } = GetConfigValues()
    let response = `Withdrawal : \n\n✹ Minimum withdrawal => ${WITHDRAWAL_MIN}$\n\n`
    return response
}

module.exports.GetOwner = async function GetOwner() {
    let response = `Hachi BOT : \n\n✹ Owned by ${process.env.OWNER}\n\n`
    return response
}

module.exports.GetBuyCost = async function GetBuyCost(params) {
    let { KEY_PRICE_BUY, KEY_PRICE_SELL } = GetConfigValues()

    if (params.length !== 3) return 'Invalid parameters\n\nPlease make sure you type !buycost <key amount> <cryptocurrency>.'
    if (!constants.num_rg.test(params[1])) return 'Invalid parameters\n\n<key amount> should be a number'

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample '
    if (!find(currencies, { code: params[2].toUpperCase() })) return `Invalid parameters\n\n<cryptocurrency> does not exist\nExample ${currencies[0].code}`

    const data = await GetExchanges()

    let exchange = find(data, { symbol: params[2].toUpperCase() })
    const onedollar_to_cryto = 1 / exchange.quotes.USD.price
    const buycost = onedollar_to_cryto * KEY_PRICE_BUY * parseInt(params[1])

    const response = `Hachi BOT : \n\n✹ ${params[1]} Keys\n✹ One dollar of ${exchange.name} ${onedollar_to_cryto} \n\n✹ Buy cost : ${buycost} ${exchange.symbol} ( ${
        KEY_PRICE_BUY * parseInt(params[1])
    }$ )\n\n`

    return response
}

module.exports.GetSellCost = async function GetSellCost(params) {
    let { KEY_PRICE_BUY, KEY_PRICE_SELL } = GetConfigValues()

    if (params.length !== 3) return 'Invalid parameters\n\nPlease make sure you type !sellcost <key amount> <cryptocurrency>.'
    if (!constants.num_rg.test(params[1])) return 'Invalid parameters\n\n<key amount> should be a number'

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample '
    if (!find(currencies, { code: params[2].toUpperCase() })) return `Invalid parameters\n\n<cryptocurrency> does not exist\nExample ${currencies[0].code}`

    const data = await GetExchanges()

    let exchange = find(data, { symbol: params[2].toUpperCase() })
    const onedollar_to_cryto = 1 / exchange.quotes.USD.price
    const buycost = onedollar_to_cryto * KEY_PRICE_SELL * parseInt(params[1])

    const response = `Hachi BOT : \n\n✹ ${params[1]} Keys\n✹ One dollar of ${exchange.name} ${onedollar_to_cryto} \n\n✹ Sell cost : ${buycost} ${exchange.symbol} ( ${
        KEY_PRICE_SELL * parseInt(params[1])
    }$ ) \n\n`

    return response
}
