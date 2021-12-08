require("chai").use(require('chai-as-promised'));
const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { HofaMeNFT, MeNFTInfo } from "../src/HofaMeNFT"
import { MintableEditions } from "../typechain"


describe.only('On HofaMeNFT', () => {
	let hofa: HofaMeNFT;
	let artist: SignerWithAddress;
	let curator: SignerWithAddress;
	let shareholder: SignerWithAddress;

	beforeEach(async () => {
		[artist, shareholder, curator] = await ethers.getSigners(); // recupero un wallet con cui eseguire il test
		hofa = new HofaMeNFT(artist, (await deployments.get("MintableEditionsFactory")).address); // recupero l'indirizzo della factory deployata da --deploy-fixture
	})

	describe("#constructor", () => {
		let test: string
	})

	describe("the create function", () => {
		it("should create a MeNFT", async function() {
			// given
			const info:MeNFTInfo = {
				name: "Emanuele",
				symbol: "LELE",
				description: "My very first MeNFT",
				contentUrl:"https://ipfs.io/ipfs/bafybeib52yyp5jm2vwifd65mv3fdmno6dazwzyotdklpyq2sv6g2ajlgxu",
				size: 1000,
				royalties: 250,
				shares: [{ holder:curator.address, bps:100 }],
			}
			// when
			const editions = await hofa.create(info);
			editions.connect(artist);
			// then
			expect(await editions.connect(artist).name()).to.be.equal("Emanuele");
			expect(await editions.connect(artist).contentHash()).to.be.equal("0xABCDEF9876543210");
		})
	})
});
