const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

const VoteType = {
  For: 0,
  Against: 1,
  Abstain: 2
}

describe('DAO', () => {
  let token, dao
  let deployer,
      funder,
      investor1,
      investor2,
      investor3,
      investor4,
      investor5,
      recipient,
      user

  beforeEach(async () => {
    // set up accounts
    let accounts = await ethers.getSigners()
    deployer = accounts[0]
    funder = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]
    investor3 = accounts[4]
    investor4 = accounts[5]
    investor5 = accounts[6]
    recipient = accounts[7]
    user = accounts[8]


    // deploy token
    const Token = await ethers.getContractFactory('Token')
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')

    // send tokens to investors - each one gets 20%
    transaction = await token.connect(deployer).transfer(investor1.address, tokens(300000))
    await transaction.wait()
    transaction = await token.connect(deployer).transfer(investor2.address, tokens(250000))
    await transaction.wait()
    transaction = await token.connect(deployer).transfer(investor3.address, tokens(200000))
    await transaction.wait()
    transaction = await token.connect(deployer).transfer(investor4.address, tokens(150000))
    await transaction.wait()
    transaction = await token.connect(deployer).transfer(investor5.address, tokens(100000))
    await transaction.wait()

    // deploy dao; set quorum to 50% of total supply
    const DAO = await ethers.getContractFactory('DAO')
    dao = await DAO.deploy(token.address, '500000000000000000000001')

    // send 100 eth to the dao treasury
    await funder.sendTransaction({ to: dao.address, value: ether(100) })

  })

  describe('Deployment', () => {

    it ('sends ether to the dao treasury', async () => {
      expect(await ethers.provider.getBalance(dao.address)).to.equal(ether(100))
    })

    it('returns token address', async () => {
      expect(await dao.token()).to.equal(token.address)
    })

    it('returns quorum', async () => {
      expect(await dao.quorum()).to.equal('500000000000000000000001')
    })

    it('returns maxVotes', async () => {
      expect(await dao.maxVotes()).to.equal('1000000000000000000000000')
    })

  })


  describe('Proposal Creation', () => {
    let transaction, result

    describe('Success', () => {

      beforeEach(async () => {
        transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
        result = await transaction.wait()
      })

      it('updates proposal count', async () => {
        expect(await dao.proposalCount()).to.equal(1)
      })

      it('updates proposal mapping', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.id).to.equal(1)
        expect(proposal.amount).to.equal(ether(100))
        expect(proposal.recipient).to.equal(recipient.address)
      })

      it('emits a propose event', async () => {
        await expect(transaction).to.emit(dao, 'Propose')
          .withArgs(1, ether(100), recipient.address, investor1.address)
      })
    })

    describe('Failure', () => {

      it('rejects invalid amount', async () => {
        await expect(dao.connect(investor1).createProposal('Proposal 1', ether(1000), recipient.address)).to.be.reverted
      })

      it('rejects non-investor', async () => {
        await expect(dao.connect(user).createProposal('Proposal 1', ether(10), recipient.address)).to.be.reverted
      })
    })
  })

  describe('Voting', () => {
    let transaction, result

    beforeEach(async () => {
      transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
      result = await transaction.wait()
    })

    describe('Success', () => {

      it('updates votesFor count', async () => {
        transaction = await dao.connect(investor1).vote(1, VoteType.For)
        result = await transaction.wait()

        const proposal = await dao.proposals(1)
        expect(proposal.votesFor).to.equal(tokens(300000))
        expect(proposal.votesAgainst).to.equal(tokens(0))
        expect(proposal.votesAbstain).to.equal(tokens(0))
      })

      it('updates votesAgainst count', async () => {
        transaction = await dao.connect(investor1).vote(1, VoteType.Against)
        result = await transaction.wait()

        const proposal = await dao.proposals(1)
        expect(proposal.votesFor).to.equal(tokens(0))
        expect(proposal.votesAgainst).to.equal(tokens(300000))
        expect(proposal.votesAbstain).to.equal(tokens(0))
      })

      it('updates votesAbstain count', async () => {
        transaction = await dao.connect(investor1).vote(1, VoteType.Abstain)
        result = await transaction.wait()

        const proposal = await dao.proposals(1)
        expect(proposal.votesFor).to.equal(tokens(0))
        expect(proposal.votesAgainst).to.equal(tokens(0))
        expect(proposal.votesAbstain).to.equal(tokens(300000))
      })

      it('emits vote event', async () => {
        transaction = await dao.connect(investor1).vote(1, VoteType.For)
        result = await transaction.wait()

        await expect(transaction).to.emit(dao, 'Vote')
          .withArgs(1, investor1.address, 0)
      })

    })

    describe('Failure', () => {

      it('rejects double voting with same vote type', async () => {
        transaction = await dao.connect(investor1).vote(1, VoteType.For)
        await transaction.wait()

        await expect(dao.connect(investor1).vote(1, VoteType.For)).to.be.reverted
      })

      it('rejects double voting with different vote type', async () => {
        transaction = await dao.connect(investor1).vote(1, VoteType.For)
        await transaction.wait()

        await expect(dao.connect(investor1).vote(1, VoteType.Abstain)).to.be.reverted
      })

      it('rejects non-investor', async () => {
        await expect(dao.connect(user).vote(1, VoteType.For)).to.be.reverted
      })

    })
  })

  describe('Governance', () => {
    let transaction, result

    beforeEach(async () => {

    })

    describe('Success & Pass', () => {

      beforeEach(async () => {
        // create a proposal
        transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
        result = await transaction.wait()

        // vote
        transaction = await dao.connect(investor5).vote(1, VoteType.Against)  // 100k Against
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1, VoteType.Abstain)  // 250k Abstain
        result = await transaction.wait()

        transaction = await dao.connect(investor3).vote(1, VoteType.For)      // 200k For
        result = await transaction.wait()

        // finalize proposal
        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()
      })

      it('transfers funds to the recipient', async () => {
        expect(await ethers.provider.getBalance(recipient.address)).to.equal(tokens(10100))
      })

      it('updates the proposal to passed', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.passed).to.equal(true)
      })

      it('updates the proposal to finalized', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.finalized).to.equal(true)
      })

      it('emits finalize event', async () => {
        await expect(transaction).to.emit(dao, 'Finalize')
          .withArgs(1, true)
      })

    })

    describe('Success & Fail', () => {

      beforeEach(async () => {
        // create a proposal; investor4 still has 10000 ETH so make them recipient
        transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), investor4.address)
        result = await transaction.wait()

        // vote
        transaction = await dao.connect(investor5).vote(1, VoteType.For)      // 100k For
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1, VoteType.Abstain)  // 250k Abstain
        result = await transaction.wait()

        transaction = await dao.connect(investor3).vote(1, VoteType.Against)  // 200k Against
        result = await transaction.wait()

        // finalize proposal
        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()
      })

      it('does not transfer funds to the recipient', async () => {
        expect(await ethers.provider.getBalance(investor4.address)).to.equal(tokens(10000))
      })

      it('updates the proposal to failed', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.passed).to.equal(false)
      })

      it('updates the proposal to finalized', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.finalized).to.equal(true)
      })

      it('emits finalize event', async () => {
        await expect(transaction).to.emit(dao, 'Finalize')
          .withArgs(1, false)
      })

    })

    describe('Failure', () => {

      beforeEach(async () => {
        // create a proposal
        transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
        result = await transaction.wait()

        // vote
        transaction = await dao.connect(investor5).vote(1, VoteType.For)      // 100k For
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1, VoteType.Against)  // 250k Against
        result = await transaction.wait()
      })

      it('rejects finalize if already finalized', async () => {
        transaction = await dao.connect(investor3).vote(1, VoteType.For)    // 200k For
        result = await transaction.wait()

        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()

        await expect(dao.connect(investor3).finalizeProposal(1)).to.be.reverted
      })

      it('rejects finalize if not enough votes', async () => {
        // only 2 investors have voted, not enough votes
        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
      })

      it('rejects non-investor', async () => {
        transaction = await dao.connect(investor3).vote(1, VoteType.For)    // 200k For
        result = await transaction.wait()

        await expect(dao.connect(user).finalizeProposal(1)).to.be.reverted
      })

    })
  })
})
