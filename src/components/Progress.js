import ProgressBar from 'react-bootstrap/ProgressBar'

const Progress = ({ maxVotes, forVotes, againstVotes, abstainVotes }) => {
	return (
		<div>
			<ProgressBar>
				<ProgressBar variant='success' now={((forVotes / maxVotes) * 100)} label={`${(forVotes / maxVotes) * 100}%`} key={1} />
				<ProgressBar variant='danger' now={((againstVotes / maxVotes) * 100)} label={`${(againstVotes / maxVotes) * 100}%`} key={2} />
				<ProgressBar variant='info' now={((abstainVotes / maxVotes) * 100)} label={`${(abstainVotes / maxVotes) * 100}%`} key={3} />
			</ProgressBar>
		</div>
	)
}

export default Progress
