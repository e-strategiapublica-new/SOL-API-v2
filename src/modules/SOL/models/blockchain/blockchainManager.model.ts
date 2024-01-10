import { Injectable, HttpStatus } from "@nestjs/common";
import { MongoClient, ObjectId } from 'mongodb';
import { ErrorManager } from "../../../../shared/utils/error.manager";
import { LacchainModel } from "./lacchain.model";

@Injectable()
export class BlockchainManager {
    
    constructor(
        private lacchainModel: LacchainModel
    ){}

    async getData() {       

        try {
           
            

        } catch (e) {
            throw ErrorManager.createError(e)
        }
            
    }
   
    async setData() {       

        try {
           
                                   

        } catch (e) {
            throw ErrorManager.createError(e)
        }
            
    }

}