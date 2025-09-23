import { applyDecorators } from '@nestjs/common';
import { ApiConflictResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ConflictEntityCreationData } from '../http-exceptions/vo/conflict-entity-creation.dto.js';
import { ErrorResponse } from '../vo/error-response.dto.js';
import { errorCodeSwaggerProperty } from './properties/error-code-swagger.property.js';

export const ApiConflictEntityCreation = (...errorCodes: string[]) =>
	applyDecorators(
		ApiExtraModels(ConflictEntityCreationData, ErrorResponse),
		ApiConflictResponse({
			description: `Can not create entity because of conflict`,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ErrorResponse) },
					{
						properties: {
							data: {
								$ref: getSchemaPath(ConflictEntityCreationData)
							},
							...errorCodeSwaggerProperty(...errorCodes)
						}
					}
				]
			}
		})
	);
