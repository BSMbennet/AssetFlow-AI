import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockchainService } from './blockchain.service';

class MintDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  recipient!: string;

  @IsString()
  @Matches(/^[1-9]\d*$/)
  amount!: string;
}

@Controller('v1/blockchain')
export class BlockchainController {
  constructor(private readonly blockchain: BlockchainService) {}

  @Get('status')
  status() { return this.blockchain.status(); }

  @UseGuards(JwtAuthGuard)
  @Post('issuance/:requestId/prepare')
  prepare(@Req() req: any, @Param('requestId') requestId: string, @Body() body: MintDto) {
    this.assertIssuer(req.user);
    this.assertRequestId(requestId);
    return this.blockchain.prepareMint({ requestId, recipient: body.recipient, amount: body.amount });
  }

  @UseGuards(JwtAuthGuard)
  @Post('issuance/:requestId/execute')
  execute(@Req() req: any, @Param('requestId') requestId: string, @Body() body: MintDto) {
    this.assertIssuer(req.user);
    this.assertRequestId(requestId);
    return this.blockchain.executeMint({ requestId, recipient: body.recipient, amount: body.amount });
  }

  private assertIssuer(user: any) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) throw new ForbiddenException('Blockchain issuance requires administrator privileges');
  }

  private assertRequestId(requestId: string) {
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(requestId)) {
      throw new BadRequestException('Invalid issuance request id');
    }
  }
}
