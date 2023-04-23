import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import { ethers } from 'ethers'

// components
import Progress from './Progress'

const Proposals = ({ provider, dao, proposals, quorum, maxVotes, setIsLoading }) => {

	const VoteType = {
	  For: 0,
	  Against: 1,
	  Abstain: 2
	}

	const voteHandler = async (id, _voteType) => {

		try {
			const signer = await provider.getSigner()
			console.log(`entering vote handler`)
			const signerAddress = await signer.getAddress()
			console.log(`signerAddress = ${signerAddress}`)
			const hasVoted = await dao.hasVoted(signerAddress)
			console.log(`hasVoted = ${hasVoted}`)
//			if (hasVoted) {
//				window.alert('You have already voted for that proposal.')
//			}
//			else if ( false ) {
//				window.alert('alert msg')
//			}
//			else{
				const transaction = await dao.connect(signer).vote(id, _voteType)
				await transaction.wait()
//			}
		} catch {
			// can we get back the error message from the contract, and give it here??
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
					<th>Proposal Name</th>
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
							<td>{proposal.recipient}</td>
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
