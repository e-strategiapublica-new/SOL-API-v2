import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Address, AddressSchema } from "src/shared/schemas/address.schema";
import { LegalRepresentative, LegalRepresentativeSchema } from "src/shared/schemas/legal-representative.schema";
import { AssociationStatusEnum } from "../enums/association-status.enum";

@Schema({ timestamps: true, collection: Association.name.toLowerCase() })
export class Association {

    
    @Prop({ required: false, type: String })
    name: string;

    @Prop({ required: false, type: String })
    cnpj: string;

    @Prop({ type: LegalRepresentativeSchema, required: false })
    legalRepresentative: LegalRepresentative;

    @Prop({ type: AddressSchema, required: false })
    address: Address;

    @Prop({ required: false, enum: Object.keys(AssociationStatusEnum), default: AssociationStatusEnum.active })
    status: AssociationStatusEnum;
    
}

export const AssociationSchema = SchemaFactory.createForClass(Association);