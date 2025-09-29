import { logger as honoLogger } from "hono/logger";

import { logger } from "@llmgateway/logger";

export interface HonoRequestLoggerOptions {
	service: string;
}

export function createHonoRequestLogger(options: HonoRequestLoggerOptions) {
	return honoLogger((message: string, ...args: any) => {
		logger.info(
			message,
			process.env.NODE_ENV === "production"
				? {
						kind: "request",
						service: options.service,
						source: "hono-logger",
						args,
					}
				: undefined,
		);
	});
}
