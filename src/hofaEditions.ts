const { expect } = require("chai");
const { ethers,  } = require("hardhat");
 
import { Bytes } from "@ethersproject/bytes";

import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";




import {
  MintableEditionsFactory,
  MintableEditions,
  EditionMetadata
} from "../typechain";










  export class hofaEditions{
   public Emetadata!: EditionMetadata 
   public Editions!:  MintableEditions 
    public Factory!: MintableEditionsFactory
    public shareholder!: SignerWithAddress;
    public minter!: SignerWithAddress;
        
      

public async purchase(editionsId:number ): Promise<number> {
   const factory= await  ethers.getContractAt("MintableEditionsFactory", this.Factory.address) as  MintableEditionsFactory;
   const editionsAddress = await factory.get(editionsId);
   const editions = await ethers.getContractAt("MintableEditions", editionsAddress);
   const price = await editions.price();
   expect(price).to.not.be.equal("0x0");
 return editions.purchase();
     
    
}
public async mint(editionsId:number):Promise<number>{
    const factory= await  ethers.getContractAt("MintableEditionsFactory", this.Factory.address) as  MintableEditionsFactory;
    const editionsAddress= await factory.get(editionsId);
    const editions = await ethers.getContractAt("MintableEditions", editionsAddress);
    return editions.mint();
    

}


public async mintMultiple(editionsId:number,count:number):Promise<number>{
    const factory= await ethers.getContractAt("MintableEditionsFactory", this.Factory.address) as MintableEditionsFactory;
    const editionsAddress= await factory.get(editionsId);
    const editionsMultiple= await ethers.getContractAt("MintableEditions", editionsAddress);
    return editionsMultiple.mintAndTransfer(count);
}
public async mintAndTransfer(editionsId:number, recipients:Array<['address']>, count:number=1):Promise<number>{
    count = count;
    const factory= await ethers.getContractAt("MintableEditionsFactory", this.Factory.address) as MintableEditionsFactory;
    const editionsAddress= await factory.get(editionsId);
    const editionsMultiple= await ethers.getContractAt("MintableEditions", editionsAddress);
    return editionsMultiple.mintAndTransfer(recipients);
    

}

  


public async create(name:string,symbol:string,description:string,contentUrl:string,contentHash:string|Bytes,thumbnailUrl:string,size:number,royalties:number,shares: { holder: string; bps: number }[]):Promise<MintableEditions>{
  const factory = (await ethers.getContractAt("MintableEditionsFactory", this.Factory.address)) as MintableEditionsFactory;

  name=name
  symbol= symbol
  description= description
  contentUrl= contentUrl
  contentHash= contentHash
  thumbnailUrl= thumbnailUrl
  size= size
  royalties= royalties
  shares= shares

  const editionsAddress=factory.create(

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


        
      }

  


  
  
 


  

