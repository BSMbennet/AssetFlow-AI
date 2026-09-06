import { Injectable, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

const RWA_ABI = [
  'function issue(address recipient, uint256 amount, bytes32 issuanceRequestHash) external',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function assetId() view returns (string)',
  'function maxSupply() view returns (uint256)',
  'function totalIssued() view returns (uint256)',
  'function remainingSupply() view returns (uint256)',
];

@Injectable()
export class BlockchainService {
  private readonly rpcUrl: string;
  private readonly chainId: number;
  private readonly tokenContractAddress?: string;
  private readonly privateKey?: string;

  constructor(private readonly config: ConfigService) {
    this.rpcUrl = this.config.get<string>('BLOCKCHAIN_RPC_URL') || '';
    this.chainId = Number(this.config.get<string>('BLOCKCHAIN_CHAIN_ID') || 0);
    this.tokenContractAddress = this.config.get<string>('BLOCKCHAIN_TOKEN_CONTRACT_ADDRESS');
    this.privateKey = this.config.get<string>('BLOCKCHAIN_PRIVATE_KEY');
  }

  private provider() {
    if (!this.rpcUrl) throw new ServiceUnavailableException('Blockchain RPC is not configured');
    return new ethers.JsonRpcProvider(this.rpcUrl, this.chainId || undefined);
  }

  private contract(providerOrSigner: ethers.Provider | ethers.Signer) {
    if (!this.tokenContractAddress) throw new ServiceUnavailableException('Blockchain token contract is not configured');
    return new ethers.Contract(this.tokenContractAddress, RWA_ABI, providerOrSigner);
  }

  private validate(input: { recipient: string; amount: string }) {
    if (!ethers.isAddress(input.recipient)) throw new BadRequestException('recipient must be a valid EVM address');
    if (!/^\d+$/.test(input.amount) || input.amount === '0') throw new BadRequestException('amount must be a positive integer in token base units');
  }

  private requestHash(requestId: string) {
    return ethers.keccak256(ethers.toUtf8Bytes(`assetflow:tokenization:${requestId}`));
  }

  async status() {
    const provider = this.provider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    let contractState: Record<string, string> = {};
    if (this.tokenContractAddress) {
      const contract = this.contract(provider);
      const [assetId, symbol, maxSupply, totalIssued, remainingSupply] = await Promise.all([
        contract.assetId(), contract.symbol(), contract.maxSupply(), contract.totalIssued(), contract.remainingSupply(),
      ]);
      contractState = { assetId, symbol, maxSupply: maxSupply.toString(), totalIssued: totalIssued.toString(), remainingSupply: remainingSupply.toString() };
    }
    return { connected: true, chainId: Number(network.chainId), blockNumber, tokenContractConfigured: Boolean(this.tokenContractAddress), signerConfigured: Boolean(this.privateKey), contract: contractState };
  }

  async prepareMint(input: { requestId: string; recipient: string; amount: string }) {
    this.validate(input);
    const provider = this.provider();
    const contract = this.contract(provider);
    const [decimals, symbol, remainingSupply] = await Promise.all([contract.decimals(), contract.symbol(), contract.remainingSupply()]);
    const requestHash = this.requestHash(input.requestId);
    const iface = new ethers.Interface(RWA_ABI);
    const data = iface.encodeFunctionData('issue', [input.recipient, input.amount, requestHash]);
    if (BigInt(input.amount) > BigInt(remainingSupply)) throw new BadRequestException('Requested amount exceeds contract remaining supply');
    return {
      requestId: input.requestId,
      network: Number((await provider.getNetwork()).chainId),
      contract: this.tokenContractAddress,
      recipient: input.recipient,
      amountBaseUnits: input.amount,
      displayAmount: ethers.formatUnits(input.amount, Number(decimals)),
      symbol,
      issuanceRequestHash: requestHash,
      data,
      note: 'Unsigned transaction. Execute only after AssetFlow approval, legal, custody and investor-eligibility gates are complete.',
    };
  }

  async executeMint(input: { requestId: string; recipient: string; amount: string }) {
    if (!this.privateKey) throw new ServiceUnavailableException('Blockchain signer is not configured');
    const prepared = await this.prepareMint(input);
    const provider = this.provider();
    const wallet = new ethers.Wallet(this.privateKey, provider);
    const contract = this.contract(wallet);
    const tx = await contract.issue(input.recipient, input.amount, prepared.issuanceRequestHash);
    const receipt = await tx.wait();
    return { ...prepared, signer: wallet.address, transactionHash: receipt.hash, blockNumber: receipt.blockNumber, status: receipt.status === 1 ? 'confirmed' : 'failed' };
  }
}
