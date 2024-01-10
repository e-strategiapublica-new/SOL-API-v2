import { Injectable, HttpStatus } from "@nestjs/common";
import { MongoClient, ObjectId } from 'mongodb';
import { ErrorManager } from "../../../../shared/utils/error.manager";

@Injectable()
export class MyBidModel {

    private url: string = process.env.NOSQL_CONNECTION_STRING;
    private dbName: string = process.env.DATABASE;
    private collection: string = "bids";    

    async updateTxHash(id, txHash) {
            
        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);                                                

            const res = await collection.updateOne({_id: new ObjectId(id)},{$set:{"txHash": txHash}});                    
            
        } catch (error) {
            throw ErrorManager.createError(error)       
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

}