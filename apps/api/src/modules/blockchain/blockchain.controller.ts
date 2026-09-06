import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsEthereumAddress, IsNotEmpty, IsString, Matches } from 'class-validator';
import { BlockchainService } from './blockchain.service';

class MintDto {
  @IsString()
  @IsNotEmpty()
  recipient!: string;

  @IsString()
  @Matches(/^\d+$/)
  amount!: string;
}

@Controller('v1/blockchain')
export class BlockchainController {
  constructor(private readonly blockchain: BlockchainService) {}

  @Get('status')
  status() {
    return this.blockchain.status();
  }

  @Post('issuance/:requestId/prepare')
  prepare(@Param('requestId') requestId: string, @Body() body: MintDto) {
    return this.blockchain.prepareMint({ requestId, recipient: body.recipient, amount: body.amount });
  }

  @Post('issuance/:requestId/execute')
  execute(@Param('requestId') requestId: string, @Body() body: MintDto) {
    return this.blockchain.executeMint({ requestId, recipient: body.recipient, amount: body.amount });
  }
}
