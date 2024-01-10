import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true, collection: Registry.name.toLowerCase() })
export class Registry {

    @Prop({ required: true, type: String })
    payload: string | undefined;

    @Prop({ required: true, type: String })
    wallet: string | undefined;

    @Prop({ required: true, type: String, unique: true })
    transactionHash: string | undefined;
}
export const RegistrySchema = SchemaFactory.createForClass(Registry);