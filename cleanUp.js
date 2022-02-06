const fs = require('fs-extra')
require("dotenv").config()
const {
	Client,
	AccountId,
	PrivateKey,
    ContractDeleteTransaction,
    FileDeleteTransaction,
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
const fileIdFilename = './contract_file_id.dat'

async function cleanUp() {

    const contractIdExists = await fs.pathExists(contractIdFilename)
    if (contractIdExists) {
        const contractIdBytes = await fs.readFile(contractIdFilename)
        const contractId = ContractId.fromBytes(contractIdBytes)
        
        const transaction = await new ContractDeleteTransaction()
            .setContractId(contractId)
            .freezeWith(client)
        const signTx = await transaction.sign(ownerKey)
        const txResponse = await signTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const transactionStatus = receipt.status;

        console.log("Delete contract status " + transactionStatus.toString());
        if (transactionStatus.toString() === 'SUCCESS') {
            await fs.remove(contractIdFilename)
        }
    }

    const fileIdExists = await fs.pathExists(fileIdFilename)
    if (fileIdExists) {
        const fileIdBytes = await fs.readFile(fileIdFilename)
        const fileId = FileId.fromBytes(fileIdBytes)

        //Create the transaction
        const transaction = await new FileDeleteTransaction()
            .setFileId(fileId)
            .setMaxTransactionFee(new Hbar(2))
            .freezeWith(client);

        const signTx = await transaction.sign(ownerKey);
        const submitTx = await signTx.execute(client);
        const receipt = await submitTx.getReceipt(client);
        const transactionStatus = receipt.status;

        console.log("Delete file status " + transactionStatus.toString());
        if (transactionStatus.toString() === 'SUCCESS') {
            await fs.remove(fileIdFilename)
        }
    }
}

cleanUp()
    .then(() => console.log('Done'))
    .catch((error) => console.error(error))
