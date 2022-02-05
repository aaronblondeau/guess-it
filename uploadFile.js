const fs = require('fs-extra')
require("dotenv").config()
const {
	Client,
	AccountId,
	PrivateKey,
	FileCreateTransaction,
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

async function uploadContract() {
    const bytecode = await fs.readFile('./GuessIt_sol_GuessIt.bin')
    let fileSize = bytecode.length
    let bytecodeFileId = null

    const idFileExists = await fs.pathExists(fileIdFilename)
    if (idFileExists) {
        const fileIdBytes = await fs.readFile(fileIdFilename)
        const fileId = FileId.fromBytes(fileIdBytes)
        throw new Error(`File id already exists (${fileId})!  Remove ${fileIdFilename} or run cleanUp.js to clear it.`)
    }

    console.log(`~ File is ${fileSize} bytes`)

    // Create a file on Hedera and store the contract bytecode
    const fileCreateTx = new FileCreateTransaction().setKeys([ownerKey])
    if (fileSize <= 6144) {
        console.log('~ File is less than or equal 6144 bytes - setting content')
        fileCreateTx.setContents(bytecode)
    }
    fileCreateTx.freezeWith(client)
    const fileCreateSign = await fileCreateTx.sign(ownerKey)
    const fileCreateSubmit = await fileCreateSign.execute(client)
    const fileCreateRx = await fileCreateSubmit.getReceipt(client)
    bytecodeFileId = fileCreateRx.fileId

    // Record the file id for future runs
    await fs.writeFile(fileIdFilename, bytecodeFileId.toBytes())

    console.log(`~ New file ID is ${bytecodeFileId}`)

    if (fileSize > 6144) {
        console.log('~ File is larger than 6144 bytes - appending content')

        const fileAppendTx = new FileAppendTransaction()
            .setFileId(bytecodeFileId)
            .setContents(bytecode)
            .setMaxChunks(10)
            .freezeWith(client);
        const fileAppendSign = await fileAppendTx.sign(ownerKey)
        const fileAppendSubmit = await fileAppendSign.execute(client)
        const fileAppendRx = await fileAppendSubmit.getReceipt(client)

        console.log(`~ File append status ${fileAppendRx.status}`)
    }
}

uploadContract()
    .then(() => console.log('Done'))
    .catch((error) => console.error(error))