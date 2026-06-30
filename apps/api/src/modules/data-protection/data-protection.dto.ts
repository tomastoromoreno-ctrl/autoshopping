import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class CreateProcessingActivityDto {
  @IsString()
  purpose: string;

  @IsString()
  legal_basis: string;

  @IsArray()
  @IsOptional()
  data_categories?: string[];

  @IsString()
  @IsOptional()
  retention_period?: string;

  @IsString()
  @IsOptional()
  security_measures?: string;
}

export class UpdateProcessingActivityDto {
  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
  legal_basis?: string;

  @IsArray()
  @IsOptional()
  data_categories?: string[];

  @IsString()
  @IsOptional()
  retention_period?: string;

  @IsString()
  @IsOptional()
  security_measures?: string;
}

export class CreateDataBreachDto {
  @IsString()
  description: string;

  @IsOptional()
  detected_at?: string;

  @IsArray()
  @IsOptional()
  affected_data_categories?: string[];

  @IsNumber()
  @IsOptional()
  affected_count?: number;

  @IsString()
  @IsOptional()
  risk_assessment?: string;
}

export class UpdateDataBreachDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  affected_data_categories?: string[];

  @IsNumber()
  @IsOptional()
  affected_count?: number;

  @IsString()
  @IsOptional()
  risk_assessment?: string;

  @IsBoolean()
  @IsOptional()
  notified_apdp?: boolean;

  @IsString()
  @IsOptional()
  notified_apdp_at?: string;

  @IsBoolean()
  @IsOptional()
  notified_affected?: boolean;

  @IsString()
  @IsOptional()
  notified_affected_at?: string;

  @IsString()
  @IsOptional()
  remediation?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateDpoDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  is_external?: boolean;

  @IsString()
  @IsOptional()
  company_name?: string;
}

export class UpdateDpoDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  is_external?: boolean;

  @IsString()
  @IsOptional()
  company_name?: string;
}

export class CreateProcessorContractDto {
  @IsString()
  processor_name: string;

  @IsString()
  @IsOptional()
  processor_contact?: string;

  @IsString()
  @IsOptional()
  processor_email?: string;

  @IsString()
  processing_description: string;

  @IsArray()
  @IsOptional()
  data_categories?: string[];

  @IsString()
  @IsOptional()
  security_measures?: string;

  @IsString()
  @IsOptional()
  contract_date?: string;

  @IsString()
  @IsOptional()
  expires_at?: string;
}

export class UpdateProcessorContractDto {
  @IsString()
  @IsOptional()
  processor_name?: string;

  @IsString()
  @IsOptional()
  processor_contact?: string;

  @IsString()
  @IsOptional()
  processor_email?: string;

  @IsString()
  @IsOptional()
  processing_description?: string;

  @IsArray()
  @IsOptional()
  data_categories?: string[];

  @IsString()
  @IsOptional()
  security_measures?: string;

  @IsString()
  @IsOptional()
  contract_date?: string;

  @IsString()
  @IsOptional()
  expires_at?: string;
}
