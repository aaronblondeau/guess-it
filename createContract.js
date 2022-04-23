const fs = require('fs-extra')
require("dotenv").config()
const {
	Client,
	AccountId,
	PrivateKey,
    ContractCreateTransaction,
    ContractFunctionParameters,
	Hbar,
    FileId,
    ContractId
} = require("@hashgraph/sdk")

const ownerId = AccountId.fromString(process.env.OWNER_ID)
const ownerKey = PrivateKey.fromString(process.env.OWNER_PVTKEY)

const client = Client.forTestnet().setOperator(ownerId, ownerKey)
client.setMaxTransactionFee(new Hbar(5.0))
client.setMaxQueryPayment(new Hbar(0.05))

const contractIdFilename = './contract_id.dat'
const fileIdFilename = './contract_file_id.dat'

async function createContract() {

    const contractIdExists = await fs.pathExists(contractIdFilename)
    if (contractIdExists) {
        const contractIdBytes = await fs.readFile(contractIdFilename)
        const contractId = ContractId.fromBytes(contractIdBytes)
        throw new Error(`File id already exists (${contractId})!  Remove ${contractIdFilename} or run cleanUp.js to clear it.`)
    } else {
        const fileIdExists = await fs.pathExists(fileIdFilename)
        if (fileIdExists) {
            const fileIdBytes = await fs.readFile(fileIdFilename)
            const bytecodeFileId = FileId.fromBytes(fileIdBytes)
            console.log(`~ Creating contract with file ID ${bytecodeFileId}`)
            
            const contractInstantiateTx = new ContractCreateTransaction()
                .setAdminKey(ownerKey)
                .setBytecodeFileId(bytecodeFileId)
                .setGas(3000000)
                // Set initial secret phrase on contract creation
                .setConstructorParameters(new ContractFunctionParameters().addString(process.env.SECRET_PHRASE))
            const contractInstantiateSubmit = await contractInstantiateTx.execute(client)
            const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(client)
            const contractId = contractInstantiateRx.contractId

            await fs.writeFile(contractIdFilename, contractId.toBytes())

            console.log(`~ New contract id ${contractId}`)
        } else {
            throw new Error('No file ID detected!')
        }
    }
}

createContract()
    .then(() => console.log('Done'))
    .catch((error) => console.error(error))

