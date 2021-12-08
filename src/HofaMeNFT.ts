const { expect } = require("chai");
import { Provider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer'

import { 
	MintableEditionsFactory, MintableEditionsFactory__factory, 
	MintableEditions, MintableEditions__factory } from '../typechain';

export class HofaMeNFT {
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
			const tx = await (await this.factory.create(name, symbol, description, contentUrl, contentHash, thumbnailUrl, size, royalties, shares)).wait();
			return new Promise((resolve, reject) => {
				for (const log of tx.events!) {
					if (log.event === "CreatedEditions") {
						resolve(MintableEditions__factory.connect(log.args![4], this.signerOrProvider));
					}
				}
				reject("Event `CreatedEditions` not found");
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
