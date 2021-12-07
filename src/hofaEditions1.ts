const { expect } = require("chai");
const { ethers } = require("hardhat");
 
import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


import {
	MintableEditionsFactory,
	MintableEditions,
	EditionMetadata,
	
} from "../typechain";


export class hofaEditions {

	public Factory!: MintableEditionsFactory
	public shareholder!: SignerWithAddress;

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
		if (factoryAddr != "0x0") {
			//load Factory contract
			this.Factory = await ethers.getContractAt("MintableEditionsFactory", factoryAddr) as MintableEditionsFactory;
		} else {
			// Create a new Edition Factor
			this.Factory.create(name, simbol, description, contentUrl, contentHash, thumbnailUrl, size, royalities, shares);
		}
	}
	// create functions

	// create a MintableEdition
	// @param address // The creator address for Edition create (I suppose)
	public async create(name:string,symbol:string,description:string,contentUrl:string,contentHash:string|Bytes,thumbnailUrl:string,size:number,royalties:number,shares: { holder: string; bps: number }[]):Promise<MintableEditions>{
		const factory = (await ethers.getContractAt("MintableEditionsFactory", this.Factory.address)) as MintableEditionsFactory;
	  
		let name=name
	    let	symbol= symbol
	    let   description= description
		let   contentUrl= contentUrl
	    let contentHash= contentHash
		let thumbnailUrl= thumbnailUrl
		let size= size
		let royalties= royalties
		let shares= shares
	  
		const editionsAddress = factory.create(

	  
		'jffjfjdjf',
		'KOK',
		'a fjfjfjjekekekldnnnsifnwfjwnfjiuqbegquiegbgei',
		'ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d',
		'0x94DB57416B770A06B3B2123531E68D67E9D96872F453FA77BC413E9E53FC1BFC',
		'',
		100,
		250,
		shares=[{holder: (await this.shareholder.getAddress()) as string, bps: 500}])
		const editions = await ethers.getContractAt("MintableEditions", editionsAddress);
		return editions.MintableEditions();
	  
		
	  }

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
		
		try {
			const editionsAddress= await this.Factory.get(editionId);
			const editionsMultiple= await ethers.getContractAt("MintableEditions", editionsAddress);
		} catch {
			return Promise.reject(err.message);
		}
		return editionsMultiple.mintAndTransfer(recipients);
	}
}
