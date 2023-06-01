# Example DAO Project

This project demonstrates a basic DAO contract using a custom token, with a front end for voting on governance proposals.

## Project Components
The project consists of 2 smart contracts and a web front end.
- **Token.sol** is a token based on the ERC-20 standard.
- **DAO.sol** is the smart contract that manages the DAO proposals. It allows creating and finalizing proposals, and it tracks votes for/against or abstain. When a proposal is finalized, the proposed amount of funds are transferred from the DAO treasury to the proposal's recipient address.
- **DAO Frontend** is a React.js app which provides the user interface to the DAO.

## Technologies Used
- **react.js**  This project was built with v 18.2.0
- **node.js v16.X:**  This project was built with v 16.14.2.  Run `node -v` to see your version of node.
- **hardhat:**  This project is using v 2.10.2.  Run `npx hardhat --version` to see your version.
- **solidity:**  Built with v0.8.9; this is set in the *hardhat.config.js* file.

## Installation
1. In a terminal session:  Clone the repo onto your local machine, and cd to the main directory.
2. On the command line, Enter `npm install`
3. Enter `npx hardhat test` to compile the smart contracts and run their tests.

## Run Locally
1. In a terminal session:  Enter `npx hardhat node` to launch a blockchain node on your computer. (Note the output generated; you will use the addresses for Hardhat accounts #0 - #5 for this project.)

**NOTE: the deploy.js script is configured to attach to an *existing* Token address (the Crowdsale token address on my local Hardhat blockchain). To run this project "stand-alone" you will need to comment & uncomment the blocks noted in the deploy.js script, to force the creation of a new Token.**

2. In a 2nd terminal session:  Enter `npx hardhat run --network localhost ./scripts/deploy.js`

After the above, you should see output of the address for the deployed Token and DAO contracts. In the terminal window that is running the blockchain node, you should see that the deploy ran successfully.

Your blockchain is now running locally with the DAO contracts deployed!

**IMPORTANT NOTE:** Compare the 2 deployed contract addresses on the terminal screen, with the first 2 addresses in the **./src/config.json** file. The addresses in the file MUST match the addresses on the screen in this step. If they do not match, *correct the addresses in the config.json file now*.

3. Back in the 2nd terminal, you have 2 options:
- Enter `npx hardhat run --network localhost ./scripts/1_seed.js` to give tokens to Hardhat accounts 1 - 5, fund the DAO treasury, and seed some example proposals into the DAO with votes in progress.
- OR enter `npx hardhat run --network localhost ./scripts/2_seed.js` to give tokens to Hardhat accounts 1 - 5 and fund the DAO treasury. *No example proposals will be created.*

If everything is working you should not see any errors in the output of the seed script.

4. You should add the Hardhat network (chainId 31337) to your Metamask wallet, and import the Hardhat addresses for accounts 0 - 5, so you can vote with those accounts.

## Launch The Front End
In a 3rd terminal window:  Enter `npm run start`<br />
This will launch a browser window to display the DAO application front end. You must have Metamask (or a compatible wallet) installed in your browser, and within Metamask connect to the local Hardhat network (chainId 31337).
