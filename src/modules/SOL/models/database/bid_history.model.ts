import { Injectable, HttpStatus } from "@nestjs/common";
import { MongoClient, ObjectId } from 'mongodb';
import { ErrorManager } from "../../../../shared/utils/error.manager";

@Injectable()
export class BidHistoryModel {

    private url: string = process.env.NOSQL_CONNECTION_STRING;
    private dbName: string = process.env.DATABASE;
    private collection: string = "bids_history";    

    async insert(bidHistoryId, data, txHash) {
            
        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);                                                            

            const res = await collection.insertOne({
                _id: new ObjectId(bidHistoryId),
                createdAt: new Date(),
                data:{
                    bidId: data.bidId,                    
                    description: data.description,
                    agreement: data.agreement,
                    classification: data.classification,
                    bid_type: data.bid_type,
                    state: data.state,
                    city: data.city,
                    association: data.association,
                    status: data.status
                },     
                hash: "",           
                txHash: txHash
            });                    
            
        } catch (error) {
            throw ErrorManager.createError(error)       
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

    async listByBidId(bidId){

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
           
            return await collection.find({"data.bidId":bidId}).toArray();

        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }                

    }

}