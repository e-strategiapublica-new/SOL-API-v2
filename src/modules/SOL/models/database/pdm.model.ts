import { Injectable, HttpStatus } from "@nestjs/common";
import { MongoClient, ObjectId } from 'mongodb';
import { ErrorManager } from "../../../../shared/utils/error.manager";
import * as moment from 'moment';

@Injectable()
export class PdmModel {

    private url: string = process.env.NOSQL_CONNECTION_STRING;
    private dbName: string = process.env.DATABASE;
    private collection: string = "pdm";

    async list() {

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
           
            const res = await collection.find({}).toArray();

            if(!res.length){
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'There is no pdm', 1);
            }

            return res;

        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

    async savePdm(dto) {
            
        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
            
            const date = new Date()
            dto.createdAt = date;
            dto.updatedAt = date;

            const res = await collection.insertOne(dto);   

            if(res.acknowledged == false){
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'Error inserting class', 2);
            }
            
        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close();
        }
            
    }

    async verifyCodeExists(code: number) {

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
           
            const res = await collection.findOne({'code': code});

            if(res){
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'The code exists', 1);
            }            

        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

    async deleteById(_id: string) {

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);                                            

            const res = await collection.findOneAndDelete({_id: new ObjectId(_id)});            

            if(!res){
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'The pdm does not exist', 1);
            }
            
        } catch (error) {
            throw ErrorManager.createError(error)       
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }

    }

    async updatePdm(id, dto) {
            
        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
                                
            dto.updatedAt = new Date();            

            const res = await collection.updateOne({_id: new ObjectId(id)},{$set:dto});

            if( res.acknowledged == true && !res.modifiedCount ){
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'The pdm does not exist', 1);
            }            
            
        } catch (error) {
            throw ErrorManager.createError(error)       
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

    async getById(_id: string) {

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);

            let res;
           
            res = await collection.findOne({_id: new ObjectId(_id)});

            if(!res){
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'The PDM does not exist', 1);
            }

            res = await collection.findOne({_id: new ObjectId(_id)});

            res.createdAt = moment(res.createdAt).format('YYYY-MM-DD HH:mm:ss');

            return res;

        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

}