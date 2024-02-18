import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Address, AddressSchema } from './address.schema';
import { MaritalStatusEnum } from 'src/modules/SOL/enums/marital-status.enum';

@Schema({ _id: false })
export class LegalRepresentative {

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    nationality: string;

    @Prop({ required: true, enum: Object.keys(MaritalStatusEnum) })
    maritalStatus: MaritalStatusEnum;

    @Prop({ type: String, required: false })
    cpf: string;

    @Prop({ type: String, required: false })
    rg: string;
    
    @Prop({ type: String, required: false })
    email: string;
    
    @Prop({ type: String, required: false })
    phone: string;
    
    @Prop({ type: String, required: false })
    document_origin: string;

    @Prop({ type: Date, required: false })
    validityData: Date;

    @Prop({ type: AddressSchema, required: true })
    address: Address;

}
export const LegalRepresentativeSchema = SchemaFactory.createForClass(LegalRepresentative);