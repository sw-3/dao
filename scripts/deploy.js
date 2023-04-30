// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const NAME = 'ScottW3 Token'
  const SYMBOL = 'SW3'
  const MAX_SUPPLY = '1000000'

  const Token = await hre.ethers.getContractFactory('Token')
  
  // comment out this block, if deploying the new token above for the dao
  // Fill in the deployed token address, to attach to existing token
  const tokenAddr = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  let token = Token.attach(tokenAddr)
  console.log(`Attached to Token deployed at: ${token.address}\n`)

  // comment out this block, if attaching the contract to an existing token
  // deploy token
  // let token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY)
  // await token.deployed()
  // console.log(`Token deployed to: ${token.address}\n`)

  // deploy DAO
  const DAO = await hre.ethers.getContractFactory('DAO')
  const dao = await DAO.deploy(token.address, '500000000000000000000001')
  await dao.deployed()
  console.log(`DAO deployed to: ${dao.address}\n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
