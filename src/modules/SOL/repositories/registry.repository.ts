import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { RegistryRegisterRequestDto } from "../dtos/registry-register-request.dto";
import { Registry } from "../schemas/registry.schema";
import { RegistryModel } from "../models/registry.model";
import { Contract, Wallet, ethers } from "ethers";
import * as RegistryContractJson from 'src/assets/Registry.json';
import { ConfigService } from "@nestjs/config";
import { EnviromentVariablesEnum } from "../../../shared/enums/enviroment.variables.enum";
import { RegistrySendRequestDto } from "../dtos/registry-send-request.dto";
import { SecurityService } from "../../../shared/services/security.service";

@Injectable()
export class RegistryRepository {

    constructor(
        @InjectModel(Registry.name) private readonly _model: Model<RegistryModel>,
        private readonly _configService: ConfigService,
        private readonly _securityService: SecurityService,
    ) { }

    async getById(_id: string): Promise<RegistryModel | null> {
        return await this._model
            .findOne({ _id });
    }

    async listByWallet(wallet: string): Promise<RegistryModel[] | null> {
        return await this._model
            .find({
                wallet,
            });
    }

    async getByTransactionHash(transactionHash: string): Promise<RegistryModel | null> {
        return await this._model
            .findOne({ transactionHash });
    }

    async register(dto: RegistryRegisterRequestDto): Promise<RegistryModel> {
        const data = await new this._model(dto);
        return data.save();
    }

    async send(dto: RegistrySendRequestDto) {

        const provider = new ethers.providers.JsonRpcProvider(
            this._configService.get<string>(EnviromentVariablesEnum.PROVIDER)
        );

        const ownerAddress = this._configService.get<string>(EnviromentVariablesEnum.OWNER_ADDRESS);
        const pkey = this._configService.get<string>(EnviromentVariablesEnum.ADMIN_PRIVATE_KEY) ?? '';
        if (pkey.length != 64)
            throw new HttpException(
                'Internal Server Error: Account connection not set up',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        const address = this._configService.get<string>(EnviromentVariablesEnum.REGISTRY_CONTRACT_ADDRESS) ?? '';
        if (address.length != 42)
            throw new HttpException(
                'Internal Server Error: Contract connection not set up',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

        const signer = new Wallet(pkey, provider);

        const contract = new Contract(
            address,
            RegistryContractJson.abi,
            signer,
        );

        const payload = JSON.stringify(dto);
        const payloadId = ethers.utils.id(payload);

        const tx = await contract.register(ownerAddress, dto.id, payloadId);
        await tx.wait();

        return {
            ownerAddress,
            txHash: tx.hash,
            payload,
        }
    }
}
