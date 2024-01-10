import { Injectable, HttpStatus } from "@nestjs/common";
import { MongoClient, ObjectId } from 'mongodb';
import { ErrorManager } from "../../../../shared/utils/error.manager";
import * as moment from 'moment';

@Injectable()
export class ItemsModel {

    private url: string = process.env.NOSQL_CONNECTION_STRING;
    private dbName: string = process.env.DATABASE;
    private collection: string = "items";

    async list() {

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
           
            const res = await collection.find({}).toArray();

            if(!res.length){
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'There is no items', 1);
            }

            return res;

        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

    async saveItem(dto) {
            
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
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'The item does not exist', 1);
            }
            
        } catch (error) {
            throw ErrorManager.createError(error)       
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }

    }

    async updateItem(_id, dto) {
            
        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
                                
            dto.updatedAt = new Date();            

            const res = await collection.updateOne(
                {_id: new ObjectId(_id)},
                {
                    $set:{
                        "name": dto.name,
                        "propertyListValue": dto.propertyListValue
                    }
                }
            );                    
            
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
                throw new ErrorManager(HttpStatus.BAD_REQUEST, 'The item does not exist', 1);
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

    async updateItemByUpdatedPdm(_id, name, propertyList){

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);
                                
            let res;

            const date = new Date();                        

            res = await collection.findOne({"pdm._id": _id }); 
            
            let _propertyListValue = [];

            if(res){
                
                let found;
                for(let i=0;i<propertyList.length;i++){
                    
                    found = 0;
                    for(let j=0;j<res.propertyListValue.length;j++){
                        if(res.propertyListValue[j].property == propertyList[i].property){
                            found = 1;
                            _propertyListValue.push(res.propertyListValue[j])
                        }
                    }

                    if(!found){                        
                        _propertyListValue.push({ "property": propertyList[i].property, "value": "" });
                    }
                    
                }
                    

                await collection.updateMany(
                    {"pdm._id": _id},
                    {
                        $set:{
                            "pdm.name": name,
                            "updatedAt": date,
                            "propertyListValue": _propertyListValue
                        }
                    }
                );

            }    

        } catch (error) {
            throw ErrorManager.createError(error)       
        } finally {
            await client.close();
        }

    }

    
    async listByIds(_ids: any) {

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);            

            return await collection.find({ 
                $or: _ids
            }).toArray()
                                      
        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

    async getByName(name: string) {

        const client = new MongoClient(this.url);

        try {
            await client.connect();

            const db = client.db(this.dbName);
            const collection = db.collection(this.collection);            

            return await collection.findOne({name: name});                
                                      
        } catch (error) {
            throw ErrorManager.createError(error)
        } finally {
            await client.close(); // Cierra la conexión cuando hayas terminado
        }
            
    }

}