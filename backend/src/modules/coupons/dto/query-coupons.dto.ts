import { IsOptional, IsString, IsIn } from 'class-validator';

export class QueryCouponsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', ''])
  status?: 'ACTIVE' | 'INACTIVE' | '';
}
