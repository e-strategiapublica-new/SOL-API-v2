import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from 'mongoose';
import { User } from "./user.schema";
import { AgreementActiveStatusEnum } from "../enums/agreement-active-status";
import { Agreement } from "./agreement.schema";
import { LegalRepresentative, LegalRepresentativeSchema } from "src/shared/schemas/legal-representative.schema";

@Schema({ timestamps: true, collection: Project.name.toLowerCase() })
export class Project {

    @Prop({ required: true, type: String })
    name: string;

    @Prop({ required: true, enum: Object.keys(AgreementActiveStatusEnum), default: AgreementActiveStatusEnum.active })
    activeStatus: AgreementActiveStatusEnum

    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: User.name })
    project_manager: User;

    // @Prop({ required: false, type: [{ type: mongoose.Types.ObjectId, ref: Agreement.name }] })
    // agreement_list: Agreement;

    @Prop({ type: LegalRepresentativeSchema, required: true })
    legalRepresentative: LegalRepresentative;

    @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }] })
    viewer_list: User;

    @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }] })
    reviewer_list: User;

}

export const ProjectSchema = SchemaFactory.createForClass(Project);