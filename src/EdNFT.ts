/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 *
 * Made with 🧡 by www.Kreation.tech
 */
import { Provider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer'
import { MintableEditionsFactory__factory, MintableEditions__factory } from './types';
import type { MintableEditionsFactory, MintableEditions } from './types';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import addresses from './addresses.json';
import roles from './roles.json';
import { ethers } from 'ethers';

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
	private factory: MintableEditionsFactory;
	public address:string;
	public roles:{[key: string]: string} = roles;

	public static unwrapDescription(description:string): string {
		return description.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t").replace(/\\"/g, '"')
	}

	constructor (signerOrProvider: Signer | Provider, factoryAddressOrChainId: string | number) {
		this.signerOrProvider = signerOrProvider;
		if (typeof(factoryAddressOrChainId) !== 'string') {
			//load Factory contract
			const contracts:{[key: string]: string} = (addresses as {[key: string]: {[name: string]: string}})[factoryAddressOrChainId.toString()];
			if (!contracts) throw new Error('Unknown chain with id ' + factoryAddressOrChainId)
			this.address = contracts["MintableEditionsFactory"];
			this.factory = MintableEditionsFactory__factory.connect(this.address, signerOrProvider);
		} else {
			this.address = factoryAddressOrChainId;
			this.factory = MintableEditionsFactory__factory.connect(factoryAddressOrChainId as string, signerOrProvider);
		}
	}

	/**
	 * Determines the chain identifier 
	 * 
	 * @param signerOrProvider the signer or the provider
	 */
	public static async getChainId(signerOrProvider: Signer | Provider): Promise<number> {
		return new Promise((resolve, reject) => {
			const chainId = (signerOrProvider as Signer).getChainId()
			if (chainId === undefined) {
				(signerOrProvider as Provider).getNetwork().then((network: { chainId: number | PromiseLike<number>; }) => {
					resolve(network.chainId);
				});
			}
			resolve(chainId);
		});
	}

	/**
	 * Creates a new EdNFT
	 * 
	 * @param props the properties to assign to the editionable NFT to create
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 */
	public async create(props:EdNFT.Definition, confirmations:number = 1): Promise<{id:string, address:string, instance:MintableEditions}> {
		return new Promise( (resolve, reject) => { (async() => {
			try {
				const tx = await (await this.factory
					.create({
						name: props.info.name,
						symbol: props.info.symbol,
						description: props.info.description.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/"/g, '\\"'),
						contentUrl: props.info.contentUrl,
						contentHash: props.info.contentHash,
						thumbnailUrl: props.info.thumbnailUrl || ""
					}, props.size||0, props.price||0, props.royalties||0, props.shares||[], props.allowances||[]))
					.wait(confirmations);
				for (const log of tx.events!) {
					if (log.event === "CreatedEditions") {
						resolve({
							id: log.args![0] as string, 
							address: log.args![4] as string, 
							instance: MintableEditions__factory.connect(log.args![4], this.signerOrProvider)
						});
					}
				}
			} catch (err) {
				reject(err);
			}
		})()});
	}

	/**
	 * Purchases an edition of an EdNFT
	 * 
	 * @param id the EdNFT identifier
	 * @param confirmations number of confirmations to wait for, defaults to 1
	 */
	public async purchase(id:BigNumberish, confirmations:number = 1): Promise<BigNumber> {
		return new Promise( (resolve, reject) => { (async() => {
			try {
				const edition = MintableEditions__factory.connect(await this.factory.get(id), this.signerOrProvider);
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

	/**
	 * Mints an edition of an EdNFT
	 * 
	 * @param id the EdNFT identifier
	 * @param confirmations number of confirmations to wait for, defaults to 1
	 */
	public async mint(id:BigNumberish, confirmations:number = 1):Promise<BigNumber>{
		return new Promise((resolve, reject) => { (async() => {
			try {
				const edition = MintableEditions__factory.connect(await this.factory.get(id), this.signerOrProvider);
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


	/**
	 * Mints multiple editions of an EdNFT
	 * 
	 * @param id the EdNFT identifier
	 * @param receiver the receiver of the editions
	 * @param count number of editions to mint
	 * @param confirmations number of confirmations to wait for, defaults to 1
	 */
	public async mintMultiple(id:BigNumberish, receiver: string, count:number, confirmations:number = 1):Promise<BigNumber> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const edition = MintableEditions__factory.connect(await this.factory.get(id), this.signerOrProvider);
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

	/**
	 * Mints multiple editions of an EdNFT for firrente recipients
	 * 
	 * @param id the EdNFT identifier
	 * @param recipients list of addresses receiving the editions
	 * @param count number of instances to mint for each recipient
	 * @param confirmations number of confirmations to wait for, defaults to 1
	 */
	public async mintAndTransfer(id:BigNumberish, recipients:Array<string>, count:number = 1, confirmations:number = 1):Promise<BigNumber> {
		let addresses: Array<string> = [];
		for (const addr of recipients!) {
			for (let i = 0; i < count; i++) {
				addresses.push(addr);
			}
		}
		return new Promise((resolve, reject) => { (async() => {
			try {
				const edition = MintableEditions__factory.connect(await this.factory.get(id), this.signerOrProvider);
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

	/**
	 * Retrieves an EdNFT
	 * 
	 * @param id the EdNFT identifier
	 */
	public async get(id: BigNumberish): Promise<{address:string, instance:MintableEditions}> {
		return new Promise((resolve) => {
			this.factory.get(id).then((address) => {
				resolve({
					address: address,
					instance: MintableEditions__factory.connect(address, this.signerOrProvider)
				});
			});
		});
	}

	/**
	 * Retreves the amount of EdNFTs produced so far
	 */
	public async instances(): Promise<BigNumber> {
		return new Promise((resolve) => {
			resolve(this.factory.instances());
		});
	}
	
	/**
	 * Retrieves the price of an EdNFT
	 * 
	 * @param id the EdNFT identifier
	 */
	public async fetchPrice(id:BigNumberish): Promise<BigNumber> {
		return new Promise((resolve) => {
			this.factory.get(id).then((address) => {
				const edition = MintableEditions__factory.connect(address, this.signerOrProvider);
				resolve(edition.price());
			});
		});
	}

	/**
	 * Verifies if an address is entitled to mint
	 * 
	 * @param id the EdNFT identifier
	 * @param address the address to verify, defaults to current wallet
	 */
	public async isAllowedMinter(id:BigNumberish, address:string | undefined): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const edition = (await this.get(id)).instance;
				resolve(
					await edition.owner() === address || 
					await edition.allowedMinters(address||await (this.signerOrProvider as Signer).getAddress()) > 0 || 
					await edition.allowedMinters(ethers.constants.AddressZero) > 0);
			} catch (err) {
				reject(err);
			}
		})()});
	}

	/**
	 * Grants artist permissions to an address
	 * 
	 * @param address the address to grant
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 */
	public async grantArtist(address:string, confirmations:number = 1): Promise<boolean> {
		return this._grantRole(roles.artist, address, confirmations);
	}

	/**
	 * Revokes artist permissions from an address
	 * 
	 * @param address the address to revoke
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 */
	public async revokeArtist(address:string, confirmations:number = 1): Promise<boolean> {
		return this._revokeRole(roles.artist, address, confirmations);
	}

	/**
	 * Checks if an address is listed as artist
	 * 
	 * @param address the address to check, defaults to current signer
	 */
	public async isArtist(address?:string): Promise<boolean> {
		return this._hasRole(roles.artist, address);
	}

	/**
	 * Grants artist permissions to an address
	 * 
	 * @param address the address to grant
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 */
	public async grantAdmin(address:string, confirmations:number = 1): Promise<boolean> {
		return this._grantRole(roles.admin, address, confirmations);
	}

	/**
	 * Revokes artist permissions from an address
	 * 
	 * @param address the address to revoke
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 */
	public async revokeAdmin(address:string, confirmations:number = 1): Promise<boolean> {
		return this._revokeRole(roles.admin, address, confirmations);
	}

	/**
	 * Checks if an address is listed as admin
	 * 
	 * @param address the address to check, defaults to current signer
	 */
	public async isAdmin(address?:string): Promise<boolean> {
		return this._hasRole(roles.admin, address);
	}

	/**
	 * Grants permissions to an address
	 * 
	 * @param address the address to grant
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 */
	private async _grantRole(role:string, address:string, confirmations:number = 1): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const tx = await (await this.factory.grantRole(role, address))
					.wait(confirmations);
				for (const log of tx.events!) {
					if (log.event === "RoleGranted") {
						resolve(true);
					}
				}
				resolve(false);
			} catch (err) {
				reject(err);
			}
		})();});
	}

	/**
	 * Revokes permissions from an address
	 * 
	 * @param address the address to revoke
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 */
	private async _revokeRole(role:string, address:string, confirmations:number = 1): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const tx = await (await this.factory.revokeRole(role, address))
					.wait(confirmations);
				for (const log of tx.events!) {
					if (log.event === "RoleRevoked") {
						resolve(true);
					}
				}
				resolve(false);
			} catch (err) {
				reject(err);
			}
		})();});
	}

	/**
	 * Checks if an address has been granted a role
	 * 
	 * @param address the address to check, defaults to current signer
	 */
	 private async _hasRole(role:string, address?:string): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				resolve(this.factory.hasRole(role, address||await (this.signerOrProvider as Signer).getAddress()));
			} catch (err) {
				reject(err);
			}
		})();});
	}
}

