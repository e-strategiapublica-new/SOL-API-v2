import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Logger, Param, Post, Put, Req, UseGuards, NotFoundException  } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { ItemsService } from "../services/items.service";
import { ItemsModel } from "../models/database/items.model";
import { ErrorManager } from "../../../shared/utils/error.manager";

@ApiTags('items')
@Controller('items')
export class ItemsController {
      
    constructor(
        private readonly itemsService: ItemsService,
        private readonly itemsModel: ItemsModel
    ) { }
    

    @Get('list')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async list() {

        try {    
                        
            const res = await this.itemsModel.list();

            return res;            

        } catch (error) {            
            throw ErrorManager.createError(error)   
        }
    }

    

    @Post("register")
    @HttpCode(201)
    @UseGuards(JwtAuthGuard)    
    @ApiBearerAuth()
    async register(@Body() dto) {
        try {
            
            await this.itemsModel.verifyCodeExists(dto.code);                                                           
            await this.itemsModel.saveItem(dto);            
            
            return {type: "success"}

        } catch (error) {
            throw ErrorManager.createError(error)
        }
    }  

    @Delete('delete-by-id/:_id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async deleteById(
        @Param('_id') _id: string,
    ) {

        try {                        

            await this.itemsModel.deleteById(_id);                                        
           
            return { type: "success" }           

        } catch (error) {
            throw ErrorManager.createError(error)
        }
    } 

    @Put("update/:id")
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)    
    @ApiBearerAuth()
    async update(@Param("id") id: string, @Body() dto: any) {
        try {            

            await this.itemsModel.updateItem(id, dto);

            return { type: "success" }

        } catch (error) {
            throw ErrorManager.createError(error)
        }
    }

    @Get("get-by-id/:_id")
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async getById(@Param("_id") _id: string) {        
        try {
            return await this.itemsModel.getById(_id);
        } catch (error) {
            throw ErrorManager.createError(error)   
        }
    }

}
