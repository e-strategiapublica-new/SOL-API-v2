import { Injectable, HttpStatus } from "@nestjs/common";
import { MongoClient, ObjectId } from 'mongodb';
import { ErrorManager } from "../../../../shared/utils/error.manager";
import { ConfigService } from '@nestjs/config';
import { HttpService } from "@nestjs/axios";


@Injectable()
export class LacchainModel {
   
    constructor(
        readonly configService: ConfigService, 
        private httpService: HttpService       
    ) {}  
    
    async getBidData(_bidHistoryId: string) {
                
        try {
            
            const res = await this.httpService.get(`http://216.238.103.122:3002/api/lacchain/bid/getData/${_bidHistoryId}`).toPromise();            
            return res.data;

        } catch (e) {            
            throw ErrorManager.createError(e)
        }
            
    }
   
    async setBidData(token, bidHistoryId, hash) {       

        try {
        
            const headers = {
                Authorization: token
            };

            const data ={
                bidHistoryId: bidHistoryId,
                hash: hash
            }            

            const res = await this.httpService.post("http://216.238.103.122:3002/api/lacchain/bid/setData", data, { headers }).toPromise();
            
            if(res.data['type'] == "error"){
                return '0x0000000000000000000000000000000000000000000000000000000000000000';
            }
                        
            return res.data;          
            
        } catch (e) {            
            throw ErrorManager.createError(e)
        }
            
    }

}