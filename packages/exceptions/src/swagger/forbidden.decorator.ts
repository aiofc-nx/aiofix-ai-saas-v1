import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiForbiddenResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponse } from '../vo/error-response.dto.js';
import { errorCodeSwaggerProperty } from './properties/error-code-swagger.property.js';

export const ApiForbidden = (...errorCodes: string[]) =>
	applyDecorators(
		ApiExtraModels(ErrorResponse),
		ApiForbiddenResponse({
			description: `Access is forbidden`,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ErrorResponse) },
					{
						properties: {
							...errorCodeSwaggerProperty(...errorCodes)
						}
					}
				]
			}
		})
	);
