import chai, { expect } from 'chai';
import asPromised from 'chai-as-promised';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Blockchain } from '../utils/Blockchain';
import { generatedWallets } from '../utils/generatedWallets';
import { MintableEditionsFactory } from '../typechain/MintableEditionsFactory';

chai.use(asPromised);

const { ethers } = require("hardhat");

let provider = new JsonRpcProvider();
let blockchain = new Blockchain(provider);

describe('MintableEditions', () => {

    let [
      deployerWallet
      ] = generatedWallets(provider);

      let editionAddress: string;

      let signerOrProvider: 'Myself';

      beforeEach(async () => {
        await blockchain.resetAsync();
      });
    
      describe('#constructor', () => {
        it('should be able to deploy', async () => {
          await expect(deploy()).eventually.fulfilled;
        });
      });
    
      

      async function deploy() {
        const edition = await (
    
          await new MintableEditionsFactory(signerOrProvider, deployerWallet).attach(signerOrProviderWallet)
    
        ).deployed();
        editionAddress = edition.address;
      }

  });


  


