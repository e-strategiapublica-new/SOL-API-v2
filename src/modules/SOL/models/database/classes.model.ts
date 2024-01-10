import { Injectable, HttpStatus } from "@nestjs/common";
import { MongoClient, ObjectId } from 'mongodb';
import { ErrorManager } from "../../../../shared/utils/error.manager";

@Injectable()
export class ClassesModel {

    private url: string = process.env.NOSQL_CONNECTION_STRING;
    private dbName: string = process.env.DATABASE;
    private collection: string = "classes";

    async list() {

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
           
            const res = await collection.find({}).project({_id:1, code:1, description:1, 'group._id':1, 'group.code':1, 'group.segment':1}).toArray();

            if(!res.length){
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'There is no classes', 1);
            }

            return res;

        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }
   
    async saveClass(dto) {
            
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
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

    async updateClass(id, dto) {
            
        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
                                
            dto.updatedAt = new Date();            

            const res = await collection.updateOne({_id: new ObjectId(id)},{$set:dto});

            if( res.acknowledged == true && !res.modifiedCount ){
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'The class does not exist', 1);
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
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'The class does not exist', 1);
            }
            
        } catch (error) {
            throw ErrorManager.createError(error)       
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
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

}