import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType } from '@assetflow/shared-types';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;
  @ApiProperty({ example: 'John' }) @IsString() @MinLength(2) @MaxLength(50) firstName!: string;
  @ApiProperty({ example: 'Doe' }) @IsString() @MinLength(2) @MaxLength(50) lastName!: string;
  @ApiProperty({ example: 'SecurePass123!' }) @IsString() @MinLength(12) @MaxLength(128) password!: string;
  @ApiProperty({ example: '+1234567890', required: false }) @IsOptional() @IsString() @MaxLength(32) phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) companyName?: string;
  @ApiProperty({ enum: OrganizationType, required: false }) @IsOptional() @IsEnum(OrganizationType) organizationType?: OrganizationType;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(64) country?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(255) address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(32) postalCode?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' }) @IsEmail() email!: string;
  @ApiProperty({ example: 'SecurePass123!' }) @IsString() @MaxLength(128) password!: string;
}

export class RefreshTokenDto {
  @ApiProperty() @IsString() @MinLength(20) @MaxLength(4096) refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' }) @IsEmail() email!: string;
}

export class ResetPasswordDto {
  @ApiProperty() @IsString() @Matches(/^[a-fA-F0-9]{64}$/) token!: string;
  @ApiProperty({ example: 'NewSecurePass123!' }) @IsString() @MinLength(12) @MaxLength(128) newPassword!: string;
}
