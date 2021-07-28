module.exports = {
    commands: `
!commands - shows all commands.

!how2buy - shows instructions how to buy keys.
!how2sell - shows instructions how to sell keys.

!buy <key amount> <cryptocurrency> - buys <key amount> keys from your <cryptocurrency> balance and automatically sends the trade offer. Instead of <key amount> you can use word MAX to buy all keys you can afford.
!sell <key amount> <cryptocurrency> - sends the trade offer with <key amount> of your keys. When accepted, you will get <cryptocurrency> balance. Instead of <key amount> you can use word MAX to sell all of your keys.

!deposit <cryptocurrency> - shows your personal <cryptocurrency> address and instructions how to deposit.
!withdraw <crypto amount> <cryptocurrency> <address/coinbase email> - withdraws <crypto amount> of your <cryptocurrency> balance to <address/coinbase email>. By providing a Coinbase email you will avoid fees. Instead of <crypto amount> you can use word MAX to withdraw all of your balance.
!prices [cryptocurrency] - shows current crypto and key prices.
!fees [cryptocurrency] - shows current crypto withdrawal fees.
!mins [cryptocurrency] - shows crypto minimum withdrawal amounts.
!balance - shows your balance.
!stock - shows how many keys the bot has.
!stats - shows the bot's and your personal stats.

!buycost <key amount> [cryptocurrency] - shows the cost of <key amount> keys if you were buying.
!sellcost <key amount> [cryptocurrency] - shows the cost of <key amount> keys if you were selling.

!buyamount <crypto amount> <cryptocurrency> - shows how many keys you can buy with <crypto amount> <cryptocurrency>.
!sellamount <crypto amount> <cryptocurrency> - shows how many keys you need to sell to get <crypto amount> <cryptocurrency>.

!buyalert <key amount> - receive a notification via chat when bot's stock reaches <key amount> or more keys (so you will be able to buy that much).
!sellalert <key amount> - receive a notification via chat when bot's stock reaches <key amount> empty space (so you will be able to sell that much).

!owner - shows the owner's Steam link.
!bulk - shows the current bulk discounts for buyers.
!support <your message> - ask a question or request support from the owner.
!giveaway - shows if there is a giveaway active and how to join it.
`,

    how2buy:
        'How to buy:\n\n1. Check how much key price with !buycost <key amount> [cryptocurrency]\n2. Send any amount of your crypto to our bot by !deposit <cryptocurrency>\n3. Check how many keys you can buy with !balance\n‏‏‎4. Use !buy <key amount> <cryptocurrency> ex : !buy 200 BTC\n5. Accept the trade offer bot sent you',
    how2sell:
        'How to sell:\n\n1. Check how much your key price with !sellcost <key amount> [cryptocurrency]\n2. Use !sell <key amount> <cryptocurrency> ‎‏‏ex: !sell 200 BTC\n3. Accept the trade offer bot sent you\n4. Withdraw your crypto by !withdraw <crypto amount> <cryptocurrency> <address/coinbase email>‎‏‏‎‎‏‏\n5. Your withdraw should be sent within 1-30 minutes',
    buy: 'Buying process',
    sell: 'Selling process',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    price: 'Price',
    fees: 'Fees :\n\n=> If the total transaction amount is less than or equal to $10, the fee is $0.99\n=> If the total transaction amount is more than $10 but less than or equal to $25, the fee is $1.49\n=> If the total transaction amount is more than $25 but less than or equal to $50, the fee is $1.99\n=> If the total transaction amount is more than $50 but less than or equal to $200, the fee is $2.99',
    mins: 'Mins',
    balance: 'Balance',
    stock: 'Stock',
    stats: 'Stats',
    bulk: 'No information for now',
    support: 'No information for now',
    giveaway:
        'To participate in our giveaways, all you need to do is be a member of our official group!\nThere you will also be able to see more information about ongoing giveaways and get notified about new ones :)\nCurrent status: There is no giveaway active right now.\nhttps://steamcommunity.com/gid/groupid',
}
