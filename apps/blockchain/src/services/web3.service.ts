import { ethers } from 'ethers';
import * as AssetTokenArtifact from '../../artifacts/src/contracts/AssetToken.sol/AssetToken.json';
import { TokenizeAssetRequest, TransferTokensRequest, TransactionReceipt } from '../models/transaction.model';

export class Web3Service {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://polygon-rpc.com');
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
  }

  async deployAssetToken(data: TokenizeAssetRequest): Promise<TransactionReceipt> {
    try {
      const factory = new ethers.ContractFactory(
        AssetTokenArtifact.abi,
        AssetTokenArtifact.bytecode,
        this.wallet
      );

      const contract = await factory.deploy(
        data.name,
        data.symbol,
        data.assetId,
        data.jurisdiction,
        ethers.parseUnits(data.totalTokens, 18),
        this.wallet.address
      );

      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();
      const receipt = await contract.deploymentTransaction()?.wait();

      return {
        status: 'SUCCESS',
        transactionHash: receipt?.hash || '',
        blockNumber: receipt?.blockNumber,
        contractAddress
      };
    } catch (error: any) {
      return { status: 'FAILED', transactionHash: '', error: error.message };
    }
  }

  async transferTokens(data: TransferTokensRequest): Promise<TransactionReceipt> {
    try {
      const contract = new ethers.Contract(data.assetContractAddress, AssetTokenArtifact.abi, this.wallet);
      const tx = await contract.transfer(data.recipientAddress, ethers.parseUnits(data.amount, 18));
      const receipt = await tx.wait();

      return {
        status: 'SUCCESS',
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error: any) {
      return { status: 'FAILED', transactionHash: '', error: error.message };
    }
  }
}