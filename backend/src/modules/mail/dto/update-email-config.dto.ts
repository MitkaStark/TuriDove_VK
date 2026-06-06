import { IsOptional, IsString, IsEmail, IsInt, IsIn } from 'class-validator';

export class UpdateEmailConfigDto {
  @IsOptional()
  @IsIn(['resend', 'smtp'])
  provider?: 'resend' | 'smtp';

  @IsOptional()
  @IsString()
  resendApiKey?: string;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsInt()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsString()
  smtpPass?: string;

  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @IsOptional()
  @IsString()
  fromName?: string;
}
