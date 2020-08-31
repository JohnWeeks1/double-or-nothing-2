import React, { Component } from "react";
import Coin from "./contracts/Coin.json";
import getWeb3 from "./getWeb3";
import Nav from "./components/Nav";

import "./App.css";

class App extends Component {
	state = { 
		// once you have migrated the project put the owner address here.
		ownerAddress: 0x5a2f26a0cD0fDeAB9dc2e180843fA135f64b6fF3,
		storageValue: 0, 
		web3: null, 
		accounts: null, 
		contract: null,
		ownerBalance: 0,
		betResult: {
			bool: null,
			message: null
		},
		headsOrTails: null,
		logNewProvableQuery: {
			message: null,
			bool: null
		}
	};

	componentDidMount = async () => {
		try {
			const web3 = await getWeb3();
			const accounts = await web3.eth.getAccounts();
			const networkId = await web3.eth.net.getId();
			const coinInstance = new web3.eth.Contract(
				Coin.abi,
				Coin.networks[networkId] && Coin.networks[networkId].address,
			);

			this.setState({
				web3, 
				accounts, 
				contract: {
					coinInstance: coinInstance
				}
			});

			console.log(this.state.web3);

			this.getOwnerBalance();

		} catch (error) {
			alert(`Failed to load web3, accounts, or contract. Check console for details.`);
			console.error(error);
		}
	};

	componentWillUpdate = async () => {
		if (this.state.contract != null) {
			this.getOwnerBalance();
		}
	}

	getOwnerBalance = async () => {
		let ownerBalance = await this.state.contract.coinInstance.methods.ownerBalance().call();
		this.setState({
			ownerBalance: this.state.web3.utils.fromWei(ownerBalance, 'ether')
		});
	}

	setOwnerBalance = async () => {
		await this.state.contract.coinInstance.methods
			.setOwnerBalance().send({
				from: this.state.accounts[0], 
				value: 100000000000000000
			});

		this.updateOwnerBalance();
	}

	updateOwnerBalance = async () => {
		let ownerBalance = await this.state.contract.coinInstance.methods.ownerBalance().call();

		this.setState({
			ownerBalance: ownerBalance
		});
	}

	headsOrTails = (event) => {
		this.setState({headsOrTails: event.target.value});
	}

	alerts = () => {
		switch (this.state.betResult.bool) {
			case true:
				return <div className="success">{this.state.betResult.message}</div>;
			case false:
				return <div className="danger">{this.state.betResult.message}</div>;
			default:
				return null;
		}
	}

	headsOrTailsSelection = () => {
		switch (this.state.headsOrTails) {
			case "1":
				return <p>You picked <b>Heads</b></p>;
			case "2":
				return <p>You picked <b>Tails</b></p>;
			default:
				return null;
		}
	}

	flipCoin = async (event) => {
		this.loadingScreen();

		let result = await this.state.contract.coinInstance.methods
			.startBet(parseInt(this.state.headsOrTails))
			.send({
				from: this.state.accounts[0],
				value: event.target.value,
			});

			console.log(result.events);

			this.setState({
				logNewProvableQuery: {
					message: result.events.logNewProvableQuery.returnValues[0],
					bool: result.events.logNewProvableQuery.returnValues[1]
				}
			});

			// this.setState({
			// 	betResult: {
			// 		bool: result.events.betResult.returnValues[0],
			// 		message: result.events.betResult.returnValues[1]
			// 	}
			// });
	}

	loadingScreen = () => {
		if (this.state.logNewProvableQuery.bool == true) {
			return  <div className="loader"></div>
		}
	}

	priceButtons = () => {
		if (this.state.headsOrTails != null) {
			return  <div>
				        <p>Pick the amount you want to bet</p>
						<button className="button" onClick={this.flipCoin} value="100000000000000000" name="0.1eth">0.1 Eth</button>
						<button className="button" onClick={this.flipCoin} value="250000000000000000" name="0.25eth">0.25 Eth</button>
						<button className="button" onClick={this.flipCoin} value="500000000000000000" name="0.5eth">0.5 Eth</button>
						<button className="button" onClick={this.flipCoin} value="1000000000000000000" name="1eth">1 Eth</button> 
					</div>
		}
	}

	betAmountHandler = (event) => {
		this.setState({betAmount: event.target.value});
	}

	render() {
		if (!this.state.web3) {
			return <div>Loading Web3, accounts, and contract...</div>;
		}
		return (
			<div className="App">
				{this.state.betResult.bool == null 
					? this.loadingScreen() 
					: ''
				}
				<Nav/>
				{this.state.betAmount}
				<div className="center">
					<h2>Ethereum</h2>

					<img width="100px" src={ require('./eth-image.png') } />
					<p onChange={this.getOwnerBalance}>{this.state.ownerBalance} ETH AVAILABLE</p>

		            {this.alerts()}
					{this.headsOrTailsSelection()}

					<button className="button" onClick={this.headsOrTails} value="1" name="heads">Heads</button>
					<button className="button" onClick={this.headsOrTails} value="2" name="tails">Tails</button>

					<br /> <br />

					{this.priceButtons()}

					<br />
					<br />

					{ this.state.ownerAddress == this.state.accounts[0] ? 
						<button onClick={this.setOwnerBalance}>Add 30 ether to owner balance</button> : 
						''
					}
				</div>
			</div>
		);
	}
}

export default App;
