import { useState } from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { ethers } from 'ethers'

const Create = ({ provider, dao, token, setIsLoading }) => {

	const [name, setName] = useState('')
	const [amount, setAmount] = useState(0)
	const [address, setAddress] = useState('')
	const [isWaiting, setIsWaiting] = useState(false)

	const createHandler = async (e) => {
		e.preventDefault()
		setIsWaiting(true)

		try {
			const signer = await provider.getSigner()
			const signerAddress = await signer.getAddress()

			// ensure the connected account is an investor in the project
			const balance = await token.balanceOf(signerAddress)

			if (balance <= 0) {
				const symbol = await token.symbol();
				window.alert(`You must own ${symbol} tokens to create a proposal.`)
			}
			else {
			    const formattedAmount = ethers.utils.parseUnits(amount.toString(), 'ether')
			    const transaction =
						await dao.connect(signer).createProposal(name, formattedAmount, address)
			    await transaction.wait()
			}
		} catch {
			window.alert('User rejected or transaction reverted')
		}

		setIsLoading(true)
	}

	return (
		<Form onSubmit={createHandler}>
			<Form.Group style={{ maxWidth: '450px', margin: '50px auto' }}>
				<Form.Control
					type='text'
					placeholder='Enter name'
					className='my-2'
					onChange={(e) => setName(e.target.value)}
				/>
				<Form.Control
					type='number'
					step='0.01'
					min='0'
					max='1'
					placeholder='Enter amount between 0 and 1'
					className='my-2'
					onChange={(e) => setAmount(e.target.value)}
				/>
				<Form.Control
					type='text'
					placeholder='Enter address'
					className='my-2'
					onChange={(e) => setAddress(e.target.value)}
				/>
				{isWaiting ? (
					<Spinner
						animation='border'
						style={{ display: 'block', margin: '0 auto' }} />
				) : (

					<Button
						variant='primary'
						type='submit'
						style={{ width: '100%' }}>
						Create Proposal
					</Button>
				)}

			</Form.Group>

		</Form>

	)
}

export default Create
