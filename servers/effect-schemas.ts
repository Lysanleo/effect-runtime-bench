import { Schema } from "effect";

export const SubmitBody = Schema.Struct({
	data: Schema.String,
});

export const CreateUserBody = Schema.Struct({
	name: Schema.String,
	email: Schema.String,
	password: Schema.String,
	profile: Schema.optional(
		Schema.Struct({
			bio: Schema.optional(Schema.String),
			avatar: Schema.optional(Schema.String),
		}),
	),
	preferences: Schema.optional(
		Schema.Struct({
			theme: Schema.optional(Schema.String),
			language: Schema.optional(Schema.String),
		}),
	),
	address: Schema.optional(
		Schema.Struct({
			street: Schema.optional(Schema.String),
			city: Schema.optional(Schema.String),
			country: Schema.optional(Schema.String),
		}),
	),
});

export const CreateOrderBody = Schema.Struct({
	items: Schema.Array(
		Schema.Struct({
			productId: Schema.Number,
			quantity: Schema.Number,
			options: Schema.optional(
				Schema.Struct({
					color: Schema.optional(Schema.String),
					size: Schema.optional(Schema.String),
				}),
			),
		}),
	),
	shippingAddress: Schema.Struct({
		street: Schema.String,
		city: Schema.String,
		country: Schema.String,
		postalCode: Schema.String,
	}),
	paymentMethod: Schema.Struct({
		type: Schema.String,
		cardLast4: Schema.optional(Schema.String),
	}),
	couponCode: Schema.optional(Schema.String),
});

export const ProcessBody = Schema.Struct({
	items: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			type: Schema.String,
			data: Schema.Unknown,
		}),
	),
	options: Schema.optional(
		Schema.Struct({
			parallel: Schema.optional(Schema.Boolean),
			validate: Schema.optional(Schema.Boolean),
			transform: Schema.optional(Schema.Boolean),
		}),
	),
});

export const SearchBody = Schema.Struct({
	query: Schema.String,
	filters: Schema.optional(
		Schema.Struct({
			category: Schema.optional(Schema.String),
			minPrice: Schema.optional(Schema.Number),
			maxPrice: Schema.optional(Schema.Number),
			tags: Schema.optional(Schema.Array(Schema.String)),
		}),
	),
	pagination: Schema.optional(
		Schema.Struct({
			page: Schema.optional(Schema.Number),
			perPage: Schema.optional(Schema.Number),
		}),
	),
	sort: Schema.optional(
		Schema.Struct({
			field: Schema.optional(Schema.String),
			order: Schema.optional(Schema.String),
		}),
	),
});

export const BulkCreateBody = Schema.Struct({
	items: Schema.Array(
		Schema.Struct({
			type: Schema.String,
			data: Schema.Unknown,
		}),
	),
	options: Schema.optional(
		Schema.Struct({
			stopOnError: Schema.optional(Schema.Boolean),
			validate: Schema.optional(Schema.Boolean),
			dryRun: Schema.optional(Schema.Boolean),
		}),
	),
});

export const AnalyticsBody = Schema.Struct({
	startDate: Schema.String,
	endDate: Schema.String,
	metrics: Schema.Array(Schema.String),
	groupBy: Schema.optional(Schema.String),
	filters: Schema.optional(
		Schema.Struct({
			region: Schema.optional(Schema.String),
			platform: Schema.optional(Schema.String),
			userSegment: Schema.optional(Schema.String),
		}),
	),
});

export const UpdateCartBody = Schema.Struct({
	action: Schema.String,
	items: Schema.optional(
		Schema.Array(
			Schema.Struct({
				productId: Schema.Number,
				quantity: Schema.Number,
				options: Schema.optional(
					Schema.Struct({
						color: Schema.optional(Schema.String),
						size: Schema.optional(Schema.String),
					}),
				),
			}),
		),
	),
});
