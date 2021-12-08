const { expect } = require("chai");
import { Provider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer'

import "@nomiclabs/hardhat-ethers";
import { Wallet } from '@ethersproject/wallet'


import { rejects } from 'assert';
import { 
	MintableEditionsFactory, MintableEditionsFactory__factory, 
	MintableEditions, MintableEditions__factory } from '../typechain';

export class hofaEditions {
	public signerOrProvider: Signer | Provider;
	public factory: MintableEditionsFactory;

	constructor (signerOrProvider: Signer | Provider, factoryAddress?: string) {
		this.signerOrProvider = signerOrProvider;
		if (factoryAddress) {
			//load Factory contract
			this.factory = MintableEditionsFactory__factory.connect(factoryAddress as string, signerOrProvider);
		} else {
			this.factory = MintableEditionsFactory__factory.connect("0x0000", signerOrProvider);
		}
	}
	// create functions

	// create a MintableEdition
	// @param address // The creator address for Edition create (I suppose)
	// public async create(name:string,symbol:string,description:string,contentUrl:string,contentHash:string,thumbnailUrl:string,size:number,royalties:number,shares: { holder: string; bps: number }[]):Promise<MintableEditions>{
	public async create(
		name:string,
		symbol:string,
		description:string,
		contentUrl:string,
		contentHash:string,
		thumbnailUrl:string,
		size:number,
		royalties:number,
		shares: { holder: string; bps: number }[]): Promise<MintableEditions> {
			
			const callerAddress = await (this.signerOrProvider as Signer).getAddress();
			
			await this.factory.create(name, symbol, description, contentUrl, contentHash, thumbnailUrl, size, royalties, shares);
			const filterCreator = await this.factory.filters.CreatedEditions(null, callerAddress , null, null, null);
			
			this.factory.on(filterCreator, (a,b,c,d,e,f) => {
				console.log("a: " + a);
				console.log("b: " + b);
				console.log("c: " + c);
				console.log("d: " + d);
				console.log("e: " + e);
				console.log("f: " + f);
			})
			const editionsAddress = await this.factory.get(1);

			return new Promise((resolve) => { 
				resolve(MintableEditions__factory.connect(editionsAddress, this.signerOrProvider)) 
			});
	  }

	public async get(id: number): Promise<string>{
		return this.factory.get(id)
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
