const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { values } from "underscore";
import {
  MintableEditionsFactory,
  MintableEditions,
  EditionMetadata
} from "../typechain";
import { EditionSoldEvent } from "../typechain/MintableEditions";






export class HofaEditions{
public Emetadata:EditionMetadata
public Editions:MintableEditions
public  Factory: MintableEditionsFactory


  
public async purchase(editionsId:number ): Promise<number> {
   const factory= await  ethers.getContractAt("MintableEditionsFactory", this.Factory.address) as  MintableEditionsFactory;
   const editionsAddress = await factory.get(editionsId);
   const editions = await ethers.getContractAt("MintableEditions", editionsAddress);
   const price = await editions.price();
   expect(price).to.not.be.equal("0x0");
 return editions.purchase(values);
     
    
    
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
public async mintAndTransfer(editionsId:number, recipients:Array<['address']>, count:number):Promise<number>{
    count=1
    const factory= await ethers.getContractAt("MintableEditionsFactory", this.Factory.address) as MintableEditionsFactory;
    const editionsAddress= await factory.get(editionsId);
    const editionsMultiple= await ethers.getContractAt("MintableEditions", editionsAddress);
    return editionsMultiple.mintAndTransfer(recipients);
    

}