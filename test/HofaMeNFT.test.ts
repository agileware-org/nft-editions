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
	let receiver: SignerWithAddress;
	let purchaser: SignerWithAddress;
	let minter: SignerWithAddress;

	beforeEach(async () => {
		[artist, shareholder, curator, receiver, purchaser, minter] = await ethers.getSigners(); // recupero un wallet con cui eseguire il test
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
			// await editions.setApprovedMinters([{minter: minter.address, amount: 50}]);
			await editions.setPrice(1);
			console.log(minter.address);
			// console.log(editions);
			editions.connect(artist);
			// then
			expect(await editions.connect(artist).name()).to.be.equal("Emanuele");
			expect(await editions.connect(artist).contentHash()).to.be.equal("0x5f9fd2ab1432ad0f45e1ee8f789a37ea6186cc408763bb9bd93055a7c7c2b2ca");
		})
		it("Artist can mint for self", async function () {
			const editionsNum = await hofa.instances();
			const editions = await hofa.get(0);
			editions.connect(artist);
			await expect(await hofa.mint(0))
				.to.emit(editions, "Transfer")
				.withArgs(ethers.constants.AddressZero, artist.address, 1);

			const artistBalance = await editions.balanceOf(artist.address);
			await expect(await editions.totalSupply()).to.equal(artistBalance);
		})
		it("Artist can mint Multi MeNFT", async function () {
			const editions = await hofa.get(0);
			editions.connect(artist);
			await expect(await hofa.mintMultiple(0, artist.address, 3))
				.to.emit(editions, "Transfer")
				// .withArgs(ethers.constants.AddressZero, artist.address, 1);

			const receiverBalance = await editions.balanceOf(artist.address);
			await expect(await editions.totalSupply()).to.equal(receiverBalance);
		});
		it("Artist can mint for others", async function () {
			const editions = await hofa.get(0);
			await editions.setApprovedMinters([{minter: receiver.address, amount: 50}, {minter: minter.address, amount: 50}]);
			editions.connect(artist);
			let recipients = new Array<string>(10);
			for (let i = 0; i < recipients.length; i++) {
				recipients[i] = receiver.address;
			}
			await expect(await hofa.mintAndTransfer(0, recipients))
				.to.emit(editions, "Transfer")
				// .withArgs(ethers.constants.AddressZero, receiver.address, 1);

			const receiverBalance = await editions.balanceOf(receiver.address);
			// await expect(await editions.totalSupply()).to.equal(receiverBalance);
		});
		it("should purchase a MeNFT", async () => {
			const editions = await hofa.get(0);
                        editions.connect(purchaser);
			editions.setPrice(ethers.utils.parseEther("1.0"));
			await expect(await hofa.purchase(0, "1.0"))
				.to.emit(editions, "Transfer")
				// .withArgs(ethers.constants.AddressZero, purchaser.address, 1);

			const purchaserBalance = await editions.balanceOf(purchaser.address);
			// await expect(await editions.totalSupply()).to.equal(purchaserBalance);
		})
	})
});
