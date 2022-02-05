// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.11;
pragma experimental ABIEncoderV2;

// Compile with:
// npm install -g solc
// solcjs --bin GuessIt.sol
contract GuessIt {

    string private secretPhrase;
    address public owner;

    constructor (string memory _phrase) {
        owner = msg.sender;
        secretPhrase = _phrase;
    }

    function setPhrase(string memory _phrase) public {
        // Only contract owner can update phrase
        require(msg.sender == owner);
        secretPhrase = _phrase;
    }

    // It turns out that the return value of this is hard to get
    // We could use CallContractQuery instead : https://docs.hedera.com/guides/docs/sdks/smart-contracts/call-a-smart-contract-function-1
    // But that won't help for TODOs planned below:
    function guessPhrase(string memory _guess) public view returns (bool) {
        // Since I cannot find a way to get return value from transaction
        // throw an error if the guess is wrong:
        require (keccak256(abi.encodePacked((_guess))) == keccak256(abi.encodePacked((secretPhrase))));
        return true;
    }

    // TODO - collect token for each wrong guess and add it to pot
    // TODO - award pot to sender upon correct guess
}
