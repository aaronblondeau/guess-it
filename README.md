# GuessIt

This is a discovery project.  The goals of the project are:
- Learn about Hedera and Smart Contracts
- Learn basic Solidity
- Develop code snippets for future use

The smart contract is currently deployed on testnet here : [0.0.29627045](https://testnet.dragonglass.me/hedera/contracts/0.0.29627045)

The smart contract is a guessing game.  Call the guessPhrase method with a string and see if you're right!  The transaction will succeed with a correct guess and will throw a CONTRACT_REVERT_EXECUTED error status with an incorrect guess.

## Setup

To use the code, first create an .env file with the following variables set (for testnet):

```
OWNER_ID=
OWNER_PUBKEY=
OWNER_PVTKEY=
SECRET_PHRASE=
GUESSER_ID=
GUESSER_PUBKEY=
GUESSER_PVTKEY=
```

Next install node dependencies:

```
yarn install
```

Then compile the smart contract:

```
yarn solcjs
```

Next, upload the binary file:

```
node uploadFile.js
```

Create the contract:

```
node createContract.js
```

Finally, make calls to the contract:

```
node makeGuess.js
```

To delete the contract and file when you're done:

```
node cleanUp.js
```
