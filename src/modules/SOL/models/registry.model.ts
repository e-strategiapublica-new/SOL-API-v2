import { Document } from "mongoose";

export interface RegistryModel extends Document {
    readonly payload: string;
    readonly wallet: string;
    readonly transactionHash: string;
}