const { expect } = require("chai");
const { ethers } = require("hardhat");
 
import "@nomiclabs/hardhat-ethers";


import {
	MintableEditionsFactory,
	MintableEditions,
	EditionMetadata
} from "../typechain";


export class hofaEditions {

	public Factory!: MintableEditionsFactory

	constructor (
		name?: string,
		simbol?: string,
		description?: string,
		contentUrl?: string,
		contentHash?: number,
		thumbnailUrl?: string,
		size?: number,
		royalities?: number,
		shares?: Array<[address]>,
		creatorAddr?: string,
		factoryAddr?: string
	) {
		if (!factoryAddr != "0x0") {
			//load Factory contract
			this.Factory = await ethers.getContractAt("MintableEditionsFactory", factoryAddr) as MintableEditionsFactory;
		} else {
			// Create a new Edition Factory
			this.Factory = MintableEditionsFactory.create(name, simbol, description, contentUrl, contentHash, thumbnailUrl, size, royalities, shares);
		}
	}
	// create functions
	// create a MintableEdition
	// @param address // The creator address for Edition create (I suppose)

	// purchase on Editions
	// @param editionsId
	public async purchase(editionId:number ): Promise<number> {
		try {
			if ( this.Factory != "0x0" ) {
				const editionsAddress = await this.Factory.get(editionId);
				const editions = await ethers.getContractAt("MintableEditions", editionsAddress);
				const price = await editions.price();
				expect(price).to.not.be.equal("0x0");
				return editions.purchase();
			} else {
				return Null;
			}
		} catch {
			return Promise.reject(err.message);
		}

	}

	// mint on Editions
	// @param editionsId
	public async mint(editionId:number):Promise<number>{
		try {
			const editionsAddress= await this.Factory.get(editionId);
			const editions = await ethers.getContractAt("MintableEditions", editionsAddress);
		} catch {
			return Promise.reject(err.message);
		}
		return editions.mint();
	}


	// mint multiple on Editions
	// @param editionsId
	public async mintMultiple(editionId:number,count:number):Promise<number>{
		const count = count;
		try {
			const editionsAddress= await this.Factory.get(editionId);
			const editionsMultiple= await ethers.getContractAt("MintableEditions", editionsAddress);
		} catch {
			return Promise.reject(err.message);
		}
		return editionsMultiple.mintAndTransfer(pippo);
	}


	// mint and transfer from Editions
	// @param editionsId
	public async mintAndTransfer(editionId:number, recipients:Array<['address']>, count:number=1):Promise<number>{
		let factory = this.fetchFactory();
		try {
			const editionsAddress= await this.Factory.get(editionId);
			const editionsMultiple= await ethers.getContractAt("MintableEditions", editionsAddress);
		} catch {
			return Promise.reject(err.message);
		}
		return editionsMultiple.mintAndTransfer(recipients);
	}
}
