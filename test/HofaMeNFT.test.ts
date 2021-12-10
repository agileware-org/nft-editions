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
			await editions.connect(artist).setPrice(1);

			// then
			expect(await editions.name()).to.be.equal("Emanuele");
			expect(await editions.contentHash()).to.be.equal("0x5f9fd2ab1432ad0f45e1ee8f789a37ea6186cc408763bb9bd93055a7c7c2b2ca");
		})

		it("anyone can retrive price of a MeNFT", async () => {
			let anyone = new HofaMeNFT(purchaser, (await deployments.get("MintableEditionsFactory")).address);

			await expect(await anyone.fetchPrice(0)).to.be.equal(1);
		})
		it("Artist can mint for self", async function () {
			const editions = await hofa.get(0);
			await expect(await hofa.mint(0)).to.be.equal(await editions.totalSupply()); // returns minted token id
			await expect(await editions.balanceOf(artist.address)).to.be.equal(1); // token is transferred
			await expect(await editions.ownerOf(await editions.totalSupply())).to.be.equal(artist.address); // token ownership has been updated
		})

		it("Artist can mint multiple MeNFTs", async function () {
			const editions = await hofa.get(0);
			await expect(await hofa.mintMultiple(0, curator.address, 3)).to.be.equal(await editions.totalSupply()); // returns last minted token id
			await expect(await editions.balanceOf(curator.address)).to.be.equal(3); // tokens are transferred
			await expect(await editions.ownerOf(await editions.totalSupply())).to.be.equal(curator.address); // token ownership has been updated
		});

		it("Artist can mint for others", async function () {
			const editions = await hofa.get(0);

			let recipients = new Array<string>(10);
			for (let i = 0; i < recipients.length; i++) {
				recipients[i] = receiver.address;
			}
			await expect(await hofa.mintAndTransfer(0, recipients)).to.be.equal(await editions.totalSupply()); // returns last minted token id
			await expect(await editions.balanceOf(receiver.address)).to.be.equal(10); // tokens are transferred
			await expect(await editions.ownerOf(await editions.totalSupply())).to.be.equal(receiver.address); // token ownership has been updated
		});
		it("Anyone can't mint if not authorized - This should be fails", async function () {
			const buyer = new HofaMeNFT(purchaser, (await deployments.get("MintableEditionsFactory")).address); // create a façade for the buyer
			await expect(await buyer.mint(0)).to.be.revertedWith("ProviderError: Error: VM Exception while processing transaction: reverted with reason string 'Minting not allowed'")
		})
		it("Anyone can mint if authorized", async function () {
			const editions = await hofa.get(0)
			await editions.setApprovedMinters([{minter: purchaser.address, amount: 50}]);

			const buyer = new HofaMeNFT(purchaser, (await deployments.get("MintableEditionsFactory")).address); // create a façade for the buyer
			await expect(await buyer.mint(0)).to.be.equal(await editions.totalSupply());
			await expect(await editions.balanceOf(purchaser.address)).to.be.equal(1); // token is transferred
			await expect(await editions.ownerOf(await editions.totalSupply())).to.be.equal(purchaser.address); // token ownership has been updated
		})
		it("Anyone should be able to purchase a MeNFT", async () => {
			const editions = await hofa.get(0);
			editions.connect(artist).setPrice(ethers.utils.parseEther("1.0")); // enables purchasing
			
			const buyer = new HofaMeNFT(purchaser, (await deployments.get("MintableEditionsFactory")).address); // create a façade for the buyer
			const balance = await purchaser.getBalance(); // store balance before pourchase

			await expect(await buyer.purchase(0))
				.to.be.equal(await editions.totalSupply()); // acquire a token in exchange of money

			await expect(await editions.provider.getBalance(editions.address)).to.be.equal(ethers.utils.parseEther("1.0")); // money has been transferred
			await expect((await purchaser.getBalance()).sub(balance))
			  .to.be.within(ethers.utils.parseEther("-1.001"), ethers.utils.parseEther("-1.0")); // money has been subtracted from purchaser (includes gas)
			await expect(await editions.ownerOf(await editions.totalSupply())).to.be.equal(purchaser.address); // token has been transferred
		})
		it("Anyone should not be able to purchase a MeNFT if not has enough money - This should be fails", async () => {
			const editions = await hofa.get(0);
			editions.connect(artist).setPrice(ethers.utils.parseEther("100000000000000000000.0")); // enables purchasing

			const buyer = new HofaMeNFT(purchaser, (await deployments.get("MintableEditionsFactory")).address); // create a façade for the buyer
			const balance = await purchaser.getBalance(); // store balance before pourchase

			await expect(await buyer.purchase(0)).to.be.equal(await editions.totalSupply()); // acquire a token in exchange of money

		})
		it("should verify if signer can mint a MeNFT", async () => {
			const editions = await hofa.get(0);

			await expect(await hofa.isAllowedMinter(0, signer.address)).to.be.false;
			await editions.setApprovedMinters([{minter: signer.address, amount: 50}]); // amount greater than zero allows address
			await expect(await hofa.isAllowedMinter(0, signer.address)).to.be.true;

			await expect(await hofa.isAllowedMinter(0, curator.address)).to.be.false;
			await editions.setApprovedMinters([{minter: ethers.constants.AddressZero, amount: 1}]); // address zero allows anyone
			await expect(await hofa.isAllowedMinter(0, purchaser.address)).to.be.true;
			await expect(await hofa.isAllowedMinter(0, receiver.address)).to.be.true;
			await expect(await hofa.isAllowedMinter(0, curator.address)).to.be.true;
			await expect(await hofa.isAllowedMinter(0, shareholder.address)).to.be.true;
		})

		it('it properly hashes from buffer', async () => {
			const buf = await fs.readFile('./test.mp4');
			expect(await hofa.hash(buf)).to.equal('0x8794e371f6e14027a4cd5434f2cf93cab35524d26f77a1abea3325821c6dfeff');
		})
		
	})
});
