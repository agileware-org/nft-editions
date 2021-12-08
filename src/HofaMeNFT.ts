const { expect } = require("chai");
const IPFS = require('ipfs-core');
import { Provider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'

// import address from "../addresses.json";
import { readFileSync, writeFileSync } from 'fs';
import { 
	MintableEditionsFactory, MintableEditionsFactory__factory, 
	MintableEditions, MintableEditions__factory } from '../typechain';

export interface MeNFTInfo {
	name:string,
	symbol:string,
	description:string,
	contentUrl:string,
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
		const contentHash = await this._generateCHash(info.contentUrl); // TO DO: to be computed
		if (!info.thumbnailUrl) {
			info.thumbnailUrl = "";
		}
		if (!info.shares) {
			info.shares = [{holder: "", bps: 0}];
		}
		const tx = await (await this.factory.create(info.name, info.symbol, info.description, info.contentUrl, contentHash, info.thumbnailUrl, info.size, info.royalties, info.shares)).wait();
		return new Promise((resolve, reject) => {
			for (const log of tx.events!) {
				if (log.event === "CreatedEditions") {
					resolve(MintableEditions__factory.connect(log.args![4], this.signerOrProvider));
				}
			}
			reject("Event `CreatedEditions` not found");
		});
	}

	/**
	 * Retrieves a MeNFT by it's id
	 */
	public async get(id: number): Promise<MintableEditions>{
		return MintableEditions__factory.connect(await this.factory.get(id), this.signerOrProvider);
	}

	// Gnerate Hash from content
	// @param content
	private async _generateCHash(content:string):Promise<string>{
		//return sha256(content).toString(); // To DO only example function. Which is content datatype ?
		// return "0xABCDEF9876543210"; // To DO only example function. Which is content datatype ?
		const contentData = await IPFS.create();
		const stream = contentData.cat(content.split("/")[content.length - 1]);
		let data = "";
		for await (const chunk of stream) {
			data += chunk.toString();
		}
		return data;
	}

	// purchase a MeNFT by it's id
	// @param editionsId
	// @parma value
	public async purchase(editionId:number, value:number): Promise<string> {
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		const price = await (await edition.price())
		if ( price > 0) {
			//const tx = await (await edition.purchase({value: ethers.utils.parseEther(value)})).wait();
			const tx = await (await edition.purchase({value: value})).wait();
			//const tx = await (await edition.purchase()).wait();
			return new Promise((resolve, reject) => {
				for (const log of tx.events!) {
					if (log.event === "EditionSold") {
						resolve(log.args![4]);
					}
				}
				reject("Event `purchase` not found");
			});
		}
		return "Not for sale";
	}

	// mint a MeNFT by it's id
	// @param editionsId
	public async mint(editionId:number):Promise<string>{
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		const tx = await ( await edition.mint()).wait()
		return new Promise((resolve, reject) => {
			for (const log of tx.events!) {
				if (log.event === "Transfer") {
					resolve(log.args![4]);
				}
			}
			reject("Event `mint` not found");
		});
	}


	// multiple mint for one address a MeNFT by it's id
	// @param editionsId
	// @param count
	public async mintMultiple(editionId:number,count:number):Promise<string>{
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		let address = "0x0ASDASLDKJASDLKADJALSKJDLKJDASLKJLAS12345"; //this.signerOrProvider.getAddress() // here the address of actor; this.signerOrProvider.address
		let addresses: Array<string> = [];
		for (let i = 0; i < count; i++) {
			addresses.push(address);
		}
		const tx = await( await edition.mintAndTransfer(addresses)).wait()
		return new Promise((resolve, reject) => {
			for (const log of tx.events!) {
				console.log(log.event);
				if (log.event === "Transfer") {
					resolve(log.args![4]);
				}
			}
			reject("Event `mintMultiple` not found");
		});
	}


	// Multiple mint for many address a MeNFT by it's id
	// @param editionsId
	// @param recipients
	// @param count - default 1
	public async mintAndTransfer(editionId:number, recipients:Array<string>, count:number=1):Promise<number>{
		const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
		let addresses: Array<string> = [];
		for (const addr of recipients!){
			for (let i = 0; i < count; i++) {
				addresses.push(addr);
			}
		}
		const tx = await( await edition.mintAndTransfer(addresses)).wait()
		return new Promise((resolve, reject) => {
			for (const log of tx.events!) {
				console.log(log.event);
				if (log.event === "Transfer") {
					resolve(log.args![4]);
				}
			}
			reject("Event `mintMultiple` not found");
		});
	}
}
