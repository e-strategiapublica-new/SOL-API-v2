import { ApiProperty } from "@nestjs/swagger";
import { AgreementActiveStatusEnum } from "../enums/agreement-active-status";
import { AgreementInterface } from "../interfaces/agreement.interface";
import { AgreementRegisterRequestDto } from "./agreement-register-request.dto";
import { LegalRepresentativeRegisterDto } from "src/shared/dtos/legal-representative-register.dto";
import { LegalRepresentative } from "src/shared/schemas/legal-representative.schema";
import { User } from "../schemas/user.schema";


export abstract class ProjectRegisterRequestDto {
    
    @ApiProperty({ required: true, type: String })
    name: string;

    @ApiProperty({ required: true, type: String })
    project_manager: string;
    
    @ApiProperty({ type: Array })
    agreement: string[];

    @ApiProperty({ required: false, type: Array })
    agreement_list?: string[]

    activeStatus: AgreementActiveStatusEnum.active

    @ApiProperty({ type: LegalRepresentativeRegisterDto })
    legal_representative: LegalRepresentative

    viewer_list: User[]

    reviewer_list: User[]
}
