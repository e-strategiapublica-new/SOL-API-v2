import { Injectable, HttpStatus } from "@nestjs/common";
import { MongoClient, ObjectId } from 'mongodb';
import { ErrorManager } from "../../../../shared/utils/error.manager";

@Injectable()
export class MyAssociationModel {

    private url: string = process.env.NOSQL_CONNECTION_STRING;
    private dbName: string = process.env.DATABASE;
    private collection: string = "association";    

    async getAssociation(name: string, cnpj: string) {

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
           
            return await collection.findOne({ $or:[{'name': name}, {cnpj: cnpj}] });

        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close();
        }
            
    }

}