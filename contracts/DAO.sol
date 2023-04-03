//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract DAO {
    address owner;
    Token public token;
    uint256 public quorum;

    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
        uint256 votes;
        bool finalized;
    }

    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) votes;

    event Propose(
        uint id,
        uint256 amount,
        address recipient,
        address creator
    );

    event Vote(
        uint256 id,
        address investor
    );

    event Finalize(
        uint256 id
    );

    constructor (Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    // allow contract to receive ether
    receive() external payable {}

    modifier onlyInvestor() {
        require(
            token.balanceOf(msg.sender) > 0,
            "must be token holder"
        );
        _;
    }

    function createProposal(
        string memory _name, 
        uint256 _amount, 
        address payable _recipient
    ) external onlyInvestor {

        require(address(this).balance >= _amount);

        proposalCount++;

        // create a proposal in the mapping
        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _amount,
            _recipient,
            0,
            false
        );

        emit Propose(
            proposalCount,
            _amount,
            _recipient,
            msg.sender
        );
    }

    // vote on proposal
    function vote(uint256 _id) external onlyInvestor {

        // fetch the proposal from the mapping
        // NOTE: 'storage' causes any updates to be stored back in mapping
        Proposal storage proposal = proposals[_id];

        // prevent double-voting
        require(!votes[msg.sender][_id], "Already voted.");

        // update votes
        proposal.votes += token.balanceOf(msg.sender);

        // track that investor has voted
        votes[msg.sender][_id] = true;

        // emit an event
        emit Vote(_id, msg.sender);
    }

    // finalize proposal
    function finalizeProposal(uint256 _id) external onlyInvestor {

        // fetch the proposal
        Proposal storage proposal = proposals[_id];

        // ensure proposal is not already finalized
        require(proposal.finalized == false, "proposal already finalized");

        // mark proposal as finalized
        proposal.finalized = true;

        // check that proposal has enough votes
        require(proposal.votes >= quorum, "must reach quorum to finalize proposal");

        // check that contract has enough ether
        require(address(this).balance >= proposal.amount);

        // tranfer funds
        // NOTE: below "call" method is better than proposal.recipient.transfer(proposal.amount);
        //       bcause we can check teh result in sent
        (bool sent, ) = proposal.recipient.call{ value: proposal.amount}("");
        require(sent);

        // emit an event
        emit Finalize(_id);
    }
}
