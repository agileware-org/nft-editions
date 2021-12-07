require("chai").use(require('chai-as-promised'));
const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { hofaEditions } from "../src/hofaEditions1"
import { MintableEditions, MintableEditionsFactory } from "../typechain"


describe('Hofaclass', () => {
	describe("#constructor", () => {
		let test: string
	})

	describe("create function", () => {
		let test = new hofaEditions()

		it("should create a mintableEditions", async function() {
			test.create("Roberto Lo Giacco", "", "", "https://ipfs.io/ipfs/bafybeib52yyp5jm2vwifd65mv3fdmno6dazwzyotdklpyq2sv6g2ajlgxu", "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc", "https://i.imgur.com/FjT55Ou.jpg", 1000, 250, [])
			// const editions = (await ethers.getContractAt("MintableEditions", await test.get(0))) as MintableEditions;
			// expect(await editions.contentHash()).to.be.equal("0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc");
			
		})
	})

});
