
export class RegistryRegisterRequestDto {

    constructor(
        public payload: string,
        public wallet: string,
        public transactionHash: string,
    ) { }
}