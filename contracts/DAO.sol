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
        uint256[3] votes;   // array: For, Against, Abstain
        bool finalized;
        bool passed;
    }

    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) hasVoted;

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
        uint256 id,
        bool passed
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
        Proposal memory p;

        p.id = proposalCount;
        p.name = _name;
        p.amount = _amount;
        p.recipient = _recipient;
        p.finalized = false;
        p.passed = false;
        p.votes[0] = 0;
        p.votes[1] = 0;
        p.votes[2] = 0;

        proposals[proposalCount] = p;

/*         proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _amount,
            _recipient,
            [0,0,0],
            false,
            false
        );
*/
        emit Propose(
            proposalCount,
            _amount,
            _recipient,
            msg.sender
        );
    }

    // vote on proposal
    function vote(
        uint256 _id,
        uint8 _voteType
        ) 
        external onlyInvestor {

        // fetch the proposal from the mapping
        // NOTE: 'storage' causes any updates to be stored back in mapping
        Proposal storage proposal = proposals[_id];

        // prevent double-voting
        require(!hasVoted[msg.sender][_id], "Already voted.");

        // update votes
        proposal.votes[_voteType] += token.balanceOf(msg.sender);

        // track that investor has voted
        hasVoted[msg.sender][_id] = true;

        // emit an event
        emit Vote(_id, msg.sender);
    }

    // finalize proposal
    function finalizeProposal(uint256 _id) external onlyInvestor {

        // fetch the proposal
        Proposal storage proposal = proposals[_id];

        // ensure proposal is not already finalized
        require(proposal.finalized == false, "proposal already finalized");

        // check that proposal has a quorum
        require(
            proposal.votes[0]+proposal.votes[1]+proposal.votes[2] >= quorum, 
            "must reach quorum to finalize proposal"
        );

        // check that contract has enough ether
        require(
            address(this).balance >= proposal.amount,
            "not enough funds in contract to finalize"
        );

        // check that proposal passes
        if (proposal.votes[0] > proposal.votes[1]) {
            // proposal passes
            // transfer funds with "call" method to allow checking result
            (bool sent, ) = proposal.recipient.call{ value: proposal.amount }("");

            // require successful funds transfer to finalize
            require(sent, "funds failed to transfer - not finalized");

            proposal.passed = true;
        }
        else {
            proposal.passed = false;
        }

        // mark proposal as finalized
        proposal.finalized = true;

        // emit an event
        emit Finalize(_id, proposal.passed);
    }
}
