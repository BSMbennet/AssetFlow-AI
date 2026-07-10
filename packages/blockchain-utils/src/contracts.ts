import { Web3Service } from './web3';
import { ContractConfig, ContractEvent } from './types';

export class ContractService {
  private web3Service: Web3Service;

  constructor(web3Service: Web3Service) {
    this.web3Service = web3Service;
  }

  async deployContract(
    abi: any[],
    bytecode: string,
    from: string,
    ...args: any[]
  ): Promise<string> {
    const web3 = this.web3Service.getWeb3();
    const contract = new web3.eth.Contract(abi);
    const deploy = contract.deploy({
      data: bytecode,
      arguments: args,
    });

    const gas = await deploy.estimateGas({ from });
    const result = await deploy.send({
      from,
      gas,
    });

    return result.options.address;
  }

  async getContract(
    address: string,
    abi: any[]
  ): Promise<any> {
    const web3 = this.web3Service.getWeb3();
    return new web3.eth.Contract(abi, address);
  }

  async callMethod(
    contractAddress: string,
    abi: any[],
    method: string,
    params: any[],
    from: string
  ): Promise<any> {
    const contract = await this.getContract(contractAddress, abi);
    const result = await contract.methods[method](...params).call({ from });
    return result;
  }

  async sendMethod(
    contractAddress: string,
    abi: any[],
    method: string,
    params: any[],
    from: string,
    value: string = '0'
  ): Promise<string> {
    const contract = await this.getContract(contractAddress, abi);
    const tx = contract.methods[method](...params);
    const gas = await tx.estimateGas({ from, value });
    const receipt = await tx.send({
      from,
      gas,
      value,
    });
    return receipt.transactionHash;
  }

  async getEvents(
    contractAddress: string,
    abi: any[],
    eventName: string,
    filter: any = {},
    fromBlock: number = 0,
    toBlock: 'latest' = 'latest'
  ): Promise<ContractEvent[]> {
    const contract = await this.getContract(contractAddress, abi);
    const events = await contract.getPastEvents(eventName, {
      filter,
      fromBlock,
      toBlock,
    });
    return events.map((event: any) => ({
      event: event.event,
      args: event.returnValues,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      logIndex: event.logIndex,
    }));
  }

  async subscribeToEvents(
    contractAddress: string,
    abi: any[],
    eventName: string,
    callback: (event: ContractEvent) => void
  ): Promise<void> {
    const contract = await this.getContract(contractAddress, abi);
    contract.events[eventName]()
      .on('data', (event: any) => {
        callback({
          event: event.event,
          args: event.returnValues,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
        });
      })
      .on('error', (error: Error) => {
        console.error('Event subscription error:', error);
      });
  }

  async encodeABI(
    abi: any[],
    method: string,
    params: any[]
  ): Promise<string> {
    const web3 = this.web3Service.getWeb3();
    const contract = new web3.eth.Contract(abi);
    return contract.methods[method](...params).encodeABI();
  }

  async decodeABI(
    abi: any[],
    method: string,
    data: string
  ): Promise<any> {
    const web3 = this.web3Service.getWeb3();
    const contract = new web3.eth.Contract(abi);
    const result = contract.methods[method]().decodeParameters(
      abi.find((item: any) => item.name === method)?.inputs || [],
      data
    );
    return result;
  }

  async getContractCode(address: string): Promise<string> {
    const web3 = this.web3Service.getWeb3();
    return web3.eth.getCode(address);
  }

  async verifyContract(
    address: string,
    sourceCode: string,
    compilerVersion: string
  ): Promise<boolean> {
    // Implementation for contract verification
    // This would integrate with Etherscan or similar services
    return true;
  }
}