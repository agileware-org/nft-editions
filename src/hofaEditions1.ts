const { expect } = require("chai");
const { ethers } = require("hardhat");
 
import "@nomiclabs/hardhat-ethers";
import { Wallet } from '@ethersproject/wallet'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


import {
	MintableEditionsFactory,
	MintableEditions,
	EditionMetadata,
	
} from "../typechain";


export class hofaEditions {

	public MintableEdition!: MintableEditions
	public Factory!: MintableEditionsFactory
	public shareholder!: SignerWithAddress;

	constructor (
		factoryAddr?: string
	) {
		if (!factoryAddr) {
			//load Factory contract
			this.Factory = ethers.getContractAt("MintableEditionsFactory", factoryAddr) as MintableEditionsFactory;
			this.MintableEdition = ethers.getContractAt("MintableEditions", this.Factory);
		} else {
			this.Factory = ethers.getContractAt("MintableEditionsFactory") as MintableEditionsFactory;
			this.MintableEdition = ethers.getContractAt("MintableEditions", this.Factory);
		}
	}
	// create functions

	// create a MintableEdition
	// @param address // The creator address for Edition create (I suppose)
	// public async create(name:string,symbol:string,description:string,contentUrl:string,contentHash:string,thumbnailUrl:string,size:number,royalties:number,shares: { holder: string; bps: number }[]):Promise<MintableEditions>{
	public async create(name:string,symbol:string,description:string,contentUrl:string,contentHash:string,thumbnailUrl:string,size:number,royalties:number,shares: { holder: string; bps: number }[]){
		const factory = (await ethers.getContractAt("MintableEditionsFactory")) as MintableEditionsFactory;
	  
		// const editionsAddress = await factory.create(
		factory.create(
		name,
		symbol,
		description,
		contentUrl,
		contentHash,
		thumbnailUrl,
		size,
		royalties,
		shares)

		// Verify creation
		/*
		const ver = factory.instances();
		const editions = await ethers.getContractAt("MintableEditions", editionsAddress)as MintableEditions
		this.Factory = factory
		this.MintableEdition = editions
		return editions
		*/
	  }

	public async get(id: number): Promise<string>{
		const factory = (await ethers.getContractAt("MintableEditionsFactory")) as MintableEditionsFactory;
		return factory.get(id)
	}

	/*
	// purchase on Editions
	// @param editionsId
	public async purchase(editionId:number ): Promise<number> {
		try {
				
				const editions = self.MintableEditions;
				const price = await editions.price();
				expect(price).to.not.be.equal("0x0");
				return editions.purchase();
		} catch {
			return Promise.reject(err.message);
		}
	}

	// mint on Editions
	// @param editionsId
	public async mint(editionId:number):Promise<number>{
		try {
			const edition = this.MintableEditions;
			// pass 
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
			const editionMultiple = self.MintableEditions;
			let address = minterAddr;
			let addresses = Array<string>
			for (i=0, i<count, i++)  {
				addresses.append(address);
			} 
			
		} catch {
			return Promise.reject(err.message);
		}
		return editionsMultiple.mintAndTransfer(addresses);
	}


	// mint and transfer from Editions
	// @param editionsId
	public async mintAndTransfer(editionId:number, recipients:Array<['address']>, count:number=1):Promise<number>{
		
		try {
			const editionMultiple = self.MintableEditions;
			let addresses = Array<string>
			for (addr in recipients): {
				for i in range(count): {
					addresses.append(address);
				}
			}
		} catch {
			return Promise.reject(err.message);
		}
		return editionsMultiple.mintAndTransfer(addresses);
	}
	*/
}
