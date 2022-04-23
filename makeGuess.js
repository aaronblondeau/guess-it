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

        const contractExecTx = await new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(3000000)
            .setFunction("guessPhrase", new ContractFunctionParameters().addString(guess))
            .setPayableAmount(5.0)
            .setMaxTransactionFee(new Hbar(2))
        const contractExecResult = await contractExecTx.execute(client)
        const contractExecRx = await contractExecResult.getReceipt(client)
        // console.log(contractExecRx)

        // https://hedera.com/blog/how-to-get-event-information-from-hedera-smart-contracts
        const record = await contractExecResult.getRecord(client);
        const result = record.contractFunctionResult

        // Convert 32 byte result to a uint (1 = true, 0 = false)
        const correct = result.bytes.readUIntLE(31, 1)

        // console.log(correct)
        if (correct) {
            return true
        }
        return false
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
