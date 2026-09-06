import { Injectable, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

const ERC20_MINT_ABI = [
  'function mint(address to, uint256 amount) external',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

@Injectable()
export class BlockchainService {
  private readonly rpcUrl: string;
  private readonly chainId: number;
  private readonly tokenContractAddress?: string;
  private readonly minterAddress?: string;
  private readonly privateKey?: string;

  constructor(private readonly config: ConfigService) {
    this.rpcUrl = this.config.get<string>('BLOCKCHAIN_RPC_URL') || '';
    this.chainId = Number(this.config.get<string>('BLOCKCHAIN_CHAIN_ID') || 0);
    this.tokenContractAddress = this.config.get<string>('BLOCKCHAIN_TOKEN_CONTRACT_ADDRESS');
    this.minterAddress = this.config.get<string>('BLOCKCHAIN_MINT_RECIPIENT');
    this.privateKey = this.config.get<string>('BLOCKCHAIN_PRIVATE_KEY');
  }

  private provider() {
    if (!this.rpcUrl) {
      throw new ServiceUnavailableException('Blockchain RPC is not configured');
    }
    return new ethers.JsonRpcProvider(this.rpcUrl, this.chainId || undefined);
  }

  async status() {
    const provider = this.provider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    return {
      connected: true,
      chainId: Number(network.chainId),
      blockNumber,
      tokenContractConfigured: Boolean(this.tokenContractAddress),
      signerConfigured: Boolean(this.privateKey),
    };
  }

  async prepareMint(input: { requestId: string; recipient: string; amount: string }) {
    if (!this.tokenContractAddress) {
      throw new ServiceUnavailableException('Blockchain token contract is not configured');
    }
    if (!ethers.isAddress(input.recipient)) {
      throw new BadRequestException('recipient must be a valid EVM address');
    }
    if (!/^\d+$/.test(input.amount) || input.amount === '0') {
      throw new BadRequestException('amount must be a positive integer in token base units');
    }

    const provider = this.provider();
    const contract = new ethers.Contract(this.tokenContractAddress, ERC20_MINT_ABI, provider);
    const decimals = Number(await contract.decimals());
    const symbol = await contract.symbol();
    const iface = new ethers.Interface(ERC20_MINT_ABI);
    const data = iface.encodeFunctionData('mint', [input.recipient, input.amount]);

    return {
      requestId: input.requestId,
      network: Number((await provider.getNetwork()).chainId),
      contract: this.tokenContractAddress,
      recipient: input.recipient,
      amountBaseUnits: input.amount,
      displayAmount: ethers.formatUnits(input.amount, decimals),
      symbol,
      data,
      note: 'Unsigned transaction. Execute only after AssetFlow approval, legal, custody and investor-eligibility gates are complete.',
    };
  }

  async executeMint(input: { requestId: string; recipient: string; amount: string }) {
    if (!this.privateKey) {
      throw new ServiceUnavailableException('Blockchain signer is not configured');
    }
    if (!this.tokenContractAddress) {
      throw new ServiceUnavailableException('Blockchain token contract is not configured');
    }
    const prepared = await this.prepareMint(input);
    const provider = this.provider();
    const wallet = new ethers.Wallet(this.privateKey, provider);
    const contract = new ethers.Contract(this.tokenContractAddress, ERC20_MINT_ABI, wallet);
    const tx = await contract.mint(input.recipient, input.amount);
    const receipt = await tx.wait();

    return {
      ...prepared,
      signer: wallet.address,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
    };
  }
}
