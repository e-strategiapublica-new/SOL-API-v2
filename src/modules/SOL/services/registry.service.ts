import { Injectable, Logger } from "@nestjs/common";
import { RegistryRepository } from "../repositories/registry.repository";
import { RegistrySendRequestDto } from "../dtos/registry-send-request.dto";

@Injectable()
export class RegistryService {

    private readonly _logger = new Logger(RegistryService.name);

    constructor(
        private readonly _registryRepository: RegistryRepository,
    ) { }

    async send(dto: RegistrySendRequestDto):Promise<string> {
        const result = await this._registryRepository.send(dto);

        await this._registryRepository.register({
            payload: result.payload,
            transactionHash: result.txHash,
            wallet: result.ownerAddress,
        });

        return result.txHash;
    }
}