require("chai").use(require('chai-as-promised'));
const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { hofaEditions } from "../src/hofaEditions1"
import { MintableEditions } from "../typechain"


// se metto only, questo e' l'unica suite di test eseguita
describe.only('Hofaclass', () => {
	let hofa: hofaEditions;
	let artist: SignerWithAddress;

	// questo codice viene eseguito prima di ogni test
	beforeEach(async () => {
		[artist] = await ethers.getSigners(); // recupero un wallet con cui eseguire il test
		hofa = new hofaEditions(artist, (await deployments.get("MintableEditionsFactory")).address); // recupero l'indirizzo della factory deployata da --deploy-fixture
	})

	describe("#constructor", () => {
		let test: string
	})

	describe("create function", () => {
		it("should create a mintableEditions", async function() {
			// se faccio questo
			const editions = await hofa.create(
				"Roberto Lo Giacco", 
				"", 
				"", 
				"https://ipfs.io/ipfs/bafybeib52yyp5jm2vwifd65mv3fdmno6dazwzyotdklpyq2sv6g2ajlgxu", 
				"0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc", 
				"https://i.imgur.com/FjT55Ou.jpg", 
				1000, 
				250, 
				[]);
			editions.connect(artist);
			// allora deve succedere questo
			console.log("editions:" + editions.address);
			expect(await editions.connect(artist).name()).to.be.equal("Roberto Lo Giacco");
			expect(await editions.connect(artist).contentHash()).to.be.equal("0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc");
		})
	})

});
