import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

  @UseGuards(JwtAuthGuard)
  @Post('issuance/:requestId/prepare')
  prepare(@Req() req: any, @Param('requestId') requestId: string, @Body() body: MintDto) {
    this.assertIssuer(req.user);
    return this.blockchain.prepareMint({ requestId, recipient: body.recipient, amount: body.amount });
  }

  @UseGuards(JwtAuthGuard)
  @Post('issuance/:requestId/execute')
  execute(@Req() req: any, @Param('requestId') requestId: string, @Body() body: MintDto) {
    this.assertIssuer(req.user);
    return this.blockchain.executeMint({ requestId, recipient: body.recipient, amount: body.amount });
  }

  private assertIssuer(user: any) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
      throw new ForbiddenException('Blockchain issuance requires administrator privileges');
    }
  }
}
