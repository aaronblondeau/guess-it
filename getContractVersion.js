const fs = require('fs-extra')
require("dotenv").config()
const {
	Client,
	AccountId,
	PrivateKey,
    ContractCallQuery,
    ContractId,
    Hbar
} = require("@hashgraph/sdk")

const accountId = AccountId.fromString(process.env.GUESSER_ID)
const accountKey = PrivateKey.fromString(process.env.GUESSER_PVTKEY)

const client = Client.forTestnet().setOperator(accountId, accountKey)
client.setMaxTransactionFee(new Hbar(0.75))
client.setMaxQueryPayment(new Hbar(0.01))

const contractIdFilename = './contract_id.dat'

async function getVersion() {
    const contractIdExists = await fs.pathExists(contractIdFilename)
    if (contractIdExists) {
        const contractIdBytes = await fs.readFile(contractIdFilename)
        const contractId = ContractId.fromBytes(contractIdBytes)
        console.log(`~ Getting version of contract id ${contractId}`)

        const contractQueryTx = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("contractVersion");
        const contractQuerySubmit = await contractQueryTx.execute(client);
        const contractQueryResult = contractQuerySubmit.getUint256(0);
        console.log(`~ version is ${contractQueryResult}`);
    } else {
        throw new Error('No contract ID detected!')
    }
}

getVersion().then(() => { 
    console.log('Done')
})
.catch((error) => console.error(error))
