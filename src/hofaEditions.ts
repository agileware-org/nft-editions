const { expect } = require("chai");
const { ethers,  } = require("hardhat");
 
import "@nomiclabs/hardhat-ethers";


import {
  MintableEditionsFactory,
  MintableEditions,
  EditionMetadata
} from "../typechain";







  export class hofaEditions{
 public Emetadata!: EditionMetadata 
public Editions!:  MintableEditions 
    public Factory!: MintableEditionsFactory
        
      

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
}