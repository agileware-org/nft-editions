require("chai").use(require('chai-as-promised'));
const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import { promises as fs } from 'fs'

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
	let signer: SignerWithAddress;

	beforeEach(async () => {
		[artist, shareholder, curator, receiver, purchaser, minter, signer] = await ethers.getSigners(); // recupero un wallet con cui eseguire il test
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
				contentHash: "0x5f9fd2ab1432ad0f45e1ee8f789a37ea6186cc408763bb9bd93055a7c7c2b2ca",
				size: 1000,
				royalties: 250,
				shares: [{ holder:curator.address, bps:100 }],
			}
			// when
			const editions = await hofa.create(info);
			await editions.setPrice(1);
			editions.connect(artist);
			// then
			expect(await editions.connect(artist).name()).to.be.equal("Emanuele");
			expect(await editions.connect(artist).contentHash()).to.be.equal("0x5f9fd2ab1432ad0f45e1ee8f789a37ea6186cc408763bb9bd93055a7c7c2b2ca");
		})
		it("should set and retrive price of a MeNFT", async () => {
			const editions = await hofa.get(0);
			editions.connect(artist);
			const test = await hofa.fetchPrice(0);
			await expect(test).to.equal(1);
			//console.log(test);
			/*
			await expect(await hofa.fetchPrice(0))
				.to.emit(editions, "")
				// .withArgs(ethers.constants.AddressZero, purchaser.address, 1);

			await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("1.0"));
			*/
		})
		it("should verify if signer can mint a MeNFT", async () => {
			const editions = await hofa.get(0);
			editions.connect(artist);
			let test = await hofa.isMintAllow(0, signer.address);
			// console.log(test);
			await editions.setApprovedMinters([{minter: signer.address, amount: 50}]);
			test = await hofa.isMintAllow(0, signer.address);
			// console.log(test);
			await expect(test).to.equal(true);
			/*
			await expect(await hofa.fetchPrice(0))
				.to.emit(editions, "")
				// .withArgs(ethers.constants.AddressZero, purchaser.address, 1);

			await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("1.0"));
			*/
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

			editions.connect(artist);
			let recipients = new Array<string>(10);
			for (let i = 0; i < recipients.length; i++) {
				recipients[i] = receiver.address;
			}
			await expect(await hofa.mintAndTransfer(0, recipients))
				.to.emit(editions, "Transfer")
				// .withArgs(ethers.constants.AddressZero, receiver.address, 1);

			const receiverBalance = await editions.balanceOf(receiver.address);
			const artistBalance = await editions.balanceOf(artist.address);
			const TotalBalance = receiverBalance.toNumber() + artistBalance.toNumber();
			const eSupply = await editions.totalSupply();
			// console.log(await editions.address);
			await expect(await editions.totalSupply()).to.equal(TotalBalance);
		});
		it("should purchase a MeNFT", async () => {
			const editions = await hofa.get(0);
                        editions.connect(purchaser);
			editions.setPrice(ethers.utils.parseEther("1.0"));
			await expect(await hofa.purchase(0, "1.0"))
				.to.emit(editions, "Transfer")
				// .withArgs(ethers.constants.AddressZero, purchaser.address, 1);

			// console.log(await editions.address);
			await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("1.0"));
		})
		it('it properly hashes from buffer', async () => {
			const Hash = '0x8794e371f6e14027a4cd5434f2cf93cab35524d26f77a1abea3325821c6dfeff'
			const buf = await fs.readFile('./test.mp4')
			const hash = await hofa.sha256FromBuf(buf)
			expect(hash).to.equal(Hash)
		})
		
	})
});
