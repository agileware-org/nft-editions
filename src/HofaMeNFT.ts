const { expect } = require("chai");
//const IPFS = require('ipfs-core');
const { ethers } = require("hardhat");
import { Provider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer'
import { readFileSync, writeFileSync } from 'fs';
import { 
	MintableEditionsFactory, MintableEditionsFactory__factory, 
	MintableEditions, MintableEditions__factory } from '../typechain';

export interface MeNFTInfo {
	name:string,
	symbol:string,
	description:string,
	contentUrl:string,
	contentHash: string,
	thumbnailUrl?:string,
	size:number,
	royalties:number,
	shares?: { 
		holder: string; 
		bps: number 
	}[]
}
export class HofaMeNFT {
	public signerOrProvider: Signer | Provider;
	public factory: MintableEditionsFactory;

	constructor (signerOrProvider: Signer | Provider, factoryAddress?: string) {
		this.signerOrProvider = signerOrProvider;
		if (factoryAddress) {
			//load Factory contract
			this.factory = MintableEditionsFactory__factory.connect(factoryAddress as string, signerOrProvider);
		} else {
			const addresses = JSON.parse(readFileSync('./addresses.json', 'utf-8'));
			this.factory = MintableEditionsFactory__factory.connect(addresses[4].MintableEditionsFactory, signerOrProvider); // TO DO: retrieve address from addresses.json file
		}
	}

	/**
	 * Creates a new MeNFT
	 */ 
	public async create(info:MeNFTInfo): Promise<MintableEditions> {
		const contentHashCalculate = await this._generateCHash(info.contentUrl); // TO DO: to be computed
		if (!info.thumbnailUrl) {
			info.thumbnailUrl = "";
		}
		if (!info.shares) {
			info.shares = [{holder: "", bps: 0}];
		}
		const tx = await (await this.factory.create(info.name, info.symbol, info.description, info.contentUrl, info.contentHash, info.thumbnailUrl, info.size, info.royalties, info.shares)).wait();
		return new Promise((resolve, reject) => {
			for (const log of tx.events!) {
				if (log.event === "CreatedEditions") {
					resolve(MintableEditions__factory.connect(log.args![4], this.signerOrProvider));
				}
			}
			reject("Event `CreatedEditions` not found");
		});
	}

	// MintableEditionsFactory functions
	/**
	 * Retrieves a MeNFT by it's id
	 */
	public async get(id: number): Promise<MintableEditions>{
		return MintableEditions__factory.connect(await this.factory.get(id), this.signerOrProvider);
	}

	// Retrieves a total MeNFT 
	public async instances(): Promise<string>{
		const editions = await this.factory.instances();
		return editions.toString();
	}

	// Fetch Edition price
	// @param editionID
	public async fetchPrice(editionId:number): Promise<number> {
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		const price = await edition.price();
		let Sprice = price.toString();
		return Number(Sprice);
	}

	// verify if signer can mint a MeNFT
	// @param editionID
	// @param signer
	public async isMintAllow(editionId:number): Promise<boolean> {
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		// let TotShare = await edition.shares();
		// console.log(edition);
		// console.log(TotShare);
		// return await edition._isAllowedToMint();
		return true;
	}

	// Generate Hash from content
	// @param content
	private async _generateCHash(content:string):Promise<string>{
		// const contentData = await IPFS.create();
		/*
		const stream = contentData.cat(content.split("/")[content.split("/").length-1]);
		let data = "";
		for await (const chunk of stream) {
			if (chunk) {
				data += chunk.toString();
			}
		}
		let data = readFileSync('./test.mp4','utf8');
		*/
		let crypto = require("crypto");
		let hashHex = crypto.createHash("sha256").update(content).digest('hex');
		// sha256 convert
		return "0x" + hashHex.toString();
	}

	// purchase a MeNFT by it's id
	// @param editionsId
	// @parma value
	public async purchase(editionId:number, value:string): Promise<string> {
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		const price = await edition.price();
		let sPrice = Number(price.toString());
		if (sPrice > 0) {
			const tx = await (await edition.purchase({value: ethers.utils.parseEther(value)})).wait();
			return new Promise((resolve, reject) => {
				for (const log of tx.events!) {
					if (log.event === "EditionSold") {
						resolve(log.transactionHash);
					}
				}
				reject("Event `purchase` not found");
			});
		}
		return "Cannot purchase editions, price = 0";
	}

	// mint a MeNFT by it's id
	// @param editionsId
	public async mint(editionId:number):Promise<string>{
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		const tx = await(await edition.mint()).wait();
		return new Promise((resolve, reject) => {
			for (const log of tx.events!) {
				if (log.event === "Transfer") {
					let res = log.transactionHash;
					resolve(res);
				}
			}
			reject("Event `mint` not found");
		});
	}


	// multiple mint for one address a MeNFT by it's id
	// @param editionsId
	// @param count
	public async mintMultiple(editionId:number, receiver: string, count:number):Promise<string>{
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		let address = receiver;
		let addresses: Array<string> = [];
		for (let i = 0; i < count; i++) {
			addresses.push(address);
		}
		const tx = await( await edition.mintAndTransfer(addresses)).wait()
		return new Promise((resolve, reject) => {
			if (tx.events) {
				if (tx.events.length > 1) {
					const log = tx.events[tx.events.length-1];
					if (log.event === "Transfer") {
						resolve(log.transactionHash);
					}
				}
				
			}
			reject("Event `mintMultiple` not found");
		});
	}


	// Multiple mint for many address a MeNFT by it's id
	// @param editionsId
	// @param recipients
	// @param count - default 1
	public async mintAndTransfer(editionId:number, recipients:Array<string>, count:number=1):Promise<string>{
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		let addresses: Array<string> = [];
		for (const addr of recipients!){
			for (let i = 0; i < count; i++) {
				addresses.push(addr);
			}
		}
		const tx = await( await edition.mintAndTransfer(addresses)).wait()
		return new Promise((resolve, reject) => {
			if (tx.events) {
				const log = tx.events![tx.events.length-1];
				resolve(log.transactionHash);
			}
			reject("Event `mintMultiple` not found");
		});
	}
}
