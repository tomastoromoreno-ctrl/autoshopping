declare module 'class-validator' {
  export const IsString: (property?: any) => any;
  export const IsOptional: (property?: any) => any;
  export const IsBoolean: (property?: any) => any;
  export const IsNumber: (property?: any) => any;
  export const IsInt: (property?: any) => any;
  export const IsUUID: (property?: any) => any;
  export const IsArray: (property?: any) => any;
  export const IsObject: (property?: any) => any;
  export const IsEmail: (property?: any) => any;
  export const IsIn: (values: any[], property?: any) => any;
  export const IsDate: (property?: any) => any;
  export const Min: (min: number, property?: any) => any;
  export const Max: (max: number, property?: any) => any;
  export const MinLength: (min: number, property?: any) => any;
  export const MaxLength: (max: number, property?: any) => any;
  export const validate: any;
  export const IsNotEmpty: (property?: any) => any;
  export class ValidationError {}
}

declare module 'class-transformer' {
  export const Expose: () => any;
  export const Exclude: () => any;
  export const Transform: (fn: any) => any;
  export const Type: (fn: any) => any;
  export function plainToInstance(cls: any, plain: any, options?: any): any;
  export function instanceToPlain(obj: any, options?: any): any;
}

declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
}

declare module 'mercadopago' {
  export class MercadoPagoConfig {
    constructor(options: { accessToken: string });
  }
  export class Preference {
    constructor(client: MercadoPagoConfig);
    create(options: { body: any }): Promise<any>;
  }
  export class Payment {
    constructor(client: MercadoPagoConfig);
    get(options: { id: string }): Promise<any>;
  }
}

declare module 'transbank-sdk' {
  export namespace WebpayPlus {
    export function configureForIntegration(commerceCode: string, apiKey: string): void;
    export namespace Transaction {
      export function create(buyOrder: string, sessionId: string, amount: number, returnUrl: string): Promise<any>;
      export function commit(token: string): Promise<any>;
    }
  }
}
