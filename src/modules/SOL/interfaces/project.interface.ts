import { LegalRepresentative } from "src/shared/schemas/legal-representative.schema";
import { AgreementActiveStatusEnum } from "../enums/agreement-active-status";
import { UserModel } from "../models/user.model";
import { AgreementInterface } from "./agreement.interface";
import { User } from "../schemas/user.schema";
import mongoose from "mongoose";

export interface ProjectInterface {
  name: string;
  activeStatus: AgreementActiveStatusEnum;
  project_manager: UserModel;
  agreement_list: AgreementInterface[];
  legalRepresentative: LegalRepresentative;
  viewer_list: User[]
  reviewer_list: User[]

}

export interface ProjectInterfaceWithId extends AgreementInterface {
  _id: mongoose.Types.ObjectId; // Make sure to import mongoose
}