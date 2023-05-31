import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation'
import Create from './Create'
import Proposals from './Proposals'
import Loading from './Loading'

// ABIs: Import your contract ABIs here
import DAO_ABI from '../abis/DAO.json'
import TOKEN_ABI from '../abis/Token.json'

// Config: Import your network config here
import config from '../config.json';
const LOGO_COLOR = '#0f2a87'

function App() {
  const [provider, setProvider] = useState(null)
  const [token, setToken] = useState(null)
  const [tokenName, setTokenName] = useState(null)
  const [tokenSymbol, setTokenSymbol] = useState(null)
  const [tokenAddress, setTokenAddress] = useState(null)
  const [dao, setDao] = useState(null)
  const [daoAddress, setDaoAddress] = useState(null)
  const [treasuryBalance, setTreasuryBalance] = useState(0)

  const [account, setAccount] = useState(null)
  const [proposals, setProposals] = useState(null)
  const [quorum, setQuorum] = useState(null)
  const [maxVotes, setMaxVotes] = useState(0)

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    const { chainId } = await provider.getNetwork()

    // initiate contracts
    const dao = new ethers.Contract(config[chainId].dao.address, DAO_ABI, provider)
    setDao(dao)
    const daoAddress = dao.address
    setDaoAddress(daoAddress)
    const token = new ethers.Contract(config[chainId].token.address, TOKEN_ABI, provider)
    setToken(token)
    const tokenAddress = token.address
    setTokenAddress(tokenAddress)
    const tokenName = await token.name()
    setTokenName(tokenName)
    const tokenSymbol = await token.symbol()
    setTokenSymbol(tokenSymbol)

    let treasuryBalance = await provider.getBalance(dao.address)
    treasuryBalance = ethers.utils.formatUnits(treasuryBalance, 18)
    setTreasuryBalance(treasuryBalance)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    // fetch proposals
    const count = await dao.proposalCount()
    const items = []

    for (var i = 0; i < count; i++) {
      const proposal = await dao.proposals(i+1)
      items.push(proposal)
    }
    setProposals(items)

    // fetch quorum
    setQuorum(await dao.quorum())

    // fetch maxVotes
    setMaxVotes(await dao.maxVotes())

    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);

  return(
    <Container>
      <Navigation />

      <h1 className='my-4 text-center' style={{ color: LOGO_COLOR }}>Welcome to our DAO!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <p className='text-center'>
            You must own <strong style={{ color: LOGO_COLOR }}>{tokenName} </strong> 
            to participate in the DAO. <i>Get some here:</i>
            <a href='https://divine-mouse-6272.on.fleek.co/' target='_blank' rel='noreferrer'>
              SW3 Token ICO</a>
          </p>
          <p className='text-center'>
            <strong className='mx-2'>DAO Contract Address on Sepolia:</strong> {daoAddress}
          </p>

          <hr />

          <h5 className='text-center' style={{ color: LOGO_COLOR }}>
            THIS DAO IS FOR EDUCATIONAL PURPOSES ONLY.
          </h5>
          <p className='text-center' style={{ width: '80%', marginLeft: '10%', marginRight: '-10%' }}>
            Once you have {tokenSymbol} tokens in your wallet, you can vote and create 
            new proposals. Each token you hold counts as 1 vote. It takes > 50% of the total supply 
            (500,000 tokens) to reach a quorum. <strong>Abstain</strong> votes count toward the quorum only.
          </p>
          <p className='text-center' style={{ width: '80%', marginLeft: '10%', marginRight: '-10%' }}>
            When creating proposals, the "amount" and "address" are the amount of sepoliaETH that will 
            be paid from the DAO Treasury, to the specified wallet address, once the proposal 
            is Finalized. A proposal can only be finalized if it passes.<br />
          </p>

          <Create
            provider={provider}
            dao={dao}
            token={token}
            setIsLoading={setIsLoading}
          />

          <hr />

          <p className='text-center'>
            <strong>Treasury Balance:</strong> {treasuryBalance} ETH</p>

          <hr />

          <Proposals 
            provider={provider}
            dao={dao}
            token={token}
            proposals={proposals}
            quorum={quorum}
            maxVotes={maxVotes}
            setIsLoading={setIsLoading}
          />
        </>
      )}
    </Container>
  )
}

export default App;
