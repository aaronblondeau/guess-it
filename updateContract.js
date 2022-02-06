const fs = require('fs-extra')
require("dotenv").config()
const {
	Client,
	AccountId,
	PrivateKey,
    ContractUpdateTransaction,
    Hbar,
    FileId,
    ContractId
} = require("@hashgraph/sdk")

const ownerId = AccountId.fromString(process.env.OWNER_ID)
const ownerKey = PrivateKey.fromString(process.env.OWNER_PVTKEY)

const client = Client.forTestnet().setOperator(ownerId, ownerKey)
client.setMaxTransactionFee(new Hbar(0.75))
client.setMaxQueryPayment(new Hbar(0.01))

const contractIdFilename = './contract_id.dat'

async function updateContract() {

    const contractIdExists = await fs.pathExists(contractIdFilename)
    if (contractIdExists) {
        const contractIdBytes = await fs.readFile(contractIdFilename)
        const contractId = ContractId.fromBytes(contractIdBytes)
        
        const transaction = await new ContractUpdateTransaction()
            .setContractId(contractId)
            .setContractMemo('v2attempt')
            // .setBytecodeFileId(FileId.fromString("0.0.29627119"))
            .freezeWith(client)
        const signTx = await transaction.sign(ownerKey)
        const txResponse = await signTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const transactionStatus = receipt.status;

        console.log("Update contract status " + transactionStatus.toString());
    }
}

updateContract()
    .then(() => console.log('Done'))
    .catch((error) => console.error(error))
