const fs = require('fs-extra')
require("dotenv").config()
const {
	Client,
	AccountId,
	PrivateKey,
    FileAppendTransaction,
    FileUpdateTransaction,
	Hbar,
    FileId
} = require("@hashgraph/sdk")

const ownerId = AccountId.fromString(process.env.OWNER_ID)
const ownerKey = PrivateKey.fromString(process.env.OWNER_PVTKEY)

const client = Client.forTestnet().setOperator(ownerId, ownerKey)
client.setMaxTransactionFee(new Hbar(0.75))
client.setMaxQueryPayment(new Hbar(0.01))

const fileIdFilename = './contract_file_id.dat'

async function reUploadContract() {
    const bytecode = await fs.readFile('./GuessIt_sol_GuessIt.bin')
    let fileSize = bytecode.length

    const idFileExists = await fs.pathExists(fileIdFilename)
    if (!idFileExists) {
        throw new Error(`File id not found!`)
    }

    const fileIdBytes = await fs.readFile(fileIdFilename)
    const fileId = FileId.fromBytes(fileIdBytes)

    console.log(`~ File is ${fileSize} bytes`)

    // Update the file
    const fileUpdateTx = new FileUpdateTransaction().setKeys([ownerKey]).setFileId(fileId)
    if (fileSize <= 6144) {
        console.log('~ File is less than or equal 6144 bytes - setting content')
        fileUpdateTx.setContents(bytecode)
    } else {
        fileUpdateTx.setContents([])
    }
    fileUpdateTx.freezeWith(client)
    const fileUpdateSign = await fileUpdateTx.sign(ownerKey)
    const fileUpdateSubmit = await fileUpdateSign.execute(client)
    const fileUpdateRx = await fileUpdateSubmit.getReceipt(client)

    console.log(`~ File update status ${fileUpdateRx.status.toString()}`)

    if (fileSize > 6144) {
        console.log('~ File is larger than 6144 bytes - appending content')

        const fileAppendTx = new FileAppendTransaction()
            .setFileId(fileId)
            .setContents(bytecode)
            .setMaxChunks(10)
            .freezeWith(client);
        const fileAppendSign = await fileAppendTx.sign(ownerKey)
        const fileAppendSubmit = await fileAppendSign.execute(client)
        const fileAppendRx = await fileAppendSubmit.getReceipt(client)

        console.log(`~ File append status ${fileAppendRx.status}`)
    }
}

reUploadContract()
    .then(() => console.log('Done'))
    .catch((error) => console.error(error))
