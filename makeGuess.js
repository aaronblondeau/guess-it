const fs = require('fs-extra')
require("dotenv").config()
const {
	Client,
	AccountId,
	PrivateKey,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    Hbar
} = require("@hashgraph/sdk")
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

const accountId = AccountId.fromString(process.env.GUESSER_ID)
const accountKey = PrivateKey.fromString(process.env.GUESSER_PVTKEY)

const client = Client.forTestnet().setOperator(accountId, accountKey)
client.setMaxTransactionFee(new Hbar(0.75))
client.setMaxQueryPayment(new Hbar(0.01))

const contractIdFilename = './contract_id.dat'

async function makeGuess(guess) {
    const contractIdExists = await fs.pathExists(contractIdFilename)
    if (contractIdExists) {
        const contractIdBytes = await fs.readFile(contractIdFilename)
        const contractId = ContractId.fromBytes(contractIdBytes)
        console.log(`~ Testing guess ${guess} against contract id ${contractId}`)

        try {
            const contractExecTx = await new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(3000000)
                .setFunction("guessPhrase", new ContractFunctionParameters().addString(guess))
                .setMaxTransactionFee(new Hbar(2))
            const contractExecResult = await contractExecTx.execute(client)
            const contractExecRx = await contractExecResult.getReceipt(client)
            if (contractExecRx.status.toString() === 'SUCCESS') {
                return true
            }
            return false
        } catch (error) {
            console.warn(error)
            return false
        }
    } else {
        throw new Error('No contract ID detected!')
    }
}

readline.question(`What's your guess? `, async (guess) => { 
    makeGuess(guess)
    .then((result) => { 
        if (result) {
            console.log('You guessed correctly!')
        } else {
            console.log('WRONG!')
        }
    })
    .catch((error) => console.error(error))
    readline.close()
})
