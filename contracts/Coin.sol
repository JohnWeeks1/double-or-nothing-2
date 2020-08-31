// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 < 0.7.0;

import "./provable.sol";

contract Coin is usingProvable {

    uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;
    
    uint public ownerBalance;
    address payable owner;

    mapping(address => User) public users;
    mapping(bytes32 => Query) public queries;

    struct User {
        uint balance;
        bytes32 queryId;
    }
    
    struct Query {
        address payable userAddress;
        uint headsOrTails;
        bytes32 queryId;
    }

    
    modifier isOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }
    
    constructor() public {
        owner = msg.sender;
    }

    event logNewProvableQuery(string description, bool trueOrFalse);
    event betResult(bool trueOrFalse, string result);

    function __callback(bytes32 _queryId,string memory _result) public override {
        require(msg.sender == provable_cbAddress());
        
        uint256 randomNumber = (uint256(keccak256(abi.encodePacked(_result))) % 2) + 1;

        if (queries[_queryId].queryId == _queryId && randomNumber == queries[_queryId].headsOrTails) {
            playerWins(_queryId);
            emit betResult(true, "You win!");
        } else {
            ownerWins(_queryId);
            emit betResult(false, "You lose!");
        }
    }

    function randomNumGenerator(uint coinSide) payable public {
        uint256 QUERY_EXECUTION_DELAY = 0;
        uint256 GAS_FOR_CALLBACK = 200000;

        bytes32 _queryId = provable_newRandomDSQuery(
            QUERY_EXECUTION_DELAY,
            NUM_RANDOM_BYTES_REQUESTED,
            GAS_FOR_CALLBACK
        );
        
        queries[_queryId].userAddress = msg.sender;
        queries[_queryId].queryId = _queryId;
        queries[_queryId].headsOrTails = coinSide;
        users[msg.sender].queryId = _queryId;

        emit logNewProvableQuery("Bet placed, awaiting result", true);  
    }
    
    function setOwnerBalance() public payable isOwner {
        ownerBalance += msg.value;
    }
    
    function startBet(uint headsOrTails) public payable {
        require(msg.value >= 100000000000000000 wei, "Sorry, but the minimum bet is 0.1 ether");
        require(msg.value <= 1 ether, "Sorry, but the maximum bet is 1 ether");
        require(msg.value <= ownerBalance, "Sorry, but the available balance is less than the amount you are betting.");

        users[msg.sender].balance += msg.value;
        
        randomNumGenerator(headsOrTails);
    }
    
    function playerWins(bytes32 _queryId) private returns(uint) {
        uint pb = users[queries[_queryId].userAddress].balance * 2;
        ownerBalance = ownerBalance - users[queries[_queryId].userAddress].balance;
        users[queries[_queryId].userAddress].balance = 0;
        
        queries[_queryId].userAddress.transfer(pb);

        return users[queries[_queryId].userAddress].balance;
    }
    
    function ownerWins(bytes32 _queryId) private returns(uint) {
        ownerBalance = ownerBalance + users[queries[_queryId].userAddress].balance;
        users[queries[_queryId].userAddress].balance = 0;

        return ownerBalance;
    }
}
