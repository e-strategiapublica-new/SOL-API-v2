import { BidModalityEnum } from "../enums/bid-modality.enum";
import { BidStatusEnum } from "../enums/bid-status.enum";
import { BidTypeEnum } from "../enums/bid-type.enum";
import { AgreementInterface } from "../interfaces/agreement.interface";
import { AllotmentModel } from "../models/allotment.model";
import { SupplierModel } from "../models/supplier.model";
import { UserModel } from "../models/user.model";

export class RegistrySendRequestDto {

    constructor(
        public id: number,
        public description: string,
        public agreement: AgreementInterface,
        public classification: string,
        public start_at: string,
        public end_at: string,
        public days_to_tiebreaker: string,
        public days_to_delivery: string,
        public local_to_delivery: string,
        public bid_type: BidTypeEnum,
        public modality: BidModalityEnum,
        public aditional_site: string,
        public add_allotment: AllotmentModel[],
        public invited_suppliers: SupplierModel[],
        public bid_count: string,
        public state: string,
        public city: string,
        public status: BidStatusEnum, //enviar quando released
        public association: UserModel,
        public createdAt: Date,
    ) { }
}
