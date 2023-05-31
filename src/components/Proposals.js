import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import { ethers } from 'ethers'

// components
import Progress from './Progress'

const Proposals = ({
	provider,
	dao,
	token,
	proposals,
	quorum,
	maxVotes,
	setIsLoading }) => {

	const VoteType = {
	  For: 0,
	  Against: 1,
	  Abstain: 2
	}

	const voteHandler = async (id, _voteType) => {

		try {
			const signer = await provider.getSigner()
			const signerAddress = await signer.getAddress()

			// ensure the connected account is an investor in the project
			const balance = await token.balanceOf(signerAddress)

			if (balance <= 0) {
				const symbol = await token.symbol();
				window.alert(`You must own ${symbol} tokens to vote.`)
			}
			// ensure voter has not already voted
			else if (await dao.hasVotedOnProposal(signerAddress, id)) {
				window.alert('You have already voted for that proposal.')
			}
			else {
				const transaction = await dao.connect(signer).vote(id, _voteType)
				await transaction.wait()
			}
		} catch {
			window.alert('User rejected or transaction reverted')
		}

		setIsLoading(true)
	}

	const finalizeHandler = async (id) => {

		try {
			const signer = await provider.getSigner()
			const transaction = await dao.connect(signer).finalizeProposal(id)
			await transaction.wait()
		} catch {
			window.alert('User rejected or transaction reverted')
		}

		setIsLoading(true)
	}

	return (
		<Table striped bordered hover responsive>
			<thead>
				<tr>
					<th>#</th>
					<th style={{ width: '250px' }}>Proposal Name</th>
					<th>Recipient Address</th>
					<th>Amount</th>
					<th>Status</th>
					<th>Total Votes</th>
					<th>Cast Vote</th>
					<th>Finalize</th>
				</tr>
			</thead>
			<tbody>
				{proposals.map((proposal, index) => (
					<>
						<tr key={(index * 2) - 1}>
							<td>{proposal.id.toString()}</td>
							<td>{proposal.name}</td>
							<td>{proposal.recipient.slice(0,5) + '...' + proposal.recipient.slice(38, 42)}</td>
							<td>{ethers.utils.formatUnits(proposal.amount, 'ether')} ETH</td>
							<td>{!proposal.finalized ? 'In Progress'
								: proposal.votesFor.gt(proposal.votesAgainst) ? 'Passed'
								: 'Failed'
							}</td>
							<td>{ethers.utils.formatUnits(
										proposal.votesFor.add(proposal.votesAgainst).add(proposal.votesAbstain),
										18)}
							</td>
							<td>
								{!proposal.finalized && (
									<Button
										variant="success"
										style={{ width: '30%' }}
										onClick={() => voteHandler(proposal.id, VoteType.For)}
									>
										For
									</Button>
								)}
								{!proposal.finalized && (
									<Button className='mx-2'
										variant="danger"
										style={{ width: '30%' }}
										onClick={() => voteHandler(proposal.id, VoteType.Against)}
									>
										Against
									</Button>
								)}
								{!proposal.finalized && (
									<Button
										variant="info"
										style={{ width: '30%' }}
										onClick={() => voteHandler(proposal.id, VoteType.Abstain)}
									>
										Abstain
									</Button>
								)}
							</td>
							<td>
								{!proposal.finalized &&
									proposal.votesFor.add(proposal.votesAgainst).add(proposal.votesAbstain).gt(quorum)
									&& (
										<Button
											variant="primary"
											style={{ width: '100%' }}
											onClick={() => finalizeHandler(proposal.id)}
										>
											Finalize
										</Button>
									)
								}
							</td>
						</tr>

						<tr key={index * 2}>
							<td> </td>
							<td colSpan={7}>
			          <Progress
			            maxVotes={maxVotes}
			            forVotes={proposal.votesFor}
			            againstVotes={proposal.votesAgainst}
			            abstainVotes={proposal.votesAbstain}
			          />
			          <p> </p>
		          </td>
						</tr>
					</>
				))}

			</tbody>
		</Table>
	);
}

export default Proposals
