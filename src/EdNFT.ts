/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 *
 * Made with 🧡 by www.Kreation.tech
 */


const { ethers } = require("hardhat");
const crypto = require("crypto");
import { Provider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer'
import { 
	MintableEditionsFactory, MintableEditionsFactory__factory, 
	MintableEditions, MintableEditions__factory } from './types';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import addresses from './addresses.json';

export declare namespace EdNFT {
	interface Definition {
		info: {
			name:string,
			symbol:string,
			description:string,
			contentUrl:string,
			contentHash: string,
			thumbnailUrl?:string
		}
		size?:number,
		price?:BigNumberish,
		royalties?:number,
		shares?: { 
			holder: string; 
			bps: number 
		}[],
		allowances?: { 
			minter: string; 
			amount: number 
		}[]
	}
}

export class EdNFT {

	private signerOrProvider: Signer | Provider;
	private factory!: MintableEditionsFactory;

	constructor (signerOrProvider: Signer | Provider, factoryAddressOrChainId: string | number) {
		this.signerOrProvider = signerOrProvider;
		if (typeof(factoryAddressOrChainId) !== 'string') {
			//load Factory contract
			const contracts:{[key: string]: string} = (addresses as {[key: string]: {[name: string]: string}})[factoryAddressOrChainId.toString()];
			if (!contracts) throw new Error("Unknown chain with id " + factoryAddressOrChainId)
			this.factory = MintableEditionsFactory__factory.connect(contracts["MintableEditionsFactory"], signerOrProvider);
		} else {
			this.factory = MintableEditionsFactory__factory.connect(factoryAddressOrChainId as string, signerOrProvider);
		}
	}

	public static async getChainId(signerOrProvider: Signer | Provider): Promise<number> {
		return new Promise((resolve, reject) => {
			const chainId = (signerOrProvider as Signer).getChainId()
			if (chainId === undefined) {
				(signerOrProvider as Provider).getNetwork().then(network => {
					resolve(network.chainId);
				});
			}
			resolve(chainId);
		});
	}

	// Write functions
	// Creates a new MeNFT
	// @param info
	public async create(props:EdNFT.Definition, confirmations:number = 1): Promise<MintableEditions> {
		return new Promise( (resolve, reject) => { (async() => {
			try {
				const tx = await (await this.factory
					.create({
						name: props.info.name,
						symbol: props.info.symbol,
						description: props.info.description,
						contentUrl: props.info.contentUrl,
						contentHash: props.info.contentHash,
						thumbnailUrl: props.info.thumbnailUrl || ""
					}, props.size||0, props.price||0, props.royalties||0, props.shares||[], props.allowances||[]))
					.wait(confirmations);
				for (const log of tx.events!) {
					if (log.event === "CreatedEditions") {
						resolve(MintableEditions__factory.connect(log.args![4], this.signerOrProvider));
					}
				}
			} catch (err) {
				reject(err);
			}
		})()});
	}

	// purchase a MeNFT by it's id
	// @param editionsId
	// @parma value
	public async purchase(editionId:number, confirmations:number = 1): Promise<BigNumber> {
		return new Promise( (resolve, reject) => { (async() => {
			try {
				const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
				const price = await edition.price();
				if (price.gt(0)) {
					const tx = await (await edition.purchase({value: price})).wait(confirmations);
					for (const log of tx.events!) {
						if (log.event === "Transfer") {
							resolve(log.args![2]);
						}
					}
					reject("Event `Transfer` not found");
				}
				reject("Editions not for sale");
			} catch (err) {
				reject(err);
			}
		})()});
	}

	// mint a MeNFT by it's id
	// @param editionsId
	public async mint(editionId:number, confirmations:number = 1):Promise<BigNumber>{
		return new Promise((resolve, reject) => { (async() => {
			try {
				const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
				const tx = await(await edition.mint()).wait(confirmations);
				for (const log of tx.events!) {
					if (log.event === "Transfer") {
						resolve(log.args![2]);
					}
				}
				reject("Event `Transfer` not found");
			} catch (err) {
				reject(err);
			}
		})()});
	}


	// multiple mint for one address a MeNFT by it's id
	// @param editionsId
	// @param count
	public async mintMultiple(editionId:number, receiver: string, count:number, confirmations:number = 1):Promise<BigNumber> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
				const addresses: Array<string> = [];
				for (let i = 0; i < count; i++) {
					addresses.push(receiver);
				}
				const tx = await( await edition.mintAndTransfer(addresses)).wait(confirmations);
				if (tx.events) {
					if (tx.events.length > 1) {
						const log = tx.events[tx.events.length-1];
						if (log.event === "Transfer") {
							resolve(log.args![2]);
						}
					}
				}
				reject("Event `Transfer` not found");
			} catch (err) {
				reject(err);
			}
		})()});
	}

	// Multiple mint for many address a MeNFT by it's id
	// @param editionsId
	// @param recipients
	// @param count - default 1
	public async mintAndTransfer(editionId:number, recipients:Array<string>, count:number = 1, confirmations:number = 1):Promise<BigNumber> {
		let addresses: Array<string> = [];
		for (const addr of recipients!) {
			for (let i = 0; i < count; i++) {
				addresses.push(addr);
			}
		}
		return new Promise((resolve, reject) => { (async() => {
			try {
				const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
				const tx = await( await edition.mintAndTransfer(addresses)).wait(confirmations)
				if (tx.events) {
					const log = tx.events![tx.events.length-1];
					resolve(log.args![2]);
				}
				reject("Event `Transfer` not found");
			} catch (err) {
				reject(err);
			}
		})()});
	}

	//////////////////////////////////////////

	// MintableEditionsFactory functions
	// Retrieves a MeNFT by it's id
	// @param id
	public async get(id: number): Promise<MintableEditions> {
		return new Promise((resolve) => {
			this.factory.get(id).then(address => {
				resolve(MintableEditions__factory.connect(address, this.signerOrProvider));
			});
		});
	}

	// Retrieves a total MeNFT 
	public async instances(): Promise<BigNumber> {
		return new Promise((resolve) => {
			resolve(this.factory.instances());
		});
	}
	////////////////////////////////////////////

	// Read functions
	// Fetch Edition price
	// @param editionID
	public async fetchPrice(editionId:number): Promise<BigNumber> {
		return new Promise((resolve) => {
			this.factory.get(editionId).then(address => {
				const edition = MintableEditions__factory.connect(address, this.signerOrProvider);
				resolve(edition.price());
			});
		});
	}
	////////////////////////////////////////////

	// Miscellaneous functions
	// verify if signer can mint a MeNFT
	// @param editionID
	// @param signer
	public async isAllowedMinter(editionId:number, address:string): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const edition = MintableEditions__factory.connect(await this.factory.get(editionId), this.signerOrProvider);
				const allowedMinters = await edition.allowedMinters(address);
				const zeroAddressAllowed = await edition.allowedMinters(ethers.constants.AddressZero);
				const owner = await edition.owner();
				resolve(allowedMinters > 0 || zeroAddressAllowed > 0 || (owner === address));
			} catch (err) {
				reject(err);
			}
		})()});
	}

	// Generates the sha256 hash from a buffer/string and returns the hash hex-encoded
	// @param buffer
	public static hash(buffer:Buffer): string {
		const hashHex = crypto.createHash("sha256").update(buffer.toString()).digest('hex');
		return "0x".concat(hashHex.toString());
	}
	/////////////////////////////////////////////////////////
}

