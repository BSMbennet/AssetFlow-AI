import Web3 from 'web3';
import { NetworkConfig, TransactionOptions } from './types';

export class Web3Service {
  private web3: Web3;
  private network: NetworkConfig;

  constructor(network: NetworkConfig) {
    this.network = network;
    this.web3 = new Web3(network.rpcUrl);
  }

  getWeb3(): Web3 {
    return this.web3;
  }

  getNetwork(): NetworkConfig {
    return this.network;
  }

  async getChainId(): Promise<number> {
    return this.web3.eth.getChainId();
  }

  async getBlockNumber(): Promise<number> {
    return this.web3.eth.getBlockNumber();
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.web3.eth.getBalance(address);
    return this.web3.utils.fromWei(balance, 'ether');
  }

  async getTransaction(hash: string): Promise<any> {
    return this.web3.eth.getTransaction(hash);
  }

  async getTransactionReceipt(hash: string): Promise<any> {
    return this.web3.eth.getTransactionReceipt(hash);
  }

  async sendTransaction(options: TransactionOptions): Promise<string> {
    const tx = {
      from: options.from,
      to: options.to,
      value: this.web3.utils.toWei(options.value?.toString() || '0', 'ether'),
      gas: options.gas,
      gasPrice: options.gasPrice
        ? this.web3.utils.toWei(options.gasPrice.toString(), 'gwei')
        : undefined,
      data: options.data,
    };

    const receipt = await this.web3.eth.sendTransaction(tx);
    return receipt.transactionHash;
  }

  async callContract(
    contractAddress: string,
    abi: any[],
    method: string,
    params: any[]
  ): Promise<any> {
    const contract = new this.web3.eth.Contract(abi, contractAddress);
    const result = await contract.methods[method](...params).call();
    return result;
  }

  async estimateGas(tx: any): Promise<number> {
    return this.web3.eth.estimateGas(tx);
  }

  async getGasPrice(): Promise<string> {
    const price = await this.web3.eth.getGasPrice();
    return this.web3.utils.fromWei(price, 'gwei');
  }

  async getBlock(blockNumber: number): Promise<any> {
    return this.web3.eth.getBlock(blockNumber);
  }

  async getLogs(options: any): Promise<any[]> {
    return this.web3.eth.getPastLogs(options);
  }

  // Utility methods
  toWei(amount: number, unit: string = 'ether'): string {
    return this.web3.utils.toWei(amount.toString(), unit);
  }

  fromWei(amount: string, unit: string = 'ether'): string {
    return this.web3.utils.fromWei(amount, unit);
  }

  toChecksumAddress(address: string): string {
    return this.web3.utils.toChecksumAddress(address);
  }

  isAddress(address: string): boolean {
    return this.web3.utils.isAddress(address);
  }

  getAddressFromPrivateKey(privateKey: string): string {
    const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    return account.address;
  }

  createAccount(): { address: string; privateKey: string } {
    const account = this.web3.eth.accounts.create();
    return {
      address: account.address,
      privateKey: account.privateKey,
    };
  }

  signMessage(message: string, privateKey: string): string {
    return this.web3.eth.accounts.sign(message, privateKey).signature;
  }

  verifyMessage(message: string, signature: string, address: string): boolean {
    const recovered = this.web3.eth.accounts.recover(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  }

  async isContract(address: string): Promise<boolean> {
    const code = await this.web3.eth.getCode(address);
    return code !== '0x' && code !== '0x0';
  }
}