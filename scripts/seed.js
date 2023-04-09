// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const config = require('../src/config.json')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

async function main() {

  const VoteType = {
    For: 0,
    Against: 1,
    Abstain: 2
  }

  console.log(`Fetching accounts & network...\n`)

  const accounts = await ethers.getSigners()
  const deployer = accounts[0]
  const funder = accounts[1]
  const investor1 = accounts[1] // investor1 is also funder
  const investor2 = accounts[2]
  const investor3 = accounts[3]
  const investor4 = accounts[4]
  const investor5 = accounts[5] // investor5 is also recipient
  const recipient = accounts[5]
  const user = accounts[6]

  let transaction

  // Fetch network
  const { chainId } = await ethers.provider.getNetwork()

  console.log(`Fetching token and transferring to accounts...\n`)

  // Fetch deployed token
  const token = await ethers.getContractAt('Token', config[chainId].token.address)
  console.log(`Token fetched: ${token.address}\n`)

  // Send tokens to investors - each one gets 20%
  transaction = await token.transfer(investor1.address, tokens(300000))
  await transaction.wait()

  transaction = await token.transfer(investor2.address, tokens(250000))
  await transaction.wait()

  transaction = await token.transfer(investor3.address, tokens(200000))
  await transaction.wait()

  transaction = await token.transfer(investor4.address, tokens(150000))
  await transaction.wait()

  transaction = await token.transfer(investor5.address, tokens(100000))
  await transaction.wait()

  console.log(`Fetching dao...\n`)

  // Fetch deployed dao
  const dao = await ethers.getContractAt('DAO', config[chainId].dao.address)
  console.log(`DAO fetched: ${dao.address}\n`)

  // Funder sends Ether to DAO treasury
  transaction = await funder.sendTransaction({ to: dao.address, value: ether(1000) }) // 1,000 Ether
  await transaction.wait()
  console.log(`Sent funds to dao treasury...\n`)

  for (var i = 0; i < 3; i++) {
      // Create Proposal
      transaction = await dao.connect(investor1).createProposal(`Proposal ${i + 1}`, ether(100), recipient.address)
      await transaction.wait()

      if (i < 2) {
        // Vote 1
        transaction = await dao.connect(investor1).vote(i + 1, VoteType.For)
        await transaction.wait()

        // Vote 2
        transaction = await dao.connect(investor2).vote(i + 1, VoteType.For)
        await transaction.wait()

        // Vote 3
        transaction = await dao.connect(investor3).vote(i + 1, VoteType.For)
        await transaction.wait()

        // Finalize
        transaction = await dao.connect(investor1).finalizeProposal(i + 1)
        await transaction.wait()

        console.log(`Created & Finalized Proposal ${i + 1}\n`)
      }
      else {
        // Vote 1
        transaction = await dao.connect(investor1).vote(i + 1, VoteType.Against)
        await transaction.wait()

        // Vote 2
        transaction = await dao.connect(investor2).vote(i + 1, VoteType.For)
        await transaction.wait()

        // Vote 3
        transaction = await dao.connect(investor3).vote(i + 1, VoteType.Abstain)
        await transaction.wait()

        // Finalize
        transaction = await dao.connect(investor1).finalizeProposal(i + 1)
        await transaction.wait()

        console.log(`Created & Finalized Proposal ${i + 1}\n`)
      }
  }

    console.log(`Creating one more proposal...\n`)

    // Create one more proposal
    transaction = await dao.connect(investor1).createProposal(`Proposal 4`, ether(100), recipient.address)
    await transaction.wait()

    // Vote 1
    transaction = await dao.connect(investor2).vote(4, VoteType.For)
    await transaction.wait()

    // Vote 2
    transaction = await dao.connect(investor3).vote(4, VoteType.Against)
    await transaction.wait()

    console.log(`Finished.\n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
