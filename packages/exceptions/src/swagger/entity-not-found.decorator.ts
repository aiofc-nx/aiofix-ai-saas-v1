import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiNotFoundResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponse } from '../vo/error-response.dto.js';
import { ObjectNotFoundData } from '../http-exceptions/vo/object-not-found.dto.js';
import { errorCodeSwaggerProperty } from './properties/error-code-swagger.property.js';

export const ApiEntityNotFound = (...errorCodes: string[]) =>
	applyDecorators(
		ApiExtraModels(ObjectNotFoundData, ErrorResponse),
		ApiNotFoundResponse({
			description: `Entity not found or user doesn't have access to it`,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ErrorResponse) },
					{
						properties: {
							data: {
								type: 'object',
								$ref: getSchemaPath(ObjectNotFoundData)
							},
							...errorCodeSwaggerProperty(...errorCodes)
						}
					}
				]
			}
		})
	);
