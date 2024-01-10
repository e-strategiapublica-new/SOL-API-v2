import { HttpException, HttpStatus } from '@nestjs/common';

export class ErrorManager extends HttpException {
      
  constructor(statusCode: HttpStatus, message: string, code: number) {
    super({message, code}, statusCode); // math with HttpException
  }

  public static createError(error){  		
		if(error.response){
			throw new HttpException(error.response, error.status);
		}else{			
			throw new HttpException("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}

