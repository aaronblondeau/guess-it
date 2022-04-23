// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.11;
pragma experimental ABIEncoderV2;

// Compile with:
// npm install -g solc
// solcjs --bin GuessIt.sol
contract GuessIt {

    string private secretPhrase;
    address public owner;
    uint pot = 0;

    event GuessAtttempt(address indexed from, string guess, bool success, uint pot);

    constructor (string memory _phrase) {
        owner = msg.sender;
        secretPhrase = _phrase;
    }

    function setPhrase(string memory _phrase) public {
        // Only contract owner can update phrase
        require(msg.sender == owner);
        secretPhrase = _phrase;
    }

    function guessPhrase(string memory _guess) public payable returns (bool) {
        // Make sure caller has sent at least 5 HBAR
        require (msg.value >= 500000000, "insufficient payable");

        // Add funds to the pot (why doesn't this show in contract balance on dragonglass?)
        pot += msg.value;

        if (keccak256(abi.encodePacked((_guess))) != keccak256(abi.encodePacked((secretPhrase)))) {
            emit GuessAtttempt(msg.sender, _guess, false, pot);
            return false;
        }
        
        // Guess was correct, transfer pot to caller (retain some if pot to pay fees)
        emit GuessAtttempt(msg.sender, _guess, true, pot);
        if (pot - 100000000 > 0) {
            payable(msg.sender).transfer(pot - 100000000);
        }
        return true;
    }

    function contractVersion() public pure returns (uint) {
        return 8;
    }
}
