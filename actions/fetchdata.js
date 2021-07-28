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

module.exports.GetStockValue = async function GetStockValue() {
    let fetchapi = await axios.get(process.env.HACHI_STORE_API + '/stock')

    return fetchapi.data.keys
}

module.exports.GetPrices = async function GetPrices(params) {
    if (params.length > 1) {
        let { KEY_PRICE_BUY, KEY_PRICE_SELL } = GetConfigValues()
        const balance = await GetCurrencies()
        let data = await GetExchanges()
        data = data.filter((elem) => elem.symbol === params[1].toUpperCase())

        if (data.length === 0) return 'Please type a correct currency'

        let response = `Cryptocurrency prices :\n\n 1${data[0].symbol} = ${data[0].quotes.USD.price}$\n\n I buy 1 key ${KEY_PRICE_BUY}$\n ${(
            KEY_PRICE_BUY / data[0].quotes.USD.price
        ).toFixed(8)} ${data[0].symbol}\n\n
        I sell 1 key ${KEY_PRICE_SELL}$\n ${(KEY_PRICE_SELL / data[0].quotes.USD.price).toFixed(8)} ${data[0].symbol}`

        return response
    } else {
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
}

module.exports.GetFees = async function GetFees(coinbase) {
    let { WITHDRAWAL_FEES } = GetConfigValues()
    // let response = `Fees : \n\n✹ Withdrawal fees => ${WITHDRAWAL_FEES}\n\n`

    // coinbase.getSellPrice({ currencyPair: 'BTC-USD' }, function (err, price) {
    //     console.log(price)
    // })

    let response =
        'Fees :\n\n=> If the total transaction amount is less than or equal to $10, the fee is $0.99\n=> If the total transaction amount is more than $10 but less than or equal to $25, the fee is $1.49\n=> If the total transaction amount is more than $25 but less than or equal to $50, the fee is $1.99\n=> If the total transaction amount is more than $50 but less than or equal to $200, the fee is $2.99\n\nThese fees will not apply if you have Coinbase and use your Coinbase email while withdrawing.'
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

    const currencies = await GetCurrencies()

    const data = await GetExchanges()
    if (params.length == 3) {
        if (!constants.num_rg.test(params[1])) return 'Invalid parameters\n\n<key amount> should be a number'
        if (!constants.alph_rg.test(params[2])) return 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample'
        if (!find(currencies, { code: params[2].toUpperCase() })) return `Invalid parameters\n\n<cryptocurrency> does not exist\nExample ${currencies[0].code}`
        if (!constants.alph_rg.test(params[2])) return 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample '
        let exchange = find(data, { symbol: params[2].toUpperCase() })
        const onedollar_to_cryto = (1 / exchange.quotes.USD.price).toFixed(8)
        const buycost = (onedollar_to_cryto * KEY_PRICE_BUY * parseInt(params[1])).toFixed(8)
        const response = `Hachi BOT : \n\n✹ ${params[1]} Keys\n✹ One dollar of ${exchange.name} ${onedollar_to_cryto} \n\n✹ Buy cost : ${buycost} ${exchange.symbol} ( ${
            KEY_PRICE_BUY * parseInt(params[1])
        }$ ) \n\n`
        return response
    } else {
        if (params.length == 2) {
            if (!constants.num_rg.test(params[1])) return 'Invalid parameters\n\n<key amount> should be a number'
            //const currencies = ['BTC', 'ADA', 'ETH', 'LTC', 'DOGE', 'BCH', 'DOT', 'USDC ', 'USDT']
            const currencies = await GetCurrencies()
            console.log(currencies)
            let messages = `if you Buy ${params[1]} keys you will get ${params[1] * KEY_PRICE_BUY}$ \n \n`
            currencies.forEach((currency) => {
                const exchange = find(data, { symbol: currency.code })
                console.log('exchange : ', exchange)
                const buycost = ((params[1] * KEY_PRICE_BUY) / exchange.quotes.USD.price).toFixed(8)
                messages = messages.concat(`${buycost} ${currency.code}\n  `)
            })
            return messages.concat(` \n \nIf you want to Buy this amount now, type !buy ${params[1]} <cryptocurrency>
            `)
        } else {
            return 'Invalid parameters\n\nPlease make sure you type !buycost <key amount> <cryptocurrency> Or\n\nPlease make sure you type !buycost <key amount>.'
        }
    }
}

module.exports.GetSellCost = async function GetSellCost(params) {
    let { KEY_PRICE_BUY, KEY_PRICE_SELL } = GetConfigValues()

    const currencies = await GetCurrencies()

    const data = await GetExchanges()
    if (params.length == 3) {
        if (!constants.num_rg.test(params[1])) return 'Invalid parameters\n\n<key amount> should be a number'
        if (!constants.alph_rg.test(params[2])) return 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample'
        if (!find(currencies, { code: params[2].toUpperCase() })) return `Invalid parameters\n\n<cryptocurrency> does not exist\nExample ${currencies[0].code}`
        if (!constants.alph_rg.test(params[2])) return 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample '
        let exchange = find(data, { symbol: params[2].toUpperCase() })
        const onedollar_to_cryto = (1 / exchange.quotes.USD.price).toFixed(8)
        const sellcost = onedollar_to_cryto * KEY_PRICE_SELL * parseInt(params[1]).toFixed(8)
        const response = `Hachi BOT : \n\n✹ ${params[1]} Keys\n✹ One dollar of ${exchange.name} ${onedollar_to_cryto} \n\n✹ Sell cost : ${sellcost} ${exchange.symbol} ( ${
            KEY_PRICE_SELL * parseInt(params[1])
        }$ ) \n\n`
        return response
    } else {
        if (params.length == 2) {
            if (!constants.num_rg.test(params[1])) return 'Invalid parameters\n\n<key amount> should be a number'
            //const currencies = ['BTC', 'ADA', 'ETH', 'LTC', 'DOGE', 'BCH', 'DOT', 'USDC ', 'USDT']
            const currencies = await GetCurrencies()
            console.log(currencies)
            let messages = `if you sell ${params[1]} keys you will get ${params[1] * KEY_PRICE_SELL}$ \n \n`
            currencies.forEach((currency) => {
                const exchange = find(data, { symbol: currency.code })
                console.log('exchange : ', exchange)
                const sellcost = ((params[1] * KEY_PRICE_SELL) / exchange.quotes.USD.price).toFixed(8)
                messages = messages.concat(`${sellcost} ${currency.code}\n  `)
            })
            return messages.concat(` \n \nIf you want to sell this amount now, type !sell ${params[1]} <cryptocurrency>
            `)
        } else {
            return 'Invalid parameters\n\nPlease make sure you type !sellcost <key amount> <cryptocurrency> Or\n\nPlease make sure you type !sellcost <key amount>.'
        }
    }
}

module.exports.BuyAlert = async function BuyAlert(steamID, params) {
    let fetchapi = await axios.get(process.env.HACHI_STORE_API + '/stock')
    let response = 'Stock available : \n\n✹ Keys ' + fetchapi.data.keys

    if (params.length === 2) {
        if (fetchapi.data.keys > parseInt(params[1])) return `Already available in stock you can buy ${params[1]} keys right now.`
        else {
            await db('clients')
                .update({ buyalert: parseInt(params[1]) })
                .where({ steam_id: steamID })

            return 'Succesfully subscribed to buy alert.'
        }
    } else {
        return 'Please type keys amount'
    }
}

module.exports.SellAlert = async function SellAlert(steamID, params) {
    let fetchapi = await axios.get(process.env.HACHI_STORE_API + '/stock')
    let response = 'Stock available : \n\n✹ Keys ' + fetchapi.data.keys

    if (params.length === 2) {
        if (fetchapi.data.keys + parseInt(params[1]) < process.env.STOCK_LIMIT) return `You can sell ${params[1]} keys right now.`
        else {
            await db('clients')
                .update({ sellalert: parseInt(params[1]) })
                .where({ steam_id: steamID })

            return 'Successfully subscribed to sell alert.'
        }
    } else {
        return 'Please type keys amount'
    }
}
